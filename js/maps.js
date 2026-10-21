// ============================================================
// COREMON - Mapas del Colegio Corazonistas Vitoria
// Tiles: '#' pared, '.' suelo, ',' hierba/zona de encuentro,
//        'p' camino marcado, 'D' puerta normal,
//        'L' puerta de la Liga (requiere 6 insignias)
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
    '#......p......#',
    '#......p......#',
    '#ppppppppppppp#',
    '#......p......#',
    '#......D......#',
    '###############'
  ]),
  doors: [
    { x:2, y:2, to:'room_mates',    tx:4, ty:5, label:'Aula de Matemáticas', short:'MAT' },
    { x:4, y:2, to:'room_lengua',   tx:4, ty:5, label:'Aula de Lengua', short:'LEN' },
    { x:6, y:2, to:'room_efisica',  tx:4, ty:5, label:'Gimnasio (Ed. Física)', short:'E.F.' },
    { x:8, y:2, to:'room_arte',     tx:4, ty:5, label:'Aula de Arte', short:'ARTE' },
    { x:10,y:2, to:'room_ciencias', tx:4, ty:5, label:'Aula de Ciencias', short:'CIEN' },
    { x:12,y:2, to:'room_ingles',   tx:4, ty:5, label:'Aula de Inglés', short:'ING' },
    { x:7, y:7, to:'patio',         tx:7, ty:8, label:'Patio', short:'PATIO' },
    { x:7, y:1, to:'room_liga',     tx:4, ty:5, label:'Despacho del Director', short:'LIGA', locked:true, requiredBadges:6 }
  ],
  npcs:[ { id:'enfermera', x:1, y:4, sprite:'nurse', facing:'down' } ],
  decor:[
    { type:'trophy', x:1, y:1, solid:true },
    { type:'trophy', x:13, y:1, solid:true },
    { type:'bookshelf', x:1, y:6, solid:true },
    { type:'bookshelf', x:13, y:6, solid:true }
  ],
  spawn: { x:7, y:6 }
};

function classroomMap(trainerId, deco) {
  return {
    name: TRAINERS[trainerId].subject,
    bg: deco || '#fff3e0',
    grid: rowsToGrid([
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '#...T...#',
      '#.......#',
      '####D####'
    ]),
    doors: [ { x:4, y:6, to:'pasillo', tx:7, ty:6 } ],
    npcs: [ { id: trainerId, x:4, y:4, sprite:'prof', facing:'down' } ],
    decor:[
      { type:'chalkboard', x:4, y:1, solid:true },
      { type:'bookshelf', x:1, y:1, solid:true },
      { type:'bookshelf', x:7, y:1, solid:true },
      { type:'desk', x:2, y:4, solid:true },
      { type:'desk', x:6, y:4, solid:true },
      { type:'desk', x:2, y:5, solid:true },
      { type:'desk', x:6, y:5, solid:true }
    ],
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
    '#.......#',
    '#.......#',
    '#...T...#',
    '#.......#',
    '####D####'
  ]),
  doors: [ { x:4, y:6, to:'pasillo', tx:7, ty:1 } ],
  npcs: [ { id:'director', x:4, y:4, sprite:'director', facing:'down' } ],
  decor:[
    { type:'trophy', x:4, y:1, solid:true },
    { type:'bookshelf', x:1, y:1, solid:true },
    { type:'bookshelf', x:7, y:1, solid:true }
  ],
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
    { x:7, y:1, to:'pasillo', tx:7, ty:7, label:'Pasillo Principal', short:'PASILLO' },
    { x:7, y:8, to:'jardin', tx:7, ty:1, label:'Jardín Trasero', short:'JARDÍN' }
  ],
  npcs:[],
  decor:[
    { type:'tree', x:1, y:2, solid:true },
    { type:'tree', x:13, y:2, solid:true },
    { type:'bush', x:1, y:9, solid:true },
    { type:'bush', x:13, y:9, solid:true },
    { type:'fountain', x:3, y:4, solid:true },
    { type:'fountain', x:11, y:4, solid:true },
    { type:'flower', x:5, y:6, solid:false, color:'#ef5350' },
    { type:'flower', x:9, y:6, solid:false, color:'#ffd54f' }
  ],
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
  doors: [ { x:7, y:1, to:'patio', tx:7, ty:8, label:'Patio', short:'PATIO' } ],
  npcs:[],
  decor:[
    { type:'tree', x:1, y:2, solid:true },
    { type:'tree', x:13, y:2, solid:true },
    { type:'tree', x:1, y:5, solid:true },
    { type:'tree', x:13, y:5, solid:true },
    { type:'flower', x:7, y:3, solid:false, color:'#ba68c8' },
    { type:'bush', x:4, y:4, solid:true },
    { type:'bush', x:10, y:4, solid:true }
  ],
  spawn: { x:7, y:5 },
  wildZone: 'jardin'
};

const TILE_WALKABLE = t => t !== '#';
const TILE_ENCOUNTER = t => t === ',';

function decorAt(map, x, y) {
  return (map.decor || []).find(d => d.x === x && d.y === y);
}
