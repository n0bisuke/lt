# Flow

処理の流れを、図を描かず文字と `↓` だけで示します。

**用意するもの：** 手順の `<p>` と、その間の `<p class="lt-flow-note">`（説明は空でも可）。手順が5つを超えるなら2枚に分けます。

```html
<section class="lt-slide">
  <h1 class="lt-title">マイクロスリープ判定器を作ってみた</h1>
  <div class="lt-stage">
    <div class="lt-flow lt-body-sm">
      <p>カメラ</p>
      <p class="lt-flow-note">ローカルで高速に特徴量抽出</p>
      <p>目の閉眼時間・まばたき回数・顔検出品質</p>
      <p class="lt-flow-note">5秒ごとにJSON化</p>
      <p>Jev</p>
      <p class="lt-flow-note"></p>
      <p>画面警告・ビープ・obniz LED</p>
    </div>
  </div>
</section>
```
