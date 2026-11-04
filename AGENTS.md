# AGENTS.md

IoTLT などのライトニングトーク（LT）のスライドを、発表者（菅原のびすけ）のデザインで作るためのリポジトリです。AI エージェントは、ネタのメモ・記事・リポジトリ・写真を受け取り、1つの `deck.md`（Marp 形式）を書きます。そこからオンラインのデッキ、記事、PDF ができます。

## 最初に読むもの

- `design-system/project/README.md`：口調、デッキの構成、色と文字のルール。**スライドを書く前に必ず読みます。**
- `design-system/project/marp.md`：`deck.md` の書き方。
- `decks/sample_bbq/deck.md`：見本。
- `design-system/project/components/<部品名>/README.md`：Markdown で書けない図などの HTML。

## フォルダ構成

| パス | 内容 |
| --- | --- |
| `inbox/` | 発表者が画像やメモを入れるフォルダ。Git には入らない |
| `decks/<YYYYMMDD>_<短い英語名>/` | スライド置き場。`deck.md`、`images/`、`images.md`、`notes/`、書き出した PDF とサムネイル。PDF から取り込んだデッキだけは `index.html` と `deck.json` |
| `design-system/marp/theme.src.css` | Markdown の要素と見た目の対応。`iotlt.css` はここから生成されるので手で編集しない |
| `scripts/build-deck.mjs` | `deck.md` から確認用の `deck.html` を作る |
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

発表者が `inbox/` に素材を入れて「スライドを作って」と頼んだら、次の手順で最後まで進めます。Claude Code の `/lt-slides` も同じ流れです。公開とコミットは頼まれるまでしません。

1. **デッキを用意して取り込む。** 次のコマンドで `decks/<名前>/` を作ります。`inbox/` の画像は `images/` に、メモなどは `notes/` に入ります。あとから `inbox/` に足された分は、同じコマンドをもう一度実行すれば取り込めます。

   ```bash
   node scripts/new-deck.mjs <YYYYMMDD_英小文字の名前> --title "発表タイトル"
   ```

   番号は古いファイルから順に付き、一覧は `images.md` に出ます。HEIC は JPEG に変換し、長辺は2400pxまで縮め、JPEG と PNG の位置情報などのメタデータは消します。元のファイルは `inbox/_used/` に残ります。
2. **材料を読む。** `images.md` の画像を実際に開いて中身を確認し、`notes/` と渡されたものもすべて読みます。途中で質問せず下書きまで作り、次の4点のうち分からないものは「【要確認】」としてデッキに残して、最後にまとめて聞きます。
   - イベント名と日付（`20260419 #IoTLT vol134 in 潮風公園BBQ` の形で使う）
   - 何を作った・試したか、結果はどうだったか
   - つまずいた点、面白かった点
   - 自己紹介の最後の1行に入れる最近のネタ
3. **構成を決める。** 取り込んだ画像の内容も踏まえ、1枚1行で見出しを書き出します。5分なら15〜25枚が目安で、1枚に1つの話だけを載せます。見出しは項目名ではなく文にします。
4. **デッキを書く。** `deck.md` にスライドを書きます。先頭の `event` にイベント名を、`eventUrl` に connpass などのイベントページの URL を入れます。URL が渡されたらそのページを開き、イベント名と日付を確かめます。記事として読めるように、話す内容を発表者ノート（`<!-- -->`）に書きます。ノートも材料にある事実だけを書きます。
5. **画像を入れる。** `![](images/xxx.jpg)` で入れます。話に合わない画像は無理に使いません。足りないものは `lt-slot` にして、何を用意するかを書きます。
6. **書き出して確認する。** 下のコマンドで PDF を作り、全ページを見て、文字のはみ出し、タイトルの折り返し、画像との重なりを直します。ブラウザで `deck.html?overview` を開くと全スライドを一覧できます。
7. **報告する。** デッキと PDF のパス、使わなかった画像、残っている `lt-slot`、「【要確認】」の一覧を伝えます。

## 公開する

発表者が公開を頼んだデッキだけを公開します。`deck.md` の先頭は最初 `published: false` で、`false` のデッキはサイトに出ません。

1. 公開の前に、顔が写っている人、画面に映った個人情報や API キー、引用の許可を確認するよう発表者に伝えます。
2. `deck.md` の先頭を `published: true` にします（PDF から取り込んだデッキは `deck.json` の `"published": true`）。
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
| `https://n0bisuke.github.io/lt/<デッキ名>/` | 個別ページ（プレイヤー、PDF のダウンロード、記事） |
| `https://n0bisuke.github.io/lt/<デッキ名>/slides/` | スライド本体 |
| `https://n0bisuke.github.io/lt/<デッキ名>/<デッキ名>.pdf` | PDF |
| `https://n0bisuke.github.io/lt/all.json` | 一覧の API |

デッキ名がそのまま URL になるので、公開したあとは変えません。

**発表済みの PDF を載せるとき：** Keynote などで作った PDF は次のコマンドで取り込みます。各ページが画像のスライドになり、PDF はそのまま公開されます。`deck.json` に `"source": "pdf"` が入り、`export-pdf.sh` では上書きされません。手順は上の1、2、3（`build-site.mjs` のみ）、4と同じです。macOS でのみ動きます。

```bash
node scripts/import-pdf.mjs <PDFのパス> <YYYYMMDD_英小文字の名前> --title "発表タイトル" --event "イベント名" --event-url "https://iotlt.connpass.com/event/000000/"
```

**取り込んだ PDF の一部を隠すとき：** 次のコマンドで、そのページの画像と PDF の両方にモザイクをかけます。座標は 1920×1080 基準で、`x,y,幅,高さ` を複数指定できます。すでに push したものは履歴に残るので、必ず push の前に行います。

```bash
swift scripts/mosaic-page.swift decks/<デッキ名> <ページ番号> 24 x,y,w,h
```

**動画の注意：** MP4、MOV、WebM、WebP の位置情報は消せません。`new-deck.mjs` が注意を出したファイルを公開するときは、発表者に確認します。

## コマンド

```bash
scripts/export-pdf.sh decks/<デッキ名>
```

`tokens.css` を生成してから、`decks/<デッキ名>/<デッキ名>.pdf` を書き出します。Chrome、Chrome Dev、Brave のいずれかと Node.js が必要です。

```bash
node scripts/build-tokens.mjs
```

`tokens.json` か `bundle.css` か `marp/theme.src.css` を変えたあとに実行し、`tokens.css` と Marp のテーマ（`iotlt.css`）を更新します。`iotlt.css` はコミットします。リポジトリを取得した直後は `npm ci` も実行します。

```bash
node scripts/build-deck.mjs decks/<デッキ名>
```

`deck.md` から `deck.html` を作ります。ブラウザでの発表は、この `deck.html` を開いて ← → でページ送り、`f` で全画面です。

VS Code では Marp for VS Code 拡張を入れると、`deck.md` のプレビューで確認しながら直せます。テーマの設定は `.vscode/settings.json` に入っています。

## HTML の部品の選び方

Markdown で書けないときだけ使います。

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
- **CSS を足さない。** デッキには Markdown と部品のクラスだけを使います。`style` で指定するのは `lt-slot` と `Collage` の位置・大きさだけです。部品にない表現が必要なら発表者に相談します。
- **パスを直す。** 部品の README にあるアバターのパスは、デッキからは `../../design-system/project/assets/Logos/nobisuke-avatar.jpg` です。

## スライド一覧の API

他のサイトがスライド一覧を取得できるように、`build-site.mjs` が公開中のデッキを新しい順に並べた `all.json` をサイト直下に出力します。記事などをまとめる別リポジトリは、これをビルド時に取得する想定です。記事はスライドの `deck.md` から作るものだけを扱い、スライドと関係のない記事はこのリポジトリに置きません。

```json
{
  "version": 1,
  "decks": [
    {
      "id": "20260419_bbq",
      "title": "エッジAIで焼肉の焼き加減判定やってみた",
      "date": "2026-04-19",
      "event": "#IoTLT vol134 in 潮風公園BBQ",
      "eventUrl": "https://iotlt.connpass.com/event/000000/",
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
