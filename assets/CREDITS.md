# Asset credits

The current game, **GTA 7 · Neon City**, is a top-down neon-city driving game.
**All of its textures are generated procedurally** with Pillow and original to this
repo — nothing is reused from any other game's art. They are dedicated to the public
domain (**CC0**).

Generation scripts: `tools/gen_chars.py` (man + woman walkcycles),
`tools/gen_world.py` (city, cars, buildings, props, icons), `tools/gen_race.py`
(traffic cone), `tools/gen_race3d.py` (behind-the-car racing billboards) and
`tools/gen_police.py` (police cruiser).

| Asset | File | Notes |
| --- | --- | --- |
| Playable characters | `assets/sheet/player_man.png`, `player_woman.png` | 64×64 LPC walkcycle (man + woman) |
| Character thumbnails | `assets/ui/man_thumb.png`, `woman_thumb.png` | menu portraits |
| Car | `assets/sheet/car.png` | 64×64 top-down car; recoloured per paint variant via tint |
| Police cruiser | `assets/img/police.png` | top-down chase car (wanted level) |
| Road / sidewalk / crosswalk / park | `assets/img/asphalt.png`, `sidewalk.png`, `crosswalk.png`, `grass.png` | tileable |
| Neon buildings | `assets/img/tower_cyan.png`, `tower_pink.png`, `shop_block.png` | top-down, baked soft shadow |
| Stations | `assets/img/garage.png`, `gas.png`, `depot.png` | sleep / refuel / delivery job |
| Street props | `assets/img/palm.png`, `streetlamp.png`, `hydrant.png`, `ramp.png` | scenery; ramp = stunt |
| Low-fuel bubble | `assets/img/want_gas.png` | "needs gas" indicator over a car |
| Traffic cone | `assets/img/cone.png` | hazard billboard on the road during races |
| Race car (rear) | `assets/img/car_back.png` | the player's car from behind (also the traffic obstacle) |
| Roadside buildings | `assets/img/bldg_a.png`, `bldg_b.png` | neon building billboards lining the race road |
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
