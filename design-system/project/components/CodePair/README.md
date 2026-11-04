# CodePair

コードを左に、その読み方か実行結果を右に置きます。

**用意するもの：** 見出し付きの `lt-pair-col` と、`lt-lines` の説明か、もう1つの `lt-pair-col`。コードから結果への流れなら、間に `<div class="lt-arrow"></div>` を入れます。

```html
<section class="lt-slide">
  <div class="lt-pair">
    <div class="lt-pair-col">
      <p class="lt-body">Mediapipe</p>
      <pre class="lt-codeblock lt-code">state: {
  eyesClosedRatio: 0.72,
  blinkCount: 4,
  trackingQuality: 0.93,
}</pre>
    </div>
    <div class="lt-lines lt-body">
      <p>5秒間の観測中、</p>
      <p>目を閉じていた割合が72%、</p>
      <p>検出品質は93%で、信頼できそう。</p>
    </div>
  </div>
</section>
```
