---
marp: true
theme: lecture
title: プロトタイピングでガンガン作って攻めるための、最低限の身の丈セキュリティ話（10分版）
date: 2026-11-15
event: "第2回 ものづくり医療研究会"
eventUrl: "https://moiken02.vercel.app/"
published: true
---

<!-- _class: title-slide -->

![bg right:34%](../../design-system/lecture/assets/Eras/era-prehistory.jpg)
![bg](../../design-system/lecture/assets/Eras/era-ancient.jpg)
![bg](../../design-system/lecture/assets/Eras/era-medieval.jpg)
![bg](../../design-system/lecture/assets/Eras/era-early-modern.jpg)
![bg](../../design-system/lecture/assets/Eras/era-modern.jpg)
![bg](../../design-system/lecture/assets/Eras/era-present.jpg)
![bg](../../design-system/lecture/assets/Eras/era-future.jpg)

![logo](../../design-system/lecture/assets/Logos/protout-studio.png)

# プロトタイピングで<br>ガンガン作って攻めるための、<br>最低限の身の丈セキュリティ話

第2回 ものづくり医療研究会

2026/11/15（日）13:45〜 ふれあい貸し会議室 秋葉原No53

---

<!-- _class: speaker-profile -->

![logo](../../design-system/lecture/assets/Logos/protout-studio.png)

# 菅原のびすけ

- プロトタイピングスクール「プロトアウトスタジオ」
- デジタルハリウッド大学大学院 非常勤講師
  - プロダクトプロトタイピング

個人活動

- IoTLT（国内最大のIoTコミュニティ）主催
- Developers Summit 2025 ベストスピーカー 1位
- LINE API Expert / Microsoft MVP / IBM Champion

---

# AIで医療者もアプリが作れる時代ですね

- 受付・順番待ちシステム
- 問診フォーム
- 院内の業務改善アプリ

<!-- 生成AIやバイブコーディングで、プログラミングの専門知識がなくてもアプリを作れるようになってきています。医療者自身が作りそうなものとして、受付や順番待ちのシステム、問診フォーム、院内の業務改善アプリなどがあります。 -->

---

<!-- _class: link-cards -->

# 産院の院長がChatGPTで患者呼び出しシステムを作った

<!-- card: https://x.com/A_Mochizuki/status/2111079943400808872 -->
<article class="gl-linkcard" data-card="https://x.com/A_Mochizuki/status/2111079943400808872"><img src="images/cards/d6a77accf72b.webp" alt=""><strong class="t-sub"><a href="https://x.com/A_Mochizuki/status/2111079943400808872">産院のいんちょ (@A_Mochizuki) on X</a></strong><small class="t-note gl-muted">X (formerly Twitter) / 2026-10-16</small></article>

<p class="gl-foot t-caption gl-muted">Pythonは書けないけど、院内LANから呼べる待合室の呼び出しシステム（@A_Mochizuki さん 2026/10/16）</p>

<!-- 産院の院長の @A_Mochizuki さんが、Pythonのコードは一行も書けないけれど、ChatGPTに相談したら院内LANのどこからでも呼べる待合室の患者呼び出しシステムが作れた、と投稿していました（2026年10月16日）。翌日の投稿によると、アットリンクの障害の急場しのぎに作ったものだそうです。医療者が自分で作れる時代になっています。出典: https://x.com/A_Mochizuki/status/2111079943400808872 -->

---

<!-- _class: key-message -->

# 今日のメッセージ

セキュリティが心配だから作らない、ではなく

**「ここは意識してます」と自信を持って言えるから、<br>ガンガン作れる**

<!-- セキュリティを理由に開発を禁止したいわけではありません。リスクを理解したうえで、積極的にプロトタイピングするための考え方の話をします。「そもそも情報を集めていない」「分けてある」と自信を持って言えれば、プロトタイプでもガンガン作って攻められます。動くアプリと安全なアプリは違うので、どこを意識しているかを言えるようにしておきます。攻撃手法の細かい話より、非エンジニアでも設計の段階からできることを中心にします。 -->

---

<!-- _class: agenda overview -->

# 今日のアジェンダ

- 1\. 集めない
- 2\. 持たない
- 3\. 分ける
- 4\. 身の丈の運用
- 5\. まとめ

---

<!-- _class: agenda -->

# 今日のアジェンダ

- **1\. 集めない**
- 2\. 持たない
- 3\. 分ける
- 4\. 身の丈の運用
- 5\. まとめ

---

# AIに受付システムを作らせると、とりあえず全部聞いてくる

- 氏名
- 生年月日
- メールアドレス
- 電話番号

<!-- 一般的なフォームを作らせると、氏名、生年月日、メールアドレス、電話番号などを取得する実装になりがちです。 -->

---

# 順番を管理するだけなら受付番号で済むかも

- 氏名・生年月日・メール・電話 => **A-023**
- 患者さんとの対応が必要なら、既存の受付システム側で持てないか

<p class="gl-foot t-caption gl-muted">受付番号も患者さんと結び付くなら個人情報になり得る</p>

<!-- 単に順番を管理する目的なら、受付番号だけで済む可能性があります。患者さんには「A-023」のような番号を表示して、今呼ばれている番号や待ち状況だけを知らせます。受付番号と患者情報の対応が必要なら、既存の受付システム側で管理できないかを考えます。ただし、受付番号も患者と結び付くなら個人情報になり得るので、完全な匿名化ではありません。 -->

---

<!-- _class: key-message -->

# 集めない

**持っていない情報は漏らせない**

<!-- 個人情報は漏らさないように守るだけでなく、そもそも要らないなら集めないほうがいい、という考え方です。 -->

---

# 紙の問診票でも、生年月日とか無駄に聞くのはやめよう

- アプリでも紙でも、書いてもらった情報は持つことになる
- 紙もなくす、置き忘れる、見られる
- => 紙の問診票からも、要らない項目を消す

<!-- 問診をアプリではなく紙でやっているところもあります。紙だから安全というわけではなく、書いてもらった情報は持つことになります。紙の問診票でも、生年月日などを無駄に聞くのはやめよう、という話です。 -->

---

<!-- _class: link-cards -->

# 修学旅行で名簿の入ったリュックを紛失

<!-- card: https://news.yahoo.co.jp/articles/6517996581c146685dda087f9ee139a63fd6aff2 -->
<article class="gl-linkcard" data-card="https://news.yahoo.co.jp/articles/6517996581c146685dda087f9ee139a63fd6aff2"><img src="images/cards/6301c2fcf206.jpg" alt=""><strong class="t-sub"><a href="https://news.yahoo.co.jp/articles/6517996581c146685dda087f9ee139a63fd6aff2">修学旅行中に教員がリュックサックを紛失　2年生226人全員の個人情報流出の可能性　広島県立の高校で（RCC中国放送） - Yahoo!ニュース</a></strong><small class="t-note gl-muted">Yahoo!ニュース</small></article>

<!-- 広島県立の高校で、修学旅行中に教員が生徒の名簿などが入ったリュックサックをなくし、2年生226人全員の個人情報が流出した可能性があると報じられました（RCC中国放送、2026年10月）。紙でも、持ち歩けばなくします。出典: https://news.yahoo.co.jp/articles/6517996581c146685dda087f9ee139a63fd6aff2 -->

---

<!-- _class: actor-flow -->

# AIが作ったフォームから、人間が項目を削る

<div class="gl-flow">
<div class="gl-step gl-step--human"><i class="gl-icon gl-icon--human"></i><div class="gl-box t-sub"><span>受付システム<br>作って</span></div></div><div class="gl-arrow t-sub">→</div><div class="gl-step gl-step--ai"><i class="gl-icon gl-icon--robot"></i><div class="gl-box t-sub"><span>フォームを<br>生成</span></div></div><div class="gl-arrow gl-arrow--alert t-note">判断<br>→</div><div class="gl-step gl-step--human"><i class="gl-icon gl-icon--human"></i><div class="gl-box t-sub"><span>要らない<br>項目を削る</span></div></div>
</div>
<p class="gl-foot t-caption gl-muted">作らない機能を決めることもセキュリティ設計</p>

<!-- AIが自動で作ったフォームをそのまま採用せず、要らない項目や機能を人間が削る判断が大事です。 -->

---

<!-- _class: agenda -->

# 今日のアジェンダ

- 1\. 集めない
- **2\. 持たない**
- 3\. 分ける
- 4\. 身の丈の運用
- 5\. まとめ

---

<!-- _class: key-message -->

# 持たない

毎回生年月日を入れさせたくない

でも、**DBには貯めたくない**

<!-- 問診フォームで毎回氏名や生年月日を入れてもらうのは面倒です。でも、便利にするためだけに生年月日をサーバーのDBに貯めるのも避けたい。生年月日は変えられず、他人に知られていることもあるので、認証のための秘密の情報としても向いていません。 -->

---

<!-- _class: link-cards -->

# 病院の個人PCでサポート詐欺

<!-- card: https://internet.watch.impress.co.jp/docs/news/2114633.html -->
<article class="gl-linkcard" data-card="https://internet.watch.impress.co.jp/docs/news/2114633.html"><img src="images/cards/daa017915ad1.png" alt=""><strong class="t-sub"><a href="https://internet.watch.impress.co.jp/docs/news/2114633.html">愛知県の藤田医科大学病院で個人情報漏えいの可能性、規定に反して情報を持ち出した個人PCがサポート詐欺に</a></strong><small class="t-note gl-muted">INTERNET Watch / 2026-06-05</small></article>
<!-- card: https://scan.netsecurity.ne.jp/article/2024/05/22/51035.html -->
<article class="gl-linkcard" data-card="https://scan.netsecurity.ne.jp/article/2024/05/22/51035.html"><img src="images/cards/559d182e9c97.jpg" alt=""><strong class="t-sub"><a href="https://scan.netsecurity.ne.jp/article/2024/05/22/51035.html">サポート詐欺で発覚 ～ 産婦人科医師が不適切な状態で患者データ保管 | ScanNetSecurity</a></strong><small class="t-note gl-muted">ScanNetSecurity</small></article>

<!-- 2026年6月、藤田医科大学病院で、看護師の個人PCがサポート詐欺の被害に遭い、院内の規定に反して保存していた患者の個人情報が漏えいした可能性があると発表されました。2024年5月には近畿大学病院でも、産婦人科の医師が研究目的で個人所有のPCに保存していた患者の情報が、サポート詐欺をきっかけに漏えいした可能性があると発表されています。出典: https://internet.watch.impress.co.jp/docs/news/2114633.html 、https://scan.netsecurity.ne.jp/article/2024/05/22/51035.html -->

---

# 2回目からはパスキーでログイン

- パスワードを作らせない
- 使い回しを防ぎやすい
- フィッシングに強い
- パスワード再設定を作らなくていい

<p class="gl-foot t-note gl-muted">参考: Setlogの登録画面</p>

<!-- Setlogというアプリのユーザー登録が、パスキー中心の設計になっていて良いと感じました。何度も使う患者さんに毎回メールアドレスや生年月日を入れてもらう代わりに、パスキーでログインしてもらう、という使い方が考えられます。 -->

---

# 受付QR＋一時トークンで問診フォームを開く

- 1\. 受付で患者さんごとのQRを発行
- 2\. スマホで問診フォームを開いて回答
- 3\. 回答は問診IDに紐付けて保存
- 4\. 患者IDとの対応は既存の患者管理システム側で

<p class="gl-foot t-caption gl-muted">QRを持っているだけで本人とは言い切れない（渡し間違い、転送、盗撮）</p>

<!-- QRコードには推測しにくい一時トークンを入れます。これなら問診フォームで毎回氏名や生年月日を入れてもらわずに済みます。ただし、QRを持っているだけで本人とは言い切れないので、渡し間違い、転送、盗撮への対策は必要です。 -->

---

<!-- _class: agenda -->

# 今日のアジェンダ

- 1\. 集めない
- 2\. 持たない
- **3\. 分ける**
- 4\. 身の丈の運用
- 5\. まとめ

---

<!-- _class: zone-compare -->

# 患者DB・問診DB・対応表を分ける

<div class="gl-zones">
<div class="gl-zone"><p class="t-sub"><b>患者DB</b></p><ul class="t-sub"><li>患者ID</li><li>氏名</li><li>生年月日</li></ul><p class="gl-out t-sub">漏れても問診内容は出ない</p></div>
<div class="gl-zone"><p class="t-sub"><b>問診DB</b></p><ul class="t-sub"><li>問診ID</li><li>症状、既往歴</li><li>暗号化</li></ul><p class="gl-out t-sub">漏れても氏名は出ない</p></div>
<div class="gl-zone"><p class="t-sub"><b>対応表</b></p><ul class="t-sub"><li>患者IDと問診IDの対応だけ</li><li>別の場所に置く</li></ul><p class="gl-out t-sub">見られる人を絞る</p></div>
</div>
<p class="gl-foot t-caption gl-muted">IDを分けただけでは匿名化にはならない</p>

<!-- 患者DBだけが漏れても、問診内容までは直接漏れないようにします。問診DBだけが漏れても、氏名などを直接取られにくくします。対応表は別の保護された場所に置き、暗号鍵も問診DBとは別に管理します。ただし、自由記述や珍しい症状から患者さんを推測できる可能性は残ります。IDを分けただけでは、法的な意味での匿名化にはなりません。 -->

---

# DBだけじゃなく、サーバーや場所、ネットワークも分けておく

- 1\. 同じDBの中でテーブルを分ける
- 2\. 別のDBに分ける
- 3\. 別のサーバーに分ける
- 4\. 別のネットワーク・クラウド環境に分ける
- 5\. アカウント・アクセス権限を分ける
- 6\. 暗号鍵の管理も分ける

<p class="gl-foot t-caption gl-muted">分けすぎると運用が大変になるので、身の丈で</p>

<!-- 分け方にはいくつかの段階があります。同じDBの中でテーブルを分ける、別のDBにする、別のサーバーにする、別のネットワークやクラウド環境にする、アカウントやアクセス権限を分ける、暗号鍵の管理も分ける、という順に強くなります。保存する場所を分けることも対策になります。ただし、分けるほど運用の手間が増え、システムも複雑になるので、身の丈に合った段階を選びます。 -->

---

# 鍵と権限も分ける

- アプリごとに必要なDBにだけアクセスさせる
- 患者情報と問診内容を取るAPIを分ける
- 受付スタッフと医師で見える情報を分ける
- 一括ダウンロードと管理者権限を絞る
- ログやバックアップにも個人情報が残る

<!-- 保管場所を分けるだけでなく、情報にアクセスできる権限を分けることが大事です。分けすぎると運用が大変になり、システムも複雑になるので、そこも考えます。 -->

---

<!-- _class: key-message -->

# 集めない・持たない・分ける

**漏れても被害が小さくなる設計**

<!-- 侵入や漏洩を完全に防ぐことだけを目指すのではなく、侵害されたときにも被害が広がりにくい設計にしたい、という考え方です。 -->

---

<!-- _class: agenda -->

# 今日のアジェンダ

- 1\. 集めない
- 2\. 持たない
- 3\. 分ける
- **4\. 身の丈の運用**
- 5\. まとめ

---

# 「URLを知ってる人だけ」はアクセス制御じゃない

- robots.txt => セキュリティの仕組みじゃない
- noindex => 検索に出にくくするだけ
- => 見せたくないデータには**認証とアクセス制御**

<p class="gl-foot t-note gl-muted">例: ChatGPT の共有リンクの会話が、検索結果に出ていた（2025年8月）</p>

<!-- 問診フォームの管理画面をURLを知っている人だけに共有する、院内の備品管理アプリを認証なしで公開する、といった使い方は危ないです。検索に出ないことと、外からアクセスできないことは違います。公開画面と管理画面を分け、患者情報を返すAPIにも権限の制御が必要です。2025年8月には、ChatGPT で「検索可能にする」を選んで共有した会話が検索エンジンに載っていたことが話題になり、OpenAI はその機能を取り下げました。参考: https://www.lifehacker.jp/article/2508-you-might-have-sent-your-chatgpt-conversations-to-google/ -->

---

<!-- _class: link-cards -->

# 介護・医療の設定ミス

<!-- card: https://www.pref.fukuoka.lg.jp/press-release/nkojinjyouhou.html -->
<article class="gl-linkcard" data-card="https://www.pref.fukuoka.lg.jp/press-release/nkojinjyouhou.html"><strong class="t-sub"><a href="https://www.pref.fukuoka.lg.jp/press-release/nkojinjyouhou.html">福岡県働きやすい介護職場認証制度事業における個人情報の漏えい事案について - 福岡県庁ホームページ</a></strong><small class="t-note gl-muted">福岡県庁ホームページ</small></article>
<!-- card: https://scan.netsecurity.ne.jp/article/2024/12/16/52044.html -->
<article class="gl-linkcard" data-card="https://scan.netsecurity.ne.jp/article/2024/12/16/52044.html"><img src="images/cards/3f54f9dea923.jpg" alt=""><strong class="t-sub"><a href="https://scan.netsecurity.ne.jp/article/2024/12/16/52044.html">表示されるべきでない患者一覧が閲覧可能に ～ 大阪公立大学医学部附属病院 | ScanNetSecurity</a></strong><small class="t-note gl-muted">ScanNetSecurity</small></article>
<!-- card: https://rocket-boys.co.jp/security-measures-lab/nichii-kaigo-personal-data-exposure-20261002/ -->
<article class="gl-linkcard" data-card="https://rocket-boys.co.jp/security-measures-lab/nichii-kaigo-personal-data-exposure-20261002/"><img src="images/cards/3e84cdf551a2.png" alt=""><strong class="t-sub"><a href="https://rocket-boys.co.jp/security-measures-lab/nichii-kaigo-personal-data-exposure-20261002/">ニチイ学館、介護サイトで個人情報漏洩のおそれ―583名分、99名は健康状態・障がい情報を含む|セキュリティニュースのセキュリティ対策Lab</a></strong><small class="t-note gl-muted">合同会社ロケットボーイズ - セキュリティ 情報漏洩のニュースサイト セキュリティ対策Labの運営とBtoB マーケティング コンサル 支援 / 2026-10-06</small></article>

<!-- 福岡県では、介護職場認証制度の申請用ファイルの設定を委託先が誤り、介護事業者の役員183人分の氏名や生年月日が閲覧できる状態でした（2026年9月）。大阪公立大学医学部附属病院では、地域医療連携ネットワークの設定不備で、本来表示されないはずの患者一覧が見られる状態でした（2024年12月）。ニチイ学館では、介護サイトのお問い合わせデータを含むバックアップファイルが、認証なしで外部から取得できる状態だったと報じられています（2026年10月、583名分、セキュリティ対策Labの記事による）。出典: https://www.pref.fukuoka.lg.jp/press-release/nkojinjyouhou.html 、https://scan.netsecurity.ne.jp/article/2024/12/16/52044.html 、https://rocket-boys.co.jp/security-measures-lab/nichii-kaigo-personal-data-exposure-20261002/ -->

---

<!-- _class: link-cards -->

# 予約サイト、患者アプリ、問診データ

<!-- card: https://www.itmedia.co.jp/news/article/2610/05/2000002016/ -->
<article class="gl-linkcard" data-card="https://www.itmedia.co.jp/news/article/2610/05/2000002016/"><img src="images/cards/fb1419ca9c0e.jpg" alt=""><strong class="t-sub"><a href="https://www.itmedia.co.jp/news/article/2610/05/2000002016/">ホワイトエッセンス、約105万アカウントの個人情報流出　8月発表の不正アクセス調査で判明</a></strong><small class="t-note gl-muted">ITmedia NEWS</small></article>
<!-- card: https://www.itmedia.co.jp/news/article/2610/15/2000002293/ -->
<article class="gl-linkcard" data-card="https://www.itmedia.co.jp/news/article/2610/15/2000002293/"><img src="images/cards/b3b1b58d5ad8.png" alt=""><strong class="t-sub"><a href="https://www.itmedia.co.jp/news/article/2610/15/2000002293/">メドレーの産婦人科向けシステムに不正アクセス、患者の個人情報漏えいか　最大787の医療機関が対象</a></strong><small class="t-note gl-muted">ITmedia NEWS</small></article>
<!-- card: https://www.nikkei.com/article/DGXZQOUC069010W6A101C2000000/ -->
<article class="gl-linkcard" data-card="https://www.nikkei.com/article/DGXZQOUC069010W6A101C2000000/"><img src="images/cards/c39bcc9d10c4.jpg" alt=""><strong class="t-sub"><a href="https://www.nikkei.com/article/DGXZQOUC069010W6A101C2000000/">資生堂、利用者情報が2515件流出　肌の測定結果など - 日本経済新聞</a></strong><small class="t-note gl-muted">日本経済新聞 / 2026-11-06</small></article>

<!-- ホワイトエッセンスでは、予約サイトの脆弱性を足がかりに基幹システムへ侵入され、約105万アカウント分の個人情報が持ち出されたと発表されました（2026年10月の続報）。メドレーの産婦人科向けサービス @link と患者向けアプリも不正アクセスを受け、最大787の医療機関の患者の個人情報が漏えいした可能性があります（2026年10月、調査中）。資生堂の肌測定システムでは、利用者2,515件の問診データや肌の測定結果が漏えいしました（2026年11月）。出典: https://www.itmedia.co.jp/news/article/2610/05/2000002016/ 、https://www.itmedia.co.jp/news/article/2610/15/2000002293/ 、https://www.nikkei.com/article/DGXZQOUC069010W6A101C2000000/ -->

---

# 学習に使われない ≠ ログが残らない

- ChatGPT Business / Enterprise => 原則、業務データを学習に使わない
- OpenAI API => デフォルトで学習に使わない
- Gemini API => 有料扱いかどうかで条件が変わる
- 試作は**ダミーデータ**で

<p class="gl-foot t-note gl-muted">規約は変わるので、使う前に公式のページで確認する</p>

<!-- 学習に使われないことと、不正利用の監視などでログが保存されないことは別です。Gemini API は、単に無料か有料かではなく、Cloud Billing の設定や適用される契約条件を確認する必要があります。外部連携先に送った情報は、連携先のデータの扱いも考えます。試作の段階では、実際の患者情報ではなくダミーデータを使えないかをまず考えます。参考: https://openai.com/ja-JP/enterprise-privacy/ 、 https://ai.google.dev/gemini-api/terms?hl=ja -->

---

<!-- _class: link-cards -->

# 医療機器の保守用VPNからランサムウェア

<!-- card: https://scan.netsecurity.ne.jp/article/2026/03/09/54788.html -->
<article class="gl-linkcard" data-card="https://scan.netsecurity.ne.jp/article/2026/03/09/54788.html"><img src="images/cards/2f3f20a1c558.jpg" alt=""><strong class="t-sub"><a href="https://scan.netsecurity.ne.jp/article/2026/03/09/54788.html">約13万人の患者情報が漏えい ～ 日本医科大学武蔵小杉病院へのランサムウェア攻撃 | ScanNetSecurity</a></strong><small class="t-note gl-muted">ScanNetSecurity</small></article>
<!-- card: https://internet.watch.impress.co.jp/docs/news/2090217.html -->
<article class="gl-linkcard" data-card="https://internet.watch.impress.co.jp/docs/news/2090217.html"><img src="images/cards/001b247e23e5.png" alt=""><strong class="t-sub"><a href="https://internet.watch.impress.co.jp/docs/news/2090217.html">日本医科大学武蔵小杉病院、ランサムウェア被害の詳細および対策を発表、患者・職員約13万人の個人情報が漏えい</a></strong><small class="t-note gl-muted">INTERNET Watch / 2026-03-04</small></article>

<!-- 日本医科大学武蔵小杉病院では、医療機器の保守用のVPN装置から侵入され、ナースコール管理サーバーがランサムウェアに感染し、患者・職員約13万人の個人情報が漏えいしました（2026年2月〜3月の発表）。作ったあとの保守の入口も、攻撃の入口になります。出典: https://scan.netsecurity.ne.jp/article/2026/03/09/54788.html 、https://internet.watch.impress.co.jp/docs/news/2090217.html -->

---

<!-- _class: key-message stage -->

# 今日のメッセージ（再掲）

セキュリティが心配だから作らない、ではなく

**「ここは意識してます」と自信を持って言えるから、<br>ガンガン作れる**

---

<!-- _class: closing -->

# まとめ

- 動くアプリと安全なアプリは違う
- **集めない・持たない・分ける**で、漏れても被害が小さい設計に
- 限定公開URLはアクセス制御じゃない
- 作ったあとの更新まで考える

**=> 「そもそも集めてない」「分けてある」と自信を持って言えるようにして、ガンガン作ろう**
