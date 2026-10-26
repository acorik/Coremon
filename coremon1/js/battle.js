// ============================================================
// COREMON - Combate por turnos (escena arriba, mandos abajo)
// ============================================================

let battle = null;
const battleScreen = document.getElementById('battle-screen');
const battleCanvas = document.getElementById('battle-canvas');
const bctx = battleCanvas.getContext('2d');
const battleLog = document.getElementById('battle-log');
const battleMenu = document.getElementById('battle-menu');
const moveMenu = document.getElementById('move-menu');
const teamMenu = document.getElementById('team-menu');

const STRUGGLE = { name:'Forcejeo', type:null, power:30, acc:1.0, pp:999 };
const DAMAGE_DIV = 10; // más bajo = más daño por golpe
const BW = battleCanvas.width, BH = battleCanvas.height;
const POS = { enemy: { x: BW * 0.72, y: BH * 0.42, size: 120 }, player: { x: BW * 0.28, y: BH * 0.80, size: 150 } };

function bwait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------------- ARRANQUE ----------------
// Coremon legendarios que pueden aparecer en estado salvaje (muy raros)
const WILD_LEGENDARIES = ['teoremorfo', 'bibliomante', 'atletisaurio', 'musarte', 'naturalux', 'lingualord'];

function teamAvgLevel() {
  const t = game.team.length ? game.team : [{ level: 5 }];
  return t.reduce((a, p) => a + p.level, 0) / t.length;
}

// Si el nivel ya alcanza su evolución, aparece evolucionado
function evolveForLevel(sp, lvl) {
  while (SPECIES[sp].evolvesTo && SPECIES[sp].evolveLevel && lvl >= SPECIES[sp].evolveLevel) sp = SPECIES[sp].evolvesTo;
  return sp;
}

// high = zona de hierba oscura (nivel por encima del tuyo y más legendarios)
function wildEncounter(zone, high) {
  const pool = WILD_TABLE[zone] || WILD_TABLE.patio;
  const base = { patio:3, jardin:4, apoyo:7, biblioteca_eso:10, bachillerato:14 }[zone] || 3;
  const avg = Math.round(teamAvgLevel());
  const r = n => Math.floor(Math.random() * n);
  // tras vencer al Fundador, el patio y el jardín se revuelven: más nivel y más legendarios
  const post = game.flags.champion && (zone === 'patio' || zone === 'jardin');
  let lvl = high ? Math.max(base + 4, avg + 2 + r(4)) : Math.max(base + r(4), avg - 3 + r(4));
  if (post) lvl += high ? 6 : 4;
  lvl = Math.min(60, Math.max(2, lvl));
  const legendChance = post ? (high ? 0.2 : 0.08) : (high ? 0.08 : 0.035);
  if (Math.random() < legendChance) {
    const rare = high && Math.random() < (post ? 0.3 : 0.15);
    const sp = rare ? 'corazonix' : WILD_LEGENDARIES[r(WILD_LEGENDARIES.length)];
    return { species: sp, level: Math.min(60, avg + (post ? 6 : 3) + r(3)), legendary: true };
  }
  const sp = pool[r(pool.length)];
  return { species: evolveForLevel(sp, lvl), level: lvl };
}

function startWildBattle(zone, high) {
  const w = wildEncounter(zone, high);
  const mon = createPokemon(w.species, w.level);
  if (w.legendary) mon.legendary = true;
  openBattle({ kind:'wild', enemyTeam:[mon] });
}

function startTrainerBattle(trainer) {
  const enemyTeam = trainer.team.map(([sp, lvl]) => createPokemon(sp, lvl));
  openBattle({ kind:'trainer', trainer, enemyTeam });
}

function openBattle(opts) {
  STATE = 'BATTLE';
  const map = MAPS[game.room];
  const firstAlive = Math.max(0, game.team.findIndex(p => p.hp > 0));
  battle = {
    kind: opts.kind, trainer: opts.trainer || null,
    playerTeam: game.team, playerActive: firstAlive,
    enemyTeam: opts.enemyTeam, enemyActive: 0,
    over: false, busy: true, playerDefending: false,
    map, bgOutdoor: !!map.outdoor,
    show: { enemyMon:false, playerMon:false, enemyTrainer: opts.kind === 'trainer', playerTrainer:true },
    off: { enemy: 400, player: -400, enemyTrainer: 400, playerTrainer: -400 },
    fx: [], texts: [], flash: { enemy:0, player:0 }, appear: { enemy:0, player:0 },
    faint: { enemy:0, player:0 }, lunge: null, shake: 0, card: null,
    participants: new Set(), evolutions: []
  };
  game.seen[opts.enemyTeam[0].species] = true;
  music('battle');
  battleScreen.classList.remove('hidden');
  showTouch('battle');
  hideMenus();
  logClear();
  renderBattle();
  requestAnimationFrame(battleAnimLoop);
  introSequence();
}

async function introSequence() {
  const b = battle;
  // los dos lados entran deslizándose
  await tween(400, k => {
    b.off.player = -400 * (1 - k); b.off.playerTrainer = -400 * (1 - k);
    b.off.enemy = 400 * (1 - k); b.off.enemyTrainer = 400 * (1 - k);
  });
  if (b.kind === 'wild') {
    b.show.enemyMon = true;
    if (activeEnemy().legendary) {
      b.flashScreen = 10; b.shake = 20;
      sfx('rumble');
      spawnHitFx('enemy', '#ffd54f', 30);
      await say2('¡¡Un Coremon LEGENDARIO!!', 1200);
      await say2(`¡${SPECIES[activeEnemy().species].name} salvaje aparece envuelto en un brillo dorado!`);
    } else {
      await say2(`¡Un ${SPECIES[activeEnemy().species].name} salvaje te corta el paso!`);
    }
  } else {
    await say2(`¡${b.trainer.name} quiere luchar!`);
    await tween(300, k => { b.off.enemyTrainer = 300 * k; });
    b.show.enemyTrainer = false;
    await sendOut('enemy');
  }
  await tween(300, k => { b.off.playerTrainer = -300 * k; });
  b.show.playerTrainer = false;
  await sendOut('player');
  b.busy = false;
  showMainMenu();
}

async function sendOut(side) {
  const b = battle;
  const mon = side === 'enemy' ? activeEnemy() : activePlayer();
  if (side === 'enemy') { b.show.enemyMon = true; game.seen[mon.species] = true; }
  else { b.show.playerMon = true; b.participants.add(mon); }
  b.faint[side] = 0;
  b.appear[side] = 1;
  renderBattle();
  log(side === 'enemy' ? (b.kind === 'trainer' ? `${b.trainer.name} saca a ${SPECIES[mon.species].name}.` : '') : `¡Adelante, ${SPECIES[mon.species].name}!`);
  await tween(450, k => { b.appear[side] = 1 - k; });
}

function tween(ms, fn) {
  const t0 = performance.now();
  return new Promise(res => {
    function step() {
      const k = Math.min(1, (performance.now() - t0) / ms);
      fn(k);
      if (k < 1) requestAnimationFrame(step); else res();
    }
    step();
  });
}

function activePlayer() { return battle.playerTeam[battle.playerActive]; }
function activeEnemy() { return battle.enemyTeam[battle.enemyActive]; }

// ---------------- TEXTO ----------------
function logClear() { battleLog.innerHTML = ''; }
function log(msg) {
  if (!msg) return;
  const p = document.createElement('div');
  p.textContent = msg;
  battleLog.appendChild(p);
  while (battleLog.children.length > 4) battleLog.removeChild(battleLog.firstChild);
  battleLog.scrollTop = battleLog.scrollHeight;
}
async function say2(msg, ms) { log(msg); await bwait(ms || 1000); }

function floatText(side, text, color, big) {
  const p = POS[side];
  battle.texts.push({ text, x: p.x + (Math.random() * 30 - 15), y: p.y - p.size * 0.8, life: 60, color: color || '#fff', big });
}

// ---------------- ESCENA ----------------
function battleAnimLoop() {
  if (!battle) return;
  drawBattleScene(performance.now());
  requestAnimationFrame(battleAnimLoop);
}

function drawBattleBg(t) {
  const b = battle;
  if (b.bgOutdoor) {
    const g = bctx.createLinearGradient(0, 0, 0, BH);
    g.addColorStop(0, '#7ec4f2'); g.addColorStop(0.5, '#cdeaf8'); g.addColorStop(0.5, '#8fd16a'); g.addColorStop(1, '#5fae45');
    bctx.fillStyle = g; bctx.fillRect(0, 0, BW, BH);
    for (let i = 0; i < 3; i++) {
      const cx = ((t / 60 + i * 200) % (BW + 100)) - 50;
      bctx.fillStyle = '#ffffffbb';
      bctx.beginPath(); bctx.arc(cx, 40 + i * 25, 14, 0, 7); bctx.arc(cx + 16, 36 + i * 25, 18, 0, 7); bctx.fill();
    }
  } else {
    const m = b.map;
    const faceY = Math.floor(BH * 0.5 / TILE) * TILE - TILE;
    const sky = { brick:'#e8f1f6', travertine:'#e8dcc0', wood:'#e6be86' }[m.wallStyle] || hexShade(m.wallColor || '#e9dcc3', 8);
    const g = bctx.createLinearGradient(0, 0, 0, faceY);
    g.addColorStop(0, hexShade(sky, -12)); g.addColorStop(1, sky);
    bctx.fillStyle = g; bctx.fillRect(0, 0, BW, faceY);
    for (let x = 0; x < BW; x += TILE) {
      drawUpperWall(bctx, m, x, faceY - TILE, TILE, x / TILE);
      drawWall(bctx, m, x, faceY, TILE, true, x / TILE, 3);
    }
    for (let y = BH * 0.5; y < BH; y += TILE) for (let x = 0; x < BW; x += TILE)
      drawFloor(bctx, m, x, y, TILE, x / TILE, y / TILE);
    bctx.fillStyle = 'rgba(0,0,0,0.12)'; bctx.fillRect(0, BH * 0.5, BW, BH * 0.5);
  }
  // plataformas
  plat(POS.enemy.x, POS.enemy.y + 8, 92, 24);
  plat(POS.player.x, POS.player.y + 10, 116, 28);
}
function plat(x, y, rx, ry) {
  bctx.fillStyle = 'rgba(0,0,0,0.18)';
  bctx.beginPath(); bctx.ellipse(x, y + 4, rx, ry, 0, 0, Math.PI * 2); bctx.fill();
  bctx.fillStyle = battle.bgOutdoor ? '#a8d98a' : 'rgba(255,255,255,0.25)';
  bctx.beginPath(); bctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); bctx.fill();
  bctx.strokeStyle = 'rgba(0,0,0,0.2)'; bctx.lineWidth = 2; bctx.stroke();
}

function drawBattleScene(t) {
  const b = battle;
  bctx.save();
  bctx.imageSmoothingEnabled = false;
  if (b.shake > 0) { bctx.translate(Math.random() * 8 - 4, Math.random() * 6 - 3); b.shake--; }
  if (R1.ok) bctx.clearRect(0, 0, BW, BH); else drawBattleBg(t);
  const bob = Math.sin(t / 260) * 3;

  // lanzamiento/embestida
  let lE = 0, lP = 0;
  if (b.lunge) {
    const amt = Math.sin(Math.min(1, b.lunge.k) * Math.PI) * 34;
    if (b.lunge.side === 'enemy') lE = -amt; else lP = amt;
  }

  if (b.show.enemyTrainer && b.trainer) {
    const look = b.trainer.look || randomStudentLook(b.trainer.name.length * 7);
    drawPerson(bctx, look, POS.enemy.x + 70 + b.off.enemyTrainer, POS.enemy.y + 10, 110, 'down', 0);
  }
  if (b.show.enemyMon) drawMon('enemy', activeEnemy(), POS.enemy.x + lE + b.off.enemy, POS.enemy.y, POS.enemy.size, bob, false);
  if (b.show.playerTrainer) drawPerson(bctx, LOOKS.player, POS.player.x - 40 + b.off.playerTrainer, POS.player.y + 24, 150, 'up', 0);
  if (b.show.playerMon) drawMon('player', activePlayer(), POS.player.x + lP + b.off.player, POS.player.y, POS.player.size, -bob, true);

  if (b.card) drawCard(b.card, t);

  // partículas de ataques
  b.fx = b.fx.filter(p => p.life > 0);
  b.fx.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.life--;
    bctx.globalAlpha = Math.min(1, p.life / 12);
    if (p.glyph) {
      bctx.font = `bold ${p.size}px monospace`; bctx.textAlign = 'center';
      bctx.fillStyle = OUT; bctx.fillText(p.glyph, p.x + 1, p.y + 1);
      bctx.fillStyle = p.color; bctx.fillText(p.glyph, p.x, p.y);
    } else {
      bctx.fillStyle = p.color; bctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    bctx.globalAlpha = 1;
  });

  // textos flotantes
  b.texts = b.texts.filter(x => x.life > 0);
  b.texts.forEach(x => {
    x.y -= 0.7; x.life--;
    bctx.globalAlpha = Math.min(1, x.life / 18);
    bctx.font = `bold ${x.big ? 22 : 16}px monospace`; bctx.textAlign = 'center';
    bctx.lineWidth = 4; bctx.strokeStyle = OUT; bctx.strokeText(x.text, x.x, x.y);
    bctx.fillStyle = x.color; bctx.fillText(x.text, x.x, x.y);
    bctx.globalAlpha = 1;
  });
  if (b.flashScreen) { bctx.fillStyle = `rgba(255,255,255,${b.flashScreen / 10})`; bctx.fillRect(0, 0, BW, BH); b.flashScreen--; }
  bctx.restore();
}

function drawMon(side, mon, cx, cy, size, bob, back) {
  const b = battle;
  if (!mon) return;
  const faint = b.faint[side];
  const appear = b.appear[side];
  if (faint >= 1) return;
  const s = size * (1 - appear * 0.8);
  let white = appear > 0 ? appear : 0;
  if (b.flash[side] > 0) { white = b.flash[side] % 4 < 2 ? 0.8 : 0; b.flash[side]--; }
  bctx.save();
  bctx.beginPath(); bctx.rect(0, 0, BW, cy + 14); bctx.clip();
  drawCreature(bctx, mon.species, cx - s / 2, cy - s + 10 + faint * size + bob * (1 - faint), s,
    { flip: back, white, alpha: 1 - faint * 0.6 });
  bctx.restore();
  if (side === 'player' && b.playerDefending) {
    bctx.strokeStyle = `rgba(120,200,255,${0.6 + 0.3 * Math.sin(performance.now() / 120)})`;
    bctx.lineWidth = 4;
    bctx.beginPath(); bctx.arc(cx, cy - size / 2 + 10, size * 0.55, 0, Math.PI * 2); bctx.stroke();
  }
}

function drawCard(c, t) {
  bctx.save();
  bctx.translate(c.x, c.y);
  bctx.rotate(c.rot || 0);
  box(bctx, -12, -16, 24, 32, c.gold ? '#ffd54f' : '#42a5f5', OUT);
  box(bctx, -8, -12, 16, 16, '#fafafa');
  bctx.fillStyle = '#d32f2f';
  bctx.beginPath(); bctx.arc(-2, -5, 2.5, 0, 7); bctx.arc(2, -5, 2.5, 0, 7); bctx.fill();
  bctx.beginPath(); bctx.moveTo(-5, -4); bctx.lineTo(0, 1); bctx.lineTo(5, -4); bctx.fill();
  bctx.restore();
}

// ---------------- EFECTOS POR TIPO ----------------
const FX_STYLE = {
  logica:     { color:'#82b1ff', glyphs:['π','√','Σ','∞','='] },
  letras:     { color:'#e1bee7', glyphs:['A','Ñ','¿','á','§'] },
  arte:       { color:'#ff80ab', glyphs:null, colors:['#e53935','#fdd835','#1e88e5','#43a047'] },
  idioma:     { color:'#ffe082', glyphs:['Hi!','OK','Wow','¡!'] },
  naturaleza: { color:'#a5d6a7', glyphs:['❀','✿'], colors:['#66bb6a','#2e7d32'] },
  fisico:     { color:'#ffab91', glyphs:['✶','!'] },
  normal:     { color:'#fafafa', glyphs:null }
};

function spawnMoveFx(fromSide, mv) {
  const st = FX_STYLE[mv.type || 'normal'];
  const a = POS[fromSide], d = POS[fromSide === 'player' ? 'enemy' : 'player'];
  const ax = a.x, ay = a.y - a.size * 0.5, dx = d.x, dy = d.y - d.size * 0.5;
  for (let i = 0; i < 10; i++) {
    const delay = i * 2;
    const life = 22 + delay;
    battle.fx.push({
      x: ax, y: ay, vx: (dx - ax) / 22 + (Math.random() - 0.5) * 2, vy: (dy - ay) / 22 + (Math.random() - 0.5) * 2,
      life, size: st.glyphs ? 16 : 7,
      glyph: st.glyphs ? st.glyphs[i % st.glyphs.length] : null,
      color: st.colors ? st.colors[i % st.colors.length] : st.color
    });
  }
}
function spawnHitFx(side, color, n) {
  const p = POS[side];
  for (let i = 0; i < (n || 12); i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
    battle.fx.push({ x: p.x, y: p.y - p.size * 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 18 + Math.random() * 10, size: 5, color });
  }
}

// ---------------- PANELES HP (pantalla superior) ----------------
function renderBattle() {
  const p = activePlayer(), e = activeEnemy();
  if (!p || !e) return;
  setHpPanel('player', p);
  setHpPanel('enemy', e);
  document.getElementById('enemy-poke-text').textContent = battle.kind === 'trainer' ? battle.trainer.name : 'Salvaje';
  const exp = document.getElementById('player-exp-bar');
  exp.style.width = Math.min(100, p.exp / expToNext(p.level) * 100) + '%';
  const balls = document.getElementById('enemy-balls');
  balls.innerHTML = '';
  if (battle.kind === 'trainer') battle.enemyTeam.forEach(m => { const s = document.createElement('span'); s.className = 'ball' + (m.hp <= 0 ? ' ko' : ''); balls.appendChild(s); });
}

function setHpPanel(who, pk) {
  const pct = Math.max(0, pk.hp / pk.stats.hp * 100);
  document.getElementById(`${who}-poke-name`).textContent = (pk.legendary ? '★ ' : '') + SPECIES[pk.species].name;
  document.getElementById(`${who}-poke-lv`).textContent = 'Nv' + pk.level;
  const bar = document.getElementById(`${who}-hp-bar`);
  bar.style.width = pct + '%';
  bar.className = 'hp-bar-fill ' + (pct > 50 ? 'hp-high' : pct > 20 ? 'hp-mid' : 'hp-low');
  const txt = document.getElementById(`${who}-hp-text`);
  if (txt) txt.textContent = `${Math.max(0, pk.hp)}/${pk.stats.hp}`;
}

// ---------------- MENÚS (pantalla inferior) ----------------
function hideMenus() {
  battleMenu.classList.add('hidden'); moveMenu.classList.add('hidden'); teamMenu.classList.add('hidden');
}
function showMainMenu() {
  if (!battle || battle.over) return;
  hideMenus();
  battleMenu.classList.remove('hidden');
  log(`¿Qué debe hacer ${SPECIES[activePlayer().species].name}?`);
}

function showMoveMenu() {
  if (!battle || battle.busy) return;
  const p = activePlayer();
  moveMenu.innerHTML = '';
  const anyPp = p.moves.some(m => m.pp > 0);
  p.moves.forEach((slot, idx) => {
    const mv = MOVES[slot.id];
    const btn = document.createElement('button');
    btn.className = 'move-btn';
    btn.disabled = slot.pp <= 0;
    btn.style.background = mv.type ? `linear-gradient(180deg, ${hexShade(TYPE_COLOR[mv.type], 25)}, ${TYPE_COLOR[mv.type]})` : 'linear-gradient(180deg,#9e9e9e,#616161)';
    const eff = mv.type ? typeEffectiveness(mv.type, SPECIES[activeEnemy().species].type) : 1;
    btn.innerHTML = `<div class="move-top">${mv.name}</div>
      <div class="move-info">${mv.type ? TYPE_LABEL[mv.type] : 'Normal'} · Pot ${mv.power} · PP ${slot.pp}/${slot.maxPp}${eff > 1 ? ' · ¡Eficaz!' : eff < 1 ? ' · Poco eficaz' : ''}</div>`;
    btn.appendChild(pipBar(slot.pp, slot.maxPp));
    btn.addEventListener('click', () => playerTurn(idx));
    moveMenu.appendChild(btn);
  });
  if (!anyPp) {
    const s = document.createElement('button');
    s.className = 'move-btn';
    s.innerHTML = '<div class="move-top">Forcejeo</div><div class="move-info">Sin PP: ataque desesperado que también te hiere</div>';
    s.addEventListener('click', () => playerTurn('struggle'));
    moveMenu.appendChild(s);
  }
  const back = document.createElement('button');
  back.className = 'move-btn back-btn'; back.textContent = '← Volver';
  back.addEventListener('click', showMainMenu);
  moveMenu.appendChild(back);
  hideMenus(); moveMenu.classList.remove('hidden');
}

function pipBar(pp, maxPp) {
  const pips = document.createElement('div');
  pips.className = 'pp-pips';
  for (let i = 0; i < Math.min(maxPp, 20); i++) {
    const s = document.createElement('span');
    s.className = i < pp * Math.min(maxPp, 20) / maxPp ? 'pip-full' : 'pip-empty';
    pips.appendChild(s);
  }
  return pips;
}

function showTeamMenu(forced) {
  if (!battle || (battle.busy && !forced)) return;
  teamMenu.innerHTML = '';
  battle.playerTeam.forEach((pk, i) => {
    const row = monRow(pk, null);
    const disabled = pk.hp <= 0 || i === battle.playerActive;
    if (disabled) row.classList.add('disabled');
    else row.addEventListener('click', () => switchMon(i, forced));
    teamMenu.appendChild(row);
  });
  if (!forced) {
    const back = document.createElement('button');
    back.className = 'move-btn back-btn'; back.textContent = '← Volver';
    back.addEventListener('click', showMainMenu);
    teamMenu.appendChild(back);
  }
  hideMenus(); teamMenu.classList.remove('hidden');
}

async function switchMon(i, forced) {
  const b = battle;
  b.busy = true; hideMenus();
  if (b.show.playerMon && activePlayer().hp > 0) {
    log(`¡Vuelve, ${SPECIES[activePlayer().species].name}!`);
    await tween(300, k => { b.appear.player = k; });
  }
  b.playerActive = i;
  await sendOut('player');
  if (forced) { b.busy = false; showMainMenu(); return; }
  await enemyOnlyTurn(false);
}

// ---------------- DAÑO ----------------
function damageFormula(attacker, move, defender) {
  if (!move.power) return { dmg: 0, eff: 1, crit: false };
  const eff = move.type ? typeEffectiveness(move.type, SPECIES[defender.species].type) : 1;
  const stab = move.type && move.type === SPECIES[attacker.species].type ? 1.2 : 1;
  const crit = Math.random() < 0.04;
  const base = ((attacker.level / 5 + 2) * move.power * (attacker.stats.atk / defender.stats.def)) / DAMAGE_DIV + 2;
  const variance = 0.94 + Math.random() * 0.06; // daño casi constante
  return { dmg: Math.max(1, Math.floor(base * eff * stab * variance * (crit ? 1.5 : 1))), eff, crit };
}

function pickEnemyMove(e, target) {
  const usable = e.moves.filter(m => m.pp > 0);
  if (!usable.length) return { slot: null, mv: STRUGGLE };
  // los entrenadores eligen con cabeza; los salvajes, más al azar
  if (battle.kind === 'trainer' && Math.random() < 0.7) {
    let best = usable[0], bestScore = -1;
    usable.forEach(s => {
      const mv = MOVES[s.id];
      const eff = mv.type ? typeEffectiveness(mv.type, SPECIES[target.species].type) : 1;
      const score = mv.power * eff * mv.acc * (mv.type === SPECIES[e.species].type ? 1.2 : 1);
      if (score > bestScore) { bestScore = score; best = s; }
    });
    return { slot: best, mv: MOVES[best.id] };
  }
  const slot = usable[Math.floor(Math.random() * usable.length)];
  return { slot, mv: MOVES[slot.id] };
}

async function performAttack(side, attacker, mv, defender, guarding) {
  const b = battle;
  const other = side === 'player' ? 'enemy' : 'player';
  log(`${side === 'enemy' && b.kind === 'wild' ? 'El ' : ''}${SPECIES[attacker.species].name} usa ${mv.name}.`);
  // embestida
  b.lunge = { side, k: 0 };
  await tween(260, k => { b.lunge.k = k * 0.5; });
  spawnMoveFx(side, mv);
  await bwait(380);
  if (Math.random() > mv.acc) {
    floatText(other, '¡Falla!', '#cfd8dc');
    log('¡Pero ha fallado!');
    await tween(260, k => { b.lunge.k = 0.5 + k * 0.5; });
    b.lunge = null;
    await bwait(500);
    return;
  }
  const r = damageFormula(attacker, mv, defender);
  let dmg = r.dmg;
  const blocked = Math.random() < (guarding ? 0.6 : 0.05);
  if (guarding) dmg = Math.max(1, Math.floor(dmg * (blocked ? 0.15 : 0.4)));
  else if (blocked) dmg = Math.max(1, Math.floor(dmg * 0.35));
  defender.hp = Math.max(0, defender.hp - dmg);
  if (mv === STRUGGLE) attacker.hp = Math.max(0, attacker.hp - Math.max(1, Math.floor(attacker.stats.hp * 0.1)));
  b.flash[other] = 14;
  sfx(blocked || guarding ? 'guard' : r.crit || r.eff > 1 ? 'crit' : 'hit');
  spawnHitFx(other, r.eff > 1 ? '#ffca28' : '#fafafa', r.eff > 1 ? 20 : 10);
  if (r.eff > 1 || r.crit) { b.shake = 14; b.flashScreen = 4; }
  floatText(other, '-' + dmg, blocked || guarding ? '#90caf9' : r.eff > 1 ? '#ffca28' : '#ff5252', r.eff > 1);
  renderBattle();
  await tween(260, k => { b.lunge.k = 0.5 + k * 0.5; });
  b.lunge = null;
  if (r.crit) { floatText(other, '¡CRÍTICO!', '#ff7043'); await say2('¡Un golpe crítico!', 650); }
  if (blocked || guarding) await say2(guarding ? (blocked ? '¡Bloqueo perfecto! Casi no le hace nada.' : 'La defensa reduce el golpe.') : `¡${SPECIES[defender.species].name} bloquea parte del golpe!`, 700);
  if (r.eff > 1) await say2('¡Es muy eficaz!', 700);
  else if (r.eff < 1) await say2('No es muy eficaz...', 700);
  else await bwait(350);
}

// ---------------- TURNOS ----------------
async function playerTurn(moveIdx) {
  const b = battle;
  if (!b || b.over || b.busy) return;
  b.busy = true; hideMenus();
  const p = activePlayer(), e = activeEnemy();
  let mv;
  if (moveIdx === 'struggle') mv = STRUGGLE;
  else { const slot = p.moves[moveIdx]; mv = MOVES[slot.id]; slot.pp = Math.max(0, slot.pp - 1); }
  b.playerDefending = false;
  const playerFirst = p.stats.spd >= e.stats.spd;
  const enemyAct = async () => {
    const { slot, mv: emv } = pickEnemyMove(activeEnemy(), activePlayer());
    if (slot) slot.pp = Math.max(0, slot.pp - 1);
    await performAttack('enemy', activeEnemy(), emv, activePlayer(), false);
  };
  if (playerFirst) {
    await performAttack('player', p, mv, e, false);
    if (await checkFaints()) return;
    await enemyAct();
  } else {
    await enemyAct();
    if (await checkFaints()) return;
    await performAttack('player', p, mv, e, false);
  }
  if (await checkFaints()) return;
  b.busy = false; showMainMenu();
}

async function playerDefend() {
  const b = battle;
  if (!b || b.over || b.busy) return;
  b.busy = true; hideMenus();
  b.playerDefending = true;
  floatText('player', '¡DEFENSA!', '#90caf9');
  await say2(`${SPECIES[activePlayer().species].name} se pone en guardia.`, 700);
  await enemyOnlyTurn(true);
}

async function enemyOnlyTurn(guarding) {
  const b = battle;
  const { slot, mv } = pickEnemyMove(activeEnemy(), activePlayer());
  if (slot) slot.pp = Math.max(0, slot.pp - 1);
  await performAttack('enemy', activeEnemy(), mv, activePlayer(), guarding);
  b.playerDefending = false;
  if (await checkFaints()) return;
  b.busy = false; showMainMenu();
}

async function checkFaints() {
  const b = battle;
  const e = activeEnemy(), p = activePlayer();
  if (e.hp <= 0) {
    sfx('faint');
    await tween(500, k => { b.faint.enemy = k; });
    await say2(`¡${SPECIES[e.species].name} se ha debilitado!`, 800);
    await giveExp(e);
    renderBattle();
    const next = b.enemyTeam.findIndex(m => m.hp > 0);
    if (next === -1) { await endBattle('win'); return true; }
    b.enemyActive = next;
    b.participants = new Set([activePlayer()]);
    await sendOut('enemy');
    renderBattle();
    if (p.hp <= 0) return await checkFaints();
    b.busy = false; showMainMenu();
    return true;
  }
  if (p.hp <= 0) {
    sfx('faint');
    await tween(500, k => { b.faint.player = k; });
    await say2(`¡${SPECIES[p.species].name} se ha debilitado!`, 800);
    b.participants.delete(p);
    if (!b.playerTeam.some(m => m.hp > 0)) { await endBattle('lose'); return true; }
    b.show.playerMon = false;
    log('Elige otro Coremon.');
    showTeamMenu(true);
    return true;
  }
  return false;
}

// ---------------- EXPERIENCIA ----------------
function levelUp(p) {
  p.level++;
  sfx('levelup');
  const sp = SPECIES[p.species];
  const oldMax = p.stats.hp;
  p.stats = {
    hp: Math.floor(sp.baseStats.hp * (1 + p.level * 0.12)),
    atk: Math.floor(sp.baseStats.atk * (1 + p.level * 0.09)),
    def: Math.floor(sp.baseStats.def * (1 + p.level * 0.09)),
    spd: Math.floor(sp.baseStats.spd * (1 + p.level * 0.07))
  };
  if (p.hp > 0) p.hp = Math.min(p.stats.hp, p.hp + (p.stats.hp - oldMax));
  p.moves = relearnMoveSlots(p.moves, p.species, p.level);
  if (sp.evolvesTo && p.level >= sp.evolveLevel && !p.pendingEvo) {
    p.pendingEvo = { from: p.species, to: sp.evolvesTo };
    return true;
  }
  return false;
}

async function giveExp(defeated) {
  const b = battle;
  const base = Math.floor(defeated.level * 13 * (b.kind === 'trainer' ? 1.5 : 1));
  for (const p of b.playerTeam) {
    if (p.hp <= 0) continue;
    const share = b.participants.has(p) ? base : Math.floor(base / 2);
    p.exp += share;
    if (p === activePlayer()) { floatText('player', `+${share} EXP`, '#80d8ff'); }
    while (p.exp >= expToNext(p.level) && p.level < 60) {
      const known = p.moves.map(m => m.id);
      p.exp -= expToNext(p.level);
      levelUp(p);
      renderBattle();
      if (p === activePlayer()) { floatText('player', '¡NIVEL!', '#ffd54f', true); spawnHitFx('player', '#ffd54f', 16); }
      await say2(`¡${SPECIES[p.species].name} sube al nivel ${p.level}!`, 900);
      const learned = p.moves.map(m => m.id).filter(id => !known.includes(id));
      for (const id of learned) await say2(`¡${SPECIES[p.species].name} ha aprendido ${MOVES[id].name}!`, 900);
    }
  }
  renderBattle();
}

// ---------------- CAPTURA ----------------
async function throwCard(itemId) {
  const b = battle;
  b.busy = true; hideMenus();
  const e = activeEnemy();
  const it = ITEMS[itemId];
  consumeItem(itemId);
  log(`¡Lanzas un ${it.name}!`);
  b.card = { x: POS.player.x, y: POS.player.y - 80, rot: 0, gold: itemId === 'cromoOro' };
  const sx = b.card.x, sy = b.card.y, tx = POS.enemy.x, ty = POS.enemy.y - 60;
  await tween(550, k => { b.card.x = sx + (tx - sx) * k; b.card.y = sy + (ty - sy) * k - Math.sin(k * Math.PI) * 90; b.card.rot = k * 12; });
  b.flashScreen = 6;
  await tween(300, k => { b.appear.enemy = k; });
  b.show.enemyMon = false;
  await tween(250, k => { b.card.y = ty + k * 50; b.card.rot = 0; });
  const hpRatio = e.hp / e.stats.hp;
  const chance = Math.min(0.97, (0.85 - hpRatio * 0.6 + 0.05) * it.rate * (e.level > 12 ? 0.8 : 1) * (e.legendary ? 0.45 : 1));
  const caught = Math.random() < chance;
  const shakes = caught ? 3 : Math.floor(Math.random() * 3);
  for (let i = 0; i < shakes; i++) {
    await bwait(250);
    sfx('capture');
    await tween(300, k => { b.card.rot = Math.sin(k * Math.PI * 2) * 0.5; });
  }
  await bwait(300);
  if (caught) {
    spawnHitFx('enemy', '#fff59d', 20);
    sfx('win');
    await say2(`¡Ya está! ¡Has capturado a ${SPECIES[e.species].name}!`, 1300);
    game.caught[e.species] = true;
    const mon = Object.assign({}, e, { moves: e.moves.map(m => ({ ...m })) });
    if (game.team.length < 6) { game.team.push(mon); await say2(`${SPECIES[e.species].name} se une a tu equipo.`, 900); }
    else { game.box.push(mon); await say2(`Tu equipo está lleno: ${SPECIES[e.species].name} va a las taquillas del vestíbulo.`, 1300); }
    b.card = null;
    await endBattle('capture');
  } else {
    b.card = null;
    b.show.enemyMon = true;
    await tween(300, k => { b.appear.enemy = 1 - k; });
    await say2(['¡Oh, no! ¡Se ha escapado!', '¡Casi lo tenías!', '¡Uf, por poco!'][shakes] || '¡Se ha escapado!', 900);
    await enemyOnlyTurn(false);
  }
}

function openBattleBag() {
  if (!battle || battle.busy) return;
  openBag({
    battle: true,
    onCapture: id => {
      if (battle.kind !== 'wild') { log('¡No puedes capturar el Coremon de otra persona!'); showMainMenu(); return; }
      throwCard(id);
    },
    onUsed: async msg => {
      showTouch('battle');
      battle.busy = true; hideMenus();
      renderBattle();
      spawnHitFx('player', '#a5d6a7', 12);
      await say2(msg, 900);
      await enemyOnlyTurn(false);
    },
    onCancel: () => { showTouch('battle'); showMainMenu(); }
  });
}

async function tryRun() {
  const b = battle;
  if (!b || b.busy) return;
  if (b.kind === 'trainer') { log('¡No puedes huir de un combate contra un entrenador!'); return; }
  b.busy = true; hideMenus();
  const chance = activePlayer().stats.spd >= activeEnemy().stats.spd ? 1 : 0.6;
  if (Math.random() < chance) {
    await say2('¡Escapas sin problemas!', 800);
    await endBattle('run');
  } else {
    await say2('¡No puedes escapar!', 800);
    await enemyOnlyTurn(false);
  }
}

// ---------------- FIN ----------------
async function endBattle(result) {
  const b = battle;
  b.over = true; b.busy = true;
  hideMenus();
  const info = { result, trainer: b.trainer, evolutions: [] };
  if (result === 'win' && b.kind === 'trainer') {
    const t = b.trainer;
    game.coins += t.prize;
    music(null); sfx('win');
    await say2(`¡Has ganado a ${t.name}!`, 1000);
    await say2(`Recibes ${t.prize} monedas.`, 900);
    if (t.student) game.beaten[t.id] = true;
    else if (!game.badges.includes(t.id)) { game.badges.push(t.id); info.newBadge = true; }
  }
  if (result === 'win' && b.kind === 'wild') {
    const found = Math.floor(activeEnemy().level * 4 + Math.random() * 20);
    game.coins += found;
    await say2(`Encuentras ${found} monedas tiradas en el suelo.`, 900);
  }
  game.team.forEach(p => { if (p.pendingEvo) { info.evolutions.push(Object.assign({ mon: p }, p.pendingEvo)); delete p.pendingEvo; } });
  if (result !== 'lose') await bwait(300);
  await fadeTo(1, 300);
  battleScreen.classList.add('hidden');
  battle = null;
  music(roomTrack(game.room));
  showTouch('main');
  refreshTouch();
  STATE = 'CUTSCENE';
  await fadeTo(0, 300);
  saveGame();
  afterBattle(info);
}

window.addEventListener('load', () => {
  document.getElementById('btn-fight').addEventListener('click', showMoveMenu);
  document.getElementById('btn-defend').addEventListener('click', playerDefend);
  document.getElementById('btn-team').addEventListener('click', () => showTeamMenu(false));
  document.getElementById('btn-bag').addEventListener('click', openBattleBag);
  document.getElementById('btn-run').addEventListener('click', tryRun);
});
