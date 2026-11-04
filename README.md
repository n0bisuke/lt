# LT スライド

IoTLT などの LT スライドを AI で作るための一式です。

## 使い方

1. `inbox/` に写真、スクショ、メモをまとめて入れます。ファイル名や形式はそのままで構いません（iPhone の HEIC も可）。
2. AI エージェントでこのフォルダを開いて頼みます。

> inbox の素材で来週の IoTLT のスライドを作って

手順とルールは `AGENTS.md` にまとめてあるので、AGENTS.md を読むエージェントならそのまま使えます。

Claude Code では `/lt-slides` と打つだけで動きます。途中で質問せず下書きまで作り、分からないところは「【要確認】」としてデッキに残して、最後にまとめて聞きます。

`decks/<日付>_<名前>/index.html` と PDF ができます。素材は `images/` と `notes/` に振り分けられ、元のファイルは `inbox/_used/` に残ります。点線の `lt-slot` が残っていたら、実物の写真に差し替えれば完成です。

## 公開

「このスライドを公開して」と頼むと、そのデッキの HTML と PDF が GitHub Pages に載ります。`deck.json` の `published` が `true` のデッキだけが公開対象です。手順は `AGENTS.md` の「公開する」にあります。

公開先は次のとおりです。

- 一覧：`https://n0bisuke.github.io/lt/`
- 個別ページ：`https://n0bisuke.github.io/lt/<デッキ名>/`
- API：`https://n0bisuke.github.io/lt/all.json`

手元でサイトを確認するときは、次のコマンドで `dist/` を作って中身を開きます。

```bash
node scripts/build-site.mjs
```

## 発表と書き出し

ブラウザで `index.html` を開きます。← → でページ送り、`f` で全画面です。`index.html?overview` で全スライドを一覧できます。

```bash
scripts/export-pdf.sh decks/sample_bbq
```

## フォルダ

- `design-system/project/`：デザインシステムの本体（`tokens.json`、`README.md`、`components/`）
- `decks/`：スライド置き場（`sample_bbq` は見本）
- `AGENTS.md`：AI エージェント向けの手順とルール（`CLAUDE.md` と `.claude/skills/lt-slides/` はここを参照するだけ）
- `inbox/`：素材の入れ場所（Git には入りません）
- `scripts/`：素材の取り込み、トークンの CSS 生成、PDF 書き出し、サイト生成

`tokens.json` を変えたら `node scripts/build-tokens.mjs` を実行します（PDF 書き出しでは自動で実行されます）。
