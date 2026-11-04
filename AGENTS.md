# AGENTS.md

IoTLT などのライトニングトーク（LT）のスライドを、発表者（菅原のびすけ）のデザインで作るためのリポジトリです。AI エージェントは、ネタのメモ・記事・リポジトリ・写真を受け取り、HTML のデッキと PDF を作ります。

## 最初に読むもの

- `design-system/project/README.md`：口調、デッキの構成、色と文字のルール。**スライドを書く前に必ず読みます。**
- `design-system/project/components/<部品名>/README.md`：使う部品の説明とそのまま使える HTML。
- `decks/sample_bbq/index.html`：完成形の見本。

## フォルダ構成

| パス | 内容 |
| --- | --- |
| `inbox/` | 発表者が画像やメモを入れるフォルダ。Git には入らない |
| `decks/<YYYYMMDD>_<短い英語名>/` | スライド置き場。`index.html`、`deck.json`、`images/`、`images.md`、`notes/`、書き出した PDF |
| `design-system/project/tokens.json` | 色・文字・余白の唯一の定義元 |
| `design-system/project/components/bundle.css` | 部品の配置 |
| `design-system/project/components/bundle.js` | ページ送りなどの実行コード |
| `design-system/tokens.css` | `tokens.json` から生成されるファイル。手で編集しない |
| `scripts/build-tokens.mjs` | `tokens.css` を生成する |
| `scripts/new-deck.mjs` | デッキを用意し、`inbox/` の中身を取り込む |
| `scripts/export-pdf.sh` | デッキを PDF に書き出し、1枚目から `thumbnail.png` を作る |
| `site.json` | 公開先の URL（`all.json` と個別ページの絶対 URL に使う） |
| `scripts/build-site.mjs` | 公開するデッキだけを `dist/` に集める |
| `.github/workflows/pages.yml` | `main` への push で `dist/` を GitHub Pages に公開する |

## スライドの作り方

1. **デッキを用意して取り込む。** 次のコマンドで `decks/<名前>/` を作ります。`inbox/` の画像は `images/` に、メモなどは `notes/` に入ります。あとから `inbox/` に足された分は、同じコマンドをもう一度実行すれば取り込めます。

   ```bash
   node scripts/new-deck.mjs <YYYYMMDD_英小文字の名前> --title "発表タイトル"
   ```

   番号は古いファイルから順に付き、一覧は `images.md` に出ます。HEIC は JPEG に変換し、長辺は2400pxまで縮め、JPEG と PNG の位置情報などのメタデータは消します。元のファイルは `inbox/_used/` に残ります。
2. **材料を読む。** `images.md` の画像を実際に開いて中身を確認し、`notes/` と渡されたものもすべて読みます。足りなければ次の4点だけを聞きます。すでに分かっていることは聞きません。
   - イベント名と日付（`20260419 #IoTLT vol134 in 潮風公園BBQ` の形で使う）
   - 何を作った・試したか、結果はどうだったか
   - つまずいた点、面白かった点
   - 自己紹介の最後の1行に入れる最近のネタ
3. **構成を決める。** 取り込んだ画像の内容も踏まえ、1枚1行で見出しを書き出します。5分なら15〜25枚が目安で、1枚に1つの話だけを載せます。見出しは項目名ではなく文にします。
4. **デッキを書く。** `index.html` の `<main class="lt-deck">` の中に `<section class="lt-slide">` を並べ、`deck.json` の `event` を `#IoTLT vol134 in 潮風公園BBQ` のように直します。
5. **画像を入れる。** `<img class="lt-media" src="images/xxx.jpg">` で入れます。話に合わない画像は無理に使いません。足りないものは `lt-slot` にして、何を用意するかを書きます。
6. **書き出して確認する。** 下のコマンドで PDF を作り、全ページを見て、文字のはみ出し、タイトルの折り返し、画像との重なりを直します。ブラウザで `index.html?overview` を開くと全スライドを一覧できます。
7. **報告する。** デッキと PDF のパス、使わなかった画像、残っている `lt-slot`、「【要確認】」の一覧を伝えます。

## 公開する

発表者が公開を頼んだデッキだけを公開します。`deck.json` は最初 `"published": false` で、`false` のデッキはサイトに出ません。

1. 公開の前に、顔が写っている人、画面に映った個人情報や API キー、引用の許可を確認するよう発表者に伝えます。
2. `deck.json` を `"published": true` にします。
3. PDF を書き出してサイトを組み立てます。`lt-slot` か「【要確認】」が残っている、PDF がない、画像が見つからない場合はエラーで止まります。

   ```bash
   scripts/export-pdf.sh decks/<デッキ名>
   ```

   ```bash
   node scripts/build-site.mjs --move-unused
   ```

   `--move-unused` は、スライドで使っていない画像を `unused/` に移します。`unused/` と `notes/` はコミットされません。
4. **そのデッキだけ**をコミットして push します。

   ```bash
   git add decks/<デッキ名>
   ```

   公開リポジトリでは、コミットした内容はすべて誰でも読めます。下書きのデッキをコミットしないよう、`git add .` や `git add decks` は使いません。

PDF とサムネイルは Yu Gothic で出力するため手元で作ってコミットします。GitHub Actions はこれらを作らず、コミット済みのファイルをそのまま公開します。

| URL | 内容 |
| --- | --- |
| `https://n0bisuke.github.io/lt/` | スライド一覧 |
| `https://n0bisuke.github.io/lt/<デッキ名>/` | 個別ページ（プレイヤー、PDF のダウンロード） |
| `https://n0bisuke.github.io/lt/<デッキ名>/slides/` | スライド本体 |
| `https://n0bisuke.github.io/lt/<デッキ名>/<デッキ名>.pdf` | PDF |
| `https://n0bisuke.github.io/lt/all.json` | 一覧の API |

デッキ名がそのまま URL になるので、公開したあとは変えません。

**動画の注意：** MP4、MOV、WebM、WebP の位置情報は消せません。`new-deck.mjs` が注意を出したファイルを公開するときは、発表者に確認します。

## コマンド

```bash
scripts/export-pdf.sh decks/<デッキ名>
```

`tokens.css` を生成してから、`decks/<デッキ名>/<デッキ名>.pdf` を書き出します。Chrome、Chrome Dev、Brave のいずれかと Node.js が必要です。

```bash
node scripts/build-tokens.mjs
```

`tokens.json` を変えたあと、PDF を書き出さずに `tokens.css` だけを更新するときに使います。リポジトリを取得した直後で `tokens.css` がないときも、ブラウザで開く前に実行します。

ブラウザでの発表は、← → でページ送り、`f` で全画面です。

## 部品の選び方

| 使う場面 | 部品 |
| --- | --- |
| 1枚目 / 2枚目の自己紹介 / 最後の1枚 | `TitleSlide` / `Profile` / `Summary` |
| タイトル＋本文の基本形 | `Slide` |
| 1文だけで間を作る | `Statement` |
| 手順の中の今の段階を示す | `SectionMarker` |
| 箇条書き | `Bullets` |
| 短い言葉を中央に数行 | `Stack` |
| `=>` の比較や左揃えの説明 | `Lines` |
| 製品紹介（画像＋箇条書き） | `MediaSplit` |
| 画像1枚＋補足 / 全面の写真 / 重ねた画像 / デモ | `Screenshot` / `FullPhoto` / `Collage` / `Demo` |
| コード / コードと説明・結果 | `CodeBlock` / `CodePair` |
| 文字と↓の処理の流れ / 機器とクラウドの図 / 表 | `Flow` / `Diagram` / `DataTable` |
| 文中の強調 / 画像の差し込み待ち | `Emphasis` / `Slot` |

`components/Cover/` はデザインシステムのページの表紙で、スライドの部品ではありません。

## 守ること

- **事実を作らない。** 発表者が試していない結果、数値、デモ、感想を書きません。分からなければ `lt-slot` か「【要確認】」にします。
- **画像を作らない。** 製品ロゴや写真を描き起こしたり、それらしい画像で埋めたりしません。生成画像は発表者が頼んだときだけ使います。
- **言葉を整えすぎない。** 発表者の短い話し言葉をそのまま使います。
- **クレジットを書く。** 他の人が撮った写真には撮影者を、引用には出典を書きます。
- **CSS を足さない。** デッキには部品のクラスだけを使います。`style` で指定するのは `lt-slot` と `Collage` の位置・大きさだけです。部品にない表現が必要なら発表者に相談します。
- **パスを直す。** 部品の README にあるアバターのパスは、デッキからは `../../design-system/project/assets/Logos/nobisuke-avatar.jpg` です。

## スライド一覧の API

他のサイトがスライド一覧を取得できるように、`build-site.mjs` が公開中のデッキを新しい順に並べた `all.json` をサイト直下に出力します。記事などをまとめる別リポジトリは、これをビルド時に取得する想定です。このリポジトリには記事を置かず、LT スライド専用にします。

```json
{
  "version": 1,
  "decks": [
    {
      "id": "20260419_bbq",
      "title": "エッジAIで焼肉の焼き加減判定やってみた",
      "date": "2026-04-19",
      "event": "#IoTLT vol134 in 潮風公園BBQ",
      "slideCount": 24,
      "url": "https://n0bisuke.github.io/lt/20260419_bbq/",
      "slides": "https://n0bisuke.github.io/lt/20260419_bbq/slides/",
      "pdf": "https://n0bisuke.github.io/lt/20260419_bbq/20260419_bbq.pdf",
      "thumbnail": "https://n0bisuke.github.io/lt/20260419_bbq/thumbnail.png"
    }
  ]
}
```

項目の追加は `version` を変えずに行えます。項目の削除や意味の変更は、取得側が壊れるので `version` を上げます。

## デザインシステムを変えるとき

- 値は `tokens.json` だけで変え、`bundle.css` には配置だけを書きます。
- 部品を変えたら、その部品の `README.md` と `preview.html` も揃え、`decks/sample_bbq` を書き出して崩れていないか確かめます。
- `preview.html` の `/_blob/...` は公開ページでだけ読める画像のパスです。デッキにコピーしません。
- 公開ページ（claude.ai の Artifact）は、ローカルを変えても自動では更新されません。ローカルの `design-system/project/` を正とします。
