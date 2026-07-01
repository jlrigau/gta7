/* =========================================================
   GAME DEFINITION — "GTA 7 · Neon City"
   ---------------------------------------------------------
   This file is the ENTIRE game: data + asset references.
   The engine (engine.js) contains no game content; it reads
   this `window.GAME` object.

   Theme: a small top-down neon city. On foot you explore the
   streets, hop into a car (the engine's "ride" system — fuel
   is the ride fatigue, stunt jumps are the ride jump), earn
   cash doing deliveries and complete missions. Cartoon /
   arcade tone, no explicit content. UI in French.

   All textures are generated (Pillow, CC0) — see tools/.
   Deliberately MINIMAL: a car-dealership shop, riding pedestrians,
   more districts, etc. are added by ITERATING on this config.
   ========================================================= */

window.GAME = {
  /* ---- Identity, theming, UI strings (French) ---- */
  meta: {
    title: "GTA 7 · Neon City",
    titleIcon: "🚗",
    shortName: "GTA7",
    tagline: "Roule dans la ville, fais des livraisons, deviens un caïd !",
    saveKey: "gta7-neon-city",
    audience: { minAge: 10, notes: "arcade/cartoon action, top-down driving, mild — no gore, no blood, no explicit content" },
    assetVersion: "v2",
    theme: { home: "#160f28", play: "#141024" },

    showCoins: true,
    coinIcon: "💵",
    showCreatureCount: false,   // cars aren't a "count to grow" — keep the HUD clean
    showCapacity: false,
    showDay: true,

    namePrompt: { label: "Nom de ta ville :", placeholder: "Neon City" },
    startName: "Neon City",
    namePromptYou: "Ton nom",
    avatarPrompt: "Choisis ton perso",
    createTitle: "🕶️ Choisis ton personnage",
    createOkLabel: "✅ C'est parti !",
    startLabel: "▶ Nouvelle partie",
    continueLabel: "📂 Continuer",
    continueHint: "Une partie est sauvegardée : appuie sur « Continuer ». 🚗",
    helpTitle: "❓ Comment jouer",

    nightMessage: "🌙 La nuit tombe sur Neon City…",
    morningMessage: "🌅 Jour {day} : nouvelle journée à Neon City. Le plein est fait ! ⛽",
    neglectMessage: "🌅 Jour {day}. En route pour de nouvelles courses !",
    restBlockedHint: "Tu viens de te réveiller ! Va faire un tour ou une course d'abord. 🚗",
    idleHint: "Déplace-toi 🚶 puis approche une voiture pour la conduire. Approche un bâtiment pour agir.",

    notEnough: "💸 Pas assez d'argent !",
    nameLabel: "Nom",
    confirm: "Valider",
    nameTaken: "Ce nom est déjà pris.",
    closeLabel: "Fermer",
    cancel: "Annuler",
  },

  /* ---- World: a top-down city. Base ground is asphalt (roads); sidewalk
         blocks + a park are painted on top, buildings sit on the blocks. ---- */
  world: {
    width: 2400, height: 1700, groundTile: "asphalt", bg: "#141024",
    patches: [
      // city blocks (sidewalk) in the four corners
      { x: 140,  y: 150,  w: 560, h: 470, tile: "sidewalk" },
      { x: 1700, y: 150,  w: 560, h: 470, tile: "sidewalk" },
      { x: 140,  y: 1080, w: 560, h: 470, tile: "sidewalk" },
      { x: 1700, y: 1080, w: 560, h: 470, tile: "sidewalk" },
      // central park
      { x: 930,  y: 540,  w: 560, h: 300, tile: "grass" },
      // crosswalks at a few intersections (flavour)
      { x: 800,  y: 360,  w: 64,  h: 130, tile: "crosswalk" },
      { x: 1540, y: 360,  w: 64,  h: 130, tile: "crosswalk" },
      { x: 800,  y: 1210, w: 64,  h: 130, tile: "crosswalk" },
      { x: 1540, y: 1210, w: 64,  h: 130, tile: "crosswalk" },
    ],
  },
  camera: { fitW: 1300, fitH: 1160, min: 0.4, max: 0.8 },

  /* ---- Assets (all generated, CC0) ---- */
  assets: {
    images: {
      asphalt: "assets/img/asphalt.png", sidewalk: "assets/img/sidewalk.png",
      crosswalk: "assets/img/crosswalk.png", grass: "assets/img/grass.png",
      tower_cyan: "assets/img/tower_cyan.png", tower_pink: "assets/img/tower_pink.png",
      shop_block: "assets/img/shop_block.png", palm: "assets/img/palm.png",
      garage: "assets/img/garage.png", gas: "assets/img/gas.png", depot: "assets/img/depot.png",
      hydrant: "assets/img/hydrant.png", streetlamp: "assets/img/streetlamp.png",
      ramp: "assets/img/ramp.png", want_gas: "assets/img/want_gas.png",
      cone: "assets/img/cone.png",
    },
    sheets: {
      player_vice: { path: "assets/sheet/player_vice.png", frameWidth: 64, frameHeight: 64 },
      player_cyan: { path: "assets/sheet/player_cyan.png", frameWidth: 64, frameHeight: 64 },
      car: { path: "assets/sheet/car.png", frameWidth: 64, frameHeight: 64 },
      pedestrian: { path: "assets/sheet/pedestrian.png", frameWidth: 64, frameHeight: 64 },
    },
  },

  /* ---- Player (on foot; faster once behind the wheel) ---- */
  player: {
    scale: 1.7,
    speed: { walk: 200, run: 330, rideWalk: 360, rideRun: 560 },
    spawn: { x: 1200, y: 1020 },
    nameY: -104,
  },
  characters: [
    { id: "vice", name: "Vince", sheet: "player_vice", thumb: "vice_thumb" },
    { id: "cyan", name: "Neo",   sheet: "player_cyan", thumb: "cyan_thumb" },
  ],

  /* ---- "Creatures" = CARS you can drive (ride) ----
     Fuel is the ride fatigue need; it drains as you drive and refills at the
     gas station / overnight in the garage. Low fuel pops a ⛽ warning bubble.
     No mood heart, no aging, no breeding — cars are vehicles, not pets. ---- */
  creature: {
    label: "voitures", icon: "🚗",
    sheet: "car",
    scale: 1.35,
    origin: { x: 0.5, y: 0.6 },
    walk: { start: 0, end: 3, frameRate: 5 },   // subtle headlight/idle animation
    showBars: true,                              // show the fuel gauge in the panel

    // a single "need": fuel. Refills fully overnight (perDay caps at 100).
    needs: [
      { id: "fuel", icon: "⛽", start: 100, perDay: 100 },
    ],

    // low-fuel warning bubble (replaces the mood heart entirely — cars have no mood).
    wantBubble: { sprite: "want_gas", need: "fuel", below: 30, intermittent: true,
      scale: 0.55, lift: 18, showFor: 2.4, hideMin: 5, hideMax: 11 },

    // repaint your ride (GTA "Pay'n'Spray") — the variant is the paint colour.
    variants: [
      { id: "silver", name: "Argent", color: "#dcdce4" },                     // base sheet, no tint
      { id: "red",    name: "Rouge",  color: "#e24a4a", tint: "#e24a4a" },
      { id: "blue",   name: "Bleue",  color: "#4a96f0", tint: "#4a96f0" },
      { id: "yellow", name: "Jaune",  color: "#facd46", tint: "#facd46" },
      { id: "green",  name: "Verte",  color: "#5ac878", tint: "#5ac878" },
      { id: "purple", name: "Violet", color: "#b06cf0", tint: "#b06cf0" },
    ],
    variantLabel: "Couleur",
    customize: { rename: true, variant: true },
    customizeTitle: "🎨 Atelier peinture",
    customizedMessage: "{name} est comme neuve ! ✨",

    actions: [
      { id: "drive", type: "ride", label: "Conduire", icon: "🚗", dismountLabel: "Descendre" },
      { id: "race",  type: "race", label: "Course", icon: "🏁" },
      { id: "boost", type: "jump", label: "Saut cascade", icon: "🌟" },
      { id: "paint", type: "customize", label: "Peinture", icon: "🎨" },
    ],

    ride: {
      fatigueNeed: "fuel",
      minEnergy: 6,
      sitY: -30, nameY: -108,
      mountMessage: "🚗 Tu prends le volant de {name} !",
      dismountMessage: "🚶 Tu sors de {name}.",
      dismountLabel: "Descendre",
      exhaustedMessage: "⛽ Panne sèche ! {name} n'a plus d'essence.",
      tooTired: "⛽ {name} est à sec — va faire le plein !",
      jump: { distance: 210, cost: 7, minEnergy: 10, tooTired: "⛽ Pas assez d'essence pour un saut !" },
    },

    names: ["Comète", "Banshee", "Éclair", "Bolide", "Tornade", "Fusée", "Panthère", "Vipère", "Ouragan", "Météore"],
    startCount: 5,
    startCreatures: [
      { name: "Comète",  variant: "red" },
      { name: "Banshee", variant: "blue" },
      { name: "Éclair",  variant: "yellow" },
      { name: "Bolide",  variant: "green" },
      { name: "Vipère",  variant: "silver" },
    ],
  },

  /* ---- Course : au volant, appuie sur 🏁 pour lancer une course chronométrée.
         La caméra ZOOME sur la voiture, enchaîne les checkpoints autour du parc
         avant la fin du temps, en évitant les piétons et les plots sur la route. ---- */
  race: {
    time: 50,               // secondes
    zoom: 1.05,             // vue rapprochée sur la voiture pendant la course
    reward: 90,             // 💵 gagnés si on termine
    hitPenalty: 3,          // secondes perdues à chaque collision
    checkpointRadius: 80,
    // boucle autour du parc central (toutes ces positions sont sur la route)
    checkpoints: [
      { x: 1600, y: 700 }, { x: 1600, y: 1300 }, { x: 800, y: 1300 },
      { x: 800, y: 700 },  { x: 1200, y: 470 },
    ],
    hazards: {
      coneSprite: "cone", coneScale: 1.15, coneRadius: 24,
      cones: [
        { x: 1600, y: 960 }, { x: 1600, y: 1080 }, { x: 1200, y: 1300 },
        { x: 820, y: 1060 }, { x: 800, y: 940 },   { x: 1400, y: 520 },
      ],
      pedestrianSheet: "pedestrian", pedestrianScale: 1.3,
      pedestrianCount: 8, pedestrianRadius: 34, pedestrianSpeed: 62,
    },
    quitLabel: "Abandonner",
    startMessage: "🏁 Course lancée ! Fonce au checkpoint 1 — évite les piétons et les plots !",
    checkpointMessage: "✅ Checkpoint {n}/{t} !",
    hitMessage: "🚧 Aïe ! −{n}s",
    winMessage: "🏆 Course gagnée ! +💵{r}",
    loseMessage: "⏱ Temps écoulé ! Course perdue — réessaie !",
  },

  /* ---- Roaming bounds for the cars (invisible: no fence, no tint) ---- */
  zones: [
    { id: "streets", home: true, rect: { x: 240, y: 240, w: 1920, h: 1220 } },
  ],

  /* ---- Buildings, palms & props (scenery; 5th item = AABB collision box) ---- */
  scenery: [
    // corner towers (collision covers the footprint so you can't drive through)
    [420,  560,  "tower_cyan", 1.45, { dx: -92, dy: -150, w: 184, h: 150 }],
    [1980, 560,  "tower_pink", 1.5,  { dx: -88, dy: -140, w: 176, h: 140 }],
    [420,  1490, "shop_block", 1.5,  { dx: -108, dy: -110, w: 216, h: 100 }],
    [1980, 1470, "tower_cyan", 1.35, { dx: -84, dy: -138, w: 168, h: 138 }],
    // palms dotted around the park & sidewalks
    [700,  700,  "palm", 1.3, { dx: -12, dy: -14, w: 24, h: 16 }],
    [1720, 700,  "palm", 1.3, { dx: -12, dy: -14, w: 24, h: 16 }],
    [700,  1030, "palm", 1.3, { dx: -12, dy: -14, w: 24, h: 16 }],
    [1720, 1030, "palm", 1.3, { dx: -12, dy: -14, w: 24, h: 16 }],
    [1120, 1010, "palm", 1.2, { dx: -12, dy: -14, w: 24, h: 16 }],
    [1300, 1010, "palm", 1.2, { dx: -12, dy: -14, w: 24, h: 16 }],
    // street props
    [900,  300,  "streetlamp", 1.2, false],
    [1500, 300,  "streetlamp", 1.2, false],
    [900,  1360, "streetlamp", 1.2, false],
    [1500, 1360, "streetlamp", 1.2, false],
    [770,  470,  "hydrant", 1.1, { dx: -8, dy: -8, w: 16, h: 10 }],
    [1640, 1180, "hydrant", 1.1, { dx: -8, dy: -8, w: 16, h: 10 }],
    // stunt ramps on the straightaways (no collision — drive over & hit 🌟)
    [1200, 470,  "ramp", 1.4, false],
    [1200, 1150, "ramp", 1.4, false],
  ],

  /* ---- Stations: Garage (sleep→next day, free refuel), Gas (paid refuel),
         Depot (delivery job → cash). ---- */
  stations: [
    { type: "rest", x: 1200, y: 930, sprite: "garage", scale: 1.15, label: "Garage",
      box: { dx: -84, dy: -62, w: 168, h: 54 },
      action: "nextDay", actionLabel: "🌙 Dormir (jour suivant)" },

    { type: "gas", x: 350, y: 860, sprite: "gas", scale: 1.1, label: "Station-service",
      box: { dx: -76, dy: -60, w: 152, h: 54 },
      action: "custom", actionLabel: "⛽ Faire le plein (−💵15)",
      onUse: function (state, api) {
        var cost = 15;
        if ((state.coins || 0) < cost) { api.message("💸 Pas assez d'argent pour l'essence !"); return; }
        state.coins -= cost;
        (state.creatures || []).forEach(function (c) { c.fuel = 100; });
        api.message("⛽ Plein fait pour toutes tes voitures ! (−💵" + cost + ")");
        api.refreshHud(); api.save();
      } },

    { type: "depot", x: 2060, y: 860, sprite: "depot", scale: 1.1, label: "Dépôt",
      box: { dx: -84, dy: -66, w: 168, h: 58 },
      action: "custom", actionLabel: "📦 Prendre une livraison (+💵35)",
      onUse: function (state, api) {
        var pay = 35;
        state.coins += pay;
        state.stats.jobs = (state.stats.jobs || 0) + 1;
        var lines = ["📦 Livraison réussie ! +💵" + pay, "📦 Colis livré à temps ! +💵" + pay, "📦 Beau boulot, chauffeur ! +💵" + pay];
        api.message(lines[(state.stats.jobs - 1) % lines.length]);
        api.refreshHud(); api.save();
      } },
  ],

  /* ---- Economy ---- */
  economy: { startCoins: 20, startResources: {}, startCapacity: 9, dayReward: 40 },

  /* ---- Missions (objectives) ---- */
  objectives: {
    extraStats: ["ride", "jump", "jobs", "raceWin"],
    levels: [
      { name: "Bleu", goals: [
        { id: "drive1", name: "Première virée", desc: "Monte dans une voiture", check: (s) => (s.stats.ride || 0) >= 1 },
        { id: "stunt1", name: "Cascadeur", desc: "Réussis un saut cascade 🌟", check: (s) => (s.stats.jump || 0) >= 1 },
        { id: "job3",   name: "Livreur", desc: "Fais 3 livraisons au Dépôt", check: (s) => (s.stats.jobs || 0) >= 3 },
        { id: "race1",  name: "Pilote", desc: "Gagne une course 🏁", check: (s) => (s.stats.raceWin || 0) >= 1 },
      ] },
      { name: "Caïd", goals: [
        { id: "job8",   name: "Roi de la route", desc: "Fais 8 livraisons en tout", check: (s) => (s.stats.jobs || 0) >= 8 },
        { id: "race3",  name: "Champion", desc: "Gagne 3 courses", check: (s) => (s.stats.raceWin || 0) >= 3 },
        { id: "day3",   name: "Increvable", desc: "Atteins le Jour 3", check: (s) => (s.day || 1) >= 3 },
        { id: "cash400", name: "Gros bonnet", desc: "Aie 💵400 en poche", check: (s) => (s.coins || 0) >= 400 },
      ] },
    ],
  },

  /* ---- Help ---- */
  help: [
    "<b>Bienvenue à Neon City !</b> Une petite ville en vue de dessus où tu roules, livres et cascades. 🚗",
    "<b>🚶 Se déplacer :</b> touche l'endroit où aller (ton perso s'y rend). Double-tape pour courir. (Clavier : flèches ou ZQSD/WASD.)",
    "<b>🚗 Conduire :</b> approche une voiture et appuie sur « Conduire ». On roule plus vite en voiture ! ⛽ L'essence baisse en roulant.",
    "<b>🏁 Course :</b> au volant, appuie sur « Course » : la caméra zoome sur ta voiture et tu dois enchaîner les checkpoints avant la fin du chrono, en évitant les 🚶 piétons et les 🚧 plots (chaque choc coûte du temps) !",
    "<b>🌟 Saut cascade :</b> au volant, appuie sur « Saut cascade » pour bondir — vise une rampe pour le style !",
    "<b>⛽ Essence :</b> quand une voiture est presque à sec, une bulle ⛽ apparaît. Va à la <b>Station-service</b> pour faire le plein (ou dors au Garage).",
    "<b>📦 Dépôt :</b> prends des livraisons pour gagner de l'💵argent.",
    "<b>🎨 Peinture :</b> sélectionne une voiture puis « Peinture » pour la renommer ou changer sa couleur.",
    "<b>🌙 Garage :</b> dors pour passer au jour suivant — tes voitures refont le plein et tu touches ta paie.",
    "<b>🎯 Missions :</b> ouvre le menu 🎯 pour voir tes objectifs. 💾 La partie se sauvegarde toute seule.",
  ],
};
