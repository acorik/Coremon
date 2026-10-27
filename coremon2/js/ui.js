// ============================================================
// COREMON 2 — Interfaz: diálogos, preguntas, menús, equipo, mochila,
// Coredex, mapa, tarjeta, tienda, caja, opciones y pantalla de título.
// ============================================================

// ---------------- DIÁLOGOS ----------------
let dlg = null;
function say(lines) {
  return new Promise(res => {
    const prev = STATE;
    lines = [].concat(lines).filter(l => l != null && l !== '');
    if (!lines.length) { res(); return; }
    dlg = { lines, i: -1, prev, res, full: '', shown: 0, choices: null };
    STATE = STATE === 'BATTLE' ? 'BATTLE' : 'DIALOG';
    $('dialog').classList.remove('hidden');
    onA = advanceDialog; onB = advanceDialog;
    nextDialogLine();
  });
}
function nextDialogLine() {
  dlg.i++;
  if (dlg.i >= dlg.lines.length) { closeDialog(); return; }
  let line = dlg.lines[dlg.i];
  const m = /^([^:]{2,30}):\s(.+)$/.exec(line);
  if (m && !/^https?$/.test(m[1])) { $('dlg-name').textContent = m[1]; $('dlg-name').classList.remove('hidden'); line = m[2]; }
  else $('dlg-name').classList.add('hidden');
  dlg.full = line; dlg.shown = 0;
  $('dlg-text').textContent = '';
  $('dlg-arrow').classList.add('hidden');
  sfx('blip');
  typeDialog();
}
function typeDialog() {
  if (!dlg) return;
  if (dlg.shown < dlg.full.length) {
    dlg.shown = Math.min(dlg.full.length, dlg.shown + 2);
    $('dlg-text').textContent = dlg.full.slice(0, dlg.shown);
    dlg.timer = setTimeout(typeDialog, 18);
  } else $('dlg-arrow').classList.remove('hidden');
}
function advanceDialog() {
  if (!dlg || dlg.choices) return;
  if (dlg.shown < dlg.full.length) { clearTimeout(dlg.timer); dlg.shown = dlg.full.length; $('dlg-text').textContent = dlg.full; $('dlg-arrow').classList.remove('hidden'); return; }
  nextDialogLine();
}
function closeDialog() {
  const d = dlg; dlg = null;
  $('dialog').classList.add('hidden');
  STATE = d.prev === 'DIALOG' ? 'WORLD' : d.prev;
  restoreControls();
  d.res();
}
function restoreControls() {
  if (STATE === 'BATTLE') setBattleControls();
  else if (STATE === 'MENU') { onA = null; onB = closePanel; }
  else setWorldControls();
}
$('dialog').addEventListener('click', () => { if (dlg && !dlg.choices) advanceDialog(); });

// pregunta con opciones -> índice elegido
function ask(text, options) {
  return new Promise(res => {
    const prev = STATE;
    STATE = STATE === 'BATTLE' ? 'BATTLE' : 'DIALOG';
    $('dialog').classList.remove('hidden');
    const m = /^([^:]{2,30}):\s(.+)$/.exec(text);
    if (m) { $('dlg-name').textContent = m[1]; $('dlg-name').classList.remove('hidden'); text = m[2]; } else $('dlg-name').classList.add('hidden');
    $('dlg-text').textContent = text;
    $('dlg-arrow').classList.add('hidden');
    const box = $('dlg-choices'); box.innerHTML = ''; box.classList.remove('hidden');
    let sel = 0;
    const btns = options.map((o, i) => { const b = el('button', 'choice', o); b.onclick = e => { e.stopPropagation(); done(i); }; box.appendChild(b); return b; });
    const hl = () => btns.forEach((b, i) => b.style.background = i === sel ? 'rgba(255,213,79,0.35)' : '');
    hl();
    const keyH = e => {
      const k = e.key.toLowerCase();
      if (['arrowright', 'arrowdown', 'd', 's'].includes(k)) { sel = (sel + 1) % btns.length; hl(); }
      if (['arrowleft', 'arrowup', 'a', 'w'].includes(k)) { sel = (sel + btns.length - 1) % btns.length; hl(); }
    };
    window.addEventListener('keydown', keyH);
    dlg = { choices: true };
    onA = () => done(sel); onB = () => done(options.length - 1);
    function done(i) {
      window.removeEventListener('keydown', keyH);
      box.classList.add('hidden'); box.innerHTML = '';
      $('dialog').classList.add('hidden');
      dlg = null;
      STATE = prev === 'DIALOG' ? 'WORLD' : prev;
      restoreControls();
      sfx('select');
      res(i);
    }
  });
}

// ---------------- PANELES ----------------
let panelPrev = null, panelOnClose = null;
function openPanel(title, build, opts) {
  opts = opts || {};
  if (panelPrev === null) panelPrev = STATE;
  if (STATE !== 'BATTLE') STATE = 'MENU';
  $('panel-title').textContent = title;
  const body = $('panel-body'); body.innerHTML = ''; body.scrollTop = 0;
  build(body);
  $('panel').classList.remove('hidden');
  $('panel-close').classList.toggle('hidden', opts.closable === false);
  panelOnClose = opts.onClose || null;
  if (STATE !== 'BATTLE') { onA = null; onB = opts.closable === false ? null : closePanel; }
  showWorldUI(false);
}
function closePanel() {
  $('panel').classList.add('hidden');
  const prev = panelPrev; panelPrev = null;
  STATE = prev === 'MENU' || prev == null ? 'WORLD' : prev;
  if (STATE === 'WORLD') showWorldUI(true);
  restoreControls();
  const f = panelOnClose; panelOnClose = null;
  if (f) f();
}
$('panel-close').onclick = () => closePanel();

function hpBar(m) {
  const pct = Math.max(0, m.hp / monStats(m).hp * 100);
  const w = el('div', 'bar'), f = el('div', pct > 50 ? 'hp-hi' : pct > 20 ? 'hp-mid' : 'hp-lo');
  f.style.width = pct + '%'; w.appendChild(f); return w;
}
function typeChip(t) { const s = el('span', 'chip', TYPE_ICON[t] + ' ' + TYPE_LABEL[t]); s.style.background = TYPE_COLOR[t]; if (t === 'luz' || t === 'electrico' || t === 'hielo') s.style.color = '#1d1a26'; return s; }
function monRow(m, onClick, extra) {
  const r = el('div', 'row' + (m.hp <= 0 ? ' ko' : ''));
  r.appendChild(creatureIcon(m.species, 56, { shiny: m.shiny }));
  const g = el('div', 'grow');
  const top = el('div', 'top');
  top.appendChild(el('b', null, (SPECIES[m.species].legendary || m.legendary ? '★ ' : '') + (m.shiny ? '✨ ' : '') + monName(m)));
  top.appendChild(el('span', 'muted', 'Nv ' + m.level + (m.status ? ' · ' + STATUS[m.status].short : '')));
  g.appendChild(top);
  g.appendChild(typeChip(SPECIES[m.species].type));
  g.appendChild(hpBar(m));
  g.appendChild(el('div', 'muted', `PS ${m.hp}/${monStats(m).hp}`));
  r.appendChild(g);
  if (extra) r.appendChild(el('span', 'muted', extra));
  if (onClick) r.onclick = onClick;
  return r;
}

// ---------------- MENÚ PRINCIPAL ----------------
function openMainMenu() {
  if (STATE !== 'WORLD' || busy) return;
  sfx('select');
  openPanel('Menú', body => {
    const grid = el('div', 'menu-grid');
    const B = (icon, label, fn, dim) => { const b = el('button', 'mbtn' + (dim ? ' dim' : '')); b.appendChild(el('span', null, icon)); b.appendChild(document.createTextNode(label)); b.onclick = fn; grid.appendChild(b); };
    B('👥', 'Equipo', () => openTeam());
    B('🎒', 'Mochila', () => openBag());
    B('📘', 'Coredex', () => openDex());
    B('🗺️', 'Mapa', () => openMap());
    B('🪪', 'Tarjeta', () => openCard());
    B('💾', 'Guardar', () => { saveGame(); closePanel(); });
    B('⚙️', 'Opciones', () => openOptions());
    B('📋', 'Misiones', () => openMissions());
    B('🏆', 'Logros', () => openLogros());
    B('🌐', 'Online', () => openOnline(), true);
    body.appendChild(grid);
  });
}

function openTeam(focus) {
  openPanel('Equipo', body => {
    if (focus != null && G.team[focus]) { buildMonDetail(body, G.team[focus], focus); return; }
    G.team.forEach((m, i) => body.appendChild(monRow(m, () => openTeam(i))));
    if (!G.team.length) body.appendChild(el('p', 'muted', 'Todavía no tienes Coremon.'));
  });
}
function buildMonDetail(body, m, idx) {
  const sp = SPECIES[m.species], st = monStats(m);
  const head = el('div', 'row');
  head.appendChild(creatureIcon(m.species, 96, { shiny: m.shiny }));
  const g = el('div', 'grow');
  g.appendChild(el('b', null, monName(m) + '  ·  Nv ' + m.level));
  g.appendChild(document.createElement('br'));
  g.appendChild(typeChip(sp.type));
  if (m.status) { const s = el('span', 'chip', STATUS[m.status].name); s.style.background = STATUS[m.status].color; g.appendChild(s); }
  g.appendChild(hpBar(m));
  g.appendChild(el('div', 'muted', `PS ${m.hp}/${st.hp} · EXP ${m.exp}/${expToNext(m.level)}`));
  const xp = el('div', 'bar'), xf = el('div', 'xp'); xf.style.width = Math.min(100, m.exp / expToNext(m.level) * 100) + '%'; xp.appendChild(xf); g.appendChild(xp);
  if (sp.evolvesTo) g.appendChild(el('div', 'muted', `Evoluciona a ${SPECIES[sp.evolvesTo].name} al nivel ${sp.evolveLevel}.`));
  if (m.shiny) g.appendChild(el('div', 'shiny-tag', '✨ Variocolor'));
  const ab = el('div', 'ability'); ab.appendChild(el('b', null, '⚡ ' + abilityName(m) + ': ')); ab.appendChild(document.createTextNode(ABILITIES[abilityOf(m)].desc)); g.appendChild(ab);
  head.appendChild(g); body.appendChild(head);
  const sg = el('div', 'stat-grid');
  [['PS', st.hp], ['Ataque', st.atk], ['Defensa', st.def], ['Velocidad', st.spd]].forEach(([k, v]) => { const s = el('div', 'stat'); s.appendChild(el('b', null, v)); s.appendChild(document.createTextNode(k)); sg.appendChild(s); });
  body.appendChild(sg);
  body.appendChild(el('h4', null, 'Movimientos'));
  m.moves.forEach(mv => {
    const d = MOVES[mv.id], r = el('div', 'row');
    const gg = el('div', 'grow');
    gg.appendChild(el('b', null, d.name));
    gg.appendChild(el('div', 'muted', `${d.type ? TYPE_LABEL[d.type] : 'Normal'} · ${d.power ? 'Potencia ' + d.power : 'Estado'} · Precisión ${Math.round(d.acc * 100)}% · PP ${mv.pp}/${mv.maxPp}`));
    r.appendChild(gg); r.style.borderLeft = '6px solid ' + (d.type ? TYPE_COLOR[d.type] : '#9e9e9e'); body.appendChild(r);
  });
  const acts = el('div', 'menu-grid');
  if (idx > 0) { const b = el('button', 'bigbtn', 'Poner primero'); b.onclick = () => { G.team.splice(idx, 1); G.team.unshift(m); openTeam(0); }; acts.appendChild(b); }
  const back = el('button', 'bigbtn grey', '← Volver'); back.onclick = () => openTeam(); acts.appendChild(back);
  body.appendChild(acts);
}

function pickMon(title, filter) {
  return new Promise(res => {
    openPanel(title, body => {
      G.team.forEach(m => { const ok = !filter || filter(m); const r = monRow(m, ok ? () => { panelOnClose = null; res(m); } : null); if (!ok) r.style.opacity = 0.4; body.appendChild(r); });
    }, { onClose: () => res(null) });
  });
}

// ---------------- MOCHILA ----------------
function openBag(battleCtx) {
  openPanel('Mochila', body => {
    const ids = Object.keys(G.bag).filter(k => G.bag[k] > 0 && ITEMS[k]);
    if (!ids.length) body.appendChild(el('p', 'muted', 'La mochila está vacía.'));
    const groups = [['Curación', i => ['heal', 'pp', 'cure', 'revive', 'level'].includes(ITEMS[i].kind)], ['Cromos', i => ITEMS[i].kind === 'capture'], ['Otros', i => ITEMS[i].kind === 'repel'], ['Objetos clave', i => ITEMS[i].kind === 'key']];
    groups.forEach(([name, f]) => {
      const list = ids.filter(f);
      if (!list.length) return;
      body.appendChild(el('h4', null, name));
      list.forEach(id => {
        const it = ITEMS[id], r = el('div', 'row');
        r.appendChild(el('span', null, it.icon)); r.firstChild.style.fontSize = '28px';
        const g = el('div', 'grow'); const top = el('div', 'top'); top.appendChild(el('b', null, it.name)); top.appendChild(el('span', 'muted', it.kind === 'key' ? '' : '×' + G.bag[id]));
        g.appendChild(top); g.appendChild(el('div', 'muted', it.desc)); r.appendChild(g);
        r.onclick = () => useBagItem(id, battleCtx);
        body.appendChild(r);
      });
    });
  }, { onClose: battleCtx && battleCtx.onCancel });
}
function consumeItem(id) { G.bag[id]--; if (G.bag[id] <= 0) delete G.bag[id]; }
async function useBagItem(id, battleCtx) {
  const it = ITEMS[id];
  if (it.kind === 'capture') {
    if (!battleCtx || !battleCtx.canCapture) { toast('Solo se pueden lanzar cromos a Coremon salvajes en combate.'); return; }
    panelOnClose = null; closePanel(); battleCtx.onCapture(id); return;
  }
  if (it.kind === 'key') {
    if (id === 'bici' || id === 'moto') {
      if (battleCtx) return;
      if (!MAP.outdoor) { toast('Aquí dentro no puedes montar.'); return; }
      G.ride = G.ride === id ? null : id; G.bike = false;
      toast(G.ride === 'moto' ? '¡Arrancas la moto! 🏍️ Acelera con el joystick y cuidado con las curvas.' : G.ride === 'bici' ? '¡Te subes a la bici! 🚲' : 'Te bajas.');
      if (G.ride === 'moto') sfx('engine');
      closePanel(); return;
    }
    if (id === 'pistola') { if (battleCtx) return; G.gunOut = !G.gunOut; toast(G.gunOut ? '🔫 Pistola en mano: dispara con B (X en el teclado).' : 'Guardas la pistola.'); closePanel(); return; }
    if (id === 'mapa') { openMap(); return; }
    toast(it.desc); return;
  }
  if (it.kind === 'repel') { if (battleCtx) return; G.repel = (G.repel || 0) + it.amount; consumeItem(id); toast('Los Coremon salvajes no se acercarán durante un rato.'); closePanel(); return; }
  const filter = it.kind === 'revive' ? (m => m.hp <= 0) : (m => m.hp > 0);
  const m = await pickMon('¿En quién usar ' + it.name + '?', filter);
  if (!m) { if (!battleCtx) openBag(); return; }
  const msg = applyItem(id, m);
  if (!msg) { toast('No tendría ningún efecto.'); openBag(battleCtx); return; }
  consumeItem(id);
  if (battleCtx) { panelOnClose = null; closePanel(); battleCtx.onUsed(msg); return; }
  toast(msg);
  if (m.pendingEvo) { closePanel(); await runEvolution(m); return; }
  openBag();
}
function applyItem(id, m) {
  const it = ITEMS[id], max = monStats(m).hp;
  switch (it.kind) {
    case 'heal': if (m.hp >= max) return null; { const h = Math.min(max - m.hp, it.amount); m.hp += h; return `${monName(m)} recupera ${h} PS.`; }
    case 'revive': if (m.hp > 0) return null; m.hp = Math.max(1, Math.floor(max * it.amount)); m.status = null; return `¡${monName(m)} vuelve a estar en pie!`;
    case 'pp': { let any = false; m.moves.forEach(x => { if (x.pp < x.maxPp) { x.pp = Math.min(x.maxPp, x.pp + it.amount); any = true; } }); return any ? `${monName(m)} recupera PP.` : null; }
    case 'cure': if (!m.status) return null; m.status = null; return `${monName(m)} ya no tiene ningún estado alterado.`;
    case 'level': if (m.level >= 100) return null; levelUpMon(m, true); return `¡${monName(m)} sube al nivel ${m.level}!`;
  }
  return null;
}

// ---------------- COREDEX ----------------
function openDex() {
  openPanel('Coredex', body => {
    const seen = DEX_ORDER.filter(i => G.seen[i]).length, caught = DEX_ORDER.filter(i => G.caught[i]).length;
    body.appendChild(el('p', 'muted', `Vistos: ${seen}/${DEX_ORDER.length} · Capturados: ${caught}/${DEX_ORDER.length}`));
    const grid = el('div', 'dex-grid');
    DEX_ORDER.forEach((id, n) => {
      const c = el('div', 'dex-cell'), sp = SPECIES[id];
      const cv2 = el('canvas'); cv2.width = cv2.height = CS;
      drawCreature(cv2.getContext('2d'), id, 0, 0, CS, { silhouette: !G.seen[id] });
      c.appendChild(cv2);
      c.appendChild(el('div', null, String(n + 1).padStart(3, '0') + ' ' + (G.seen[id] ? sp.name : '???')));
      if (G.caught[id]) c.appendChild(el('span', 'got', '●'));
      if (G.seen[id]) c.onclick = () => toast(`${sp.name} · ${TYPE_LABEL[sp.type]} · Habilidad: ${abilityName({ species: id })}${sp.evolvesTo ? ' · Evoluciona a ' + SPECIES[sp.evolvesTo].name + ' (Nv ' + sp.evolveLevel + ')' : ''}${sp.lore ? ' · ' + sp.lore : ''}`, 4200);
      grid.appendChild(c);
    });
    body.appendChild(grid);
  });
}

// ---------------- MAPA ----------------
function openMap() {
  openPanel('Mapa de Iberión', body => {
    const c = el('canvas'); c.id = 'map-canvas'; c.width = WORLD.w * 3; c.height = WORLD.h * 3;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    if (!worldOverview) worldOverview = buildOverview(WORLD);
    g.drawImage(worldOverview, 0, 0, c.width, c.height);
    g.font = 'bold 16px sans-serif';
    CITIES.forEach(ct => {
      const known = G.flags['visit_' + ct.id];
      g.fillStyle = known ? '#ffd54f' : '#9e9e9e'; g.fillRect(ct.x * 3 - 5, ct.y * 3 - 5, 10, 10);
      if (known) { g.fillStyle = '#000'; g.fillText(ct.name, ct.x * 3 - 28 + 1, ct.y * 3 - 10 + 1); g.fillStyle = '#fff'; g.fillText(ct.name, ct.x * 3 - 28, ct.y * 3 - 10); }
    });
    VILLAGES.forEach(v => { g.fillStyle = '#ffe9a8'; g.fillRect(v.x * 3 - 4, v.y * 3 - 4, 8, 8); if (G.flags['visit_' + v.id]) { g.fillStyle = '#000'; g.fillText(v.name, v.x * 3 - 20 + 1, v.y * 3 - 8 + 1); g.fillStyle = '#fff3c4'; g.fillText(v.name, v.x * 3 - 20, v.y * 3 - 8); } });
    drawMissionMarks(g, X => X * 3, Y => Y * 3);
    if (MAP === WORLD) { g.fillStyle = '#ff1744'; g.beginPath(); g.arc(player.x / TS * 3, player.y / TS * 3, 7, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
    body.appendChild(c);
    body.appendChild(el('p', 'muted', 'Las ciudades visitadas aparecen con su nombre. Las barreras rojas de CoraCorp se rompen con las medallas.'));
    buildFlyList(body);
  });
}

// ---------------- TARJETA ----------------
function openCard() {
  openPanel('Tarjeta de entrenador', body => {
    const r = el('div', 'row');
    const pc = el('canvas'); pc.width = PW * 3; pc.height = PH * 3; pc.className = 'mini'; pc.style.width = '72px'; pc.style.height = '96px';
    const g = pc.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(3, 3); drawPerson(g, LOOKS2.player, PW / 2, PH, 'down', 0, 'jugador');
    r.appendChild(pc);
    const info = el('div', 'grow');
    const hrs = Math.floor(G.playTime / 3600000), mins = Math.floor(G.playTime / 60000) % 60;
    info.appendChild(el('b', null, G.name));
    info.appendChild(el('div', 'muted', `Dinero: ${G.money} 💰`));
    info.appendChild(el('div', 'muted', `Coredex: ${DEX_ORDER.filter(i => G.caught[i]).length} capturados`));
    info.appendChild(el('div', 'muted', `Tiempo de juego: ${hrs} h ${mins} min`));
    if (G.fromC1) info.appendChild(el('div', 'muted', `Antiguo alumno de Corazonistas (${G.c1Badges || 0} insignias del colegio)`));
    r.appendChild(info); body.appendChild(r);
    body.appendChild(el('h4', null, 'Medallas de Iberión'));
    const bd = el('div', 'badges');
    CITIES.filter(c => c.gym).forEach(c => { const b = el('div', 'badge' + (G.badges.includes(c.id) ? ' got' : ''), TYPE_ICON[c.gym]); b.title = c.badge; bd.appendChild(b); });
    body.appendChild(bd);
  });
}

// ---------------- OPCIONES / ONLINE ----------------
function openOptions() {
  openPanel('Opciones', body => {
    const s = el('button', 'bigbtn', audioOn ? '🔊 Sonido: activado' : '🔇 Sonido: desactivado');
    s.onclick = () => { audioInit(); setAudio(!audioOn); s.textContent = audioOn ? '🔊 Sonido: activado' : '🔇 Sonido: desactivado'; };
    body.appendChild(s);
    // gráficos
    body.appendChild(el('h4', null, '🎨 Gráficos'));
    const qrow = el('div', 'optrow');
    [['auto', 'Auto'], ['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta'], ['ultra', 'Ultra']].forEach(([k, l]) => {
      const b = el('button', SETTINGS.quality === k ? 'on' : '', l);
      b.onclick = () => { SETTINGS.quality = k; saveSettings(); if (R3.ok) applyQuality(); openOptions(); };
      qrow.appendChild(b);
    });
    body.appendChild(qrow);
    body.appendChild(el('p', 'muted', R3.ok ? 'Auto ajusta la resolución y las sombras según lo que aguante tu dispositivo. Ultra es solo para ordenadores potentes.' : 'Tu dispositivo no tiene WebGL: se juega en 2D.'));
    body.appendChild(el('h4', null, '⏱️ FPS'));
    const frow = el('div', 'optrow');
    const fb = el('button', SETTINGS.fps ? 'on' : '', SETTINGS.fps ? 'Contador: sí' : 'Contador: no');
    fb.onclick = () => { SETTINGS.fps = !SETTINGS.fps; saveSettings(); openOptions(); };
    frow.appendChild(fb);
    [[30, '30'], [60, '60'], [0, 'Sin límite']].forEach(([v, l]) => { const b = el('button', SETTINGS.fpsCap === v ? 'on' : '', l); b.onclick = () => { SETTINGS.fpsCap = v; saveSettings(); openOptions(); }; frow.appendChild(b); });
    body.appendChild(frow);
    body.appendChild(el('p', 'muted', 'Limitar a 30 FPS ahorra batería en el móvil.'));
    // juego
    body.appendChild(el('h4', null, '🎮 Juego'));
    body.appendChild(el('div', 'muted', 'Velocidad de los combates'));
    const brow = el('div', 'optrow');
    [['normal', 'Normal'], ['rapida', 'Rápida'], ['turbo', 'Turbo']].forEach(([k, l]) => { const b = el('button', SETTINGS.bspeed === k ? 'on' : '', l); b.onclick = () => { SETTINGS.bspeed = k; saveSettings(); openOptions(); }; brow.appendChild(b); });
    body.appendChild(brow);
    const grow = el('div', 'optrow');
    const tg = (label, key) => { const b = el('button', SETTINGS[key] ? 'on' : '', label + (SETTINGS[key] ? ': sí' : ': no')); b.onclick = () => { SETTINGS[key] = !SETTINGS[key]; saveSettings(); openOptions(); }; grow.appendChild(b); };
    tg('Correr siempre', 'autorun'); tg('Autoguardado', 'autosave');
    body.appendChild(grow);
    body.appendChild(el('p', 'muted', 'Con «correr siempre», mantén B (o Shift) para andar despacio. El autoguardado guarda cada minuto y medio mientras exploras.'));
    body.appendChild(el('h4', null, 'Controles'));
    body.appendChild(el('p', 'muted', 'Teclado: flechas/WASD para moverte, Shift para correr, Enter/Espacio/Z para hablar (A), Esc/X para volver (B) y M para el menú. Móvil: joystick (hasta el borde para correr) y botones A/B. También funciona con mando. Con la caña de pescar, pulsa A delante del agua.'));
    const c1 = el('button', 'bigbtn grey', '🏫 Volver al colegio');
    c1.onclick = async () => { closePanel(); const i = await ask('¿Volver al colegio? Tu partida del mundo se guardará.', ['Sí, volver', 'No']); if (i === 0) { saveGame(true); location.href = '../coremon1/index.html'; } };
    body.appendChild(c1);
    // código secreto
    const crow = el('div', 'optrow');
    const inp = el('input'); inp.type = 'text'; inp.inputMode = 'numeric'; inp.placeholder = 'Código'; inp.style.cssText = 'flex:2;padding:10px;border-radius:10px;border:1px solid rgba(255,213,79,0.4);background:#14121c;color:#fff;font-weight:bold';
    const ok = el('button', '', 'Usar código');
    ok.onclick = () => { if (inp.value.trim() === '1000') { G.flags.dev = true; sfx('levelup'); toast('🛠️ Herramientas de desarrollador activadas'); openOptions(); } else { sfx('bad'); toast('Código incorrecto.'); } };
    crow.appendChild(inp); crow.appendChild(ok);
    body.appendChild(crow);
    if (G.flags.dev) { const d = el('button', 'bigbtn', '🛠️ Herramientas de desarrollador'); d.onclick = () => openDevtools(); body.appendChild(d); }
    body.appendChild(el('p', 'muted', 'Coremon · versión ' + C2_VERSION + ' · un juego de acorik · acorik.itch.io/coremon'));
  });
}
// ---------------- HERRAMIENTAS DE DESARROLLADOR (código 1000) ----------------
function openDevtools() {
  openPanel('🛠️ Devtools', body => {
    const tx = Math.floor(player.x / TS), ty = Math.floor(player.y / TS);
    body.appendChild(el('p', 'muted', `Mapa: ${MAP.id} · casilla ${tx},${ty} · ${placeName(MAP, player.x, player.y)}${MAP === WORLD ? ' · medallas para llegar: ' + tierAt(tx, ty) : ''} · ${FPSC.v} FPS`));
    const grid = el('div', 'devgrid');
    const B = (label, fn, on) => { const b = el('button', on ? 'on' : '', label); b.onclick = () => { fn(); refreshNpcs(); openDevtools(); }; grid.appendChild(b); };
    const T = (label, flag) => B((G.flags[flag] ? '✅ ' : '⬜ ') + label, () => { G.flags[flag] = !G.flags[flag]; }, G.flags[flag]);
    T('Atravesar paredes', 'devNoclip');
    T('Velocidad ×2,5', 'devTurbo');
    T('Sin Coremon salvajes', 'noEncounters');
    B('💰 +10.000', () => { G.money += 10000; });
    B('🎒 Kit completo', () => { ['cromoMaestro', 'cromoPlatino', 'banquete', 'elixir', 'botiquin', 'caramelo', 'repelente'].forEach(k => G.bag[k] = (G.bag[k] || 0) + 10); ['bici', 'moto', 'pistola', 'mapa'].forEach(k => G.bag[k] = 1); });
    B('⬆️ Equipo +5 niveles', () => { G.team.forEach(m => { for (let i = 0; i < 5 && m.level < 100; i++) levelUpMon(m, true); healMon(m); }); });
    B('❤️ Curar equipo', () => G.team.forEach(healMon));
    B('🏅 +1 medalla', () => { const c = CITIES.find(c => c.gym && !G.badges.includes(c.id)); if (c) G.badges.push(c.id); });
    B('📘 Coredex vista', () => { DEX_ORDER.forEach(i => G.seen[i] = true); });
    B('🌅 Mañana', () => { G.time = 8 * 60; });
    B('🌇 Atardecer', () => { G.time = 19 * 60; });
    B('🌙 Noche', () => { G.time = 23 * 60; });
    B('🏍️ Subir a la moto', () => { G.bag.moto = 1; G.ride = 'moto'; });
    B('✨ Próximo salvaje variocolor', () => { G.flags.devShiny = true; });
    B('🎣 Caña y amuleto', () => { G.bag.cana = 1; G.bag.amuleto = 1; });
    B('🐉 Legendario aleatorio', () => { const l = LEGENDS[Math.floor(Math.random() * LEGENDS.length)][0]; giveMon(l, 50); toast('¡' + SPECIES[l].name + '!'); });
    B((SETTINGS.fps ? '✅ ' : '⬜ ') + 'Contador de FPS', () => { SETTINGS.fps = !SETTINGS.fps; saveSettings(); }, SETTINGS.fps);
    body.appendChild(grid);
    body.appendChild(el('h4', null, 'Teletransporte'));
    const tg = el('div', 'devgrid');
    CITIES.concat(VILLAGES).forEach(p => { const b = el('button', '', p.name); b.onclick = () => { closePanel(); const [x, y] = freeSpot(WORLD, p.x, p.y + 2); warpTo('world', x * TS + 16, y * TS + 26, 'down'); }; tg.appendChild(b); });
    body.appendChild(tg);
    const off = el('button', 'bigbtn grey', 'Desactivar herramientas');
    off.onclick = () => { G.flags.dev = false; G.flags.devNoclip = G.flags.devTurbo = false; closePanel(); toast('Herramientas desactivadas.'); };
    body.appendChild(off);
  });
}
function openOnline() {
  openPanel('Modo online', body => {
    body.appendChild(el('h3', null, '🌐 Próximamente'));
    body.appendChild(el('p', null, 'Combates contra otros entrenadores, intercambios de Coremon y torneos de la comunidad Corazonistas.'));
    body.appendChild(el('p', 'muted', 'Llegará en una próxima actualización. ¡Ve entrenando a tu equipo!'));
  });
}

// ---------------- TIENDA ----------------
function shopTier() { return G.badges.length >= 6 ? 2 : G.badges.length >= 3 ? 1 : 0; }
function openShop() {
  openPanel('Tienda', body => {
    body.appendChild(el('p', null, `Dinero: ${G.money} 💰`));
    SHOP_TIERS[shopTier()].forEach(id => {
      const it = ITEMS[id], r = el('div', 'row');
      r.appendChild(el('span', null, it.icon)); r.firstChild.style.fontSize = '28px';
      const g = el('div', 'grow'); const top = el('div', 'top'); top.appendChild(el('b', null, it.name)); top.appendChild(el('span', null, it.price + ' 💰'));
      g.appendChild(top); g.appendChild(el('div', 'muted', it.desc + (G.bag[id] ? ` (tienes ${G.bag[id]})` : ''))); r.appendChild(g);
      [1, 5].forEach(n => {
        if (it.once && (n > 1 || G.bag[id])) { if (n === 1) r.appendChild(el('span', 'muted', '✔')); return; }
        const b = el('button', 'pbtn', it.once ? 'Comprar' : '×' + n);
        b.onclick = e => { e.stopPropagation(); if (G.money < it.price * n) { toast('No tienes dinero suficiente.'); return; } G.money -= it.price * n; G.bag[id] = (G.bag[id] || 0) + n; sfx('item'); openShop(); };
        r.appendChild(b);
      });
      body.appendChild(r);
    });
  });
}

// ---------------- CAJA (PC) ----------------
function openBox() {
  openPanel('Caja de Coremon', body => {
    body.appendChild(el('h4', null, `Equipo (${G.team.length}/6) — toca para guardar`));
    G.team.forEach((m, i) => body.appendChild(monRow(m, () => { if (G.team.length <= 1) { toast('Necesitas al menos un Coremon en el equipo.'); return; } G.team.splice(i, 1); G.box.push(m); openBox(); }, 'guardar →')));
    body.appendChild(el('h4', null, `Caja (${G.box.length}) — toca para sacar`));
    if (!G.box.length) body.appendChild(el('p', 'muted', 'La caja está vacía.'));
    G.box.forEach((m, i) => body.appendChild(monRow(m, () => { if (G.team.length >= 6) { toast('Tu equipo ya tiene 6 Coremon.'); return; } G.box.splice(i, 1); healMon(m); G.team.push(m); openBox(); }, '← sacar')));
  });
}

// ---------------- TÍTULO ----------------
function showTitle() {
  STATE = 'TITLE';
  $('title').classList.remove('hidden');
  showWorldUI(false);
  $('t-ver').textContent = 'v' + C2_VERSION;
  const save = loadGame(), c1 = readC1Save();
  $('t-continue').disabled = !save;
  let info = '';
  if (save) info = `Partida guardada: ${save.badges.length} medalla${save.badges.length === 1 ? '' : 's'} · ${Math.floor(save.playTime / 3600000)} h ${Math.floor(save.playTime / 60000) % 60} min`;
  else if (c1) info = `Se traerá tu partida del colegio: ${(c1.team || []).length} Coremon en el equipo y ${(c1.box || []).length} en la taquilla.`;
  else info = 'Empieza tu aventura en el mundo de Iberión.';
  $('title-info').textContent = info;
  $('t-continue').onclick = () => { audioInit(); continueGame(); };
  $('t-new').onclick = async () => {
    audioInit();
    if (save && !confirm('Empezar una aventura nueva borrará tu partida del mundo. ¿Seguro?')) return;
    startNewGame();
  };
  onA = () => { if (save) continueGame(); else startNewGame(); };
  onB = null;
  // si se llega desde el colegio, empieza directamente
  // si se llega desde el colegio, se sigue jugando sin pasar por el título:
  // partida nueva con el progreso de Coremon 1, o la que ya hubiera en Coremon 2
  if (/desde=coremon1/.test(location.search)) {
    history.replaceState(null, '', location.pathname);
    $('title').classList.add('hidden');
    setTimeout(() => { if (save) continueGame(); else startNewGame(); }, 60);
  }
}
function hideTitle() { $('title').classList.add('hidden'); }

function renderTitle() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const t = now / 1000;
  if (R3.ok && WORLD) {
    // el mundo en 3D de fondo, con la cámara girando sobre Gasteiz
    ctx.clearRect(0, 0, VW, VH);
    render3DTitle(frameDt);
    const vg = ctx.createLinearGradient(0, 0, 0, VH); vg.addColorStop(0, 'rgba(20,10,40,0.75)'); vg.addColorStop(0.4, 'rgba(20,10,40,0.05)'); vg.addColorStop(0.62, 'rgba(10,8,20,0.1)'); vg.addColorStop(1, 'rgba(10,8,20,0.85)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
    const big = Math.min(VW, VH) * 0.2;
    ['chispazo', 'cimientor', 'gotin'].forEach((id, i) => {
      const x = VW * (0.2 + i * 0.3) - big / 2, y = VH * 0.14 + Math.sin(t * 1.4 + i) * big * 0.05 + (i === 1 ? -big * 0.2 : 0);
      drawCreature(ctx, id, x, y, i === 1 ? big * 1.3 : big, { flip: i === 2 });
    });
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#2a1f4a'); g.addColorStop(0.55, '#c0506a'); g.addColorStop(1, '#ffb36b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  if (!worldOverview && WORLD) worldOverview = buildOverview(WORLD);
  if (worldOverview) {
    // el mundo visto desde arriba, desplazándose despacio
    const s = Math.max(VW / 200, VH / 150) * 1.4, ox = -((t * 4) % (WORLD.w * s - VW * 0.5)) * 0.4;
    ctx.globalAlpha = 0.55; ctx.drawImage(worldOverview, ox, VH * 0.2, WORLD.w * s, WORLD.h * s); ctx.globalAlpha = 1;
    const vg = ctx.createLinearGradient(0, 0, 0, VH); vg.addColorStop(0, 'rgba(20,10,40,0.9)'); vg.addColorStop(0.45, 'rgba(20,10,40,0.2)'); vg.addColorStop(1, 'rgba(10,8,20,0.85)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  }
  const big = Math.min(VW, VH) * 0.2;
  ['chispazo', 'cimientor', 'gotin'].forEach((id, i) => {
    const x = VW * (0.2 + i * 0.3) - big / 2, y = VH * 0.18 + Math.sin(t * 1.4 + i) * big * 0.05 + (i === 1 ? -big * 0.2 : 0);
    drawCreature(ctx, id, x, y, i === 1 ? big * 1.3 : big, { flip: i === 2 });
  });
}

function initUI() {
  $('btn-menu').onclick = () => openMainMenu();
}
