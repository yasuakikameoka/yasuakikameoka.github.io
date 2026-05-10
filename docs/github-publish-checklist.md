# GitHub Publish Checklist

GitHubにアップロードしたあと、公開URLが確定してから確認・差し替えすること。

## 公開URLまわり

- GitHub Pagesの公開URLを確認する。
- `og:image` と `twitter:image` を絶対URLに差し替える。
  - 例: `https://<username>.github.io/<repo>/images/OGP.png`
- 必要なら `og:url` を各ページに追加する。
  - トップページ
  - Reflection一覧
  - Concept詳細ページ

## OGP / SNS表示

- `images/OGP.png` が公開URLで直接開けるか確認する。
- X / Facebook / Slack / MessengerなどにURLを貼って、カード表示を確認する。
- OGP画像が切れすぎていないか、文字が小さすぎないか確認する。
- 必要ならSNSカード用に `OGP.png` を 1200 x 630 前後で作り直す。

## 表示確認

- GitHub Pages上でトップページを開く。
- ライトモードとダークモードを切り替えて確認する。
- PC幅とスマホ幅で確認する。
- 写真、名前、肩書き、Aboutまでの余白を確認する。
- Conceptsカードが崩れていないか確認する。
- Reflectionの表示が `Coming soon` のままでよいか確認する。

## リンク確認

- Headerの `Home` / `Reflection` が正しく動くか確認する。
- Conceptsの各カードリンクを確認する。
- Reflectionページへのリンクを確認する。
- DOIリンクを確認する。
- Facebook / LinkedIn / Researchmapの外部リンクを確認する。

## 公開前にできれば埋めたいもの

- Reflection初回記事を1本置く。
- Concept詳細ページの本文を最低限磨く。
- `Coming soon` を消すか、公開時の意図に合う文言に変える。

## Supabase / CMS

- Supabaseを使う場合、`.env` の値が正しいか確認する。
- `npm run build:concepts` がSupabaseから取得できるか確認する。
- `related_titles` カラムがSupabase側に反映されているか確認する。
- Admin CMSで `Related titles` が保存できるか確認する。

## 最終確認コマンド

```bash
npm run build
```

検索して残骸がないか確認する。

```bash
rg -n "USERNAME|blog/|Blog|記事タイトルをここに|first-post|Coming soon" .
```
