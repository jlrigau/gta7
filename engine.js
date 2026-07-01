/* =========================================================
   Generic top-down 2D game engine — Phaser 3.
   Data-driven: this file contains NO game-specific content.
   A game is defined entirely by a global `GAME` config object
   (see game.config.js and ENGINE.md for the schema), plus its
   assets. Swap the config + assets to get a different game.
   100% static (browser save). No build step.
   ========================================================= */

"use strict";

// Surface any uncaught error on-screen. A thrown error inside Phaser's update loop
// silently freezes the game (the canvas stops, DOM panels stay) — exactly the kind of
// device-only "it's stuck" report that's invisible without this. Tap the bar to dismiss.
(function () {
  function show(msg) {
    let el = document.getElementById("err-overlay");
    if (!el) {
      el = document.createElement("div"); el.id = "err-overlay";
      el.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:rgba(176,28,40,0.96);color:#fff;font:12px/1.45 ui-monospace,monospace;padding:10px 12px calc(10px + env(safe-area-inset-bottom));white-space:pre-wrap;max-height:45vh;overflow:auto";
      el.addEventListener("click", function () { el.remove(); });
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = "⚠ " + msg + "\n\n(tap to dismiss — please screenshot this)";
  }
  window.addEventListener("error", function (e) {
    show((e.message || "error") + (e.filename ? (" @ " + String(e.filename).split("/").pop() + ":" + e.lineno + ":" + e.colno) : ""));
  });
  window.addEventListener("unhandledrejection", function (e) {
    show("promise rejection: " + ((e.reason && (e.reason.stack || e.reason.message)) || e.reason || "?"));
  });
})();

// The whole game definition lives here (set by game.config.js, loaded first).
const G = window.GAME;
if (!G) throw new Error("engine.js: window.GAME is missing — load game.config.js before engine.js");

// Asset cache-busting version (bump when an IMAGE changes, to force reload).
const ASSET_VER = (G.meta && G.meta.assetVersion) || "v1";
function av(p) { return p + "?v=" + ASSET_VER; }

// iOS ignores user-scalable=no: block pinch-zoom and double-tap zoom here
// (otherwise tapping a button zooms the screen). Double-tap to RUN still works
// (it relies on two pointerdown events, unaffected by this).
["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });

/* ===================== Config shortcuts ===================== */

const META = G.meta || {};
const WORLD = G.world || { width: 2800, height: 2100 };
WORLD.w = WORLD.width; WORLD.h = WORLD.height;            // internal short aliases
const CHARACTERS = G.characters || [];
const CREATURE = G.creature || null;                      // creature system (optional)
const VARIANTS = (CREATURE && CREATURE.variants) || [];
const NEEDS = (CREATURE && CREATURE.needs) || [];
const ACTIONS = (CREATURE && CREATURE.actions) || [];
const DECOR = G.decor || [];
const STATIONS = G.stations || [];
const ZONES = G.zones || [];
const SHOP = G.shop || {};
const ECON = G.economy || {};
const LEVELS = (G.objectives && G.objectives.levels) || [];
const ENV = G.environment || null;
// The "/capacity" suffix on the creature count is only meaningful when the group
// size can actually change (breeding, a spawn station, or a capacity shop). With
// none of those it's a fixed cap the player can't act on, so show the bare count.
// META.showCapacity forces it on/off; otherwise auto-detect.
const CAP_GROWS = !!((CREATURE && CREATURE.breeding && CREATURE.breeding.enabled) ||
  STATIONS.some((s) => s.action === "spawn") || SHOP.capacity);
const SHOW_CAP = META.showCapacity != null ? !!META.showCapacity : CAP_GROWS;
const MOOD_NEED = (CREATURE && CREATURE.moodNeed) || null;
const MOOD_SHAPE = (CREATURE && CREATURE.moodIcon) || "heart";  // particle shape of the mood indicator
const WANT = (CREATURE && CREATURE.wantBubble) || null;         // optional "needs care" bubble (image) replacing the mood shape
const ALL_HAPPY = (CREATURE && CREATURE.allHappy) || null;      // optional day-arc reward when every creature is happy at rest
const RACE = G.race || null;                                    // optional race mini-mode (checkpoints + timer + hazards)
const PLAYER_NAME_Y = (G.player && G.player.nameY != null) ? G.player.nameY : -80;  // y offset of the player's name label (above the head)

// Primary playable zone where creatures roam (first zone flagged home, else first).
const HOME_ZONE = ZONES.find((z) => z.home) || ZONES[0] || null;

/* ===================== Stats / objectives ===================== */

// The set of counters tracked in state.stats: one per action that declares a
// stat id, plus engine-tracked extras (births, decor placed, zone visits).
function statKeys() {
  const keys = new Set();
  ACTIONS.forEach((a) => { if (a.stat) keys.add(a.stat); });
  keys.add("births"); keys.add("decor");
  (G.objectives && G.objectives.extraStats || []).forEach((k) => keys.add(k));
  return [...keys];
}
function freshStats() { const o = {}; statKeys().forEach((k) => (o[k] = 0)); return o; }

function currentLevel() { return LEVELS[Math.min((state.level || 1) - 1, LEVELS.length - 1)]; }
// level = number of fully-completed objective tiers (+1). Always derived from the
// objectives done, so it's robust (recomputed on load and after each objective).
function recalcLevel() {
  let n = 1;
  while (n < LEVELS.length && LEVELS[n - 1].goals.every((o) => state.goalsDone[o.id])) n++;
  state.level = n;
}

/* ===================== State ===================== */

let state = null;
const SAVE_KEY = META.saveKey || "generic-engine-save";

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(l) { return l[randInt(0, l.length - 1)]; }
function clamp01(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function $(id) { return document.getElementById(id); }
// iOS status-bar colour (Safari) = colour of the top of the current screen.
function themeColor(c) { const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", c); }
const TINT_HOME = (META.theme && META.theme.home) || "#ffce8f";
const TINT_PLAY = (META.theme && META.theme.play) || "#b5572b";
function hexInt(hex) { return parseInt(hex.replace("#", ""), 16); }

// Variant id of a creature (with migration of old/unknown values to the first one).
function variantId(c) {
  if (c && VARIANTS.some((v) => v.id === c.variant)) return c.variant;
  return VARIANTS.length ? VARIANTS[0].id : null;
}
function variantDef(id) { return VARIANTS.find((v) => v.id === id) || VARIANTS[0]; }
function charDef(id) { return CHARACTERS.find((p) => p.id === id) || CHARACTERS[0]; }

/* ===================== Creatures ===================== */

let idCounter = 1;
function nameUsed(name, except) {
  const list = (state && state.creatures) || [];
  return list.some((c) => c !== except && (c.name || "").toLowerCase() === name.toLowerCase());
}
function freeName() {
  const pool = (CREATURE && CREATURE.names) || ["One", "Two", "Three"];
  const avail = pool.filter((n) => !nameUsed(n, null));
  if (avail.length) return pick(avail);
  let base = pick(pool), i = 2;
  while (nameUsed(base + " " + i, null)) i++;
  return base + " " + i;
}
function newCreature(o = {}) {
  const c = {
    id: idCounter++,
    name: o.name || freeName(),
    variant: o.variant || (VARIANTS.length ? pick(VARIANTS).id : null),
    age: o.age != null ? o.age : randInt((CREATURE.aging && CREATURE.aging.adultAge) || 5, ((CREATURE.aging && CREATURE.aging.adultAge) || 5) + 4),
    x: 0, y: 0, tx: 0, ty: 0, nextStep: 0, obj: null,
  };
  NEEDS.forEach((n) => { c[n.id] = n.start != null ? n.start : 80; });
  placeInHome(c);
  return c;
}
function placeInHome(c) {
  const z = HOME_ZONE ? HOME_ZONE.rect : { x: 200, y: 200, w: WORLD.w - 400, h: WORLD.h - 400 };
  c.x = randInt(z.x + 80, z.x + z.w - 80);
  c.y = randInt(z.y + 80, z.y + z.h - 80);
  c.tx = c.x; c.ty = c.y;
}
const ADULT_AGE = (CREATURE && CREATURE.aging && CREATURE.aging.adultAge) || 5;
function isYoung(c) { return CREATURE && CREATURE.aging ? c.age < ADULT_AGE : false; }
function needAverage(c) {
  const ids = (CREATURE && CREATURE.moodFrom) || NEEDS.map((n) => n.id);
  return ids.reduce((s, id) => s + (c[id] || 0), 0) / ids.length;
}

/* ===================== Save ===================== */

function save() {
  if (!state) return;
  state.idCounter = idCounter;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state, (k, v) => k === "obj" ? undefined : v)); } catch (e) {}
}
function load() { try { const b = localStorage.getItem(SAVE_KEY); return b ? JSON.parse(b) : null; } catch (e) { return null; } }

/* ===================== Screen flow ===================== */

let pendingPlayer = null, placeNameTmp = META.startName || "My Place";

function init() {
  applyStaticText();
  $("btn-start").addEventListener("click", () => {
    placeNameTmp = $("place-name-input").value.trim() || (META.startName || "My Place");
    openCreate({ avatar: CHARACTERS[0].id }, () => newGame(placeNameTmp, pendingPlayer));
  });
  $("btn-continue").addEventListener("click", continueGame);
  const br = $("btn-refresh"); if (br) br.addEventListener("click", clearCacheAndReload);
  $("place-name-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-start").click(); });
  if (load()) $("home-msg").textContent = META.continueHint || "A saved game exists: tap “Continue”.";

  $("btn-me").addEventListener("click", () => openCreate({ ...state.player }, () => {
    state.player = pendingPlayer; save();
    if (playerSprite) { playerSprite.setTexture(charDef(state.player.avatar).sheet); playerFacing = "down"; playerSprite.setFrame(18); }
    if (playerName) playerName.setText(state.player.name || "");
  }));
  $("btn-help").addEventListener("click", openHelp);
  $("btn-goals").addEventListener("click", openGoals);

  $("btn-close-modal").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

  $("btn-action").addEventListener("click", () => { if (placingDecor) placeDecor(); else interact(activeTarget); });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    if (btn.dataset.creature) creatureAction(btn.dataset.creature);
    else if (btn.dataset.station) interact({ type: btn.dataset.station, station: true });
    else if (btn.dataset.shop) buy(btn.dataset.shop);
    else if (btn.dataset.decor) buyDecor(btn.dataset.decor);
    else if (btn.dataset.place) placeDecor();
    else if (btn.dataset.cancelPlace) cancelPlacement();
  });

  // Close-up mini-scene: scrub/tap spots (pointer works for both mouse & touch).
  const cuStage = $("closeup-stage");
  if (cuStage) {
    cuStage.addEventListener("pointerdown", (e) => {
      if (!closeupOpen || !cuState) return;
      e.preventDefault(); cuState.pressed = true; cuPid = e.pointerId;
      // Capture on the STAGE (a stable element that's never removed) so a continuous
      // scrub keeps working AND the pointer never ends up captured by a spot we delete
      // mid-drag (which on iOS leaves the pointer stuck and freezes later taps).
      try { cuStage.setPointerCapture(e.pointerId); } catch (_) {}
      cuMoveBrush(e); cuRub(e);
    });
    cuStage.addEventListener("pointermove", (e) => { if (!closeupOpen) return; e.preventDefault(); cuMoveBrush(e); if (cuState && cuState.pressed) cuRub(e); });
    const cuRelease = () => { if (cuState) cuState.pressed = false; cuReleaseCapture(); };
    window.addEventListener("pointerup", cuRelease);
    window.addEventListener("pointercancel", cuRelease);
  }
  const cuClose = $("closeup-close");
  if (cuClose) {
    if (G.meta && G.meta.closeLabel) cuClose.setAttribute("aria-label", G.meta.closeLabel);  // localise the generic shell
    cuClose.addEventListener("click", () => closeCloseup());
  }
  window.addEventListener("resize", () => { if (closeupOpen) cuPlaceSpots(); });
  // Never start a text selection / iOS callout from a tap-drag in the game world —
  // a stray selection hijacks subsequent touches (e.g. the player stops responding).
  document.addEventListener("selectstart", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    e.preventDefault();
  });
}

// Inject configured labels/titles into the static HTML shell.
function applyStaticText() {
  const set = (id, txt) => { const el = $(id); if (el != null && txt != null) el.textContent = txt; };
  const setHTML = (id, html) => { const el = $(id); if (el != null && html != null) el.innerHTML = html; };
  document.title = META.title || "Game";
  setHTML("home-title", (META.titleIcon ? META.titleIcon + " " : "") + (META.title || "Game"));
  set("place-icon", META.titleIcon || "");                 // in-game HUD clinic icon (generic shell)
  set("home-tagline", META.tagline || "");
  set("home-name-label", (META.namePrompt && META.namePrompt.label) || "Name your place:");
  const inp = $("place-name-input"); if (inp && META.namePrompt) inp.placeholder = META.namePrompt.placeholder || "";
  set("btn-start", META.startLabel || "▶ New game");
  set("btn-continue", META.continueLabel || "📂 Continue");
  set("app-version", "build " + ASSET_VER);   // visible build tag (helps confirm the cache is fresh)
  set("create-title", META.createTitle || "🎨 Choose your character");
  set("btn-create-ok", META.createOkLabel || "✅ Let's go!");
}

// Dev tool: clear caches and reload with a fresh URL (without touching the save).
async function clearCacheAndReload() {
  try {
    if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
    if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); }
  } catch (e) {}
  const u = new URL(location.href);
  u.searchParams.set("fresh", Date.now());
  location.replace(u.toString());
}

function newGame(name, player) {
  idCounter = 1;
  state = {
    placeName: name, player, coins: ECON.startCoins || 0,
    resources: Object.assign({}, ECON.startResources || {}),
    day: 1, capacity: ECON.startCapacity || 4,
    creatures: [], decors: [], speed: 1, actionsSinceRest: 0, lastBirth: 0,
    stats: freshStats(), goalsDone: {}, level: 1,
  };
  const startN = (CREATURE && CREATURE.startCount) || 0;
  for (let i = 0; i < startN; i++) {
    const seed = (CREATURE.startCreatures && CREATURE.startCreatures[i]) || {};
    state.creatures.push(newCreature(seed));
  }
  save(); startGame();
}

function continueGame() {
  const s = load();
  if (!s) { $("home-msg").textContent = "No saved game."; return; }
  state = s;
  if (!state.player) state.player = { avatar: CHARACTERS[0].id };
  if (!charDef(state.player.avatar) || !CHARACTERS.some((p) => p.id === state.player.avatar)) state.player.avatar = CHARACTERS[0].id;
  if (!state.resources) state.resources = Object.assign({}, ECON.startResources || {});
  if (!state.decors) state.decors = [];
  state.decors = state.decors.filter((d) => d && DECOR.some((x) => x.id === d.id) && typeof d.x === "number");
  if (typeof state.speed !== "number") state.speed = 1;
  if (typeof state.actionsSinceRest !== "number") state.actionsSinceRest = 0;
  if (typeof state.lastBirth !== "number") state.lastBirth = 0;
  if (typeof state.capacity !== "number") state.capacity = ECON.startCapacity || 4;
  state.stats = Object.assign(freshStats(), state.stats || {});
  if (!state.goalsDone) state.goalsDone = {};
  recalcLevel();
  state.creatures = (state.creatures || []).map((c) => {
    const base = newCreature({}); // ensures any new need fields exist with defaults
    const merged = Object.assign(base, c);
    merged.obj = null; merged.nextStep = 0; merged.variant = variantId(merged);
    return merged;
  });
  idCounter = s.idCounter || (state.creatures.length + 1);
  startGame();
}

function startGame() {
  $("screen-home").classList.add("hidden");
  $("screen-create").classList.add("hidden");
  $("screen-game").classList.remove("hidden");
  themeColor(TINT_PLAY);
  $("place-name").textContent = state.placeName;
  buildHud();
  refreshHud();
  startPhaser();
}

/* ===================== HUD / messages ===================== */

// Build the resource bar from config (coins, each resource, day, capacity, level).
function buildHud() {
  const bar = $("hud-resources"); if (!bar) return;
  // The goals button only makes sense when objective levels exist.
  const gb = $("btn-goals"); if (gb) gb.classList.toggle("hidden", !LEVELS.length);
  let html = META.showCoins === false ? ""
    : `<span class="resource" title="Coins">${META.coinIcon || "💰"} <b id="hud-coins">0</b></span>`;
  (SHOP.resources || []).forEach((r) => {
    html += `<span class="resource" title="${r.name}">${r.icon || "📦"} <b id="hud-res-${r.id}">0</b></span>`;
  });
  if (META.showDay !== false) html += `<span class="resource" title="Day">📅 <b id="hud-day">1</b></span>`;
  if (CREATURE && META.showCreatureCount !== false) html += `<span class="resource" title="${CREATURE.label || "creatures"}">${CREATURE.icon || "🐾"} <b id="hud-cap">0/0</b></span>`;
  if (LEVELS.length) html += `<span class="resource" title="Level">⭐ <b id="hud-level">1</b></span>`;
  bar.innerHTML = html;
}

function refreshHud() {
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  if (META.showCoins !== false) set("hud-coins", state.coins);
  (SHOP.resources || []).forEach((r) => set("hud-res-" + r.id, (state.resources[r.id] || 0)));
  set("hud-day", state.day);
  if (CREATURE) set("hud-cap", SHOW_CAP ? state.creatures.length + "/" + state.capacity : String(state.creatures.length));
  checkGoals();
  if (LEVELS.length) set("hud-level", state.level || 1);
  save();
}

// Mark newly-met goals of the current level, notify, recompute level.
function checkGoals() {
  if (!state || !LEVELS.length) return;
  const before = state.level || 1;
  const done = [];
  currentLevel().goals.forEach((o) => {
    if (!state.goalsDone[o.id] && safeCheck(o.check)) { state.goalsDone[o.id] = true; done.push(o); }
  });
  recalcLevel();
  if (done.length) {
    message(done.length === 1 ? `🎯 Goal complete: ${done[0].name}!` : `🎯 ${done.length} goals complete!`);
  }
  if ((state.level || 1) > before) {
    const n = state.level;
    setTimeout(() => message(`⭐ Well done! You reached level ${n}! 🎉`), 1100);
  }
}
function safeCheck(fn) { try { return !!fn(state); } catch (e) { return false; } }

let messageTimer = null;
function message(t) {
  const el = $("game-message");
  el.textContent = t; el.classList.remove("hidden");
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  clearTimeout(messageTimer); messageTimer = setTimeout(() => el.classList.add("hidden"), 2800);
}

/* ===================== Character creation (DOM) ===================== */

function openCreate(player, onValidate) {
  pendingPlayer = player;
  $("screen-home").classList.add("hidden");
  $("screen-game").classList.add("hidden");
  $("screen-create").classList.remove("hidden");
  themeColor(TINT_HOME);
  const previewSrc = (p) => av("assets/ui/" + charDef(p.avatar).thumb + ".png");
  const drawPreview = () => { $("avatar-preview").innerHTML = `<img class="thumb-big" src="${previewSrc(pendingPlayer)}" alt="" />`; };
  drawPreview();

  const cont = $("create-controls");
  cont.innerHTML = `<span class="group-title">${META.namePromptYou || "Your name"}</span>
    <input id="create-name" type="text" maxlength="14" placeholder="${META.namePromptYou || "Your name"}" value="${(pendingPlayer.name || "").replace(/"/g, "&quot;")}" />
    <span class="group-title">${META.avatarPrompt || "Pick your character"}</span><div class="avatar-row" id="grp-avatar"></div>`;
  const ga = $("grp-avatar");
  CHARACTERS.forEach((p) => {
    const b = document.createElement("button");
    b.className = "btn-avatar btn-thumb" + (pendingPlayer.avatar === p.id ? " chosen" : "");
    b.innerHTML = `<img src="${av("assets/ui/" + p.thumb + ".png")}" alt="${p.name}" />`;
    b.title = p.name;
    b.addEventListener("click", () => {
      pendingPlayer.avatar = p.id; ga.querySelectorAll(".btn-avatar").forEach((x) => x.classList.remove("chosen"));
      b.classList.add("chosen"); drawPreview();
    });
    ga.appendChild(b);
  });

  $("btn-create-ok").onclick = () => {
    const n = $("create-name").value.trim();
    pendingPlayer.name = n || pendingPlayer.name || charDef(pendingPlayer.avatar).name;
    onValidate();
    if (state) { $("screen-create").classList.add("hidden"); $("screen-game").classList.remove("hidden"); themeColor(TINT_PLAY); }
  };
}

/* ===================== Phaser ===================== */

let game = null, sc = null;
let player = null, playerSprite = null, playerShadow = null, playerName = null, playerFacing = "down";
let cursors = null, wasd = null;
let moveTarget = null, pendingInteract = null, followCreature = null;
let placingDecor = null, ghostDecor = null, ghostSide = 1;
let nightRunning = false;
let running = false, lastTapT = 0;
let rideFatigueAcc = 0;
let jumpRunning = false;
const jumpAnim = { h: 0 };
let activeTarget = null, panelId = null, mounted = null;
// Sentinel meaning "panel is stale, rebuild on the next refreshInteraction" — distinct
// from a real panel id AND from null (which is a valid id: "nothing selected"). Using
// null to invalidate hid a bug: deselecting to null left the panel showing the old target.
const PANEL_DIRTY = " dirty";
let closeupOpen = false, cuState = null, cuPid = null;   // generic close-up mini-scene
let selRing = null;
let decorObjs = [];
let COLLISIONS = [];
let race = null;                                         // active race (see RACE / startRace)

function startPhaser() {
  if (game) { buildWorld(); return; }
  const worldEl = $("world");
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "world",
    backgroundColor: (G.world && G.world.bg) || "#6fae4f",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE,
      width: worldEl.clientWidth || window.innerWidth,
      height: worldEl.clientHeight || window.innerHeight,
    },
    scene: { preload: scenePreload, create: sceneCreate, update: sceneUpdate },
  });
  const fit = () => { if (game && game.scale) { game.scale.resize(worldEl.clientWidth, worldEl.clientHeight); fitZoom(); } };
  if (window.ResizeObserver) new ResizeObserver(fit).observe(worldEl);
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", () => setTimeout(fit, 200));
}

function fitZoom() {
  if (!sc) return;
  const cam = G.camera || {};
  const w = sc.scale.width, h = sc.scale.height;
  const z = clamp(Math.min(w / (cam.fitW || 780), h / (cam.fitH || 820)), cam.min || 0.5, cam.max || 0.9);
  sc.cameras.main.setZoom(z);
}

/* ===================== Asset loading ===================== */

function scenePreload() {
  const imgs = (G.assets && G.assets.images) || {};
  Object.keys(imgs).forEach((k) => this.load.image(k, av(imgs[k])));
  const sheets = (G.assets && G.assets.sheets) || {};
  Object.keys(sheets).forEach((k) => {
    const s = sheets[k];
    this.load.spritesheet(k, av(s.path), { frameWidth: s.frameWidth, frameHeight: s.frameHeight });
  });
}

// Animations: player walk (4 directions) and creature side-walk.
const DIRS = { up: 0, left: 1, down: 2, right: 3 }; // LPC walkcycle rows (9 frames/row)
function buildAnims() {
  CHARACTERS.forEach((p) => {
    Object.entries(DIRS).forEach(([dir, row]) => {
      const key = `${p.sheet}-${dir}`;
      if (!sc.anims.exists(key)) sc.anims.create({
        key, frames: sc.anims.generateFrameNumbers(p.sheet, { start: row * 9 + 1, end: row * 9 + 8 }),
        frameRate: 10, repeat: -1,
      });
    });
  });
  if (CREATURE) {
    const w = CREATURE.walk || { start: 0, end: 3, frameRate: 6 };
    // One walk anim per distinct sheet (base + any variant with its own sheet), so
    // variants that ship a dedicated spritesheet animate instead of snapping back
    // to the base sheet's frames.
    const sheets = new Set([CREATURE.sheet]);
    VARIANTS.forEach((v) => { if (v.sheet) sheets.add(v.sheet); });
    sheets.forEach((sheet) => {
      const key = "creature-walk-" + sheet;
      if (!sc.anims.exists(key)) sc.anims.create({
        key, frames: sc.anims.generateFrameNumbers(sheet, { start: w.start, end: w.end }),
        frameRate: w.frameRate || 6, repeat: -1,
      });
    });
  }
  // Race pedestrian walk (side-walk sheet), if a race with pedestrians is configured.
  const ped = RACE && RACE.hazards && RACE.hazards.pedestrianSheet;
  if (ped && !sc.anims.exists("race-ped-walk")) {
    sc.anims.create({ key: "race-ped-walk", frames: sc.anims.generateFrameNumbers(ped, { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
  }
}

/* ===================== Fences & zones ===================== */

// Picket fence around a rectangle, with a gate. opts.gates = "both" | "left" | "right".
function fenceRect(r, opts = {}) {
  const s = 32, x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
  const gA = y0 + r.h * (opts.gateA || 0.4), gB = y0 + r.h * (opts.gateB || 0.6);
  const fr = (G.fence && G.fence.frames) || { post: 1, side: 17, cornerTL: 32, cornerTR: 34 };
  const sheet = (G.fence && G.fence.sheet) || "fence";
  const add = (x, y, frame, flipY) => { const o = sc.add.image(x, y, sheet, frame).setOrigin(0.5, 0.7).setDepth(y); if (flipY) o.setFlipY(true); };
  for (let x = x0 + s; x < x1; x += s) { add(x, y0, fr.post, false); add(x, y1, fr.post, false); }
  const gates = opts.gates || "left";
  for (let y = y0 + s; y < y1; y += s) {
    const inGate = (y > gA && y < gB);
    const leftOpen = (gates === "both" || gates === "left") && inGate;
    const rightOpen = (gates === "both" || gates === "right") && inGate;
    if (!leftOpen) add(x0, y, fr.side, false);
    if (!rightOpen) add(x1, y, fr.side, false);
  }
  add(x0, y0, fr.cornerTL, false); add(x1, y0, fr.cornerTR, false);
  add(x0, y1, fr.cornerTL, true); add(x1, y1, fr.cornerTR, true);
  // collision walls (with the gate opening(s) left clear)
  const t = 14;
  COLLISIONS.push({ x: x0, y: y0 - t / 2, w: r.w, h: t }, { x: x0, y: y1 - t / 2, w: r.w, h: t });
  const leftHasGate = gates === "both" || gates === "left";
  const rightHasGate = gates === "both" || gates === "right";
  if (leftHasGate) COLLISIONS.push({ x: x0 - t / 2, y: y0, w: t, h: gA - y0 }, { x: x0 - t / 2, y: gB, w: t, h: y1 - gB });
  else COLLISIONS.push({ x: x0 - t / 2, y: y0, w: t, h: r.h });
  if (rightHasGate) COLLISIONS.push({ x: x1 - t / 2, y: y0, w: t, h: gA - y0 }, { x: x1 - t / 2, y: gB, w: t, h: y1 - gB });
  else COLLISIONS.push({ x: x1 - t / 2, y: y0, w: t, h: r.h });
}

function worldLabel(x, y, txt, depth) {
  sc.add.text(x, y, txt, { fontSize: "24px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(depth);
}

/* ===================== Environment (forest band + trail loop) ===================== */

let LOOP_SEG = [], OPENINGS = [], PATHS = [], LOGS = [], BAND = 0, PW = 0, SAND = 0;

function computeEnvironment() {
  LOOP_SEG = []; OPENINGS = []; PATHS = []; LOGS = []; BAND = 0; PW = 0; SAND = 0;
  if (!ENV || !ENV.path) return;
  const p = ENV.path;
  BAND = ENV.band || 440; PW = p.width || 240; SAND = p.sand || 46;
  const inset = p.inset || 90;
  LOOP_SEG = [
    { x: inset, y: inset, w: WORLD.w - 2 * inset, h: PW },
    { x: inset, y: WORLD.h - inset - PW, w: WORLD.w - 2 * inset, h: PW },
    { x: inset, y: inset, w: PW, h: WORLD.h - 2 * inset },
    { x: WORLD.w - inset - PW, y: inset, w: PW, h: WORLD.h - 2 * inset },
  ];
  OPENINGS = (p.openings || []).map((o) => ({ x: o.x, y: o.y, w: o.w, h: o.h }));
  PATHS = LOOP_SEG.concat(OPENINGS);
  // jumpable logs across the horizontal sides
  if (p.logs && p.logs.xs) {
    const dec = p.logs.dec || 14;
    LOGS = [
      ...p.logs.xs.map((x) => ({ x, y: inset + PW / 2 - dec })),
      ...p.logs.xs.map((x) => ({ x, y: WORLD.h - inset - PW / 2 - dec })),
    ];
  }
}

function inBand(x, y) { return x < BAND || x > WORLD.w - BAND || y < BAND || y > WORLD.h - BAND; }
function onPath(x, y, m) { return PATHS.some((s) => x > s.x - m && x < s.x + s.w + m && y > s.y - m && y < s.y + s.h + m); }
function nearStation(x, y) { return STATIONS.some((s) => Math.abs(x - s.x) < 120 && Math.abs(y - s.y) < 160); }
function inProtectedZone(x, y) {
  const within = (r) => x > r.x - 24 && x < r.x + r.w + 24 && y > r.y - 24 && y < r.y + r.h + 24;
  if (HOME_ZONE && within(HOME_ZONE.rect)) return true;
  if (ENV && ENV.arena && within(ENV.arena.rect)) return true;
  return false;
}

function buildEnvironment() {
  if (!ENV) return;
  // --- Arena (fenced obstacle area) ---
  if (ENV.arena) {
    const a = ENV.arena;
    if (a.tile) sc.add.tileSprite(a.rect.x, a.rect.y, a.rect.w, a.rect.h, a.tile).setOrigin(0, 0).setDepth(-19);
    if (a.label) worldLabel(a.rect.x + a.rect.w / 2, a.rect.y - 36, a.label, 99990);
    if (a.fence) fenceRect(a.rect, { gates: "left" });
    (a.obstacles || []).forEach((h) => {
      sc.add.image(h.x, h.y, a.obstacleSprite).setOrigin(0.5, 0.92).setScale(a.obstacleScale || 1).setDepth(h.y);
      const b = a.obstacleBox || { dx: -33, dy: -18, w: 66, h: 30 };
      COLLISIONS.push({ x: h.x + b.dx, y: h.y + b.dy, w: b.w, h: b.h, jumpable: true });
    });
  }
  // --- Trail loop (sand path around the map, inside a forest band) ---
  if (ENV.path) {
    const p = ENV.path, tile = p.tile || "dirt";
    PATHS.forEach((s) => sc.add.tileSprite(s.x - SAND, s.y - SAND, s.w + 2 * SAND, s.h + 2 * SAND, tile).setOrigin(0, 0).setDepth(-19));
    if (p.label) worldLabel(WORLD.w / 2, p.labelY || 300, p.label, 99990);
    // Vegetation by a SINGLE declarative rule → continuous & identical everywhere,
    // openings and corners handled automatically (cells "on the path" stay empty).
    const f = ENV.forest || {};
    const step = f.step || 44, tree = f.tree || "tree", bush = f.bush || "bush";
    const hedgeM = f.hedgeMargin || 80;
    for (let gy = 24; gy <= WORLD.h; gy += step) {
      for (let gx = 24; gx <= WORLD.w; gx += step) {
        if (!inBand(gx, gy) || nearStation(gx, gy) || inProtectedZone(gx, gy)) continue;
        if (onPath(gx, gy, 6)) continue;                      // keep the path clear
        const x = gx + randInt(-7, 7), y = gy + randInt(-6, 6);
        if (onPath(gx, gy, hedgeM)) {                          // path edge → low hedge (bush)
          sc.add.image(x, y, bush).setOrigin(0.5, 0.9).setScale(randInt(11, 14) / 10).setDepth(y);
          COLLISIONS.push({ x: x - 22, y: y - 10, w: 44, h: 14 });
        } else {                                               // farther → forest (trees, no tight collision)
          sc.add.image(x, y, tree).setOrigin(0.5, 0.95).setScale(randInt(15, 19) / 10).setDepth(y);
        }
      }
    }
    // decorative forest just beyond the world edges (no gaps at the border) — no collision
    const M = 260;
    for (let gy = -M; gy <= WORLD.h + M; gy += 90) {
      for (let gx = -M; gx <= WORLD.w + M; gx += 90) {
        if (gx > -10 && gx < WORLD.w + 10 && gy > -10 && gy < WORLD.h + 10) continue;
        const x = gx + randInt(-13, 13), y = gy + randInt(-13, 13);
        sc.add.image(x, y, (gx + gy) % 4 === 0 ? bush : tree).setOrigin(0.5, 0.95).setScale(randInt(15, 19) / 10).setDepth(y);
      }
    }
    // jumpable logs across the horizontal sides — centred on the visible path
    if (p.logs) {
      const sprite = p.logs.sprite || "logs", scale = p.logs.scale || 1.3;
      LOGS.forEach((r) => {
        sc.add.image(r.x, r.y, sprite).setOrigin(0.5, 0.5).setScale(scale).setDepth(r.y + 30);
        COLLISIONS.push({ x: r.x - 22, y: r.y - 50, w: 44, h: 100, jumpable: true });
      });
    }
  }
}

// Fixed interior scenery: [x, y, sprite, scale, collision?] where collision is a
// box {dx,dy,w,h}, or false for none, or omitted for a default base footprint.
function buildScenery() {
  (G.scenery || []).forEach(([x, y, sprite, scale, box]) => {
    sc.add.image(x, y, sprite).setOrigin(0.5, 0.95).setScale(scale).setDepth(y);
    if (box === false) return;
    if (box) COLLISIONS.push({ x: x + box.dx, y: y + box.dy, w: box.w, h: box.h });
    else COLLISIONS.push({ x: x - 16 * scale, y: y - 16, w: 32 * scale, h: 20 });
  });
}

// Block the player from crossing obstacles (fence, trees, buildings) — per-axis AABB.
function blockObstacles() {
  const hw = mounted ? 30 : 15, hh = mounted ? 18 : 10, px = player.x, py = player.y;
  COLLISIONS.forEach((m) => {
    if (px + hw > m.x && px - hw < m.x + m.w && py + hh > m.y && py - hh < m.y + m.h) {
      const penX = Math.min(px + hw - m.x, m.x + m.w - (px - hw));
      const penY = Math.min(py + hh - m.y, m.y + m.h - (py - hh));
      if (penX < penY) player.x += (player.x < m.x + m.w / 2 ? -penX : penX);
      else player.y += (player.y < m.y + m.h / 2 ? -penY : penY);
    }
  });
}

function sceneCreate() {
  sc = this;
  computeEnvironment();
  this.cameras.main.setBounds(-700, -700, WORLD.w + 1400, WORLD.h + 1400);
  this.cameras.main.setBackgroundColor((G.world && G.world.bg) || "#6fae4f");
  buildAnims();
  buildWorld();
  cursors = this.input.keyboard.createCursorKeys();
  // Support both QWERTY (WASD) and AZERTY (ZQSD) without capturing keys from inputs.
  wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D", up2: "Z", left2: "Q" }, false);
  this.input.keyboard.clearCaptures();
  hookInputFocus();
  this.input.on("pointerdown", (p) => onPointer(p));
}

// Disable the Phaser keyboard while a text <input>/<textarea> is focused.
let focusHooked = false;
function hookInputFocus() {
  if (focusHooked) return;
  focusHooked = true;
  const isField = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
  document.addEventListener("focusin", (e) => {
    if (isField(e.target) && sc && sc.input && sc.input.keyboard) { sc.input.keyboard.enabled = false; sc.input.keyboard.resetKeys(); }
  });
  document.addEventListener("focusout", (e) => {
    if (isField(e.target) && sc && sc.input && sc.input.keyboard) sc.input.keyboard.enabled = true;
  });
}

function buildWorld() {
  sc.children.removeAll();
  decorObjs = [];
  COLLISIONS = [];
  placingDecor = null; ghostDecor = null; jumpRunning = false;
  if (race) { raceHudHide(); race = null; }   // a world rebuild invalidates race objects

  // Ground: tiled, extending beyond the world so no gaps show at the edges.
  const ground = (G.world && G.world.groundTile) || "grass";
  sc.add.tileSprite(-700, -700, WORLD.w + 1400, WORLD.h + 1400, ground).setOrigin(0, 0).setDepth(-20);

  // Configured ground patches (paths in front of buildings, etc.).
  (G.world && G.world.patches || []).forEach((q) => {
    sc.add.tileSprite(q.x, q.y, q.w, q.h, q.tile || "dirt").setOrigin(q.ox != null ? q.ox : 0, q.oy != null ? q.oy : 0).setDepth(-19);
  });

  // Zones (e.g. the pen): tinted ground + fence + label.
  ZONES.forEach((z) => {
    const r = z.rect;
    if (z.tint) {
      const g = sc.add.graphics();
      g.fillStyle(hexInt(z.tint), z.tintAlpha != null ? z.tintAlpha : 0.55);
      g.fillRoundedRect(r.x, r.y, r.w, r.h, 18); g.setDepth(-18);
    }
    if (z.fence) fenceRect(r, { gates: z.gates || "both", gateA: z.gateA, gateB: z.gateB });
    if (z.label) worldLabel(r.x + r.w / 2, r.y - 14, z.label, 99990);
  });

  buildEnvironment();
  buildScenery();

  // Buildings (+ base collision footprint).
  STATIONS.forEach((s) => {
    const b = sc.add.image(s.x, s.y, s.sprite).setOrigin(0.5, 0.88).setScale(s.scale || 1.2).setDepth(s.y);
    sc.add.text(s.x, s.y + 28, s.label, { fontSize: "22px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 5 }).setOrigin(0.5).setDepth(99990);
    s.obj = b;
    const box = s.box || { dx: -70, dy: -60, w: 140, h: 75 };
    COLLISIONS.push({ x: s.x + box.dx, y: s.y + box.dy, w: box.w, h: box.h });
  });

  buildDecors();
  // clear any transient mid-action flags from a save taken during a cure/celebration,
  // so a reloaded creature can never get stranded (unselectable / never departs).
  state.creatures.forEach((c) => { c.departing = false; c.celebrating = false; c.leaving = false; });
  state.creatures.forEach(buildCreatureObj);

  // Player
  playerShadow = sc.add.ellipse(0, 0, 30, 11, 0x000000, 0.25);
  const sheet = charDef(state.player.avatar).sheet;
  playerSprite = sc.add.sprite(0, 0, sheet, 18).setOrigin(0.5, 0.97).setScale((G.player && G.player.scale) || 1.7);
  playerFacing = "down";
  playerName = sc.add.text(0, PLAYER_NAME_Y, state.player.name || "", { fontSize: "15px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 4 }).setOrigin(0.5);
  const sp = (G.player && G.player.spawn) || (HOME_ZONE ? { x: HOME_ZONE.rect.x - 240, y: HOME_ZONE.rect.y + HOME_ZONE.rect.h * 0.5 } : { x: 560, y: 700 });
  player = sc.add.container(sp.x, sp.y, [playerShadow, playerSprite, playerName]);
  player.setSize(40, 40);
  mounted = null;

  selRing = sc.add.ellipse(0, 0, 90, 50, 0xffd54a, 0);
  selRing.setStrokeStyle(4, 0xffd54a, 1); selRing.setVisible(false); selRing.setDepth(2);

  sc.cameras.main.startFollow(player, true, 0.5, 0.5);
  fitZoom();
}

/* ===================== Creature objects ===================== */

function creatureScale(c) {
  if (!CREATURE.aging) return CREATURE.scale || 1;
  if (!isYoung(c)) return CREATURE.aging.scaleAdult || 2.0;
  const t = clamp(c.age / ADULT_AGE, 0, 1);
  const a = CREATURE.aging.scaleBaby || 1.15, b = CREATURE.aging.scaleAdult || 2.0;
  return a + (b - a) * t;
}
function heartY(c) { return -(61 * creatureScale(c) + 14); }

function applyVariantTint(sprite, c) {
  const v = variantDef(variantId(c));
  if (v && v.tint != null) sprite.setTint(typeof v.tint === "string" ? hexInt(v.tint) : v.tint);
  else sprite.clearTint();
}
function creatureTexture(c) {
  // variant may specify its own sheet; otherwise base sheet + tint
  const v = variantDef(variantId(c));
  return (v && v.sheet) ? v.sheet : CREATURE.sheet;
}
function creatureWalkKey(c) { return "creature-walk-" + creatureTexture(c); }

function buildCreatureObj(c) {
  const scale = creatureScale(c);
  const orig = CREATURE.origin || { x: 0.5, y: 0.85 };
  const shadow = sc.add.ellipse(0, 0, 58, 16, 0x000000, 0.25).setScale(scale);
  const body = sc.add.sprite(0, 0, creatureTexture(c)).setOrigin(orig.x, orig.y).setScale(scale);
  body.play(creatureWalkKey(c));
  applyVariantTint(body, c);
  // WANT replaces the mood shape, UNLESS wantBubble.withMood: then both coexist
  // (mood shape stays as the always-on colour gauge, want bubble pops in above it).
  const wantOnly = WANT && !WANT.withMood;
  const heart = wantOnly
    ? sc.add.image(0, heartY(c) - (WANT.lift || 6), WANT.sprite).setOrigin(0.5, 1).setScale(WANT.scale || 1).setVisible(!WANT.intermittent)
    : sc.add.image(0, heartY(c), ensureShape(MOOD_SHAPE)).setOrigin(0.5).setScale(0.95).setTint(0x6fcf5f);
  const kids = [shadow, body, heart];
  let wantT = null;
  if (WANT && WANT.withMood) {
    wantT = sc.add.image(0, heartY(c) - (WANT.lift || 22), WANT.sprite).setOrigin(0.5, 1).setScale(WANT.scale || 1).setVisible(false);
    kids.push(wantT);
  }
  const nameT = sc.add.text(0, 22, c.name, { fontSize: "16px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#3a2716", strokeThickness: 4 }).setOrigin(0.5);
  kids.push(nameT);
  const cont = sc.add.container(c.x, c.y, kids);
  c.obj = cont; c.bodyT = body; c.heartT = heart; c.wantT = wantT; c.nameT = nameT; c.shadowT = shadow;
}

function refreshCreatureVisual(c) {
  if (!c.obj) return;
  const scale = creatureScale(c);
  c.bodyT.setTexture(creatureTexture(c));
  c.bodyT.play(creatureWalkKey(c));
  applyVariantTint(c.bodyT, c);
  c.bodyT.setScale(scale);
  if (c.shadowT) c.shadowT.setScale(scale);
  c.heartT.y = heartY(c) - ((WANT && !WANT.withMood) ? (WANT.lift || 6) : 0);
  if (c.wantT) c.wantT.y = heartY(c) - (WANT.lift || 22);
  c.nameT.setText(c.name);
}

function buildDecors() {
  decorObjs.forEach((o) => o.destroy()); decorObjs = [];
  COLLISIONS = COLLISIONS.filter((m) => !m.deco);
  state.decors.forEach((it) => {
    const d = DECOR.find((x) => x.id === it.id);
    if (!d) return;
    const o = sc.add.image(it.x, it.y, d.sprite).setOrigin(0.5, 0.95).setScale(d.scale || 1.2).setDepth(it.y);
    decorObjs.push(o);
    if (d.collision) {
      const b = d.collision;
      COLLISIONS.push({ x: it.x + (b.dx || 0), y: it.y + (b.dy || 0), w: b.w, h: b.h, deco: true });
    }
  });
}

// Animate the player by direction (or idle pose facing the last direction).
function animatePlayer(mvx, mvy) {
  if (!playerSprite) return;
  const sheet = charDef(state.player.avatar).sheet;
  if (mounted) {
    if (mvx) playerFacing = mvx < 0 ? "left" : "right";
    else if (playerFacing !== "left" && playerFacing !== "right") playerFacing = "right";
    playerSprite.anims.stop();
    playerSprite.setFrame(DIRS[playerFacing] * 9);
    return;
  }
  if (mvx || mvy) {
    const dir = Math.abs(mvx) > Math.abs(mvy) ? (mvx < 0 ? "left" : "right") : (mvy < 0 ? "up" : "down");
    playerFacing = dir;
    const ak = `${sheet}-${dir}`;
    const cur = playerSprite.anims.currentAnim;
    if (!playerSprite.anims.isPlaying || !cur || cur.key !== ak) playerSprite.play(ak, true);
  } else {
    playerSprite.anims.stop();
    playerSprite.setFrame(DIRS[playerFacing] * 9);
  }
}

/* ===================== Loop ===================== */

function sceneUpdate(time, delta) {
  if (!player) return;
  const dt = Math.min(delta / 1000, 0.05);
  const modalOpen = !$("modal").classList.contains("hidden") || nightRunning || closeupOpen;

  let vx = 0, vy = 0;
  if (!modalOpen) {
    if (cursors.left.isDown || wasd.left.isDown || wasd.left2.isDown) vx -= 1;
    if (cursors.right.isDown || wasd.right.isDown) vx += 1;
    if (cursors.up.isDown || wasd.up.isDown || wasd.up2.isDown) vy -= 1;
    if (cursors.down.isDown || wasd.down.isDown) vy += 1;
  }

  if (vx || vy) followCreature = null;
  if (followCreature && !mounted && !modalOpen) {
    const c = followCreature, dx = player.x - c.x, dy = player.y - c.y, d = Math.hypot(dx, dy) || 1;
    if (d < 92) { followCreature = null; moveTarget = null; }
    else moveTarget = { x: c.x + (dx / d) * 72, y: c.y + (dy / d) * 72 };
  }

  const RIDE = CREATURE && CREATURE.ride;
  let mvx = 0, mvy = 0;
  if (!jumpRunning) {
    const sp = (G.player && G.player.speed) || { walk: 200, run: 370, rideWalk: 340, rideRun: 560 };
    const spd = mounted ? (running ? sp.rideRun : sp.rideWalk) : (running ? sp.run : sp.walk);
    if (vx || vy) {
      moveTarget = null; pendingInteract = null; running = false;
      const n = Math.hypot(vx, vy); mvx = vx / n; mvy = vy / n;
    } else if (moveTarget && !modalOpen) {
      const dx = moveTarget.x - player.x, dy = moveTarget.y - player.y, d = Math.hypot(dx, dy);
      if (d < 8) { moveTarget = null; running = false; if (pendingInteract) { const r = pendingInteract; pendingInteract = null; interact(r); } }
      else { mvx = dx / d; mvy = dy / d; }
    }
    if (mvx || mvy) { player.x += mvx * spd * dt; player.y += mvy * spd * dt; }
    animatePlayer(mvx, mvy);
    player.x = clamp(player.x, 40, WORLD.w - 40);
    player.y = clamp(player.y, 40, WORLD.h - 40);
    blockObstacles();
  } else {
    animatePlayer(0, 0);
  }
  player.setDepth(player.y);

  // Decor placement: ghost stays beside the player, red if the spot is forbidden.
  if (placingDecor && ghostDecor) {
    if (playerFacing === "left") ghostSide = -1; else if (playerFacing === "right") ghostSide = 1;
    const g = ghostXY();
    ghostDecor.x = g.x; ghostDecor.y = g.y; ghostDecor.setDepth(g.y + 0.5);
    if (placementError(placingDecor, g.x, g.y)) ghostDecor.setTint(0xff5555); else ghostDecor.clearTint();
  }

  // Riding: the creature is on the ground under the player, who sits on its back.
  if (mounted && RIDE) {
    const arc = jumpAnim.h * 70;
    mounted.obj.x = player.x; mounted.obj.y = player.y - arc; mounted.x = player.x; mounted.y = player.y;
    mounted.obj.setDepth(player.y - 1);
    mounted.bodyT.setFlipX(playerFacing === "right");
    playerSprite.y = (RIDE.sitY || -58) - arc; playerShadow.setVisible(false);
    if (playerName) playerName.y = (RIDE.nameY || -138) - arc;
    if (RIDE.fatigueNeed) {
      const rate = (mvx || mvy) ? (running ? 2.4 : 1.1) : 0.3;
      rideFatigueAcc += rate * dt;
      if (rideFatigueAcc >= 1) {
        const dn = Math.floor(rideFatigueAcc); rideFatigueAcc -= dn;
        mounted[RIDE.fatigueNeed] = clamp01(mounted[RIDE.fatigueNeed] - dn);
        if (mounted[RIDE.fatigueNeed] <= 0) dismount(mounted, true);
      }
    }
  } else if (!mounted) {
    if (playerSprite.y !== 0) { playerSprite.y = 0; playerShadow.setVisible(true); }
    if (playerName && playerName.y !== PLAYER_NAME_Y) playerName.y = PLAYER_NAME_Y;
  }

  if (race) raceTick(dt, time);

  // Trail-visit stat (marked once when the player steps onto the path).
  if (state.stats && PATHS.length && !state.stats.trailVisit && player && onPath(player.x, player.y, 0)) {
    if (statKeys().includes("trailVisit")) { state.stats.trailVisit = 1; refreshHud(); }
  }

  // creature wandering + mood
  const now = time;
  const departed = [];
  state.creatures.forEach((c) => {
    if (!c.obj) return;
    if (c.departing) {                                    // cured → walk OUT of the room, then fade out
      const dp = (CREATURE && CREATURE.depart) || {};
      const sp = dp.speed || 110;
      const dx = c.exitX - c.x, dy = c.exitY - c.y, d = Math.hypot(dx, dy) || 1;
      if (d > 6) { c.x += (dx / d) * sp * dt; c.y += (dy / d) * sp * dt; if (c.bodyT) c.bodyT.setFlipX(dx > 0); }
      c.obj.x = c.x; c.obj.y = c.y; c.obj.setDepth(c.y);
      c.departT = (c.departT || 0) + dt;
      // don't start fading until the child has actually walked out of the clinic (home zone),
      // so they never vanish mid-room; once outside they fade quickly and are removed.
      if (leftHome(c)) c.obj.alpha = Math.max(0, c.obj.alpha - dt * 1.6);
      if (d < 10 || c.obj.alpha <= 0.03 || c.departT > 10) departed.push(c);
      return;
    }
    if (c !== mounted) {
      if (c.celebrating) {
        c.obj.x = c.x; c.obj.y = c.y; c.obj.setDepth(c.y);
      } else if (distPlayer(c.x, c.y) < 115) {
        c.nextStep = now + 800;
        c.bodyT.setFlipX(player.x > c.x);
        c.obj.x = c.x; c.obj.y = c.y; c.obj.setDepth(c.y);
      } else {
        if (now > c.nextStep) {
          const z = HOME_ZONE ? HOME_ZONE.rect : { x: 60, y: 60, w: WORLD.w - 120, h: WORLD.h - 120 };
          c.tx = randInt(z.x + 70, z.x + z.w - 70);
          c.ty = randInt(z.y + 70, z.y + z.h - 70);
          c.nextStep = now + randInt(2500, 6000);
        }
        const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
        if (d > 3) { c.x += (dx / d) * 40 * dt; c.y += (dy / d) * 40 * dt; c.bodyT.setFlipX(dx > 0); }
        c.obj.x = c.x; c.obj.y = c.y; c.obj.setDepth(c.y);
      }
    } else {
      c.bodyT.setFlipX(playerFacing === "right");
    }
    if (WANT) {
      // a "needs care" bubble: shown while the creature still wants the treatment, hidden once cured / leaving.
      // withMood → the bubble lives in its own slot (c.wantT) and the mood shape (c.heartT) stays on as a gauge.
      const wt = WANT.withMood ? c.wantT : c.heartT;
      const nv = WANT.need ? (c[WANT.need] || 0) : needAverage(c);
      const wants = wt && nv < (WANT.below != null ? WANT.below : 100) && !c.departing && !c.celebrating;
      const lift = WANT.lift || (WANT.withMood ? 22 : 6), base = WANT.scale || 1;
      if (wt) {
        if (!wants) {
          wt.setVisible(false); c.wantUntil = null;             // cured/leaving → no bubble
        } else if (WANT.intermittent) {
          // pop up for a moment, then hide for a random gap (desynced per creature) — they "pipe up" now and then
          if (c.wantUntil == null) {                            // first eligibility: stay quiet a random while
            c.wantPhase = "hide"; c.wantUntil = now + randInt(300, (WANT.hideMax || 9) * 1000);
          }
          if (now >= c.wantUntil) {
            if (c.wantPhase === "show") { c.wantPhase = "hide"; c.wantUntil = now + randInt((WANT.hideMin || 5) * 1000, (WANT.hideMax || 11) * 1000); }
            else { c.wantPhase = "show"; c.wantShownAt = now; c.wantUntil = now + (WANT.showFor || 2.5) * 1000; }
          }
          const showing = c.wantPhase === "show";
          wt.setVisible(showing);
          if (showing) {
            const e = Math.min(1, (now - c.wantShownAt) / 180); // quick pop-in
            wt.setScale(base * (0.55 + 0.45 * e * (2 - e)));
            wt.y = heartY(c) - lift + Math.sin(now / 300 + c.x) * 3;
          }
        } else {
          wt.setVisible(true);
          wt.y = heartY(c) - lift + Math.sin(now / 320 + c.x) * 3;  // gentle bob
        }
      }
      if (WANT.withMood) {                                       // mood shape keeps its colour gauge alongside the bubble
        const m = needAverage(c);
        c.heartT.setTint(m > 60 ? 0x6fcf5f : m > 35 ? 0xf4b942 : 0xe05656);
      }
    } else {
      const m = needAverage(c);
      c.heartT.setTint(m > 60 ? 0x6fcf5f : m > 35 ? 0xf4b942 : 0xe05656);
    }
  });
  if (departed.length) {
    departed.forEach(removeCreature);
    refreshHud(); panelId = PANEL_DIRTY;
    const dp = CREATURE && CREATURE.depart;
    if (dp && dp.emptyMessage && !state.creatures.some((c) => !c.departing)) message(dp.emptyMessage);
  }

  refreshInteraction();
}

// True once a departing creature has crossed outside the home zone (so fading can begin).
function leftHome(c) {
  const z = HOME_ZONE && HOME_ZONE.rect;
  if (!z) return (c.departT || 0) > 0.4;
  const m = 8;
  return c.x < z.x - m || c.x > z.x + z.w + m || c.y < z.y - m || c.y > z.y + z.h + m;
}
// A cured creature walks off to an exit and is removed (generic; see creature.depart).
function departCreature(c) {
  if (!CREATURE || !CREATURE.depart || c.departing) return;
  const to = CREATURE.depart.to || { x: (G.player && G.player.spawn && G.player.spawn.x) || c.x, y: WORLD.h + 80 };
  c.departing = true; c.departT = 0; c.exitX = to.x; c.exitY = to.y;
  if (c === activeTarget) { activeTarget = null; panelId = PANEL_DIRTY; }
}
function removeCreature(c) {
  if (c.obj) { c.obj.destroy(); c.obj = null; }
  const i = state.creatures.indexOf(c);
  if (i >= 0) state.creatures.splice(i, 1);
  save();
}

// A station with action "spawn" brings a random number of fresh creatures (up to a cap).
function spawnCreatures(st) {
  const sp = st.spawn || {};
  const cap = sp.cap || 8;
  const active = state.creatures.filter((c) => !c.departing).length;
  const room = cap - active;
  if (room <= 0) { message(sp.fullMessage || "Full!"); return; }
  const n = Math.min(randInt(sp.min || 1, sp.max || 3), room);
  for (let i = 0; i < n; i++) {
    const c = newCreature({});
    state.creatures.push(c);
    if (sc) {
      buildCreatureObj(c);
      if (c.obj) { c.obj.alpha = 0; sc.tweens.add({ targets: c.obj, alpha: 1, duration: 350 }); }
      actionAnim(c, { motion: "hop", particle: "spark", colors: ["#ffffff", "#ffd24a", "#a8e6ff"], count: 4, y0: 30 });
    }
  }
  state.actionsSinceRest = (state.actionsSinceRest || 0) + 1;
  if (sp.message) message(sp.message.replace("{n}", n));
  refreshHud(); save(); panelId = PANEL_DIRTY; refreshInteraction();
}

function distPlayer(x, y) { return Math.hypot(player.x - x, player.y - y); }

function refreshInteraction() {
  if (placingDecor) {
    activeTarget = null;
    if (selRing) selRing.setVisible(false);
    if (panelId !== "place") { panelId = "place"; buildPanel(); }
    $("btn-action").classList.add("hidden");
    return;
  }
  let best = null, dmin = Infinity;
  if (mounted) best = mounted;
  else {
    STATIONS.forEach((s) => { const d = distPlayer(s.x, s.y); if (d < 110 && d < dmin) { dmin = d; best = s; } });
    state.creatures.forEach((c) => { if (c.departing || c.celebrating || c.leaving) return; const d = distPlayer(c.x, c.y); if (d < 95 && d < dmin) { dmin = d; best = c; } });
  }
  activeTarget = best;
  const id = best ? (best.variant !== undefined && !best.station ? "c" + best.id : "s" + best.type) : null;
  if (id !== panelId) { panelId = id; buildPanel(); }
  if (best && isCreature(best)) refreshBars(best);

  if (best && selRing) {
    selRing.setPosition(best.x, best.y + 10).setVisible(true).setDepth(best.y - 1);
  } else if (selRing) selRing.setVisible(false);

  $("btn-action").classList.add("hidden");
}
function isCreature(t) { return t && t.variant !== undefined && !t.station; }

/* ===================== Pointer ===================== */

function onPointer(p) {
  if (!$("modal").classList.contains("hidden") || closeupOpen) return;
  const wx = p.worldX, wy = p.worldY;
  const tnow = (typeof performance !== "undefined" ? performance.now() : Date.now());
  running = (tnow - lastTapT) < 350;
  lastTapT = tnow;

  followCreature = null;
  let target = null, dmin = Infinity;
  STATIONS.forEach((s) => { const d = Math.hypot(s.x - wx, s.y - wy); if (d < 70 && d < dmin) { dmin = d; target = s; } });
  state.creatures.forEach((c) => { if (c === mounted || c.departing || c.celebrating || c.leaving) return; const d = Math.hypot(c.x - wx, c.y - wy); if (d < 55 && d < dmin) { dmin = d; target = c; } });
  if (target && isCreature(target)) {
    followCreature = target; pendingInteract = null;
  } else if (target) {
    const dx = player.x - target.x, dy = player.y - target.y, d = Math.hypot(dx, dy) || 1;
    moveTarget = { x: target.x + (dx / d) * 90, y: target.y + (dy / d) * 90 };
    pendingInteract = target;
  } else { moveTarget = { x: clamp(wx, 40, WORLD.w - 40), y: clamp(wy, 40, WORLD.h - 40) }; pendingInteract = null; }
}

/* ===================== Panel ===================== */

function buildPanel() {
  const p = $("panel");
  if (placingDecor) {
    p.innerHTML = `<div class="pc-station">
      <p class="panel-hint">${(META.placeHint || "Walk anywhere, then place {item}.").replace("{item}", placingDecor.name)}</p>
      <div class="pc-actions">
        <button class="btn btn-accent" data-place="1">✅ ${META.placeHere || "Place here"}</button>
        <button class="btn btn-secondary" data-cancel-place="1">❌ ${META.cancel || "Cancel"}</button>
      </div></div>`;
    return;
  }
  if (!activeTarget) { p.innerHTML = `<p class="panel-hint">${META.idleHint || "Walk around and approach something to act."}</p>`; return; }
  if (isCreature(activeTarget)) {
    const c = activeTarget, isMounted = mounted === c;
    let actions;
    if (isMounted) {
      const rideAct = ACTIONS.find((a) => a.type === "ride");
      const jumpAct = ACTIONS.find((a) => a.type === "jump");
      const raceAct = ACTIONS.find((a) => a.type === "race");
      actions = (jumpAct ? `<button class="btn btn-accent" data-creature="${jumpAct.id}">${jumpAct.icon || ""} ${jumpAct.label}</button>` : "")
        + (raceAct ? `<button class="btn ${race ? "btn-secondary" : "btn-giant"}" data-creature="${raceAct.id}">${race ? "🏳️ " + ((RACE && RACE.quitLabel) || "Quit race") : (raceAct.icon || "") + " " + raceAct.label}</button>` : "")
        + `<button class="btn btn-secondary" data-creature="${rideAct.id}">🛑 ${rideAct.dismountLabel || "Get off"}</button>`;
    } else {
      actions = ACTIONS.filter((a) => a.type !== "jump").map((a) => {
        const cls = a.type === "ride" ? "btn btn-accent" : (a.type === "customize" ? "btn btn-secondary" : (a.type === "closeup" ? "btn btn-giant" : "btn"));
        return `<button class="${cls}" data-creature="${a.id}">${a.icon || ""} ${a.label}</button>`;
      }).join("");
    }
    const ageTxt = CREATURE.aging
      ? (isYoung(c) ? `${CREATURE.youngLabel || "🐣 Young"} (${c.age}${META.ageUnit || "d"})` : `${CREATURE.adultLabel || "Adult"} (${c.age}${META.ageUnit || "d"})`)
      : "";
    p.innerHTML = `
      <div class="pc-head"><div><b>${c.name}</b> <span class="pc-sub">${ageTxt}</span></div></div>
      ${CREATURE.showBars === false ? "" : '<div class="pc-bars" id="pc-bars"></div>'}
      <div class="pc-actions">${actions}</div>`;
    refreshBars(c);
  } else {
    const s = activeTarget;
    const st = STATIONS.find((x) => x.type === s.type);
    p.innerHTML = `<div class="pc-station"><button class="btn btn-giant" data-station="${s.type}">${(st && st.actionLabel) || st.label}</button></div>`;
  }
}

function refreshBars(c) {
  const cont = $("pc-bars"); if (!cont) return;
  cont.innerHTML = NEEDS.map((n) => {
    const v = c[n.id] || 0;
    const cl = v < 25 ? "r-red" : v < 50 ? "r-yellow" : "r-green";
    return `<div class="need"><span class="icon">${n.icon || ""}</span><div class="bar"><div class="bar-fill ${cl}" style="width:${v}%"></div></div></div>`;
  }).join("");
}

/* ===================== Interactions ===================== */

function interact(target) {
  if (!target) return;
  if (isCreature(target)) return;
  const st = STATIONS.find((x) => x.type === target.type);
  if (!st) return;
  if (st.action === "nextDay") nextDay();
  else if (st.action === "spawn") spawnCreatures(st);
  else if (st.action === "openShop") openShop();
  else if (st.action === "custom" && typeof st.onUse === "function") st.onUse(state, { message, refreshHud, save });
}

function creatureAction(actionId) {
  const c = activeTarget; if (!c || !isCreature(c)) return;
  const a = ACTIONS.find((x) => x.id === actionId); if (!a) return;

  if (a.type === "ride") { toggleRide(c); return; }
  if (a.type === "jump") { doJump(); return; }
  if (a.type === "race") { if (race) endRace(false); else startRace(); return; }
  if (a.type === "customize") { openCustomize(c); return; }
  if (a.type === "closeup") { openCloseup(c, a); return; }

  // resource cost
  if (a.cost) {
    if ((state.resources[a.cost.resource] || 0) < a.cost.amount) { message(a.outOfStock || `Out of ${a.cost.resource}!`); return; }
  }
  // need requirement (e.g. needs enough energy to play)
  if (a.require) {
    for (const k in a.require) { if ((c[k] || 0) < a.require[k]) { message((a.tooLow || "{name} is too tired.").replace("{name}", c.name)); return; } }
  }
  if (a.cost) state.resources[a.cost.resource] = (state.resources[a.cost.resource] || 0) - a.cost.amount;

  const moodBefore = MOOD_NEED ? (c[MOOD_NEED] || 0) : 0;
  // apply need effects
  Object.keys(a.effects || {}).forEach((k) => { c[k] = clamp01((c[k] || 0) + a.effects[k]); });
  if (a.reward) state.coins += a.reward;
  state.actionsSinceRest = (state.actionsSinceRest || 0) + 1;
  if (a.stat) state.stats[a.stat] = (state.stats[a.stat] || 0) + 1;
  if (a.anim) actionAnim(c, a.anim);

  // celebrate when the mood need reaches max during this action (adults only)
  let celebrated = false;
  if (MOOD_NEED && CREATURE.celebrate && (!CREATURE.celebrate.adultsOnly || !isYoung(c)) && moodBefore < 100 && (c[MOOD_NEED] || 0) >= 100) {
    sc && sc.time.delayedCall(700, () => celebrate(c));
    celebrated = true;
  }
  message(a.message ? (celebrated && a.celebrateMessage ? a.celebrateMessage : a.message).replace("{name}", c.name) : "");

  refreshBars(c); refreshHud();
}

function toggleRide(c) {
  const RIDE = CREATURE.ride; if (!RIDE) return;
  if (mounted === c) { dismount(c, false); return; }
  if (RIDE.adultsOnly && isYoung(c)) { message((RIDE.tooYoung || "{name} is too young to ride.").replace("{name}", c.name)); return; }
  if (RIDE.minEnergy && RIDE.fatigueNeed && (c[RIDE.fatigueNeed] || 0) < RIDE.minEnergy) { message((RIDE.tooTired || "{name} is too tired.").replace("{name}", c.name)); return; }
  mounted = c;
  if (RIDE.onMount) Object.keys(RIDE.onMount).forEach((k) => (c[k] = clamp01((c[k] || 0) + RIDE.onMount[k])));
  state.actionsSinceRest = (state.actionsSinceRest || 0) + 1;
  if (statKeys().includes("ride")) state.stats.ride = (state.stats.ride || 0) + 1;
  rideFatigueAcc = 0;
  message((RIDE.mountMessage || "Riding {name}!").replace("{name}", c.name));
  panelId = PANEL_DIRTY; refreshInteraction(); refreshHud();
}

function doJump() {
  const RIDE = CREATURE.ride, J = RIDE && RIDE.jump;
  if (!mounted || jumpRunning || !sc || !J) return;
  const c = mounted;
  if (J.minEnergy && RIDE.fatigueNeed && (c[RIDE.fatigueNeed] || 0) < J.minEnergy) { message((J.tooTired || "{name} is too tired to jump!").replace("{name}", c.name)); return; }
  if (J.cost && RIDE.fatigueNeed) c[RIDE.fatigueNeed] = clamp01(c[RIDE.fatigueNeed] - J.cost);
  rideFatigueAcc = 0; state.actionsSinceRest = (state.actionsSinceRest || 0) + 1;
  if (statKeys().includes("jump")) state.stats.jump = (state.stats.jump || 0) + 1;
  jumpRunning = true; moveTarget = null; followCreature = null;
  const dir = (playerFacing === "left") ? -1 : 1;
  const targetX = clamp(player.x + dir * (J.distance || 165), 40, WORLD.w - 40);
  sc.tweens.add({ targets: player, x: targetX, duration: 560, ease: "Quad.easeOut", onComplete: () => { jumpRunning = false; } });
  jumpAnim.h = 0;
  sc.tweens.add({ targets: jumpAnim, h: 1, duration: 290, yoyo: true, ease: "Sine.easeOut" });
  if (MOOD_NEED) c[MOOD_NEED] = clamp01((c[MOOD_NEED] || 0) + 4);
  refreshHud();
}

function dismount(c, exhausted) {
  if (race) endRace(false, true);
  mounted = null; moveTarget = null; running = false; rideFatigueAcc = 0; jumpRunning = false;
  if (playerSprite) playerSprite.y = 0;
  if (playerShadow) playerShadow.setVisible(true);
  c.x = clamp(player.x + 135, 40, WORLD.w - 40);
  c.y = clamp(player.y, 40, WORLD.h - 40);
  c.tx = c.x; c.ty = c.y; c.nextStep = 0;
  if (c.obj) { c.obj.x = c.x; c.obj.y = c.y; }
  panelId = PANEL_DIRTY; refreshInteraction(); refreshHud();
  const RIDE = CREATURE.ride || {};
  message(exhausted ? (RIDE.exhaustedMessage || "{name} is exhausted!").replace("{name}", c.name) : (RIDE.dismountMessage || "You get off {name}.").replace("{name}", c.name));
}

/* ===================== Animations / effects ===================== */

// --- Procedural particle textures (drawn white so they tint to any colour) ---
function starPoints(cx, cy, R, r, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = (i % 2) ? r : R, a = -Math.PI / 2 + i * Math.PI / n;
    pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad });
  }
  return pts;
}
// Built-in particle shapes. A theme can ask for any of these per action; an
// unknown name falls back to a soft dot. Cached once per shape.
function ensureShape(shape) {
  const key = "pt_" + shape;
  if (sc.textures.exists(key)) return key;
  const g = sc.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  const S = 24, c = 12;
  if (shape === "heart") {
    g.fillCircle(7, 8, 6); g.fillCircle(17, 8, 6); g.fillTriangle(1, 10, 23, 10, 12, 24);
  } else if (shape === "star") {
    g.fillPoints(starPoints(c, c, 11, 4.6, 5), true);
  } else if (shape === "spark") {
    g.fillPoints([{ x: c, y: 0 }, { x: c + 4, y: c }, { x: c, y: S }, { x: c - 4, y: c }], true);
    g.fillPoints([{ x: 0, y: c }, { x: c, y: c - 4 }, { x: S, y: c }, { x: c, y: c + 4 }], true);
  } else if (shape === "diamond") {
    g.fillPoints([{ x: c, y: 1 }, { x: S - 1, y: c }, { x: c, y: S - 1 }, { x: 1, y: c }], true);
  } else if (shape === "bubble" || shape === "ring") {
    g.lineStyle(3, 0xffffff, 1); g.strokeCircle(c, c, 9); g.fillCircle(c - 3, c - 3, 2);
  } else { // dot / default
    g.fillCircle(c, c, 5);
  }
  g.generateTexture(key, S, S); g.destroy();
  return key;
}

// Emit a burst of particles. spec: {shape, colors:[hex], count, fall, spread, y0, riseMin/Max, scaleMin/Max}.
function emitBurst(x, y, spec) {
  if (!sc) return;
  spec = spec || {};
  const key = ensureShape(spec.shape || "dot");
  const colors = (spec.colors && spec.colors.length ? spec.colors : ["#ffffff"]).map((v) => typeof v === "string" ? hexInt(v) : v);
  const n = spec.count || 5, fall = !!spec.fall;
  const spread = spec.spread || 24, y0 = spec.y0 != null ? spec.y0 : 46;
  const sMin = spec.scaleMin || 0.7, sMax = spec.scaleMax || 1.1;
  for (let i = 0; i < n; i++) {
    const p = sc.add.image(x + randInt(-spread, spread), y - y0, key)
      .setDepth(99998).setScale(randInt(Math.round(sMin * 10), Math.round(sMax * 10)) / 10).setTint(colors[i % colors.length]);
    const dy = fall ? randInt(16, 30) : -randInt(spec.riseMin || 46, spec.riseMax || 82);
    sc.tweens.add({ targets: p, y: p.y + dy, alpha: 0, duration: randInt(spec.durMin || 500, spec.durMax || 880),
      ease: fall ? "Quad.easeIn" : "Sine.easeOut", onComplete: () => p.destroy() });
  }
}

// Body motion presets used by action animations.
function applyMotion(c, motion) {
  if (!c.bodyT || !sc || motion === "none") return;
  const m = motion || "bounce";
  if (m === "nod") sc.tweens.add({ targets: c.bodyT, y: 7, duration: 120, yoyo: true, repeat: 1, ease: "Sine.easeInOut", onComplete: () => { if (c.bodyT) c.bodyT.y = 0; } });
  else if (m === "hop") sc.tweens.add({ targets: c.bodyT, y: -24, duration: 210, yoyo: true, ease: "Quad.easeOut", onComplete: () => { if (c.bodyT) c.bodyT.y = 0; } });
  else sc.tweens.add({ targets: c.bodyT, y: -12, duration: 130, yoyo: true, ease: "Quad.easeOut", onComplete: () => { if (c.bodyT) c.bodyT.y = 0; } });
}

// Legacy string presets (back-compat) for action.anim.
const ANIM_PRESETS = {
  eat: { motion: "nod", shape: "dot", colors: ["#e8b34a", "#c98a2e"], count: 5, fall: true, y0: 36 },
  cheer: { motion: "hop", shape: "heart", colors: ["#ff7eb6", "#7fd06f", "#ffd24a"], count: 5 },
  sparkle: { motion: "bounce", shape: "spark", colors: ["#ffffff", "#fff2a8", "#a8e6ff"], count: 5 },
};

// THEME-DRIVEN action animation. `anim` is a preset string OR an object:
//   { motion:"nod"|"hop"|"bounce"|"none", particle:"star"|"heart"|"spark"|"bubble"|"diamond"|"dot",
//     colors:[hex...], count, fall, spread, y0 }
function actionAnim(c, anim) {
  if (!c.obj || !c.bodyT || !sc) return;
  const spec = (typeof anim === "string") ? (ANIM_PRESETS[anim] || { motion: "bounce" }) : (anim || {});
  applyMotion(c, spec.motion);
  const shape = spec.shape || spec.particle;
  if (shape || (spec.colors && spec.colors.length)) {
    emitBurst(c.x, c.y, { shape, colors: spec.colors, count: spec.count, fall: spec.fall, y0: spec.y0,
      spread: spec.spread, riseMin: spec.riseMin, riseMax: spec.riseMax, scaleMin: spec.scaleMin, scaleMax: spec.scaleMax });
  }
}

// Celebration: a happy hop (or rear) + a configurable particle burst.
function celebrate(c) {
  if (!c.bodyT || !sc || c.celebrating) return;
  c.celebrating = true;
  const cel = CREATURE.celebrate || {};
  const mode = cel.mode || "hop";
  const t = c.bodyT;
  if (mode === "rear") {
    const orig = CREATURE.origin || { x: 0.46, y: 0.734 };
    const oxN = t.flipX ? 0.30 : 0.70, oyN = 0.95;
    t.setOrigin(oxN, oyN);
    t.x += (oxN - orig.x) * t.displayWidth; t.y += (oyN - orig.y) * t.displayHeight;
    const dir = t.flipX ? -1 : 1;
    sc.tweens.add({
      targets: t, angle: dir * 42, duration: 300, ease: "Back.easeOut", yoyo: true, hold: 420,
      onComplete: () => { if (t) { t.angle = 0; t.setOrigin(orig.x, orig.y); t.x = 0; t.y = 0; } c.celebrating = false; if (CREATURE.depart) departCreature(c); },
    });
  } else {
    sc.tweens.add({
      targets: t, y: -34, duration: 230, yoyo: true, repeat: 1, ease: "Quad.easeOut",
      onComplete: () => { if (t) t.y = 0; c.celebrating = false; if (CREATURE.depart) departCreature(c); },
    });
  }
  emitBurst(c.x, c.y, { shape: cel.particle || "heart", colors: cel.colors || ["#ff7eb6", "#7fd06f", "#ffd24a"], count: cel.count || 5, y0: 50, riseMin: 48, riseMax: 84 });
  if (cel.message) message(cel.message.replace("{name}", c.name));
}

/* ===================== Day cycle ===================== */

function nextDay() {
  if (nightRunning) return;
  if ((state.actionsSinceRest || 0) === 0 && CREATURE) {
    message(META.restBlockedHint || "You just woke up! Take care of someone first.");
    return;
  }
  // Day-arc reward: if every creature is happy at rest, give a synchronized send-off before the night.
  state.allHappyTonight = !!(ALL_HAPPY && state.creatures.length &&
    state.creatures.every((c) => needAverage(c) >= (ALL_HAPPY.mood || 75)));
  if (state.allHappyTonight && ALL_HAPPY.celebrate !== false) {
    state.creatures.forEach((c, i) => { if (sc) sc.time.delayedCall(i * 140, () => celebrate(c)); });
  }
  nightRunning = true; moveTarget = null; message(META.nightMessage || "🌙 Night falls…");
  const v = $("night-veil");
  if (v) {
    v.style.transition = "opacity 1s ease";
    v.style.opacity = "0.78";
    setTimeout(applyDay, 1150);
    setTimeout(() => { v.style.opacity = "0"; }, 1850);
    setTimeout(() => { nightRunning = false; }, 2900);
  } else { applyDay(); nightRunning = false; }
}

function applyDay() {
  state.day++; state.coins += (ECON.dayReward || 0); state.actionsSinceRest = 0;
  const neglected = [];
  state.creatures.forEach((c) => {
    if (CREATURE.aging) c.age++;
    // apply per-day need decay
    NEEDS.forEach((n) => { if (n.perDay) c[n.id] = clamp01((c[n.id] || 0) + n.perDay); });
    // mood need special rule
    if (MOOD_NEED) {
      const dm = CREATURE.moodDay || { base: -12, lowPenalty: -10, lowAt: 25, highBonus: 8, highAt: 60 };
      let adj = dm.base;
      const others = NEEDS.filter((n) => n.id !== MOOD_NEED);
      if (others.some((n) => (c[n.id] || 0) < dm.lowAt)) adj += dm.lowPenalty;
      if (others.every((n) => (c[n.id] || 0) > dm.highAt)) adj += dm.highBonus;
      c[MOOD_NEED] = clamp01((c[MOOD_NEED] || 0) + adj);
    }
    if (c.obj) refreshCreatureVisual(c);
    const lowMood = MOOD_NEED && (c[MOOD_NEED] || 0) < 25;
    const firstNeed = NEEDS[0] && (c[NEEDS[0].id] || 0) < 20;
    if (lowMood || firstNeed) neglected.push(c.name);
  });
  mounted = null;
  if (playerSprite) playerSprite.y = 0;
  if (playerShadow) playerShadow.setVisible(true);
  const baby = tryBirth();
  refreshHud(); save();
  const allHappy = state.allHappyTonight; state.allHappyTonight = false;
  if (baby) message((CREATURE.breeding && CREATURE.breeding.message || "🐣 A baby was born: {name}!").replace("{name}", baby.name));
  else if (allHappy && ALL_HAPPY && ALL_HAPPY.message) message(ALL_HAPPY.message.replace("{day}", state.day));
  else if (neglected.length) message((META.neglectMessage || "🌅 Day {day}. Take care of {names}!").replace("{day}", state.day).replace("{names}", listFr(neglected)));
  else message((META.morningMessage || "🌅 Day {day}: everyone slept well.").replace("{day}", state.day));
}

// Breeding: two happy adults can produce one baby overnight (with guard-rails).
function tryBirth() {
  const B = CREATURE && CREATURE.breeding;
  if (!B || !B.enabled) return null;
  const happyAdults = state.creatures.filter((c) => !isYoung(c) && (!MOOD_NEED || (c[MOOD_NEED] || 0) >= (B.minMood || 80)));
  const hasYoung = state.creatures.some(isYoung);
  const room = state.creatures.length < state.capacity;
  const cooldownOk = (state.day - (state.lastBirth || 0)) >= (B.cooldown || 3);
  if (happyAdults.length < 2 || hasYoung || !room || !cooldownOk) return null;
  const parent = pick(happyAdults);
  const baby = newCreature({ age: 0, variant: pick(happyAdults).variant });
  const z = HOME_ZONE ? HOME_ZONE.rect : { x: 60, y: 60, w: WORLD.w - 120, h: WORLD.h - 120 };
  baby.x = clamp(parent.x + randInt(-50, 50), z.x + 60, z.x + z.w - 60);
  baby.y = clamp(parent.y + randInt(-50, 50), z.y + 60, z.y + z.h - 60);
  baby.tx = baby.x; baby.ty = baby.y;
  state.creatures.push(baby);
  state.lastBirth = state.day;
  state.stats.births = (state.stats.births || 0) + 1;
  if (sc) { buildCreatureObj(baby); actionAnim(baby, "cheer"); }
  return baby;
}

function listFr(arr) {
  if (arr.length <= 1) return arr.join("");
  return arr.slice(0, -1).join(", ") + " " + (META.and || "and") + " " + arr[arr.length - 1];
}

/* ===================== Modal / shop / customize ===================== */

function openModal(t, html) { $("modal-title").innerHTML = t; $("modal-body").innerHTML = html; $("modal").classList.remove("hidden"); }
function closeModal() { $("modal").classList.add("hidden"); }

function openShop() {
  const room = state.creatures.length < state.capacity;
  let html = "";
  (SHOP.resources || []).forEach((r) => {
    html += `<div class="shop-row"><div class="desc"><b>${r.icon || ""} ${r.name}</b><small>${r.desc || ""}</small></div>
      <button class="btn" data-shop="res:${r.id}">${r.price} ${META.coinIcon || "💰"}</button></div>`;
  });
  if (SHOP.capacity && CREATURE) {
    html += `<div class="shop-row"><div class="desc"><b>${SHOP.capacity.name}</b><small>${state.creatures.length}/${state.capacity} ${CREATURE.label || ""}.</small></div>
      <button class="btn" data-shop="capacity">${SHOP.capacity.price} ${META.coinIcon || "💰"}</button></div>`;
  }
  if (DECOR.length) {
    html += `<h3>${SHOP.decorHeading || "🎨 Decorations"}</h3><div class="decor-grid">`;
    DECOR.forEach((d) => {
      html += `<button class="decor-card" data-decor="${d.id}">
        <img class="d-img" src="${av((G.assets.images[d.sprite]) || ("assets/img/" + d.sprite + ".png"))}" alt="" /><span>${d.name}</span><span class="d-price">${d.price} ${META.coinIcon || "💰"}</span></button>`;
    });
    html += `</div>`;
  }
  if (SHOP.buyCreature && CREATURE) {
    html += `<h3>${SHOP.buyCreature.heading || "🐾 Adopt"}</h3>`;
    if (!room) html += `<p>⚠️ ${SHOP.fullMessage || "No room! Expand first."}</p>`;
    else html += `<p>${SHOP.buyCreature.hint || ""}</p>
      <button class="btn btn-giant" data-shop="creature">${(SHOP.buyCreature.label || "🛒 Adopt")} (${SHOP.buyCreature.price} ${META.coinIcon || "💰"})</button>`;
  }
  openModal(SHOP.title || "🛒 Shop", html);
}

function buy(what) {
  if (what.startsWith("res:")) {
    const id = what.slice(4);
    const r = (SHOP.resources || []).find((x) => x.id === id); if (!r) return;
    if (state.coins < r.price) return message(META.notEnough || "Not enough coins!");
    state.coins -= r.price; state.resources[id] = (state.resources[id] || 0) + (r.amount || 1);
    message(`${r.icon || ""} +${r.amount || 1} ${r.name}!`);
  } else if (what === "capacity") {
    if (state.coins < SHOP.capacity.price) return message(META.notEnough || "Not enough coins!");
    state.coins -= SHOP.capacity.price; state.capacity++;
    message(SHOP.capacity.boughtMessage || "Expanded!");
  } else if (what === "creature") {
    if (state.creatures.length >= state.capacity) return message(SHOP.fullMessage || "No room!");
    if (state.coins < SHOP.buyCreature.price) return message(META.notEnough || "Not enough coins!");
    state.coins -= SHOP.buyCreature.price;
    const c = newCreature({}); state.creatures.push(c); if (sc) buildCreatureObj(c);
    message((SHOP.buyCreature.boughtMessage || "Welcome, {name}!").replace("{name}", c.name));
  }
  refreshHud(); openShop();
}

function buyDecor(id) {
  const d = DECOR.find((x) => x.id === id); if (!d) return;
  if (state.coins < d.price) return message(META.notEnough || "Not enough coins!");
  state.coins -= d.price;
  placingDecor = d; ghostSide = 1;
  closeModal();
  if (sc) {
    if (ghostDecor) ghostDecor.destroy();
    ghostDecor = sc.add.image(player.x, player.y, d.sprite).setOrigin(0.5, 0.95).setScale(d.scale || 1.2).setAlpha(0.6).setDepth(99999);
  }
  refreshHud(); panelId = PANEL_DIRTY; refreshInteraction();
  message((META.boughtDecorMessage || "{name} bought! Walk around and tap “Place here”.").replace("{name}", d.name));
}

function ghostXY() {
  const x = player.x + ghostSide * 60, y = player.y + 6;
  return { x: clamp(x, 40, WORLD.w - 40), y: clamp(y, 70, WORLD.h - 30) };
}

// Placement rules. Returns null if OK, otherwise an error message.
function placementError(d, x, y) {
  for (const s of STATIONS) {
    if (x > s.x - 80 && x < s.x + 80 && y > s.y - 150 && y < s.y + 24) return META.noOnBuilding || "🏠 Not on a building!";
  }
  if (HOME_ZONE && !d.allowInHome) {
    const r = HOME_ZONE.rect;
    if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return META.noInHome || "Not inside the pen!";
  }
  return null;
}

function placeDecor() {
  if (!placingDecor) return;
  const { x, y } = ghostXY();
  const err = placementError(placingDecor, x, y);
  if (err) { message(err); return; }
  state.decors.push({ id: placingDecor.id, x, y });
  state.stats.decor = (state.stats.decor || 0) + 1;
  if (CREATURE && MOOD_NEED) state.creatures.forEach((c) => (c[MOOD_NEED] = clamp01((c[MOOD_NEED] || 0) + 5)));
  const name = placingDecor.name; placingDecor = null;
  if (ghostDecor) { ghostDecor.destroy(); ghostDecor = null; }
  buildDecors(); save(); refreshHud(); panelId = "upd"; refreshInteraction();
  message((META.placedMessage || "{name} placed! ✨").replace("{name}", name));
}

function cancelPlacement() {
  if (!placingDecor) return;
  state.coins += placingDecor.price;
  placingDecor = null;
  if (ghostDecor) { ghostDecor.destroy(); ghostDecor = null; }
  refreshHud(); panelId = "upd"; refreshInteraction();
  message(META.refundMessage || "Placement cancelled, refunded. 💰");
}

function openCustomize(c) {
  const cz = CREATURE.customize || {};
  let html = `<div class="customize-preview" id="cz-preview"></div>`;
  if (cz.rename) html += `<label class="cz-label">${META.nameLabel || "Name:"}</label><input id="cz-name" type="text" maxlength="14" value="${c.name}" />`;
  if (cz.variant && VARIANTS.length) html += `<div class="group"><span class="group-title">${CREATURE.variantLabel || "Colour"}</span><div class="avatar-row" id="cz-variant"></div></div>`;
  html += `<button class="btn btn-giant" id="cz-ok">✅ ${META.confirm || "Confirm"}</button>`;
  openModal((CREATURE.customizeTitle || "🎨 Customize") + " " + c.name, html);

  const drawPreview = () => {
    const v = variantDef(variantId(c));
    const col = (v && v.color) || "#cccccc";
    $("cz-preview").innerHTML = `<div class="variant-blob" style="background:${col}"></div>`;
  };
  if (cz.variant && VARIANTS.length) {
    VARIANTS.forEach((v) => {
      const b = document.createElement("button");
      b.className = "btn-avatar swatch" + (variantId(c) === v.id ? " chosen" : "");
      b.style.background = v.color || "#ccc";
      b.title = v.name;
      b.addEventListener("click", () => { c.variant = v.id; $("cz-variant").querySelectorAll(".btn-avatar").forEach((x) => x.classList.remove("chosen")); b.classList.add("chosen"); drawPreview(); });
      $("cz-variant").appendChild(b);
    });
  }
  $("cz-ok").addEventListener("click", () => {
    if (cz.rename) {
      const name = $("cz-name").value.trim();
      if (name && nameUsed(name, c)) { message((META.nameTaken || "Another one is already called {name}!").replace("{name}", name)); return; }
      if (name) c.name = name;
    }
    refreshCreatureVisual(c); save(); closeModal(); panelId = PANEL_DIRTY;
    message((CREATURE.customizedMessage || "{name} updated! 🎨").replace("{name}", c.name));
  });
  drawPreview();
}

/* ===================== Close-up mini-scene (generic) ===================== */
// A creature action of type "closeup" opens a full-screen scene: the player
// scrubs/taps "spots" off a backdrop image until it's clean, then the action's
// effects / reward / celebrate are applied (exactly like finishing a normal
// action). Entirely config-driven via action.closeup — see ENGINE.md.
function openCloseup(c, a) {
  const root = $("closeup"); if (!root || !a) return;
  const cfg = a.closeup || {};
  const stage = $("closeup-stage"), bg = $("closeup-bg"), brush = $("closeup-brush");
  const imgPath = (k, def) => av((G.assets.images && G.assets.images[k]) || ("assets/img/" + (k || def) + ".png"));
  // The backdrop can be overridden per creature variant (e.g. each child's own face).
  const cv = variantDef(variantId(c));
  const src = imgPath((cv && cv.closeupBg) || cfg.bg, "closeup");
  if (bg) bg.src = src;
  stage.querySelectorAll(".cu-spot, .cu-emoji").forEach((n) => n.remove());

  const sp = cfg.spots || {};
  const cured = (a.stat && state.stats[a.stat]) || 0;       // ramps difficulty with progress
  const base = sp.base || 4, grow = sp.growEvery || 0, max = sp.max || 10;
  const count = clamp(base + (grow ? Math.floor(cured / grow) : 0), 1, max);
  const rubs = sp.rubs || 3, size = sp.size || 64;
  // `area` may be one region or several (e.g. upper + lower teeth); spots alternate
  // between them so every region gets some.
  const areas = Array.isArray(sp.area) ? sp.area : [sp.area || { x: 0.18, y: 0.42, w: 0.64, h: 0.28 }];
  for (let i = 0; i < count; i++) {
    const ar = areas[i % areas.length];
    const s = document.createElement(cfg.spotSprite ? "img" : "div");
    s.className = "cu-spot"; s.draggable = false;
    if (cfg.spotSprite) s.src = imgPath(cfg.spotSprite, "spot");
    // store the spot's position/size as fractions of the BACKDROP IMAGE; it's mapped
    // to screen pixels in cuPlaceSpots() so it stays on the teeth under object-fit:cover.
    s.dataset.fx = (ar.x + Math.random() * ar.w).toFixed(4);
    s.dataset.fy = (ar.y + Math.random() * ar.h).toFixed(4);
    s.dataset.sz = String(size);
    s.style.setProperty("--rot", Math.floor(Math.random() * 360) + "deg");
    s.dataset.rubs0 = String(rubs); s.dataset.rubs = String(rubs); s.dataset.t = "0";
    stage.appendChild(s);
  }
  if (brush) {
    if (cfg.brush) {
      brush.src = imgPath(cfg.brush, "brush"); brush.classList.remove("hidden");
      brush.style.left = ""; brush.style.top = "";   // reset to the visible CSS start position
    } else brush.classList.add("hidden");
  }
  cuState = { c, a, remaining: count, pressed: false };
  closeupOpen = true;
  clearSelection();
  root.classList.remove("hidden");
  themeColor((META.theme && META.theme.play) || TINT_PLAY);
  cuPlaceSpots();
  if (bg) bg.onload = cuPlaceSpots;        // re-place once natural size is known
}

// Map each spot's image-fraction (fx,fy) to screen px under object-fit:cover, so the
// backdrop can fill the whole screen (cropped) while spots stay glued to the teeth.
function cuCover() {
  const stage = $("closeup-stage"), bg = $("closeup-bg");
  const Wc = stage.clientWidth, Hc = stage.clientHeight;
  const iw = (bg && bg.naturalWidth) || 900, ih = (bg && bg.naturalHeight) || 1160;
  const s = Math.max(Wc / iw, Hc / ih);
  return { s, dw: iw * s, dh: ih * s, ox: (Wc - iw * s) / 2, oy: (Hc - ih * s) / 2 };
}
function cuPlaceSpots() {
  const stage = $("closeup-stage"); if (!stage) return;
  const c = cuCover();
  stage.querySelectorAll(".cu-spot").forEach((s) => {
    const px = (parseFloat(s.dataset.sz) || 64) * c.s;
    s.style.left = (c.ox + parseFloat(s.dataset.fx) * c.dw) + "px";
    s.style.top = (c.oy + parseFloat(s.dataset.fy) * c.dh) + "px";
    s.style.width = px + "px"; s.style.height = px + "px";
  });
}

function cuMoveBrush(e) {
  const brush = $("closeup-brush"); if (!brush || brush.classList.contains("hidden")) return;
  const r = $("closeup-stage").getBoundingClientRect();
  brush.style.left = (e.clientX - r.left) + "px";
  brush.style.top = (e.clientY - r.top) + "px";
}

function cuReleaseCapture() {
  try {
    const stage = $("closeup-stage");
    if (stage && cuPid != null && stage.hasPointerCapture && stage.hasPointerCapture(cuPid)) stage.releasePointerCapture(cuPid);
  } catch (_) {}
  cuPid = null;
}

// Hit-test spots by GEOMETRY (the spots are pointer-events:none, so the pointer target
// is always the stable stage). This makes a continuous finger-scrub clean every spot it
// passes over, and never leaves the pointer captured by a removed element.
function cuRub(e) {
  if (!cuState) return;
  // Scrub from the BRUSH HEAD (bristles), not the raw finger position: map a point of the
  // brush sprite (closeup.brushTip, fractions of the sprite — default its centre) to screen px.
  let x = e.clientX, y = e.clientY;
  const brush = $("closeup-brush");
  const tip = cuState.a && cuState.a.closeup && cuState.a.closeup.brushTip;
  if (tip && brush && !brush.classList.contains("hidden")) {
    const br = brush.getBoundingClientRect();
    x = br.left + (tip.x != null ? tip.x : 0.5) * br.width;
    y = br.top + (tip.y != null ? tip.y : 0.5) * br.height;
  }
  const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
  const spots = $("closeup-stage").querySelectorAll(".cu-spot");
  for (let i = 0; i < spots.length; i++) {
    const t = spots[i], r = t.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
    if (now - (parseFloat(t.dataset.t) || 0) < 90) return;   // cooldown so a scrub isn't instant
    t.dataset.t = String(now);
    const left = (parseInt(t.dataset.rubs, 10) || 1) - 1;
    t.dataset.rubs = String(left);
    const f = Math.max(0, left) / (parseInt(t.dataset.rubs0, 10) || 1);
    t.style.opacity = (0.25 + 0.75 * f).toFixed(2);
    t.style.transform = `translate(-50%,-50%) rotate(var(--rot)) scale(${(0.4 + 0.6 * f).toFixed(2)})`;
    if (left <= 0) cuPop(t);
    return;
  }
}

function cuPop(spot) {
  cuEmoji(spot.style.left, spot.style.top, ["✨", "⭐"], false);
  spot.remove();
  if (!cuState) return;
  cuState.remaining = Math.max(0, cuState.remaining - 1);
  if (cuState.remaining === 0) cuFinish();
}

function cuEmoji(left, top, glyphs, burst) {
  const stage = $("closeup-stage"); if (!stage) return;
  glyphs.forEach((g, k) => {
    const e = document.createElement("div");
    e.className = "cu-emoji" + (burst ? " cu-burst" : "");
    e.textContent = g; e.style.left = left; e.style.top = top;
    e.style.animationDelay = (burst ? Math.floor(Math.random() * 250) : k * 70) + "ms";
    stage.appendChild(e); setTimeout(() => e.remove(), 1300);
  });
}

function cuFinish() {
  const { c, a } = cuState;
  // Release the pointer capture NOW (stage still visible) rather than 950ms later when the
  // overlay hides — on iOS a finger still down when a captured element is removed/hidden
  // leaves the capture stuck and freezes later taps. Releasing early avoids that.
  if (cuState) cuState.pressed = false;
  cuReleaseCapture();
  const parts = (a.closeup && a.closeup.finishParticles) || ["⭐", "💖", "✨", "🌟"];
  for (let i = 0; i < 16; i++) cuEmoji((10 + Math.random() * 80) + "%", (18 + Math.random() * 55) + "%", [parts[i % parts.length]], true);
  setTimeout(() => { closeCloseup(); cuApply(c, a); }, 950);
}

// Apply the action's outcome — mirrors the tail of creatureAction().
function cuApply(c, a) {
  const moodBefore = MOOD_NEED ? (c[MOOD_NEED] || 0) : 0;
  Object.keys(a.effects || {}).forEach((k) => { c[k] = clamp01((c[k] || 0) + a.effects[k]); });
  if (a.reward) state.coins += a.reward;
  state.actionsSinceRest = (state.actionsSinceRest || 0) + 1;
  if (a.stat) state.stats[a.stat] = (state.stats[a.stat] || 0) + 1;
  let celebrated = false;
  if (MOOD_NEED && CREATURE.celebrate && (!CREATURE.celebrate.adultsOnly || !isYoung(c)) && moodBefore < 100 && (c[MOOD_NEED] || 0) >= 100) {
    if (sc) sc.time.delayedCall(250, () => celebrate(c)); celebrated = true;
    if (CREATURE.depart) c.leaving = true;   // cured & about to leave → stop selecting it (panel clears now, not 250ms later)
  }
  if (a.message) message((celebrated && a.celebrateMessage ? a.celebrateMessage : a.message).replace("{name}", c.name));
  refreshBars(c); refreshHud(); panelId = PANEL_DIRTY; refreshInteraction();
}

function clearSelection() {
  try { const s = window.getSelection && window.getSelection(); if (s && s.removeAllRanges) s.removeAllRanges(); } catch (e) {}
}

function closeCloseup() {
  cuReleaseCapture();
  const root = $("closeup"); if (root) { root.classList.add("hidden"); root.style.backgroundImage = ""; }
  const stage = $("closeup-stage"); if (stage) stage.querySelectorAll(".cu-spot, .cu-emoji").forEach((n) => n.remove());
  closeupOpen = false; cuState = null; clearSelection();
  // Make sure the world is fully interactive again (belt-and-braces: clear any
  // transient input/movement state and re-assert camera follow + keyboard).
  moveTarget = null; pendingInteract = null; followCreature = null;
  running = false; jumpRunning = false;
  themeColor((META.theme && META.theme.play) || TINT_PLAY);
  if (sc && sc.input) {                                  // re-assert pointer + keyboard input
    sc.input.enabled = true;
    if (sc.input.manager) sc.input.manager.enabled = true;
    if (sc.input.keyboard) { sc.input.keyboard.enabled = true; sc.input.keyboard.resetKeys(); }
  }
  if (sc && player) sc.cameras.main.startFollow(player, true, 0.5, 0.5);
}

/* ===================== Goals / help ===================== */

function openGoals() {
  if (!LEVELS.length) { openModal("🎯 Goals", "<p>No goals configured.</p>"); return; }
  const idx = Math.min((state.level || 1) - 1, LEVELS.length - 1);
  const lvl = LEVELS[idx];
  const list = lvl.goals;
  const done = list.filter((o) => state.goalsDone[o.id]).length;
  const pct = Math.round((done / list.length) * 100);
  const last = idx === LEVELS.length - 1;
  const allDone = last && done === list.length;
  const lines = list.map((o) => {
    const ok = !!state.goalsDone[o.id];
    return `<div class="goal-row ${ok ? "goal-ok" : ""}"><span class="goal-check">${ok ? "✅" : "⬜"}</span>
      <span class="goal-txt"><b>${o.name}</b><small>${o.desc}</small></span></div>`;
  }).join("");
  const sub = allDone ? `You finished every goal! 🏆` : `${done}/${list.length} goals — finish them to reach level ${idx + 2}`;
  openModal("🎯 Goals", `
    <div class="level-box">
      <div class="level-top"><b>⭐ Level ${idx + 1}</b><span>“${lvl.name}”</span></div>
      <div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div>
      <p class="level-sub">${sub}</p>
    </div>
    ${allDone ? `<p class="goal-done">🏆 You reached the top level! 🎉</p>` : ""}
    <div class="goal-list">${lines}</div>`);
}

function openHelp() {
  const items = (G.help || []).map((h) => `<p>${h}</p>`).join("");
  openModal(META.helpTitle || "❓ How to play", `<div class="help-text">${items}</div>`);
}

/* ===================== Race mini-mode (config-gated: GAME.race) =====================
   A timed race while mounted: drive through a sequence of checkpoints before the timer
   runs out, avoiding hazards (wandering pedestrians + static obstacles on the road).
   The camera zooms in for a racing view and a guide arrow points at the next checkpoint.
   Fully generic — checkpoints, timer, zoom, reward and hazards all come from GAME.race. */

function startRace() {
  if (!RACE || race || !mounted || !sc) return;
  const cps = (RACE.checkpoints || []).map((p) => ({ x: p.x, y: p.y, r: RACE.checkpointRadius || 70 }));
  if (!cps.length) return;
  race = { idx: 0, cps, time: RACE.time || 45, hazards: [], objs: [], hitAt: -9, baseZoom: sc.cameras.main.zoom };

  cps.forEach((cp, i) => {
    cp.g = sc.add.graphics().setDepth(1);
    cp.flag = sc.add.text(cp.x, cp.y - cp.r - 10, i === cps.length - 1 ? "🏁" : String(i + 1),
      { fontSize: "26px", fontFamily: "sans-serif", color: "#fff8ec", fontStyle: "bold", stroke: "#1a1330", strokeThickness: 5 }).setOrigin(0.5).setDepth(99991);
    race.objs.push(cp.g, cp.flag);
    drawCheckpoint(cp, i === 0);
  });

  spawnHazards();

  const arrow = sc.add.triangle(0, 0, 0, -16, 13, 12, -13, 12, 0xffd54a).setDepth(99992);
  arrow.setStrokeStyle(3, 0x1a1330, 1);
  race.arrow = arrow; race.objs.push(arrow);

  sc.tweens.add({ targets: sc.cameras.main, zoom: RACE.zoom || 1.1, duration: 500, ease: "Quad.easeOut" });
  raceHudShow();
  message(RACE.startMessage || "🏁 Race! Reach checkpoint 1!");
  panelId = PANEL_DIRTY; refreshInteraction();
}

function drawCheckpoint(cp, active) {
  const g = cp.g; if (!g) return;
  g.clear();
  const col = active ? 0x3fe0a0 : 0x6a6f92, a = active ? 0.9 : 0.4;
  g.lineStyle(active ? 7 : 4, col, a); g.strokeCircle(cp.x, cp.y, cp.r);
  g.fillStyle(col, active ? 0.16 : 0.07); g.fillCircle(cp.x, cp.y, cp.r);
  if (cp.flag) cp.flag.setAlpha(active ? 1 : 0.5);
}

function spawnHazards() {
  const H = RACE.hazards || {};
  (H.cones || []).forEach((p) => {
    const spr = H.coneSprite
      ? sc.add.image(p.x, p.y, H.coneSprite).setOrigin(0.5, 0.9).setScale(H.coneScale || 1).setDepth(p.y)
      : sc.add.circle(p.x, p.y, 14, 0xf5822c).setDepth(p.y);
    race.hazards.push({ x: p.x, y: p.y, obj: spr, r: H.coneRadius || 26, kind: "cone" });
    race.objs.push(spr);
  });
  const n = H.pedestrianCount || 0;
  const z = HOME_ZONE ? HOME_ZONE.rect : { x: 60, y: 60, w: WORLD.w - 120, h: WORLD.h - 120 };
  for (let i = 0; i < n; i++) {
    const x = randInt(z.x + 60, z.x + z.w - 60), y = randInt(z.y + 60, z.y + z.h - 60);
    let spr;
    if (H.pedestrianSheet) {
      spr = sc.add.sprite(x, y, H.pedestrianSheet).setScale(H.pedestrianScale || 1.3).setDepth(y);
      if (sc.anims.exists("race-ped-walk")) spr.play("race-ped-walk");
    } else spr = sc.add.circle(x, y, 12, 0x4a96f0).setDepth(y);
    const ang = Math.random() * Math.PI * 2;
    race.hazards.push({ x, y, obj: spr, r: H.pedestrianRadius || 34, kind: "ped",
      vx: Math.cos(ang), vy: Math.sin(ang), next: 0, speed: H.pedestrianSpeed || 55 });
    race.objs.push(spr);
  }
}

function raceTick(dt, now) {
  if (!race) return;
  if (!mounted) { endRace(false, true); return; }

  race.time -= dt;
  const z = HOME_ZONE ? HOME_ZONE.rect : { x: 40, y: 40, w: WORLD.w - 80, h: WORLD.h - 80 };
  race.hazards.forEach((h) => {
    if (h.kind === "ped") {
      if (now > h.next) { const a = Math.random() * Math.PI * 2; h.vx = Math.cos(a); h.vy = Math.sin(a); h.next = now + randInt(1200, 3200); }
      h.x += h.vx * h.speed * dt; h.y += h.vy * h.speed * dt;
      if (h.x < z.x + 30 || h.x > z.x + z.w - 30) { h.vx *= -1; h.x = clamp(h.x, z.x + 30, z.x + z.w - 30); }
      if (h.y < z.y + 30 || h.y > z.y + z.h - 30) { h.vy *= -1; h.y = clamp(h.y, z.y + 30, z.y + z.h - 30); }
      h.obj.x = h.x; h.obj.y = h.y; h.obj.setDepth(h.y);
      if (h.obj.setFlipX) h.obj.setFlipX(h.vx > 0);
    }
    if (now - race.hitAt > 0.9 && Math.hypot(h.x - player.x, h.y - player.y) < h.r) {
      race.hitAt = now;
      race.time -= (RACE.hitPenalty || 3);
      sc.cameras.main.shake(180, 0.012);
      sc.cameras.main.flash(160, 200, 60, 60);
      const dx = h.x - player.x, dy = h.y - player.y, d = Math.hypot(dx, dy) || 1;
      h.x += (dx / d) * 40; h.y += (dy / d) * 40;
      message((RACE.hitMessage || "🚧 Watch out! -{n}s").replace("{n}", RACE.hitPenalty || 3));
    }
  });

  const cp = race.cps[race.idx];
  if (race.arrow && cp) {
    const ang = Math.atan2(cp.y - player.y, cp.x - player.x);
    race.arrow.x = player.x + Math.cos(ang) * 64;
    race.arrow.y = player.y - 74 + Math.sin(ang) * 40;
    race.arrow.rotation = ang + Math.PI / 2;
  }

  if (cp && Math.hypot(cp.x - player.x, cp.y - player.y) < cp.r) {
    if (cp.g) cp.g.clear(); if (cp.flag) cp.flag.setVisible(false);
    race.idx++;
    if (race.idx >= race.cps.length) { endRace(true); return; }
    sc.cameras.main.flash(120, 80, 240, 160);
    drawCheckpoint(race.cps[race.idx], true);
    message((RACE.checkpointMessage || "✅ Checkpoint {n}/{t}!").replace("{n}", race.idx).replace("{t}", race.cps.length));
  }

  raceHudUpdate();
  if (race.time <= 0) endRace(false);
}

function endRace(win, silent) {
  if (!race) return;
  const r = race; race = null;
  r.objs.forEach((o) => o && o.destroy());
  raceHudHide();
  if (sc && r.baseZoom != null) sc.tweens.add({ targets: sc.cameras.main, zoom: r.baseZoom, duration: 450, ease: "Quad.easeOut" });
  if (win) {
    const reward = RACE.reward || 0;
    if (reward) state.coins += reward;
    if (statKeys().includes("raceWin")) state.stats.raceWin = (state.stats.raceWin || 0) + 1;
    save(); refreshHud();
    message((RACE.winMessage || "🏆 Race won! +{r}").replace("{r}", reward));
  } else if (!silent) {
    message(RACE.loseMessage || "⏱ Time's up! Race over.");
  }
  panelId = PANEL_DIRTY; refreshInteraction();
}

// Race HUD (timer + checkpoint progress) — a small self-contained DOM overlay.
function raceHudShow() {
  let el = $("race-hud");
  if (!el) { el = document.createElement("div"); el.id = "race-hud"; el.className = "race-hud"; document.body.appendChild(el); }
  el.classList.remove("hidden");
  raceHudUpdate();
}
function raceHudUpdate() {
  const el = $("race-hud"); if (!el || !race) return;
  const t = Math.max(0, race.time);
  el.innerHTML = `<span class="rh-t${t <= 8 ? " low" : ""}">⏱ ${t.toFixed(1)}s</span><span class="rh-cp">🏁 ${race.idx}/${race.cps.length}</span>`;
}
function raceHudHide() { const el = $("race-hud"); if (el) el.classList.add("hidden"); }

/* ===================== Boot ===================== */

document.addEventListener("DOMContentLoaded", init);
