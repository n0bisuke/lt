# DataTable

罫線だけのシンプルな表で、型や仕様を並べるときに使います。

**用意するもの：** `th` の見出しと2〜5行の `td`。短いコードは `lt-chip` で囲みます。

原本の表はスクショだったため、罫線とチップの色は目視の推定値です。

```html
<section class="lt-slide">
  <h1 class="lt-title">Jevの3タイプ</h1>
  <div class="lt-stage">
    <table class="lt-table lt-body-sm">
      <tr><th>type</th><th>用途</th><th>返り値</th></tr>
      <tr><td><span class="lt-chip">noul</span></td><td>Yes / No判断</td><td><span class="lt-chip">0〜1</span> の確率</td></tr>
      <tr><td><span class="lt-chip">choice</span></td><td>選択肢から1つ選ぶ</td><td>選択結果・confidence</td></tr>
      <tr><td><span class="lt-chip">score</span></td><td>段階評価</td><td>スコア・confidence</td></tr>
    </table>
  </div>
</section>
```
