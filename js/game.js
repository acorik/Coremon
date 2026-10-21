// ============================================================
// COREMON - Motor principal (pantalla superior, mundo, cinemáticas)
// ============================================================

const TILE = 32;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const VIEW_W = canvas.width, VIEW_H = canvas.height;
const SAVE_KEY = 'corazonistasvitoria_save_v2';
const OLD_SAVE_KEY = 'corazonistasvitoria_save_v1';
const WALK_MS = 170, RUN_MS = 95;

// TITLE | CUTSCENE | OVERWORLD | DIALOGUE | MENU | BATTLE
let STATE = 'TITLE';
let game = newGameState();
let now = 0, lastFrame = 0;

function newGameState() {
  return { room:'planta_baja', pos:{ x:8, y:9 }, facing:'up', team:[], box:[],
    bag:{}, badges:[], coins:500, seen:{}, caught:{}, flags:{}, beaten:{}, picked:{}, playTime:0 };
}

// ---------------- GUARDADO ----------------
function saveGame() {
  game.pos = { x: player.x, y: player.y };
  game.facing = player.facing;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (e) {}
}
function hasSave() {
  try { return !!(localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY)); } catch (e) { return false; }
}
function loadGame() {
  let raw = null, old = false;
  try { raw = localStorage.getItem(SAVE_KEY); if (!raw) { raw = localStorage.getItem(OLD_SAVE_KEY); old = true; } } catch (e) {}
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    game = Object.assign(newGameState(), data);
    if (old) {
      game.bag = { cromo: data.stickers || 5, bocadillo: 3 };
      game.room = 'planta_baja'; game.pos = { x:8, y:8 };
      game.flags = { introDone: true };
    }
    if (!MAPS[game.room]) { game.room = 'planta_baja'; game.pos = { x:8, y:8 }; }
    game.team.forEach(p => { game.seen[p.species] = true; game.caught[p.species] = true; });
    return true;
  } catch (e) { return false; }
}

// ---------------- ACTORES ----------------
const player = { x:8, y:9, px:0, py:0, facing:'up', moving:false, step:0, look: LOOKS.player };
let actors = [];        // npcs + paseantes de la sala actual
let staticLayer = null; // suelo, paredes y decoración fija prerenderizados
let banner = null;      // cartel de ubicación
let fade = 0;           // 0..1 fundido a negro
let cine = null;        // cinemática dibujada encima
let shake = 0;

function placeActor(a, x, y) { a.x = x; a.y = y; a.px = x * TILE; a.py = y * TILE; a.moving = false; }

function startMove(a, dir, dur, onDone) {
  const [dx, dy] = DIRS[dir];
  a.facing = dir;
  a.fromX = a.x; a.fromY = a.y;
  a.x += dx; a.y += dy;
  a.moving = true; a.t0 = now; a.dur = dur; a.step = (a.step || 0) + 1;
  a.onDone = onDone;
}

const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };

function updateActorMotion(a) {
  if (!a.moving) return;
  const k = Math.min(1, (now - a.t0) / a.dur);
  a.px = (a.fromX + (a.x - a.fromX) * k) * TILE;
  a.py = (a.fromY + (a.y - a.fromY) * k) * TILE;
  if (k >= 1) {
    a.moving = false;
    const cb = a.onDone; a.onDone = null;
    if (cb) cb();
  }
}

function actorFrame(a) {
  if (!a.moving) return 0;
  const k = (now - a.t0) / a.dur;
  return k < 0.6 ? (a.step % 2 ? 1 : 2) : 0;
}

// ---------------- SALAS ----------------
function currentMap() { return MAPS[game.room]; }

function enterRoom(roomId, x, y, facing) {
  game.room = roomId;
  if (roomId !== 'sala_profes') profRoom = null;
  const map = MAPS[roomId];
  placeActor(player, x, y);
  if (facing) player.facing = facing;
  actors = map.npcs.map(n => Object.assign({}, n, { home:{ x:n.x, y:n.y } }));
  actors.forEach(a => placeActor(a, a.x, a.y));
  map.wanderers.forEach((w, i) => {
    const a = { id:'w' + i, kind:'wander', look: randomStudentLook(w.seed), lines: w.lines, facing:'down',
      home:{ x:w.x, y:w.y }, nextMove: now + 800 + Math.random() * 2000 };
    placeActor(a, w.x, w.y);
    actors.push(a);
  });
  buildStaticLayer(map);
  banner = { text: map.name, t0: now };
  refreshTouch();
}

async function transitionTo(roomId, x, y, facing) {
  const prev = STATE;
  STATE = 'CUTSCENE';
  await fadeTo(1, 180);
  enterRoom(roomId, x, y, facing);
  saveGame();
  await fadeTo(0, 180);
  STATE = prev === 'CUTSCENE' ? 'CUTSCENE' : 'OVERWORLD';
  if (STATE === 'OVERWORLD') onRoomEnter(roomId);
}

// ---------------- SALA DE PROFESORES Y CASTIGO ----------------
let profRoom = null;
const CASTIGO_MS = 45000;
const JEFA_LOOK = { hair:'long', hairColor:'#8d5524', shirt:'#37474f', pants:'#263238', skirt:true, glasses:true };

function castigoLeft() { return Math.max(0, (game.castigoUntil || 0) - Date.now()); }

async function onRoomEnter(roomId) {
  if (roomId !== 'sala_profes') return;
  const map = currentMap();
  if (Math.random() < 0.35) {
    // hay profes dentro: te echan
    STATE = 'CUTSCENE';
    const gema = { id:'gema_p', kind:'talk', look: TRAINERS.mates.look, facing:'down', lines:[] };
    const jun = { id:'jun_p', kind:'talk', look: TRAINERS.ciencias.look, facing:'down', lines:[] };
    placeActor(gema, 3, 7); placeActor(jun, 10, 7);
    actors.push(gema, jun);
    faceTowards(gema, player); faceTowards(jun, player);
    await exclaim(gema);
    await say(['Gema: ¡Eh, eh! ¿Dónde vas? Aquí no pueden entrar alumnos.',
      'Jun Arrieta: Venga, venga, para fuera. Y de paso riega las plantas del pasillo, que están mustias.',
      'Gema: ¡Y a clase, que ese boli tiene que echar humo!']);
    await transitionTo('piso1', 12, 2, 'down');
    STATE = 'OVERWORLD';
    return;
  }
  profRoom = { patrolAt: now + 9000 + Math.random() * 6000, warned: false };
  banner = { text: 'Sala de Profesores... está vacía', t0: now };
}

async function caughtInProfRoom() {
  STATE = 'CUTSCENE';
  profRoom = null;
  const map = currentMap();
  const door = map.doors[0];
  const jefa = { id:'jefa_p', kind:'talk', look: JEFA_LOOK, facing:'up', lines:[] };
  placeActor(jefa, door.x, door.y);
  actors.push(jefa);
  if (!(player.x === door.x && player.y === door.y - 1)) await walkActor(jefa, ['up']);
  faceTowards(jefa, player);
  await exclaim(jefa);
  faceTowards(player, jefa);
  await say(['Jefa de Estudios: ¡¿SE PUEDE SABER QUÉ HACES EN LA SALA DE PROFESORES?!',
    'Jefa de Estudios: Nada de excusas. Ahora mismo te vas al quinto piso, a la Sala de Castigo.']);
  await fadeTo(1, 400);
  game.castigoUntil = Date.now() + CASTIGO_MS;
  const c = MAPS.sala_castigo;
  enterRoom('sala_castigo', c.spawn.x, c.spawn.y, 'up');
  saveGame();
  await fadeTo(0, 400);
  await say(['Jefa de Estudios: Te quedas aquí 45 segundos pensando en lo que has hecho.',
    'Mira el contador de la pantalla de abajo. Cuando llegue a cero, podrás salir.']);
  STATE = 'OVERWORLD';
  refreshTouch();
}

async function endCastigo() {
  STATE = 'CUTSCENE';
  game.castigoUntil = 0;
  refreshTouch();
  await say(['Jefa de Estudios: Se acabó el castigo. Y que no te vuelva a pillar en la sala de profesores, ¿estamos?',
    'La Jefa de Estudios te acompaña de vuelta a la 1ª planta.']);
  await transitionTo('piso1', 12, 2, 'down');
  STATE = 'OVERWORLD';
}

function updateProfRoom() {
  if (game.room === 'sala_profes' && profRoom) {
    if (!profRoom.warned && now > profRoom.patrolAt - 3000) {
      profRoom.warned = true;
      banner = { text: '¡Se oyen pasos en el pasillo!', t0: now };
    }
    if (now >= profRoom.patrolAt) caughtInProfRoom();
  }
  if (game.castigoUntil && castigoLeft() === 0 && game.room === 'sala_castigo') endCastigo();
}

function fadeTo(target, ms) {
  const start = fade, t0 = performance.now();
  return new Promise(res => {
    function step() {
      const k = Math.min(1, (performance.now() - t0) / ms);
      fade = start + (target - start) * k;
      if (k < 1) requestAnimationFrame(step); else res();
    }
    step();
  });
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

let lastTimerText = '';
function updateCastigoTimer() {
  const el = document.getElementById('castigo-timer');
  if (!el) return;
  const left = castigoLeft();
  const txt = left > 0 ? `⏰ CASTIGO: 0:${String(Math.ceil(left / 1000)).padStart(2, '0')}` : '';
  if (txt === lastTimerText) return;
  lastTimerText = txt;
  el.textContent = txt;
  el.classList.toggle('hidden', !txt);
}

function tileAt(map, x, y) { return map.grid[y] && map.grid[y][x]; }

function buildStaticLayer(map) {
  const H = map.grid.length, W = map.grid[0].length;
  const c = document.createElement('canvas');
  c.width = W * TILE; c.height = H * TILE;
  const g = c.getContext('2d');
  const facade = map.facadeRows || [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = map.grid[y][x], px = x * TILE, py = y * TILE;
    if (map.outdoor && facade.includes(y)) continue;
    if (t === '#') { const below = tileAt(map, x, y + 1); drawWall(g, map, px, py, TILE, below && below !== '#', x, y); continue; }
    if (t === ',') { drawTallGrass(g, px, py, TILE, 0, false); continue; }
    if (t === 'h') { drawTallGrass(g, px, py, TILE, 0, false, true); continue; }
    if (t === 'g') { drawFloor(g, Object.assign({}, map, { floorStyle:'grass' }), px, py, TILE, x, y); continue; }
    if (t === 'z') { drawPapers(g, map, px, py, TILE, x, y); continue; }
    if (t === 'p') { drawRug(g, map, px, py, TILE, x, y); continue; }
    if (t === 'c') { drawFloor(g, Object.assign({}, map, { floorStyle:'court' }), px, py, TILE, x, y); continue; }
    if (t === 'w') continue;
    if (t === 'D' || t === 'L' || t === 'A') {
      const door = map.doors.find(d => d.x === x && d.y === y);
      if (door && door.exit && !door.style) { drawFloor(g, map, px, py, TILE, x, y); }
      if (door && !door.elevator) drawDoor(g, px, py, TILE, Object.assign({}, door, { locked: door.locked && !doorOpen(door) }), doorColor(door), 0, map);
      continue;
    }
    drawFloor(g, map, px, py, TILE, x, y);
  }
  if (map.outdoor && facade.length) {
    const top = Math.min(...facade), h = facade.length;
    for (let x = 0; x < W; x++) {
      const isDoor = facade.some(fy => tileAt(map, x, fy) === 'D');
      drawFacadeColumn(g, x * TILE, top * TILE, TILE, h, x, isDoor);
    }
  }
  for (const d of map.decor) {
    const def = decorDef(d.type);
    if (def.tall || def.anim) continue;
    def.draw(g, d.x * TILE, d.y * TILE, TILE, d, 0);
  }
  staticLayer = c;
}

function doorOpen(door) { return !door.requires || game.badges.includes(door.requires) || !!game.flags.devUnlock; }
function doorColor(door) {
  const tr = Object.values(TRAINERS).find(t => t.room === door.to);
  return tr ? tr.badgeColor : '#8d6e63';
}

// ---------------- COLISIONES ----------------
function actorAt(x, y) {
  return actors.find(a => (a.x === x && a.y === y) || (a.moving && a.fromX === x && a.fromY === y));
}
function itemAt(map, x, y) { return map.items.find(i => i.x === x && i.y === y && !game.picked[i.id]); }

function blocked(map, x, y, forPlayer) {
  const t = tileAt(map, x, y);
  if (t === undefined || !TILE_WALKABLE(t)) return true;
  const d = decorAt(map, x, y);
  if (d && d.solid !== false && decorDef(d.type).solid !== false) return true;
  if (actorAt(x, y)) return true;
  if (itemAt(map, x, y)) return true;
  if (!forPlayer && (player.x === x && player.y === y || (player.moving && player.fromX === x && player.fromY === y))) return true;
  return false;
}

// ---------------- INPUT ----------------
const keysDown = {};
let turnUntil = 0;
const KEYMAP = { arrowup:'up', w:'up', arrowdown:'down', s:'down', arrowleft:'left', a:'left', arrowright:'right', d:'right' };

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if (keysDown[k]) return;
  keysDown[k] = true;
  if (k === 'enter' || k === ' ' || k === 'z') pressA();
  if (k === 'escape' || k === 'x' || k === 'backspace') pressB();
});
window.addEventListener('keyup', e => { keysDown[e.key.toLowerCase()] = false; });

const virtualDir = { dir: null };
function heldDir() {
  if (virtualDir.dir) return virtualDir.dir;
  for (const k of ['arrowup','w','arrowdown','s','arrowleft','a','arrowright','d']) if (keysDown[k]) return KEYMAP[k];
  return null;
}
function running() { return keysDown['shift'] || keysDown['virtualb']; }

function pressA() {
  if (STATE === 'DIALOGUE') { advanceDialog(); return; }
  if (STATE === 'TITLE') { titleStart(); return; }
  if (cine && cine.skippable) { cine.skip = true; return; }
  if (STATE === 'OVERWORLD' && !player.moving) interact();
}
function pressB() {
  if (STATE === 'DIALOGUE') { advanceDialog(); return; }
  if (STATE === 'MENU') { closePanel(); return; }
}

// ---------------- DIÁLOGO (texto progresivo) ----------------
const dialogBox = document.getElementById('dialog-box');
const dialogName = document.getElementById('dialog-name');
const dialogText = document.getElementById('dialog-text');
let dlg = null;

function showDialog(lines, cb) {
  dlg = { lines: Array.isArray(lines) ? lines.slice() : [lines], cb, prevState: STATE === 'DIALOGUE' ? 'OVERWORLD' : STATE };
  STATE = 'DIALOGUE';
  dialogBox.classList.remove('hidden');
  nextLine();
}
function nextLine() {
  if (!dlg.lines.length) {
    dialogBox.classList.add('hidden');
    const d = dlg; dlg = null;
    STATE = d.prevState === 'CUTSCENE' ? 'CUTSCENE' : 'OVERWORLD';
    if (d.cb) d.cb();
    return;
  }
  let line = dlg.lines.shift();
  const m = line.match(/^([^:]{2,28}):\s(.*)$/);
  if (m) { dialogName.textContent = m[1]; dialogName.classList.remove('hidden'); line = m[2]; }
  else dialogName.classList.add('hidden');
  dlg.full = line; dlg.shown = 0;
  dialogText.textContent = '';
}
function advanceDialog() {
  if (!dlg) return;
  if (dlg.shown < dlg.full.length) { dlg.shown = dlg.full.length; dialogText.textContent = dlg.full; return; }
  nextLine();
}
function updateDialog(dt) {
  if (!dlg || dlg.shown >= dlg.full.length) return;
  dlg.shown = Math.min(dlg.full.length, dlg.shown + dt * 0.055);
  dialogText.textContent = dlg.full.slice(0, Math.floor(dlg.shown));
}
dialogBox.addEventListener('click', () => advanceDialog());
function say(lines) { return new Promise(res => showDialog(lines, res)); }

// ---------------- INTERACCIÓN ----------------
function frontTile() {
  const [dx, dy] = DIRS[player.facing];
  return { x: player.x + dx, y: player.y + dy, dx, dy };
}

function faceTowards(a, target) {
  const dx = target.x - a.x, dy = target.y - a.y;
  a.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

function interact() {
  const map = currentMap();
  const f = frontTile();
  let a = actorAt(f.x, f.y);
  const d = decorAt(map, f.x, f.y) || (map.decor.find(dd => decorCovers(dd, f.x, f.y) && decorDef(dd.type).wall));
  if (!a && d && d.talkThrough) a = actorAt(f.x + f.dx, f.y + f.dy);
  if (a) { talkTo(a); return; }
  const it = itemAt(map, f.x, f.y);
  if (it) { pickItem(it); return; }
  if (d) {
    if (d.action === 'shop') { openShop(); return; }
    if (d.action === 'box') { openBox(); return; }
    if (d.action === 'altar') { altarScene(); return; }
    if (d.action === 'dev') { devButtonScene(); return; }
    const txt = decorText(d);
    if (txt) { showDialog(txt); return; }
  }
  // carteles de pared en la fila superior
  const up = map.decor.find(dd => decorDef(dd.type).wall && decorCovers(dd, f.x, f.y) && decorText(dd));
  if (up) showDialog(decorText(up));
}

function decorText(d) {
  return d.textLines || (Array.isArray(d.text) ? d.text : null);
}

function pickItem(it) {
  game.picked[it.id] = true;
  game.bag[it.item] = (game.bag[it.item] || 0) + it.qty;
  const name = ITEMS[it.item].name;
  showDialog(`¡Has encontrado ${it.qty > 1 ? it.qty + ' x ' : ''}${name}! Lo guardas en la mochila.`);
  saveGame(); refreshTouch();
}

async function talkTo(a) {
  faceTowards(a, player);
  if (a.kind === 'wander') { await say(a.lines[Math.floor(Math.random() * a.lines.length)]); return; }
  if (a.kind === 'talk') { await say(a.lines); return; }
  if (a.kind === 'nurse') {
    STATE = 'CUTSCENE';
    await say('Enfermera: ¡Hola! Deja que eche un vistazo a tu equipo...');
    healTeam();
    cine = { type:'heal', t0: now };
    await wait(1200);
    cine = null;
    await say('Enfermera: ¡Listo! Tus Coremon están como nuevos. ¡Cuídate!');
    STATE = 'OVERWORLD'; saveGame(); refreshTouch();
    return;
  }
  if (a.kind === 'trainer') {
    const tr = TRAINERS[a.id];
    if (game.badges.includes(tr.id)) { await say([].concat(tr.win).map(l => `${tr.name}: ${l}`)); return; }
    if (!game.team.some(p => p.hp > 0)) { await say('Tus Coremon están agotados. Ve a la enfermería primero.'); return; }
    STATE = 'CUTSCENE';
    await exclaim(a);
    await say(tr.intro.map(l => `${tr.name}: ${l}`));
    await battleIntro();
    startTrainerBattle(tr);
    return;
  }
  if (a.kind === 'student') {
    const st = STUDENT_TRAINERS[a.id];
    if (game.beaten[a.id]) { await say(`${st.name}: ${st.win}`); return; }
    if (!game.team.some(p => p.hp > 0)) { await say(`${st.name}: Tus Coremon están KO. Vuelve cuando los cures.`); return; }
    STATE = 'CUTSCENE';
    await exclaim(a);
    await say(`${st.name}: ${st.intro}`);
    await battleIntro();
    startTrainerBattle(Object.assign({ id: a.id, student: true, look: a.look }, st));
  }
}

function exclaim(a) {
  a.bubble = now;
  return wait(650).then(() => { a.bubble = null; });
}

function healTeam() {
  game.team.forEach(p => { p.hp = p.stats.hp; p.moves.forEach(m => m.pp = m.maxPp); });
}

async function devButtonScene() {
  if (game.flags.dev) { openDev(); return; }
  STATE = 'CUTSCENE';
  await say(['Hay un botón rojo enorme sobre un pedestal.', 'Un cartel pegado con celo dice: «NO PULSAR».', '...', 'Lo pulsas, claro.']);
  cine = { type:'heal', t0: now }; shake = 1;
  await wait(900);
  cine = null; shake = 0;
  game.flags.dev = true;
  await say(['¡Todas las pantallas de la sala se encienden a la vez!', '«MODO DESARROLLADOR ACTIVADO». Ahora tienes el botón DEV en la pantalla de abajo.']);
  STATE = 'OVERWORLD';
  saveGame(); refreshTouch();
  openDev();
}

async function secretPassage(sec) {
  STATE = 'CUTSCENE';
  await say(['Empujas el cuadro del Padre Andrés Coindre...', '¡CRRRK! ¡El cuadro se desliza y deja ver un pasadizo secreto!']);
  shake = 1; await wait(400); shake = 0;
  await transitionTo(sec.to, sec.tx, sec.ty, 'up');
  STATE = 'OVERWORLD';
  if (!game.flags.secretFound) {
    game.flags.secretFound = true;
    await say(['Una sala escondida detrás de la capilla. Huele a polvo... y a ordenador viejo.']);
  }
}

async function altarScene() {
  if (game.flags.altar) {
    await say(['Una placa dice: «Que ningún niño se quede sin hogar ni sin educación». — A. Coindre']);
    return;
  }
  STATE = 'CUTSCENE';
  await say(['Sobre el altar hay un corazón dorado: el símbolo del Sagrado Corazón.',
    'Una placa dice: «Que ningún niño se quede sin hogar ni sin educación». — A. Coindre']);
  cine = { type:'heal', t0: now };
  await wait(900);
  cine = null;
  game.flags.altar = true;
  game.bag.tirita = (game.bag.tirita || 0) + 2;
  game.bag.caramelo = (game.bag.caramelo || 0) + 1;
  await say(['Al pie del altar alguien ha dejado un pequeño paquete...', '¡Has recibido 2 x Tirita mágica y 1 x Caramelo raro!']);
  STATE = 'OVERWORLD'; saveGame(); refreshTouch();
}

// ---------------- BUCLE PRINCIPAL ----------------
function gameLoop(ts) {
  const dt = lastFrame ? Math.min(50, ts - lastFrame) : 16;
  lastFrame = ts; now = ts;
  if (STATE !== 'TITLE') game.playTime += dt;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  updateDialog(dt);
  updateActorMotion(player);
  actors.forEach(updateActorMotion);
  if (STATE === 'OVERWORLD') {
    updatePlayerInput();
    updateWanderers();
    updateProfRoom();
  }
  updateCastigoTimer();
}

function updatePlayerInput() {
  if (player.moving) return;
  const dir = heldDir();
  if (!dir) return;
  if (dir !== player.facing && !player.justArrived) {
    player.facing = dir;
    turnUntil = now + 90;
    return;
  }
  if (now < turnUntil) return;
  player.justArrived = false;
  const map = currentMap();
  const [dx, dy] = DIRS[dir];
  const nx = player.x + dx, ny = player.y + dy;
  const door = map.doors.find(d => d.x === nx && d.y === ny);
  if (door && door.elevator) { player.facing = dir; openElevator(); return; }
  if (door && door.to && game.room === 'sala_castigo' && castigoLeft() > 0) {
    player.facing = dir;
    showDialog(`La puerta está cerrada por fuera. Te quedan ${Math.ceil(castigoLeft() / 1000)} segundos de castigo.`);
    return;
  }
  if (door && door.locked && !doorOpen(door)) {
    player.facing = dir;
    showDialog('La puerta dorada está cerrada con llave. Quizá el Director tenga algo que ver...');
    return;
  }
  if (map.secret && map.secret.x === nx && map.secret.y === ny && dir === 'up') {
    player.facing = dir;
    secretPassage(map.secret);
    return;
  }
  if (blocked(map, nx, ny, true)) { player.facing = dir; return; }
  startMove(player, dir, running() ? RUN_MS : WALK_MS, () => onPlayerArrive(door));
}

function onPlayerArrive(door) {
  player.justArrived = !!heldDir();
  const map = currentMap();
  if (door && door.to) {
    const dest = MAPS[door.to];
    transitionTo(door.to, door.tx, door.ty, door.ty <= (dest.tallWall ? 2 : 1) ? 'down' : player.facing);
    return;
  }
  const t = tileAt(map, player.x, player.y);
  if (map.wildZone && TILE_ENCOUNTER(t) && !game.flags.noEncounters && game.team.some(p => p.hp > 0) && Math.random() < 0.11) {
    STATE = 'CUTSCENE';
    battleIntro().then(() => startWildBattle(map.wildZone, t === 'h'));
  }
}

function updateWanderers() {
  const map = currentMap();
  for (const a of actors) {
    if (a.kind !== 'wander' || a.moving || now < a.nextMove) continue;
    a.nextMove = now + 1000 + Math.random() * 2600;
    const dirs = ['up','down','left','right'];
    const dir = dirs[Math.floor(Math.random() * 4)];
    const [dx, dy] = DIRS[dir];
    const nx = a.x + dx, ny = a.y + dy;
    if (Math.abs(nx - a.home.x) > 3 || Math.abs(ny - a.home.y) > 2) { a.facing = dir; continue; }
    const t = tileAt(map, nx, ny);
    if (t === 'D' || t === 'A' || t === 'L' || ny <= 0) { a.facing = dir; continue; }
    if (map.doors.some(d => Math.abs(d.x - nx) + Math.abs(d.y - ny) <= 1)) { a.facing = dir; continue; }
    if (blocked(map, nx, ny, false)) { a.facing = dir; continue; }
    startMove(a, dir, 280);
  }
}

// ---------------- RENDER ----------------
function camera(map) {
  const mw = map.grid[0].length * TILE, mh = map.grid.length * TILE;
  const cx = player.px + TILE / 2 - VIEW_W / 2, cy = player.py + TILE / 2 - VIEW_H / 2;
  return {
    x: mw <= VIEW_W ? -(VIEW_W - mw) / 2 : Math.max(0, Math.min(mw - VIEW_W, cx)),
    y: mh <= VIEW_H ? -(VIEW_H - mh) / 2 : Math.max(0, Math.min(mh - VIEW_H, cy))
  };
}

function render() {
  ctx.imageSmoothingEnabled = false;
  if (STATE === 'TITLE') { drawTitle(); return; }
  const map = currentMap();
  if (!map || !staticLayer) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); drawCine(); return; }
  const cam = camera(map);
  const sx = Math.round(-cam.x + (shake ? (Math.random() * 4 - 2) : 0)), sy = Math.round(-cam.y);
  ctx.fillStyle = '#0d0b14';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.drawImage(staticLayer, 0, 0);

  // capa animada bajo los personajes
  const H = map.grid.length, W = map.grid[0].length;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = map.grid[y][x];
    if (t === 'w') drawWater(ctx, x * TILE, y * TILE, TILE, now);
    if (t === 'A') { const door = map.doors.find(d => d.x === x && d.y === y); drawDoor(ctx, x * TILE, y * TILE, TILE, door, null, now, map); }
  }
  for (const d of map.decor) {
    const def = decorDef(d.type);
    if (def.wall && def.anim) def.draw(ctx, d.x * TILE, d.y * TILE, TILE, d, now);
  }
  for (const it of map.items) if (!game.picked[it.id]) drawItemBall(ctx, it.x * TILE, it.y * TILE, TILE, now);

  // objetos altos y personajes ordenados por profundidad
  const list = [];
  for (const d of map.decor) {
    const def = decorDef(d.type);
    if (def.wall || !(def.tall || def.anim)) continue;
    list.push({ y: (d.y + (d.h || 1)) * TILE - 1, draw: () => def.draw(ctx, d.x * TILE, d.y * TILE, TILE, d, now) });
  }
  for (const a of actors) list.push({ y: a.py + TILE, draw: () => drawActor(a) });
  list.push({ y: player.py + TILE + 0.5, draw: () => drawActor(player) });
  list.sort((p, q) => p.y - q.y);
  list.forEach(o => o.draw());

  // la hierba alta tapa los pies
  for (const a of [player, ...actors]) {
    const tx = Math.round(a.px / TILE), ty = Math.round(a.py / TILE);
    const gt = tileAt(map, tx, ty);
    if (gt === ',' || gt === 'h') drawTallGrass(ctx, tx * TILE, ty * TILE + 10, TILE, now, true, gt === 'h');
  }
  drawDoorLabels(map);
  for (const a of actors) if (a.bubble) drawBubble(a);
  for (const a of actors) if (a.sleepy && !a.bubble && !game.badges.includes(a.id)) drawZzz(a);
  ctx.restore();

  drawBanner();
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  drawCine();
}

function drawActor(a) {
  drawPerson(ctx, a.look, a.px + TILE / 2, a.py + TILE + 2, TILE + 4, a.facing, actorFrame(a));
}

function drawBubble(a) {
  const x = a.px + TILE / 2, y = a.py - 14;
  const pop = Math.min(1, (now - a.bubble) / 120);
  ctx.save();
  ctx.translate(x, y); ctx.scale(pop, pop);
  box(ctx, -8, -12, 16, 18, '#fafafa', OUT);
  ctx.fillStyle = '#e53935'; ctx.fillRect(-2, -8, 4, 8); ctx.fillRect(-2, 2, 4, 3);
  ctx.restore();
}

function drawZzz(a) {
  const t = (now / 900) % 3;
  ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
  for (let i = 0; i < 3; i++) {
    const k = (t + i) % 3;
    ctx.globalAlpha = Math.max(0, 1 - k / 3);
    ctx.fillStyle = '#e3f2fd'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    const x = a.px + TILE * 0.7 + k * 5, y = a.py - 4 - k * 8;
    ctx.strokeText('z', x, y); ctx.fillText('z', x, y);
  }
  ctx.globalAlpha = 1;
}

function drawDoorLabels(map) {
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  for (const d of map.doors) {
    if (!d.short || (d.exit && !d.style)) continue;
    const cx = d.x * TILE + TILE / 2, y = d.y * TILE + (map.tallWall && d.y === 1 ? -14 : 2);
    const w = ctx.measureText(d.short).width + 6;
    box(ctx, cx - w / 2, y, w, 11, d.locked && !doorOpen(d) ? '#4a148c' : '#263238', OUT);
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(d.short, cx, y + 8);
  }
}

function drawBanner() {
  if (!banner) return;
  const t = now - banner.t0;
  if (t > 2600) { banner = null; return; }
  const slide = t < 300 ? t / 300 : t > 2300 ? (2600 - t) / 300 : 1;
  const y = -40 + slide * 50;
  ctx.font = 'bold 14px monospace';
  const w = ctx.measureText(banner.text).width + 32;
  box(ctx, 8, y, w, 30, '#fff8e1', OUT);
  box(ctx, 12, y + 4, w - 8, 22, '#fff8e1', '#c9a26b');
  ctx.fillStyle = '#3e2723'; ctx.textAlign = 'left';
  ctx.fillText(banner.text, 24, y + 20);
}

// ---------------- CINEMÁTICAS ----------------
function drawCine() {
  if (!cine) return;
  const t = now - cine.t0;
  if (cine.type === 'heal') {
    ctx.fillStyle = `rgba(255,255,255,${0.5 * Math.abs(Math.sin(t / 150))})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + t / 300;
      ctx.fillStyle = '#ff80ab';
      ctx.fillRect(VIEW_W / 2 + Math.cos(a) * (40 + t / 20) - 3, VIEW_H / 2 + Math.sin(a) * (40 + t / 20) - 3, 6, 6);
    }
  } else if (cine.type === 'battleIntro') {
    const k = Math.min(1, t / cine.dur);
    if (k < 0.45) {
      ctx.fillStyle = Math.floor(t / 70) % 2 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else {
      const kk = (k - 0.45) / 0.55, bars = 8, bh = VIEW_H / bars;
      ctx.fillStyle = '#000';
      for (let i = 0; i < bars; i++) {
        const w = VIEW_W * kk;
        if (i % 2) ctx.fillRect(0, i * bh, w, bh); else ctx.fillRect(VIEW_W - w, i * bh, w, bh);
      }
    }
  } else if (cine.type === 'cards') {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const a = Math.min(1, t / 500, Math.max(0, (cine.dur - t) / 500));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fafafa'; ctx.textAlign = 'center';
    ctx.font = 'bold 18px monospace';
    (cine.lines || []).forEach((l, i) => ctx.fillText(l, VIEW_W / 2, VIEW_H / 2 - (cine.lines.length - 1) * 14 + i * 28));
    if (cine.heart) drawHeartIcon(VIEW_W / 2, VIEW_H / 2 - 80, 18);
    ctx.globalAlpha = 1;
  } else if (cine.type === 'badge') {
    ctx.fillStyle = 'rgba(10,8,20,0.82)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const k = Math.min(1, t / 700);
    const r = 20 + 40 * k;
    ctx.save();
    ctx.translate(VIEW_W / 2, VIEW_H / 2 - 30);
    ctx.scale(Math.cos(t / 220) * 0.4 + 0.6 + 0.4 * k * 0, 1);
    drawBadge(ctx, 0, 0, r, cine.color, true);
    ctx.restore();
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + t / 900, d = 70 + 20 * Math.sin(t / 200 + i);
      ctx.fillStyle = i % 2 ? '#fff59d' : '#ffffff';
      ctx.fillRect(VIEW_W / 2 + Math.cos(a) * d - 2, VIEW_H / 2 - 30 + Math.sin(a) * d - 2, 4, 4);
    }
    ctx.fillStyle = '#ffd54f'; ctx.textAlign = 'center'; ctx.font = 'bold 18px monospace';
    ctx.fillText('¡INSIGNIA CONSEGUIDA!', VIEW_W / 2, VIEW_H / 2 + 60);
    ctx.fillStyle = '#fafafa'; ctx.font = 'bold 14px monospace';
    ctx.fillText(cine.title, VIEW_W / 2, VIEW_H / 2 + 84);
  } else if (cine.type === 'evo') {
    ctx.fillStyle = '#0b0b1e'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t / 200 + i)})`;
      ctx.fillRect((i * 97 + t / 10) % VIEW_W, (i * 53) % VIEW_H, 2, 2);
    }
    const dur = 3600, k = Math.min(1, t / dur);
    const freq = 2 + k * 18;
    const showNew = k >= 1 || Math.sin(t / 1000 * freq * Math.PI) > 0;
    const sp = showNew && k > 0.15 ? cine.to : cine.from;
    const white = k < 1 ? 0.85 : Math.max(0, 1 - (t - dur) / 600);
    drawCreature(ctx, sp, VIEW_W / 2 - 64, VIEW_H / 2 - 90, 128, { white: white, silhouette: false });
    ctx.fillStyle = '#fafafa'; ctx.textAlign = 'center'; ctx.font = 'bold 16px monospace';
    ctx.fillText(k < 1 ? `¡${SPECIES[cine.from].name} está evolucionando!` : `¡${SPECIES[cine.from].name} evolucionó a ${SPECIES[cine.to].name}!`, VIEW_W / 2, VIEW_H - 60);
  } else if (cine.type === 'credits') {
    ctx.fillStyle = '#100a14'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawHeartIcon(VIEW_W / 2, 60, 22 + Math.sin(t / 300) * 2);
    const y0 = VIEW_H + 20 - t / 28;
    ctx.textAlign = 'center';
    CREDITS.forEach((l, i) => {
      ctx.fillStyle = l.startsWith('#') ? '#ffd54f' : '#fafafa';
      ctx.font = l.startsWith('#') ? 'bold 16px monospace' : '13px monospace';
      ctx.fillText(l.replace(/^#/, ''), VIEW_W / 2, y0 + i * 26);
    });
    if (y0 + CREDITS.length * 26 < 120) cine.done = true;
  }
}

function drawHeartIcon(cx, cy, s) {
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath(); ctx.arc(cx - s / 2, cy, s / 2, 0, Math.PI * 2); ctx.arc(cx + s / 2, cy, s / 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - s, cy + 2); ctx.lineTo(cx, cy + s * 1.2); ctx.lineTo(cx + s, cy + 2); ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.moveTo(cx - 3, cy - s * 0.4); ctx.lineTo(cx, cy - s * 1.1); ctx.lineTo(cx + 3, cy - s * 0.4); ctx.fill();
}

const CREDITS = [
  '#COREMON', 'Edición Corazonistas Vitoria', '',
  'Has demostrado saber... y tener corazón.', '',
  '#Inspirado en la historia real', 'Padre Andrés Coindre (1787-1826)', 'Fundó en Lyon, en 1821,', 'los Hermanos del Sagrado Corazón', 'para educar a niños sin hogar.', '',
  'Doscientos años después,', 'el colegio de Vitoria-Gasteiz', 'es la casa corazonista', 'con más alumnos de España.', '',
  '#Profesores', 'Alfonsín (¡feliz jubilación!) · Gema', 'Iñigo San Juan · Jun Arrieta', 'Mr. Shakespeare · Robertiño', 'El Director', '',
  '#Y tú', 'Un Cora de verdad.', '', '¡Gracias por jugar!'
];

function battleIntro() {
  cine = { type:'battleIntro', t0: now, dur: 900 };
  return wait(900).then(() => { cine = null; });
}

async function cinematic(obj, ms) {
  cine = Object.assign({ t0: now }, obj);
  const start = performance.now();
  while (performance.now() - start < ms && !(cine && cine.skip)) await wait(30);
  cine = null;
}

// ---------------- PANTALLA DE TÍTULO ----------------
function drawTitle() {
  const t = now;
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#4fa3e0'); g.addColorStop(0.6, '#bfe3f7'); g.addColorStop(0.61, '#7cc35a'); g.addColorStop(1, '#5aa13f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (let i = 0; i < 4; i++) {
    const cx = ((t / 40 + i * 160) % (VIEW_W + 120)) - 60;
    ctx.fillStyle = '#ffffffcc';
    ctx.beginPath(); ctx.arc(cx, 40 + i * 22, 16, 0, 7); ctx.arc(cx + 18, 36 + i * 22, 20, 0, 7); ctx.arc(cx + 38, 42 + i * 22, 14, 0, 7); ctx.fill();
  }
  // edificio del colegio
  box(ctx, 96, 130, 320, 106, '#b85c42', OUT);
  box(ctx, 216, 100, 80, 40, '#b85c42', OUT);
  box(ctx, 196, 92, 120, 12, '#8d3b2a', OUT);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) {
    if (c === 3 || c === 4) continue;
    box(ctx, 110 + c * 38, 146 + r * 40, 22, 26, '#8ecae6', OUT);
  }
  box(ctx, 236, 190, 40, 46, '#5d4037', OUT);
  box(ctx, 176, 112, 160, 20, '#fff8e1', OUT);
  ctx.fillStyle = '#8e2b3a'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
  ctx.fillText('CORAZONISTAS', 256, 126);
  drawHeartIcon(256, 76, 10);
  // logo
  ctx.font = 'bold 54px monospace';
  ctx.lineWidth = 8; ctx.strokeStyle = '#1d1a26'; ctx.strokeText('COREMON', 256, 290);
  ctx.fillStyle = '#ffd54f'; ctx.fillText('COREMON', 256, 290);
  ctx.font = 'bold 15px monospace';
  ctx.lineWidth = 4; ctx.strokeText('Edición Corazonistas Vitoria', 256, 314);
  ctx.fillStyle = '#fafafa'; ctx.fillText('Edición Corazonistas Vitoria', 256, 314);
  ['tizorex', 'plumavox', 'mochiloide'].forEach((sp, i) => {
    drawCreature(ctx, sp, 70 + i * 160, 318 + Math.sin(t / 300 + i) * 4, 56, { flip: i === 2 });
  });
  if (Math.floor(t / 600) % 2) {
    box(ctx, 106, 6, 300, 20, 'rgba(29,26,38,0.75)');
    ctx.fillStyle = '#ffd54f'; ctx.font = 'bold 12px monospace';
    ctx.fillText('▼ Elige una opción abajo ▼', 256, 20);
  }
}

function titleStart() {
  if (hasSave()) continueGame(); else startNewGame();
}

// ---------------- INICIO / HISTORIA ----------------
async function startNewGame() {
  game = newGameState();
  STATE = 'CUTSCENE';
  showTouch('main');
  enterRoom('planta_baja', 8, 9, 'up');
  fade = 1;
  const cards = [
    { lines:['Lyon, Francia. Invierno de 1817.'], dur: 2600 },
    { lines:['Un joven sacerdote, Andrés Coindre,', 'encuentra a dos niñas temblando de frío', 'en el pórtico de Saint-Nizier.'], dur: 3800 },
    { lines:['En 1821 funda los', 'Hermanos del Sagrado Corazón.'], dur: 3000, heart: true },
    { lines:['Doscientos años después...', 'Vitoria-Gasteiz.'], dur: 2800 },
    { lines:['Tu primer día', 'en el Colegio Corazonistas.'], dur: 2600 }
  ];
  for (const c of cards) { await cinematic(Object.assign({ type:'cards', skippable:true }, c), c.dur); }
  await fadeTo(0, 500);
  const conserje = actors.find(a => a.id === 'conserje');
  await wait(400);
  await exclaim(conserje);
  await walkActor(conserje, ['right']);
  faceTowards(conserje, player);
  player.facing = 'left';
  await say([
    'Conserje: ¡Hombre! Tú debes de ser el alumno nuevo. ¡Bienvenido a Corazonistas!',
    'Conserje: Aquí somos más de 1.260 alumnos, los «Coras». Y cada uno tiene su Coremon.',
    'Conserje: Cada asignatura es un gimnasio. Si ganas a un profesor, te da su insignia.',
    'Conserje: Con 6 insignias, el ascensor te subirá hasta la Sala de Profesores... y quien sabe qué más.',
    'Conserje: Pero primero necesitas un compañero. ¡Mira lo que tengo aquí!'
  ]);
  const starter = await chooseStarter();
  game.team = [createPokemon(starter, 5)];
  game.seen[starter] = true; game.caught[starter] = true;
  await say([
    `Conserje: ¡${SPECIES[starter].name}! Buena elección. Se nota que os vais a llevar bien.`,
    'Conserje: Toma, para el camino: 5 cromos para capturar Coremon salvajes y 3 bocadillos.',
    '¡Has recibido 5 x Cromo y 3 x Bocadillo!',
    'Conserje: Un consejo: antes de retar a un profesor, entrena en el Patio. Se sube por las escaleras de abajo a la derecha.',
    'Conserje: La enfermera de la derecha te cura gratis, y en las máquinas venden de todo.',
    'Conserje: ¡Ánimo, Cora!'
  ]);
  game.bag = { cromo: 5, bocadillo: 3 };
  await walkActor(conserje, ['left']);
  conserje.facing = 'right';
  game.flags.introDone = true;
  STATE = 'OVERWORLD';
  saveGame(); refreshTouch();
}

function walkActor(a, dirs) {
  return dirs.reduce((p, d) => p.then(() => new Promise(res => startMove(a, d, 260, res))), Promise.resolve());
}

function continueGame() {
  if (!loadGame()) { startNewGame(); return; }
  showTouch('main');
  enterRoom(game.room, game.pos.x, game.pos.y, game.facing || 'down');
  const m = currentMap();
  if (blocked(m, player.x, player.y, true) || '#DLA'.includes(tileAt(m, player.x, player.y) || '#')) placeActor(player, m.spawn.x, m.spawn.y);
  STATE = 'OVERWORLD';
  if (game.room === 'sala_profes') onRoomEnter('sala_profes');
  if (!game.team.length) { STATE = 'CUTSCENE'; chooseStarter().then(sp => { game.team = [createPokemon(sp, 5)]; STATE = 'OVERWORLD'; saveGame(); refreshTouch(); }); }
}

// ---------------- DESPUÉS DEL COMBATE ----------------
async function afterBattle(info) {
  STATE = 'CUTSCENE';
  if (info.result === 'lose') {
    await fadeTo(1, 400);
    healTeam();
    const lost = Math.floor(game.coins / 2);
    game.coins -= lost;
    enterRoom('planta_baja', 13, 8, 'right');
    await fadeTo(0, 400);
    await say([`Te has quedado sin Coremon en pie... Pierdes ${lost} monedas al volver corriendo a la enfermería.`,
      'Enfermera: ¡Ay, madre! Ya están curados. Entrena un poco más antes de volver a intentarlo, ¿vale?']);
    STATE = 'OVERWORLD'; saveGame(); refreshTouch();
    return;
  }
  for (const evo of (info.evolutions || [])) {
    await cinematic({ type:'evo', from: evo.from, to: evo.to }, 4400);
    evo.mon.species = evo.to;
    evo.mon.moves = relearnMoveSlots(evo.mon.moves, evo.to, evo.mon.level);
    game.seen[evo.to] = true; game.caught[evo.to] = true;
    await say(`¡Enhorabuena! Tu ${SPECIES[evo.from].name} ha evolucionado a ${SPECIES[evo.to].name}.`);
  }
  if (info.trainer && info.result === 'win') {
    const t = info.trainer;
    if (t.student) {
      await say(`${t.name}: ${t.win}`);
    } else {
      await say([].concat(t.win).map(l => `${t.name}: ${l}`));
      if (t.id === 'coindre') { await endingScene(); return; }
      if (info.newBadge) {
        await cinematic({ type:'badge', color: t.badgeColor, title: t.reward }, 2800);
        await say(`¡Has conseguido: ${t.reward}!`);
      }
      if (t.id === 'director') {
        shake = 1; await wait(500); shake = 0;
        await say(['¡CLAC! Se oye un mecanismo antiguo en el pasillo...', 'La puerta dorada de la Sala del Fundador se ha abierto.']);
      } else if (academicBadgeCount(game.badges) === 6 && !game.flags.allBadges) {
        game.flags.allBadges = true;
        await say(['¡Tienes las 6 insignias!', 'Ahora el ascensor puede subir hasta la 5ª planta: la Sala de Profesores.']);
      } else if (info.newBadge) {
        const next = FLOORS.find(f => f.needBadges === academicBadgeCount(game.badges));
        if (next && next.needBadges > 0) await say(`¡El ascensor ya puede subir a la ${next.name}!`);
      }
    }
  }
  STATE = 'OVERWORLD';
  saveGame(); refreshTouch();
}

async function endingScene() {
  game.flags.champion = true;
  saveGame();
  await cinematic({ type:'credits', skippable:true }, 30000);
  await say(['¡Has completado Coremon: Edición Corazonistas Vitoria!',
    'Puedes seguir explorando el colegio, completar tu Coredex y retar de nuevo a los alumnos.']);
  STATE = 'OVERWORLD';
  refreshTouch();
}

window.addEventListener('load', () => {
  initTouch();
  requestAnimationFrame(gameLoop);
});
