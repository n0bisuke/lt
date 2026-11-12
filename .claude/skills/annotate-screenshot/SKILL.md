---
name: annotate-screenshot
description: 教材・資料のMarkdownに埋め込まれたGyazoのスクショに、赤枠・番号付きの丸・矢印・テキスト・ぼかしの注釈を付ける。文章に照らして注釈が必要な画像を判断し、注釈JSONを作って描画し、目視チェックの後にGyazoへアップロードしてmdのURLを差し替える。「スクショに注釈を付けて」「画像に赤枠を入れて」などで使う。
---

# 教材スクショへの注釈付け

教材mdの文章と、そこに埋め込まれたGyazo画像を読み、必要な画像にだけ注釈を付ける。
描画は `scripts/annotate.mjs`（Node + sharp、SVGを重ねる方式）が行い、AIは注釈の指示をJSONで作る。

スクリプトはすべて、このSKILL.mdがあるフォルダ（以下「スキルのフォルダ」）の `scripts/` にある。
スキルのフォルダは、プラグインとして入れた場合はキャッシュの中、リポジトリに直接置いた場合は `.claude/skills/annotate-screenshot/` などで、環境によって違う。
以下では `$S` をスキルのフォルダの `scripts/` の絶対パスとする。

```bash
S=<スキルのフォルダの絶対パス>/scripts
```

コマンドは、**作業対象のリポジトリの中で**実行する。スクリプトは実行した場所からリポジトリ直下を求め、そこを基準に `.annotate-work/` と `.env` を使う。

## 事前準備（初回のみ）

```bash
npm install --prefix <スキルのフォルダの絶対パス>
```

`sharp` が見つからないというエラーが出たときも、これを実行する（プラグインを更新するとスキルのフォルダが入れ替わるため）。

Gyazoへのアップロード（手順6）には、アクセストークンが要る。環境変数 `GYAZO_ACCESS_TOKEN` か、作業対象のリポジトリ直下の `.env` に設定してもらう。
**トークンの値をAIが読んだり、書き込んだり、表示したりしない。未設定ならユーザーに設定を依頼する。**

## 守ること

- **Gyazoへのアップロードと教材mdの書き換えは、1枚ずつユーザーに確認してから行う。** 指示のないmdは開いて読むだけにし、編集しない。
- 出力は作業対象のリポジトリ直下の `.annotate-work/` に置く。`.gitignore` に入っていなければ、追加してよいかユーザーに確認する。
- コミットはユーザーの指示があるまでしない。
- 画像の置き場所や公開の仕組みなど、リポジトリごとの決まりは、そのリポジトリの `AGENTS.md` や `CLAUDE.md` に従う。

## 手順

### 1. mdと画像を読む

以下のコマンドのmdのパスやIDは例。

```bash
node $S/list-images.mjs articles/80-hello-github-repository.md
```

画像ごとに、行番号・GyazoID・mdでの表示幅・画像サイズ・作業用の元画像のパスが出る。
表示幅は Zenn の `=450x` か `<img>` の `width` 属性から読み、指定がなければ `-` になる。
元画像はGyazoからダウンロードされ、`.annotate-work/<mdのパス>/<ID先頭8桁>.src.png` に置かれる。
`https://gyazo.com/<ID>`（パーマリンク）の形式も対象になる。gif・mp4 は対象外。

mdは全文を読み、各画像の直前・直後の手順文（「〜をクリックします」「〜と入力します」など）を把握する。元画像は開いて目視する。

### 2. 注釈が必要かを判断する

画像ごとに、次のどれかに分類し、一覧にしてユーザーに見せる。

- **すでに注釈がある**（赤枠・矢印などが描かれている）→ 対象外
- **注釈が要る**: 手順文が画面上の特定の場所（ボタン・入力欄・選択肢・メニュー）を操作させるのに、画像だけでは場所が分かりにくい
- **注釈は不要**: 完成イメージ、フロー図全体、結果表示など、どこか1点を指していない画像

ぼかしは、個人名・メールアドレス・APIキー・社内URLなど、見せるべきでない情報が写っている場合に使う。

### 3. 注釈JSONを作る

1画像につき1つ、`.annotate-work/<mdのパス>/<ID先頭8桁>.json` に書く（仕様は後述）。

座標を読み取るには、方眼を重ねた確認用画像を作って目視する。

```bash
node $S/grid.mjs <src.png> <grid.png>                          # 全体（目盛り50〜100px）
node $S/grid.mjs <src.png> <grid.png> --crop 200,290,460,110 --step 20   # 一部を拡大
```

注釈の付け方の目安:
- 操作する場所を `rect` で囲み、手順が複数あるときは手順文の番号に合わせて `number` を付ける
- `number` は囲んだ枠の角や外側に置き、元のUIの文字やボタンに重ねない
- 入力する値は `text` で示す（例：入力欄の中に「自分の名前_ニュース要約」）
- 1枚の注釈は3〜4個までに抑え、手順文に出てこないものには付けない

### 4. 描画する

```bash
node $S/annotate.mjs .annotate-work/articles/80-hello-github-repository/f0690d5a.json
```

注釈が画像からはみ出していると「警告」が出る。

### 5. 目で見て最終チェックする

出力画像を開いて目視し、細かい所は `grid.mjs --crop` で拡大して確認する。

- 枠が対象からずれていないか、対象を切っていないか
- 番号やテキストが、UIの大事な文字やボタンを隠していないか
- テキストが枠からはみ出していないか、読める大きさか
- mdの表示幅（350〜450pxなど。指定がない画像は本文の幅いっぱいに表示される）に縮小しても線や文字が見えるか

問題があればJSONの座標を直して、手順4からやり直す。問題がなければ、出力画像をユーザーに見せる。

### 6. Gyazoにアップロードし、mdのURLを差し替える

ここからは **1枚ずつユーザーの確認を取ってから** 実行する。

```bash
node $S/upload-gyazo.mjs .annotate-work/articles/80-hello-github-repository/f0690d5a.annotated.png
# → { "image_id": "...", "url": "https://i.gyazo.com/<新ID>.png", "permalink_url": "..." }
```

差し替えは、まず確認だけ行って差分を見せ、了承を得てから `--apply` を付ける。
同じ画像がmd内に複数回出てくることがあるので、行番号で1か所ずつ指定する。

```bash
node $S/replace-url.mjs articles/80-hello-github-repository.md --line 19 --from f0690d5a1e3e8cfee3a0cdbfc9c1456f --to https://i.gyazo.com/<新ID>.png
node $S/replace-url.mjs articles/80-hello-github-repository.md --line 19 --from f0690d5a1e3e8cfee3a0cdbfc9c1456f --to https://i.gyazo.com/<新ID>.png --apply
```

差し替えるのはURLの部分だけで、`=450x` や `width` などの表示幅の指定はそのまま残る。

## 注釈JSONの仕様

```json
{
  "input": "f0690d5a.src.png",
  "output": "f0690d5a.annotated.png",
  "displayWidth": 450,
  "defaults": { "color": "#E53935" },
  "annotations": [
    { "type": "rect", "x": 45, "y": 122, "w": 225, "h": 118 },
    { "type": "number", "x": 290, "y": 104, "label": "1" },
    { "type": "text", "x": 255, "y": 353, "text": "自分の名前_ニュース要約", "anchor": "middle-left", "fontSize": 12 },
    { "type": "arrow", "from": [520, 470], "to": [578, 520] },
    { "type": "blur", "x": 650, "y": 308, "w": 62, "h": 62 }
  ]
}
```

### 全体

| キー | 必須 | 説明 |
|---|---|---|
| `input` | ○ | 元画像のパス（JSONファイルからの相対パス） |
| `output` | | 出力先。省略時は `<input>.annotated.png`。`input` と同じパスは不可 |
| `displayWidth` | | mdでの表示幅（`=450x` や `width` 属性の値）。省略時 600。線の太さ・文字サイズなどの既定値は、この幅で表示したときの大きさ（px）で決まり、元画像の幅に合わせて自動で拡大される |
| `defaults` | | 全注釈の既定値の上書き。`color`, `strokeWidth`(3), `radius`(4), `fontSize`(14), `badgeRadius`(10), `arrowHead`(12), `padding`(4), `blurSigma`(12)。数値は表示幅基準 |
| `annotations` | ○ | 注釈の配列。配列の順に描くので、後のものが上に重なる（`blur` だけは常に最初に適用） |

**座標（`x`, `y`, `w`, `h`, `from`, `to`）はすべて元画像のピクセル座標**（左上が原点）。
一方、`strokeWidth`・`fontSize`・`r` などの大きさは表示幅基準の値で指定する。

### 注釈の種類

| `type` | キー | 説明 |
|---|---|---|
| `rect` | `x`, `y`, `w`, `h`、任意で `color`, `strokeWidth`, `radius`, `fill` | 枠。`x`,`y` は左上 |
| `ellipse` | `x`, `y`, `w`, `h`、任意で `color`, `strokeWidth`, `fill` | 楕円の枠。外接する矩形で指定 |
| `number` | `x`, `y`, `label`、任意で `r`, `color`, `textColor`, `ringColor` | 番号付きの丸。`x`,`y` は円の中心。白い縁取り付き |
| `arrow` | `from: [x, y]`, `to: [x, y]`、任意で `color`, `strokeWidth`, `headSize` | 矢印。矢じりは `to` 側 |
| `text` | `x`, `y`, `text`、任意で `anchor`, `fontSize`, `color`, `textColor`, `background`, `backgroundOpacity`, `border`, `padding`, `bold` | テキスト（日本語可、`\n` で改行）。既定は白背景・赤枠・赤の太字。`background: null` で背景なし、`border: null` で枠なし |
| `blur` | `x`, `y`, `w`, `h`、任意で `sigma` | 範囲をぼかす |

`text` の `anchor` は `x`,`y` がテキストボックスのどこに当たるかを表す:
`top-left`（既定）, `top-center`, `top-right`, `middle-left`, `center`, `middle-right`, `bottom-left`, `bottom-center`, `bottom-right`。
テキストの幅は文字数からの概算なので、目視で確認すること。

## ファイル

| ファイル | 役割 |
|---|---|
| `scripts/list-images.mjs` | mdのGyazo画像の一覧と、作業用の元画像の用意 |
| `scripts/grid.mjs` | 座標の目盛りを重ねた確認用画像（拡大も可） |
| `scripts/annotate.mjs` | 注釈JSONに従って描画 |
| `scripts/upload-gyazo.mjs` | Gyazoへのアップロード |
| `scripts/replace-url.mjs` | mdの1行のGyazo URLの差し替え（既定は確認のみ） |
| `scripts/gyazo-common.mjs` | 上記で共通に使う、リポジトリのパスとGyazo URLの正規表現 |
