# LT スライド

IoTLT などの LT スライドと、講演用のスライドを AI で作るための一式です。`deck.md` の先頭の `theme:` を `iotlt`（LT）か `lecture`（講演）にして見た目を選びます。

## 使い方

1. AI エージェントでこのフォルダを開いて、作りたいスライドの話をします。

> 来週の IoTLT のスライドを作りたい

2. 写真、スクショ、メモがあれば `inbox/` に入れます。ファイル名や形式はそのままで構いません（iPhone の HEIC も可）。話の途中で足しても大丈夫です。

手順とルールは `AGENTS.md` にまとめてあるので、AGENTS.md を読むエージェントならそのまま使えます。

Claude Code では `/lt-slides`、Codex では `.agents/skills/lt-slides/` のスキルを使えます。エージェントが話の内容や構成を質問しながら作ります。その場で分からないところは「【要確認】」としてデッキに残します。

`decks/<日付>_<名前>/deck.md` ができます。この1つのファイルから、オンラインのデッキ、記事、PDF が作られます。素材は `images/` と `notes/` に振り分けられ、元のファイルは `inbox/_used/` に残ります。点線の `lt-slot` が残っていたら、実物の写真に差し替えれば完成です。

## 公開

「このスライドを公開して」と頼むと、そのデッキ、記事、PDF が GitHub Pages に載ります。`deck.md` の先頭が `published: true` のデッキだけが公開対象です。手順は `AGENTS.md` の「公開する」にあります。

公開先は次のとおりです。

- 一覧：`https://n0bisuke.github.io/lt/`
- 個別ページ：`https://n0bisuke.github.io/lt/<デッキ名>/`
- API：`https://n0bisuke.github.io/lt/all.json`

### Google Analytics 4

`site.json` の `analytics.measurementId` に設定した測定IDを、一覧・詳細ページ・スライドページへ出力します。データストリームの測定ID（`G-` で始まる値）を変更するときは `site.json` を更新します。

### 限定公開スライド

**デッキ全体に鍵をかける場合**は、front matter に `published: true`、`unlisted: true`、`lockKeySalt`、`lockKeyHash` を設定します。`unlisted` のデッキは一覧と `all.json` から除外され、`https://n0bisuke.github.io/lt/<デッキ名>/` を直接開くと合言葉を求めます。記事を含むページとスライド本体の両方をゲートし、検索エンジン向けの noindex を付け、PDF・サムネイルを公開しません。

**一部のスライドだけに鍵をかける場合**は、`published: true` と鍵の検証値を設定し、対象スライドに `<!-- _class: locked -->` を付けます。ほかのスライドは通常どおり表示されます。ロックしたスライドの本文は記事に出さず、デッキ全体に noindex を付け、PDF・サムネイルを公開しません。

検証値は `npm run lock-key -- "8文字以上の合言葉"` で生成します。出力された `lockKeySalt` と `lockKeyHash` を front matter に貼り、合言葉そのものはリポジトリに保存しません。ローカルの試作デッキをPagesで見られるようにするには、内容を仕上げて `published: true` にし、`【要確認】` や不足画像を解消してから公開します。未公開デッキのURLは404になります。

これは公開リポジトリ上の簡易閲覧ゲートです。GitHubの `deck.md` や画像から内容を隠す暗号化ではありません。JavaScriptを無効にした場合は有効化の案内を表示します。機密情報や本人確認を伴う受講者認証には使わないでください。

自分で公開するときは、次のコマンドで `git add`、`commit`、`push` までまとめて行えます。下書きのデッキは入りません。

```bash
npm run deploy -- "コミットメッセージ"
```

手元でサイトを確認するときは、次のコマンドで `dist/` を作って中身を開きます。

```bash
node scripts/build-site.mjs
```

## VS Code で直す

最初に依存パッケージを入れます。

```bash
npm ci
```

VS Code で Marp for VS Code 拡張（`marp-team.marp-vscode`）を入れ、`deck.md` を開いてプレビューを表示します。テーマの設定は `.vscode/settings.json` に入っているので、このフォルダを開くだけで使えます。書き方は `design-system/project/marp.md` にあります。

## 発表と書き出し

スライドのPages公開とPDF生成は別のActionsです。`Export slide PDFs` は変更されたデッキのPDFとサムネイルを生成し、Actions artifact に14日間保存します。PDF生成が失敗してもスライドの公開は止まりません。PagesにはリポジトリにあるPDFだけが含まれます。手元でPDFを作る場合は次のコマンドを使います。

```bash
npm run export-pdf -- decks/sample_bbq
```

ブラウザで `deck.html` を開きます。← → でページ送り、`f` で全画面です。`deck.html?overview` で全スライドを一覧できます。

編集中はライブプレビューを使えます。次のコマンドを実行して表示された localhost の URL を組み込みブラウザで開きます。一覧からスライドと記事を選べます。エディタで `deck.md` を保存すると、版と記事を再生成してプレビューを自動更新します。終了はターミナルで `Ctrl+C` です。

```bash
npm run deck -- decks
```

## フォルダ

- `design-system/project/`：デザインシステムの本体（`tokens.json`、`README.md`、`components/`）
- `decks/`：スライド置き場（`sample_bbq` は見本）
- `AGENTS.md`：AI エージェント向けの手順とルール。Codex用スキルは `.agents/skills/lt-slides/`、Claude Code用は `.claude/skills/lt-slides/`
- `inbox/`：素材の入れ場所（Git には入りません）
- `scripts/`：素材の取り込み、トークンの CSS 生成、PDF 書き出し、サイト生成

`tokens.json` を変えたら `node scripts/build-tokens.mjs` を実行します（Actionsや手元でのPDF書き出しでは自動で実行されます）。
