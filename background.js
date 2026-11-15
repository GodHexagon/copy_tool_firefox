"use strict";

const MENU_COPY_TITLE = "copy-title";
const MENU_COPY_URL = "copy-url";

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
  });
});

// 左クリック: タイトルをリンク付き（リッチテキスト）でコピー
// ファビコンが取得できれば PNG 画像も一緒にクリップボードへ入れる
browser.action.onClicked.addListener(async (tab) => {
  const title = tab.title || tab.url;
  const html = `<a href="${escapeHtml(tab.url)}">${escapeHtml(title)}</a>`;
  // 書式なしの貼り付け先には URL が入る
  const data = { "text/html": html, "text/plain": tab.url };

  const png = await faviconToPng(tab.favIconUrl).catch(() => null);
  if (png && (await copyWithImage(data, png))) {
    flashBadge(true);
    return;
  }
  copy(data);
});

// テキストと画像をまとめて書き込む（失敗したら false）
async function copyWithImage(data, png) {
  try {
    const items = { "image/png": png };
    for (const [type, value] of Object.entries(data)) {
      items[type] = new Blob([value], { type });
    }
    await navigator.clipboard.write([new ClipboardItem(items)]);
    return true;
  } catch (e) {
    console.warn("画像付きコピーに失敗したため、テキストのみコピーします", e);
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

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_COPY_TITLE) {
    copy({ "text/plain": tab.title || "" });
  } else if (info.menuItemId === MENU_COPY_URL) {
    copy({ "text/plain": tab.url || "" });
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
