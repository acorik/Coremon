// ============================================================
// COREMON - Mapas del Colegio Corazonistas Vitoria
// Tiles: '#' pared/seto, '.' suelo, ',' hierba alta (encuentros),
//        'z' zona de papeles (encuentros interiores), 'p' alfombra/camino,
//        'c' pista, 'w' agua, 'D' puerta, 'L' puerta especial, 'A' ascensor
// npcs.kind: trainer | student | talk | nurse | shop
// ============================================================

const MAPS = {};
const grid = rows => rows.map(r => r.split(''));

// ---------------- PLANTA BAJA: VESTÍBULO ----------------
MAPS.planta_baja = {
  name: 'Vestíbulo - Planta Baja', floor: 0,
  floorStyle: 'darkgranite', rugStyle: 'granite', wallStyle: 'travertine', doorStyle: 'wood',
  grid: grid([
    '##D##D##A##D##D##',
    '#......ppp......#',
    '#......ppp......#',
    '#......ppp......#',
    '#ppppppppppppppp#',
    '#......ppp......#',
    '#......ppp......#',
    '#......ppp......#',
    '#......ppp......#',
    '#......ppp......#',
    '########D####D###'
  ]),
  doors: [
    { x:2, y:0, to:'room_tatami', tx:6, ty:7, short:'GIMNASIO' },
    { x:5, y:0, to:'salon_actos', tx:7, ty:9, short:'SALÓN' },
    { x:8, y:0, elevator:true, short:'ASCENSOR' },
    { x:11, y:0, to:'capilla', tx:5, ty:9, short:'CAPILLA' },
    { x:14, y:0, to:'sala_conferencias', tx:6, ty:7, short:'CONF.' },
    { x:8, y:10, to:'exterior', tx:9, ty:2, exit:true, style:'glass', short:'SALIDA' },
    { x:13, y:10, to:'patio', tx:9, ty:1, exit:true, style:'stairs', short:'PATIO' }
  ],
  npcs: [
    { id:'secretaria', kind:'talk', x:1, y:7, look:LOOKS.secretaria, facing:'right',
      lines:['Secretaría del colegio, ¿en qué te puedo ayudar?',
             'Cada planta del colegio se abre según las insignias que consigas. El ascensor sabe cuántas llevas.',
             'Si tu mochila va llena de Coremon, deja los que sobren en las taquillas de aquí al lado.'] },
    { id:'enfermera', kind:'nurse', x:15, y:7, look:LOOKS.enfermera, facing:'left' },
    { id:'conserje', kind:'talk', x:6, y:8, look:LOOKS.conserje, facing:'right',
      lines:['¿Qué tal, chaval? Ya sabes: antes de retar a un profe, entrena en el Patio. Se sube por las escaleras de la derecha.',
             'Las máquinas de al lado venden bocadillos y cromos. ¡Nunca salgas sin cromos!',
             'Pulsa EQUIPO o MOCHILA en la pantalla de abajo para revisar tus cosas.'] }
  ],
  decor: [
    { type:'poster', x:3, y:0, color:'#ffcc80' }, { type:'poster', x:4, y:0, color:'#c5e1a5', text:['Cartel: «Proyecto Erasmus+ — Cofinanciado por la Unión Europea».'] },
    { type:'notice', x:6, y:0, w:2 }, { type:'clock', x:10, y:0 },
    { type:'poster', x:12, y:0, color:'#90caf9' }, { type:'poster', x:13, y:0, color:'#ffab91' },
    { type:'bin', x:7, y:9 }, { type:'bin', x:9, y:9 },
    { type:'trophy', x:6, y:1, w:2, text:['Vitrina de trofeos.', '«CESTA Y PUNTOS - 1971». Los Coras ganaron el concurso cultural de televisión y los recibieron en la plaza de la Virgen Blanca.', 'Al lado, camisetas firmadas de antiguos alumnos que llegaron a la NBA y a la ACB.'] },
    { type:'plant', x:1, y:1 }, { type:'plant', x:15, y:1 },
    { type:'bench', x:12, y:1, w:1 },
    { type:'column', x:4, y:2 }, { type:'column', x:12, y:2 }, { type:'column', x:4, y:7 }, { type:'column', x:12, y:7 },
    { type:'counter', x:2, y:7, h:2, talkThrough:true },
    { type:'counter', x:14, y:7, h:2, talkThrough:true },
    { type:'lockers', x:1, y:9, w:3, color:'#3f6e9e', action:'box' },
    { type:'vending', x:10, y:9, color:'#c62828', action:'shop' },
    { type:'vending', x:11, y:9, color:'#1565c0', action:'shop' },
    { type:'plant', x:15, y:9 }
  ],
  wanderers: [
    { seed: 11, x:5, y:5, lines:['¡Hoy hay macarrones en el comedor!', 'Dicen que en este cole hay más de 1.260 alumnos. ¡Somos el corazonista más grande de España!'] },
    { seed: 27, x:11, y:3, lines:['¿Has visto la vitrina? Mi abuelo salía en lo de Cesta y Puntos.'] }
  ],
  items: [],
  spawn: { x:8, y:8 }
};

// ---------------- EXTERIOR: ENTRADA PRINCIPAL ----------------
MAPS.exterior = {
  name: 'Entrada principal', outdoor: true, facadeRows: [0, 1], floorStyle: 'pavement',
  grid: grid([
    '###################',
    '#########D#########',
    '#.................#',
    '#.................#',
    '#gggg.........ggggD',
    '#gggg.........gggg#',
    '#.................#',
    '#.................#',
    '#ggggggg...ggggggg#',
    '#ggggggg...ggggggg#',
    '###################'
  ]),
  doors: [
    { x:9, y:1, to:'planta_baja', tx:8, ty:9, short:'ENTRADA' },
    { x:18, y:4, to:'patio', tx:1, ty:6, exit:true, short:'PATIO' }
  ],
  npcs: [
    { id:'portero', kind:'talk', x:11, y:2, look:{ hair:'short', hairColor:'#424242', shirt:'#37474f', pants:'#263238', glasses:true }, facing:'down',
      lines:['Buenos días. Esto es el Colegio Sagrado Corazón, Corazonistas de Vitoria-Gasteiz.',
             'El logo rojo de la fachada es el de Kristau Eskola, la red de escuelas cristianas del País Vasco.',
             'El patio está por la verja de la derecha... o subiendo las escaleras de dentro.'] }
  ],
  decor: [
    { type:'keLogo', x:7, y:1, dy:12 },
    { type:'sign', x:13, y:3, text:['COLEGIO SAGRADO CORAZÓN — CORAZONISTAS', 'Vitoria-Gasteiz. Hermanos del Sagrado Corazón, desde 1821.'] },
    { type:'bin', x:10, y:2, color:'#455a64' },
    { type:'tree', x:2, y:4 }, { type:'tree', x:15, y:5 }, { type:'tree', x:3, y:9 }, { type:'tree', x:15, y:9 },
    { type:'lamp', x:6, y:6 }, { type:'lamp', x:12, y:6 },
    { type:'bikeRack', x:5, y:2, w:2 }, { type:'bench', x:13, y:7, w:2 },
    { type:'flowers', x:6, y:8, solid:false, color:'#ef5350' }, { type:'flowers', x:12, y:8, solid:false, color:'#ffd54f' }
  ],
  wanderers: [
    { seed: 31, x:8, y:6, lines:['¡Llego tarde! ¡Llego tarde!'] },
    { seed: 52, x:4, y:7, lines:['Mi padre también estudió aquí. Dice que el cole ha cambiado un montón.'] }
  ],
  items: [ { id:'ext_bocata', x:17, y:9, item:'bocadillo', qty:2 } ],
  spawn: { x:9, y:2 }
};

// ---------------- EXTERIOR ----------------
MAPS.patio = {
  name: 'Patio', outdoor: true, facadeRows: [0], floorStyle: 'grass', rugColor:'#c9a26b',
  grid: grid([
    '#########D#########',
    '#,,,,...ppp...,,,,#',
    '#,,,....ppp....,,,#',
    '#,,ccccccccccccc,,#',
    '#,,ccccccccccccc,,#',
    '#,,ccccccccccccc,,#',
    'D,,ccccccccccccc,,D',
    '#,,ccccccccccccc,,#',
    '#,,ccccccccccccc,,#',
    '#,,,...........,,,#',
    '#,,,,.........,,,,#',
    '#,,,,,,,,,,,,,,,,,#',
    '###################'
  ]),
  doors: [
    { x:9, y:0, to:'planta_baja', tx:13, ty:9, short:'ESCALERAS' },
    { x:18, y:6, to:'jardin', tx:1, ty:5, exit:true, short:'JARDÍN' },
    { x:0, y:6, to:'exterior', tx:17, ty:4, exit:true, short:'ENTRADA' }
  ],
  npcs: [
    { id:'basket1', kind:'student', x:6, y:5, look:{ hair:'cap', cap:'#c62828', hairColor:'#3b2416', shirt:'#c62828', pants:'#fafafa' }, facing:'right' },
    { id:'basket2', kind:'student', x:12, y:4, look:{ hair:'long', hairColor:'#d4a017', shirt:'#1565c0', pants:'#fafafa', skirt:false }, facing:'left' },
    { id:'portera', kind:'student', x:14, y:6, look:{ hair:'bun', hairColor:'#1a1a1a', shirt:'#fdd835', pants:'#1565c0' }, facing:'left' }
  ],
  decor: [
    { type:'courtLines', x:3, y:3, w:13, h:6, solid:false },
    { type:'handballGoal', x:3, y:5, h:2, facing:'right' }, { type:'handballGoal', x:15, y:5, h:2, facing:'left' },
    { type:'hoop', x:2, y:5 }, { type:'hoop', x:16, y:5 },
    { type:'sign', x:11, y:1, text:['PATIO DE CORAZONISTAS. Pista de baloncesto y balonmano.', 'En estas canchas empezaron a botar el balón varios antiguos alumnos que acabaron en la NBA. Y en balonmano, ni te cuento.', 'Fútbol: ver portería del jardín (si la encuentras entre los hierbajos).'] },
    { type:'lamp', x:5, y:2 }, { type:'lamp', x:13, y:2 },
    { type:'bench', x:6, y:10, w:2 }, { type:'bench', x:11, y:10, w:2 },
    { type:'fountain', x:9, y:10 },
    { type:'tree', x:1, y:1 }, { type:'tree', x:17, y:1 }, { type:'tree', x:1, y:11 }, { type:'tree', x:17, y:11 }
  ],
  wanderers: [
    { seed: 5, x:8, y:9, lines:['¡Recreo! Los mejores 30 minutos del día.', 'Aquí si no juegas a baloncesto o a balonmano, eres un bicho raro.'] },
    { seed: 19, x:10, y:2, lines:['¿Fútbol? ¿Aquí? La portería del jardín tiene más hierbajos que red.', 'El equipo de fútbol tiene un solo jugador. Dicen que entrena contra la pared.'] }
  ],
  items: [ { id:'patio_cromo', x:2, y:10, item:'cromo', qty:2 }, { id:'patio_bocata', x:16, y:2, item:'bocadillo', qty:1 } ],
  wildZone: 'patio',
  spawn: { x:9, y:1 }
};

MAPS.jardin = {
  name: 'Jardín', outdoor: true, facadeRow: -1, floorStyle: 'grass',
  grid: grid([
    '#################',
    '#,,,,,.....,,,,,#',
    '#,,,,..www..,,,,#',
    '#,,,..wwwww..,,,#',
    '#,,...wwwww...,,#',
    'D,,...wwwww...,,#',
    '#,,,..wwwww..,,,#',
    '#,,,,..www..,,,,#',
    '#,,,,,.....,,,,,#',
    '#,,,,,,,,,,,,,,,#',
    '#################'
  ]),
  doors: [ { x:0, y:5, to:'patio', tx:17, ty:6, exit:true, short:'PATIO' } ],
  npcs: [
    { id:'futbolista', kind:'student', x:8, y:8, look:{ hair:'short', hairColor:'#6d3b1f', shirt:'#2e7d32', pants:'#fafafa' }, facing:'down' },
    { id:'jardinero', kind:'talk', x:11, y:7, look:{ hair:'cap', cap:'#558b2f', hairColor:'#757575', shirt:'#558b2f', pants:'#4e342e', beard:true, beardColor:'#9e9e9e' }, facing:'down',
      lines:['Soy el Hermano jardinero. Cuido este jardín desde hace cuarenta años.',
             'Cuando el Padre Coindre murió en 1826, el Hermano Polycarpe tomó las riendas. Cuando él murió, ya había más de 400 hermanos en 70 escuelas.',
             'De una semilla pequeña sale un árbol grande. Como este colegio.'] }
  ],
  decor: [
    { type:'tree', x:1, y:1, fruit:true }, { type:'tree', x:15, y:1 }, { type:'tree', x:1, y:9 }, { type:'tree', x:15, y:9, fruit:true },
    { type:'flowers', x:7, y:1, solid:false, color:'#ef5350' }, { type:'flowers', x:9, y:1, solid:false, color:'#ba68c8' },
    { type:'flowers', x:6, y:8, solid:false, color:'#ffd54f' }, { type:'flowers', x:10, y:8, solid:false, color:'#ef5350' },
    { type:'lamp', x:4, y:3 }, { type:'bench', x:12, y:3, w:1 },
    { type:'footballGoal', x:6, y:9, w:3, solid:true, text:['Una portería de fútbol oxidada, con la red rota y llena de hierbajos.', 'Un cartel medio borrado dice: «EQUIPO DE FÚTBOL. SE BUSCAN JUGADORES». Fecha del cartel: hace muchos años.'] },
    { type:'weeds', x:5, y:9 }, { type:'weeds', x:9, y:9 }, { type:'weeds', x:7, y:8 }
  ],
  wanderers: [],
  items: [ { id:'jardin_caramelo', x:12, y:5, item:'caramelo', qty:1 }, { id:'jardin_tirita', x:15, y:7, item:'tirita', qty:1 } ],
  wildZone: 'jardin',
  spawn: { x:1, y:5 }
};

// ---------------- SALAS DE LA PLANTA BAJA ----------------
MAPS.room_tatami = {
  name: 'Gimnasio - Educación Física', floorStyle: 'sportsBlue', wallStyle: 'brick', lineRow: 6,
  grid: grid([
    '#############',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '######D######'
  ]),
  doors: [ { x:6, y:8, to:'planta_baja', tx:2, ty:1, exit:true } ],
  npcs: [
    { id:'efisica', kind:'trainer', x:8, y:3, look:TRAINERS.efisica.look, facing:'down' },
    { id:'balonmano', kind:'student', x:9, y:6, look:{ hair:'short', hairColor:'#3b2416', shirt:'#fdd835', pants:'#1565c0' }, facing:'left' }
  ],
  decor: [
    { type:'climbWall', x:1, y:0, w:5, text:['Rocódromo del gimnasio. Las presas de colores marcan las vías: la roja es la más difícil.', 'Un cartel dice: «Prohibido escalar sin colchoneta debajo. Firmado: Alfonsín».'] },
    { type:'tatamiMat', x:1, y:1, w:5, h:2 },
    { type:'clock', x:7, y:0 }, { type:'wallbars', x:8, y:0, w:4 },
    { type:'handballGoal', x:11, y:4, h:2, facing:'left' },
    { type:'mats', x:1, y:7, blue:true }, { type:'mats', x:2, y:7, blue:true }
  ],
  spawn: { x:6, y:7 }
};

const SEATS = [];
// butacas de madera clara, algunas con cojín rojo, morado o azul (como las reales)
const CUSHIONS = ['#e3b673', '#e3b673', '#c62828', '#e3b673', '#5e35b1', '#e3b673', '#1e88e5', '#e3b673'];
for (const y of [4, 5, 7, 8]) for (const x of [2,3,4,5,6,8,9,10,11,12])
  SEATS.push({ type:'woodSeat', x, y, color: CUSHIONS[(x * 3 + y * 5) % CUSHIONS.length] });

MAPS.salon_actos = {
  name: 'Salón de Actos', floorStyle: 'darkgranite', wallStyle: 'wood',
  grid: grid([
    '###############',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#######D#######'
  ]),
  doors: [ { x:7, y:10, to:'planta_baja', tx:5, ty:1, exit:true } ],
  npcs: [],
  decor: [
    { type:'curtainSide', x:1, y:0 }, { type:'curtainSide', x:2, y:0 },
    { type:'speaker', x:3, y:0 },
    { type:'screen', x:5, y:0, w:5, text:'BIENVENIDOS', textLines:['En la pantalla del proyector: «Bienvenidos al Colegio Corazonistas».'] },
    { type:'speaker', x:11, y:0 },
    { type:'curtainSide', x:12, y:0 }, { type:'curtainSide', x:13, y:0 },
    { type:'stage', x:1, y:1, w:13, h:2 },
    { type:'stageSteps', x:1, y:3, w:1 }, { type:'stageSteps', x:13, y:3, w:1 },
    ...SEATS
  ],
  items: [ { id:'salon_menu', x:13, y:5, item:'menu', qty:1 } ],
  spawn: { x:7, y:9 }
};

MAPS.capilla = {
  name: 'Capilla', floorStyle: 'stone', wallColor: '#d7cfc0', wainscot: '#8d7f6b', rugColor: '#7b1f1f',
  grid: grid([
    '###########',
    '#.........#',
    '#....p....#',
    '#....p....#',
    '#....p....#',
    '#....p....#',
    '#....p....#',
    '#....p....#',
    '#....p....#',
    '#....p....#',
    '#####D#####'
  ]),
  doors: [ { x:5, y:10, to:'planta_baja', tx:11, ty:1, exit:true } ],
  npcs: [],
  decor: [
    { type:'portrait', x:1, y:0, text:['Retrato del Padre Andrés Coindre (Lyon, 1787 - Blois, 1826).', 'Fundador de los Hermanos del Sagrado Corazón en 1821.'] },
    { type:'stained', x:2, y:0, seed:0 }, { type:'stained', x:5, y:0, seed:2 }, { type:'stained', x:8, y:0, seed:4 },
    { type:'altar', x:4, y:1, w:3, action:'altar' },
    { type:'candle', x:2, y:1 }, { type:'candle', x:8, y:1 },
    { type:'pew', x:1, y:3, w:4 }, { type:'pew', x:6, y:3, w:4 },
    { type:'pew', x:1, y:5, w:4 }, { type:'pew', x:6, y:5, w:4 },
    { type:'pew', x:1, y:7, w:4 }, { type:'pew', x:6, y:7, w:4 }
  ],
  spawn: { x:5, y:9 }
};

MAPS.sala_conferencias = {
  name: 'Sala de Conferencias', floorStyle: 'carpet', floorColor: '#2c4a6e', wallColor: '#e0e0e0', wainscot: '#607d8b',
  grid: grid([
    '#############',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '######D######'
  ]),
  doors: [ { x:6, y:8, to:'planta_baja', tx:14, ty:1, exit:true } ],
  npcs: [],
  decor: [
    { type:'screen', x:3, y:0, w:7, text:'100 AÑOS DE ANTIGUOS ALUMNOS', textLines:['En la pantalla: «Asociación de Antiguos Alumnos de Corazonistas: 100 años (1922-2022)».', 'Una diapositiva muestra a los Coras de 1971 levantando el trofeo de «Cesta y Puntos».'] },
    { type:'confTable', x:3, y:3, w:7, h:2 },
    { type:'chair', x:4, y:2 }, { type:'chair', x:6, y:2 }, { type:'chair', x:8, y:2 },
    { type:'chair', x:4, y:5 }, { type:'chair', x:6, y:5 }, { type:'chair', x:8, y:5 },
    { type:'plant', x:1, y:1 }, { type:'plant', x:11, y:1 }, { type:'watercooler', x:11, y:6 }
  ],
  items: [ { id:'conf_zumo', x:1, y:7, item:'zumo', qty:1 } ],
  spawn: { x:6, y:7 }
};

// ---------------- PASILLOS DE CADA PLANTA ----------------
function hub(id, opts) {
  const midRows = [
    '#........p........#',
    '#........p........#',
    '#........p........#',
    '#ppppppppppppppppp#',
    '#.................#',
    '#.................#',
    '#.................#'
  ];
  const bottom = opts.bottom === 'coatrack'
    ? [ { type:'coatrack', x:2, y:7, w:4, seed:id }, { type:'coatrack', x:13, y:7, w:4, seed:id + 3 } ]
    : opts.bottom === 'none' ? []
    : [ { type:'lockers', x:2, y:7, w:4, color: opts.lockerColor || '#5c7fa3' }, { type:'lockers', x:13, y:7, w:4, color: opts.lockerColor || '#5c7fa3' } ];
  return Object.assign({
    floor: id, floorStyle: 'terrazzo', rugStyle: 'terrazzo', wallStyle: 'brick', doorStyle: 'primaria',
    grid: grid([opts.top, ...midRows, '###################']),
    npcs: [], items: [], wanderers: [], spawn: { x:9, y:1 }
  }, opts, {
    doors: [{ x:9, y:0, elevator:true, short:'ASCENSOR' }, ...opts.doors],
    decor: [
      { type:'plant', x:1, y:1 }, { type:'plant', x:17, y:1 },
      ...bottom,
      ...(opts.decor || [])
    ]
  });
}

// Puertas reales: amarillas en 1ª y 3ª planta, azules en 2ª y 4ª (marco azul marino)
const DOOR_YELLOW = '#f2c12e', DOOR_BLUE = '#3a78d6';

MAPS.piso1 = hub(1, {
  name: '1ª planta - Primaria', doorColor: DOOR_YELLOW, bottom: 'coatrack',
  top: '###D#####A##D##D###',
  doors: [
    { x:3, y:0, to:'room_mates', tx:6, ty:8, short:'MATES' },
    { x:12, y:0, to:'sala_profes', tx:7, ty:7, short:'PROFES' },
    { x:15, y:0, to:'room_lengua', tx:6, ty:8, short:'LENGUA' }
  ],
  decor: [
    { type:'mural', x:1, y:0, w:2, seed:0, bg:'#f5e6c8' }, { type:'drawing', x:5, y:0, seed:1 }, { type:'whiteboard', x:6, y:0, w:2 },
    { type:'mural', x:10, y:0, w:2, seed:1 }, { type:'drawing', x:13, y:0, seed:3 }, { type:'drawing', x:14, y:0, seed:4 }, { type:'mural', x:16, y:0, w:2, seed:2 },
    { type:'watercooler', x:17, y:5 }
  ],
  npcs: [ { id:'empollon', kind:'student', x:16, y:3, look:{ hair:'short', hairColor:'#8d5524', shirt:'#1f3b73', pants:'#33334a', glasses:true, tie:'#b71c1c' }, facing:'left' } ],
  wanderers: [
    { seed: 3, x:5, y:5, lines:['La profe Gema siempre dice que el boli tiene que echar humo. ¡Y lo dice en serio!'] },
    { seed: 44, x:12, y:6, lines:['Ayer Iñigo vino a clase con dos zapatos distintos. Y se durmió leyendo en voz alta.', 'Dicen que en la sala de profesores hay caramelos raros... pero como te pillen, te mandan al castigo del quinto piso.'] }
  ],
  items: [ { id:'p1_bocata', x:1, y:6, item:'bocadillo', qty:1 } ]
});

MAPS.piso2 = hub(2, {
  name: '2ª planta - 5º/6º y Apoyo', doorColor: DOOR_BLUE, bottom: 'coatrack',
  top: '###D##D##A###D#####',
  doors: [
    { x:3, y:0, to:'room_ciencias', tx:6, ty:8, short:'CIENC.' },
    { x:6, y:0, to:'room_ingles', tx:6, ty:8, short:'INGLÉS' },
    { x:13, y:0, to:'room_apoyo', tx:6, ty:8, short:'APOYO' }
  ],
  decor: [
    { type:'mural', x:1, y:0, w:2, seed:2 }, { type:'drawing', x:4, y:0, seed:2 }, { type:'flagUK', x:7, y:0 },
    { type:'whiteboard', x:10, y:0, w:2 }, { type:'drawing', x:12, y:0, seed:0 }, { type:'mural', x:15, y:0, w:2, seed:0, bg:'#f5e6c8' },
    { type:'aquarium', x:17, y:5 }
  ],
  wanderers: [
    { seed: 8, x:4, y:5, lines:['En el laboratorio hay un esqueleto que se llama Paco.', 'Jun Arrieta habla con las plantas. Y las plantas crecen más. Ciencia.'] },
    { seed: 91, x:14, y:5, lines:['Mr. Shakespeare solo habla en inglés. ¡Hasta en el comedor!'] }
  ],
  items: [ { id:'p2_cromo', x:17, y:3, item:'cromo', qty:2 } ]
});

MAPS.piso3 = hub(3, {
  name: '3ª planta - ESO', doorColor: DOOR_YELLOW, lockerColor:'#455a64',
  top: '###D#####A#####D###',
  doors: [
    { x:3, y:0, to:'room_arte', tx:6, ty:8, short:'ARTE' },
    { x:15, y:0, to:'biblioteca_eso', tx:7, ty:9, short:'BIBLIO.' }
  ],
  decor: [
    { type:'poster', x:1, y:0, color:'#f48fb1' }, { type:'mural', x:5, y:0, w:2, seed:1 }, { type:'whiteboard', x:7, y:0, w:1 },
    { type:'whiteboard', x:11, y:0, w:2 }, { type:'poster', x:13, y:0, color:'#ce93d8' }, { type:'drawing', x:17, y:0, seed:2 },
    { type:'bust', x:17, y:5 }
  ],
  wanderers: [
    { seed: 15, x:6, y:5, lines:['Robertiño te suspende si tuerces una línea. Una. Línea.', 'Y no se te ocurra entrar sin llamar a su aula, que entra corriente.'] },
    { seed: 63, x:13, y:6, lines:['En la biblioteca hay Coremon salvajes entre los apuntes. ¡En serio!'] }
  ]
});

MAPS.piso4 = hub(4, {
  name: '4ª planta - Bachillerato', doorColor: DOOR_BLUE, lockerColor:'#37474f',
  top: '#########A###D#####',
  doors: [ { x:13, y:0, to:'sala_bachillerato', tx:7, ty:8, short:'BACHI.' } ],
  decor: [
    { type:'poster', x:2, y:0, color:'#b39ddb' }, { type:'whiteboard', x:4, y:0, w:3 }, { type:'clock', x:11, y:0 }, { type:'poster', x:16, y:0, color:'#80cbc4' },
    { type:'coffee', x:17, y:5 }
  ],
  npcs: [ { id:'bachi1', kind:'student', x:4, y:3, look:{ hair:'spiky', hairColor:'#3b2416', shirt:'#455a64', pants:'#263238' }, facing:'right' } ],
  wanderers: [ { seed: 77, x:12, y:5, lines:['Quedan 23 días para selectividad. No me hables.'] } ],
  items: [ { id:'p4_cromoOro', x:1, y:6, item:'cromoOro', qty:1 } ]
});

MAPS.piso5 = hub(5, {
  name: '5ª planta - Dirección', floorStyle: 'carpet', floorColor: '#4a3b5c', wallStyle: 'wood', rugStyle: 'none', rugColor: '#7b1fa2', doorStyle: 'wood', lockerColor:'#6d4c41',
  top: '###D###L#A#####D###',
  doors: [
    { x:3, y:0, to:'room_liga', tx:6, ty:8, short:'DIRECTOR' },
    { x:7, y:0, to:'sala_fundador', tx:6, ty:9, short:'FUNDADOR', locked:true, requires:'director' },
    { x:15, y:0, to:'sala_castigo', tx:4, ty:6, short:'CASTIGO' }
  ],
  decor: [
    { type:'portrait', x:5, y:0, text:['Retrato del Padre Andrés Coindre, fundador.'] }, { type:'window', x:12, y:0 },
    { type:'coffee', x:11, y:1 }, { type:'sofa', x:13, y:2, w:2, color:'#6a1b9a' }, { type:'bookshelf', x:1, y:5, w:1 }
  ],
  npcs: [
    { id:'jefa', kind:'talk', x:12, y:3, look:{ hair:'long', hairColor:'#8d5524', shirt:'#37474f', pants:'#263238', skirt:true, glasses:true }, facing:'down',
      lines:['Soy la Jefa de Estudios. Has llegado lejos, alumno.', 'El despacho del Director está a la izquierda. Detrás de la puerta dorada... bueno, eso ya lo descubrirás.', 'Y ni se te ocurra volver a colarte en la sala de profesores de la 1ª planta. Te tengo fichado.'] },
    { id:'religion', kind:'talk', x:6, y:5, look:{ hair:'bald', hairColor:'#bdbdbd', shirt:'#5d4037', pants:'#3e2723', glasses:true }, facing:'down',
      lines:['Profesor de Religión. ¿Sabías que en 1818 el Padre Coindre creó el «Pío Socorro» en Lyon, con familias y benefactores, para acoger a niños abandonados?',
             'Tres años después, en 1821, nacieron los Hermanos del Sagrado Corazón. Hoy son casi mil hermanos en 36 países.'] }
  ]
});

// ---------------- SALA DE PROFESORES (1ª planta) ----------------
// Si hay profes dentro, te echan. Si está vacía puedes colarte a por lo que
// hay en las mesas... pero si te pillan, castigo en el 5º piso.
MAPS.sala_profes = {
  name: 'Sala de Profesores', floorStyle: 'carpet', floorColor: '#5d4a3a', wallStyle: 'wood',
  grid: grid([
    '###############',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#######D#######'
  ]),
  doors: [ { x:7, y:8, to:'piso1', tx:12, ty:1, exit:true } ],
  npcs: [],
  decor: [
    { type:'whiteboard', x:3, y:0, w:3, textLines:['Tablón: «Horarios. Guardias de patio. Reunión de evaluación el jueves. Se ruega no comerse los bocadillos ajenos».'] },
    { type:'clock', x:7, y:0 }, { type:'notice', x:9, y:0, w:2 }, { type:'portrait', x:12, y:0, text:['Foto de grupo del claustro. Alfonsín sale en el centro con un silbato.'] },
    { type:'coffee', x:1, y:1 }, { type:'copier', x:2, y:1 },
    { type:'lockers', x:10, y:1, w:3, color:'#6d4c41' },
    { type:'confTable', x:4, y:3, w:7, h:2 },
    { type:'chair', x:5, y:2 }, { type:'chair', x:7, y:2 }, { type:'chair', x:9, y:2 },
    { type:'chair', x:5, y:5 }, { type:'chair', x:7, y:5 }, { type:'chair', x:9, y:5 },
    { type:'sofa', x:1, y:6, w:2, color:'#455a64' }, { type:'plant', x:13, y:7 }, { type:'bookshelf', x:13, y:1 }
  ],
  items: [
    { id:'profes_caramelo', x:12, y:4, item:'caramelo', qty:1 },
    { id:'profes_oro', x:1, y:3, item:'cromoOro', qty:2 },
    { id:'profes_menu', x:13, y:6, item:'menu', qty:2 }
  ],
  spawn: { x:7, y:7 }
};

// ---------------- AULAS CON PROFESOR ----------------
function classroom(trainerId, hubId, doorX, opts) {
  return Object.assign({
    name: 'Aula de ' + TRAINERS[trainerId].subject, floorStyle: 'wood',
    grid: grid([
      '#############',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '######D######'
    ]),
    doors: [ { x:6, y:9, to:hubId, tx:doorX, ty:1, exit:true } ],
    npcs: [ { id: trainerId, kind:'trainer', x:6, y:2, look: TRAINERS[trainerId].look, facing:'down', sleepy: TRAINERS[trainerId].sleepy } ],
    spawn: { x:6, y:8 }
  }, opts, {
    decor: [ { type:'teacherDesk', x:5, y:3, w:3, talkThrough:true }, ...(opts.decor || []) ]
  });
}
const DESKS = [];
for (const y of [5, 7]) for (const x of [2, 4, 8, 10]) DESKS.push({ type:'desk', x, y });

MAPS.room_mates = classroom('mates', 'piso1', 3, {
  wallColor: '#e3f2fd', wainscot: '#1565c0',
  decor: [ { type:'chalkboard', x:3, y:0, w:7, text:'¡Ese boli tiene que echar humo!', text2:'x² + 2x + 1 = (x+1)²', textLines:['En la pizarra pone: «¡Ese boli tiene que echar humo!». Debajo, con letra más pequeña: «Aquí no hay exámenes sorpresa :)».'] }, { type:'clock', x:11, y:0 },
    { type:'bookshelf', x:1, y:1 }, { type:'globe', x:11, y:1 }, ...DESKS ]
});
MAPS.room_lengua = classroom('lengua', 'piso1', 15, {
  wallColor: '#fbe9e7', wainscot: '#6d4c41', floorColor: '#b07d4f',
  decor: [ { type:'chalkboard', x:3, y:0, w:7, text:'HORA DE LECTURA', text2:'(¿Dónde he dejado el libro?)', textLines:['En la pizarra pone «HORA DE LECTURA». Debajo, con otra letra: «¿Alguien ha visto mi libro? Y mis gafas. Y mis llaves».'] },
    { type:'poster', x:1, y:0, color:'#ffe0b2' }, { type:'poster', x:11, y:0, color:'#d7ccc8' },
    { type:'bookshelf', x:1, y:1 }, { type:'bookshelf', x:11, y:1, seed:3 }, { type:'bookshelf', x:1, y:3, seed:5 }, ...DESKS ]
});
MAPS.room_ciencias = classroom('ciencias', 'piso2', 3, {
  floorStyle: 'lab', wallColor: '#e0f2f1', wainscot: '#00695c',
  decor: [ { type:'chalkboard', x:3, y:0, w:7, white:true, text:'Hoy: cuidamos el huerto', text2:'No hay examen. Regad los geranios', textLines:['En la pizarra: «Hoy cuidamos el huerto. No hay examen. Por favor, regad los geranios».'] },
    { type:'skeleton', x:1, y:1 }, { type:'aquarium', x:11, y:1 }, { type:'plant', x:1, y:8 }, { type:'plant', x:11, y:8 },
    { type:'plant', x:1, y:3 }, { type:'plant', x:11, y:3 }, { type:'plant', x:1, y:5 }, { type:'plant', x:11, y:5 }, { type:'flowers', x:6, y:7, solid:false, color:'#ef5350' },
    { type:'labBench', x:2, y:5, w:2 }, { type:'labBench', x:8, y:5, w:2 }, { type:'labBench', x:2, y:7, w:2 }, { type:'labBench', x:8, y:7, w:2 } ]
});
MAPS.room_ingles = classroom('ingles', 'piso2', 6, {
  wallColor: '#ede7f6', wainscot: '#283593', floorStyle: 'carpet', floorColor: '#5c6bc0',
  decor: [ { type:'chalkboard', x:3, y:0, w:7, white:true, text:'Present Perfect: I have won', text2:'Irregular verbs: go-went-gone' },
    { type:'flagUK', x:1, y:0 }, { type:'flagUK', x:11, y:0 }, { type:'globe', x:1, y:1 }, { type:'bookshelf', x:11, y:1, seed:2 }, ...DESKS ]
});
MAPS.room_arte = classroom('arte', 'piso3', 3, {
  wallColor: '#fff8e1', wainscot: '#c2185b', floorColor: '#d7b98e',
  decor: [ { type:'chalkboard', x:3, y:0, w:7, white:true, text:'DIBUJO TÉCNICO', text2:'Escuadra, cartabón y compás', textLines:['En la pizarra: «DIBUJO TÉCNICO. Escuadra, cartabón y compás. PROHIBIDO TORCER LÍNEAS».'] },
    { type:'poster', x:1, y:0, color:'#ffcdd2' }, { type:'poster', x:11, y:0, color:'#b3e5fc', text:['Un cartel: «Las líneas se trazan con regla. Las excusas, también no.» — Robertiño'] },
    { type:'bust', x:1, y:1 }, { type:'easel', x:11, y:1, seed:1 },
    { type:'draftTable', x:2, y:5 }, { type:'draftTable', x:4, y:5 }, { type:'draftTable', x:8, y:5 }, { type:'draftTable', x:10, y:5 },
    { type:'draftTable', x:2, y:7 }, { type:'draftTable', x:4, y:7 }, { type:'draftTable', x:8, y:7 }, { type:'draftTable', x:10, y:7 } ]
});

MAPS.room_liga = {
  name: 'Despacho del Director', floorStyle: 'carpet', floorColor: '#3b2a4a', wallColor: '#5d4037', wainscot: '#3e2723',
  grid: classroom('director', 'piso5', 3, {}).grid,
  doors: [ { x:6, y:9, to:'piso5', tx:3, ty:1, exit:true } ],
  npcs: [ { id:'director', kind:'trainer', x:6, y:2, look:TRAINERS.director.look, facing:'down' } ],
  decor: [
    { type:'portrait', x:6, y:0, text:['Fotografía de la comunidad corazonista de Vitoria.'] }, { type:'window', x:3, y:0 }, { type:'window', x:9, y:0 },
    { type:'bigDesk', x:5, y:3, w:3, talkThrough:true },
    { type:'bookshelf', x:1, y:1, w:2 }, { type:'bookshelf', x:10, y:1, w:2, seed:4 },
    { type:'flags', x:3, y:2 }, { type:'rug', x:4, y:5, w:5, h:3, color:'#4a148c', solid:false },
    { type:'plant', x:1, y:8 }, { type:'plant', x:11, y:8 }
  ],
  spawn: { x:6, y:8 }
};

MAPS.sala_fundador = {
  name: 'Sala del Fundador', floorStyle: 'stone', wallColor: '#e8dcc0', wainscot: '#8a6d1d',
  grid: grid([
    '#############',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '#...........#',
    '######D######'
  ]),
  doors: [ { x:6, y:10, to:'piso5', tx:7, ty:1, exit:true } ],
  npcs: [ { id:'coindre', kind:'trainer', x:6, y:3, look:TRAINERS.coindre.look, facing:'down' } ],
  decor: [
    { type:'stained', x:2, y:0, seed:1 }, { type:'stained', x:4, y:0, seed:3 }, { type:'portrait', x:6, y:0, text:['«Andrés Coindre. Lyon, 1821».'] },
    { type:'stained', x:8, y:0, seed:2 }, { type:'stained', x:10, y:0, seed:4 },
    { type:'rug', x:5, y:4, w:3, h:6, color:'#8a6d1d', solid:false },
    { type:'candle', x:2, y:2 }, { type:'candle', x:10, y:2 }, { type:'candle', x:2, y:6 }, { type:'candle', x:10, y:6 },
    { type:'flowers', x:1, y:9, color:'#ef5350', solid:false }, { type:'flowers', x:11, y:9, color:'#ffffff', solid:false }
  ],
  spawn: { x:6, y:9 }
};

// ---------------- SALAS DE ENTRENAMIENTO ----------------
MAPS.room_apoyo = {
  name: 'Sala de Apoyo y Tecnología', floorStyle: 'tile', floorColor: '#cfd8dc', wallColor: '#e1f5fe', wainscot: '#0277bd',
  grid: grid([
    '#############',
    '#...........#',
    '#.zzz...zzz.#',
    '#.zzz...zzz.#',
    '#...........#',
    '#.zzz...zzz.#',
    '#.zzz...zzz.#',
    '#...........#',
    '#...........#',
    '######D######'
  ]),
  doors: [ { x:6, y:9, to:'piso2', tx:13, ty:1, exit:true } ],
  npcs: [ { id:'friki', kind:'student', x:10, y:8, look:{ hair:'spiky', hairColor:'#d4a017', shirt:'#455a64', pants:'#263238', glasses:true }, facing:'left' } ],
  decor: [
    { type:'chalkboard', x:4, y:0, w:5, white:true, text:'ROBÓTICA 2.0', text2:'if (coremon) capturar();' },
    { type:'computer', x:1, y:1 }, { type:'computer', x:3, y:1 }, { type:'computer', x:9, y:1 }, { type:'computer', x:11, y:1 },
    { type:'robot', x:1, y:8 }
  ],
  items: [ { id:'apoyo_zumo', x:11, y:7, item:'zumo', qty:1 } ],
  wildZone: 'apoyo',
  spawn: { x:6, y:8 }
};

MAPS.biblioteca_eso = {
  name: 'Biblioteca ESO', floorStyle: 'carpet', floorColor: '#6d4c41', wallColor: '#efebe9', wainscot: '#5d4037',
  grid: grid([
    '###############',
    '#.............#',
    '#.............#',
    '#.zzz.....zzz.#',
    '#.............#',
    '#.zzz.....zzz.#',
    '#.............#',
    '#.zzz.....zzz.#',
    '#.............#',
    '#.............#',
    '#######D#######'
  ]),
  doors: [ { x:7, y:10, to:'piso3', tx:15, ty:1, exit:true } ],
  npcs: [
    { id:'bibliotecaria', kind:'talk', x:7, y:1, look:LOOKS.bibliotecaria, facing:'down',
      lines:['Shhh. Esto es una biblioteca.', 'Los Coremon de tipo Letras se esconden entre los apuntes. Si los molestas, atacan.'] },
    { id:'lector', kind:'student', x:12, y:9, look:{ hair:'long', hairColor:'#6d3b1f', shirt:'#8e24aa', pants:'#33334a', glasses:true }, facing:'left' }
  ],
  decor: [
    { type:'counter', x:6, y:2, w:3, talkThrough:true },
    { type:'bookshelf', x:2, y:2, w:3 }, { type:'bookshelf', x:10, y:2, w:3, seed:2 },
    { type:'bookshelf', x:2, y:4, w:3, seed:4 }, { type:'bookshelf', x:10, y:4, w:3, seed:1 },
    { type:'bookshelf', x:2, y:6, w:3, seed:3 }, { type:'bookshelf', x:10, y:6, w:3, seed:5 },
    { type:'readingTable', x:6, y:5, w:3 }, { type:'readingTable', x:6, y:7, w:3 },
    { type:'window', x:3, y:0 }, { type:'clock', x:7, y:0 }, { type:'window', x:11, y:0 }
  ],
  items: [ { id:'biblio_caramelo', x:1, y:9, item:'caramelo', qty:1 } ],
  wildZone: 'biblioteca_eso',
  spawn: { x:7, y:9 }
};

MAPS.sala_bachillerato = {
  name: 'Sala de Bachillerato', floorStyle: 'tile', floorColor: '#b39ddb', wallColor: '#ede7f6', wainscot: '#311b92',
  grid: grid([
    '###############',
    '#.............#',
    '#.............#',
    '#.zz.zz.zz.zz.#',
    '#.............#',
    '#.zz.zz.zz.zz.#',
    '#.............#',
    '#.zz.zz.zz.zz.#',
    '#.............#',
    '#######D#######'
  ]),
  doors: [ { x:7, y:9, to:'piso4', tx:13, ty:1, exit:true } ],
  npcs: [ { id:'bachi2', kind:'student', x:2, y:8, look:{ hair:'bun', hairColor:'#1a1a1a', shirt:'#4527a0', pants:'#263238', skirt:true }, facing:'right' } ],
  decor: [
    { type:'chalkboard', x:4, y:0, w:7, text:'SELECTIVIDAD: QUEDAN 23 DÍAS', text2:'∫ f(x)dx = F(b) - F(a)' },
    { type:'teacherDesk', x:6, y:1, w:3 }, { type:'trophy', x:12, y:1, w:2 }, { type:'flags', x:1, y:1 }
  ],
  wildZone: 'bachillerato',
  spawn: { x:7, y:8 }
};

MAPS.sala_castigo = {
  name: 'Sala de Castigo', floorStyle: 'dark', wallColor: '#6d6875', wainscot: '#3a3346',
  grid: grid([
    '#########',
    '#.......#',
    '#.......#',
    '#.......#',
    '#.......#',
    '#.......#',
    '#.......#',
    '####D####'
  ]),
  doors: [ { x:4, y:7, to:'piso5', tx:15, ty:1, exit:true } ],
  npcs: [ { id:'castigado', kind:'student', x:4, y:2, look:{ hair:'spiky', hairColor:'#a0522d', shirt:'#1f3b73', pants:'#33334a', tie:'#b71c1c' }, facing:'down' } ],
  decor: [
    { type:'chalkboard', x:1, y:0, w:3, text:'NO ENTRARÉ EN', text2:'LA SALA DE PROFES' }, { type:'clock', x:5, y:0 },
    { type:'desk', x:4, y:3, talkThrough:true }, { type:'chair', x:1, y:5 }, { type:'chair', x:7, y:5 }
  ],
  spawn: { x:4, y:6 }
};

// ---------------- UTILIDADES ----------------
const TILE_WALKABLE = t => t !== '#' && t !== 'w';
// 'g' = césped corto decorativo (se puede pisar, sin encuentros)
const TILE_ENCOUNTER = t => t === ',' || t === 'z';

function decorAt(map, x, y) {
  return (map.decor || []).find(d => decorCovers(d, x, y) && !decorDef(d.type).wall);
}

// Rellena valores por defecto de mapas (listas vacías)
Object.values(MAPS).forEach(m => {
  m.npcs = m.npcs || []; m.decor = m.decor || []; m.items = m.items || []; m.wanderers = m.wanderers || [];
});

// Paredes de dos casillas de alto (estilo DS) en todas las salas interiores:
// añade una fila de pared arriba y desplaza todo una casilla hacia abajo,
// incluidas las puertas de otras salas que llevan a esta.
function addTallWall(id) {
  const m = MAPS[id];
  m.grid.unshift(new Array(m.grid[0].length).fill('#'));
  // copias propias: algunas listas (pupitres, butacas) se comparten entre salas
  ['doors', 'npcs', 'decor', 'wanderers', 'items'].forEach(k => { m[k] = m[k].map(o => Object.assign({}, o, { y: o.y + 1 })); });
  m.spawn = { x: m.spawn.x, y: m.spawn.y + 1 };
  Object.values(MAPS).forEach(other => other.doors.forEach(d => { if (d.to === id) d.ty += 1; }));
  m.tallWall = true;
}
Object.keys(MAPS).filter(id => !MAPS[id].outdoor).forEach(addTallWall);
