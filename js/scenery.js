// ============================================================
// COREMON - Escenarios: suelos, paredes, puertas y decoración
// Cada sala elige floorStyle / wallColor y su lista de decor.
// ============================================================

function box(ctx, x, y, w, h, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }
}
function circ(ctx, x, y, r, fill, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); }
}
const OUT = '#1d1a26';

// ---------------- SUELOS ----------------
function drawFloor(ctx, map, x, y, T, tx, ty) {
  const style = map.floorStyle || 'wood';
  const fc = map.floorColor;
  switch (style) {
    case 'marble': {
      const a = (tx + ty) % 2 === 0;
      box(ctx, x, y, T, T, a ? '#ece7dc' : '#d8d1c3');
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 3, y + 3, T * 0.35, 2);
      break;
    }
    case 'tatami': {
      box(ctx, x, y, T, T, '#b5c975');
      ctx.fillStyle = '#9fb35e';
      const horiz = (Math.floor(tx / 2) + ty) % 2 === 0;
      for (let i = 1; i < 4; i++) {
        if (horiz) ctx.fillRect(x, y + i * T / 4, T, 1); else ctx.fillRect(x + i * T / 4, y, 1, T);
      }
      ctx.fillStyle = '#4d6b2f';
      if (horiz) { if (tx % 2 === 0) ctx.fillRect(x, y, 2, T); } else { if (ty % 2 === 0) ctx.fillRect(x, y, T, 2); }
      break;
    }
    case 'tile': {
      const base = fc || '#d9cdb4';
      box(ctx, x, y, T, T, base);
      ctx.fillStyle = hexShade(base, -10);
      ctx.fillRect(x, y, T, 1); ctx.fillRect(x, y, 1, T);
      ctx.fillRect(x + T / 2, y, 1, T); ctx.fillRect(x, y + T / 2, T, 1);
      ctx.fillStyle = hexShade(base, 8);
      ctx.fillRect(x + 2, y + 2, T / 2 - 4, 2);
      break;
    }
    case 'carpet': {
      const base = fc || '#8e2b3a';
      box(ctx, x, y, T, T, base);
      ctx.fillStyle = hexShade(base, -8);
      if ((tx + ty) % 2 === 0) { ctx.fillRect(x + T / 2 - 2, y + T / 2 - 2, 4, 4); }
      break;
    }
    case 'lab': {
      box(ctx, x, y, T, T, '#eef4f7');
      ctx.fillStyle = '#9fc3d4';
      ctx.fillRect(x, y, T, 1); ctx.fillRect(x, y, 1, T);
      break;
    }
    case 'stone': {
      box(ctx, x, y, T, T, '#a8a29a');
      ctx.fillStyle = '#8e877e';
      const o = (ty % 2) * (T / 2);
      ctx.fillRect(x, y, T, 1);
      ctx.fillRect(x + (o % T), y, 1, T);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + 3, y + 3, T / 3, 2);
      break;
    }
    case 'dark': {
      box(ctx, x, y, T, T, (tx + ty) % 2 ? '#3d3648' : '#433b4f');
      break;
    }
    case 'grass': {
      box(ctx, x, y, T, T, (tx * 7 + ty * 3) % 5 === 0 ? '#86c95f' : '#7cc35a');
      ctx.fillStyle = '#69ad49';
      if ((tx + ty * 3) % 4 === 0) { ctx.fillRect(x + 6, y + 10, 2, 4); ctx.fillRect(x + 9, y + 8, 2, 6); }
      if ((tx * 5 + ty) % 6 === 0) { ctx.fillStyle = '#fff59d'; ctx.fillRect(x + 20, y + 20, 3, 3); }
      break;
    }
    case 'court': {
      box(ctx, x, y, T, T, '#c96d43');
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      if ((tx + ty) % 2) ctx.fillRect(x, y, T, T);
      break;
    }
    default: { // madera
      const base = fc || '#c8955c';
      box(ctx, x, y, T, T, base);
      ctx.fillStyle = hexShade(base, -14);
      for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * T / 4, T, 1);
      const off = ((ty * 4) % 3) * (T / 3);
      ctx.fillRect(x + off, y, 1, T / 4);
      ctx.fillRect(x + (off + T / 2) % T, y + T / 4, 1, T / 4);
      ctx.fillRect(x + (off + T / 4) % T, y + T / 2, 1, T / 4);
      ctx.fillRect(x + (off + 3 * T / 4) % T, y + 3 * T / 4, 1, T / 4);
    }
  }
}

function drawTallGrass(ctx, x, y, T, t, overlayOnly) {
  if (!overlayOnly) box(ctx, x, y, T, T, '#4f9a3a');
  const sway = Math.sin(t / 500 + x * 0.1) * 1.5;
  ctx.fillStyle = overlayOnly ? '#5fae45' : '#3d7f2b';
  const blades = [[4, 30], [10, 26], [16, 30], [22, 26], [28, 30]];
  for (const [bx, by] of blades) {
    ctx.beginPath();
    ctx.moveTo(x + bx - 3, y + by);
    ctx.lineTo(x + bx + sway, y + (overlayOnly ? by - 12 : by - 16));
    ctx.lineTo(x + bx + 3, y + by);
    ctx.fill();
  }
  if (!overlayOnly) {
    ctx.fillStyle = '#5fae45';
    for (const [bx, by] of [[7, 16], [19, 14], [25, 18]]) {
      ctx.beginPath(); ctx.moveTo(x + bx - 3, y + by); ctx.lineTo(x + bx + sway, y + by - 10); ctx.lineTo(x + bx + 3, y + by); ctx.fill();
    }
  }
}

function drawWater(ctx, x, y, T, t) {
  box(ctx, x, y, T, T, '#3f8fd8');
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  const p = (t / 300 + x * 0.05 + y * 0.03) % (Math.PI * 2);
  ctx.fillRect(x + 6 + Math.sin(p) * 4, y + 8, 8, 2);
  ctx.fillRect(x + 16 + Math.cos(p) * 4, y + 20, 10, 2);
}

function drawRug(ctx, map, x, y, T) {
  const c = map.rugColor || '#a33a3a';
  box(ctx, x, y, T, T, c);
  ctx.fillStyle = hexShade(c, 25);
  ctx.fillRect(x + 3, y, 2, T); ctx.fillRect(x + T - 5, y, 2, T);
}

function drawPapers(ctx, map, x, y, T, tx, ty) {
  drawFloor(ctx, map, x, y, T, tx, ty);
  ctx.save();
  ctx.translate(x + T / 2, y + T / 2);
  ctx.rotate(((tx * 13 + ty * 7) % 10) / 10 - 0.5);
  box(ctx, -7, -9, 14, 18, '#fafafa', '#9e9e9e');
  ctx.fillStyle = '#90a4ae';
  ctx.fillRect(-4, -5, 8, 1); ctx.fillRect(-4, -1, 8, 1); ctx.fillRect(-4, 3, 6, 1);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,235,59,0.35)';
  ctx.fillRect(x + 2, y + T - 6, 4, 4);
}

// ---------------- PAREDES ----------------
function drawWall(ctx, map, x, y, T, face, tx, ty) {
  if (map.outdoor) {
    if (map.facadeRow === ty) {
      box(ctx, x, y, T, T, '#b85c42');
      ctx.fillStyle = '#9c4a33';
      ctx.fillRect(x, y + T / 3, T, 1); ctx.fillRect(x, y + 2 * T / 3, T, 1);
      ctx.fillRect(x + (ty % 2 ? T / 2 : 0), y, 1, T / 3);
      if (tx % 3 === 1) { box(ctx, x + 6, y + 6, T - 12, T - 14, '#8ecae6', OUT); ctx.fillStyle = '#fff'; ctx.fillRect(x + 9, y + 9, 4, 6); }
      return;
    }
    // seto
    box(ctx, x, y, T, T, '#2f6e2a');
    circ(ctx, x + T * 0.3, y + T * 0.35, T * 0.3, '#3c8a34');
    circ(ctx, x + T * 0.7, y + T * 0.55, T * 0.32, '#3c8a34');
    circ(ctx, x + T * 0.35, y + T * 0.75, T * 0.25, '#45993b');
    return;
  }
  const wc = map.wallColor || '#e9dcc3';
  if (face) {
    box(ctx, x, y, T, T, wc);
    ctx.fillStyle = hexShade(wc, -22);
    ctx.fillRect(x, y, T, 4);
    ctx.fillStyle = map.wainscot || hexShade(wc, -35);
    ctx.fillRect(x, y + T - 10, T, 10);
    ctx.fillStyle = hexShade(map.wainscot || hexShade(wc, -35), -20);
    ctx.fillRect(x, y + T - 10, T, 2);
  } else {
    box(ctx, x, y, T, T, map.wallTop || hexShade(wc, -55));
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x, y + T - 3, T, 3);
  }
}

// ---------------- PUERTAS ----------------
function drawDoor(ctx, x, y, T, door, color, t) {
  if (door.elevator) {
    box(ctx, x, y, T, T, '#78909c', OUT);
    box(ctx, x + 4, y + 6, T / 2 - 4, T - 8, '#b0bec5', OUT);
    box(ctx, x + T / 2, y + 6, T / 2 - 4, T - 8, '#b0bec5', OUT);
    ctx.fillStyle = Math.floor(t / 600) % 2 ? '#ffd54f' : '#ff8f00';
    ctx.fillRect(x + T / 2 - 3, y + 1, 6, 4);
    return;
  }
  if (door.exit) {
    box(ctx, x, y, T, T, '#5d4037');
    box(ctx, x + 3, y + 3, T - 6, T - 6, '#8d6e63');
    ctx.fillStyle = '#ffe082';
    ctx.beginPath();
    ctx.moveTo(x + T / 2, y + T - 6); ctx.lineTo(x + T / 2 - 6, y + T / 2 - 2); ctx.lineTo(x + T / 2 + 6, y + T / 2 - 2);
    ctx.fill();
    return;
  }
  const locked = door.locked;
  box(ctx, x + 2, y, T - 4, T, '#4e342e', OUT);
  box(ctx, x + 5, y + 3, T - 10, T - 3, locked ? '#5d4a7a' : (color || '#8d6e63'), OUT);
  box(ctx, x + 9, y + 7, T - 18, 8, 'rgba(255,255,255,0.35)');
  circ(ctx, x + T - 10, y + T / 2 + 2, 2, '#ffd54f');
  if (locked) {
    circ(ctx, x + T / 2, y + T / 2 + 4, 4, '#ffd54f', OUT);
    box(ctx, x + T / 2 - 1, y + T / 2 + 4, 2, 5, OUT);
  }
}

// ---------------- DECORACIÓN ----------------
// Cada entrada: { w, h, solid, tall, anim, wall, draw(ctx, x, y, T, d, t) }
const DECOR = {
  plant: { tall: true, draw(c, x, y, T) {
    box(c, x + 9, y + 18, 14, 12, '#a1572f', OUT);
    circ(c, x + 16, y + 12, 10, '#3e8e3a', OUT); circ(c, x + 10, y + 16, 6, '#4caf50'); circ(c, x + 22, y + 15, 6, '#4caf50');
  }},
  column: { tall: true, draw(c, x, y, T) {
    box(c, x + 6, y - 18, T - 12, T + 16, '#f0ebe0', OUT);
    c.fillStyle = '#d6cfc0'; c.fillRect(x + 10, y - 16, 3, T + 12); c.fillRect(x + 19, y - 16, 3, T + 12);
    box(c, x + 3, y + T - 6, T - 6, 6, '#d6cfc0', OUT); box(c, x + 3, y - 20, T - 6, 6, '#d6cfc0', OUT);
  }},
  counter: { draw(c, x, y, T, d) {
    const w = (d.w || 1) * T, h = (d.h || 1) * T;
    box(c, x, y + 6, w, h - 6, '#8d6e63', OUT);
    box(c, x, y + 2, w, 8, '#bcaaa4', OUT);
    if (h > T) { box(c, x + 2, y + 2, w - 4, h - 6, '#a1887f', OUT); c.fillStyle = '#fafafa'; c.fillRect(x + 6, y + 10, w - 12, 6); }
  }},
  vending: { tall: true, anim: true, draw(c, x, y, T, d, t) {
    box(c, x + 2, y - 14, T - 4, T + 12, d.color || '#c62828', OUT);
    box(c, x + 6, y - 10, T - 16, T - 6, '#263238', OUT);
    const cols = ['#ffeb3b', '#4fc3f7', '#81c784', '#ff8a65'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { c.fillStyle = cols[(i + j) % 4]; c.fillRect(x + 8 + j * 5, y - 8 + i * 6, 3, 4); }
    c.fillStyle = Math.floor(t / 400) % 2 ? '#76ff03' : '#33691e'; c.fillRect(x + T - 9, y - 6, 4, 4);
    box(c, x + 6, y + T - 12, T - 12, 6, '#111');
  }},
  lockers: { tall: true, draw(c, x, y, T, d) {
    const n = d.w || 1;
    for (let i = 0; i < n; i++) {
      box(c, x + i * T + 1, y - 12, T - 2, T + 10, d.color || '#5c7fa3', OUT);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      for (let k = 0; k < 3; k++) c.fillRect(x + i * T + 8, y - 6 + k * 3, T - 16, 1);
      circ(c, x + i * T + T - 8, y + 6, 2, '#ddd');
    }
  }},
  bench: { draw(c, x, y, T, d) {
    const w = (d.w || 1) * T;
    box(c, x + 2, y + 10, w - 4, 8, '#a1887f', OUT);
    box(c, x + 6, y + 18, 4, 10, '#5d4037'); box(c, x + w - 10, y + 18, 4, 10, '#5d4037');
  }},
  trophy: { tall: true, draw(c, x, y, T, d) {
    const w = (d.w || 2) * T;
    box(c, x + 2, y - 10, w - 4, T + 8, '#6d4c41', OUT);
    box(c, x + 6, y - 6, w - 12, T - 4, 'rgba(180,220,255,0.55)', OUT);
    for (let i = 0; i < d.w * 2; i++) {
      const cx = x + 12 + i * (w - 24) / Math.max(1, d.w * 2 - 1);
      c.fillStyle = i % 2 ? '#c0c0c0' : '#ffd54f';
      c.fillRect(cx - 4, y + 2, 8, 6); c.fillRect(cx - 1, y + 8, 2, 6); c.fillRect(cx - 4, y + 13, 8, 2);
    }
  }},
  poster: { wall: true, solid: false, draw(c, x, y, T, d) {
    box(c, x + 6, y + 4, T - 12, T - 14, d.color || '#fff59d', OUT);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + 10, y + 9, T - 20, 2); c.fillRect(x + 10, y + 14, T - 24, 2);
  }},
  window: { wall: true, solid: false, draw(c, x, y, T) {
    box(c, x + 4, y + 4, T - 8, T - 14, '#9ad3f5', OUT);
    c.fillStyle = '#ffffff99'; c.fillRect(x + 8, y + 7, 4, 10);
    c.fillStyle = OUT; c.fillRect(x + T / 2 - 1, y + 4, 2, T - 14);
  }},
  notice: { wall: true, solid: false, draw(c, x, y, T, d) {
    const w = (d.w || 1) * T;
    box(c, x + 3, y + 3, w - 6, T - 12, '#b07a4a', OUT);
    const cols = ['#fff59d', '#80deea', '#f48fb1', '#c5e1a5'];
    for (let i = 0; i < d.w * 2; i++) box(c, x + 7 + i * 14, y + 7 + (i % 2) * 4, 10, 10, cols[i % 4]);
  }},
  chalkboard: { wall: true, solid: false, draw(c, x, y, T, d) {
    const w = (d.w || 3) * T;
    box(c, x + 2, y + 2, w - 4, T - 6, '#5d4037', OUT);
    box(c, x + 5, y + 5, w - 10, T - 14, d.white ? '#f5f5f5' : '#2e5e3a');
    c.fillStyle = d.white ? '#1565c0' : '#e8f5e9';
    c.font = 'bold 9px monospace'; c.textAlign = 'left';
    c.fillText(d.text || '', x + 9, y + 15);
    c.fillText(d.text2 || '', x + 9, y + 24);
  }},
  clock: { wall: true, solid: false, anim: true, draw(c, x, y, T, d, t) {
    circ(c, x + T / 2, y + T / 2 - 2, 9, '#fafafa', OUT);
    const a = t / 1000;
    c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath();
    c.moveTo(x + T / 2, y + T / 2 - 2); c.lineTo(x + T / 2 + Math.cos(a) * 7, y + T / 2 - 2 + Math.sin(a) * 7); c.stroke();
  }},
  flagUK: { wall: true, solid: false, draw(c, x, y, T) {
    box(c, x + 4, y + 5, T - 8, T - 16, '#1e3a8a', OUT);
    c.fillStyle = '#fff'; c.fillRect(x + 4, y + 10, T - 8, 6); c.fillRect(x + 13, y + 5, 6, T - 16);
    c.fillStyle = '#c62828'; c.fillRect(x + 4, y + 12, T - 8, 2); c.fillRect(x + 15, y + 5, 2, T - 16);
  }},
  stained: { wall: true, solid: false, anim: true, draw(c, x, y, T, d, t) {
    c.save();
    c.beginPath(); c.moveTo(x + 6, y + T - 6); c.lineTo(x + 6, y + 10); c.arc(x + T / 2, y + 10, T / 2 - 6, Math.PI, 0); c.lineTo(x + T - 6, y + T - 6); c.closePath();
    c.fillStyle = OUT; c.fill(); c.clip();
    const cols = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa'];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      c.fillStyle = cols[(i + j + (d.seed || 0)) % 5]; c.fillRect(x + 7 + j * 5, y + 4 + i * 5, 4, 4);
    }
    c.fillStyle = `rgba(255,255,255,${0.12 + 0.1 * Math.sin(t / 700 + (d.seed || 0))})`; c.fillRect(x, y, T, T);
    c.restore();
  }},
  curtain: { wall: true, solid: false, draw(c, x, y, T, d) {
    const w = (d.w || 1) * T;
    box(c, x, y, w, T, '#8b1a1a');
    c.fillStyle = '#a82828'; for (let i = 0; i < w; i += 8) c.fillRect(x + i, y, 3, T);
    box(c, x, y, w, 5, '#ffca28', OUT);
  }},
  wallbars: { wall: true, solid: false, draw(c, x, y, T, d) {
    const w = (d.w || 1) * T;
    c.fillStyle = '#c69c6d';
    for (let i = 4; i < w; i += 10) c.fillRect(x + i, y + 2, 3, T - 4);
    for (let j = 4; j < T; j += 6) c.fillRect(x, y + j, w, 2);
  }},
  stage: { draw(c, x, y, T, d) {
    const w = d.w * T, h = d.h * T;
    box(c, x, y, w, h, '#a0703f', OUT);
    c.fillStyle = '#8a5d32'; for (let i = 0; i < h; i += 8) c.fillRect(x, y + i, w, 1);
    box(c, x, y + h - 8, w, 8, '#6d4423', OUT);
  }},
  seat: { draw(c, x, y, T, d) {
    box(c, x + 4, y + 4, T - 8, 12, d.color || '#b71c1c', OUT);
    box(c, x + 4, y + 14, T - 8, 10, hexShade(d.color || '#b71c1c', 15), OUT);
  }},
  pew: { draw(c, x, y, T, d) {
    const w = (d.w || 1) * T;
    box(c, x + 2, y + 2, w - 4, 9, '#5d4037', OUT);
    box(c, x + 2, y + 11, w - 4, 12, '#795548', OUT);
  }},
  altar: { tall: true, draw(c, x, y, T, d) {
    const w = (d.w || 3) * T;
    box(c, x + 2, y - 4, w - 4, T + 2, '#f5f5f5', OUT);
    box(c, x + 2, y + 2, w - 4, 6, '#ffd54f');
    c.fillStyle = '#c62828'; c.fillRect(x + w / 2 - 8, y + 10, 16, 14);
    c.fillStyle = '#ffd54f';
    // corazón dorado (Sagrado Corazón)
    c.beginPath(); c.arc(x + w / 2 - 3, y + 15, 3, 0, Math.PI * 2); c.arc(x + w / 2 + 3, y + 15, 3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(x + w / 2 - 6, y + 16); c.lineTo(x + w / 2, y + 23); c.lineTo(x + w / 2 + 6, y + 16); c.fill();
  }},
  candle: { tall: true, anim: true, draw(c, x, y, T, d, t) {
    box(c, x + 10, y + 12, 12, 18, '#5d4037', OUT);
    box(c, x + 13, y - 2, 6, 14, '#fffde7', OUT);
    const f = 1 + Math.sin(t / 90 + x) * 0.25;
    c.fillStyle = '#ffb300'; c.beginPath(); c.ellipse(x + 16, y - 6, 3 * f, 6 * f, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff59d'; c.beginPath(); c.ellipse(x + 16, y - 5, 1.5, 3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,200,80,0.12)'; c.beginPath(); c.arc(x + 16, y - 4, 14, 0, Math.PI * 2); c.fill();
  }},
  portrait: { wall: true, solid: false, draw(c, x, y, T) {
    box(c, x + 4, y + 2, T - 8, T - 8, '#c9a227', OUT);
    box(c, x + 7, y + 5, T - 14, T - 14, '#3e2723');
    circ(c, x + T / 2, y + 12, 5, '#f2c49b'); c.fillStyle = '#eeeeee'; c.fillRect(x + T / 2 - 5, y + 7, 10, 3);
    box(c, x + T / 2 - 6, y + 17, 12, 7, '#111');
  }},
  confTable: { draw(c, x, y, T, d) {
    const w = d.w * T, h = d.h * T;
    box(c, x + 2, y + 4, w - 4, h - 8, '#6d4c41', OUT);
    c.fillStyle = '#8d6e63'; c.fillRect(x + 6, y + 8, w - 12, 3);
    for (let i = 1; i < d.w; i += 2) { box(c, x + i * T + 6, y + h / 2 - 5, 12, 9, '#fafafa', '#9e9e9e'); }
  }},
  chair: { draw(c, x, y, T) {
    box(c, x + 8, y + 6, T - 16, 8, '#37474f', OUT);
    box(c, x + 8, y + 14, T - 16, 10, '#546e7a', OUT);
  }},
  screen: { wall: true, solid: false, draw(c, x, y, T, d) {
    const w = (d.w || 3) * T;
    box(c, x + 4, y + 2, w - 8, T - 6, '#fafafa', OUT);
    c.fillStyle = '#1e88e5'; c.font = 'bold 9px monospace'; c.textAlign = 'center';
    c.fillText(d.text || '', x + w / 2, y + 16);
  }},
  teacherDesk: { draw(c, x, y, T, d) {
    const w = (d.w || 3) * T;
    box(c, x + 2, y + 4, w - 4, T - 6, '#795548', OUT);
    box(c, x + 2, y + 2, w - 4, 7, '#a1887f', OUT);
    box(c, x + 8, y - 2, 10, 6, '#fafafa', '#9e9e9e');
    circ(c, x + w - 14, y + 1, 4, d.mug || '#e53935', OUT);
  }},
  desk: { draw(c, x, y, T) {
    box(c, x + 3, y + 3, T - 6, 12, '#bcaaa4', OUT);
    box(c, x + 6, y + 15, T - 12, 10, '#1f3b73', OUT);
    c.fillStyle = '#fafafa'; c.fillRect(x + 8, y + 6, 8, 5);
  }},
  labBench: { draw(c, x, y, T, d) {
    const w = (d.w || 2) * T;
    box(c, x + 2, y + 4, w - 4, T - 8, '#eceff1', OUT);
    box(c, x + 2, y + 2, w - 4, 6, '#263238', OUT);
    c.fillStyle = '#4dd0e1'; c.fillRect(x + 10, y - 6, 6, 10);
    c.fillStyle = '#ab47bc'; c.fillRect(x + w - 18, y - 4, 7, 8);
  }},
  skeleton: { tall: true, draw(c, x, y, T) {
    box(c, x + 14, y + 22, 4, 8, '#5d4037');
    c.fillStyle = '#f5f5f5';
    circ(c, x + 16, y - 6, 5, '#f5f5f5', OUT);
    c.fillRect(x + 15, y - 1, 2, 18);
    for (let i = 0; i < 4; i++) c.fillRect(x + 10, y + 2 + i * 3, 12, 1);
    c.fillRect(x + 11, y + 17, 2, 7); c.fillRect(x + 19, y + 17, 2, 7);
  }},
  aquarium: { tall: true, anim: true, draw(c, x, y, T, d, t) {
    box(c, x + 2, y - 4, T - 4, T + 2, '#4fc3f7', OUT);
    const fx = x + 8 + (Math.sin(t / 800) + 1) * 7;
    c.fillStyle = '#ff7043'; c.fillRect(fx, y + 6, 6, 3);
    c.fillStyle = '#ffffff88'; c.fillRect(x + 6, y + 14 - (t / 100 % 14), 2, 2);
    c.fillStyle = '#558b2f'; c.fillRect(x + 6, y + 18, 2, 8); c.fillRect(x + 22, y + 16, 2, 10);
  }},
  globe: { tall: true, draw(c, x, y, T) {
    box(c, x + 13, y + 18, 6, 10, '#5d4037', OUT);
    circ(c, x + 16, y + 10, 10, '#42a5f5', OUT);
    c.fillStyle = '#66bb6a'; c.fillRect(x + 10, y + 6, 6, 5); c.fillRect(x + 17, y + 11, 5, 6);
  }},
  easel: { tall: true, draw(c, x, y, T, d) {
    c.fillStyle = '#6d4c41'; c.fillRect(x + 8, y - 4, 3, T + 2); c.fillRect(x + 21, y - 4, 3, T + 2);
    box(c, x + 5, y - 8, T - 10, 20, '#fafafa', OUT);
    const cols = ['#e53935', '#1e88e5', '#fdd835', '#43a047'];
    c.fillStyle = cols[(d.seed || 0) % 4]; c.fillRect(x + 9, y - 4, 8, 8);
    c.fillStyle = cols[((d.seed || 0) + 2) % 4]; c.fillRect(x + 15, y + 2, 8, 6);
  }},
  splat: { solid: false, draw(c, x, y, T, d) {
    c.fillStyle = d.color || '#e91e63';
    circ(c, x + 16, y + 16, 6, d.color || '#e91e63');
    circ(c, x + 9, y + 12, 3, d.color || '#e91e63'); circ(c, x + 23, y + 21, 2, d.color || '#e91e63');
  }},
  bust: { tall: true, draw(c, x, y, T) {
    box(c, x + 8, y + 12, T - 16, 18, '#9e9e9e', OUT);
    circ(c, x + 16, y + 2, 8, '#e0e0e0', OUT);
    box(c, x + 10, y + 8, 12, 6, '#e0e0e0');
  }},
  bookshelf: { tall: true, draw(c, x, y, T, d) {
    const w = (d.w || 1) * T;
    box(c, x + 1, y - 14, w - 2, T + 12, '#5d4037', OUT);
    const cols = ['#c62828', '#2e7d32', '#1565c0', '#f9a825', '#6a1b9a', '#00838f'];
    for (let r = 0; r < 3; r++) {
      c.fillStyle = '#3e2723'; c.fillRect(x + 3, y - 12 + r * 13 + 11, w - 6, 2);
      for (let i = 0; i < (w - 8) / 4; i++) { c.fillStyle = cols[(i + r * 2 + (d.seed || 0)) % 6]; c.fillRect(x + 4 + i * 4, y - 12 + r * 13 + 1 + (i % 3 === 0 ? 2 : 0), 3, 10 - (i % 3 === 0 ? 2 : 0)); }
    }
  }},
  readingTable: { draw(c, x, y, T, d) {
    const w = (d.w || 2) * T;
    box(c, x + 2, y + 4, w - 4, T - 8, '#a1887f', OUT);
    box(c, x + 8, y + 8, 10, 7, '#1565c0'); box(c, x + w - 20, y + 9, 10, 7, '#c62828');
  }},
  computer: { anim: true, draw(c, x, y, T, d, t) {
    box(c, x + 2, y + 10, T - 4, T - 12, '#cfd8dc', OUT);
    box(c, x + 6, y - 6, T - 12, 16, '#37474f', OUT);
    const on = (Math.floor(t / 900 + x) % 3) !== 0;
    box(c, x + 8, y - 4, T - 16, 11, on ? '#4fc3f7' : '#0d47a1');
    if (on) { c.fillStyle = '#e1f5fe'; c.fillRect(x + 10, y - 2, 8, 1); c.fillRect(x + 10, y + 1, 10, 1); }
  }},
  punchbag: { tall: true, anim: true, draw(c, x, y, T, d, t) {
    const a = Math.sin(t / 400 + x) * 0.12;
    c.save(); c.translate(x + 16, y - 16); c.rotate(a);
    c.fillStyle = '#9e9e9e'; c.fillRect(-1, 0, 2, 10);
    box(c, -8, 10, 16, 30, '#c62828', OUT);
    c.fillStyle = '#e57373'; c.fillRect(-6, 13, 3, 22);
    c.restore();
  }},
  mats: { draw(c, x, y, T) {
    for (let i = 0; i < 3; i++) box(c, x + 2, y + 18 - i * 6, T - 4, 7, ['#1565c0', '#c62828', '#2e7d32'][i], OUT);
  }},
  hoop: { tall: true, draw(c, x, y, T, d) {
    c.fillStyle = '#9e9e9e'; c.fillRect(x + 14, y - 10, 4, T + 8);
    box(c, x + 2, y - 26, T - 4, 18, '#fafafa', OUT);
    box(c, x + 11, y - 22, 10, 8, '#fafafa', '#e53935');
    c.strokeStyle = '#ff6f00'; c.lineWidth = 2; c.beginPath(); c.ellipse(x + 16, y - 7, 7, 2, 0, 0, Math.PI * 2); c.stroke();
  }},
  courtLines: { solid: false, draw(c, x, y, T, d) {
    const w = d.w * T, h = d.h * T;
    c.strokeStyle = '#fafafa'; c.lineWidth = 2;
    c.strokeRect(x + 4, y + 4, w - 8, h - 8);
    c.beginPath(); c.moveTo(x + w / 2, y + 4); c.lineTo(x + w / 2, y + h - 4); c.stroke();
    c.beginPath(); c.arc(x + w / 2, y + h / 2, T * 1.2, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(x + 4, y + h / 2, T * 2, -Math.PI / 2, Math.PI / 2); c.stroke();
    c.beginPath(); c.arc(x + w - 4, y + h / 2, T * 2, Math.PI / 2, -Math.PI / 2); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = 'bold 12px monospace'; c.textAlign = 'center';
    c.fillText('CORAS', x + w / 2, y + h / 2 + 4);
  }},
  tree: { tall: true, draw(c, x, y, T, d) {
    box(c, x + 12, y + 8, 8, 22, '#6d4c41', OUT);
    circ(c, x + 16, y - 6, 17, '#2e7d32', OUT);
    circ(c, x + 9, y - 2, 9, '#388e3c'); circ(c, x + 22, y - 10, 9, '#43a047'); circ(c, x + 14, y - 14, 6, '#4caf50');
    if (d.fruit) { circ(c, x + 10, y - 8, 2, '#e53935'); circ(c, x + 22, y, 2, '#e53935'); }
  }},
  bush: { draw(c, x, y, T) {
    circ(c, x + 10, y + 18, 10, '#388e3c', OUT); circ(c, x + 22, y + 18, 10, '#388e3c', OUT); circ(c, x + 16, y + 12, 10, '#43a047', OUT);
  }},
  flowers: { solid: false, draw(c, x, y, T, d) {
    const cols = [d.color || '#ef5350', '#ffd54f', '#ba68c8'];
    for (let i = 0; i < 5; i++) { const fx = x + 5 + (i * 7) % 24, fy = y + 6 + (i * 11) % 20; circ(c, fx, fy, 3, cols[i % 3]); circ(c, fx, fy, 1, '#fff59d'); }
  }},
  fountain: { tall: true, anim: true, draw(c, x, y, T, d, t) {
    c.beginPath(); c.ellipse(x + 16, y + 20, 15, 9, 0, 0, Math.PI * 2); c.fillStyle = '#b0bec5'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.ellipse(x + 16, y + 19, 11, 6, 0, 0, Math.PI * 2); c.fillStyle = '#4fc3f7'; c.fill();
    box(c, x + 13, y + 2, 6, 14, '#cfd8dc', OUT);
    const h = 6 + Math.sin(t / 150) * 2;
    c.fillStyle = '#b3e5fc'; c.fillRect(x + 15, y - h, 2, h + 2);
    c.fillStyle = '#e1f5fe'; c.fillRect(x + 11 + Math.sin(t / 200) * 2, y + 4, 2, 2); c.fillRect(x + 20 - Math.sin(t / 200) * 2, y + 6, 2, 2);
  }},
  lamp: { tall: true, draw(c, x, y, T) {
    c.fillStyle = '#37474f'; c.fillRect(x + 14, y - 22, 4, T + 20);
    box(c, x + 9, y - 30, 14, 10, '#ffe082', OUT);
  }},
  sign: { draw(c, x, y, T) {
    c.fillStyle = '#6d4c41'; c.fillRect(x + 14, y + 12, 4, 16);
    box(c, x + 4, y, T - 8, 16, '#a1887f', OUT);
    c.fillStyle = '#4e342e'; c.fillRect(x + 8, y + 5, T - 16, 2); c.fillRect(x + 8, y + 9, T - 20, 2);
  }},
  sofa: { draw(c, x, y, T, d) {
    const w = (d.w || 2) * T;
    box(c, x + 2, y + 4, w - 4, T - 6, d.color || '#6a1b9a', OUT);
    box(c, x + 6, y + 12, w - 12, 10, hexShade(d.color || '#6a1b9a', 15), OUT);
  }},
  coffee: { tall: true, anim: true, draw(c, x, y, T, d, t) {
    box(c, x + 4, y - 8, T - 8, T + 6, '#455a64', OUT);
    box(c, x + 8, y - 4, T - 16, 8, '#212121');
    box(c, x + 12, y + 12, 8, 8, '#fafafa', OUT);
    c.fillStyle = 'rgba(255,255,255,0.6)';
    const s = (t / 60) % 12;
    c.fillRect(x + 14 + Math.sin(t / 200) * 2, y + 10 - s, 2, 3);
  }},
  watercooler: { tall: true, anim: true, draw(c, x, y, T, d, t) {
    box(c, x + 8, y + 6, T - 16, T - 8, '#eceff1', OUT);
    box(c, x + 9, y - 12, T - 18, 18, '#81d4fa', OUT);
    c.fillStyle = '#ffffffaa'; c.fillRect(x + 12, y - 8 + (t / 120 % 10), 2, 2);
  }},
  piano: { tall: true, draw(c, x, y, T, d) {
    const w = (d.w || 2) * T;
    box(c, x + 2, y - 10, w - 4, T + 8, '#212121', OUT);
    box(c, x + 4, y + 8, w - 8, 8, '#fafafa');
    c.fillStyle = '#111'; for (let i = 6; i < w - 6; i += 5) c.fillRect(x + i, y + 8, 2, 5);
  }},
  bigDesk: { draw(c, x, y, T, d) {
    const w = (d.w || 3) * T;
    box(c, x + 2, y + 2, w - 4, T - 2, '#4e342e', OUT);
    box(c, x + 2, y, w - 4, 8, '#6d4c41', OUT);
    box(c, x + w / 2 - 10, y - 4, 20, 6, '#fafafa', '#9e9e9e');
    circ(c, x + 12, y, 4, '#ffd54f', OUT);
  }},
  flags: { tall: true, draw(c, x, y, T) {
    c.fillStyle = '#9e9e9e'; c.fillRect(x + 8, y - 20, 2, T + 18); c.fillRect(x + 22, y - 20, 2, T + 18);
    box(c, x + 10, y - 20, 9, 12, '#c62828'); c.fillStyle = '#ffffff'; c.fillRect(x + 10, y - 16, 9, 4);
    box(c, x + 24, y - 20, 7, 12, '#2e7d32'); c.fillStyle = '#ffffff'; c.fillRect(x + 24, y - 16, 7, 2); c.fillStyle = '#c62828'; c.fillRect(x + 24, y - 14, 7, 2);
  }},
  robot: { anim: true, draw(c, x, y, T, d, t) {
    box(c, x + 2, y + 10, T - 4, T - 12, '#bcaaa4', OUT);
    box(c, x + 9, y - 2, 14, 14, '#90a4ae', OUT);
    c.fillStyle = Math.floor(t / 300) % 2 ? '#ff5252' : '#69f0ae'; c.fillRect(x + 12, y + 3, 3, 3); c.fillRect(x + 18, y + 3, 3, 3);
  }},
  rug: { solid: false, draw(c, x, y, T, d) {
    const w = d.w * T, h = d.h * T;
    box(c, x + 2, y + 2, w - 4, h - 4, d.color || '#8e2b3a', OUT);
    c.strokeStyle = '#ffd54f'; c.lineWidth = 2; c.strokeRect(x + 7, y + 7, w - 14, h - 14);
  }}
};

function decorDef(type) { return DECOR[type] || { draw(){} }; }

// Huella (tiles) que ocupa una decoración
function decorCovers(d, x, y) {
  return x >= d.x && x < d.x + (d.w || 1) && y >= d.y && y < d.y + (d.h || 1);
}

// Pequeño objeto recogible en el suelo (estilo "objeto brillante")
function drawItemBall(ctx, x, y, T, t) {
  const b = Math.sin(t / 250) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(x + T / 2, y + T - 7, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  circ(ctx, x + T / 2, y + T / 2 + 2 + b, 7, '#e53935', OUT);
  ctx.fillStyle = '#fafafa'; ctx.fillRect(x + T / 2 - 7, y + T / 2 + 2 + b, 14, 7);
  ctx.beginPath(); ctx.arc(x + T / 2, y + T / 2 + 2 + b, 7, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + T / 2, y + T / 2 + 2 + b, 7, 0, Math.PI * 2); ctx.stroke();
  circ(ctx, x + T / 2, y + T / 2 + 2 + b, 2.5, '#fafafa', OUT);
  if (Math.floor(t / 300) % 4 === 0) { ctx.fillStyle = '#fff59d'; ctx.fillRect(x + T / 2 + 6, y + 6, 3, 3); }
}
