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
- **Learn a song** — step-by-step tutorials for Beethoven's *Ode to Joy* and
  *Für Elise* and Hans Zimmer's *He's a Pirate*. The next key glows on the
  keyboard and the panel shows which key to press; "Watch demo" plays it for you.
- **Composition strip** — your last notes are captured as you play so you can
  replay them with their original timing, or clear and start again.
- **Mobile landscape** — the keyboard fills the screen and the controls float
  over it; a hint prompts you to rotate from portrait.

Songs live in [src/music.ts](src/music.ts) and are easy to edit or extend.

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
