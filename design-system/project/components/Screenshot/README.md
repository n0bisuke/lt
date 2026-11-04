# Screenshot

タイトル、大きな画像1枚、下の補足1行の形です。

**用意するもの：** 画像は `<img class="lt-media">`。まだなければ `lt-slot` に内容を書きます。注目箇所は `lt-mark`（赤枠）か `lt-markline`（赤下線）で示します。

```html
<section class="lt-slide">
  <h1 class="lt-title">reCameraを触った時に存在は知っていた</h1>
  <div class="lt-stage">
    <div class="lt-slot lt-label " style="width:1200px;height:100%">スクショ: 過去の登壇スライド</div>
  </div>
  <p class="lt-foot lt-caption"><b>reCameraでもSenseCraftのサービスを使う（IoTLT vol127 より）</b></p>
</section>
```
