// ============================================================
// COREMON 2 — Núcleo: pantalla, utilidades, aleatoriedad, entrada,
// guardado e importación de la partida de Coremon 1.
// Un juego de acorik.
// ============================================================

const C2_VERSION = '2.0.1';
const TS = 32;                         // tamaño de casilla en píxeles del mundo
const SAVE_KEY = 'coremon2_save_v1';
const C1_SAVE_KEY = 'corazonistasvitoria_save_v2';

// ---------------- PANTALLA ----------------
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let DPR = 1, VW = 0, VH = 0, ZOOM = 2;   // VW/VH en píxeles de dispositivo; ZOOM = píxeles de dispositivo por píxel de mundo

function resize() {
  DPR = Math.min(3, window.devicePixelRatio || 1);
  const w = window.innerWidth, h = window.innerHeight;
  VW = Math.round(w * DPR); VH = Math.round(h * DPR);
  cv.width = VW; cv.height = VH;
  // ~12 casillas en el lado corto de la pantalla; zoom entero para píxeles nítidos
  const want = Math.min(w, h) / (12 * TS) * DPR;
  ZOOM = Math.max(1, Math.round(want * 2) / 2);
  if (Math.min(w, h) * DPR / ZOOM / TS < 9) ZOOM = Math.max(1, ZOOM - 0.5);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// ---------------- UTILIDADES ----------------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function shade(hex, amt) { const [r, g, b] = hexToRgb(hex); const k = amt / 100; return k >= 0 ? rgbToHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : rgbToHex(r * (1 + k), g * (1 + k), b * (1 + k)); }
function mix(a, b, k) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)); }
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

// ---------------- ALEATORIEDAD REPRODUCIBLE ----------------
// El mundo se genera siempre igual (misma semilla para todos los jugadores).
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function strSeed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }

// ruido de valor suave + fbm
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, s, oct) {
  let v = 0, amp = 0.5, f = 1, tot = 0;
  for (let i = 0; i < (oct || 4); i++) { v += vnoise(x * f, y * f, s + i * 17) * amp; tot += amp; amp *= 0.5; f *= 2; }
  return v / tot;
}

// ---------------- ESTADO ----------------
// TITLE | WORLD | DIALOG | MENU | BATTLE | CUTSCENE
let STATE = 'TITLE';
let now = 0;
let G = null; // partida en curso

function newGame() {
  return {
    v: 1, map: 'world', x: 0, y: 0, facing: 'down',
    team: [], box: [], bag: {}, money: 3000, badges: [], flags: {}, seen: {}, caught: {},
    beaten: {}, picked: {}, time: 8 * 60, playTime: 0, quest: 'intro', fromC1: false, name: 'Cora',
    missions: {}, track: null, ride: null, gunOut: false
  };
}

// ---------------- GUARDADO ----------------
function saveGame(silent) {
  if (!G) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); if (!silent) toast('Partida guardada.'); } catch (e) { if (!silent) toast('No se ha podido guardar.'); }
}
function loadGame() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; const g = Object.assign(newGame(), JSON.parse(raw)); if (g.bike) { g.ride = 'bici'; delete g.bike; } return g; } catch (e) { return null; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function readC1Save() { try { const raw = localStorage.getItem(C1_SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }

// Trae a Coremon 2 lo conseguido en el colegio
function importFromC1(g, c1) {
  if (!c1) return g;
  g.fromC1 = true;
  const conv = p => {
    if (!p || !SPECIES[p.species]) return null;
    const m = makeMon(p.species, p.level || 5);
    m.exp = p.exp || 0;
    if (p.legendary) m.legendary = true;
    // conserva los movimientos que ya sabía (si existen en Coremon 2)
    const known = (p.moves || []).map(x => x.id).filter(id => MOVES[id]);
    if (known.length) m.moves = known.slice(0, 4).map(id => ({ id, pp: MOVES[id].pp, maxPp: MOVES[id].pp }));
    m.hp = monStats(m).hp;
    return m;
  };
  g.team = (c1.team || []).map(conv).filter(Boolean).slice(0, 6);
  g.box = (c1.box || []).map(conv).filter(Boolean);
  Object.keys(c1.caught || {}).forEach(k => { if (SPECIES[k]) { g.caught[k] = true; g.seen[k] = true; } });
  Object.keys(c1.seen || {}).forEach(k => { if (SPECIES[k]) g.seen[k] = true; });
  g.money = Math.max(3000, Math.min(999999, c1.coins || 0));
  Object.entries(c1.bag || {}).forEach(([k, n]) => { if (ITEMS[k] && n > 0) g.bag[k] = (g.bag[k] || 0) + n; });
  g.c1Badges = (c1.badges || []).length;
  g.flags.c1Champion = !!(c1.flags && c1.flags.champion);
  return g;
}

// ---------------- ENTRADA ----------------
const keys = {};
const joy = { x: 0, y: 0, active: false, run: false };
const KEYDIR = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
let onA = null, onB = null; // los fija cada modo (mundo, diálogo, combate...)

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (keys[k]) return;
  keys[k] = true;
  if (k === 'enter' || k === ' ' || k === 'z') pressA();
  if (k === 'escape' || k === 'x' || k === 'backspace') pressB();
  if (k === 'm' || k === 'tab') { e.preventDefault(); if (STATE === 'WORLD') openMainMenu(); }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function pressA() { if (onA) onA(); }
function pressB() { if (onB) onB(); }

// dirección analógica (-1..1) combinando teclado, joystick táctil y mando
function inputDir() {
  let x = 0, y = 0;
  for (const k in KEYDIR) if (keys[k]) { x += KEYDIR[k][0]; y += KEYDIR[k][1]; }
  if (joy.active) { x += joy.x; y += joy.y; }
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null;
  if (gp) {
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (Math.hypot(ax, ay) > 0.25) { x += ax; y += ay; }
    if (gp.buttons[12] && gp.buttons[12].pressed) y -= 1;
    if (gp.buttons[13] && gp.buttons[13].pressed) y += 1;
    if (gp.buttons[14] && gp.buttons[14].pressed) x -= 1;
    if (gp.buttons[15] && gp.buttons[15].pressed) x += 1;
  }
  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }
  return { x, y };
}
function inputRun() { return !!(keys['shift'] || joy.run || keys['virtualb']); }

// botones del mando (A = 0, B = 1, menú = 9)
const gpPrev = {};
function pollGamepad() {
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null;
  if (!gp) return;
  const press = (i, fn) => { const p = gp.buttons[i] && gp.buttons[i].pressed; if (p && !gpPrev[i]) fn(); gpPrev[i] = p; };
  press(0, pressA); press(1, pressB);
  press(9, () => { if (STATE === 'WORLD') openMainMenu(); });
  keys['virtualb'] = !!(gp.buttons[1] && gp.buttons[1].pressed) || keys['virtualbtouch'];
}

// joystick táctil: dirección por ángulo, zona muerta central, correr en el borde
function initJoystick() {
  const base = $('joy'), knob = $('joy-knob');
  let pid = null;
  const release = () => { pid = null; joy.active = false; joy.x = joy.y = 0; joy.run = false; knob.style.transform = ''; base.classList.remove('active', 'run'); };
  const move = e => {
    const r = base.getBoundingClientRect(), R = r.width / 2;
    const dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
    const d = Math.hypot(dx, dy), max = R * 0.58, k = d > max ? max / d : 1;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    if (d < R * 0.18) { joy.x = joy.y = 0; joy.run = false; base.classList.remove('run'); return; }
    const m = Math.min(1, d / max);
    joy.x = dx / d * m; joy.y = dy / d * m;
    joy.run = d > R * 0.82;
    base.classList.toggle('run', joy.run);
  };
  base.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { base.setPointerCapture(pid); } catch (er) {} joy.active = true; base.classList.add('active'); move(e); });
  base.addEventListener('pointermove', e => { if (e.pointerId === pid) move(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => base.addEventListener(ev, e => { if (e.pointerId === pid) release(); }));
  const a = $('tb-a'), b = $('tb-b');
  a.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); pressA(); });
  b.addEventListener('pointerdown', e => { e.preventDefault(); keys['virtualbtouch'] = true; keys['virtualb'] = true; pressB(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { keys['virtualbtouch'] = false; keys['virtualb'] = false; }));
}
const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

// ---------------- AVISOS Y FUNDIDOS ----------------
let toastT = null;
function toast(msg, ms) {
  const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), ms || 2400);
}
function fadeOut() { $('fade').classList.add('on'); return wait(380); }
function fadeIn() { $('fade').classList.remove('on'); return wait(380); }
