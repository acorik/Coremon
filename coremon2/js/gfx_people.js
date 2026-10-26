// ============================================================
// COREMON 2 — Personajes: sprites generados (24×32, 4 direcciones × 4
// fotogramas) y texturas propias en assets/personajes/ (ver LEEME.md).
// ============================================================

const PW = 24, PH = 32;               // tamaño de un fotograma
const DIRS4 = ['down', 'left', 'right', 'up'];
const PEOPLE_CACHE = {};
const CUSTOM_SHEETS = {};             // id -> Image cargada

// Texturas propias: si existe assets/personajes/<id>.png se usa en lugar del sprite generado.
// Formato: 4 filas (abajo, izquierda, derecha, arriba) × 4 columnas (quieto, paso, quieto, paso).
function loadCustomSheet(id) {
  if (CUSTOM_SHEETS[id] !== undefined) return;
  CUSTOM_SHEETS[id] = null;
  const img = new Image();
  img.onload = () => { CUSTOM_SHEETS[id] = img; };
  img.onerror = () => { CUSTOM_SHEETS[id] = false; };
  img.src = 'assets/personajes/' + id + '.png';
}

const SKINS = ['#f2c49b', '#e0ac69', '#c68642', '#ffdbac', '#8d5524', '#f6d8c4'];
const HAIRC = ['#3b2416', '#1a1a1a', '#8d5524', '#d4a017', '#6d3b1f', '#a0522d', '#e8e8e8', '#b23a3a'];
const SHIRTS = ['#1f3b73', '#2e7d32', '#c62828', '#6a1b9a', '#455a64', '#ef6c00', '#00838f', '#ad1457', '#5d4037'];

function randomLook(seed) {
  const r = mulberry32(seed);
  const p = a => a[Math.floor(r() * a.length)];
  return { skin: p(SKINS), hair: p(['short', 'long', 'spiky', 'bun', 'cap', 'ponytail', 'curly', 'short']), hairColor: p(HAIRC),
    shirt: p(SHIRTS), pants: p(['#33334a', '#263238', '#3e2723', '#1a237e', '#4e342e', '#37474f']), shoes: p(['#212121', '#5d4037', '#fafafa']),
    cap: p(['#c62828', '#1565c0', '#2e7d32', '#fdd835']), skirt: r() < 0.25, glasses: r() < 0.15 };
}

function lookKey(l) { return JSON.stringify(l); }

// hoja completa 4×4 de un aspecto
function personSheet(look) {
  const key = lookKey(look);
  if (PEOPLE_CACHE[key]) return PEOPLE_CACHE[key];
  const c = document.createElement('canvas');
  c.width = PW * 4; c.height = PH * 4;
  const g = c.getContext('2d');
  DIRS4.forEach((dir, row) => { for (let f = 0; f < 4; f++) drawPersonCell(g, look, dir, f, f * PW, row * PH); });
  outlineCanvas(c, '#1d1a26');
  PEOPLE_CACHE[key] = c;
  return c;
}

function outlineCanvas(c, color) {
  const g = c.getContext('2d'), W = c.width, H = c.height;
  const img = g.getImageData(0, 0, W, H), d = img.data, out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const j = y * W + x;
    if (d[j * 4 + 3]) continue;
    if ((x > 0 && d[(j - 1) * 4 + 3]) || (x < W - 1 && d[(j + 1) * 4 + 3]) || (y > 0 && d[(j - W) * 4 + 3]) || (y < H - 1 && d[(j + W) * 4 + 3])) out[j] = 1;
  }
  const [r, gg, b] = hexToRgb(color);
  for (let j = 0; j < W * H; j++) if (out[j]) { d[j * 4] = r; d[j * 4 + 1] = gg; d[j * 4 + 2] = b; d[j * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
}

function drawPersonCell(g, L, dir, f, ox, oy) {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); };
  const skin = L.skin || '#f2c49b', skinD = shade(skin, -18);
  const shirt = L.shirt || '#1f3b73', shirtD = shade(shirt, -25), shirtL = shade(shirt, 18);
  const pants = L.pants || '#33334a', pantsD = shade(pants, -25);
  const hair = L.hairColor || '#3b2416', hairD = shade(hair, -25), hairL = shade(hair, 22);
  const shoes = L.shoes || '#212121';
  const step = f === 1 ? 1 : f === 3 ? -1 : 0;
  const bob = step ? -1 : 0;
  const side = dir === 'left' || dir === 'right';
  const flip = dir === 'left';
  const X = x => flip ? (PW - x) : x;               // espejo para mirar a la izquierda
  const RX = (x, y, w, h, c) => R(flip ? PW - x - w : x, y, w, h, c);

  // ---- piernas ----
  if (!side) {
    const l1 = step > 0 ? -2 : 0, l2 = step < 0 ? -2 : 0;
    if (L.skirt) { R(7, 21 + bob, 10, 4, pants); R(8, 25 + bob, 3, 4 + l1, skin); R(13, 25 + bob, 3, 4 + l2, skin); }
    else { R(8, 22 + bob, 3, 7 + l1, pants); R(13, 22 + bob, 3, 7 + l2, pants); R(10, 22 + bob, 1, 6, pantsD); }
    R(7, 29 + l1 + bob, 4, 2, shoes); R(13, 29 + l2 + bob, 4, 2, shoes);
  } else {
    const a = step * 2;
    RX(10 + a, 22 + bob, 3, 7, pantsD); RX(11 - a, 22 + bob, 3, 7, pants);
    RX(10 + a, 29 + bob, 5, 2, shoes); RX(11 - a, 29 + bob, 5, 2, shoes);
    if (L.skirt) RX(8, 21 + bob, 9, 4, pants);
  }
  // ---- cuerpo ----
  const ty = 13 + bob;
  if (L.robe) { R(6, ty, 12, 16, shirt); R(6, ty, 2, 16, shirtL); R(16, ty, 2, 16, shirtD); }
  else if (side) { RX(8, ty, 9, 10, shirt); RX(15, ty, 2, 10, shirtD); RX(8, ty, 2, 10, shirtL); }
  else { R(6, ty, 12, 10, shirt); R(6, ty, 2, 10, shirtL); R(16, ty, 2, 10, shirtD); }
  if (L.coat && !side) { R(6, ty, 3, 11, '#f5f5f5'); R(15, ty, 3, 11, '#f5f5f5'); }
  if (L.corp && dir !== 'up') { R(side ? (flip ? 9 : 13) : 10, ty + 3, 3, 3, '#e53935'); }   // logotipo de CoraCorp
  if (L.tie && dir === 'down') R(11, ty + 1, 2, 6, L.tie);
  // ---- brazos ----
  const sw = step * 2;
  if (!side) {
    R(3, ty + 1 + (step > 0 ? -1 : 0), 3, 8, shirtD); R(18, ty + 1 + (step < 0 ? -1 : 0), 3, 8, shirtD);
    R(3, ty + 9 + (step > 0 ? -1 : 0), 3, 2, skin); R(18, ty + 9 + (step < 0 ? -1 : 0), 3, 2, skin);
  } else {
    RX(11 + sw, ty + 1, 3, 8, shirtD); RX(11 + sw, ty + 9, 3, 2, skin);
  }
  // ---- cabeza ----
  const hy = 2 + bob;
  if (side) { RX(7, hy + 1, 11, 10, skin); RX(16, hy + 1, 2, 10, skinD); RX(17, hy + 6, 2, 2, skin); }
  else { R(6, hy + 1, 12, 10, skin); R(6, hy + 9, 12, 2, skinD); }
  // pelo
  const H = (x, y, w, h, c) => side ? RX(x, y + bob, w, h, c) : R(x, y + bob, w, h, c);
  const st = L.hair || 'short';
  if (st === 'bald') { H(6, 2, 12, 2, hair); }
  else if (st === 'cap') {
    H(5, 1, 14, 4, L.cap || '#c62828'); H(5, 4, 14, 1, shade(L.cap || '#c62828', -30));
    if (dir === 'down') R(5, 5 + bob, 14, 1, shade(L.cap || '#c62828', -30));
    if (side) RX(15, 4 + bob, 6, 2, L.cap || '#c62828');
    if (dir === 'up') R(6, 5 + bob, 12, 4, hair);
  } else {
    H(5, 1, 14, 4, hair); H(5, 1, 14, 1, hairL);
    if (dir === 'up') R(5, 5 + bob, 14, 6, hair);
    else if (side) { RX(5, 5 + bob, 4, 5, hair); }
    else { R(5, 5 + bob, 2, 4, hair); R(17, 5 + bob, 2, 4, hair); }
    if (st === 'long') { if (dir === 'up') R(5, 10 + bob, 14, 7, hairD); else if (side) RX(5, 9 + bob, 4, 8, hairD); else { R(4, 6 + bob, 3, 10, hairD); R(17, 6 + bob, 3, 10, hairD); } }
    if (st === 'spiky') { for (let i = 0; i < 4; i++) H(6 + i * 3, 0 - (i % 2), 2, 2, hair); }
    if (st === 'bun') H(9, -1, 6, 3, hair);
    if (st === 'ponytail') { if (side) RX(3, 5 + bob, 3, 8, hairD); else if (dir === 'up') R(10, 10 + bob, 4, 8, hairD); }
    if (st === 'curly') { for (let i = 0; i < 5; i++) H(5 + i * 3, (i % 2), 3, 3, i % 2 ? hairL : hair); if (!side && dir !== 'up') { R(4, 5 + bob, 3, 6, hair); R(17, 5 + bob, 3, 6, hair); } }
    if (st === 'crest') { H(10, -2, 4, 4, hair); }
  }
  // cara
  if (dir === 'down') {
    R(9, hy + 6, 2, 2, '#1d1a26'); R(13, hy + 6, 2, 2, '#1d1a26');
    R(9, hy + 6, 1, 1, '#ffffff'); R(13, hy + 6, 1, 1, '#ffffff');
    if (L.glasses) { R(8, hy + 5, 4, 4, 'rgba(0,0,0,0)'); g.strokeStyle = L.glassesColor || '#1d1a26'; g.lineWidth = 1; g.strokeRect(ox + 8.5, oy + hy + 5.5, 3, 3); g.strokeRect(ox + 12.5, oy + hy + 5.5, 3, 3); }
    if (L.beard) R(8, hy + 8, 8, 3, L.beardColor || hair);
  } else if (side) {
    RX(15, hy + 6, 2, 2, '#1d1a26');
    if (L.glasses) RX(14, hy + 5, 4, 1, L.glassesColor || '#1d1a26');
    if (L.beard) RX(12, hy + 8, 6, 3, L.beardColor || hair);
  }
}

// dibuja a una persona con los pies en (x, y) del mundo
function drawPerson(g, look, x, y, dir, frame, customId) {
  const custom = customId && CUSTOM_SHEETS[customId];
  const row = DIRS4.indexOf(dir || 'down');
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(x, y - 1, 8, 3, 0, 0, Math.PI * 2); g.fill();
  if (custom) {
    const fw = custom.width / 4, fh = custom.height / 4, h = 40, w = fw * h / fh;
    g.drawImage(custom, (frame % 4) * fw, Math.max(0, row) * fh, fw, fh, Math.round(x - w / 2), Math.round(y - h), w, h);
    return;
  }
  const s = personSheet(look);
  g.drawImage(s, (frame % 4) * PW, Math.max(0, row) * PH, PW, PH, Math.round(x - PW / 2), Math.round(y - PH), PW, PH);
}

// aspectos fijos de personajes principales
const LOOKS2 = {
  player:  { skin: '#f2c49b', hair: 'short', hairColor: '#3b2416', shirt: '#1f3b73', pants: '#3a3a48', tie: '#b71c1c', shoes: '#212121' },
  rival:   { skin: '#e0ac69', hair: 'cap', cap: '#212121', hairColor: '#1a1a1a', shirt: '#212121', pants: '#263238', shoes: '#fafafa' },
  olaia:   { skin: '#f6d8c4', hair: 'ponytail', hairColor: '#6d3b1f', shirt: '#26a69a', pants: '#37474f', coat: true, glasses: true },
  grunt:   { skin: '#e0ac69', hair: 'cap', cap: '#1d1a26', hairColor: '#1a1a1a', shirt: '#2b2b38', pants: '#1d1a26', corp: true, shoes: '#1d1a26' },
  admin:   { skin: '#f2c49b', hair: 'long', hairColor: '#b23a3a', shirt: '#1d1a26', pants: '#1d1a26', corp: true, shoes: '#1d1a26' },
  ceo:     { skin: '#f2c49b', hair: 'short', hairColor: '#9e9e9e', shirt: '#1d1a26', pants: '#1d1a26', tie: '#e53935', corp: true, glasses: true, shoes: '#1d1a26' },
  nurse:   { skin: '#ffdbac', hair: 'bun', hairColor: '#6d3b1f', shirt: '#fafafa', pants: '#fafafa', skirt: true },
  clerk:   { skin: '#e0ac69', hair: 'short', hairColor: '#1a1a1a', shirt: '#1565c0', pants: '#263238' },
  guard:   { skin: '#c68642', hair: 'cap', cap: '#37474f', hairColor: '#1a1a1a', shirt: '#455a64', pants: '#263238' }
};
