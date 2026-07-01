---
name: add-decor-item
description: Add a new BUYABLE decoration to the shop of a game built on this engine (e.g. tree, bush, bench, flower, lamp). Handles the GAME.decor entry, its appearance in the shop, and the ghost "place here" placement system. Triggers: "add a decoration", "new shop item to place", "let players buy and place a …".
---

# add-decor-item

Add a decoration the player can buy and place.

## Code involved (game.config.js)
- Array **`GAME.decor`**: `{ id, name, sprite, price, scale?, collision?, allowInHome? }`
  (e.g. `{ id:"tree", name:"Pine", sprite:"tree", price:28, collision:{dx:-16,dy:-22,w:32,h:24} }`).
- The `sprite` must be a key in **`GAME.assets.images`** (loaded by the engine; see skill **asset-add**).
- Buying → a translucent **ghost** follows the player (`ghostDecor`), then **“✅ Place here”**.
- Positions are saved in `state.decors = [{ id, x, y }]`; rendered with origin `(0.5,0.95)`,
  `scale` (def. 1.2), depth = `y` (y-sort).

## Procedure
1. **Asset ready**: cropped sprite registered in `GAME.assets.images` (skill **asset-add**).
2. **Add the entry** to `GAME.decor`: unique `id`, nice `name`, `sprite` (= image key),
   `price` consistent with the others.
3. **Collision** (optional): add a `collision:{dx,dy,w,h}` footprint at the base if the
   object is "solid". Omit it for things you can walk through (e.g. a flat water trough).
4. **Placement rules**: by default a decoration can't be placed inside the home zone
   (the pen) — set `allowInHome:true` to allow it (see `placementError` in engine.js).
5. **Test**: **test-debug** (buy → ghost → place → present in `state.decors`, persists
   after reload), then **map-verify** if relevant.
6. **Publish**: **release-deploy** (bump `vN` — new image).

## Guard-rails
- `id` and sprite key **unique**. Balanced price.
- Keep the visual style consistent. Solid object → consider **add-collision**.

## Chaining
asset-add → **add-decor-item** → test-debug → map-verify → release-deploy.
