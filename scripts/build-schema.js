// Build per-post JSON-LD @graph (BlogPosting + FAQPage) as an HTML <script> string,
// mirroring the 7982 schema. Sources: articles/source/<slug>.json (H1 + faq),
// articles/seo-meta.json (focus_keyword + description), articles/og-images.json (image URL).
// datePublished/dateModified = DATE (full ISO-8601 datetime WITH timezone so Google Rich
// Results does not warn about "invalid datetime"/"missing timezone").
const fs = require('path') && require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const idx = require(path.join(ROOT, 'articles/_index.json'));
const seo = require(path.join(ROOT, 'articles/seo-meta.json'));
const seoById = Object.fromEntries(seo.posts.map(p => [String(p.post_id), p]));
const ogById = require(path.join(ROOT, 'articles/og-images.json')); // post_id -> featured image URL

const DATE = '2026-06-05T08:00:00-04:00';
// articleSection by topic cluster (replaces the old generic "Window Tinting Blog")
const SECTION = {
  '7982': 'Window Tinting', '7986': 'Window Tinting', '7999': 'Window Tinting', '8018': 'Window Tinting',
  '7987': 'Solar Shades & Blinds', '8008': 'Solar Shades & Blinds', '8025': 'Solar Shades & Blinds',
  '7988': 'Paint Protection Film', '8002': 'Paint Protection Film', '8015': 'Paint Protection Film', '7989': 'Paint Protection Film', '8009': 'Paint Protection Film',
  '8027': 'Ceramic Coating', '7990': 'Ceramic Coating', '8003': 'Ceramic Coating', '8026': 'Ceramic Coating', '7991': 'Ceramic Coating',
  '7973': 'Vinyl Wrap', '8001': 'Vinyl Wrap', '8017': 'Vinyl Wrap',
};
const ORG = {
  '@type': 'Organization',
  name: 'Sun Stoppers Window Tinting In Charlotte',
  url: 'https://charlottewindowtinting.com/'
};
const PUBLISHER = {
  ...ORG,
  logo: {
    '@type': 'ImageObject',
    url: 'https://charlottewindowtinting.com/wp-content/uploads/2023/10/sun-stoppers-logo.png'
  }
};

const OUTDIR = path.join(ROOT, 'articles/schema');
fs.mkdirSync(OUTDIR, { recursive: true });

let done = 0;
for (const a of idx.articles) {
  // 7982 is also emitted for a complete 20-file manifest (same shape as the rest).
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, a.source), 'utf8'));
  const meta = seoById[String(a.post_id)];
  if (!meta) { console.log('NO SEO META', a.post_id); continue; }
  const h1 = (src.blocks.find(b => b.tag === 'h1') || {}).text || a.topic;
  const faq = src.blocks.find(b => b.tag === 'faq');

  const blogPosting = {
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': a.target_url },
    headline: h1,
    description: meta.description,
    image: ogById[String(a.post_id)] || undefined,
    datePublished: DATE,
    dateModified: DATE,
    author: ORG,
    publisher: PUBLISHER,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    keywords: meta.focus_keyword,
    articleSection: SECTION[String(a.post_id)] || 'Window Tinting Blog'
  };

  const graph = [blogPosting];
  if (faq && faq.items.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.items.map(it => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: { '@type': 'Answer', text: it.a }
      }))
    });
  }

  const json = { '@context': 'https://schema.org', '@graph': graph };
  const script = '<script type="application/ld+json">' + JSON.stringify(json) + '</script>';
  fs.writeFileSync(path.join(OUTDIR, a.post_id + '.html'), script);
  console.log(a.post_id, a.slug, '| graph nodes:', graph.length, '| faq:', faq ? faq.items.length : 0, '| chars:', script.length);
  done++;
}
console.log('built', done, 'schema scripts ->', path.relative(ROOT, OUTDIR));
