// Fetch each published post's live HTML and extract the FIRST Elementor column
// data-id inside the wp-post wrapper (= the main content column we inject schema into).
const fs = require('fs');
const idx = require('../articles/_index.json');

async function colId(postId, url) {
  const r = await fetch(url + '?ver=' + postId + Date.now(), { redirect: 'follow' });
  const html = await r.text();
  // scope to this post's elementor wrapper
  const wrapIdx = html.indexOf('data-elementor-id="' + postId + '"');
  const scope = wrapIdx >= 0 ? html.slice(wrapIdx) : html;
  // first (top-level) column data-id within scope
  const m = scope.match(/data-id="([0-9a-fA-F]+)"[^>]*data-element_type="column"/);
  return m ? m[1] : null;
}

(async () => {
  const out = {};
  for (const a of idx.articles) {
    if (a.post_id === 7982) continue; // already has schema
    try {
      const id = await colId(a.post_id, a.target_url);
      out[a.post_id] = id;
      console.log(a.post_id, a.slug, '->', id);
    } catch (e) {
      console.log(a.post_id, a.slug, 'ERR', e.message);
    }
  }
  fs.writeFileSync(__dirname + '/../_doc_parse/content-columns.json', JSON.stringify(out, null, 2));
  console.log('saved content-columns.json');
})();
