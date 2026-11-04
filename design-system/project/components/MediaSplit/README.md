# MediaSplit

製品やサービスを紹介する形で、左に画像、右に箇条書き、下に URL を置きます。

**用意するもの：** 画像か `lt-slot`、`lt-body-sm` の箇条書き、出典 URL（任意）。URL は `lt-foot lt-caption lt-url` です。

```html
<section class="lt-slide">
  <h1 class="lt-title">デバイスはXIAO ESP32S3 Sense</h1>
  <div class="lt-split">
    <div class="lt-slot lt-label ">スクショ: 販売ページ</div>
    <ul class="lt-bullets lt-body-sm">
      <li>SenseCraftをそのまま利用できるデバイス
        <ul><li>簡単な検証は<b>ノーコード</b>でいける</li></ul>
      </li>
      <li>カメラ/マイク/SDスロット付き</li>
      <li>2660円 結構安い</li>
    </ul>
  </div>
  <p class="lt-foot lt-caption lt-url">https://akizukidenshi.com/catalog/g/g118079/</p>
</section>
```
