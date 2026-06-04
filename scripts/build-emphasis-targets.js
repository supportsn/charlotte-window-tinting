// Parse a Google-Doc export HTML -> per-block emphasis "targets" for in-place bolding.
// Output: [{ find, bold:[...], italic:[...] }] where:
//   find  = a distinctive plain-text prefix of the block (to locate the live widget)
//   bold  = phrases the doc bolds in that block (word-snapped, table & heading content excluded)
//   italic= phrases the doc italicizes
// Callout blocks (Pro Tip:/Important:/Tip:/Note:/Example:/Warning:/Reminder:) are EXCLUDED
// (handled separately). Usage: node scripts/build-emphasis-targets.js <doc.html>
const fs = require('fs');
let h = fs.readFileSync(process.argv[2], 'utf8');
h = h.replace(/<table[\s\S]*?<\/table>/gi, ''); // tables handled by wt-table

const styleBlock = (h.match(/<style[^>]*>([\s\S]*?)<\/style>/i) || [])[1] || '';
const bold = new Set(), ital = new Set();
let m, re = /\.([a-z0-9]+)\{([^}]*)\}/gi;
while ((m = re.exec(styleBlock))) {
  if (/font-weight:\s*700/.test(m[2])) bold.add(m[1]);
  if (/font-style:\s*italic/.test(m[2])) ital.add(m[1]);
}
const decode = (t) => t.replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
const isWord = (c) => !!c && /[A-Za-z0-9]/.test(c);
const CALLOUT = /^(Pro Tip|Important|Tip|Note|Example|Warning|Reminder)\s*:/i;

// returns {plain, runs:[{s,e,b,i}]}
function analyze(inner) {
  const spans = [...inner.matchAll(/<span class="([^"]*)"[^>]*>([\s\S]*?)<\/span>/gi)];
  let plain = ''; const runs = [];
  if (!spans.length) { return { plain: decode(inner).replace(/\s+/g, ' ').trim(), runs: [] }; }
  for (const s of spans) {
    const cls = s[1].split(/\s+/);
    const t = decode(s[2]);
    if (!t) continue;
    const b = cls.some((c) => bold.has(c)), i = cls.some((c) => ital.has(c));
    const start = plain.length; plain += t; const end = plain.length;
    if (b || i) runs.push({ s: start, e: end, b, i });
  }
  return { plain, runs };
}
function snapPhrases(plain, runs, want) {
  const res = [];
  for (const r of runs) {
    if (!r[want]) continue;
    let s = r.s, e = r.e;
    while (s > 0 && isWord(plain[s - 1])) s--;
    while (e < plain.length && isWord(plain[e])) e++;
    let p = plain.slice(s, e).replace(/\s+/g, ' ').trim();
    // drop leading/trailing punctuation-only fragments
    p = p.replace(/^[^A-Za-z0-9]+/, '').replace(/\s*[:,.;]+$/, '').trim();
    if (p.length >= 3 && /[A-Za-z]/.test(p)) res.push(p);
  }
  return [...new Set(res)];
}

const STOP = new Set(['how','the','a','an','in','on','of','to','and','or','for','your','you','it','is','in charlotte','charlotte','nc']);
const decEnt = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');
function clean(arr) {
  // canonicalize brand fragments
  let a = arr.map((p) => /sun stoppers/i.test(p) ? 'Sun Stoppers Window Tinting in Charlotte' : decEnt(p).trim());
  const brand = a.some((p) => p === 'Sun Stoppers Window Tinting in Charlotte');
  a = a.filter((p) => {
    const low = p.toLowerCase();
    if (STOP.has(low)) return false;             // junk / stopword
    if (brand && (low === 'charlotte' || low === 'in charlotte')) return false; // brand fragment
    if (p.replace(/[^A-Za-z0-9]/g, '').length < 3) return false;
    return true;
  });
  a = [...new Set(a)];
  // drop phrases that are substrings of a longer phrase in the same block
  a = a.filter((p) => !a.some((q) => q !== p && q.includes(p)));
  return a;
}

const out = [];
const blockRe = /<(p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi; let blk;
while ((blk = blockRe.exec(h))) {
  const tag = blk[1].toLowerCase();
  let plain = '', bold_ = [], ital_ = [];
  if (tag === 'p') {
    const a = analyze(blk[2]); plain = a.plain.replace(/\s+/g, ' ').trim();
    if (CALLOUT.test(plain)) continue;
    bold_ = snapPhrases(a.plain, a.runs, 'b'); ital_ = snapPhrases(a.plain, a.runs, 'i');
  } else {
    const lis = [...blk[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
    const plains = []; const bset = [], iset = [];
    for (const li of lis) {
      const a = analyze(li[1]);
      plains.push(a.plain.replace(/\s+/g, ' ').trim());
      bset.push(...snapPhrases(a.plain, a.runs, 'b'));
      iset.push(...snapPhrases(a.plain, a.runs, 'i'));
    }
    plain = plains.join(' ');
    if (CALLOUT.test(plains[0] || '')) continue;
    bold_ = [...new Set(bset)]; ital_ = [...new Set(iset)];
  }
  bold_ = clean(bold_); ital_ = clean(ital_);
  if (!bold_.length && !ital_.length) continue;
  const find = plain.slice(0, 45);
  out.push({ find, bold: bold_, italic: ital_ });
}
console.log(JSON.stringify(out, null, 2));
