# Asset credits

The engine ships a minimal demo game, **Nebula Nursery**. **All of its textures are
generated procedurally** and original to this repo — nothing is reused from any other
game's art. They are dedicated to the public domain (**CC0**).

| Asset | File | Notes |
| --- | --- | --- |
| Metal/starfield ground | `assets/img/ground.png` | tileable |
| Neon energy floor | `assets/img/energy.png` | tileable path/patch |
| Keeper robot (2 colours) | `assets/sheet/keeper.png`, `keeper_amber.png` | 64×64 walkcycle (hovering) |
| Keeper thumbnails | `assets/ui/keeper_thumb.png`, `keeper_amber_thumb.png` | menu portraits |
| Alien critter | `assets/sheet/critter.png` | 64×64, 4-frame bob; recoloured by tint if variants are added |
| Energy barrier | `assets/sheet/fence.png` | 32×32 glowing posts |
| Recharge pod | `assets/img/pod_rest.png` | sci-fi building |
| Crystal, alien plant | `assets/img/crystal.png`, `alienplant.png` | scenery |
| App icons | `assets/favicon.png`, `assets/apple-touch-icon.png` | generated |

Generation script: Pillow (see commit history / the `new-game` skill for how the demo's
textures and icons are produced).

## Engine dependency
- **Phaser 3** (v3.80.1) is vendored at `vendor/phaser.min.js` — MIT license,
  © Phaser Studio / Richard Davey.

## Making your own game
When you build a different game on this engine, source or generate your own textures
(see the **asset-search** / **asset-add** skills) and credit any third-party assets
here with their author + license.
