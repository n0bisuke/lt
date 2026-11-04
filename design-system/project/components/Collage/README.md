# Collage

スクショや写真を少しずらして重ねます。揃えないのが正解です。

**用意するもの：** `.lt-collage` の中に、`left` `top` `width` `height` を直接指定した画像を2〜6枚。段階的に見せるときは同じ1枚を複製して1枚ずつ足します。

```html
<section class="lt-slide">
  <h1 class="lt-title">肉画像を探してみる3 - コゲ</h1>
  <div class="lt-collage">
    <div class="lt-slot lt-label " style="left:0;top:60px;width:680px;height:420px">画像 1</div>
    <div class="lt-slot lt-label " style="left:540px;top:0;width:640px;height:400px">画像 2</div>
    <div class="lt-slot lt-label " style="left:1000px;top:200px;width:700px;height:460px">画像 3</div>
  </div>
  <p class="lt-foot lt-caption">（コゲ画像以外と少ない）</p>
</section>
```
