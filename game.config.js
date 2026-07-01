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
    assetVersion: "v4",
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
      cone: "assets/img/cone.png", police: "assets/img/police.png",
      // pseudo-3D race view billboards
      car_back: "assets/img/car_back.png",
      bldg_a: "assets/img/bldg_a.png", bldg_b: "assets/img/bldg_b.png",
    },
    sheets: {
      player_man: { path: "assets/sheet/player_man.png", frameWidth: 64, frameHeight: 64 },
      player_woman: { path: "assets/sheet/player_woman.png", frameWidth: 64, frameHeight: 64 },
      car: { path: "assets/sheet/car.png", frameWidth: 64, frameHeight: 64 },
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
    { id: "man",   name: "Marco", sheet: "player_man",   thumb: "man_thumb" },
    { id: "woman", name: "Nadia", sheet: "player_woman", thumb: "woman_thumb" },
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

    // a single "need": fuel. Drains as you drive; refuel (paid) at the gas station.
    // No free overnight refill anymore — fuel is a real cost (perDay: 0).
    needs: [
      { id: "fuel", icon: "⛽", start: 100, perDay: 0 },
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
    // Repainting is done at the GARAGE (Pay'n'Spray) now — no paint action on the car.

    actions: [
      { id: "drive", type: "ride", label: "Conduire", icon: "🚗", dismountLabel: "Descendre" },
      { id: "race",  type: "race", label: "Course", icon: "🏁" },
      { id: "boost", type: "jump", label: "Saut cascade", icon: "🌟" },
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
      // stunt jumps pay a little (rewards skill) and can clear ramps
      jump: { distance: 210, cost: 7, minEnergy: 10, reward: 8, rewardMessage: "🌟 Belle cascade ! +💵{r}", tooTired: "⛽ Pas assez d'essence pour un saut !" },
    },

    names: ["Comète", "Banshee", "Éclair", "Bolide", "Tornade", "Fusée", "Panthère", "Vipère", "Ouragan", "Météore"],
    // You start with a couple of modest beaters — buy faster rides at the dealership.
    startCount: 3,
    startCreatures: [
      { name: "Vieux Tacot", variant: "silver", speedMul: 0.85, grip: 0.9,  drainMul: 1.15 },
      { name: "Comète",      variant: "red",    speedMul: 0.95, grip: 1.0,  drainMul: 1.0 },
      { name: "Banshee",     variant: "blue",   speedMul: 1.0,  grip: 1.0,  drainMul: 1.0 },
    ],
  },

  /* ---- Course : au volant, appuie sur 🏁 pour lancer une COURSE en vue de
         derrière la voiture (pseudo-3D, comme un jeu de course arcade). La route
         file vers un horizon néon ; tourne (◀ ▶ ou touche gauche/droite de l'écran)
         pour rester sur la piste et éviter piétons et plots, avant la fin du chrono. ---- */
  race: {
    time: 70,               // secondes pour rejoindre l'arrivée
    reward: 110,            // 💵 gagnés à l'arrivée
    hitPenalty: 3,          // secondes perdues à chaque choc
    carSprite: "car_back",  // ta voiture vue de derrière (teintée à sa couleur)
    roadside: ["bldg_a", "bldg_b", "palm", "streetlamp"],   // décor qui défile au bord de la route
    spriteZoom: 0.05,
    track: { segments: 1100, speed: 1.0, steer: 2.6, centrifugal: 0.65 },
    // Obstacles à éviter — GROS et bien espacés, aucune personne : plots + voitures lentes.
    hazards: {
      obstacles: [
        { sprite: "cone",     every: 30, phase: 0,  scale: 4.2, hw: 0.30, spread: 0.6 },
        { sprite: "car_back", every: 52, phase: 22, scale: 6.5, hw: 0.36, spread: 0.42 },
      ],
    },
    quitLabel: "Quitter",
    startMessage: "🏁 3… 2… 1… GO ! Rejoins l'arrivée en évitant piétons et plots !",
    hitMessage: "🚧 Aïe ! −{n}s",
    winMessage: "🏆 Course gagnée ! +💵{r}",
    loseMessage: "⏱ Temps écoulé ! Course perdue — réessaie !",
    quitMessage: "🏁 Tu quittes la course.",
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

  /* ---- Stations ----
     Garage = Pay'n'Spray (repeindre = effacer l'alerte police) + dormir.
     Station-service = plein payant. Dépôt = prendre une livraison (destination sur la
     carte). Concession = acheter de meilleures voitures. ---- */
  stations: [
    { type: "rest", x: 1200, y: 930, sprite: "garage", scale: 1.15, label: "Garage",
      box: { dx: -84, dy: -62, w: 168, h: 54 },
      action: "garage", actionLabel: "🏚️ Garage (peinture / dormir)" },

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
      action: "jobBoard", actionLabel: "📦 Prendre une livraison" },

    { type: "dealer", x: 1200, y: 300, sprite: "shop_block", scale: 1.15, label: "Concession",
      box: { dx: -96, dy: -50, w: 192, h: 46 },
      action: "dealer", actionLabel: "🏪 Concession auto" },
  ],

  /* ---- Livraisons : le Dépôt donne une destination sur la carte (📦 + flèche).
         Roule jusque-là pour être payé. Les cargaisons « chaudes » paient plus mais
         font monter l'alerte police ⭐. ---- */
  jobs: {
    title: "📦 Bureau des livraisons",
    subtitle: "Choisis ta course :",
    radius: 90,
    offers: [
      { label: "📦 Livraison tranquille", sub: "Paie sûre, aucun risque", pay: 45 },
      { label: "🔥 Cargaison sensible", sub: "Grosse paie… mais la police rôde ⭐⭐", pay: 120, hot: true, heat: 2 },
    ],
    dests: [
      { x: 560,  y: 690,  name: "le quartier Ouest" },
      { x: 1860, y: 690,  name: "le quartier Est" },
      { x: 560,  y: 1360, name: "les Docks" },
      { x: 1860, y: 1360, name: "la Zone" },
      { x: 1200, y: 1360, name: "le Front de mer" },
    ],
    takenMessage: "📦 En route ! Livre à {d}. Suis la flèche.",
    hotMessage: "🔥 Cargaison sensible ! Les flics arrivent ⭐⭐. File livrer à {d} !",
    deliveredMessage: "✅ Livré ! +💵{p}",
    busyMessage: "🚚 Termine d'abord ta livraison en cours !",
  },

  /* ---- Police : les jobs « chauds » font monter l'alerte ⭐. Des voitures de
         police te prennent en chasse ; si elles te collent → arrêté (amende + colis
         perdu). Sème-les (cours / roule vite) ou repeins ta caisse au Garage. ---- */
  police: {
    sprite: "police", scale: 1.3, maxStars: 3, maxUnits: 3,
    speed: 232, catchRadius: 66, bustSeconds: 3.6,
    loseRadius: 820, loseAfter: 7, bustFine: 50, spawnDist: 660,
    escapedMessage: "🚔 Tu as semé la police ! 😮‍💨",
    bustMessage: "🚔 Arrêté ! −💵{f}{j}",
  },

  /* ---- Concession : dépense ton argent en meilleures voitures (le vrai puits +
         la progression). Vitesse ⚡, tenue 🎯, autonomie ⛽. ---- */
  dealership: {
    title: "🏪 Concession auto",
    subtitle: "Une meilleure caisse = plus rapide en ville ET en course :",
    boughtMessage: "🔑 {name} est à toi ! Va la conduire.",
    fullMessage: "🅿️ Ton garage est plein !",
    cars: [
      { id: "cruiser", name: "Le Croiseur", price: 180, variant: "blue",   speedMul: 1.15, grip: 1.1,  drainMul: 0.9,  range: "+",   desc: "Rapide et sobre" },
      { id: "gt",      name: "Néon GT",     price: 420, variant: "purple", speedMul: 1.35, grip: 1.2,  drainMul: 0.85, range: "++",  desc: "Bête de course" },
      { id: "beast",   name: "La Bête",     price: 850, variant: "red",    speedMul: 1.55, grip: 1.35, drainMul: 0.8,  range: "+++", desc: "Reine de Neon City" },
    ],
  },

  /* ---- Garage (Pay'n'Spray) : repeindre efface l'alerte police + change la couleur. ---- */
  garage: {
    title: "🏚️ Garage",
    subtitle: "Que veux-tu faire ?",
    paintCost: 20,
    repaintMessage: "🎨 Repeinte en {c} — les flics perdent ta trace ! 🚔",
    paintedMessage: "🎨 Repeinte en {c} !",
  },

  /* ---- Economy : plus d'argent gratuit en dormant — tout vient des jobs. ---- */
  economy: { startCoins: 70, startResources: {}, startCapacity: 12, dayReward: 0 },

  /* ---- Grades (progression par réputation) ---- */
  objectives: {
    extraStats: ["ride", "jump", "jobs", "raceWin", "earned"],
    levels: [
      { name: "Bleu", goals: [
        { id: "drive1", name: "Première virée", desc: "Monte dans une voiture", check: (s) => (s.stats.ride || 0) >= 1 },
        { id: "job1",   name: "Premier colis", desc: "Réussis une livraison 📦", check: (s) => (s.stats.jobs || 0) >= 1 },
        { id: "race1",  name: "Baptême du feu", desc: "Gagne une course 🏁", check: (s) => (s.stats.raceWin || 0) >= 1 },
      ] },
      { name: "Chauffeur", goals: [
        { id: "job5",   name: "Livreur", desc: "Fais 5 livraisons", check: (s) => (s.stats.jobs || 0) >= 5 },
        { id: "earn300", name: "Premiers billets", desc: "Gagne 💵300 en tout", check: (s) => (s.stats.earned || 0) >= 300 },
        { id: "stunt3", name: "Cascadeur", desc: "Réussis 3 sauts cascade 🌟", check: (s) => (s.stats.jump || 0) >= 3 },
      ] },
      { name: "As du volant", goals: [
        { id: "buy1",   name: "Nouvelle caisse", desc: "Achète une voiture à la Concession 🏪", check: (s) => (s.creatures || []).some((c) => c.model) },
        { id: "race3",  name: "Pilote confirmé", desc: "Gagne 3 courses", check: (s) => (s.stats.raceWin || 0) >= 3 },
        { id: "job12",  name: "Transporteur", desc: "Fais 12 livraisons", check: (s) => (s.stats.jobs || 0) >= 12 },
      ] },
      { name: "Caïd", goals: [
        { id: "earn1500", name: "Fortune", desc: "Gagne 💵1500 en tout", check: (s) => (s.stats.earned || 0) >= 1500 },
        { id: "race8",  name: "Champion", desc: "Gagne 8 courses", check: (s) => (s.stats.raceWin || 0) >= 8 },
        { id: "beast",  name: "Roi de Neon City", desc: "Possède « La Bête » 🏎️", check: (s) => (s.creatures || []).some((c) => c.model === "beast") },
      ] },
    ],
  },

  /* ---- Help ---- */
  help: [
    "<b>Bienvenue à Neon City !</b> Deviens le meilleur chauffeur : roule, livre, cours… et gère la police. 🚗",
    "<b>🚶 Se déplacer :</b> touche où aller (double-tape pour courir). Clavier : flèches ou ZQSD/WASD. <b>🚗 Conduire :</b> approche une voiture → « Conduire ». On roule bien plus vite en voiture.",
    "<b>📦 Livraisons (Dépôt) :</b> prends une course ; une destination 📦 apparaît sur la carte avec une flèche. Roule jusque-là pour être payé.",
    "<b>🔥 Cargaisons sensibles :</b> elles paient gros mais font monter l'alerte police ⭐⭐.",
    "<b>🚔 Police :</b> avec des étoiles ⭐, des voitures de police te chassent. Si elles te collent → arrêté (amende + colis perdu). <b>Sème-les</b> en roulant vite… ou fonce au <b>Garage repeindre</b> ta caisse (l'alerte retombe à zéro !).",
    "<b>🏁 Course :</b> au volant → « Course » : vue <b>derrière la voiture</b>. Tourne (◀ ▶ ou moitié gauche/droite de l'écran), évite les plots et voitures, rejoins l'arrivée avant le chrono. Une meilleure caisse va plus vite !",
    "<b>🏪 Concession :</b> dépense ton argent en voitures plus rapides (⚡ vitesse, 🎯 tenue, ⛽ autonomie) — c'est ta progression.",
    "<b>⛽ Essence :</b> ça baisse en roulant. Fais le plein (payant) à la <b>Station-service</b>. <b>🌟 Cascade :</b> au volant, saute sur une rampe pour un petit bonus.",
    "<b>🎯 Grades :</b> ouvre 🎯 pour voir ta montée (Bleu → Chauffeur → As du volant → Caïd). 💾 Sauvegarde automatique.",
  ],
};
