# Interactive Piano

A playable single-octave piano built with React, Vite, and Tailwind CSS v4. Keys
are rendered from SVG paths exported from Figma and sound is synthesized live in
the browser with the Web Audio API (additive sine partials with a plucked-string
style envelope) — no audio samples required.

## Features

- Click or tap keys to play notes (C4–B4, white and black keys)
- Computer-keyboard control: `Z S X D C · V G B H N J M`
- Real-time synthesized piano timbre via Web Audio API
- Pixel-accurate key shapes imported from a Figma design

## Getting started

```bash
pnpm install
pnpm dev      # start the Vite dev server
pnpm build    # production build to dist/
pnpm preview  # preview the production build
```

Requires Node.js 22. The toolchain is pinned in `.mise.toml`.

## Project structure

- `src/main.tsx` — React entrypoint, mounts `App` and imports global CSS
- `src/App.tsx` — layout shell and keyboard hint
- `src/Piano.tsx` — piano component, audio engine, and key/keyboard mapping
- `src/index.css` — Tailwind v4 import and global styles
- `imports/` — SVG path data exported from Figma
- `vite.config.ts` — Vite config (React, Tailwind v4, `@` alias for `src`)

## Credits

Design and scaffold generated with Figma Make.
