// ============================================================
// COREMON - Motor principal (overworld, historia, guardado)
// ============================================================

const TILE = 40;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const SAVE_KEY = 'corazonistasvitoria_save_v1';

let STATE = 'BOOT'; // BOOT | STORY | STARTER | OVERWORLD | DIALOGUE | BATTLE | WIN
let game = {
  room: 'pasillo',
  pos: { x:7, y:6 },
  facing: 'down',
  team: [],
  badges: [],       // ids de TRAINERS ya vencidos
  defeatedWild: {},
  stickers: 5,       // "cromos" para capturar
  coins: 300,
  name: 'Estudiante'
};

let keysDown = {};
let lastMoveAt = 0;
const MOVE_INTERVAL = 150;
let moving = false;

// ---------------- GUARDADO ----------------
function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}
function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try { game = JSON.parse(raw); return true; } catch(e){ return false; }
}
function hasSave() { return !!localStorage.getItem(SAVE_KEY); }

// ---------------- DIALOGO ----------------
const dialogBox = document.getElementById('dialog-box');
const dialogText = document.getElementById('dialog-text');
let dialogQueue = [];
let dialogCallback = null;

function showDialog(lines, callback) {
  dialogQueue = Array.isArray(lines) ? lines.slice() : [lines];
  dialogCallback = callback || null;
  STATE = 'DIALOGUE';
  dialogBox.classList.remove('hidden');
  advanceDialog();
}
function advanceDialog() {
  if (dialogQueue.length === 0) {
    dialogBox.classList.add('hidden');
    STATE = 'OVERWORLD';
    const cb = dialogCallback; dialogCallback = null;
    if (cb) cb();
    return;
  }
  dialogText.textContent = dialogQueue.shift();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (STATE === 'DIALOGUE') { advanceDialog(); e.preventDefault(); }
  }
});
dialogBox.addEventListener('click', () => { if (STATE === 'DIALOGUE') advanceDialog(); });

// ---------------- INPUT ----------------
window.addEventListener('keydown', (e) => {
  keysDown[e.key.toLowerCase()] = true;
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keysDown[e.key.toLowerCase()] = false; });

function dirFromKeys() {
  if (keysDown['arrowup'] || keysDown['w']) return 'up';
  if (keysDown['arrowdown'] || keysDown['s']) return 'down';
  if (keysDown['arrowleft'] || keysDown['a']) return 'left';
  if (keysDown['arrowright'] || keysDown['d']) return 'right';
  return null;
}

function tryMove(dir) {
  const map = MAPS[game.room];
  let {x,y} = game.pos;
  if (dir === 'up') y--; else if (dir === 'down') y++;
  else if (dir === 'left') x--; else if (dir === 'right') x++;
  game.facing = dir;
  const row = map.grid[y];
  if (!row) return;
  const tile = row[x];
  if (tile === undefined || !TILE_WALKABLE(tile)) return;

  // puerta de liga bloqueada
  const door = map.doors.find(d => d.x === x && d.y === y);
  if (door && door.locked) {
    const need = door.requiredBadges - game.badges.length;
    if (game.badges.length < door.requiredBadges) {
      showDialog(`El despacho está cerrado. Te faltan ${need} insignia(s) para entrar a la Liga.`);
      return;
    }
  }
  // npc bloquea paso
  const npc = map.npcs.find(n => n.x === x && n.y === y);
  if (npc) { interactNpc(npc); return; }

  game.pos = {x,y};

  if (door && !door.locked) {
    changeRoom(door.to, door.tx, door.ty);
    return;
  }

  // encuentro salvaje
  if (map.wildZone && TILE_ENCOUNTER(tile)) {
    if (Math.random() < 0.18) {
      startWildBattle(map.wildZone);
    }
  }
}

function changeRoom(roomId, tx, ty) {
  game.room = roomId;
  game.pos = { x: tx, y: ty };
  saveGame();
}

function interactNpc(npc) {
  if (npc.id === 'enfermera') {
    game.team.forEach(p => { p.hp = p.stats.hp; });
    game.stickers = Math.min(10, game.stickers + 1);
    showDialog('Enfermera: ¡Tu equipo está como nuevo! Toma también un cromo de regalo.');
    saveGame();
    return;
  }
  const trainer = TRAINERS[npc.id];
  if (!trainer) return;
  if (game.badges.includes(trainer.id)) {
    showDialog(`${trainer.name}: Ya demostraste tu valía en ${trainer.subject}. ¡Sigue así!`);
    return;
  }
  const intro = trainer.id === 'director'
    ? [`${trainer.name}: Has reunido las 6 insignias. Es hora de la prueba final.`,
       'El Director: ¡Demuestra que eres el mejor estudiante de Corazonistas Vitoria!']
    : [`${trainer.name}: Para pasar mi asignatura de ${trainer.subject}, derrota a mi equipo.`];
  showDialog(intro, () => startTrainerBattle(trainer));
}

// ---------------- LOOP ----------------
function gameLoop(ts) {
  if (STATE === 'OVERWORLD') {
    const dir = dirFromKeys();
    if (dir && ts - lastMoveAt > MOVE_INTERVAL) {
      tryMove(dir);
      lastMoveAt = ts;
    }
    renderOverworld();
  }
  requestAnimationFrame(gameLoop);
}

function renderOverworld() {
  const map = MAPS[game.room];
  ctx.fillStyle = map.bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for (let y=0; y<map.grid.length; y++) {
    for (let x=0; x<map.grid[y].length; x++) {
      const t = map.grid[y][x];
      drawTile(t, x, y);
    }
  }
  for (const n of map.npcs) {
    const color = n.sprite === 'director' ? '#512da8' : n.sprite === 'nurse' ? '#e91e63' : '#5d4037';
    const emoji = n.sprite === 'nurse' ? '💉' : '🎓';
    drawSprite(n.x, n.y, color, emoji);
  }
  drawSprite(game.pos.x, game.pos.y, '#1e88e5', '🧑');
  drawHud();
}

function drawTile(t, x, y) {
  const px = x*TILE, py = y*TILE;
  if (t === '#') { ctx.fillStyle = '#37474f'; ctx.fillRect(px,py,TILE,TILE); return; }
  if (t === ',') { ctx.fillStyle = '#7cb342'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle = '#558b2f'; ctx.fillRect(px+6,py+6,4,4); ctx.fillRect(px+22,py+18,4,4); return; }
  if (t === 'D') { ctx.fillStyle = '#8d6e63'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle = '#4e342e'; ctx.fillRect(px+10,py+4,TILE-20,TILE-8); return; }
  if (t === 'L') { ctx.fillStyle = '#ab47bc'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle = '#6a1b9a'; ctx.fillRect(px+8,py+4,TILE-16,TILE-8); return; }
  ctx.fillStyle = '#eceff1';
  ctx.fillRect(px,py,TILE,TILE);
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.strokeRect(px,py,TILE,TILE);
}

function drawSprite(x, y, color, emoji) {
  const px = x*TILE, py = y*TILE;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px+TILE/2, py+TILE/2, TILE*0.38, 0, Math.PI*2);
  ctx.fill();
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, px+TILE/2, py+TILE/2+2);
}

function drawHud() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0,0,220,34);
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Insignias: ${game.badges.length}/6   Cromos: ${game.stickers}`, 8, 22);
}

// ---------------- HISTORIA / INICIO ----------------
const introLines = [
  'Hoy es tu primer día en el Colegio Corazonistas Vitoria.',
  'Aquí, cada asignatura es un gimnasio, y cada profesor entrena a sus propios Coremon.',
  'Para llegar a la Liga Corazonistas y enfrentarte al Director, deberás conseguir las 6 insignias: Matemáticas, Lengua, Educación Física, Arte, Ciencias e Inglés.',
  'Consejo del conserje: antes de retar a un profesor, pasa por el Patio a entrenar y capturar algún Coremon salvaje con tus cromos. ¡Un equipo de uno no basta contra un profesor!',
  'Un viejo conserje te espera en la entrada con un regalo especial antes de empezar...'
];

function startNewGame() {
  STATE = 'STORY';
  document.getElementById('start-screen').classList.add('hidden');
  showDialog(introLines, showStarterSelect);
}

function continueGame() {
  loadGame();
  document.getElementById('start-screen').classList.add('hidden');
  enterOverworld();
}

function showStarterSelect() {
  STATE = 'STARTER';
  document.getElementById('starter-screen').classList.remove('hidden');
}

function pickStarter(speciesId) {
  document.getElementById('starter-screen').classList.add('hidden');
  game.team = [createPokemon(speciesId, 5)];
  const name = SPECIES[speciesId].name;
  showDialog([`El conserje: ¡${name} te ha elegido a ti también! Cuida bien de tu Coremon.`,
    'Recorre el colegio, entra en cada aula y derrota a los profesores para ganar sus insignias.'],
    enterOverworld);
}

function enterOverworld() {
  STATE = 'OVERWORLD';
  document.getElementById('game-screen').classList.remove('hidden');
  saveGame();
}

function checkWinCondition() {
  if (game.badges.includes('director')) {
    STATE = 'WIN';
    document.getElementById('win-screen').classList.remove('hidden');
  }
}

window.addEventListener('load', () => {
  document.getElementById('btn-continue').disabled = !hasSave();
  document.getElementById('btn-new').addEventListener('click', startNewGame);
  document.getElementById('btn-continue').addEventListener('click', continueGame);
  document.querySelectorAll('.starter-card').forEach(card => {
    card.addEventListener('click', () => pickStarter(card.dataset.species));
  });
  requestAnimationFrame(gameLoop);
});
