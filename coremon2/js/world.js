// ============================================================
// COREMON 2 — El mundo de Iberión: generación del continente (regiones,
// sierras, costa, lagos, hierba, ciudades, caminos y barreras de CoraCorp),
// mapas, colisiones, dibujado por trozos y minimapa.
// ============================================================

// el continente es 1,6 veces más grande que en la primera versión (mismas ciudades, más mundo entre ellas)
const WS = 1.6;
const WORLD_W = Math.round(320 * WS), WORLD_H = Math.round(240 * WS), CHUNK = 16;

// Ciudades (= regiones). order: orden de la aventura; req: medallas para entrar
const CITIES = [
  { id: 'gasteiz', name: 'Gasteiz', area: 'Pradera de Gasteiz', x: Math.round(64 * WS), y: Math.round(150 * WS), biome: 'meadow', gym: 'naturaleza', badge: 'Medalla Raíz', w: 34, h: 26, lv: [18, 23] },
  { id: 'ria', name: 'Puerto de la Ría', area: 'Costa de la Ría', x: Math.round(46 * WS), y: Math.round(196 * WS), biome: 'coast', gym: 'agua', badge: 'Medalla Marea', w: 28, h: 22, lv: [22, 27] },
  { id: 'umbria', name: 'Umbría', area: 'Ciénaga de Umbría', x: Math.round(122 * WS), y: Math.round(206 * WS), biome: 'swamp', gym: 'sombra', badge: 'Medalla Eclipse', w: 26, h: 20, lv: [26, 31] },
  { id: 'almar', name: 'Dunas de Almar', area: 'Desierto de Almar', x: Math.round(232 * WS), y: Math.round(196 * WS), biome: 'desert', gym: 'roca', badge: 'Medalla Duna', w: 28, h: 22, lv: [30, 35] },
  { id: 'ignea', name: 'Ignea', area: 'Laderas de Ignea', x: Math.round(282 * WS), y: Math.round(120 * WS), biome: 'volcano', gym: 'fuego', badge: 'Medalla Brasa', w: 26, h: 22, lv: [34, 39] },
  { id: 'voltia', name: 'Voltia', area: 'Llanura de Voltia', x: Math.round(176 * WS), y: Math.round(138 * WS), biome: 'plains', gym: 'electrico', badge: 'Medalla Voltio', w: 36, h: 28, lv: [38, 43] },
  { id: 'bosque', name: 'Bosque Olvido', area: 'Bosque Olvido', x: Math.round(92 * WS), y: Math.round(70 * WS), biome: 'forest', gym: 'aire', badge: 'Medalla Pluma', w: 26, h: 22, lv: [42, 47] },
  { id: 'nevera', name: 'Nevera', area: 'Montes de Nevera', x: Math.round(182 * WS), y: Math.round(46 * WS), biome: 'snow', gym: 'hielo', badge: 'Medalla Escarcha', w: 26, h: 22, lv: [46, 51] },
  { id: 'liga', name: 'Cumbre Corazón', area: 'Cumbre Corazón', x: Math.round(262 * WS), y: Math.round(48 * WS), biome: 'peak', gym: null, badge: null, w: 30, h: 24, lv: [50, 56] }
];
const CITY = Object.fromEntries(CITIES.map(c => [c.id, c]));
// caminos [a, b, medallas necesarias para cruzar la barrera]
const ROADS = [
  ['gasteiz', 'ria', 1], ['ria', 'umbria', 2], ['umbria', 'almar', 3], ['almar', 'ignea', 4], ['ignea', 'voltia', 5],
  ['gasteiz', 'voltia', 6], ['voltia', 'bosque', 6], ['bosque', 'gasteiz', 7], ['bosque', 'nevera', 7], ['nevera', 'liga', 8]
];

// ---------------- MAPA ----------------
class GameMap {
  constructor(id, w, h) {
    this.id = id; this.w = w; this.h = h;
    this.tiles = new Uint8Array(w * h);
    this.reg = new Uint8Array(w * h);           // índice de ciudad/región
    this.objs = []; this.buckets = new Map();
    this.npcs = []; this.warps = []; this.items = [];
    this.outdoor = false; this.name = id;
  }
  tileAt(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? undefined : this.tiles[y * this.w + x]; }
  set(x, y, t) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.tiles[y * this.w + x] = t; }
  regionIdx(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.reg[y * this.w + x]; }
  regionAt(x, y) { return this.outdoor ? CITIES[this.regionIdx(x, y)].biome : 'indoor'; }
  addObj(o) {
    const d = OBJ_DEF[o.type];
    if (d && !o.col && d.col) o.col = d.col;
    if (d && d.solid === false) o.solid = false;
    this.objs.push(o);
    const bx = Math.floor(o.x / (TS * 8)), by = Math.floor(o.y / (TS * 8)), k = bx + ',' + by;
    if (!this.buckets.has(k)) this.buckets.set(k, []);
    this.buckets.get(k).push(o);
    return o;
  }
  objsIn(x0, y0, x1, y1) {
    const out = [], B = TS * 8;
    for (let by = Math.floor(y0 / B) - 1; by <= Math.floor(y1 / B) + 1; by++)
      for (let bx = Math.floor(x0 / B) - 1; bx <= Math.floor(x1 / B) + 1; bx++) {
        const l = this.buckets.get(bx + ',' + by); if (l) for (const o of l) out.push(o);
      }
    return out;
  }
}

// ---------------- GENERACIÓN DEL CONTINENTE ----------------
let WORLD = null;
const SEED = 2026;

function generateWorld() {
  const t0 = performance.now();
  const m = new GameMap('world', WORLD_W, WORLD_H);
  m.outdoor = true; m.name = 'Iberión';
  const W = WORLD_W, H = WORLD_H;
  const land = new Uint8Array(W * H), ridge = new Uint8Array(W * H);
  const cityDist = new Float32Array(W * H);

  // 1) regiones (Voronoi deformado con ruido) y tierra firme
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const wx = x + (fbm(x * 0.035 / WS, y * 0.035 / WS, SEED + 1, 3) - 0.5) * 26 * WS;
    const wy = y + (fbm(x * 0.035 / WS, y * 0.035 / WS, SEED + 2, 3) - 0.5) * 26 * WS;
    let d1 = 1e9, d2 = 1e9, best = 0, cd = 1e9;
    CITIES.forEach((c, ci) => {
      const d = Math.hypot(wx - c.x, wy - c.y);
      if (d < d1) { d2 = d1; d1 = d; best = ci; } else if (d < d2) d2 = d;
      cd = Math.min(cd, Math.hypot(x - c.x, y - c.y));
    });
    m.reg[i] = best; cityDist[i] = cd;
    const nx = (x - 160 * WS) / (152 * WS), ny = (y - 124 * WS) / (114 * WS);
    const sup = Math.pow(Math.pow(Math.abs(nx), 3.2) + Math.pow(Math.abs(ny), 3.2), 1 / 3.2);
    const edge = sup + (fbm(x * 0.045 / WS, y * 0.045 / WS, SEED + 3, 4) - 0.5) * 0.28;
    land[i] = (edge < 1 || cd < 20) ? 1 : 0;
    const rw = 2.3 + fbm(x * 0.08, y * 0.08, SEED + 4, 2) * 2.6;
    if (land[i] && d2 - d1 < rw && cd > 14) ridge[i] = 1;
  }
  // 2) terreno base por bioma
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, c = CITIES[m.reg[i]];
    if (!land[i]) { m.tiles[i] = T.DEEP; continue; }
    const n = fbm(x * 0.07, y * 0.07, SEED + 5, 3);
    let t = T.GRASS;
    switch (c.biome) {
      case 'forest': t = n > 0.42 ? T.FOREST : T.GRASS; break;
      case 'snow': t = n > 0.66 ? T.ICE : T.SNOW; break;
      case 'desert': t = n > 0.62 ? T.DRY : T.SAND; break;
      case 'swamp': t = n > 0.5 ? T.SWAMP : T.GRASS; break;
      case 'volcano': t = n > 0.55 ? T.ASH : n > 0.4 ? T.DRY : T.ASH; break;
      case 'peak': t = n > 0.7 ? T.SNOW : T.GRASS; break;
    }
    m.tiles[i] = t;
    if (ridge[i]) m.tiles[i] = T.ROCK;
  }
  // 3) mar: agua poco profunda junto a la costa y playas
  const seaD = bfsDistance(W, H, i => land[i] === 1);
  const landD = bfsDistance(W, H, i => land[i] === 0);
  for (let i = 0; i < W * H; i++) {
    if (!land[i]) { m.tiles[i] = seaD[i] <= 3 ? T.WATER : T.DEEP; continue; }
    const c = CITIES[m.reg[i]];
    if (landD[i] <= 2 && m.tiles[i] !== T.ROCK && cityDist[i] > 6) m.tiles[i] = c.biome === 'snow' ? T.ICE : c.biome === 'volcano' ? T.ASH : T.SAND;
  }
  // 4) montes, lagos y lava dentro de las regiones
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!land[i] || ridge[i] || cityDist[i] < 22 || landD[i] < 5) continue;
    const c = CITIES[m.reg[i]];
    const hgt = fbm(x * 0.05, y * 0.05, SEED + 6, 4);
    if (hgt > 0.7) { m.tiles[i] = T.ROCK; continue; }
    if (hgt < 0.29) {
      if (c.biome === 'volcano') m.tiles[i] = T.LAVA;
      else if (c.biome === 'desert') { if (hgt < 0.24) m.tiles[i] = T.WATER; }
      else m.tiles[i] = hgt < 0.25 ? T.DEEP : T.WATER;
    }
  }
  // 5) hierba alta (encuentros) y hierba oscura (Coremon más fuertes)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, t = m.tiles[i];
    if (!land[i] || cityDist[i] < 18) continue;
    if (![T.GRASS, T.FOREST, T.SNOW, T.SAND, T.DRY, T.ASH, T.SWAMP].includes(t)) continue;
    if (CITIES[m.reg[i]].biome === 'desert' && t === T.SAND && landD[i] < 6) continue;
    const g = fbm(x * 0.11, y * 0.11, SEED + 7, 3);
    const c = CITIES[m.reg[i]];
    if (g > 0.6) {
      const dark = cityDist[i] > 30 && fbm(x * 0.04, y * 0.04, SEED + 8, 2) > 0.62;
      m.tiles[i] = dark ? T.DARK : c.biome === 'snow' ? T.SNOWTALL : (c.biome === 'desert' || c.biome === 'volcano') ? T.DRYTALL : T.TALL;
    }
  }
  // 6) ciudades: suelo urbano
  CITIES.forEach(c => {
    const x0 = c.x - (c.w >> 1), y0 = c.y - (c.h >> 1);
    for (let y = y0 - 3; y < y0 + c.h + 3; y++) for (let x = x0 - 3; x < x0 + c.w + 3; x++) {
      const inside = x >= x0 && y >= y0 && x < x0 + c.w && y < y0 + c.h;
      const corner = (x === x0 || x === x0 + c.w - 1) && (y === y0 || y === y0 + c.h - 1);
      if (inside && !corner) m.set(x, y, T.PLAZA);
      else { const t = m.tileAt(x, y); if (t === T.ROCK || t === T.WATER || t === T.DEEP || TALL_T.has(t) || t === T.LAVA) m.set(x, y, c.biome === 'desert' ? T.SAND : c.biome === 'snow' ? T.SNOW : c.biome === 'volcano' ? T.ASH : T.GRASS); }
      m.reg[y * W + x] = CITIES.indexOf(c);
    }
  });
  // 7) caminos con A* y barreras en los pasos de montaña
  m.roads = [];
  m.gates = [];
  ROADS.forEach(([a, b, req], ri) => {
    const A = CITY[a], B = CITY[b];
    const ia = CITIES.indexOf(A), ib = CITIES.indexOf(B);
    let path = astar(m, A.x, A.y, B.x, B.y, (x, y) => { const r = m.regionIdx(x, y); return r === ia || r === ib; });
    if (!path) path = astar(m, A.x, A.y, B.x, B.y, null);
    if (!path) return;
    m.roads.push({ a, b, req, path });
    // carva el camino (3 de ancho) y detecta los pasos de sierra
    let inPass = null;
    path.forEach(([x, y], k) => {
      const wasRock = ridge[y * W + x] === 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const tx = x + dx, ty = y + dy, t = m.tileAt(tx, ty);
        if (t === undefined) continue;
        const inCity = CITIES.some(c => Math.abs(tx - c.x) < (c.w >> 1) && Math.abs(ty - c.y) < (c.h >> 1));
        if (inCity) { if (Math.abs(dx) + Math.abs(dy) <= 1) m.set(tx, ty, T.ROAD); continue; }
        if (t === T.WATER || t === T.DEEP || t === T.LAVA) m.set(tx, ty, T.BRIDGE);
        else if (t !== T.BRIDGE) m.set(tx, ty, T.PATH);
      }
      if (wasRock && !inPass) inPass = { start: k };
      if (!wasRock && inPass) { inPass.end = k; placeGate(m, path, inPass, req, ri); inPass = null; }
    });
  });
  // 7b) pueblos en mitad de los caminos (centro, tienda y tablón de misiones)
  VILLAGES.length = 0; for (const k in VILLAGE) delete VILLAGE[k];
  m.roads.forEach((rd, ri) => {
    for (const f of [0.5, 0.4, 0.6, 0.3, 0.7]) {
      const [x, y] = rd.path[Math.floor(rd.path.length * f)];
      if (CITIES.some(c => Math.hypot(c.x - x, c.y - y) < 36)) continue;
      if (VILLAGES.some(v => Math.hypot(v.x - x, v.y - y) < 40)) continue;
      if (m.gates.some(g => Math.hypot(g.x - x, g.y - y) < 16)) continue;
      let ok = true;
      for (let dy = -10; dy <= 10 && ok; dy++) for (let dx = -15; dx <= 15; dx++) { const t = m.tileAt(x + dx, y + dy); if (t === undefined || t === T.ROCK || t === T.DEEP || ridge[(y + dy) * W + x + dx]) { ok = false; break; } }
      if (!ok) continue;
      const reg = m.regionIdx(x, y);
      const v = { id: 'v' + VILLAGES.length, name: VILLAGE_NAMES[VILLAGES.length % VILLAGE_NAMES.length], x, y, w: 24, h: 16, road: ri, regionIdx: reg, biome: CITIES[reg].biome, lv: CITIES[reg].lv, village: true };
      VILLAGES.push(v); VILLAGE[v.id] = v;
      break;
    }
  });
  // 7c) una aldea apartada en cada región, unida a su ciudad por un sendero
  CITIES.forEach((c, ci) => {
    const rr = mulberry32(strSeed('hamlet:' + c.id));
    for (let tries = 0; tries < 80; tries++) {
      const a = rr() * Math.PI * 2, d = 38 + rr() * 34;
      const x = Math.round(c.x + Math.cos(a) * d), y = Math.round(c.y + Math.sin(a) * d * 0.8);
      if (m.regionIdx(x, y) !== ci) continue;
      if (VILLAGES.some(v => Math.hypot(v.x - x, v.y - y) < 36) || CITIES.some(o => Math.hypot(o.x - x, o.y - y) < 34)) continue;
      let ok = true;
      for (let dy = -10; dy <= 10 && ok; dy++) for (let dx = -15; dx <= 15; dx++) { const t = m.tileAt(x + dx, y + dy), i = (y + dy) * W + x + dx; if (t === undefined || t === T.ROCK || t === T.DEEP || ridge[i] || m.regionIdx(x + dx, y + dy) !== ci) { ok = false; break; } }
      if (!ok) continue;
      const path = astar(m, x, y, c.x, c.y, (px, py) => m.regionIdx(px, py) === ci && m.tileAt(px, py) !== T.ROCK);
      if (!path) continue;
      path.forEach(([px, py]) => { const t = m.tileAt(px, py); if (t === T.WATER || t === T.DEEP || t === T.LAVA) m.set(px, py, T.BRIDGE); else if (![T.ROAD, T.PLAZA, T.BRIDGE].includes(t)) m.set(px, py, T.PATH); });
      const v = { id: 'v' + VILLAGES.length, name: VILLAGE_NAMES[VILLAGES.length % VILLAGE_NAMES.length], x, y, w: 24, h: 16, road: -1, home: c.id, regionIdx: ci, biome: c.biome, lv: c.lv, village: true };
      VILLAGES.push(v); VILLAGE[v.id] = v;
      break;
    }
  });
  // 8) edificios, decoración urbana y naturaleza
  CITIES.forEach(c => buildCity(m, c));
  VILLAGES.forEach(v => buildVillage(m, v));
  scatterNature(m, land, cityDist);
  m.landD = landD;
  m.genMs = Math.round(performance.now() - t0);
  return m;
}

function bfsDistance(W, H, isSource) {
  const d = new Int16Array(W * H).fill(32767), q = new Int32Array(W * H);
  let qh = 0, qt = 0;
  for (let i = 0; i < W * H; i++) if (isSource(i)) { d[i] = 0; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++], x = i % W, y = (i / W) | 0, nd = d[i] + 1;
    if (x > 0 && d[i - 1] > nd) { d[i - 1] = nd; q[qt++] = i - 1; }
    if (x < W - 1 && d[i + 1] > nd) { d[i + 1] = nd; q[qt++] = i + 1; }
    if (y > 0 && d[i - W] > nd) { d[i - W] = nd; q[qt++] = i - W; }
    if (y < H - 1 && d[i + W] > nd) { d[i + W] = nd; q[qt++] = i + W; }
  }
  return d;
}

// A* en la cuadrícula: barato por hierba, caro por roca (cruza las sierras por lo más estrecho) y por agua (puentes)
function astar(m, sx, sy, ex, ey, allow) {
  const W = m.w, H = m.h, N = W * H;
  const g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [];
  const push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let s = k; if (l < heap.length && heap[l][0] < heap[s][0]) s = l; if (r < heap.length && heap[r][0] < heap[s][0]) s = r; if (s === k) break; [heap[s], heap[k]] = [heap[k], heap[s]]; k = s; } } return top; };
  const cost = (x, y) => {
    const t = m.tileAt(x, y);
    if (t === undefined) return 1e9;
    if (allow && !allow(x, y)) return 1e9;
    if (t === T.DEEP) return 60;
    if (t === T.WATER || t === T.LAVA) return 25;
    if (t === T.ROCK) return 9;
    if (t === T.PATH || t === T.ROAD || t === T.PLAZA) return 0.6;
    return 1 + fbm(x * 0.15, y * 0.15, SEED + 9, 2) * 1.6;
  };
  const s = sy * W + sx, e = ey * W + ex;
  g[s] = 0; push(s, 0);
  while (heap.length) {
    const [, i] = pop();
    if (i === e) break;
    if (closed[i]) continue;
    closed[i] = 1;
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1) continue;
      const ni = ny * W + nx, c = cost(nx, ny);
      if (c >= 1e9) continue;
      const ng = g[i] + c;
      if (ng < g[ni]) { g[ni] = ng; came[ni] = i; push(ni, ng + (Math.abs(nx - ex) + Math.abs(ny - ey)) * 0.6); }
    }
  }
  if (came[e] < 0) return null;
  const path = [];
  for (let i = e; i !== s; i = came[i]) path.push([i % W, (i / W) | 0]);
  path.push([sx, sy]);
  return path.reverse();
}

// barrera de CoraCorp en mitad de un paso de montaña (tapa los 3 de ancho del camino)
function placeGate(m, path, pass, req, ri) {
  if (req <= 0) return;
  const k = Math.floor((pass.start + pass.end) / 2);
  const [x, y] = path[k];
  const [px0, py0] = path[Math.max(0, k - 1)], [px1, py1] = path[Math.min(path.length - 1, k + 1)];
  const horiz = Math.abs(px1 - px0) > Math.abs(py1 - py0); // el camino va en horizontal: barrera vertical
  const id = 'gate' + ri + '_' + k;
  m.gates.push({ id, req, x, y, horiz });
  for (let d = -1; d <= 1; d++) {
    const gx = horiz ? x : x + d, gy = horiz ? y + d : y;
    m.addObj({ type: 'barrier', x: gx * TS + 16, y: gy * TS + 30, gate: id, req, col: [-16, -28, 32, 30] });
  }
}

// ---------------- CIUDADES ----------------
// Plantilla de edificios (posición relativa al centro, en casillas; esquina superior izquierda)
const CITY_LAYOUT = [
  { kind: 'center', dx: -14, dy: -11, w: 7, h: 5, roof: '#d84a4a', label: 'CENTRO COREMON' },
  { kind: 'shop', dx: 5, dy: 3, w: 6, h: 4, roof: '#3f7fd0', label: 'TIENDA' },
  { kind: 'gym', dx: 4, dy: -12, w: 9, h: 6, label: 'GIMNASIO' },
  { kind: 'house', dx: -14, dy: 3, w: 5, h: 4 },
  { kind: 'house', dx: -14, dy: 8, w: 5, h: 4 },
  { kind: 'house', dx: 12, dy: 3, w: 5, h: 4 },
  { kind: 'house', dx: 5, dy: 8, w: 5, h: 4 }
];
const ROOF_COLORS = ['#a0522d', '#5d7f3a', '#7b4fa0', '#c0504d', '#3f6f8f', '#8d6e63'];

function buildCity(m, c) {
  m.buildings = m.buildings || [];
  const r = mulberry32(strSeed('city:' + c.id));
  const layout = CITY_LAYOUT.slice();
  if (c.id === 'gasteiz') { layout.push({ kind: 'school', dx: -6, dy: -13, w: 12, h: 7, label: 'COLEGIO' }); layout.push({ kind: 'lab', dx: 12, dy: 8, w: 6, h: 4, roof: '#26a69a', label: 'LABORATORIO' }); layout.splice(layout.findIndex(b => b.kind === 'house' && b.dx === 12), 1); }
  if (c.id === 'voltia') layout.push({ kind: 'corp', dx: -6, dy: 7, w: 9, h: 7, roof: '#1d1a26', label: 'TORRE CORACORP' });
  if (c.id === 'liga') { layout.length = 0; layout.push({ kind: 'center', dx: -14, dy: -10, w: 7, h: 5, roof: '#d84a4a', label: 'CENTRO COREMON' }, { kind: 'shop', dx: 6, dy: 4, w: 6, h: 4, roof: '#3f7fd0', label: 'TIENDA' }, { kind: 'liga', dx: -5, dy: -12, w: 11, h: 7, roof: '#b8860b', label: 'LIGA COREMON' }); }
  if (c.id === 'gasteiz') { const g = layout.find(b => b.kind === 'gym'); g.dx = 6; }
  layout.forEach(L => placeBuilding(m, c, L, r));
  addBoard(m, c);
  // decoración: fuente, farolas, bancos, flores, árboles de borde y cartel
  m.addObj({ type: 'fountain', x: (c.x - 5) * TS, y: (c.y - 3) * TS });
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    m.addObj({ type: 'lamp', x: (c.x + i * 5) * TS + 6, y: (c.y - 1) * TS + 2 });
    m.addObj({ type: 'lamp', x: (c.x + 2) * TS + 8, y: (c.y + i * 4) * TS + 2 });
  }
  m.addObj({ type: 'bench', x: (c.x - 9) * TS, y: (c.y + 1) * TS + 28 });
  m.addObj({ type: 'flowers', x: (c.x - 3) * TS, y: (c.y + 2) * TS + 20 });
  m.addObj({ type: 'flowers', x: (c.x + 9) * TS, y: (c.y - 2) * TS + 20 });
  m.addObj({ type: 'sign', x: (c.x - 2) * TS + 16, y: (c.y + 2) * TS + 30, text: [c.name.toUpperCase(), cityMotto(c.id)] });
  const tree = treeFor(c.biome);
  const x0 = c.x - (c.w >> 1), y0 = c.y - (c.h >> 1);
  for (let x = x0 + 1; x < x0 + c.w - 1; x += 3) {
    [y0 - 1, y0 + c.h + 1].forEach(y => { if (canPlace(m, x, y, 0)) m.addObj({ type: tree, x: x * TS + 16, y: y * TS + 28, v: (x * 7 + y) % 4 }); });
  }
  for (let y = y0 + 2; y < y0 + c.h - 1; y += 3) {
    [x0 - 1, x0 + c.w + 1].forEach(x => { if (canPlace(m, x, y, 0)) m.addObj({ type: tree, x: x * TS + 16, y: y * TS + 28, v: (x + y * 3) % 4 }); });
  }
}
function placeBuilding(m, c, L, r) {
  m.buildings = m.buildings || [];
  const bx = c.x + L.dx, by = c.y + L.dy;
  const roof = L.roof || (L.kind === 'gym' ? shade(TYPE_COLOR[c.gym] || '#ffd54f', -10) : ROOF_COLORS[Math.floor(r() * ROOF_COLORS.length)]);
  const b = { kind: L.kind, w: L.w, h: L.h, roof, wall: L.kind === 'corp' ? '#5a5560' : L.kind === 'liga' ? '#f5eccb' : L.kind === 'school' ? '#b85c42' : '#f2e6cf', label: L.label, accent: c.gym ? TYPE_COLOR[c.gym] : '#ffd54f', city: c.id };
  b.tx = bx; b.ty = by;
  b.id = c.id + ':' + L.kind + (L.kind === 'house' ? ':' + L.dx + ',' + L.dy : '');
  // suelo bajo el edificio y su entrada
  for (let y = by; y < by + L.h; y++) for (let x = bx; x < bx + L.w; x++) m.set(x, y, T.PLAZA);
  const doorX = bx + Math.floor(L.w / 2);
  m.set(doorX, by + L.h, T.ROAD);
  m.addObj({ type: 'building', b, x: bx * TS + (L.w * TS) / 2, y: (by + L.h) * TS, col: [-(L.w * TS) / 2 + 2, -(L.h * TS) + 18, L.w * TS - 4, L.h * TS - 18] });
  m.warps.push({ x: doorX * TS, y: (by + L.h) * TS - 6, w: TS, h: 16, to: 'int:' + b.id, b });
  m.buildings.push(b);
  return b;
}
// tablón de misiones junto al centro Coremon
function addBoard(m, c) {
  const ctr = m.buildings.find(b => b.city === c.id && b.kind === 'center');
  if (!ctr) return;
  const x = ctr.tx + ctr.w + 1, y = ctr.ty + ctr.h - 1;
  m.addObj({ type: 'board', x: x * TS + 16, y: y * TS + 28, action: 'board', place: c.id, text: null });
}
// pueblo: plaza, centro, tienda, casas, farolas y tablón
const VILLAGE_NAMES = ['Arrieta', 'Zubieta', 'Larrea', 'Mendibe', 'Ibarra', 'Olabe', 'Urbina', 'Elorrio', 'Zuaza', 'Gorbeia', 'Lezama', 'Amurrio', 'Okondo', 'Barrika', 'Artzentales', 'Lekeitio'];
const VILLAGES = [], VILLAGE = {};
function placeById(id) { return CITY[id] || VILLAGE[id] || null; }
function buildVillage(m, v) {
  const r = mulberry32(strSeed('village:' + v.id));
  const x0 = v.x - (v.w >> 1), y0 = v.y - (v.h >> 1);
  const ground = v.biome === 'desert' ? T.SAND : v.biome === 'snow' ? T.SNOW : v.biome === 'volcano' ? T.ASH : T.GRASS;
  for (let y = y0 - 2; y < y0 + v.h + 2; y++) for (let x = x0 - 2; x < x0 + v.w + 2; x++) {
    const t = m.tileAt(x, y);
    if (t === undefined) continue;
    const inside = x >= x0 && y >= y0 && x < x0 + v.w && y < y0 + v.h;
    if (t === T.PATH || t === T.BRIDGE) { if (inside) m.set(x, y, T.ROAD); continue; }
    if (inside) m.set(x, y, T.PLAZA);
    else if (t === T.WATER || t === T.LAVA || TALL_T.has(t)) m.set(x, y, ground);
  }
  const free = L => { for (let y = v.y + L.dy; y <= v.y + L.dy + L.h + 1; y++) for (let x = v.x + L.dx - 1; x < v.x + L.dx + L.w + 1; x++) if (m.tileAt(x, y) === T.ROAD) return false; return true; };
  const opts = [
    { kind: 'center', dx: -10, dy: -7, w: 6, h: 4, roof: '#d84a4a', label: 'CENTRO' }, { kind: 'center', dx: 4, dy: 2, w: 6, h: 4, roof: '#d84a4a', label: 'CENTRO' },
    { kind: 'shop', dx: 4, dy: -7, w: 6, h: 4, roof: '#3f7fd0', label: 'TIENDA' }, { kind: 'shop', dx: -10, dy: 2, w: 6, h: 4, roof: '#3f7fd0', label: 'TIENDA' },
    { kind: 'house', dx: -10, dy: 2, w: 5, h: 4 }, { kind: 'house', dx: 5, dy: 2, w: 5, h: 4 }
  ];
  const used = [];
  for (const L of opts) {
    if (used.some(u => u.kind === L.kind && L.kind !== 'house')) continue;
    if (used.some(u => Math.abs(u.dx - L.dx) < 6 && Math.abs(u.dy - L.dy) < 5)) continue;
    if (!free(L)) continue;
    placeBuilding(m, v, L, r); used.push(L);
  }
  if (!used.some(u => u.kind === 'center')) { const L = { kind: 'center', dx: -3, dy: -7, w: 6, h: 4, roof: '#d84a4a', label: 'CENTRO' }; placeBuilding(m, v, L, r); }
  addBoard(m, v);
  [[-12, -1], [11, -1], [-12, 6], [11, 6]].forEach(([dx, dy]) => { if (m.tileAt(v.x + dx, v.y + dy) === T.PLAZA) m.addObj({ type: 'lamp', x: (v.x + dx) * TS + 16, y: (v.y + dy) * TS + 2 }); });
  m.addObj({ type: 'sign', x: (x0 + 1) * TS + 16, y: (y0 + v.h - 1) * TS + 30, text: [`PUEBLO DE ${v.name.toUpperCase()}`, 'Mira el tablón de misiones junto al centro.'] });
  m.addObj({ type: 'flowers', x: (v.x - 2) * TS, y: (v.y + 5) * TS + 20 });
}
function cityMotto(id) {
  return { gasteiz: 'Ciudad verde. Aquí empieza todo.', ria: 'Barcos, gaviotas y olor a mar.', umbria: 'Cuidado con la niebla.', almar: 'Bajo la arena hay historia.', ignea: 'La ciudad que vive junto al volcán.', voltia: 'Capital de la tecnología. Sede de CoraCorp.', bosque: 'El bosque recuerda lo que olvidas.', nevera: 'Abrígate bien.', liga: 'Solo los mejores llegan hasta aquí.' }[id] || '';
}
function treeFor(b) { return { forest: 'pine', snow: 'snowpine', coast: 'palm', desert: 'cactus', swamp: 'dead', volcano: 'dead', peak: 'pine', plains: 'oak2' }[b] || 'oak'; }

function canPlace(m, x, y, margin) {
  const t = m.tileAt(x, y);
  if (t === undefined || SOLID_T.has(t) || [T.PATH, T.ROAD, T.PLAZA, T.BRIDGE].includes(t) || TALL_T.has(t)) return false;
  for (let dy = -margin; dy <= margin; dy++) for (let dx = -margin; dx <= margin; dx++) {
    const n = m.tileAt(x + dx, y + dy);
    if ([T.PATH, T.ROAD, T.PLAZA, T.BRIDGE].includes(n)) return false;
  }
  return true;
}

function scatterNature(m, land, cityDist) {
  const W = m.w, H = m.h;
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    const i = y * W + x;
    if (!land[i] || cityDist[i] < 17) continue;
    const t = m.tiles[i];
    if (!canPlace(m, x, y, 1)) continue;
    const c = CITIES[m.reg[i]], h = hash2(x, y, 4242), clump = fbm(x * 0.09, y * 0.09, SEED + 11, 2);
    let type = null, v = Math.floor(hash2(x, y, 7) * 4);
    switch (c.biome) {
      case 'forest': if (h < 0.18 + clump * 0.25) type = h < 0.02 ? 'giant' : h < 0.1 ? 'pine' : 'oak2'; else if (h < 0.47) type = h < 0.45 ? null : 'mush'; break;
      case 'meadow': if (clump > 0.55 && h < 0.2) type = h < 0.1 ? 'oak' : 'oak2'; else if (h < 0.015) type = 'bush'; else if (h > 0.985) type = 'flowers'; else if (h > 0.975) type = 'rock'; break;
      case 'plains': if (clump > 0.6 && h < 0.12) type = 'oak2'; else if (h < 0.012) type = 'bush'; else if (h > 0.98) type = 'flowers'; else if (h > 0.972) type = 'rock'; break;
      case 'coast': if (t === T.SAND && h < 0.035) type = 'palm'; else if (clump > 0.58 && h < 0.14) type = 'oak'; else if (h > 0.985) type = 'rock'; break;
      case 'desert': if (h < 0.018) type = 'cactus'; else if (h > 0.985) type = 'rock'; else if (h > 0.978) type = 'bigrock'; break;
      case 'swamp': if (h < 0.05 + clump * 0.06) type = 'dead'; else if (h < 0.09) type = 'reed'; else if (h > 0.985) type = 'mush'; break;
      case 'volcano': if (h < 0.025) type = 'lavarock'; else if (h < 0.035) type = 'dead'; break;
      case 'snow': if (clump > 0.5 && h < 0.16) type = 'snowpine'; else if (h > 0.985) type = 'crystal'; else if (h > 0.978) type = 'rock'; break;
      case 'peak': if (h < 0.03) type = 'rock'; else if (h < 0.045) type = 'pine'; else if (h > 0.99) type = 'bigrock'; break;
    }
    if (type) m.addObj({ type, x: x * TS + 16, y: y * TS + 28, v });
  }
}

// ---------------- REGIONES: NOMBRES, CLIMA, MÚSICA, SALVAJES ----------------
function placeName(map, x, y) {
  if (!map.outdoor) return map.name;
  const tx = x / TS, ty = y / TS;
  for (const v of VILLAGES) if (Math.abs(tx - v.x) < v.w / 2 + 1 && Math.abs(ty - v.y) < v.h / 2 + 1) return v.name;
  const c = CITIES[map.regionIdx(Math.floor(x / TS), Math.floor(y / TS))];
  return (Math.abs(x / TS - c.x) < c.w / 2 && Math.abs(y / TS - c.y) < c.h / 2) ? c.name : c.area;
}
function inCity(map, x, y) {
  if (!map.outdoor) return null;
  const c = CITIES[map.regionIdx(Math.floor(x / TS), Math.floor(y / TS))];
  return (Math.abs(x / TS - c.x) < c.w / 2 + 2 && Math.abs(y / TS - c.y) < c.h / 2 + 2) ? c : null;
}
const REGION_WEATHER = { coast: 'rain', swamp: 'fog', desert: 'sand', volcano: 'ash', snow: 'snow', forest: 'leaves', peak: 'snow' };

// ---------------- COLISIONES ----------------
const FOOT = { w: 14, h: 8 };   // caja de los pies del jugador
function gateOpen(o) { return o.gate && G && G.badges.length >= o.req; }
function blockedAt(map, x, y, ignoreActor) {
  const x0 = x - FOOT.w / 2, y0 = y - FOOT.h, x1 = x + FOOT.w / 2, y1 = y;
  // casillas
  for (let ty = Math.floor(y0 / TS); ty <= Math.floor((y1 - 0.01) / TS); ty++)
    for (let tx = Math.floor(x0 / TS); tx <= Math.floor((x1 - 0.01) / TS); tx++) {
      const t = map.tileAt(tx, ty);
      if (t === undefined || SOLID_T.has(t)) return true;
    }
  // objetos
  for (const o of map.objsIn(x0, y0, x1, y1)) {
    if (!o.col || o.solid === false || o.hidden) continue;
    if (o.gate && gateOpen(o)) continue;
    const ox0 = o.x + o.col[0], oy0 = o.y + o.col[1];
    if (x1 > ox0 && x0 < ox0 + o.col[2] && y1 > oy0 && y0 < oy0 + o.col[3]) return o;
  }
  // personajes
  for (const a of map.npcs) {
    if (a === ignoreActor || a.hidden || a.ko) continue;
    if (Math.abs(a.x - x) < 14 && Math.abs(a.y - y) < 10) return a;
  }
  return false;
}

// ---------------- DIBUJADO ----------------
const chunkCache = new Map();
function chunkCanvas(map, cx, cy) {
  const key = map.id + ':' + cx + ',' + cy;
  let c = chunkCache.get(key);
  if (c) { chunkCache.delete(key); chunkCache.set(key, c); return c; }
  c = document.createElement('canvas');
  c.width = c.height = CHUNK * TS;
  const g = c.getContext('2d');
  for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
    const tx = cx * CHUNK + x, ty = cy * CHUNK + y;
    if (map.tileAt(tx, ty) === undefined) { g.fillStyle = map.outdoor ? TILE_COLOR[T.DEEP] : '#0b0a12'; g.fillRect(x * TS, y * TS, TS, TS); continue; }
    drawTile(g, map, tx, ty, x * TS, y * TS);
  }
  chunkCache.set(key, c);
  if (chunkCache.size > 90) chunkCache.delete(chunkCache.keys().next().value);
  return c;
}
function clearChunks(mapId) { for (const k of [...chunkCache.keys()]) if (!mapId || k.startsWith(mapId + ':')) chunkCache.delete(k); }

// cámara: centrada en el objetivo y limitada a los bordes del mapa
function cameraFor(map, fx, fy) {
  const vw = VW / ZOOM, vh = VH / ZOOM, mw = map.w * TS, mh = map.h * TS;
  return {
    x: mw <= vw ? -(vw - mw) / 2 : clamp(fx - vw / 2, 0, mw - vw),
    y: mh <= vh ? -(vh - mh) / 2 : clamp(fy - vh / 2, 0, mh - vh),
    w: vw, h: vh
  };
}

// dibuja el mapa, los objetos y los personajes (ordenados por profundidad)
function renderMap(map, cam, actors) {
  ctx.setTransform(ZOOM, 0, 0, ZOOM, -Math.round(cam.x * ZOOM), -Math.round(cam.y * ZOOM));
  ctx.imageSmoothingEnabled = false;
  const cx0 = Math.floor(cam.x / (CHUNK * TS)), cy0 = Math.floor(cam.y / (CHUNK * TS));
  const cx1 = Math.floor((cam.x + cam.w) / (CHUNK * TS)), cy1 = Math.floor((cam.y + cam.h) / (CHUNK * TS));
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) ctx.drawImage(chunkCanvas(map, cx, cy), cx * CHUNK * TS, cy * CHUNK * TS);
  // destellos del agua y lava viva
  const tx0 = Math.max(0, Math.floor(cam.x / TS)), ty0 = Math.max(0, Math.floor(cam.y / TS));
  const tx1 = Math.min(map.w - 1, Math.ceil((cam.x + cam.w) / TS)), ty1 = Math.min(map.h - 1, Math.ceil((cam.y + cam.h) / TS));
  const tt = now / 1000;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = map.tiles[ty * map.w + tx];
    if (t === T.WATER || t === T.DEEP) {
      const k = hash2(tx, ty, 3);
      const ph = (tt * 0.6 + k * 6) % 3;
      if (ph < 0.5) { ctx.fillStyle = `rgba(255,255,255,${0.5 - ph})`; ctx.fillRect(tx * TS + 6 + k * 18, ty * TS + 8 + hash2(tx, ty, 4) * 14, 6, 2); }
    } else if (t === T.LAVA) {
      ctx.fillStyle = `rgba(255,220,80,${0.25 + 0.2 * Math.sin(tt * 3 + tx + ty)})`; ctx.fillRect(tx * TS, ty * TS, TS, TS);
    }
  }
  // objetos + personajes por profundidad
  const list = [];
  for (const o of map.objsIn(cam.x - 96, cam.y - 32, cam.x + cam.w + 96, cam.y + cam.h + 140)) {
    if (o.hidden) continue;
    if (o.gate && gateOpen(o)) continue;
    list.push({ y: o.y, o });
  }
  for (const a of actors) if (!a.hidden) list.push({ y: a.y + 0.5, a });
  list.sort((p, q) => p.y - q.y);
  for (const it of list) {
    if (it.o) drawObject(it.o);
    else drawActor(it.a);
  }
  // la hierba alta tapa los pies
  for (const a of actors) {
    if (a.hidden) continue;
    const t = map.tileAt(Math.floor(a.x / TS), Math.floor((a.y - 2) / TS));
    if (TALL_T.has(t)) {
      const blade = t === T.SNOWTALL ? '#9fc4a8' : t === T.DRYTALL ? '#b08a3a' : t === T.DARK ? '#3d6b4a' : shade(grassColor(map.regionAt(Math.floor(a.x / TS), Math.floor(a.y / TS))), -20);
      ctx.fillStyle = blade;
      for (let i = -3; i <= 3; i++) { const s = Math.sin(now / 300 + i) * 1.2; ctx.fillRect(a.x + i * 3 + s, a.y - 9 + Math.abs(i) % 2 * 2, 2, 9); }
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawObject(o) {
  if (o.type === 'building') {
    const img = o.b.kind === 'school' ? schoolCanvas() : buildingCanvas(o.b);
    ctx.drawImage(img, Math.round(o.x - img.width / 2), Math.round(o.y - img.height));
    return;
  }
  if (o.type === 'barrier') { drawBarrier(o); return; }
  if (o.type === 'gymblock') { ctx.drawImage(gymBlockImage(o.color), Math.round(o.x - 16), Math.round(o.y - 36)); return; }
  const d = OBJ_DEF[o.type];
  if (!d) return;
  const img = objImage(o.type, o.v || 0);
  ctx.drawImage(img, Math.round(o.x - d.ax), Math.round(o.y - d.ay));
  if (o.item && !G.picked[o.item.id]) { /* objeto de suelo: se dibuja como bola en drawActor */ }
}
// bloque de los laberintos de gimnasio (color del tipo)
function gymBlockImage(c) {
  return objCanvas('gb:' + c, 32, 40, g => {
    px(g, 1, 34, 30, 5, 'rgba(0,0,0,0.25)');
    px(g, 0, 14, 32, 22, shade(c, -30)); px(g, 0, 14, 32, 2, shade(c, -45));
    px(g, 0, 4, 32, 12, c); px(g, 0, 4, 32, 3, shade(c, 25));
    px(g, 4, 20, 24, 2, shade(c, -15)); px(g, 4, 27, 24, 2, shade(c, -15));
  });
}
function drawBarrier(o) {
  const x = Math.round(o.x - 16), y = Math.round(o.y - 30);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 2, y + 26, 28, 4);
  ctx.fillStyle = '#1d1a26'; ctx.fillRect(x + 2, y + 6, 4, 22); ctx.fillRect(x + 26, y + 6, 4, 22);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fafafa' : '#e53935'; ctx.fillRect(x + i * 8, y + 8, 8, 7); }
  ctx.fillStyle = '#1d1a26'; ctx.fillRect(x, y + 8, 32, 1); ctx.fillRect(x, y + 15, 32, 1);
  const blink = Math.floor(now / 500) % 2;
  ctx.fillStyle = blink ? '#ff5252' : '#7a1f1f'; ctx.fillRect(x + 3, y + 2, 3, 3); ctx.fillRect(x + 26, y + 2, 3, 3);
}

// ---------------- MINIMAPA ----------------
let worldOverview = null;
function buildOverview(map) {
  const c = document.createElement('canvas'); c.width = map.w; c.height = map.h;
  const g = c.getContext('2d'), img = g.createImageData(map.w, map.h), d = img.data;
  for (let i = 0; i < map.w * map.h; i++) {
    let col = TILE_COLOR[map.tiles[i]] || '#000';
    if (map.tiles[i] === T.GRASS || map.tiles[i] === T.TALL) col = grassColor(CITIES[map.reg[i]].biome);
    const [r, gg, b] = hexToRgb(col);
    d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (const o of map.objs) if (o.type === 'building') { g.fillStyle = '#f5f5f5'; g.fillRect(o.b.tx, o.b.ty, o.b.w, o.b.h); }
  return c;
}
function drawMinimap(canvas, map, px, py) {
  const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#0e2a44'; g.fillRect(0, 0, W, H);
  if (!map.outdoor) { g.fillStyle = '#ffd54f'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillText(map.name, W / 2, H / 2 + 5); return; }
  if (!worldOverview) worldOverview = buildOverview(map);
  const span = 72, sx = clamp(px / TS - span / 2, 0, map.w - span), sy = clamp(py / TS - span * 0.375, 0, map.h - span * 0.75);
  g.drawImage(worldOverview, sx, sy, span, span * 0.75, 0, 0, W, H);
  const k = W / span;
  CITIES.forEach(c => { const x = (c.x - sx) * k, y = (c.y - sy) * k; if (x > -10 && y > -10 && x < W + 10 && y < H + 10) { g.fillStyle = '#ffd54f'; g.fillRect(x - 3, y - 3, 6, 6); } });
  if (typeof drawMissionMarks === 'function' && G) drawMissionMarks(g, X => (X - sx) * k, Y => (Y - sy) * k);
  VILLAGES.forEach(v => { const x = (v.x - sx) * k, y = (v.y - sy) * k; g.fillStyle = '#ffe9a8'; g.fillRect(x - 2, y - 2, 4, 4); });
  const ppx = (px / TS - sx) * k, ppy = (py / TS - sy) * k;
  g.fillStyle = '#ff1744'; g.beginPath(); g.arc(ppx, ppy, 4, 0, 7); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
}
