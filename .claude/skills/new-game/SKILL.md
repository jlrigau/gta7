---
name: new-game
description: Scaffold a BRAND-NEW game from this generic engine. Use when the user wants to create a different game on top of the engine ("create a new game", "start a new game from the engine", "scaffold a game", "init a game", "make a game about X"). Interactively asks the theme, target age/audience, art style, language and core loop, then generates a fresh game.config.js + assets + theming, wires it up, tests it, and (optionally) deploys. The engine code (engine.js) is never modified.
---

# new-game ⭐ (initializer / scaffolder)

Turn the engine into a specific game **without touching `engine.js`**. A game =
`game.config.js` (the whole definition) + assets + CSS theme. This skill authors them
from a short interview.

## ⭐ Start MINIMAL
A new game should ship **small**: the core loop and little else. Features get added by
**iterating** afterwards (that's the whole point). A good seed is roughly: one world
zone, one or two characters, a creature with **1–2 needs** and **2 care actions**, maybe
one station and a tiny objectives set — and **nothing more**. Leave variants, shop,
riding/obstacles, breeding, decorations, trail loops OFF until the user asks. Use
`meta.showCoins:false` when there's no economy; omit `objectives` to hide goals. The
engine stays fully capable — you're choosing what to enable, not removing anything.

## Step 1 — Interview (AskUserQuestion)
Ask only what changes the output. Bundle into 1–2 `AskUserQuestion` calls:
- **Theme / subject**: what is the game about? (e.g. space pets, plant garden, robot
  workshop, monster ranch). Free text encouraged.
- **Target audience / age**: e.g. "young kids (6–8)", "kids (9–11)", "teens", "all
  ages", "adults". → sets `GAME.meta.audience` and the content-suitability bar used by
  **asset-search** (`references/content-policy.md`).
- **Art style**: pixel-art LPC (default, assets available), or other.
- **Language**: UI strings language (the demo ships English).
- **Core loop**: the main entity to care for / interact with, and the 3–5 main
  **actions** (feed/clean/play/ride… or theme equivalents). Keep it close to the
  engine's supported systems (see `ENGINE.md` for the full list of capabilities).
  - A common kid-friendly loop is the **zoom / close-up** (`action.type:"closeup"`): the
    view zooms onto a backdrop and the player **scrubs spots off it** with a finger/brush
    (clean a mouth, wash a pet, polish a gem…). Pairs well with **`creature.depart`** (the
    cured one walks off) + a **`station.action:"spawn"`** (ring to bring more) and a
    **`creature.wantBubble`** (who needs help) — the "treat → leave → ring for more" loop.
    Almost text-free, so it's ideal for early readers. See ENGINE.md.
- **Optional systems**: variants, customization, riding+obstacles, breeding, aging,
  shop, decorations, objectives/levels, trail loop, close-up scrub, depart+spawn,
  want-bubble. **Default = OFF.** Only enable one if the user explicitly wants it in the
  first version.

If an answer is obvious from the theme, pick a sensible default and say so — don't
over-ask. Bias toward the smallest playable game.

## Step 2 — Author `game.config.js`
Write a new `game.config.js` (the **whole** game) following the schema in **`ENGINE.md`**.
Start from the demo as a template and replace, section by section:
- `meta` (title, icons, save key, theme colours, **audience**, UI strings, language)
- `world` + `camera`, `assets` (images/sheets), `player` + `characters`
- `creature` (label, needs, actions with effects/costs/rewards, variants, customize,
  ride/jump, celebrate, aging, breeding, names, start state) — omit systems not wanted
- `zones`, `stations`, `economy` + `shop`, `decor`
- `environment` (band + arena + trail loop + forest scatter) if used; else drop it
- `objectives.levels` (gamification), `help`
Use a fresh `meta.saveKey` so it doesn't collide with other games' saves.

## Step 3 — Assets
- **Reuse** the generic environment assets already in `assets/` when they fit
  (ground, trees, bushes, fences, buildings).
- **New themed assets**: use **asset-search** → **asset-add** (search + verify +
  slice), respecting the audience's content policy. For abstract/neutral creatures,
  **generate** them procedurally with Pillow (see how the demo's `critter.png` and
  icons were generated) — fully self-contained, no licensing.
- Variants can be **tints** of one base sheet (no new asset needed) — see
  **add-creature-variant**.
- Generate fresh **PWA icons** (`assets/favicon.png` 512, `assets/apple-touch-icon.png`
  180) matching the new theme.
- **Remove the previous game's leftover themed art** the new game no longer uses. Always
  **dry-run first and review** — never blanket-`--delete`:
  ```bash
  node .claude/skills/_shared/prune-assets.cjs            # list unreferenced files
  node .claude/skills/_shared/prune-assets.cjs --delete   # remove them (after review)
  ```
  It keeps any file referenced by path **or key** (and `CREDITS.md`). From the list,
  delete only the **old game's theme-specific art**. **KEEP the generic, reusable
  building blocks** even if unused now — ground tiles, trees, bushes, fences, generic
  buildings: you'll likely want them when you later add an arena/forest/trail (see
  `environment`). They're cheap to keep and costly to regenerate.
  Then prune the matching now-dead `assets` entries / old `tools/` art generators and
  update `assets/CREDITS.md`.
- Note: pruning runs **after** the new game is authored, and only touches asset *files* —
  the lasting references for building/iterating are **`ENGINE.md`** (full schema) + the
  per-feature skills + your own new `game.config.js`, none of which are removed.

## Step 4 — Theme & shell
- Restyle `style.css` palette (CSS variables at the top) and update titles/ids in
  `index.html` + `manifest.webmanifest` (`name`, `short_name`, `theme_color`,
  `apple-mobile-web-app-title`). Keep the iOS/PWA rules (see **ios-pwa-check**).

## Step 5 — Refresh the project `README.md`
The repo ships a README describing the **engine/template**. Rewrite its **top** to lead
with the game you just created, and **keep all the technical/template content below**
(how the template works, iterating, the link to `ENGINE.md`). Concretely:
1. **Derive the live URL from the repo's own remote** (GitHub Pages serves the default
   branch — so the link is reconstructed from the repo itself, no guessing):
   ```bash
   url=$(git remote get-url origin)
   slug=$(echo "$url" | sed -E 's#.*[/:]([^/]+/[^/]+?)(\.git)?/?$#\1#')
   owner=${slug%%/*}; repo=${slug##*/}
   echo "https://$owner.github.io/$repo/"
   ```
2. **Replace the engine intro** (the template's `# …` title + tagline + old "Play the
   demo" line) with a **game header** built from `meta`: `# <titleIcon> <title>`, the
   `meta.tagline`, one line on the core loop, the **target audience**, and a prominent
   **▶ [Play <title>](<pages url>)**.
3. Add one line that the game is **built on a reusable engine** and that the rest of the
   README explains how to make your own — then leave the existing sections (*Create a new
   game*, *iterate*, *ENGINE.md*) **intact**.
Keep it short and faithful to `meta` — don't invent features the game doesn't have. (The
**capitalize-learnings** skill keeps this in sync when the game later changes substantially.)

**Write the README in English** (the repo's documentation language) **even if the game's
UI is in another language** — don't mix languages. Mention the game's language in passing
(e.g. "the game itself is in French") rather than dropping foreign copy into the prose.

## Step 6 — Verify & ship
- **test-debug**: `node --check`, serve, run the harness — 0 page errors, core actions
  work, state correct. Look at the screenshots.
- **map-verify** if the map geometry is custom (walkability empty).
- **Tag the repo for discovery**: add a GitHub **topic** `built-with-<template>` to the
  new game's repo (via the GitHub API / `gh repo edit --add-topic`). There's no API to
  list repos generated from a template, so this topic is how the template later finds its
  games to harvest learnings (see **sync-engine**).
- **release-deploy** when the user wants it live (or hand back for review first).

## Guard-rails
- **Never edit `engine.js`.** If the engine genuinely lacks a capability, say so and
  propose adding it to the engine as a separate, generic feature (not game-specific).
- Keep `game.config.js` the single source of game content.
- Set `GAME.meta.audience` honestly — the asset skills rely on it for content safety.
- **Update `README.md`** to lead with the created game + its live GitHub Pages link
  (derived from the remote), while keeping the template/usage docs below.
- One safe, coherent, working game beats a half-wired ambitious one.

## Chaining
**new-game** → asset-search/asset-add (themed assets) → add-* skills → test-debug →
map-verify → release-deploy.
