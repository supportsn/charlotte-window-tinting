# FAQ H3 renders at H2 size — root cause & fix (for designer)

**Site:** charlottewindowtinting.com (Elementor)
**Reported:** FAQ accordion question titles (H3) display at the same size as the section H2 ("FAQs").
**Status:** Verified — confirmed via the Elementor Site Settings (global kit) and the accordion widget settings.

---

## What's happening

In the blog FAQ accordion, each question is output as an `<h3>` (the accordion's **Title HTML Tag = H3**). It renders at **55px**, the same size as the H2 "FAQs" heading — so H3 and H2 look identical.

## Root cause

The Elementor **kit (Site Settings → Typography)** has the base HTML heading tags set so that **H2, H3 and H4 are all 55px**. H3 was never stepped down below H2:

| HTML tag | Font size | Weight | Transform |
|---|---|---|---|
| H1 | 2em | 800 | uppercase |
| **H2** | **55px** | 800 | uppercase |
| **H3** | **55px** ← problem | 800 | uppercase |
| H4 | 55px | 800 | uppercase |

The accordion **does** assign a smaller title style — the global typography token **"Sub Headline" (`6dbccb9`) = 36px / 700 / uppercase** — to its title. **But** the kit's bare `h3` tag rule (55px) has higher CSS specificity than the accordion title style, so **55px wins** and the question renders at H2 size.

> Note: H3 sub-headings *inside the article body* look correct because they are **Heading widgets** (which apply the 36px "Sub Headline" token with enough specificity). Only the **accordion title** (which relies on the raw `h3` tag) is affected.

## Scope

This is a **site-wide global typography** setting, not a per-blog/per-page style. The 55px `h3` tag affects **every H3 on the whole site**, not just the blog FAQs. (Same nature as the all-UPPERCASE headings decision.)

---

## Recommended fixes (pick one)

### Option A — Per-widget override (blog only, no site-wide impact) ✅ recommended
On each blog post's **FAQ accordion** widget:
**Style → Title → Typography → Size** = ~**24–28px** (desktop), e.g. 20px tablet/mobile.
A widget-level size beats the `h3` tag rule via specificity. Affects only the FAQ titles on the blogs, nothing else on the site.

### Option B — Global step-down (fixes all H3 site-wide)
**Site Settings → Typography → H3** → change Size from **55px → ~28–32px** (keep 700–800 weight, uppercase if desired).
One change fixes every H3 everywhere — but it changes the H3 size on **all pages/templates that use H3**, not just the blogs. Needs sign-off because it's site-wide.

### Suggested target sizes (visual hierarchy)
- H1: ~55px (page title)
- H2: 45–55px (section)
- **H3: 28–32px** (sub-section / FAQ question) ← currently 55px
- Body: 22px

---

## Where to look in Elementor
- Global tags: **Hamburger menu → Site Settings → Typography** (H2/H3/H4 rows).
- Accordion title: open a blog post in Elementor → select the **FAQ accordion** → **Style tab → Title → Typography**.
- The smaller token currently assigned to the title is **"Sub Headline" (36px)** under Site Settings → Typography → Custom typography.
