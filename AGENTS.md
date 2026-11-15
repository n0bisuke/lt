# AGENTS.md

IoTLT などのライトニングトーク（LT）のスライドを、発表者（菅原のびすけ）のデザインで作るためのリポジトリです。AI エージェントは、ネタのメモ・記事・リポジトリ・写真を受け取り、1つの `deck.md`（Marp 形式）を書きます。そこからオンラインのデッキ、記事、PDF ができます。

## テーマを選ぶ

`deck.md` の先頭の `theme:` で見た目を選びます。一覧では、テーマに合わせて「LT」か「講演・セミナー」と表示されます（`all.json` の `kind` は `LT` か `講演` のまま）。

| テーマ | 使う場面 | 最初に読むもの | 見本 |
| --- | --- | --- | --- |
| `iotlt` | IoTLT などの5分前後の LT | `design-system/project/README.md`、`design-system/project/marp.md` | `decks/sample_bbq/deck.md` |
| `lecture` | 講演や研修など長めの話 | `design-system/lecture/README.md`、`ai-authoring.md`、`components.md`、`examples/<部品名>.md` | `decks/sample_lecture/deck.md` |

どちらか分からなければ発表者に聞きます。`lecture` のデッキは、部品の書き方と守ることを `design-system/lecture/` の文書に従い、変更したら `npm run check` を通します。記事のカードは `<!-- card: URL -->` と書いて `npm run cards` で展開します。

## 最初に読むもの（LT）

- `design-system/project/README.md`：口調、デッキの構成、色と文字のルール。**スライドを書く前に必ず読みます。**
- `design-system/project/marp.md`：`deck.md` の書き方。
- `decks/sample_bbq/deck.md`：見本。
- `design-system/project/components/<部品名>/README.md`：Markdown で書けない図などの HTML。

## フォルダ構成

| パス | 内容 |
| --- | --- |
| `inbox/` | 発表者が画像やメモを入れるフォルダ。Git には入らない |
| `decks/<YYYYMMDD>_<短い英語名>/` | スライド置き場。`deck.md`、`images/`、`notes/`。ローカル画像編集の調整値は `.lt-adjustments.json` に保存します。親 `deck.md` がメインで、追加の時間版だけ同じフォルダ内に `10min/` などの子フォルダとして置きます。PDF から取り込んだデッキだけは `index.html` と `deck.json` |
| `design-system/marp/theme.src.css` | Markdown の要素と見た目の対応。`iotlt.css` はここから生成されるので手で編集しない |
| `scripts/build-deck.mjs` | `deck.md` から確認用の `deck.html` を作る |
| `scripts/lecture/build-variants.mjs` | 1つの `deck.md` から時間別の版を生成する |
| `scripts/preview-deck.mjs` | スライドと記事をlocalhostで配信し、`deck.md` の保存で再ビルド・プレビュー更新する |
| `design-system/project/tokens.json` | 色・文字・余白の唯一の定義元 |
| `design-system/project/components/bundle.css` | 部品の配置 |
| `design-system/project/components/bundle.js` | ページ送りなどの実行コード |
| `design-system/tokens.css` | `tokens.json` から生成されるファイル。手で編集しない |
| `scripts/build-tokens.mjs` | `tokens.css` を生成する |
| `scripts/new-deck.mjs` | デッキを用意し、`inbox/` の中身を取り込む |
| `scripts/generate-qr.mjs` | URLから読み取りやすいPNG形式のQRコードを作る（`npm run qr -- <URL> <出力先.png>`） |
| `scripts/export-pdf.mjs` | Node.js / Playwright / Chromium で PDF とサムネイルを作る |
| `.github/workflows/pdf-export.yml` | PDF とサムネイルを Pages 公開と独立して生成する |
| `design-system/lecture/` | 講演テーマの色・寸法（`tokens.json`）、部品（`theme.src.css`）、文書、見本、フォント、画像 |
| `design-system/marp/lecture.css` | 講演テーマ。`build-tokens.mjs` が生成するので手で編集しない |
| `scripts/lecture/` | 講演テーマの検査（`npm run check`）とカードの展開（`npm run cards`） |
| `scripts/lecture/build-variants.mjs` | 親 `deck.md` から版別デッキを生成する。既存版に差分があるときは手編集として保持し、明示的な `--force` のときだけ上書きする |
| `logs/` | 修正の原因・対応・確認結果を日付付きで記録する |
| `.agents/skills/lt-slides/SKILL.md` | Codex用のLT作成スキル。Claude Code用の `.claude/skills/lt-slides/SKILL.md` と同じ手順を保つ |
| `.agents/skills/qr-code-generator/SKILL.md` | URLからPNG形式のQRコードを作るCodexスキル。Claude Code用の `.claude/skills/qr-code-generator/SKILL.md` と同じ手順を保つ |
| `.claude/skills/annotate-screenshot/` | [protoout/teachers-agent-skills](https://github.com/protoout/teachers-agent-skills) から入れた、スクショへの注釈付けと Gyazo へのアップロード（`scripts/upload-gyazo.mjs`）。トークンは `.env` の `GYAZO_ACCESS_TOKEN` で、値は読まず表示もしない。アップロードは1枚ずつ発表者に確認してから行う。初回は `npm ci --prefix .claude/skills/annotate-screenshot` |
| `.agents/skills/lt-slides/SKILL.md` | Codex用のLT作成スキル。Claude Code用の `.claude/skills/lt-slides/SKILL.md` と同じ手順を保つ |
| `site.json` | 公開先の URL（`all.json` と個別ページの絶対 URL に使う） |
| `scripts/fetch-external.mjs` | Speaker Deck と Qiita のスライド情報を `external.json` に保存する（`npm run fetch-external`、数分かかる）。`npm run deploy` では Speaker Deck だけを更新する。SlideShare はボット対策で取得できないので、`external.json` に手で書いた分を残す |
| `external.json` | 一覧に載せる外部スライド。リンク先は各サービスの個別ページで、サムネイルも各サービスの URL を使う |
| `scripts/build-site.mjs` | 公開するデッキだけを `dist/` に集める |
| `.github/workflows/pages.yml` | `main` への push で `dist/` を GitHub Pages に公開する |

## スライドの作り方

発表者とチャットで話しながら、次の手順で作ります。`inbox/` の素材はあってもなくても始められます。Claude Code の `/lt-slides` も同じ流れです。公開とコミットは頼まれるまでしません。

**ブラウザーを使うとき：** Webページの閲覧やスライドのプレビュー確認には Codex 内蔵ブラウザーを使います。ホスト側の Chrome / Chrome Dev / Brave は使いません。PDF とサムネイルは Playwright が管理する Chromium で生成します。

1. **デッキを用意して取り込む。** 次のコマンドで `decks/<名前>/` を作ります。`inbox/` の画像は `images/` に、メモなどは `notes/` に入ります。あとから `inbox/` に足された分は、同じコマンドをもう一度実行すれば取り込めます。

   ```bash
   node scripts/new-deck.mjs <YYYYMMDD_英小文字の名前> --title "発表タイトル"
   ```

   番号は古いファイルから順に付き、一覧は `images.md` に出ます。HEIC は JPEG に変換し、長辺は2400pxまで縮め、JPEG と PNG の位置情報などのメタデータは消します。元のファイルは `inbox/_used/` に残ります。
2. **材料を読む。** `images.md` の画像を実際に開いて中身を確認し、`notes/` と渡されたものもすべて読みます。次の4点のうち分からないものを、1回に1つずつ発表者に聞きます。その場で分からないものは「【要確認】」としてデッキに残します。
   - イベント名と日付（`20260419 #IoTLT vol134 in 潮風公園BBQ` の形で使う）
   - 何を作った・試したか、結果はどうだったか
   - つまずいた点、面白かった点
   - 自己紹介の最後の1行に入れる最近のネタ
3. **構成を決める。** 取り込んだ画像の内容も踏まえ、1枚1行で見出しを書き出して、発表者と相談します。5分なら15〜25枚が目安で、1枚に1つの話だけを載せます。見出しは項目名ではなく文にします。
4. **デッキを書く。** `deck.md` にスライドを書きます。先頭の `event` にイベント名を、`eventUrl` に connpass などのイベントページの URL を入れます。URL が渡されたらそのページを開き、イベント名と日付を確かめます。記事として読めるように、話す内容を発表者ノート（`<!-- -->`）に書きます。ノートも材料にある事実だけを書きます。
5. **画像を入れる。** `![](images/xxx.jpg)` で入れます。話に合わない画像は無理に使いません。足りないものは `lt-slot` にして、何を用意するかを書きます。
6. **書き出して確認する。** ローカルの確認には `npm run deck -- decks` でプレビューを開きます。PDF が必要なときだけ `npm run export-pdf` で作成できます。
7. **報告する。** デッキと PDF のパス、使わなかった画像、残っている `lt-slot`、「【要確認】」の一覧を伝えます。

## 公開する

発表者が公開を頼んだデッキだけを公開します。`deck.md` の先頭は最初 `published: false` で、`false` のデッキはサイトに出ません。

1. 公開の前に、顔が写っている人、画面に映った個人情報や API キー、引用の許可を確認するよう発表者に伝えます。
2. `deck.md` の先頭を `published: true` にします（PDF から取り込んだデッキは `deck.json` の `"published": true`）。
3. サイトを組み立てて内容を検証します。Pages 公開の Actions は PDF を生成せず、PDF の生成結果にも依存しません。PDF とサムネイルは別の `Export slide PDFs` Actions が変更されたデッキだけを生成し、Actions artifact に保存します。PDF がなくてもスライドの公開は進みます。`lt-slot` か「【要確認】」が残っている、画像が見つからない場合はエラーで止まります。

   ```bash
   npm run export-pdf
   ```

   ```bash
   node scripts/build-site.mjs --move-unused
   ```

   `--move-unused` は、スライドで使っていない画像を `unused/` に移します。`unused/` と `notes/` はコミットされません。
4. コミットして push します。

   ```bash
   npm run deploy -- "コミットメッセージ"
   ```

   サイトを組み立て直してエラーがなければ、`git add`、`commit`、`push` まで行います。`decks/` は `published: true` のデッキだけを add し、削除した公開デッキも削除としてコミットします。公開リポジトリでは、コミットした内容はすべて誰でも読めるので、`git add .` や `git add decks` を直接使いません。`npm run deploy -- --dry-run` で、コミットされるファイルを先に確認できます。

PDF とサムネイルは `.github/workflows/pdf-export.yml` が Playwright / Chromium で生成し、Actions artifact として14日間保存します。この処理は Pages 公開と独立しており、PDF 出力に失敗してもスライド公開は止まりません。Pages にはリポジトリに存在する PDF とサムネイルだけを含めます。手元で PDF を作る場合は `npm run export-pdf` を使い、初回だけ `npm exec playwright install chromium` を実行します。Homebrew、WeasyPrint、Poppler は使いません。

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

後方互換用のコマンドです。`npm run export-pdf` と同じく、Playwright / Chromium を使って PDF とサムネイルを書き出します。

```bash
node scripts/build-tokens.mjs
```

`tokens.json` か `bundle.css` か `marp/theme.src.css`、または `lecture/` の `tokens.json` か `theme.src.css` を変えたあとに実行し、`tokens.css` と Marp のテーマ（`iotlt.css`、`lecture.css`）を更新します。テーマの CSS はコミットします。リポジトリを取得した直後は `npm ci` も実行します。

URLからQRコード画像を作るときは、次を使います。URLの内容は書き換えず、PNGは指定した出力先に保存します。

```bash
npm run qr -- "https://example.com" decks/<デッキ名>/images/example-qr.png
```

```bash
node scripts/build-deck.mjs decks/<デッキ名>
```

`deck.md` から `deck.html` を作ります。ブラウザでの発表は、この `deck.html` を開いて ← → でページ送り、`f` で全画面です。

版別デッキを親 `deck.md` から作り直す場合は `npm run variants -- decks/<デッキ名>` を使います。既存の版別 `deck.md` に手編集がある場合は保持されます。内容を意図して上書きするときだけ `npm run variants -- decks/<デッキ名> --force` を使います。

編集しながら確認する場合は `npm run deck -- decks` を使います。表示された localhost の URL を組み込みブラウザで開くと、スライドと記事を選べます。`deck.md` を保存すると、時間別版と記事を再ビルドし、プレビューを自動更新します。終了は `Ctrl+C` です。

プレビュー左下の小さなタイマーで発表時間を計測できます。再生・一時停止・リセットができ、スライドを移動したりプレビューを再読み込みしたりしても計測状態を保ちます。画像を微調整するには、プレビュー右下の「画像を編集」を押します。画像をドラッグして移動し、右下の丸をドラッグして縦横比を保ったままサイズを変更できます。変更はデッキの `.lt-adjustments.json` に保存され、リセットできます。サイトを再生成するときも調整が反映されます。

複数時間版の元データは親フォルダの `deck.md` です。親デッキがメインのページです。スライドの先頭に `<!-- only: 10min -->` のように書くと、そのスライドを子版だけに載せられます。指定がないスライドは全版に載ります。front matter の `variantNames: 10min` に含めた版だけを子フォルダに生成し、既存の除外版フォルダは手編集を守るため削除しません。`npm run deck -- decks` は親デッキをプレビューし、時間別の子デッキを一覧・再ビルドしません。`npm run deploy` は親デッキと設定済みの子版を公開します。

```bash
npm run variants -- decks/<デッキ名>
```

生成版を含むデッキ一覧をローカルで配信します。起動後に表示される URL を Codex 内蔵ブラウザーで開きます。ホスト側ブラウザーは起動しません。終了は `Ctrl+C` です。

```bash
npm run deck -- decks
```

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
| 発表の最後に要点を箇条書きで整理 | lecture テーマの `summary` |
| 短い言葉を中央に数行 | `Stack` |
| `=>` の比較や左揃えの説明 | `Lines` |
| 製品紹介（画像＋箇条書き） | `MediaSplit` |
| 画像1枚＋補足 / 全面の写真 / 重ねた画像 / デモ | `Screenshot` / `FullPhoto` / `Collage` / `Demo` |
| コード / コードと説明・結果 | `CodeBlock` / `CodePair` |
| 文字と↓の処理の流れ / 機器とクラウドの図 / 表 | `Flow` / `Diagram` / `DataTable` |
| 文中の強調 / 画像の差し込み待ち | `Emphasis` / `Slot` |

`components/Cover/` はデザインシステムのページの表紙で、スライドの部品ではありません。

## 守ること

- **修正を記録する。** デザインシステムや生成処理の不具合を直したら `logs/YYYY-MM-DD.md` に原因、対応、確認結果を追記します。既存の記録を消したり置き換えたりしません。
- **発表者の手作業を最優先する。** `deck.md` や画像などに発表者が直接加えた変更は重要な成果物として扱い、生成・同期スクリプトやエージェントの編集で上書きしません。編集前に `git diff` と現在のファイルを確認し、必要な箇所だけを小さく変更します。生成物と手編集が競合したら手編集を残し、勝手に `--force` や全面書き換えをしません。VS Code の「ファイルの内容が新しい」通知では Compare を使い、Overwrite は選ばず、差分を保全してから作業します。
- **スライド消失時の確認:** 発表者が「消えた」「違う」と言ったスライドは、元デッキと対応する時間別デッキの該当部分を照合します。Markdown の `---` が本文の前にあり、`only` と `_class` がそのスライドに適用されているかを見て、生成 HTML のスライド境界・クラス・枚数まで確認します。本文がファイル内にあるだけで完了と判断しません。
- **元デッキと時間別デッキの同期:** 編集前に対象ファイルと `git diff` を確認し、元デッキにない手編集を時間別デッキで見つけたら、まずその手編集を保全して元デッキへ取り込みます。同期や生成で発表者の内容を消さないよう、差分を確かめてから実行します。
- **事実を作らない。** 発表者が試していない結果、数値、デモ、感想を書きません。分からなければ `lt-slot` か「【要確認】」にします。
- **画像を作らない。** 製品ロゴや写真を描き起こしたり、それらしい画像で埋めたりしません。生成画像は発表者が頼んだときだけ使います。
- **言葉を整えすぎない。** 発表者の短い話し言葉をそのまま使います。
- **クレジットを書く。** 他の人が撮った写真には撮影者を、引用には出典を書きます。
- **CSS を足さない。** デッキには Markdown と部品のクラスだけを使います。`style` で指定するのは `lt-slot` と `Collage` の位置・大きさだけです。部品にない表現が必要なら発表者に相談します。
- **パスを直す。** 部品の README にあるアバターのパスは、デッキからは `../../design-system/project/assets/Logos/nobisuke-avatar.jpg` です。

## issue で管理する

リポジトリの機能追加とバグは、GitHub の issue（https://github.com/n0bisuke/lt/issues）で管理します。

- **作業の前に確かめる。** 頼まれた作業に関係する issue を `gh issue list -R n0bisuke/lt` で探し、あればその内容に沿って進めます。
- **見つけたら登録する。** 作業中に見つけたバグや、あとでやる機能は、その場で直さないものを issue にします。同じものがないか先に検索します。
- **ラベルを付ける。** バグは `bug`、機能は `enhancement`、文書は `documentation`、発表者が決めることは `question` です。
- **本文に書くこと。** 何が起きるか（バグなら再現の手順）、対応案、完了の条件を短く書きます。
- **公開されることを忘れない。** このリポジトリは公開なので、issue も誰でも読めます。トークン、個人情報、非公開の講座や資料の内容、まだ消せていない情報の場所は書きません。そうした件は発表者に直接伝えます。
- **コミットと結びつける。** 直したコミットのメッセージに `Fixes #番号` を書くと、push したときに issue が閉じます。コミットしないで済んだ件は、理由を書いて閉じます。
- **スライドの中身は issue にしない。** デッキの【要確認】や `lt-slot` は、これまでどおりデッキの中で管理します。

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

各デッキには `kind`（`LT` か `講演`）も入ります。Speaker Deck、Qiita、SlideShare のスライドは、同じ `all.json` の `external` に `source`、`title`、`date`、`url`、`thumbnail` の形で入ります。

項目の追加は `version` を変えずに行えます。項目の削除や意味の変更は、取得側が壊れるので `version` を上げます。

## デザインシステムを変えるとき

- 値は `tokens.json` だけで変え、`bundle.css` には配置だけを書きます。
- 部品を変えたら、その部品の `README.md` と `preview.html` も揃え、`decks/sample_bbq` を書き出して崩れていないか確かめます。
- `preview.html` の `/_blob/...` は公開ページでだけ読める画像のパスです。デッキにコピーしません。
- 公開ページ（claude.ai の Artifact）は、ローカルを変えても自動では更新されません。ローカルの `design-system/project/` を正とします。
