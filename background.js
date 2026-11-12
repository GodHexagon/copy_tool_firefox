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
browser.action.onClicked.addListener((tab) => {
  const title = tab.title || tab.url;
  const html = `<a href="${escapeHtml(tab.url)}">${escapeHtml(title)}</a>`;
  // 書式なしの貼り付け先には URL が入る
  copy({ "text/html": html, "text/plain": tab.url });
});

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
