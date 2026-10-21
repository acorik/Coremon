// ============================================================
// COREMON - Mapas del Colegio Corazonistas Vitoria
// Tiles: '#' pared, '.' suelo, ',' hierba/zona de encuentro,
//        'D' puerta normal, 'L' puerta de la Liga (requiere 6 insignias)
// ============================================================

function rowsToGrid(rows) {
  return rows.map(r => r.split(''));
}

const MAPS = {};

// ---------------- PASILLO PRINCIPAL (HUB) ----------------
MAPS.pasillo = {
  name: 'Pasillo Principal',
  bg: '#cfd8dc',
  grid: rowsToGrid([
    '###############',
    '#......L......#',
    '#.D.D.D.D.D.D.#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#......D......#',
    '###############'
  ]),
  doors: [
    { x:2, y:2, to:'room_mates',    tx:4, ty:5, label:'Aula de Matemáticas' },
    { x:4, y:2, to:'room_lengua',   tx:4, ty:5, label:'Aula de Lengua' },
    { x:6, y:2, to:'room_efisica',  tx:4, ty:5, label:'Gimnasio' },
    { x:8, y:2, to:'room_arte',     tx:4, ty:5, label:'Aula de Arte' },
    { x:10,y:2, to:'room_ciencias', tx:4, ty:5, label:'Aula de Ciencias' },
    { x:12,y:2, to:'room_ingles',   tx:4, ty:5, label:'Aula de Inglés' },
    { x:7, y:7, to:'patio',         tx:7, ty:8, label:'Patio' },
    { x:7, y:1, to:'room_liga',     tx:4, ty:5, label:'Despacho del Director', locked:true, requiredBadges:6 }
  ],
  npcs:[ { id:'enfermera', x:1, y:4, sprite:'nurse', facing:'down' } ],
  spawn: { x:7, y:6 }
};

function classroomMap(trainerId, deco) {
  return {
    name: TRAINERS[trainerId].subject,
    bg: deco || '#fff3e0',
    grid: rowsToGrid([
      '#########',
      '#.......#',
      '#..###..#',
      '#.......#',
      '#...T...#',
      '#.......#',
      '####D####'
    ]),
    doors: [ { x:4, y:6, to:'pasillo', tx:7, ty:6 } ],
    npcs: [ { id: trainerId, x:4, y:4, sprite:'prof', facing:'down' } ],
    spawn: { x:4, y:5 }
  };
}

MAPS.room_mates    = classroomMap('mates', '#e3f2fd');
MAPS.room_lengua   = classroomMap('lengua', '#fbe9e7');
MAPS.room_efisica  = classroomMap('efisica', '#e8f5e9');
MAPS.room_arte     = classroomMap('arte', '#fce4ec');
MAPS.room_ciencias = classroomMap('ciencias', '#e0f2f1');
MAPS.room_ingles   = classroomMap('ingles', '#ede7f6');

MAPS.room_liga = {
  name: 'Despacho del Director',
  bg: '#263238',
  grid: rowsToGrid([
    '#########',
    '#.......#',
    '#..###..#',
    '#.......#',
    '#...T...#',
    '#.......#',
    '####D####'
  ]),
  doors: [ { x:4, y:6, to:'pasillo', tx:7, ty:1 } ],
  npcs: [ { id:'director', x:4, y:4, sprite:'director', facing:'down' } ],
  spawn: { x:4, y:5 }
};

MAPS.patio = {
  name: 'Patio',
  bg: '#aed581',
  grid: rowsToGrid([
    '###############',
    '#......D......#',
    '#,,,.......,,,#',
    '#,,...,,,...,,#',
    '#,.....,.....,#',
    '#,,,.......,,,#',
    '#,...,,,,,...,#',
    '#,,.........,,#',
    '#......D......#',
    '#,,,.......,,,#',
    '###############'
  ]),
  doors: [
    { x:7, y:1, to:'pasillo', tx:7, ty:7 },
    { x:7, y:8, to:'jardin', tx:7, ty:1 }
  ],
  npcs:[],
  spawn: { x:7, y:7 },
  wildZone: 'patio'
};

MAPS.jardin = {
  name: 'Jardín Trasero',
  bg: '#81c784',
  grid: rowsToGrid([
    '###############',
    '#......D......#',
    '#,,,,,...,,,,,#',
    '#,,.........,,#',
    '#,,,,,...,,,,,#',
    '#...........,,#',
    '#,,,,,...,,,,,#',
    '###############'
  ]),
  doors: [ { x:7, y:1, to:'patio', tx:7, ty:8 } ],
  npcs:[],
  spawn: { x:7, y:5 },
  wildZone: 'jardin'
};

const TILE_WALKABLE = t => t !== '#';
const TILE_ENCOUNTER = t => t === ',';
