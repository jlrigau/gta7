---
name: release-deploy
description: Publish a game built on this engine to production (static GitHub Pages site, deployed from main). Use when changes to engine.js / game.config.js / style.css / index.html / assets are ready to go live. Handles cache-busting (vN), commit, push to main, then verifies the GitHub Actions deploy succeeded. Triggers: "deploy", "publish", "ship it", "put it online", "release".
---

# release-deploy

Cleanly publish a change to production.

## What to know
- **100% static** site, deployed to **GitHub Pages from `main`**. Pushing to `main`
  triggers `.github/workflows/deploy.yml`. **No PR** unless explicitly asked.
- **Cache-busting required** whenever JS/CSS/images change: the version `vN` must be
  bumped in **two places** (`assetVersion` in `game.config.js` + every `?v=vN` in
  `index.html`). Otherwise iOS/Safari serves the stale version.

## Procedure (Claude Code tools)
1. **Bash**: `git status` + `git branch --show-current`. Work on the configured
   branch; don't switch branches or open a PR without permission.
2. **Cache-bust** if a *site* file changed (engine.js / game.config.js / style.css /
   index.html / assets) — **Bash**:
   ```bash
   node .claude/skills/_shared/bump-version.mjs
   ```
   (Skip if you only touched `.claude/` or docs.)
3. **Verify** — Bash: `node --check engine.js && node --check game.config.js`
   (and JSON validity of the manifest if it changed).
4. **Commit** with a clear message (what + why).
5. **Push with retry** — Bash:
   ```bash
   for i in 1 2 3 4; do git push -u origin "$(git branch --show-current)" && break || sleep $((2**i)); done
   ```
6. **Verify the deploy**: load the GitHub tools with **ToolSearch**
   (`select:mcp__github__actions_list,mcp__github__actions_get`), fetch the latest
   `deploy.yml` run on the branch, and confirm `conclusion = success`.
   The task is **not done** until it's green.
7. **Confirm** the live URL (and remind about the "🔄 Refresh" button on iPhone).

## Guard-rails
- Always the configured branch, never another branch / PR without explicit permission.
- Never skip cache-busting when a site file changes (the script does it).
- If the run fails: read the log (GitHub MCP `get_job_logs`), fix, re-push.

## Chaining
Last step, after **test-debug** (the feature works) and, for a map change, after **map-verify**.
