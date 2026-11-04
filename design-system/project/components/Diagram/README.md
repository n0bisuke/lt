# Diagram

手元の機器とクラウドのつながりを示す、この人のスライドでいちばん多い図です。

**部品：** `lt-box` は黒い2pxの囲み、`lt-arrow` はラベル付きの矢印（両方向は `lt-arrow--both` と `lt-arrow-tail`）、`lt-cloud` は中に画像を入れるクラウドの形です。

**用意するもの：** 機器の写真やサービスのロゴ（実物の画像か `lt-slot`）。AI がロゴを描き起こしてはいけません。

原本のクラウドは Keynote 上の画像だったため、`lt-cloud` は同じ形に描き直したものです。

```html
<section class="lt-slide">
  <h1 class="lt-title">STEP2 トンネリング</h1>
  <div class="lt-diagram">
    <div class="lt-node">
      <p class="lt-body"><b>お家</b></p>
      <div class="lt-box">
        <div class="lt-slot lt-label " style="width:420px;height:300px">写真: Jetson Nano</div>
      </div>
    </div>
    <div class="lt-arrow lt-arrow--both"><span class="lt-arrow-tail"></span><p class="lt-caption">Cloudflare Tunnel</p></div>
    <div class="lt-cloud"><div class="lt-slot lt-label " style="width:280px;height:160px">ロゴ: Dify</div></div>
  </div>
</section>
```
