# Slide

すべてのスライドの土台で、1920×1080 の白い1枚です。

`.lt-title` を上部中央に、`.lt-stage` を残りの領域の中央に置きます。`.lt-foot` は下部の補足や出典です。

**用意するもの：** タイトル、`lt-stage` の中身、必要なら `lt-foot` の1行。タイトルが1行に収まらないときは `lt-title-sm` に替えます。

**しないこと：** `lt-slide` に背景色を付けない。`lt-stage` の外に独自の配置を作らない。

```html
<section class="lt-slide">
  <h1 class="lt-title">Webアプリからデプロイ</h1>
  <div class="lt-stage">
    <p class="lt-body">デバイスをPCとUSB接続したらそのままデプロイ可能</p>
  </div>
  <p class="lt-foot lt-caption">（※Webシリアルなどが使われてそう）</p>
</section>
```
