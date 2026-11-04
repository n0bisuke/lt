# Demo

タイトルは `DEMO` で、実物の動画や写真を見せます。

**用意するもの：** 動画か写真を2つ、撮影者の表記。動画は `<video class="lt-media" controls>` で入れます。実際のデモ素材がなければ `lt-slot` のままにします。

```html
<section class="lt-slide">
  <h1 class="lt-title">DEMO</h1>
  <div class="lt-split">
    <div class="lt-slot lt-label ">動画: デモの画面</div>
    <div class="lt-slot lt-label ">写真: 会場の様子</div>
  </div>
  <p class="lt-foot lt-caption">xの投稿より（ @youtoy さん撮影 ）</p>
</section>
```
