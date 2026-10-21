// ============================================================
// COREMON - Sistema de combate por turnos
// ============================================================

let battle = null; // estado de la batalla activa

const battleScreen = document.getElementById('battle-screen');
const battleLog = document.getElementById('battle-log');
const battleMenu = document.getElementById('battle-menu');
const moveMenu = document.getElementById('move-menu');
const teamMenu = document.getElementById('team-menu');

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
    over: false
  };
  battleScreen.classList.remove('hidden');
  logClear();
  log(opts.kind === 'trainer'
    ? `${opts.trainer.name} te desafía con ${opts.trainer.subject}!`
    : `¡Un ${SPECIES[battle.enemyTeam[0].species].name} salvaje aparece!`);
  renderBattle();
  showMainMenu();
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

function renderBattle() {
  const p = activePlayer(), e = activeEnemy();
  document.getElementById('player-poke-name').textContent = `${SPECIES[p.species].name} Lv.${p.level}`;
  document.getElementById('player-hp-bar').style.width = Math.max(0,(p.hp/p.stats.hp*100)) + '%';
  document.getElementById('player-hp-text').textContent = `${Math.max(0,p.hp)}/${p.stats.hp}`;
  document.getElementById('enemy-poke-name').textContent = `${SPECIES[e.species].name} Lv.${e.level}`;
  document.getElementById('enemy-hp-bar').style.width = Math.max(0,(e.hp/e.stats.hp*100)) + '%';
  document.getElementById('enemy-poke-text').textContent = battle.kind === 'trainer' ? `(${battle.trainer.name})` : '(Salvaje)';
}

function showMainMenu() {
  battleMenu.classList.remove('hidden');
  moveMenu.classList.add('hidden');
  teamMenu.classList.add('hidden');
}

function showMoveMenu() {
  const p = activePlayer();
  moveMenu.innerHTML = '';
  p.moves.forEach(moveId => {
    const mv = MOVES[moveId];
    const btn = document.createElement('button');
    btn.className = 'move-btn';
    btn.style.borderColor = mv.type ? TYPE_COLOR[mv.type] : '#999';
    btn.textContent = `${mv.name} (${mv.type ? TYPE_LABEL[mv.type] : 'Normal'})`;
    btn.addEventListener('click', () => playerTurn(moveId));
    moveMenu.appendChild(btn);
  });
  const back = document.createElement('button');
  back.className = 'move-btn back-btn';
  back.textContent = '← Volver';
  back.addEventListener('click', showMainMenu);
  moveMenu.appendChild(back);
  battleMenu.classList.add('hidden');
  moveMenu.classList.remove('hidden');
}

function showTeamMenu() {
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
  if (!move.power) return 0;
  const eff = move.type ? typeEffectiveness(move.type, SPECIES[defender.species].type) : 1;
  const base = ((2*attacker.level/5+2) * move.power * (attacker.stats.atk/defender.stats.def)) / 50 + 2;
  const variance = 0.85 + Math.random()*0.15;
  return { dmg: Math.max(1, Math.floor(base*eff*variance)), eff };
}

function playerTurn(moveId) {
  if (battle.over) return;
  moveMenu.classList.add('hidden');
  battleMenu.classList.add('hidden');
  const mv = MOVES[moveId];
  const p = activePlayer(), e = activeEnemy();
  const playerFirst = p.stats.spd >= e.stats.spd;

  const doPlayerMove = () => {
    if (Math.random() > mv.acc) { log(`${SPECIES[p.species].name} usó ${mv.name}, ¡pero falló!`); return false; }
    const {dmg, eff} = damageFormula(p, mv, e);
    e.hp -= dmg;
    log(`${SPECIES[p.species].name} usó ${mv.name}. ${effText(eff)}(-${dmg} HP)`);
    renderBattle();
    if (e.hp <= 0) { e.hp = 0; renderBattle(); onEnemyFainted(); return true; }
    return false;
  };
  const doEnemyMove = () => {
    const emv = MOVES[e.moves[Math.floor(Math.random()*e.moves.length)]];
    if (Math.random() > emv.acc) { log(`${SPECIES[e.species].name} usó ${emv.name}, ¡pero falló!`); return false; }
    const {dmg, eff} = damageFormula(e, emv, p);
    p.hp -= dmg;
    log(`${SPECIES[e.species].name} usó ${emv.name}. ${effText(eff)}(-${dmg} HP)`);
    renderBattle();
    if (p.hp <= 0) { p.hp = 0; renderBattle(); onPlayerFainted(); return true; }
    return false;
  };

  let ended = false;
  if (playerFirst) {
    ended = doPlayerMove();
    if (!ended) ended = doEnemyMove();
  } else {
    ended = doEnemyMove();
    if (!ended) ended = doPlayerMove();
  }
  if (!battle.over) showMainMenu();
}

function effText(eff) {
  if (eff > 1) return '¡Muy eficaz! ';
  if (eff < 1) return 'No muy eficaz... ';
  return '';
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
      p.moves = movesLearnedUpTo(p.species, p.level);
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
  log('Todos tus Coremon se han debilitado... Vuelves a la enfermería.');
  game.team.forEach(p => { p.hp = p.stats.hp; });
  setTimeout(() => {
    closeBattle();
    game.room = 'pasillo';
    game.pos = MAPS.pasillo.spawn;
    saveGame();
  }, 1800);
}

function tryCapture() {
  if (battle.kind !== 'wild') { log('¡Solo puedes capturar Coremon salvajes!'); return; }
  if (game.stickers <= 0) { log('No te quedan cromos de captura.'); return; }
  game.stickers--;
  const e = activeEnemy();
  const hpRatio = e.hp / e.stats.hp;
  const chance = Math.min(0.95, 0.9 - hpRatio*0.6);
  battleMenu.classList.add('hidden');
  if (Math.random() < chance) {
    log(`¡Cromo lanzado... y capturaste a ${SPECIES[e.species].name}!`);
    if (game.team.length < 6) game.team.push({...e});
    battle.over = true;
    saveGame();
    setTimeout(closeBattle, 1400);
  } else {
    log('¡El Coremon se ha escapado del cromo!');
    showMainMenu();
  }
}

function tryRun() {
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
  document.getElementById('btn-team').addEventListener('click', showTeamMenu);
  document.getElementById('btn-capture').addEventListener('click', tryCapture);
  document.getElementById('btn-run').addEventListener('click', tryRun);
});
