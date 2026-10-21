// ============================================================
// COREMON - Mapas del Colegio Corazonistas Vitoria
// Tiles: '#' pared, '.' suelo, ',' hierba/zona de encuentro exterior,
//        'z' zona de encuentro interior, 'p' camino marcado,
//        'D' puerta normal, 'L' puerta de la Liga, 'A' ascensor
// ============================================================

function rowsToGrid(rows) {
  return rows.map(r => r.split(''));
}

const MAPS = {};

// ---------------- PLANTA BAJA (HUB PRINCIPAL) ----------------
MAPS.planta_baja = {
  name: 'Planta Baja',
  bg: '#cfd8dc',
  floor: 0,
  grid: rowsToGrid([
    '###############',
    '#......A......#',
    '#.D.D.D.D.....#',
    '#......p......#',
    '#......p......#',
    '#ppppppppppppp#',
    '#......p......#',
    '#......D......#',
    '###############'
  ]),
  doors: [
    { x:7, y:1, elevator:true, label:'Ascensor', short:'ASC' },
    { x:2, y:2, to:'room_tatami',        tx:4, ty:5, label:'Tatami (Ed. Física)', short:'TAT.' },
    { x:4, y:2, to:'salon_actos',        tx:4, ty:5, label:'Salón de Actos', short:'SALÓN' },
    { x:6, y:2, to:'capilla',            tx:4, ty:5, label:'Capilla', short:'CAP.' },
    { x:8, y:2, to:'sala_conferencias',  tx:4, ty:5, label:'Sala de Conferencias', short:'CONF.' },
    { x:7, y:7, to:'patio',              tx:7, ty:8, label:'Patio', short:'PATIO' }
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

// ---------------- HUBS DE CADA PISO ----------------
function floorHub(id, name, bg, doorDefs) {
  return {
    name, bg, floor: id,
    grid: rowsToGrid([
      '###############',
      '#......A......#',
      '#....D...D....#',
      '#......p......#',
      '#......p......#',
      '#ppppppppppppp#',
      '#......p......#',
      '#......p......#',
      '###############'
    ]),
    doors: [{ x:7, y:1, elevator:true, label:'Ascensor', short:'ASC' }, ...doorDefs],
    npcs: [],
    decor: [
      { type:'bookshelf', x:1, y:1, solid:true },
      { type:'bookshelf', x:13, y:1, solid:true }
    ],
    spawn: { x:7, y:7 }
  };
}

MAPS.piso1 = floorHub(1, '1º - Primaria', '#e3f2fd', [
  { x:5, y:2, to:'room_mates',  tx:4, ty:5, label:'Aula de Matemáticas', short:'MAT' },
  { x:9, y:2, to:'room_lengua', tx:4, ty:5, label:'Aula de Lengua', short:'LEN' }
]);

MAPS.piso2 = floorHub(2, '2º - Primaria (5º-6º)', '#e8f5e9', [
  { x:3, y:2, to:'room_ciencias', tx:4, ty:5, label:'Aula de Ciencias', short:'CIEN' },
  { x:7, y:2, to:'room_ingles',   tx:4, ty:5, label:'Aula de Inglés', short:'ING' },
  { x:11,y:2, to:'room_apoyo',    tx:4, ty:5, label:'Sala de Apoyo y Tecnología', short:'APOYO' }
]);

MAPS.piso3 = floorHub(3, '3º - ESO', '#fce4ec', [
  { x:5, y:2, to:'room_arte',       tx:4, ty:5, label:'Aula de Arte', short:'ARTE' },
  { x:9, y:2, to:'biblioteca_eso',  tx:4, ty:5, label:'Biblioteca ESO', short:'BIBL.' }
]);

MAPS.piso4 = floorHub(4, '4º - Bachillerato', '#ede7f6', [
  { x:7, y:2, to:'sala_bachillerato', tx:4, ty:5, label:'Sala de Bachillerato', short:'BACH.' }
]);

MAPS.piso5 = {
  name: '5º - Sala de Profesores', bg: '#37474f', floor: 5,
  grid: rowsToGrid([
    '###############',
    '#......A......#',
    '#....L...D....#',
    '#......p......#',
    '#......p......#',
    '#ppppppppppppp#',
    '#......p......#',
    '#......p......#',
    '###############'
  ]),
  doors: [
    { x:7, y:1, elevator:true, label:'Ascensor', short:'ASC' },
    { x:5, y:2, to:'room_liga',    tx:7, ty:7, label:'Despacho del Director', short:'LIGA' },
    { x:9, y:2, to:'sala_castigo', tx:7, ty:7, label:'Sala de Castigo', short:'CAST.' }
  ],
  npcs: [],
  decor: [
    { type:'bookshelf', x:1, y:1, solid:true },
    { type:'bookshelf', x:13, y:1, solid:true }
  ],
  spawn: { x:7, y:7 }
};

// ---------------- SALAS DE PROFESORES (academia) ----------------
function classroomMap(trainerId, bg) {
  return {
    name: TRAINERS[trainerId].subject,
    bg: bg || '#fff3e0',
    grid: rowsToGrid([
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '#...T...#',
      '#.......#',
      '####D####'
    ]),
    doors: [ { x:4, y:6, to:TRAINERS[trainerId].homeHub, tx:7, ty:6 } ],
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

TRAINERS.efisica.homeHub = 'planta_baja';
TRAINERS.mates.homeHub = 'piso1';
TRAINERS.lengua.homeHub = 'piso1';
TRAINERS.ciencias.homeHub = 'piso2';
TRAINERS.ingles.homeHub = 'piso2';
TRAINERS.arte.homeHub = 'piso3';
TRAINERS.director.homeHub = 'piso5';

MAPS.room_tatami   = classroomMap('efisica', '#fff8e1');
MAPS.room_mates    = classroomMap('mates', '#e3f2fd');
MAPS.room_lengua   = classroomMap('lengua', '#fbe9e7');
MAPS.room_ciencias = classroomMap('ciencias', '#e0f2f1');
MAPS.room_ingles   = classroomMap('ingles', '#ede7f6');
MAPS.room_arte     = classroomMap('arte', '#fce4ec');

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
  doors: [ { x:4, y:6, to:'piso5', tx:7, ty:2 } ],
  npcs: [ { id:'director', x:4, y:4, sprite:'director', facing:'down' } ],
  decor:[
    { type:'trophy', x:4, y:1, solid:true },
    { type:'bookshelf', x:1, y:1, solid:true },
    { type:'bookshelf', x:7, y:1, solid:true }
  ],
  spawn: { x:4, y:5 }
};

// ---------------- SALAS DE AMBIENTE (historia, sin combate) ----------------
function flavorRoom(name, bg, flavorId, lines, backHub, decor) {
  return {
    name, bg,
    grid: rowsToGrid([
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '#...F...#',
      '#.......#',
      '####D####'
    ]),
    doors: [ { x:4, y:6, to:backHub, tx:7, ty:2 } ],
    npcs: [ { id: flavorId, x:4, y:4, sprite:'flavor', facing:'down' } ],
    flavor: { id: flavorId, lines },
    decor: decor || [
      { type:'bookshelf', x:1, y:1, solid:true },
      { type:'bookshelf', x:7, y:1, solid:true }
    ],
    spawn: { x:4, y:5 }
  };
}

MAPS.salon_actos = flavorRoom('Salón de Actos', '#fff3e0', 'exalumno',
  ['Antiguo alumno: Dicen que el último Campeón de Corazonistas Vitoria entrenó aquí mismo, hace años.',
   'Antiguo alumno: Para llegar a la Liga necesitarás las 6 insignias y mucho entrenamiento. ¡Suerte!'],
  'planta_baja',
  [ { type:'trophy', x:4, y:1, solid:true }, { type:'bookshelf', x:1, y:1, solid:true }, { type:'bookshelf', x:7, y:1, solid:true } ]);

MAPS.capilla = flavorRoom('Capilla', '#eceff1', 'capellan',
  ['Capellán: La paciencia también es una virtud de todo buen entrenador.',
   'Capellán: Si quieres, puedo bendecir a tu equipo... (esto no cura, pero trae buena suerte).'],
  'planta_baja');

MAPS.sala_conferencias = flavorRoom('Sala de Conferencias', '#f3e5f5', 'secretaria',
  ['Secretaria: Cada piso del colegio se abre según las insignias que vayas consiguiendo.',
   'Secretaria: Cuando tengas las 6, el ascensor te dejará subir a la 5ª planta a ver al Director.'],
  'planta_baja');

MAPS.sala_castigo = flavorRoom('Sala de Castigo', '#4e342e', 'alumno_castigado',
  ['Alumno castigado: Llevo aquí desde 3º de la ESO por copiar en un examen de Lógica...',
   'Alumno castigado: Como sigas perdiendo contra los profesores, a lo mejor te veo por aquí.'],
  'piso5');

// ---------------- SALAS DE ENTRENAMIENTO INTERIOR (sin profesor) ----------------
function wildRoom(name, bg, wildZone, backHub, decor) {
  return {
    name, bg,
    grid: rowsToGrid([
      '#########',
      '#.......#',
      '#.zz.zz.#',
      '#.......#',
      '#.zz.zz.#',
      '#.......#',
      '####D####'
    ]),
    doors: [ { x:4, y:6, to:backHub, tx:7, ty:2 } ],
    npcs: [],
    decor: decor || [
      { type:'bookshelf', x:1, y:1, solid:true },
      { type:'bookshelf', x:7, y:1, solid:true }
    ],
    spawn: { x:4, y:5 },
    wildZone
  };
}

MAPS.room_apoyo = wildRoom('Sala de Apoyo y Tecnología', '#e1f5fe', 'apoyo', 'piso2',
  [ { type:'chalkboard', x:4, y:1, solid:true } ]);

MAPS.biblioteca_eso = wildRoom('Biblioteca ESO', '#efebe9', 'biblioteca_eso', 'piso3',
  [ { type:'bookshelf', x:1, y:1, solid:true }, { type:'bookshelf', x:4, y:1, solid:true }, { type:'bookshelf', x:7, y:1, solid:true } ]);

MAPS.sala_bachillerato = wildRoom('Sala de Bachillerato', '#311b92', 'bachillerato', 'piso4',
  [ { type:'trophy', x:4, y:1, solid:true }, { type:'desk', x:1, y:4, solid:true }, { type:'desk', x:7, y:4, solid:true } ]);

// ---------------- EXTERIOR: PATIO Y JARDÍN ----------------
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
    { x:7, y:1, to:'planta_baja', tx:7, ty:7, label:'Planta Baja', short:'ENTRADA' },
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
const TILE_ENCOUNTER = t => t === ',' || t === 'z';

function decorAt(map, x, y) {
  return (map.decor || []).find(d => d.x === x && d.y === y);
}
