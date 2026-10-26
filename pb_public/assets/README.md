# AKG ALGO — Website Brand Kit

A ready-to-use asset bundle for the AKG ALGO website and social previews.

## What's included

- `logos/akg-algo-full-transparent.png` — complete main logo with transparent background, high-resolution PNG.
- `logos/akg-algo-full-dark.png` — complete logo on a near-black background.
- `logos/akg-algo-full-light-bg.png` — dark-silver recolor for light surfaces.
- `logos/akg-algo-symbol-transparent.png` — artwork-only lockup for larger visual placements.
- `logos/akg-algo-header.svg` — compact, scalable SVG header/ footer wordmark.
- `logos/akg-algo-header.png` — raster fallback of the compact wordmark.
- `icons/` — favicon ICO, PNG sizes, app icon and source SVG.
- `social/og-image-1200x630.png` — Open Graph / website sharing image.
- `social/x-card-1200x675.png` — X/Twitter large-card image.
- `social/profile-1080x1080.png` — square social profile graphic.
- `brand/brand-board.png` — visual brand reference sheet.
- `brand/brand.css` — color tokens, typography and a sample button style.
- `brand/tailwind-theme.js` — Tailwind color token snippet.
- `examples/website-head-example.html` — sample metadata and header usage.

## Palette

| Token | Hex | Use |
|---|---|---|
| Midnight | `#07090D` | Main background |
| Signal Gold | `#F3C653` | Brand accents and primary CTA |
| Deep Gold | `#A87927` | Secondary gold / shading |
| Metal Silver | `#E7E9EF` | Text on dark backgrounds |
| Dark Silver | `#282D36` | Silver logo on light backgrounds |
| Signal Green | `#00D878` | Positive chart accents |
| Muted | `#A6ADB9` | Secondary text |

## Website use

1. Copy the contents of this kit into your website's public assets folder (or place the folders under `public/assets/`).
2. Use `akg-algo-header.svg` in navigation and footers; use `akg-algo-full-transparent.png` for hero, login, or brand sections.
3. Copy the favicon and Open Graph tags from `examples/website-head-example.html` into your page metadata.
4. Replace `https://YOUR-DOMAIN.com/` in the social image URLs with your live domain.

Example:

```html
<img src="/assets/logos/akg-algo-header.svg" alt="AKG ALGO — Trade Smarter" width="260">
```

## Typography

Use **Montserrat** (weights 500–800) for brand headings and UI. `brand.css` imports Montserrat from Google Fonts and includes system fallbacks. If the site must work fully offline, self-host the font files under the font license terms.

## Notes

The full illustrated logo is supplied as a high-resolution PNG (not a true editable vector). The compact header logo and app icon are SVGs and scale cleanly. Review the images at final production size before publishing.

---

## 2026 metallic rebrand (current, used by the site)

The site now renders the **metallic gold bull lockup** everywhere. Web-optimized variants live in `logos/`:

| File | Size | Use |
|---|---|---|
| `logos/akg-algo-metallic-nav.png` | 576w PNG, 106 KB | Navbar + mobile drawer (transparent, crisp at h-40/44px) |
| `logos/akg-algo-metallic-footer.webp` | 864w WebP, 59 KB | Footer, auth modal, final CTA |
| `logos/akg-algo-metallic-hero.webp` | 1440w WebP, 135 KB | Large hero/brand placements |

Icons in `icons/` (favicon.ico, favicon-*.png, apple-touch-icon.png, akg-algo-icon-512.png) and all `social/` cards were regenerated from the metallic mark in October 2026. The bull-head favicon crop lives at `icons/favicon-512.png`. The full-resolution source file is versioned at `docs/brand/akg-algo-metallic-source.png` in the repository root (not web-served).

Typography note: the site now uses **Inter** (body), **Plus Jakarta Sans** (display headings) and **JetBrains Mono** (terminal data). Montserrat is no longer referenced.
