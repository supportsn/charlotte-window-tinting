// Parse a Google-Doc export HTML and emit, for each BODY block (p / ul / ol),
// its plain text + an "emphasized" HTML version where bold runs -> <strong> and
// italic runs -> <em> (positions taken from the doc's own CSS classes).
// Headings (h1-h6) and tables are skipped (already styled / wt-table handles them).
// Usage: node scripts/extract-emphasis.js <path-to-doc.html>  > out.json
const fs = require('fs');
const file = process.argv[2];
let h = fs.readFileSync(file, 'utf8');
// Drop tables (their cells are <p> in the GDoc export; our wt-table handles table styling)
h = h.replace(/<table[\s\S]*?<\/table>/gi, '');

// 1) bold / italic classes from <style>
const styleBlock = (h.match(/<style[^>]*>([\s\S]*?)<\/style>/i) || [])[1] || '';
const bold = new Set(), ital = new Set();
let m, re = /\.([a-z0-9]+)\{([^}]*)\}/gi;
while ((m = re.exec(styleBlock))) {
  if (/font-weight:\s*700/.test(m[2])) bold.add(m[1]);
  if (/font-style:\s*italic/.test(m[2])) ital.add(m[1]);
}

const decode = (t) => t.replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&nbsp;/g, ' ').replace(/&#?[a-z0-9]+;/gi, ' ');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Build emphasized inline HTML from the inner HTML of a block.
// Walks <span class="..">text</span> runs, merging consecutive same-emphasis runs.
function inline(inner) {
  const parts = [];
  const spanRe = /<span class="([^"]*)"[^>]*>([\s\S]*?)<\/span>/gi; let s;
  let lastIndex = 0, any = false;
  while ((s = spanRe.exec(inner))) {
    any = true;
    const cls = s[1].split(/\s+/);
    const txtRaw = decode(s[2]);
    if (!txtRaw) continue;
    const b = cls.some((c) => bold.has(c));
    const i = cls.some((c) => ital.has(c));
    parts.push({ t: txtRaw, b, i });
  }
  if (!any) { // no spans — just text
    const t = decode(inner); return { plain: t.replace(/\s+/g, ' ').trim(), html: esc(t).replace(/\s+/g, ' ').trim() };
  }
  // merge consecutive same-style
  const merged = [];
  for (const p of parts) {
    const last = merged[merged.length - 1];
    if (last && last.b === p.b && last.i === p.i) last.t += p.t; else merged.push({ ...p });
  }
  let html = '', plain = '';
  for (const p of merged) {
    plain += p.t;
    let seg = esc(p.t);
    // don't bold/italic pure whitespace
    if (p.b && seg.trim()) seg = `<strong>${seg}</strong>`;
    if (p.i && seg.trim()) seg = `<em>${seg}</em>`;
    html += seg;
  }
  return { plain: plain.replace(/\s+/g, ' ').trim(), html: html.replace(/\s+/g, ' ').trim() };
}

const out = [];
// top-level blocks in order
const blockRe = /<(p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi; let blk;
while ((blk = blockRe.exec(h))) {
  const tag = blk[1].toLowerCase();
  const innerAll = blk[2];
  if (tag === 'p') {
    const r = inline(innerAll);
    if (!r.plain) continue;
    out.push({ tag: 'p', plain: r.plain, html: `<p>${r.html}</p>`, hasEmphasis: /<strong>|<em>/.test(r.html) });
  } else {
    // ul/ol: each <li>
    const lis = [...innerAll.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => inline(x[1]));
    if (!lis.length) continue;
    const plain = lis.map((l) => l.plain).join(' | ');
    const html = `<${tag}>` + lis.map((l) => `<li>${l.html}</li>`).join('') + `</${tag}>`;
    out.push({ tag, plain, html, hasEmphasis: /<strong>|<em>/.test(html) });
  }
}
console.log(JSON.stringify(out.filter((b) => b.hasEmphasis), null, 2));
