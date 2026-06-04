# charlottewindowtinting.com — Content Project (Handoff)

Pipeline + content for publishing SEO blog posts to **charlottewindowtinting.com**
(brand shown in copy: **Sun Stoppers Window Tinting Charlotte**) via the
**SEO Navigator MCP** (WordPress + Elementor).

> Convention: this doc records only facts verified from tool output. Anything
> inferred from one example is labeled as such. Don't state assumptions as facts.

---

## 1. What's in this repo

```
charlottewindowtinting/
├── CLAUDE.md                     # this handoff doc
├── scripts/
│   ├── build-elementor.js        # source JSON  ->  Elementor template_json (deterministic)
│   └── build-markdown.js         # source JSON  ->  readable Markdown (one-way, for review)
└── articles/
    ├── _index.json               # master list: slug, doc, target_url, post_id, edit_url, file paths
    ├── source/                    # article content extracted from Google Docs (block schema) — CANONICAL
    │   └── <slug>.json   (20)
    ├── elementor/                 # generated Elementor template_json, ready to import (20)
    │   └── <slug>.json   (20)
    └── readable/                  # generated human-readable Markdown view (20) — do not hand-edit
        └── <slug>.md    (20)
```

- `source/<slug>.json` — the article as ordered **blocks** (see §4). Hand/agent-extracted
  from the Google Doc; this is the editable source of truth for content.
- `elementor/<slug>.json` — produced by `scripts/build-elementor.js`. This is the exact
  array passed to the `elementor-mcp-import-template` MCP tool. **Generated — do not edit by
  hand;** edit `source/` then re-run the script (it is deterministic/idempotent — same input
  gives byte-identical output, ids included).

Regenerate everything: `node scripts/build-elementor.js`

---

## 2. Site & MCP connection (verified)

Via `list_sites`, `get_site`, `ping_site`, `diagnose_site`:

- **site_id:** `charlottewindowtinting` · **Platform:** WordPress · `base_url` https://charlottewindowtinting.com
- **Builder:** Elementor (default) — Gutenberg also available
- **MCP backend:** `wp-mcp-adapter` (servers: `mcp-adapter-default-server`, `elementor-mcp-server`)
- **WP user (MCP auth):** `trungsn` ("Trung IT")
- **Page template for posts:** `template-elementor.php` = the **"Elementor Sunstopper"** template
  (theme template; set per post — see §3 step 4)
- **Linked GitHub repo (in MCP config):** `supportsn/seo-navigator-content` (branch `main`) — note this
  is the MCP's content repo, separate from THIS project repo.
- **RankMath:** active, but the `seo-navigator-rankmath` bridge plugin is NOT installed →
  schema/redirect/sitemap tools unavailable. `set_seo_meta`/`get_seo_meta` work over REST.
- **Publishing:** `allow_publish: false`. The MCP **cannot publish or delete** — it only creates
  drafts. Publish manually in the WordPress dashboard.
- **WP adapter abilities:** `mcp-adapter-discover-abilities` returns `[]` (no generic abilities).

### Listing existing posts
- `blogs_*` MCP tools target a **GoHighLevel** location, NOT this site — don't use them here.
- Published posts: public WP REST `https://charlottewindowtinting.com/wp-json/wp/v2/posts`
  (drafts return 401 — not publicly readable).
- Drafts/scheduled: `list_drafts` tool. Elementor-built posts: `elementor-mcp-list-pages`.

---

## 3. How to build one post (the proven pipeline)

Per article (all steps via SEO Navigator MCP tools; load them with ToolSearch
`select:<tool_name>` first):

1. **`create_draft`** `{ site_id, title=<H1>, slug, excerpt }` → returns `post_id`.
   Pass NO body content (let Elementor own the content).
2. Read `articles/elementor/<slug>.json` (a JSON array).
3. **`elementor-mcp-import-template`** `{ site_id, post_id, position:-1, template_json:<array> }`.
   Import **once** — for a fresh post this needs no cleanup.
4. **`elementor-mcp-update-page-settings`** `{ site_id, post_id, settings:{ "template":"template-elementor.php" } }`
   → applies the "Elementor Sunstopper" template. (User-confirmed this is the correct value.)
5. **`elementor-mcp-get-page-structure`** to verify: expect exactly **2 top-level sections**
   (content + CTA), H1 as the first widget, an `accordion` (FAQ), and two `button` widgets.

Then (manual, MCP can't): set featured image, review, and **Publish** in the dashboard.

> ⚠️ **Gotcha (verified):** `import-template` with `position:-1` **appends**; it does not replace.
> To replace content on an EXISTING Elementor post, remove the old top-level sections first with
> `elementor-mcp-remove-element`, then import. After a remove+import sequence, a `get-page-structure`
> read can be **stale** — re-run the removals and re-verify if old sections still show. Fresh posts
> created via `create_draft` don't have this problem (single import).

---

## 4. Block schema (source/) & Elementor mapping

`source/<slug>.json` = `{ source, target_url, slug, main_kw, post_id?, blocks[] }`.
`blocks` is ordered; the H1 is the first block. Tag set (verified to cover all docs — they
contain NO images, blockquotes, or h4+):

| Block | → Elementor widget |
|---|---|
| `{tag:"h1"\|"h2"\|"h3", text}` | `heading` (h1=global *primary*; h2=global *secondary*; h3=global *6dbccb9*) |
| `{tag:"p", text}` | `text-editor` `<p>` |
| `{tag:"ul", items[]}` | `text-editor` `<ul>` |
| `{tag:"ol", items[]}` | `text-editor` `<ol>` (numbered — do NOT collapse into ul) |
| `{tag:"table", headers[], rows[][]}` | `text-editor` with an HTML `<table>` |
| `{tag:"toc", text}` | `table-of-contents` widget (nav links intentionally dropped) |
| `{tag:"faq", items:[{q,a}]}` | `accordion` widget |

`build-elementor.js` also appends a brand **CTA section** to every post (background image +
"GET A FREE QUOTE" → `/contact-us/` and "CALL NOW" → `tel:7045366667`). Styling (global
typography ids, colors, fonts) mirrors template post **7566**.

---

## 5. Status

**20 posts built as Elementor drafts** (template "Elementor Sunstopper"). Full mapping
slug → `post_id` → `edit_url` is in **`articles/_index.json`**. Source: Google Sheet
`1dnBfbsu6b9OUV1eJWe_1pRob1Ng2hMtlpbK9QnJDx2c`, tab **"NEW BLOGS - Phase 2"** (rows 12–30),
SOP Onsite SEO V2 column → Google Docs. Post 7973 (vinyl wrap) was the Phase-1 pilot, built
ad-hoc; its live layout/CTA may differ slightly from its regenerated `elementor/` file.

**Pending (manual / optional):**
- [ ] **Publish** each draft (MCP can't — WP dashboard; can Bulk-edit).
- [ ] **Featured & inline images** (intentionally omitted from the build).
- [ ] **SEO meta** (title/description) — `set_seo_meta` works over REST; not yet set.
- [ ] **Internal links** between related posts (tint / solar shades / PPF / ceramic / vinyl clusters).

---

## 5b. UAT round (June 2026) — status

QA doc: ClickUp "UAT Test - 20 blogs - June. 26" (mirrored in `uat/uat-20-blogs-june-2026.md`,
evidence images were downloaded to `uat/evidence/` locally — gitignored).

**Root cause of most QA issues (FIXED):** 13 of the 20 posts were rendering the WordPress
fallback (`the_content`) instead of Elementor — `_elementor_edit_mode` was not `builder` — so
they showed NO Table-of-Contents widget, tables stripped of the `wt-table` class (no header
color), and FAQ as plain h3/p instead of an accordion. Verified via live frontend
(`data-elementor-type` absent) and cross-checked with `elementor-mcp-list-pages`.
- **Fix that works:** `elementor-mcp-update-page-settings {settings:{template:"template-elementor.php"}}`
  flips the post to Elementor render mode. Applied to all 13. (It is flaky/eventually-consistent and
  server page-cache hides the change — verify by fetching the live URL with a cache-bust query, not `get_post`.)
- **Gotcha:** `get_post` content_html and `list-pages` are cached/inconsistent — NOT reliable to verify
  render mode. The reliable signal is the published front-end HTML (look for `data-elementor-type`).

**Generator fixes prepared (committed, NOT yet re-imported to live):**
- Key Takeaways is now a normal H2 heading widget (consistent size) + bordered list (was an oversized 55px h2).
- CTA "Get a Free Quote" heading is `h3` so the TOC widget no longer lists it.

**Still pending:**
- [ ] **Bold/italic**: the Google Docs bold key phrases ("Pro Tip:", "Important:", keywords) + some italic;
  extraction flattened them to plain text (live pages have 0 `<strong>`/`<em>` in content). Needs re-extracting
  the 20 docs preserving emphasis + a generator change to allow inline `<strong>/<em>` (block text is currently
  HTML-escaped). Big task.
- [ ] **Apply KT/CTA/bold to live**: requires a re-import pass of all 20 (remove old sections → import → then
  re-run update-page-settings to re-set builder, since re-import can drop builder mode).
- [ ] **Title Case headings**: global typography *Secondary* + the kit h2/h3 tags are `text-transform:uppercase`,
  so ALL headings render UPPERCASE site-wide. Making blog headings Title Case is a global/per-heading override
  decision (affects the whole site) — needs the client's call.

## 6. Extracting more articles from the sheet

- The "SOP Onsite SEO V2" cells display "View" — the Google Doc URL is a **hyperlink**, absent
  from the CSV export. To get the real URLs: export the sheet as **xlsx**, unzip, and read the
  hyperlink relationships in `xl/worksheets/_rels/sheetN.xml.rels` (mapped from `<hyperlinks>` in
  the sheet XML). CSV / `gviz` lose hyperlink targets.
- Fetch each Doc's content with its HTML export: `https://docs.google.com/document/d/<ID>/export?format=html`,
  then convert to the block schema in §4 and save under `articles/source/`.
- Run `node scripts/build-elementor.js`, then follow §3 to publish-draft each post.
