# Slot

AI が用意できない写真やスクショの場所を示す、点線の枠です。

原本にはなく、AI の下書きのために足した部品です（Intentional addition）。発表者が実物に差し替えて完成します。

**用意するもの：** `<div class="lt-slot lt-label" style="width:…;height:…">種類: 内容</div>`。「種類」は 写真、スクショ、動画、ロゴ のいずれかで、何を撮れば良いかが分かるように具体的に書きます。

**差し替え：** `<img class="lt-media" src="images/xxx.jpg">` に置き換えます。残っている `lt-slot` は未完成の印です。

```html
<section class="lt-slide">
  <h1 class="lt-title">肉画像を探してみる - 生焼け</h1>
  <div class="lt-stage">
    <div class="lt-slot lt-label ">スクショ: Google画像検索「BBQ 肉 生焼け」の結果</div>
  </div>
</section>
```
