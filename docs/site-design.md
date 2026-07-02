# Site Design

この文書は、プロフィールサイトの設計思想、情報構造、各ページの役割、実装上の境界を記録する設計書である。

サイトの構成、見た目、文章、生成処理、公開方法を変更するときは、実装と同じ作業の中でこの文書も更新する。コードと記述が食い違う場合は、実装を確認したうえで、この文書を現在の設計に合わせる。

## 1. サイトの目的

このサイトは、亀岡恭昂の経歴を紹介するだけでなく、どのような視座で世界を捉え、どのようなスタイルで生き、何を実現しようとしているかを一つのまとまりとして伝えるためのプロフィールサイトである。

訪問者が次の順序で人物像を理解できることを目指す。

1. 誰で、現在何をしているかを知る
2. どのような経験と関心を持つかを知る
3. 人生と世界を捉えるスタイルやコンセプトに触れる
4. これから実現したいことを知る
5. 必要に応じて研究実績や外部プロフィールへ進む

## 2. デザイン原則

### 人物と思想を分離しない

肩書きや経歴だけを並べるのではなく、`Style`、`Concepts`、`Aspiration` をプロフィールの中心に置く。何をしてきたかと、どのように考えているかを同じ人物像として見せる。

### 静かで、読むことに集中できる画面にする

装飾や動きを増やしすぎず、余白、文字組み、写真、明暗の対比によって情報の階層をつくる。コンセプト本文は記事として長く読めることを優先する。

### 一覧から深掘りへ進める

トップページでは全体像と短い要約を示し、関心を持った訪問者が詳細ページへ進める構造にする。最初からすべてを読ませようとしない。

### 日本語を中心に、英語を補助として使う

本文と主要な説明は日本語を基本とする。氏名、セクション名、コンセプトの関連タイトルなどでは英語を併記し、概念の広がりと国際的な可読性を補う。

### 内容を原稿として残し、表示を再生成できるようにする

コンセプト本文の正本はMarkdownとし、公開HTMLは生成物として扱う。文章をHTMLだけに閉じ込めず、Obsidianなどでも継続的に推敲できる状態を保つ。

### 小さく、長く保守できる構成にする

データベースやCMSを前提にせず、静的HTML、CSS、JavaScript、Markdown、Node.jsの小さな生成処理で構成する。新しい仕組みは、現在の構成では解決できない明確な必要がある場合に導入する。

### 端末や閲覧環境を限定しない

PCとスマートフォンの双方で読みやすくし、ライトモードとダークモードのどちらでも情報の階層と十分なコントラストを保つ。

## 3. サイト構造

```text
/
├── index.html                         トップページ
├── style/
│   └── <slug>.html                   各Styleの詳細
├── concepts/
│   ├── index.html                    コンセプト体系の案内
│   └── <slug>.html                   各Conceptの詳細
├── aspirations/
│   └── <slug>.html                   各Aspirationの詳細
├── reflection/
│   ├── index.html                    Reflection一覧
│   └── posts/<slug>.html             各Reflectionの詳細
├── 404.html                           存在しないURLの案内
├── content/concepts/*.md             Vault未設定時のStyle・Conceptフォールバック原稿
├── content/reflections/*.md          Vault未設定時のReflectionフォールバック原稿
├── src/generators/                    静的HTMLの生成処理
├── src/lib/                           原稿の読込・Markdown変換
├── src/templates/                     生成ページのHTMLテンプレート
├── style.css                          サイト全体の視覚設計
├── script.js                          テーマ切替などの共通動作
└── images/                            プロフィール・OGP画像
```

原稿の正本はObsidian Vaultに置く。ビルドは `.env` または実行環境で指定された `STYLE_DIR`、`CONCEPT_DIR`、`REFLECTIONS_DIR` を直接読む。`STYLE_DIR` と `CONCEPT_DIR` の両方がある場合はStyleとConceptを別フォルダから読み、frontmatterの `section` で表示先を区分する。

環境変数がない場合は、後方互換として `CONCEPTS_DIR`、さらに `content/concepts/` を読む。`content/` は正本ではなく、Vault未設定時のフォールバックであり、当面は削除しない。

主な閲覧経路は次のとおり。

```text
トップページ
├── Style ──────────────> Style詳細 ──> Resonancesカード ──> Reflection詳細
├── Concepts ───────────> Concept詳細 ─> Resonancesカード ──> Reflection詳細
├── Aspiration ─────────> Aspiration詳細 ─> Resonancesカード ─> Reflection詳細
├── Reflection ─────────> Reflection一覧 ────────────────> Reflection詳細
└── Papers / SNS ───────> 外部サイト

Concept Map ────────────> Style詳細 / Concept詳細
```

現時点では、Concept Mapへのリンクはトップページや共通ナビゲーションに置かれておらず、URLを直接開いた場合に閲覧できる。

## 4. 各ページの役割

### トップページ `index.html`

サイト全体の入口であり、人物像の要約を一続きで示すページ。

- `Profile`: 氏名、写真、現在の肩書きを示す
- `About`: 経歴と現在の関心を短い物語として伝える
- `Style`: 生き方の基盤となるコンセプトと実践を示す
- `Concepts`: 人生と世界を見るための視座を示す
- `Aspiration`: 今後実現したい方向を示す
- `Reflection`: 経験と思考の記録を新しい順に示す
- `Education` / `Career`: 経歴の事実関係を時系列で示す
- `Papers`: 研究実績と外部の業績一覧への入口を置く

トップページは概要と導線に徹し、長い思想本文は詳細ページへ分ける。

`Style` と `Concepts` のカード部分は、コンセプト原稿をもとにビルド時に更新される。生成範囲は `<!-- concepts:start -->` と `<!-- concepts:end -->` の間である。`Style` は `section: style` の最小 `sort_order` をfeaturedとして大きく表示し、残りを `sort_order` 順に3枚のカードで表示する。`Concepts` は `section: concept` の全原稿を `sort_order` 順に表示し、現在は「パラダイム」を含む4枚のカードになる。

`Reflection` は、公開中のReflectionを日付降順で上位3件だけ表示する。生成範囲は `<!-- reflections:start -->` と `<!-- reflections:end -->` の間であり、各カードは `reflection/posts/<slug>.html` にリンクする。セクション末尾の「すべて見る」は `reflection/index.html` へリンクする。

### Concept Map `concepts/index.html`

個々のコンセプトを単独の記事ではなく、一つの体系や読書順序として理解するための案内ページ。全コンセプトの背景説明と一覧を示し、各詳細ページへつなぐ。

このページは `src/generators/build-concepts.js` によって生成される。サイト内の正式な導線として使う場合は、トップページまたは共通ナビゲーションからのリンクを別途設ける。

Concept Mapの導入文は通常のConceptカードとしては扱わない。読み込み時は、まずfrontmatterに `type: concept-map` を持つMarkdownを探し、なければConceptディレクトリ内でファイル名が `0[_.\s].*(concept|コンセプト)` に合うMarkdownを使い、それもなければ既存の `0. Concepts.md` を読む。この判定に該当するファイルは、トップページとConcept Map一覧のカード生成から除外する。

### コンセプト詳細 `concepts/<slug>.html`

各コンセプトを長文で読むための記事ページ。タイトル、関連する英語名、要約、本文を表示する。

正本はObsidian VaultのStyle・Conceptフォルダに置き、`src/templates/concept.html` を使って生成する。生成後のHTMLを直接編集しても、次回のビルドで上書きされる。

### Aspiration詳細 `aspirations/<slug>.html`

トップページで示した将来像を具体化するページ。正本はObsidian VaultのAspirationフォルダに置き、`ASPIRATIONS_DIR` で指定する。原稿はConceptと同じ `## Title` / `## Epigraph` / `## Summary` / `## Perspective` / `## Explication` / `## Notes` 形式で、frontmatterの `slug`、`title`、`sort_order`、`is_published` を読む。生成後のHTMLを直接編集しても、次回のビルドで上書きされる。

本文はTitle、Epigraph、Summary、Resonances、Notesを除外した部分を使う。PerspectiveやExplicationが空で本文のないAspirationは、トップページでは非リンクのカードとして表示し、詳細ページは生成しない。Reflectionのfrontmatterに`aspirations: <slug>`を指定すると、対応するAspiration詳細にカードが表示される。Aspirationのslugはfrontmatterの `slug` を用いる。

### Reflection一覧 `reflection/index.html`

公開中のReflectionを日付降順ですべて表示する一覧ページ。各カードはタイトル、日付、説明を持ち、`reflection/posts/<slug>.html` へリンクする。

このページは `src/generators/build-reflections.js` によって生成される。トップページのReflectionセクションも同じ生成器が更新する。

### Reflection詳細 `reflection/posts/<slug>.html`

個々のReflectionを長文で読むための記事ページ。タイトル、日付、本文を表示する。

正本はObsidian Vaultまたはフォールバックの `content/reflections/` に置き、`src/templates/reflection.html` を使って生成する。生成後のHTMLを直接編集しても、次回のビルドで上書きされる。

### 404ページ `404.html`

存在しないURLを開いた訪問者に状況を伝え、トップページへ戻す。

## 5. コンテンツと生成の境界

### Markdownを正本とするもの

- コンセプトのタイトル、関連タイトル、要約、本文
- 公開順、slug、公開状態などのfrontmatter
- Aspirationのタイトル、要約、本文、および詳細ページ生成有無
- Reflectionのタイトル、日付、説明、本文、およびStyle・Concept・Aspirationとの接続

新規原稿はObsidian Vault側で作成する。StyleとConceptは `STYLE_DIR` と `CONCEPT_DIR` を分けて指定し、frontmatterの `section`、`slug`、`sort_order`、`is_published` を読む。Aspirationは `ASPIRATIONS_DIR` を指定し、Conceptと同じ本文形式から読み込む。Reflectionは `REFLECTIONS_DIR` を指定し、frontmatterの `slug`、`title`、`date`、`description`、`styles`、`concepts`、`aspirations` を読む。Reflectionの接続先は `styles`、`concepts`、`aspirations` にslugをカンマ区切りで指定する。従来の`tags`もStyle・Conceptの接続先として読み込む。

`STYLE_DIR` と `CONCEPT_DIR` が未設定の場合は、後方互換として `CONCEPTS_DIR`、さらに `content/concepts/` を読む。`ASPIRATIONS_DIR` が未設定の場合は `content/aspirations/` を読み、`REFLECTIONS_DIR` が未設定の場合は `content/reflections/` を読む。`content/` はローカルフォールバックであり、編集上の正本ではない。

Style・Concept・Aspiration本文では、行頭タブで始まる段落を引用ではない補足ブロックとして扱う。生成時は `aside.supplement` に変換し、引用とは別の字下げ本文として表示する。

本文中のリンクは Markdown の `[表示文字](URL)` 形式で書く。生成時に `<a>` へ変換し、`http(s)://` で始まる外部リンクは `target="_blank" rel="noopener"` で開く。URLの生書きではなくこの形式を正とする。画像記法 `![alt](URL)` はリンク化しない。Obsidian内部リンク `[[...]]` はサイトには出力せず、Vault内の導線としてのみ用いる。

### HTMLを直接編集するもの

- トップページのプロフィール、About、Aspiration、経歴、研究実績
- 404ページ
- コンセプトページの共通テンプレート

ただし、トップページ内のコンセプト生成範囲、トップページ内のAspiration生成範囲、トップページ内のReflection生成範囲、`concepts/*.html`、`style/*.html`、`aspirations/*.html`、`reflection/index.html`、`reflection/posts/*.html` は直接編集しない。

### 共通の見た目と動作

- 見た目は原則として `style.css` に集約する
- テーマ切替などの共通動作は `script.js` に置く
- ヘッダー、ナビゲーション、フッターの変更時は、手書きページと生成テンプレートの双方を確認する

## 6. 更新時のルール

サイトに関する作業では、変更内容に応じてこの設計書も同じ作業内で更新する。

特に、次の変更は設計書の更新対象とする。

- ページやセクションの追加、削除、役割変更
- ナビゲーションや主な閲覧経路の変更
- 色、文字、余白、カード、レスポンシブ表示などのデザイン原則に関わる変更
- Markdownの形式、原稿の保存場所、生成方法の変更
- 手書きHTMLと生成HTMLの境界変更
- ビルド、確認、公開手順の変更
- サイトの目的や想定する読み手の変更

単純な誤字修正など、設計に影響しない変更では本文の追記は不要。ただし、この文書の記述が現状と食い違っていないかは確認する。

## 7. 作業後の確認

1. 必要に応じて `docs/site-design.md` を更新する
2. `npm run publish` を実行する
3. `npm run serve` でトップページと変更した詳細ページを確認する
4. PC幅とスマートフォン幅を確認する
5. ライトモードとダークモードを確認する
6. ヘッダー、カード、戻るリンク、外部リンクを確認する
7. 生成対象のHTMLを直接編集していないことを確認する
8. 問題がなければ手動で `git add` / `git commit` / `git push` する

公開前の確認事項は `docs/github-publish-checklist.md` も参照する。
