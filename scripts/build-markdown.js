// Generates a human-readable Markdown view of each article FROM the JSON source.
// One-way, for review/handoff readability only. JSON in articles/source/ remains
// the canonical pipeline input; do not edit these .md files expecting them to rebuild.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'articles', 'source');
const OUT = path.join(ROOT, 'articles', 'readable');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

function blockToMd(b) {
  switch (b.tag) {
    case 'h1': return `# ${b.text}`;
    case 'h2': return `## ${b.text}`;
    case 'h3': return `### ${b.text}`;
    case 'p': return b.text;
    case 'ul': return (b.items || []).map((i) => `- ${i}`).join('\n');
    case 'ol': return (b.items || []).map((i, n) => `${n + 1}. ${i}`).join('\n');
    case 'toc': return `## Table of Contents`;
    case 'table': {
      const h = (b.headers || []).map(cell);
      const head = `| ${h.join(' | ')} |`;
      const sep = `| ${h.map(() => '---').join(' | ')} |`;
      const rows = (b.rows || []).map((r) => `| ${(r || []).map(cell).join(' | ')} |`);
      return [head, sep, ...rows].join('\n');
    }
    case 'faq':
      return (b.items || []).map((qa) => `**${qa.q}**\n\n${qa.a}`).join('\n\n');
    default: return b.text || '';
  }
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.json'));
let n = 0;
for (const f of files) {
  const art = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
  const fm = [
    '---',
    `slug: ${art.slug || ''}`,
    `main_kw: ${art.main_kw || ''}`,
    `target_url: ${art.target_url || ''}`,
    `post_id: ${art.post_id != null ? art.post_id : ''}`,
    `source_doc: ${art.source || ''}`,
    '---',
    '',
    '> Auto-generated from articles/source/' + f + ' for readability. Do not hand-edit; edit the JSON source and re-run scripts/build-markdown.js.',
    '',
  ].join('\n');
  const body = (art.blocks || []).map(blockToMd).join('\n\n');
  fs.writeFileSync(path.join(OUT, f.replace(/\.json$/, '.md')), fm + body + '\n');
  n++;
}
console.log(`Generated ${n} markdown files into articles/readable/`);
