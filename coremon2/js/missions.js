// ============================================================
// COREMON — Misiones libres. Cada ciudad y cada pueblo tiene un tablón 📋
// con encargos que se pueden hacer en cualquier orden: capturar, ganar
// combates, repartir paquetes, cazar reclutas fugados de CoraCorp, buscar
// objetos perdidos, contrarrelojes en moto o bici y completar la Coredex.
// ============================================================

const MISSIONS = [], MISSION = {};
const MTYPE_ICON = { capture: '🃏', wild: '🌿', deliver: '📦', bounty: '🦹', find: '🔍', race: '🏁', coredex: '📘' };

// medallas necesarias para llegar a cada casilla (las barreras cortan el paso)
function computeTiers(world) {
  const W = world.w, H = world.h, N = W * H, tier = new Uint8Array(N).fill(99);
  const gateAt = new Map();
  for (const o of world.objs) if (o.gate) gateAt.set(Math.floor(o.x / TS) + ',' + Math.floor((o.y - 2) / TS), o.req);
  const sx = Math.floor(world.startPos.x / TS), sy = Math.floor(world.startPos.y / TS);
  const buckets = [...Array(10)].map(() => []);
  tier[sy * W + sx] = 0; buckets[0].push(sy * W + sx);
  for (let b = 0; b < 10; b++) {
    const q = buckets[b];
    while (q.length) {
      const i = q.pop();
      if (tier[i] !== b) continue;
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const t = world.tiles[ny * W + nx];
        if (SOLID_T.has(t)) continue;
        const g = gateAt.get(nx + ',' + ny), nb = Math.max(b, g || 0);
        const ni = ny * W + nx;
        if (nb < tier[ni] && nb < 10) { tier[ni] = nb; buckets[nb].push(ni); }
      }
    }
  }
  world.tier = tier;
}
const tierAt = (x, y) => WORLD.tier ? WORLD.tier[y * WORLD.w + x] : 0;
function placeTier(p) {
  let best = 99;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) best = Math.min(best, tierAt(p.x + dx, p.y + dy));
  return best;
}
function placeRegion(p) { return p.village ? p.regionIdx : CITIES.indexOf(p); }

// casilla libre de la región, lejos del pueblo y accesible con las mismas medallas
function missionSpot(world, p, r, minD, maxD) {
  const ri = placeRegion(p), pt = placeTier(p);
  for (let k = 0; k < 200; k++) {
    const a = r() * Math.PI * 2, d = minD + r() * (maxD - minD);
    const x = Math.round(p.x + Math.cos(a) * d), y = Math.round(p.y + Math.sin(a) * d);
    if (world.regionIdx(x, y) !== ri || tierAt(x, y) > pt) continue;
    const t = world.tileAt(x, y);
    if (t === undefined || SOLID_T.has(t) || blockedAt(world, x * TS + 16, y * TS + 26)) continue;
    if (inCity(world, x * TS, y * TS)) continue;
    return [x, y];
  }
  return null;
}

function setupMissions(world) {
  computeTiers(world);
  MISSIONS.length = 0; for (const k in MISSION) delete MISSION[k];
  const places = CITIES.concat(VILLAGES);
  places.forEach(p => { p.tier = placeTier(p); });
  places.forEach(p => {
    const r = mulberry32(strSeed('mis:' + p.id));
    const ri = placeRegion(p), reg = CITIES[ri], lv = reg.lv;
    const types = ['capture', 'wild', 'deliver', 'bounty', 'find', 'race', 'coredex'];
    for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
    const pick = types.slice(0, p.village ? 3 : 4);
    pick.forEach((type, n) => {
      const id = `m_${p.id}_${n}`;
      const money = 300 + p.tier * 260 + Math.floor(r() * 4) * 50;
      const loot = ['cromoOro', 'cromoPlatino', 'banquete', 'elixir', 'botiquin', 'caramelo', 'repelente', 'tirita'];
      const reward = { money, items: { [loot[Math.floor(r() * Math.min(loot.length, 3 + p.tier))]]: 1 + Math.floor(r() * 2) } };
      const M = { id, place: p.id, type, tier: p.tier, reward, region: ri };
      if (type === 'capture') {
        const pool = WILD[reg.id].pool.map(s => SPECIES[s].type), ty = pool[Math.floor(r() * pool.length)];
        M.data = { type: ty, n: 1 + Math.floor(r() * 2) };
        M.title = `Coremon de tipo ${TYPE_LABEL[ty]}`;
        M.desc = `Captura ${M.data.n} Coremon de tipo ${TYPE_LABEL[ty]}. En ${reg.area} hay unos cuantos.`;
      } else if (type === 'wild') {
        M.data = { n: 4 + Math.floor(r() * 3) };
        M.title = `Plaga en ${reg.area}`;
        M.desc = `Los Coremon salvajes están revueltos. Gana ${M.data.n} combates contra Coremon salvajes en ${reg.area}.`;
      } else if (type === 'deliver') {
        const opts = places.filter(q => q !== p && q.tier <= p.tier);
        const q = opts[Math.floor(r() * opts.length)] || places[0];
        const [x, y] = freeSpot(world, q.x + 3, q.y + 1);
        M.data = { to: q.id, npc: 'rcv_' + id };
        M.title = `Paquete para ${q.name}`;
        M.desc = `Lleva este paquete a alguien que espera en ${q.name}. Te reconocerá por la caja.`;
        npcAt(world, { id: 'rcv_' + id, tx: x, ty: y, kind: 'talk', marker: true, cond: () => missionActive(id), script: async n => { await completeMission(id, ['¡Mi paquete! Llevaba días esperándolo. Muchísimas gracias.']); } });
      } else if (type === 'bounty') {
        const s = missionSpot(world, p, r, 22, 48);
        if (!s) return;
        M.data = { x: s[0], y: s[1] };
        M.title = 'Recluta fugado';
        M.desc = `Un recluta de CoraCorp se esconde cerca de ${p.name}. Encuéntralo (marcado en el mapa) y derrótalo.`;
        const tr = Object.assign(CORP.grunt('bty_' + id, lv[1] + 2, reg.id, 3), { name: 'Recluta fugado', prize: (lv[1] + 2) * 60, onWin: async () => { await completeMission(id); } });
        tr.intro = '¿Me has encontrado? ¡Nadie me lleva de vuelta a CoraCorp!';
        npcAt(world, { id: 'bty_' + id, tx: s[0], ty: s[1], look: LOOKS2.grunt, custom: 'recluta', dir: 'down', sight: 3, trainer: tr, marker: true, cond: () => missionActive(id) && !G.beaten['bty_' + id] });
      } else if (type === 'find') {
        const s = missionSpot(world, p, r, 18, 44);
        if (!s) return;
        const what = ['el reloj de mi abuelo', 'mi cartera', 'el anillo de mi madre', 'mis gafas de sol', 'la llave del almacén', 'un cuaderno de Coremon'][Math.floor(r() * 6)];
        M.data = { x: s[0], y: s[1], what };
        M.title = 'Objeto perdido';
        M.desc = `Alguien de ${p.name} ha perdido ${what} por los alrededores. Búscalo donde marca el mapa.`;
        world.items.push({ id: 'mqi_' + id, mission: id, x: s[0] * TS + 16, y: s[1] * TS + 26, item: null });
      } else if (type === 'race') {
        const opts = places.filter(q => q !== p && q.tier <= p.tier && Math.hypot(q.x - p.x, q.y - p.y) > 30);
        if (!opts.length) return;
        const q = opts.reduce((a, b) => Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b);
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        M.data = { to: q.id, secs: Math.ceil(d * 1.6 / 6.5) + 12 };
        M.title = `Contrarreloj a ${q.name}`;
        M.desc = `Llega a ${q.name} en menos de ${M.data.secs} segundos. Con bici o con moto es más fácil.`;
        M.reward.money += 400;
      } else if (type === 'coredex') {
        M.data = { n: 15 + p.tier * 12 + Math.floor(r() * 6) };
        M.title = 'Investigación Coremon';
        M.desc = `La Dra. Olaia necesita datos: registra ${M.data.n} especies distintas en tu Coredex (vistas o capturadas).`;
      }
      // a veces el premio es un Coremon de otra región
      if (r() < 0.22) { const other = CITIES[Math.floor(r() * CITIES.length)]; const sp = WILD[other.id].pool[Math.floor(r() * WILD[other.id].pool.length)]; M.reward.mon = [sp, Math.max(5, lv[0] - 2)]; }
      MISSIONS.push(M); MISSION[id] = M;
    });
  });
}

// ---------------- ESTADO ----------------
function mstate(id) { G.missions = G.missions || {}; return G.missions[id]; }
function missionActive(id) { const s = G && G.missions && G.missions[id]; return !!(s && s.s === 'active'); }
function missionDone(id) { const s = G && G.missions && G.missions[id]; return !!(s && s.s === 'done'); }
function activeMissions() { return MISSIONS.filter(m => missionActive(m.id)); }

function acceptMission(id) {
  const M = MISSION[id];
  G.missions = G.missions || {};
  if (activeMissions().length >= 5) { toast('Ya llevas 5 misiones. Termina o abandona alguna.'); return false; }
  G.missions[id] = { s: 'active', p: 0, t0: Date.now() };
  if (M.type === 'deliver') G.bag.paquete = (G.bag.paquete || 0) + 1;
  G.track = id;
  sfx('quest');
  toast(`${MTYPE_ICON[M.type]} Misión aceptada: ${M.title}`, 2600);
  refreshNpcs();
  if (M.type === 'coredex') checkCoredexMissions();
  saveGame(true);
  return true;
}
function abandonMission(id) {
  const M = MISSION[id];
  if (M.type === 'deliver' && G.bag.paquete) { G.bag.paquete--; if (!G.bag.paquete) delete G.bag.paquete; }
  delete G.missions[id];
  if (G.track === id) G.track = null;
  refreshNpcs();
}
async function completeMission(id, lines) {
  const M = MISSION[id];
  if (!M || missionDone(id)) return;
  if (M.type === 'deliver' && G.bag.paquete) { G.bag.paquete--; if (!G.bag.paquete) delete G.bag.paquete; }
  G.missions[id] = { s: 'done' };
  if (G.track === id) G.track = (activeMissions()[0] || {}).id || null;
  sfx('quest');
  const got = [`${M.reward.money} 💰`];
  G.money += M.reward.money;
  for (const [k, q] of Object.entries(M.reward.items || {})) { G.bag[k] = (G.bag[k] || 0) + q; got.push(`${q} × ${ITEMS[k].name}`); }
  if (M.reward.mon) { giveMon(M.reward.mon[0], M.reward.mon[1]); got.push(`¡${SPECIES[M.reward.mon[0]].name}!`); }
  refreshNpcs();
  if (lines) await say(lines);
  await say([`✅ ¡Misión completada: ${M.title}!`, 'Recompensa: ' + got.join(', ') + '.']);
  saveGame(true);
}
// eventos que pueden hacer avanzar misiones
function missionEvent(kind, data) {
  if (!G) return;
  for (const M of activeMissions()) {
    const st = G.missions[M.id];
    if (kind === 'capture' && M.type === 'capture' && SPECIES[data.species].type === M.data.type) {
      st.p++; if (st.p >= M.data.n) completeMission(M.id); else toast(`${MTYPE_ICON.capture} ${M.title}: ${st.p}/${M.data.n}`);
    }
    if (kind === 'wild' && M.type === 'wild' && data.region === M.region) {
      st.p++; if (st.p >= M.data.n) completeMission(M.id); else toast(`${MTYPE_ICON.wild} ${M.title}: ${st.p}/${M.data.n}`);
    }
  }
  if (kind === 'capture' || kind === 'seen') checkCoredexMissions();
}
function dexCount() { return DEX_ORDER.filter(i => G.seen[i] || G.caught[i]).length; }
function checkCoredexMissions() {
  for (const M of activeMissions()) if (M.type === 'coredex' && dexCount() >= M.data.n) completeMission(M.id);
}
// contrarrelojes: se comprueban en cada fotograma
function updateMissions() {
  if (!G || !G.missions || busy || STATE !== 'WORLD') return;
  for (const M of activeMissions()) {
    if (M.type !== 'race') continue;
    const st = G.missions[M.id], left = M.data.secs - (Date.now() - st.t0) / 1000;
    const q = placeById(M.data.to);
    if (MAP === WORLD && Math.abs(player.x / TS - q.x) < (q.w || 20) / 2 && Math.abs(player.y / TS - q.y) < (q.h || 14) / 2) { completeMission(M.id, [`¡Has llegado a ${q.name} con ${Math.ceil(left)} segundos de margen!`]); continue; }
    if (left <= 0) { delete G.missions[M.id]; if (G.track === M.id) G.track = null; sfx('bad'); toast(`⏱️ Se acabó el tiempo: ${M.title}. Puedes volver a intentarlo en el tablón.`, 3200); }
  }
}

// ---------------- OBJETIVO EN EL MAPA ----------------
function missionTarget(M) {
  if (!M) return null;
  const d = M.data || {};
  if (M.type === 'deliver') { const n = WORLD.npcs.find(a => a.id === d.npc); return n ? { x: n.x / TS, y: n.y / TS } : null; }
  if (M.type === 'bounty' || M.type === 'find') return { x: d.x + 0.5, y: d.y + 0.5 };
  if (M.type === 'race') { const q = placeById(d.to); return { x: q.x, y: q.y }; }
  if (M.type === 'wild' || M.type === 'capture') { const c = CITIES[M.region]; return null; }
  return null;
}
function trackedMission() { return G && G.track && missionActive(G.track) ? MISSION[G.track] : null; }
function missionHudText() {
  const M = trackedMission();
  if (!M) return '';
  const st = G.missions[M.id];
  let t = `${MTYPE_ICON[M.type]} ${M.title}`;
  if (M.type === 'capture' || M.type === 'wild') t += ` (${st.p}/${M.data.n})`;
  if (M.type === 'coredex') t += ` (${dexCount()}/${M.data.n})`;
  if (M.type === 'race') t += ` · ⏱️ ${Math.max(0, Math.ceil(M.data.secs - (Date.now() - st.t0) / 1000))} s`;
  const tg = missionTarget(M);
  if (tg && MAP === WORLD) {
    const dx = tg.x - player.x / TS, dy = tg.y - player.y / TS, d = Math.hypot(dx, dy);
    const arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
    t += ` · ${Math.round(d * 2)} m ${arrows[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8]}`;
  }
  return t;
}
function drawMissionMarks(g, toX, toY) {
  for (const M of activeMissions()) {
    const tg = missionTarget(M);
    if (!tg) continue;
    const [x, y] = [toX(tg.x), toY(tg.y)];
    g.fillStyle = M.id === G.track ? '#00e5ff' : '#80deea';
    g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 6, y); g.lineTo(x, y + 7); g.lineTo(x - 6, y); g.closePath(); g.fill();
    g.strokeStyle = '#06303a'; g.lineWidth = 1.5; g.stroke();
  }
}

// ---------------- INTERFAZ ----------------
function openBoard(placeId) {
  const p = placeById(placeId);
  openPanel(`📋 Tablón de ${p.name}`, body => {
    body.appendChild(el('p', 'muted', 'Encargos de la gente de la zona. Puedes llevar hasta 5 a la vez y hacerlos cuando quieras.'));
    MISSIONS.filter(m => m.place === placeId).forEach(M => {
      const r = el('div', 'row');
      r.appendChild(el('span', null, MTYPE_ICON[M.type])); r.firstChild.style.fontSize = '26px';
      const g = el('div', 'grow'), top = el('div', 'top');
      top.appendChild(el('b', null, M.title));
      top.appendChild(el('span', null, `${M.reward.money} 💰${M.reward.mon ? ' + 🎁' : ''}`));
      g.appendChild(top); g.appendChild(el('div', 'muted', M.desc));
      r.appendChild(g);
      const b = el('button', 'pbtn', missionDone(M.id) ? '✔ Hecha' : missionActive(M.id) ? 'Abandonar' : 'Aceptar');
      b.disabled = missionDone(M.id);
      b.onclick = e => { e.stopPropagation(); if (missionActive(M.id)) abandonMission(M.id); else acceptMission(M.id); openBoard(placeId); };
      r.appendChild(b);
      body.appendChild(r);
    });
  });
}
function openMissions() {
  openPanel('Misiones', body => {
    const act = activeMissions(), done = MISSIONS.filter(m => missionDone(m.id)).length;
    body.appendChild(el('p', 'muted', `Completadas: ${done}/${MISSIONS.length}. Busca los tablones 📋 junto a los Centros Coremon de ciudades y pueblos.`));
    if (!act.length) body.appendChild(el('p', null, 'No llevas ninguna misión ahora mismo.'));
    act.forEach(M => {
      const r = el('div', 'row');
      r.appendChild(el('span', null, MTYPE_ICON[M.type])); r.firstChild.style.fontSize = '26px';
      const g = el('div', 'grow'), top = el('div', 'top');
      top.appendChild(el('b', null, (G.track === M.id ? '🎯 ' : '') + M.title)); top.appendChild(el('span', 'muted', placeById(M.place).name));
      g.appendChild(top); g.appendChild(el('div', 'muted', M.desc));
      r.appendChild(g);
      const b = el('button', 'pbtn', G.track === M.id ? 'Siguiendo' : 'Seguir');
      b.onclick = e => { e.stopPropagation(); G.track = M.id; openMissions(); };
      r.appendChild(b);
      const x = el('button', 'pbtn', '✕');
      x.onclick = e => { e.stopPropagation(); abandonMission(M.id); openMissions(); };
      r.appendChild(x);
      body.appendChild(r);
    });
  });
}
ACTIONS.board = o => openBoard(o.place);
