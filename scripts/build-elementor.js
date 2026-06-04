// Converts articles/<slug>.json (block schema) -> articles/elementor/<slug>.json
// (an Elementor template_json array ready for elementor-mcp-import-template).
// Styling mirrors template post 7566 (Sun Stoppers brand).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'articles', 'source'); // block-schema JSON extracted from Google Docs
const OUT = path.join(ROOT, 'articles', 'elementor'); // generated Elementor template_json (ready to import)
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let counter = 0;
function id() { counter++; return ('e' + counter.toString(36).padStart(6, '0')).slice(0, 7); }

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
const SPAN = (t) => `<span style="font-weight: 400;">${esc(t)}</span>`;

// ---- widget builders ----
function heading(text, level) {
  const s = { title: esc(text) };
  if (level === 'h1') {
    s.header_size = 'h1'; s.title_color = '#000000';
    s.__globals__ = { typography_typography: 'globals/typography?id=primary' };
    s.align_mobile = 'center';
  } else if (level === 'h3') {
    s.header_size = 'h3'; s.title_color = '#000000';
    s.__globals__ = { typography_typography: 'globals/typography?id=6dbccb9' };
  } else { // h2 default
    s.title_color = '#000000';
    s.__globals__ = { typography_typography: 'globals/typography?id=secondary' };
    s.align_mobile = 'center';
  }
  return { id: id(), elType: 'widget', widgetType: 'heading', settings: s, elements: [] };
}
function textEditor(html, justify = true) {
  const s = { editor: html };
  if (justify) s.align = 'justify';
  return { id: id(), elType: 'widget', widgetType: 'text-editor', settings: s, elements: [] };
}
function para(text) { return textEditor(`<p>${SPAN(text)}</p>`); }
function list(items, ordered) {
  const tag = ordered ? 'ol' : 'ul';
  const li = (items || []).map((it) => `<li>${SPAN(it)}</li>`).join('');
  return textEditor(`<${tag}>${li}</${tag}>`);
}
// Self-contained .wt-table styling (colored header, zebra rows) — embedded per table,
// exactly as the reference posts do (the class is NOT defined in a global theme stylesheet).
const WT_TABLE_STYLE =
  '<style>.wt-wrap{font-family:\'Segoe UI\',Arial,sans-serif;width:100%;overflow-x:auto;display:flex;justify-content:center;}' +
  '.wt-table{width:100%;border-collapse:collapse;table-layout:fixed;}' +
  '.wt-table thead tr th{background-color:#1b3d5c;color:#ffffff;font-size:16px;font-weight:700;padding:18px 20px;text-align:center;border:none;}' +
  '.wt-table thead tr th:first-child{width:22%;}' +
  '.wt-table tbody tr td{padding:18px 20px;border-bottom:1px solid #dde3ea;font-size:15px;font-weight:400;color:#1a2a3a;vertical-align:middle;background-color:#ffffff;text-align:center;line-height:1.5;}' +
  '.wt-table tbody tr:nth-child(odd) td{background-color:#f3f5f7;}' +
  '.wt-table tbody tr:nth-child(even) td{background-color:#ffffff;}' +
  '.wt-table tbody tr td:first-child{font-weight:700;}' +
  '@media (max-width:640px){.wt-table{min-width:700px;}.wt-table thead tr th,.wt-table tbody tr td{padding:14px;font-size:14px;}}</style>';

function table(headers, rows) {
  // Embed the wt-table <style> + .wt-wrap wrapper so the header color/zebra rows render — matches reference posts.
  const th = (headers || []).map((h) => `<th>${esc(h)}</th>`).join('');
  const trs = (rows || []).map((r) =>
    `<tr>${(r || []).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  const html = `${WT_TABLE_STYLE}\n<div class="wt-wrap"><table class="wt-table" cellspacing="0" cellpadding="0"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
  return textEditor(html, false);
}

// Key Takeaways list box: a text-editor holding ONLY the list, with a left accent border
// ("border trái"). The "Key Takeaways" heading is emitted separately as a normal heading
// widget (global secondary) so its size matches every other H2 (UAT: KT was oversized).
function ktList(listBlock) {
  const tag = listBlock.tag === 'ol' ? 'ol' : 'ul';
  const li = (listBlock.items || []).map((it) => `<li>${SPAN(it)}</li>`).join('');
  return { id: id(), elType: 'widget', widgetType: 'text-editor', elements: [], settings: {
    editor: `<${tag}>${li}</${tag}>`,
    _padding: { unit: 'px', top: '15', right: '15', bottom: '15', left: '15', isLinked: false },
    _border_border: 'solid',
    _border_width: { unit: 'px', top: '0', right: '0', bottom: '0', left: '4', isLinked: false },
    __globals__: { _border_color: 'globals/colors?id=accent' },
    align: 'justify'
  } };
}
function toc() {
  return { id: id(), elType: 'widget', widgetType: 'table-of-contents', elements: [], settings: {
    title: 'Table of Contents', html_tag: 'h2', headings_by_tags: ['h2'],
    exclude_headings_by_selector: [], marker_view: 'bullets',
    no_headings_message: 'No headings were found on this page.', minimize_box: ''
  } };
}
function accordion(items) {
  const tabs = (items || []).map((qa) => ({
    tab_title: esc(qa.q), tab_content: `<p>${SPAN(qa.a)}</p>`, _id: id()
  }));
  return { id: id(), elType: 'widget', widgetType: 'accordion', elements: [], settings: {
    tabs,
    selected_icon: { value: 'fas fa-chevron-down', library: 'fa-solid' },
    selected_active_icon: { value: 'fas fa-chevron-up', library: 'fa-solid' },
    title_html_tag: 'h3', title_color: '#000000', tab_active_color: '#000000',
    icon_align: 'right', icon_space: { unit: 'px', size: 0, sizes: [] },
    content_typography_typography: 'custom', content_typography_font_family: 'proxima-nova',
    content_typography_font_size: { unit: 'px', size: 22, sizes: [] },
    content_typography_font_size_tablet: { unit: 'px', size: 18, sizes: [] },
    content_typography_font_size_mobile: { unit: 'px', size: 18, sizes: [] },
    content_typography_font_weight: '400', content_typography_font_style: 'normal',
    __globals__: {
      tab_active_color: 'globals/colors?id=text', title_color: 'globals/colors?id=text',
      title_typography_typography: 'globals/typography?id=6dbccb9',
      content_typography_typography: 'globals/typography?id=text'
    }
  } };
}

function column(children, size = 100) {
  return { id: id(), elType: 'column', settings: { _column_size: size, _inline_size: null }, elements: children };
}
function section(children, settings = {}) {
  return { id: id(), elType: 'section', settings, elements: children, isInner: false };
}

function button(text, link, bg, align) {
  return { id: id(), elType: 'widget', widgetType: 'button', elements: [], settings: {
    text, align, background_color: bg,
    border_radius: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: false },
    text_padding: { unit: 'px', top: '20', right: '35', bottom: '20', left: '35', isLinked: false },
    link: { url: link, is_external: '', nofollow: '', custom_attributes: '' },
    typography_typography: 'custom', typography_font_family: 'proxima-nova',
    typography_font_size: { unit: 'px', size: 22, sizes: [] },
    typography_font_size_mobile: { unit: 'px', size: 14, sizes: [] },
    typography_font_weight: '600', typography_font_style: 'normal',
    align_mobile: 'justify', align_tablet: 'justify'
  } };
}
function ctaSection() {
  const inner = { id: id(), elType: 'section', isInner: true, settings: { structure: '20' }, elements: [
    { id: id(), elType: 'column', settings: { _column_size: 50, _inline_size: null }, elements: [
      button('GET A FREE QUOTE', '/contact-us/', '#FF9600', 'right') ] },
    { id: id(), elType: 'column', settings: { _column_size: 50, _inline_size: null }, elements: [
      button('CALL NOW', 'tel: 7045366667', '#A00000', 'left') ] }
  ] };
  const col = { id: id(), elType: 'column', settings: { _column_size: 100, _inline_size: null }, elements: [
    { id: id(), elType: 'widget', widgetType: 'heading', elements: [], settings: {
      title: 'Get a Free Quote from Sun Stoppers Window Tinting Charlotte', align: 'center',
      header_size: 'h3', // h3 (not h2) so the Table of Contents widget does not list this CTA heading
      title_color: '#FFFFFF', __globals__: { typography_typography: 'globals/typography?id=secondary' } } },
    { id: id(), elType: 'widget', widgetType: 'text-editor', elements: [], settings: {
      editor: '<p><span style="font-weight: 400;">Serving Charlotte, NC and the surrounding areas. <a href="https://charlottewindowtinting.com/contact-us/"><strong>Contact us today</strong></a> for expert service and a free quote.</span></p>',
      align: 'center', text_color: '#FFFFFF', __globals__: { typography_typography: 'globals/typography?id=text' } } },
    inner
  ] };
  return { id: id(), elType: 'section', isInner: false, elements: [col], settings: {
    content_width: { unit: 'px', size: 1290, sizes: [] }, stretch_section: 'section-stretched',
    background_background: 'classic',
    background_image: { url: 'http://charlottewindowtinting.com/wp-content/uploads/2019/03/20190306-_99A1521-Edit.jpg', id: 2893, size: '', alt: '', source: 'library' },
    background_position: 'center center', background_attachment: 'fixed', background_size: 'cover',
    background_overlay_background: 'classic', background_overlay_color: '#000000',
    background_overlay_opacity: { unit: 'px', size: 0.53, sizes: [] },
    padding: { unit: 'px', top: '100', right: '0', bottom: '100', left: '0', isLinked: false }
  } };
}

function blockToWidget(b) {
  switch (b.tag) {
    case 'h1': return heading(b.text, 'h1');
    case 'h2': return heading(b.text, 'h2');
    case 'h3': return heading(b.text, 'h3');
    case 'p': return para(b.text);
    case 'ul': return list(b.items, false);
    case 'ol': return list(b.items, true);
    case 'table': return table(b.headers, b.rows);
    case 'toc': return toc();
    case 'faq': return accordion(b.items);
    default: return para(b.text || '');
  }
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.json') && f !== '_index.json');
const summary = [];
for (const f of files) {
  counter = 0; // reset per file so ids are stable per article
  const art = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
  const blocks = art.blocks || [];
  const widgets = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const next = blocks[i + 1];
    // Merge "Key Takeaways" heading + its following list into one bordered box.
    if (b.tag === 'h2' && /^key takeaways$/i.test((b.text || '').trim()) &&
        next && (next.tag === 'ul' || next.tag === 'ol')) {
      widgets.push(heading(b.text, 'h2'));   // normal H2 (global secondary) — consistent size
      widgets.push(ktList(next));            // the list, in a left-bordered box
      i++; // skip the list block (consumed)
      continue;
    }
    widgets.push(blockToWidget(b));
  }
  const contentSection = section([column(widgets)], {
    padding_tablet: { unit: 'px', top: '32', right: '32', bottom: '32', left: '32', isLinked: true },
    padding_mobile: { unit: 'px', top: '8', right: '8', bottom: '8', left: '8', isLinked: true }
  });
  const tpl = [contentSection, ctaSection()];
  const outPath = path.join(OUT, f);
  fs.writeFileSync(outPath, JSON.stringify(tpl));
  const counts = (art.blocks || []).reduce((a, b) => { a[b.tag] = (a[b.tag] || 0) + 1; return a; }, {});
  summary.push({ slug: art.slug, blocks: (art.blocks || []).length, elements: tpl.length, counts });
}
console.log('Generated ' + summary.length + ' files into articles/elementor/');
for (const s of summary) console.log(`  ${s.slug}  blocks=${s.blocks}  ${JSON.stringify(s.counts)}`);
