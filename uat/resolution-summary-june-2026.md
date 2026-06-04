# UAT Resolution Summary — 20 Blogs (June 2026)

**Site:** charlottewindowtinting.com (brand: Sun Stoppers Window Tinting Charlotte)
**Scope:** 20 Phase-2 blog posts built via SEO Navigator MCP (WordPress + Elementor).
**QA source:** ClickUp doc ["UAT Test - 20 blogs - June. 26"](https://app.clickup.com/9018614428/docs/8cru8mw-42018/8cru8mw-26678) (mirror: `uat/uat-20-blogs-june-2026.md`).
**QA task:** [UAT Test for Charlotte Window Tinting - 20 Blog Drafts](https://app.clickup.com/t/86exu79zj) — resolution summary posted as a task comment.
**Compiled:** 2026-06-05.

> How fixes were applied: all edits were made **in place** via the Elementor MCP
> (`update-element` / `update-widget`), never by re-importing templates. A re-import
> reverts a post to the WordPress fallback render and MCP cannot restore Elementor
> "builder" mode — so in-place editing is mandatory. Verification was done on the
> live front-end with a cache-bust query (`?ver=<rand>`), checking for the
> `data-elementor-type` wrapper and the specific markup.

---

## ✅ Fixed

| # | Issue (from UAT) | Resolution | Scope |
|---|---|---|---|
| 1 | **13/20 posts rendered the WP fallback** (no TOC, tables un-styled, FAQ as plain h3/p) | Root cause: `_elementor_edit_mode` ≠ `builder`. Fixed by opening each post in the Elementor editor. | 20/20 builder |
| 2 | **Missing Table of Contents** (7999, 8027, 7990, 7991, 8017) | Consequence of #1 — TOC widget renders once builder mode is on. | 5 posts (all now show TOC) |
| 3 | **End CTA heading appeared in the TOC** | CTA "Get a Free Quote…" heading changed `h2 → h3` so the TOC widget no longer lists it. CTA block itself **kept** (client decision). | 20/20 |
| 4 | **"Key Takeaways" H2 oversized** (55px vs other 45px H2) | Normalized to 45px (matches global Secondary heading) + kept the bordered list box. | 20/20 |
| 5 | **Tables un-styled / inconsistent** | `wt-table` styling: header `#1b3d5c` white, zebra rows, bold first column — identical to the original 10 blogs. | 20/20 |
| 6 | **FAQ section inconsistent** (rendered as plain h3/p; heading wording varied) | FAQ is now an `accordion` widget; heading text normalized to **"FAQs"** on all posts (was a mix of "FAQ", "FAQs About X", "FAQs"). | 13 posts renamed |
| 7 | **Bold/italic lost** (extraction flattened Google-Doc emphasis) | Restored in two layers: (a) callouts — "Pro Tip:", "Important:", "Note:" etc. bold+italic; (b) keyword phrases bolded per the source Doc. | 20/20 |
| 8 | **Content typo (8018)** | "Sun Stoppers Window **in Tinting** Charlotte" → "**Sun Stoppers Window Tinting in Charlotte**". | 8018 |
| 9 | **Gray body text → should be black** (7999) | Verified: body `<p>` carries no color and inherits global text color `#000000`. No change needed — was a fallback-render/cache artifact. | verified |
| 10 | **Paragraphs not separated** (8027, 7990, 7991, 8017) | Verified: each paragraph is its own `text-editor` widget (~20px gap). Identical structure to the original blogs. No change needed. | verified |

---

## ⏸️ Decisions made (intentionally NOT changed)

| Topic | Decision | Why it matters |
|---|---|---|
| **Headings UPPERCASE vs Title Case** | **Keep UPPERCASE** | Global typography (kit *Secondary* + h2/h3 tags) is `text-transform: uppercase` **site-wide**. Switching blogs to Title Case is a global or per-heading override that affects the whole site, not just these posts — left as-is per client. |
| **End CTA block** | **Keep** (only removed its heading from the TOC) | Testers suggested removing the bottom CTA because the page template already renders a "Find a Location" block. Client chose to keep the CTA. |

---

## ⏳ Pending (post-UAT, optional)

| Item | Status | Owner |
|---|---|---|
| **Internal links** between related clusters (tint / solar shades / PPF / ceramic / vinyl) | Not started | Content/SEO |
| **Inline & featured images** | Intentionally omitted from the automated build | Design |
| **Schema markup** (Article / FAQPage) | Not set — see SEO note below | SEO |
| **Publish** | MCP cannot publish; done manually in WP dashboard | — |

---

## 🔎 SEO status

- **Focus keyword, SEO title, meta description** — ✅ set by the client via MCP (`set_seo_meta`, over WP REST).
- **Schema (JSON-LD)** — the RankMath schema bridge plugin is **not installed**, so the MCP RankMath schema/redirect/sitemap tools are unavailable.
  **Workaround (automatable):** schema can be injected automatically per post via an **Elementor HTML widget** containing a `<script type="application/ld+json">…</script>` block. This can be pushed through the Elementor MCP (`add-html` / `update-element`) the same in-place way the other fixes were applied. Recommended types: **Article** + **FAQPage** (FAQ content is already structured as an accordion, so FAQPage maps cleanly).

---

## 📌 Notes for the DESIGN team

1. **Do NOT re-import Elementor templates via MCP** on these posts — it reverts the post to the WP fallback render (loses TOC/table/FAQ styling) and MCP cannot re-enable builder mode. Any further change must be **in place** (edit widgets), or the post must be re-opened in the Elementor editor afterward.
2. **All headings render UPPERCASE** because of global typography (`text-transform: uppercase`). If Title Case is wanted for blog headings, it is a **global/site-wide** decision (or a per-heading override on every heading) — needs a design/client call.
3. **Bottom of each post has two CTAs**: our injected brand CTA ("Get a Free Quote") + the page template's "Find a Location" block. Currently both are kept — flag if this is redundant.
4. Keep the shared **`wt-table`** styling and the **Key Takeaways** bordered box consistent if any post is rebuilt.

## 📌 Notes for the SEO team

1. **On-page meta is done** (focus keyword / title / description via MCP). Verify per post in RankMath.
2. **Schema** is the main open SEO item — recommended path is the Elementor **HTML-widget JSON-LD** approach above (Article + FAQPage), automatable via MCP. Alternative: install the `seo-navigator-rankmath` bridge plugin to unlock native schema tools.
3. **Internal linking** between the topic clusters is still pending and is a quick SEO win.
4. **Keyword bolding** is now present in-copy for on-page emphasis (matches the source Docs).
