// ============================================================
// COREMON - Sistema de combate por turnos (con animaciones)
// ============================================================

let battle = null; // estado de la batalla activa
let battleAnimT = 0;

const battleScreen = document.getElementById('battle-screen');
const battleCanvas = document.getElementById('battle-canvas');
const bctx = battleCanvas.getContext('2d');
const battleLog = document.getElementById('battle-log');
const battleMenu = document.getElementById('battle-menu');
const moveMenu = document.getElementById('move-menu');
const teamMenu = document.getElementById('team-menu');

const STRUGGLE = { name:'Forcejeo', type:null, power:25, acc:1.0, pp:999 };
const ATTACK_MS = 2000; // cada ataque (ida, impacto, vuelta) dura ~2s, como pide el diseño

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

function startWildBattle(zone) {
  const pool = WILD_TABLE[zone] || WILD_TABLE.patio;
  const speciesId = pool[Math.floor(Math.random()*pool.length)];
  const lvl = 3 + Math.floor(Math.random()*6);
  openBattle({ kind:'wild', enemyTeam:[createPokemon(speciesId, lvl)] });
}

function startTrainerBattle(trainer) {
  const enemyTeam = trainer.team.map(([sp,lvl]) => createPokemon(sp, lvl));
  openBattle({ kind:'trainer', trainer, enemyTeam });
}

function openBattle(opts) {
  STATE = 'BATTLE';
  battle = {
    kind: opts.kind,
    trainer: opts.trainer || null,
    playerTeam: game.team,
    playerActive: 0,
    enemyTeam: opts.enemyTeam,
    enemyActive: 0,
    over: false,
    busy: false,
    playerDefending: false,
    flashPlayer: 0,
    flashEnemy: 0,
    lunge: null, // {side:'player'|'enemy', progress:0..1}
    floatingTexts: []
  };
  battleScreen.classList.remove('hidden');
  logClear();
  log(opts.kind === 'trainer'
    ? `${opts.trainer.name} te desafía con ${opts.trainer.subject}!`
    : `¡Un ${SPECIES[battle.enemyTeam[0].species].name} salvaje aparece!`);
  renderBattle();
  showMainMenu();
  requestAnimationFrame(battleAnimLoop);
}

function activePlayer() { return battle.playerTeam[battle.playerActive]; }
function activeEnemy() { return battle.enemyTeam[battle.enemyActive]; }

function logClear() { battleLog.innerHTML = ''; }
function log(msg) {
  const p = document.createElement('div');
  p.textContent = msg;
  battleLog.appendChild(p);
  battleLog.scrollTop = battleLog.scrollHeight;
}

function floatText(side, text, color) {
  const w = battleCanvas.width, h = battleCanvas.height;
  const x = side === 'enemy' ? w*0.74 : w*0.26;
  const y = side === 'enemy' ? h*0.62 - 90 : h*0.88 - 110;
  battle.floatingTexts.push({ text, x, y, life: 55, maxLife: 55, color: color || '#fff' });
}

// ---------------- RENDER DE SPRITES EN COMBATE ----------------
function battleAnimLoop(ts) {
  if (!battle) return;
  battleAnimT = ts || 0;
  drawBattleScene();
  if (STATE === 'BATTLE') requestAnimationFrame(battleAnimLoop);
}

function easeInOut(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }

function drawBattleScene() {
  if (!battle) return;
  const w = battleCanvas.width, h = battleCanvas.height;
  bctx.clearRect(0,0,w,h);
  const grad = bctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0, '#9fd1ff');
  grad.addColorStop(0.55, '#d7ecb0');
  grad.addColorStop(1, '#8fbf6a');
  bctx.fillStyle = grad;
  bctx.fillRect(0,0,w,h);
  bctx.fillStyle = 'rgba(0,0,0,0.12)';
  bctx.beginPath(); bctx.ellipse(w*0.74, h*0.62, 46, 14, 0, 0, Math.PI*2); bctx.fill();
  bctx.beginPath(); bctx.ellipse(w*0.26, h*0.88, 54, 15, 0, 0, Math.PI*2); bctx.fill();

  const bob = Math.sin(battleAnimT / 220) * 3;
  const e = activeEnemy(), p = activePlayer();

  // desplazamiento de embestida (lunge) hacia el rival durante el ataque
  let lungeEnemyX = 0, lungePlayerX = 0;
  if (battle.lunge) {
    const amt = Math.sin(easeInOut(battle.lunge.progress) * Math.PI) * 26;
    if (battle.lunge.side === 'enemy') lungeEnemyX = -amt;
    if (battle.lunge.side === 'player') lungePlayerX = amt;
  }

  if (e) {
    const shakeE = battle.flashEnemy > 0 ? (Math.random()*8-4) : 0;
    drawCreature(bctx, e.species, w*0.74 - 34 + shakeE + lungeEnemyX, h*0.62 - 68 + bob, 68, { bob: 0 });
    if (battle.flashEnemy > 0) battle.flashEnemy--;
  }
  if (p) {
    const shakeP = battle.flashPlayer > 0 ? (Math.random()*8-4) : 0;
    drawCreature(bctx, p.species, w*0.26 - 42 + shakeP + lungePlayerX, h*0.88 - 84 - bob, 84, { bob: 0, flip:true });
    if (battle.flashPlayer > 0) battle.flashPlayer--;
  }
  if (battle.playerDefending) {
    bctx.fillStyle = 'rgba(100,180,255,0.35)';
    bctx.beginPath(); bctx.arc(w*0.26, h*0.88-45, 46, 0, Math.PI*2); bctx.fill();
  }

  // texto flotante (daño, fallos, bloqueos...)
  battle.floatingTexts = battle.floatingTexts.filter(t => t.life > 0);
  battle.floatingTexts.forEach(t => {
    t.y -= 0.6; t.life--;
    const alpha = Math.min(1, t.life / 20);
    bctx.globalAlpha = alpha;
    bctx.font = 'bold 16px monospace';
    bctx.textAlign = 'center';
    bctx.fillStyle = 'rgba(0,0,0,0.5)';
    bctx.fillText(t.text, t.x+1, t.y+1);
    bctx.fillStyle = t.color;
    bctx.fillText(t.text, t.x, t.y);
    bctx.globalAlpha = 1;
  });
}

function renderBattle() {
  const p = activePlayer(), e = activeEnemy();
  setHpPanel('player', p);
  setHpPanel('enemy', e);
  document.getElementById('enemy-poke-text').textContent = battle.kind === 'trainer' ? `(${battle.trainer.name})` : '(Salvaje)';
}

function setHpPanel(who, pk) {
  const pct = Math.max(0, pk.hp / pk.stats.hp * 100);
  document.getElementById(`${who}-poke-name`).textContent = `${SPECIES[pk.species].name} Lv.${pk.level}`;
  const bar = document.getElementById(`${who}-hp-bar`);
  bar.style.width = pct + '%';
  bar.className = 'hp-bar-fill ' + (pct > 50 ? 'hp-high' : pct > 20 ? 'hp-mid' : 'hp-low');
  const txt = document.getElementById(`${who}-hp-text`);
  if (txt) txt.textContent = `${Math.max(0,pk.hp)}/${pk.stats.hp}`;
}

function showMainMenu() {
  battleMenu.classList.remove('hidden');
  moveMenu.classList.add('hidden');
  teamMenu.classList.add('hidden');
}

function pipBar(pp, maxPp) {
  const pips = document.createElement('div');
  pips.className = 'pp-pips';
  for (let i=0;i<maxPp;i++) {
    const s = document.createElement('span');
    s.className = i < pp ? 'pip-full' : 'pip-empty';
    pips.appendChild(s);
  }
  return pips;
}

function showMoveMenu() {
  if (battle.busy) return;
  const p = activePlayer();
  moveMenu.innerHTML = '';
  const anyPp = p.moves.some(m => m.pp > 0);
  p.moves.forEach((slot, idx) => {
    const mv = MOVES[slot.id];
    const btn = document.createElement('button');
    btn.className = 'move-btn';
    btn.disabled = slot.pp <= 0;
    btn.style.borderColor = mv.type ? TYPE_COLOR[mv.type] : '#999';
    const top = document.createElement('div');
    top.className = 'move-top';
    top.textContent = `${mv.name}`;
    const info = document.createElement('div');
    info.className = 'move-info';
    info.textContent = `${mv.type ? TYPE_LABEL[mv.type] : 'Normal'} · Pot. ${mv.power} · PP ${slot.pp}/${slot.maxPp}`;
    btn.appendChild(top);
    btn.appendChild(info);
    btn.appendChild(pipBar(slot.pp, slot.maxPp));
    btn.addEventListener('click', () => playerTurn(idx));
    moveMenu.appendChild(btn);
  });
  if (!anyPp) {
    const struggle = document.createElement('button');
    struggle.className = 'move-btn';
    struggle.style.borderColor = '#999';
    struggle.innerHTML = '<div class="move-top">Forcejeo</div><div class="move-info">¡Sin PP! Ataque desesperado (te hace daño a ti también)</div>';
    struggle.addEventListener('click', () => playerTurn('struggle'));
    moveMenu.appendChild(struggle);
  }
  const back = document.createElement('button');
  back.className = 'move-btn back-btn';
  back.textContent = '← Volver';
  back.addEventListener('click', showMainMenu);
  moveMenu.appendChild(back);
  battleMenu.classList.add('hidden');
  moveMenu.classList.remove('hidden');
}

function showTeamMenu() {
  if (battle.busy) return;
  teamMenu.innerHTML = '';
  battle.playerTeam.forEach((pk, i) => {
    const btn = document.createElement('button');
    btn.className = 'move-btn';
    const fainted = pk.hp <= 0;
    btn.disabled = fainted || i === battle.playerActive;
    btn.textContent = `${SPECIES[pk.species].name} Lv.${pk.level} HP ${Math.max(0,pk.hp)}/${pk.stats.hp}${fainted ? ' (debilitado)' : ''}`;
    btn.addEventListener('click', () => { battle.playerActive = i; renderBattle(); showMainMenu(); log(`¡Sale ${SPECIES[pk.species].name}!`); });
    teamMenu.appendChild(btn);
  });
  const back = document.createElement('button');
  back.className = 'move-btn back-btn';
  back.textContent = '← Volver';
  back.addEventListener('click', showMainMenu);
  teamMenu.appendChild(back);
  battleMenu.classList.add('hidden');
  teamMenu.classList.remove('hidden');
}

function damageFormula(attacker, move, defender) {
  if (!move.power) return { dmg: 0, eff: 1 };
  const eff = move.type ? typeEffectiveness(move.type, SPECIES[defender.species].type) : 1;
  const base = ((2*attacker.level/5+2) * move.power * (attacker.stats.atk/defender.stats.def)) / 50 + 2;
  const variance = 0.85 + Math.random()*0.15;
  return { dmg: Math.max(1, Math.floor(base*eff*variance)), eff };
}

function pickEnemyMove(e) {
  const usable = e.moves.filter(m => m.pp > 0);
  if (usable.length === 0) return { slot: null, mv: STRUGGLE };
  const slot = usable[Math.floor(Math.random()*usable.length)];
  return { slot, mv: MOVES[slot.id] };
}

// ---------------- SECUENCIA DE ATAQUE ANIMADA (~2s) ----------------
async function performAttack(side, attacker, mv, defender, defenderIsGuarding) {
  const attackerName = SPECIES[attacker.species].name;
  log(`${attackerName} usa ${mv.name}...`);
  floatText(side, '¡' + mv.name + '!', '#ffffff');

  battle.lunge = { side, progress: 0 };
  const outSteps = 10;
  for (let i=1;i<=outSteps;i++) {
    battle.lunge.progress = i/outSteps;
    await wait(ATTACK_MS*0.3/outSteps);
  }

  let result = 'hit';
  let dmg = 0, eff = 1, blocked = false;

  if (Math.random() > mv.acc) {
    result = 'miss';
    floatText(side === 'enemy' ? 'player' : 'enemy', '¡Fallo!', '#cfd8dc');
    log(`${attackerName} usó ${mv.name}, ¡pero falló!`);
  } else {
    // bloqueo: una pequeña posibilidad de que el objetivo pare el golpe
    const guardBonus = defenderIsGuarding ? 0.55 : 0;
    blocked = Math.random() < (0.12 + guardBonus);
    const calc = damageFormula(attacker, mv, defender);
    dmg = calc.dmg; eff = calc.eff;
    if (blocked) dmg = Math.max(1, Math.floor(dmg * (defenderIsGuarding ? 0.2 : 0.35)));
    defender.hp -= dmg;
    if (mv === STRUGGLE) {
      const recoil = Math.max(1, Math.floor(attacker.stats.hp * 0.1));
      attacker.hp -= recoil;
    }
    const otherSide = side === 'enemy' ? 'player' : 'enemy';
    if (otherSide === 'enemy') battle.flashEnemy = 10; else battle.flashPlayer = 10;
    floatText(otherSide, '-' + dmg, blocked ? '#90caf9' : (eff > 1 ? '#ffca28' : '#ff5252'));
    if (blocked) floatText(otherSide, '¡Bloqueado!', '#90caf9');
    renderBattle();
    log(`${attackerName} usó ${mv.name}. ${blocked ? '¡Bloqueado parcialmente! ' : ''}${effText(eff)}(-${dmg} HP)`);
  }

  await wait(ATTACK_MS*0.2);
  const backSteps = 8;
  for (let i=backSteps-1;i>=0;i--) {
    battle.lunge.progress = i/backSteps;
    await wait(ATTACK_MS*0.3/backSteps);
  }
  battle.lunge = null;
  await wait(ATTACK_MS*0.2);
  return { result, dmg, eff, blocked };
}

function effText(eff) {
  if (eff > 1) return '¡Muy eficaz! ';
  if (eff < 1) return 'No muy eficaz... ';
  return '';
}

async function playerTurn(moveIdxOrStruggle) {
  if (battle.over || battle.busy) return;
  battle.busy = true;
  moveMenu.classList.add('hidden');
  battleMenu.classList.add('hidden');
  const p = activePlayer(), e = activeEnemy();
  let mv;
  if (moveIdxOrStruggle === 'struggle') {
    mv = STRUGGLE;
  } else {
    const slot = p.moves[moveIdxOrStruggle];
    mv = MOVES[slot.id];
    slot.pp = Math.max(0, slot.pp - 1);
  }
  battle.playerDefending = false;
  await resolveRound({ playerAttacks: true, mv });
}

async function playerDefend() {
  if (battle.over || battle.busy) return;
  battle.busy = true;
  battleMenu.classList.add('hidden');
  battle.playerDefending = true;
  log(`${SPECIES[activePlayer().species].name} se prepara para bloquear el golpe.`);
  floatText('player', '¡Defensa!', '#90caf9');
  await wait(500);
  await resolveRound({ playerAttacks: false });
}

async function resolveRound({ playerAttacks, mv }) {
  const p = activePlayer(), e = activeEnemy();
  const playerFirst = playerAttacks && p.stats.spd >= e.stats.spd;

  if (playerAttacks) {
    if (playerFirst) {
      const r1 = await performAttack('player', p, mv, e, false);
      renderBattle();
      if (checkFaints()) { battle.busy = false; return; }
      const { slot: eslot, mv: emv } = pickEnemyMove(e);
      if (eslot) eslot.pp = Math.max(0, eslot.pp - 1);
      await performAttack('enemy', e, emv, p, battle.playerDefending);
      renderBattle();
      if (checkFaints()) { battle.busy = false; return; }
    } else {
      const { slot: eslot, mv: emv } = pickEnemyMove(e);
      if (eslot) eslot.pp = Math.max(0, eslot.pp - 1);
      await performAttack('enemy', e, emv, p, false);
      renderBattle();
      if (checkFaints()) { battle.busy = false; return; }
      const r2 = await performAttack('player', p, mv, e, false);
      renderBattle();
      if (checkFaints()) { battle.busy = false; return; }
    }
  } else {
    // el jugador se defiende: solo ataca el rival, con daño reducido
    const { slot: eslot, mv: emv } = pickEnemyMove(e);
    if (eslot) eslot.pp = Math.max(0, eslot.pp - 1);
    await performAttack('enemy', e, emv, p, true);
    renderBattle();
    if (checkFaints()) { battle.busy = false; return; }
  }

  battle.playerDefending = false;
  battle.busy = false;
  if (!battle.over) showMainMenu();
}

function checkFaints() {
  const p = activePlayer(), e = activeEnemy();
  if (e.hp <= 0) { e.hp = 0; renderBattle(); onEnemyFainted(); return true; }
  if (p.hp <= 0) { p.hp = 0; renderBattle(); onPlayerFainted(); return true; }
  return false;
}

function onEnemyFainted() {
  log(`¡${SPECIES[activeEnemy().species].name} se debilitó!`);
  const remaining = battle.enemyTeam.filter(p => p.hp > 0);
  if (remaining.length === 0) {
    endBattleVictory();
    return;
  }
  battle.enemyActive = battle.enemyTeam.findIndex(p => p.hp > 0);
  log(`${battle.trainer ? battle.trainer.name + ' envía a ' : 'Aparece '}${SPECIES[activeEnemy().species].name}!`);
  renderBattle();
  battle.busy = false;
  showMainMenu();
}

function onPlayerFainted() {
  log(`¡${SPECIES[activePlayer().species].name} se debilitó!`);
  const remaining = battle.playerTeam.filter(p => p.hp > 0);
  if (remaining.length === 0) {
    endBattleDefeat();
    return;
  }
  battle.playerActive = battle.playerTeam.findIndex(p => p.hp > 0);
  renderBattle();
  battle.busy = false;
  showTeamMenu();
}

function grantExp(team) {
  const exp = 25 + Math.floor(Math.random()*15);
  team.forEach(p => {
    if (p.hp <= 0) return;
    p.exp += exp;
    while (p.exp >= expToNext(p.level) && p.level < 60) {
      p.exp -= expToNext(p.level);
      p.level++;
      const sp = SPECIES[p.species];
      p.stats = {
        hp: Math.floor(sp.baseStats.hp * (1 + p.level * 0.12)),
        atk: Math.floor(sp.baseStats.atk * (1 + p.level * 0.09)),
        def: Math.floor(sp.baseStats.def * (1 + p.level * 0.09)),
        spd: Math.floor(sp.baseStats.spd * (1 + p.level * 0.07))
      };
      p.hp = p.stats.hp;
      p.moves = relearnMoveSlots(p.moves, p.species, p.level);
      log(`¡${sp.name} subió al nivel ${p.level}!`);
      if (sp.evolvesTo && p.level >= sp.evolveLevel) {
        log(`¡${sp.name} evolucionó a ${SPECIES[sp.evolvesTo].name}!`);
        p.species = sp.evolvesTo;
      }
    }
  });
}

function endBattleVictory() {
  battle.over = true;
  battle.busy = false;
  grantExp(battle.playerTeam);
  if (battle.kind === 'trainer') {
    const t = battle.trainer;
    if (!game.badges.includes(t.id)) game.badges.push(t.id);
    game.coins += t.prize;
    log(`¡Has ganado a ${t.name}! Consigues la ${t.reward} y ${t.prize} monedas.`);
  } else {
    log('¡Has ganado el combate!');
  }
  renderBattle();
  saveGame();
  setTimeout(() => {
    closeBattle();
    checkWinCondition();
  }, 1600);
}

function endBattleDefeat() {
  battle.over = true;
  battle.busy = false;
  log('Todos tus Coremon se han debilitado... Vuelves a la enfermería.');
  game.team.forEach(p => { p.hp = p.stats.hp; p.moves.forEach(m => m.pp = m.maxPp); });
  setTimeout(() => {
    closeBattle();
    game.room = 'planta_baja';
    game.pos = MAPS.planta_baja.spawn;
    saveGame();
  }, 1800);
}

function tryCapture() {
  if (battle.busy) return;
  if (battle.kind !== 'wild') { log('¡Solo puedes capturar Coremon salvajes!'); return; }
  if (game.stickers <= 0) { log('No te quedan cromos de captura.'); return; }
  game.stickers--;
  const e = activeEnemy();
  const hpRatio = e.hp / e.stats.hp;
  const chance = Math.min(0.95, 0.9 - hpRatio*0.6);
  battleMenu.classList.add('hidden');
  if (Math.random() < chance) {
    log(`¡Cromo lanzado... y capturaste a ${SPECIES[e.species].name}!`);
    if (game.team.length < 6) game.team.push({...e, moves: e.moves.map(m => ({...m}))});
    battle.over = true;
    saveGame();
    setTimeout(closeBattle, 1400);
  } else {
    log('¡El Coremon se ha escapado del cromo!');
    showMainMenu();
  }
}

function tryRun() {
  if (battle.busy) return;
  if (battle.kind === 'trainer') { log('¡No puedes huir de un combate de profesor!'); return; }
  log('Huyes del combate.');
  battle.over = true;
  setTimeout(closeBattle, 700);
}

function closeBattle() {
  battleScreen.classList.add('hidden');
  battle = null;
  STATE = 'OVERWORLD';
}

window.addEventListener('load', () => {
  document.getElementById('btn-fight').addEventListener('click', showMoveMenu);
  document.getElementById('btn-defend').addEventListener('click', playerDefend);
  document.getElementById('btn-team').addEventListener('click', showTeamMenu);
  document.getElementById('btn-capture').addEventListener('click', tryCapture);
  document.getElementById('btn-run').addEventListener('click', tryRun);
});
