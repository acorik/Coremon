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
  tizordax:  { name: 'Tizordax',   type: 'logica', stage:1, archetype:'block', baseStats: {hp:58,atk:55,def:48,spd:45}, evolvesTo:'tizormax', evolveLevel:32, learn:{16:['axioma'],24:['logicaplas']} },
  tizormax:  { name: 'Tizormax',   type: 'logica', stage:2, archetype:'block', baseStats: {hp:78,atk:75,def:62,spd:58}, evolvesTo:null, learn:{32:['logicaplas']} },
  // --- Línea inicial: Letras (silueta "quill", pluma) ---
  plumavox:  { name: 'Plumavox',   type: 'letras', stage:0, archetype:'quill', baseStats: {hp:38,atk:42,def:33,spd:38}, evolvesTo:'plumalyra', evolveLevel:16, learn:{1:['placaje','ortografia'],8:['metafora'],18:['redaccion']} },
  plumalyra: { name: 'Plumalyra',  type: 'letras', stage:1, archetype:'quill', baseStats: {hp:55,atk:58,def:46,spd:50}, evolvesTo:'plumagrand', evolveLevel:32, learn:{16:['metafora'],24:['redaccion']} },
  plumagrand:{ name: 'Plumagrand', type: 'letras', stage:2, archetype:'quill', baseStats: {hp:74,atk:78,def:60,spd:64}, evolvesTo:null, learn:{32:['redaccion']} },
  // --- Línea inicial: Físico (silueta "pack", mochila) ---
  mochiloide:{ name: 'Mochiloide', type: 'fisico', stage:0, archetype:'pack', baseStats: {hp:45,atk:45,def:40,spd:30}, evolvesTo:'mochilotrix', evolveLevel:16, learn:{1:['placaje','flexion'],8:['saque'],18:['marchaforzada']} },
  mochilotrix:{name: 'Mochilotrix',type: 'fisico', stage:1, archetype:'pack', baseStats: {hp:64,atk:60,def:55,spd:40}, evolvesTo:'mochilokong', evolveLevel:32, learn:{16:['saque'],24:['marchaforzada']} },
  mochilokong:{name: 'Mochilokong',type: 'fisico', stage:2, archetype:'pack', baseStats: {hp:85,atk:80,def:72,spd:50}, evolvesTo:null, learn:{32:['marchaforzada']} },
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
  bibliomante:{ name: 'Bibliomante', type: 'letras', stage:2, archetype:'book', baseStats: {hp:70,atk:62,def:55,spd:52}, evolvesTo:null, learn:{1:['ortografia','metafora','redaccion']} },
  teoremorfo:{ name: 'Teoremorfo', type: 'logica', stage:2, archetype:'block', baseStats: {hp:72,atk:64,def:58,spd:50}, evolvesTo:null, learn:{1:['calculo','axioma','logicaplas']} },
  atletisaurio:{name:'Atletisaurio',type:'fisico', stage:2, archetype:'pack', baseStats: {hp:80,atk:70,def:60,spd:55}, evolvesTo:null, learn:{1:['flexion','saque','marchaforzada']} },
  musarte:   { name: 'Musarte',    type: 'arte', stage:2, archetype:'drip', baseStats: {hp:68,atk:66,def:52,spd:58}, evolvesTo:null, learn:{1:['pincelada','collage','obramaestra']} },
  naturalux: { name: 'Naturalux',  type: 'naturaleza', stage:2, archetype:'leaf', baseStats: {hp:75,atk:60,def:65,spd:48}, evolvesTo:null, learn:{1:['fotosintesis','raiz','ecosistema']} },
  lingualord:{ name: 'Lingualord', type: 'idioma', stage:2, archetype:'speech', baseStats: {hp:70,atk:65,def:56,spd:54}, evolvesTo:null, learn:{1:['vocabulario','acento','fluidez']} },
  directorex:{ name: 'Directorex', type: 'logica', stage:3, archetype:'block', baseStats: {hp:110,atk:85,def:80,spd:65}, evolvesTo:null, learn:{1:['axioma','logicaplas','placaje']} }
};

function movesLearnedUpTo(speciesId, level) {
  const sp = SPECIES[speciesId];
  let moves = [];
  for (const lvl of Object.keys(sp.learn).map(Number).sort((a,b)=>a-b)) {
    if (lvl <= level) moves = moves.concat(sp.learn[lvl]);
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

function expToNext(level) { return Math.floor(20 * Math.pow(level, 1.6)); }

// ---------------- EQUIPOS DE PROFESORES (repartidos por plantas) ----------------
const TRAINERS = {
  efisica:{ id:'efisica', name:'Profe Atlas', subject:'Educación Física', room:'room_tatami', floor:0,
    team:[['pelotroncho',4],['mochiloide',5]], reward:'Insignia Física', prize:300 },
  mates: { id:'mates', name:'Profesora Álgebra', subject:'Matemáticas', room:'room_mates', floor:1,
    team:[['gomitas',5],['tizorex',5]], reward:'Insignia de Lógica', prize:330 },
  lengua:{ id:'lengua', name:'Profesor Cervantes', subject:'Lengua', room:'room_lengua', floor:1,
    team:[['librillo',6],['plumavox',6]], reward:'Insignia de Letras', prize:350 },
  ciencias:{ id:'ciencias', name:'Profesor Darwin', subject:'Ciencias Naturales', room:'room_ciencias', floor:2,
    team:[['hojalata',8],['hojarbol',9]], reward:'Insignia Natural', prize:400 },
  ingles:{ id:'ingles', name:'Mr. Shakespeare', subject:'Inglés', room:'room_ingles', floor:2,
    team:[['vocabulix',9],['vocabulemperor',10]], reward:'Insignia de Idioma', prize:430 },
  arte:  { id:'arte', name:'Profesora Frida', subject:'Arte', room:'room_arte', floor:3,
    team:[['acuarelix',11],['acuaremaster',12]], reward:'Insignia de Arte', prize:460 },
  director:{ id:'director', name:'El Director', subject:'Liga Corazonistas', room:'room_liga', floor:5,
    team:[['teoremorfo',16],['bibliomante',16],['atletisaurio',16],['musarte',16],['naturalux',17],['lingualord',18],['directorex',20]],
    reward:'Campeón de Corazonistas Vitoria', prize:2000 }
};

// Zonas salvajes: patio/jardín (planta baja) y zonas de cada planta
const WILD_TABLE = {
  patio: ['gomitas','librillo','pelotroncho','hojalata'],
  jardin: ['hojalata','pelotroncho','librillo','acuarelix'],
  apoyo: ['vocabulix','gomitas','hojalata'],
  biblioteca_eso: ['librillo','acuarelix','vocabulix'],
  bachillerato: ['gomigante','libratomo','acuaremaster','vocabulemperor','hojarbol','pelotitan']
};

// Plantas del colegio: nombre, insignias necesarias para desbloquearla desde
// el ascensor de Planta Baja, y qué salas contiene (para el menú de piso).
const FLOORS = [
  { id:0, name:'Planta Baja', needBadges:0, rooms:['tatami','salon_actos','capilla','sala_conferencias'] },
  { id:1, name:'1º - Primaria', needBadges:0, rooms:['room_mates','room_lengua'] },
  { id:2, name:'2º - Primaria (5º-6º) y Apoyo', needBadges:2, rooms:['room_ciencias','room_ingles','room_apoyo'] },
  { id:3, name:'3º - ESO', needBadges:4, rooms:['room_arte','biblioteca_eso'] },
  { id:4, name:'4º - Bachillerato', needBadges:5, rooms:['sala_bachillerato'] },
  { id:5, name:'5º - Sala de Profesores', needBadges:6, rooms:['room_liga','sala_castigo'] }
];
