# Engine reference — `GAME` config schema

The engine (`engine.js`) is **data-driven** and contains no game content. A game is a
single global object `window.GAME` defined in `game.config.js`, plus its assets. This
file documents every field and the engine capabilities they drive. Use `game.config.js`
(the minimal "Nebula Nursery" demo) as a working template. The demo only uses a subset
of the fields below — every system is optional, so start small and add as you iterate.

> Load order in `index.html`: `vendor/phaser.min.js` → `game.config.js` → `engine.js`.

## Capabilities (all optional, config-gated)
- Top-down tiled world, camera follow, adaptive zoom.
- Player avatar: 4-direction LPC walkcycle, tap/click-to-move + keyboard (WASD/ZQSD),
  run on double-tap. Multiple selectable characters + create/change-look screen.
- Creatures: autonomous wandering NPCs with **needs**, mood heart, **actions**
  (effects/costs/rewards/animations), **variants** (tint or dedicated sheet),
  **customization** (rename + restyle), **aging/growth**, **breeding**, a **mount**
  system (ride + fatigue) and **hop/jump** over obstacles.
- Buildings (**stations**): "next day" rest, shop, or custom handlers.
- Economy + **shop**: coins, buyable resources, capacity upgrades, buy creatures,
  buyable **decorations** placed via a ghost-follow system.
- **Collisions** (AABB, with a `jumpable` flag).
- **Environment**: fenced **arena** with obstacles + a **trail loop** of sand paths in
  a forest band, scattered by a single declarative rule (no bare edges/corners).
- **Day/night** cycle with rest-gating; **objectives/levels** gamification.
- **Race mini-mode**: while mounted, a timed run through **checkpoints** with a
  **camera zoom-in**, a guide arrow, and **hazards to avoid** (wandering pedestrians +
  static obstacles) that cost time on contact. Reward + `raceWin` stat on finish.
- **Save** to localStorage with backward-compatible loading; **PWA/iOS** support.

## Top-level shape
```js
window.GAME = {
  meta, world, camera, assets, fence,
  player, characters,
  creature,            // the creature system (optional)
  zones, stations,
  economy, shop, decor,
  environment,         // arena + trail loop (optional)
  scenery,             // [[x,y,sprite,scale], ...]
  race,                // timed checkpoint race while mounted (optional)
  objectives, help,
};
```

### `meta`
Identity, theming and **all UI strings** (every label has an engine fallback, so you
can override only what you want).
```
title, titleIcon, shortName, tagline, saveKey, assetVersion: "vN",
audience: { minAge, notes },          // used by the asset skills' content policy
theme: { home, play },                 // iOS theme-color per screen
showCoins,                             // false → hide the coins HUD (no economy)
showDay, showCreatureCount,            // false → hide the 📅 day / creature-count HUD chips (minimal HUD)
showCapacity,                          // creature count: show "n/cap" vs bare "n". Default auto: "/cap" only when group size can change (breeding / spawn station / capacity shop)
coinIcon, namePrompt:{label,placeholder}, startName, namePromptYou, avatarPrompt,
createTitle, createOkLabel, startLabel, continueLabel, continueHint, helpTitle,
ageUnit, and, nightMessage, restBlockedHint, neglectMessage, morningMessage,
notEnough, idleHint, placeHint, placeHere, cancel, boughtDecorMessage, placedMessage,
refundMessage, noOnBuilding, noInHome, nameLabel, confirm, nameTaken, closeLabel
```
Strings with `{name}`, `{day}`, `{names}`, `{item}` are interpolated by the engine.

### `world` / `camera`
```
world: { width, height, groundTile, bg, patches:[{x,y,w,h,tile,ox,oy}] }
camera: { fitW, fitH, min, max }       // zoom = clamp(min(w/fitW,h/fitH), min, max)
```

### `assets` / `fence`
```
assets.images: { key: "assets/img/x.png", ... }       // single images
assets.sheets: { key: { path, frameWidth, frameHeight }, ... }   // spritesheets
fence: { sheet, frames:{ post, side, cornerTL, cornerTR } }      // 32×32 fence tiles
```
Everything in `assets` is preloaded automatically (with cache-busting via `av()`).

### `player` / `characters`
```
player: { scale, speed:{walk,run,rideWalk,rideRun}, spawn:{x,y}, nameY }  // nameY = y offset of the name label above the head (default -80)
characters: [ { id, name, sheet, thumb } ]   // sheet=64×64 walkcycle, thumb in assets/ui/
```

### `creature` (optional system)
```
label, icon, sheet, origin:{x,y}, walk:{start,end,frameRate}, moodIcon,  // moodIcon = particle shape of the floating mood indicator (default "heart")
youngLabel, adultLabel, variantLabel, customizeTitle, customizedMessage,
moodNeed: "joy",                       // the need that drives celebration & day-mood
moodFrom: ["food","energy","clean","joy"],   // needs averaged into the mood heart
showBars: true,                        // false → hide the per-need bars in the panel (kid-friendly)
moodDay: { base, lowPenalty, lowAt, highBonus, highAt },   // overnight mood rule
needs: [ { id, icon, start, perDay } ],      // perDay = overnight delta (0..100 bars)
variants: [ { id, name, color, tint? , sheet? } ],   // sheet = a dedicated, animated spritesheet for this variant (else base sheet + optional tint)
actions: [ {
  id, label, icon,
  cost:{resource,amount}?, require:{need:min}?, effects:{need:+/-}?, reward?,
  anim?, stat?, message?, celebrateMessage?,
  type: "ride"|"jump"|"customize"|"closeup"?,   // special actions (omit for a normal care action)
} ],
wantBubble: { sprite, need?, below?, withMood?, scale?, lift? },  // see below — "needs action" image bubble (replaces, or with withMood sits beside, the mood shape)
allHappy: { mood, message, celebrate? },   // day-arc reward: rest with EVERYONE happy → synchronized celebration + special morning line
customize: { rename, variant },
ride: { adultsOnly, minEnergy, fatigueNeed, sitY, nameY, onMount:{...}, *Message,
        jump:{ distance, cost, minEnergy, tooTired } },
celebrate: { mode:"hop"|"rear", adultsOnly, message, particle, colors:[hex], count },
```

### Theme-driven animations (`action.anim`)
The engine owns the animation **system**; the theme picks the **look** per action.
`anim` is either a legacy preset string (`"eat"`, `"cheer"`, `"sparkle"`) or an object:
```
anim: {
  motion: "nod" | "hop" | "bounce" | "none",   // body movement
  particle: "star" | "heart" | "spark" | "bubble" | "diamond" | "dot",  // built-in shapes
  colors: ["#fff2a8", "#ffd24a", ...],          // tints cycled across particles
  count, fall, spread, y0, riseMin, riseMax, scaleMin, scaleMax,        // all optional
}
```
Particle textures are generated procedurally (white, then tinted), so no assets are
needed. Example: `{ motion:"hop", particle:"star", colors:["#fff2a8","#a8e6ff"], count:7 }`
emits a burst of stars. `celebrate` (mood-maxed) and `moodIcon` use the same shapes.
```
aging: { adultAge, scaleBaby, scaleAdult },
breeding: { enabled, minMood, cooldown, message },
names: [...], startCount, startCreatures:[{name,variant}],
```
Omit `ride`/`breeding`/`aging`/`celebrate`/`customize` to disable those systems.

### `creature.wantBubble` (a "needs action" indicator)
By default each creature floats an abstract mood shape (`moodIcon`) tinted by mood. When a
game's creatures arrive needy and **leave once satisfied** (e.g. patients), that heart is
always red and says nothing. `wantBubble` replaces it with a themed **image bubble** that is
shown only while the creature still wants the action, and hidden the moment it's satisfied —
a clear "who to go help" cue.
```
wantBubble: {
  sprite: "<image key>",   // the bubble image (e.g. a little dirty tooth)
  need: "propre",          // which need drives it (omit → mood average)
  below: 100,              // eligible while need < this (default 100 → until fully satisfied)
  scale: 0.6, lift: 8,     // size + extra px raised above the head
  intermittent: true,      // pop up now and then instead of showing permanently
  showFor: 2.5,            // seconds visible per appearance (intermittent only)
  hideMin: 5, hideMax: 12, // random gap (s) between appearances — desynced per creature
  withMood: true,          // keep the coloured mood heart ON and float the bubble in its own slot above it
}
```
It gently bobs (and pops in when `intermittent`), hides during celebration/departure, and
needs no other wiring. With `intermittent`, each creature shows its bubble on its own random
cadence, so they don't all appear at once. By default the bubble **replaces** the mood shape;
set `withMood: true` to keep the always-on mood heart as a gauge **and** pop the bubble above
it (e.g. an overall mood heart + a need-specific "do this action now" cue).

### `creature.allHappy` (day-arc collective reward)
Gives the day/rest cycle an arc: when the player rests (`station.action:"nextDay"`) with
**every** creature happy, the engine fires a synchronized celebration before the night and
shows a special morning line instead of the ordinary `morningMessage`.
```
allHappy: {
  mood: 75,                       // every creature's mood average must be ≥ this at rest
  message: "🌟 Cycle {day}: ...",  // morning line on a perfect cycle ({day} substituted)
  celebrate: true,                // default true → each creature does its celebrate() hop, staggered
}
```
Mood is the same average shown by the mood heart (`moodFrom`). Omit the block to disable.

### `creature.depart` (leave after being cured)
```
depart: { to:{x,y}?, speed?, emptyMessage? }
```
When present, a creature that triggers `celebrate` (its mood need hits 100) finishes its
celebration, then **walks to `to` (default: off the bottom) at `speed` px/s (default 110)
and is removed**. It stays fully opaque while inside the **home zone** and only begins to
fade once it has **walked out of that zone**, so it never vanishes mid-room. When the last
one leaves, `emptyMessage` is shown. Pair with a `spawn` station to refill — the
"treat → leave → ring for more" loop.

### Close-up mini-scene (`action.type:"closeup"`)
A creature action of `type:"closeup"` opens a **full-screen scene** zoomed onto a
backdrop image; the player **scrubs/taps "spots" off it** (works with mouse *and*
touch) until it's clean, then the action's `effects` / `reward` / `stat` / `celebrate`
are applied exactly as if a normal action had completed. Generic — use it to clean a
mouth, wash a pet, polish a gem, wipe a window, etc.
```
action = {
  id, type:"closeup", label, icon,
  closeup: {
    bg: "<image key>",            // full-screen backdrop (e.g. a face) — overridable per
                                  //   creature via `variant.closeupBg` (e.g. each child's own face)
    spotSprite: "<image key>"?,   // sprite for a spot (omit → a plain CSS blob)
    brush: "<image key>"?,        // cursor sprite that follows the finger (optional)
    brushTip: { x, y }?,          // active scrub point as fractions of the brush sprite (e.g. its
                                  //   bristle head) — spots are removed from HERE, not the raw finger.
                                  //   Omit → the finger position itself is the active point.
    spots: {
      base: 4,                    // spots on the first cure
      growEvery: 2, max: 12,      // +1 spot every N completions of this action (ramps up), capped
      rubs: 3,                    // scrubs needed to remove one spot
      size: 74,                   // spot size in px
      area: { x, y, w, h },       // spawn region as 0..1 fractions of the BACKDROP IMAGE
                                  //   (the backdrop fills the screen via object-fit:cover;
                                  //    spots are placed cover-aware so they stay on the teeth).
                                  //   May be an ARRAY of regions (e.g. upper + lower teeth) —
                                  //   spots alternate between them so each region gets some.
    },
    finishParticles: ["⭐","💖"], // emojis bursting when the scene is cleared
  },
  effects:{ need:+/- }, reward?, stat?, message?, celebrateMessage?,
}
```
Requires the `#closeup` overlay element in `index.html` and the `.closeup*` styles in
`style.css` (both generic). Difficulty ramps via `state.stats[stat]` (number of past
completions). The mood need reaching 100 via `effects` triggers `celebrate` in the
world, so the cured creature visibly rejoices when you return.
`meta.closeLabel` localises the ✖ button's `aria-label` (default `"Close"`).

#### iOS / touch robustness (why the close-up is built the way it is)
A finger-scrub over disappearing targets hits two real Safari/iOS bugs. The engine and
the generic `.closeup*` styles already guard against both — **keep these if you change
the close-up**, and reuse the pattern for any new drag-over-touch interaction:
- **Pointer-capture freeze.** When a spot under the finger is removed mid-drag, iOS keeps
  the pointer *implicitly captured* by the now-gone element, and every later touch is
  swallowed (the player "can't move" after a cure). Fix: spots are `pointer-events:none`
  and hit-tested **by geometry** (`cuRub`), the pointer is captured on the **stable stage**
  (`setPointerCapture` on `#closeup-stage`) and **released** on close / `pointerup` /
  `pointercancel` (`cuReleaseCapture`). Never capture on an element you may delete.
- **Blue text-selection.** A tap-drag starts a selection that hijacks subsequent touches —
  not just in the close-up but **anywhere in the world** (selecting a creature name / panel
  text freezes the player: "the panel stays and I can't move"). Fix: `user-select:none` +
  `-webkit-touch-callout:none` on **`html, body`** (re-enable on `input[type=text]`/`textarea`),
  plus `-webkit-user-drag:none` + `touch-action:none` on the overlay and a global
  `selectstart` `preventDefault` (skipping inputs/textareas). The global body rule is the
  important one — the overlay-only guard is not enough. These bugs **do not reproduce in
  headless Chromium OR Playwright WebKit** (no real text-selection) — only on a real iPhone;
  test with `--engine webkit` of `playtest.cjs` and the **test-debug** / **ios-pwa-check** skills.

### `zones` / `stations`
```
zones: [ { id, home, rect:{x,y,w,h}, fence, gates:"both"|"left"|"right",
           gateA, gateB, tint, tintAlpha, label } ]   // home zone = where creatures roam
stations: [ { type, x, y, sprite, label, scale?, box?, action, actionLabel,
              onUse?, spawn? } ]   // action: "nextDay" | "spawn" | "openShop" | "custom"
// action:"spawn" → brings a random number of fresh creatures up to a cap:
//   spawn: { min, max, cap, message?("{n}"), fullMessage? }
```

### `economy` / `shop` / `decor`
```
economy: { startCoins, startResources:{id:n}, startCapacity, dayReward }
shop: { title, resources:[{id,name,desc,icon,price,amount}], capacity:{name,price,boughtMessage},
        decorHeading, buyCreature:{price,heading,hint,label,boughtMessage}, fullMessage }
decor: [ { id, name, sprite, price, scale?, collision:{dx,dy,w,h}?, allowInHome? } ]
```

### `environment` (optional)
```
band,                                  // forest band thickness around the world
arena: { rect, tile, label, fence, obstacleSprite, obstacleScale, obstacleBox, obstacles:[{x,y}] },
forest: { tree, bush, step, hedgeMargin },
path: { width, sand, inset, tile, label, labelY,
        openings:[{x,y,w,h}], logs:{ xs:[...], dec, sprite, scale } },
```
See the **place-scatter** skill for the single-rule vegetation system.

### `race` (optional — timed checkpoint race while mounted)
Requires a mount (`creature.ride`) and a creature **action of `type:"race"`** (shown while
mounted, next to jump/dismount — tapping it toggles start/quit). When started, the camera
**zooms in** (`zoom`), a **timer** counts down, a guide **arrow** floats above the vehicle
pointing at the current checkpoint, and **hazards** appear on the road. Drive through each
checkpoint ring in order before time runs out. Hitting a hazard costs `hitPenalty` seconds
(screen shake + red flash). Finishing all checkpoints awards `reward` coins and increments
the `raceWin` stat (declare it in `objectives.extraStats` to use it in a goal). Leaving the
vehicle or running out of gas ends the race. Checkpoint rings are drawn by the engine (no
art); hazards use config sprites.
```
race: {
  time: 50,                 // seconds on the clock
  zoom: 1.05,               // camera zoom during the race (higher = closer)
  reward: 90,               // coins awarded on finish
  hitPenalty: 3,            // seconds lost per hazard contact
  checkpointRadius: 80,     // ring radius / how close counts as "reached"
  checkpoints: [ {x,y}, ... ],          // driven through IN ORDER; last one shows 🏁
  hazards: {
    coneSprite: "<img key>", coneScale, coneRadius,   // static obstacles…
    cones: [ {x,y}, ... ],                             // …at fixed spots
    pedestrianSheet: "<4-frame side-walk sheet>",      // moving hazards that wander
    pedestrianScale, pedestrianCount, pedestrianRadius, pedestrianSpeed,
  },
  quitLabel, startMessage, checkpointMessage, hitMessage, winMessage, loseMessage,
}
```
Messages interpolate `{n}` (current checkpoint / penalty), `{t}` (total checkpoints) and
`{r}` (reward). Omit the whole `race` block to disable the mode.

### `objectives` / `help`
```
objectives: { extraStats:["ride","jump","trailVisit"],
              levels:[ { name, goals:[ { id, name, desc, check:(state)=>bool } ] } ] }
help: [ "html string", ... ]
```
`check` is a function receiving the full `state` (`state.coins`, `state.day`,
`state.creatures`, `state.stats`, `state.capacity`, `state.resources`, …).
Action `stat` ids are auto-tracked in `state.stats`; declare extra ones in `extraStats`.

## Making a new game
Use the **new-game** skill (interactive), or copy `game.config.js`, swap the assets,
and rewrite each section. Never edit `engine.js` for game content.
