# Copy Title & URL

ページのタイトルとURLをコピーする Firefox 拡張機能。

- 左クリック: タイトルをリンク付き（リッチテキスト）でコピー。書式なしの貼り付け先には URL が入る
- 右クリック: 「タイトルをコピー」「URLをコピー」

AMO に unlisted（自分で配布）で登録し、GitHub Pages の `docs/updates.json` から自動更新している。

手動で機能を確認: `npx web-ext run`

## 更新手順

1. **バージョンを上げる**
   `manifest.json` の `version` を上げる（例: `1.0.1` → `1.0.2`）。

2. **確認してビルドする**
   ```
   npx web-ext lint --self-hosted
   npx web-ext build --overwrite-dest
   ```
   `web-ext-artifacts/copy_title_url-<バージョン>.zip` ができる。
   Android 版の最小バージョンに関する警告は無視してよい（デスクトップ専用のため）。

3. **AMO で署名する**
   [開発者ハブ](https://addons.mozilla.org/developers/addons) → このアドオン → 「新しいバージョンをアップロード」で ZIP を出す。
   署名が終わったら「ステータスとバージョンの管理」から `.xpi` をダウンロードする。

4. **GitHub Releases に置く**
   タグ `v<バージョン>` でリリースを作り、`.xpi` を **`copy_title_url-<バージョン>.xpi`** という名前で添付する。

5. **`docs/updates.json` を更新する**
   `updates` 配列に新しいバージョンを追記する（古いものは残してよい）。
   ```json
   {
     "version": "1.0.2",
     "update_link": "https://github.com/GodHexagon/copy_tool_firefox/releases/download/v1.0.2/copy_title_url-1.0.2.xpi"
   }
   ```
   コミットして push すると、GitHub Pages に反映される。

6. **確認する**
   Firefox の `about:addons` → 歯車メニュー →「アップデートを確認」で更新されることを確かめる。

## 注意

- 拡張機能 ID（`copy-title-url@godhexagon`）は変更しない。変えると別の拡張扱いになる。
- `update_url` が入っているのは 1.0.1 以降。1.0.0 から 1.0.1 へは手動インストールが必要。
- リリースに添付するファイル名と `update_link` が一致していないと更新できない。
