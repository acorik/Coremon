// ============================================================
// COREMON - Sprites pixel-art (criaturas y personas), estilo DS
// Todo se dibuja por código; los sprites se cachean en canvas
// pequeños y se escalan sin suavizado para que queden nítidos.
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

function drawPixels(ctx, rows, palette, dx, dy, destSize, flipX) {
  const h = rows.length, w = rows[0].length;
  const cw = destSize / w, ch = destSize / h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const realX = flipX ? (w - 1 - x) : x;
      const color = palette[rows[y][realX]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(dx + x * cw, dy + y * ch, Math.ceil(cw), Math.ceil(ch));
    }
  }
}

function mirrorRows(halfRows) {
  return halfRows.map(r => r + r.split('').reverse().join(''));
}

// Añade un contorno oscuro de 1px alrededor de los píxeles opacos ('O').
function outlineRows(rows) {
  const h = rows.length, w = rows[0].length;
  const out = rows.map(r => r.split(''));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rows[y][x] !== '.') continue;
      const n = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => {
        const r = rows[y+dy];
        return r && r[x+dx] && r[x+dx] !== '.';
      });
      if (n) out[y][x] = 'O';
    }
  }
  return out.map(r => r.join(''));
}

// Caché de sprites rasterizados (clave -> canvas a resolución nativa)
const SPRITE_CACHE = {};
function cachedSprite(key, rows, palette) {
  if (SPRITE_CACHE[key]) return SPRITE_CACHE[key];
  const c = document.createElement('canvas');
  c.width = rows[0].length; c.height = rows.length;
  const cx = c.getContext('2d');
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[0].length; x++) {
      const color = palette[rows[y][x]];
      if (!color) continue;
      cx.fillStyle = color;
      cx.fillRect(x, y, 1, 1);
    }
  }
  SPRITE_CACHE[key] = c;
  return c;
}

function blitSprite(ctx, img, dx, dy, w, h, flipX) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flipX) {
    ctx.translate(dx + w, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
  } else {
    ctx.drawImage(img, dx, dy, w, h);
  }
  ctx.restore();
}

function drawShadow(ctx, cx, cy, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, w, w * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------- CRIATURAS ----------------
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

// Siluetas por línea evolutiva. torsoRadii: borde por fila (filas 2-12)
const ARCHETYPES = {
  round:  { torsoRadii:[6,5,4,3,2,2,2,2,3,4,5], eyeRowIndex:5, legMode:'feet',  legRadii:[3,3,2] },
  ball:   { torsoRadii:[5,3,2,1,1,1,1,1,2,3,5], eyeRowIndex:5, legMode:'feet',  legRadii:[3,3,2] },
  block:  { torsoRadii:[3,2,2,2,2,2,2,2,2,2,3], eyeRowIndex:5, legMode:'feet',  legRadii:[2,2,1] },
  quill:  { torsoRadii:[7,6,5,5,4,4,3,4,5,6,7], eyeRowIndex:5, legMode:'feet',  legRadii:[4,4,3] },
  book:   { torsoRadii:[2,1,1,1,1,1,1,1,1,1,2], eyeRowIndex:5, legMode:'feet',  legRadii:[2,2,2] },
  pack:   { torsoRadii:[5,4,4,3,3,2,2,1,1,1,2], eyeRowIndex:4, legMode:'feet',  legRadii:[1,1,1] },
  drip:   { torsoRadii:[7,7,6,5,3,2,1,1,2,3,4], eyeRowIndex:6, legMode:'feet',  legRadii:[2,2,2] },
  speech: { torsoRadii:[6,5,4,3,2,2,2,2,3,4,5], eyeRowIndex:5, legMode:'point', legRadii:[6,7,-1] },
  leaf:   { torsoRadii:[7,6,4,3,2,2,2,2,3,4,5], eyeRowIndex:6, legMode:'feet',  legRadii:[3,3,2] },
  heart:  { torsoRadii:[2,1,1,1,1,1,2,3,4,5,6], eyeRowIndex:3, legMode:'point', legRadii:[7,-1,-1] }
};

function genHalfBody(arch) {
  const rows = ['........', '........'];
  arch.torsoRadii.forEach(r => rows.push(borderRow(r)));
  const eyeIdx = 2 + arch.eyeRowIndex;
  rows[eyeIdx] = rows[eyeIdx].slice(0, 5) + 'Ek' + rows[eyeIdx][7];
  // brillo en la parte superior
  const hl = 3;
  rows[hl] = rows[hl].replace(/A(?=A)/, 'C');
  arch.legRadii.forEach(r => rows.push(arch.legMode === 'point' ? borderRow(r) : feetRow(r)));
  while (rows.length < 16) rows.push('........');
  return rows.slice(0, 16);
}

const CREATURE_BODIES = {};
Object.keys(ARCHETYPES).forEach(name => {
  const body = mirrorRows(genHalfBody(ARCHETYPES[name]));
  if (name === 'heart') {
    // muesca central del corazón
    body[2] = body[2].slice(0, 7) + '..' + body[2].slice(9);
  }
  CREATURE_BODIES[name] = body;
});

const TYPE_ACCENT_HALF = {
  logica:     ['....D...', '....D...'],
  letras:     ['..DD....', '.D......'],
  arte:       ['.D......', 'D.......'],
  idioma:     ['D.......', 'DD......'],
  naturaleza: ['..DDD...', '...D....'],
  fisico:     ['........', 'DDDDDDD.']
};

function creaturePalette(sp) {
  const base = sp.color || TYPE_COLOR[sp.type];
  const stage = sp.stage || 0;
  const glow = stage >= 2 ? 22 : stage >= 1 ? 10 : 0;
  return {
    A: hexShade(base, glow), B: hexShade(base, -45), C: hexShade(base, 35 + glow),
    D: sp.accent || hexShade(base, -20), E: '#ffffff', k: '#1a1a1a', O: '#141420'
  };
}

function creatureRows(speciesId) {
  const sp = SPECIES[speciesId];
  const rows = (CREATURE_BODIES[sp.archetype] || CREATURE_BODIES.round).slice();
  const accent = mirrorRows(TYPE_ACCENT_HALF[sp.type] || ['........', '........']);
  if (sp.archetype !== 'heart') { rows[0] = accent[0]; rows[1] = accent[1]; }
  else { rows[0] = mirrorRows(['...D....'])[0]; }
  // 18x18 con margen para el contorno
  const padded = ['..................'].concat(rows.map(r => '.' + r + '.'), ['..................']);
  return outlineRows(padded);
}

function creatureSprite(speciesId, silhouette) {
  const key = 'cr:' + speciesId + (silhouette ? ':s' : '');
  if (SPRITE_CACHE[key]) return SPRITE_CACHE[key];
  const sp = SPECIES[speciesId];
  let pal = creaturePalette(sp);
  if (silhouette) pal = Object.fromEntries(Object.keys(pal).map(k => [k, '#2a2a3a']));
  return cachedSprite(key, creatureRows(speciesId), pal);
}

// opts: {flip, bob, white (flash), alpha, silhouette}
function drawCreature(ctx, speciesId, dx, dy, size, opts) {
  opts = opts || {};
  const sp = SPECIES[speciesId];
  const stage = sp.stage || 0;
  const s = size * (1 + stage * 0.08);
  const off = (s - size) / 2;
  const img = creatureSprite(speciesId, opts.silhouette);
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  blitSprite(ctx, img, dx - off, dy - off + (opts.bob || 0), s, s, opts.flip);
  if (opts.white) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = opts.white;
  }
  ctx.restore();
  if (opts.white) {
    // destello blanco: dibuja la silueta en blanco encima
    const wkey = 'crw:' + speciesId;
    const wimg = SPRITE_CACHE[wkey] || cachedSprite(wkey, creatureRows(speciesId),
      { A:'#fff',B:'#fff',C:'#fff',D:'#fff',E:'#fff',k:'#fff',O:'#fff' });
    ctx.save();
    ctx.globalAlpha = opts.white;
    blitSprite(ctx, wimg, dx - off, dy - off + (opts.bob || 0), s, s, opts.flip);
    ctx.restore();
  }
}

// ---------------- PERSONAS ----------------
// Plantillas 16x16. H pelo, S piel, E ojo, m boca, C ropa, c ropa oscura,
// P pantalón, K zapatos, G gafas, B barba, W cuello blanco, T corbata/detalle
const PERSON_BASE = {
  down: [
    '......HHHH......',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HSSSSSSSSH...',
    '...SSESSSSESS...',
    '...SSSSSSSSSS...',
    '....SSSmmSSS....',
    '.....CCWWCC.....',
    '...SCCCTTCCCS...',
    '...SCCCTTCCCS...',
    '....CCCCCCCC....',
    '.....PPPPPP.....',
    '.....PP..PP.....',
    '.....KK..KK.....',
    '................'
  ],
  up: [
    '......HHHH......',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...SHHHHHHHHS...',
    '....SSSSSSSS....',
    '.....CCCCCC.....',
    '...SCCCCCCCCS...',
    '...SCCCCCCCCS...',
    '....CCCCCCCC....',
    '.....PPPPPP.....',
    '.....PP..PP.....',
    '.....KK..KK.....',
    '................'
  ],
  right: [
    '.....HHHH.......',
    '....HHHHHHH.....',
    '...HHHHHHHHH....',
    '...HHHHHHHHH....',
    '...HHHSSSSSS....',
    '...HHSSSSESS....',
    '...HSSSSSSSS....',
    '....SSSSSmS.....',
    '.....CCCWC......',
    '.....CCSCCC.....',
    '.....CCSCCC.....',
    '.....CCCCCC.....',
    '.....PPPPPP.....',
    '.....PP.PP......',
    '.....KK.KK......',
    '................'
  ]
};

const WALK_LEGS = {
  down:  [['.....PP..PP.....','.....KK..KK.....'], ['....PP...PP.....','....KK....KK....'], ['.....PP...PP....','....KK....KK....']],
  up:    [['.....PP..PP.....','.....KK..KK.....'], ['....PP...PP.....','....KK....KK....'], ['.....PP...PP....','....KK....KK....']],
  right: [['.....PP.PP......','.....KK.KK......'], ['....PP...PP.....','....KK...KK.....'], ['......PPP.......','......KKK.......']]
};

function setPx(rows, y, x, ch) {
  if (!rows[y]) return;
  rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
}

function personRows(look, facing, frame) {
  const dir = facing === 'left' ? 'right' : facing;
  let rows = PERSON_BASE[dir].slice();
  const legs = WALK_LEGS[dir][frame || 0];
  rows[13] = legs[0]; rows[14] = legs[1];
  if (frame === 1 && dir !== 'right') { rows[9] = rows[9].replace('S', 'C'); }
  if (frame === 2 && dir !== 'right') { rows[10] = rows[10].replace(/S(?=\.*$)/, 'C'); }

  const hs = look.hair || 'short';
  if (hs === 'long') {
    if (dir === 'down') for (let y = 4; y <= 9; y++) { setPx(rows, y, 3, 'H'); setPx(rows, y, 12, 'H'); }
    if (dir === 'up') for (let y = 6; y <= 10; y++) { for (let x = 4; x <= 11; x++) setPx(rows, y, x, 'H'); }
    if (dir === 'right') for (let y = 4; y <= 9; y++) { setPx(rows, y, 3, 'H'); setPx(rows, y, 4, 'H'); }
  } else if (hs === 'bald') {
    rows[0] = '................';
    rows[1] = dir === 'right' ? '................' : '................';
    rows[2] = dir === 'right' ? '...HSSSSSSS.....' : '...HSSSSSSSSH...';
    rows[3] = dir === 'right' ? '...HSSSSSSSS....' : '...HSSSSSSSSH...';
    if (dir === 'up') { rows[4] = '...HSSSSSSSSH...'; rows[5] = '...HHSSSSSSHH...'; }
  } else if (hs === 'spiky') {
    rows[0] = dir === 'right' ? '....H.H.H.......' : '....H.HH.H.H....';
  } else if (hs === 'curly') {
    // pelo rizado con volumen
    rows[0] = dir === 'right' ? '...H.HH.H.......' : '....H.HH.HH.H...';
    rows[1] = dir === 'right' ? '..HHHHHHHHH.....' : '..HHHHHHHHHHHH..';
    rows[2] = dir === 'right' ? '..HHHHHHHHHH....' : '..HHHHHHHHHHHH..';
    if (dir === 'down') for (let y = 3; y <= 8; y++) { setPx(rows, y, 2, 'H'); setPx(rows, y, 3, 'H'); setPx(rows, y, 12, 'H'); setPx(rows, y, 13, 'H'); }
    if (dir === 'up') for (let y = 3; y <= 9; y++) rows[y] = rows[y].replace(/^(\.\.)\./, '$1H').replace(/\.(\.\.)$/, 'H$1');
    if (dir === 'right') for (let y = 3; y <= 8; y++) { setPx(rows, y, 2, 'H'); setPx(rows, y, 3, 'H'); }
  } else if (hs === 'crest') {
    // laterales rapados y una cresta pequeña en el centro
    rows[0] = dir === 'right' ? '......HH........' : '.......HH.......';
    rows[1] = dir === 'right' ? '.....HHHH.......' : '......HHHH......';
    rows[2] = dir === 'right' ? '...ssHHHHss.....' : '...ssssHHssss...';
    rows[3] = dir === 'right' ? '...sssssssss....' : '...ssssssssss...';
    if (dir === 'up') { rows[4] = '...ssssHHssss...'; rows[5] = '...ssssssssss...'; rows[6] = '...ssssssssss...'; }
    else if (dir === 'down') { rows[4] = rows[4].replace(/H/g, 's'); }
    else { rows[4] = rows[4].replace(/H/g, 's'); rows[5] = rows[5].replace(/H/g, 's'); rows[6] = rows[6].replace(/H/g, 's'); }
  } else if (hs === 'bun') {
    rows[0] = dir === 'right' ? '..HHHHH.........' : '.....HHHHHH.....';
  } else if (hs === 'cap') {
    rows[0] = '................';
    rows[1] = '....QQQQQQQQ....';
    rows[2] = dir === 'right' ? '...QQQQQQQQQQQ..' : '...QQQQQQQQQQ...';
    if (dir === 'down') rows[3] = '..QQQQQQQQQQQQ..';
  }
  if (look.glasses) {
    if (dir === 'down') { ['4','6','9','11'].forEach(x => setPx(rows, 5, +x, 'G')); setPx(rows, 5, 7, 'G'); setPx(rows, 5, 8, 'G'); }
    if (dir === 'right') { setPx(rows, 5, 8, 'G'); setPx(rows, 5, 10, 'G'); }
  }
  if (look.beard) {
    if (dir === 'down') { rows[7] = '....BBBmmBBB....'; rows[6] = '...SBSSSSSSBS...'; }
    if (dir === 'right') { rows[7] = '....BBBBBmB.....'; }
  }
  if (look.skirt) {
    if (dir !== 'right') { rows[12] = '....PPPPPPPP....'; rows[13] = rows[13].replace(/P/g, 'S'); }
    else { rows[12] = '....PPPPPPP.....'; rows[13] = rows[13].replace(/P/g, 'S'); }
  }
  if (look.longFace && dir !== 'up') {
    // barbilla alargada: añade una fila de cara y quita la fila vacía del final
    const chin = dir === 'right' ? '.....SSSSS......' : '.....SSSSSS.....';
    rows.splice(8, 0, chin);
    rows.splice(15, 1);
  }
  if (look.doubleChin && dir !== 'up') {
    rows[8] = dir === 'right' ? '....sSSSSSs.....' : '....sSSSSSSs....';
  }
  if (look.chubby) {
    for (let y = 8; y <= 12; y++) {
      const r = rows[y];
      const a = r.search(/[^.]/), b = r.length - 1 - r.split('').reverse().join('').search(/[^.]/);
      if (a > 0) rows[y] = r.slice(0, a - 1) + r[a] + r.slice(a);
      const r2 = rows[y];
      const b2 = r2.length - 1 - r2.split('').reverse().join('').search(/[^.]/);
      if (b2 < r2.length - 1) rows[y] = r2.slice(0, b2 + 1) + r2[b2] + r2.slice(b2 + 2);
    }
  }
  if (look.labcoat && dir === 'down') {
    // bata abierta: se ve la camisa por el centro
    rows[11] = rows[11].replace(/CC(?=CCC\.*$)/, 'TT');
  }
  if (look.hoodie && dir !== 'up') {
    rows[8] = rows[8].replace(/W/g, 'c');
  }
  if (look.robe) {
    // sotana larga hasta los pies
    for (let y = 11; y <= 13; y++) rows[y] = dir === 'right' ? '.....CCCCCC.....' : '....CCCCCCCC....';
  }
  if (!look.tie) rows = rows.map(r => r.replace(/T/g, 'C'));
  const padded = ['..................'].concat(rows.map(r => '.' + r.padEnd(16, '.').slice(0, 16) + '.'), ['..................']);
  return outlineRows(padded);
}

function personPalette(look) {
  return {
    H: look.hairColor || '#4a2f1d', S: look.skin || '#f2c49b', E: '#1b1b2a', m: '#b5634b',
    C: look.shirt || '#2c3e7a', W: look.collar || '#f5f5f5', T: look.tie || '#c0392b', Q: look.cap || '#c62828',
    P: look.pants || '#2b2b38', K: look.shoes || '#1a1a1a', G: look.glassesColor || '#20202a',
    s: hexShade(look.skin || '#f2c49b', -14), c: hexShade(look.shirt || '#2c3e7a', -25),
    B: look.beardColor || hexShade(look.hairColor || '#4a2f1d', -10), O: '#141420'
  };
}

function lookKey(look) {
  return [look.hair, look.hairColor, look.skin, look.shirt, look.pants, look.glasses ? 1 : 0,
    look.beard ? 1 : 0, look.skirt ? 1 : 0, look.robe ? 1 : 0, look.tie || '', look.collar || '', look.cap || '',
    look.longFace ? 1 : 0, look.chubby ? 1 : 0, look.doubleChin ? 1 : 0, look.labcoat ? 1 : 0, look.hoodie ? 1 : 0, look.glassesColor || ''].join('|');
}

function drawPerson(ctx, look, cx, footY, size, facing, frame) {
  const dir = facing || 'down';
  const key = 'p:' + lookKey(look) + ':' + (dir === 'left' ? 'right' : dir) + ':' + (frame || 0);
  const img = SPRITE_CACHE[key] || cachedSprite(key, personRows(look, dir, frame || 0), personPalette(look));
  drawShadow(ctx, cx, footY - 2, size * 0.32);
  blitSprite(ctx, img, cx - size / 2, footY - size, size, size, dir === 'left');
}

// Uniforme de los Coras y aspectos fijos
const LOOKS = {
  player:   { hair:'short', hairColor:'#3b2416', shirt:'#1f3b73', pants:'#3a3a48', tie:'#b71c1c' },
  conserje: { hair:'bald', hairColor:'#8d8d8d', shirt:'#6d4c41', pants:'#3e2723', beard:true, beardColor:'#9e9e9e' },
  enfermera:{ hair:'bun', hairColor:'#6d3b1f', shirt:'#ffffff', pants:'#ffffff', skirt:true, collar:'#e91e63' },
  secretaria:{ hair:'long', hairColor:'#2d1b12', shirt:'#7b1fa2', pants:'#37474f', skirt:true, glasses:true },
  bibliotecaria:{ hair:'bun', hairColor:'#b0b0b0', shirt:'#455a64', pants:'#263238', skirt:true, glasses:true }
};

function randomStudentLook(seed) {
  const r = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
  const hairs = ['short', 'long', 'spiky', 'bun', 'short', 'cap'];
  const hairColors = ['#3b2416', '#1a1a1a', '#8d5524', '#d4a017', '#6d3b1f', '#a0522d'];
  const skins = ['#f2c49b', '#e0ac69', '#c68642', '#ffdbac', '#8d5524'];
  const shirts = ['#1f3b73', '#1f3b73', '#2e7d32', '#c62828', '#6a1b9a', '#455a64'];
  const hair = hairs[r(hairs.length)];
  const shirt = shirts[r(shirts.length)];
  return {
    hair, hairColor: hairColors[r(hairColors.length)], skin: skins[r(skins.length)],
    shirt, pants: '#33334a', skirt: hair === 'long' || hair === 'bun' ? r(2) === 0 : false,
    glasses: r(5) === 0, cap: hair === 'cap' ? ['#c62828', '#1565c0', '#2e7d32'][r(3)] : undefined,
    tie: shirt === '#1f3b73' ? '#b71c1c' : undefined
  };
}

// Medalla/insignia para menús y cinemáticas
function drawBadge(ctx, cx, cy, r, color, earned) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + i * Math.PI / 4;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = earned ? color : '#3a3a4a';
  ctx.fill();
  ctx.lineWidth = Math.max(1, r / 6);
  ctx.strokeStyle = earned ? hexShade(color, -40) : '#22222e';
  ctx.stroke();
  if (earned) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
