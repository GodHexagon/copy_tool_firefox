"use strict";

const MENU_COPY_TITLE = "copy-title";
const MENU_COPY_URL = "copy-url";
const MENU_COPY_FAVICON = "copy-favicon";

// ツールバーボタンの右クリックメニュー
browser.runtime.onInstalled.addListener(() => {
  browser.menus.removeAll().then(() => {
    browser.menus.create({
      id: MENU_COPY_TITLE,
      title: "タイトルをコピー",
      contexts: ["action"],
    });
    browser.menus.create({
      id: MENU_COPY_URL,
      title: "URLをコピー",
      contexts: ["action"],
    });
    browser.menus.create({
      id: MENU_COPY_FAVICON,
      title: "ファビコンをコピー",
      contexts: ["action"],
    });
  });
});

// 左クリック: タイトルをリンク付き（リッチテキスト）でコピー
browser.action.onClicked.addListener((tab) => {
  const title = tab.title || tab.url;
  const html = `<a href="${escapeHtml(tab.url)}">${escapeHtml(title)}</a>`;
  // 書式なしの貼り付け先には URL が入る
  copy({ "text/html": html, "text/plain": tab.url });
});

// PNG 画像をクリップボードへ書き込む（失敗したら false）
async function copyImage(png) {
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    return true;
  } catch (e) {
    console.warn("画像のコピーに失敗しました", e);
    return false;
  }
}

// ファビコンを取得して PNG の Blob に変換する（ICO・SVG なども canvas 経由で PNG 化）
async function faviconToPng(url) {
  if (!url) return null;
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) return null;
  const blob = await res.blob();

  // blob: URL 経由で読み込むので canvas が汚染されない
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    // サイズ指定のない SVG は naturalWidth が 0 になるため既定値を使う
    const w = img.naturalWidth || 64;
    const h = img.naturalHeight || 64;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === MENU_COPY_TITLE) {
    copy({ "text/plain": tab.title || "" });
  } else if (info.menuItemId === MENU_COPY_URL) {
    copy({ "text/plain": tab.url || "" });
  } else if (info.menuItemId === MENU_COPY_FAVICON) {
    // 画像のみをコピー（取得できなければ失敗バッジ）
    const png = await faviconToPng(tab.favIconUrl).catch(() => null);
    flashBadge(png ? await copyImage(png) : false);
  }
});

// copy イベントで任意の MIME タイプをクリップボードへ書き込む
function copy(data) {
  const onCopy = (e) => {
    for (const [type, value] of Object.entries(data)) {
      e.clipboardData.setData(type, value);
    }
    e.preventDefault();
  };
  document.addEventListener("copy", onCopy, { once: true });
  const ok = document.execCommand("copy");
  document.removeEventListener("copy", onCopy);
  flashBadge(ok);
}

function flashBadge(ok) {
  browser.action.setBadgeBackgroundColor({ color: ok ? "#2e7d32" : "#c62828" });
  browser.action.setBadgeText({ text: ok ? "✓" : "!" });
  setTimeout(() => browser.action.setBadgeText({ text: "" }), 1200);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
