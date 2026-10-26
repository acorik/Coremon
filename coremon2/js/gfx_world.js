// ============================================================
// COREMON 2 — Arte del mundo: casillas de terreno (con bordes fundidos),
// objetos (árboles, rocas, farolas...) y edificios. Todo se dibuja por
// código y se guarda en caché.
// ============================================================

// ---------------- CASILLAS ----------------
const T = {
  DEEP: 0, WATER: 1, SAND: 2, GRASS: 3, TALL: 4, FOREST: 5, SNOW: 6, SNOWTALL: 7, ROCK: 8, PATH: 9,
  ROAD: 10, PLAZA: 11, SWAMP: 12, LAVA: 13, ASH: 14, BRIDGE: 15, DRY: 16, DRYTALL: 17, ICE: 18, DARK: 19,
  FLOOR: 20, WALL: 21, CARPET: 22, MAT: 23
};
const SOLID_T = new Set([T.DEEP, T.WATER, T.ROCK, T.LAVA, T.WALL]);
const ENCOUNTER_T = new Set([T.TALL, T.SNOWTALL, T.DRYTALL, T.DARK, T.SWAMP]);
const TALL_T = new Set([T.TALL, T.SNOWTALL, T.DRYTALL, T.DARK]);

// color base de cada terreno (también para el minimapa)
const TILE_COLOR = {
  [T.DEEP]: '#2a64b0', [T.WATER]: '#3b8fd8', [T.SAND]: '#e6d29a', [T.GRASS]: '#6cbf4a', [T.TALL]: '#4f9e3c',
  [T.FOREST]: '#3f7d3a', [T.SNOW]: '#eef4fb', [T.SNOWTALL]: '#cfe0ea', [T.ROCK]: '#8a7d6e', [T.PATH]: '#c9a46a',
  [T.ROAD]: '#9a9a9a', [T.PLAZA]: '#d9cfc4', [T.SWAMP]: '#5d6b3a', [T.LAVA]: '#ff6a00', [T.ASH]: '#5a5052',
  [T.BRIDGE]: '#a0703c', [T.DRY]: '#d8c07a', [T.DRYTALL]: '#c1a050', [T.ICE]: '#bfe6f5', [T.DARK]: '#2e5a3a',
  [T.FLOOR]: '#c8a165', [T.WALL]: '#6d5a4a', [T.CARPET]: '#a33b3b', [T.MAT]: '#2f6fb3'
};
// orden de superposición para fundir bordes (el de mayor valor "invade" al menor)
const TILE_Z = {
  [T.DEEP]: 0, [T.WATER]: 0.5, [T.SAND]: 1, [T.ICE]: 1.2, [T.ASH]: 1.4, [T.SWAMP]: 1.6, [T.PATH]: 2, [T.DRY]: 2.6,
  [T.GRASS]: 3, [T.FOREST]: 3, [T.SNOW]: 3.2, [T.TALL]: 3.4, [T.DRYTALL]: 3.4, [T.SNOWTALL]: 3.4, [T.DARK]: 3.5
};

function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

// variación de color del césped según la región
function grassColor(region) {
  return { forest: '#4f8f3e', plains: '#86c25a', coast: '#78c454', swamp: '#5f8a46', peak: '#7aa860', snow: '#9fbf8a', desert: '#b5b860', volcano: '#6e7a4a' }[region] || '#6cbf4a';
}

// dibuja la casilla (x, y) del mapa en el contexto g, en (ox, oy)
function drawTile(g, map, x, y, ox, oy) {
  const t = map.tileAt(x, y);
  const h = (k) => hash2(x, y, k);
  const reg = map.regionAt ? map.regionAt(x, y) : 'meadow';
  const base = (t === T.GRASS || t === T.TALL || t === T.FOREST) ? grassColor(reg) : TILE_COLOR[t];
  switch (t) {
    case T.GRASS: case T.FOREST: {
      const c = t === T.FOREST ? shade(base, -18) : base;
      px(g, ox, oy, TS, TS, c);
      for (let i = 0; i < 10; i++) { const a = h(i), b = h(i + 20); px(g, ox + Math.floor(a * 30), oy + Math.floor(b * 30), 2, 2, i % 2 ? shade(c, -14) : shade(c, 12)); }
      if (h(99) > 0.9 && t === T.GRASS) { const fx = ox + 6 + Math.floor(h(98) * 18), fy = oy + 6 + Math.floor(h(97) * 18); const fc = ['#fff', '#ffd54f', '#f48fb1', '#ce93d8'][Math.floor(h(96) * 4)]; px(g, fx, fy, 2, 2, fc); px(g, fx + 3, fy + 2, 2, 2, fc); px(g, fx + 1, fy + 4, 2, 2, fc); }
      break;
    }
    case T.TALL: case T.DARK: case T.SNOWTALL: case T.DRYTALL: {
      const groundC = t === T.SNOWTALL ? TILE_COLOR[T.SNOW] : t === T.DRYTALL ? TILE_COLOR[T.DRY] : t === T.DARK ? '#2a4a33' : shade(base, -6);
      const blade = t === T.SNOWTALL ? '#9fc4a8' : t === T.DRYTALL ? '#b08a3a' : t === T.DARK ? '#3d6b4a' : shade(base, -20);
      const bladeL = t === T.SNOWTALL ? '#d8efe0' : t === T.DRYTALL ? '#e0c070' : t === T.DARK ? '#6a4f8a' : shade(base, 15);
      px(g, ox, oy, TS, TS, groundC);
      drawTallBlades(g, ox, oy, blade, bladeL, x, y, 0);
      break;
    }
    case T.SAND: case T.DRY: case T.ASH: case T.SWAMP: case T.ICE: case T.SNOW: {
      px(g, ox, oy, TS, TS, base);
      const dk = shade(base, t === T.SNOW ? -8 : -12), lt = shade(base, 14);
      for (let i = 0; i < 8; i++) px(g, ox + Math.floor(h(i) * 30), oy + Math.floor(h(i + 9) * 30), i % 3 ? 1 : 2, 1, i % 2 ? dk : lt);
      if (t === T.SWAMP && h(55) > 0.55) { g.fillStyle = '#3f5a3a'; g.beginPath(); g.ellipse(ox + 8 + h(56) * 16, oy + 10 + h(57) * 12, 7, 4, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(ox + 10 + h(56) * 16, oy + 9 + h(57) * 12, 3, 1); }
      if (t === T.ICE) { g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(ox + h(60) * 32, oy); g.lineTo(ox + h(61) * 32, oy + 32); g.stroke(); }
      if (t === T.SAND && reg === 'desert' && h(70) > 0.5) { g.strokeStyle = shade(base, -10); g.beginPath(); g.moveTo(ox, oy + 10 + h(71) * 12); g.quadraticCurveTo(ox + 16, oy + 4 + h(72) * 12, ox + 32, oy + 10 + h(73) * 12); g.stroke(); }
      if (t === T.ASH && h(80) > 0.85) { px(g, ox + 10, oy + 12, 3, 3, '#ff7b29'); }
      break;
    }
    case T.WATER: case T.DEEP: {
      px(g, ox, oy, TS, TS, base);
      const lt = shade(base, 14);
      for (let i = 0; i < 3; i++) { const wy = oy + 5 + i * 10 + Math.floor(h(i) * 4), wx = ox + Math.floor(h(i + 5) * 16); px(g, wx, wy, 8 + Math.floor(h(i + 7) * 8), 1, lt); }
      // espuma de orilla
      const land = (dx, dy) => { const n = map.tileAt(x + dx, y + dy); return n !== T.WATER && n !== T.DEEP && n !== T.BRIDGE && n != null; };
      g.fillStyle = 'rgba(255,255,255,0.7)';
      if (land(0, -1)) for (let i = 0; i < 32; i += 2) g.fillRect(ox + i, oy + (h(i) > 0.5 ? 1 : 0), 2, 2);
      if (land(0, 1)) for (let i = 0; i < 32; i += 2) g.fillRect(ox + i, oy + 29 + (h(i + 1) > 0.5 ? 1 : 0), 2, 2);
      if (land(-1, 0)) for (let i = 0; i < 32; i += 2) g.fillRect(ox + (h(i + 2) > 0.5 ? 1 : 0), oy + i, 2, 2);
      if (land(1, 0)) for (let i = 0; i < 32; i += 2) g.fillRect(ox + 29 + (h(i + 3) > 0.5 ? 1 : 0), oy + i, 2, 2);
      break;
    }
    case T.ROCK: drawRockTile(g, map, x, y, ox, oy, reg); break;
    case T.PATH: {
      px(g, ox, oy, TS, TS, base);
      for (let i = 0; i < 7; i++) px(g, ox + Math.floor(h(i) * 29), oy + Math.floor(h(i + 7) * 29), 3, 2, i % 2 ? '#b08a52' : '#dcbb84');
      break;
    }
    case T.ROAD: {
      px(g, ox, oy, TS, TS, '#8e8e8e');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
        const sx = ox + c * 16 + (r % 2) * 8 - 4, sy = oy + r * 8;
        px(g, sx + 1, sy + 1, 14, 6, h(r * 3 + c) > 0.5 ? '#a8a8a8' : '#9c9c9c');
        px(g, sx + 1, sy + 1, 14, 1, '#b8b8b8');
      }
      break;
    }
    case T.PLAZA: {
      px(g, ox, oy, TS, TS, '#cfc3b5');
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { px(g, ox + c * 16 + 1, oy + r * 16 + 1, 14, 14, (r + c + x + y) % 2 ? '#ddd2c6' : '#d4c8bb'); px(g, ox + c * 16 + 1, oy + r * 16 + 1, 14, 1, '#e8dfd5'); }
      break;
    }
    case T.LAVA: {
      px(g, ox, oy, TS, TS, '#e65100');
      for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#ffb300' : '#ff7b29'; g.beginPath(); g.ellipse(ox + h(i) * 32, oy + h(i + 5) * 32, 6, 3, h(i + 9) * 3, 0, 7); g.fill(); }
      break;
    }
    case T.BRIDGE: {
      px(g, ox, oy, TS, TS, TILE_COLOR[T.WATER]);
      const vert = map.tileAt(x, y - 1) === T.BRIDGE || map.tileAt(x, y + 1) === T.BRIDGE || [T.PATH, T.ROAD].includes(map.tileAt(x, y - 1));
      for (let i = 0; i < 4; i++) {
        if (vert) { px(g, ox + 2, oy + i * 8, 28, 7, i % 2 ? '#a0703c' : '#b07c44'); px(g, ox + 2, oy + i * 8, 28, 1, '#c99a5c'); }
        else { px(g, ox + i * 8, oy + 2, 7, 28, i % 2 ? '#a0703c' : '#b07c44'); px(g, ox + i * 8, oy + 2, 1, 28, '#c99a5c'); }
      }
      if (vert) { px(g, ox, oy, 2, 32, '#6d4c2a'); px(g, ox + 30, oy, 2, 32, '#6d4c2a'); } else { px(g, ox, oy, 32, 2, '#6d4c2a'); px(g, ox, oy + 30, 32, 2, '#6d4c2a'); }
      break;
    }
    case T.FLOOR: case T.CARPET: case T.MAT: {
      const f = map.floor || '#c8a165';
      if (t === T.FLOOR) {
        if (map.floorStyle === 'tiles') { px(g, ox, oy, TS, TS, f); px(g, ox + 1, oy + 1, 15, 15, shade(f, 8)); px(g, ox + 17, oy + 17, 14, 14, shade(f, 8)); }
        else { px(g, ox, oy, TS, TS, f); for (let i = 0; i < 4; i++) { px(g, ox, oy + i * 8, TS, 1, shade(f, -16)); px(g, ox + ((i * 13 + x * 7) % 32), oy + i * 8, 1, 8, shade(f, -16)); } }
      } else {
        const c = t === T.CARPET ? (map.carpet || TILE_COLOR[T.CARPET]) : (map.mat || TILE_COLOR[T.MAT]);
        px(g, ox, oy, TS, TS, c); px(g, ox + 3, oy + 3, TS - 6, TS - 6, shade(c, 10));
      }
      break;
    }
    case T.WALL: {
      const wc = map.wall || '#e8dcc8';
      const below = map.tileAt(x, y + 1);
      px(g, ox, oy, TS, TS, shade(wc, -35));
      if (below !== T.WALL && below != null) { px(g, ox, oy, TS, TS, wc); px(g, ox, oy + 24, TS, 8, shade(wc, -22)); px(g, ox, oy + 24, TS, 1, shade(wc, -40)); if (x % 3 === 1 && map.windows !== false) { px(g, ox + 8, oy + 5, 16, 13, '#8ecae6'); px(g, ox + 8, oy + 5, 16, 2, '#cfeaf5'); px(g, ox + 15, oy + 5, 2, 13, shade(wc, -20)); } }
      break;
    }
    default: px(g, ox, oy, TS, TS, base || '#000');
  }
  // bordes fundidos con el terreno vecino
  const zt = TILE_Z[t];
  if (zt != null) {
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], side) => {
      const n = map.tileAt(x + dx, y + dy);
      const zn = TILE_Z[n];
      if (zn == null || zn <= zt || n === t) return;
      const nc = (n === T.GRASS || n === T.FOREST || TALL_T.has(n)) ? (n === T.FOREST ? shade(grassColor(reg), -18) : TALL_T.has(n) ? (n === T.SNOWTALL ? TILE_COLOR[T.SNOW] : n === T.DRYTALL ? TILE_COLOR[T.DRY] : n === T.DARK ? '#2a4a33' : shade(grassColor(reg), -6)) : grassColor(reg)) : TILE_COLOR[n];
      g.fillStyle = nc;
      for (let i = 0; i < 32; i += 2) {
        const d = 2 + Math.floor(hash2(x * 2 + dx + i, y * 2 + dy, 7) * 5);
        if (side === 0) g.fillRect(ox + i, oy, 2, d);
        else if (side === 2) g.fillRect(ox + i, oy + 32 - d, 2, d);
        else if (side === 3) g.fillRect(ox, oy + i, d, 2);
        else g.fillRect(ox + 32 - d, oy + i, d, 2);
      }
    });
  }
}

function drawTallBlades(g, ox, oy, blade, bladeL, x, y, sway) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const bx = ox + c * 8 + 1 + ((r % 2) * 4), by = oy + 8 + r * 10;
    const s = sway ? Math.round(Math.sin(sway + c + r) * 1.2) : 0;
    g.fillStyle = blade;
    g.fillRect(bx + s, by - 8, 2, 9); g.fillRect(bx + 3 + s, by - 6, 2, 7); g.fillRect(bx - 2 + s, by - 5, 2, 6);
    g.fillStyle = bladeL; g.fillRect(bx + s, by - 8, 2, 2);
  }
}

function drawRockTile(g, map, x, y, ox, oy, reg) {
  const snow = reg === 'snow' || reg === 'peak';
  const volc = reg === 'volcano';
  const top = volc ? '#5e5450' : snow ? '#f2f6fb' : '#9a8b78';
  const face = volc ? '#3e3634' : snow ? '#8f9eab' : '#6f6253';
  const below = map.tileAt(x, y + 1), above = map.tileAt(x, y - 1);
  const isCliff = below !== T.ROCK && below != null;
  px(g, ox, oy, TS, TS, top);
  for (let i = 0; i < 6; i++) { const a = hash2(x, y, i), b = hash2(x, y, i + 9); px(g, ox + Math.floor(a * 26), oy + Math.floor(b * 26), 5, 3, shade(top, i % 2 ? -10 : 8)); }
  if (isCliff) {
    px(g, ox, oy + 12, TS, 20, face);
    for (let i = 0; i < 5; i++) px(g, ox + 3 + i * 6 + Math.floor(hash2(x, y, i + 30) * 3), oy + 14, 2, 16, shade(face, -16));
    px(g, ox, oy + 12, TS, 2, shade(top, -18));
    px(g, ox, oy + 30, TS, 2, shade(face, -30));
  }
  if (above !== T.ROCK && above != null) px(g, ox, oy, TS, 2, shade(top, 18));
}

// ---------------- OBJETOS ----------------
const OBJ_CACHE = {};
function objCanvas(key, w, h, draw) {
  if (OBJ_CACHE[key]) return OBJ_CACHE[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  return (OBJ_CACHE[key] = c);
}
function blob(g, x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }

// Definiciones de objetos: tamaño del dibujo, ancla (pies) y caja de choque (relativa a los pies)
const OBJ_DEF = {
  oak:   { w: 56, h: 72, ax: 28, ay: 68, col: [-7, -6, 14, 8], draw: (g, v) => drawOak(g, v, '#3f8f3a') },
  oak2:  { w: 56, h: 72, ax: 28, ay: 68, col: [-7, -6, 14, 8], draw: (g, v) => drawOak(g, v, '#2f7a3a') },
  autumn:{ w: 56, h: 72, ax: 28, ay: 68, col: [-7, -6, 14, 8], draw: (g, v) => drawOak(g, v, '#d9862a') },
  pine:  { w: 44, h: 76, ax: 22, ay: 72, col: [-6, -6, 12, 8], draw: (g, v) => drawPine(g, v, false) },
  snowpine: { w: 44, h: 76, ax: 22, ay: 72, col: [-6, -6, 12, 8], draw: (g, v) => drawPine(g, v, true) },
  palm:  { w: 56, h: 76, ax: 28, ay: 72, col: [-5, -6, 10, 8], draw: (g, v) => drawPalm(g, v) },
  dead:  { w: 44, h: 60, ax: 22, ay: 56, col: [-5, -6, 10, 8], draw: (g, v) => drawDead(g, v) },
  giant: { w: 88, h: 104, ax: 44, ay: 100, col: [-12, -10, 24, 12], draw: (g, v) => drawGiant(g, v) },
  bush:  { w: 32, h: 28, ax: 16, ay: 26, col: [-10, -8, 20, 8], draw: (g, v) => { blob(g, 16, 22, 13, 4, 'rgba(0,0,0,0.2)'); blob(g, 11, 15, 9, 8, '#3d8a3a'); blob(g, 21, 14, 9, 8, '#4c9c45'); blob(g, 16, 10, 8, 7, '#5fb253'); px(g, 12, 8, 3, 2, '#7cc96a'); if (v % 3 === 0) { px(g, 9, 13, 3, 3, '#e53935'); px(g, 20, 11, 3, 3, '#e53935'); } } },
  rock:  { w: 32, h: 26, ax: 16, ay: 23, col: [-11, -8, 22, 8], draw: (g, v) => { blob(g, 16, 21, 14, 4, 'rgba(0,0,0,0.22)'); g.fillStyle = '#8a8580'; g.beginPath(); g.moveTo(3, 21); g.lineTo(7, 9); g.lineTo(16, 4); g.lineTo(26, 8); g.lineTo(30, 21); g.closePath(); g.fill(); g.fillStyle = '#a9a39c'; g.beginPath(); g.moveTo(7, 10); g.lineTo(16, 5); g.lineTo(22, 8); g.lineTo(13, 13); g.closePath(); g.fill(); px(g, 4, 19, 26, 2, '#6b6661'); } },
  bigrock: { w: 56, h: 44, ax: 28, ay: 40, col: [-22, -12, 44, 12], draw: (g, v) => { blob(g, 28, 38, 26, 6, 'rgba(0,0,0,0.22)'); g.fillStyle = '#7d776f'; g.beginPath(); g.moveTo(3, 38); g.lineTo(8, 16); g.lineTo(24, 4); g.lineTo(44, 8); g.lineTo(53, 38); g.closePath(); g.fill(); g.fillStyle = '#9c968e'; g.beginPath(); g.moveTo(9, 17); g.lineTo(24, 5); g.lineTo(38, 9); g.lineTo(22, 20); g.closePath(); g.fill(); px(g, 4, 35, 48, 3, '#5f5a54'); } },
  cactus:{ w: 32, h: 48, ax: 16, ay: 45, col: [-5, -6, 10, 7], draw: (g, v) => { blob(g, 16, 44, 9, 3, 'rgba(0,0,0,0.2)'); px(g, 12, 8, 8, 37, '#4f8f3a'); px(g, 14, 8, 2, 37, '#6cab4f'); px(g, 4, 18, 8, 6, '#4f8f3a'); px(g, 4, 10, 5, 12, '#4f8f3a'); px(g, 20, 22, 8, 6, '#4f8f3a'); px(g, 23, 13, 5, 13, '#4f8f3a'); if (v % 2) { px(g, 14, 5, 4, 4, '#f48fb1'); } } },
  mush:  { w: 28, h: 28, ax: 14, ay: 26, col: [-4, -5, 8, 6], draw: (g, v) => { blob(g, 14, 25, 9, 3, 'rgba(0,0,0,0.2)'); px(g, 11, 13, 6, 12, '#efe6d0'); blob(g, 14, 12, 12, 8, v % 2 ? '#c62828' : '#7b4fbf'); px(g, 8, 9, 3, 3, '#fff'); px(g, 17, 7, 3, 3, '#fff'); px(g, 13, 12, 2, 2, '#fff'); } },
  crystal: { w: 32, h: 44, ax: 16, ay: 41, col: [-8, -6, 16, 7], draw: (g, v) => { blob(g, 16, 40, 11, 3, 'rgba(0,0,0,0.18)'); [[16, 4, 6], [8, 16, 4], [24, 14, 4]].forEach(([x, y, w]) => { g.fillStyle = '#9fe4ff'; g.beginPath(); g.moveTo(x - w, 40); g.lineTo(x - w, y + 6); g.lineTo(x, y); g.lineTo(x + w, y + 6); g.lineTo(x + w, 40); g.closePath(); g.fill(); px(g, x - w + 1, y + 6, 2, 30, '#e8fbff'); }); } },
  reed:  { w: 24, h: 36, ax: 12, ay: 34, col: [-3, -3, 6, 4], solid: false, draw: (g, v) => { for (let i = 0; i < 4; i++) { px(g, 4 + i * 5, 6 + (i % 2) * 5, 2, 28 - (i % 2) * 5, '#6b7a3a'); px(g, 3 + i * 5, 4 + (i % 2) * 5, 4, 6, '#6d4c2a'); } } },
  stump: { w: 28, h: 22, ax: 14, ay: 20, col: [-8, -6, 16, 6], draw: (g, v) => { blob(g, 14, 19, 11, 3, 'rgba(0,0,0,0.2)'); px(g, 5, 8, 18, 11, '#7a5230'); blob(g, 14, 8, 9, 3, '#c99a5c'); blob(g, 14, 8, 5, 2, '#a87a44'); } },
  lavarock: { w: 32, h: 28, ax: 16, ay: 25, col: [-11, -8, 22, 8], draw: (g, v) => { blob(g, 16, 23, 14, 4, 'rgba(0,0,0,0.3)'); g.fillStyle = '#3b3230'; g.beginPath(); g.moveTo(3, 23); g.lineTo(8, 9); g.lineTo(18, 4); g.lineTo(28, 11); g.lineTo(30, 23); g.closePath(); g.fill(); px(g, 10, 12, 2, 8, '#ff7b29'); px(g, 18, 9, 2, 6, '#ffb300'); } },
  flowers: { w: 32, h: 20, ax: 16, ay: 18, col: null, solid: false, draw: (g, v) => { const cs = ['#ef5350', '#ffd54f', '#ba68c8', '#ffffff', '#ff8a65']; for (let i = 0; i < 7; i++) { const x = 3 + (i * 9) % 26, y = 4 + (i * 7) % 12; px(g, x + 1, y + 2, 1, 4, '#2e7d32'); px(g, x, y, 3, 3, cs[(v + i) % cs.length]); } } },
  lamp:  { w: 16, h: 56, ax: 8, ay: 54, col: [-3, -4, 6, 5], light: { r: 90, y: -46, c: '255,214,120' }, draw: (g, v) => { blob(g, 8, 53, 6, 2, 'rgba(0,0,0,0.25)'); px(g, 7, 12, 3, 41, '#37474f'); px(g, 5, 50, 7, 3, '#263238'); px(g, 3, 6, 11, 8, '#263238'); px(g, 4, 7, 9, 5, '#ffe9a8'); px(g, 5, 3, 7, 3, '#37474f'); } },
  bench: { w: 48, h: 26, ax: 24, ay: 24, col: [-20, -8, 40, 8], draw: (g, v) => { px(g, 4, 6, 40, 5, '#8d6e63'); px(g, 4, 13, 40, 5, '#a1887f'); px(g, 6, 18, 3, 6, '#4e342e'); px(g, 39, 18, 3, 6, '#4e342e'); px(g, 4, 6, 40, 1, '#bcaaa4'); } },
  fountain: { w: 80, h: 64, ax: 40, ay: 58, col: [-34, -18, 68, 20], light: { r: 60, y: -20, c: '160,220,255' }, draw: (g, v) => { blob(g, 40, 50, 36, 12, '#90a4ae'); blob(g, 40, 48, 32, 10, '#4fa3e0'); blob(g, 40, 46, 26, 7, '#7fc4f0'); px(g, 36, 18, 8, 28, '#b0bec5'); blob(g, 40, 18, 12, 4, '#90a4ae'); blob(g, 40, 16, 9, 3, '#7fc4f0'); px(g, 39, 4, 2, 12, '#cfeaf5'); } },
  sign:  { w: 32, h: 34, ax: 16, ay: 32, col: [-6, -5, 12, 6], draw: (g, v) => { px(g, 14, 16, 4, 16, '#6d4c2a'); px(g, 3, 4, 26, 15, '#a0703c'); px(g, 3, 4, 26, 2, '#c99a5c'); px(g, 3, 17, 26, 2, '#6d4c2a'); for (let i = 0; i < 3; i++) px(g, 7, 8 + i * 3, 18 - i * 4, 1, '#4e342e'); } },
  fence: { w: 32, h: 24, ax: 16, ay: 22, col: [-16, -6, 32, 6], draw: (g, v) => { px(g, 0, 8, 32, 3, '#b0896a'); px(g, 0, 15, 32, 3, '#b0896a'); px(g, 3, 4, 4, 18, '#8d6e63'); px(g, 25, 4, 4, 18, '#8d6e63'); } },
  well:  { w: 40, h: 48, ax: 20, ay: 45, col: [-15, -10, 30, 11], draw: (g, v) => { blob(g, 20, 41, 17, 6, 'rgba(0,0,0,0.2)'); px(g, 4, 26, 32, 16, '#9e9e9e'); px(g, 4, 26, 32, 3, '#bdbdbd'); px(g, 6, 8, 3, 20, '#6d4c2a'); px(g, 31, 8, 3, 20, '#6d4c2a'); px(g, 2, 4, 36, 6, '#a33b3b'); } },
  statue: { w: 40, h: 64, ax: 20, ay: 60, col: [-14, -10, 28, 10], draw: (g, v) => { px(g, 6, 44, 28, 16, '#9e9e9e'); px(g, 6, 44, 28, 2, '#bdbdbd'); blob(g, 20, 34, 9, 10, '#b0bec5'); blob(g, 20, 20, 7, 7, '#b0bec5'); px(g, 12, 26, 16, 4, '#b0bec5'); blob(g, 20, 14, 10, 3, '#ffd54f'); } },
  gate:  { w: 96, h: 56, ax: 48, ay: 52, col: [-48, -14, 96, 14], draw: (g, v) => { px(g, 0, 22, 96, 8, '#1d1a26'); px(g, 0, 34, 96, 8, '#1d1a26'); for (let i = 0; i < 6; i++) { px(g, 4 + i * 17, 14, 6, 38, '#37323f'); px(g, 4 + i * 17, 14, 6, 3, '#e53935'); } px(g, 30, 4, 36, 14, '#e53935'); px(g, 32, 6, 32, 10, '#1d1a26'); g.fillStyle = '#fff'; g.font = 'bold 8px monospace'; g.textAlign = 'center'; g.fillText('CORACORP', 48, 14); } },
  boat:  { w: 64, h: 40, ax: 32, ay: 36, col: [-28, -12, 56, 12], draw: (g, v) => { g.fillStyle = '#8d5a2b'; g.beginPath(); g.moveTo(2, 18); g.lineTo(62, 18); g.lineTo(54, 34); g.lineTo(10, 34); g.closePath(); g.fill(); px(g, 4, 18, 56, 3, '#c99a5c'); px(g, 30, 0, 3, 18, '#5d4037'); g.fillStyle = '#fafafa'; g.beginPath(); g.moveTo(33, 2); g.lineTo(52, 14); g.lineTo(33, 15); g.closePath(); g.fill(); } },
  crate: { w: 32, h: 34, ax: 16, ay: 31, col: [-13, -10, 26, 11], draw: (g, v) => { px(g, 3, 6, 26, 25, '#a0703c'); px(g, 3, 6, 26, 3, '#c99a5c'); px(g, 3, 6, 3, 25, '#7a5230'); px(g, 26, 6, 3, 25, '#7a5230'); px(g, 6, 17, 20, 2, '#7a5230'); } },
  pc:    { w: 32, h: 44, ax: 16, ay: 40, col: [-12, -10, 24, 10], light: { r: 40, y: -26, c: '120,220,255' }, draw: (g, v) => { px(g, 4, 6, 24, 34, '#cfd8dc'); px(g, 7, 9, 18, 13, '#1b2a3a'); px(g, 8, 10, 16, 2, '#4fc3f7'); px(g, 8, 14, 10, 1, '#81d4fa'); px(g, 7, 26, 18, 3, '#90a4ae'); px(g, 20, 33, 4, 3, '#76ff03'); } },
  counter: { w: 96, h: 40, ax: 48, ay: 36, col: [-48, -14, 96, 14], draw: (g, v) => { px(g, 0, 8, 96, 28, '#c62828'); px(g, 0, 8, 96, 6, '#ef5350'); px(g, 0, 32, 96, 4, '#8e1c1c'); } },
  shelf: { w: 64, h: 56, ax: 32, ay: 52, col: [-32, -12, 64, 12], draw: (g, v) => { px(g, 2, 4, 60, 48, '#8d6e63'); for (let r = 0; r < 3; r++) { px(g, 4, 6 + r * 15, 56, 12, '#5d4037'); for (let i = 0; i < 7; i++) px(g, 6 + i * 8, 8 + r * 15, 6, 10, ['#ef5350', '#42a5f5', '#ffd54f', '#66bb6a', '#ab47bc'][(i + r + v) % 5]); } } },
  plant: { w: 28, h: 40, ax: 14, ay: 38, col: [-7, -6, 14, 7], draw: (g, v) => { px(g, 8, 26, 12, 12, '#8d5a2b'); blob(g, 14, 18, 11, 10, '#3d8a3a'); blob(g, 10, 14, 6, 6, '#5fb253'); blob(g, 18, 12, 5, 5, '#5fb253'); } },
  machine: { w: 64, h: 60, ax: 32, ay: 56, col: [-30, -14, 60, 14], light: { r: 50, y: -30, c: '120,255,200' }, draw: (g, v) => { px(g, 4, 6, 56, 50, '#90a4ae'); px(g, 8, 10, 30, 20, '#1b2a3a'); for (let i = 0; i < 5; i++) px(g, 10, 12 + i * 3, 10 + (i * 7) % 20, 1, '#69f0ae'); for (let i = 0; i < 4; i++) px(g, 44, 12 + i * 8, 10, 5, ['#ef5350', '#ffd54f', '#66bb6a', '#42a5f5'][i]); px(g, 8, 36, 48, 14, '#607d8b'); } },
  bed:   { w: 40, h: 56, ax: 20, ay: 54, col: [-18, -40, 36, 40], draw: (g, v) => { px(g, 2, 4, 36, 50, '#8d6e63'); px(g, 4, 8, 32, 42, '#fafafa'); px(g, 4, 22, 32, 28, ['#42a5f5', '#ef5350', '#66bb6a'][v % 3]); px(g, 8, 10, 24, 9, '#ffffff'); } },
  table: { w: 64, h: 40, ax: 32, ay: 36, col: [-30, -18, 60, 18], draw: (g, v) => { px(g, 2, 6, 60, 22, '#a0703c'); px(g, 2, 6, 60, 3, '#c99a5c'); px(g, 6, 28, 4, 10, '#6d4c2a'); px(g, 54, 28, 4, 10, '#6d4c2a'); } },
  tv:    { w: 40, h: 40, ax: 20, ay: 36, col: [-18, -12, 36, 12], light: { r: 40, y: -20, c: '150,200,255' }, draw: (g, v) => { px(g, 2, 22, 36, 14, '#5d4037'); px(g, 4, 2, 32, 20, '#263238'); px(g, 6, 4, 28, 16, '#4fc3f7'); } },
  torch: { w: 16, h: 40, ax: 8, ay: 38, col: [-3, -4, 6, 5], light: { r: 80, y: -30, c: '255,170,80' }, draw: (g, v) => { px(g, 6, 12, 4, 26, '#5d4037'); blob(g, 8, 9, 5, 7, '#ff8f1f'); blob(g, 8, 10, 3, 4, '#ffd54f'); } }
};

function objKey(type, v) { return type + ':' + (v % 4); }
function objImage(type, v) {
  const d = OBJ_DEF[type];
  return objCanvas(objKey(type, v), d.w, d.h, g => d.draw(g, v % 4));
}

function drawOak(g, v, leaf) {
  blob(g, 28, 66, 18, 5, 'rgba(0,0,0,0.25)');
  px(g, 24, 40, 9, 27, '#6d4c2a'); px(g, 24, 40, 3, 27, '#8d6a42');
  const L = leaf, D = shade(leaf, -22), Lt = shade(leaf, 18);
  blob(g, 28, 32, 24, 20, D); blob(g, 18, 26, 14, 13, leaf); blob(g, 38, 24, 14, 13, leaf); blob(g, 28, 16, 16, 13, leaf);
  blob(g, 22, 14, 8, 6, Lt); blob(g, 36, 18, 6, 5, Lt);
  for (let i = 0; i < 9; i++) px(g, 8 + ((v * 7 + i * 11) % 40), 10 + ((i * 13 + v * 5) % 36), 3, 3, i % 2 ? D : Lt);
}
function drawPine(g, v, snow) {
  blob(g, 22, 70, 13, 4, 'rgba(0,0,0,0.25)');
  px(g, 19, 56, 6, 15, '#5d4037');
  const C = snow ? '#2f5d4a' : '#2f6b3a', D = shade(C, -20);
  for (let i = 0; i < 4; i++) {
    const y = 8 + i * 13, w = 8 + i * 5;
    g.fillStyle = i % 2 ? C : D; g.beginPath(); g.moveTo(22, y - 6); g.lineTo(22 - w, y + 12); g.lineTo(22 + w, y + 12); g.closePath(); g.fill();
    if (snow) { g.fillStyle = '#f2f6fb'; g.beginPath(); g.moveTo(22, y - 6); g.lineTo(22 - w * 0.6, y + 5); g.lineTo(22 + w * 0.45, y + 4); g.closePath(); g.fill(); }
  }
}
function drawPalm(g, v) {
  blob(g, 28, 70, 14, 4, 'rgba(0,0,0,0.25)');
  for (let i = 0; i < 9; i++) px(g, 25 + Math.round(Math.sin(i * 0.5) * 3), 26 + i * 5, 6, 6, i % 2 ? '#8d6a42' : '#a07a4a');
  const L = '#3f9a3a';
  [[-1, 0.2], [1, 0.2], [-1, -0.5], [1, -0.5], [0, -1]].forEach(([d, up], i) => {
    g.strokeStyle = i % 2 ? L : shade(L, -15); g.lineWidth = 6; g.beginPath(); g.moveTo(28, 24); g.quadraticCurveTo(28 + d * 14, 10 + up * 10, 28 + d * 26, 22 - up * 6 + (d === 0 ? -14 : 0)); g.stroke();
  });
  blob(g, 26, 27, 3, 3, '#6d4c2a'); blob(g, 31, 28, 3, 3, '#6d4c2a');
}
function drawDead(g, v) {
  blob(g, 22, 54, 12, 3, 'rgba(0,0,0,0.25)');
  g.strokeStyle = '#4e3b2e'; g.lineCap = 'round';
  g.lineWidth = 6; g.beginPath(); g.moveTo(22, 54); g.lineTo(22, 22); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(22, 32); g.lineTo(10, 18); g.moveTo(22, 26); g.lineTo(34, 12); g.moveTo(14, 22); g.lineTo(8, 24); g.moveTo(30, 17); g.lineTo(38, 18); g.stroke();
}
function drawGiant(g, v) {
  blob(g, 44, 98, 30, 7, 'rgba(0,0,0,0.3)');
  px(g, 36, 56, 18, 44, '#5d4030'); px(g, 36, 56, 5, 44, '#7a5a3e');
  px(g, 28, 92, 10, 8, '#5d4030'); px(g, 52, 92, 10, 8, '#5d4030');
  const L = '#2f6b33', D = '#22532a', Lt = '#4b8f45';
  blob(g, 44, 46, 42, 32, D); blob(g, 26, 36, 22, 20, L); blob(g, 62, 34, 22, 20, L); blob(g, 44, 22, 26, 20, L);
  blob(g, 36, 16, 12, 8, Lt); blob(g, 60, 26, 9, 7, Lt);
}

// ---------------- EDIFICIOS ----------------
// b = { kind, w, h (en casillas), roof, wall, label }
function buildingCanvas(b) {
  const key = 'b:' + [b.kind, b.w, b.h, b.roof, b.wall, b.label].join(':');
  return objCanvas(key, b.w * TS, b.h * TS + 40, (g, W, H) => {
    const wallTop = 40 + Math.floor(b.h * TS * 0.42), base = H;
    const roof = b.roof || '#c0504d', wall = b.wall || '#f2e6cf';
    // sombra
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(6, base - 8, W - 4, 8);
    // fachada
    px(g, 4, wallTop, W - 8, base - wallTop - 4, wall);
    px(g, 4, base - 10, W - 8, 6, shade(wall, -22));
    for (let x = 8; x < W - 8; x += 8) px(g, x, wallTop + 4, 1, base - wallTop - 16, shade(wall, -6));
    // tejado
    const rh = wallTop - 34;
    g.fillStyle = shade(roof, -25); g.beginPath(); g.moveTo(0, wallTop + 4); g.lineTo(14, 34); g.lineTo(W - 14, 34); g.lineTo(W, wallTop + 4); g.closePath(); g.fill();
    g.fillStyle = roof; g.beginPath(); g.moveTo(2, wallTop); g.lineTo(16, 36); g.lineTo(W - 16, 36); g.lineTo(W - 2, wallTop); g.closePath(); g.fill();
    for (let y = 40; y < wallTop; y += 7) { g.fillStyle = shade(roof, (y / 7) % 2 ? -10 : 6); g.fillRect(8 + (wallTop - y) * 0.3, y, W - 16 - (wallTop - y) * 0.6, 2); }
    px(g, 14, 34, W - 28, 4, shade(roof, 25));
    if (b.kind === 'center') { px(g, W / 2 - 10, 14, 20, 20, '#fafafa'); px(g, W / 2 - 2, 17, 4, 14, '#e53935'); px(g, W / 2 - 7, 22, 14, 4, '#e53935'); }
    if (b.kind === 'gym') { blob(g, W / 2, 22, 14, 14, '#fafafa'); blob(g, W / 2, 22, 11, 11, b.accent || '#ffd54f'); px(g, W / 2 - 1, 12, 2, 20, '#fafafa'); }
    if (b.kind === 'corp') { px(g, W / 2 - 18, 12, 36, 20, '#1d1a26'); g.fillStyle = '#e53935'; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillText('CORA', W / 2, 21); g.fillText('CORP', W / 2, 30); }
    // ventanas
    const wy = wallTop + 12, ww = 18, wh = 16;
    const doorX = Math.floor(b.w / 2) * TS + 2;
    for (let x = 14; x < W - 30; x += 40) {
      if (Math.abs(x + ww / 2 - (doorX + 14)) < 34) continue;
      px(g, x, wy, ww, wh, '#4e6e8a'); px(g, x + 2, wy + 2, ww - 4, wh - 4, b.kind === 'corp' ? '#5a3b4a' : '#9fd3f0'); px(g, x + 2, wy + 2, ww - 4, 3, '#d4eefa'); px(g, x + ww / 2 - 1, wy, 2, wh, '#4e6e8a');
      if (b.kind === 'house') { px(g, x - 2, wy + wh, ww + 4, 3, '#8d6e63'); px(g, x, wy + wh - 3, ww, 3, '#e57373'); }
    }
    // puerta
    const dy = base - 44;
    px(g, doorX, dy, 28, 36, '#3e2f28');
    px(g, doorX + 3, dy + 3, 22, 33, b.kind === 'center' ? '#cfeaf5' : b.kind === 'shop' ? '#cfeaf5' : b.kind === 'corp' ? '#2b2b38' : '#8d5a2b');
    if (b.kind === 'center' || b.kind === 'shop' || b.kind === 'liga') px(g, doorX + 13, dy + 3, 2, 33, '#4e6e8a');
    else px(g, doorX + 19, dy + 18, 3, 3, '#ffd54f');
    // rótulo
    if (b.label) {
      g.font = 'bold 10px monospace'; g.textAlign = 'center';
      const tw = g.measureText(b.label).width + 10;
      px(g, W / 2 - tw / 2, wallTop - 2, tw, 14, b.kind === 'corp' ? '#e53935' : '#1d1a26');
      g.fillStyle = b.kind === 'corp' ? '#fff' : '#ffd54f'; g.fillText(b.label, W / 2, wallTop + 9);
    }
  });
}

// El colegio Corazonistas visto desde fuera (fachada de ladrillo rojo)
function schoolCanvas() {
  return objCanvas('school', 12 * TS, 7 * TS + 40, (g, W, H) => {
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(6, H - 8, W - 4, 8);
    px(g, 0, 70, W, H - 74, '#b85c42');
    for (let y = 74; y < H - 6; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < W; x += 12) px(g, x, y, 11, 1, '#a24e37');
    px(g, W / 2 - 60, 30, 120, 44, '#b85c42'); px(g, W / 2 - 70, 24, 140, 10, '#8d3b2a');
    px(g, W / 2 - 52, 42, 104, 18, '#fff8e1'); g.fillStyle = '#8e2b3a'; g.font = 'bold 13px monospace'; g.textAlign = 'center'; g.fillText('CORAZONISTAS', W / 2, 56);
    g.fillStyle = '#d32f2f'; g.beginPath(); g.arc(W / 2 - 6, 12, 7, 0, 7); g.arc(W / 2 + 6, 12, 7, 0, 7); g.fill(); g.beginPath(); g.moveTo(W / 2 - 13, 14); g.lineTo(W / 2, 28); g.lineTo(W / 2 + 13, 14); g.fill();
    for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) { if (c === 4 || c === 5) continue; px(g, 18 + c * 36, 92 + r * 52, 22, 30, '#e8e8e8'); px(g, 20 + c * 36, 94 + r * 52, 18, 26, '#8ecae6'); }
    px(g, W / 2 - 22, H - 66, 44, 60, '#5d4037'); g.fillStyle = '#5d4037'; g.beginPath(); g.arc(W / 2, H - 66, 22, Math.PI, 0); g.fill();
    px(g, W / 2 - 18, H - 62, 36, 56, '#cfeaf5'); px(g, W / 2 - 1, H - 62, 2, 56, '#5d4037');
  });
}
