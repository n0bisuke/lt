# Bullets

「-」で始まる箇条書きで、入れ子は `ul` を入れるだけです。

**用意するもの：** `li` を2〜6個。入れ子は3階層まで。大事な項目は `<b>` で太くし、オチは `<li class="lt-red"><span>…</span></li>` にします。

**しないこと：** 「・」や番号付きリストに替えない（Profile を除く）。1行に2つの話を入れない。

```html
<section class="lt-slide">
  <h1 class="lt-title">Jevの使い所（所感）</h1>
  <div class="lt-stage">
    <ul class="lt-bullets lt-body">
      <li>判断をさせたいけどifだと難しい</li>
      <li>生成AIに任せるとスピードが遅いしコストも高い</li>
    </ul>
    <p class="lt-caption">IoT文脈でもそんなリッチなのいらないから分類だけやらせたいって話はあった</p>
  </div>
</section>
```
