// ============================================================
// COREMON 2 — Bucle principal: movimiento libre, cámara, interacción,
// puertas, encuentros, entrenadores, hora del día, clima y luces.
// ============================================================

const player = { x: 0, y: 0, dir: 'down', frame: 0, dist: 0, moving: false, look: LOOKS2.player, custom: 'jugador', isPlayer: true };
let MAP = null;                     // mapa actual
const MAPS2 = {};                   // interiores ya creados
let lastT = 0, encounterAcc = 0, hudT = 0;
let cam = { x: 0, y: 0, w: 0, h: 0 };
let banner = null;
let busy = false;                   // escena en curso (bloquea el control)
const SPEED = { walk: 92, run: 156, bike: 236 };

// ---------------- MAPAS ----------------
function getMap(id) {
  if (id === 'world') return WORLD;
  if (!MAPS2[id]) MAPS2[id] = buildInterior(id);
  return MAPS2[id];
}
function setMap(id, x, y, dir) {
  MAP = getMap(id);
  player.x = x; player.y = y;
  if (dir) player.dir = dir;
  G.map = id; G.x = x; G.y = y;
  encounterAcc = 0;
  const name = placeName(MAP, x, y);
  banner = { text: name, t0: now };
  lastPlace = name;
  updateMusic(true);
  if (MAP.onEnter) MAP.onEnter();
}
let lastPlace = '';

async function warpTo(id, x, y, dir) {
  busy = true;
  sfx('door');
  await fadeOut();
  setMap(id, x, y, dir);
  await fadeIn();
  busy = false;
  if (typeof onMapEntered === 'function') onMapEntered(id);
}

function updateMusic(force) {
  if (STATE === 'BATTLE') return;
  let t;
  if (!MAP.outdoor) t = MAP.music || 'city';
  else if (inCity(MAP, player.x, player.y)) t = isNight() ? 'night' : 'city';
  else t = isNight() ? 'night' : 'field';
  if (force || track.want !== t) music(t);
}

// ---------------- HORA DEL DÍA ----------------
function clock() { const m = Math.floor(G.time) % 1440; return [Math.floor(m / 60), m % 60]; }
function darkness() {
  if (!MAP || !MAP.outdoor) return 0;
  const m = G.time % 1440, h = m / 60;
  if (h >= 7 && h < 18.5) return 0;
  if (h >= 18.5 && h < 20.5) return (h - 18.5) / 2 * 0.62;
  if (h >= 5 && h < 7) return (7 - h) / 2 * 0.62;
  return 0.62;
}
function isNight() { return darkness() > 0.4; }

// ---------------- ACTUALIZACIÓN ----------------
function update(dt) {
  pollGamepad();
  if (STATE === 'WORLD' || STATE === 'DIALOG') G.time = (G.time + dt / 1000) % 1440;
  G.playTime += dt;
  if (STATE === 'WORLD' && !busy) movePlayer(dt);
  if (MAP) for (const n of MAP.npcs) updateNpc(n, dt);
  updateWeather(dt);
  if (STATE === 'WORLD' && !busy) checkTrainerSight();
}

function movePlayer(dt) {
  const d = inputDir();
  const mag = Math.hypot(d.x, d.y);
  player.moving = mag > 0.15;
  if (!player.moving) { player.frame = 0; return; }
  const sp = (G.bike && MAP.outdoor ? SPEED.bike : inputRun() ? SPEED.run : SPEED.walk) * Math.min(1, mag * 1.15) * dt / 1000;
  const vx = d.x / Math.max(mag, 1e-6) * sp, vy = d.y / Math.max(mag, 1e-6) * sp;
  player.dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? 'right' : 'left') : (d.y > 0 ? 'down' : 'up');
  const ox = player.x, oy = player.y;
  // movimiento con deslizamiento contra paredes
  if (!blockedAt(MAP, player.x + vx, player.y, null)) player.x += vx;
  if (!blockedAt(MAP, player.x, player.y + vy, null)) player.y += vy;
  const moved = Math.hypot(player.x - ox, player.y - oy);
  G.x = player.x; G.y = player.y; G.facing = player.dir;
  player.dist += moved;
  player.frame = Math.floor(player.dist / 9) % 4;
  // puertas
  for (const w of MAP.warps) {
    if (player.x > w.x && player.x < w.x + w.w && player.y > w.y && player.y < w.y + w.h + 6) {
      const wantDir = w.exitDir || 'up';
      if (player.dir === wantDir) { enterWarp(w); return; }
    }
  }
  // objetos del suelo
  for (const it of MAP.items) if (!G.picked[it.id] && Math.hypot(it.x - player.x, it.y - player.y) < 14) pickItem(it);
  // encuentros en hierba alta
  if (moved > 0 && MAP.outdoor && !G.flags.noEncounters) {
    const t = MAP.tileAt(Math.floor(player.x / TS), Math.floor((player.y - 2) / TS));
    if (ENCOUNTER_T.has(t)) {
      encounterAcc += moved;
      if (encounterAcc > TS) {
        encounterAcc = 0;
        if (G.repel > 0) G.repel--;
        else if (Math.random() < (t === T.SWAMP ? 0.05 : 0.1) && G.team.some(m => m.hp > 0)) { startWild(t); return; }
      }
    }
  }
  // cambio de zona
  const name = placeName(MAP, player.x, player.y);
  if (name !== lastPlace) { lastPlace = name; banner = { text: name, t0: now }; updateMusic(); const c = inCity(MAP, player.x, player.y); if (c) visitCity(c); }
}

function enterWarp(w) {
  if (w.b && typeof canEnterBuilding === 'function') {
    const msg = canEnterBuilding(w.b);
    if (msg) { busy = true; player.y += 6; say(msg).then(() => { busy = false; }); return; }
  }
  if (w.to && w.to.startsWith('int:')) {
    const im = getMap(w.to);
    G.returnTo = { x: w.x + w.w / 2, y: w.y + w.h + 18 };
    warpTo(w.to, im.spawn.x, im.spawn.y, 'up');
  } else if (w.toWorld) {
    const r = G.returnTo || w.toWorld;
    warpTo('world', r.x, r.y, 'down');
  }
}

// ---------------- PERSONAJES NO JUGADORES ----------------
function updateNpc(n, dt) {
  if (n.walkTo) {
    const [tx, ty] = n.walkTo, dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
    const sp = (n.speed || 80) * dt / 1000;
    if (d <= sp) { n.x = tx; n.y = ty; n.walkTo = null; n.moving = false; if (n.onArrive) { const f = n.onArrive; n.onArrive = null; f(); } }
    else { n.x += dx / d * sp; n.y += dy / d * sp; n.moving = true; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); n.dist = (n.dist || 0) + sp; }
    n.frame = n.moving ? Math.floor(n.dist / 9) % 4 : 0;
    return;
  }
  if (n.wander && STATE === 'WORLD' && !busy) {
    n.wt = (n.wt || 0) - dt;
    if (n.wt <= 0) {
      n.wt = 1500 + Math.random() * 3000;
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], [dx, dy] = dirs[Math.floor(Math.random() * 4)];
      const nx = n.x + dx * TS, ny = n.y + dy * TS;
      if (Math.hypot(nx - n.home[0], ny - n.home[1]) < TS * 3 && !blockedAt(MAP, nx, ny, n) && Math.hypot(nx - player.x, ny - player.y) > 24) n.walkTo = [nx, ny];
      else n.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    }
  }
}
function npcWalk(n, x, y, speed) { return new Promise(res => { n.walkTo = [x, y]; n.speed = speed || 80; n.onArrive = res; }); }
function faceTo(a, b) { const dx = b.x - a.x, dy = b.y - a.y; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }

// los entrenadores te ven si estás en su línea de visión
function checkTrainerSight() {
  for (const n of MAP.npcs) {
    if (!(n.trainer || n.ambush) || n.hidden || G.beaten[n.id] || !n.sight || n.walkTo) continue;
    const dx = player.x - n.x, dy = player.y - n.y, range = n.sight * TS;
    let seen = false;
    if (n.dir === 'down') seen = Math.abs(dx) < 14 && dy > 0 && dy < range;
    if (n.dir === 'up') seen = Math.abs(dx) < 14 && dy < 0 && -dy < range;
    if (n.dir === 'left') seen = Math.abs(dy) < 14 && dx < 0 && -dx < range;
    if (n.dir === 'right') seen = Math.abs(dy) < 14 && dx > 0 && dx < range;
    if (seen && G.team.some(m => m.hp > 0)) { trainerSpotted(n); return; }
  }
}
async function trainerSpotted(n) {
  busy = true; player.moving = false; player.frame = 0;
  sfx('encounter');
  n.bubble = now;
  await wait(700);
  n.bubble = null;
  const ang = Math.atan2(player.y - n.y, player.x - n.x);
  await npcWalk(n, player.x - Math.cos(ang) * 22, player.y - Math.sin(ang) * 22, 140);
  faceTo(player, n);
  busy = false;
  await talkTo(n);
}

// ---------------- INTERACCIÓN ----------------
function frontPoint(dist) {
  const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.dir];
  return [player.x + v[0] * dist, player.y - 4 + v[1] * dist];
}
function interact() {
  if (busy) return;
  // personajes (alcance mayor si hay un mostrador en medio)
  for (const dist of [18, 30, 46]) {
    const [fx, fy] = frontPoint(dist);
    const n = MAP.npcs.find(a => !a.hidden && Math.hypot(a.x - fx, a.y - 6 - fy) < 16 && (dist < 30 || a.counter));
    if (n) { talkTo(n); return; }
  }
  // carteles y objetos con texto o acción
  const [fx, fy] = frontPoint(18);
  for (const o of MAP.objsIn(fx - 40, fy - 40, fx + 40, fy + 40)) {
    if (!o.text && !o.action) continue;
    if (o.gate && gateOpen(o)) continue;
    const c = o.col || [-12, -10, 24, 10];
    if (fx > o.x + c[0] - 6 && fx < o.x + c[0] + c[2] + 6 && fy > o.y + c[1] - 10 && fy < o.y + c[3] + 4) {
      if (o.action) { runAction(o); return; }
      say(o.text); return;
    }
  }
  // barreras de CoraCorp
  for (const o of MAP.objsIn(fx - 30, fy - 30, fx + 30, fy + 30)) {
    if (o.type === 'barrier' && !gateOpen(o) && Math.hypot(o.x - fx, o.y - 12 - fy) < 30) {
      say([`Una barrera de CoraCorp corta el paso. Un cartel dice: «PROPIEDAD PRIVADA DE CORACORP».`,
        `Debajo, alguien ha escrito con rotulador: «Solo los entrenadores con ${o.req} medalla${o.req > 1 ? 's' : ''} pueden romperla».`]);
      return;
    }
  }
}

async function talkTo(n) {
  if (busy && STATE !== 'WORLD') return;
  busy = true;
  faceTo(n, player);
  try {
    if (n.script) await n.script(n);
    else if (n.kind === 'nurse') await nurseScene(n);
    else if (n.kind === 'shop') await say(n.lines || ['¡Bienvenido! ¿Qué te pongo?']).then(() => openShop());
    else if (n.kind === 'trainer' || n.trainer) await trainerScene(n);
    else await say(n.lines || ['...']);
  } finally { busy = false; refreshNpcs(); }
}

async function nurseScene(n) {
  await say(['Enfermera: ¡Hola! Bienvenido al Centro Coremon. Voy a curar a tu equipo.']);
  G.team.forEach(healMon);
  sfx('heal');
  flashHeal = now;
  await wait(1100);
  G.lastCenter = { map: G.map, x: player.x, y: player.y };
  saveGame(true);
  await say('Enfermera: ¡Listo! Tus Coremon están como nuevos. ¡Vuelve cuando quieras!');
}
let flashHeal = 0;

async function trainerScene(n) {
  const tr = n.trainer;
  if (G.beaten[n.id]) { await say([].concat(tr.after || tr.win || '...').map(l => `${tr.name}: ${l}`)); return; }
  if (!G.team.some(m => m.hp > 0)) { await say(`${tr.name}: Tus Coremon están agotados. Ve a un Centro Coremon.`); return; }
  await say([].concat(tr.intro).map(l => `${tr.name}: ${l}`));
  const res = await startBattle({ kind: 'trainer', trainer: tr, npc: n });
  if (res === 'win') {
    G.beaten[n.id] = true;
    await say([].concat(tr.win).map(l => `${tr.name}: ${l}`));
    if (tr.onWin) await tr.onWin(n);
    saveGame(true);
  }
}

function runAction(o) {
  if (typeof ACTIONS !== 'undefined' && ACTIONS[o.action]) { busy = true; Promise.resolve(ACTIONS[o.action](o)).finally(() => { busy = false; }); }
}

function pickItem(it) {
  G.picked[it.id] = true;
  if (it.item) G.bag[it.item] = (G.bag[it.item] || 0) + (it.qty || 1);
  if (it.money) G.money += it.money;
  sfx('item');
  toast(it.money ? `¡Has encontrado ${it.money} monedas!` : `¡Has encontrado ${(it.qty || 1) > 1 ? it.qty + ' × ' : ''}${ITEMS[it.item].name}!`);
}

// ---------------- COMBATES SALVAJES ----------------
function startWild(tile) {
  const reg = CITIES[MAP.regionIdx(Math.floor(player.x / TS), Math.floor(player.y / TS))];
  const w = wildEncounter(reg, tile);
  busy = true;
  startBattle({ kind: 'wild', mon: w }).then(() => { busy = false; });
}

// ---------------- CLIMA ----------------
const weather = { kind: null, parts: [], t: 0 };
function currentWeather() {
  if (!MAP || !MAP.outdoor) return null;
  const reg = MAP.regionAt(Math.floor(player.x / TS), Math.floor(player.y / TS));
  const w = REGION_WEATHER[reg];
  if (!w) return null;
  // la lluvia y la niebla van y vienen según la hora
  if (w === 'rain') return Math.floor(G.time / 180) % 2 ? 'rain' : null;
  return w;
}
function updateWeather(dt) {
  const k = currentWeather();
  if (k !== weather.kind) { weather.kind = k; weather.parts = []; }
  if (!k || k === 'fog') return;
  const want = { rain: 140, snow: 90, sand: 70, ash: 60, leaves: 22 }[k] || 0;
  while (weather.parts.length < want) weather.parts.push({ x: Math.random() * VW, y: Math.random() * VH, s: 0.6 + Math.random() * 0.8, p: Math.random() * 6 });
  for (const p of weather.parts) {
    const f = dt / 16;
    if (k === 'rain') { p.y += 14 * p.s * f * DPR; p.x -= 3 * f * DPR; }
    else if (k === 'snow') { p.y += 1.6 * p.s * f * DPR; p.x += Math.sin(now / 900 + p.p) * 0.8 * DPR; }
    else if (k === 'sand') { p.x += 7 * p.s * f * DPR; p.y += Math.sin(now / 400 + p.p) * 0.6 * DPR; }
    else if (k === 'ash') { p.y += 0.9 * p.s * f * DPR; p.x += Math.sin(now / 1200 + p.p) * 0.5 * DPR; }
    else if (k === 'leaves') { p.y += 1.2 * p.s * f * DPR; p.x += Math.sin(now / 700 + p.p) * 1.2 * DPR; }
    if (p.y > VH + 10) { p.y = -10; p.x = Math.random() * VW; }
    if (p.x < -20) p.x = VW + 10; if (p.x > VW + 20) p.x = -10;
  }
}
function drawWeather() {
  const k = weather.kind;
  if (!k) return;
  if (k === 'fog') {
    const g = ctx.createLinearGradient(0, 0, VW, VH);
    g.addColorStop(0, 'rgba(200,210,200,0.32)'); g.addColorStop(0.5, 'rgba(200,210,200,0.12)'); g.addColorStop(1, 'rgba(200,210,200,0.34)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    return;
  }
  if (k === 'sand') { ctx.fillStyle = 'rgba(230,200,140,0.18)'; ctx.fillRect(0, 0, VW, VH); }
  for (const p of weather.parts) {
    if (k === 'rain') { ctx.strokeStyle = 'rgba(180,210,255,0.55)'; ctx.lineWidth = DPR; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3 * DPR, p.y + 12 * DPR); ctx.stroke(); }
    else if (k === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(p.x, p.y, 2.5 * DPR * p.s, 2.5 * DPR * p.s); }
    else if (k === 'sand') { ctx.fillStyle = 'rgba(210,170,100,0.6)'; ctx.fillRect(p.x, p.y, 3 * DPR, DPR); }
    else if (k === 'ash') { ctx.fillStyle = 'rgba(90,80,80,0.7)'; ctx.fillRect(p.x, p.y, 2 * DPR, 2 * DPR); if (p.p > 5.4) { ctx.fillStyle = 'rgba(255,140,40,0.8)'; ctx.fillRect(p.x + 3, p.y, 2 * DPR, 2 * DPR); } }
    else if (k === 'leaves') { ctx.fillStyle = p.p > 3 ? '#d9862a' : '#6cab4f'; ctx.fillRect(p.x, p.y, 4 * DPR, 2 * DPR); }
  }
}

// ---------------- LUCES DE NOCHE ----------------
const lightCanvas = document.createElement('canvas');
function drawLighting() {
  const dk = darkness();
  if (dk <= 0.01) return;
  const S = 4; // a menor resolución (más rápido y más suave)
  lightCanvas.width = Math.ceil(VW / S); lightCanvas.height = Math.ceil(VH / S);
  const g = lightCanvas.getContext('2d');
  g.fillStyle = `rgba(12,14,40,${dk})`;
  g.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
  g.globalCompositeOperation = 'destination-out';
  const L = (wx, wy, r, a) => {
    const sx = (wx - cam.x) * ZOOM / S, sy = (wy - cam.y) * ZOOM / S, sr = r * ZOOM / S;
    if (sx < -sr || sy < -sr || sx > lightCanvas.width + sr || sy > lightCanvas.height + sr) return;
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  };
  L(player.x, player.y - 12, 70, 0.75);
  const warm = [];
  for (const o of MAP.objsIn(cam.x - 100, cam.y - 100, cam.x + cam.w + 100, cam.y + cam.h + 160)) {
    const d = OBJ_DEF[o.type];
    if (d && d.light) { L(o.x, o.y + d.light.y, d.light.r, 1); warm.push([o.x, o.y + d.light.y, d.light.r * 0.6, d.light.c]); }
    if (o.type === 'building') { const doorX = o.b.tx * TS + Math.floor(o.b.w / 2) * TS + 16; L(doorX, o.y - 10, 60, 0.9); warm.push([doorX, o.y - 20, 40, '255,200,120']); }
  }
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCanvas, 0, 0, VW, VH);
  // halo cálido de las farolas
  ctx.globalCompositeOperation = 'lighter';
  for (const [wx, wy, r, c] of warm) {
    const sx = (wx - cam.x) * ZOOM, sy = (wy - cam.y) * ZOOM, sr = r * ZOOM;
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    gr.addColorStop(0, `rgba(${c},${0.28 * dk})`); gr.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = gr; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------------- DIBUJADO ----------------
function drawActor(a) {
  if (a.isItem) { drawItemBall(a); return; }
  if (a.custom) loadCustomSheet(a.custom);
  drawPerson(ctx, a.look, a.x, a.y, a.dir, a.moving ? a.frame : 0, a.custom);
  if (a.bubble) {
    const x = a.x, y = a.y - 40;
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, y - 10, 12, 14); ctx.strokeStyle = '#1d1a26'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 6, y - 10, 12, 14);
    ctx.fillStyle = '#e53935'; ctx.fillRect(x - 1.5, y - 8, 3, 7); ctx.fillRect(x - 1.5, y + 0, 3, 2.5);
  }
  if (a.marker && !a.hidden) { ctx.fillStyle = '#ffd54f'; const y = a.y - 42 + Math.sin(now / 250) * 2; ctx.beginPath(); ctx.moveTo(a.x - 5, y); ctx.lineTo(a.x + 5, y); ctx.lineTo(a.x, y + 6); ctx.fill(); }
}
function drawItemBall(it) {
  const b = Math.sin(now / 250) * 1.5, x = it.x, y = it.y - 8 + b;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(it.x, it.y - 1, 6, 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x, y, 6, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#1d1a26'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill();
}

function renderWorld() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (R3.ok) {
    ctx.clearRect(0, 0, VW, VH);
    render3DWorld(frameDt);
    if (flashHeal && now - flashHeal < 1000) { ctx.fillStyle = `rgba(255,255,255,${0.5 * Math.abs(Math.sin((now - flashHeal) / 160))})`; ctx.fillRect(0, 0, VW, VH); }
    drawBanner();
    return;
  }
  ctx.fillStyle = MAP.outdoor ? TILE_COLOR[T.DEEP] : '#0b0a12';
  ctx.fillRect(0, 0, VW, VH);
  cam = cameraFor(MAP, player.x, player.y - 16);
  const actors = MAP.npcs.concat([player]);
  for (const it of MAP.items) if (!G.picked[it.id]) actors.push(Object.assign({ isItem: true }, it));
  renderMap(MAP, cam, actors);
  drawWeather();
  drawLighting();
  if (flashHeal && now - flashHeal < 1000) { ctx.fillStyle = `rgba(255,255,255,${0.5 * Math.abs(Math.sin((now - flashHeal) / 160))})`; ctx.fillRect(0, 0, VW, VH); }
  drawBanner();
}

function drawBanner() {
  if (!banner) return;
  const t = now - banner.t0;
  if (t > 2800) { banner = null; return; }
  const k = t < 300 ? t / 300 : t > 2500 ? (2800 - t) / 300 : 1;
  const s = DPR;
  ctx.font = `bold ${22 * s}px Trebuchet MS, sans-serif`;
  const w = ctx.measureText(banner.text).width + 60 * s, x = (VW - w) / 2, y = VH * 0.16 - 20 * s * (1 - k);
  ctx.globalAlpha = k;
  ctx.fillStyle = 'rgba(18,17,30,0.85)'; roundRect(ctx, x, y, w, 46 * s, 14 * s); ctx.fill();
  ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2.5 * s; ctx.stroke();
  ctx.fillStyle = '#ffd54f'; ctx.textAlign = 'center'; ctx.fillText(banner.text, VW / 2, y + 31 * s);
  ctx.globalAlpha = 1;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------------- HUD ----------------
function updateHud() {
  if (STATE === 'TITLE' || !MAP) return;
  $('hud-place').textContent = placeName(MAP, player.x, player.y);
  const [h, m] = clock();
  $('hud-time').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${isNight() ? '🌙' : '☀️'}`;
  $('hud-quest').textContent = typeof questText === 'function' ? questText() : '';
  drawMinimap($('minimap'), MAP, player.x, player.y);
}
function showWorldUI(on) {
  $('hud').classList.toggle('hidden', !on);
  $('touch').classList.toggle('hidden', !on || !isTouch());
}

// ---------------- BUCLE ----------------
let frameDt = 16;
function frame(ts) {
  const dt = lastT ? Math.min(50, ts - lastT) : 16;
  lastT = ts; now = ts; frameDt = dt;
  if (STATE !== 'TITLE') update(dt);
  if (STATE === 'BATTLE') renderBattle();
  else if (STATE === 'TITLE') renderTitle();
  else if (MAP) renderWorld();
  if (STATE !== 'TITLE' && now - hudT > 250) { hudT = now; updateHud(); }
  requestAnimationFrame(frame);
}

// A/B según el estado
function setWorldControls() {
  onA = () => { if (STATE === 'WORLD' && !busy) interact(); };
  onB = () => {};
}

// ---------------- ARRANQUE ----------------
window.addEventListener('load', () => {
  WORLD = generateWorld();
  setupStory(WORLD);
  init3D();
  initJoystick();
  initUI();
  showTitle();
  requestAnimationFrame(frame);
});
