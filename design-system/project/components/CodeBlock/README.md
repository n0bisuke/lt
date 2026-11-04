# CodeBlock

コードは黒い箱に白文字で、角丸なしで置きます。

**用意するもの：** `<pre class="lt-codeblock lt-code">` の中にコード。ターミナルの貼り付け風には `lt-codeblock--term` と `t-cyan`、`t-pink` を使います。全文を雰囲気で見せるときだけ `lt-code-sm` を使います。

**しないこと：** 虹色のシンタックスハイライトや行番号を付けない。実際に動かしていないコードや出力を、動いたものとして載せない。

```html
<section class="lt-slide">
  <h1 class="lt-title">STEP1 Jetson Nanoにollamaに</h1>
  <div class="lt-stage">
    <pre class="lt-codeblock lt-codeblock--term lt-code">curl <span class="t-pink">-s</span> http://localhost:11434/api/embed <span class="t-pink">-H</span> <span class="t-cyan">'content-type: application/json'</span></pre>
    <pre class="lt-codeblock lt-code">{
  "model": "embeddinggemma:300m",
  "embeddings": [[-0.17842108, -0.003002565, 0.053567614]]
}</pre>
  </div>
</section>
```
