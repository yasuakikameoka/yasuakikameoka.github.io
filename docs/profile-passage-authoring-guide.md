# Profile Passage Authoring Guide

この文書は、亀岡恭昂のプロフィールサイトに掲載する `Style`、`Concept`、`Aspiration`、`Reflection` のMarkdown原稿を、Obsidian、Codex、Claudeなどで作成・編集するための共通指示書である。

原稿を編集するAIは、文章を単に要約・整形するのではなく、4種類の文章の役割を区別し、それらが一つの人物像として接続するように扱うこと。

## 0. 対象フォルダ

原稿の正本は、Obsidian Vault内の次のフォルダに置かれている。

```text
00_ProfilePassage/
├── 1_Style/       生き方・判断・制作の様態
├── 2_Concept/     自己と世界を見るための視座
├── 3_Aspiration/  実現したい方向
├── 4_Reflection/  日付のある経験と思索の記録
├── 5_Memo/        未整理の着想や素材
└── 6_Private/     公開を前提としない個人的記録
```

`5_Memo`の文章を、内容を吟味せずStyle、Concept、Aspirationへ移動しない。`6_Private`の内容は、ユーザーが明示的に指定しない限り公開原稿へ転用しない。

## 1. 全体構造

4種類の文章は、次の問いを担当する。

| 種別 | 中心となる問い | 時間軸 | 役割 |
| --- | --- | --- | --- |
| Style | どのように生きるか | 現在進行形 | 生き方、判断、実践の様態を示す |
| Concept | 世界や自己をどう見るか | 時間を限定しない | 経験を捉えるための視座や語彙を示す |
| Aspiration | 何を実現する方向へ進むか | 現在から未来 | 社会や他者に向けた志向を示す |
| Reflection | 実際の経験から何を受け取ったか | 日付のある現在 | 上記3種を経験の中で検証し、更新する |

関係は次のように捉える。

```text
Concept ── 世界や経験を見えるようにする
   ↓
Reflection ── 出来事の中でConceptを使い、問い直す
   ↙       ↘
Style       Aspiration
生き方を更新   向かう方向を更新
```

Style、Concept、Aspirationは完成した教義ではない。Reflectionを通して揺らぎ、具体化され、必要に応じて改稿される。

## 2. 共通の執筆原則

1. 日本語を本文の基本言語とし、英語名は概念を補助する場合に用いる。
2. 抽象的な主張だけで終わらせず、経験、身体感覚、行為、制度、他者との関係のいずれかへ接続する。
3. 著者の確定的な思想と、検討中の仮説や問いを区別する。
4. 引用文、著者名、書名、ページ番号を推測で補わない。不明な箇所は `TODO` または `要確認` とする。
5. 原稿に存在しない思想家や理論を、文章を賢く見せる目的で追加しない。
6. 著者固有の語彙、反復、緊張関係を安易に一般的な自己啓発語へ置き換えない。
7. 要約では本文の射程を広げすぎない。本文で論じていない結論をカード文に入れない。
8. 表記の修正と思想内容の変更を区別する。思想上の意味が変わる編集は明示する。
9. 文章を過度に断定的、宣言的、広告的にしない。思索が動いている感触を残す。
10. 公開前の原稿は `is_published: false` とする。

## 3. Style

### 役割

Styleは「何者であるか」「何を達成するか」よりも、**いま、どのように生き、判断し、行為するか**を書く。

単なる価値観一覧、性格診断、行動規範にはしない。身体的な好みや癖、他者や世界との関係、失敗を含む実践の様態として記述する。

### 含める内容

- そのStyleが応答しようとしている生の問題
- 中心となる考え方と固有の語彙
- 日常、仕事、制作、意思決定における現れ方
- そのStyleが陥りうる危険や限界
- 他のStyle、Concept、Aspirationとの関係
- 理論的な参照元がある場合は、その参照と著者自身の解釈の区別

### VaultでのMarkdown

既存Style原稿は、`Perspective`と`Explication`を分けている。この区別を維持する。

- `Perspective`: なぜこのStyleが著者自身にとって切実なのか。個人的経験、直観、賭け、現在の立場を書く。
- `Explication`: 概念の定義、思想的系譜、引用、論証、実践上の帰結を説明する。

```md
---
section: style
slug: style-slug
title: スタイル名
related_titles: English Title
sort_order: 10
is_published: false
summary_override:
---

## Title

スタイル名
English Title

## Epigraph

必要な場合のみ、出典を確認できる題辞を書く。

## Summary

このStyleが「どのように生きるか」にどう答えるかを、1〜3文で書く。

## Perspective

このStyleが著者自身の経験や生にとって、なぜ必要なのかを書く。

## Explication

問題設定、中心命題、思想的系譜、実践上の意味、限界を書く。必要に応じて小見出しを置く。

## Resonances

関連するReflectionへのリンクや、そこから生じた更新を書く。
```

### 現在のStyle slug

- `style-ontology`: スタイルの存在論
- `historical-poietic-self`: 歴史的制作的自己
- `aspiration-play`: 志との戯れ
- `payoff-driven`: ペイオフ駆動

## 4. Concept

### 役割

Conceptは、自己、他者、組織、制度、社会、世界の中で、これまで見えなかった構造を見えるようにする「眼鏡」である。

Styleのように直接「こう生きる」と命じるものではなく、まず**何が起きているのかを捉えるための視座**を与える。

### 含める内容

- そのConceptが必要になる問題や観察
- 概念の定義と構成要素
- 既存の語彙では捉えにくい点
- 個人とシステムの双方における具体例
- 理論的・歴史的な系譜
- 説明できることと、説明できないこと
- StyleやAspirationへ与える含意

### VaultでのMarkdown

Conceptでも、著者自身がどこからその視座を必要としたかを`Perspective`に、概念の定義と論証を`Explication`に分けてよい。

```md
---
section: concept
slug: concept-slug
title: コンセプト名
related_titles: English Title
sort_order: 20
is_published: false
summary_override:
---

## Title

コンセプト名
English Title

## Epigraph

必要な場合のみ、出典を確認できる題辞を書く。

## Summary

何を見えるようにするConceptなのかを、1〜3文で書く。

## Perspective

このConceptによって著者には何が見えるようになったのかを書く。

## Explication

問題設定、定義、構造、具体例、理論的系譜、射程、限界を書く。

## Resonances

関連するReflectionへのリンクや、そこから生じた更新を書く。
```

### 現在のConcept slug

- `movement-stillness-nonduality-system`: 動静一如システム
- `the-singularity-of-being`: 代替不可能性
- `apparatus-of-glory`: 栄光装置

## 5. Aspiration

### 役割

Aspirationは、固定された目標や達成期限ではなく、**現在の経験とStyleから立ち上がる、社会や他者に向けた方向性**を書く。

使命を上位の存在から与えられた命令として扱わない。「なぜ自分がこの方向へ惹かれるのか」「誰と、どのような状態をつくりたいのか」「どのような実践として進むのか」を示す。

### 含める内容

- 実現したい社会的・関係的な状態
- その方向が現在の経験から生まれた背景
- 関わる人、組織、制度、場所
- すでに行っている実践と、これから試す実践
- 成功を単一の数値目標に還元できない理由
- 関連するStyleとConcept
- Reflectionによって今後変わりうる余白

### 推奨Markdown

Aspirationは現在のサイトでは静的HTMLで管理されており、Markdownからの自動生成には未対応である。ただし、Obsidian側では次の形式を正本候補として育ててよい。サイトへ反映する際は、内容を対応するAspiration HTML本文へ移す。

```md
---
section: aspiration
slug: aspiration-slug
title: アスピレーション名
sort_order: 10
is_published: false
summary: 一覧カードに表示する1〜2文
styles: style-ontology, aspiration-play
concepts: the-singularity-of-being
---

## Aspiration

アスピレーション名

## Summary

どのような状態を実現したいかを短く書く。

## Background

この方向がどの経験や問題意識から立ち上がったかを書く。

## Direction

誰と、どの領域で、どのような状態をつくりたいかを書く。

## Practice

すでに行っていることと、これから試すことを書く。

## Open Questions

未解決の問い、葛藤、変わりうる点を書く。
```

### 現在のAspiration slug

- `style-of-living`: 探究しながら生きる人を支える
- `autonomy-and-coexistence`: 自律と共生を両立する教育をつくる
- `knowledge-institutions`: 知が生まれ、残り、届く拠点を育てる

Obsidian側には、これとは別に「パトロネッジの再構築」「探究者の発掘・育成・応援」「自律と共生の融和」という原稿がある。これらとサイト側の3項目は一対一対応が確定していない。名称やslugを機械的に置換せず、統合・分割・改題の方針をユーザーに確認すること。

## 6. Reflection

### 役割

Reflectionは日付を持つ思索の記録である。抽象的な思想体系をもう一度説明するのではなく、**具体的な出来事、対話、読書、違和感、失敗、発見から始める**。

ReflectionはStyle、Concept、Aspirationの「事例紹介」ではない。経験を通して既存の文章を使い、同時にそれらが十分かどうかを問い直す場所である。

### 含める内容

- 思索のきっかけとなった具体的な出来事
- そのときの反応、感情、身体感覚、違和感
- 既存のStyleやConceptを使うと何が見えるか
- 既存の語彙では捉えきれなかったこと
- Aspirationが具体化、修正、保留された点
- 残った問い
- 次に試す小さな実践

すべての見出しを毎回埋める必要はない。ただし、出来事のない抽象論だけにはしない。

`4_Reflection`には、旅行記、読書メモ、論考、過去の投稿を集めた素材など、形式の異なる既存原稿がある。既存文章を編集するときは、まずその文章の性格と成立時期を尊重する。ユーザーから再構成の依頼がない限り、全原稿を新テンプレートへ機械的に変換しない。

### 実装対応済みMarkdown

```md
---
slug: reflection-slug
title: リフレクションの題名
date: YYYY-MM-DD
description: 関連ページのカードに表示する短い説明
styles: style-ontology, aspiration-play
concepts: the-singularity-of-being
aspirations: style-of-living
is_published: false
---

## Encounter

何が起きたのか。出来事、対話、読書、違和感を書く。

## Reflection

何を受け取り、どう考えたかを書く。

## Resonances

Style、Concept、Aspirationとどのように響き合い、どこでずれたかを書く。

## Question

まだ解けていない問いを書く。

## Practice

次に試すこと、生活や仕事に持ち帰ることを書く。
```

### 接続ルール

`styles`、`concepts`、`aspirations`には、関連する原稿のslugをカンマ区切りで指定する。指定されたReflectionは、サイト上の各詳細ページにある `Resonances` カードとして表示される。

接続は、本文中に名前が登場しただけでは付けない。その文章の意味を実際に検証、具体化、修正している場合に付ける。

## 7. 種別を判断する基準

迷った場合は、原稿の中心文を次の形にして判断する。

- 「私は／私たちは、〜のように生きる」ならStyle
- 「〜として見ると、これまで見えなかった構造が見える」ならConcept
- 「私は／私たちは、〜が可能な状態をつくりたい」ならAspiration
- 「この出来事を通して、〜だと考えた／問い直した」ならReflection

複数にまたがる場合、中心となる問いで主分類を決め、他の文章へリンクする。一つの原稿に4種類すべての役割を背負わせない。

## 8. AIへの作業指示

Codex、ClaudeなどのAIがこのフォルダを編集するときは、次の順序で作業すること。

1. 対象原稿だけでなく、接続するStyle、Concept、Aspiration、直近のReflectionを読む。
2. 原稿の種別と中心となる問いを一文で確認する。
3. 誤字、構成、論理、思想内容の変更を区別する。
4. 引用や書誌情報を勝手に補完しない。
5. frontmatterの既存slugを変更しない。変更が必要な場合は、サイト側リンクへの影響を先に報告する。
6. Reflectionの接続先は、slug一覧と本文上の実質的な関係を照合する。
7. 大幅な書き換えでは、消した論点がないかを確認する。
8. 編集後に、変更した意味と未確認事項を短く報告する。
9. 空のAspiration原稿や未完成原稿では、本文を推測で書き足さず、関連するMemo・Private・Reflectionから使えそうな素材の候補を提示する。
10. `Private`の内容を利用する場合は、利用する文章と公開範囲についてユーザーの明示的な了承を得る。

## 9. 完了条件

原稿編集は、次を満たしたときに完了とする。

- 種別の役割が混ざっていない
- SummaryとPerspective・Explicationの主張が一致している
- 引用と事実に未確認の補完がない
- slugと接続先が正しい
- Reflectionが具体的な経験から始まっている
- Style、Concept、Aspirationとの接続理由を説明できる
- 公開可否がfrontmatterに明示されている
