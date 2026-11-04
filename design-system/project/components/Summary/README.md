# Summary

デッキの最後は必ずこの1枚で、タイトルは必ず `まとめ` です。

**用意するもの：** やったことと分かったことの箇条書き。太字は1〜2項目まで。未検証の話はそのまま書き、最後に今後のひとことを置いて構いません。

項目が多いときだけ `lt-body-sm` を使い、少なければ `lt-body` にします。

```html
<section class="lt-slide">
  <h1 class="lt-title">まとめ</h1>
  <div class="lt-stage">
    <ul class="lt-bullets lt-body-sm">
      <li>BBQの焼き加減判定をエッジAIでやってみた</li>
      <li>SenseCraft
        <ul><li>Seeed版のTeachable Machineみたいなクラウドサービス</li></ul>
      </li>
      <li><b>焼肉モデルを作ってXIAOでエッジAIやってみた</b></li>
      <li>思ったよりいい感じにBBQ会場でも反応してくれた</li>
    </ul>
  </div>
</section>
```
