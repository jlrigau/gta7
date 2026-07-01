# Asset credits

The current game, **GTA 7 · Neon City**, is a top-down neon-city driving game.
**All of its textures are generated procedurally** with Pillow and original to this
repo — nothing is reused from any other game's art. They are dedicated to the public
domain (**CC0**).

Generation scripts: `tools/gen_chars.py` (character walkcycles) and
`tools/gen_world.py` (city, cars, buildings, props, icons).

| Asset | File | Notes |
| --- | --- | --- |
| Street characters (2) | `assets/sheet/player_vice.png`, `player_cyan.png` | 64×64 LPC walkcycle |
| Character thumbnails | `assets/ui/vice_thumb.png`, `cyan_thumb.png` | menu portraits |
| Car | `assets/sheet/car.png` | 64×64 top-down car; recoloured per paint variant via tint |
| Road / sidewalk / crosswalk / park | `assets/img/asphalt.png`, `sidewalk.png`, `crosswalk.png`, `grass.png` | tileable |
| Neon buildings | `assets/img/tower_cyan.png`, `tower_pink.png`, `shop_block.png` | top-down, baked soft shadow |
| Stations | `assets/img/garage.png`, `gas.png`, `depot.png` | sleep / refuel / delivery job |
| Street props | `assets/img/palm.png`, `streetlamp.png`, `hydrant.png`, `ramp.png` | scenery; ramp = stunt |
| Low-fuel bubble | `assets/img/want_gas.png` | "needs gas" indicator over a car |
| App icons | `assets/favicon.png`, `assets/apple-touch-icon.png` | generated |

Generic reusable engine building blocks kept for future iteration:
`assets/img/ground.png` (tile) and `assets/sheet/fence.png` (32×32).

## Engine dependency
- **Phaser 3** (v3.80.1) is vendored at `vendor/phaser.min.js` — MIT license,
  © Phaser Studio / Richard Davey.

## Making your own game
When you build a different game on this engine, source or generate your own textures
(see the **asset-search** / **asset-add** skills) and credit any third-party assets
here with their author + license.
