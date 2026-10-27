// ============================================================
// COREMON 2 — Combate a pantalla completa: escenarios por zona, turnos,
// estados alterados, niveles de estadística, capturas, experiencia,
// subidas de nivel y evoluciones.
// ============================================================

let B = null;

// ---------------- INICIO ----------------
function startBattle(opts) {
  return new Promise(res => {
    const enemyTeam = opts.kind === 'wild'
      ? [Object.assign(makeMon(opts.mon.species, opts.mon.level), { legendary: !!opts.mon.legendary, shiny: !!opts.mon.shiny })]
      : opts.trainer.team.map(([sp, lv]) => makeMon(sp, lv));
    const first = Math.max(0, G.team.findIndex(m => m.hp > 0));
    B = {
      kind: opts.kind, trainer: opts.trainer || null, npc: opts.npc || null, res,
      enemyTeam, ei: 0, pi: first, part: new Set([G.team[first]]),
      stages: { p: blankStages(), e: blankStages() },
      sleep: { p: 0, e: 0 },
      scene: battleScene(opts),
      anim: { eOff: 1, pOff: 1, eShow: false, pShow: false, tShow: opts.kind === 'trainer', tOff: 1, flash: { p: 0, e: 0 }, lunge: null, shake: 0, faint: { p: 0, e: 0 }, white: { p: 0, e: 0 }, card: null, hp: {}, exp: null },
      fx: [], texts: [], busy: true, over: false, noRun: !!opts.noRun, region: opts.region, fished: !!opts.fished, said: new Set()
    };
    G.seen[enemyTeam[0].species] = true;
    STATE = 'BATTLE';
    showWorldUI(false);
    $('battle-ui').classList.remove('hidden');
    hideBattleMenus();
    setBattleControls();
    music(opts.music || (opts.kind === 'wild' ? (enemyTeam[0].legendary ? 'boss' : 'wild') : (opts.trainer.boss ? 'boss' : opts.trainer.corp ? 'corp' : 'battle')));
    battleIntro();
  });
}
function blankStages() { return { atk: 0, def: 0, spd: 0 }; }
function battleScene(opts) {
  if (opts.scene) return opts.scene;
  if (!MAP.outdoor) return MAP.battleScene || 'indoor';
  return MAP.regionAt(Math.floor(player.x / TS), Math.floor(player.y / TS));
}
const activeE = () => B.enemyTeam[B.ei];
const activeP = () => G.team[B.pi];

function setBattleControls() {
  onA = () => { if (bmsg.waiting) bmsg.skip = true; };
  onB = () => { if (!$('b-moves').classList.contains('hidden')) showBattleMain(); else if (bmsg.waiting) bmsg.skip = true; };
}

// ---------------- MENSAJES Y TIEMPOS ----------------
const bmsg = { waiting: false, skip: false };
async function bsay(text, ms) {
  $('b-log').textContent = text;
  bmsg.waiting = true; bmsg.skip = false;
  const t0 = performance.now(), dur = (ms || 1150) * battleSpeed();
  while (performance.now() - t0 < dur && !bmsg.skip) await wait(30);
  bmsg.waiting = false;
}
// velocidad de los combates (Opciones): normal, rápida o turbo
function battleSpeed() { return STATE === 'BATTLE' ? ({ normal: 1, rapida: 0.6, turbo: 0.35 }[SETTINGS.bspeed] || 1) : 1; }
function tween(ms, fn) {
  ms *= battleSpeed();
  return new Promise(res => {
    const t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / ms); fn(k); if (k < 1) requestAnimationFrame(step); else res(); };
    step();
  });
}
const ease = k => 1 - Math.pow(1 - k, 3);

// ---------------- PRESENTACIÓN ----------------
async function battleIntro() {
  const a = B.anim, e = activeE();
  a.hp.e = e.hp; a.hp.p = activeP().hp;
  sfx('encounter');
  await tween(500, k => { a.eOff = 1 - ease(k); a.tOff = 1 - ease(k); a.pOff = 1 - ease(k); });
  if (B.kind === 'wild') {
    a.eShow = true;
    if (e.legendary) { a.shake = 22; sfx('rumble'); spawnFx('e', '#ffd54f', 30); await bsay(`¡¡Un Coremon LEGENDARIO!! ¡${SPECIES[e.species].name} aparece envuelto en luz!`, 1700); }
    else if (e.shiny) { stat('shinies'); sfx('shiny'); a.sparkle = { side: 'e', t: now }; spawnFx('e', '#fff59d', 24); spawnFx('e', '#80deea', 16); await bsay(`✨ ¡Un ${SPECIES[e.species].name} VARIOCOLOR salvaje aparece! ✨`, 1900); }
    else await bsay(`¡${B.fished ? 'Ha picado un' : 'Un'} ${SPECIES[e.species].name} salvaje${B.fished ? '' : ' aparece'}!`);
  } else {
    await bsay(`¡${B.trainer.name} quiere luchar!`);
    await tween(300, k => { a.tOff = ease(k); });
    a.tShow = false;
    await sendOut('e');
  }
  await sendOut('p');
  B.busy = false;
  showBattleMain();
}
async function sendOut(side) {
  const a = B.anim;
  if (side === 'e') { a.eShow = true; a.faint.e = 0; a.hp.e = activeE().hp; G.seen[activeE().species] = true; if (B.kind === 'trainer') await bsay(`${B.trainer.name} saca a ${monName(activeE())}.`, 900); }
  else { a.pShow = true; a.faint.p = 0; a.hp.p = activeP().hp; B.part.add(activeP()); await bsay(`¡Adelante, ${monName(activeP())}!`, 900); }
  a.white[side] = 1; await tween(350, k => { a.white[side] = 1 - k; });
  const m = side === 'e' ? activeE() : activeP();
  if (m.shiny && !(side === 'e' && B.kind === 'wild')) { a.sparkle = { side, t: now }; sfx('shiny'); }
  if (abilityOf(m) === 'intimida') { const other = side === 'e' ? 'p' : 'e', o = other === 'e' ? activeE() : activeP(); if (o && o.hp > 0 && (other === 'p' ? a.pShow : a.eShow)) { await announceAbility(m, side); await changeStage(other, 'atk', -1); } }
}
// cartel de habilidad
async function announceAbility(m, side) {
  floatText(side, abilityName(m), '#b388ff');
  await bsay(`[${abilityName(m)}] de ${monName(m)}`, 750);
}

// ---------------- MENÚS ----------------
function hideBattleMenus() { $('b-cmds').classList.add('hidden'); $('b-moves').classList.add('hidden'); }
function showBattleMain() {
  hideBattleMenus();
  if (!B || B.over) return;
  $('b-log').textContent = `¿Qué hará ${monName(activeP())}?`;
  $('b-cmds').classList.remove('hidden');
}
document.querySelectorAll('.bcmd').forEach(b => b.addEventListener('click', () => {
  if (!B || B.busy) return;
  const c = b.dataset.cmd;
  if (c === 'fight') showMoves();
  if (c === 'bag') openBattleBag();
  if (c === 'team') openBattleTeam(false);
  if (c === 'run') tryRun();
}));
function showMoves() {
  hideBattleMenus();
  const box = $('b-moves'); box.innerHTML = '';
  const p = activeP();
  const usable = p.moves.filter(m => m.pp > 0);
  p.moves.forEach((mv, i) => {
    const d = MOVES[mv.id], b = el('button', 'bmove');
    b.style.background = `linear-gradient(180deg, ${shade(d.type ? TYPE_COLOR[d.type] : '#9e9e9e', 15)}, ${shade(d.type ? TYPE_COLOR[d.type] : '#9e9e9e', -25)})`;
    b.appendChild(el('span', null, d.name));
    const eff = d.power ? typeEff(d.type, SPECIES[activeE().species].type) : 1;
    b.appendChild(el('small', null, `${d.type ? TYPE_LABEL[d.type] : 'Normal'} · ${d.power ? 'Pot. ' + d.power : 'Estado'} · PP ${mv.pp}/${mv.maxPp}${eff > 1 ? ' · ¡Eficaz!' : eff < 1 ? ' · Poco eficaz' : ''}`));
    b.disabled = mv.pp <= 0;
    b.onclick = () => playerTurn({ move: i });
    box.appendChild(b);
  });
  if (!usable.length) { const b = el('button', 'bmove', 'Forcejeo (sin PP)'); b.onclick = () => playerTurn({ move: 'struggle' }); box.appendChild(b); }
  const back = el('button', 'bmove back', '← Volver'); back.onclick = showBattleMain; box.appendChild(back);
  box.classList.remove('hidden');
}
function openBattleBag() {
  hideBattleMenus();
  openBag({
    canCapture: B.kind === 'wild',
    onCapture: id => throwCard(id),
    onUsed: async msg => { B.busy = true; await bsay(msg); B.anim.hp.p = activeP().hp; await enemyOnlyTurn(); },
    onCancel: () => showBattleMain()
  });
}
function openBattleTeam(forced) {
  hideBattleMenus();
  openPanel(forced ? '¿Quién sale ahora?' : 'Equipo', body => {
    G.team.forEach((m, i) => {
      const can = m.hp > 0 && i !== B.pi;
      const r = monRow(m, can ? () => { panelOnClose = null; closePanel(); switchTo(i, forced); } : null, i === B.pi ? 'en combate' : '');
      if (!can) r.style.opacity = 0.5;
      body.appendChild(r);
    });
  }, { closable: !forced, onClose: forced ? null : () => showBattleMain() });
}
async function switchTo(i, forced) {
  B.busy = true;
  const a = B.anim;
  if (!forced) { await bsay(`¡${monName(activeP())}, vuelve!`, 700); await tween(250, k => { a.pOff = k; }); }
  B.pi = i; B.stages.p = blankStages(); B.sleep.p = 0;
  a.pOff = 0;
  await sendOut('p');
  if (!forced) await enemyOnlyTurn(); else { B.busy = false; showBattleMain(); }
}

// ---------------- TURNOS ----------------
const STRUGGLE = { name: 'Forcejeo', type: null, power: 40, acc: 1, pp: 1 };
function stageMult(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
function effSpeed(m, side) { let s = monStats(m).spd * stageMult(B.stages[side].spd); if (m.status === 'par') s *= 0.5; if (abilityOf(m) === 'veloz') s *= 1.25; return s; }

async function playerTurn(choice) {
  if (B.busy) return;
  B.busy = true; hideBattleMenus();
  const p = activeP(), e = activeE();
  let pmv;
  if (choice.move === 'struggle') pmv = STRUGGLE;
  else { const slot = p.moves[choice.move]; slot.pp--; pmv = MOVES[slot.id]; }
  const emv = enemyMove();
  const pFirst = effSpeed(p, 'p') >= effSpeed(e, 'e') * (0.95 + Math.random() * 0.1);
  const order = pFirst ? [['p', pmv], ['e', emv]] : [['e', emv], ['p', pmv]];
  for (const [side, mv] of order) {
    if (B.over) return;
    const att = side === 'p' ? activeP() : activeE();
    if (att.hp <= 0) continue;
    await doAttack(side, mv);
    if (await checkFaints()) return;
  }
  await endOfTurn();
}
async function enemyOnlyTurn() {
  if (B.over) return;
  await doAttack('e', enemyMove());
  if (await checkFaints()) return;
  await endOfTurn();
}
function enemyMove() {
  const e = activeE(), p = activeP();
  const opts = e.moves.filter(m => m.pp > 0);
  if (!opts.length) return STRUGGLE;
  const smart = B.kind === 'trainer';
  let best = opts[Math.floor(Math.random() * opts.length)];
  if (smart && Math.random() < 0.8) {
    let bs = -1;
    opts.forEach(m => {
      const d = MOVES[m.id];
      let s = d.power ? d.power * d.acc * typeEff(d.type, SPECIES[p.species].type) * (d.type === SPECIES[e.species].type ? 1.2 : 1) : (d.eff && !p.status ? 55 : d.heal && e.hp < monStats(e).hp * 0.5 ? 90 : d.self ? 40 : 20);
      s *= 0.85 + Math.random() * 0.3;
      if (s > bs) { bs = s; best = m; }
    });
  }
  best.pp = Math.max(0, best.pp - 1);
  return MOVES[best.id];
}

async function doAttack(side, mv) {
  const other = side === 'p' ? 'e' : 'p';
  const att = side === 'p' ? activeP() : activeE(), def = side === 'p' ? activeE() : activeP();
  const an = (side === 'e' && B.kind === 'wild' ? 'El ' : '') + monName(att);
  // estados que impiden actuar
  if (att.status === 'slp') {
    if (B.sleep[side] > 0) { B.sleep[side]--; await bsay(`${an} está dormido...`); return; }
    att.status = null; await bsay(`¡${an} se ha despertado!`);
  }
  if (att.status === 'frz') {
    if (Math.random() < 0.25) { att.status = null; await bsay(`¡${an} se ha descongelado!`); }
    else { await bsay(`${an} está congelado y no puede moverse.`); return; }
  }
  if (att.status === 'par' && Math.random() < 0.25) { await bsay(`¡${an} está paralizado y no puede moverse!`); return; }
  await bsay(`${an} usa ${mv.name}.`, 650);
  const a = B.anim;
  a.lunge = { side, k: 0 };
  sfx(mv.power ? 'select' : 'ok');
  await tween(220, k => { a.lunge.k = k * 0.6; });
  spawnMoveFx(other, mv);
  if (Math.random() > mv.acc) {
    await tween(200, k => { a.lunge.k = 0.6 * (1 - k); }); a.lunge = null;
    await bsay('¡Pero ha fallado!', 800); return;
  }
  if (mv.power) {
    const r = damageCalc(att, side, mv, def, other);
    if (r.pinch && !B.said.has(att)) { B.said.add(att); await announceAbility(att, side); }
    const full = def.hp >= monStats(def).hp;
    let sturdy = false;
    if (abilityOf(def) === 'robusto' && full && r.dmg >= def.hp) { r.dmg = def.hp - 1; sturdy = true; }
    def.hp = Math.max(0, def.hp - r.dmg);
    if (mv === STRUGGLE) att.hp = Math.max(0, att.hp - Math.max(1, Math.floor(monStats(att).hp / 8)));
    a.flash[other] = 14; a.shake = r.eff > 1 || r.crit ? 16 : 6;
    sfx(r.crit || r.eff > 1 ? 'crit' : 'hit');
    floatText(other, '-' + r.dmg, r.eff > 1 ? '#ffca28' : '#ff5252');
    await tween(200, k => { a.lunge.k = 0.6 * (1 - k); }); a.lunge = null;
    await tween(550, k => { a.hp[other] = lerp(a.hp[other], def.hp, ease(k)); });
    a.hp[other] = def.hp;
    if (r.crit) await bsay('¡Un golpe crítico!', 700);
    if (r.eff > 1) await bsay('¡Es muy eficaz!', 700);
    else if (r.eff < 1) await bsay('No es muy eficaz...', 700);
    if (sturdy) { await announceAbility(def, other); await bsay(`¡${monName(def)} aguanta el golpe!`, 800); }
    // piel reactiva: quien golpea puede quemarse, paralizarse...
    if (mv !== STRUGGLE && abilityOf(def) === 'reactiva' && att.hp > 0 && !att.status && Math.random() < 0.25) {
      const st = REACTIVE_STATUS[SPECIES[def.species].type] || 'par';
      await announceAbility(def, other); await applyStatus(att, side, st);
    }
    if (def.hp > 0 && mv.eff && Math.random() < mv.eff.chance) await applyStatus(def, other, mv.eff.status);
    if (def.hp > 0 && mv.foeChance && Math.random() < mv.foeChance.chance) await changeStage(other, 'spd', mv.foeChance.spd);
    if (mv.heal) { const st = monStats(att); const h = Math.min(st.hp - att.hp, Math.floor(st.hp * mv.heal)); if (h > 0) { att.hp += h; await tween(400, k => { a.hp[side] = lerp(a.hp[side], att.hp, k); }); await bsay(`${an} recupera energía.`, 700); } }
  } else {
    await tween(200, k => { a.lunge.k = 0.6 * (1 - k); }); a.lunge = null;
    if (mv.eff) { if (!(await applyStatus(def, other, mv.eff.status))) await bsay('No ha tenido efecto.', 700); }
    if (mv.self) for (const [k, v] of Object.entries(mv.self)) await changeStage(side, k, v);
    if (mv.foe) for (const [k, v] of Object.entries(mv.foe)) await changeStage(other, k, v);
    if (mv.heal) {
      const st = monStats(att), h = Math.min(st.hp - att.hp, Math.floor(st.hp * mv.heal));
      if (h > 0) { att.hp += h; sfx('heal'); await tween(500, k => { a.hp[side] = lerp(a.hp[side], att.hp, k); }); await bsay(`${an} recupera ${h} PS.`, 800); }
      else await bsay('Ya tiene todos los PS.', 700);
    }
  }
}

function damageCalc(att, aside, mv, def, dside) {
  const as = monStats(att), ds = monStats(def);
  let atk = as.atk * stageMult(B.stages[aside].atk), dfn = ds.def * stageMult(B.stages[dside].def);
  const aa = abilityOf(att), da = abilityOf(def);
  if (att.status === 'brn' && aa !== 'agallas') atk *= 0.7;
  if (att.status && aa === 'agallas') atk *= 1.5;
  const eff = typeEff(mv.type, SPECIES[def.species].type);
  const stab = mv.type && mv.type === SPECIES[att.species].type ? 1.2 : 1;
  const pinch = aa === 'furia' && stab > 1 && att.hp <= monStats(att).hp / 3;
  const crit = Math.random() < (aa === 'suerte' ? 1 / 12 : 1 / 24);
  let k = (pinch ? 1.5 : 1) * (aa === 'aura' ? 1.2 : 1) * (da === 'coraza' && eff > 1 ? 0.75 : 1);
  const base = ((att.level / 5 + 2) * mv.power * atk / dfn) / 10 + 2;
  const dmg = Math.max(1, Math.floor(base * eff * stab * k * (crit ? 1.5 : 1) * (0.9 + Math.random() * 0.1)));
  return { dmg, eff, crit, pinch };
}

async function applyStatus(m, side, st) {
  if (m.status || m.hp <= 0) return false;
  const ty = SPECIES[m.species].type;
  if ((st === 'brn' && ty === 'fuego') || (st === 'frz' && ty === 'hielo') || (st === 'par' && ty === 'electrico') || (st === 'psn' && ty === 'naturaleza')) return false;
  m.status = st;
  if (st === 'slp') B.sleep[side] = 1 + Math.floor(Math.random() * 3);
  sfx('bad');
  const n = monName(m);
  await bsay({ brn: `¡${n} se ha quemado!`, psn: `¡${n} ha sido envenenado!`, par: `¡${n} está paralizado!`, slp: `¡${n} se ha dormido!`, frz: `¡${n} se ha congelado!` }[st], 900);
  return true;
}
async function changeStage(side, stat, delta) {
  const s = B.stages[side], before = s[stat];
  const who = side === 'p' ? activeP() : activeE();
  if (delta < 0 && abilityOf(who) === 'aura') { await bsay(`¡El aura de ${monName(who)} impide que le bajen las estadísticas!`, 900); return; }
  s[stat] = clamp(s[stat] + delta, -6, 6);
  const m = side === 'p' ? activeP() : activeE(), n = monName(m);
  const lab = { atk: 'ataque', def: 'defensa', spd: 'velocidad' }[stat];
  if (s[stat] === before) { await bsay(`¡El ${lab} de ${n} no puede ${delta > 0 ? 'subir' : 'bajar'} más!`, 800); return; }
  sfx(delta > 0 ? 'levelup' : 'bad');
  await bsay(`¡${delta > 0 ? 'Sube' : 'Baja'} ${Math.abs(delta) > 1 ? 'mucho ' : ''}el ${lab} de ${n}!`, 900);
}

async function endOfTurn() {
  for (const side of ['p', 'e']) {
    const m = side === 'p' ? activeP() : activeE();
    if (!m || m.hp <= 0) continue;
    if (m.status === 'brn' || m.status === 'psn') {
      const d = Math.max(1, Math.floor(monStats(m).hp / (m.status === 'psn' ? 8 : 16)));
      m.hp = Math.max(0, m.hp - d);
      B.anim.flash[side] = 8;
      await tween(400, k => { B.anim.hp[side] = lerp(B.anim.hp[side], m.hp, k); });
      await bsay(`${monName(m)} sufre por ${m.status === 'brn' ? 'la quemadura' : 'el veneno'}.`, 800);
      if (await checkFaints()) return;
    }
    const mx = monStats(m).hp;
    if (abilityOf(m) === 'regenera' && m.hp > 0 && m.hp < mx) {
      m.hp = Math.min(mx, m.hp + Math.max(1, Math.floor(mx / 16)));
      await tween(300, k => { B.anim.hp[side] = lerp(B.anim.hp[side], m.hp, k); });
      B.anim.hp[side] = m.hp;
      await bsay(`[${abilityName(m)}] ${monName(m)} recupera un poco de vida.`, 700);
    }
  }
  B.busy = false;
  showBattleMain();
}

// ---------------- DEBILITADOS ----------------
async function checkFaints() {
  const a = B.anim, e = activeE(), p = activeP();
  if (e.hp <= 0) {
    sfx('faint');
    await tween(500, k => { a.faint.e = k; });
    await bsay(`¡${monName(e)} se ha debilitado!`, 900);
    await giveExp(e);
    const next = B.enemyTeam.findIndex(m => m.hp > 0);
    if (next < 0) { await endBattle('win'); return true; }
    B.ei = next; B.stages.e = blankStages(); B.sleep.e = 0;
    B.part = new Set([activeP()]);
    await sendOut('e');
    if (activeP().hp <= 0) return await checkFaints();
    B.busy = false; showBattleMain();
    return true;
  }
  if (p.hp <= 0) {
    sfx('faint');
    await tween(500, k => { a.faint.p = k; });
    await bsay(`¡${monName(p)} se ha debilitado!`, 900);
    B.part.delete(p);
    if (!G.team.some(m => m.hp > 0)) { await endBattle('lose'); return true; }
    a.pShow = false;
    B.busy = false;
    openBattleTeam(true);
    return true;
  }
  return false;
}

// ---------------- EXPERIENCIA ----------------
function expYield(e) {
  const sp = SPECIES[e.species];
  return Math.floor(e.level * (30 + (sp.stage || 0) * 10) * (B.kind === 'trainer' ? 1.5 : 1) * (e.legendary || sp.legendary ? 2 : 1));
}
async function giveExp(e) {
  const total = expYield(e);
  for (const m of G.team) {
    if (m.hp <= 0) continue;
    const gain = B.part.has(m) ? total : Math.floor(total / 2);
    m.exp += gain;
    if (m === activeP()) await bsay(`${monName(m)} gana ${gain} puntos de experiencia.`, 900);
    while (m.level < 100 && m.exp >= expToNext(m.level)) {
      m.exp -= expToNext(m.level);
      const learned = levelUpMon(m, false);
      if (m === activeP()) B.anim.hp.p = m.hp;
      await bsay(`¡${monName(m)} sube al nivel ${m.level}!`, 1000);
      for (const mid of learned) await bsay(`¡${monName(m)} ha aprendido ${MOVES[mid].name}!`, 1000);
    }
  }
}
// sube un nivel: recalcula PS, aprende movimientos y marca la evolución pendiente
function levelUpMon(m, fromItem) {
  const oldMax = monStats(m).hp;
  m.level++;
  sfx('levelup');
  const nm = monStats(m).hp;
  m.hp = m.hp > 0 ? Math.min(nm, m.hp + (nm - oldMax)) : 0;
  const sp = SPECIES[m.species];
  const now4 = movesUpTo(m.species, m.level), had = m.moves.map(x => x.id);
  const learned = now4.filter(id => !had.includes(id));
  if (learned.length) m.moves = now4.map(id => m.moves.find(x => x.id === id) || { id, pp: MOVES[id].pp, maxPp: MOVES[id].pp });
  if (sp.evolvesTo && m.level >= sp.evolveLevel && !m.pendingEvo) m.pendingEvo = sp.evolvesTo;
  return learned;
}

// ---------------- CAPTURA Y HUIDA ----------------
async function throwCard(id) {
  B.busy = true; hideBattleMenus();
  const e = activeE(), it = ITEMS[id], a = B.anim;
  consumeItem(id);
  await bsay(`¡Lanzas un ${it.name}!`, 600);
  const L = battleLayout();
  a.card = { x: L.p.x, y: L.p.y - L.p.s * 0.5, rot: 0, gold: id !== 'cromo' };
  const sx = a.card.x, sy = a.card.y, tx = L.e.x, ty = L.e.y - L.e.s * 0.4;
  await tween(550, k => { a.card.x = lerp(sx, tx, k); a.card.y = lerp(sy, ty, k) - Math.sin(k * Math.PI) * L.e.s * 0.6; a.card.rot = k * 12; });
  a.white.e = 1; await tween(260, k => { a.white.e = 1 - k * 0.2; });
  a.eShow = false; a.white.e = 0;
  await tween(250, k => { a.card.y = ty + k * L.e.s * 0.45; a.card.rot = 0; });
  const hpR = e.hp / monStats(e).hp;
  const stBonus = e.status === 'slp' || e.status === 'frz' ? 1.6 : e.status ? 1.25 : 1;
  const legend = (e.legendary || SPECIES[e.species].legendary) ? 0.4 : 1;
  const chance = it.rate >= 999 ? 1 : Math.min(0.97, (0.9 - hpR * 0.62) * it.rate * stBonus * legend * (e.level > 40 ? 0.85 : 1) + 0.04);
  const ok = Math.random() < chance;
  const shakes = ok ? 3 : Math.floor(Math.random() * 3);
  for (let i = 0; i < shakes; i++) { await wait(260); sfx('capture'); await tween(300, k => { a.card.rot = Math.sin(k * Math.PI * 2) * 0.5; }); }
  await wait(300);
  if (ok) {
    spawnFx('e', '#fff59d', 20);
    sfx('win');
    await bsay(`¡Ya está! ¡Has capturado a ${SPECIES[e.species].name}!`, 1400);
    G.caught[e.species] = true; G.seen[e.species] = true;
    stat('captures'); if (e.shiny) stat('shinyCaught');
    missionEvent('capture', { species: e.species });
    const mon = JSON.parse(JSON.stringify(e)); mon.status = null;
    if (G.team.length < 6) { G.team.push(mon); await bsay(`${SPECIES[e.species].name} se une a tu equipo.`, 1000); }
    else { G.box.push(mon); await bsay(`Tu equipo está lleno: ${SPECIES[e.species].name} va a la caja del Centro Coremon.`, 1400); }
    a.card = null;
    await endBattle('capture');
  } else {
    a.card = null; a.eShow = true;
    spawnFx('e', '#ffffff', 10);
    await bsay(['¡Oh, no! Se ha escapado.', '¡Casi lo tenías!', '¡Uf, ha faltado poco!'][Math.min(2, shakes)], 900);
    await enemyOnlyTurn();
  }
}
async function tryRun() {
  if (B.busy) return;
  B.busy = true; hideBattleMenus();
  if (B.kind !== 'wild' || B.noRun) { await bsay('¡No puedes huir de este combate!'); B.busy = false; showBattleMain(); return; }
  const ok = effSpeed(activeP(), 'p') >= effSpeed(activeE(), 'e') * 0.8 || Math.random() < 0.55;
  if (ok) { await bsay('¡Escapas sin problemas!', 800); await endBattle('run'); }
  else { await bsay('¡No has podido escapar!', 800); await enemyOnlyTurn(); }
}

// ---------------- FIN DEL COMBATE ----------------
async function endBattle(result) {
  B.over = true; B.busy = true; hideBattleMenus();
  const tr = B.trainer;
  if (result === 'win') stat(B.kind === 'trainer' ? 'trainers' : 'wins');
  if (result === 'win' && B.kind === 'trainer') {
    music('victory');
    await bsay(`¡Has vencido a ${tr.name}!`, 1100);
    const prize = tr.prize || 0;
    if (prize) { G.money += prize; await bsay(`Recibes ${prize} monedas.`, 1000); }
  }
  if (result === 'win' && B.kind === 'wild' && B.region != null) missionEvent('wild', { region: B.region });
  if (result === 'win' && B.kind === 'wild') {
    const found = Math.floor(activeE().level * 5 + Math.random() * 30);
    G.money += found;
    await bsay(`Encuentras ${found} monedas en la hierba.`, 900);
  }
  if (result === 'lose') {
    const lost = Math.floor(G.money / 2);
    G.money -= lost;
    await bsay(`Te has quedado sin Coremon en pie... Pierdes ${lost} monedas.`, 1600);
  }
  G.team.forEach(m => { if (m.hp < 0) m.hp = 0; });
  await fadeOut();
  $('battle-ui').classList.add('hidden');
  closePanelSilently();
  const res = B.res, evos = G.team.filter(m => m.pendingEvo);
  B = null;
  STATE = 'WORLD';
  if (result === 'lose') {
    G.team.forEach(healMon);
    const c = G.lastCenter || { map: 'world', x: CITY.gasteiz.x * TS - 8 * TS, y: (CITY.gasteiz.y - 5) * TS };
    setMap(c.map, c.x, c.y, 'down');
  }
  showWorldUI(true);
  setWorldControls();
  updateMusic(true);
  await fadeIn();
  for (const m of evos) await runEvolution(m);
  if (result === 'lose') await say('Corres al Centro Coremon más cercano. La enfermera cura a tu equipo. ¡Ánimo, la próxima vez saldrá mejor!');
  saveGame(true);
  res(result);
}
function closePanelSilently() { if (!$('panel').classList.contains('hidden')) { panelOnClose = null; $('panel').classList.add('hidden'); panelPrev = null; } }

// ---------------- EVOLUCIÓN ----------------
let evoAnim = null;
async function runEvolution(m) {
  const from = m.species, to = m.pendingEvo;
  delete m.pendingEvo;
  if (!to) return;
  const prev = STATE;
  STATE = 'BATTLE';
  showWorldUI(false);
  evoAnim = { from, to, t0: performance.now() };
  music(null); sfx('rumble');
  await wait(4200);
  sfx('levelup');
  const oldMax = monStats(m).hp;
  m.species = to;
  m.hp = Math.min(monStats(m).hp, m.hp + (monStats(m).hp - oldMax));
  const now4 = movesUpTo(to, m.level);
  m.moves = now4.map(id => m.moves.find(x => x.id === id) || { id, pp: MOVES[id].pp, maxPp: MOVES[id].pp });
  G.seen[to] = true; G.caught[to] = true;
  stat('evos');
  evoAnim.done = true;
  await say(`¡Enhorabuena! ¡${SPECIES[from].name} ha evolucionado a ${SPECIES[to].name}!`);
  evoAnim = null;
  STATE = prev === 'BATTLE' ? 'WORLD' : prev;
  if (STATE === 'WORLD') showWorldUI(true);
  setWorldControls();
  updateMusic(true);
}

// ---------------- EFECTOS ----------------
const FX_COLORS = { fuego: ['#ff7b29', '#ffd54f'], agua: ['#4fc3f7', '#e1f5fe'], naturaleza: ['#66bb6a', '#c5e1a5'], electrico: ['#ffeb3b', '#fffde7'], hielo: ['#b3e5fc', '#ffffff'], roca: ['#a1887f', '#6d4c41'], aire: ['#e3f2fd', '#90caf9'], sombra: ['#7e57c2', '#311b92'], luz: ['#fff59d', '#ffffff'], logica: ['#7986cb', '#e8eaf6'], letras: ['#ce93d8', '#f3e5f5'], arte: ['#f48fb1', '#80deea'], idioma: ['#ffcc80', '#fff3e0'], fisico: ['#ef9a9a', '#ffffff'] };
function spawnFx(side, color, n) {
  const L = battleLayout(), c = side === 'e' ? L.e : L.p;
  for (let i = 0; i < n; i++) B.fx.push({ x: c.x + (Math.random() - 0.5) * c.s * 0.5, y: c.y - c.s * 0.45 + (Math.random() - 0.5) * c.s * 0.4, vx: (Math.random() - 0.5) * 9 * DPR, vy: (Math.random() - 0.8) * 8 * DPR, life: 1, color, size: (3 + Math.random() * 5) * DPR });
}
function spawnMoveFx(side, mv) {
  const cols = FX_COLORS[mv.type] || ['#ffffff', '#cfd8dc'];
  for (let k = 0; k < 2; k++) spawnFx(side, cols[k], 14);
}
function floatText(side, text, color) { const L = battleLayout(), c = side === 'e' ? L.e : L.p; B.texts.push({ x: c.x, y: c.y - c.s * 0.8, text, color, life: 1 }); }

// ---------------- DIBUJADO ----------------
const SCENE_COL = {
  meadow: ['#8fd3ff', '#d7f0ff', '#7cc35a', '#5aa13f'], plains: ['#9fd8ff', '#e6f6ff', '#a5cf63', '#7fae45'], coast: ['#7fc8ff', '#e0f4ff', '#f2dfa0', '#d8c07a'],
  swamp: ['#6e8a7a', '#b7c9b0', '#5f7a46', '#46603a'], desert: ['#ffcf8a', '#fff1d2', '#e8cf8a', '#cfa860'], volcano: ['#6b2f2a', '#d9774a', '#5a4a46', '#3e3230'],
  snow: ['#b9d7ef', '#f2f8ff', '#eef4fb', '#c7dbe8'], forest: ['#6fae8a', '#cfe8c8', '#4f8f3e', '#3b7032'], peak: ['#8fb2e0', '#e8f0ff', '#8aa86e', '#6f8f58'],
  indoor: ['#4a4560', '#7b7390', '#b8a888', '#8d7d60'], gym: ['#3a2f55', '#6b5a8f', '#d9cfc4', '#b5a998'], corp: ['#1d1a26', '#3a2f3f', '#3a3640', '#26232c'], liga: ['#3a2a10', '#c9a040', '#e8dcc0', '#c4b48c']
};
const sceneCache = {};
function sceneCanvas(name) {
  const key = name + ':' + VW + 'x' + VH;
  if (sceneCache[key]) return sceneCache[key];
  const c = document.createElement('canvas'); c.width = VW; c.height = VH;
  const g = c.getContext('2d'), [s1, s2, g1, g2] = SCENE_COL[name] || SCENE_COL.meadow;
  const hz = VH * 0.42;
  let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, s1); gr.addColorStop(1, s2); g.fillStyle = gr; g.fillRect(0, 0, VW, hz);
  // horizonte: colinas, montañas o paredes
  const r = mulberry32(strSeed(name));
  for (let layer = 0; layer < 2; layer++) {
    g.fillStyle = shade(g1, layer ? -18 : 10); g.globalAlpha = layer ? 1 : 0.6;
    g.beginPath(); g.moveTo(0, hz);
    const amp = name === 'snow' || name === 'peak' || name === 'volcano' ? VH * 0.12 : VH * 0.05;
    for (let x = 0; x <= VW; x += VW / 24) g.lineTo(x, hz - amp * (0.4 + r()) * (layer ? 0.6 : 1));
    g.lineTo(VW, hz); g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
  gr = g.createLinearGradient(0, hz, 0, VH); gr.addColorStop(0, g1); gr.addColorStop(1, g2); g.fillStyle = gr; g.fillRect(0, hz, VW, VH - hz);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.06})`; g.fillRect(r() * VW, hz + r() * (VH - hz), 3 * DPR, 2 * DPR); }
  if (name === 'volcano') { g.fillStyle = 'rgba(255,120,40,0.35)'; g.beginPath(); g.ellipse(VW * 0.82, hz - VH * 0.1, VW * 0.05, VH * 0.03, 0, 0, 7); g.fill(); }
  return (sceneCache[key] = c);
}

function battleLayout() {
  if (R3.ok && R3.bl) return R3.bl;
  const portrait = VH > VW * 1.05;
  const ui = ($('battle-ui').getBoundingClientRect().height || 160) * DPR;
  if (portrait) {
    const se = VW * 0.4, sp = VW * 0.5;
    return { portrait, ui, e: { x: VW * 0.7, y: VH * 0.36, s: se }, p: { x: VW * 0.3, y: VH - ui - VH * 0.06, s: sp } };
  }
  const se = Math.min(VW * 0.24, VH * 0.36), sp = se * 1.2;
  return { portrait, ui, e: { x: VW * 0.7, y: VH * 0.44, s: se }, p: { x: VW * 0.28, y: Math.min(VH - ui - VH * 0.02, VH * 0.82), s: sp } };
}

function renderBattle2D() {
  const a = B.anim, L = battleLayout();
  const sh = a.shake > 0 ? (Math.random() - 0.5) * a.shake * DPR : 0;
  if (a.shake > 0) a.shake *= 0.86;
  ctx.drawImage(sceneCanvas(B.scene), sh, 0);
  // plataformas
  const plat = (c, k) => { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(c.x + sh, c.y, c.s * 0.62, c.s * 0.16, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(c.x + sh, c.y - c.s * 0.02, c.s * 0.55, c.s * 0.12, 0, 0, 7); ctx.fill(); };
  plat(L.e); plat(L.p);
  const t = now / 1000;
  // Coremon enemigo
  if (a.eShow && a.faint.e < 1) {
    const e = activeE(), s = L.e.s, lg = a.lunge && a.lunge.side === 'e' ? a.lunge.k : 0;
    const x = L.e.x - s / 2 + a.eOff * VW * 0.6 - lg * s * 0.5 + sh, y = L.e.y - s * 0.92 + a.faint.e * s * 0.6 + lg * s * 0.25;
    if (!(a.flash.e > 0 && Math.floor(a.flash.e) % 4 < 2)) drawCreature(ctx, e.species, x, y + Math.sin(t * 2.2) * s * 0.012, s, { white: a.white.e, alpha: 1 - a.faint.e, shiny: e.shiny });
    if (e.legendary || SPECIES[e.species].legendary) { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3); ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.ellipse(L.e.x + sh, L.e.y - s * 0.4, s * 0.55, s * 0.55, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  }
  // entrenador rival
  if (a.tShow && B.trainer) {
    const s = L.e.s * 1.1 / PH * 1.6;
    ctx.save(); ctx.translate(L.e.x + VW * 0.08 + a.tOff * VW * 0.5, L.e.y); ctx.scale(s, s);
    drawPerson(ctx, B.trainer.look || LOOKS2.grunt, 0, 0, 'down', 0, B.trainer.custom);
    ctx.restore();
  }
  // Coremon del jugador (de espaldas = volteado)
  if (a.pShow && a.faint.p < 1) {
    const p = activeP(), s = L.p.s, lg = a.lunge && a.lunge.side === 'p' ? a.lunge.k : 0;
    const x = L.p.x - s / 2 - a.pOff * VW * 0.6 + lg * s * 0.5, y = L.p.y - s * 0.92 + a.faint.p * s * 0.6 - lg * s * 0.25;
    if (!(a.flash.p > 0 && Math.floor(a.flash.p) % 4 < 2)) drawCreature(ctx, p.species, x, y + Math.sin(t * 2.2 + 1) * s * 0.012, s, { flip: true, white: a.white.p, alpha: 1 - a.faint.p, shiny: p.shiny });
  } else if (!a.pShow && a.pOff > 0.01 && a.tShow !== undefined) {
    const s = L.p.s * 1.2 / PH * 1.3;
    ctx.save(); ctx.translate(L.p.x - a.pOff * VW * 0.4, L.p.y); ctx.scale(s, s); drawPerson(ctx, LOOKS2.player, 0, 0, 'up', 0, 'jugador'); ctx.restore();
  }
  ['e', 'p'].forEach(k => { if (a.flash[k] > 0) a.flash[k] -= 0.6; });
}

function renderBattle() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (evoAnim) { renderEvolution(); return; }
  if (!B) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); return; }
  const a = B.anim;
  if (R3.ok) {
    ctx.clearRect(0, 0, VW, VH);
    render3DBattle();
    if (a.shake > 0) a.shake *= 0.86;
    ['e', 'p'].forEach(k => { if (a.flash[k] > 0) a.flash[k] -= 0.6; });
  } else renderBattle2D();
  const L = battleLayout();
  // cromo
  if (a.card) {
    ctx.save(); ctx.translate(a.card.x, a.card.y); ctx.rotate(a.card.rot);
    const w = 22 * DPR, h = 30 * DPR;
    ctx.fillStyle = a.card.gold ? '#ffd54f' : '#42a5f5'; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#1d1a26'; ctx.lineWidth = 2 * DPR; ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 + 4 * DPR, -h / 2 + 4 * DPR, w - 8 * DPR, h * 0.45);
    ctx.restore();
  }
  // destellos de variocolor
  if (a.sparkle && now - a.sparkle.t < 1600) {
    const c = a.sparkle.side === 'e' ? L.e : L.p, q = (now - a.sparkle.t) / 1600;
    for (let i = 0; i < 9; i++) {
      const ang = i / 9 * Math.PI * 2 + q * 2, rr = c.s * (0.25 + q * 0.55), r = c.s * 0.09 * Math.sin(Math.min(1, q * 3 + i * 0.05) * Math.PI);
      const x = c.x + Math.cos(ang) * rr, y = c.y - c.s * 0.5 + Math.sin(ang) * rr * 0.7;
      ctx.globalAlpha = 1 - q; ctx.fillStyle = i % 2 ? '#fff59d' : '#ffffff';
      ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.lineTo(x + r * 0.5, y - r * 0.5); ctx.lineTo(x + r * 2, y); ctx.lineTo(x + r * 0.5, y + r * 0.5); ctx.lineTo(x, y + r * 2); ctx.lineTo(x - r * 0.5, y + r * 0.5); ctx.lineTo(x - r * 2, y); ctx.lineTo(x - r * 0.5, y - r * 0.5); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // partículas y números
  for (const f of B.fx) { f.x += f.vx; f.y += f.vy; f.vy += 0.35 * DPR; f.life -= 0.025; ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.color; ctx.fillRect(f.x, f.y, f.size, f.size); }
  B.fx = B.fx.filter(f => f.life > 0);
  ctx.globalAlpha = 1;
  ctx.font = `bold ${26 * DPR}px Trebuchet MS, sans-serif`; ctx.textAlign = 'center';
  for (const tx of B.texts) { tx.y -= 1.2 * DPR; tx.life -= 0.02; ctx.globalAlpha = Math.max(0, tx.life); ctx.lineWidth = 5 * DPR; ctx.strokeStyle = '#1d1a26'; ctx.strokeText(tx.text, tx.x, tx.y); ctx.fillStyle = tx.color; ctx.fillText(tx.text, tx.x, tx.y); }
  B.texts = B.texts.filter(x => x.life > 0);
  ctx.globalAlpha = 1;
  // cuadros de información
  if (a.eShow || a.faint.e > 0) infoBox(activeE(), 'e', L, false);
  if (a.pShow) infoBox(activeP(), 'p', L, true);
  if (B.kind === 'trainer') teamBalls(L);
}

function infoBox(m, side, L, mine) {
  const s = DPR, w = Math.min(VW * (L.portrait ? 0.56 : 0.34), 380 * s), h = (mine ? 74 : 60) * s;
  const x = mine ? VW - w - 14 * s : 14 * s;
  const y = mine ? (L.portrait ? Math.min(L.p.y + 14 * s, VH - L.ui - h - 8 * s) : VH - L.ui - h - 14 * s) : (L.portrait ? 74 * s : 18 * s);
  ctx.fillStyle = 'rgba(20,18,34,0.88)'; roundRect(ctx, x, y, w, h, 14 * s); ctx.fill();
  ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2.5 * s; ctx.stroke();
  const sp = SPECIES[m.species], st = monStats(m);
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `bold ${17 * s}px Trebuchet MS, sans-serif`;
  ctx.fillText((m.legendary || sp.legendary ? '★ ' : '') + (m.shiny ? '✨' : '') + monName(m), x + 12 * s, y + 22 * s);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffd54f'; ctx.fillText('Nv ' + m.level, x + w - 12 * s, y + 22 * s);
  // tipo y estado
  ctx.textAlign = 'left'; ctx.font = `bold ${11 * s}px Trebuchet MS, sans-serif`;
  let cx = x + 12 * s;
  const chip = (txt, col, dark) => { const tw = ctx.measureText(txt).width + 10 * s; ctx.fillStyle = col; roundRect(ctx, cx, y + 28 * s, tw, 15 * s, 6 * s); ctx.fill(); ctx.fillStyle = dark ? '#1d1a26' : '#fff'; ctx.fillText(txt, cx + 5 * s, y + 39 * s); cx += tw + 4 * s; };
  chip(TYPE_LABEL[sp.type], TYPE_COLOR[sp.type], ['luz', 'electrico', 'hielo'].includes(sp.type));
  if (m.status) chip(STATUS[m.status].short, STATUS[m.status].color, m.status === 'par');
  // barra de PS
  const hpShown = B.anim.hp[side] != null ? B.anim.hp[side] : m.hp, pct = clamp(hpShown / st.hp, 0, 1);
  const bx = x + 12 * s, by = y + 48 * s, bw = w - 24 * s;
  ctx.fillStyle = '#3a3650'; roundRect(ctx, bx, by, bw, 8 * s, 4 * s); ctx.fill();
  ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.2 ? '#fbc02d' : '#e53935'; roundRect(ctx, bx, by, Math.max(0.01, bw * pct), 8 * s, 4 * s); ctx.fill();
  if (mine) {
    ctx.fillStyle = '#e0dcef'; ctx.font = `bold ${12 * s}px Trebuchet MS, sans-serif`; ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(hpShown)}/${st.hp}`, x + w - 12 * s, y + 70 * s);
    const xp = clamp(m.exp / expToNext(m.level), 0, 1);
    ctx.fillStyle = '#3a3650'; ctx.fillRect(bx, y + 62 * s, bw * 0.6, 4 * s); ctx.fillStyle = '#4fc3f7'; ctx.fillRect(bx, y + 62 * s, bw * 0.6 * xp, 4 * s);
  }
}
function teamBalls(L) {
  const s = DPR, n = B.enemyTeam.length, x0 = 22 * s, y = (L.portrait ? 74 : 18) * s + 70 * s;
  for (let i = 0; i < n; i++) { ctx.fillStyle = B.enemyTeam[i].hp > 0 ? '#e53935' : '#616161'; ctx.beginPath(); ctx.arc(x0 + i * 16 * s, y, 5 * s, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * s; ctx.stroke(); }
}

function renderEvolution() {
  const e = evoAnim, t = (performance.now() - e.t0) / 1000;
  ctx.fillStyle = '#0b0b1e'; ctx.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 3 + i)})`; ctx.fillRect((i * 97 + t * 60) % VW, (i * 53) % VH, 2 * DPR, 2 * DPR); }
  const k = Math.min(1, t / 4.2), freq = 2 + k * 18;
  const showNew = e.done || (Math.sin(t * freq * Math.PI) > 0 && k > 0.15);
  const s = Math.min(VW, VH) * 0.45;
  drawCreature(ctx, showNew ? e.to : e.from, VW / 2 - s / 2, VH * 0.42 - s / 2, s, { white: e.done ? 0 : 0.85 });
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `bold ${22 * DPR}px Trebuchet MS, sans-serif`;
  if (!e.done) ctx.fillText(`¡${SPECIES[e.from].name} está evolucionando!`, VW / 2, VH * 0.78);
}

// ---------------- SALVAJES ----------------
function evolveForLevel(id, lvl) {
  let cur = id;
  for (let i = 0; i < 3; i++) { const sp = SPECIES[cur]; if (sp.evolvesTo && lvl >= sp.evolveLevel) cur = sp.evolvesTo; else break; }
  return cur;
}
