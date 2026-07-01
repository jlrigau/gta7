/* =========================================================
   GAME DEFINITION — "Nebula Nursery" (demo game)
   ---------------------------------------------------------
   This file is the ENTIRE game: data + asset references.
   The engine (engine.js) contains no game content; it reads
   this `window.GAME` object. Swap this file + assets to make
   a brand-new game from the same engine.

   This demo is deliberately MINIMAL — a clean starting point.
   The engine supports much more (variants, customization,
   riding, breeding, shop/economy, decorations, objectives,
   trail loops…); you add those by ITERATING on this config.
   See ENGINE.md for the full schema and capabilities.

   Theme: a tiny space nursery where a keeper robot looks
   after glowing alien critters. All textures are generated
   and specific to this universe (CC0).
   ========================================================= */

window.GAME = {
  /* ---- Identity, theming, UI strings ---- */
  meta: {
    title: "Nebula Nursery",
    titleIcon: "👾",
    shortName: "Nebula",
    tagline: "Look after the little glowing critters!",
    saveKey: "nebula-nursery",
    audience: { minAge: 6, notes: "all-ages, gentle, cute, no violence" },
    assetVersion: "v26",
    theme: { home: "#171036", play: "#0e1430" },
    showCoins: false,                 // minimal demo: no economy
    namePrompt: { label: "Name your nursery:", placeholder: "Starlight Bay" },
    startName: "My Nursery",
    namePromptYou: "Your name",
    avatarPrompt: "Pick your keeper",
    createTitle: "🤖 Choose your keeper",
    createOkLabel: "✅ Let's go!",
    startLabel: "▶ New game",
    continueLabel: "📂 Continue",
    continueHint: "A saved game exists: tap “Continue”. 👾",
    helpTitle: "❓ How to play",
    ageUnit: "c", and: "and",
    nightMessage: "🌙 The lights dim…",
    restBlockedHint: "You just woke up! Look after a critter first. 👾",
    neglectMessage: "🌅 Cycle {day}. Look after {names}!",
    morningMessage: "🌅 Cycle {day}: everyone rested well. ✨",
    idleHint: "Move around 🚀 and approach a critter to look after it.",
  },

  /* ---- World ---- */
  world: {
    width: 1800, height: 1300, groundTile: "ground", bg: "#0e1430",
    patches: [
      { x: 300, y: 560, w: 320, h: 150, tile: "energy", ox: 0.5, oy: 0.5 },  // path to the pen gate
    ],
  },
  camera: { fitW: 720, fitH: 760, min: 0.5, max: 1.0 },

  /* ---- Assets (all generated, CC0) ---- */
  assets: {
    images: {
      ground: "assets/img/ground.png", energy: "assets/img/energy.png",
      crystal: "assets/img/crystal.png", alienplant: "assets/img/alienplant.png",
      pod_rest: "assets/img/pod_rest.png",
      critter_closeup: "assets/img/critter_closeup.png", dust: "assets/img/dust.png", cloth: "assets/img/cloth.png",
      want_dust: "assets/img/want_dust.png",
      // per-variant close-up backdrops (antennae recoloured to match each critter's glow)
      critter_closeup_amber: "assets/img/critter_closeup_amber.png",
      critter_closeup_aqua: "assets/img/critter_closeup_aqua.png",
      critter_closeup_lime: "assets/img/critter_closeup_lime.png",
      critter_closeup_violet: "assets/img/critter_closeup_violet.png",
    },
    sheets: {
      keeper: { path: "assets/sheet/keeper.png", frameWidth: 64, frameHeight: 64 },
      keeper_amber: { path: "assets/sheet/keeper_amber.png", frameWidth: 64, frameHeight: 64 },
      critter: { path: "assets/sheet/critter.png", frameWidth: 64, frameHeight: 64 },
      // antenna-tip recolours of the base critter (body identical, only the tips differ)
      critter_amber: { path: "assets/sheet/critter_amber.png", frameWidth: 64, frameHeight: 64 },
      critter_aqua: { path: "assets/sheet/critter_aqua.png", frameWidth: 64, frameHeight: 64 },
      critter_lime: { path: "assets/sheet/critter_lime.png", frameWidth: 64, frameHeight: 64 },
      critter_violet: { path: "assets/sheet/critter_violet.png", frameWidth: 64, frameHeight: 64 },
      fence: { path: "assets/sheet/fence.png", frameWidth: 32, frameHeight: 32 },
    },
  },
  fence: { sheet: "fence", frames: { post: 0, side: 0, cornerTL: 2, cornerTR: 2 } },

  /* ---- Player (the keeper robot) ---- */
  player: {
    scale: 1.7,
    speed: { walk: 210, run: 380 },
    spawn: { x: 440, y: 660 },
    nameY: -112,                 // keep the name label above the keeper's head
  },
  characters: [
    { id: "aqua", name: "Bolt", sheet: "keeper", thumb: "keeper_thumb" },
    { id: "amber", name: "Sol", sheet: "keeper_amber", thumb: "keeper_amber_thumb" },
  ],

  /* ---- Creature system (3 needs, 3 actions, antenna variants, aging) ---- */
  creature: {
    label: "critters", icon: "👾",
    sheet: "critter",
    scale: 1.0,
    origin: { x: 0.5, y: 0.78 },
    walk: { start: 0, end: 3, frameRate: 6 },
    // Critters hatch tiny and grow to full size over a few cycles.
    aging: { adultAge: 4, scaleBaby: 0.55, scaleAdult: 1.0 },
    youngLabel: "🐣 Hatchling", adultLabel: "🌟 Grown",
    // Mood = average of the three needs (the coloured heart above each critter).
    // joy is the MOOD_NEED: maxing it (via Play) triggers the little celebration,
    // and it gently drifts each cycle depending on how well the other needs are kept up.
    moodNeed: "joy",
    moodFrom: ["fuel", "shine", "joy"],
    moodDay: { base: -8, lowPenalty: -8, lowAt: 25, highBonus: 6, highAt: 60 },
    // Three clear needs, each looked after by exactly ONE action:
    //   🔋 Energy ← Feed   ·   ✨ Sparkle ← Polish (zoom)   ·   🎮 Fun ← Play
    needs: [
      { id: "fuel", icon: "🔋", start: 70, perDay: -22 },
      { id: "shine", icon: "✨", start: 65, perDay: -18 },
      { id: "joy", icon: "🎮", start: 80 },
    ],
    // A dusty critter intermittently pops a "polish me" bubble (Sparkle low) — it cues
    // the close-up. The coloured mood heart stays on alongside it (wantBubble.withMood).
    wantBubble: { sprite: "want_dust", need: "shine", below: 45, withMood: true,
      intermittent: true, scale: 0.6, lift: 30, showFor: 2.6, hideMin: 5, hideMax: 10 },
    // Rest with EVERYONE happy → a synchronized send-off and a special morning line.
    allHappy: { mood: 75, message: "🌟 Cycle {day}: every critter is glowing — what a wonderful day! ✨" },
    // Variants in SHEET mode: only the ANTENNA TIPS are recoloured (body stays the
    // same) — a tasteful detail rather than tinting the whole creature. "rose" is the
    // base sheet; the others are antenna-recoloured copies. New critters get a random one.
    // sheet = recoloured antenna spritesheet (in-world); closeupBg = matching zoom backdrop
    variants: [
      { id: "rose", name: "Rose", color: "#ff5db1" },
      { id: "amber", name: "Amber", color: "#ffc24a", sheet: "critter_amber", closeupBg: "critter_closeup_amber" },
      { id: "aqua", name: "Aqua", color: "#3fe0e8", sheet: "critter_aqua", closeupBg: "critter_closeup_aqua" },
      { id: "lime", name: "Lime", color: "#8df06b", sheet: "critter_lime", closeupBg: "critter_closeup_lime" },
      { id: "violet", name: "Violet", color: "#b58bff", sheet: "critter_violet", closeupBg: "critter_closeup_violet" },
    ],
    variantLabel: "Antennae",
    customize: { rename: true, variant: true },
    customizeTitle: "🎨 Customize",
    customizedMessage: "{name} looks great! ✨",
    actions: [
      // Quick in-world taps — each tops up one need only.
      { id: "feed", label: "Feed", icon: "🔋",
        effects: { fuel: 38 }, stat: "feed",
        // themed particles: little cyan energy sparks float up as it recharges
        anim: { motion: "nod", particle: "spark", colors: ["#9fe8ff", "#6fb7e8", "#ffffff"], count: 6, y0: 38 },
        message: "{name} recharged happily! 🔋" },
      { id: "play", label: "Play", icon: "🎮",
        effects: { joy: 30 }, stat: "play",
        // themed particles: a burst of STARS instead of hearts
        anim: { motion: "hop", particle: "star", colors: ["#fff2a8", "#ffd24a", "#a8e6ff", "#ff5db1"], count: 7 },
        message: "{name} had fun! 🎮", celebrateMessage: "{name} glows with joy! ✨" },
      // ⭐ the signature CLOSE-UP "moment fort": zoom in and scrub off the cosmic dust by hand
      { id: "polish", type: "closeup", label: "Polish", icon: "✨", stat: "polish",
        closeup: {
          bg: "critter_closeup", spotSprite: "dust", brush: "cloth", brushTip: { x: 0.5, y: 0.4 },
          spots: { base: 4, growEvery: 2, max: 10, rubs: 3, size: 76, area: { x: 0.25, y: 0.32, w: 0.50, h: 0.40 } },
          finishParticles: ["⭐", "✨", "💫"],
        },
        effects: { shine: 100 },
        message: "{name} is sparkling clean! ✨" },
      // open the customize menu (recolour the glow / rename) — no effect on needs
      { id: "style", type: "customize", label: "Style", icon: "🎨" },
    ],
    celebrate: { mode: "hop", particle: "star", colors: ["#fff2a8", "#ffd24a", "#a8e6ff"], count: 7 },
    names: ["Zib", "Quor", "Lumi", "Vex", "Orbit", "Pulse", "Nova", "Echo", "Bly", "Pixl"],
    startCount: 3,
    // A mix to show off growth: two grown critters and one fresh hatchling (grows over ~4 cycles).
    startCreatures: [{ name: "Zib", variant: "aqua", age: 6 }, { name: "Lumi", variant: "rose", age: 5 }, { name: "Pulse", variant: "lime", age: 0 }],
  },

  /* ---- Zone (the nursery pen where critters roam) ---- */
  zones: [
    { id: "pen", home: true, rect: { x: 520, y: 340, w: 780, h: 640 },
      fence: true, gates: "left", gateA: 0.38, gateB: 0.62,
      tint: "#1d3a52", tintAlpha: 0.4, label: "Nursery" },
  ],

  /* ---- One station: the recharge pod (rest → next cycle) ---- */
  stations: [
    { type: "rest", x: 300, y: 560, sprite: "pod_rest", scale: 1.0, label: "Recharge Pod",
      box: { dx: -52, dy: -50, w: 104, h: 66 }, action: "nextDay", actionLabel: "🌙 Rest (next cycle)" },
  ],

  /* ---- A little ambient scenery (crystals & alien plants) ---- */
  scenery: [
    [200, 320, "crystal", 1.3, { dx: -14, dy: -10, w: 28, h: 16 }],
    [220, 900, "alienplant", 1.2, false],
    [1480, 360, "crystal", 1.5, { dx: -16, dy: -12, w: 32, h: 18 }],
    [1560, 820, "alienplant", 1.3, false],
    [1400, 1080, "crystal", 1.2, { dx: -14, dy: -10, w: 28, h: 16 }],
    [560, 1120, "alienplant", 1.2, false],
    [980, 1140, "crystal", 1.1, { dx: -12, dy: -10, w: 24, h: 14 }],
  ],

  /* ---- Objectives (kept minimal: one level, a few simple goals) ---- */
  objectives: {
    levels: [
      { name: "Caretaker", goals: [
        { id: "feed1", name: "First charge", desc: "Feed a critter", check: (s) => s.stats.feed >= 1 },
        { id: "play1", name: "Playtime", desc: "Play with a critter", check: (s) => s.stats.play >= 1 },
        { id: "polish1", name: "Sparkle clean", desc: "Polish a critter", check: (s) => s.stats.polish >= 1 },
        { id: "happy", name: "All aglow", desc: "Get a critter's mood fully up", check: (s) => s.creatures.some((c) => (c.fuel + c.shine + c.joy) / 3 >= 85) },
      ] },
    ],
  },

  /* ---- Help screen ---- */
  help: [
    "<b>Welcome to your space nursery!</b>",
    "<b>🚀 Move:</b> tap where you want to go (your keeper floats there). You can also tap a critter directly. (Keyboard: arrows or WASD/ZQSD.)",
    "<b>👾 Three needs:</b> 🔋 Energy (Feed), 🎮 Fun (Play) and ✨ Sparkle (Polish). The heart over each critter shows its mood — keep it green!",
    "<b>✨ Polish:</b> when a critter gathers cosmic dust it pops a ✨ bubble. Tap it to zoom right in and rub the dust off with your finger until it sparkles!",
    "<b>🎨 Style:</b> tap a critter then 🎨 Style to rename it or change its antenna colour.",
    "<b>🐣 Growing up:</b> hatchlings start tiny and grow to full size over a few cycles — look after them as they grow!",
    "<b>🌙 Recharge Pod:</b> rest to reach the next cycle. Send everyone to sleep happy for a glowing send-off! ✨",
    "<b>🤖 (top):</b> change your keeper. 💾 The game saves automatically.",
  ],
};
