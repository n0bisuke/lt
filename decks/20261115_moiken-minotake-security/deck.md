---
marp: true
theme: lecture
paginate: true
title: 医療者もガンガン作ろう！作って試す時代の身の丈セキュリティ
date: 2026-11-15
event: "第2回 ものづくり医療研究会"
eventUrl: "https://moiken02.vercel.app/"
published: true
variants: true
variantNames: 15min

---

<!-- _class: title-slide -->

# 医療者もガンガン作ろう！<br>作って試す時代の身の丈セキュリティ

第2回 ものづくり医療研究会

2026/11/15（日）13:45〜 ふれあい貸し会議室 秋葉原No53

<div class="gl-author"><img src="../../design-system/project/assets/Logos/nobisuke-avatar.jpg" alt=""><p>菅原のびすけ<br>@n0bisuke</p></div>

---

<!-- _class: speaker-profile -->

![avatar](../../design-system/project/assets/Logos/nobisuke-avatar.jpg)

## 菅原のびすけ

- プロトタイピングスクール「プロトアウトスタジオ」
- デジタルハリウッド大学大学院 非常勤講師
  - プロダクトプロトタイピング
- ソフトウェアエンジニア出身

個人活動

- IoTLT 主催
- Developers Summit 2025 ベストスピーカー 1位
- LINE API Expert / Microsoft MVP / IBM Champion

---
<!-- _class: current-topic -->
<!-- _footer: 1. 医療者が作れる時代と、現場で起きたこと -->


<!-- only: 15min -->

## 医療者がAIでアプリを作れる時代です

### AIで色々作れますね

- 受付・順番待ちシステム
- 問診フォーム
- 院内の業務改善アプリ

などなど

<!-- 生成AIでいろいろ作れる時代になってきました。医療者は現場のことを分かっているから、自分で作れる。これがすごくいいことだと思うんですよね。もっともっと作って、インチキ開発会社を駆逐していってほしいです。 -->

---

<!-- _class: source-cards current-topic -->
<!-- _footer: 1. 医療者が作れる時代と、現場で起きたこと -->

## 医療者は、現場の困りごとから作っている

<div class="gl-cards gl-cards--2">
<article class="gl-source"><img class="gl-source__screenshot" src="images/cards/d6a77accf72b.webp" alt="投稿で紹介された受付・呼出し画面"><strong class="t-body">院内LANで使う呼び出しシステム</strong><p class="t-sub">産院の院長がChatGPTに相談しながら作成。投稿では実際の呼出し画面を紹介しています。</p><small class="t-note"><a href="https://x.com/A_Mochizuki/status/2111079943400808872">産院のいんちょ / X / 2026年10月16日</a></small></article>
<article class="gl-source"><img class="gl-source__screenshot" src="images/cards/moicen-graduate-outpatient-tools-note.webp" alt="もいせん受講生による外来効率化ツールのnote記事"><strong class="t-body">外来の前・中・後を助ける3つのツール</strong><p class="t-sub">もいせん受講生の整形外科医が、LINE問診・カルテ音声入力・LINEセルフケア案内を制作。</p><small class="t-note"><a href="https://note.com/dr_grid/n/nb44daadafdbf">Drグリッド / note / 2026年7月8日</a></small></article>
</div>

<!-- 医セン界隈でも、自分で作る人が出てきています。産院の先生が受付・順番待ちのシステムを作った例や、もいせん受講生が外来で使うツールを作った例があります。 -->

---

<!-- only: 15min -->

<!-- _class: link-cards current-topic -->
<!-- _footer: 1. 医療者が作れる時代と、現場で起きたこと -->

## サイバー攻撃や情報漏えいが続き、世の中も敏感に

<!-- card: https://www.watch.impress.co.jp/docs/news/2144279.html -->
<article class="gl-linkcard" data-card="https://www.watch.impress.co.jp/docs/news/2144279.html"><img src="images/cards/17db2682d23f.webp" alt=""><strong class="t-sub"><a href="https://www.watch.impress.co.jp/docs/news/2144279.html">タイムズカーの情報漏洩、免許証など本人確認書類流出は160万件</a></strong><small class="t-note gl-muted">Impress Watch / 2026-09-29</small></article>
<article class="gl-linkcard"><img src="images/monex-security-site.webp" alt="マネックス証券公式サイトの画面"><strong class="t-sub"><a href="https://newsdig.tbs.co.jp/articles/-/3086013">マネックス証券で不正アクセス被害　本人確認の画像データ1592件漏えいの可能性</a></strong><small class="t-note gl-muted">TBS NEWS DIG / 2026-11-14</small></article>

<!-- タイムズカーやマネックス証券でも情報漏えいが話題になりました。こうした事例が続き、世の中もかなり敏感になっています。現場で作ったシステムにも「セキュリティ大丈夫？」という声が来る。次に、その作られた背景を見ます。出典: Impress Watch https://www.watch.impress.co.jp/docs/news/2144279.html、TBS NEWS DIG https://newsdig.tbs.co.jp/articles/-/3086013 -->

---

<!-- only: 15min -->

## 作る人へのヤジも、情報漏えいへの不安もある

<!-- _class: text-image current-topic -->
<!-- _footer: 1. 医療者が作れる時代と、現場で起きたこと -->

![Xで寄せられた懸念（投稿者情報はモザイク）](images/x-replies-mosaicked.webp)

<!-- 患者さんの情報が漏れたら怖い、という心配はあります。実際に作っている人に「大丈夫なの？」という声が向けられることもあります。 -->

---

<!-- only: 15min -->

## 背景を知らないまま、ヤジが飛んでくることもある

<!-- _class: text-image current-topic -->
<!-- _footer: 1. 医療者が作れる時代と、現場で起きたこと -->

![投稿者情報をモザイクしたXの返信](images/x-heckle-mosaicked.webp)

<!-- 作った背景を知らないまま、やいやい言われることもある。ちょっと悲しいですよね。セキュリティへの心配は大事です。でも、作るのをやめるのではなく、気をつけながら作っていきたいです。 -->

---

<!-- only: 15min -->

## 作った背景には、現場の事情がある

<!-- _class: text-image current-topic -->
<!-- _footer: 1. 医療者が作れる時代と、現場で起きたこと -->

![院内システム停止を受けて作った経緯を説明する投稿](images/x-clinic-context.webp)

<!-- この先生は、既存サービスへの不正アクセスで院内システムが止まって、呼び出しシステムが使えなくなった。そこで自分で作ったんですよね。作ったものだけでは分からない現場の事情があります。 -->

---

<!-- _class: key-message current-topic -->
<!-- _footer: 1. 医療者が作れる時代と、現場で起きたこと -->

## 今日のメッセージ

- セキュリティを意識して、もっと作って試そう。
- 作ったものと、**設計の工夫を発信しよう。**

<!-- 作るのを止める話ではなくて、セキュリティを意識して作って試す。その上で、作ったものだけじゃなく、どういう設計にしたかも話していきたいです。 -->

---
<!-- only: 15min -->
<!-- _class: qr-prompt current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い -->

## 脱線: まずは意識アンケート

![アンケートフォームを開くQRコード](images/interim-survey-qr.webp)

※アンケートにご協力ください

<!-- いったんこちらのアンケートにご協力ください。QRコードのリンク先: https://forms.gle/JNruY64qJqXuh2W58 -->


---

<!-- only: 15min -->

<!-- _class: agenda overview -->

## 今日の流れ

1. 医療者でも作れる時代、漏洩問題
2. 使う人・作る人ができる情報の扱い
3. 管理する人が整える、安全に試せる場
4. 作って試し、設計の工夫を発信する
5. 結局、教育説

<!-- 今回は作る人向けが中心ですが、使う側と管理する側の話もします。使う人、作る人、管理する人の順で見ていきます。 -->

---
<!-- only: 15min -->
<!-- _class: key-message current-topic stage -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い -->

## 前提

**もう、データは漏れる前提で考えましょう**

<!-- どこかに渡したデータは漏れるものだと思っておく。漏れないことを前提にするのではなく、使う前から情報を減らして、必要なものだけ扱います。 -->

---

<!-- _class: current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い -->


<!-- only: 15min -->

## 作る人を中心に、3つの立場で考える

- 使う人 => 渡す情報を選ぶ
- 作る人 => 集める情報と保存先を考える
- 管理する人 => 安全に試せる場を作る

<!-- 作る人の話を中心にします。まず利用者として情報を渡す時のこと、そのあと作る時の設計、最後に管理する側の環境づくりです。 -->

---


<!-- only: 15min -->
<!-- _class: media-split current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 使う側編 -->

## 使う側: 必要以上に情報を渡さない

- 必要以上に情報を登録しない
  - 任意の項目は、必要なければ埋めない
- メール：エイリアス / 電話：IP電話
- 住所とかも正直に書く必要はあるか？


![入力前に立ち止まり、渡す情報を考えるイラスト](images/personal-info-hesitate-illustration.webp)

<!-- どこかのシステムに渡したデータは、漏れるものだと思っていた方がいい。メールや電話番号はエイリアスにできないか。住所や生年月日も「これ本当に必要？」と考えます。僕は必要ないと思ったものは、適当に書くこともあります。 -->

---
<!-- _class: diagram current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 使う側編 -->


<!-- only: 15min -->

![登録先ごとにメールアドレスを分ける](images/alias-email-flow.svg)

<!-- メールエイリアスを使うと、登録先ごとに別のメールアドレスを使いながら、受信は自分のメールにまとめられます。 -->

---
<!-- _class: diagram current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 使う側編 -->


<!-- only: 15min -->

![登録先Aで漏えいした場合](images/alias-email-flow-leaked.svg)

<!-- Aで使った専用アドレスが漏れても、B/C用のアドレスや本来のメールとは分かれているので、他への影響を抑えやすくなります。パスワードの使い回しなど、別の情報まで保護するものではありません。 -->

---
<!-- only: 15min -->
<!-- _class: source-cards current-topic panel -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 使う側編 -->

## 補足: エイリアスメールサービス

<div class="gl-cards gl-cards--3">
<article class="gl-source"><img class="gl-source__screenshot" src="images/cards/brave-email-alias.webp" alt="Braveメールエイリアスの設定画面"><strong class="t-body">Brave メールエイリアス</strong><p class="t-sub">別アドレスを作り、Braveアカウントのメールに転送。</p><small class="t-note"><a href="https://support.brave.app/hc/ja/articles/45530506862349-メールエイリアスの使い方">Brave公式ヘルプ</a></small></article>
<article class="gl-source"><img class="gl-source__screenshot" src="images/cards/1password-fastmail-masked-email.webp" alt="1PasswordからFastmailのMasked Emailを作る画面"><strong class="t-body">1Password + Fastmail</strong><p class="t-sub">登録先ごとのMasked Email。Fastmail連携が必要。</p><small class="t-note"><a href="https://support.1password.com/fastmail/">1Password公式ガイド</a></small></article>
<article class="gl-source"><img class="gl-source__screenshot" src="images/cards/apple-hide-my-email.webp" alt="Appleでサインイン時にメールを非公開にする画面"><strong class="t-body">Appleでサインイン</strong><p class="t-sub">対応サービスで「メールを非公開」を選び、専用アドレスに転送。</p><small class="t-note"><a href="https://support.apple.com/ja-jp/102379">Apple公式サポート</a></small></article>
</div>

<!-- どれも登録先に個人のメールアドレスを直接渡さずに済む方法です。1PasswordはFastmailとの連携が必要で、Appleの「メールを非公開」は対応サービスでAppleでサインインする時に使えます。エイリアスで本人が完全に匿名になるわけではありません。 -->

---

<!-- only: 15min -->
<!-- _class: media-split current-topic panel -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 使う側編 -->

## 補足: 本名も電話番号もエイリアスで

- 電話番号：IP電話サービスを持っておこう
- 名前：イニシャルでよい場合は、そうしましょう

![JRE MALLの会員画面と、イニシャルで登録した会員情報のスクリーンショット](images/jre-mall-screenshots-paired.svg)

<!-- 電話番号を登録するときは、IP電話サービスを持っておく。名前も本名でなくてよい場合は、イニシャルで登録する。JRE MALLの画面では、表示名と氏名をイニシャルにしています。こういう工夫も使う側でできることです。 -->

---
<!-- only: 15min -->

<!-- _class: media-split current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 使う側編 -->

## 情報、もう一度聞かれていませんか？

- 病院の問診票：マイナ連携後も住所・生年月日
- ホテル受付：予約済みなのに、住所を再記入
- 「本当に必要？」と立ち止まる

![問診票を手書きする待合室と、ホテルのチェックイン風景](images/hospital-hotel-questionnaire-illustration.webp)

<!-- 病院で問診票を書いた時、マイナンバーカードで連携しているのに紙にも住所や生年月日を書く。ホテルも予約の時に情報を入れているのに、チェックインで住所を書く。落とし物があれば電話で連絡してもらえばいいんじゃないか、と思うんですよね。 -->
---
<!-- _class: media-split current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->

![病院の問診フォーム（施設名は画像内に表示なし）](images/hospital-form-required-fields.webp)

<!-- フォームで必要のない情報まで必須にするのはタチが悪いと思います。任意にできるなら使う人に判断を委ねる。そもそも集めなくていい情報はないか、考えたいです。 -->

## 作る側の話: その情報は必須かどうかを考える

- 必要のない情報を必須にしない
- 任意にして、使う人に判断を委ねる
- そもそも、もらわなくていい情報はないか






---
<!-- _class: media-split current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->

## フォームは、必要な項目だけにする

- 何十代か知りたい => 年代だけ
- どの地域か知りたい => 都道府県や市区町村まで
- 生年月日や住所全部は聞かない
- 持つ情報が減る => 守る情報も減る


![不要な項目を減らしたフォームのイラスト](images/minimal-form-illustration.webp)

<!-- マーケティングで何十代が多いか知りたいなら、生年月日ではなく年代だけでいい。どの地域の人が使っているか知りたいなら、都道府県や市区町村まででいい。生年月日や住所を全部もらう必要はないですよね。 -->

---
<!-- _class: current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->


<!-- only: 15min -->

## 画面に出す名前は、本名である必要がある？

- 表示名と本人確認の情報を分ける
  - 例: シフト管理：表示名「のびすけ」でも識別できる？
- 患者さんの識別とは混同しない

<!-- 勤怠システムなら、病院の中で誰か分かればいい。僕は「のびすけ」というビジネスネームを使っています。本名の漢字まで出さなくてもいいかもしれない。昔の「忌み名」のように、本当の名前を隠す考え方もありますよね。 -->

---
<!-- only: 15min -->
<!-- _class: source-cards current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->

## 事例： 企業も、持つ情報を減らし始めている

<div class="gl-cards gl-cards--2">
<article class="gl-source"><strong class="t-body">ゆで太郎</strong><p class="t-sub">バースデークラブを終了。最後のクーポン発送後、会員情報を消去へ。</p><small class="t-note"><a href="https://yudetaro.jp/バースデークラブ終了のお知らせ/">ゆで太郎システム / 2026年10月28日</a></small></article>
<article class="gl-source"><strong class="t-body">焼肉きんぐ</strong><p class="t-sub">漏えい後、公式アプリで保持する個人情報を削減し、新システムへ移行へ。</p><small class="t-note"><a href="https://www.yakiniku-king.jp/news/6877">物語コーポレーション / 2026年10月20日</a></small></article>
</div>
<p class="gl-foot t-body">守るだけでなく、そもそも集めない選択。</p>
<small class="t-note">参考: <a href="https://morasaretter.suke.dev/articles/2026-11-companies-holding-less-data/">漏らされったー / 2026年11月9日</a></small>

<!-- 企業も、集める情報を減らす動きを始めています。ゆで太郎はバースデークラブを終了し、最後のクーポン発送後に会員情報を消去する予定。焼肉きんぐはアプリの会員管理システムで漏えいが発生したあと、公式アプリで保持する個人情報を削減し、新システムへ移行する方針を公表しました。どちらも、持つ情報を減らす考え方の例です。 -->

---
<!-- _class: current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->


<!-- only: 15min -->
<!-- _class: media-split current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->

## 認証に必要な情報も、減らせるか考える

- 作る側も、そもそも情報を持たない
- （例）setlog
  - サービススタート時から認証は **パスキー** だけ
    - その後Apple ID認証も（エイリアスメール）
  - **メールアドレスもパスワードも集めない設計**

![setlogの登録画面。パスキーで登録する選択肢がある](images/setlog-passkey-screen.webp)

<p class="t-note"><a href="https://ichioshi.allabout.co.jp/articles/common/40155">イチオシ / 2026年8月12日</a></p>

<!-- パスキーを使うと、サービス側がメールアドレスを持たない作り方もできます。最近見たsetlogはパスキーだけで、サービス側がメールアドレスを持たない。攻めてるなと思いました。Appleアカウントでの認証も、元のメールアドレスではなくエイリアスメールを渡す仕組みです。 -->

---
<!-- only: 15min -->
<!-- _class: panel current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->

## 選択肢としてパスキーを覚えておこう

※パスキーをホテルのカードキーにたとえると

![スマホ認証を使うホテルカードキーのイメージ](images/passkey-hotel-card-key.webp)

<!-- ホテルのカードキーのように、サービスごとの鍵を持ち、スマホで本人確認して使うイメージです。たとえはイメージで、実際には端末やパスキーマネージャーが新しいチャレンジに暗号署名し、サービスが公開鍵で検証します。秘密鍵はログイン先サービスへ送られません。パスキーは登録したサイトの識別情報に結びつき、フィッシングに強い設計です。ただし、端末やパスキーマネージャーの保護、同期、アカウント復旧は別途重要です。パスキーだけでサービス全体が安全になるわけではありません。参考: FIDO Alliance https://fidoalliance.org/passkeys/、W3C Web Authentication Level 3 https://www.w3.org/TR/webauthn-3/、Google for Developers https://developers.google.com/identity/passkeys。 -->
---
<!-- _class: media-split current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->

## 保存する情報と期間を決めておく

- そもそも保存しない
- 病院の例：1年以上利用がなければ削除
- 便利だから、で残し続けない


![保存期限を決めて不要な情報を整理するイラスト](images/data-retention-period-illustration.webp)

<!-- 集めないのが一番ですが、必要な情報を集めるなら、規約で説明して、いつ消すか決めておく。たとえば病院で1年以上利用がなければ消す、というやり方もありそうです。実際のルールは確認が必要ですが、ずっと残しておくと攻撃された時に漏れる情報も増えます。 -->
---
<!-- _class: current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->


<!-- only: 15min -->

<!-- _class: media-split current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->

## データベースと閲覧権限を分ける

- データベースA：通院日・簡単な記録・支払い（受付も見る）
- データベースB：住所・生年月日（限られた管理者が見る）
- 誰にどの情報が必要？

![日々の記録と限られた人だけが見る情報を分けて保管するイラスト](images/db-access-separation-illustration.webp)

<!-- 通院記録や、何月何日に来て何をしたか、支払いの情報は受付の人も見られる。一方で、住所や生年月日は限られた管理者しか見られないようにする。医師も全員が住所や生年月日まで見る必要があるのか。年齢は診療に必要かもしれないけれど、本人確認のやり方も含めて考えたいです。 -->

---
<!-- _class: current-topic -->
<!-- _footer: 2. 使う人・作る人ができる情報の扱い > 作る側編 -->


<!-- only: 15min -->

## 蛇足: 本人確認の情報は、伝え方も考えたい

- 僕の入院時の某病院例
  - 骨折の手術後、受付で名前と生年月日を口頭確認
  - 待合の人にも聞こえるかもしれない
  - 本人確認の必要性はあるが...

<!-- 僕は骨を折って日本大学で手術した時に、受付で毎回名前と生年月日を言わされました。横で聞いている人がいたら怖いですよね。その情報でできてしまうこともあるので、誰が必要なのか、どう伝えるのかを考えたいです。 -->

---
<!-- _footer: 3. 管理する人が整える、安全に試せる場 > 管理者編 -->


<!-- _class: source-cards current-topic stage -->

## 情報管理は、システムの外にも続く

<div class="gl-cards gl-cards--2">
<article class="gl-source"><img class="gl-source__screenshot" src="images/missing-paper-records-illustration.webp" alt="紙の記録が所在不明になった事案のイメージ"><strong class="t-body">紙の記録が621人分、所在不明に</strong><p class="t-sub">静岡県立学校6校で生徒指導要録を紛失。外部流出は確認されていません。</p><small class="t-note"><a href="https://look.satv.co.jp/content_news/incident/99223">静岡朝日テレビ / 2026年9月29日</a></small></article>
<article class="gl-source"><img class="gl-source__screenshot" src="images/support-scam-illustration.webp" alt="サポート詐欺で個人PCが遠隔操作された事案のイメージ"><strong class="t-body">個人PCがサポート詐欺被害に</strong><p class="t-sub">看護師の個人PCが遠隔操作され、保存されていた患者情報1,365件が漏えいした可能性。</p><small class="t-note"><a href="https://internet.watch.impress.co.jp/docs/news/2114633.html">INTERNET Watch / 2026年6月5日</a></small></article>
</div>

<!-- 漏えいと一言でいっても、静岡県の事案では紙の記録が所在不明になり、外部流出は確認されていません。藤田医科大学病院の事案では、院内規程に反して患者情報を保存していた看護師の個人PCがサポート詐欺で遠隔操作され、情報が漏えいした可能性があります。情報を守る範囲は、病院のシステム内だけではありません。イラストは事案を説明するための生成画像で、実際の現場写真ではありません。出典: 静岡朝日テレビ https://look.satv.co.jp/content_news/incident/99223、INTERNET Watch https://internet.watch.impress.co.jp/docs/news/2114633.html -->

---
<!-- _class: media-split current-topic -->
<!-- _footer: 3. 管理する人が整える、安全に試せる場 > 管理者編 -->


<!-- only: 15min -->

## 情報もサービスも日々、変わっていく

- AIサービスの契約や設定
- アプリの機能や公開方法
- 新しい脆弱性や事故事例
  - 2週間前は対応が重なって疲弊していた...

![PHPに深刻な脆弱性2件を伝える記事のビジュアル](images/php2shell-vulnerability-card.webp)

<!-- 新しい脆弱性やインシデントの話を追いかけないといけない。毎日のように出てきて、僕も2週間前は対応が重なってかなり疲弊しました。管理する側は情報を追う必要があります。PHP2Shellの緊急脆弱性では、パッチ適用の準備が呼びかけられ、難しい場合はサイトの一時停止もリスク低減策として示されました。出典: ITmedia NEWS https://www.itmedia.co.jp/news/article/2610/22/2000002483/ -->

---
<!-- _class: current-topic -->
<!-- _footer: 3. 管理する人が整える、安全に試せる場 > 管理者編 -->


## 管理する人は、安全に試せる場を作る

- 院内LANだけで使う業務アプリ
- 実データを使わない診断アプリ
- 本番システムや患者情報から分ける

<!-- 人を雇わない、何も触らせない、というのは現実的には難しい。人が関わるなら、リテラシーを上げる必要があります。本番データは使わず、病院の中だけで使うものや、内部情報を使わない診断アプリを安全な場所で作ってみる。 -->

---
<!-- _class: media-split current-topic -->
<!-- _footer: 3. 管理する人が整える、安全に試せる場 > 管理者編 -->

## 安全に試す経験が、情報を扱う力を育てる

- データがどこに行くか確かめる
- 誰が使えるか考える
- 失敗や工夫を共有する


![使わせないのではなく砂場で試すことを見守る親子の対比](images/sandbox-learning-illustration.webp)

<!-- これは僕の感覚ですけど、ある程度サンドボックスで実際に作ってみるのが大事だと思っています。紙でも漏れるし、システムを固めるだけでは終わらない。作りながら学んでいくんですよね。 -->

---
<!-- _class: current-topic -->
<!-- _footer: 4. 作って試し、設計の工夫を発信する -->


<!-- only: 15min -->

## 公開する前提で、置く情報を選ぶ

- ビルの入口の鍵が開いていたら？
  - 大事なものは部屋に置きっぱなしにしない
- 最近の自分の実装Webサイト
  - ソースコードをフル公開しながら作るように切り替えてみた
- 公開するコードに秘密や実データを置かない

<!-- 僕も今、自分のウェブサイトのソースコードを公開してみています。隠そうとすると、ソースコードを置く場所に要らないものを残してしまうことがある。貸会議室のビルの鍵が開いていたら、貴重品を置きっぱなしにしないですよね。必要なものだけ金庫に入れる、持ち帰る。公開前提で作るのも同じです。 -->

---
<!-- _class: media-split current-topic -->
<!-- _footer: 4. 作って試し、設計の工夫を発信する -->

## 作ったものと、設計の工夫を発信しよう

- 何を作り、何を試して設計したか
  - 集めない情報を決める
  - 必要な期限が来たら消す
  - データや権限を分ける
- 工夫も含めて発表しましょう

![登壇して作ったものと設計の工夫を発信するイラスト](images/share-design-illustration.webp)

<!-- 作ったものを公開する時は、設計意図も一緒に話したいです。何を集めないか、いつ消すか、データや権限をどう分けたか。そういうところを発信すると、使う人も安心できるし、現場で作ることも応援してもらえると思います。 -->

---

<!-- _class: summary current-topic -->
<!-- _footer: 4. 作って試し、設計の工夫を発信する -->

## まとめ

- どんどん作れるようになってきた
- データは漏れる前提くらいで考えておく
  - 集めない（渡さない）
  - 保存しない
  - 保存場所と権限を分ける
- 各種意識
  - 作る側・使う側・管理者側、それぞれ考えましょう
- 教育大事
  - 自分で作って公開して学んで行こう => もいせんへ
---
<!-- _class: source-cards current-topic -->
<!-- _footer: 4. 作って試し、設計の工夫を発信する -->

## 番宣: もいせん・プロトアウトに来ましょう

<div class="gl-cards gl-cards--2">
<article class="gl-source"><img class="gl-source__screenshot" src="images/cards/moicen-site-screenshot.webp" alt="ものづくり医療センター もいせん公式サイト"><strong class="t-body">ものづくり医療センター「もいせん」</strong><p class="t-sub">医療者が現場の課題を自分で解決するための学びの場。</p><small class="t-note"><a href="https://moicen-forest.studio.site/">公式サイト</a></small></article>
<article class="gl-source"><img class="gl-source__screenshot" src="images/cards/protoout-site-screenshot.webp" alt="プロトアウトスタジオ公式サイト"><strong class="t-body">プロトアウトスタジオ</strong><p class="t-sub">作って、外に出して、反応を得ながら学ぶ。</p><small class="t-note"><a href="https://protoout.studio/">公式サイト</a></small></article>
</div>
<p class="gl-foot t-body">学びながら、最新事例にも触れましょう。</p>

<!-- もいせんとプロトアウトに来て、一緒に学びましょう。情報もサービスも変わるので、コミュニティに参加して最新事例にも触れていきましょう。 -->

---
<!-- _class: closing-promo current-topic -->
<!-- _footer: 4. 作って試し、設計の工夫を発信する -->

## ご清聴、ありがとうございました

<div class="gl-closing-promo">
<div class="gl-promo-feature">
<h3>最新事例は「漏らされったー」で</h3>
<a href="https://morasaretter.suke.dev/"><img src="images/morasaretter-og.webp" alt="漏らされったーの最新事例画面"></a>
<p>情報漏えいの事例を追いかける / <a href="https://morasaretter.suke.dev/">morasaretter.suke.dev</a></p>
</div>
<div class="gl-promo-contact">
<p class="t-body">フォロー・感想はこちら</p>
<p class="gl-promo-x"><strong class="t-sub">Xでフォロー</strong><a class="t-body" href="https://x.com/n0bisuke">@n0bisuke</a></p>
<figure class="gl-promo-survey"><img src="images/final-survey-qr.webp" alt="アンケートフォームを開くQRコード"><figcaption>感想・ご質問はこちら</figcaption></figure>
</div>
</div>

<!-- アンケートフォーム: https://forms.gle/sWkm89bvMTUSXED37。最新事例: https://morasaretter.suke.dev/ -->
