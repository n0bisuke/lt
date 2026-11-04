# Emphasis

文中の強調は、弱い順に `<b>`、`.lt-strong`、`.lt-red` の3段階です。

`.lt-red` は1枚に1か所のオチだけに使います。`.lt-u` は SectionMarker の段階、`.lt-url` は URL、`.lt-mark` と `.lt-markline` はスクショに重ねる印です。

**しないこと：** 段落まるごとの太字。赤を2か所以上。

```html
<section class="lt-slide">
  <div class="lt-stage" style="top:80px">
    <div class="lt-lines lt-body">
      <p>標準の本文</p>
      <p><b>太字：大事な語句</b></p>
      <p><span class="lt-strong">黒い太字：さらに強い語句</span></p>
      <p><span class="lt-red">赤い下線：今回のBBQで分厚い肉はたぶん無いので役不足</span></p>
      <p><span class="lt-u">下線：今の段階</span> =&gt; 次の段階</p>
      <p class="lt-url">https://sensecraft.seeed.cc/</p>
      <p><span class="lt-markline">赤下線：スクショの注目箇所</span></p>
    </div>
  </div>
</section>
```
