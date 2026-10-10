# Asset credits

The current game, **GTA 7 · Neon City**, is a top-down neon-city driving game.
**All of its art is original and generated** from code in this repo (smooth cartoon
vector art written as parametric SVG, rendered to WebP/PNG). Nothing is reused from any
other game or third party. All of it is dedicated to the public domain (**CC0**).

Source of truth: `tools/art/neon.cjs`, rendered with
`node .claude/skills/_shared/render-svg.cjs tools/art/neon.cjs [--only key]`.
Never hand-edit the images: change the art module and re-render.

| Asset | File(s) | Notes |
| --- | --- | --- |
| Player car | `assets/sheet/car.webp` | 2×4 frames of 128 px (rows up/left/down/right, 2 idle frames); light neutral body, tinted per paint variant |
| Police cruiser | `assets/sheet/police.webp` | same layout; light bar flashes red/blue |
| Car from behind | `assets/img/car_back.webp` | race view / traffic; tintable |
| Playable characters | `assets/sheet/player_man.webp`, `player_woman.webp` | LPC walkcycle 9×4, 128 px frames (Marco, Nadia) |
| Character thumbnails | `assets/ui/man_thumb.webp`, `woman_thumb.webp` | menu portraits |
| Road / ground tiles | `assets/img/asphalt.webp`, `sidewalk.webp`, `grass.webp`, `crosswalk.webp`, `lane.webp`, `lane_v.webp` | seamless |
| Buildings | `assets/img/tower_cyan.webp`, `tower_pink.webp`, `dealer.webp`, `garage.webp`, `gas.webp`, `depot.webp`, `shop_block.webp` | 3/4 view, standing on their base |
| Street props | `assets/img/palm.webp`, `streetlamp.webp`, `hydrant.webp`, `ramp.webp`, `bench.webp`, `planter.webp`, `billboard.webp` | scenery; ramp = stunt |
| Race view | `assets/img/bldg_a.webp`, `bldg_b.webp`, `cone.webp`, `flag.webp` | billboards along the race road |
| Markers | `assets/img/want_gas.webp`, `parcel.webp` | low-fuel bubble, delivery destination |
| UI icons | `assets/ui/icons/*.webp` | shared icon kit (`_shared/icon-kit.cjs`) + game icons |
| Logo / splash | `assets/img/logo.webp`, `assets/img/splash.webp` | home screen |
| App icons | `assets/favicon.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-maskable.png` | PWA / home screen |

Older Pillow-generated textures (`tools/gen_*.py` and the `.png` files they produced) are
also original CC0 work from this repo. They are kept until they are pruned.

## Engine dependency
- **Phaser 3** (v3.80.1) is vendored at `vendor/phaser.min.js`. MIT license,
  © Phaser Studio / Richard Davey.

## Making your own game
When you build a different game on this engine, source or generate your own textures
(see the **asset-search** / **asset-add** skills) and credit any third-party assets
here with their author and license.
