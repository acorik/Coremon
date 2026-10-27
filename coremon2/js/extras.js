// ============================================================
// COREMON — Extras de la 2.1: estadísticas, logros, pesca, vuelo rápido
// entre sitios visitados, variocolor y autoguardado.
// ============================================================

// ---------------- ESTADÍSTICAS ----------------
function stat(k, n) {
  if (!G) return;
  G.stats = G.stats || {};
  G.stats[k] = (G.stats[k] || 0) + (n == null ? 1 : n);
}
const st = k => (G && G.stats && G.stats[k]) || 0;
const missionsDone = () => Object.values(G.missions || {}).filter(x => x && x.s === 'done').length;

// ---------------- VARIOCOLOR ----------------
function shinyRate() { return (G && G.bag.amuleto ? 3 : 1) / 128; }
function rollShiny() {
  if (G && G.flags.devShiny) { G.flags.devShiny = false; return true; }
  return Math.random() < shinyRate();
}

// ---------------- LOGROS ----------------
// prog() devuelve [actual, objetivo]; la recompensa se cobra sola al desbloquear
const caughtN = () => DEX_ORDER.filter(i => G.caught[i]).length;
const seenN = () => DEX_ORDER.filter(i => G.seen[i]).length;
const allMons = () => G.team.concat(G.box);
const LOGROS = [
  { id: 'cap1', icon: '🃏', name: 'Primera captura', desc: 'Captura un Coremon salvaje.', prog: () => [st('captures'), 1], money: 500 },
  { id: 'cap25', icon: '📚', name: 'Coleccionista', desc: 'Captura 25 Coremon.', prog: () => [st('captures'), 25], money: 3000 },
  { id: 'cap75', icon: '🗃️', name: 'Archivista', desc: 'Captura 75 Coremon.', prog: () => [st('captures'), 75], money: 10000 },
  { id: 'seen100', icon: '👀', name: 'Ojo avizor', desc: 'Ve 100 especies distintas.', prog: () => [seenN(), 100], items: { amuleto: 1 } },
  { id: 'dex100', icon: '📘', name: 'Coredex de oro', desc: 'Captura 100 especies distintas.', prog: () => [caughtN(), 100], money: 25000 },
  { id: 'dexAll', icon: '🏛️', name: 'Coredex completa', desc: 'Captura todas las especies.', prog: () => [caughtN(), DEX_ORDER.length], money: 100000 },
  { id: 'badge1', icon: '🥉', name: 'Primera medalla', desc: 'Gana tu primera medalla de gimnasio.', prog: () => [G.badges.length, 1], money: 1000 },
  { id: 'badge4', icon: '🥈', name: 'A mitad de camino', desc: 'Consigue 4 medallas.', prog: () => [G.badges.length, 4], money: 4000 },
  { id: 'badge8', icon: '🥇', name: 'Ocho de ocho', desc: 'Consigue las 8 medallas de Iberión.', prog: () => [G.badges.length, 8], money: 10000 },
  { id: 'champ', icon: '🏆', name: 'Campeón de Iberión', desc: 'Vence a la Liga Coremon.', prog: () => [G.flags.champion ? 1 : 0, 1], money: 30000 },
  { id: 'legend', icon: '🐉', name: 'Leyenda viva', desc: 'Captura un Coremon legendario.', prog: () => [LEGENDS.some(l => G.caught[l[0]]) ? 1 : 0, 1], money: 15000 },
  { id: 'shiny1', icon: '✨', name: '¡Qué colores!', desc: 'Encuentra un Coremon variocolor.', prog: () => [st('shinies'), 1], money: 3000 },
  { id: 'shinyCap', icon: '🌈', name: 'Brillo en la caja', desc: 'Captura un Coremon variocolor.', prog: () => [st('shinyCaught'), 1], money: 8000 },
  { id: 'fish1', icon: '🎣', name: '¡Ha picado!', desc: 'Pesca un Coremon.', prog: () => [st('fish'), 1], money: 800 },
  { id: 'fish20', icon: '🐟', name: 'Lobo de mar', desc: 'Pesca 20 Coremon.', prog: () => [st('fish'), 20], money: 6000 },
  { id: 'evo1', icon: '🔆', name: '¿Qué le pasa?', desc: 'Haz evolucionar a un Coremon.', prog: () => [st('evos'), 1], money: 1000 },
  { id: 'evo15', icon: '🧬', name: 'Criador experto', desc: 'Haz evolucionar 15 Coremon.', prog: () => [st('evos'), 15], money: 8000 },
  { id: 'trainers30', icon: '⚔️', name: 'Entrenador curtido', desc: 'Vence a 30 entrenadores.', prog: () => [st('trainers'), 30], money: 6000 },
  { id: 'wild100', icon: '🌾', name: 'Rey de la hierba', desc: 'Vence a 100 Coremon salvajes.', prog: () => [st('wins'), 100], money: 6000 },
  { id: 'lv50', icon: '💪', name: 'Nivel 50', desc: 'Sube un Coremon al nivel 50.', prog: () => [Math.max(0, ...allMons().map(m => m.level)), 50], money: 5000 },
  { id: 'lv100', icon: '💯', name: 'Nivel 100', desc: 'Sube un Coremon al nivel 100.', prog: () => [Math.max(0, ...allMons().map(m => m.level)), 100], money: 50000 },
  { id: 'cities', icon: '🧭', name: 'Trotamundos', desc: 'Visita todas las ciudades.', prog: () => [CITIES.filter(c => G.flags['visit_' + c.id]).length, CITIES.length], money: 5000 },
  { id: 'villages', icon: '🏡', name: 'De pueblo en pueblo', desc: 'Visita todos los pueblos y aldeas.', prog: () => [VILLAGES.filter(v => G.flags['visit_' + v.id]).length, VILLAGES.length], money: 5000 },
  { id: 'fly5', icon: '✈️', name: 'Pasajero frecuente', desc: 'Usa el vuelo rápido 5 veces.', prog: () => [st('flights'), 5], money: 1500 },
  { id: 'moto', icon: '🏍️', name: 'Motero', desc: 'Recorre 3000 casillas en moto.', prog: () => [Math.floor(st('motoDist')), 3000], money: 4000 },
  { id: 'walk', icon: '👟', name: 'Suela gastada', desc: 'Recorre 20.000 casillas en total.', prog: () => [Math.floor(st('dist')), 20000], money: 4000 },
  { id: 'mis10', icon: '📋', name: 'Buena gente', desc: 'Completa 10 misiones.', prog: () => [missionsDone(), 10], money: 3000 },
  { id: 'mis40', icon: '🎖️', name: 'Héroe de Iberión', desc: 'Completa 40 misiones.', prog: () => [missionsDone(), 40], money: 15000 },
  { id: 'rich', icon: '💎', name: 'Millonario', desc: 'Junta 100.000 monedas.', prog: () => [G.money, 100000], money: 0, items: { cromoMaestro: 1 } },
  { id: 'darts', icon: '🎯', name: 'Francotirador de espuma', desc: 'Deja K.O. a 10 personas a dardazos (por la coña).', prog: () => [st('kos'), 10], money: 0, items: { caramelo: 1 } }
];
const logroQueue = [];
function checkLogros() {
  if (!G || STATE === 'TITLE') return;
  G.ach = G.ach || {};
  for (const L of LOGROS) {
    if (G.ach[L.id]) continue;
    const [c, max] = L.prog();
    if (c < max) continue;
    G.ach[L.id] = Date.now();
    if (L.money) G.money += L.money;
    for (const [k, q] of Object.entries(L.items || {})) G.bag[k] = (G.bag[k] || 0) + q;
    logroQueue.push(L);
  }
  if (logroQueue.length && STATE === 'WORLD' && now - (checkLogros.last || 0) > 3600) {
    const L = logroQueue.shift();
    checkLogros.last = now;
    sfx('trophy');
    const rw = [L.money ? L.money + ' 💰' : '', ...Object.entries(L.items || {}).map(([k, q]) => `${q} × ${ITEMS[k].name}`)].filter(Boolean).join(', ');
    toast(`🏆 Logro: ${L.name}${rw ? ' · +' + rw : ''}`, 3400);
  }
}
function openLogros() {
  openPanel('Logros', body => {
    G.ach = G.ach || {};
    const got = LOGROS.filter(L => G.ach[L.id]).length;
    body.appendChild(el('p', 'muted', `Desbloqueados: ${got}/${LOGROS.length}`));
    LOGROS.forEach(L => {
      const done = !!G.ach[L.id], [c, max] = L.prog();
      const r = el('div', 'row' + (done ? ' logro-done' : ''));
      const ic = el('span', 'logro-ic', L.icon); if (!done) ic.style.filter = 'grayscale(1) opacity(0.55)';
      r.appendChild(ic);
      const g = el('div', 'grow'), top = el('div', 'top');
      top.appendChild(el('b', null, L.name));
      top.appendChild(el('span', 'muted', done ? '✅' : `${Math.min(c, max).toLocaleString('es')}/${max.toLocaleString('es')}`));
      g.appendChild(top);
      const rw = [L.money ? L.money + ' 💰' : '', ...Object.entries(L.items || {}).map(([k, q]) => `${q} × ${ITEMS[k].name}`)].filter(Boolean).join(', ');
      g.appendChild(el('div', 'muted', L.desc + (rw ? ' Premio: ' + rw + '.' : '')));
      const bar = el('div', 'bar'), f = el('div', 'xp'); f.style.width = Math.min(100, c / max * 100) + '%'; bar.appendChild(f); g.appendChild(bar);
      r.appendChild(g);
      body.appendChild(r);
    });
    body.appendChild(el('h4', null, '📊 Estadísticas'));
    const sg = el('div', 'stat-grid');
    [['Capturas', st('captures')], ['Salvajes vencidos', st('wins')], ['Entrenadores vencidos', st('trainers')], ['Variocolor vistos', st('shinies')],
     ['Coremon pescados', st('fish')], ['Evoluciones', st('evos')], ['Vuelos', st('flights')], ['Misiones', missionsDone()],
     ['Casillas andadas', Math.floor(st('dist')).toLocaleString('es')], ['Casillas en moto', Math.floor(st('motoDist')).toLocaleString('es')]].forEach(([k, v]) => {
      const s = el('div', 'stat'); s.appendChild(el('b', null, v)); s.appendChild(document.createTextNode(k)); sg.appendChild(s);
    });
    body.appendChild(sg);
  });
}

// ---------------- VUELO RÁPIDO ----------------
// Tras la primera medalla, el Taxi Aéreo de Iberión te lleva a cualquier
// ciudad o pueblo que ya hayas visitado.
const canFly = () => G.badges.length >= 1 || G.flags.dev;
function flyPlaces() { return CITIES.concat(VILLAGES).filter(p => G.flags['visit_' + p.id]); }
async function flyTo(p) {
  closePanel();
  busy = true;
  sfx('whoosh');
  await fadeOut();
  const [x, y] = freeSpot(WORLD, p.x, p.y + 2);
  setMap('world', x * TS + 16, y * TS + 26, 'down');
  stat('flights');
  await wait(250);
  await fadeIn();
  busy = false;
  toast(`✈️ Aterrizas en ${p.name}.`);
}
function buildFlyList(body) {
  body.appendChild(el('h4', null, '✈️ Vuelo rápido'));
  if (!canFly()) { body.appendChild(el('p', 'muted', 'El Taxi Aéreo de Iberión empieza a funcionar cuando consigues la primera medalla.')); return; }
  if (STATE === 'BATTLE') return;
  const list = flyPlaces();
  if (!list.length) { body.appendChild(el('p', 'muted', 'Todavía no has visitado ningún sitio.')); return; }
  const grid = el('div', 'devgrid');
  list.forEach(p => { const b = el('button', '', (p.gym ? '🏙️ ' : '🏡 ') + p.name); b.onclick = () => flyTo(p); grid.appendChild(b); });
  body.appendChild(grid);
  body.appendChild(el('p', 'muted', 'Toca un sitio para volar allí. Solo aparecen los que ya has visitado.'));
}

// ---------------- PESCA ----------------
// Con la caña, delante del agua: lanza, espera a que pique y pulsa A a tiempo.
function facingWater() {
  if (!MAP || !MAP.outdoor || !G.bag.cana) return false;
  for (const d of [20, 34]) {
    const [fx, fy] = frontPoint(d);
    const t = MAP.tileAt(Math.floor(fx / TS), Math.floor(fy / TS));
    if (t === T.WATER || t === T.DEEP) return true;
  }
  return false;
}
function fishMon() {
  const reg = CITIES[MAP.regionIdx(Math.floor(player.x / TS), Math.floor(player.y / TS))];
  const pool = WILD[reg.id].pool.concat(WILD[reg.id].dark).filter(id => SPECIES[id] && SPECIES[id].type === 'agua');
  const all = Object.values(SPECIES).filter(sp => sp.type === 'agua' && !sp.legendary && (sp.stage || 0) === 0).map(sp => sp.id);
  const list = pool.length && Math.random() < 0.7 ? pool : all;
  const lv = clamp(reg.lv[0] + Math.floor(Math.random() * (reg.lv[1] - reg.lv[0] + 3)), 3, 100);
  const sp = list[Math.floor(Math.random() * list.length)];
  return { species: evolveForLevel(sp, lv), level: lv, shiny: rollShiny() };
}
async function goFish() {
  busy = true;
  G.ride = G.ride === 'bici' ? null : G.ride;
  sfx('splash');
  toast('🎣 Lanzas la caña... Espera a que pique y pulsa A.', 2600);
  let pressed = false, early = false, bite = false;
  onA = () => { if (bite) pressed = true; else early = true; };
  onB = () => { early = true; };
  const waitMs = 1400 + Math.random() * 3200, t0 = performance.now();
  while (performance.now() - t0 < waitMs && !early) await wait(40);
  if (!early) {
    bite = true; player.bubble = now; sfx('bite');
    toast('❗ ¡Ha picado! ¡Pulsa A YA!', 1100);
    const t1 = performance.now();
    while (performance.now() - t1 < 950 && !pressed) await wait(20);
    player.bubble = null;
  }
  setWorldControls();
  if (early) { toast('Recoges el sedal demasiado pronto. No ha picado nada.'); busy = false; return; }
  if (!pressed) { sfx('bad'); toast('Se ha escapado... ¡Hay que ser más rápido!'); busy = false; return; }
  const r = Math.random();
  if (r < 0.07) { sfx('bad'); toast('🥾 Has pescado... una bota vieja. Dentro hay 50 monedas.'); G.money += 50; busy = false; return; }
  if (r < 0.11) { sfx('item'); G.bag.cromoOro = (G.bag.cromoOro || 0) + 1; toast('🌟 ¡Un Cromo dorado enganchado en el anzuelo!'); busy = false; return; }
  if (!G.team.some(m => m.hp > 0)) { toast('Tus Coremon están debilitados. Mejor ve a curarlos.'); busy = false; return; }
  const w = fishMon();
  stat('fish');
  const res = await startBattle({ kind: 'wild', mon: w, fished: true, scene: 'coast', region: CITIES.indexOf(CITIES[MAP.regionIdx(Math.floor(player.x / TS), Math.floor(player.y / TS))]) });
  busy = false;
  return res;
}

// ---------------- AUTOGUARDADO ----------------
let autosaveT = 0;
function updateExtras(dt) {
  if (!G || STATE === 'TITLE') return;
  autosaveT += dt;
  if (SETTINGS.autosave && autosaveT > 90000 && STATE === 'WORLD' && !busy) {
    autosaveT = 0; saveGame(true);
    const e = $('autosave'); if (e) { e.classList.remove('hidden'); clearTimeout(updateExtras.t); updateExtras.t = setTimeout(() => e.classList.add('hidden'), 1400); }
  }
}

// ---------------- REGALO DIARIO ----------------
// La primera vez que juegas cada día, Olaia te manda un paquete por correo.
function dailyGift() {
  if (!G) return;
  const today = new Date().toISOString().slice(0, 10);
  if (G.lastDaily === today) return;
  const first = !G.lastDaily;
  G.lastDaily = today;
  if (first && !G.team.length) return;
  const pool = [['cromoOro', 3], ['banquete', 1], ['caramelo', 1], ['elixir', 1], ['cromoPlatino', 1], ['repelente', 2], ['botiquin', 1]];
  const [k, q] = pool[Math.floor(Math.random() * pool.length)];
  G.bag[k] = (G.bag[k] || 0) + q; G.money += 500;
  stat('dailies');
  sfx('item');
  toast(`📬 Regalo diario de Olaia: ${q} × ${ITEMS[k].name} y 500 💰. ¡Vuelve mañana!`, 4200);
}
