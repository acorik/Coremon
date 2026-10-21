// ============================================================
// COREMON - Motor de sprites pixel-art (estilo 8/16-bit)
// Todo se dibuja por código con cuadrículas de píxeles, sin
// imágenes externas, para poder sustituirlo luego por arte real
// del colegio (ver assets/README.md) sin tocar esta interfaz.
// ============================================================

function hexShade(hex, percent) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const amt = Math.round(255 * (percent / 100));
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Dibuja una cuadrícula de píxeles (filas de strings, un char = un píxel)
// con un mapa char->color. '.' es transparente.
function drawPixels(ctx, rows, palette, dx, dy, destSize, flipX) {
  const h = rows.length, w = rows[0].length;
  const cw = destSize / w, ch = destSize / h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const realX = flipX ? (w - 1 - x) : x;
      const ch_ = rows[y][realX];
      const color = palette[ch_];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(dx + x * cw, dy + y * ch, Math.ceil(cw), Math.ceil(ch));
    }
  }
}

// mitad izquierda (8 cols) -> espejo para sprite simétrico de 16 cols
function mirrorRows(halfRows) {
  return halfRows.map(r => r + r.split('').reverse().join(''));
}

// ---------------- CUERPOS DE CRIATURA (una silueta por archetype) ----------------
// Cada fila es la MITAD IZQUIERDA (8px); el índice 7 toca el eje central y
// debe quedar relleno ('A') en las filas de torso para que al reflejar
// (mirrorRows) el cuerpo quede unido en vez de partido en dos mitades.
function borderRow(r) {
  if (r < 0) return '........';
  let row = '';
  for (let c = 0; c < 8; c++) row += c < r ? '.' : (c === r ? 'B' : 'A');
  return row;
}
function feetRow(r) {
  if (r < 0) return '........';
  let row = '';
  for (let c = 0; c < 8; c++) row += (c === r || c === r + 1) ? 'B' : '.';
  return row;
}

// torsoRadii: 11 valores para las filas 2-12 (índice de borde 0-7, -1=vacío)
// eyeRowIndex: qué fila del torso lleva el ojo (0-10)
// legMode 'feet' (dos patas) o 'point' (una cola/pico, estilo borderRow)
const ARCHETYPES = {
  round:  { torsoRadii:[6,5,4,3,2,2,2,2,3,4,5], eyeRowIndex:5, legMode:'feet',  legRadii:[3,3,2] },
  ball:   { torsoRadii:[5,3,2,1,1,1,1,1,2,3,5], eyeRowIndex:5, legMode:'feet',  legRadii:[3,3,2] },
  block:  { torsoRadii:[3,2,2,2,2,2,2,2,2,2,3], eyeRowIndex:5, legMode:'feet',  legRadii:[2,2,1] },
  quill:  { torsoRadii:[7,6,5,5,4,4,3,4,5,6,7], eyeRowIndex:5, legMode:'feet',  legRadii:[4,4,3] },
  book:   { torsoRadii:[2,1,1,1,1,1,1,1,1,1,2], eyeRowIndex:5, legMode:'feet',  legRadii:[2,2,2] },
  pack:   { torsoRadii:[5,4,4,3,3,2,2,1,1,1,2], eyeRowIndex:4, legMode:'feet',  legRadii:[1,1,1] },
  drip:   { torsoRadii:[7,7,6,5,3,2,1,1,2,3,4], eyeRowIndex:6, legMode:'feet',  legRadii:[2,2,2] },
  speech: { torsoRadii:[6,5,4,3,2,2,2,2,3,4,5], eyeRowIndex:5, legMode:'point', legRadii:[6,7,-1] },
  leaf:   { torsoRadii:[7,6,4,3,2,2,2,2,3,4,5], eyeRowIndex:6, legMode:'feet',  legRadii:[3,3,2] }
};

function genHalfBody(arch) {
  const rows = ['........', '........'];
  arch.torsoRadii.forEach(r => rows.push(borderRow(r)));
  const eyeIdx = 2 + arch.eyeRowIndex;
  rows[eyeIdx] = rows[eyeIdx].slice(0, 6) + 'Ek';
  arch.legRadii.forEach(r => rows.push(arch.legMode === 'point' ? borderRow(r) : feetRow(r)));
  while (rows.length < 16) rows.push('........');
  return rows.slice(0, 16);
}

const CREATURE_BODIES = {};
Object.keys(ARCHETYPES).forEach(name => {
  CREATURE_BODIES[name] = mirrorRows(genHalfBody(ARCHETYPES[name]));
});

// Acentos por tipo (se dibujan encima de las filas 0-1 del cuerpo)
const TYPE_ACCENT_HALF = {
  logica:     ['....D...', '....D...'],
  letras:     ['..DD....', '.D......'],
  arte:       ['.D......', 'D.......'],
  idioma:     ['D.......', 'DD......'],
  naturaleza: ['..DDD...', '...D....'],
  fisico:     ['........', 'DDDDDDD.']
};

function creaturePalette(type, stage) {
  const base = TYPE_COLOR[type];
  const glow = stage >= 2 ? 25 : stage >= 1 ? 12 : 0;
  return {
    A: hexShade(base, glow),
    B: hexShade(base, -45),
    C: hexShade(base, 30 + glow),
    D: hexShade(base, -20),
    E: '#ffffff',
    k: '#1a1a1a'
  };
}

function drawCreature(ctx, speciesId, dx, dy, size, opts) {
  opts = opts || {};
  const sp = SPECIES[speciesId];
  const stage = sp.stage || 0;
  const scale = 1 + stage * 0.08;
  const s = size * scale;
  const offset = (s - size) / 2;
  const palette = creaturePalette(sp.type, stage);
  const accent = TYPE_ACCENT_HALF[sp.type] || ['........', '........'];
  const rows = (CREATURE_BODIES[sp.archetype] || CREATURE_BODIES.round).slice();
  const mirroredAccent = mirrorRows(accent);
  rows[0] = mirroredAccent[0];
  rows[1] = mirroredAccent[1];
  const bob = opts.bob || 0;
  drawPixels(ctx, rows, palette, dx - offset, dy - offset + bob, s, opts.flip);
}

// ---------------- JUGADOR ----------------
const PLAYER_ROWS = {
  down: [
    '...BBBB........',
    '..BHHHHB.......',
    '..BHHHHB.......',
    '..BSSSSB.......',
    '.BSS11SSB......',
    '.BS1EE1SB......',
    '.BS1EE1SB......',
    '.BSS11SSB......',
    '..BCCCCB.......',
    '.BBCCCCBB......',
    '.BJCCCCJB......',
    '.BJCCCCJB......',
    '..PP..PP.......',
    '..PP..PP.......',
    '..KK..KK.......',
    '................'
  ].map(r => r.padEnd(16, '.').slice(0, 16))
};
PLAYER_ROWS.up = PLAYER_ROWS.down;
PLAYER_ROWS.left = PLAYER_ROWS.down;
PLAYER_ROWS.right = PLAYER_ROWS.down;

// Segundo fotograma de la animación de andar: piernas separadas en zancada
// (una adelantada, otra atrás) para alternar con PLAYER_ROWS al caminar.
const PLAYER_ROWS_WALK = {
  down: PLAYER_ROWS.down.map((row, i) => {
    if (i === 12 || i === 13) return '.PP.....PP......'.slice(0,16);
    if (i === 14) return '.KK.....KK......'.slice(0,16);
    return row;
  })
};
PLAYER_ROWS_WALK.up = PLAYER_ROWS_WALK.down;
PLAYER_ROWS_WALK.left = PLAYER_ROWS_WALK.down;
PLAYER_ROWS_WALK.right = PLAYER_ROWS_WALK.down;

const PLAYER_PALETTE = {
  B: '#3b2314', H: '#5a3824', S: '#f0b088', '1': '#c98a63',
  E: '#222222', C: '#2f6fb0', J: '#1e4d80', P: '#2b2b2b', K: '#111111'
};

function drawPlayer(ctx, dx, dy, size, facing, walkFrame) {
  const bob = walkFrame ? -2 : 0;
  const set = walkFrame ? PLAYER_ROWS_WALK : PLAYER_ROWS;
  const rows = set[facing || 'down'];
  drawPixels(ctx, rows, PLAYER_PALETTE, dx, dy + bob, size, facing === 'left');
}

// ---------------- NPCs ----------------
const NPC_PALETTES = {
  prof:     { body: '#8d6e63', shirt: '#37474f', skin: '#f0b088' },
  director: { body: '#4a148c', shirt: '#212121', skin: '#e0a988' },
  nurse:    { body: '#ad1457', shirt: '#ffffff', skin: '#f0b088' },
  flavor:   { body: '#455a64', shirt: '#78909c', skin: '#e0a988' }
};

const NPC_HALF = [
  '......B.',
  '.....BHB',
  '....BHHB',
  '....BSSB',
  '...BS11B',
  '...BS1EB',
  '...BS11B',
  '....BSSB',
  '...BCCCB',
  '..BCCCCB',
  '..BCCCCB',
  '..BCCCCB',
  '...PP...',
  '...PP...',
  '...KK...',
  '........'
];

function drawNpc(ctx, kind, dx, dy, size) {
  const pal = NPC_PALETTES[kind] || NPC_PALETTES.prof;
  const palette = {
    B: '#1a1a1a', H: hexShade(pal.body, -20), S: pal.skin, '1': hexShade(pal.skin, -15),
    E: '#1a1a1a', C: pal.shirt, P: '#263238', K: '#111111'
  };
  drawPixels(ctx, mirrorRows(NPC_HALF), palette, dx, dy, size);
}

// ---------------- TILES ----------------
function drawFloorWood(ctx, x, y, size) {
  ctx.fillStyle = '#e8c39e';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = 'rgba(100,60,20,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.5); ctx.lineTo(x + size, y + size * 0.5);
  ctx.moveTo(x + size * 0.5, y); ctx.lineTo(x + size * 0.5, y + size * 0.5);
  ctx.moveTo(x, y + size); ctx.lineTo(x, y + size * 0.5);
  ctx.stroke();
}

function drawWallBrick(ctx, x, y, size) {
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(x, y + size * 0.45, size, size * 0.1);
  ctx.fillRect(x + size * 0.45, y, size * 0.1, size * 0.45);
  ctx.fillRect(x, y + size * 0.9, size, size * 0.1);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
}

function drawDoorTile(ctx, x, y, size, accentColor) {
  ctx.fillStyle = '#6d4c2f';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = accentColor || '#8d6e63';
  ctx.fillRect(x + size * 0.12, y + size * 0.08, size * 0.76, size * 0.84);
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(x + size * 0.12, y + size * 0.08, size * 0.76, size * 0.12);
  ctx.beginPath();
  ctx.fillStyle = '#ffd54f';
  ctx.arc(x + size * 0.72, y + size * 0.55, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

function drawElevatorTile(ctx, x, y, size) {
  ctx.fillStyle = '#90a4ae';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(x + size*0.1, y + size*0.08, size*0.8, size*0.84);
  ctx.fillStyle = '#263238';
  ctx.fillRect(x + size*0.18, y + size*0.16, size*0.64, size*0.5);
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.moveTo(x + size*0.42, y + size*0.3); ctx.lineTo(x + size*0.58, y + size*0.3); ctx.lineTo(x + size*0.5, y + size*0.2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + size*0.42, y + size*0.42); ctx.lineTo(x + size*0.58, y + size*0.42); ctx.lineTo(x + size*0.5, y + size*0.52);
  ctx.fill();
}

function drawLigaDoorTile(ctx, x, y, size, unlocked) {
  ctx.fillStyle = unlocked ? '#8e24aa' : '#4a148c';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = unlocked ? '#ce93d8' : '#6a1b9a';
  ctx.fillRect(x + size * 0.1, y + size * 0.06, size * 0.8, size * 0.88);
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.5, y + size * 0.18);
  ctx.lineTo(x + size * 0.62, y + size * 0.42);
  ctx.lineTo(x + size * 0.38, y + size * 0.42);
  ctx.fill();
}

function drawGrassTile(ctx, x, y, size, variant) {
  ctx.fillStyle = variant ? '#7cb342' : '#8bc34a';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#558b2f';
  const blades = [[0.15,0.2],[0.55,0.35],[0.75,0.15],[0.3,0.6],[0.65,0.7]];
  blades.forEach(([bx,by]) => ctx.fillRect(x + size*bx, y + size*by, size*0.08, size*0.18));
}

function drawPathTile(ctx, x, y, size) {
  ctx.fillStyle = '#d7b98e';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = 'rgba(120,80,40,0.25)';
  ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
}

function drawTechSparkle(ctx, x, y, size, variant) {
  ctx.fillStyle = variant ? '#4fc3f7' : '#29b6f6';
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x + size*0.2, y + size*0.2, size*0.6, size*0.6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#01579b';
  ctx.beginPath();
  ctx.arc(x + size*0.5, y + size*0.5, size*0.06, 0, Math.PI*2);
  ctx.fill();
}

function drawPatioFloor(ctx, x, y, size) {
  ctx.fillStyle = '#aed581';
  ctx.fillRect(x, y, size, size);
}

// ---------------- DECORACIÓN ----------------
function drawDesk(ctx, x, y, size) {
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(x + size*0.08, y + size*0.35, size*0.84, size*0.4);
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + size*0.12, y + size*0.7, size*0.12, size*0.22);
  ctx.fillRect(x + size*0.76, y + size*0.7, size*0.12, size*0.22);
  ctx.fillStyle = '#efebe9';
  ctx.fillRect(x + size*0.15, y + size*0.4, size*0.3, size*0.08);
}

function drawBookshelf(ctx, x, y, size) {
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(x + size*0.05, y, size*0.9, size);
  const colors = ['#c62828','#2e7d32','#1565c0','#f9a825','#6a1b9a'];
  for (let i=0;i<5;i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(x + size*0.1 + i*size*0.16, y + size*0.1, size*0.12, size*0.35);
  }
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(x + size*0.05, y + size*0.55, size*0.9, size*0.08);
  for (let i=0;i<5;i++) {
    ctx.fillStyle = colors[(i+2)%5];
    ctx.fillRect(x + size*0.1 + i*size*0.16, y + size*0.65, size*0.12, size*0.3);
  }
}

function drawChalkboard(ctx, x, y, size) {
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(x, y, size, size*0.75);
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(x + size*0.08, y + size*0.08, size*0.84, size*0.58);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + size*0.15, y + size*0.3); ctx.lineTo(x + size*0.5, y + size*0.3);
  ctx.moveTo(x + size*0.15, y + size*0.45); ctx.lineTo(x + size*0.7, y + size*0.45);
  ctx.stroke();
}

function drawTrophyCase(ctx, x, y, size) {
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(x + size*0.3, y + size*0.3, size*0.4, size*0.5);
  ctx.fillStyle = '#ffa000';
  ctx.beginPath();
  ctx.arc(x + size*0.5, y + size*0.3, size*0.18, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#795548';
  ctx.fillRect(x + size*0.25, y + size*0.78, size*0.5, size*0.1);
}

function drawTree(ctx, x, y, size) {
  ctx.fillStyle = '#6d4c2f';
  ctx.fillRect(x + size*0.42, y + size*0.55, size*0.16, size*0.45);
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(x + size*0.5, y + size*0.4, size*0.42, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.arc(x + size*0.35, y + size*0.3, size*0.22, 0, Math.PI*2);
  ctx.fill();
}

function drawBush(ctx, x, y, size) {
  ctx.fillStyle = '#558b2f';
  ctx.beginPath();
  ctx.arc(x + size*0.3, y + size*0.65, size*0.26, 0, Math.PI*2);
  ctx.arc(x + size*0.65, y + size*0.65, size*0.26, 0, Math.PI*2);
  ctx.fill();
}

function drawFountain(ctx, x, y, size) {
  ctx.fillStyle = '#90a4ae';
  ctx.beginPath();
  ctx.arc(x + size*0.5, y + size*0.55, size*0.42, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(x + size*0.5, y + size*0.55, size*0.3, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#eceff1';
  ctx.fillRect(x + size*0.46, y + size*0.15, size*0.08, size*0.4);
}

function drawFlower(ctx, x, y, size, color) {
  ctx.fillStyle = color || '#ef5350';
  [[0.3,0.3],[0.6,0.3],[0.45,0.5]].forEach(([fx,fy]) => {
    ctx.beginPath(); ctx.arc(x+size*fx, y+size*fy, size*0.09, 0, Math.PI*2); ctx.fill();
  });
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath(); ctx.arc(x+size*0.45, y+size*0.4, size*0.06, 0, Math.PI*2); ctx.fill();
}

const DECOR_DRAW = {
  desk: drawDesk, bookshelf: drawBookshelf, chalkboard: drawChalkboard,
  trophy: drawTrophyCase, tree: drawTree, bush: drawBush,
  fountain: drawFountain, flower: drawFlower
};

function drawDecor(ctx, type, x, y, size, color) {
  const fn = DECOR_DRAW[type];
  if (fn) fn(ctx, x, y, size, color);
}
