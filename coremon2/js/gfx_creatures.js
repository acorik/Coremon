// ============================================================
// COREMON 2 — Generador de sprites de Coremon (64×64, pixel art).
// Cada especie se monta con partes (cuerpo, cabeza, patas, alas...) según
// su "cuerpo" y su tipo, y después se sombrea con luz arriba-izquierda y se
// contornea. Mismo resultado siempre (semilla = id de la especie).
// ============================================================

const CS = 64;                      // lado del sprite
const CR_CACHE = {};
const scratch = document.createElement('canvas');
scratch.width = scratch.height = CS;
const sctx = scratch.getContext('2d', { willReadFrequently: true });

const TYPE_PAL = {
  logica:     { body: ['#4f6df5', '#3f57c9', '#6a86ff', '#5a5fd0'], belly: ['#dfe6ff', '#c8d4ff'], acc: ['#ffd54f', '#fafafa'] },
  letras:     { body: ['#b05fe0', '#8e44c4', '#c983ef', '#7a4fb8'], belly: ['#f3e5ff', '#fff3d6'], acc: ['#fff3d6', '#3b2f5c'] },
  arte:       { body: ['#e05f9c', '#ff7eb6', '#c94a86', '#f28fb9'], belly: ['#fff0f6', '#ffe0ec'], acc: ['#4fc3f7', '#ffd54f', '#81c784'] },
  idioma:     { body: ['#e0a93f', '#f2c25a', '#c98c2a', '#e8b850'], belly: ['#fff6dc', '#fff'], acc: ['#3949ab', '#e53935'] },
  naturaleza: { body: ['#4fb259', '#3d9a4a', '#6cc46a', '#5aa86b'], belly: ['#e8f5d0', '#f6f0c8'], acc: ['#8bd06a', '#f48fb1'] },
  fisico:     { body: ['#e05f4f', '#c94a3c', '#d9785a', '#b85547'], belly: ['#ffe0d0', '#fff1e6'], acc: ['#ffd54f', '#fafafa'] },
  agua:       { body: ['#2f8fe0', '#3aa6e8', '#2a72c4', '#4fb6d6'], belly: ['#dff4ff', '#cdeeff'], acc: ['#9fe4ff', '#e0f7ff'] },
  fuego:      { body: ['#e2582b', '#c9432a', '#f0803c', '#a8442c'], belly: ['#ffe0b0', '#fff0c8'], acc: ['#ffb300', '#ffd54f'] },
  electrico:  { body: ['#f2c418', '#e8b010', '#f5d84a', '#d9a520'], belly: ['#fff8d6', '#fff'], acc: ['#3a3a4a', '#4fc3f7'] },
  hielo:      { body: ['#7fdcf0', '#9ae6f5', '#6cc2e0', '#b3ecf7'], belly: ['#ffffff', '#eafcff'], acc: ['#e0fbff', '#4fa3d9'] },
  roca:       { body: ['#a07a4a', '#8d8073', '#b08a5c', '#7d6b5a'], belly: ['#d9c7a3', '#cfc4b6'], acc: ['#6d5c4a', '#9e9e9e'] },
  aire:       { body: ['#9fb8e8', '#b8cdf2', '#8aa6d9', '#cfdcf5'], belly: ['#ffffff', '#f2f6ff'], acc: ['#ffffff', '#ffd54f'] },
  sombra:     { body: ['#5b3f8c', '#463070', '#6b4fa0', '#3a2a5c'], belly: ['#b9a6d9', '#8c78b0'], acc: ['#ff4f6d', '#c06cff'] },
  luz:        { body: ['#f5e27a', '#fff0a8', '#f2d35a', '#fff6c8'], belly: ['#ffffff', '#fffdf0'], acc: ['#ffd54f', '#ffb74d'] }
};
const FEATURE_COL = {
  flame: '#ff8f1f', flame2: '#ffd54f', fin: '#7fd0ff', leaf: '#5fc45a', bolt: '#ffe14f', crystal: '#d6f8ff',
  rock: '#8d7b68', feather: '#ffffff', wisp: '#7b4fbf', halo: '#ffd54f', band: '#e53935', mark: '#ffffff',
  dark: '#3a2f3a', horn: '#efe6d0', beak: '#ffb84d', paper: '#fbf6e8', glow: '#ff4f6d'
};

function creatureCanvas(id) {
  if (CR_CACHE[id]) return CR_CACHE[id];
  const c = buildCreature(id);
  CR_CACHE[id] = c;
  return c;
}

// ---------------- CONSTRUCCIÓN POR PARTES ----------------
function buildCreature(id) {
  const P = creatureParts(id);
  return rasterize(P.parts, P.col, SPECIES[id]);
}
// piezas de la criatura (las usan el sprite 2D y el modelo 3D)
const PARTS_CACHE = {};
function creatureParts(id) {
  if (PARTS_CACHE[id]) return PARTS_CACHE[id];
  const sp = SPECIES[id];
  const r = mulberry32(strSeed('cr:' + id));
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const pal = TYPE_PAL[sp.type] || TYPE_PAL.logica;
  const col = {
    body: sp.color || pick(pal.body),
    belly: pick(pal.belly),
    acc: sp.accent || pick(pal.acc)
  };
  const stage = sp.stage || 0;
  const k = sp.legendary ? 1 : [0.66, 0.82, 0.95, 1][Math.min(3, stage)];
  const parts = [];
  // transformación hacia el punto de apoyo (centro abajo)
  const TX = x => 32 + (x - 32) * k, TY = y => 61 + (y - 61) * k;
  const add = (p) => { parts.push(p); return p; };
  const E = (x, y, rx, ry, role, rot) => add({ kind: 'e', x: TX(x), y: TY(y), rx: rx * k, ry: ry * k, rot: rot || 0, role });
  const P = (pts, role, sx, sy, srx, sry) => {
    const tp = pts.map(([x, y]) => [TX(x), TY(y)]);
    const xs = tp.map(p => p[0]), ys = tp.map(p => p[1]);
    const cx = sx != null ? TX(sx) : (Math.min(...xs) + Math.max(...xs)) / 2, cy = sy != null ? TY(sy) : (Math.min(...ys) + Math.max(...ys)) / 2;
    return add({ kind: 'p', pts: tp, role, x: cx, y: cy, rx: Math.max(2, (Math.max(...xs) - Math.min(...xs)) / 2), ry: Math.max(2, (Math.max(...ys) - Math.min(...ys)) / 2) });
  };
  const RING = (x, y, rx, ry, w, role) => add({ kind: 'ring', x: TX(x), y: TY(y), rx: rx * k, ry: ry * k, w: w * k, role });
  const ctxBuild = { sp, r, pick, col, stage, k, E, P, RING, TX, TY, head: null, side: false, tailTip: null, back: null };

  (PLANS[sp.plan] || PLANS.blob)(ctxBuild);
  addTypeFeatures(ctxBuild);
  if (sp.legendary) addLegendFeatures(ctxBuild);
  addFace(ctxBuild);

  return (PARTS_CACHE[id] = { parts, col, outline: shade(col.body, -72), float: !!ctxBuild.float, side: ctxBuild.side });
}

// ---------------- CUERPOS ----------------
const PLANS = {
  beast(c) {
    const { r, E, P } = c;
    const hs = 0.9 + r() * 0.25, tail = r();
    if (tail > 0.25) { const ty = 40 - r() * 8; P([[40, 44], [56, ty - 10], [58, ty - 4], [44, 50]], 'body', 50, ty); c.tailTip = [57, ty - 8]; }
    E(32, 44, 17, 11, 'body');                  // cuerpo
    E(22, 54, 4.5, 6, 'body'); E(42, 54, 4.5, 6, 'body'); // patas traseras
    E(26, 56, 4.5, 6, 'body'); E(38, 56, 4.5, 6, 'body'); // patas delanteras
    E(26, 61, 4, 1.8, 'dark'); E(38, 61, 4, 1.8, 'dark');
    E(32, 46, 9, 7, 'belly');
    const ear = r();
    if (ear < 0.45) { P([[20, 22], [16, 6], [27, 16]], 'body'); P([[44, 22], [48, 6], [37, 16]], 'body'); }
    else if (ear < 0.8) { E(19, 15, 4, 7, 'body', -0.4); E(45, 15, 4, 7, 'body', 0.4); }
    else { E(20, 18, 6, 4, 'body', -0.6); E(44, 18, 6, 4, 'body', 0.6); }
    c.head = E(32, 26, 13 * hs, 11.5 * hs, 'body');
    E(32, 31, 6.5, 4.5, 'belly');               // hocico
    c.back = [32, 32];
  },
  biped(c) {
    const { r, E, P } = c;
    const hs = 0.95 + r() * 0.2;
    if (r() > 0.4) { P([[38, 50], [54, 40], [56, 46], [42, 56]], 'body'); c.tailTip = [55, 42]; }
    E(25, 56, 5, 6, 'body'); E(39, 56, 5, 6, 'body');
    E(25, 61, 5, 2, 'dark'); E(39, 61, 5, 2, 'dark');
    E(32, 44, 12, 13, 'body');
    E(32, 47, 7.5, 8.5, 'belly');
    E(18, 42, 4, 8, 'body', 0.4); E(46, 42, 4, 8, 'body', -0.4);
    E(16, 49, 3.5, 3, 'body'); E(48, 49, 3.5, 3, 'body');
    if (r() > 0.5) { P([[22, 18], [18, 4], [28, 14]], 'horn'); P([[42, 18], [46, 4], [36, 14]], 'horn'); }
    else { E(21, 16, 4, 6, 'body', -0.3); E(43, 16, 4, 6, 'body', 0.3); }
    c.head = E(32, 24, 12.5 * hs, 11 * hs, 'body');
    c.back = [32, 36];
  },
  bird(c) {
    const { r, E, P } = c;
    const spread = r() > 0.45;
    if (spread) {
      P([[22, 34], [2, 20], [4, 34], [10, 44], [22, 46]], 'body', 12, 34);
      P([[42, 34], [62, 20], [60, 34], [54, 44], [42, 46]], 'body', 52, 34);
      P([[6, 28], [10, 40], [16, 38], [10, 26]], 'belly');
      P([[58, 28], [54, 40], [48, 38], [54, 26]], 'belly');
    }
    P([[26, 52], [32, 62], [38, 52]], 'body');                 // cola
    E(32, 42, 12, 12, 'body');
    E(32, 46, 8, 8, 'belly');
    if (!spread) { E(20, 42, 4.5, 9, 'body', 0.25); E(44, 42, 4.5, 9, 'body', -0.25); }
    E(27, 57, 2, 3, 'beak'); E(37, 57, 2, 3, 'beak');
    const crest = r();
    if (crest > 0.3) { P([[30, 12], [26, 2], [33, 10], [36, 0], [36, 12]], 'body'); }
    c.head = E(32, 24, 11, 10, 'body');
    P([[29, 27], [32, 34], [35, 27]], 'beak', 32, 29);
    c.back = [32, 34]; c.beak = true;
  },
  fish(c) {
    const { r, E, P } = c;
    c.side = true;
    P([[44, 38], [60, 26], [62, 52], [44, 44]], 'body', 54, 39);    // cola
    P([[26, 26], [36, 12], [42, 28]], 'body');                       // aleta dorsal
    P([[28, 48], [34, 58], [38, 48]], 'body');                       // aleta ventral
    c.head = E(30, 38, 18, 13, 'body');
    E(28, 43, 12, 6, 'belly');
    P([[24, 38], [30, 44], [32, 36]], 'body', 28, 40);               // aleta lateral
    c.tailTip = [58, 38]; c.back = [34, 28];
  },
  serpent(c) {
    const { r, E, P } = c;
    c.side = true;
    const segs = [[52, 54, 7], [44, 52, 8], [36, 50, 9], [28, 45, 9.5], [24, 37, 9]];
    segs.forEach(([x, y, rr]) => E(x, y, rr, rr * 0.85, 'body'));
    segs.slice(1, 4).forEach(([x, y, rr]) => E(x, y + 3, rr * 0.6, rr * 0.35, 'belly'));
    P([[56, 56], [63, 60], [58, 50]], 'body');
    if (r() > 0.5) { P([[14, 22], [10, 34], [20, 30]], 'body'); P([[34, 22], [38, 34], [28, 30]], 'body'); }
    c.head = E(24, 25, 11, 9, 'body');
    E(17, 28, 6, 4, 'belly');
    c.tailTip = [60, 56]; c.back = [36, 44];
  },
  blob(c) {
    const { r, E, P } = c;
    const w = 17 + r() * 4, h = 15 + r() * 3;
    E(22, 59, 5, 3, 'body'); E(42, 59, 5, 3, 'body');
    c.head = E(32, 46, w, h, 'body');
    E(32, 51, w * 0.6, h * 0.45, 'belly');
    if (r() > 0.5) { E(13, 46, 4, 6, 'body', 0.5); E(51, 46, 4, 6, 'body', -0.5); }
    c.back = [32, 32];
  },
  bug(c) {
    const { r, E, P } = c;
    for (let i = 0; i < 3; i++) { P([[24, 46 + i * 5], [12, 50 + i * 5], [12, 53 + i * 5], [24, 49 + i * 5]], 'dark'); P([[40, 46 + i * 5], [52, 50 + i * 5], [52, 53 + i * 5], [40, 49 + i * 5]], 'dark'); }
    if (r() > 0.4) { E(16, 34, 12, 7, 'feather', -0.6); E(48, 34, 12, 7, 'feather', 0.6); }
    E(32, 50, 12, 9, 'body');
    E(32, 41, 10, 8, 'body');
    E(32, 50, 7, 5, 'belly');
    P([[28, 18], [22, 4], [24, 4], [30, 16]], 'dark'); P([[36, 18], [42, 4], [40, 4], [34, 16]], 'dark');
    E(22, 5, 2.5, 2.5, 'acc'); E(42, 5, 2.5, 2.5, 'acc');
    c.head = E(32, 27, 11, 9.5, 'body');
    c.back = [32, 40];
  },
  plant(c) {
    const { r, E, P } = c;
    E(24, 59, 5, 3, 'dark'); E(40, 59, 5, 3, 'dark');
    c.head = E(32, 46, 15, 13, 'body');
    E(32, 51, 9, 6, 'belly');
    E(14, 46, 7, 3.5, 'leaf', 0.5); E(50, 46, 7, 3.5, 'leaf', -0.5);
    const crown = r();
    if (crown < 0.5) { E(24, 26, 6, 12, 'leaf', -0.5); E(40, 26, 6, 12, 'leaf', 0.5); E(32, 22, 6, 13, 'leaf'); }
    else {
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; E(32 + Math.cos(a) * 9, 22 + Math.sin(a) * 9, 6, 6, 'acc'); }
      E(32, 22, 6, 6, 'flame2');
    }
    E(32, 33, 2, 4, 'leaf');
    c.back = [32, 30];
  },
  golem(c) {
    const { r, E, P } = c;
    P([[20, 50], [28, 50], [28, 62], [18, 62]], 'body'); P([[36, 50], [44, 50], [46, 62], [36, 62]], 'body');
    P([[14, 30], [50, 30], [52, 54], [12, 54]], 'body', 32, 40);
    P([[22, 38], [42, 38], [40, 50], [24, 50]], 'belly');
    P([[4, 32], [14, 30], [16, 52], [6, 54]], 'body'); P([[60, 32], [50, 30], [48, 52], [58, 54]], 'body');
    P([[3, 52], [9, 50], [10, 58], [3, 58]], 'dark'); P([[61, 52], [55, 50], [54, 58], [61, 58]], 'dark');
    c.head = P([[18, 12], [46, 12], [44, 32], [20, 32]], 'body', 32, 22);
    c.back = [32, 30];
  },
  spirit(c) {
    const { r, E, P } = c;
    P([[18, 40], [46, 40], [50, 58], [43, 52], [38, 60], [32, 52], [26, 60], [21, 52], [14, 58]], 'body', 32, 48);
    E(14, 40, 4, 6, 'body', 0.5); E(50, 40, 4, 6, 'body', -0.5);
    c.head = E(32, 32, 15, 14, 'body');
    E(32, 38, 9, 6, 'belly');
    c.back = [32, 22]; c.float = true;
  },
  robot(c) {
    const { r, E, P } = c;
    E(32, 59, 12, 3, 'dark');
    P([[18, 38], [46, 38], [44, 58], [20, 58]], 'body', 32, 46);
    P([[24, 42], [40, 42], [39, 52], [25, 52]], 'acc');
    E(14, 46, 4, 7, 'body'); E(50, 46, 4, 7, 'body');
    P([[31, 8], [33, 8], [33, 16], [31, 16]], 'dark'); E(32, 7, 3, 3, 'glow');
    c.head = P([[18, 14], [46, 14], [46, 36], [18, 36]], 'body', 32, 25);
    P([[21, 18], [43, 18], [43, 32], [21, 32]], 'screen');
    c.back = [32, 40]; c.screenFace = true;
  },
  ball(c) {
    const { E, P } = c;
    E(24, 60, 5, 2.5, 'dark'); E(40, 60, 5, 2.5, 'dark');
    c.head = E(32, 40, 19, 19, 'body');
    P([[15, 36], [49, 36], [49, 39], [15, 39]], 'belly');
    P([[30, 21], [34, 21], [34, 59], [30, 59]], 'belly');
    c.back = [32, 26];
  },
  book(c) {
    const { E, P } = c;
    E(24, 60, 4, 2.5, 'dark'); E(40, 60, 4, 2.5, 'dark');
    P([[18, 18], [50, 22], [50, 58], [18, 56]], 'paper', 34, 38);
    c.head = P([[12, 16], [46, 20], [46, 58], [12, 56]], 'body', 29, 37);
    P([[12, 16], [17, 16], [17, 56], [12, 56]], 'dark');
    c.back = [30, 22];
  },
  drip(c) {
    const { E, P } = c;
    P([[32, 6], [48, 36], [16, 36]], 'body', 32, 30);
    c.head = E(32, 44, 17, 16, 'body');
    E(32, 50, 10, 6, 'belly');
    c.back = [32, 18];
  },
  bubble(c) {
    const { E, P } = c;
    P([[20, 52], [12, 62], [30, 54]], 'body');
    c.head = E(32, 38, 21, 17, 'body');
    E(32, 44, 13, 7, 'belly');
    c.back = [32, 22];
  },
  pack(c) {
    const { E, P } = c;
    E(24, 60, 4.5, 2.5, 'dark'); E(40, 60, 4.5, 2.5, 'dark');
    c.head = P([[16, 18], [48, 18], [50, 58], [14, 58]], 'body', 32, 38);
    P([[20, 42], [44, 42], [44, 56], [20, 56]], 'belly');
    P([[18, 14], [22, 14], [22, 40], [18, 40]], 'dark'); P([[42, 14], [46, 14], [46, 40], [42, 40]], 'dark');
    c.back = [32, 18];
  },
  heart(c) {
    const { E, P } = c;
    E(23, 26, 13, 13, 'body'); E(41, 26, 13, 13, 'body');
    c.head = P([[10, 30], [54, 30], [32, 60]], 'body', 32, 38);
    E(32, 40, 8, 6, 'belly');
    c.back = [32, 16];
  }
};

// ---------------- RASGOS DE TIPO ----------------
function addTypeFeatures(c) {
  const { sp, r, E, P, RING, stage } = c;
  const h = c.head, hx = (h.x - 32) / c.k + 32, hy = (h.y - 61) / c.k + 61, hrx = h.rx / c.k, hry = h.ry / c.k;
  const top = hy - hry, tip = c.tailTip;
  const more = stage >= 1, most = stage >= 2 || sp.legendary;
  switch (sp.type) {
    case 'fuego': {
      const fx = tip ? tip[0] : hx, fy = tip ? tip[1] : top + 2;
      flame(P, fx, fy, more ? 9 : 7);
      if (more) flame(P, hx, top + 3, most ? 9 : 6);
      break;
    }
    case 'agua':
      if (!c.side) { P([[hx - hrx + 2, hy - 2], [hx - hrx - 8, hy - 10], [hx - hrx - 4, hy + 4]], 'fin'); P([[hx + hrx - 2, hy - 2], [hx + hrx + 8, hy - 10], [hx + hrx + 4, hy + 4]], 'fin'); }
      if (more) { E(10, 14, 3, 3, 'fin'); E(54, 10, 2, 2, 'fin'); }
      if (most) P([[hx - 4, top + 2], [hx, top - 10], [hx + 4, top + 2]], 'fin');
      break;
    case 'naturaleza':
      E(hx - 5, top + 1, 5, 2.5, 'leaf', -0.6); E(hx + 5, top - 1, 6, 3, 'leaf', 0.5);
      if (more && c.back) { E(c.back[0] - 8, c.back[1], 7, 3.5, 'leaf', -0.3); E(c.back[0] + 8, c.back[1] - 2, 7, 3.5, 'leaf', 0.3); }
      if (most) { for (let i = 0; i < 5; i++) E(hx - 8 + i * 4, top - 3 - (i % 2) * 3, 2.5, 2.5, 'acc'); }
      break;
    case 'electrico': {
      const bx = tip ? tip[0] : hx + hrx, by = tip ? tip[1] : hy - hry;
      P([[bx - 2, by + 8], [bx + 3, by + 1], [bx, by + 1], [bx + 5, by - 8], [bx - 4, by - 1], [bx - 1, by - 1]], 'bolt', bx, by);
      if (!c.screenFace && !c.side) { E(hx - hrx * 0.62, hy + hry * 0.35, 2.5, 2, 'glow'); E(hx + hrx * 0.62, hy + hry * 0.35, 2.5, 2, 'glow'); }
      if (more) { P([[hx - 6, top + 2], [hx - 9, top - 9], [hx - 4, top - 3], [hx - 2, top - 11], [hx, top + 2]], 'bolt'); }
      break;
    }
    case 'hielo':
      for (let i = 0; i < (most ? 5 : more ? 3 : 2); i++) {
        const x = hx - 8 + i * (16 / Math.max(1, (most ? 4 : more ? 2 : 1))), hh = 6 + (i % 2) * 4;
        P([[x - 3, top + 3], [x, top - hh], [x + 3, top + 3]], 'crystal');
      }
      if (more && c.back) P([[c.back[0] - 6, c.back[1] + 2], [c.back[0] + 2, c.back[1] - 10], [c.back[0] + 6, c.back[1] + 2]], 'crystal');
      break;
    case 'roca':
      if (c.back) {
        const [bx, by] = c.back;
        P([[bx - 12, by + 2], [bx - 8, by - 7], [bx - 2, by - 3], [bx - 4, by + 4]], 'rock');
        P([[bx + 2, by + 2], [bx + 6, by - 9], [bx + 12, by - 3], [bx + 10, by + 4]], 'rock');
        if (more) P([[bx - 4, by - 4], [bx, by - 13], [bx + 4, by - 4]], 'rock');
      }
      if (most) { P([[hx - hrx, hy - 4], [hx - hrx - 6, hy - 12], [hx - hrx + 2, hy - 10]], 'rock'); P([[hx + hrx, hy - 4], [hx + hrx + 6, hy - 12], [hx + hrx - 2, hy - 10]], 'rock'); }
      break;
    case 'aire':
      P([[hx - 3, top + 2], [hx - 8, top - 8], [hx, top - 2], [hx + 4, top - 10], [hx + 4, top + 2]], 'feather');
      if (more && !c.beak) { E(hx - hrx - 4, hy, 7, 3, 'feather', -0.4); E(hx + hrx + 4, hy, 7, 3, 'feather', 0.4); }
      if (most) RING(32, 58, 20, 3, 1.6, 'feather');
      break;
    case 'sombra': {
      const wx = tip ? tip[0] : 32, wy = tip ? tip[1] : 56;
      P([[wx - 5, wy], [wx + 2, wy - 12], [wx + 6, wy - 4], [wx + 10, wy - 14], [wx + 8, wy + 2]], 'wisp');
      if (more) { P([[hx - 7, top + 2], [hx - 12, top - 8], [hx - 3, top - 1]], 'wisp'); P([[hx + 7, top + 2], [hx + 12, top - 8], [hx + 3, top - 1]], 'wisp'); }
      c.glowEyes = true;
      break;
    }
    case 'luz':
      RING(hx, top - 4, 9, 3, 2.2, 'halo');
      if (more) { E(hx - hrx - 6, top + 2, 2, 2, 'halo'); E(hx + hrx + 6, top + 4, 2, 2, 'halo'); }
      if (most) { P([[hx - 3, top - 8], [hx, top - 18], [hx + 3, top - 8]], 'halo'); }
      break;
    case 'fisico':
      if (!c.side) P([[hx - hrx + 1, hy - hry * 0.45], [hx + hrx - 1, hy - hry * 0.45], [hx + hrx - 1, hy - hry * 0.2], [hx - hrx + 1, hy - hry * 0.2]], 'band');
      if (more) { P([[hx + hrx - 2, hy - hry * 0.4], [hx + hrx + 8, hy - hry * 0.7], [hx + hrx + 6, hy - hry * 0.1]], 'band'); }
      break;
    case 'logica':
      if (c.back) { P([[c.back[0] - 3, c.back[1] - 3], [c.back[0] + 3, c.back[1] - 3], [c.back[0] + 3, c.back[1] + 3], [c.back[0] - 3, c.back[1] + 3]], 'mark'); }
      if (more) { P([[hx - 1, top + 1], [hx + 1, top + 1], [hx + 1, top - 7], [hx - 1, top - 7]], 'dark'); E(hx, top - 8, 2.5, 2.5, 'acc'); }
      break;
    case 'letras':
      if (c.back) P([[c.back[0] - 8, c.back[1] - 5], [c.back[0] + 8, c.back[1] - 5], [c.back[0] + 10, c.back[1] + 8], [c.back[0] - 10, c.back[1] + 8]], 'paper');
      if (more) P([[hx + 4, top + 2], [hx + 12, top - 10], [hx + 8, top + 2]], 'dark');
      break;
    case 'arte':
      E(hx - hrx * 0.5, hy + hry * 0.4, 3, 2.5, 'acc'); E(hx + hrx * 0.3, hy - hry * 0.4, 2.5, 2, 'flame2');
      if (more) E(hx + hrx * 0.6, hy + hry * 0.5, 2.5, 2.5, 'fin');
      break;
    case 'idioma':
      P([[hx + hrx - 2, top + 2], [hx + hrx + 10, top - 8], [hx + hrx + 4, top + 4]], 'acc');
      if (more) E(hx - hrx - 4, top - 2, 3, 3, 'acc');
      break;
  }
}
function flame(P, x, y, s) {
  P([[x - s * 0.6, y + s * 0.4], [x - s * 0.5, y - s * 0.4], [x - s * 0.15, y - s * 0.1], [x, y - s * 1.1], [x + s * 0.2, y - s * 0.2], [x + s * 0.55, y - s * 0.6], [x + s * 0.6, y + s * 0.4]], 'flame', x, y);
  P([[x - s * 0.3, y + s * 0.35], [x, y - s * 0.45], [x + s * 0.3, y + s * 0.35]], 'flame2', x, y);
}
function addLegendFeatures(c) {
  const { E, P, RING } = c;
  RING(32, 60, 26, 4, 1.4, 'halo');
  const h = c.head, hx = (h.x - 32) / c.k + 32, top = (h.y - 61) / c.k + 61 - h.ry / c.k;
  P([[hx - 9, top + 2], [hx - 7, top - 7], [hx - 3, top - 2], [hx, top - 10], [hx + 3, top - 2], [hx + 7, top - 7], [hx + 9, top + 2]], 'halo');
}

// ---------------- CARA ----------------
function addFace(c) {
  const { r, E, P } = c;
  const h = c.head;
  const hx = (h.x - 32) / c.k + 32, hy = (h.y - 61) / c.k + 61, hrx = h.rx / c.k, hry = h.ry / c.k;
  const style = r(), big = 0.85 + r() * 0.35;
  const sp = c.sp;
  if (c.screenFace) {
    E(hx - 5, hy, 2.2, 3, 'glow'); E(hx + 5, hy, 2.2, 3, 'glow');
    P([[hx - 4, hy + 5], [hx + 4, hy + 5], [hx + 4, hy + 6], [hx - 4, hy + 6]], 'glow');
    return;
  }
  const eyes = c.side ? [[hx - hrx * 0.45, hy - hry * 0.2]] : [[hx - hrx * 0.42, hy - hry * 0.08], [hx + hrx * 0.42, hy - hry * 0.08]];
  eyes.forEach(([ex, ey]) => {
    const rw = 3.2 * big, rh = (style < 0.3 ? 2.6 : 3.8) * big;
    E(ex, ey, rw, rh, 'eyeW');
    const pr = c.glowEyes ? 'glow' : 'pupil';
    E(ex + (c.side ? -0.8 : 0.4), ey + 0.6, rw * 0.62, rh * 0.68, pr);
    E(ex - rw * 0.25, ey - rh * 0.35, 0.9, 0.9, 'shine');
    if (style > 0.78 || sp.base.atk > sp.base.def * 1.25) {
      // ceño (mirada decidida)
      const s = c.side ? -1 : (ex < hx ? -1 : 1);
      P([[ex - rw - 0.5, ey - rh - 1.2 + (s < 0 ? -1.5 : 1.2)], [ex + rw + 0.5, ey - rh - 1.2 + (s < 0 ? 1.2 : -1.5)], [ex + rw + 0.5, ey - rh + 0.6], [ex - rw - 0.5, ey - rh + 0.6]], 'dark');
    }
  });
  if (!c.beak) {
    const mx = c.side ? hx - hrx * 0.62 : hx, my = hy + hry * 0.45;
    if (style < 0.5) P([[mx - 2.5, my], [mx + 2.5, my], [mx, my + 2.2]], 'mouth');
    else { E(mx, my + 0.6, 2.6, 1.6, 'mouth'); if (sp.base.atk > 60) { P([[mx - 2, my], [mx - 1, my], [mx - 1.5, my + 1.6]], 'eyeW'); P([[mx + 1, my], [mx + 2, my], [mx + 1.5, my + 1.6]], 'eyeW'); } }
  }
}

// ---------------- RASTERIZADO, SOMBREADO Y CONTORNO ----------------
function roleColor(role, col) {
  switch (role) {
    case 'body': return col.body;
    case 'belly': return col.belly;
    case 'acc': return col.acc;
    case 'screen': return '#1b2a3a';
    case 'pupil': return '#1a1424';
    case 'eyeW': return '#ffffff';
    case 'shine': return '#ffffff';
    case 'mouth': return '#3a1420';
    default: return FEATURE_COL[role] || col.acc;
  }
}
const FLAT_ROLES = { eyeW: 1, pupil: 1, shine: 1, mouth: 1, glow: 1, screen: 1 };

function rasterize(parts, col, sp) {
  const N = CS * CS, pid = new Int16Array(N).fill(-1);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    sctx.clearRect(0, 0, CS, CS);
    sctx.fillStyle = '#fff'; sctx.strokeStyle = '#fff';
    sctx.beginPath();
    if (p.kind === 'e') { if (p.rx < 0.4 || p.ry < 0.4) continue; sctx.ellipse(p.x, p.y, p.rx, p.ry, p.rot, 0, Math.PI * 2); sctx.fill(); }
    else if (p.kind === 'ring') { sctx.lineWidth = Math.max(1.2, p.w); sctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); sctx.stroke(); }
    else { p.pts.forEach(([x, y], j) => j ? sctx.lineTo(x, y) : sctx.moveTo(x, y)); sctx.closePath(); sctx.fill(); }
    const d = sctx.getImageData(0, 0, CS, CS).data;
    for (let j = 0; j < N; j++) if (d[j * 4 + 3] > 120) pid[j] = i;
  }
  const out = document.createElement('canvas');
  out.width = out.height = CS;
  const o = out.getContext('2d');
  const img = o.createImageData(CS, CS), px = img.data;
  const tones = {};
  const toneOf = role => tones[role] || (tones[role] = (() => { const b = roleColor(role, col); return [hexToRgb(shade(b, -32)), hexToRgb(b), hexToRgb(shade(b, 32))]; })());
  for (let y = 0; y < CS; y++) for (let x = 0; x < CS; x++) {
    const j = y * CS + x, i = pid[j];
    if (i < 0) continue;
    const p = parts[i];
    let t = 1;
    if (!FLAT_ROLES[p.role]) {
      const nx = (x + 0.5 - p.x) / p.rx, ny = (y + 0.5 - p.y) / p.ry;
      const l = -0.55 * nx - 0.8 * ny;
      t = l > 0.42 ? 2 : l < -0.38 ? 0 : 1;
      // línea interior: borde de una parte delante de otra del mismo color
      const nb = [j - 1, j + 1, j - CS, j + CS];
      for (const n of nb) { const q = pid[n]; if (q >= 0 && q < i && parts[q].role === p.role && n >= 0 && n < N) { const nxx = n % CS; if (Math.abs(nxx - x) <= 1) { t = 0; break; } } }
    }
    const c = toneOf(p.role)[t];
    px[j * 4] = c[0]; px[j * 4 + 1] = c[1]; px[j * 4 + 2] = c[2]; px[j * 4 + 3] = 255;
  }
  // contorno exterior
  const outl = hexToRgb(shade(col.body, -72));
  const mark = new Uint8Array(N);
  for (let y = 0; y < CS; y++) for (let x = 0; x < CS; x++) {
    const j = y * CS + x;
    if (px[j * 4 + 3]) continue;
    if ((x > 0 && pid[j - 1] >= 0) || (x < CS - 1 && pid[j + 1] >= 0) || (y > 0 && pid[j - CS] >= 0) || (y < CS - 1 && pid[j + CS] >= 0)) mark[j] = 1;
  }
  for (let j = 0; j < N; j++) if (mark[j]) { px[j * 4] = outl[0]; px[j * 4 + 1] = outl[1]; px[j * 4 + 2] = outl[2]; px[j * 4 + 3] = 255; }
  o.putImageData(img, 0, 0);
  return out;
}

// ---------------- DIBUJO ----------------
// opts: { flip, white (0..1 destello), alpha, silhouette, bob }
function drawCreature(g, id, x, y, size, opts) {
  opts = opts || {};
  const img = opts.silhouette ? silhouetteOf(id) : creatureCanvas(id);
  g.save();
  g.imageSmoothingEnabled = false;
  if (opts.alpha != null) g.globalAlpha = opts.alpha;
  if (opts.flip) { g.translate(x + size, y + (opts.bob || 0)); g.scale(-1, 1); g.drawImage(img, 0, 0, size, size); }
  else g.drawImage(img, x, y + (opts.bob || 0), size, size);
  g.restore();
  if (opts.white) {
    const w = whiteOf(id);
    g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = opts.white;
    if (opts.flip) { g.translate(x + size, y + (opts.bob || 0)); g.scale(-1, 1); g.drawImage(w, 0, 0, size, size); }
    else g.drawImage(w, x, y + (opts.bob || 0), size, size);
    g.restore();
  }
}
function tintOf(id, color, key) {
  const k = key + id;
  if (CR_CACHE[k]) return CR_CACHE[k];
  const src = creatureCanvas(id), c = document.createElement('canvas');
  c.width = c.height = CS;
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, CS, CS);
  return (CR_CACHE[k] = c);
}
const silhouetteOf = id => tintOf(id, '#2a2838', 'sil:');
const whiteOf = id => tintOf(id, '#ffffff', 'wht:');

// miniatura para menús (canvas DOM)
function creatureIcon(id, px, opts) {
  const c = el('canvas', 'mini');
  c.width = c.height = CS;
  const g = c.getContext('2d');
  drawCreature(g, id, 0, 0, CS, opts || {});
  if (px) { c.style.width = px + 'px'; c.style.height = px + 'px'; }
  return c;
}
