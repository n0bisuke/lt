# TitleSlide

デッキの1枚目で、絵とタイトル、左下の著者、右下の日付とハッシュタグを置きます。

**用意するもの：** 絵（`lt-slot` か画像）、`lt-cover-title` のタイトル、`lt-tagline`。`lt-author` は固定です。補足があれば、タイトルの下に `<p class="lt-cover-title lt-sub">（ショートスリーパー）</p>` を足します。

**タグの書式：** `YYYYMMDD #IoTLT` を基本に、回数や会場を足します。例：`20260419 #IoTLT vol134 in 潮風公園BBQ`

タイトルを絵の上に置いても構いません。`lt-cover-body` の中の順番を入れ替えるだけです。

```html
<section class="lt-slide">
  <div class="lt-cover-body">
    <div class="lt-slot lt-label ">写真: 発表ネタが一目で分かる絵</div>
    <h1 class="lt-cover-title">エッジAIで焼肉の焼き加減判定やってみた</h1>
  </div>
  <div class="lt-author">
    <img class="lt-avatar" src="assets/Logos/nobisuke-avatar.jpg" alt="">
    <p class="lt-caption">菅原のびすけ</p>
    <p class="lt-caption">@n0bisuke</p>
  </div>
  <p class="lt-tagline lt-tag">20260419 #IoTLT vol134 in 潮風公園BBQ</p>
</section>
```
