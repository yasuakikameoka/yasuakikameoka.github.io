# Profile Page

Obsidianで磨いたMarkdownから、公開用の静的HTMLを生成するプロフィールサイトです。データベースやCMSは使いません。

## 更新フロー

1. `content/concepts/` のMarkdownをObsidianで編集する
2. `npm run build` を実行する
3. 生成された `index.html` と `concepts/*.html` を確認する

`concepts/*.html` はビルドのたびに、現在のMarkdownだけから作り直されます。

別のObsidian Vault内に原稿を置く場合は、そのフォルダを直接指定できます。

```bash
CONCEPTS_DIR="/absolute/path/to/Obsidian/Vault/concepts" npm run build
```

ローカル表示：

```bash
npm run serve
```

`http://127.0.0.1:4173` を開きます。

## Markdown

ファイル名の先頭の数字が表示順になります。本文は現在の `# Concept`、`# Summary`、`# Body` 形式をそのまま利用できます。新規作成時は `content/concepts/_template.md` を複製します。
