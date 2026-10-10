/* =========================================================
   GAME DEFINITION — "GTA 7 · Neon City"
   ---------------------------------------------------------
   This file is the ENTIRE game: data + asset references.
   The engine (engine.js) contains no game content; it reads
   this `window.GAME` object.

   A small top-down neon city (French UI, ages 10+, cartoon /
   arcade tone, nothing explicit). On foot you explore; hop into
   a car (the engine's ride system: fuel = ride fatigue, stunt
   jumps = ride jump); take deliveries at the Depot (missions),
   shake off the cops on "hot" jobs (chase), race in a pseudo-3D
   behind-the-car view (race), buy faster cars at the dealership
   (models) and repaint at the garage (station menu → restyle).

   All art is generated from tools/art/neon.cjs (SVG → WebP, CC0).
   ========================================================= */

window.GAME = {
  /* ---- Identity, theming, UI strings (French) ---- */
  meta: {
    title: "GTA 7 · Neon City",
    titleIcon: "car",
    logo: "assets/img/logo.webp",
    splash: "assets/img/splash.webp",
    shortName: "GTA7",
    tagline: "Roule, livre, fais la course… et sème la police !",
    saveKey: "gta7-neon-city",
    audience: { minAge: 10, notes: "arcade/cartoon action, top-down driving, mild — no weapons, no gore, no blood, no explicit content" },
    assetVersion: "v8",
    theme: { home: "#160f28", play: "#141024", closeup: "#141024" },

    showCoins: true,
    coinIcon: "cash",
    showCreatureCount: false,   // cars aren't a "count to grow" — keep the HUD clean
    showCapacity: false,
    showDay: true,

    namePrompt: { label: "Nom de ta ville :", placeholder: "Neon City" },
    startName: "Neon City",
    namePromptYou: "Ton nom",
    createTitle: "Choisis ton perso",
    createOkLabel: "C'est parti !",
    startLabel: "Nouvelle partie",
    continueLabel: "Continuer",
    continueHint: "Ta partie t'attend, la ville aussi !",
    helpTitle: "{i:help} Comment jouer",

    nightMessage: "{i:moon} La nuit tombe sur Neon City…",
    morningMessage: "{i:city} Jour {day} : nouvelle journée à Neon City !",
    neglectMessage: "{i:city} Jour {day}. En route pour de nouvelles courses !",
    restBlockedHint: "Tu viens de te réveiller ! Va faire un tour d'abord.",
    idleHint: "Touche une voiture pour la conduire, ou un bâtiment",
    notEnough: "{i:cash} Pas assez d'argent !",
    nameLabel: "Nom", confirm: "Valider", nameTaken: "Ce nom est déjà pris.", cancel: "Annuler",
    strings: {
      closeLabel: "Fermer", soundLabel: "Son", coinsLabel: "Argent", dayLabel: "Jour", levelLabel: "Grade",
      noSave: "Aucune partie sauvegardée.", refreshLabel: "Rafraîchir",
      goalComplete: "{i:goals} Objectif réussi : {name} !", goalsComplete: "{i:goals} {n} objectifs réussis !",
      levelUp: "{i:trophy} Promotion ! Tu passes au grade {n} !", goalsTitle: "{i:goals} Grades",
      allGoalsDone: "Tu as tout réussi : tu es le roi de Neon City !", goalsProgress: "{done}/{total} objectifs — réussis-les pour passer au grade {next}",
      topLevel: "{i:trophy} Grade maximum : Caïd de Neon City !",
    },
  },

  /* ---- Illustrated UI icons (tools/art/neon.cjs → assets/ui/icons). Any text can embed {i:key}. ---- */
  icons: {
    star: "assets/ui/icons/star.webp", heart: "assets/ui/icons/heart.webp", heartEmpty: "assets/ui/icons/heartEmpty.webp",
    sound: "assets/ui/icons/sound.webp", soundOff: "assets/ui/icons/soundOff.webp", help: "assets/ui/icons/help.webp",
    avatar: "assets/ui/icons/avatar.webp", goals: "assets/ui/icons/goals.webp", close: "assets/ui/icons/close.webp",
    play: "assets/ui/icons/play.webp", resume: "assets/ui/icons/resume.webp", check: "assets/ui/icons/check.webp",
    gift: "assets/ui/icons/gift.webp", hand: "assets/ui/icons/hand.webp", sparkle: "assets/ui/icons/sparkle.webp",
    refresh: "assets/ui/icons/refresh.webp", arrow: "assets/ui/icons/arrow.webp", trophy: "assets/ui/icons/trophy.webp",
    moon: "assets/ui/icons/moon.webp", calendar: "assets/ui/icons/calendar.webp", palette: "assets/ui/icons/palette.webp",
    cash: "assets/ui/icons/cash.webp", fuel: "assets/ui/icons/fuel.webp", car: "assets/ui/icons/car.webp",
    parcel: "assets/ui/icons/parcel.webp", police: "assets/ui/icons/police.webp", wanted: "assets/ui/icons/wanted.webp",
    flag: "assets/ui/icons/flag.webp", dealer: "assets/ui/icons/dealer.webp", garage: "assets/ui/icons/garage.webp",
    wrench: "assets/ui/icons/wrench.webp", speed: "assets/ui/icons/speed.webp", grip: "assets/ui/icons/grip.webp",
    range: "assets/ui/icons/range.webp", stunt: "assets/ui/icons/stunt.webp", bed: "assets/ui/icons/bed.webp",
    city: "assets/ui/icons/city.webp", quit: "assets/ui/icons/quit.webp", left: "assets/ui/icons/left.webp", right: "assets/ui/icons/right.webp",
    timer: "assets/ui/icons/timer.webp", distance: "assets/ui/icons/distance.webp",
  },

  /* ---- Look & feel: smooth hi-res art, neon dusk ---- */
  render: {
    pixelArt: false,
    vignette: 0.3,
    selectColor: "#38e0e6",
    tapColor: "#ff4d97",
    text: { color: "#ffffff", stroke: "#1c1633" },
    label: { bg: "#1c1633", color: "#ffffff", border: "#38e0e6", alpha: 0.92, size: 20 },
    ambient: { particle: "soft", colors: ["#38e0e6", "#ff4d97", "#b06cf0"], count: 14, speed: 6, drift: "float", alpha: [0.08, 0.25], scale: [0.5, 1.2], blend: "add" },
    confetti: ["#38e0e6", "#ff4d97", "#ffcf3f", "#b06cf0", "#6ef0a0", "#ffffff"],
  },

  /* ---- Sound: procedural sounds + a synthwave-ish loop ---- */
  audio: {
    volume: 0.6,
    music: { tempo: 112, root: 57, scale: "minorPenta", progression: [0, 8, 3, 10], pad: "sawtooth", lead: "square", density: 0.5, volume: 0.1 },
  },

  /* ---- World: a top-down city. Asphalt everywhere; sidewalk blocks + a park on top ---- */
  world: {
    width: 2400, height: 1700, groundTile: "asphalt", bg: "#1b1834",
    patches: [
      { x: 140, y: 150, w: 560, h: 470, tile: "sidewalk" },
      { x: 1700, y: 150, w: 560, h: 470, tile: "sidewalk" },
      { x: 140, y: 1080, w: 560, h: 470, tile: "sidewalk" },
      { x: 1700, y: 1080, w: 560, h: 470, tile: "sidewalk" },
      { x: 930, y: 540, w: 560, h: 300, tile: "grass" },
      // dashed centre lines on the main avenues
      { x: 700, y: 409, w: 1000, h: 32, tile: "lane" },
      { x: 700, y: 1259, w: 1000, h: 32, tile: "lane" },
      { x: 784, y: 620, w: 32, h: 460, tile: "lane_v" },
      { x: 1584, y: 620, w: 32, h: 460, tile: "lane_v" },
      // crosswalks
      { x: 868, y: 360, w: 64, h: 128, tile: "crosswalk" },
      { x: 1468, y: 360, w: 64, h: 128, tile: "crosswalk" },
      { x: 868, y: 1210, w: 64, h: 128, tile: "crosswalk" },
      { x: 1468, y: 1210, w: 64, h: 128, tile: "crosswalk" },
    ],
  },
  camera: { fitW: 800, fitH: 900, min: 0.45, max: 0.85 },

  /* ---- Assets (all generated, CC0) ---- */
  assets: {
    images: {
      asphalt: { path: "assets/img/asphalt.webp", res: 2 }, sidewalk: { path: "assets/img/sidewalk.webp", res: 2 },
      crosswalk: { path: "assets/img/crosswalk.webp", res: 2 }, grass: { path: "assets/img/grass.webp", res: 2 },
      lane: { path: "assets/img/lane.webp", res: 2 }, lane_v: { path: "assets/img/lane_v.webp", res: 2 },
      tower_cyan: { path: "assets/img/tower_cyan.webp", res: 2 }, tower_pink: { path: "assets/img/tower_pink.webp", res: 2 },
      dealer: { path: "assets/img/dealer.webp", res: 2 }, garage: { path: "assets/img/garage.webp", res: 2 },
      gas: { path: "assets/img/gas.webp", res: 2 }, depot: { path: "assets/img/depot.webp", res: 2 }, shop_block: { path: "assets/img/shop_block.webp", res: 2 },
      palm: { path: "assets/img/palm.webp", res: 2 }, streetlamp: { path: "assets/img/streetlamp.webp", res: 2 }, hydrant: { path: "assets/img/hydrant.webp", res: 2 },
      ramp: { path: "assets/img/ramp.webp", res: 2 }, bench: { path: "assets/img/bench.webp", res: 2 }, planter: { path: "assets/img/planter.webp", res: 2 },
      billboard: { path: "assets/img/billboard.webp", res: 2 },
      want_gas: { path: "assets/img/want_gas.webp", res: 2 }, parcel: { path: "assets/img/parcel.webp", res: 2 }, flag: { path: "assets/img/flag.webp", res: 2 },
      // pseudo-3D race view billboards
      car_back: { path: "assets/img/car_back.webp", res: 2 }, cone: { path: "assets/img/cone.webp", res: 2 },
      bldg_a: { path: "assets/img/bldg_a.webp", res: 2 }, bldg_b: { path: "assets/img/bldg_b.webp", res: 2 },
    },
    sheets: {
      player_man: { path: "assets/sheet/player_man.webp", frameWidth: 128, frameHeight: 128, res: 2 },
      player_woman: { path: "assets/sheet/player_woman.webp", frameWidth: 128, frameHeight: 128, res: 2 },
      car: { path: "assets/sheet/car.webp", frameWidth: 128, frameHeight: 128, res: 2 },
      police: { path: "assets/sheet/police.webp", frameWidth: 128, frameHeight: 128, res: 2 },
    },
  },

  /* ---- Player (on foot; much faster behind the wheel) ---- */
  player: {
    scale: 0.82,
    speed: { walk: 200, run: 330, rideWalk: 360, rideRun: 560 },
    spawn: { x: 1200, y: 1060 },
    nameY: -116,
  },
  characters: [
    { id: "man", name: "Marco", sheet: "player_man", thumb: "assets/ui/man_thumb.webp" },
    { id: "woman", name: "Nadia", sheet: "player_woman", thumb: "assets/ui/woman_thumb.webp" },
  ],

  /* ---- "Creatures" = CARS you can drive (ride) ----
     Seen from above: a directional sheet (rows up/left/down/right × 2 idle frames).
     Fuel is the ride fatigue need; refill (paid) at the gas station. ---- */
  creature: {
    label: "voitures", icon: "car",
    sheet: "car", dirSheet: { cols: 2 },
    scale: 1.2,
    origin: { x: 0.5, y: 0.62 },
    headY: 70,
    shadow: { w: 80, h: 30 },
    spacing: 110,
    walk: { start: 0, end: 1, frameRate: 3, idleFrame: 0 },
    wander: false, hello: false,          // parked cars stay where you leave them
    breathe: 0,
    showMood: false,
    showBars: true,
    nameY: 30, nameSize: 15,
    variantLabel: "Couleur",
    needs: [{ id: "fuel", icon: "fuel", label: "Essence", start: 100, perDay: 0 }],
    // low-fuel warning bubble
    wantBubble: { sprite: "want_gas", need: "fuel", below: 30, intermittent: true, scale: 0.55, lift: 18, showFor: 2.4, hideMin: 5, hideMax: 11 },
    variants: [
      { id: "silver", name: "Argent", color: "#dcdce4" },
      { id: "red", name: "Rouge", color: "#e24a4a", tint: "#ff5a5a" },
      { id: "blue", name: "Bleue", color: "#4a96f0", tint: "#5aa6ff" },
      { id: "yellow", name: "Jaune", color: "#facd46", tint: "#ffd84a" },
      { id: "green", name: "Verte", color: "#5ac878", tint: "#6ad888" },
      { id: "purple", name: "Violette", color: "#b06cf0", tint: "#c07cff" },
    ],
    actions: [
      { id: "drive", type: "ride", label: "Conduire", icon: "car", color: "#38e0e6", dismountLabel: "Descendre", dismountIcon: "close" },
      { id: "race", type: "race", label: "Course", icon: "flag", color: "#ff4d97" },
      { id: "boost", type: "jump", label: "Cascade", icon: "stunt", color: "#ffcf3f" },
    ],
    ride: {
      fatigueNeed: "fuel", minEnergy: 6, hideRider: true,
      sitY: 0, nameY: -72,
      mountMessage: "{i:car} Tu prends le volant de {name} !",
      dismountMessage: "Tu sors de {name}.",
      exhaustedMessage: "{i:fuel} Panne sèche ! {name} n'a plus d'essence.",
      tooTired: "{i:fuel} {name} est à sec — va faire le plein !",
      // stunt jumps pay a little and can clear the ramps
      jump: { distance: 210, cost: 7, minEnergy: 10, reward: 8, rewardMessage: "{i:stunt} Belle cascade ! +{r}", tooTired: "{i:fuel} Pas assez d'essence pour une cascade !" },
    },
    names: ["Comète", "Banshee", "Éclair", "Bolide", "Tornade", "Fusée", "Panthère", "Vipère", "Ouragan", "Météore"],
    startCount: 3,
    startCreatures: [
      { name: "Vieux Tacot", variant: "silver", speedMul: 0.85, grip: 0.9, drainMul: 1.15 },
      { name: "Comète", variant: "red", speedMul: 0.95, grip: 1.0, drainMul: 1.0 },
      { name: "Banshee", variant: "blue", speedMul: 1.0, grip: 1.0, drainMul: 1.0 },
    ],
  },

  /* ---- Race: behind-the-car pseudo-3D view (mounted action "Course") ---- */
  race: {
    time: 70, reward: 110, stat: "raceWin", hitPenalty: 3,
    sprite: "car_back",
    roadside: ["bldg_a", "bldg_b", "palm", "streetlamp"], roadsideScale: 9,
    spriteZoom: 0.05,
    track: { segments: 1100, speed: 1.0, steer: 2.6, centrifugal: 0.65 },
    obstacles: [
      { sprite: "cone", every: 30, phase: 0, scale: 4.2, hw: 0.30, spread: 0.6 },
      { sprite: "car_back", every: 52, phase: 22, scale: 6.5, hw: 0.36, spread: 0.42 },
    ],
    colors: { sky: ["#241a4d", "#5b2a6e", "#e0566e"], sun: ["#ffd36a", "#ff5d7a"], skyline: "#2a1c4a", ground: "#1d1838",
              grass: ["#262046", "#211b3e"], road: ["#3b404c", "#33373f"], rumble: ["#eef2f7", "#ff4d97"], lane: "#e7ecf2", finish: ["#e9edf2", "#1a1330"] },
    icons: { time: "timer", distance: "distance", speed: "speed", quit: "quit", left: "left", right: "right" },
    quitLabel: "Quitter",
    hint: "Touche à gauche ou à droite pour tourner",
    startMessage: "{i:flag} 3… 2… 1… Partez ! Rejoins l'arrivée avant la fin du chrono !",
    hitMessage: "Aïe ! −{n} s",
    winMessage: "{i:trophy} Course gagnée ! +{r}",
    loseMessage: "{i:timer} Temps écoulé ! Réessaie !",
    quitMessage: "{i:flag} Tu quittes la course.",
  },

  /* ---- Roaming bounds for the parked cars (invisible) ---- */
  zones: [{ id: "streets", home: true, rect: { x: 700, y: 1010, w: 1000, h: 180 } }],

  /* ---- Buildings ---- */
  stations: [
    { type: "garage", x: 1200, y: 930, sprite: "garage", scale: 0.85, label: "Garage", labelY: 34, icon: "garage", color: "#ff4d97",
      hint: "Peinture et repos", box: { dx: -110, dy: -70, w: 220, h: 64 },
      action: "menu", actionLabel: "Entrer au garage",
      menu: { title: "{i:garage} Garage", subtitle: "Que veux-tu faire ?",
        items: [
          { label: "Repeindre ta voiture", sub: "Nouvelle couleur — et la police perd ta trace !", icon: "palette", price: 20, do: "restyle", highlight: "chase",
            title: "{i:palette} Atelier peinture", subtitle: "Choisis une couleur pour {name} :", clearsChase: true,
            message: "{i:palette} {name} est repeinte en {v} !", chaseMessage: "{i:palette} Repeinte en {v} — les flics perdent ta trace !",
            noneMessage: "Tu n'as pas encore de voiture." },
          { label: "Dormir", sub: "Passer au jour suivant", icon: "bed", do: "nextDay" },
        ] } },
    { type: "gas", x: 350, y: 880, sprite: "gas", scale: 0.85, label: "Station-service", labelY: 34, icon: "fuel", color: "#ffcf3f",
      hint: "Le plein pour toutes tes voitures", box: { dx: -110, dy: -60, w: 220, h: 56 },
      action: "custom", actionLabel: "Faire le plein (15)",
      onUse: (state, api) => {
        if (!api.spend(15)) return;
        (state.creatures || []).forEach((c) => { c.fuel = 100; });
        api.message("{i:fuel} Plein fait pour toutes tes voitures !");
        api.refreshHud(); api.save();
      } },
    { type: "depot", x: 2060, y: 880, sprite: "depot", scale: 0.85, label: "Dépôt", labelY: 34, icon: "parcel", color: "#6ef0a0",
      hint: "Prendre une livraison", box: { dx: -110, dy: -64, w: 220, h: 60 },
      action: "missions", actionLabel: "Prendre une livraison" },
    { type: "dealer", x: 1200, y: 320, sprite: "dealer", scale: 0.85, label: "Concession", labelY: 34, icon: "dealer", color: "#38e0e6",
      hint: "Des voitures plus rapides", box: { dx: -120, dy: -64, w: 240, h: 60 },
      action: "models", actionLabel: "Voir les voitures" },
  ],

  /* ---- Deliveries (Depot): a destination on the map; "hot" cargo pays more but brings the cops ---- */
  missions: {
    title: "{i:parcel} Bureau des livraisons", subtitle: "Choisis ta course :",
    stat: "jobs", radius: 90, color: "#6ef0a0", marker: "parcel", markerScale: 0.8,
    offers: [
      { label: "Livraison tranquille", sub: "{i:cash} 45 — aucun risque", icon: "parcel", pay: 45 },
      { label: "Cargaison sensible", sub: "{i:cash} 120 — mais la police rôde {i:wanted}{i:wanted}", icon: "wanted", pay: 120, heat: 2 },
    ],
    dests: [
      { x: 560, y: 700, name: "le quartier Ouest" }, { x: 1860, y: 700, name: "le quartier Est" },
      { x: 560, y: 1360, name: "les Docks" }, { x: 1860, y: 1360, name: "la Zone" }, { x: 1200, y: 1380, name: "le Front de mer" },
    ],
    takenMessage: "{i:parcel} En route ! Livre à {d}. Suis la flèche.",
    hotMessage: "{i:wanted} Cargaison sensible ! Les flics arrivent. File livrer à {d} !",
    doneMessage: "{i:check} Livré ! +{p}",
    busyMessage: "{i:parcel} Termine d'abord ta livraison en cours !",
  },

  /* ---- Police: hot jobs raise the wanted level; cruisers chase you ---- */
  chase: {
    sprite: "police", dirSheet: { cols: 2 }, scale: 1.15, originY: 0.62, icon: "wanted", label: "Recherché",
    maxLevel: 3, maxUnits: 3, speed: 232, catchRadius: 70, catchSeconds: 3.6,
    loseRadius: 820, loseAfter: 7, fine: 50, spawnDist: 660,
    escapedMessage: "{i:police} Tu as semé la police !",
    caughtMessage: "{i:police} Arrêté ! −{f} et la livraison est perdue.",
  },

  /* ---- Dealership: better cars (speed / grip / fuel economy) — the money sink + progression ---- */
  models: {
    title: "{i:dealer} Concession auto", subtitle: "Une meilleure voiture : plus rapide en ville ET en course",
    stats: [{ key: "speedMul", icon: "speed" }, { key: "grip", icon: "grip" }, { key: "drainMul", icon: "range", invert: true }],
    items: [
      { id: "cruiser", name: "Le Croiseur", price: 180, variant: "blue", speedMul: 1.15, grip: 1.1, drainMul: 0.9, desc: "Rapide et sobre" },
      { id: "gt", name: "Néon GT", price: 420, variant: "purple", speedMul: 1.35, grip: 1.2, drainMul: 0.85, desc: "Bête de course" },
      { id: "beast", name: "La Bête", price: 850, variant: "red", speedMul: 1.55, grip: 1.35, drainMul: 0.8, desc: "Reine de Neon City" },
    ],
    boughtMessage: "{i:dealer} {name} est à toi ! Va la conduire.",
    fullMessage: "Ton garage est plein !",
  },

  /* ---- Buildings, palms & props (box = collision) ---- */
  scenery: [
    { x: 420, y: 560, sprite: "tower_cyan", scale: 0.9, box: { dx: -96, dy: -120, w: 192, h: 120 } },
    { x: 1980, y: 560, sprite: "tower_pink", scale: 0.9, box: { dx: -96, dy: -120, w: 192, h: 120 } },
    { x: 420, y: 1490, sprite: "shop_block", scale: 0.95, box: { dx: -120, dy: -90, w: 240, h: 90 } },
    { x: 1980, y: 1470, sprite: "tower_cyan", scale: 0.85, box: { dx: -92, dy: -116, w: 184, h: 116 } },
    { x: 1010, y: 640, sprite: "palm", scale: 0.8, anim: "sway", box: { dx: -12, dy: -14, w: 24, h: 16 } },
    { x: 1410, y: 640, sprite: "palm", scale: 0.8, anim: "sway", box: { dx: -12, dy: -14, w: 24, h: 16 } },
    { x: 1200, y: 760, sprite: "billboard", scale: 0.8, box: { dx: -60, dy: -14, w: 120, h: 18 } },
    { x: 1030, y: 820, sprite: "bench", scale: 0.8, box: { dx: -48, dy: -14, w: 96, h: 18 } },
    { x: 1370, y: 820, sprite: "planter", scale: 0.8, box: { dx: -34, dy: -14, w: 68, h: 18 } },
    { x: 700, y: 700, sprite: "palm", scale: 0.85, anim: "sway", box: { dx: -12, dy: -14, w: 24, h: 16 } },
    { x: 1720, y: 700, sprite: "palm", scale: 0.85, anim: "sway", box: { dx: -12, dy: -14, w: 24, h: 16 } },
    { x: 700, y: 1030, sprite: "palm", scale: 0.85, anim: "sway", box: { dx: -12, dy: -14, w: 24, h: 16 } },
    { x: 1720, y: 1030, sprite: "palm", scale: 0.85, anim: "sway", box: { dx: -12, dy: -14, w: 24, h: 16 } },
    { x: 900, y: 300, sprite: "streetlamp", scale: 0.8, glow: "#ffd98a", glowY: 120, box: false },
    { x: 1500, y: 300, sprite: "streetlamp", scale: 0.8, glow: "#ffd98a", glowY: 120, box: false },
    { x: 900, y: 1370, sprite: "streetlamp", scale: 0.8, glow: "#ffd98a", glowY: 120, box: false },
    { x: 1500, y: 1370, sprite: "streetlamp", scale: 0.8, glow: "#ffd98a", glowY: 120, box: false },
    { x: 760, y: 470, sprite: "hydrant", scale: 0.8, box: { dx: -8, dy: -8, w: 16, h: 10 } },
    { x: 1640, y: 1180, sprite: "hydrant", scale: 0.8, box: { dx: -8, dy: -8, w: 16, h: 10 } },
    // stunt ramps on the avenues (no collision — drive over & use "Cascade")
    { x: 1200, y: 470, sprite: "ramp", scale: 0.85, box: false },
    { x: 1200, y: 1180, sprite: "ramp", scale: 0.85, box: false },
  ],

  /* ---- Economy: no free money while sleeping — it all comes from jobs ---- */
  economy: { startCoins: 70, startResources: {}, startCapacity: 12, dayReward: 0 },

  /* ---- Ranks (progression) ---- */
  objectives: {
    extraStats: ["ride", "jump", "jobs", "raceWin", "earned"],
    levels: [
      { name: "Bleu", goals: [
        { id: "drive1", name: "Première virée", desc: "Monte dans une voiture {i:car}", check: (s) => (s.stats.ride || 0) >= 1 },
        { id: "job1", name: "Premier colis", desc: "Réussis une livraison {i:parcel}", check: (s) => (s.stats.jobs || 0) >= 1 },
        { id: "race1", name: "Baptême du feu", desc: "Gagne une course {i:flag}", check: (s) => (s.stats.raceWin || 0) >= 1 },
      ] },
      { name: "Chauffeur", goals: [
        { id: "job5", name: "Livreur", desc: "Fais 5 livraisons {i:parcel}", check: (s) => (s.stats.jobs || 0) >= 5 },
        { id: "earn300", name: "Premiers billets", desc: "Gagne 300 {i:cash} en tout", check: (s) => (s.stats.earned || 0) >= 300 },
        { id: "stunt3", name: "Cascadeur", desc: "Réussis 3 cascades {i:stunt}", check: (s) => (s.stats.jump || 0) >= 3 },
      ] },
      { name: "As du volant", goals: [
        { id: "buy1", name: "Nouvelle caisse", desc: "Achète une voiture à la Concession {i:dealer}", check: (s) => (s.creatures || []).some((c) => c.model) },
        { id: "race3", name: "Pilote confirmé", desc: "Gagne 3 courses {i:flag}", check: (s) => (s.stats.raceWin || 0) >= 3 },
        { id: "job12", name: "Transporteur", desc: "Fais 12 livraisons {i:parcel}", check: (s) => (s.stats.jobs || 0) >= 12 },
      ] },
      { name: "Caïd", goals: [
        { id: "earn1500", name: "Fortune", desc: "Gagne 1500 {i:cash} en tout", check: (s) => (s.stats.earned || 0) >= 1500 },
        { id: "race8", name: "Champion", desc: "Gagne 8 courses {i:flag}", check: (s) => (s.stats.raceWin || 0) >= 8 },
        { id: "beast", name: "Roi de Neon City", desc: "Possède « La Bête » {i:car}", check: (s) => (s.creatures || []).some((c) => c.model === "beast") },
      ] },
    ],
  },

  /* ---- Help ---- */
  help: [
    "<b>Bienvenue à Neon City !</b> Roule, livre, fais la course… et gère la police.",
    "{i:hand} <b>Se déplacer :</b> touche où aller (touche deux fois vite pour courir). {i:car} <b>Conduire :</b> touche une voiture puis « Conduire ».",
    "{i:parcel} <b>Livraisons (Dépôt) :</b> une destination apparaît sur la carte, suis la flèche pour être payé.",
    "{i:wanted} <b>Cargaisons sensibles :</b> elles paient gros mais la police te prend en chasse. Sème-la en roulant vite, ou repeins ta voiture au {i:garage} <b>Garage</b>.",
    "{i:flag} <b>Course :</b> au volant, « Course » : vue derrière la voiture. Touche à gauche ou à droite pour tourner, évite les plots et rejoins l'arrivée avant le chrono.",
    "{i:dealer} <b>Concession :</b> achète des voitures plus rapides ({i:speed} vitesse, {i:grip} tenue, {i:range} autonomie).",
    "{i:fuel} <b>Essence :</b> elle baisse en roulant ; fais le plein à la station-service. {i:stunt} <b>Cascade :</b> saute par-dessus une rampe pour un bonus.",
    "{i:goals} <b>Grades :</b> Bleu → Chauffeur → As du volant → Caïd. Sauvegarde automatique.",
  ],
};
