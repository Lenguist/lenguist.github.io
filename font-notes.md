# Font notes

Body font picked: **IBM Plex Mono** (weights 400/500), with `'Courier New', Courier, monospace` as fallback.

Why: Courier New (the original default) read too thin on dark backgrounds — it was designed for typewriters in 1955 and has weak hinting at small sizes. Plex Mono has a real Medium (500) weight, slab-serif details on `i`/`l`/`t`, and a true cursive italic, all of which give the site a more deliberate "designed terminal" feel without losing the monospace vibe.

## Alternatives considered (2026-04-28)

| Font | Vibe | Why not picked |
|------|------|----------------|
| Courier New | Typewriter / lo-fi ASCII | Too thin on screens, weak hinting, only 400/700 weights |
| Courier New (tuned: softened contrast + 0.45px text-shadow) | Same as above but more legible | Hacky; tricks rather than fixing the underlying issue |
| Courier Prime | Modern Courier redesigned for screens | Solid alternative, but less personality than Plex |
| DM Mono | Indie-blog / designer-developer | Lacks real bold; energy felt closer to Substack than retro-futurist |
| Roboto Mono | Generic Google default | Zero personality |
| Fira Code | Mozilla's code font | Reasonable but tighter and busier than Plex |
| system-ui (sans-serif) | Maximum readability | Broke the terminal aesthetic, felt "basic" |

## Other readability tweaks shipped

- About-me body: 14px → 15px, line-height ~1.2 → 1.45, removed `text-align: justify`
- Indented quotes: smaller (13.5px), lighter weight (400 vs body's 500), indented 32px from the left
- About-me section now spans the full content width (margin: 0 20px) to match the header/nav alignment instead of width: 90%
