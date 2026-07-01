# CLAUDE.md — Generic 2D Game Engine

> Shared memory across sessions. If you pick up this project: read this, then continue.

## 1. What this is
A **data-driven, top-down 2D game engine** (Phaser 3, 100% static, no build). The
engine code holds **no game content**; a game is fully described by `game.config.js`
(`window.GAME`) + assets. Swap config + assets (or run the **new-game** skill) to make a
different game from the same engine and skills.

Ships a **minimal** neutral demo: **Nebula Nursery** — a keeper robot tends a few
glowing alien critters in a tiny space nursery (feed/play + mood, one rest station,
3 simple goals). Deliberately small: richer features (variants, shop, riding, breeding,
trail loops…) are added by **iterating** on the config, not shipped in the demo.

## 2. Golden rule
- **`engine.js` is generic — never put game content in it.** All game data, strings,
  geometry, entities, actions, economy, objectives live in **`game.config.js`**.
- If the engine truly lacks a capability, add it to `engine.js` as a **generic,
  config-gated** feature (not tied to any one game), and document it in `ENGINE.md`.

## 3. Files
- `index.html` — shell; loads `vendor/phaser.min.js` → `game.config.js` → `engine.js`.
- `style.css` — theme (CSS variables at the top).
- `engine.js` — the engine (all systems, parameterised by `GAME`).
- `game.config.js` — THE GAME (data + asset refs). The file you edit/replace per game.
- `ENGINE.md` — full `GAME` config schema + capability list. **Read it before editing config.**
- `assets/` — `img/` (single sprites), `sheet/` (spritesheets), `ui/` (thumbnails),
  `CREDITS.md`. `vendor/phaser.min.js` — vendored dependency.
- `.github/workflows/deploy.yml` — GitHub Pages deploy.
- Cache-busting: `assetVersion: "vN"` in `game.config.js` (used by `av()` for every
  image) **and** every `?v=vN` in `index.html`. **Bump both** when JS/CSS/images change
  (`node .claude/skills/_shared/bump-version.mjs` does it).

## 4. Deploy
- Static site on **GitHub Pages from `main`**. Push to `main` → `deploy.yml` publishes.
- After a push, confirm the `deploy.yml` run is **success**. No PR unless asked.

## 5. Verifying in this environment
- Chromium is available (Playwright global). Serve the folder
  (`bash .claude/skills/_shared/serve.sh`) and run the harness
  (`node .claude/skills/_shared/playtest.cjs`) for screenshots, walkability and page
  errors. The harness points Chromium at `HTTPS_PROXY` when set; Phaser is vendored so
  tests don't need a CDN. **Always validate visually before pushing.**

## 6. Engine capabilities (all config-gated — see ENGINE.md)
Tiled world + camera follow + adaptive zoom · player walkcycle (tap/keyboard, run on
double-tap) + multiple characters + create screen · creatures: needs, mood, actions
(effects/cost/reward/anim), variants (tint or sheet), customization, aging/growth,
breeding, ride + fatigue + hop/jump over obstacles · stations (rest/shop/custom) ·
economy + shop + capacity + buyable decorations (ghost placement) · AABB collisions
(`jumpable`) · environment (fenced arena + trail loop in a forest band, scattered by a
single declarative rule) · day/night with rest-gating · objectives/levels · localStorage
save with backward-compatible load · PWA/iOS.

## 7. Skills (`.claude/skills/`)
Game-agnostic Claude Code skills operating on the config/assets. Orchestrators:
**new-game** (scaffold a new game interactively: theme, audience/age, style, language,
core loop) and **feedback-session** (non-technical playtester mode, silent work).
Editing: add-character, add-creature-variant, add-decor-item, add-collision,
place-scatter, state-migration. Assets: asset-search (content policy via
`GAME.meta.audience` + license), asset-add. QA/ship: test-debug, map-verify,
ios-pwa-check, release-deploy. Shared tooling in `_shared/`.

## 8. Conventions
- Engine, config and skills are in **English**. Clear commit messages.
- Keep `game.config.js` the single source of game content; auto-save stays in place.
- Set `GAME.meta.audience` honestly — the asset skills rely on it for content safety.
- **New games start MINIMAL.** A demo/seed should have few features; you grow it by
  iterating. The engine stays fully capable — features are config-gated, not removed.
- Demo textures are **generated** and specific to the game's universe (no reuse from a
  different game's art). `meta.showCoins:false` hides the economy; the goals button
  auto-hides when there are no objective levels.
