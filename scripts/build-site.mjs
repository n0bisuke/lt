#!/usr/bin/env node
// deck.json が published: true のデッキだけを dist/ に集め、GitHub Pages 用のサイトを作る。
//   /            スライド一覧
//   /<id>/       個別ページ（プレイヤー、PDF）
//   /<id>/slides/ スライド本体
//   /all.json    一覧の API
// PDF とサムネイルは別の GitHub Actions で生成し、Pages 公開に含める。
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, normalize, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { applySlideAdjustments, kindOf, parseDeck, renderArticle, renderSlides } from './lib/deck.mjs';
import { buildVariants, findVariantMasters } from './lecture/build-variants.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const DECKS = join(ROOT, 'decks');
const MAX_PDF_MB = 90; // GitHub は 100MB を超えるファイルを受け付けない
const MOVE_UNUSED = process.argv.includes('--move-unused');
const PREVIEW = process.argv.includes('--preview');
const REQUIRE_ARTIFACTS = process.argv.includes('--require-artifacts');
const SKIP_VARIANTS = process.argv.includes('--skip-variants');
const SITE_TITLE = 'LT スライド - 菅原のびすけ';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const errors = [];
const warnings = [];
const moves = [];
const baseUrl = JSON.parse(readFileSync(join(ROOT, 'site.json'), 'utf8')).baseUrl.replace(/\/$/, '');

function updatedAtFor(sourcePath) {
  const repoPath = relative(ROOT, sourcePath);
  const dirty = spawnSync('git', ['status', '--porcelain', '--', repoPath], { cwd: ROOT, encoding: 'utf8' }).stdout?.trim();
  if (dirty) return statSync(sourcePath).mtime.toISOString();
  const committed = spawnSync('git', ['log', '-1', '--format=%cI', '--', repoPath], { cwd: ROOT, encoding: 'utf8' }).stdout?.trim();
  return committed || statSync(sourcePath).mtime.toISOString();
}

if (!SKIP_VARIANTS) for (const master of findVariantMasters()) buildVariants(master);

function allFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? allFiles(join(dir, e.name)) : [join(dir, e.name)]));
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

function collectDeckDirs(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const hasDeck = entries.some((entry) => entry.isFile() && ['deck.md', 'deck.json'].includes(entry.name));
  const found = hasDeck ? [dir] : [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || ['images', 'notes', 'unused'].includes(entry.name)) continue;
    found.push(...collectDeckDirs(join(dir, entry.name)));
  }
  return found;
}

const published = [];
const shared = new Set();
for (const dir of collectDeckDirs(DECKS)) {
  const folderName = basename(dir);
  const mdPath = join(dir, 'deck.md');
  const metaPath = join(dir, 'deck.json');
  const isMd = existsSync(mdPath);
  if (!isMd && !existsSync(metaPath)) continue;
  const source = isMd ? readFileSync(mdPath, 'utf8') : null;
  const meta = isMd ? parseDeck(source).meta : JSON.parse(readFileSync(metaPath, 'utf8'));
  if (meta.published !== true) continue;
  const isVariantMaster = isMd && meta.variants === true;
  const id = meta.id ?? folderName;
  // path lets a versioned deck keep a nested public route without changing its API id.
  const route = meta.path ?? id;
  const parentDir = dirname(dir);
  const childVariantName = basename(dir);
  const parentDeck = join(parentDir, 'deck.md');
  const parentMeta = existsSync(parentDeck) ? parseDeck(readFileSync(parentDeck, 'utf8')).meta : {};
  const parentIsVariantMaster = parentMeta.variants === true;
  if (parentIsVariantMaster) {
    const configured = String(parentMeta.variantNames ?? '15min,10min,5min').split(',').map((name) => name.trim());
    // 15分版は親デッキ自身。旧15min/や設定外の版は公開対象にしない。
    if (childVariantName === '15min' || !configured.includes(childVariantName)) continue;
  }
  const variantGroup = parentIsVariantMaster || isVariantMaster
    ? relative(DECKS, isVariantMaster ? dir : parentDir)
    : null;
  const variantName = isVariantMaster ? 'parent' : parentIsVariantMaster ? childVariantName : null;
  const routeParts = String(route).split('/');
  if (!routeParts.length || routeParts.some((part) => !/^[a-zA-Z0-9._-]+$/.test(part) || part === '.' || part === '..')) {
    errors.push(`${id}: path は英数字・._- のパス区切りで指定してください`);
    continue;
  }

  const htmlPath = isMd ? mdPath : join(dir, 'index.html');
  // Markdown のデッキは、ここで HTML と記事に変換する
  const assetPrefix = `${'../'.repeat(routeParts.length + 1)}design-system`;
  const renderSource = isMd ? source : null;
  const rendered = isMd ? renderSlides(renderSource, { title: meta.title ?? '', assetPrefix }) : null;
  const adjustmentPath = join(dir, '.lt-adjustments.json');
  const adjustments = existsSync(adjustmentPath) ? JSON.parse(readFileSync(adjustmentPath, 'utf8')) : {};
  const html = isMd
    ? applySlideAdjustments(
      rendered.html.replace(/(?:\.\.\/)+design-system\//g, `${assetPrefix}/`),
      adjustments,
    )
    : readFileSync(htmlPath, 'utf8');
  const article = isMd ? renderArticle(renderSource, { assetPrefix: '../'.repeat(routeParts.length) }) : '';
  const pdfPath = join(dir, `${id}.pdf`);
  const thumbnailCandidates = [join(dir, 'thumbnail.png')];
  if (isVariantMaster) {
    const thumbnailVersions = String(meta.variantNames ?? '15min,10min').split(',').map((name) => name.trim());
    thumbnailCandidates.push(...thumbnailVersions.map((name) => join(dir, name, 'thumbnail.png')));
  }
  const thumbPath = thumbnailCandidates.find((candidate) => existsSync(candidate)) ?? null;

  if (/class="[^"]*\blt-slot\b/.test(source ?? html)) errors.push(`${id}: 差し替えていない lt-slot が残っています`);
  if ((source ?? html).includes('【要確認】')) errors.push(`${id}: 【要確認】が残っています`);
  if (!meta.title || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date ?? '')) errors.push(`${id}: deck.json の title か date（YYYY-MM-DD）が正しくありません`);
  if (meta.eventUrl && !/^https?:\/\//.test(meta.eventUrl)) errors.push(`${id}: deck.json の eventUrl は http(s) の URL にしてください`);
  if (!thumbPath && REQUIRE_ARTIFACTS) errors.push(`${id}: thumbnail.png がありません（ActionsでPDF出力してください）`);
  if (!existsSync(pdfPath)) {
    if (REQUIRE_ARTIFACTS) errors.push(`${id}: PDF がありません（ActionsでPDF出力してください）`);
  } else {
    const mb = statSync(pdfPath).size / 1024 / 1024;
    if (mb > MAX_PDF_MB) errors.push(`${id}: PDF が ${Math.round(mb)}MB あり、GitHub に置けません`);
    if (!process.env.CI && statSync(pdfPath).mtimeMs < statSync(htmlPath).mtimeMs) warnings.push(`${id}: PDF が index.html より古いです`);
  }

  // スライドが使っているファイルだけを公開する（未使用の画像やメモは出さない）
  const refs = new Set();
  for (const m of html.matchAll(/\b(?:src|poster)=["']([^"']+)["']/g)) {
    const r = decodeURI(m[1]).split(/[?#]/)[0];
    if (!/^[a-z]+:|^\/\//i.test(r) && !r.startsWith('../')) refs.add(normalize(r));
  }
  // Markdown の ![](images/x) や ![bg](images/x) も拾う
  if (isMd) for (const m of source.matchAll(/\bimages\/[^\s"'()<>&;]+/g)) refs.add(normalize(decodeURI(m[0])));
  const missingRefs = [...refs].filter((r) => r.startsWith('..') || !existsSync(join(dir, r)));
  if (missingRefs.length && PREVIEW) {
    console.warn(`プレビュー対象から除外: ${relative(DECKS, dir)}（不足画像: ${missingRefs.join(', ')}）`);
    continue;
  }
  // テーマの素材（講演テーマのフォント、時代画像、ロゴなど）はサイト直下に同じ位置で置く
  for (const m of html.matchAll(/(?:\.\.\/)+(design-system\/[^\s"'()<>&;?#]+)/g)) {
    const f = decodeURI(m[1]);
    if (!existsSync(join(ROOT, f))) errors.push(`${id}: ${f} が見つかりません`);
    else shared.add(f);
  }
  const out = join(DIST, ...routeParts);
  const slides = join(out, 'slides');
  mkdirSync(slides, { recursive: true });
  // slides/ は decks/<id>/ と同じ深さなので、../../design-system のパスはそのまま使える
  writeFileSync(join(slides, 'index.html'), html);
  if (existsSync(pdfPath)) cpSync(pdfPath, join(out, `${id}.pdf`));
  if (thumbPath) cpSync(thumbPath, join(out, 'thumbnail.png'));
  for (const r of refs) {
    const from = join(dir, r);
    if (r.startsWith('..') || !existsSync(from)) { errors.push(`${id}: ${r} が見つかりません`); continue; }
    mkdirSync(dirname(join(slides, r)), { recursive: true });
    cpSync(from, join(slides, r));
  }
  const imagesDir = join(dir, 'images');
  if (existsSync(imagesDir)) {
    const unused = allFiles(imagesDir).map((f) => relative(dir, f).split(sep).join('/')).filter((f) => !refs.has(normalize(f)));
    if (unused.length && MOVE_UNUSED) {
      moves.push({ name: id, dir, unused });
    } else if (unused.length) {
      warnings.push(`${id}: 未使用の画像 ${unused.length} 個はサイトに出しませんが、コミットすると公開リポジトリには残ります（--move-unused で unused/ に移せます）: ${unused.join(', ')}`);
    }
  }
  published.push({
    id,
    route: routeParts.join('/'),
    ...meta,
    kind: kindOf(meta),
    article,
    slideCount: isMd ? rendered.count : (html.match(/<section\s+class="[^"]*\blt-slide\b/g) ?? []).length,
    updatedAt: [updatedAtFor(isMd ? mdPath : metaPath),
      ...(existsSync(adjustmentPath) ? [updatedAtFor(adjustmentPath)] : [])]
      .sort((a, b) => new Date(b) - new Date(a))[0],
    variantGroup,
    variantName: variantGroup ? variantName : null,
    hasPdf: existsSync(pdfPath),
    isMarkdown: isMd,
    hasThumbnail: Boolean(thumbPath),
  });
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

const encodeRoute = (route) => route.split('/').map(encodeURIComponent).join('/');
const urlOf = (d) => `${baseUrl}/${encodeRoute(d.route ?? d.id)}/`;
const pdfWorkflowUrl = 'https://github.com/n0bisuke/lt/actions/workflows/pdf-export.yml';
const pdfRequestUrl = (d) => {
  const params = new URLSearchParams({
    title: `[PDF request] ${d.id}`,
    body: `Deck ID: \`${d.id}\`\n\nこのデッキのPDF生成をお願いします。`,
  });
  return `https://github.com/n0bisuke/lt/issues/new?${params}`;
};
const dateJa = (s) => { const [y, m, d] = s.split('-').map(Number); return `${y}年${m}月${d}日`; };
const updatedJa = (s) => new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(s));

const variantOrder = { parent: 0, '10min': 1, '15min': 2, '5min': 3, 'v0.1': 4 };
const groupedVersions = new Map();
for (const deck of published) {
  if (!deck.variantGroup) continue;
  if (!groupedVersions.has(deck.variantGroup)) groupedVersions.set(deck.variantGroup, []);
  groupedVersions.get(deck.variantGroup).push(deck);
}
const listablePublished = published.filter((deck) => !deck.variantGroup);
for (const versions of groupedVersions.values()) {
  versions.sort((a, b) => variantOrder[a.variantName] - variantOrder[b.variantName]);
  for (const version of versions) version.versions = versions;
  listablePublished.push(versions.find((version) => version.variantName === 'parent') ?? versions[0]);
}

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
.site-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; margin-bottom: 40px; }
.site-top .site-head { margin-bottom: 0; }
.site-top .btn { display: inline-flex; align-items: center; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 40px 24px; }
.card { display: block; text-decoration: none; }
.card[hidden] { display: none; }
.search { display: block; margin-bottom: 16px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.search input { width: 100%; max-width: 480px; min-height: 44px; padding: 8px 12px; border: var(--stroke-rule) solid var(--ink-strong); border-radius: var(--radius-none); background: var(--paper); color: var(--ink); font: inherit; }
.search input:focus-visible { outline: var(--stroke-rule) solid var(--ink-strong); outline-offset: 2px; }
.no-match { padding: 24px 0; border-top: 1px solid var(--rule-soft); }
.no-match[hidden] { display: none; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
.filters .btn[aria-pressed="true"] { background: var(--ink-strong); color: var(--paper); }
.card img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: contain; border: 1px solid var(--rule-soft); }
.card h2 { margin: 12px 0 4px; font-size: 18px; font-weight: 700; line-height: 1.4; }
.card:hover h2 { text-decoration: underline; }
.card p { margin: 0; font-size: 14px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.tags:not(:has(.tag:not([hidden]))) { display: none; }
.tags + h2 { margin-top: 6px; }
.tag { padding: 0 8px; border-radius: var(--radius-chip); background: var(--chip); font-size: 13px; font-weight: 700; line-height: 1.7; }
.tag[hidden] { display: none; }
.tag-wip { background: var(--accent-red); color: var(--paper); }
.empty { padding: 24px 0; border-top: 1px solid var(--rule-soft); }
.site-foot { margin-top: 64px; padding-top: 16px; border-top: 1px solid var(--rule-soft); font-size: 14px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 24px; }
.site-foot p { margin: 0; }

/* 右下に追従する問い合わせ */
.contact { position: fixed; right: 16px; bottom: 16px; z-index: 10; }
.contact summary { list-style: none; display: inline-block; min-height: 44px; padding: 10px 18px; border: var(--stroke-rule) solid var(--ink-strong); background: var(--ink-strong); color: var(--paper); font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgb(0 0 0 / 0.18); }
.contact summary::-webkit-details-marker { display: none; }
.contact summary:focus-visible { outline: var(--stroke-rule) solid var(--ink-strong); outline-offset: 2px; }
.contact[open] summary { background: var(--paper); color: var(--ink-strong); }
.contact ul { position: absolute; right: 0; bottom: calc(100% + 8px); margin: 0; padding: 8px 0; list-style: none; min-width: 240px; border: var(--stroke-rule) solid var(--ink-strong); background: var(--paper); box-shadow: 0 4px 12px rgb(0 0 0 / 0.18); }
.contact li a { display: block; padding: 10px 16px; text-decoration: none; }
.contact li a:hover { background: var(--chip); }
.contact li small { display: block; font-size: 13px; color: var(--ink-muted); }
main { padding-bottom: 120px; }

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
.last-updated { margin: 10px 0 0; text-align: right; color: var(--ink-muted); font-size: 13px; }
.versions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 20px; }
.versions-label { margin-right: 4px; color: var(--ink-muted); font-size: 14px; }
.versions .btn[aria-current="page"] { background: var(--ink-strong); color: var(--paper); }
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

// ---------- 共通の問い合わせとフッター ----------
const CONTACTS = [
  ['X で DM する', '@n0bisuke・お問い合わせはこちら', 'https://x.com/n0bisuke'],
  ['Qiita', 'qiita.com/n0bisuke', 'https://qiita.com/n0bisuke'],
  ['GitHub', 'github.com/n0bisuke', 'https://github.com/n0bisuke'],
];
const contactWidget = `<details class="contact">
  <summary>お問い合わせはこちら</summary>
  <ul>
${CONTACTS.map(([label, sub, url]) => `    <li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}<small>${esc(sub)}</small></a></li>`).join('\n')}
  </ul>
</details>`;
const YEAR = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 4);
const siteFoot = (extra = '') => `  <footer class="site-foot">${extra ? `<p>${extra}</p>` : ''}<p>© ${YEAR} 菅原のびすけ</p></footer>`;

// ---------- 一覧 ----------
const externalPath = join(ROOT, 'external.json');
const external = existsSync(externalPath) ? JSON.parse(readFileSync(externalPath, 'utf8')).decks : [];
// 画面に出す種類の名前。all.json の kind（LT / 講演）は取得側のために変えない
const KIND_LABELS = { 講演: '講演・セミナー' };
const kindLabel = (k) => KIND_LABELS[k] ?? k;
const SOURCE_NAMES = { speakerdeck: 'Speaker Deck', qiita: 'Qiita', slideshare: 'SlideShare' };
// IoTLT の発表はタイトル・イベント名・イベントページから見分ける
const isIotlt = (d) => /iotlt/i.test([d.title, d.event, d.eventUrl].filter(Boolean).join(' '));
// 発表日が未来なら WIP。ページを開いた日で一覧のスクリプトが付け外しするので、組み立て直さなくても日付が過ぎれば外れる
const todayJst = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
const cardAttrs = (d, kind) => `data-kind="${esc(kind)}" data-date="${esc(d.date)}"${isIotlt(d) ? ' data-iotlt' : ''}`;
const tags = (d) => `      <div class="tags">${isIotlt(d) ? '<span class="tag">IoTLT</span>' : ''}<span class="tag tag-wip"${d.date > todayJst ? '' : ' hidden'}>WIP</span></div>`;
const localCard = (d) => `    <a class="card" href="${encodeRoute(d.route ?? d.id)}/" ${cardAttrs(d, d.kind)}>
${d.hasThumbnail ? `      <img src="${encodeRoute(d.route ?? d.id)}/thumbnail.png" width="1280" height="720" loading="lazy" alt="">` : ''}
${tags(d)}
      <h2>${esc(d.title)}</h2>
      <p>${esc(kindLabel(d.kind))}・${esc(dateJa(d.date))}・${d.versions ? `${d.versions.length}つの${d.versions.some((version) => version.variantName === 'v0.1') ? 'バージョン' : '発表時間版'}` : `${d.slideCount}枚`}${d.event ? `<br>${esc(d.event)}` : ''}</p>
    </a>`;
const externalCard = (d) => `    <a class="card" href="${esc(d.url)}" ${cardAttrs(d, 'external')}>
      <img src="${esc(d.thumbnail)}" width="1280" height="720" loading="lazy" alt="">
${tags(d)}
      <h2>${esc(d.title)}</h2>
      <p>${esc(dateJa(d.date))}・${esc(SOURCE_NAMES[d.source] ?? d.source)}</p>
    </a>`;
// 絞り込み。外部のスライドは LT か講演かを区別できないので「すべて」「IoTLT」「外部」にだけ出す
const FILTERS = [['all', 'すべて'], ['LT', 'LT'], ['講演', kindLabel('講演')], ['IoTLT', 'IoTLT'], ['external', 'Speaker Deck・Qiita・SlideShare']];
const filterBar = `  <label class="search"><span class="visually-hidden">タイトルで検索</span><input type="search" id="q" placeholder="タイトルで検索（例：iot）" autocomplete="off"></label>
  <div class="filters" role="group" aria-label="種類で絞り込む">
${FILTERS.map(([k, label], i) => `    <button class="btn" type="button" data-filter="${esc(k)}" aria-pressed="${i === 0}">${esc(label)}</button>`).join('\n')}
  </div>`;
const filterScript = `<script>
(function () {
  var buttons = document.querySelectorAll('[data-filter]');
  var cards = document.querySelectorAll('.card');
  var input = document.getElementById('q');
  var noMatch = document.getElementById('no-match');
  var kind = 'all';
  // 全角・半角と大文字・小文字を区別せずにタイトルの部分一致で探す
  var norm = function (s) { return s.normalize('NFKC').toLowerCase(); };
  cards.forEach(function (c) { c.dataset.title = norm(c.querySelector('h2').textContent); });
  function apply() {
    var q = norm(input.value.trim());
    var shown = 0;
    cards.forEach(function (c) {
      var okKind = kind === 'all' || (kind === 'IoTLT' ? c.hasAttribute('data-iotlt') : c.getAttribute('data-kind') === kind);
      c.hidden = !(okKind && (!q || c.dataset.title.indexOf(q) !== -1));
      if (!c.hidden) shown++;
    });
    noMatch.hidden = shown > 0;
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      kind = b.getAttribute('data-filter');
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      apply();
    });
  });
  input.addEventListener('input', apply);
  apply();
  var today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  cards.forEach(function (c) {
    var wip = c.querySelector('.tag-wip');
    if (wip) wip.hidden = !(c.getAttribute('data-date') > today);
  });
})();
</script>`;
// 同じ日付なら、このサイトのデッキを先に出す
const cards = [
  ...listablePublished.map((d) => ({ date: d.date, order: 0, html: localCard(d) })),
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
  <div class="site-top">
    ${avatarBlock('./', '<h1>LT スライド</h1>')}
    <a class="btn" href="https://github.com/n0bisuke/lt" target="_blank" rel="noopener">GitHub リポジトリ</a>
  </div>
${cards ? `${filterBar}\n  <div class="grid">\n${cards}\n  </div>\n  <p class="no-match" id="no-match" hidden>一致するスライドはありません。</p>` : '  <p class="empty">公開中のスライドはまだありません。</p>'}
${siteFoot('<a href="all.json">all.json</a>')}
</main>
${contactWidget}
${cards ? filterScript : ''}
</body>
</html>
`);

// ---------- 個別ページ ----------
for (const d of published) {
  const id = encodeURIComponent(d.id);
  const routeParts = (d.route ?? d.id).split('/');
  const routePath = join(DIST, ...routeParts);
  const rootPrefix = '../'.repeat(routeParts.length);
  const versionSelector = d.versions?.length > 1
    ? `<nav class="versions" aria-label="デッキのバージョンを選択"><span class="versions-label">バージョン</span>${d.versions.map((version) => {
      const current = version.id === d.id;
      const label = { parent: '親デッキ', '10min': '10分版', '15min': '15分版', '5min': '5分版', 'v0.1': '旧版（v0.1）' }[version.variantName] ?? version.variantName;
      return `<a class="btn" href="${rootPrefix}${encodeRoute(version.route)}/"${current ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join('')}</nav>`
    : '';
  const description = [dateJa(d.date), d.event].filter(Boolean).join(' ');
  writeFileSync(join(routePath, 'index.html'), `<!doctype html>
<html lang="ja">
<head>
${headCommon(rootPrefix)}
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
  <div class="site-top">
    ${avatarBlock(rootPrefix, '<p class="site-name">LT スライド</p>')}
    <a class="btn" href="https://github.com/n0bisuke/lt" target="_blank" rel="noopener">GitHub リポジトリ</a>
  </div>
  <article class="detail">
    <div class="player"><iframe src="slides/" title="${esc(d.title)}" allowfullscreen></iframe></div>
    <div class="controls">
      <button class="btn" id="prev" type="button" aria-label="前のスライド">←</button>
      <span class="count" id="count" aria-live="polite">1 / ${d.slideCount}</span>
      <button class="btn" id="next" type="button" aria-label="次のスライド">→</button>
      <div class="end">
        <button class="btn" id="full" type="button">全画面</button>
      ${d.hasPdf ? `<a class="btn" href="${encodeURIComponent(d.id)}.pdf" download>PDF</a>` : `<a class="btn" href="${pdfWorkflowUrl}" target="_blank" rel="noopener">PDF成果物</a>${d.isMarkdown ? `<a class="btn" href="${pdfRequestUrl(d)}" target="_blank" rel="noopener">PDFを生成</a>` : ''}`}
      </div>
    </div>
    <h1>${esc(d.title)}</h1>
  <p class="meta">${esc(dateJa(d.date))}・${d.slideCount}枚${d.variantName === 'v0.1' ? '・旧版' : ''}${d.event ? `<br>発表イベント：${d.eventUrl ? `<a href="${esc(d.eventUrl)}">${esc(d.event)}</a>` : esc(d.event)}` : ''}</p>
    <p class="last-updated"><time datetime="${esc(d.updatedAt)}">最終更新：${esc(updatedJa(d.updatedAt))}</time></p>
${versionSelector ? `    ${versionSelector}\n` : ''}
${d.article ? `    <div class="article">\n${d.article}\n    </div>\n` : ''}  </article>
${siteFoot()}
</main>
${contactWidget}
<script>
(function () {
  var frame = document.querySelector('iframe');
  var count = document.getElementById('count');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var full = document.getElementById('full');
  function applySlideFragment() {
    var fragment = window.location.hash.slice(1);
    var slideFragment = /^(?:stopwatch|timer5|timer10|\\d+)$/.test(fragment) ? '#' + fragment : '';
    var nextSrc = 'slides/' + slideFragment;
    if (frame.getAttribute('src') !== nextSrc) frame.setAttribute('src', nextSrc);
  }
  applySlideFragment();
  window.addEventListener('hashchange', applySlideFragment);
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

  // 以前の /<id>/ URL は残し、版別パスへ転送する。
  if (d.variantGroup && d.route !== d.id) {
    const legacyDir = join(DIST, d.id);
    const target = `../${encodeRoute(d.route)}/`;
    mkdirSync(legacyDir, { recursive: true });
    writeFileSync(join(legacyDir, 'index.html'), `<!doctype html><html lang="ja"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><title>スライドのURLが変わりました</title><p><a href="${target}">新しいURLへ移動</a></p></html>\n`);
  }
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
      updatedAt: d.updatedAt,
      url,
      slides: `${url}slides/`,
      ...(d.hasPdf ? { pdf: `${url}${encodeURIComponent(d.id)}.pdf` } : {}),
      ...(d.isMarkdown ? { pdfRequest: pdfRequestUrl(d) } : {}),
      thumbnail: `${url}thumbnail.png`,
    };
  }),
  external,
}, null, 2) + '\n');

for (const w of warnings) console.log(`注意: ${w}`);
console.log(`dist/ に ${published.length} 本のデッキを出力しました${published.length ? `: ${published.map((d) => d.id).join(', ')}` : ''}`);
