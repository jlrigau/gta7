/*
 * GTA 7 · Neon City — all game art as parametric SVG (rendered to WebP/PNG).
 *   node .claude/skills/_shared/render-svg.cjs tools/art/neon.cjs [--only car,player_]
 * One source of truth per thing:
 *   car()      top-down car (player car sheet, police sheet)      → frame 128, nose = heading
 *   carBack()  the same car from behind (race view, app icon, car icon)
 *   carSide()  the same car in profile (dealer showroom, logo, splash, stunt icon)
 *   person()   the two playable characters (walk sheets, thumbs, splash)
 *   tower()    neon buildings (world towers, race billboards, splash skyline)
 * All art is original, generated, CC0.
 */
const K = require("../../.claude/skills/_shared/svg-kit.cjs");
const IK = require("../../.claude/skills/_shared/icon-kit.cjs");
const { sheet, job, shade, mix, lin, rad, glow, blur, rng, star } = K;

const INK = "#1c1633";                       // deep navy outline, everywhere
const CYAN = "#35e6ff", PINK = "#ff4fa0", VIOLET = "#9a6bff", YELLOW = "#ffd24a", ORANGE = "#ff9f43";
const ASPH = "#2b2f4d";                       // road base colour (shared by all road tiles)
const stk = (w, c) => `stroke="${c || INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f2 = (n) => (+n).toFixed(2);

// smooth closed Catmull-Rom path through points
function smooth(pts) {
  const n = pts.length; let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (i === 0) d += `M${f2(p1[0])} ${f2(p1[1])}`;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return d + "Z";
}
// symmetric shape around x = cx from right-side half points [dx, y] (top centre → bottom centre)
function symPts(cx, half) {
  const R = half.map(([dx, y]) => [cx + dx, y]);
  const L = half.slice(1, -1).reverse().map(([dx, y]) => [cx - dx, y]);
  return R.concat(L);
}
// a neon tube: coloured glow + bright core
function neon(d, c, w, u, fill) {
  return `<path d="${d}" fill="${fill || "none"}" stroke="${c}" stroke-width="${w * 2.2}" stroke-linecap="round" stroke-linejoin="round" opacity=".55" filter="url(#${u})"/>` +
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${mix(c, "#ffffff", 0.7)}" stroke-width="${Math.max(0.8, w * 0.38)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// the "7" glyph as a stroke path, centred on (cx,cy), size r
const SEVEN = (cx, cy, r) => `M${cx - r * 0.42} ${cy - r * 0.5} H${cx + r * 0.44} L${cx - r * 0.08} ${cy + r * 0.56}`;
function badge7(cx, cy, r, u) {   // neon "7" badge (needs glow filter `${u}`)
  let g = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1a1140" stroke="${INK}" stroke-width="${r * 0.12}"/>`;
  g += neon(`M${cx} ${cy - r * 0.8} A${r * 0.8} ${r * 0.8} 0 1 1 ${cx - 0.01} ${cy - r * 0.8}`, YELLOW, r * 0.09, u);
  g += neon(SEVEN(cx, cy, r * 0.95), PINK, r * 0.2, u);
  return g;
}

/* ============================ CARS ============================ */
// Top-down car, nose pointing UP in a 128×128 frame, length 100 (y 14..114), body width 54
// (64 with wheels/mirrors). dir rotates it; the drop shadow stays in screen space.
// opts: { police } ; frame 0/1 = idle (headlight glint / light-bar flash)
const CAR_HALF = [[0, 14], [13, 14.6], [21, 17.5], [25.5, 24], [27, 34], [27, 46], [25.5, 58], [25, 68], [26.5, 80], [27.5, 92], [26.5, 104], [22, 110.8], [13, 113.4], [0, 114]];
const CAR_D = smooth(symPts(64, CAR_HALF));
function car(o, dir, frame, u) {
  const ang = { up: 0, left: -90, down: 180, right: 90 }[dir];
  const P = !!o.police;
  const B = P ? "#f4f6fc" : "#e6e8f0";
  const defs = lin(`${u}b`, [[0, shade(B, -0.3)], [0.2, shade(B, -0.06)], [0.5, shade(B, 0.55)], [0.8, shade(B, -0.06)], [1, shade(B, -0.3)]], 0, 0, 1, 0) +
    lin(`${u}r`, [[0, shade(B, 0.5)], [1, shade(B, -0.12)]], 0, 0, 1, 1) +
    lin(`${u}g`, [[0, "#41508f"], [0.6, "#1d2350"], [1, "#141838"]]) +
    lin(`${u}n`, [[0, "#3a4aa8"], [1, "#1f2766"]], 0, 0, 1, 0) +
    blur(`${u}sh`, 2.6) + glow(`${u}gl`, 2) +
    `<clipPath id="${u}cp"><path d="${CAR_D}"/></clipPath>`;
  let g = "";
  // screen-space drop shadow
  g += `<g transform="translate(2 4)"><g transform="rotate(${ang} 64 64)"><path d="${CAR_D}" fill="#08051a" opacity=".42" filter="url(#${u}sh)"/></g></g>`;
  g += `<g transform="rotate(${ang} 64 64)">`;
  // wheels (peek out of the body)
  [[28, 46], [80, 98]].forEach(([y0, y1]) => [-1, 1].forEach((s) => {
    const x = s > 0 ? 64 + 21.5 : 64 - 31;
    g += `<rect x="${x}" y="${y0}" width="9.5" height="${y1 - y0}" rx="3.5" fill="#1e1b30" ${stk(2.2)}/>`;
    for (let k = 1; k < 4; k++) g += `<path d="M${x + 2} ${y0 + k * (y1 - y0) / 4} h5.5" stroke="#4a4766" stroke-width="1.6"/>`;
  }));
  // mirrors
  [-1, 1].forEach((s) => { g += `<ellipse cx="${64 + s * 29.5}" cy="47" rx="4.6" ry="2.8" fill="${B}" ${stk(2)}/>`; });
  // body
  g += `<path d="${CAR_D}" fill="url(#${u}b)"/>`;
  g += `<g clip-path="url(#${u}cp)">`;
  if (P) {   // navy hood + trunk, white cabin band, side stripes
    g += `<rect x="30" y="0" width="70" height="40" fill="url(#${u}n)"/><rect x="30" y="93" width="70" height="30" fill="url(#${u}n)"/>`;
    g += `<rect x="30" y="38" width="70" height="3" fill="${CYAN}" opacity=".9"/><rect x="30" y="92" width="70" height="2.5" fill="${CYAN}" opacity=".9"/>`;
    g += `<path d="${star(64, 26, 7.5, 3.4)}" fill="${YELLOW}" ${stk(1.4)}/>`;
  }
  // side sill shading + gloss
  g += `<path d="M38 30 Q36 70 40 108" fill="none" stroke="#fff" stroke-width="2.2" opacity=".55"/>`;
  g += `</g>`;
  g += `<path d="${CAR_D}" fill="none" ${stk(3)}/>`;
  // hood creases + gloss
  if (!P) g += `<path d="M54 20 Q53 30 54 39 M74 20 Q75 30 74 39" fill="none" stroke="${shade(B, -0.28)}" stroke-width="1.5" stroke-linecap="round"/>`;
  g += `<ellipse cx="49" cy="29" rx="3.2" ry="8" fill="#fff" opacity="${P ? 0.35 : 0.8}"/>`;
  // windshield, side windows, roof, rear window
  g += `<path d="M42.5 41.5 Q64 36 85.5 41.5 L82.5 57 Q64 53.5 45.5 57 Z" fill="url(#${u}g)" ${stk(2.4)}/>`;
  g += `<path d="M48 44 L56 40.5 L52 54.5 L47 55.5 Z" fill="#9fdcff" opacity=".45"/>`;
  [-1, 1].forEach((s) => { g += `<path d="M${64 + s * 22.5} 46 Q${64 + s * 24} 66 ${64 + s * 22.5} 85 L${64 + s * 19.8} 83 Q${64 + s * 20.8} 66 ${64 + s * 19.8} 48 Z" fill="url(#${u}g)" ${stk(1.8)}/>`; });
  g += `<path d="M45.5 58 Q64 55 82.5 58 L82.5 81 Q64 83.5 45.5 81 Z" fill="url(#${u}r)" ${stk(2.4)}/>`;
  g += `<path d="M50 61 Q51 70 50 78" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="${frame ? 0.95 : 0.7}"/>`;
  g += `<path d="M46 82.5 Q64 85 82 82.5 L79.5 93 Q64 96 48.5 93 Z" fill="url(#${u}g)" ${stk(2.4)}/>`;
  g += `<path d="M52 85 L58 85.6 L55.5 91.5 L51 91 Z" fill="#9fdcff" opacity=".4"/>`;
  if (P) {   // light bar across the roof: frame 0 red (left) lit, frame 1 blue (right) lit
    const redOn = frame === 0;
    g += `<circle cx="${redOn ? 54 : 74}" cy="69" r="16" fill="${redOn ? "#ff3355" : "#3d8bff"}" opacity=".45" filter="url(#${u}sh)"/>`;
    g += `<rect x="45" y="65" width="38" height="9" rx="4.5" fill="#2a2d55" ${stk(2.2)}/>`;
    g += `<rect x="47" y="66.5" width="16" height="6" rx="3" fill="${redOn ? "#ff5a74" : "#8a2235"}"/>`;
    g += `<rect x="65" y="66.5" width="16" height="6" rx="3" fill="${redOn ? "#1e3f8a" : "#5aa8ff"}"/>`;
    g += `<rect x="${redOn ? 49 : 67}" y="67.5" width="8" height="2" rx="1" fill="#fff" opacity=".85"/>`;
  }
  // trunk lip, tail-lights, headlights
  g += `<path d="M44 104 Q64 107 84 104" fill="none" stroke="${P ? "#141a4a" : shade(B, -0.3)}" stroke-width="1.6" stroke-linecap="round"/>`;
  [-1, 1].forEach((s) => {
    g += `<path d="M${64 + s * 13} 108.5 L${64 + s * 22} 106.5 Q${64 + s * 24} 108 ${64 + s * 21} 111 L${64 + s * 13} 112.2 Z" fill="#ff2e5e" ${stk(1.6)}/>`;
    g += `<ellipse cx="${64 + s * 15.5}" cy="18.6" rx="6" ry="2.9" transform="rotate(${-s * 14} ${64 + s * 15.5} 18.6)" fill="${frame ? "#fffbe6" : "#fff0b0"}" ${stk(1.6)}/>`;
  });
  if (frame) g += `<path d="${star(46.5, 18, 5.5, 1.4, 4)}" fill="#fff" filter="url(#${u}gl)"/>`;
  g += `</g>`;
  return { defs, body: g };
}
function carSheet(file, o) {
  let defs = ""; const frames = [];
  ["up", "left", "down", "right"].forEach((d, r) => [0, 1].forEach((f) => { const res = car(o, d, f, `c${r}${f}`); defs += res.defs; frames.push(res.body); }));
  return job(file, 256, 512, sheet(frames, 128, 128, 2), defs);
}

// The same car from BEHIND, in a 200×130 box (light neutral body: tinted per variant).
// opts: { body, sw (outline), u, lights (glow) }
function carBack(o) {
  const u = o.u || "cb", B = o.body || "#e6e8f0", sw = o.sw || 3.5, s2 = sw * 0.65;
  const defs = lin(`${u}b`, [[0, shade(B, 0.45)], [0.5, B], [1, shade(B, -0.25)]]) +
    lin(`${u}h`, [[0, shade(B, -0.28)], [0.25, shade(B, 0.1)], [0.5, shade(B, 0.5)], [0.75, shade(B, 0.1)], [1, shade(B, -0.28)]], 0, 0, 1, 0) +
    lin(`${u}g`, [[0, "#41508f"], [0.6, "#1d2350"], [1, "#141838"]]) + glow(`${u}gl`, 3) + blur(`${u}bl`, 3);
  let g = `<ellipse cx="100" cy="119" rx="90" ry="8" fill="#08051a" opacity=".4" filter="url(#${u}bl)"/>`;
  // tyres
  [[22, 52], [148, 178]].forEach(([a, b]) => { g += `<rect x="${a}" y="88" width="${b - a}" height="34" rx="9" fill="#1e1b30" ${stk(sw)}/><path d="M${a + 6} 112 H${b - 6}" stroke="#4a4766" stroke-width="${s2}" stroke-linecap="round"/>`; });
  // cabin + rear window
  g += `<path d="M46 58 L60 22 Q63 14 72 14 L128 14 Q137 14 140 22 L154 58 Z" fill="url(#${u}h)" ${stk(sw)}/>`;
  g += `<path d="M58 52 L68 25 Q70 21 75 21 L125 21 Q130 21 132 25 L142 52 Z" fill="url(#${u}g)" ${stk(s2)}/>`;
  g += `<path d="M72 26 L88 26 L76 48 L64 48 Z" fill="#9fdcff" opacity=".35"/>`;
  // lower body
  g += `<path d="M12 72 Q12 56 32 54 L168 54 Q188 56 188 72 L189 98 Q189 110 176 110 L24 110 Q11 110 11 98 Z" fill="url(#${u}b)" ${stk(sw)}/>`;
  g += `<path d="M30 60 H170" stroke="#fff" stroke-width="${s2}" stroke-linecap="round" opacity=".7"/>`;
  // spoiler lip
  g += `<path d="M40 56 Q100 50 160 56" fill="none" stroke="${shade(B, -0.35)}" stroke-width="${s2}" stroke-linecap="round"/>`;
  // tail-lights + light bar
  [[18, 66], [134, 182]].forEach(([a, b]) => {
    if (o.lights !== false) g += `<rect x="${a}" y="66" width="${b - a}" height="12" rx="6" fill="#ff2e5e" opacity=".6" filter="url(#${u}gl)"/>`;
    g += `<rect x="${a}" y="66" width="${b - a}" height="12" rx="6" fill="#ff2e5e" ${stk(s2)}/><rect x="${a + 5}" y="68.5" width="${(b - a) * 0.45}" height="3.5" rx="1.7" fill="#ffb3c3"/>`;
  });
  g += `<path d="M68 72 H132" stroke="#ff2e5e" stroke-width="${sw * 0.9}" stroke-linecap="round"/>`;
  // plate + bumper + exhausts
  g += `<rect x="80" y="80" width="40" height="15" rx="3" fill="#f4f6ff" ${stk(s2)}/>`;
  g += `<path d="M90 87.5 h20" stroke="#8a8fb0" stroke-width="${s2 * 0.9}" stroke-linecap="round"/>`;
  g += `<path d="M14 99 H186" stroke="${shade(B, -0.45)}" stroke-width="${s2}"/>`;
  [62, 138].forEach((x) => { g += `<ellipse cx="${x}" cy="104" rx="7" ry="4" fill="#3a3757" ${stk(s2)}/><ellipse cx="${x}" cy="104" rx="3.5" ry="1.8" fill="#0d0b1c"/>`; });
  return { defs, body: g };
}

// Map the y of every point of an ABSOLUTE M/L/Q/C/T/S/V path through fy (H, Z untouched).
function mapY(d, fy) {
  const toks = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let out = "", cmd = "", i = 0;
  for (const t of toks) {
    if (/[A-Za-z]/.test(t)) { cmd = t; i = 0; out += t; continue; }
    let v = +t;
    if (cmd === "V" || ("MLQCTS".includes(cmd) && i % 2 === 1)) v = fy(v);
    out += (i ? " " : "") + f2(v); i++;
  }
  return out;
}
// The same car in PROFILE (facing right) in a 320×120 box. opts: { body, stripe, sw, u, glass,
//   hk (body height factor about the axle line y 98 — chunkier close-up car), wk (wheel size
//   factor), noShine }. Defaults draw exactly the classic profile. Returns bodyD
//   (the body outline, for clip paths) and Y (design y → drawn y).
function carSide(o) {
  const u = o.u || "cs", B = o.body || "#ff4fa0", sw = o.sw || 4, s2 = sw * 0.65, S = o.stripe || CYAN;
  const hk = o.hk || 1, wk = o.wk || 1;
  const Y = hk === 1 ? (y) => y : (y) => +f2(98 - (98 - y) * hk);
  const T = hk === 1 ? (d) => d : (d) => mapY(d, Y);
  const defs = lin(`${u}b`, [[0, shade(B, 0.45)], [0.45, B], [1, shade(B, -0.35)]]) +
    lin(`${u}g`, [[0, "#4a5ba8"], [0.6, "#1d2350"], [1, "#141838"]]) +
    rad(`${u}w`, [[0, "#ffffff"], [0.55, "#c9cfe4"], [1, "#6d7393"]], 0.4, 0.35, 0.7) + glow(`${u}gl`, 3) + blur(`${u}bl`, 3);
  let g = `<ellipse cx="160" cy="${98 + 16 * wk}" rx="148" ry="6" fill="#08051a" opacity=".45" filter="url(#${u}bl)"/>`;
  const body = T(`M18 88 Q14 66 36 62 L96 54 Q120 26 160 24 L198 24 Q226 26 250 52 L292 58 Q308 62 306 82 L304 94 Q302 100 294 100 L24 100 Q14 98 18 88 Z`);
  g += `<path d="${body}" fill="url(#${u}b)" ${stk(sw)}/>`;
  // windows
  g += `<path d="${T("M110 54 Q128 32 158 31 L174 31 L174 54 Z")}" fill="url(#${u}g)" ${stk(s2)}/>`;
  g += `<path d="${T("M182 31 L198 31 Q222 33 238 54 L182 54 Z")}" fill="url(#${u}g)" ${stk(s2)}/>`;
  g += `<path d="${T("M128 50 L146 34 L156 34 L138 50 Z M196 50 L208 34 L214 35 L203 50 Z")}" fill="#9fdcff" opacity=".4"/>`;
  // shine + neon stripe + door
  if (!o.noShine) g += `<path d="${T("M40 66 Q120 58 250 58 L292 63")}" fill="none" stroke="#fff" stroke-width="${s2}" stroke-linecap="round" opacity=".75"/>`;
  g += `<path d="${T("M24 80 L300 78")}" stroke="${S}" stroke-width="${sw * 1.3}" stroke-linecap="round" opacity=".55" filter="url(#${u}gl)"/><path d="${T("M24 80 L300 78")}" stroke="${S}" stroke-width="${sw * 0.9}" stroke-linecap="round"/>`;
  g += `<path d="${T("M176 56 L178 98 M112 58 L110 98")}" stroke="${shade(B, -0.45)}" stroke-width="${s2 * 0.8}"/><rect x="186" y="${Y(64)}" width="16" height="4" rx="2" fill="${shade(B, -0.4)}"/>`;
  // lights
  g += `<path d="${T("M290 62 Q304 64 305 74 L292 72 Z")}" fill="#fff6c8" ${stk(s2)}/><ellipse cx="300" cy="${Y(69)}" rx="10" ry="6" fill="#fff6c8" opacity=".5" filter="url(#${u}gl)"/>`;
  g += `<path d="${T("M20 70 Q20 64 30 63 L32 74 L20 76 Z")}" fill="#ff2e5e" ${stk(s2)}/>`;
  g += `<path d="${T("M26 58 L56 56 L52 62 L30 64 Z")}" fill="${shade(B, -0.3)}" ${stk(s2)}/>`;   // spoiler
  // wheels (dark wells first so the arches read)
  [82, 246].forEach((x) => {
    g += `<circle cx="${x}" cy="96" r="${28 * wk}" fill="#151228"/>`;
    g += `<circle cx="${x}" cy="98" r="${21 * wk}" fill="#1e1b30" ${stk(sw)}/><circle cx="${x}" cy="98" r="${12 * wk}" fill="url(#${u}w)" ${stk(s2)}/>`;
    for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; g += `<path d="M${x} 98 L${f2(x + Math.cos(a) * 10 * wk)} ${f2(98 + Math.sin(a) * 10 * wk)}" stroke="#8a90aa" stroke-width="${s2 * 0.8}" stroke-linecap="round"/>`; }
    g += `<circle cx="${x}" cy="98" r="${3.6 * wk}" fill="${S}" ${stk(s2 * 0.6)}/>`;
  });
  return { defs, body: g, bodyD: body, Y };
}

/* ============================ PEOPLE ============================ */
const PEOPLE = {
  man:   { name: "Marco", skin: "#f0c29e", hair: "#2a1d1a", style: "cap", cap: "#2fd3e6", jacket: "#4b5bd6", trim: "#ff9f43", tee: "#ffffff", jeans: "#2f4a86", stripe: CYAN, kind: "bomber" },
  woman: { name: "Nadia", skin: "#c98a62", hair: "#3b2130", hairHi: "#7a3a8a", style: "ponytail", jacket: "#d63c86", trim: "#a3285f", tee: "#2b2550", jeans: "#3a5aa0", stripe: PINK, kind: "leather", tie: YELLOW },
};
// Head pieces. view: "down" | "up" | "left" (right = mirrored). layer: "back" | "front"
function personHair(k, cx, cy, r, view, layer, sway) {
  const H = k.hair, st = stk(3);
  if (k.style === "cap") {
    const C = k.cap, CD = shade(C, -0.25);
    if (view === "up") {
      if (layer === "back") return "";
      // ears + skin head, short tufted hair down to the nape, cap on top
      let g = `<ellipse cx="${cx - r}" cy="${cy + 3}" rx="5" ry="7" fill="${k.skin}" ${st}/><ellipse cx="${cx + r}" cy="${cy + 3}" rx="5" ry="7" fill="${k.skin}" ${st}/>`;
      g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${shade(k.skin, -0.08)}" ${st}/>`;
      let hd = `M${cx - r * 0.99} ${cy - r * 0.05} Q${cx - r * 1.0} ${cy + r * 0.45} ${cx - r * 0.78} ${cy + r * 0.6}`;
      [-0.52, -0.26, 0, 0.26, 0.52, 0.78].forEach((t, i) => { hd += ` Q${cx + (t - 0.13) * r} ${cy + r * 0.5} ${cx + t * r} ${cy + r * (i % 2 ? 0.74 : 0.7)}`; });
      hd += ` Q${cx + r * 1.0} ${cy + r * 0.45} ${cx + r * 0.99} ${cy - r * 0.05} Z`;
      g += `<path d="${hd}" fill="${shade(H, 0.12)}" ${st}/>`;
      g += `<path d="M${cx - r * 0.5} ${cy + r * 0.1} q2 ${r * 0.25} 0 ${r * 0.4} M${cx} ${cy + r * 0.12} q2 ${r * 0.25} 0 ${r * 0.42} M${cx + r * 0.5} ${cy + r * 0.1} q-2 ${r * 0.25} 0 ${r * 0.4}" fill="none" stroke="${shade(H, 0.35)}" stroke-width="2" stroke-linecap="round"/>`;
      g += `<path d="M${cx - r * 1.05} ${cy - r * 0.05} A${r * 1.05} ${r * 1.05} 0 0 1 ${cx + r * 1.05} ${cy - r * 0.05} Q${cx} ${cy + r * 0.12} ${cx - r * 1.05} ${cy - r * 0.05} Z" fill="${C}" ${st}/>`;
      g += `<path d="M${cx - r * 0.26} ${cy - r * 0.02} Q${cx} ${cy - r * 0.34} ${cx + r * 0.26} ${cy - r * 0.02} Z" fill="${H}" ${stk(2.2)}/>`;   // snapback opening
      g += `<rect x="${cx - r * 0.3}" y="${cy - r * 0.12}" width="${r * 0.6}" height="${r * 0.12}" rx="1.5" fill="${CD}" ${stk(1.6)}/>`;
      g += `<path d="M${cx - r * 0.6} ${cy - r * 0.62} Q${cx} ${cy - r * 0.92} ${cx + r * 0.6} ${cy - r * 0.62}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
      g += `<circle cx="${cx}" cy="${cy - r * 1.02}" r="${r * 0.12}" fill="${CD}" ${stk(2)}/>`;
      return g;
    }
    if (view === "down") {
      if (layer === "back") return `<path d="M${cx - r * 1.04} ${cy + r * 0.1} Q${cx - r * 1.1} ${cy - r * 0.5} ${cx - r * 0.8} ${cy - r * 0.6} L${cx + r * 0.8} ${cy - r * 0.6} Q${cx + r * 1.1} ${cy - r * 0.5} ${cx + r * 1.04} ${cy + r * 0.1} Z" fill="${H}" ${st}/>`;
      let g = `<path d="M${cx - r * 0.98} ${cy - r * 0.05} Q${cx - r * 0.9} ${cy - r * 0.45} ${cx - r * 0.6} ${cy - r * 0.4} L${cx - r * 0.75} ${cy + r * 0.12} Z M${cx + r * 0.98} ${cy - r * 0.05} Q${cx + r * 0.9} ${cy - r * 0.45} ${cx + r * 0.6} ${cy - r * 0.4} L${cx + r * 0.75} ${cy + r * 0.12} Z" fill="${H}" ${stk(2)}/>`;
      g += `<path d="M${cx - r * 1.04} ${cy - r * 0.3} A${r * 1.04} ${r * 0.94} 0 0 1 ${cx + r * 1.04} ${cy - r * 0.3} Z" fill="${C}" ${st}/>`;
      g += `<path d="M${cx - r * 0.55} ${cy - r * 0.78} Q${cx} ${cy - r * 1.0} ${cx + r * 0.55} ${cy - r * 0.78}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
      g += `<path d="${star(cx, cy - r * 0.64, r * 0.2, r * 0.09)}" fill="${PINK}" ${stk(1.5)}/>`;
      g += `<path d="M${cx - r * 1.0} ${cy - r * 0.3} Q${cx} ${cy + r * 0.02} ${cx + r * 1.0} ${cy - r * 0.3} Q${cx} ${cy - r * 0.48} ${cx - r * 1.0} ${cy - r * 0.3} Z" fill="${CD}" ${st}/>`;   // brim
      return g;
    }
    // side, facing left
    if (layer === "back") return "";
    let g = `<path d="M${cx - r * 0.1} ${cy - r * 0.4} Q${cx + r * 0.7} ${cy - r * 0.5} ${cx + r * 0.98} ${cy - r * 0.1} Q${cx + r * 1.0} ${cy + r * 0.45} ${cx + r * 0.62} ${cy + r * 0.7} Q${cx + r * 0.3} ${cy + r * 0.1} ${cx - r * 0.1} ${cy - r * 0.1} Z" fill="${H}" ${st}/>`;
    g += `<path d="M${cx - r * 1.0} ${cy - r * 0.3} A${r * 1.04} ${r * 0.95} 0 0 1 ${cx + r * 1.04} ${cy - r * 0.22} Q${cx} ${cy - r * 0.4} ${cx - r * 1.0} ${cy - r * 0.3} Z" fill="${C}" ${st}/>`;
    g += `<path d="M${cx - r * 0.95} ${cy - r * 0.34} L${cx - r * 1.62} ${cy - r * 0.22} Q${cx - r * 1.7} ${cy - r * 0.06} ${cx - r * 1.4} ${cy - r * 0.06} L${cx - r * 0.85} ${cy - r * 0.16} Z" fill="${CD}" ${st}/>`;
    g += `<path d="M${cx - r * 0.5} ${cy - r * 0.78} Q${cx} ${cy - r * 1.0} ${cx + r * 0.5} ${cy - r * 0.78}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
    g += `<circle cx="${cx + r * 0.05}" cy="${cy - r * 1.12}" r="${r * 0.1}" fill="${CD}" ${stk(2)}/>`;
    return g;
  }
  // ponytail
  const HH = k.hairHi, T = k.tie;
  if (view === "up") {
    if (layer === "back") return "";
    let g = `<ellipse cx="${cx - r}" cy="${cy + 3}" rx="5" ry="7" fill="${k.skin}" ${st}/><ellipse cx="${cx + r}" cy="${cy + 3}" rx="5" ry="7" fill="${k.skin}" ${st}/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="${r + 1}" fill="${H}" ${st}/>`;
    g += `<path d="M${cx - r * 0.75} ${cy - r * 0.45} Q${cx - r * 0.4} ${cy - r * 0.05} ${cx - 3} ${cy + r * 0.08} M${cx + r * 0.75} ${cy - r * 0.45} Q${cx + r * 0.4} ${cy - r * 0.05} ${cx + 3} ${cy + r * 0.08} M${cx - r * 0.3} ${cy - r * 0.85} Q${cx - r * 0.1} ${cy - r * 0.3} ${cx - 1} ${cy + r * 0.05}" fill="none" stroke="${HH}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`;
    g += `<path d="M${cx - 8 + sway} ${cy + r * 0.1} Q${cx - 14 + sway} ${cy + r * 1.0} ${cx + sway * 2} ${cy + r * 1.5} Q${cx + 14 + sway} ${cy + r * 1.0} ${cx + 8 + sway} ${cy + r * 0.1} Z" fill="${H}" ${st}/>`;
    g += `<path d="M${cx - 2 + sway} ${cy + r * 0.4} Q${cx + sway} ${cy + r * 1.0} ${cx + sway * 2} ${cy + r * 1.3}" fill="none" stroke="${HH}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`;
    g += `<ellipse cx="${cx + sway * 0.5}" cy="${cy + r * 0.12}" rx="7" ry="4.5" fill="${T}" ${stk(2.2)}/>`;
    return g;
  }
  if (view === "down") {
    if (layer === "back") return `<path d="M${cx + r * 0.7} ${cy - r * 0.55} Q${cx + r * 1.65 + sway} ${cy - r * 0.2} ${cx + r * 1.3 + sway} ${cy + r * 1.05} Q${cx + r * 1.0 + sway} ${cy + r * 0.5} ${cx + r * 0.75} ${cy + r * 0.2} Z" fill="${H}" ${st}/><ellipse cx="${cx + r * 0.98}" cy="${cy - r * 0.4}" rx="4.5" ry="6.5" fill="${T}" ${stk(2)}/>`;
    let g = `<path d="M${cx - r * 1.05} ${cy + r * 0.25} Q${cx - r * 1.12} ${cy - r * 1.15} ${cx + r * 0.05} ${cy - r * 1.1} Q${cx + r * 1.1} ${cy - r * 1.12} ${cx + r * 1.04} ${cy + r * 0.05} Q${cx + r * 0.85} ${cy - r * 0.55} ${cx + r * 0.25} ${cy - r * 0.5} Q${cx - r * 0.35} ${cy - r * 0.48} ${cx - r * 0.8} ${cy - r * 0.05} Q${cx - r * 0.9} ${cy + r * 0.15} ${cx - r * 1.05} ${cy + r * 0.25} Z" fill="${H}" ${st}/>`;
    g += `<path d="M${cx - r * 0.55} ${cy - r * 0.78} Q${cx} ${cy - r * 1.0} ${cx + r * 0.45} ${cy - r * 0.82}" fill="none" stroke="${HH}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
    return g;
  }
  // side facing left: hair cap over the back half + ponytail behind (right)
  if (layer === "back") return `<path d="M${cx + r * 0.75} ${cy - r * 0.5} Q${cx + r * 1.8} ${cy - r * 0.35 + sway} ${cx + r * 1.55} ${cy + r * 0.95 + sway} Q${cx + r * 1.2} ${cy + r * 0.4} ${cx + r * 0.85} ${cy + r * 0.1} Z" fill="${H}" ${st}/>`;
  let g = `<path d="M${cx - r * 0.85} ${cy - r * 0.55} Q${cx - r * 0.2} ${cy - r * 1.25} ${cx + r * 0.75} ${cy - r * 0.8} Q${cx + r * 1.12} ${cy - r * 0.2} ${cx + r * 0.85} ${cy + r * 0.55} Q${cx + r * 0.62} ${cy + r * 0.8} ${cx + r * 0.42} ${cy + r * 0.6} Q${cx + r * 0.3} ${cy} ${cx - r * 0.05} ${cy - r * 0.38} Q${cx - r * 0.5} ${cy - r * 0.3} ${cx - r * 0.85} ${cy - r * 0.55} Z" fill="${H}" ${st}/>`;
  g += `<path d="M${cx - r * 0.4} ${cy - r * 0.82} Q${cx + r * 0.3} ${cy - r * 1.05} ${cx + r * 0.75} ${cy - r * 0.6}" fill="none" stroke="${HH}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
  g += `<ellipse cx="${cx + r * 0.88}" cy="${cy - r * 0.5}" rx="4.5" ry="6.5" fill="${T}" ${stk(2)}/>`;
  return g;
}
// A character in a 128×128 frame; feet (sole bottom) ≈ y 120. dir: up|left|down|right
function person(k, dir, phase, moving, u) {
  const step = moving ? Math.sin(phase) : 0, bob = moving ? -Math.abs(Math.sin(phase)) * 2.5 : 0;
  const cx = 64, hy = 37 + bob, r = 24, b = bob;
  const st = stk(3), J = k.jacket, JD = shade(J, -0.22), sway = moving ? Math.sin(phase) * 2 : 0;
  const defs = rad(`${u}s`, [[0, shade(k.skin, 0.2)], [1, k.skin]], 0.4, 0.35, 0.7) +
    lin(`${u}j`, [[0, shade(J, 0.22)], [0.6, J], [1, shade(J, -0.15)]], 0, 0, 1, 1) +
    lin(`${u}p`, [[0, shade(k.jeans, 0.12)], [1, shade(k.jeans, -0.12)]]);
  const side = dir === "left" || dir === "right";
  let g = "";
  // ---- legs + sneakers
  const sneakerFront = (x, y) => `<rect x="${x - 8}" y="${y}" width="16" height="9" rx="4.5" fill="#f6f7fb" ${st}/><path d="M${x - 5} ${y + 3.2} H${x + 5}" stroke="${k.stripe}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (side) {
    [1, -1].forEach((d) => {
      const a = d * step * 26;
      g += `<g transform="rotate(${f2(a)} ${cx} ${90 + b})"><rect x="${cx - 6}" y="${88 + b}" width="12" height="25" rx="6" fill="${d > 0 ? shade(k.jeans, -0.18) : `url(#${u}p)`}" ${st}/>`;
      g += `<path d="M${cx + 6} ${109 + b} L${cx + 6} ${118 + b} H${cx - 11} Q${cx - 16} ${118 + b} ${cx - 15} ${113.5 + b} Q${cx - 13} ${109 + b} ${cx - 5} ${109 + b} Z" fill="#f6f7fb" ${st}/><path d="M${cx - 9} ${113 + b} H${cx + 3}" stroke="${k.stripe}" stroke-width="2.4" stroke-linecap="round"/></g>`;
    });
  } else {
    [-1, 1].forEach((d) => {
      const lift = moving ? Math.max(0, d * step) * 6 : 0;
      g += `<rect x="${cx + d * 8.5 - 6}" y="${88 + b}" width="12" height="${24 - lift - b}" rx="6" fill="url(#${u}p)" ${st}/>`;
      g += sneakerFront(cx + d * 9, 110 - lift);
    });
  }
  // ---- arms
  const arm = (x, ang, front) => `<g transform="rotate(${f2(ang)} ${x} ${63 + b})"><rect x="${x - 6}" y="${60 + b}" width="12" height="27" rx="6" fill="${front ? `url(#${u}j)` : JD}" ${st}/><rect x="${x - 6}" y="${82 + b}" width="12" height="5" rx="2.5" fill="${k.trim}" ${stk(2)}/><circle cx="${x}" cy="${91 + b}" r="5.5" fill="${k.skin}" ${st}/></g>`;
  if (side) g += arm(cx + 3, -step * 30, false);
  else g += arm(cx - 21, 10 + step * 14, true) + arm(cx + 21, -10 - step * 14, true);
  // ---- torso (jacket)
  const tw = side ? 16 : 21;
  g += `<path d="M${cx - tw} ${60 + b} Q${cx} ${53 + b} ${cx + tw} ${60 + b} L${cx + tw + 1} ${93 + b} Q${cx} ${97 + b} ${cx - tw - 1} ${93 + b} Z" fill="url(#${u}j)" ${st}/>`;
  if (k.kind === "bomber") g += `<path d="M${cx - tw - 0.5} ${89 + b} Q${cx} ${93 + b} ${cx + tw + 0.5} ${89 + b} L${cx + tw + 1} ${94 + b} Q${cx} ${98 + b} ${cx - tw - 1} ${94 + b} Z" fill="${k.trim}" ${stk(2.2)}/>`;
  if (dir === "down") {
    g += `<path d="M${cx - 7} ${58 + b} L${cx + 7} ${58 + b} L${cx + 6} ${92 + b} L${cx - 6} ${92 + b} Z" fill="${k.tee}" ${stk(2.2)}/>`;
    if (k.kind === "bomber") g += `<path d="M${cx - 5} ${64 + b} L${cx + 5} ${64 + b}" stroke="${PINK}" stroke-width="3" stroke-linecap="round"/><path d="M${cx - 3.5} ${69 + b} L${cx + 3.5} ${69 + b}" stroke="${CYAN}" stroke-width="3" stroke-linecap="round"/>`;
    else g += `<path d="${star(cx, 70 + b, 4.5, 2)}" fill="${YELLOW}"/>`;
    // jacket front edges (zip) + lapels for the leather jacket
    g += `<path d="M${cx - 7} ${60 + b} L${cx - 6} ${93 + b} M${cx + 7} ${60 + b} L${cx + 6} ${93 + b}" stroke="${JD}" stroke-width="2.4"/>`;
    if (k.kind === "leather") g += `<path d="M${cx - 8} ${58 + b} L${cx - 14} ${60 + b} L${cx - 7} ${74 + b} Z M${cx + 8} ${58 + b} L${cx + 14} ${60 + b} L${cx + 7} ${74 + b} Z" fill="${k.trim}" ${stk(2.2)}/><path d="M${cx - 17} ${66 + b} Q${cx - 16} ${78 + b} ${cx - 15} ${86 + b}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`;
    else g += `<path d="M${cx - 16} ${66 + b} Q${cx - 15} ${76 + b} ${cx - 15} ${84 + b}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".4"/>`;
  } else if (dir === "up") {
    g += `<path d="${star(cx, 76 + b, 7.5, 3.4)}" fill="${k.kind === "bomber" ? CYAN : YELLOW}" ${stk(1.6)}/>`;
    g += `<path d="M${cx} ${60 + b} V${88 + b}" stroke="${JD}" stroke-width="2" opacity=".6"/>`;
  } else {
    g += `<path d="M${cx - 12} ${62 + b} Q${cx - 13} ${78 + b} ${cx - 12} ${90 + b}" stroke="${JD}" stroke-width="2.4"/>`;
  }
  // collar
  if (k.kind === "bomber") g += `<path d="M${cx - 13} ${57 + b} Q${cx} ${66 + b} ${cx + 13} ${57 + b}" fill="none" stroke="${INK}" stroke-width="8.5" stroke-linecap="round"/><path d="M${cx - 13} ${57 + b} Q${cx} ${66 + b} ${cx + 13} ${57 + b}" fill="none" stroke="${k.trim}" stroke-width="4" stroke-linecap="round"/>`;
  // neck (joins head and torso)
  g += `<rect x="${cx - 6.5}" y="${hy + r - 10}" width="13" height="${62 - (hy + r - 10) + b}" rx="4" fill="${shade(k.skin, -0.12)}" ${stk(2.4)}/>`;
  // ---- head
  if (dir === "up") {
    g += personHair(k, cx, hy, r, "up", "front", sway);
  } else if (dir === "down") {
    g += personHair(k, cx, hy, r, "down", "back", sway);
    g += `<ellipse cx="${cx - r}" cy="${hy + 3}" rx="5" ry="7" fill="${k.skin}" ${st}/><ellipse cx="${cx + r}" cy="${hy + 3}" rx="5" ry="7" fill="${k.skin}" ${st}/>`;
    g += `<circle cx="${cx}" cy="${hy}" r="${r}" fill="url(#${u}s)" ${st}/>`;
    // face
    const ey = hy + 4, ex = r * 0.37;
    [-1, 1].forEach((d) => {
      g += `<ellipse cx="${cx + d * ex}" cy="${ey}" rx="${r * 0.12}" ry="${r * 0.16}" fill="${INK}"/><circle cx="${cx + d * ex - 1}" cy="${ey - 1.6}" r="${r * 0.05}" fill="#fff"/>`;
      g += `<path d="M${cx + d * ex - 4.5} ${ey - 7.5} Q${cx + d * ex} ${ey - (k.style === "cap" ? 9.5 : 10)} ${cx + d * ex + 4.5} ${ey - 7.5}" fill="none" stroke="${shade(k.hair, 0.05)}" stroke-width="${k.style === "cap" ? 3.2 : 2.4}" stroke-linecap="round"/>`;
      if (k.style !== "cap") g += `<path d="M${cx + d * (ex + 2.6)} ${ey - 2.5} l${d * 2.6} -1.6" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
      g += `<ellipse cx="${cx + d * r * 0.6}" cy="${hy + r * 0.38}" rx="3.6" ry="2.2" fill="#ff7f9a" opacity=".45"/>`;
    });
    g += `<path d="M${cx - 1.5} ${hy + 8} Q${cx + 1} ${hy + 10.5} ${cx - 1} ${hy + 11.5}" fill="none" stroke="${shade(k.skin, -0.35)}" stroke-width="1.8" stroke-linecap="round"/>`;
    g += `<path d="M${cx - 6} ${hy + 15} Q${cx} ${hy + 20} ${cx + 6} ${hy + 15}" fill="none" ${stk(2.6)}/>`;
    if (k.tie) [-1, 1].forEach((d) => { g += `<circle cx="${cx + d * (r + 1)}" cy="${hy + 11}" r="2.6" fill="${YELLOW}" ${stk(1.4)}/>`; });
    g += personHair(k, cx, hy, r, "down", "front", sway);
  } else {
    let s = "";
    s += personHair(k, cx, hy, r, "left", "back", sway);
    s += `<circle cx="${cx}" cy="${hy}" r="${r}" fill="url(#${u}s)" ${st}/>`;
    s += `<path d="M${cx - r * 0.92} ${hy + r * 0.0} Q${cx - r * 1.2} ${hy + r * 0.16} ${cx - r * 0.95} ${hy + r * 0.32}" fill="${k.skin}" ${stk(2.6)}/>`;
    s += `<ellipse cx="${cx - r * 0.47}" cy="${hy + r * 0.12}" rx="${r * 0.11}" ry="${r * 0.15}" fill="${INK}"/><circle cx="${cx - r * 0.5}" cy="${hy + r * 0.05}" r="${r * 0.045}" fill="#fff"/>`;
    s += `<path d="M${cx - r * 0.66} ${hy - r * 0.18} Q${cx - r * 0.47} ${hy - r * 0.27} ${cx - r * 0.3} ${hy - r * 0.18}" fill="none" stroke="${k.hair}" stroke-width="2.6" stroke-linecap="round"/>`;
    s += `<ellipse cx="${cx - r * 0.5}" cy="${hy + r * 0.42}" rx="3.4" ry="2" fill="#ff7f9a" opacity=".45"/>`;
    s += `<path d="M${cx - r * 0.82} ${hy + r * 0.56} Q${cx - r * 0.66} ${hy + r * 0.66} ${cx - r * 0.52} ${hy + r * 0.56}" fill="none" ${stk(2.4)}/>`;
    s += personHair(k, cx, hy, r, "left", "front", sway);
    s += `<ellipse cx="${cx + r * 0.2}" cy="${hy + r * 0.12}" rx="${r * 0.13}" ry="${r * 0.18}" fill="${k.skin}" ${stk(2.6)}/>`;
    if (k.tie) s += `<circle cx="${cx + r * 0.2}" cy="${hy + r * 0.36}" r="2.6" fill="${YELLOW}" ${stk(1.4)}/>`;
    s += arm(cx - 1, step * 30, true);
    g += s;
  }
  return { defs, body: dir === "right" ? `<g transform="translate(128 0) scale(-1 1)">${g}</g>` : g };
}
function personSheet(id) {
  const k = PEOPLE[id], dirs = ["up", "left", "down", "right"];
  let defs = ""; const frames = [];
  dirs.forEach((d, r) => { for (let i = 0; i < 9; i++) { const res = person(k, d, ((i - 1) / 8) * Math.PI * 2, i > 0, `p${r}${i}`); defs += res.defs; frames.push(res.body); } });
  return job(`assets/sheet/player_${id}.png`, 128 * 9, 512, sheet(frames, 128, 128, 9), defs);
}
function personThumb(id) { const r = person(PEOPLE[id], "down", 0, false, "t"); return job(`assets/ui/${id}_thumb.png`, 128, 128, `<g transform="translate(64 66) scale(1.02) translate(-64 -66)">${r.body}</g>`, r.defs); }

/* ============================ ROAD TILES ============================ */
// draw an element at all wrap offsets so the tile is seamless
function wrapAll(W, H, fn) { let g = ""; for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) g += fn(ox, oy); return g; }
function asphaltBody(W, H, seed) {
  const R = rng(seed), n = Math.round(W * H / 90);
  let g = `<rect width="${W}" height="${H}" fill="${ASPH}"/>`;
  const items = [];
  for (let i = 0; i < Math.round(W * H / 4000); i++) items.push(`<ellipse cx="${R() * W}" cy="${R() * H}" rx="${18 + R() * 30}" ry="${10 + R() * 20}" fill="${R() < 0.5 ? "#353a5e" : "#24283f"}" opacity=".35"/>`);
  for (let i = 0; i < n; i++) { const c = R() < 0.55 ? "#3b4068" : "#1f2238"; items.push(`<circle cx="${f2(R() * W)}" cy="${f2(R() * H)}" r="${f2(0.5 + R() * 1.1)}" fill="${c}" opacity="${f2(0.5 + R() * 0.4)}"/>`); }
  const body = items.join("");
  g += `<g filter="url(#asb)">${wrapAll(W, H, (ox, oy) => `<g transform="translate(${ox} ${oy})">${body.split("<circle")[0]}</g>`)}</g>`;
  const dots = "<circle" + body.split("<circle").slice(1).join("<circle");
  g += wrapAll(W, H, (ox, oy) => `<g transform="translate(${ox} ${oy})">${dots}</g>`);
  return g;
}
const ASPH_DEFS = blur("asb", 6);
function asphalt() { return job("assets/img/asphalt.png", 256, 256, asphaltBody(256, 256, 7), ASPH_DEFS); }
function lane(vertical) {
  const W = 256, H = 32;
  let g = asphaltBody(W, H, 11);
  [[24, 104], [152, 232]].forEach(([a, b]) => { g += `<rect x="${a}" y="13" width="${b - a}" height="6" rx="3" fill="${YELLOW}" opacity=".35" filter="url(#lg)"/><rect x="${a}" y="13" width="${b - a}" height="6" rx="3" fill="#ffd24a"/><rect x="${a + 3}" y="14.2" width="${b - a - 6}" height="1.6" rx=".8" fill="#fff3b8" opacity=".8"/>`; });
  if (vertical) return job("assets/img/lane_v.png", H, W, `<g transform="translate(32 0) rotate(90)">${g}</g>`, ASPH_DEFS + glow("lg", 2));
  return job("assets/img/lane.png", W, H, g, ASPH_DEFS + glow("lg", 2));
}
function crosswalk() {
  const W = 64, H = 128;
  let g = asphaltBody(W, H, 5);
  const R = rng(4);
  [6, 38, 70, 102].forEach((y) => {
    g += `<rect x="7" y="${y}" width="50" height="20" rx="3" fill="#eef0fa"/>`;
    for (let i = 0; i < 6; i++) g += `<circle cx="${f2(10 + R() * 44)}" cy="${f2(y + 2 + R() * 16)}" r="${f2(0.6 + R() * 1.2)}" fill="#b9bdd6" opacity=".7"/>`;
    g += `<rect x="7" y="${y + 17}" width="50" height="3" rx="1.5" fill="#c9cde2"/>`;
  });
  return job("assets/img/crosswalk.png", W, H, g, ASPH_DEFS);
}
function sidewalk() {
  const S = 256, R = rng(13);
  let g = `<rect width="${S}" height="${S}" fill="#3f4263"/>`;
  for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) {
    const c = mix("#5c6087", "#6a6e96", R());
    g += `<rect x="${x + 2}" y="${y + 2}" width="60" height="60" rx="5" fill="${c}"/>`;
    g += `<path d="M${x + 4} ${y + 60} V${y + 6} Q${x + 4} ${y + 4} ${x + 6} ${y + 4} H${x + 60}" fill="none" stroke="#7d81aa" stroke-width="2" opacity=".7"/>`;
    g += `<path d="M${x + 5} ${y + 61} H${x + 59} Q${x + 61} ${y + 61} ${x + 61} ${y + 59} V${y + 5}" fill="none" stroke="#4a4d72" stroke-width="2"/>`;
    for (let i = 0; i < 14; i++) g += `<circle cx="${f2(x + 6 + R() * 52)}" cy="${f2(y + 6 + R() * 52)}" r="${f2(0.5 + R() * 1)}" fill="${R() < 0.5 ? "#7579a0" : "#4d5078"}"/>`;
  }
  return job("assets/img/sidewalk.png", S, S, g);
}
function grass() {
  const S = 256, R = rng(17);
  let items = "";
  for (let i = 0; i < 26; i++) items += `<ellipse cx="${f2(R() * S)}" cy="${f2(R() * S)}" rx="${f2(16 + R() * 26)}" ry="${f2(10 + R() * 16)}" fill="${R() < 0.5 ? "#3a8a63" : "#286a4a"}" opacity=".45"/>`;
  let tufts = "";
  for (let i = 0; i < 260; i++) {
    const x = R() * S, y = R() * S, c = ["#3f9a6c", "#2c7552", "#4aa878"][Math.floor(R() * 3)], h = 3 + R() * 4;
    tufts += `<path d="M${f2(x - 2)} ${f2(y)} l1 ${f2(-h)} M${f2(x)} ${f2(y)} l0 ${f2(-h - 1.5)} M${f2(x + 2)} ${f2(y)} l-1 ${f2(-h)}" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 9; i++) tufts += `<circle cx="${f2(R() * S)}" cy="${f2(R() * S)}" r="1.6" fill="${["#ff8fc8", "#8ff3ff", "#ffe27a"][i % 3]}" opacity=".8"/>`;
  let g = `<rect width="${S}" height="${S}" fill="#2f7552"/>`;
  g += `<g filter="url(#gb)">${wrapAll(S, S, (ox, oy) => `<g transform="translate(${ox} ${oy})">${items}</g>`)}</g>`;
  g += wrapAll(S, S, (ox, oy) => `<g transform="translate(${ox} ${oy})">${tufts}</g>`);
  return job("assets/img/grass.png", S, S, g, blur("gb", 7));
}

/* ============================ BUILDINGS ============================ */
// 3/4 box: front face (x0..x0+w, top..base) + roof face + right side face receding by (d, dy).
// Ground line = `base` (front bottom edge). Returns svg string (needs no defs).
function box3(x0, top, w, base, d, dy, c, sw) {
  sw = sw || 4;
  let g = "";
  if (d > 0) {
    g += `<path d="M${x0 + w} ${top} L${x0 + w + d} ${top - dy} V${base - dy} L${x0 + w} ${base} Z" fill="${c.side}"/>`;
    g += `<path d="M${x0} ${top} L${x0 + d} ${top - dy} H${x0 + w + d} L${x0 + w} ${top} Z" fill="${c.roof}"/>`;
  }
  g += `<rect x="${x0}" y="${top}" width="${w}" height="${base - top}" fill="${c.front}"/>`;
  return g;
}
function box3Lines(x0, top, w, base, d, dy, sw) {
  sw = sw || 4;
  const sil = d > 0 ? `M${x0} ${base} V${top} L${x0 + d} ${top - dy} H${x0 + w + d} V${base - dy} L${x0 + w} ${base} Z` : `M${x0} ${base} V${top} H${x0 + w} V${base} Z`;
  return (d > 0 ? `<path d="M${x0} ${top} H${x0 + w} V${base} M${x0 + w} ${top} L${x0 + w + d} ${top - dy}" fill="none" ${stk(sw * 0.6)}/>` : "") + `<path d="${sil}" fill="none" ${stk(sw)}/>`;
}
const sideT = (x0, w, d, dy) => `matrix(1 ${f2(-dy / d)} 0 1 ${x0 + w} 0)`;   // (u,v) on the side face
function groundShadow(x0, w, d, base, u) { return `<rect x="${x0 - 6}" y="${base - 14}" width="${w + d + 16}" height="22" rx="11" fill="#07041a" opacity=".5" filter="url(#${u})"/>`; }
function windowsGrid(x, y, w, h, cols, rows, R, pal, o) {
  o = o || {};
  const gx = o.gx || 8, gy = o.gy || 8, ww = (w - gx * (cols - 1)) / cols, wh = (h - gy * (rows - 1)) / rows;
  let g = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const lit = R() < (o.lit || 0.68), col = lit ? pal[Math.floor(R() * pal.length)] : "#232650";
    const X = x + c * (ww + gx), Y = y + r * (wh + gy);
    g += `<rect x="${f2(X)}" y="${f2(Y)}" width="${f2(ww)}" height="${f2(wh)}" rx="2.5" fill="${col}" ${stk(1.8)}/>`;
    if (lit) g += `<rect x="${f2(X + 2)}" y="${f2(Y + 2)}" width="${f2(ww * 0.35)}" height="${f2(wh - 4)}" rx="1.5" fill="#fff" opacity=".35"/>`;
  }
  return g;
}
// neon glyphs for rooftop signs, centred on (cx,cy) size s
const GLYPH = {
  bolt: (cx, cy, s) => `M${cx + s * 0.15} ${cy - s} L${cx - s * 0.55} ${cy + s * 0.12} H${cx + 0.02 * s} L${cx - s * 0.2} ${cy + s} L${cx + s * 0.6} ${cy - s * 0.15} H${cx + s * 0.02} Z`,
  moon: (cx, cy, s) => `M${cx + s * 0.25} ${cy - s * 0.95} A${s} ${s} 0 1 0 ${cx + s * 0.95} ${cy + s * 0.3} A${s * 0.78} ${s * 0.78} 0 1 1 ${cx + s * 0.25} ${cy - s * 0.95} Z`,
  star: (cx, cy, s) => star(cx, cy, s, s * 0.45),
  ring: (cx, cy, s) => `M${cx} ${cy - s} A${s} ${s} 0 1 1 ${cx - 0.01} ${cy - s} Z M${cx} ${cy - s * 0.45} A${s * 0.45} ${s * 0.45} 0 1 1 ${cx - 0.01} ${cy - s * 0.45} Z`,
  wave: (cx, cy, s) => `M${cx - s} ${cy} Q${cx - s * 0.5} ${cy - s * 0.8} ${cx} ${cy} T${cx + s} ${cy}`,
};
// A neon tower. o: {x0,w,d,dy,top,base,wall,accent,win:"grid"|"strips",cols,rows,glyph,crown,seed,u,sign2}
function tower(o) {
  const u = o.u || "tw", A = o.accent, Wl = o.wall || "#3b3577", R = rng(o.seed || 1);
  const defs = lin(`${u}f`, [[0, shade(Wl, 0.12)], [1, shade(Wl, -0.2)]]) + lin(`${u}s`, [[0, shade(Wl, -0.3)], [1, shade(Wl, -0.45)]]) +
    lin(`${u}r`, [[0, shade(Wl, 0.3)], [1, shade(Wl, 0.12)]], 0, 0, 1, 0) + glow(`${u}n`, 3) + blur(`${u}b`, 5) +
    lin(`${u}g`, [[0, mix(A, "#ffffff", 0.75)], [1, mix(A, "#1a1640", 0.25)]]);
  const { x0, w, d, dy, top, base } = o;
  const pal = o.pal || [mix(A, "#ffffff", 0.45), "#ffd98a", "#ffe9b0", mix(A, "#ffffff", 0.2)];
  const C = { front: `url(#${u}f)`, side: `url(#${u}s)`, roof: `url(#${u}r)` };
  let g = groundShadow(x0, w, d, base, `${u}b`);
  g += box3(x0, top, w, base, d, dy, C);
  // windows
  const wx = x0 + 14, ww = w - 28, wy = top + 20, wh = base - top - 72;
  if (o.win === "strips") {
    const n = o.cols || 4, sw = (ww - (n - 1) * 10) / n;
    for (let c = 0; c < n; c++) {
      const X = wx + c * (sw + 10);
      g += `<rect x="${f2(X)}" y="${wy}" width="${f2(sw)}" height="${wh}" rx="4" fill="#232650" ${stk(2)}/>`;
      for (let r = 0; r < (o.rows || 9); r++) { const hh = (wh - 8) / (o.rows || 9); if (R() < 0.72) g += `<rect x="${f2(X + 3)}" y="${f2(wy + 4 + r * hh)}" width="${f2(sw - 6)}" height="${f2(hh - 4)}" rx="2" fill="${pal[Math.floor(R() * pal.length)]}"/>`; }
      g += `<rect x="${f2(X + 3)}" y="${wy + 4}" width="3" height="${wh - 8}" rx="1.5" fill="#fff" opacity=".3"/>`;
    }
  } else g += windowsGrid(wx, wy, ww, wh, o.cols || 4, o.rows || 8, R, pal, { gx: 9, gy: 9 });
  // side-face windows (skewed)
  if (d > 0) {
    g += `<g transform="${sideT(x0, w, d, dy)}">`;
    const rows = o.rows || 8, hh = (wh - 9 * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) g += `<rect x="${d * 0.25}" y="${f2(wy + r * (hh + 9))}" width="${d * 0.5}" height="${f2(hh)}" rx="2" fill="${R() < 0.5 ? mix(A, "#232650", 0.55) : "#1b1d40"}"/>`;
    g += `</g>`;
  }
  // ground floor: lit storefront + awning
  const gy = base - 44;
  g += `<rect x="${x0 + 10}" y="${gy + 8}" width="${w - 20}" height="36" fill="url(#${u}g)" ${stk(2.4)}/>`;
  for (let x = x0 + 10 + (w - 20) / 4; x < x0 + w - 12; x += (w - 20) / 4) g += `<path d="M${f2(x)} ${gy + 8} V${base}" stroke="${INK}" stroke-width="2"/>`;
  g += `<rect x="${x0 + w / 2 - 13}" y="${gy + 14}" width="26" height="30" rx="2" fill="${mix(A, "#ffffff", 0.85)}" ${stk(2.4)}/><path d="M${x0 + w / 2} ${gy + 14} V${base}" stroke="${INK}" stroke-width="2"/>`;
  g += `<path d="M${x0 + 4} ${gy + 10} L${x0 + 10} ${gy - 2} H${x0 + w - 10} L${x0 + w - 4} ${gy + 10} Z" fill="${shade(A, -0.25)}" ${stk(2.6)}/>`;
  g += neon(`M${x0 + 8} ${gy + 10} H${x0 + w - 8}`, A, 2.4, `${u}n`);
  g += box3Lines(x0, top, w, base, d, dy);
  // neon edges
  g += neon(`M${x0 + 5} ${top + 6} H${x0 + w - 5}`, A, 3, `${u}n`);
  g += neon(`M${x0 + 5} ${top + 12} V${gy - 8} M${x0 + w - 5} ${top + 12} V${gy - 8}`, A, 2.6, `${u}n`);
  if (d > 0) g += neon(`M${x0 + w + 4} ${top - 2} L${x0 + w + d - 3} ${top - dy + 3}`, mix(A, "#ffffff", 0.2), 2, `${u}n`);
  // rooftop: little AC box + sign
  if (d > 0) {
    const rx = x0 + w * 0.12 + d * 0.5, ry = top - dy * 0.5;
    g += box3(rx, ry - 12, 22, ry, 8, 6, { front: shade(Wl, -0.05), side: shade(Wl, -0.35), roof: shade(Wl, 0.35) }) + box3Lines(rx, ry - 12, 22, ry, 8, 6, 3);
  }
  if (o.glyph) {
    const sx = x0 + (w + d) / 2 + (o.signDx || 0), sy = o.signY || (top - dy - 32), sw2 = o.signW || 96, sh = 44;
    g += `<path d="M${sx - sw2 * 0.3} ${sy + sh / 2} V${top - dy * 0.45} M${sx + sw2 * 0.3} ${sy + sh / 2} V${top - dy * 0.45}" ${stk(7)}/><path d="M${sx - sw2 * 0.3} ${sy + sh / 2} V${top - dy * 0.45} M${sx + sw2 * 0.3} ${sy + sh / 2} V${top - dy * 0.45}" stroke="#5a5f8a" stroke-width="3"/>`;
    g += `<rect x="${sx - sw2 / 2}" y="${sy - sh / 2}" width="${sw2}" height="${sh}" rx="10" fill="#17123a" ${stk(4)}/>`;
    g += neon(`M${sx - sw2 / 2 + 6} ${sy - sh / 2 + 6} H${sx + sw2 / 2 - 6} V${sy + sh / 2 - 6} H${sx - sw2 / 2 + 6} Z`, mix(A, VIOLET, 0.4), 1.6, `${u}n`);
    g += neon(GLYPH[o.glyph](sx - 22, sy, 13), A, 2.6, `${u}n`);
    g += neon(GLYPH[o.glyph2 || "wave"](sx + 18, sy, 13), o.accent2 || YELLOW, 2.6, `${u}n`);
  }
  if (o.antenna) { const ax = x0 + w * 0.7 + d * 0.5; g += `<path d="M${ax} ${top - dy * 0.5} V${top - dy * 0.5 - o.antenna}" ${stk(5)}/><path d="M${ax} ${top - dy * 0.5} V${top - dy * 0.5 - o.antenna}" stroke="#8a90b8" stroke-width="2"/><circle cx="${ax}" cy="${top - dy * 0.5 - o.antenna}" r="4.5" fill="#ff3355" filter="url(#${u}n)"/>`; }
  return { defs, body: g };
}
function towerJob(file, W, H, o) { const r = tower(o); return job(file, W, H, r.body, r.defs); }

// common defs for low buildings
function bdefs(u, Wl, A) {
  return lin(`${u}f`, [[0, shade(Wl, 0.15)], [1, shade(Wl, -0.15)]]) + lin(`${u}s`, [[0, shade(Wl, -0.3)], [1, shade(Wl, -0.42)]]) +
    lin(`${u}r`, [[0, shade(Wl, 0.32)], [1, shade(Wl, 0.15)]], 0, 0, 1, 0) + glow(`${u}n`, 3) + blur(`${u}b`, 5) +
    lin(`${u}g`, [[0, mix(A, "#ffffff", 0.7)], [1, mix(A, "#1a1640", 0.3)]]);
}
const BC = (u) => ({ front: `url(#${u}f)`, side: `url(#${u}s)`, roof: `url(#${u}r)` });
function fascia(x, y, w, h, A, u) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#17123a" ${stk(3)}/>` + neon(`M${x + 6} ${y + h - 5} H${x + w - 6}`, A, 2, `${u}n`); }

// Car dealership ("Concession"): glass showroom with a car inside + feather flags. Ground y 212.
function dealer() {
  const u = "dl", W = 300, H = 230, A = CYAN, x0 = 26, w = 226, d = 30, dy = 22, top = 84, base = 212;
  const cs = carSide({ body: PINK, stripe: YELLOW, u: "dc", sw: 4 });
  let defs = bdefs(u, "#3a3f78", A) + cs.defs + lin(`${u}gl`, [[0, "#bff6ff", 0.85], [1, "#4a7fd0", 0.75]]);
  let g = groundShadow(x0, w, d, base, `${u}b`);
  g += box3(x0, top, w, base, d, dy, BC(u));
  // showroom glass with a car inside
  g += `<rect x="${x0 + 12}" y="${top + 34}" width="${w - 24}" height="${base - top - 34}" fill="url(#${u}gl)" ${stk(3)}/>`;
  g += `<rect x="${x0 + 12}" y="${base - 22}" width="${w - 24}" height="22" fill="#9aa6d8" opacity=".6"/>`;
  g += `<g transform="translate(${x0 + 30} ${base - 74}) scale(0.52)">${cs.body}</g>`;
  g += `<rect x="${x0 + 12}" y="${top + 34}" width="${w - 24}" height="${base - top - 34}" fill="#bff6ff" opacity=".12"/>`;
  g += `<path d="M${x0 + 40} ${top + 36} L${x0 + 18} ${top + 86} M${x0 + 70} ${top + 36} L${x0 + 34} ${top + 112} M${x0 + 170} ${top + 36} L${x0 + 140} ${top + 100}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>`;
  [x0 + 12 + (w - 24) / 3, x0 + 12 + 2 * (w - 24) / 3].forEach((x) => { g += `<path d="M${f2(x)} ${top + 34} V${base}" stroke="${INK}" stroke-width="2.4"/>`; });
  // fascia with key sign
  g += fascia(x0 + 8, top + 6, w - 16, 24, A, u);
  const kx = x0 + w / 2, ky = top + 16;
  g += neon(`M${kx - 30} ${ky} m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M${kx - 24} ${ky} H${kx + 10} M${kx + 2} ${ky} V${ky + 5} M${kx + 8} ${ky} V${ky + 4}`, YELLOW, 2, `${u}n`);
  g += neon(star(kx + 32, ky, 8, 3.6), PINK, 1.8, `${u}n`) + neon(star(kx - 50, ky, 6, 2.7), CYAN, 1.6, `${u}n`);
  g += box3Lines(x0, top, w, base, d, dy);
  g += neon(`M${x0 + 5} ${top + 3} H${x0 + w - 5}`, A, 2.4, `${u}n`);
  // feather flags
  [[12, PINK], [W - 14, YELLOW]].forEach(([x, c], i) => {
    g += `<path d="M${x} ${base + 6} V44" ${stk(6)}/><path d="M${x} ${base + 6} V44" stroke="#c9cde2" stroke-width="2.6"/>`;
    const s = i ? -1 : 1;
    g += `<path d="M${x} 46 Q${x + s * 22} 40 ${x + s * 20} 70 Q${x + s * 16} 110 ${x + s * 18} 140 L${x} 140 Z" fill="${c}" ${stk(3)}/>`;
    g += `<path d="M${x + s * 4} 60 Q${x + s * 10} 90 ${x + s * 6} 128" fill="none" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
  });
  g += `<ellipse cx="12" cy="${base + 7}" rx="7" ry="3" fill="${INK}"/><ellipse cx="${W - 14}" cy="${base + 7}" rx="7" ry="3" fill="${INK}"/>`;
  return job("assets/img/dealer.png", W, H, g, defs);
}
// Spray-can glyph (shared by the garage sign and the garage icon)
function sprayCan(cx, cy, s, sw, c) {
  return `<rect x="${cx - 12 * s}" y="${cy - 14 * s}" width="${24 * s}" height="${40 * s}" rx="${6 * s}" fill="${c}" ${stk(sw)}/>` +
    `<rect x="${cx - 12 * s}" y="${cy - 2 * s}" width="${24 * s}" height="${12 * s}" fill="#fff" opacity=".9"/><path d="M${cx - 12 * s} ${cy - 2 * s} H${cx + 12 * s} M${cx - 12 * s} ${cy + 10 * s} H${cx + 12 * s}" ${stk(sw * 0.6)}/>` +
    `<path d="M${cx - 9 * s} ${cy - 14 * s} Q${cx} ${cy - 24 * s} ${cx + 9 * s} ${cy - 14 * s} Z" fill="#c9cde2" ${stk(sw)}/><rect x="${cx - 3 * s}" y="${cy - 26 * s}" width="${6 * s}" height="${6 * s}" rx="${1.5 * s}" fill="#f4f6ff" ${stk(sw * 0.8)}/>` +
    `<path d="M${cx - 7 * s} ${cy - 10 * s} V${cy + 22 * s}" stroke="#fff" stroke-width="${3 * s}" stroke-linecap="round" opacity=".5"/>`;
}
// Pay'n'Spray garage: roll-up door, spray-can sign, paint splashes. Ground y 206.
function garage() {
  const u = "gr", W = 280, H = 220, A = PINK, x0 = 26, w = 200, d = 30, dy = 20, top = 76, base = 206;
  let defs = bdefs(u, "#463c78", A) + lin(`${u}d`, [[0, "#8d93b8"], [1, "#5d6288"]]);
  let g = groundShadow(x0, w, d, base, `${u}b`);
  g += box3(x0, top, w, base, d, dy, BC(u));
  // paint splashes on the wall
  [[x0 + 14, top + 46, PINK], [x0 + w - 18, top + 40, CYAN], [x0 + 20, top + 92, YELLOW], [x0 + w - 22, top + 100, VIOLET]].forEach(([x, y, c], i) => {
    g += `<path d="${K.blob(x, y, 9, 8, 7, 0.35, rng(30 + i))}" fill="${c}" opacity=".9"/><path d="M${x - 2} ${y + 6} V${y + 18 + i * 3}" stroke="${c}" stroke-width="3.2" stroke-linecap="round" opacity=".9"/><circle cx="${x + 9}" cy="${y - 8}" r="2.4" fill="${c}"/>`;
  });
  // roll-up door
  const dx0 = x0 + 40, dw = w - 80, dtop = top + 48;
  g += `<rect x="${dx0 - 6}" y="${dtop - 6}" width="${dw + 12}" height="${base - dtop + 6}" fill="#241f4a" ${stk(3)}/>`;
  g += `<rect x="${dx0}" y="${dtop}" width="${dw}" height="${base - dtop - 12}" fill="url(#${u}d)" ${stk(2.4)}/>`;
  for (let y = dtop + 10; y < base - 14; y += 10) g += `<path d="M${dx0 + 2} ${y} H${dx0 + dw - 2}" stroke="#4a4f78" stroke-width="2"/><path d="M${dx0 + 2} ${y + 2} H${dx0 + dw - 2}" stroke="#a9aed0" stroke-width="1.2" opacity=".6"/>`;
  g += `<rect x="${dx0 + 2}" y="${base - 12}" width="${dw - 4}" height="12" fill="#ffd98a" opacity=".9"/><rect x="${dx0 + dw / 2 - 10}" y="${base - 22}" width="20" height="5" rx="2.5" fill="#2a2d55"/>`;
  // hazard stripes on door jambs
  // fascia with spray can + rainbow mist
  g += fascia(x0 + 8, top + 8, w - 16, 28, A, u);
  g += `<g>${sprayCan(x0 + w / 2 - 26, top + 22, 0.5, 2, PINK)}</g>`;
  [[x0 + w / 2 - 6, top + 14, CYAN], [x0 + w / 2 + 6, top + 20, YELLOW], [x0 + w / 2 + 18, top + 14, PINK], [x0 + w / 2 + 30, top + 21, VIOLET], [x0 + w / 2 + 42, top + 15, CYAN]].forEach(([x, y, c]) => { g += `<circle cx="${x}" cy="${y}" r="3.6" fill="${c}" filter="url(#${u}n)"/>`; });
  g += box3Lines(x0, top, w, base, d, dy);
  g += neon(`M${x0 + 5} ${top + 3} H${x0 + w - 5}`, A, 2.4, `${u}n`);
  // rooftop big spray can
  g += `<g transform="rotate(-14 ${x0 + w * 0.78} ${top - 30})">${sprayCan(x0 + w * 0.78, top - 34, 0.95, 3.4, CYAN)}</g>`;
  return job("assets/img/garage.png", W, H, g, defs);
}
// "La Planque" (safehouse, where you sleep): a discreet two-storey walk-up — half-closed
// blinds, one warm lit window, a steel door with a peephole, a neon moon + "Zz" sign, a fire
// escape and a satellite dish. Ground y 206.
function safehouse() {
  const u = "sh", W = 280, H = 240, A = VIOLET, x0 = 30, w = 190, d = 30, dy = 20, top = 70, base = 226;
  let defs = bdefs(u, "#3d3470", A) + rad(`${u}w`, [[0, "#fff1c4", 0.95], [1, "#ffb86a", 0.6]]) + lin(`${u}dr`, [[0, "#5a5f8c"], [1, "#363a66"]]);
  let g = groundShadow(x0, w, d, base, `${u}b`);
  g += box3(x0, top, w, base, d, dy, BC(u));
  // floor band between storeys
  g += `<path d="M${x0} ${top + 74} H${x0 + w}" stroke="${INK}" stroke-width="3"/><path d="M${x0 + 2} ${top + 77} H${x0 + w - 2}" stroke="#ffffff" stroke-width="1.5" opacity=".18"/>`;
  // windows: upper floor (one warm & lit with a lamp, others with blinds), ground floor small
  const win = (x, y, ww, hh, lit) => {
    let t = `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="3" fill="${lit ? `url(#${u}w)` : "#1e1a44"}" ${stk(2.6)}/>`;
    const n = lit ? 2 : 4;
    for (let i = 1; i <= n; i++) t += `<path d="M${x + 2} ${y + i * (hh / (n + 1.6))} H${x + ww - 2}" stroke="${lit ? "#d98c4a" : "#4b4685"}" stroke-width="2.4" opacity="${lit ? 0.6 : 1}"/>`;
    if (lit) t += `<path d="M${x + ww - 12} ${y + hh - 4} V${y + hh - 16} M${x + ww - 17} ${y + hh - 16} H${x + ww - 7} L${x + ww - 9} ${y + hh - 22} H${x + ww - 15} Z" stroke="${INK}" stroke-width="1.6" fill="#ffd98a"/>`;
    return t;
  };
  g += win(x0 + 18, top + 22, 40, 36, false) + win(x0 + 76, top + 22, 40, 36, true) + win(x0 + 134, top + 22, 40, 36, false);
  g += win(x0 + 18, top + 98, 34, 30, false);
  // steel door with peephole + doormat, under a little awning
  const dx = x0 + 96, dw = 40, dtop = top + 92;
  g += `<rect x="${dx}" y="${dtop}" width="${dw}" height="${base - dtop - 2}" rx="3" fill="url(#${u}dr)" ${stk(2.8)}/>`;
  g += `<circle cx="${dx + dw / 2}" cy="${dtop + 18}" r="3.4" fill="#ffd98a" ${stk(1.6)}/><circle cx="${dx + dw - 8}" cy="${dtop + 52}" r="2.6" fill="#c9cde2" ${stk(1.4)}/>`;
  g += `<path d="M${dx - 8} ${dtop - 4} H${dx + dw + 8} L${dx + dw + 2} ${dtop - 16} H${dx - 2} Z" fill="${A}" ${stk(2.6)}/>`;
  g += `<rect x="${dx - 4}" y="${base - 4}" width="${dw + 8}" height="6" rx="3" fill="#7a3b6e" ${stk(2)}/>`;
  // fire escape on the right of the front
  const fx = x0 + 150;
  g += `<path d="M${fx} ${top + 68} H${fx + 34} M${fx} ${top + 140} H${fx + 34}" stroke="#2a2d55" stroke-width="4"/>`;
  for (let x = fx + 4; x <= fx + 30; x += 6.5) g += `<path d="M${x} ${top + 60} V${top + 68} M${x} ${top + 132} V${top + 140}" stroke="#2a2d55" stroke-width="2"/>`;
  g += `<path d="M${fx + 6} ${top + 70} L${fx + 28} ${top + 138}" stroke="#2a2d55" stroke-width="3.2"/>`;
  // neon sign on the roof edge: crescent moon + Zz
  g += `<rect x="${x0 + 40}" y="${top - 38}" width="92" height="34" rx="8" fill="#17123a" ${stk(3)}/><path d="M${x0 + 64} ${top - 4} V${top}" stroke="${INK}" stroke-width="3"/><path d="M${x0 + 108} ${top - 4} V${top}" stroke="${INK}" stroke-width="3"/>`;
  g += neon(`M${x0 + 66} ${top - 32} A12 12 0 1 0 ${x0 + 70} ${top - 10} A9 9 0 1 1 ${x0 + 66} ${top - 32} Z`, YELLOW, 2.6, `${u}n`);
  g += neon(`M${x0 + 86} ${top - 30} H${x0 + 98} L${x0 + 86} ${top - 18} H${x0 + 98} M${x0 + 104} ${top - 24} H${x0 + 112} L${x0 + 104} ${top - 14} H${x0 + 112}`, A, 2.6, `${u}n`);
  // satellite dish on the roof
  g += `<g transform="rotate(-25 ${x0 + w - 26} ${top - 12})"><path d="M${x0 + w - 42} ${top - 14} A16 9 0 0 0 ${x0 + w - 10} ${top - 14} Z" fill="#c9cde2" ${stk(2.6)}/><path d="M${x0 + w - 26} ${top - 14} V${top - 4}" stroke="${INK}" stroke-width="3"/></g>`;
  g += box3Lines(x0, top, w, base, d, dy);
  g += neon(`M${x0 + 5} ${top + 3} H${x0 + w - 5}`, A, 2.2, `${u}n`);
  return job("assets/img/safehouse.png", W, H, g, defs);
}
// Gas station: canopy on pillars, two pumps, price totem. Ground y 204.
function pump(cx, base, c, s, sw) {
  s = s || 1; sw = sw || 3;
  return `<rect x="${cx - 14 * s}" y="${base - 52 * s}" width="${28 * s}" height="${50 * s}" rx="${5 * s}" fill="${c}" ${stk(sw)}/>` +
    `<rect x="${cx - 9 * s}" y="${base - 46 * s}" width="${18 * s}" height="${12 * s}" rx="${2 * s}" fill="#bff6ff" ${stk(sw * 0.7)}/>` +
    `<path d="M${cx - 6 * s} ${base - 40 * s} h${8 * s}" stroke="${INK}" stroke-width="${2 * s}" stroke-linecap="round"/>` +
    `<path d="M${cx + 14 * s} ${base - 36 * s} Q${cx + 24 * s} ${base - 34 * s} ${cx + 22 * s} ${base - 18 * s}" fill="none" stroke="${INK}" stroke-width="${4 * s}" stroke-linecap="round"/>` +
    `<rect x="${cx + 17 * s}" y="${base - 20 * s}" width="${8 * s}" height="${10 * s}" rx="${2 * s}" fill="#2a2d55" ${stk(sw * 0.6)}/>` +
    `<rect x="${cx - 16 * s}" y="${base - 6 * s}" width="${32 * s}" height="${6 * s}" rx="${2 * s}" fill="#2a2d55" ${stk(sw * 0.7)}/>` +
    `<path d="M${cx - 8 * s} ${base - 28 * s} V${base - 10 * s}" stroke="#fff" stroke-width="${3 * s}" stroke-linecap="round" opacity=".5"/>`;
}
function gas() {
  const u = "gs", W = 300, H = 220, A = CYAN, base = 204;
  let defs = bdefs(u, "#3a3f78", A) + rad(`${u}l`, [[0, "#fff6c8", 0.85], [1, "#fff6c8", 0]], 0.5, 0, 0.9) + lin(`${u}p`, [[0, "#d0d4ea"], [1, "#9aa0c4"]]);
  let g = `<rect x="22" y="${base - 12}" width="250" height="22" rx="11" fill="#07041a" opacity=".5" filter="url(#${u}b)"/>`;
  // island
  g += `<path d="M58 ${base - 12} H218 L226 ${base} H50 Z" fill="#6a6e96" ${stk(3)}/>`;
  // light pool under the canopy
  g += `<path d="M40 70 H240 L250 ${base - 6} H30 Z" fill="url(#${u}l)"/>`;
  // pillars
  [62, 214].forEach((x) => { g += `<rect x="${x - 7}" y="66" width="14" height="${base - 74}" fill="url(#${u}p)" ${stk(3)}/><path d="M${x - 2} 72 V${base - 14}" stroke="#fff" stroke-width="2" opacity=".6"/>`; });
  g += pump(110, base - 10, PINK) + pump(170, base - 10, PINK);
  // canopy (thin 3/4 slab)
  g += box3(20, 42, 240, 70, 24, 16, BC(u)) + box3Lines(20, 42, 240, 70, 24, 16);
  g += `<rect x="22" y="44" width="236" height="10" fill="#fff" opacity=".9"/>`;
  g += neon(`M26 62 H254`, A, 3, `${u}n`);
  g += neon(`M140 49 m-5 -5 Q140 40 145 47 Q148 53 140 54 Q132 53 135 44 Z`, PINK, 1.6, `${u}n`);
  // price totem
  const tx = 282;
  g += `<rect x="${tx - 3}" y="110" width="6" height="${base - 108}" fill="#8d93b8" ${stk(2.4)}/>`;
  g += `<rect x="${tx - 15}" y="68" width="30" height="48" rx="6" fill="#17123a" ${stk(3)}/>`;
  g += neon(`M${tx} 76 Q${tx + 8} 88 ${tx + 6} 94 Q${tx} 102 ${tx - 6} 94 Q${tx - 8} 88 ${tx} 76 Z`, YELLOW, 2, `${u}n`);
  g += `<rect x="${tx - 10}" y="102" width="20" height="8" rx="2" fill="${CYAN}" opacity=".9"/>`;
  return job("assets/img/gas.png", W, H, g, defs);
}
// Delivery depot: warehouse, half-open loading door with parcels, stacked boxes. Ground y 206.
function parcelBox(x, y, s, c, sw) {   // 3/4 cardboard box, front-bottom-left at (x,y)
  c = c || "#e0a464"; sw = sw || 2.6;
  const w = 26 * s, h = 20 * s, d = 9 * s, dy = 7 * s;
  return box3(x, y - h, w, y, d, dy, { front: c, side: shade(c, -0.25), roof: shade(c, 0.2) }) + box3Lines(x, y - h, w, y, d, dy, sw) +
    `<path d="M${x + w / 2} ${y - h} V${y - h * 0.55} M${x + w / 2 - 2 * s + d / 2} ${y - h - dy / 2} L${x + w / 2 + d / 2} ${y - h - dy / 2}" stroke="#c98a4a" stroke-width="${3 * s}"/>` +
    `<path d="M${x + d / 2 + 2} ${y - h - dy / 2} H${x + w + d / 2 - 2}" stroke="#f4e3c4" stroke-width="${2.4 * s}" opacity=".9"/>`;
}
function depot() {
  const u = "dp", W = 280, H = 220, A = YELLOW, x0 = 22, w = 206, d = 30, dy = 20, top = 70, base = 206;
  let defs = bdefs(u, "#4a4f86", A);
  let g = groundShadow(x0, w, d, base, `${u}b`);
  g += box3(x0, top, w, base, d, dy, BC(u));
  for (let x = x0 + 8; x < x0 + w - 4; x += 10) g += `<path d="M${x} ${top + 34} V${base - 2}" stroke="#2f3366" stroke-width="2" opacity=".5"/>`;
  // loading door (half open)
  const dx0 = x0 + 64, dw = 110, dtop = top + 50;
  g += `<rect x="${dx0 - 5}" y="${dtop - 5}" width="${dw + 10}" height="${base - dtop + 5}" fill="#241f4a" ${stk(3)}/>`;
  g += `<rect x="${dx0}" y="${dtop}" width="${dw}" height="${base - dtop}" fill="#120f2c"/>`;
  g += `<rect x="${dx0}" y="${dtop + 40}" width="${dw}" height="${base - dtop - 40}" fill="#ffd98a" opacity=".25"/>`;
  g += parcelBox(dx0 + 14, base - 4, 1.0) + parcelBox(dx0 + 52, base - 4, 1.1, "#d9965a") + parcelBox(dx0 + 30, base - 26, 0.9, "#eab070");
  g += `<rect x="${dx0}" y="${dtop}" width="${dw}" height="38" fill="#8d93b8" ${stk(2.4)}/>`;
  for (let y = dtop + 8; y < dtop + 38; y += 8) g += `<path d="M${dx0 + 2} ${y} H${dx0 + dw - 2}" stroke="#5d6288" stroke-width="2"/>`;
  // hazard stripes on the jambs
  [dx0 - 5, dx0 + dw - 1].forEach((x) => { for (let y = dtop; y < base; y += 12) g += `<path d="M${x} ${y} l6 6 v6 l-6 -6 Z" fill="${YELLOW}"/>`; });
  // fascia + parcel glyph
  g += fascia(x0 + 8, top + 8, w - 16, 26, A, u);
  g += neon(`M${x0 + w / 2 - 14} ${top + 14} H${x0 + w / 2 + 6} V${top + 28} H${x0 + w / 2 - 14} Z M${x0 + w / 2 - 14} ${top + 14} L${x0 + w / 2 - 8} ${top + 10} H${x0 + w / 2 + 12} L${x0 + w / 2 + 6} ${top + 14} M${x0 + w / 2 + 12} ${top + 10} V${top + 24} L${x0 + w / 2 + 6} ${top + 28}`, YELLOW, 1.8, `${u}n`);
  [[x0 + 38, CYAN], [x0 + w - 38, PINK]].forEach(([x, c]) => { g += neon(`M${x - 8} ${top + 21} H${x + 8}`, c, 2, `${u}n`); });
  // side window
  g += `<g transform="${sideT(x0, w, d, dy)}"><rect x="${d * 0.22}" y="${top + 50}" width="${d * 0.56}" height="30" rx="3" fill="${mix(A, "#232650", 0.6)}"/></g>`;
  g += box3Lines(x0, top, w, base, d, dy);
  // stacked parcels + pallet in front-left
  g += `<rect x="4" y="${base - 2}" width="48" height="8" rx="2" fill="#a77a4a" ${stk(2.4)}/>`;
  g += parcelBox(6, base - 2, 1.0) + parcelBox(14, base - 22, 0.95, "#d9965a");
  return job("assets/img/depot.png", W, H, g, defs);
}
// Corner diner: big warm windows, striped awning, neon coffee-cup sign. Ground y 206.
function shopBlock() {
  const u = "sb", W = 280, H = 220, A = PINK, x0 = 22, w = 210, d = 30, dy = 20, top = 72, base = 206;
  let defs = bdefs(u, "#5a3f86", A) + lin(`${u}w`, [[0, "#fff1c4"], [1, "#ffb86a"]]);
  let g = groundShadow(x0, w, d, base, `${u}b`);
  g += box3(x0, top, w, base, d, dy, BC(u));
  // windows + door
  [[x0 + 12, 70], [x0 + w - 82, 70]].forEach(([x, ww]) => {
    g += `<rect x="${x}" y="${top + 66}" width="${ww}" height="${base - top - 80}" rx="4" fill="url(#${u}w)" ${stk(3)}/>`;
    g += `<path d="M${x + 10} ${top + 70} L${x} ${top + 92}" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round"/>`;
    g += `<path d="M${x} ${base - 34} H${x + ww}" stroke="${INK}" stroke-width="2"/><circle cx="${x + 18}" cy="${base - 40}" r="5" fill="#c9cde2" ${stk(1.8)}/><circle cx="${x + ww - 18}" cy="${base - 40}" r="5" fill="#c9cde2" ${stk(1.8)}/>`;
  });
  g += `<rect x="${x0 + w / 2 - 17}" y="${top + 64}" width="34" height="${base - top - 64}" rx="3" fill="#ffe2a8" ${stk(3)}/><rect x="${x0 + w / 2 - 11}" y="${top + 70}" width="22" height="30" rx="2" fill="#ffb86a" opacity=".7"/><circle cx="${x0 + w / 2 + 10}" cy="${top + 108}" r="2.4" fill="${INK}"/>`;
  g += `<rect x="${x0}" y="${base - 12}" width="${w}" height="12" fill="${shade("#5a3f86", -0.25)}"/>`;
  // striped awning
  const ay = top + 40;
  let aw = "";
  for (let i = 0; i < 10; i++) { const x = x0 + 4 + i * (w - 8) / 10; aw += `<path d="M${f2(x)} ${ay} H${f2(x + (w - 8) / 10)} V${ay + 18} Q${f2(x + (w - 8) / 20)} ${ay + 24} ${f2(x)} ${ay + 18} Z" fill="${i % 2 ? "#ffffff" : PINK}"/>`; }
  g += aw + `<path d="M${x0 + 4} ${ay} H${x0 + w - 4} V${ay + 18} H${x0 + 4} Z" fill="none" ${stk(3)}/>`;
  g += box3Lines(x0, top, w, base, d, dy);
  // neon coffee-cup sign on the fascia
  const cx = x0 + w / 2;
  g += `<rect x="${cx - 60}" y="${top + 6}" width="120" height="30" rx="8" fill="#17123a" ${stk(3)}/>`;
  g += neon(`M${cx - 44} ${top + 15} H${cx - 22} V${top + 26} Q${cx - 22} ${top + 31} ${cx - 27} ${top + 31} H${cx - 39} Q${cx - 44} ${top + 31} ${cx - 44} ${top + 26} Z M${cx - 22} ${top + 18} Q${cx - 15} ${top + 18} ${cx - 15} ${top + 22} Q${cx - 15} ${top + 26} ${cx - 22} ${top + 26}`, CYAN, 1.8, "sbn");
  g += neon(`M${cx - 38} ${top + 12} q-2 -3 0 -5 M${cx - 30} ${top + 12} q-2 -3 0 -5`, "#ffffff", 1.4, "sbn");
  g += neon(`M${cx - 6} ${top + 22} Q${cx + 4} ${top + 10} ${cx + 14} ${top + 22} T${cx + 34} ${top + 22} T${cx + 50} ${top + 18}`, PINK, 2, "sbn");
  defs += glow("sbn", 3);
  // side face window
  g += `<g transform="${sideT(x0, w, d, dy)}"><rect x="${d * 0.2}" y="${top + 64}" width="${d * 0.6}" height="56" rx="3" fill="#ffb86a" opacity=".8"/></g>`;
  // rooftop vent
  g += box3(x0 + 150, top - 22, 30, top - 8, 9, 6, { front: "#6a6e96", side: "#4a4d72", roof: "#8d93b8" }) + box3Lines(x0 + 150, top - 22, 30, top - 8, 9, 6, 3);
  return job("assets/img/shop_block.png", W, H, g, defs);
}

/* ============================ PROPS ============================ */
function palm() {
  const W = 120, H = 200;
  const defs = lin("pt", [[0, "#c98a5a"], [1, "#8a5a3a"]], 0, 0, 1, 0) + lin("pl", [[0, "#5fe0a0"], [1, "#1f8a6a"]]) + blur("pb", 3);
  let g = `<ellipse cx="62" cy="190" rx="26" ry="6" fill="#07041a" opacity=".45" filter="url(#pb)"/>`;
  // trunk
  g += `<path d="M56 190 Q52 130 66 66 L74 68 Q64 130 70 190 Z" fill="url(#pt)" ${stk(3.4)}/>`;
  for (let i = 0; i < 9; i++) { const y = 180 - i * 13.5, x = 63 + (190 - y) * 0.03 - (190 - y > 70 ? (190 - y - 70) * 0.06 : 0); g += `<path d="M${f2(x - 6)} ${f2(y)} Q${f2(x + 1)} ${f2(y + 4)} ${f2(x + 8)} ${f2(y - 1)}" fill="none" stroke="#6a4028" stroke-width="2.2" stroke-linecap="round"/>`; }
  // fronds
  const frond = (a, len, c) => {
    const x2 = 70 + Math.cos(a) * len, y2 = 62 + Math.sin(a) * len * 0.75 + len * 0.25;
    const mx = 70 + Math.cos(a) * len * 0.5, my = 62 + Math.sin(a) * len * 0.5 - 16;
    const nx = -Math.sin(a) * 10, ny = Math.cos(a) * 7;
    return `<path d="M70 62 Q${f2(mx + nx)} ${f2(my + ny)} ${f2(x2)} ${f2(y2)} Q${f2(mx - nx * 0.4)} ${f2(my - ny * 0.4 + 10)} 70 62 Z" fill="${c}" ${stk(3)}/><path d="M70 62 Q${f2(mx)} ${f2(my + 4)} ${f2(x2)} ${f2(y2)}" fill="none" stroke="#1a6a50" stroke-width="1.6"/>`;
  };
  [[-2.6, 54], [-0.5, 54], [-3.0, 44], [-0.15, 46], [-1.95, 44], [-1.15, 44]].forEach(([a, l], i) => { g += frond(a, l, i < 2 ? "#2aa878" : "url(#pl)"); });
  g += `<circle cx="64" cy="70" r="6" fill="#8a5a3a" ${stk(2.4)}/><circle cx="75" cy="70" r="6" fill="#a06a40" ${stk(2.4)}/><circle cx="70" cy="76" r="5.5" fill="#7a4a30" ${stk(2.4)}/>`;
  return job("assets/img/palm.png", W, H, g, defs);
}
function streetlamp() {
  const W = 60, H = 180;
  const defs = rad("lh", [[0, "#fff6c8", 0.95], [0.4, "#ffd98a", 0.5], [1, "#ffd98a", 0]]) + lin("lp", [[0, "#8d93b8"], [0.5, "#c9cde2"], [1, "#5d6288"]], 0, 0, 1, 0) + blur("lb", 2.5);
  let g = `<ellipse cx="30" cy="172" rx="14" ry="4" fill="#07041a" opacity=".5" filter="url(#lb)"/>`;
  g += `<circle cx="30" cy="30" r="27" fill="url(#lh)"/>`;
  g += `<path d="M26 170 V44 Q26 34 30 30 Q34 34 34 44 V170 Z" fill="url(#lp)" ${stk(3)}/>`;
  g += `<path d="M22 172 Q22 160 30 158 Q38 160 38 172 Z" fill="#5d6288" ${stk(3)}/>`;
  g += `<path d="M16 32 Q30 12 44 32 Z" fill="#3a3f78" ${stk(3)}/>`;
  g += `<ellipse cx="30" cy="34" rx="11" ry="5" fill="#fff6c8" ${stk(2.4)}/>`;
  g += `<rect x="25" y="80" width="10" height="5" rx="2" fill="${CYAN}"/>`;
  return job("assets/img/streetlamp.png", W, H, g, defs);
}
function hydrant() {
  const W = 44, H = 56;
  const defs = lin("hy", [[0, "#ff8a8a"], [0.5, "#ff4a5a"], [1, "#b8243a"]], 0, 0, 1, 0) + blur("hb", 1.6);
  let g = `<ellipse cx="22" cy="51" rx="15" ry="3.5" fill="#07041a" opacity=".5" filter="url(#hb)"/>`;
  g += `<rect x="9" y="44" width="26" height="7" rx="2.5" fill="#b8243a" ${stk(2.4)}/>`;
  g += `<rect x="12" y="18" width="20" height="28" rx="4" fill="url(#hy)" ${stk(2.6)}/>`;
  g += `<rect x="5" y="25" width="34" height="9" rx="4" fill="url(#hy)" ${stk(2.6)}/>`;
  g += `<path d="M12 18 Q12 6 22 6 Q32 6 32 18 Z" fill="url(#hy)" ${stk(2.6)}/><rect x="19" y="2.5" width="6" height="5" rx="1.5" fill="#b8243a" ${stk(2)}/>`;
  g += `<circle cx="22" cy="31" r="3.5" fill="#ffd24a" ${stk(1.6)}/><path d="M16 12 Q18 9 21 9" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7" fill="none"/><path d="M15 36 V43" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`;
  return job("assets/img/hydrant.png", W, H, g, defs);
}
// Stunt ramp seen from above-front: a wedge rising away from the viewer. Ground y ≈ 92.
function ramp() {
  const W = 140, H = 100;
  const defs = lin("rs", [[0, "#ffe27a"], [1, "#ffb43a"]]) + lin("rf", [[0, "#5d6288"], [1, "#3a3f78"]]) + blur("rb", 3) + glow("rg", 2.5) +
    `<clipPath id="rc"><path d="M14 90 L36 20 H104 L126 90 Z"/></clipPath>`;
  let g = `<rect x="10" y="82" width="122" height="14" rx="7" fill="#07041a" opacity=".5" filter="url(#rb)"/>`;
  // front lip (the low edge) + top surface
  g += `<path d="M14 90 L36 20 H104 L126 90 Z" fill="url(#rs)"/>`;
  g += `<g clip-path="url(#rc)">`;
  [74, 50, 30].forEach((y, i) => { const hw = 40 - i * 6; g += `<path d="M${70 - hw} ${y + 12} L70 ${y - 4} L${70 + hw} ${y + 12} L${70 + hw} ${y + 22} L70 ${y + 6} L${70 - hw} ${y + 22} Z" fill="#2a2550"/>`; });
  [[24, 90, 40, 20], [116, 90, 100, 20]].forEach(([a, b, c, d]) => { g += `<path d="M${a} ${b} L${c} ${d}" stroke="#ff4fa0" stroke-width="6"/>`; });
  g += `<rect x="0" y="16" width="140" height="10" fill="#ff4fa0"/>`;
  g += `<path d="M0 22 H140" stroke="#fff" stroke-width="2" opacity=".6"/>`;
  g += `</g>`;
  g += `<path d="M14 90 L36 20 H104 L126 90 Z" fill="none" ${stk(3.4)}/>`;
  // back wall (the high end) + sides
  g += `<path d="M36 20 L38 8 H102 L104 20 Z" fill="url(#rf)" ${stk(3)}/>`;
  g += `<path d="M44 14 H96" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" filter="url(#rg)"/>`;
  g += `<path d="M14 90 H126 V94 H14 Z" fill="#c98a2a" ${stk(2.6)}/>`;
  return job("assets/img/ramp.png", W, H, g, defs);
}
function bench() {
  const W = 120, H = 70;
  const defs = lin("bw", [[0, "#7a62e8"], [1, "#4b3fb0"]]) + blur("bb", 2);
  let g = `<ellipse cx="60" cy="62" rx="50" ry="5" fill="#07041a" opacity=".5" filter="url(#bb)"/>`;
  [22, 98].forEach((x) => { g += `<path d="M${x - 4} 62 V36 M${x + 4} 62 V44" ${stk(5)}/><path d="M${x - 4} 62 V36 M${x + 4} 62 V44" stroke="#8d93b8" stroke-width="2.4"/>`; });
  g += `<rect x="8" y="8" width="104" height="12" rx="5" fill="url(#bw)" ${stk(3)}/><rect x="8" y="22" width="104" height="11" rx="5" fill="url(#bw)" ${stk(3)}/>`;
  g += `<path d="M6 40 H114 L110 50 H10 Z" fill="url(#bw)" ${stk(3)}/>`;
  g += `<path d="M14 12 H60 M14 26 H50 M16 43 H70" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`;
  return job("assets/img/bench.png", W, H, g, defs);
}
function planter() {
  const W = 90, H = 80;
  const defs = lin("pp", [[0, "#8d93b8"], [1, "#5d6288"]]) + lin("pg", [[0, "#5fe0a0"], [1, "#1f8a6a"]]) + blur("pb", 2);
  let g = `<ellipse cx="45" cy="73" rx="38" ry="5" fill="#07041a" opacity=".5" filter="url(#pb)"/>`;
  g += `<circle cx="28" cy="34" r="16" fill="url(#pg)" ${stk(3)}/><circle cx="62" cy="34" r="16" fill="url(#pg)" ${stk(3)}/><circle cx="45" cy="24" r="18" fill="url(#pg)" ${stk(3)}/>`;
  [[30, 28, PINK], [56, 22, YELLOW], [48, 36, CYAN], [66, 34, PINK]].forEach(([x, y, c]) => { g += `<circle cx="${x}" cy="${y}" r="3.6" fill="${c}" ${stk(1.4)}/>`; });
  g += `<path d="M12 44 H78 L72 72 H18 Z" fill="url(#pp)" ${stk(3)}/><rect x="8" y="40" width="74" height="10" rx="4" fill="#a9aed0" ${stk(3)}/>`;
  g += `<path d="M20 56 H70" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" opacity=".9"/>`;
  return job("assets/img/planter.png", W, H, g, defs);
}
// Letters N E O N as neon polylines (no font dependency); box x,y,w,h
function neonWord(x, y, w, h, c, u) {
  const lw = w / 4.6, gap = (w - lw * 4) / 3;
  const L = (i) => x + i * (lw + gap);
  const N = (X) => `M${X} ${y + h} V${y} L${X + lw} ${y + h} V${y}`;
  const E = (X) => `M${X + lw} ${y} H${X} V${y + h} H${X + lw} M${X} ${y + h / 2} H${X + lw * 0.8}`;
  const O = (X) => `M${X + lw / 2} ${y} A${lw / 2} ${h / 2} 0 1 1 ${X + lw / 2 - 0.01} ${y} Z`;
  return neon(N(L(0)) + E(L(1)) + O(L(2)) + N(L(3)), c, h * 0.13, u);
}
function billboard() {
  const W = 220, H = 200;
  const defs = lin("bbg", [[0, "#2a1458"], [1, "#120b2e"]]) + glow("bbn", 3) + blur("bbb", 3);
  let g = `<ellipse cx="110" cy="192" rx="70" ry="5" fill="#07041a" opacity=".5" filter="url(#bbb)"/>`;
  [70, 150].forEach((x) => { g += `<rect x="${x - 5}" y="100" width="10" height="92" fill="#5d6288" ${stk(3)}/><path d="M${x - 1} 104 V188" stroke="#a9aed0" stroke-width="2"/>`; });
  g += `<path d="M70 150 L150 120 M70 120 L150 150" ${stk(4)}/><path d="M70 150 L150 120 M70 120 L150 150" stroke="#8d93b8" stroke-width="1.8"/>`;
  g += `<rect x="10" y="10" width="200" height="110" rx="12" fill="url(#bbg)" ${stk(4)}/>`;
  g += `<rect x="16" y="16" width="188" height="98" rx="8" fill="none" stroke="${VIOLET}" stroke-width="1.6" opacity=".7"/>`;
  // abstract: synthwave sun + grid + word
  g += `<clipPath id="bbc"><rect x="16" y="16" width="188" height="98" rx="8"/></clipPath><g clip-path="url(#bbc)">`;
  g += `<circle cx="160" cy="92" r="34" fill="${PINK}" opacity=".85"/>`;
  [80, 88, 96, 104].forEach((y, i) => { g += `<rect x="120" y="${y}" width="80" height="${2 + i}" fill="#1a1140"/>`; });
  for (let i = 0; i < 9; i++) g += `<path d="M${110 + i * 10} 114 L${130 + i * 6} 100" stroke="${CYAN}" stroke-width="1.2" opacity=".6"/>`;
  g += `</g>`;
  g += neonWord(28, 34, 104, 34, CYAN, "bbn");
  g += neon(`M28 86 H120`, PINK, 3, "bbn") + neon(`M28 98 H90`, YELLOW, 3, "bbn");
  [[22, 10], [60, 10], [100, 10], [140, 10], [180, 10]].forEach(([x]) => { g += `<path d="M${x + 6} 6 h8 v6 h-8 Z" fill="#8d93b8" ${stk(2)}/>`; });
  return job("assets/img/billboard.png", W, H, g, defs);
}
function cone() {
  const W = 64, H = 80;
  const defs = lin("co", [[0, "#ffb36a"], [0.5, "#ff7a2a"], [1, "#c94a10"]], 0, 0, 1, 0) + blur("cb", 2);
  let g = `<ellipse cx="32" cy="73" rx="26" ry="4.5" fill="#07041a" opacity=".5" filter="url(#cb)"/>`;
  g += `<path d="M6 64 H58 L54 74 H10 Z" fill="#3a3f78" ${stk(3)}/>`;
  g += `<path d="M27 8 Q32 4 37 8 L50 66 Q32 72 14 66 Z" fill="url(#co)" ${stk(3)}/>`;
  g += `<path d="M22.5 28 Q32 31 41.5 28 L44.5 41 Q32 45 19.5 41 Z" fill="#f4f6ff" ${stk(2)}/>`;
  g += `<path d="M18 48 Q32 52 46 48 L47.8 56 Q32 60 16.2 56 Z" fill="#f4f6ff" ${stk(2)}/>`;
  g += `<path d="M28 12 L22 60" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>`;
  return job("assets/img/cone.png", W, H, g, defs);
}
function wantGas() {
  const W = 96, H = 96;
  const defs = rad("wb", [[0, "#ffffff"], [1, "#e8ecff"]]) + glow("wg", 3) + lin("wp", [[0, "#ff8a8a"], [1, "#e0304a"]]);
  let g = `<circle cx="48" cy="44" r="33" fill="${ORANGE}" opacity=".45" filter="url(#wg)"/>`;
  g += `<path d="M48 88 L39 74.5 A34 34 0 1 1 57 74.5 Z" fill="url(#wb)" stroke="${ORANGE}" stroke-width="5" stroke-linejoin="round"/>`;
  g += `<path d="M48 88 L39 74.5 A34 34 0 1 1 57 74.5 Z" fill="none" ${stk(2.4)}/>`;
  g += `<rect x="30" y="22" width="26" height="40" rx="5" fill="url(#wp)" ${stk(3)}/><rect x="35" y="28" width="16" height="11" rx="2" fill="#bff6ff" ${stk(2)}/>`;
  g += `<path d="M56 32 Q66 32 65 42 V54 Q65 58 61 58" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><rect x="60" y="24" width="8" height="10" rx="2" fill="#2a2d55" ${stk(2)}/>`;
  g += `<rect x="27" y="60" width="32" height="6" rx="2" fill="#2a2d55" ${stk(2)}/>`;
  g += `<path d="M36 44 V54" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>`;
  return job("assets/img/want_gas.png", W, H, g, defs);
}
// Delivery destination: glowing ring on the ground + floating parcel. Ground ellipse centre y 68.
function parcelMarker() {
  const W = 90, H = 90;
  const defs = glow("pm", 3) + rad("pr", [[0, YELLOW, 0], [0.7, YELLOW, 0.25], [1, YELLOW, 0]]);
  let g = `<ellipse cx="45" cy="68" rx="40" ry="16" fill="url(#pr)"/>`;
  g += neon(`M45 54 A36 13 0 1 1 44.99 54 Z`, YELLOW, 3, "pm");
  g += `<path d="M45 64 V30" stroke="${YELLOW}" stroke-width="10" opacity=".25" filter="url(#pm)"/>`;
  g += parcelBox(28, 50, 1.05, "#e0a464", 2.8);
  [[18, 22], [74, 30], [68, 10]].forEach(([x, y], i) => { g += `<path d="${star(x, y, 5 - i, 1.5, 4)}" fill="#fff6b8" filter="url(#pm)"/>`; });
  return job("assets/img/parcel.png", W, H, g, defs);
}
// Delivery target painted on the road (seen from above, a flat decal): neon bullseye rings,
// chevrons pointing in, a parcel glyph in the middle. Drawn as a slightly squashed ellipse
// so it reads as lying on the ground in the 3/4 view.
function deliveryTarget() {
  const W = 180, H = 130, cx = 90, cy = 65, ry = 0.62;
  const defs = glow("dt", 3) + rad("dtg", [[0, PINK, 0.35], [0.7, PINK, 0.12], [1, PINK, 0]]);
  let g = `<ellipse cx="${cx}" cy="${cy}" rx="86" ry="${86 * ry}" fill="url(#dtg)"/>`;
  [[74, PINK, 6], [52, "#fff3fa", 5], [30, PINK, 6]].forEach(([r, c, w]) => {
    g += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * ry}" fill="none" stroke="${c}" stroke-width="${w}" filter="url(#dt)" opacity=".95"/>`;
  });
  g += `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="${14 * ry}" fill="${PINK}" filter="url(#dt)"/>`;
  // four chevrons pointing to the centre
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
    const px = cx + dx * 64, py = cy + dy * 64 * ry, s = 9;
    const a = Math.atan2(-dy * ry, -dx), ca = Math.cos(a), sa = Math.sin(a);
    const P = (u, v) => `${f2(px + (u * ca - v * sa) * s)} ${f2(py + (u * sa + v * ca) * s * (dy ? ry : 1))}`;
    g += `<path d="M${P(-1, -1.2)} L${P(0.6, 0)} L${P(-1, 1.2)}" fill="none" stroke="${YELLOW}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#dt)"/>`;
  });
  return job("assets/img/target.png", W, H, g, defs);
}
function checkerFlag(x, y, w, h, sw, wave) {   // waving checkered flag, top-left at (x,y) attached to pole on the left
  const cols = 4, rows = 3;
  const P = (u, v) => [x + u * w, y + v * h + Math.sin(u * Math.PI * 1.6) * (wave || h * 0.12)];
  let g = "";
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const a = P(i / cols, j / rows), b = P((i + 1) / cols, j / rows), c = P((i + 1) / cols, (j + 1) / rows), d = P(i / cols, (j + 1) / rows);
    g += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])} L${f2(c[0])} ${f2(c[1])} L${f2(d[0])} ${f2(d[1])} Z" fill="${(i + j) % 2 ? "#1f1b3a" : "#f4f6ff"}"/>`;
  }
  const pts = []; for (let i = 0; i <= 12; i++) pts.push(P(i / 12, 0)); for (let i = 12; i >= 0; i--) pts.push(P(i / 12, 1));
  g += `<path d="M${pts.map((p) => f2(p[0]) + " " + f2(p[1])).join(" L")} Z" fill="none" ${stk(sw)}/>`;
  return g;
}
function flag() {
  const W = 70, H = 110;
  const defs = blur("fb", 2);
  let g = `<ellipse cx="16" cy="103" rx="12" ry="3.5" fill="#07041a" opacity=".5" filter="url(#fb)"/>`;
  g += `<rect x="12" y="8" width="7" height="96" rx="3" fill="#c9cde2" ${stk(2.8)}/><circle cx="15.5" cy="8" r="5" fill="${YELLOW}" ${stk(2.4)}/>`;
  g += checkerFlag(19, 14, 44, 34, 2.8, 4);
  return job("assets/img/flag.png", W, H, g, defs);
}
// The police car seen from BEHIND (race chase view): carBack() in the police livery (white body,
// navy trunk band + cyan trim + gold star) with the roof light bar (red left, blue right) in a
// 200×170 frame — the car occupies y 40..170 like car_back's 200×130 frame shifted down.
function policeBack() {
  const r = carBack({ body: "#f4f6fc", u: "pbk" });
  let g = `<g transform="translate(0 40)">${r.body}`;
  g += `<path d="M13 64 Q13 57 32 55.5 L168 55.5 Q187 57 187 64 Z" fill="#1f2766" ${stk(2.3)}/><path d="M16 64 H184" stroke="${CYAN}" stroke-width="2.6" stroke-linecap="round"/>`;
  g += `<path d="${star(100, 60, 6, 2.7)}" fill="${YELLOW}" ${stk(1.4)}/>`;
  g += `<circle cx="80" cy="6" r="16" fill="#ff3355" opacity=".55" filter="url(#pbg)"/><circle cx="120" cy="6" r="16" fill="#3d8bff" opacity=".55" filter="url(#pbg)"/>`;
  g += `<rect x="60" y="-2" width="80" height="15" rx="7" fill="#2a2d55" ${stk(3)}/><rect x="64" y="1" width="34" height="9" rx="4.5" fill="#ff5a74"/><rect x="102" y="1" width="34" height="9" rx="4.5" fill="#5aa8ff"/>`;
  g += `<rect x="68" y="2.5" width="14" height="3" rx="1.5" fill="#fff" opacity=".85"/><rect x="106" y="2.5" width="14" height="3" rx="1.5" fill="#fff" opacity=".85"/>`;
  g += `</g>`;
  return job("assets/img/police_back.png", 200, 170, g, r.defs + glow("pbg", 5));
}
// The police car seen from the FRONT, driving at the camera (rear-view-mirror pursuer): the
// same body as carBack() mirrored to a front view (windshield, navy hood + cyan trim + gold star,
// warm headlights, grille, bumper, blank plate) + the roof light bar; 200×170 frame like police_back.
function policeFront() {
  const u = "pfr", B = "#f4f6fc", sw = 3.5, s2 = sw * 0.65;
  const defs = lin(`${u}b`, [[0, shade(B, 0.45)], [0.5, B], [1, shade(B, -0.25)]]) +
    lin(`${u}h`, [[0, shade(B, -0.28)], [0.25, shade(B, 0.1)], [0.5, shade(B, 0.5)], [0.75, shade(B, 0.1)], [1, shade(B, -0.28)]], 0, 0, 1, 0) +
    lin(`${u}g`, [[0, "#5a6cc0"], [0.6, "#1d2350"], [1, "#141838"]]) + lin(`${u}n`, [[0, "#3a4aa8"], [1, "#1f2766"]]) +
    glow(`${u}gl`, 5) + blur(`${u}bl`, 3);
  let g = `<g transform="translate(0 40)">`;
  g += `<ellipse cx="100" cy="119" rx="90" ry="8" fill="#08051a" opacity=".4" filter="url(#${u}bl)"/>`;
  [[22, 52], [148, 178]].forEach(([a, b]) => { g += `<rect x="${a}" y="88" width="${b - a}" height="34" rx="9" fill="#1e1b30" ${stk(sw)}/><path d="M${a + 6} 112 H${b - 6}" stroke="#4a4766" stroke-width="${s2}" stroke-linecap="round"/>`; });
  // cabin + windshield (front glass is bigger than the rear window)
  g += `<path d="M44 58 L60 22 Q63 14 72 14 L128 14 Q137 14 140 22 L156 58 Z" fill="url(#${u}h)" ${stk(sw)}/>`;
  g += `<path d="M55 55 L67 24 Q69 20 74 20 L126 20 Q131 20 133 24 L145 55 Z" fill="url(#${u}g)" ${stk(s2)}/>`;
  g += `<path d="M76 24 L94 24 L80 52 L62 52 Z" fill="#9fdcff" opacity=".35"/><path d="M100 24 L106 24 L92 52 L86 52 Z" fill="#9fdcff" opacity=".25"/>`;
  g += `<path d="M70 50 L96 44" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M106 50 L132 44" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  // lower body + navy hood band + cyan trim + star
  const body = "M12 72 Q12 56 32 54 L168 54 Q188 56 188 72 L189 98 Q189 110 176 110 L24 110 Q11 110 11 98 Z";
  g += `<path d="${body}" fill="url(#${u}b)" ${stk(sw)}/>`;
  g += `<clipPath id="${u}c"><path d="${body}"/></clipPath><g clip-path="url(#${u}c)"><rect x="0" y="50" width="200" height="18" fill="url(#${u}n)"/><path d="M0 68 H200" stroke="${CYAN}" stroke-width="2.6"/></g>`;
  g += `<path d="${body}" fill="none" ${stk(sw)}/>`;
  g += `<path d="${star(100, 61, 6, 2.7)}" fill="${YELLOW}" ${stk(1.4)}/>`;
  // headlights on (warm glow), grille, bumper + blank plate
  [[18, 64], [136, 182]].forEach(([a, b]) => {
    g += `<ellipse cx="${(a + b) / 2}" cy="80" rx="${(b - a) * 0.75}" ry="16" fill="#ffd98a" opacity=".55" filter="url(#${u}gl)"/>`;
    g += `<rect x="${a}" y="73" width="${b - a}" height="14" rx="7" fill="#fff2b0" ${stk(s2)}/><rect x="${a + 5}" y="75.5" width="${(b - a) * 0.4}" height="4" rx="2" fill="#fff"/>`;
  });
  g += `<rect x="72" y="74" width="56" height="17" rx="6" fill="#17123a" ${stk(s2)}/>`;
  [78, 82.5, 87].forEach((y) => { g += `<path d="M78 ${y} H122" stroke="${CYAN}" stroke-width="2" stroke-linecap="round"/>`; });
  g += `<path d="M14 99 H186" stroke="${shade(B, -0.45)}" stroke-width="${s2}"/>`;
  g += `<rect x="82" y="96" width="36" height="12" rx="3" fill="#f4f6ff" ${stk(s2)}/>`;
  // roof light bar: red (left) + blue (right), glowing
  g += `<circle cx="80" cy="6" r="16" fill="#ff3355" opacity=".55" filter="url(#${u}gl)"/><circle cx="120" cy="6" r="16" fill="#3d8bff" opacity=".55" filter="url(#${u}gl)"/>`;
  g += `<rect x="60" y="-2" width="80" height="15" rx="7" fill="#2a2d55" ${stk(3)}/><rect x="64" y="1" width="34" height="9" rx="4.5" fill="#ff5a74"/><rect x="102" y="1" width="34" height="9" rx="4.5" fill="#5aa8ff"/>`;
  g += `<rect x="68" y="2.5" width="14" height="3" rx="1.5" fill="#fff" opacity=".85"/><rect x="106" y="2.5" width="14" height="3" rx="1.5" fill="#fff" opacity=".85"/>`;
  g += `</g>`;
  return job("assets/img/police_front.png", 200, 170, g, defs);
}
// Neon START gantry over the street race (seen from behind, slightly above): two metal pylons
// standing on y 215, a truss across the top with a chequered neon strip, a row of start lights
// (red + green) and pink/cyan accents. No text; the middle and bottom stay transparent.
function startGate() {
  const W = 400, H = 220, u = "sg";
  const defs = lin(`${u}m`, [[0, "#5d6288"], [0.45, "#c9cde2"], [1, "#4a4f78"]], 0, 0, 1, 0) + lin(`${u}t`, [[0, "#3a3f78"], [1, "#24204e"]]) + glow(`${u}n`, 3) + blur(`${u}b`, 2.5);
  let g = "";
  [[16, 36], [364, 384]].forEach(([a, b]) => {   // pylons (4–9 % / 91–96 % of the width)
    g += `<ellipse cx="${(a + b) / 2}" cy="215" rx="16" ry="4" fill="#07041a" opacity=".5" filter="url(#${u}b)"/>`;
    g += `<rect x="${a}" y="20" width="${b - a}" height="194" rx="4" fill="url(#${u}m)" ${stk(3.4)}/>`;
    for (let y = 70; y < 205; y += 28) g += `<path d="M${a + 3} ${y} L${b - 3} ${y + 22} M${b - 3} ${y} L${a + 3} ${y + 22}" stroke="#4a4f78" stroke-width="2.2"/>`;
    g += `<rect x="${a - 4}" y="206" width="${b - a + 8}" height="9" rx="3" fill="#3a3f78" ${stk(2.6)}/>`;
    g += neon(`M${a + (b - a) / 2} 66 V200`, a < 200 ? PINK : CYAN, 2.2, `${u}n`);
  });
  // truss: two chords + diagonals
  g += `<rect x="10" y="14" width="380" height="46" rx="8" fill="url(#${u}t)" ${stk(3.6)}/>`;
  for (let x = 22; x < 380; x += 24) g += `<path d="M${x} 18 L${x + 12} 56 M${x + 24} 18 L${x + 12} 56" stroke="#4a4f78" stroke-width="2"/>`;
  // chequered neon strip along the top
  g += `<rect x="14" y="16" width="372" height="12" rx="3" fill="#17123a"/>`;
  for (let i = 0; i < 31; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) g += `<rect x="${14 + i * 12}" y="${16 + j * 6}" width="12" height="6" fill="#f4f6ff"/>`;
  g += `<rect x="14" y="16" width="372" height="12" rx="3" fill="none" ${stk(2.2)}/>`;
  g += neon("M18 31 H382", CYAN, 2.2, `${u}n`);
  // start lights: a panel with five bulbs (3 red, 2 green) + pink accents
  g += `<rect x="128" y="34" width="144" height="24" rx="10" fill="#17123a" ${stk(3)}/>`;
  [["#ff3355", 0], ["#ff3355", 1], ["#ff3355", 2], ["#3ddc84", 3], ["#3ddc84", 4]].forEach(([c, i]) => {
    const x = 146 + i * 27;
    g += `<circle cx="${x}" cy="46" r="11" fill="${c}" opacity=".5" filter="url(#${u}n)"/><circle cx="${x}" cy="46" r="8" fill="${c}" ${stk(2)}/><circle cx="${x - 2.5}" cy="43.5" r="2.6" fill="#fff" opacity=".85"/>`;
  });
  g += neon("M30 50 H112", PINK, 2.4, `${u}n`) + neon("M288 50 H370", PINK, 2.4, `${u}n`);
  g += neon(star(60, 41, 6, 2, 4), YELLOW, 1.6, `${u}n`) + neon(star(340, 41, 6, 2, 4), YELLOW, 1.6, `${u}n`);
  return job("assets/img/start_gate.png", W, H, g, defs);
}
function carBackJob() { const r = carBack({ u: "cb" }); return job("assets/img/car_back.png", 200, 130, r.body, r.defs); }

/* ============================ ICONS ============================ */
const PAL = { ink: INK, pink: PINK, blue: "#3ab8ff", teal: "#2fd3e6", purple: VIOLET, gold: "#ffc93c", green: "#4fd68a", red: "#ff5a6a", orange: ORANGE };
const P = Object.assign({}, IK.DEF, PAL);
const st7 = (w) => IK.st(P, w);
const GAME_ICONS = {
  cash: () => { const [d1, f1] = IK.fill("#4fd68a"); const [d2, f2g] = IK.fill(P.gold);
    let b = `<g transform="rotate(-12 60 70)"><rect x="12" y="44" width="96" height="54" rx="9" fill="${f1}" ${st7(6)}/></g>`;
    b += `<rect x="14" y="36" width="96" height="54" rx="9" fill="${f1}" ${st7(7)}/><rect x="24" y="46" width="76" height="34" rx="5" fill="none" stroke="#e8fff1" stroke-width="3" opacity=".8"/><circle cx="62" cy="63" r="12" fill="#bff5d6" ${st7(4)}/><path d="M62 55 V71" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    b += `<circle cx="96" cy="94" r="22" fill="${f2g}" ${st7(7)}/><path d="${star(96, 95, 10, 4.5)}" fill="#fff6c2"/>`;
    return { defs: d1 + d2, body: b }; },
  fuel: () => { const [d, f] = IK.fill(P.red);
    let b = `<rect x="22" y="18" width="56" height="92" rx="10" fill="${f}" ${st7()}/><rect x="32" y="30" width="36" height="24" rx="5" fill="#bff6ff" ${st7(5)}/>`;
    b += `<path d="M78 40 Q100 40 100 60 V92 Q100 102 92 102" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><rect x="90" y="22" width="16" height="22" rx="4" fill="#3a3f78" ${st7(5)}/>`;
    b += `<rect x="14" y="104" width="72" height="12" rx="4" fill="#3a3f78" ${st7(6)}/>` + IK.shine("M36 66 V92");
    return { defs: d, body: b }; },
  car: () => { const r = carBack({ body: PINK, sw: 10, u: "ic", lights: true }); return { defs: r.defs, body: `<g transform="translate(64 66) scale(0.56) translate(-100 -66)">${r.body}</g>` }; },
  parcel: () => ({ defs: "", body: `<g transform="translate(6 120) scale(3.05)">${parcelBox(0, 0, 1, "#e8a95e", 2.3).replace(/translate\(0 0\)/, "")}</g>` }),
  police: () => { const [d, f] = IK.fill(P.blue); const [d2, f2r] = IK.fill(P.red);
    let b = `<g opacity=".9">${[-60, -30, 0, 30, 60].map((a) => `<path d="M64 52 L${f2(64 + Math.sin(a * Math.PI / 180) * 56)} ${f2(52 - Math.cos(a * Math.PI / 180) * 46)}" stroke="${P.gold}" stroke-width="7" stroke-linecap="round"/>`).join("")}</g>`;
    b += `<path d="M30 92 V64 Q30 34 64 34 Q98 34 98 64 V92 Z" fill="${f}" ${st7()}/><path d="M64 36 Q30 36 30 64 V92 H64 Z" fill="${f2r}"/><path d="M30 92 V64 Q30 34 64 34 Q98 34 98 64 V92 Z" fill="none" ${st7()}/>`;
    b += IK.shine("M42 60 Q44 48 54 44") + `<rect x="16" y="90" width="96" height="22" rx="8" fill="#3a3f78" ${st7()}/>`;
    return { defs: d + d2, body: b }; },
  wanted: () => { const [d, f] = IK.fill(P.gold);
    let b = `<path d="${star(64, 68, 44, 21)}" fill="${f}" ${st7()}/>`;
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; b += `<circle cx="${f2(64 + Math.cos(a) * 45)}" cy="${f2(68 + Math.sin(a) * 45)}" r="9.5" fill="${f}" ${st7(6)}/>`; }
    b += `<circle cx="64" cy="68" r="14" fill="#fff6c2" ${st7(5)}/><circle cx="64" cy="68" r="5" fill="${INK}"/>${IK.shine("M50 52 L56 42")}`;
    return { defs: d, body: b }; },
  flag: () => ({ defs: "", body: `<rect x="18" y="12" width="12" height="106" rx="5" fill="#c9cde2" ${st7(6)}/><circle cx="24" cy="12" r="8" fill="${P.gold}" ${st7(5)}/>` + checkerFlag(30, 20, 84, 60, 7, 8) }),
  dealer: () => { const [d, f] = IK.fill(P.gold); const [d2, ft] = IK.fill(PINK);
    let b = `<path d="M70 28 L104 22 L114 52 L82 64 Z" fill="${ft}" ${st7(6)}/><circle cx="96" cy="36" r="5" fill="#fff" ${st7(4)}/><path d="M78 56 Q66 66 58 62" fill="none" ${st7(4)}/>`;
    b += `<circle cx="42" cy="74" r="26" fill="${f}" ${st7()}/><circle cx="42" cy="74" r="9" fill="#2a2d55" ${st7(4)}/>`;
    b += `<path d="M60 92 L98 112 M80 102 L76 112 M90 107 L86 116" ${st7(18)}/><path d="M60 92 L98 112 M80 102 L76 112 M90 107 L86 116" stroke="${P.gold}" stroke-width="7" stroke-linecap="round"/>` + IK.shine("M28 66 Q30 58 38 54");
    return { defs: d + d2, body: b }; },
  garage: () => { let b = sprayCan(56, 70, 1.65, 7, PINK); [[96, 26, P.teal], [108, 44, P.gold], [92, 46, P.purple], [112, 22, PINK]].forEach(([x, y, c]) => { b += `<circle cx="${x}" cy="${y}" r="7" fill="${c}" ${st7(4)}/>`; }); return { defs: "", body: b }; },
  wrench: () => { const [d, f] = IK.fill("#c3c9e4");
    const b = `<g transform="translate(64 64) scale(0.86) rotate(45) translate(-64 -62)"><path d="M52 44 V110 Q52 122 64 122 Q76 122 76 110 V44 Q92 38 92 20 Q92 8 84 2 V22 L64 30 L44 22 V2 Q36 8 36 20 Q36 38 52 44 Z" fill="${f}" ${st7()}/><path d="M58 52 V110" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/><circle cx="64" cy="108" r="5" fill="#6d7393"/></g>`;
    return { defs: d, body: b }; },
  speed: () => { const [d, f] = IK.fill(P.gold); return { defs: d, body: `<path d="M74 8 L28 70 H60 L50 120 L102 52 H70 Z" fill="${f}" ${st7()}/>${IK.shine("M64 24 L46 52")}` }; },
  grip: () => { const [d, f] = IK.fill("#d5dbf0");
    let b = `<circle cx="64" cy="64" r="52" fill="#4a4576" ${st7()}/><circle cx="64" cy="64" r="40" fill="none" stroke="#2a2550" stroke-width="4"/>`;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; b += `<path d="M${f2(64 + Math.cos(a) * 43)} ${f2(64 + Math.sin(a) * 43)} L${f2(64 + Math.cos(a) * 52)} ${f2(64 + Math.sin(a) * 52)}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`; }
    b += `<circle cx="64" cy="64" r="28" fill="${f}" ${st7(6)}/>`;
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; b += `<path d="M64 64 L${f2(64 + Math.cos(a) * 22)} ${f2(64 + Math.sin(a) * 22)}" stroke="#8a90aa" stroke-width="5" stroke-linecap="round"/>`; }
    b += `<circle cx="64" cy="64" r="9" fill="${P.teal}" ${st7(4)}/>${IK.shine("M26 48 Q32 30 48 22")}`;
    return { defs: d, body: b }; },
  range: () => { const [d, f] = IK.fill(P.orange); return { defs: d, body: `<path d="M64 10 Q100 58 100 80 Q100 116 64 116 Q28 116 28 80 Q28 58 64 10 Z" fill="${f}" ${st7()}/>${IK.shine("M44 80 Q44 66 54 56")}` }; },
  stunt: () => { const r = carSide({ body: "#e8357a", stripe: CYAN, sw: 14, u: "is" });
    let b = `<path d="M8 116 L120 116 L120 80 Z" fill="${P.gold}" ${st7()}/><path d="M48 116 L64 104 M78 116 L96 96 M104 116 L116 88" stroke="#2a2550" stroke-width="8"/>`;
    b += `<g transform="translate(8 56) rotate(-20) scale(0.34)">${r.body}</g>`;
    b += `<path d="${star(24, 20, 15, 5, 4)}" fill="#fff" ${st7(4)}/><path d="${star(112, 30, 9, 3, 4)}" fill="${P.gold}" ${st7(3)}/>`;
    return { defs: r.defs, body: b }; },
  bed: () => { const [d, f] = IK.fill(P.purple);
    let b = `<rect x="12" y="40" width="14" height="74" rx="5" fill="#8d93b8" ${st7(6)}/><rect x="102" y="66" width="14" height="48" rx="5" fill="#8d93b8" ${st7(6)}/>`;
    b += `<rect x="18" y="72" width="94" height="28" rx="8" fill="#f4f6ff" ${st7(6)}/><rect x="28" y="56" width="30" height="20" rx="9" fill="#fff" ${st7(5)}/><path d="M52 64 Q82 56 110 70 L110 98 H52 Z" fill="${f}" ${st7(6)}/>`;
    b += `<path d="M70 16 H90 L70 36 H90 M96 8 H108 L96 20 H108" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 16 H90 L70 36 H90 M96 8 H108 L96 20 H108" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    return { defs: d, body: b }; },
  city: () => { const [d, f] = IK.fill(P.purple); const [d2, f2b] = IK.fill(P.blue); const [d3, f3] = IK.fill(PINK);
    let b = `<path d="M90 30 A20 20 0 1 0 108 52 A16 16 0 1 1 90 30 Z" fill="${P.gold}" ${st7(5)}/>`;
    b += `<rect x="14" y="54" width="32" height="62" rx="4" fill="${f2b}" ${st7()}/><rect x="42" y="24" width="38" height="92" rx="4" fill="${f}" ${st7()}/><rect x="76" y="66" width="38" height="50" rx="4" fill="${f3}" ${st7()}/>`;
    [[50, 36], [64, 36], [50, 54], [64, 54], [50, 72], [64, 90], [22, 66], [22, 84], [84, 78], [98, 78], [84, 96]].forEach(([x, y]) => { b += `<rect x="${x}" y="${y}" width="9" height="10" rx="2" fill="#fff6c2"/>`; });
    return { defs: d + d2 + d3, body: b }; },
  quit: () => ({ defs: "", body: `<rect x="20" y="10" width="11" height="108" rx="5" fill="#8d93b8" ${st7(6)}/><path d="M31 18 Q52 8 70 20 Q88 32 110 20 V70 Q88 82 70 70 Q52 58 31 68 Z" fill="#fff" ${st7()}/><path d="M40 30 Q54 24 66 32" fill="none" stroke="#d5d9ee" stroke-width="5" stroke-linecap="round"/>` }),
  left: () => { const [d, f] = IK.fill(P.teal); return { defs: d, body: `<path d="M12 64 L58 18 V44 H112 V84 H58 V110 Z" fill="${f}" ${st7()}/>${IK.shine("M64 54 H100")}` }; },
  right: () => { const [d, f] = IK.fill(P.teal); return { defs: d, body: `<path d="M116 64 L70 18 V44 H16 V84 H70 V110 Z" fill="${f}" ${st7()}/>${IK.shine("M28 54 H64")}` }; },
  timer: () => { const [d, f] = IK.fill(P.teal);
    let b = `<rect x="54" y="6" width="20" height="16" rx="4" fill="#8d93b8" ${st7(6)}/><path d="M98 30 L106 22" ${st7(12)}/><path d="M98 30 L106 22" stroke="#8d93b8" stroke-width="5" stroke-linecap="round"/>`;
    b += `<circle cx="64" cy="70" r="48" fill="${f}" ${st7()}/><circle cx="64" cy="70" r="36" fill="#fff" ${st7(5)}/>`;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; b += `<path d="M${f2(64 + Math.cos(a) * 30)} ${f2(70 + Math.sin(a) * 30)} L${f2(64 + Math.cos(a) * 34)} ${f2(70 + Math.sin(a) * 34)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`; }
    b += `<path d="M64 70 L64 44" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M64 70 L82 80" stroke="${PINK}" stroke-width="6" stroke-linecap="round"/><circle cx="64" cy="70" r="5" fill="${INK}"/>`;
    return { defs: d, body: b }; },
  distance: () => { const [d, f] = IK.fill(PINK);
    let b = `<path d="M30 120 L52 40 H76 L98 120 Z" fill="#3a3f78" ${st7()}/><path d="M64 46 V58 M64 70 V86 M64 98 V116" stroke="${P.gold}" stroke-width="6" stroke-linecap="round"/>`;
    b += `<path d="M64 76 Q40 50 40 34 Q40 10 64 10 Q88 10 88 34 Q88 50 64 76 Z" fill="${f}" ${st7()}/><circle cx="64" cy="34" r="10" fill="#fff" ${st7(5)}/>${IK.shine("M50 30 Q52 20 60 18")}`;
    return { defs: d, body: b }; },
  wash: () => { const [d, f] = IK.fill("#ffd23c"); const [d2, fb] = IK.fill("#5ad0ff");
    let b = `<g transform="rotate(-14 58 76)"><path d="M14 60 Q12 44 30 44 H86 Q104 44 102 60 V92 Q104 108 86 108 H30 Q12 108 14 92 Z" fill="${f}" ${st7()}/>`;
    b += `<circle cx="34" cy="74" r="5" fill="#d9921a"/><circle cx="62" cy="88" r="5.5" fill="#d9921a"/><circle cx="82" cy="70" r="4.5" fill="#d9921a"/>`;
    b += [[24, 44, 13], [46, 38, 16], [70, 40, 14], [92, 44, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${st7(6)}/>`).join("") + `<path d="M18 46 H98" stroke="#fff" stroke-width="12" stroke-linecap="round"/></g>`;
    b += `<circle cx="104" cy="26" r="15" fill="${fb}" ${st7(6)}/><path d="M97 21 Q99 15 106 14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="22" r="10" fill="${fb}" ${st7(5)}/>`;
    return { defs: d + d2, body: b }; },
  clean: () => { const r = carSide({ body: PINK, stripe: CYAN, sw: 13, u: "icl", hk: 1.42, wk: 1.2 });
    let b = `<g transform="translate(6 60) scale(0.365)">${r.body}</g>`;
    b += `<path d="${star(98, 24, 20, 6, 4)}" fill="${P.gold}" ${st7(4)}/><path d="${star(32, 22, 12, 4, 4)}" fill="#fff" ${st7(4)}/><path d="${star(66, 12, 8, 2.6, 4)}" fill="#bff6ff" ${st7(3)}/>`;
    return { defs: r.defs, body: b }; },
};
function gameIcons() { return Object.entries(GAME_ICONS).map(([n, fn]) => { const r = fn(); return IK.job(`assets/ui/icons/${n}.png`, r.body, r.defs); }); }

/* ============================ LOGO / ICON / SPLASH ============================ */
// small neon skyline (outline buildings), x0..x0+w, ground y
function skyline(x0, w, gy, scale, R, u, fillC) {
  let g = "", x = x0;
  const cols = [CYAN, PINK, VIOLET, YELLOW];
  while (x < x0 + w - 10) {
    const bw = (26 + R() * 34) * scale, bh = (50 + R() * 110) * scale, c = cols[Math.floor(R() * 4)];
    g += `<rect x="${f2(x)}" y="${f2(gy - bh)}" width="${f2(bw)}" height="${f2(bh)}" fill="${fillC || "#1d1446"}"/>`;
    for (let yy = gy - bh + 8 * scale; yy < gy - 8 * scale; yy += 12 * scale) for (let xx = x + 5 * scale; xx < x + bw - 8 * scale; xx += 10 * scale) if (R() < 0.45) g += `<rect x="${f2(xx)}" y="${f2(yy)}" width="${f2(5 * scale)}" height="${f2(6 * scale)}" fill="${R() < 0.6 ? "#ffd98a" : mix(c, "#fff", 0.4)}" opacity=".85"/>`;
    g += neon(`M${f2(x)} ${f2(gy)} V${f2(gy - bh)} H${f2(x + bw)} V${f2(gy)}`, c, 2 * scale, u);
    x += bw + (4 + R() * 8) * scale;
  }
  return g;
}
function logo() {
  const W = 520, H = 300;
  const cs = carSide({ body: PINK, stripe: CYAN, u: "lc", sw: 4.5 });
  const defs = cs.defs + glow("ln", 4) + rad("lh", [[0, "#7a2a9a", 0.85], [0.6, "#3a1a6a", 0.45], [1, "#160f28", 0]]) + rad("ls", [[0, "#ffe27a"], [0.5, "#ff7aa8"], [1, "#ff4fa0"]], 0.5, 0.2, 0.9);
  let g = `<ellipse cx="260" cy="170" rx="255" ry="130" fill="url(#lh)"/>`;
  // synthwave sun
  g += `<clipPath id="lsc"><circle cx="260" cy="150" r="92"/></clipPath><g clip-path="url(#lsc)"><rect x="160" y="50" width="200" height="140" fill="url(#ls)"/>${[150, 164, 176, 186, 194].map((y, i) => `<rect x="160" y="${y}" width="200" height="${3 + i * 1.5}" fill="#3a1a6a"/>`).join("")}</g>`;
  g += skyline(54, 412, 210, 0.85, rng(9), "ln");
  g += `<rect x="40" y="208" width="440" height="6" rx="3" fill="${CYAN}" opacity=".7" filter="url(#ln)"/>`;
  g += `<g transform="translate(260 222) scale(1.12) translate(-160 -96)">${cs.body}</g>`;
  g += badge7(438, 74, 42, "ln");
  [[70, 60, 14, YELLOW], [110, 30, 9, "#fff"], [380, 30, 10, CYAN], [490, 160, 9, "#fff"], [30, 150, 8, PINK]].forEach(([x, y, r, c]) => { g += `<path d="${star(x, y, r, r * 0.33, 4)}" fill="${c}" filter="url(#ln)"/>`; });
  return job("assets/img/logo.png", W, H, g, defs);
}
function icon(file, size, safe = 1) {
  const S = 512, k = safe;
  const cb = carBack({ body: PINK, sw: 6, u: "ic" });
  const defs = cb.defs + rad("ib", [[0, "#4a2a8a"], [0.6, "#24164e"], [1, "#0e0a24"]], 0.5, 0.4, 0.8) + glow("in", 6) + rad("isn", [[0, "#ffe27a"], [0.55, "#ff7aa8"], [1, "#ff4fa0"]], 0.5, 0.15, 0.9) + blur("ibl", 10);
  let g = `<rect width="${S}" height="${S}" fill="url(#ib)"/>`;
  // perspective neon grid floor
  g += `<g opacity=".7">${[330, 352, 380, 416, 462].map((y) => `<path d="M0 ${y} H512" stroke="${VIOLET}" stroke-width="3"/>`).join("")}${[-6, -4, -2, 0, 2, 4, 6].map((i) => `<path d="M${256 + i * 18} 310 L${256 + i * 110} 512" stroke="${VIOLET}" stroke-width="3"/>`).join("")}</g>`;
  g += `<g transform="translate(256 262) scale(${k}) translate(-256 -262)">`;
  g += `<clipPath id="isc"><circle cx="256" cy="232" r="150"/></clipPath><g clip-path="url(#isc)"><rect x="100" y="80" width="312" height="230" fill="url(#isn)"/>${[230, 254, 274, 290, 302].map((y, i) => `<rect x="100" y="${y}" width="312" height="${5 + i * 2.5}" fill="#24164e"/>`).join("")}</g>`;
  g += skyline(70, 372, 312, 1.25, rng(21), "in", "#140c34");
  g += `<rect x="40" y="308" width="432" height="8" rx="4" fill="${CYAN}" filter="url(#in)"/>`;
  g += `<ellipse cx="256" cy="452" rx="170" ry="16" fill="#000" opacity=".5" filter="url(#ibl)"/>`;
  g += `<g transform="translate(256 380) scale(1.62) translate(-100 -66)">${cb.body}</g>`;
  g += badge7(412, 104, 66, "in");
  g += `</g>`;
  [[86, 92, 22, YELLOW], [150, 50, 12, "#fff"], [60, 220, 10, "#fff"]].forEach(([x, y, r, c]) => { g += `<path d="${star(x, y, r * k, r * 0.33 * k, 4)}" fill="${c}" filter="url(#in)"/>`; });
  return Object.assign(job(file, S, S, g, defs), { scale: size / S });
}
function splash() {
  const W = 900, H = 1600;
  const cs = carSide({ body: PINK, stripe: CYAN, u: "sc", sw: 4 });
  let defs = cs.defs + lin("ssk", [[0, "#0d0826"], [0.3, "#24124e"], [0.48, "#5a2178"], [0.56, "#c23a86"], [0.6, "#ff7a8a"]]) +
    rad("ssn", [[0, "#ffe27a"], [0.55, "#ff8aa0"], [1, "#ff4fa0"]], 0.5, 0.15, 0.9) + glow("sn", 4) + blur("sbl", 8) + blur("sbl2", 18) +
    lin("srd", [[0, "#2b2f4d"], [1, "#161830"]]) + lin("ssw", [[0, "#6a6e96"], [1, "#4a4d72"]]);
  let g = `<rect width="${W}" height="${H}" fill="url(#ssk)"/>`;
  const R = rng(77);
  for (let i = 0; i < 90; i++) g += `<circle cx="${f2(R() * W)}" cy="${f2(R() * 560)}" r="${f2(0.8 + R() * 1.8)}" fill="#fff" opacity="${f2(0.3 + R() * 0.6)}"/>`;
  [[150, 180, 16], [760, 120, 12], [640, 300, 9], [90, 420, 10]].forEach(([x, y, r]) => { g += `<path d="${star(x, y, r, r * 0.3, 4)}" fill="#fff6c8" filter="url(#sn)"/>`; });
  // synthwave sun on the horizon
  g += `<circle cx="450" cy="700" r="250" fill="#ff4fa0" opacity=".25" filter="url(#sbl2)"/>`;
  g += `<clipPath id="ssc"><circle cx="450" cy="700" r="215"/></clipPath><g clip-path="url(#ssc)"><rect x="230" y="480" width="440" height="440" fill="url(#ssn)"/>${[640, 676, 708, 736, 760, 780].map((y, i) => `<rect x="230" y="${y}" width="440" height="${6 + i * 3}" fill="#5a2178"/>`).join("")}</g>`;
  // far skyline + towers
  g += skyline(-10, 930, 900, 1.6, rng(5), "sn", "#1d1446");
  const t1 = tower({ u: "st1", x0: 24, w: 160, d: 30, dy: 22, top: 100, base: 326, wall: "#3b3577", accent: CYAN, cols: 4, rows: 7, glyph: "bolt", seed: 3 });
  const t2 = tower({ u: "st2", x0: 30, w: 150, d: 28, dy: 20, top: 110, base: 326, wall: "#4a2f6e", accent: PINK, win: "strips", cols: 4, rows: 9, glyph: "moon", glyph2: "star", accent2: CYAN, seed: 8 });
  defs += t1.defs + t2.defs;
  g += `<g transform="translate(-60 380) scale(1.62)">${t1.body}</g>`;
  g += `<g transform="translate(560 400) scale(1.58)">${t2.body}</g>`;
  // sidewalk + road
  g += `<rect x="0" y="905" width="${W}" height="110" fill="url(#ssw)"/>`;
  for (let x = 0; x < W; x += 90) g += `<path d="M${x} 905 V1015" stroke="#3f4263" stroke-width="4"/>`;
  g += `<path d="M0 960 H${W}" stroke="#3f4263" stroke-width="3"/><rect x="0" y="1008" width="${W}" height="14" fill="#8d93b8"/><rect x="0" y="1020" width="${W}" height="${H - 1020}" fill="url(#srd)"/>`;
  // neon reflections on the wet road
  [[130, CYAN], [270, PINK], [450, YELLOW], [640, PINK], [800, CYAN]].forEach(([x, c]) => { g += `<rect x="${x - 18}" y="1040" width="36" height="420" fill="${c}" opacity=".18" filter="url(#sbl)"/>`; });
  for (let x = 30; x < W; x += 170) g += `<rect x="${x}" y="1330" width="100" height="12" rx="6" fill="${YELLOW}" opacity=".9"/>`;
  // palms + lamps on the sidewalk
  const pm = palm(), sl = streetlamp();
  const inner = (j) => j.svg.replace(/^<svg[^>]*><defs>/, "").replace(/<\/defs>/, "").replace(/<\/svg>$/, "");
  g += `<g transform="translate(20 640) scale(1.7)">${inner(pm)}</g><g transform="translate(700 650) scale(1.62)">${inner(pm).replace(/id="p/g, 'id="q').replace(/#p/g, "#q")}</g>`;
  g += `<g transform="translate(232 690) scale(1.75)">${inner(sl)}</g>`;
  // the car + the two heroes
  g += `<ellipse cx="450" cy="1098" rx="300" ry="24" fill="#000" opacity=".45" filter="url(#sbl)"/>`;
  g += `<g transform="translate(450 1102) scale(1.85) translate(-160 -118)">${cs.body}</g>`;
  [["man", 178, 1165, 2.6], ["woman", 724, 1165, 2.6]].forEach(([id, x, y, s], i) => {
    const r = person(PEOPLE[id], "down", 0, false, "sp" + i); defs += r.defs;
    g += `<ellipse cx="${x}" cy="${y - 2}" rx="${30 * s}" ry="${6 * s}" fill="#000" opacity=".4" filter="url(#sbl)"/>`;
    g += `<g transform="translate(${x} ${y}) scale(${s}) translate(-64 -121)">${r.body}</g>`;
  });
  return K.job("assets/img/splash.png", W, H, g, defs);
}

/* ============================ CAR WASH CLOSE-UP ============================ */
// Hand-wash scene, two backdrops per car colour:
//   wash_<v>[_done]       900×1300 PORTRAIT (cover-fit: a 390×844 phone shows x ≈ 0.17–0.83):
//                         the hood + front fender + front wheel + start of the doors
//   wash_<v>_wide[_done]  1600×900 LANDSCAPE: the whole car
// carP(): the game's short bubbly coupe as a 3D cartoon (rounded-rect lower body + a rounded
// shoulder loft + a deck whose hood dips to the nose, a lofted cabin, fender flares, wheels as
// projected discs) in a real perspective 3/4 FRONT view (camera ~24° above; portrait yaw 142°,
// landscape 152° so the side is flatter), standing on a marked outdoor neon wash bay.
// The girl (washGirl(): modest sporty swimsuit + board shorts) stands BEHIND the hood and
// sprays over it; _done = clean plane-aligned gloss + sparkles + thumbs-up.
const WASH_COLORS = {   // body (config variant colour) + the neon stripe that reads on it
  silver: ["#dcdce4", CYAN], red: ["#e24a4a", YELLOW], blue: ["#4a96f0", YELLOW],
  yellow: ["#facd46", PINK], green: ["#5ac878", PINK], purple: ["#b06cf0", CYAN],
};
// car space: x = length (nose +150, tail −150), y = up (ground 0, sill 14, shoulder 48, belt 62,
// roof 106), z = width (near side −62, far side +62).
const CARP = { hl: 140, hw: 62, rc: 26, sill: 14, shoulder: 42, belt: 56, roof: 104, inset: 7, dip: 9,
  axle: 28, wr: 28, wellR: 32, flare: 8, wx: 88,
  cabBase: [-92, 48, 52, 22], cabTop: [-74, 4, 46, 20], hood: [52, 140] };
const VIEWS = { portrait: { yaw: 150, elev: 30, dist: 1500, aim: 40 }, wide: { yaw: 150, elev: 24, dist: 1500, aim: 40 } };
let PV = VIEWS.portrait;
function projP3(x, y, z) {   // → [screen x, screen y (down), depth], ~car units at the car centre
  const ya = PV.yaw * Math.PI / 180, el = PV.elev * Math.PI / 180, D = PV.dist;
  const ca = Math.cos(ya), sa = Math.sin(ya), ce = Math.cos(el), se = Math.sin(el);
  const X = x * ca - z * sa, Z = x * sa + z * ca, vy = y - (PV.aim + se * D), vz = Z - ce * D;
  const depth = -se * vy - ce * vz, up = ce * vy - se * vz;
  return [X / depth * D, -up / depth * D, depth];
}
const projP = (x, y, z) => { const p = projP3(x, y, z); return [p[0], p[1]]; };
// deck height: flat over the cabin/trunk, the hood dips smoothly toward the nose
const yTop = (x) => CARP.belt - (x > CARP.hood[0] ? CARP.dip * Math.pow((x - CARP.hood[0]) / (CARP.hl - CARP.hood[0]), 1.6) : 0);
function planRR(x0, x1, hz, r, n) {   // rounded-rect plan outline (CCW seen from above)
  n = n || 7; r = Math.min(r, (x1 - x0) / 2 - 0.5, hz - 0.5); const pts = [], cs = [[x1 - r, hz - r, 0], [x0 + r, hz - r, 90], [x0 + r, -hz + r, 180], [x1 - r, -hz + r, 270]];
  cs.forEach(([cx, cz, a0]) => { for (let i = 0; i <= n; i++) { const a = (a0 + 90 * i / n) * Math.PI / 180; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } });
  return pts;
}
function faceVisible(p, q) {   // vertical face on plan edge p→q (outward normal) faces the camera?
  const ya = PV.yaw * Math.PI / 180, el = PV.elev * Math.PI / 180;
  const nx = q[1] - p[1], nz = -(q[0] - p[0]), mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;
  const ca = Math.cos(ya), sa = Math.sin(ya), camX = 0, camZ = Math.cos(el) * PV.dist;
  const X = mx * ca - mz * sa, Z = mx * sa + mz * ca, NX = nx * ca - nz * sa, NZ = nx * sa + nz * ca;
  return NX * (camX - X) + NZ * (camZ - Z) > 0;
}
const pathOf = (pts) => "M" + pts.map((p) => `${f2(p[0])} ${f2(p[1])}`).join(" L") + " Z";
const yf = (y) => (typeof y === "function" ? y : () => y);
// visible run of a lofted band between two plan outlines (same point count), heights y0 → y1
function bandRun(lo, hi, y0, y1, pick) {
  const n = lo.length, vis = [], Y0 = yf(y0), Y1 = yf(y1);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; vis.push(faceVisible(lo[i], lo[j]) && (!pick || pick(lo[i], lo[j]))); }
  const s0 = vis.findIndex((v, i) => v && !vis[(i - 1 + n) % n]); if (s0 < 0) return null;
  const top = [], bot = []; let i = s0;
  const add = (k) => { top.push(projP(hi[k][0], Y1(hi[k][0]), hi[k][1])); bot.push(projP(lo[k][0], Y0(lo[k][0]), lo[k][1])); };
  add(i);
  while (vis[i]) { const j = (i + 1) % n; add(j); i = j; if (i === s0) break; }
  return top.concat(bot.reverse());
}
const onSide = (pts, e) => pts.map(([x, y]) => projP(x, y, -CARP.hw - (e || 0)));
const onNose = (pts, e) => pts.map(([z, y]) => projP(CARP.hl + (e || 0), y, z));
const onDeck = (pts) => pts.map(([x, z]) => projP(x, yTop(x), z));
const rectPts = (a0, a1, b0, b1) => [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
// a deck strip x0..x1 × z0..z1 sampled along x so it follows the hood dip
const deckStrip = (x0, x1, z0, z1, n) => { n = n || 8; const a = [], b = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; a.push([x, z0]); b.push([x, z1]); } return onDeck(a.concat(b.reverse())); };
const sideLine = (x0, x1, y) => { const a = projP(x0, y, -CARP.hw - 0.6), b = projP(x1, y, -CARP.hw - 0.6); return `M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}`; };
function sideArc(cx, cy, r0, r1, a0, a1, n) {   // annulus sector on the near side plane (angles in degrees, 0 = +x, 90 = up)
  n = n || 22; const o = [], i = [];
  for (let k = 0; k <= n; k++) { const a = (a0 + (a1 - a0) * k / n) * Math.PI / 180; o.push([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]); i.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0]); }
  return onSide(o.concat(i.reverse()), 0.8);
}
// windshield / side-window parametrisation on the cabin frustum faces
function cabinFaces() {
  const C = CARP, [bx0, bx1, bz, br] = C.cabBase, [tx0, tx1, tz, tr] = C.cabTop;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ws = (t, zf) => projP(lerp(bx1, tx1, t) + 0.6, lerp(C.belt, C.roof, t), lerp(bz, tz, t) * zf);
  const sw = (xu, t) => { const xa = lerp(bx0 + br, tx0 + tr, t), xb = lerp(bx1 - br, tx1 - tr, t); return projP(lerp(xa, xb, xu), lerp(C.belt, C.roof, t), -lerp(bz, tz, t) - 0.6); };
  return {
    ws, sw,
    windshield: [ws(0.1, -0.8), ws(0.1, 0.8), ws(0.9, 0.82), ws(0.9, -0.82)],
    sideWins: [[0.03, 0.46], [0.54, 0.97]].map(([a, b]) => [sw(a, 0.14), sw(b, 0.14), sw(b, 0.86), sw(a, 0.86)]),
  };
}
function carP(B, S, u, done) {
  const C = CARP, L = C.hl, Wh = C.hw;
  const defs = lin(`${u}sd`, [[0, shade(B, 0.22)], [0.55, B], [1, shade(B, -0.3)]]) + lin(`${u}sh`, [[0, shade(B, 0.5)], [1, shade(B, 0.08)]]) +
    lin(`${u}tp`, [[0, shade(B, 0.62)], [1, shade(B, 0.25)]], 0, 0, 1, 1) + lin(`${u}rf`, [[0, shade(B, 0.62)], [1, shade(B, 0.4)]], 0, 0, 1, 1) +
    lin(`${u}ns`, [[0, shade(B, 0.0)], [1, shade(B, -0.34)]]) + lin(`${u}fl`, [[0, shade(B, 0.3)], [1, shade(B, -0.05)]]) +
    lin(`${u}gl`, [[0, "#7a8ce0"], [0.5, "#2a3270"], [1, "#161a40"]], 0, 0, 0.4, 1) + rad(`${u}w`, [[0, "#ffffff"], [0.55, "#c9cfe4"], [1, "#6d7393"]], 0.4, 0.35, 0.7) +
    glow(`${u}g`, 3) + blur(`${u}bl`, 9) + blur(`${u}b2`, 1.2);
  const st = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  let g = "", front = "";
  // soft shadow + hard tyre contacts
  const ell = (cx, cz, rx, rz) => { const p = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; p.push(projP(cx + Math.cos(a) * rx, 0, cz + Math.sin(a) * rz)); } return pathOf(p); };
  g += `<path d="${ell(0, 0, L + 18, Wh + 16)}" fill="#05030f" opacity=".5" filter="url(#${u}bl)"/>`;
  [[C.wx, -Wh + 8], [-C.wx, -Wh + 8], [C.wx, Wh - 8], [-C.wx, Wh - 8]].forEach(([x, z]) => { g += `<path d="${ell(x, z, C.wr * 0.95, 11)}" fill="#05030f" opacity=".8" filter="url(#${u}b2)"/>`; });
  const disc = (wx, wz, r, e) => { const p = []; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; p.push(projP(wx + Math.cos(a) * r, C.axle + Math.sin(a) * r, wz + e)); } return pathOf(p); };
  const wheel = (wx, wz, far) => {
    let w = `<path d="${disc(wx, wz, C.wr, 0)}" fill="#1e1b30" ${st(3)}/>`;
    if (far) return w;
    w += `<path d="${disc(wx, wz, C.wr, -3)}" fill="#1e1b30" ${st(3)}/><path d="${disc(wx, wz, 16, -4.8)}" fill="url(#${u}w)" ${st(2)}/>`;
    const c = projP(wx, C.axle, wz - 4.8);
    for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.3, p = projP(wx + Math.cos(a) * 13, C.axle + Math.sin(a) * 13, wz - 4.8); w += `<path d="M${f2(c[0])} ${f2(c[1])} L${f2(p[0])} ${f2(p[1])}" stroke="#8a90aa" stroke-width="1.8" stroke-linecap="round"/>`; }
    return w + `<path d="${disc(wx, wz, 4.2, -5.4)}" fill="${S}" ${st(1.4)}/>`;
  };
  g += wheel(C.wx, Wh - 4, true) + wheel(-C.wx, Wh - 4, true);
  // lower body (sill → shoulder), nose shade, bumper + rocker band, rounded shoulder, deck
  const plan = planRR(-L, L, Wh, C.rc, 8), planIn = planRR(-L + C.inset, L - C.inset, Wh - C.inset, C.rc - C.inset, 8);
  const under = planRR(-L + 12, L - 12, Wh - 10, C.rc - 10, 8), ub = bandRun(under, under, 2, C.sill + 2);   // dark underbody: ground clearance
  if (ub) g += `<path d="${pathOf(ub)}" fill="#120e24" ${st(2)}/>`;
  const low = bandRun(plan, plan, C.sill, C.shoulder), shoulder = bandRun(plan, planIn, C.shoulder, yTop), deck = onDeck(planIn);
  const clip = [pathOf(low), pathOf(shoulder), pathOf(deck)];
  g += `<path d="${pathOf(low)}" fill="url(#${u}sd)" ${st(3.4)}/>`;
  const noseLow = bandRun(plan, plan, C.sill, C.shoulder, (p, q) => (q[1] - p[1]) > 0.55 * Math.hypot(q[0] - p[0], q[1] - p[1]));
  if (noseLow) g += `<path d="${pathOf(noseLow)}" fill="url(#${u}ns)" opacity=".85"/>`;
  g += `<path d="${pathOf(bandRun(plan, plan, C.sill, C.sill + 8))}" fill="${shade(B, -0.45)}"/>`;   // one bumper + rocker band all along the visible run
  g += `<path d="${pathOf(low)}" fill="none" ${st(3.4)}/>`;
  g += `<path d="${pathOf(shoulder)}" fill="url(#${u}sh)" ${st(3)}/>`;
  g += `<path d="${pathOf(deck)}" fill="url(#${u}tp)" ${st(3.2)}/>`;
  // hood crease at the hood's back edge, trunk crease, twin neon stripes along the hood
  [[C.hood[0], 0.75], [-C.hl + 38, 0.6]].forEach(([x, k]) => { const a = projP(x, yTop(x), -(Wh - C.inset) * k), b = projP(x, yTop(x), (Wh - C.inset) * k); g += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}" stroke="${shade(B, -0.28)}" stroke-width="1.6" stroke-linecap="round"/>`; });
  const SC = done ? S : mix(S, "#8a8a9a", 0.4);   // dirty: stripes desaturated 40 %; clean: full neon + glow
  [[-15, -5], [5, 15]].forEach(([z0, z1]) => { const d = pathOf(deckStrip(C.hood[0] + 6, L - C.inset - 4, z0, z1)); if (done) g += `<path d="${d}" fill="${S}" opacity=".55" filter="url(#${u}g)"/>`; g += `<path d="${d}" fill="${SC}" ${st(1.6)}/>`; });
  // nose: wide horizontal headlights (|z| 10..27) + a horizontal grille slot — a friendly face, not a toaster
  [[-27, -10], [10, 27]].forEach(([z0, z1]) => {
    const d = roundPoly(onNose(rectPts(z0, z1, 30, 40), 0.5), 4);
    g += `<path d="${d}" fill="#ffe27a" opacity=".55" filter="url(#${u}g)"/><path d="${d}" fill="#ffe27a" ${st(2)}/><path d="${roundPoly(onNose(rectPts(z0 + 2, z0 + 8, 35, 38), 0.9), 1.5)}" fill="#fff"/>`;
  });
  g += `<path d="${roundPoly(onNose(rectPts(-7, 7, 20, 27), 0.5), 3)}" fill="#17123a" ${st(2)}/>`;
  { const a = projP(L + 1, 23.5, -4.5), b = projP(L + 1, 23.5, 4.5); g += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}" stroke="${S}" stroke-width="1.8" stroke-linecap="round"/>`; }
  // near side: neon stripe, door lines + handles
  g += `<path d="${sideLine(-138, 138, 30)}" stroke="${S}" stroke-width="5" stroke-linecap="round" opacity=".5" filter="url(#${u}g)"/><path d="${sideLine(-138, 138, 30)}" stroke="${S}" stroke-width="3.2" stroke-linecap="round"/>`;
  { // one door per side: rocker → shoulder crease, a short seam up to the window frame, handle inside
    const x0 = -60, x1 = 46;
    g += `<path d="${roundPoly(onSide(rectPts(x0, x1, C.sill, C.shoulder), 0.7), 4)}" fill="none" stroke="${shade(B, -0.3)}" stroke-width="1.6"/>`;
    const a = projP(x1, C.shoulder, -Wh - 0.6), b = projP(x1, C.belt, -Wh + C.inset - 0.3);
    g += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}" stroke="${shade(B, -0.3)}" stroke-width="1.6"/>`;
    g += `<path d="${roundPoly(onSide(rectPts(x1 - 20, x1 - 8, C.shoulder - 7, C.shoulder - 4), 0.8), 1.6)}" fill="${shade(B, -0.4)}"/>`;
  }
  // cabin (lofted frustum), roof, glass, mirror
  const [bx0, bx1, bz, br] = C.cabBase, [tx0, tx1, tz, tr] = C.cabTop;
  const cb = planRR(bx0, bx1, bz, br, 6), ct = planRR(tx0, tx1, tz, tr, 6);
  const cab = bandRun(cb, ct, C.belt, C.roof), roof = ct.map(([x, z]) => projP(x, C.roof, z));
  clip.push(pathOf(cab), pathOf(roof));
  g += `<path d="${pathOf(cab)}" fill="url(#${u}sd)" ${st(3)}/><path d="${pathOf(roof)}" fill="url(#${u}rf)" ${st(3)}/>`;
  const cf = cabinFaces();
  g += `<path d="${roundPoly(cf.windshield, 6)}" fill="url(#${u}gl)" ${st(2)}/>`;
  const wp0 = cf.ws(0.16, -0.6), wp1 = cf.ws(0.24, 0.15);
  g += `<path d="M${f2(wp0[0])} ${f2(wp0[1])} L${f2(wp1[0])} ${f2(wp1[1])}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  cf.sideWins.forEach((q) => { g += `<path d="${roundPoly(q, 5)}" fill="url(#${u}gl)" ${st(2)}/>`; });
  [[0.12, 0.2], [0.62, 0.7]].forEach(([a, b]) => { g += `<path d="${roundPoly([cf.sw(a, 0.3), cf.sw(b, 0.3), cf.sw(b + 0.06, 0.75), cf.sw(a + 0.06, 0.75)], 2)}" fill="#bff6ff" opacity=".28"/>`; });
  { // near mirror: a stalk from the A-pillar foot + a rounded housing with a dark glass sliver (the far one is hidden by the cabin)
    const m0 = projP(bx1 - 8, C.belt + 2, -bz), m1 = projP(bx1 - 8, C.belt + 5, -(bz + 12)), mz = -(bz + 12);
    g += `<path d="M${f2(m0[0])} ${f2(m0[1])} L${f2(m1[0])} ${f2(m1[1])}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    const hp = (x, y) => projP(x, y, mz);
    g += `<path d="${roundPoly([hp(bx1 - 14, C.belt + 3), hp(bx1 - 2, C.belt + 3), hp(bx1 - 2, C.belt + 10), hp(bx1 - 14, C.belt + 10)], 3)}" fill="${B}" ${st(2)}/>`;
    g += `<path d="${roundPoly([hp(bx1 - 12, C.belt + 5), hp(bx1 - 9, C.belt + 5), hp(bx1 - 9, C.belt + 8.5), hp(bx1 - 12, C.belt + 8.5)], 1)}" fill="#2a3270"/>`;
  }
  // FRONT layer (drawn after the paint finish): fender flares, wheel wells, near wheels
  [C.wx, -C.wx].forEach((wx) => {
    front += `<path d="${roundPoly(sideArc(wx, C.axle, C.wellR - 1, C.wellR + C.flare, 12, 168), 2.5)}" fill="url(#${u}fl)" ${st(2.4)}/>`;
    front += `<path d="${pathOf(sideArc(wx, C.axle, C.wellR + C.flare * 0.45, C.wellR + C.flare * 0.75, 55, 125))}" fill="#fff" opacity=".45"/>`;
    const well = []; for (let i = 0; i <= 24; i++) { const a = (2 + 176 * i / 24) * Math.PI / 180; well.push([wx + Math.cos(a) * C.wellR, C.axle + Math.sin(a) * C.wellR]); }
    front += `<path d="${pathOf(onSide(well, 0.8))}" fill="#151228" ${st(2)}/>`;
    front += wheel(wx, -Wh, false);
  });
  return { defs, body: g, front, clip: clip.map((d) => `<path d="${d}"/>`).join(""), glass: [roundPoly(cf.windshield, 6)].concat(cf.sideWins.map((q) => roundPoly(q, 5))) };
}
// projected boxes used for the layouts and the spot areas
function carBBox() {
  const pts = []; planRR(-CARP.hl, CARP.hl, CARP.hw, CARP.rc).forEach(([x, z]) => { pts.push(projP(x, 0, z), projP(x, CARP.belt, z)); });
  planRR(CARP.cabTop[0], CARP.cabTop[1], CARP.cabTop[2], CARP.cabTop[3]).forEach(([x, z]) => pts.push(projP(x, CARP.roof, z)));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const hoodQuad = (i) => onDeck([[CARP.hood[0] + i, -CARP.hw + CARP.inset + i], [CARP.hl - CARP.inset - i, -CARP.hw + CARP.inset + i], [CARP.hl - CARP.inset - i, CARP.hw - CARP.inset - i], [CARP.hood[0] + i, CARP.hw - CARP.inset - i]]);
const doorQuad = (x0, x1, y0, y1) => onSide([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 0.6);
const WASH_LAYOUT = {
  portrait: { W: 900, H: 1300, view: VIEWS.portrait, hoodW: 0.46, hoodC: [0.44, 0.60], hz: 0.40, sign: [0.74, 0] },
  wide: { W: 1600, H: 900, view: VIEWS.wide, carW: 0.7, carCx: 0.52, bottom: 0.95, hz: 0.40, sign: [0.8, 0] },
};
(() => {
  const P = WASH_LAYOUT.portrait, Wd = WASH_LAYOUT.wide;
  PV = P.view; const hq = hoodQuad(0), hx = hq.map((p) => p[0]), hy = hq.map((p) => p[1]);
  P.s = P.hoodW * P.W / (Math.max(...hx) - Math.min(...hx));
  P.tx = P.hoodC[0] * P.W - (Math.max(...hx) + Math.min(...hx)) / 2 * P.s; P.ty = P.hoodC[1] * P.H - (Math.max(...hy) + Math.min(...hy)) / 2 * P.s;
  PV = Wd.view; const bb = carBBox();
  Wd.s = Wd.carW * Wd.W / (bb[2] - bb[0]); Wd.tx = Wd.carCx * Wd.W - (bb[0] + bb[2]) / 2 * Wd.s; Wd.ty = Wd.bottom * Wd.H - bb[3] * Wd.s;
  PV = VIEWS.portrait;
})();
// largest axis-aligned box (fractions of the image) whose corners all lie inside a convex
// projected quad, optionally limited to x/y ranges and with minimum sizes — grid search
function shrinkQuad(q, pad) {   // inset a convex quad's edges by `pad` (same units) — keeps whole spots on the paint
  const n = q.length, cx = q.reduce((a, p) => a + p[0], 0) / n, cy = q.reduce((a, p) => a + p[1], 0) / n;
  const lines = q.map((a, i) => { const b = q[(i + 1) % n]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if ((cx - a[0]) * nx + (cy - a[1]) * ny < 0) { nx = -nx; ny = -ny; } return [a[0] + nx * pad, a[1] + ny * pad, b[0] + nx * pad, b[1] + ny * pad]; });
  return lines.map((l1, i) => { const l0 = lines[(i - 1 + n) % n]; const [x1, y1, x2, y2] = l0, [x3, y3, x4, y4] = l1; const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4) || 1e-9; const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d; return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; });
}
function boxInQuad(L, quad, o) {
  o = o || {};
  let qp = quad.map(([x, y]) => [L.tx + x * L.s, L.ty + y * L.s]);
  if (o.pad) qp = shrinkQuad(qp, o.pad);
  const q = qp.map(([x, y]) => [x / L.W, y / L.H]);
  const inside = (x, y) => { let sg = 0; for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4], c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); if (c !== 0) { if (sg && Math.sign(c) !== sg) return false; sg = Math.sign(c); } } return true; };
  const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]), N = 36;
  const X0 = Math.max(Math.min(...xs), (o.x || [0, 1])[0]), X1 = Math.min(Math.max(...xs), (o.x || [0, 1])[1]), Y0 = Math.max(Math.min(...ys), (o.y || [0, 1])[0]), Y1 = Math.min(Math.max(...ys), (o.y || [0, 1])[1]);
  let best = null;
  for (let i = 0; i < N; i++) for (let j = i + 1; j <= N; j++) {
    const x0 = X0 + (X1 - X0) * i / N, x1 = X0 + (X1 - X0) * j / N;
    for (let k = 0; k < N; k++) for (let l = k + 1; l <= N; l++) {
      const y0 = Y0 + (Y1 - Y0) * k / N, y1 = Y0 + (Y1 - Y0) * l / N;
      if (y1 - y0 < (o.minH || 0) || x1 - x0 < (o.minW || 0)) continue;
      const area = (x1 - x0) * (y1 - y0);
      if (best && area <= best.area) continue;
      if (inside(x0, y0) && inside(x1, y0) && inside(x1, y1) && inside(x0, y1)) best = { area, x0, x1, y0, y1 };
    }
  }
  return best && { x: +best.x0.toFixed(3), y: +best.y0.toFixed(3), w: +(best.x1 - best.x0).toFixed(3), h: +(best.y1 - best.y0).toFixed(3) };
}
// spot-centre regions (fractions of each image), [hood TOP, door panel]: the largest axis-aligned
// boxes inside the hood paint / the door panel (portrait x ≤ 0.75 for the hood, ≤ 0.8 for the
// slanted door strip), plus the exact paint quads (`quads`) for an engine that can sample polygons
const WASH_DOOR = [-40, 40, 14, 58];   // door panel (taller): rocker → beltline, between the arches
// portrait side area: the front quarter = the front part of the door + the fender sliver up to the wheel
// arch (flare outer radius 40 around x 88 leaves x ≤ 48 clear), sill → just above the shoulder crease;
// the rest of the door projects past the phone crop (x > 0.78) in this framing
const WASH_SIDE_P = [24, 48, 16, 46];
const WASH_PAD = { portrait: 16, wide: 12 };   // px inset of the paint quads (≈ a small spot's radius at the edge)
function washAreas() {
  const P = WASH_LAYOUT.portrait, Wd = WASH_LAYOUT.wide;
  const frac = (L, q) => q.map(([x, y]) => [+((L.tx + x * L.s) / L.W).toFixed(3), +((L.ty + y * L.s) / L.H).toFixed(3)]);
  PV = P.view;
  const pq0 = [hoodQuad(4), doorQuad(...WASH_SIDE_P)];
  const p = [boxInQuad(P, pq0[0], { x: [0.25, 0.75], minH: 0.08, minW: 0.14, pad: WASH_PAD.portrait }), boxInQuad(P, pq0[1], { x: [0.22, 0.78], pad: WASH_PAD.portrait })];
  const pq = pq0.map((q) => frac(P, shrinkQuad(q.map(([x, y]) => [x, y]), WASH_PAD.portrait / P.s)));
  PV = Wd.view;
  const wq0 = [hoodQuad(4), doorQuad(...WASH_DOOR)];
  const w = [boxInQuad(Wd, wq0[0], { y: [0.2, 0.8], minH: 0.07, minW: 0.14, pad: WASH_PAD.wide }), boxInQuad(Wd, wq0[1], { y: [0.2, 0.8], pad: WASH_PAD.wide })];
  const wq = wq0.map((q) => frac(Wd, shrinkQuad(q, WASH_PAD.wide / Wd.s)));
  PV = VIEWS.portrait;
  return { portrait: p, wide: w, quads: { portrait: pq, wide: wq }, keepVisible: { portrait: washKeepVisible(false), wide: washKeepVisible(true) } };
}
function bubble(x, y, r, op) {   // a soap bubble: tinted rim + glints
  return `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#bff6ff" fill-opacity=".12" stroke="#e8fbff" stroke-width="${f2(Math.max(1.6, r * 0.09))}" opacity="${op || 0.8}"/>` +
    `<path d="M${f2(x - r * 0.55)} ${f2(y - r * 0.15)} Q${f2(x - r * 0.5)} ${f2(y - r * 0.55)} ${f2(x - r * 0.12)} ${f2(y - r * 0.62)}" fill="none" stroke="#fff" stroke-width="${f2(Math.max(1.4, r * 0.12))}" stroke-linecap="round" opacity="${op || 0.8}"/>` +
    `<circle cx="${f2(x + r * 0.4)}" cy="${f2(y + r * 0.38)}" r="${f2(r * 0.1)}" fill="#ffd6f0" opacity="${op || 0.8}"/>`;
}
const DROP = (x, y, s) => `M${f2(x)} ${f2(y - 14 * s)} Q${f2(x + 9 * s)} ${f2(y - 1 * s)} ${f2(x + 8 * s)} ${f2(y + 3 * s)} Q${f2(x + 7 * s)} ${f2(y + 10 * s)} ${f2(x)} ${f2(y + 10 * s)} Q${f2(x - 7 * s)} ${f2(y + 10 * s)} ${f2(x - 8 * s)} ${f2(y + 3 * s)} Q${f2(x - 9 * s)} ${f2(y - 1 * s)} ${f2(x)} ${f2(y - 14 * s)} Z`;
// rounded polygon through projected points (corner radius r, clamped to half of each edge)
function roundPoly(pts, r) {
  const n = pts.length, cut = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, k = Math.min(r / L, 0.5); return [p[0] + dx * k, p[1] + dy * k]; };
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = cut(p, pts[(i - 1 + n) % n]), b = cut(p, pts[(i + 1) % n]);
    d += (i ? `L${f2(a[0])} ${f2(a[1])}` : `M${f2(a[0])} ${f2(a[1])}`) + `Q${f2(p[0])} ${f2(p[1])} ${f2(b[0])} ${f2(b[1])}`;
  }
  return d + "Z";
}
// The girl washing the car: Nadia's face + ponytail, a cap, a modest sporty one-piece swimsuit
// (cap sleeves, high round neckline, wide contrast side panels) under knee-length board shorts,
// flip-flops. 128 frame, feet ≈ y 120 (like person()). pose: "spray" (hose gun raised, open
// smile) | "cheer" (thumbs-up, hose dropped). The raised arm is drawn AFTER the back hair so the
// ponytail never hides it.
const WASHER = Object.assign({}, PEOPLE.woman, { suit: "#2fb8e6", trim: PINK, shorts: "#7b5cf0", shortsTrim: YELLOW, cap: YELLOW, flop: PINK });
function washGirl(pose, u, low) {
  const k = WASHER, cx = 64, hy = 37, r = 24, st = stk(3);
  const defs = rad(`${u}s`, [[0, shade(k.skin, 0.2)], [1, k.skin]], 0.4, 0.35, 0.7) +
    lin(`${u}j`, [[0, shade(k.suit, 0.25)], [0.6, k.suit], [1, shade(k.suit, -0.15)]], 0, 0, 1, 1) +
    lin(`${u}p`, [[0, shade(k.shorts, 0.15)], [1, shade(k.shorts, -0.12)]]);
  const rot = (x, y0, ang, len) => { const a = ang * Math.PI / 180; return [x - len * Math.sin(a), y0 + len * Math.cos(a)]; };
  const armA = 12, armB = pose === "cheer" ? -150 : (low ? -100 : -128), xa = cx - 20, xb = cx + 20;
  // an arm with its cap sleeve (sleeve rotates with the arm, its top tucks under the torso edge)
  const arm = (x, ang) => `<g transform="rotate(${ang} ${x} 63)"><rect x="${x - 5.5}" y="62" width="11" height="27" rx="5.5" fill="url(#${u}s)" ${st}/><rect x="${x - 6}" y="59" width="12" height="9" rx="4" fill="url(#${u}j)" ${st}/></g>`;
  let g = "";
  [-1, 1].forEach((d) => {   // legs + flip-flops
    g += `<rect x="${cx + d * 8.5 - 5.5}" y="92" width="11" height="23" rx="5.5" fill="url(#${u}s)" ${st}/>`;
    g += `<ellipse cx="${cx + d * 9.5}" cy="117.5" rx="9.5" ry="3.6" fill="${k.flop}" ${stk(2.4)}/>`;
    g += `<path d="M${cx + d * 9.5 - 5} 116.5 Q${cx + d * 9.5} 110 ${cx + d * 9.5 + 5} 116.5" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="M${cx + d * 9.5 - 5} 116.5 Q${cx + d * 9.5} 110 ${cx + d * 9.5 + 5} 116.5" fill="none" stroke="${YELLOW}" stroke-width="2.2" stroke-linecap="round"/>`;
  });
  g += arm(xa, armA);
  const ha = rot(xa, 63, armA, 29);
  g += `<circle cx="${f2(ha[0])}" cy="${f2(ha[1])}" r="6" fill="url(#${u}s)" ${st}/>`;
  // swimsuit torso + wide side panels (armpit → hip) + star
  g += `<path d="M${cx - 19} 60 Q${cx} 55 ${cx + 19} 60 L${cx + 20} 90 Q${cx} 93 ${cx - 20} 90 Z" fill="url(#${u}j)" ${st}/>`;
  [-1, 1].forEach((d) => { g += `<path d="M${cx + d * 18.6} 65 Q${cx + d * 10.5} 67 ${cx + d * 10} 77 Q${cx + d * 10.5} 87 ${cx + d * 19.8} 89.5 Z" fill="${k.trim}" ${stk(1.8)}/>`; });
  g += `<path d="${star(cx, 74, 5, 2.2)}" fill="${YELLOW}" ${stk(1.4)}/>`;
  // board shorts with a clear waistband + drawstring
  g += `<path d="M${cx - 21} 84 H${cx + 21} L${cx + 22.5} 102 H${cx + 2} L${cx} 93 L${cx - 2} 102 H${cx - 22.5} Z" fill="url(#${u}p)" ${st}/>`;
  g += `<rect x="${cx - 21}" y="83" width="42" height="5.5" rx="2.2" fill="${shade(k.shorts, -0.3)}" ${stk(2)}/><path d="M${cx - 2} 88 l-2 4 M${cx + 2} 88 l2 4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
  g += `<path d="M${cx - 22} 99.5 H${cx - 3} M${cx + 3} 99.5 H${cx + 22}" stroke="${k.shortsTrim}" stroke-width="3" stroke-linecap="round"/>`;   // hem band (not a side stripe a hand could seem to grip)
  // neck + neckline trim
  g += `<rect x="${cx - 6.5}" y="${hy + r - 10}" width="13" height="${62 - (hy + r - 10)}" rx="4" fill="${shade(k.skin, -0.12)}" ${stk(2.4)}/>`;
  g += `<path d="M${cx - 9} 58 Q${cx} 66 ${cx + 9} 58" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${cx - 9} 58 Q${cx} 66 ${cx + 9} 58" fill="none" stroke="${YELLOW}" stroke-width="2.2" stroke-linecap="round"/>`;
  // back hair, THEN the raised arm (hose gun or thumbs-up) so it is never hidden
  g += personHair(k, cx, hy, r, "down", "back", 0);
  const hb = rot(xb, 63, armB, 29), tip = rot(xb, 63, armB, 45);
  if (false) g += `<g transform="rotate(${armB} ${xb} 63)"><rect x="${xb - 3.8}" y="88" width="7.6" height="16" rx="2.5" fill="#3a3f78" ${stk(2.4)}/><rect x="${xb - 5}" y="102" width="10" height="5" rx="2" fill="${YELLOW}" ${stk(2)}/><rect x="${xb + 3}" y="91" width="5" height="7" rx="2" fill="#3a3f78" ${stk(2)}/></g>`;
  g += arm(xb, armB);
  if (pose === "cheer") {
    g += `<rect x="${f2(hb[0] - 2.8)}" y="${f2(hb[1] - 15)}" width="5.6" height="12" rx="2.8" fill="url(#${u}s)" ${stk(2.4)}/>`;
    g += `<rect x="${f2(hb[0] - 6.5)}" y="${f2(hb[1] - 5.5)}" width="13" height="11" rx="4.5" fill="url(#${u}s)" ${stk(2.6)}/>`;
  } else g += `<circle cx="${f2(hb[0])}" cy="${f2(hb[1])}" r="6.2" fill="url(#${u}s)" ${st}/>`;
  // ears, face, fringe, cap
  g += `<ellipse cx="${cx - r}" cy="${hy + 3}" rx="5" ry="7" fill="${k.skin}" ${st}/><ellipse cx="${cx + r}" cy="${hy + 3}" rx="5" ry="7" fill="${k.skin}" ${st}/>`;
  g += `<circle cx="${cx}" cy="${hy}" r="${r}" fill="url(#${u}s)" ${st}/>`;
  const ey = hy + 4, ex = r * 0.37;
  [-1, 1].forEach((d) => {
    if (pose === "cheer") g += `<path d="M${cx + d * ex - 4.5} ${ey + 1.5} Q${cx + d * ex} ${ey - 4.5} ${cx + d * ex + 4.5} ${ey + 1.5}" fill="none" ${stk(2.8)}/>`;
    else { const X = cx + d * ex; g += `<ellipse cx="${X}" cy="${ey}" rx="${r * 0.12}" ry="${r * 0.16}" fill="${INK}"/><circle cx="${X - 1}" cy="${ey - 1.6}" r="${r * 0.05}" fill="#fff"/><path d="M${X - 3} ${ey - 6} Q${X} ${ey - 8.5} ${X + 3} ${ey - 6}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`; }
    g += `<ellipse cx="${cx + d * r * 0.6}" cy="${hy + r * 0.38}" rx="3.6" ry="2.2" fill="#ff7f9a" opacity=".5"/>`;
    g += `<circle cx="${cx + d * (r + 1)}" cy="${hy + 11}" r="2.6" fill="${YELLOW}" ${stk(1.4)}/>`;
  });
  g += `<path d="M${cx - 1.5} ${hy + 8} Q${cx + 1} ${hy + 10.5} ${cx - 1} ${hy + 11.5}" fill="none" stroke="${shade(k.skin, -0.35)}" stroke-width="1.8" stroke-linecap="round"/>`;
  g += `<path d="M${cx - 7.5} ${hy + 13.5} Q${cx} ${hy + 23} ${cx + 7.5} ${hy + 13.5} Q${cx} ${hy + 15.5} ${cx - 7.5} ${hy + 13.5} Z" fill="#7a2a3a" ${stk(2.2)}/><ellipse cx="${cx}" cy="${hy + 18.6}" rx="3" ry="1.6" fill="#ff8aa0"/>`;
  g += personHair(k, cx, hy, r, "down", "front", 0);
  // cap: a soft crown covering the skull (r·0.8 — at r·0.6 hair showed above it and it read as a headband) + a forward bill + a top button; no side/back brim; the star stays
  const cy0 = hy - r * 0.3, C2 = shade(k.cap, -0.18);
  g += `<path d="M${cx - r * 1.05} ${cy0} A${r * 1.05} ${r * 0.8} 0 0 1 ${cx + r * 1.05} ${cy0} Q${cx} ${cy0 + r * 0.1} ${cx - r * 1.05} ${cy0} Z" fill="${k.cap}" ${st}/>`;
  g += `<path d="M${cx - r * 0.55} ${cy0 - r * 0.4} Q${cx} ${cy0 - r * 0.58} ${cx + r * 0.55} ${cy0 - r * 0.4}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  g += `<path d="${star(cx, cy0 - r * 0.28, r * 0.18, r * 0.08)}" fill="${PINK}" ${stk(1.5)}/>`;
  g += `<circle cx="${cx}" cy="${f2(cy0 - r * 0.8)}" r="2" fill="${C2}" ${stk(1.4)}/>`;
  g += `<path d="M${cx - r * 0.95} ${cy0} Q${cx} ${cy0 + r * 0.48} ${cx + r * 0.95} ${cy0} Q${cx} ${cy0 + r * 0.18} ${cx - r * 0.95} ${cy0} Z" fill="${C2}" ${st}/>`;
  return { defs, body: g, hand: pose === "cheer" ? null : hb, tip, head: [cx, hy - 2], headR: r + 3, armB };
}
// outdoor summer neon wash spot: sunset sky, skyline, wall with a neon sign, palms, bunting,
// wet concrete floor (hz = wall base). Bucket/hose/bubbles are added by the scene.
function washSpot(W, H, hz, u, R) {
  let g = `<rect width="${W}" height="${H}" fill="url(#${u}sky)"/>`;
  for (let i = 0; i < 40; i++) g += `<circle cx="${f2(R() * W)}" cy="${f2(R() * hz * 0.45)}" r="${f2(0.8 + R() * 1.6)}" fill="#fff" opacity="${f2(0.3 + R() * 0.5)}"/>`;
  const sx = W * 0.62, sy = hz - 190, sr = Math.min(W, H) * 0.2;
  g += `<clipPath id="${u}sc"><circle cx="${sx}" cy="${sy}" r="${sr}"/></clipPath><g clip-path="url(#${u}sc)"><rect x="${sx - sr}" y="${sy - sr}" width="${2 * sr}" height="${2 * sr}" fill="url(#${u}sun)"/>${[0.15, 0.32, 0.47, 0.6, 0.72].map((t, i) => `<rect x="${sx - sr}" y="${f2(sy + sr * t)}" width="${2 * sr}" height="${4 + i * 3}" fill="#c23a86"/>`).join("")}</g>`;
  g += skyline(-20, W + 40, hz - 150, 1.25, rng(23), `${u}n`, "#2a1a5e");
  // palms behind the wall
  const pm = palm(), inner = (j) => j.svg.replace(/^<svg[^>]*><defs>/, "").replace(/<\/defs>/, "").replace(/<\/svg>$/, "");
  g += `<g transform="translate(${f2(W * 0.02)} ${hz - 400}) scale(1.9)">${inner(pm)}</g><g transform="translate(${f2(W * 0.86)} ${hz - 380}) scale(1.75)">${inner(pm)}</g>`;
  // low wall + neon tube
  g += `<rect x="0" y="${hz - 150}" width="${W}" height="150" fill="url(#${u}wal)"/>`;
  for (let x = 0; x < W; x += 70) g += `<path d="M${x} ${hz - 150} V${hz}" stroke="#3a2f78" stroke-width="3" opacity=".6"/>`;
  g += `<path d="M0 ${hz - 150} H${W}" ${stk(8)}/>` + neon(`M0 ${hz - 140} H${W}`, CYAN, 4, `${u}n`);
  // bunting
  const by = H * 0.06, sag = H * 0.05;
  const bunt = (t) => [W * t, by + Math.sin(t * Math.PI) * sag];
  g += `<path d="M0 ${f2(by)} Q${W / 2} ${f2(by + sag * 2)} ${W} ${f2(by)}" fill="none" stroke="${INK}" stroke-width="4"/>`;
  for (let i = 1; i < 14; i++) { const [x, y] = bunt(i / 14), c = [PINK, YELLOW, CYAN, VIOLET][i % 4]; g += `<path d="M${f2(x - 16)} ${f2(y)} L${f2(x + 16)} ${f2(y)} L${f2(x)} ${f2(y + 34)} Z" fill="${c}" ${stk(3)}/>`; }
  // wet concrete floor
  g += `<rect x="0" y="${hz}" width="${W}" height="${H - hz}" fill="url(#${u}flr)"/>`;
  for (let i = 1; i < 6; i++) { const y = hz + i * i * (H - hz) / 30; g += `<path d="M0 ${f2(y)} H${W}" stroke="#2f2a66" stroke-width="3" opacity=".55"/>`; }
  [[0.15, CYAN], [0.45, PINK], [0.8, YELLOW]].forEach(([t, c]) => { g += `<rect x="${f2(W * t - 24)}" y="${hz + 6}" width="48" height="${H - hz}" fill="${c}" opacity=".13" filter="url(#${u}bl)"/>`; });
  return g;
}
function bucket(x, y, s, u) {   // bucket with suds, bottom centre (x,y)
  let g = `<ellipse cx="${x}" cy="${y + 2 * s}" rx="${40 * s}" ry="${8 * s}" fill="#05030f" opacity=".4"/>`;
  g += `<path d="M${x - 40 * s} ${y - 70 * s} A${40 * s} ${18 * s} 0 0 1 ${x + 40 * s} ${y - 70 * s}" fill="none" stroke="${INK}" stroke-width="${7 * s}"/><path d="M${x - 40 * s} ${y - 70 * s} A${40 * s} ${18 * s} 0 0 1 ${x + 40 * s} ${y - 70 * s}" fill="none" stroke="#c9cde2" stroke-width="${3 * s}"/>`;
  g += `<path d="M${x - 36 * s} ${y - 62 * s} L${x - 28 * s} ${y} H${x + 28 * s} L${x + 36 * s} ${y - 62 * s} Z" fill="url(#${u}bk)" ${stk(4 * s)}/>`;
  g += `<path d="M${x - 33 * s} ${y - 40 * s} H${x + 33 * s}" stroke="${YELLOW}" stroke-width="${5 * s}"/><path d="M${x - 24 * s} ${y - 54 * s} L${x - 20 * s} ${y - 8 * s}" stroke="#fff" stroke-width="${4 * s}" stroke-linecap="round" opacity=".5"/>`;
  [[-26, -66, 13], [-8, -74, 16], [12, -70, 14], [28, -64, 11], [2, -86, 10], [-18, -84, 8]].forEach(([dx, dy, r]) => { g += `<circle cx="${x + dx * s}" cy="${y + dy * s}" r="${r * s}" fill="url(#${u}sud)" ${stk(2.6 * s)}/>`; });
  return g;
}
// quadratic Bézier sample
const qb = (p0, c, p1, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
// where the girl stands (behind the far side of the hood) for a layout: feet, scale, mirror
const WASH_GIRL = { portrait: [70, 0, CARP.hw + 24], wide: [90, 0, CARP.hw + 12] };
const WASH_GIRL_H = { portrait: 112, wide: 96 };   // her height in car units (cap ≈ roof height)
function girlPlace(L, wide) {
  const im = (p) => [L.tx + p[0] * L.s, L.ty + p[1] * L.s], gw = WASH_GIRL[wide ? "wide" : "portrait"];
  const gfeet = im(projP(...gw)), ghead = im(projP(gw[0], WASH_GIRL_H[wide ? "wide" : "portrait"], gw[2]));
  const GL = { x: gfeet[0], y: gfeet[1], s: (gfeet[1] - ghead[1]) / 107 };
  // pick the jet target first (on the hood paint but off the hood spot area), then mirror her so the
  // hose hand is on the target's side and the target is DOWNSTREAM of the hand
  const C = CARP, pad = WASH_PAD[wide ? "wide" : "portrait"];
  const hq = shrinkQuad(hoodQuad(4).map(([x, y]) => [L.tx + x * L.s, L.ty + y * L.s]), pad);
  const inQ = (p) => { let sg = 0; for (let i = 0; i < 4; i++) { const a = hq[i], b = hq[(i + 1) % 4], c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); if (sg && Math.sign(c) !== sg) return false; sg = Math.sign(c); } return true; };
  const armB = -128, a = armB * Math.PI / 180, handF = [84 - 29 * Math.sin(a), 63 + 29 * Math.cos(a)];
  const cands = [[C.hl - 4, -10], [C.hl - 4, 16], [C.hl - 4, -30], [C.hood[0] + 6, 0], [C.hood[0] + 6, 30], [C.hood[0] + 25, 5]];
  GL.mir = 1; GL.aimW = null;
  for (const [x, z] of cands) {
    const w = [x, yTop(x), z], p = im(projP(...w)); if (inQ(p)) continue;
    const mir = p[0] < GL.x ? -1 : 1, hand = [GL.x + mir * (handF[0] - 64) * GL.s, GL.y + (handF[1] - 120) * GL.s];
    if ((p[0] - hand[0]) * mir > 6) { GL.mir = mir; GL.aimW = w; break; }
  }
  if (!GL.aimW) { GL.aimW = [C.hl - 4, yTop(C.hl - 4), -10]; console.warn(`wash jet: no downstream target off the hood spot area (${wide ? "wide" : "portrait"})`); }
  GL.gp = (p) => [GL.x + GL.mir * (p[0] - 64) * GL.s, GL.y + (p[1] - 120) * GL.s];
  return GL;
}
// "keep-visible" boxes (image fractions) for the HUD/crop probe: the girl's head + cap (+ the
// raised hand) and the car's nose (front face + headlights)
function washKeepVisible(wide) {
  const L = wide ? WASH_LAYOUT.wide : WASH_LAYOUT.portrait; PV = L.view;
  const GL = girlPlace(L, wide), fr = (pts) => { const xs = pts.map((p) => p[0] / L.W), ys = pts.map((p) => p[1] / L.H); return { x: +Math.min(...xs).toFixed(3), y: +Math.min(...ys).toFixed(3), w: +(Math.max(...xs) - Math.min(...xs)).toFixed(3), h: +(Math.max(...ys) - Math.min(...ys)).toFixed(3) }; };
  const head = [[34, 0], [94, 0], [34, 62], [94, 62]].map((p) => GL.gp(p));
  const im = (p) => [L.tx + p[0] * L.s, L.ty + p[1] * L.s], C = CARP;
  const nose = [];
  [-C.hw + C.rc, C.hw - C.rc].forEach((z) => [C.sill, C.belt].forEach((y) => nose.push(im(projP(C.hl, y, z)))));
  PV = VIEWS.portrait;
  return { girlHead: fr(head), nose: fr(nose) };
}
function hoseReel(x, y, r) {   // a wall-mounted hose reel: drum + one coil + bracket
  return `<rect x="${f2(x - r * 0.25)}" y="${f2(y - r * 1.6)}" width="${f2(r * 0.5)}" height="${f2(r * 1.6)}" fill="#5d6288" ${stk(3)}/>` +
    `<circle cx="${f2(x)}" cy="${f2(y - r * 1.6)}" r="${f2(r)}" fill="#2a2d55" ${stk(4)}/><circle cx="${f2(x)}" cy="${f2(y - r * 1.6)}" r="${f2(r * 0.72)}" fill="none" stroke="#3fcf7a" stroke-width="${f2(r * 0.34)}"/>` +
    `<circle cx="${f2(x)}" cy="${f2(y - r * 1.6)}" r="${f2(r * 0.72)}" fill="none" ${stk(1.6)}/><circle cx="${f2(x)}" cy="${f2(y - r * 1.6)}" r="${f2(r * 0.22)}" fill="#c9cde2" ${stk(2)}/>`;
}
function washScene(v, done, wide) {
  const L = wide ? WASH_LAYOUT.wide : WASH_LAYOUT.portrait, { W, H, s, tx, ty } = L, [B, S] = WASH_COLORS[v], u = "w";
  PV = L.view;
  const im = (p) => [tx + p[0] * s, ty + p[1] * s], C = CARP, Wh = C.hw;
  const car = carP(B, S, "wc", done), girl = washGirl(done ? "cheer" : "spray", "wg", false);   // (the girl now stands low enough in landscape: no need for the lowered arm)
  const hz = L.hz * H, GL = girlPlace(L, wide), gp = GL.gp, mir = GL.mir;
  const hoodClip = pathOf(hoodQuad(4)), sideClip = pathOf(doorQuad(-58, 58, C.sill + 4, 47));
  const defs = car.defs + girl.defs + glow(`${u}n`, 4) + blur(`${u}bl`, 10) + glow(`${u}sg`, 6) + blur(`${u}sm`, 1.5) +
    lin(`${u}sky`, [[0, "#22165e"], [0.45, "#7a2f8e"], [0.75, "#ff6f8e"], [1, "#ffb36a"]]) +
    rad(`${u}sun`, [[0, "#ffe27a"], [0.55, "#ff9a8a"], [1, "#ff5aa0"]], 0.5, 0.15, 0.9) +
    lin(`${u}wal`, [[0, "#4b3a8e"], [1, "#2f2566"]]) + lin(`${u}flr`, [[0, "#4a4a86"], [0.3, "#3c3a76"], [1, "#24204e"]]) +
    lin(`${u}gw`, [[0, "#3a2f78"], [1, "#2a2160"]]) + lin(`${u}gi`, [[0, "#7a4a6a"], [1, "#b8706a"]]) + lin(`${u}gf`, [[0, "#c88a6a"], [1, "#ffcf8a"]]) +
    lin(`${u}bk`, [[0, "#5ad0ff"], [1, "#2a7fd0"]], 0, 0, 1, 0) + rad(`${u}sud`, [[0, "#ffffff"], [0.7, "#f2fbff"], [1, "#cfe9ff"]], 0.38, 0.32, 0.7) +
    rad(`${u}halo`, [[0, mix(B, "#ffffff", 0.5), 0.55], [0.6, B, 0.15], [1, B, 0]]) + rad(`${u}pud`, [[0, "#9fdcff", 0.3], [1, "#9fdcff", 0]]) +
    lin(`${u}grime`, [[0, "#6b4a2e", 0], [1, "#6b4a2e", 0.55]]) +
    lin(`${u}spec`, [[0, "#ffffff", 0], [0.5, "#ffffff", 0.35], [1, "#ffffff", 0]], 0, 0, 1, 0) +
    `<clipPath id="${u}clip">${car.clip}</clipPath><clipPath id="${u}paint"><path d="${hoodClip}"/><path d="${sideClip}"/></clipPath><clipPath id="${u}floor"><rect x="0" y="${f2(hz)}" width="${W}" height="${f2(H - hz)}"/></clipPath>`;
  const R = rng(wide ? 53 : 41);
  let g = washSpot(W, H, hz, u, R);
  // a neon wash sign mounted on the wall (glyphs only: a drop + bubbles + a sparkle, no letters)
  const sx = L.sign[0] * W, sy = hz - 78;
  g += neon(DROP(sx, sy + 6, 3.2), CYAN, 5, `${u}n`) + neon(`M${f2(sx + 52)} ${f2(sy - 20)} m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 M${f2(sx + 74)} ${f2(sy + 16)} m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0`, PINK, 4, `${u}n`) + neon(star(sx - 54, sy - 14, 20, 6, 4), YELLOW, 4, `${u}n`);
  // floor: projected grid, wash-bay outline + drain
  const gpath = (pts) => { const v2 = pts.map((p) => projP3(...p)).filter((p) => p[2] > 150).map((p) => im(p)); return v2.length > 1 ? "M" + v2.map((p) => `${f2(p[0])} ${f2(p[1])}`).join(" L") : ""; };
  let fl = "";
  for (let x = -1800; x <= 600; x += 120) fl += `<path d="${gpath(Array.from({ length: 13 }, (_, i) => [x, 0, -600 + i * 100]))}" fill="none" stroke="#2c2860" stroke-width="2.5" opacity=".6"/>`;
  for (let z = -600; z <= 600; z += 120) fl += `<path d="${gpath(Array.from({ length: 25 }, (_, i) => [-1800 + i * 100, 0, z]))}" fill="none" stroke="#2c2860" stroke-width="2.5" opacity=".6"/>`;
  fl += `<path d="${gpath([[-215, 0, -135], [235, 0, -135], [235, 0, 135], [-215, 0, 135], [-215, 0, -135]])}" fill="none" stroke="${YELLOW}" stroke-width="5" stroke-dasharray="22 14" stroke-linecap="round" opacity=".85"/>`;
  if (im(projP(225, 0, -95))[1] <= 0.9 * H) {   // drain grate (dropped when it would sit under the bottom crop)
    fl += `<path d="${gpath([[190, 0, -95], [225, 0, -95], [225, 0, -55], [190, 0, -55]])} Z" fill="#1a1838" ${stk(3)}/>`;
    for (let i = 1; i < 5; i++) fl += `<path d="${gpath([[190 + i * 7, 0, -93], [190 + i * 7, 0, -57]])}" stroke="#5d6288" stroke-width="2.4" fill="none"/>`;
  }
  g += `<g clip-path="url(#${u}floor)">${fl}</g>`;
  // hose reel on the wall base (left), the hose runs along the floor behind the car to the girl
  const reel = wide ? [0.93 * W, hz - 6] : [0.2 * W, hz - 6], rr = wide ? 20 : 24;   // landscape: right end of the wall, clear of the girl
  g += hoseReel(reel[0], reel[1], rr);
  const c0 = im(projP(0, 0, 0)), bb = carBBox();
  g += `<ellipse cx="${f2(c0[0])}" cy="${f2(c0[1] + 30)}" rx="${f2((bb[2] - bb[0]) * s * 0.62)}" ry="${f2((bb[3] - bb[1]) * s * 0.22)}" fill="url(#${u}pud)"/>`;
  if (done) g += `<ellipse cx="${f2(c0[0])}" cy="${f2(ty + (bb[1] + bb[3]) / 2 * s)}" rx="${f2((bb[2] - bb[0]) * s * 0.7)}" ry="${f2((bb[3] - bb[1]) * s * 0.75)}" fill="url(#${u}halo)"/>`;
  // hose: reel → along the floor → up behind her far hip → her hand (or the dropped gun)
  const hip = gp([64 - 18, 92]), foot = [GL.x - mir * 4 * GL.s, GL.y - 4 * GL.s], hd = girl.hand ? gp(girl.hand) : null;
  const hoseD = `M${f2(reel[0])} ${f2(reel[1] - rr * 1.6 + rr * 0.72)} Q${f2(reel[0] + 10)} ${f2(reel[1] + 30)} ${f2((reel[0] + foot[0]) / 2)} ${f2(Math.max(reel[1], foot[1]) + 14)} T${f2(foot[0])} ${f2(foot[1])} Q${f2(hip[0])} ${f2((foot[1] + hip[1]) / 2)} ${f2(hip[0])} ${f2(hip[1])}`;
  const hoseStroke = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f2(GL.s * 4.6)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#3fcf7a" stroke-width="${f2(GL.s * 2.4)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  g += hoseStroke(hoseD);   // reel → floor → behind her far hip (drawn BEFORE her)
  // the girl behind the car (drawn before the car: it hides her below the hood line)
  g += `<g transform="translate(${f2(GL.x)} ${f2(GL.y)}) scale(${f2(mir * GL.s)} ${f2(GL.s)}) translate(-64 -120)">${girl.body}</g>`;
  const aimW = GL.aimW, aim = im(projP(...aimW));   // jet target (chosen in girlPlace: downstream, off the spot area)
  { // composition checks: rear wheel never tangent to a canvas edge; ≥ 40 px of hose visible below the hand
    const rc = im(projP(-C.wx, C.axle, -Wh)), rw = C.wr * s, inside = Math.max(0, Math.min(1, (Math.min(W, rc[0] + rw) - Math.max(0, rc[0] - rw)) / (2 * rw)));
    if (inside > 0.5 && inside < 0.6) console.warn(`wash: rear wheel tangent to the edge (${(inside * 100).toFixed(0)}% in, ${v}${wide ? " wide" : ""})`);
    if (!done && 34 * GL.s < 40) console.warn(`wash: hose leg below the hand only ${(34 * GL.s).toFixed(0)} px (${v}${wide ? " wide" : ""})`);
  }
  if (hd) {
    g += hoseStroke(`M${f2(hd[0])} ${f2(hd[1])} Q${f2(hd[0])} ${f2(hd[1] + 18 * GL.s)} ${f2(hd[0] - mir * 6 * GL.s)} ${f2(hd[1] + 34 * GL.s)}`);   // hand → down, AFTER her
    const ang = Math.atan2(aim[1] - hd[1], aim[0] - hd[0]) * 180 / Math.PI - 90;
    g += `<g transform="translate(${f2(hd[0])} ${f2(hd[1])}) rotate(${f2(ang)}) scale(${f2(GL.s)})"><rect x="-3.8" y="-2" width="7.6" height="16" rx="2.5" fill="#3a3f78" ${stk(2.4)}/><rect x="-5" y="12" width="10" height="5" rx="2" fill="${YELLOW}" ${stk(2)}/><rect x="3" y="2" width="5" height="7" rx="2" fill="#3a3f78" ${stk(2)}/></g>`;
    g += `<circle cx="${f2(hd[0])}" cy="${f2(hd[1])}" r="${f2(6.2 * GL.s)}" fill="${WASHER.skin}" ${stk(3 * GL.s)}/>`;
  }
  if (!girl.hand) { const gun = gp([64 + 26, 112]); g += `<g transform="translate(${f2(gun[0])} ${f2(gun[1])}) scale(${f2(GL.s)}) rotate(-70)"><rect x="-3.8" y="-2" width="7.6" height="16" rx="2.5" fill="#3a3f78" ${stk(2.4)}/><rect x="-5" y="12" width="10" height="5" rx="2" fill="${YELLOW}" ${stk(2)}/></g>`; }
  // the car, its finish (clipped to the paint, under the flares/wheels), then the front layer
  const cg = (body) => `<g transform="translate(${f2(tx)} ${f2(ty)}) scale(${f2(s)})">${body}</g>`;
  g += cg(car.body);
  const cf = cabinFaces();
  let fin = "";
  if (done) {
    // plane-aligned gloss: side strip, hood streak, roof streak, one windshield glare + a diagonal
    // specular band across the hood
    fin += `<path d="${pathOf(onSide([[-44, 44], [44, 44], [44, 46.5], [-44, 46.5]], 0.7))}" fill="#fff" opacity=".75"/>`;
    fin += `<path d="${pathOf(deckStrip(C.hood[0] + 12, C.hl - C.inset - 14, -40, -34))}" fill="#fff" opacity=".85"/>`;
    fin += `<path d="${pathOf([[-60, 26], [-14, 26], [-14, 31], [-60, 31]].map(([x, z]) => projP(x, C.roof, z)))}" fill="#fff" opacity=".8"/>`;
    fin += `<path d="${roundPoly([cf.ws(0.25, -0.55), cf.ws(0.25, -0.4), cf.ws(0.8, -0.2), cf.ws(0.8, -0.35)], 2)}" fill="#fff" opacity=".35"/>`;
    fin += `<g clip-path="url(#${u}paint)"><path d="${pathOf(onDeck([[96, -60], [126, -60], [106, 60], [76, 60]]))}" fill="url(#${u}spec)"/></g>`;
  } else {
    fin += `<rect x="${f2(bb[0] - 20)}" y="${f2(bb[1] - 20)}" width="${f2(bb[2] - bb[0] + 40)}" height="${f2(bb[3] - bb[1] + 40)}" fill="#8a6a48" opacity="${v === "silver" || v === "yellow" ? 0.3 : 0.22}" style="mix-blend-mode:multiply"/>`;   // a darkening (multiply) dirt tint, not a lightening film
    for (let i = 0; i < 14; i++) { const arch = i % 2 === 0, wx = i % 4 < 2 ? C.wx : -C.wx, a = (20 + R() * 140) * Math.PI / 180, p = arch ? projP(wx + Math.cos(a) * (C.wellR + C.flare + 3 + R() * 4), C.axle + Math.sin(a) * (C.wellR + C.flare + 3 + R() * 4), -Wh - 0.8) : projP(-120 + R() * 240, C.sill + 1 + R() * 5, -Wh - 0.8); fin += `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(0.6 + R() * 1.2)}" fill="#5a3f26"/>`; }   // crisp splatter
    [-30, 4, 30, 60].forEach((x) => { const a = projP(x, C.sill + 10, -Wh - 0.8), b = projP(x + 0.5, C.sill + 1, -Wh - 0.8); fin += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}" stroke="#5a3f26" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>`; });   // drips
    const plan = planRR(-C.hl, C.hl, Wh, C.rc, 8);
    fin += `<path d="${pathOf(bandRun(plan, plan, C.sill, 32))}" fill="url(#${u}grime)"/>`;
    car.glass.forEach((d) => { fin += `<path d="${d}" fill="#b9a98a" opacity=".28"/>`; });
    // soft dirt film ON the paint (hood + side panel), so dirty vs clean differs where you scrub
    let soft = "";
    for (let i = 0; i < 36; i++) {
      const p = i % 2 ? projP(C.hood[0] + 8 + R() * (C.hl - C.hood[0] - 20), yTop(110), -50 + R() * 100) : projP(-56 + R() * 112, 20 + R() * 26, -Wh - 0.8);
      const r = 3 + R() * 5;
      soft += `<path d="${K.blob(p[0], p[1], r * 1.4, r, 9, 0.3, R)}" fill="#6b4a2a" opacity="${f2(0.15 + R() * 0.13)}" filter="url(#${u}sm)"/>`;
    }
    fin += `<g clip-path="url(#${u}paint)">${soft}</g>`;
    [[38, 37], [-14, 37]].forEach(([x, y]) => { for (let k = 0; k < 3; k++) { const xx = x - 14 + k * 5 + R() * 2, a = projP(xx, y - 1, -Wh - 0.8), b = projP(xx + 0.4, y - 6 - R() * 8, -Wh - 0.8); fin += `<path d="M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}" stroke="#6b4a2a" stroke-width="1.1" stroke-linecap="round" opacity=".32"/>`; } });
    for (let i = 0; i < 50; i++) {
      const p = i % 3 === 0 ? projP(C.hl + 0.8, 13 + R() * 14, -32 + R() * 64) : projP(-140 + R() * 280, 12 + R() * 9, -Wh - 0.8);
      fin += `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(0.5 + R() * 0.9)}" fill="#6b4a2e" opacity="${f2(0.45 + R() * 0.3)}"/>`;
    }
    const blobAt = (p, r) => `<path d="${K.blob(p[0], p[1], r * 1.5, r, 9, 0.35, R)}" fill="#6b4a2e" opacity=".55"/>`;
    [-128, -104, -30, 5, 40, 120, 136].forEach((x) => { fin += blobAt(projP(x, 14 + R() * 3, -Wh - 0.8), 1.6 + R() * 1.4); });
    [-24, 0, 24].forEach((z) => { fin += blobAt(projP(C.hl + 0.8, 14 + R() * 3, z), 1.6 + R() * 1.2); });
    [C.wx, -C.wx].forEach((wx) => { [[14, 40], [140, 166]].forEach(([a0, a1]) => { for (let k = 0; k < 5; k++) { const a = (a0 + R() * (a1 - a0)) * Math.PI / 180, r2 = C.wellR + C.flare + 2 + R() * 5, p = projP(wx + Math.cos(a) * r2, C.axle + Math.sin(a) * r2, -Wh - 0.8); fin += `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(0.6 + R() * 1)}" fill="#6b4a2e" opacity=".6"/>`; } }); });
  }
  g += cg(`<g clip-path="url(#${u}clip)">${fin}</g>`);
  g += cg(car.front);
  if (done) g += cg([C.wx, -C.wx].map((wx) => `<path d="${pathOf(sideArc(wx, C.axle, C.wellR + 1.4, C.wellR + 3.2, 45, 135))}" fill="#fff" opacity=".7"/>`).join(""));
  g += wide ? bucket(W * 0.12, H * 0.86, 1.15, u) : bucket(W * 0.72, H * 0.9, 1.25, u);
  // water jet: hose tip → front-near hood (away from her body); drops + a splash ring on the hood plane
  if (!done) {
    const dx = aim[0] - hd[0], dy = aim[1] - hd[1], dl = Math.hypot(dx, dy) || 1, dir = [dx / dl, dy / dl];
    const t = [hd[0] + dir[0] * 17 * GL.s, hd[1] + dir[1] * 17 * GL.s], c = [t[0] + dir[0] * 40 * GL.s, t[1] + dir[1] * 40 * GL.s - 30 * GL.s];
    const hc = gp(girl.head), hr = girl.headR * GL.s;
    let dmin = 1e9; for (let k = 0; k <= 40; k++) { const p = qb(t, c, aim, k / 40); dmin = Math.min(dmin, Math.hypot(p[0] - hc[0], p[1] - hc[1]) - hr); }
    if (dmin < 0) console.warn(`wash jet crosses the girl's head (${v}${wide ? " wide" : ""}): ${dmin.toFixed(0)} px`);
    [[0, 9, 0.85], [-12, 4, 0.6], [12, 4, 0.6]].forEach(([o, w, op]) => { g += `<path d="M${f2(t[0])} ${f2(t[1])} Q${f2(c[0] + o)} ${f2(c[1] + o)} ${f2(aim[0] + o * 1.2)} ${f2(aim[1])}" fill="none" stroke="#bff6ff" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`; });
    const ring = []; for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2, x = aimW[0] + Math.cos(a) * 14, z = aimW[2] + Math.sin(a) * 14; ring.push(im(projP(x, yTop(x), z))); }   // a circle ON the deck plane
    g += `<path d="${pathOf(ring)}" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>`;
    for (let i = 0; i < 9; i++) { const x = aimW[0] - 14 + R() * 28, z = aimW[2] - 14 + R() * 28, p = im(projP(x, yTop(x) + 2, z)); g += `<path d="${DROP(p[0], p[1], (0.6 + R() * 0.5) * s / 3.6)}" fill="#9fe6ff" ${stk(2, "#e8fbff")}/>`; }
  }
  const bub = wide ? [[110, 320, 22], [400, 200, 16], [700, 170, 26], [980, 230, 14], [1490, 360, 18], [1180, 160, 12]]   // inside the visible crops (wide y 0.13–0.87, portrait x 0.2–0.8)
    : [[200, 380, 24], [240, 300, 14], [700, 330, 26], [650, 250, 14], [200, 640, 18], [520, 210, 12]];
  bub.forEach(([x, y, r]) => { g += bubble(x, y, r, 0.85); });
  if (done) {
    const sp = wide ? [[0.34, 0.33, 26], [0.62, 0.3, 26], [0.27, 0.8, 20], [0.82, 0.55, 20], [0.5, 0.88, 22], [0.06, 0.62, 16]]
      : [[0.22, 0.42, 30], [0.75, 0.32, 26], [0.22, 0.75, 22], [0.8, 0.55, 22], [0.5, 0.82, 16], [0.7, 0.2, 20]];
    sp.forEach(([a, b, r], i) => { g += `<path d="${star(W * a, H * b, r, r * 0.28, 4)}" fill="${i % 3 === 1 ? "#bff6ff" : "#fff6c8"}" filter="url(#${u}sg)"/><path d="${star(W * a, H * b, r * 0.45, r * 0.14, 4)}" fill="#fff"/>`; });
  }
  PV = VIEWS.portrait;
  return job(`assets/img/wash_${v}${wide ? "_wide" : ""}${done ? "_done" : ""}.png`, W, H, g, defs);
}
// Mud splats that sit on the car body (spots to scrub). face: cute little sad face
function mudSplat(file, seed, o) {
  const R = rng(seed), cx = 64, cy = 66, col = o.col || "#8a5a34", rim = shade(col, -0.45);
  const defs = rad(`${file}m`, [[0, shade(col, 0.28)], [0.7, col], [1, shade(col, -0.18)]], 0.42, 0.36, 0.72);
  const pts = [], n = 22, lobe = Array.from({ length: 7 }, () => 0.5 + R() * 0.9);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, t = (i / n) * 7, k = Math.floor(t), fr = t - k;
    const rr = (o.r || 36) + Math.sin(fr * Math.PI) * lobe[k % 7] * 9;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.88]);
  }
  let g = `<path d="${smooth(pts)}" fill="url(#${file}m)" stroke="${rim}" stroke-width="4" stroke-linejoin="round"/>`;
  // flung droplets
  for (let i = 0; i < (o.drops || 4); i++) {
    const a = (i / (o.drops || 4)) * Math.PI * 2 + 0.4 + R() * 0.5, d = (o.r || 36) + 15 + R() * 6, r = 3.5 + R() * 3;
    g += `<circle cx="${f2(cx + Math.cos(a) * d)}" cy="${f2(cy + Math.sin(a) * d * 0.88)}" r="${f2(r)}" fill="${col}" stroke="${rim}" stroke-width="2.4"/>`;
  }
  // dirt specks + gloss
  for (let i = 0; i < (o.specks || 0); i++) { const a = R() * 6.28, d = o.face ? 25 + R() * 5 : R() * 24; g += `<circle cx="${f2(cx + Math.cos(a) * d)}" cy="${f2(cy + 6 + Math.sin(a) * d * 0.7)}" r="${f2(1.6 + R() * 2.2)}" fill="${i % 3 ? rim : "#c49a6a"}" opacity=".75"/>`; }
  g += `<ellipse cx="${cx - 14}" cy="${cy - 16}" rx="10" ry="5" fill="#fff" opacity=".35" transform="rotate(-28 ${cx - 14} ${cy - 16})"/>`;
  if (o.face) {
    g += `<ellipse cx="${cx - 11}" cy="${cy - 2}" rx="5" ry="6" fill="${INK}"/><ellipse cx="${cx + 11}" cy="${cy - 2}" rx="5" ry="6" fill="${INK}"/><circle cx="${cx - 12.5}" cy="${cy - 4.5}" r="2" fill="#fff"/><circle cx="${cx + 9.5}" cy="${cy - 4.5}" r="2" fill="#fff"/>`;
    g += `<path d="M${cx - 7} ${cy + 13} Q${cx} ${cy + 7} ${cx + 7} ${cy + 13}" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
    g += `<path d="M${cx - 17} ${cy - 9} L${cx - 8} ${cy - 13} M${cx + 17} ${cy - 9} L${cx + 8} ${cy - 13}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return job(`assets/img/${file}.png`, 128, 128, g, defs);
}
// Car-wash sponge held by a strap handle, foam on top; scrubbing face = bottom edge, tilted
// so its bottom-left corner leads (SPONGE.tip, local coords before rotation).
const SPONGE = { W: 128, cx: 66, cy: 70, rot: -22, tip: [-30, 22] };
function spongeTip() { const a = SPONGE.rot * Math.PI / 180, [x, y] = SPONGE.tip; return { x: +((SPONGE.cx + x * Math.cos(a) - y * Math.sin(a)) / SPONGE.W).toFixed(3), y: +((SPONGE.cy + x * Math.sin(a) + y * Math.cos(a)) / SPONGE.W).toFixed(3) }; }
function spongeBody(sw, foam) {   // local coords, centred on 0,0: 84×46 block
  let g = `<path d="M-42 -8 Q-44 -24 -26 -24 H26 Q44 -24 42 -8 L42 10 Q44 24 28 24 H-28 Q-44 24 -42 10 Z" fill="url(#spy)" ${stk(sw)}/>`;
  g += `<path d="M-40 12 Q-42 22 -28 22 H28 Q42 22 40 12" fill="none" stroke="#d99a1a" stroke-width="${sw * 1.4}" stroke-linecap="round" opacity=".55"/>`;
  [[-26, -6, 4], [-12, 4, 3], [4, -10, 3.5], [18, 2, 4.2], [30, -8, 2.6], [-30, 8, 2.6], [8, 12, 2.6], [-4, -2, 2]].forEach(([x, y, r]) => { g += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="#d9921a" opacity=".7"/>`; });
  g += `<path d="M-34 -14 Q-20 -19 -4 -18" fill="none" stroke="#fff" stroke-width="${sw * 0.9}" stroke-linecap="round" opacity=".6"/>`;
  if (foam) {
    [[-30, -24, 9], [-16, -28, 11], [0, -27, 9], [15, -29, 12], [31, -24, 9], [-6, -36, 7], [22, -38, 6]].forEach(([x, y, r]) => { g += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#spf)" ${stk(sw * 0.75)}/>`; });
    g += `<path d="M-38 -24 H40" stroke="url(#spf)" stroke-width="10" stroke-linecap="round"/>`;
  }
  return g;
}
const SPONGE_DEFS = lin("spy", [[0, "#fff09a"], [0.5, "#ffd23c"], [1, "#f0a81e"]]) + rad("spf", [[0, "#ffffff"], [0.7, "#f2fbff"], [1, "#cfe9ff"]], 0.38, 0.32, 0.7);
function sponge() {
  const defs = SPONGE_DEFS + lin("sph", [[0, "#7ae8ff"], [1, "#2a9ad8"]]) + glow("spg", 2.5);
  let g = `<g transform="translate(${SPONGE.cx} ${SPONGE.cy}) rotate(${SPONGE.rot})">`;
  // strap handle over the top (behind the foam)
  g += `<path d="M-22 -22 Q-24 -58 0 -58 Q24 -58 22 -22" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M-22 -22 Q-24 -58 0 -58 Q24 -58 22 -22" fill="none" stroke="url(#sph)" stroke-width="8" stroke-linecap="round"/><path d="M-14 -46 Q-8 -53 2 -53" fill="none" stroke="#e8fbff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`;
  g += spongeBody(4, true);
  g += `</g>`;
  g += bubble(108, 30, 9, 0.95) + bubble(116, 54, 5.5, 0.95) + bubble(20, 34, 6, 0.95);
  g += `<path d="${star(104, 92, 9, 2.8, 4)}" fill="#fff6c8" filter="url(#spg)"/>`;
  return job("assets/img/sponge.png", SPONGE.W, SPONGE.W, g, defs);
}

/* ============================ BUILD ============================ */
const HIDPI = [
  [/favicon|apple-touch|icon-192|icon-maskable/, { keep: true }],
  [/splash/, { scale: 2, type: "webp", ext: ".webp" }],
  [/assets\/img\/wash_/, { scale: 2, type: "webp", ext: ".webp" }],   // car-wash close-up backdrops (like closeups)
  [/logo/, { scale: 2.5, type: "webp", ext: ".webp" }],
  [/assets\/img\/(mud_|sponge)/, { scale: 3, type: "webp", ext: ".webp" }],   // close-up props (like nebula's dust/cloth)
  [/ui\/icons\//, { scale: 2, type: "webp", ext: ".webp" }],
  [/assets\/ui\//, { scale: 6, type: "webp", ext: ".webp" }],
  [/assets\/(img|sheet)\//, { scale: 2, type: "webp", ext: ".webp" }],
];
function build() {
  const jobs = [];
  jobs.push(carSheet("assets/sheet/car.png", {}), carSheet("assets/sheet/police.png", { police: true }), carBackJob(), policeBack(), policeFront(), startGate(), cone());
  Object.keys(PEOPLE).forEach((id) => jobs.push(personSheet(id), personThumb(id)));
  jobs.push(asphalt(), sidewalk(), grass(), crosswalk(), lane(false), lane(true));
  jobs.push(
    towerJob("assets/img/tower_cyan.png", 240, 340, { u: "tc", x0: 24, w: 160, d: 30, dy: 22, top: 104, base: 326, wall: "#3b3577", accent: CYAN, cols: 4, rows: 7, glyph: "bolt", seed: 3 }),
    towerJob("assets/img/tower_pink.png", 240, 340, { u: "tp", x0: 30, w: 150, d: 28, dy: 20, top: 110, base: 326, wall: "#4a2f6e", accent: PINK, win: "strips", cols: 4, rows: 9, glyph: "moon", glyph2: "star", accent2: CYAN, seed: 8, antenna: 0 }),
    dealer(), garage(), safehouse(), gas(), depot(), shopBlock(),
    palm(), streetlamp(), hydrant(), ramp(), bench(), planter(), billboard(),
    towerJob("assets/img/bldg_a.png", 180, 300, { u: "ba", x0: 14, w: 152, d: 0, dy: 0, top: 84, base: 286, wall: "#33407a", accent: CYAN, cols: 4, rows: 8, glyph: "ring", glyph2: "wave", signY: 40, seed: 12 }),
    towerJob("assets/img/bldg_b.png", 200, 260, { u: "bb", x0: 14, w: 172, d: 0, dy: 0, top: 84, base: 246, wall: "#4a2f6e", accent: PINK, win: "strips", cols: 5, rows: 6, glyph: "star", glyph2: "wave", accent2: CYAN, signY: 40, seed: 15 }),
    wantGas(), parcelMarker(), deliveryTarget(), flag(),
    logo(), splash(),
    ...Object.keys(WASH_COLORS).flatMap((v) => [washScene(v, false), washScene(v, true), washScene(v, false, true), washScene(v, true, true)]),
    mudSplat("mud_a", 7, { face: true, drops: 4 }), mudSplat("mud_b", 19, { col: "#7a4e2c", r: 33, drops: 6, specks: 9 }), mudSplat("mud_c", 31, { col: "#94643a", face: true, r: 34, drops: 3, specks: 7 }), sponge(),
    icon("assets/favicon.png", 512), icon("assets/apple-touch-icon.png", 180), icon("assets/icon-192.png", 192), icon("assets/icon-maskable.png", 512, 0.78),
    ...IK.jobs(PAL, ["star", "heart", "heartEmpty", "sound", "soundOff", "help", "avatar", "goals", "close", "play", "resume", "check", "gift", "hand", "sparkle", "bell", "refresh", "arrow", "trophy", "moon", "calendar", "palette", "home", "lock"]),
    ...gameIcons());
  return jobs;
}
module.exports = () => K.hidpi(build(), HIDPI);
module.exports.PEOPLE = PEOPLE;
if (require.main === module) {
  console.log("closeup.spots.area =", JSON.stringify(washAreas()));
  console.log("closeup.brushTip   =", JSON.stringify(spongeTip()));
}
