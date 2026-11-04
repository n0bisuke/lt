// deck.md を読み、Marp のスライドと記事の HTML を作る。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marp } from '@marp-team/marp-core';
import MarkdownIt from 'markdown-it';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const THEME = join(ROOT, 'design-system/marp/iotlt.css');

function splitLines(text) {
  // コードブロックの中の --- を区切りと間違えないように、行単位で見る
  const slides = [[]];
  let fence = null;
  for (const line of text.split('\n')) {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (m) {
      if (!fence) fence = m[1][0];
      else if (m[1][0] === fence) fence = null;
    }
    if (!fence && /^---\s*$/.test(line)) slides.push([]);
    else slides[slides.length - 1].push(line);
  }
  return slides.map((s) => s.join('\n'));
}

export function parseDeck(md) {
  const src = md.replace(/\r\n/g, '\n');
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  const meta = {};
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
      if (!m) continue;
      let v = m[2].trim();
      if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1);
      meta[m[1]] = v === 'true' ? true : v === 'false' ? false : v;
    }
  }
  return { meta, body: fm ? src.slice(fm[0].length) : src };
}

export function renderSlides(md, { title = '' } = {}) {
  const marp = new Marp({ html: true, math: false, emoji: { shortcode: false, unicode: false } });
  marp.themeSet.default = marp.themeSet.add(readFileSync(THEME, 'utf8'));
  const { html, css } = marp.render(md);
  const count = (html.match(/<svg\b[^>]*\bdata-marpit-svg/g) ?? []).length;
  const esc = title.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return {
    count,
    html: `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc}</title>
<style>${css}</style>
<link rel="stylesheet" href="../../design-system/project/components/bundle.css">
<script src="../../design-system/project/components/bundle.js"></script>
</head>
<body>
<main class="lt-deck">
${html}
</main>
<script>IoTLT.Deck.mount();</script>
</body>
</html>
`,
  };
}

// 記事: 発表者ノート（<!-- --> のコメント）を本文として、スライドの内容と順に並べる
const DIRECTIVE = /^\s*_?[A-Za-z]+\s*:/;

export function renderArticle(md) {
  const { body } = parseDeck(md);
  const it = new MarkdownIt({ html: true, linkify: true, breaks: true });
  const parts = [];
  for (const raw of splitLines(body)) {
    let cls = '';
    const notes = [];
    const text = raw.replace(/<!--([\s\S]*?)-->/g, (_, c) => {
      if (DIRECTIVE.test(c)) {
        const m = /^\s*_?class\s*:\s*(.+?)\s*$/m.exec(c);
        if (m) cls = m[1];
      } else {
        notes.push(c.trim());
      }
      return '';
    }).replace(/!\[bg[^\]]*\]/g, '![]').trim();
    // 1枚目と自己紹介はページの見出しと重なるので記事には入れない
    if (/\b(title|profile)\b/.test(cls)) continue;
    const heading = (/^#\s+(.+)$/m.exec(text) ?? [])[1] ?? '';
    const plain = text.replace(/\s+/g, ' ');
    const html = it.render(text)
      .replace(/<(\/?)h1\b/g, '<$1h2')
      .replace(/\sstyle="[^"]*"/g, '')
      .replace(/(src|poster)="images\//g, '$1="slides/images/')
      .replace(/<img /g, '<img loading="lazy" ')
      .trim();
    const notesHtml = notes.map((n) => it.render(n)).join('');
    if (!html && !notesHtml) continue;
    const prev = parts[parts.length - 1];
    // スライドを複製して段階的に見せた分は、最後の1枚だけ残す
    if (prev && heading && prev.heading === heading && plain.includes(prev.plain.replace(/^# .+? /, ''))) {
      parts[parts.length - 1] = { heading, plain, html, notes: [prev.notes, notesHtml].filter(Boolean).join('') };
    } else {
      parts.push({ heading, plain, html, notes: notesHtml });
    }
  }
  return parts.map((p) => `<section>\n${p.html}\n${p.notes}</section>`).join('\n');
}
