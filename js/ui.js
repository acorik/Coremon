// ============================================================
// COREMON - Pantalla inferior (táctil): menús, mochila, equipo...
// ============================================================

const touch = {
  title: document.getElementById('touch-title'),
  main: document.getElementById('touch-main'),
  panel: document.getElementById('touch-panel'),
  battle: document.getElementById('touch-battle')
};
const panelTitle = document.getElementById('panel-title');
const panelBody = document.getElementById('panel-body');
let panelStack = null;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function creatureCanvas(speciesId, size, opts) {
  const c = el('canvas', 'mini-sprite');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  drawCreature(g, speciesId, size * 0.06, size * 0.06, size * 0.88, opts || {});
  return c;
}

function hpBar(p) {
  const pct = Math.max(0, p.hp / p.stats.hp * 100);
  const wrap = el('div', 'hp-mini');
  const fill = el('div', 'hp-mini-fill ' + (pct > 50 ? 'hp-high' : pct > 20 ? 'hp-mid' : 'hp-low'));
  fill.style.width = pct + '%';
  wrap.appendChild(fill);
  return wrap;
}

function typeChip(type) {
  const s = el('span', 'type-chip', type ? TYPE_LABEL[type] : 'Normal');
  s.style.background = type ? TYPE_COLOR[type] : '#888';
  return s;
}

function showTouch(mode) {
  Object.entries(touch).forEach(([k, v]) => v.classList.toggle('hidden', k !== mode));
}

// ---------------- PANTALLA PRINCIPAL ----------------
function refreshTouch() {
  const map = MAPS[game.room];
  document.getElementById('loc-name').textContent = map ? map.name : '';
  document.getElementById('coins').textContent = game.coins;
  const bc = document.getElementById('badge-canvas');
  const g = bc.getContext('2d');
  g.clearRect(0, 0, bc.width, bc.height);
  ['efisica', 'mates', 'lengua', 'ciencias', 'ingles', 'arte', 'director', 'coindre'].forEach((id, i) => {
    drawBadge(g, 16 + i * 30, 15, i >= 6 ? 11 : 10, TRAINERS[id].badgeColor, game.badges.includes(id));
  });
  const strip = document.getElementById('team-strip');
  strip.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const p = game.team[i];
    const slot = el('div', 'team-slot' + (p ? '' : ' empty'));
    if (p) {
      slot.appendChild(creatureCanvas(p.species, 34));
      slot.appendChild(el('div', 'slot-lv', 'Nv' + p.level));
      slot.appendChild(hpBar(p));
      if (p.hp <= 0) slot.classList.add('ko');
      slot.addEventListener('click', () => openTeam(i));
    }
    strip.appendChild(slot);
  }
}

// ---------------- PANELES ----------------
function openPanel(title, build, opts) {
  opts = opts || {};
  if (!panelStack) panelStack = { prevState: STATE, prevMode: currentTouchMode() };
  if (STATE === 'OVERWORLD') STATE = 'MENU';
  panelTitle.textContent = title;
  panelBody.innerHTML = '';
  build(panelBody);
  document.getElementById('panel-back').classList.toggle('hidden', opts.closable === false);
  panelStack.onClose = opts.onClose;
  showTouch('panel');
}
function currentTouchMode() {
  return Object.keys(touch).find(k => !touch[k].classList.contains('hidden')) || 'main';
}
function closePanel() {
  if (!panelStack) return;
  const st = panelStack; panelStack = null;
  showTouch(st.prevMode === 'panel' ? 'main' : st.prevMode);
  if (STATE === 'MENU') STATE = st.prevState === 'MENU' ? 'OVERWORLD' : st.prevState;
  refreshTouch();
  if (st.onClose) st.onClose();
}

// ---------------- EQUIPO ----------------
function openTeam(focus) {
  openPanel('Equipo', body => {
    if (focus != null && game.team[focus]) { buildMonDetail(body, game.team[focus], focus); return; }
    game.team.forEach((p, i) => body.appendChild(monRow(p, () => openTeam(i))));
    if (!game.team.length) body.appendChild(el('p', 'muted', 'Todavía no tienes Coremon.'));
  });
}

function monRow(p, onClick, extra) {
  const row = el('div', 'mon-row' + (p.hp <= 0 ? ' ko' : ''));
  row.appendChild(creatureCanvas(p.species, 44));
  const info = el('div', 'mon-info');
  const top = el('div', 'mon-top');
  top.appendChild(el('b', null, SPECIES[p.species].name));
  top.appendChild(el('span', 'muted', ' Nv. ' + p.level));
  top.appendChild(typeChip(SPECIES[p.species].type));
  info.appendChild(top);
  info.appendChild(hpBar(p));
  info.appendChild(el('div', 'muted small', `PS ${Math.max(0, p.hp)}/${p.stats.hp}` + (extra ? ' · ' + extra : '')));
  row.appendChild(info);
  if (onClick) row.addEventListener('click', onClick);
  return row;
}

function buildMonDetail(body, p, idx) {
  const sp = SPECIES[p.species];
  const head = el('div', 'detail-head');
  head.appendChild(creatureCanvas(p.species, 84));
  const hi = el('div', 'mon-info');
  hi.appendChild(el('h3', null, sp.name));
  const t = el('div'); t.appendChild(typeChip(sp.type)); t.appendChild(el('span', 'muted', '  Nivel ' + p.level)); hi.appendChild(t);
  hi.appendChild(hpBar(p));
  hi.appendChild(el('div', 'muted small', `PS ${Math.max(0, p.hp)}/${p.stats.hp} · EXP ${p.exp}/${expToNext(p.level)}`));
  if (sp.evolvesTo) hi.appendChild(el('div', 'muted small', `Evoluciona a ${SPECIES[sp.evolvesTo].name} al nivel ${sp.evolveLevel}`));
  head.appendChild(hi);
  body.appendChild(head);
  const stats = el('div', 'stat-grid');
  [['Ataque', p.stats.atk], ['Defensa', p.stats.def], ['Velocidad', p.stats.spd], ['PS máx.', p.stats.hp]].forEach(([n, v]) => {
    const s = el('div', 'stat'); s.appendChild(el('span', 'muted small', n)); s.appendChild(el('b', null, v));
    const bar = el('div', 'stat-bar'); const f = el('div', 'stat-fill'); f.style.width = Math.min(100, v / 2.2) + '%'; bar.appendChild(f); s.appendChild(bar);
    stats.appendChild(s);
  });
  body.appendChild(stats);
  body.appendChild(el('h4', null, 'Movimientos'));
  p.moves.forEach(m => {
    const mv = MOVES[m.id];
    const r = el('div', 'move-line');
    r.style.borderLeftColor = mv.type ? TYPE_COLOR[mv.type] : '#888';
    r.appendChild(el('b', null, mv.name));
    r.appendChild(el('span', 'muted small', ` ${mv.type ? TYPE_LABEL[mv.type] : 'Normal'} · Pot ${mv.power} · Prec ${Math.round(mv.acc * 100)}% · PP ${m.pp}/${m.maxPp}`));
    body.appendChild(r);
  });
  const actions = el('div', 'btn-row');
  if (idx > 0) {
    const b = el('button', 'ds-btn', 'Poner primero');
    b.onclick = () => { game.team.splice(idx, 1); game.team.unshift(p); saveGame(); openTeam(0); };
    actions.appendChild(b);
  }
  const back = el('button', 'ds-btn alt', '← Equipo');
  back.onclick = () => openTeam();
  actions.appendChild(back);
  body.appendChild(actions);
}

// Elige un Coremon del equipo (para usar objetos, etc.)
function pickMon(title, cb, filter) {
  openPanel(title, body => {
    game.team.forEach(p => {
      const ok = !filter || filter(p);
      const row = monRow(p, ok ? () => cb(p) : null);
      if (!ok) row.classList.add('disabled');
      body.appendChild(row);
    });
  });
}

// ---------------- MOCHILA ----------------
function useItemOn(itemId, p) {
  const it = ITEMS[itemId];
  if (it.kind === 'heal') {
    if (p.hp <= 0) return null;
    if (p.hp >= p.stats.hp) return null;
    const before = p.hp; p.hp = Math.min(p.stats.hp, p.hp + it.amount);
    return `${SPECIES[p.species].name} recupera ${p.hp - before} PS.`;
  }
  if (it.kind === 'pp') {
    if (p.moves.every(m => m.pp >= m.maxPp)) return null;
    p.moves.forEach(m => m.pp = Math.min(m.maxPp, m.pp + it.amount));
    return `Los movimientos de ${SPECIES[p.species].name} recuperan PP.`;
  }
  if (it.kind === 'revive') {
    if (p.hp > 0) return null;
    p.hp = Math.floor(p.stats.hp / 2);
    return `¡${SPECIES[p.species].name} vuelve a estar en pie!`;
  }
  if (it.kind === 'level') {
    if (p.level >= 60) return null;
    const evo = levelUp(p);
    return `¡${SPECIES[p.species].name} sube al nivel ${p.level}!` + (evo ? ` (¡algo está pasando!)` : '');
  }
  return null;
}

function consumeItem(itemId) {
  game.bag[itemId]--;
  if (game.bag[itemId] <= 0) delete game.bag[itemId];
}

// ctx: { battle: true, onUsed(msg, itemId, target) }
function openBag(ctxOpts) {
  ctxOpts = ctxOpts || {};
  openPanel('Mochila', body => {
    const ids = Object.keys(game.bag).filter(k => game.bag[k] > 0);
    if (!ids.length) body.appendChild(el('p', 'muted', 'La mochila está vacía. Compra cosas en las máquinas del vestíbulo.'));
    ids.forEach(id => {
      const it = ITEMS[id];
      const row = el('div', 'item-row');
      const ic = el('span', 'item-icon'); ic.style.background = it.icon; row.appendChild(ic);
      const info = el('div', 'mon-info');
      const top = el('div', 'mon-top'); top.appendChild(el('b', null, it.name)); top.appendChild(el('span', 'qty', 'x' + game.bag[id]));
      info.appendChild(top); info.appendChild(el('div', 'muted small', it.desc));
      row.appendChild(info);
      row.addEventListener('click', () => useFromBag(id, ctxOpts));
      body.appendChild(row);
    });
  }, { onClose: ctxOpts.onCancel });
}

function useFromBag(id, ctxOpts) {
  const it = ITEMS[id];
  if (it.kind === 'capture') {
    if (!ctxOpts.battle) { toast('Solo puedes lanzar cromos en un combate contra un Coremon salvaje.'); return; }
    panelStack.onClose = null;
    closePanel();
    ctxOpts.onCapture(id);
    return;
  }
  const filter = it.kind === 'revive' ? (p => p.hp <= 0) : (p => p.hp > 0);
  pickMon('¿En quién usar ' + it.name + '?', p => {
    const msg = useItemOn(id, p);
    if (!msg) { toast('No tendría ningún efecto.'); return; }
    consumeItem(id);
    saveGame();
    if (ctxOpts.battle) { panelStack.onClose = null; closePanel(); ctxOpts.onUsed(msg); }
    else if (p.pendingEvo) {
      const evo = Object.assign({ mon: p }, p.pendingEvo);
      delete p.pendingEvo;
      closePanel(); toast(msg);
      afterBattle({ result:'win', evolutions:[evo] });
    }
    else { toast(msg); openBag(ctxOpts); refreshTouch(); }
  }, filter);
}

let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
}

// ---------------- TIENDA ----------------
function openShop() {
  openPanel('Máquina expendedora', body => {
    body.appendChild(el('p', 'muted', `Tienes ${game.coins} monedas.`));
    SHOP_STOCK.forEach(id => {
      const it = ITEMS[id];
      const row = el('div', 'item-row');
      const ic = el('span', 'item-icon'); ic.style.background = it.icon; row.appendChild(ic);
      const info = el('div', 'mon-info');
      const top = el('div', 'mon-top'); top.appendChild(el('b', null, it.name)); top.appendChild(el('span', 'qty', it.price + ' 💰'));
      info.appendChild(top); info.appendChild(el('div', 'muted small', it.desc + (game.bag[id] ? ` (tienes ${game.bag[id]})` : '')));
      row.appendChild(info);
      const btns = el('div', 'buy-btns');
      [1, 5].forEach(n => {
        const b = el('button', 'ds-btn small', 'x' + n);
        b.disabled = game.coins < it.price * n;
        b.onclick = e => {
          e.stopPropagation();
          game.coins -= it.price * n;
          game.bag[id] = (game.bag[id] || 0) + n;
          saveGame(); toast(`Has comprado ${n} x ${it.name}.`); openShop();
        };
        btns.appendChild(b);
      });
      row.appendChild(btns);
      body.appendChild(row);
    });
  });
}

// ---------------- TAQUILLAS (caja de Coremon) ----------------
function openBox() {
  openPanel('Taquillas de Coremon', body => {
    body.appendChild(el('p', 'muted small', 'Toca un Coremon para guardarlo o sacarlo. Máximo 6 en el equipo.'));
    body.appendChild(el('h4', null, `Equipo (${game.team.length}/6)`));
    game.team.forEach((p, i) => body.appendChild(monRow(p, () => {
      if (game.team.length <= 1) { toast('Necesitas al menos un Coremon en el equipo.'); return; }
      game.team.splice(i, 1); game.box.push(p); saveGame(); openBox();
    }, 'guardar →')));
    body.appendChild(el('h4', null, `Taquilla (${game.box.length})`));
    if (!game.box.length) body.appendChild(el('p', 'muted small', 'La taquilla está vacía.'));
    game.box.forEach((p, i) => body.appendChild(monRow(p, () => {
      if (game.team.length >= 6) { toast('Tu equipo ya tiene 6 Coremon.'); return; }
      game.box.splice(i, 1); game.team.push(p); saveGame(); openBox();
    }, '← sacar')));
  });
}

// ---------------- COREDEX ----------------
function openDex() {
  openPanel('Coredex', body => {
    const ids = Object.keys(SPECIES);
    const seen = ids.filter(i => game.seen[i]).length, caught = ids.filter(i => game.caught[i]).length;
    body.appendChild(el('p', 'muted', `Vistos: ${seen}/${ids.length} · Capturados: ${caught}/${ids.length}`));
    const gridEl = el('div', 'dex-grid');
    ids.forEach((id, n) => {
      const cell = el('div', 'dex-cell');
      cell.appendChild(creatureCanvas(id, 44, { silhouette: !game.seen[id] }));
      cell.appendChild(el('div', 'small', `${String(n + 1).padStart(3, '0')} ${game.seen[id] ? SPECIES[id].name : '???'}`));
      if (game.caught[id]) cell.appendChild(el('span', 'dex-caught', '●'));
      if (game.seen[id]) cell.addEventListener('click', () => toast(`${SPECIES[id].name} · Tipo ${TYPE_LABEL[SPECIES[id].type]}` + (SPECIES[id].evolvesTo ? ` · Evoluciona a ${SPECIES[SPECIES[id].evolvesTo].name}` : '')));
      gridEl.appendChild(cell);
    });
    body.appendChild(gridEl);
  });
}

// ---------------- ASCENSOR ----------------
function openElevator() {
  const cur = MAPS[game.room].floor;
  const n = academicBadgeCount(game.badges);
  openPanel('Ascensor', body => {
    body.appendChild(el('p', 'muted', `Insignias: ${n}/6. ¿A qué planta vamos?`));
    FLOORS.slice().reverse().forEach(f => {
      const unlocked = n >= f.needBadges;
      const b = el('button', 'ds-btn floor-btn', (f.id === cur ? '▶ ' : '') + f.name + (unlocked ? '' : `  🔒 ${f.needBadges} insignias`));
      b.disabled = !unlocked || f.id === cur;
      b.onclick = () => {
        panelStack.onClose = null; closePanel();
        rideElevator(f);
      };
      body.appendChild(b);
    });
  });
}

async function rideElevator(f) {
  STATE = 'CUTSCENE';
  await fadeTo(1, 250);
  shake = 1; await wait(500); shake = 0;
  const hubMap = MAPS[f.hub];
  enterRoom(f.hub, hubMap.spawn.x, hubMap.spawn.y, 'down');
  saveGame();
  await fadeTo(0, 250);
  STATE = 'OVERWORLD';
}

// ---------------- ELECCIÓN DE INICIAL ----------------
function chooseStarter() {
  return new Promise(res => {
    const prev = STATE;
    openPanel('Elige tu primer Coremon', body => {
      const info = {
        tizorex: 'Tipo Lógica. Un trozo de tiza muy cuadriculado. Equilibrado y fiable.',
        plumavox: 'Tipo Letras. Una pluma estilográfica rápida y con mucho ataque.',
        mochiloide: 'Tipo Físico. Una mochila muy resistente. Aguanta lo que le echen.'
      };
      const row = el('div', 'starter-row');
      Object.keys(info).forEach(sp => {
        const card = el('div', 'starter-card');
        card.appendChild(creatureCanvas(sp, 72));
        card.appendChild(el('b', null, SPECIES[sp].name));
        card.appendChild(typeChip(SPECIES[sp].type));
        card.appendChild(el('p', 'small', info[sp]));
        card.onclick = () => { panelStack.prevState = prev; closePanel(); res(sp); };
        row.appendChild(card);
      });
      body.appendChild(row);
    }, { closable: false });
  });
}

// ---------------- CONTROLES TÁCTILES ----------------
function initTouch() {
  document.getElementById('btn-new').onclick = () => {
    if (hasSave() && !confirm('Empezar una partida nueva borrará la anterior. ¿Seguro?')) return;
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OLD_SAVE_KEY); } catch (e) {}
    startNewGame();
  };
  const cont = document.getElementById('btn-continue');
  cont.disabled = !hasSave();
  cont.onclick = () => continueGame();
  document.getElementById('panel-back').onclick = () => closePanel();
  document.getElementById('menu-team').onclick = () => { if (STATE === 'OVERWORLD') openTeam(); };
  document.getElementById('menu-bag').onclick = () => { if (STATE === 'OVERWORLD') openBag(); };
  document.getElementById('menu-dex').onclick = () => { if (STATE === 'OVERWORLD') openDex(); };
  document.getElementById('menu-save').onclick = () => { if (STATE === 'OVERWORLD') { saveGame(); toast('Partida guardada.'); } };

  document.querySelectorAll('[data-dir]').forEach(b => {
    const down = e => { e.preventDefault(); virtualDir.dir = b.dataset.dir; };
    const up = e => { e.preventDefault(); if (virtualDir.dir === b.dataset.dir) virtualDir.dir = null; };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
  });
  const a = document.getElementById('pad-a');
  a.addEventListener('pointerdown', e => { e.preventDefault(); pressA(); });
  const b = document.getElementById('pad-b');
  b.addEventListener('pointerdown', e => { e.preventDefault(); keysDown['virtualb'] = true; pressB(); });
  b.addEventListener('pointerup', () => { keysDown['virtualb'] = false; });
  b.addEventListener('pointerleave', () => { keysDown['virtualb'] = false; });
  showTouch('title');
}
