// ============================================================
// COREMON - Datos del juego (tipos, movimientos, especies, mapas)
// Todo lo visual aquí es sustituible: ver assets/README.md
// ============================================================

const TYPES = ['logica', 'letras', 'arte', 'idioma', 'naturaleza', 'fisico'];

const TYPE_LABEL = {
  logica: 'Lógica', letras: 'Letras', arte: 'Arte',
  idioma: 'Idioma', naturaleza: 'Naturaleza', fisico: 'Físico'
};

const TYPE_COLOR = {
  logica: '#4f6df5', letras: '#b05fe0', arte: '#e05f9c',
  idioma: '#e0a93f', naturaleza: '#4fb259', fisico: '#e05f4f'
};

// Ciclo hexagonal: cada tipo es fuerte contra el siguiente y débil contra el anterior
const TYPE_CYCLE = ['logica', 'letras', 'arte', 'idioma', 'naturaleza', 'fisico'];
function typeEffectiveness(moveType, defType) {
  if (moveType === defType) return 1;
  const i = TYPE_CYCLE.indexOf(moveType);
  const beats = TYPE_CYCLE[(i + 1) % 6];
  const losesTo = TYPE_CYCLE[(i + 5) % 6];
  if (defType === beats) return 1.5;
  if (defType === losesTo) return 0.67;
  return 1;
}

// ---------------- MOVIMIENTOS ----------------
// Potencias subidas respecto a la v1 para que los combates pesen más y no
// se puedan ganar simplemente spameando el movimiento básico (que además
// tiene PP limitada, ver data.js createPokemon/freshMoveSlots).
const MOVES = {
  calculo:    { name: 'Cálculo Exacto',   type: 'logica',     power: 45, acc: 0.95, pp: 20 },
  axioma:     { name: 'Axioma',          type: 'logica',     power: 70, acc: 0.90, pp: 10 },
  logicaplas: { name: 'Lógica Aplastante', type: 'logica',    power: 95, acc: 0.78, pp: 5  },
  ortografia: { name: 'Zarpazo Ortográfico', type: 'letras',  power: 45, acc: 0.95, pp: 20 },
  metafora:   { name: 'Metáfora Cortante', type: 'letras',    power: 70, acc: 0.90, pp: 10 },
  redaccion:  { name: 'Redacción Épica',  type: 'letras',     power: 95, acc: 0.78, pp: 5  },
  pincelada:  { name: 'Pincelada',        type: 'arte',       power: 45, acc: 0.95, pp: 20 },
  collage:    { name: 'Collage Furioso',  type: 'arte',       power: 70, acc: 0.90, pp: 10 },
  obramaestra:{ name: 'Obra Maestra',     type: 'arte',       power: 95, acc: 0.78, pp: 5  },
  vocabulario:{ name: 'Golpe de Vocabulario', type: 'idioma', power: 45, acc: 0.95, pp: 20 },
  acento:     { name: 'Acento Perfecto',  type: 'idioma',     power: 70, acc: 0.90, pp: 10 },
  fluidez:    { name: 'Fluidez Total',    type: 'idioma',     power: 95, acc: 0.78, pp: 5  },
  fotosintesis:{ name: 'Fotosíntesis',    type: 'naturaleza', power: 45, acc: 0.95, pp: 20 },
  raiz:       { name: 'Latigazo de Raíz', type: 'naturaleza', power: 70, acc: 0.90, pp: 10 },
  ecosistema: { name: 'Ecosistema Furioso', type: 'naturaleza', power: 95, acc: 0.78, pp: 5 },
  flexion:    { name: 'Flexión Rápida',   type: 'fisico',     power: 45, acc: 0.95, pp: 20 },
  saque:      { name: 'Saque Potente',    type: 'fisico',     power: 70, acc: 0.90, pp: 10 },
  marchaforzada:{ name: 'Marcha Forzada', type: 'fisico',     power: 95, acc: 0.78, pp: 5  },
  placaje:    { name: 'Placaje',          type: null,         power: 36, acc: 1.00, pp: 30 }
};

// ---------------- ESPECIES ----------------
// baseStats: hp, atk, def, spd. movePool: ids de MOVES que puede aprender (por nivel)
// archetype: silueta del sprite (ver js/sprites.js ARCHETYPES). Especies de
// una misma línea comparten silueta; especies de líneas distintas (aunque
// sean del mismo tipo) llevan siluetas distintas para que cada Coremon se
// reconozca a simple vista.
const SPECIES = {
  // --- Línea inicial: Lógica (silueta "block", robótica) ---
  tizorex:   { name: 'Tizorex',    type: 'logica', stage:0, archetype:'block', baseStats: {hp:40,atk:40,def:35,spd:35}, evolvesTo:'tizordax', evolveLevel:16, learn:{1:['placaje','calculo'],8:['axioma'],18:['logicaplas']} },
  tizordax:  { name: 'Tizordax',   type: 'logica', stage:1, archetype:'block', baseStats: {hp:58,atk:55,def:48,spd:45}, evolvesTo:'tizormax', evolveLevel:24, learn:{16:['axioma'],24:['logicaplas']} },
  tizormax:  { name: 'Tizormax',   type: 'logica', stage:2, archetype:'block', baseStats: {hp:78,atk:75,def:62,spd:58}, evolvesTo:null, learn:{24:['logicaplas']} },
  // --- Línea inicial: Letras (silueta "quill", pluma) ---
  plumavox:  { name: 'Plumavox',   type: 'letras', stage:0, archetype:'quill', baseStats: {hp:38,atk:42,def:33,spd:38}, evolvesTo:'plumalyra', evolveLevel:16, learn:{1:['placaje','ortografia'],8:['metafora'],18:['redaccion']} },
  plumalyra: { name: 'Plumalyra',  type: 'letras', stage:1, archetype:'quill', baseStats: {hp:55,atk:58,def:46,spd:50}, evolvesTo:'plumagrand', evolveLevel:24, learn:{16:['metafora'],24:['redaccion']} },
  plumagrand:{ name: 'Plumagrand', type: 'letras', stage:2, archetype:'quill', baseStats: {hp:74,atk:78,def:60,spd:64}, evolvesTo:null, learn:{24:['redaccion']} },
  // --- Línea inicial: Físico (silueta "pack", mochila) ---
  mochiloide:{ name: 'Mochiloide', type: 'fisico', stage:0, archetype:'pack', baseStats: {hp:45,atk:45,def:40,spd:30}, evolvesTo:'mochilotrix', evolveLevel:16, learn:{1:['placaje','flexion'],8:['saque'],18:['marchaforzada']} },
  mochilotrix:{name: 'Mochilotrix',type: 'fisico', stage:1, archetype:'pack', baseStats: {hp:64,atk:60,def:55,spd:40}, evolvesTo:'mochilokong', evolveLevel:24, learn:{16:['saque'],24:['marchaforzada']} },
  mochilokong:{name: 'Mochilokong',type: 'fisico', stage:2, archetype:'pack', baseStats: {hp:85,atk:80,def:72,spd:50}, evolvesTo:null, learn:{24:['marchaforzada']} },
  // --- Salvajes: patio y pasillos ---
  gomitas:   { name: 'Gomitas',    type: 'logica', stage:0, archetype:'round', baseStats: {hp:30,atk:30,def:28,spd:40}, evolvesTo:'gomigante', evolveLevel:15, learn:{1:['placaje','calculo'],10:['axioma']} },
  gomigante: { name: 'Gomigante',  type: 'logica', stage:1, archetype:'round', baseStats: {hp:50,atk:48,def:45,spd:55}, evolvesTo:null, learn:{15:['axioma'],25:['logicaplas']} },
  librillo:  { name: 'Librillo',   type: 'letras', stage:0, archetype:'book', baseStats: {hp:28,atk:32,def:26,spd:35}, evolvesTo:'libratomo', evolveLevel:15, learn:{1:['placaje','ortografia'],10:['metafora']} },
  libratomo: { name: 'Libratomo',  type: 'letras', stage:1, archetype:'book', baseStats: {hp:48,atk:52,def:42,spd:46}, evolvesTo:null, learn:{15:['metafora'],25:['redaccion']} },
  acuarelix: { name: 'Acuarelix',  type: 'arte', stage:0, archetype:'drip', baseStats: {hp:30,atk:34,def:25,spd:38}, evolvesTo:'acuaremaster', evolveLevel:15, learn:{1:['placaje','pincelada'],10:['collage']} },
  acuaremaster:{name:'Acuaremaster',type:'arte', stage:1, archetype:'drip', baseStats: {hp:50,atk:56,def:40,spd:50}, evolvesTo:null, learn:{15:['collage'],25:['obramaestra']} },
  vocabulix: { name: 'Vocabulix',  type: 'idioma', stage:0, archetype:'speech', baseStats: {hp:29,atk:33,def:27,spd:37}, evolvesTo:'vocabulemperor', evolveLevel:15, learn:{1:['placaje','vocabulario'],10:['acento']} },
  vocabulemperor:{name:'Vocabulemperor',type:'idioma', stage:1, archetype:'speech', baseStats:{hp:49,atk:54,def:43,spd:48}, evolvesTo:null, learn:{15:['acento'],25:['fluidez']} },
  hojalata:  { name: 'Hojalata',   type: 'naturaleza', stage:0, archetype:'leaf', baseStats: {hp:34,atk:30,def:34,spd:30}, evolvesTo:'hojarbol', evolveLevel:15, learn:{1:['placaje','fotosintesis'],10:['raiz']} },
  hojarbol:  { name: 'Hojárbol',   type: 'naturaleza', stage:1, archetype:'leaf', baseStats: {hp:58,atk:48,def:54,spd:38}, evolvesTo:null, learn:{15:['raiz'],25:['ecosistema']} },
  pelotroncho:{name: 'Pelotroncho',type: 'fisico', stage:0, archetype:'ball', baseStats: {hp:36,atk:36,def:30,spd:34}, evolvesTo:'pelotitan', evolveLevel:15, learn:{1:['placaje','flexion'],10:['saque']} },
  pelotitan: { name: 'Pelotitán',  type: 'fisico', stage:1, archetype:'ball', baseStats: {hp:56,atk:58,def:46,spd:44}, evolvesTo:null, learn:{15:['saque'],25:['marchaforzada']} },
  // --- Jefes únicos (reutilizan la silueta de su familia, a más escala) ---
  bibliomante:{ name: 'Bibliomante', type: 'letras', stage:2, archetype:'book', baseStats: {hp:60,atk:58,def:50,spd:52}, evolvesTo:null, learn:{1:['ortografia','metafora','redaccion']} },
  teoremorfo:{ name: 'Teoremorfo', type: 'logica', stage:2, archetype:'block', baseStats: {hp:62,atk:58,def:52,spd:48}, evolvesTo:null, learn:{1:['calculo','axioma','logicaplas']} },
  atletisaurio:{name:'Atletisaurio',type:'fisico', stage:2, archetype:'pack', baseStats: {hp:66,atk:62,def:52,spd:50}, evolvesTo:null, learn:{1:['flexion','saque','marchaforzada']} },
  musarte:   { name: 'Musarte',    type: 'arte', stage:2, archetype:'drip', baseStats: {hp:58,atk:60,def:48,spd:56}, evolvesTo:null, learn:{1:['pincelada','collage','obramaestra']} },
  naturalux: { name: 'Naturalux',  type: 'naturaleza', stage:2, archetype:'leaf', baseStats: {hp:64,atk:56,def:58,spd:46}, evolvesTo:null, learn:{1:['fotosintesis','raiz','ecosistema']} },
  lingualord:{ name: 'Lingualord', type: 'idioma', stage:2, archetype:'speech', baseStats: {hp:60,atk:60,def:50,spd:54}, evolvesTo:null, learn:{1:['vocabulario','acento','fluidez']} },
  directorex:{ name: 'Directorex', type: 'logica', stage:3, archetype:'block', baseStats: {hp:82,atk:68,def:64,spd:58}, evolvesTo:null, learn:{1:['axioma','logicaplas','placaje']} },
  // --- Legendario del Fundador: el Sagrado Corazón ---
  corazonix: { name: 'Corazonix', type: 'naturaleza', stage:3, archetype:'heart', color:'#d32f2f', accent:'#ffd54f',
    baseStats: {hp:90,atk:72,def:68,spd:62}, evolvesTo:null, learn:{1:['ecosistema','redaccion','fluidez','logicaplas']} }
};

// Incluye lo que aprenden las formas anteriores de su línea evolutiva
function learnChain(speciesId) {
  const chain = [speciesId];
  let cur = speciesId;
  for (;;) {
    const prev = Object.keys(SPECIES).find(k => SPECIES[k].evolvesTo === cur);
    if (!prev) break;
    chain.unshift(prev); cur = prev;
  }
  const entries = [];
  chain.forEach(id => Object.entries(SPECIES[id].learn).forEach(([lvl, ms]) => entries.push([+lvl, ms])));
  return entries.sort((a, b) => a[0] - b[0]);
}

function movesLearnedUpTo(speciesId, level) {
  let moves = [];
  for (const [lvl, ms] of learnChain(speciesId)) {
    if (lvl <= level) moves = moves.concat(ms);
  }
  // últimos 4 aprendidos, sin duplicados
  const uniq = [...new Set(moves)];
  return uniq.slice(-4);
}

function freshMoveSlots(speciesId, level) {
  return movesLearnedUpTo(speciesId, level).map(id => ({ id, pp: MOVES[id].pp, maxPp: MOVES[id].pp }));
}

// Al subir de nivel o evolucionar: conserva la PP restante de los movimientos
// que ya tenía y añade a tope los que aprende nuevos.
function relearnMoveSlots(oldMoves, speciesId, level) {
  const ids = movesLearnedUpTo(speciesId, level);
  return ids.map(id => {
    const prev = oldMoves.find(m => m.id === id);
    return prev ? { id, pp: prev.pp, maxPp: MOVES[id].pp } : { id, pp: MOVES[id].pp, maxPp: MOVES[id].pp };
  });
}

function createPokemon(speciesId, level) {
  const sp = SPECIES[speciesId];
  const stats = {
    hp: Math.floor(sp.baseStats.hp * (1 + level * 0.12)),
    atk: Math.floor(sp.baseStats.atk * (1 + level * 0.09)),
    def: Math.floor(sp.baseStats.def * (1 + level * 0.09)),
    spd: Math.floor(sp.baseStats.spd * (1 + level * 0.07))
  };
  return {
    species: speciesId,
    level,
    exp: 0,
    stats,
    hp: stats.hp,
    moves: freshMoveSlots(speciesId, level)
  };
}

function expToNext(level) { return Math.floor(12 * Math.pow(level, 1.6)); }

// ---------------- OBJETOS ----------------
const ITEMS = {
  bocadillo: { name:'Bocadillo', desc:'Recupera 30 PS a un Coremon.', kind:'heal', amount:30, price:150, icon:'#e0a050' },
  menu:      { name:'Menú del comedor', desc:'Recupera 100 PS a un Coremon.', kind:'heal', amount:100, price:400, icon:'#ff8a65' },
  zumo:      { name:'Zumo de naranja', desc:'Recupera 10 PP de cada movimiento.', kind:'pp', amount:10, price:300, icon:'#ffa726' },
  tirita:    { name:'Tirita mágica', desc:'Reanima a un Coremon debilitado con la mitad de PS.', kind:'revive', price:600, icon:'#f8bbd0' },
  cromo:     { name:'Cromo', desc:'Lánzalo a un Coremon salvaje para capturarlo.', kind:'capture', rate:1.0, price:200, icon:'#42a5f5' },
  cromoOro:  { name:'Cromo dorado', desc:'Cromo especial con más probabilidad de captura.', kind:'capture', rate:1.7, price:550, icon:'#ffd54f' },
  caramelo:  { name:'Caramelo raro', desc:'Sube un nivel a un Coremon.', kind:'level', price:0, icon:'#ce93d8' }
};
const SHOP_STOCK = ['bocadillo', 'menu', 'zumo', 'tirita', 'cromo', 'cromoOro'];

// ---------------- PROFESORES (repartidos por plantas) ----------------
// look: aspecto del sprite (ver sprites.js drawPerson). Cada profe es distinto.
const TRAINERS = {
  efisica:{ id:'efisica', name:'Profe Atlas', subject:'Educación Física', room:'room_tatami', floor:0,
    look:{ hair:'spiky', hairColor:'#1a1a1a', skin:'#c68642', shirt:'#d32f2f', pants:'#1565c0' },
    team:[['mochiloide',4],['pelotroncho',5]], reward:'Insignia Física', badgeColor:'#e05f4f', prize:300,
    intro:['¡Vamos, vamos! ¡Diez vueltas al tatami antes de hablar conmigo!', 'Bah, ya veo que tienes energía. ¡A ver si tu Coremon aguanta mi ritmo!'],
    win:'¡Uf! Buen calentamiento. Tienes madera de deportista, como los Coras que llegaron a la NBA.' },
  mates: { id:'mates', name:'Profesora Álgebra', subject:'Matemáticas', room:'room_mates', floor:1,
    look:{ hair:'bun', hairColor:'#5d4037', shirt:'#1565c0', pants:'#263238', skirt:true, glasses:true },
    team:[['tizorex',4],['gomitas',5]], reward:'Insignia de Lógica', badgeColor:'#4f6df5', prize:330,
    intro:['Silencio. Saca una hoja.', 'Examen sorpresa: si tu equipo resuelve este problema, apruebas. Si no... recuperación.'],
    win:'Correcto. Demostración impecable. Q.E.D.' },
  lengua:{ id:'lengua', name:'Profesor Cervantes', subject:'Lengua', room:'room_lengua', floor:1,
    look:{ hair:'short', hairColor:'#9e9e9e', shirt:'#6d4c41', pants:'#3e2723', beard:true, beardColor:'#bdbdbd', glasses:true },
    team:[['plumavox',5],['librillo',6]], reward:'Insignia de Letras', badgeColor:'#b05fe0', prize:350,
    intro:['«En un lugar de Corazonistas, de cuyo nombre sí quiero acordarme...»', 'Veamos si tu equipo sabe escribir su propia historia.'],
    win:'Ni una falta de ortografía. Tienes mi aprobado, y mi respeto.' },
  ciencias:{ id:'ciencias', name:'Profesor Darwin', subject:'Ciencias Naturales', room:'room_ciencias', floor:2,
    look:{ hair:'bald', hairColor:'#e0e0e0', shirt:'#f5f5f5', pants:'#455a64', beard:true, beardColor:'#eeeeee', collar:'#4caf50' },
    team:[['hojalata',8],['hojarbol',9]], reward:'Insignia Natural', badgeColor:'#4fb259', prize:400,
    intro:['Ah, un nuevo espécimen. Fascinante.', 'Solo sobreviven los equipos que mejor se adaptan. ¿Será el tuyo?'],
    win:'Selección natural... a tu favor. Toma nota en tu cuaderno de campo.' },
  ingles:{ id:'ingles', name:'Mr. Shakespeare', subject:'Inglés', room:'room_ingles', floor:2,
    look:{ hair:'short', hairColor:'#d4a017', skin:'#ffdbac', shirt:'#1e3a8a', pants:'#212121', tie:'#c62828' },
    team:[['vocabulix',9],['vocabulemperor',10]], reward:'Insignia de Idioma', badgeColor:'#e0a93f', prize:430,
    intro:['Good morning, student!', 'To win or not to win, that is the question. Let\'s battle!'],
    win:'Well done! Your English... I mean, your battling, is excellent.' },
  arte:  { id:'arte', name:'Profesora Frida', subject:'Arte', room:'room_arte', floor:3,
    look:{ hair:'long', hairColor:'#1a1a1a', skin:'#e0ac69', shirt:'#c2185b', pants:'#4a148c', skirt:true },
    team:[['acuarelix',11],['acuaremaster',12]], reward:'Insignia de Arte', badgeColor:'#e05f9c', prize:460,
    intro:['Cuidado con el caballete, que la pintura aún está fresca.', 'Un combate también es una obra de arte. Pinta tu victoria... si puedes.'],
    win:'¡Qué composición tan atrevida! Me la llevo para la exposición.' },
  director:{ id:'director', name:'El Director', subject:'Prueba del Director', room:'room_liga', floor:5,
    look:{ hair:'short', hairColor:'#616161', skin:'#e0ac69', shirt:'#212121', pants:'#212121', tie:'#7b1fa2', glasses:true },
    team:[['teoremorfo',13],['bibliomante',13],['atletisaurio',13],['musarte',14],['lingualord',14],['directorex',16]],
    reward:'Sello del Director', badgeColor:'#7b1fa2', prize:1500,
    intro:['Así que tú eres el alumno del que todo el colegio habla.', 'Seis insignias. Impresionante. Pero detrás de esa puerta te espera alguien que lleva esperando a un alumno como tú desde 1821.', 'Primero, tendrás que superarme a mí.'],
    win:'Has superado mi prueba. La Sala del Fundador está abierta. Él te espera.' },
  coindre:{ id:'coindre', name:'Padre Andrés Coindre', subject:'El Fundador', room:'sala_fundador', floor:5,
    look:{ hair:'short', hairColor:'#eeeeee', skin:'#f2c49b', shirt:'#151515', pants:'#151515', robe:true, collar:'#fafafa' },
    team:[['naturalux',15],['lingualord',15],['musarte',16],['atletisaurio',16],['bibliomante',17],['corazonix',19]],
    reward:'Corazón de Corazonista', badgeColor:'#d32f2f', prize:5000,
    intro:[
      'Bienvenido, joven Cora. Me llamo Andrés Coindre.',
      'Nací en Lyon en 1787. Una noche de invierno, al volver a casa, encontré a dos niñas temblando de frío en el pórtico de la iglesia de Saint-Nizier.',
      'Aquella noche entendí mi misión: que ningún niño se quedara sin hogar ni sin educación.',
      'En 1821 fundé los Hermanos del Sagrado Corazón. Doscientos años después, este colegio de Vitoria es la casa corazonista con más alumnos de España.',
      'Has demostrado saber. Ahora demuéstrame que tienes corazón.'
    ],
    win:'Tienes el corazón de un verdadero Corazonista. Cuida de los demás como yo cuidé de aquellas niñas. Esta casa es tuya.' }
};

// Alumnos que retan a combate (opcionales, dan dinero y experiencia)
const STUDENT_TRAINERS = {
  basket1:   { name:'Alumno de baloncesto', team:[['pelotroncho',4]], prize:120, intro:'¡Eh, tú! ¡Un uno contra uno, pero de Coremon!', win:'Vale, vale... me has hecho un mate.' },
  basket2:   { name:'Alumna capitana', team:[['pelotroncho',5],['gomitas',5]], prize:180, intro:'Soy la capitana del equipo. ¡Nadie me gana en mi cancha!', win:'Hoy has ganado tú. Mañana revancha.' },
  judoka:    { name:'Judoka de 2º ESO', team:[['mochiloide',6]], prize:150, intro:'¡Hajime! ¡A combatir!', win:'Ippon... para ti.' },
  empollon:  { name:'Empollón de 6º', team:[['librillo',7],['gomitas',7]], prize:220, intro:'He leído 47 libros de estrategia Coremon este verano.', win:'Esto no venía en ningún libro...' },
  friki:     { name:'Alumno de robótica', team:[['gomitas',8],['vocabulix',8]], prize:260, intro:'Mi robot ha calculado que tienes un 3% de probabilidades de ganar.', win:'Error de cálculo. Recalibrando...' },
  lector:    { name:'Lectora de la biblioteca', team:[['librillo',10],['acuarelix',11]], prize:300, intro:'Shhh... Si pierdes, en silencio.', win:'Shhh... vale, has ganado. Pero en silencio.' },
  bachi1:    { name:'Alumno de 2º de Bachillerato', team:[['libratomo',14],['gomigante',15]], prize:450, intro:'Estoy de exámenes de selectividad. Esto será rápido.', win:'Vuelvo a estudiar... con la moral por los suelos.' },
  bachi2:    { name:'Delegada de Bachillerato', team:[['acuaremaster',15],['hojarbol',15],['vocabulemperor',16]], prize:520, intro:'Como delegada, debo comprobar que estás preparado para subir.', win:'Aprobado. Puedes pasar.' },
  castigado: { name:'Alumno castigado', team:[['pelotitan',16],['gomigante',16]], prize:600, intro:'Llevo aquí desde 3º de la ESO por copiar en Lógica. Me aburro. ¡Pelea conmigo!', win:'Bueno, al menos ha sido entretenido. Me quedo aquí otro rato...' }
};

function academicBadgeCount(badges) {
  return badges.filter(b => b !== 'director' && b !== 'coindre').length;
}

// Zonas salvajes: patio/jardín (planta baja) y zonas de cada planta
const WILD_TABLE = {
  patio: ['gomitas','librillo','pelotroncho','hojalata'],
  jardin: ['hojalata','pelotroncho','librillo','acuarelix'],
  apoyo: ['vocabulix','gomitas','hojalata'],
  biblioteca_eso: ['librillo','acuarelix','vocabulix'],
  bachillerato: ['gomigante','libratomo','acuaremaster','vocabulemperor','hojarbol','pelotitan']
};

// Plantas del colegio e insignias necesarias para que el ascensor suba
const FLOORS = [
  { id:0, name:'Planta Baja', hub:'planta_baja', needBadges:0 },
  { id:1, name:'1ª planta - Primaria', hub:'piso1', needBadges:0 },
  { id:2, name:'2ª planta - 5º/6º y Apoyo', hub:'piso2', needBadges:2 },
  { id:3, name:'3ª planta - ESO', hub:'piso3', needBadges:4 },
  { id:4, name:'4ª planta - Bachillerato', hub:'piso4', needBadges:5 },
  { id:5, name:'5ª planta - Sala de Profesores', hub:'piso5', needBadges:6 }
];
