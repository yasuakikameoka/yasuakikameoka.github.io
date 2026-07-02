# Profile Page

Obsidianで磨いたMarkdownから、公開用の静的HTMLを生成するプロフィールサイトです。データベースやCMSは使いません。

## 設計書

サイトの設計思想、情報構造、各ページの役割、コンテンツと生成処理の境界は [`docs/site-design.md`](docs/site-design.md) に記録します。

サイトに関する作業を行うときは、作業前に設計書を確認し、ページ構成、デザイン原則、原稿形式、生成方法、運用手順などに変更があれば、実装と同じ作業の中で設計書も更新してください。単純な誤字修正などの場合も、設計書と実装に食い違いがないか確認します。

## 更新フロー

1. `docs/site-design.md` を確認する
2. Obsidian Vault内のStyle、Concept、Reflection原稿を編集する
3. 設計に影響する変更を `docs/site-design.md` に反映する
4. `npm run publish` を実行する
5. `npm run serve` で生成された `index.html`、Style・Concept・Aspiration詳細、Reflection詳細を確認する
6. 問題なければ手動で `git add` / `git commit` / `git push` する

`concepts/*.html` と `style/*.html` はビルドのたびに、現在のMarkdownだけから作り直されます。`npm run publish` はビルドと確認手順の表示だけを行い、git操作は行いません。

原稿の正本はObsidian Vaultです。`.env` に次の環境変数を設定すると、ビルドはVaultを直接読みます。値にスペースが含まれていても、Node.jsの `--env-file-if-exists` で読む場合はクォート不要です。

```bash
STYLE_DIR=/absolute/path/to/Obsidian/Vault/1_Style
CONCEPT_DIR=/absolute/path/to/Obsidian/Vault/2_Concept
REFLECTIONS_DIR=/absolute/path/to/Obsidian/Vault/4_Reflection
```

`STYLE_DIR` と `CONCEPT_DIR` の両方が設定されている場合、StyleとConceptを別フォルダから読み込みます。未設定の場合は、後方互換として `CONCEPTS_DIR`、さらに `content/concepts/` にフォールバックします。`content/` は正本ではなく、Vault未設定時のフォールバックとして残しています。

ローカル表示：

```bash
npm run serve
```

`http://127.0.0.1:4173` を開きます。

## Markdown

StyleとConceptはfrontmatterの `section`、`slug`、`sort_order`、`is_published` を読みます。ファイル名の先頭の数字は、`sort_order` がない場合の表示順フォールバックです。本文は現在の `# Concept`、`# Summary`、`# Body` 形式をそのまま利用できます。

本文中で行頭タブから始まる段落は、引用ではない補足ブロックとして `aside.supplement` に変換されます。

本文中のリンクは `[表示文字](URL)` 形式で書きます。クリック可能な `<a>` に変換され、`http(s)://` で始まる外部リンクは自動的に別タブ（`target="_blank" rel="noopener"`）で開きます。URLを生のまま直書きせず、必ずこの形式を用います。画像記法 `![alt](URL)` はリンク化しません。Obsidian内部リンク `[[...]]` はサイトには出力されません（`## Resonances` などVault専用の導線）。

Reflectionはfrontmatterの`styles`、`concepts`、`aspirations`に接続先のslugをカンマ区切りで指定すると、各詳細ページのResonancesに表示されます。従来の`tags`もStyle・Conceptの接続先として利用できます。
