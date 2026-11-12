#!/usr/bin/env node
// deck.json が published: true のデッキだけを dist/ に集め、GitHub Pages 用のサイトを作る。
//   /            スライド一覧
//   /<id>/       個別ページ（プレイヤー、PDF）
//   /<id>/slides/ スライド本体
//   /all.json    一覧の API
// PDF とサムネイルはフォントを揃えるため手元で作ってコミットしておく（scripts/export-pdf.sh）。
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kindOf, parseDeck, renderArticle, renderSlides } from './lib/deck.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const DECKS = join(ROOT, 'decks');
const MAX_PDF_MB = 90; // GitHub は 100MB を超えるファイルを受け付けない
const MOVE_UNUSED = process.argv.includes('--move-unused');
const SITE_TITLE = 'LT スライド - 菅原のびすけ';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const errors = [];
const warnings = [];
const moves = [];
const baseUrl = JSON.parse(readFileSync(join(ROOT, 'site.json'), 'utf8')).baseUrl.replace(/\/$/, '');

function allFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? allFiles(join(dir, e.name)) : [join(dir, e.name)]));
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const published = [];
const shared = new Set();
for (const name of readdirSync(DECKS).sort().reverse()) {
  const dir = join(DECKS, name);
  const mdPath = join(dir, 'deck.md');
  const metaPath = join(dir, 'deck.json');
  const isMd = existsSync(mdPath);
  if (!isMd && !existsSync(metaPath)) continue;
  const source = isMd ? readFileSync(mdPath, 'utf8') : null;
  const meta = isMd ? parseDeck(source).meta : JSON.parse(readFileSync(metaPath, 'utf8'));
  if (meta.published !== true) continue;

  const htmlPath = isMd ? mdPath : join(dir, 'index.html');
  // Markdown のデッキは、ここで HTML と記事に変換する
  const rendered = isMd ? renderSlides(source, { title: meta.title ?? '' }) : null;
  const html = isMd ? rendered.html : readFileSync(htmlPath, 'utf8');
  const article = isMd ? renderArticle(source) : '';
  const pdfPath = join(dir, `${name}.pdf`);
  const thumbPath = join(dir, 'thumbnail.png');

  if (/class="[^"]*\blt-slot\b/.test(source ?? html)) errors.push(`${name}: 差し替えていない lt-slot が残っています`);
  if ((source ?? html).includes('【要確認】')) errors.push(`${name}: 【要確認】が残っています`);
  if (!meta.title || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date ?? '')) errors.push(`${name}: deck.json の title か date（YYYY-MM-DD）が正しくありません`);
  if (meta.eventUrl && !/^https?:\/\//.test(meta.eventUrl)) errors.push(`${name}: deck.json の eventUrl は http(s) の URL にしてください`);
  if (!existsSync(thumbPath)) errors.push(`${name}: thumbnail.png がありません（scripts/export-pdf.sh decks/${name}）`);
  if (!existsSync(pdfPath)) {
    errors.push(`${name}: PDF がありません（scripts/export-pdf.sh decks/${name}）`);
  } else {
    const mb = statSync(pdfPath).size / 1024 / 1024;
    if (mb > MAX_PDF_MB) errors.push(`${name}: PDF が ${Math.round(mb)}MB あり、GitHub に置けません`);
    if (!process.env.CI && statSync(pdfPath).mtimeMs < statSync(htmlPath).mtimeMs) warnings.push(`${name}: PDF が index.html より古いです`);
  }

  // スライドが使っているファイルだけを公開する（未使用の画像やメモは出さない）
  const refs = new Set();
  for (const m of html.matchAll(/\b(?:src|poster)=["']([^"']+)["']/g)) {
    const r = decodeURI(m[1]).split(/[?#]/)[0];
    if (!/^[a-z]+:|^\/\//i.test(r) && !r.startsWith('../')) refs.add(normalize(r));
  }
  // Markdown の ![](images/x) や ![bg](images/x) も拾う
  if (isMd) for (const m of source.matchAll(/\bimages\/[^\s"'()<>&;]+/g)) refs.add(normalize(decodeURI(m[0])));
  // テーマの素材（講演テーマのフォント、時代画像、ロゴなど）はサイト直下に同じ位置で置く
  for (const m of html.matchAll(/\.\.\/\.\.\/(design-system\/[^\s"'()<>&;?#]+)/g)) {
    const f = decodeURI(m[1]);
    if (!existsSync(join(ROOT, f))) errors.push(`${name}: ${f} が見つかりません`);
    else shared.add(f);
  }
  const out = join(DIST, name);
  const slides = join(out, 'slides');
  mkdirSync(slides, { recursive: true });
  // slides/ は decks/<id>/ と同じ深さなので、../../design-system のパスはそのまま使える
  writeFileSync(join(slides, 'index.html'), html);
  if (existsSync(pdfPath)) cpSync(pdfPath, join(out, `${name}.pdf`));
  if (existsSync(thumbPath)) cpSync(thumbPath, join(out, 'thumbnail.png'));
  for (const r of refs) {
    const from = join(dir, r);
    if (r.startsWith('..') || !existsSync(from)) { errors.push(`${name}: ${r} が見つかりません`); continue; }
    mkdirSync(dirname(join(slides, r)), { recursive: true });
    cpSync(from, join(slides, r));
  }
  const imagesDir = join(dir, 'images');
  if (existsSync(imagesDir)) {
    const unused = allFiles(imagesDir).map((f) => relative(dir, f).split(sep).join('/')).filter((f) => !refs.has(normalize(f)));
    if (unused.length && MOVE_UNUSED) {
      moves.push({ name, dir, unused });
    } else if (unused.length) {
      warnings.push(`${name}: 未使用の画像 ${unused.length} 個はサイトに出しませんが、コミットすると公開リポジトリには残ります（--move-unused で unused/ に移せます）: ${unused.join(', ')}`);
    }
  }
  published.push({ id: name, ...meta, kind: kindOf(meta), article, slideCount: isMd ? rendered.count : (html.match(/<section\s+class="[^"]*\blt-slide\b/g) ?? []).length });
}

if (errors.length) {
  for (const e of errors) console.error(`エラー: ${e}`);
  rmSync(DIST, { recursive: true, force: true });
  process.exit(1);
}

// エラーがないときだけ未使用の画像を移す
for (const { name, dir, unused } of moves) {
  for (const f of unused) {
    const to = join(dir, 'unused', f.replace(/^images\//, ''));
    mkdirSync(dirname(to), { recursive: true });
    renameSync(join(dir, f), to);
  }
  console.log(`${name}: 未使用の画像 ${unused.length} 個を unused/ に移しました（コミットされません）`);
}

// デッキが読み込む共通ファイル（デッキからの相対パスをそのまま保つ）
const P = 'design-system/project';
const AVATAR = `${P}/assets/Logos/nobisuke-avatar.jpg`;
for (const f of ['design-system/tokens.css', `${P}/components/bundle.css`, `${P}/components/bundle.js`, AVATAR, ...shared]) {
  if (!existsSync(join(ROOT, f))) { console.error(`エラー: ${f} がありません（node scripts/build-tokens.mjs）`); process.exit(1); }
  mkdirSync(dirname(join(DIST, f)), { recursive: true });
  cpSync(join(ROOT, f), join(DIST, f));
}

const urlOf = (d) => `${baseUrl}/${encodeURIComponent(d.id)}/`;
const dateJa = (s) => { const [y, m, d] = s.split('-').map(Number); return `${y}年${m}月${d}日`; };

writeFileSync(join(DIST, 'site.css'), `@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700&display=swap");
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--font-sans); font-weight: 500; line-height: 1.5; }
a { color: inherit; }
a:focus-visible, button:focus-visible { outline: var(--stroke-rule) solid var(--ink-strong); outline-offset: 2px; }
main { max-width: 1200px; margin: 0 auto; padding: 40px 16px 80px; }

.site-head { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; text-decoration: none; }
.site-head img { width: 64px; height: 64px; flex: none; border-radius: var(--radius-avatar); box-shadow: var(--shadow-avatar); }
.site-head h1, .site-head .site-name { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; }
.site-head p { margin: 0; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 40px 24px; }
.card { display: block; text-decoration: none; }
.card[hidden] { display: none; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
.filters .btn[aria-pressed="true"] { background: var(--ink-strong); color: var(--paper); }
.card img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: contain; border: 1px solid var(--rule-soft); }
.card h2 { margin: 12px 0 4px; font-size: 18px; font-weight: 700; line-height: 1.4; }
.card:hover h2 { text-decoration: underline; }
.card p { margin: 0; font-size: 14px; }
.empty { padding: 24px 0; border-top: 1px solid var(--rule-soft); }
.site-foot { margin-top: 64px; padding-top: 16px; border-top: 1px solid var(--rule-soft); font-size: 14px; }

.detail { max-width: 1040px; margin: 0 auto; }
.player { aspect-ratio: 16 / 9; border: 1px solid var(--rule-soft); background: #000; }
.player iframe { display: block; width: 100%; height: 100%; border: 0; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
.controls .count { min-width: 72px; text-align: center; font-variant-numeric: tabular-nums; }
.controls .end { margin-left: auto; display: flex; gap: 8px; }
.btn { display: inline-block; min-height: 44px; padding: 8px 16px; border: var(--stroke-rule) solid var(--ink-strong); border-radius: var(--radius-none); background: var(--paper); color: var(--ink-strong); font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
.btn:disabled { border-color: var(--ink-soft); color: var(--ink-soft); cursor: default; }
.btn[hidden] { display: none; }
.detail h1 { margin: 32px 0 8px; font-size: 32px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; }
.detail .meta { margin: 0; }
.article { margin-top: 48px; font-size: 17px; line-height: 1.9; overflow-wrap: anywhere; }
.article section { padding: 24px 0; border-top: 1px solid var(--rule-soft); }
.article h2 { margin: 0 0 12px; font-size: 22px; font-weight: 700; line-height: 1.4; letter-spacing: -0.02em; }
.article p, .article ul, .article ol, .article pre, .article table, .article blockquote { margin: 0 0 12px; }
.article img, .article video { display: block; max-width: 100%; height: auto; margin: 0 0 12px; }
.article em { font-style: normal; font-weight: 700; color: var(--accent-red); }
.article blockquote { padding-left: 12px; border-left: 2px solid var(--rule-soft); font-size: 15px; }
.article pre { padding: 12px 14px; background: var(--code-bg); color: var(--code-fg); font-family: var(--font-mono); font-size: 14px; line-height: 1.5; overflow-x: auto; }
.article :not(pre) > code { padding: 0 6px; border-radius: var(--radius-chip); background: var(--chip); font-family: var(--font-mono); font-size: 0.9em; }
.article table { width: 100%; border-collapse: collapse; }
.article th, .article td { padding: 8px 12px 8px 0; border-bottom: 1px solid var(--rule-soft); text-align: left; }
@media (max-width: 640px) {
  .detail h1 { font-size: 24px; }
  .grid { grid-template-columns: 1fr; }
}
`);

const headCommon = (css) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${css}design-system/tokens.css">
<link rel="stylesheet" href="${css}site.css">`;

const avatarBlock = (root, heading) => `<a class="site-head" href="${root}">
    <img src="${root}${AVATAR}" alt="">
    <div>${heading}<p>菅原のびすけ @n0bisuke</p></div>
  </a>`;

// ---------- 一覧 ----------
const externalPath = join(ROOT, 'external.json');
const external = existsSync(externalPath) ? JSON.parse(readFileSync(externalPath, 'utf8')).decks : [];
const SOURCE_NAMES = { speakerdeck: 'Speaker Deck', qiita: 'Qiita' };
const localCard = (d) => `    <a class="card" href="${encodeURIComponent(d.id)}/" data-kind="${esc(d.kind)}">
      <img src="${encodeURIComponent(d.id)}/thumbnail.png" width="1280" height="720" loading="lazy" alt="">
      <h2>${esc(d.title)}</h2>
      <p>${esc(d.kind)}・${esc(dateJa(d.date))}・${d.slideCount}枚${d.event ? `<br>${esc(d.event)}` : ''}</p>
    </a>`;
const externalCard = (d) => `    <a class="card" href="${esc(d.url)}" data-kind="external">
      <img src="${esc(d.thumbnail)}" width="1280" height="720" loading="lazy" alt="">
      <h2>${esc(d.title)}</h2>
      <p>${esc(dateJa(d.date))}・${esc(SOURCE_NAMES[d.source] ?? d.source)}</p>
    </a>`;
// 絞り込み。外部のスライドは LT か講演かを区別できないので「すべて」と「外部」にだけ出す
const FILTERS = [['all', 'すべて'], ['LT', 'LT'], ['講演', '講演'], ['external', 'Speaker Deck・Qiita']];
const filterBar = `  <div class="filters" role="group" aria-label="種類で絞り込む">
${FILTERS.map(([k, label], i) => `    <button class="btn" type="button" data-filter="${esc(k)}" aria-pressed="${i === 0}">${esc(label)}</button>`).join('\n')}
  </div>`;
const filterScript = `<script>
(function () {
  var buttons = document.querySelectorAll('[data-filter]');
  var cards = document.querySelectorAll('.card');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-filter');
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      cards.forEach(function (c) { c.hidden = k !== 'all' && c.getAttribute('data-kind') !== k; });
    });
  });
})();
</script>`;
// 同じ日付なら、このサイトのデッキを先に出す
const cards = [
  ...published.map((d) => ({ date: d.date, order: 0, html: localCard(d) })),
  ...external.map((d) => ({ date: d.date, order: 1, html: externalCard(d) })),
].sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order).map((c) => c.html).join('\n');

writeFileSync(join(DIST, 'index.html'), `<!doctype html>
<html lang="ja">
<head>
${headCommon('')}
<title>${esc(SITE_TITLE)}</title>
<meta property="og:title" content="${esc(SITE_TITLE)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(baseUrl)}/">
</head>
<body>
<main>
  ${avatarBlock('./', '<h1>LT スライド</h1>')}
${cards ? `${filterBar}\n  <div class="grid">\n${cards}\n  </div>` : '  <p class="empty">公開中のスライドはまだありません。</p>'}
  <p class="site-foot"><a href="all.json">all.json</a></p>
</main>
${cards ? filterScript : ''}
</body>
</html>
`);

// ---------- 個別ページ ----------
for (const d of published) {
  const id = encodeURIComponent(d.id);
  const description = [dateJa(d.date), d.event].filter(Boolean).join(' ');
  writeFileSync(join(DIST, d.id, 'index.html'), `<!doctype html>
<html lang="ja">
<head>
${headCommon('../')}
<title>${esc(d.title)} - 菅原のびすけ</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(d.title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(urlOf(d))}">
<meta property="og:image" content="${esc(urlOf(d))}thumbnail.png">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>
<main>
  ${avatarBlock('../', '<p class="site-name">LT スライド</p>')}
  <article class="detail">
    <div class="player"><iframe src="slides/" title="${esc(d.title)}" allowfullscreen></iframe></div>
    <div class="controls">
      <button class="btn" id="prev" type="button" aria-label="前のスライド">←</button>
      <span class="count" id="count" aria-live="polite">1 / ${d.slideCount}</span>
      <button class="btn" id="next" type="button" aria-label="次のスライド">→</button>
      <div class="end">
        <button class="btn" id="full" type="button">全画面</button>
        <a class="btn" href="${id}.pdf" download>PDF</a>
      </div>
    </div>
    <h1>${esc(d.title)}</h1>
    <p class="meta">${esc(dateJa(d.date))}・${d.slideCount}枚${d.event ? `<br>発表イベント：${d.eventUrl ? `<a href="${esc(d.eventUrl)}">${esc(d.event)}</a>` : esc(d.event)}` : ''}</p>
${d.article ? `    <div class="article">\n${d.article}\n    </div>\n` : ''}  </article>
</main>
<script>
(function () {
  var frame = document.querySelector('iframe');
  var count = document.getElementById('count');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var full = document.getElementById('full');
  function update() {
    var w = frame.contentWindow;
    var total = w.document.querySelectorAll('.lt-slide, svg[data-marpit-svg]').length;
    var at = parseInt(w.location.hash.slice(1), 10) || 1;
    count.textContent = at + ' / ' + total;
    prev.disabled = at <= 1;
    next.disabled = at >= total;
  }
  function go(key) {
    frame.contentWindow.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
    update();
  }
  frame.addEventListener('load', function () {
    update();
    var w = frame.contentWindow;
    w.addEventListener('keydown', function () { setTimeout(update); });
    w.addEventListener('click', function () { setTimeout(update); });
  });
  prev.addEventListener('click', function () { go('ArrowLeft'); });
  next.addEventListener('click', function () { go('ArrowRight'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); go(e.key); }
  });
  if (frame.requestFullscreen) {
    full.addEventListener('click', function () { frame.requestFullscreen().then(function () { frame.focus(); }); });
  } else {
    full.hidden = true;
  }
})();
</script>
</body>
</html>
`);
}

writeFileSync(join(DIST, '.nojekyll'), '');

// ---------- API。項目の削除や意味の変更をするときは version を上げる ----------
writeFileSync(join(DIST, 'all.json'), JSON.stringify({
  version: 1,
  decks: published.map((d) => {
    const url = urlOf(d);
    return {
      id: d.id,
      title: d.title,
      date: d.date,
      kind: d.kind,
      event: d.event ?? '',
      eventUrl: d.eventUrl ?? '',
      slideCount: d.slideCount,
      url,
      slides: `${url}slides/`,
      pdf: `${url}${encodeURIComponent(d.id)}.pdf`,
      thumbnail: `${url}thumbnail.png`,
    };
  }),
  external,
}, null, 2) + '\n');

for (const w of warnings) console.log(`注意: ${w}`);
console.log(`dist/ に ${published.length} 本のデッキを出力しました${published.length ? `: ${published.map((d) => d.id).join(', ')}` : ''}`);
