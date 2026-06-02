# charlottewindowtinting.com — Content Project

SEO blog content + build pipeline for **charlottewindowtinting.com**
(Sun Stoppers Window Tinting Charlotte), published via the SEO Navigator MCP
(WordPress + Elementor).

**Start here → [CLAUDE.md](CLAUDE.md)** — full handoff: folder layout, the
content pipeline, site/MCP facts, block schema, build status, and remaining steps.

## Quick reference

```
articles/source/      # article content (block JSON) extracted from Google Docs
articles/elementor/   # generated Elementor template_json (ready to import)
articles/_index.json  # slug -> post_id -> edit_url for every built post
scripts/build-elementor.js   # source -> elementor (deterministic)
```

Regenerate the Elementor JSON after editing any `source/` file:

```bash
node scripts/build-elementor.js
```

All 20 posts are currently **drafts** on the site — publish manually from the
WordPress dashboard (the MCP cannot publish).
