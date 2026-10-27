// ============================================================
// COREMON 2 — Especies: los 31 Coremon del colegio (idénticos a Coremon 1)
// y los Coremon nuevos del mundo, generados a partir de sus líneas evolutivas.
// ============================================================

// ---- Coremon 1 (no cambian: el equipo importado es exactamente el mismo) ----
const C1_SPECIES = {
  tizorex: {name:"Tizorex",type:"logica",plan:"golem",stage:0,base:{hp:40,atk:40,def:35,spd:35},evolvesTo:"tizordax",evolveLevel:16,learn:{1:["placaje","calculo"],8:["axioma"],18:["logicaplas"]},c1:true},
  tizordax: {name:"Tizordax",type:"logica",plan:"golem",stage:1,base:{hp:58,atk:55,def:48,spd:45},evolvesTo:"tizormax",evolveLevel:24,learn:{16:["axioma"],24:["logicaplas"]},c1:true},
  tizormax: {name:"Tizormax",type:"logica",plan:"golem",stage:2,base:{hp:78,atk:75,def:62,spd:58},evolvesTo:null,evolveLevel:null,learn:{24:["logicaplas"]},c1:true},
  plumavox: {name:"Plumavox",type:"letras",plan:"bird",stage:0,base:{hp:38,atk:42,def:33,spd:38},evolvesTo:"plumalyra",evolveLevel:16,learn:{1:["placaje","ortografia"],8:["metafora"],18:["redaccion"]},c1:true},
  plumalyra: {name:"Plumalyra",type:"letras",plan:"bird",stage:1,base:{hp:55,atk:58,def:46,spd:50},evolvesTo:"plumagrand",evolveLevel:24,learn:{16:["metafora"],24:["redaccion"]},c1:true},
  plumagrand: {name:"Plumagrand",type:"letras",plan:"bird",stage:2,base:{hp:74,atk:78,def:60,spd:64},evolvesTo:null,evolveLevel:null,learn:{24:["redaccion"]},c1:true},
  mochiloide: {name:"Mochiloide",type:"fisico",plan:"pack",stage:0,base:{hp:45,atk:45,def:40,spd:30},evolvesTo:"mochilotrix",evolveLevel:16,learn:{1:["placaje","flexion"],8:["saque"],18:["marchaforzada"]},c1:true},
  mochilotrix: {name:"Mochilotrix",type:"fisico",plan:"pack",stage:1,base:{hp:64,atk:60,def:55,spd:40},evolvesTo:"mochilokong",evolveLevel:24,learn:{16:["saque"],24:["marchaforzada"]},c1:true},
  mochilokong: {name:"Mochilokong",type:"fisico",plan:"pack",stage:2,base:{hp:85,atk:80,def:72,spd:50},evolvesTo:null,evolveLevel:null,learn:{24:["marchaforzada"]},c1:true},
  gomitas: {name:"Gomitas",type:"logica",plan:"blob",stage:0,base:{hp:30,atk:30,def:28,spd:40},evolvesTo:"gomigante",evolveLevel:15,learn:{1:["placaje","calculo"],10:["axioma"]},c1:true},
  gomigante: {name:"Gomigante",type:"logica",plan:"blob",stage:1,base:{hp:50,atk:48,def:45,spd:55},evolvesTo:null,evolveLevel:null,learn:{15:["axioma"],25:["logicaplas"]},c1:true},
  librillo: {name:"Librillo",type:"letras",plan:"book",stage:0,base:{hp:28,atk:32,def:26,spd:35},evolvesTo:"libratomo",evolveLevel:15,learn:{1:["placaje","ortografia"],10:["metafora"]},c1:true},
  libratomo: {name:"Libratomo",type:"letras",plan:"book",stage:1,base:{hp:48,atk:52,def:42,spd:46},evolvesTo:null,evolveLevel:null,learn:{15:["metafora"],25:["redaccion"]},c1:true},
  acuarelix: {name:"Acuarelix",type:"arte",plan:"drip",stage:0,base:{hp:30,atk:34,def:25,spd:38},evolvesTo:"acuaremaster",evolveLevel:15,learn:{1:["placaje","pincelada"],10:["collage"]},c1:true},
  acuaremaster: {name:"Acuaremaster",type:"arte",plan:"drip",stage:1,base:{hp:50,atk:56,def:40,spd:50},evolvesTo:null,evolveLevel:null,learn:{15:["collage"],25:["obramaestra"]},c1:true},
  vocabulix: {name:"Vocabulix",type:"idioma",plan:"bubble",stage:0,base:{hp:29,atk:33,def:27,spd:37},evolvesTo:"vocabulemperor",evolveLevel:15,learn:{1:["placaje","vocabulario"],10:["acento"]},c1:true},
  vocabulemperor: {name:"Vocabulemperor",type:"idioma",plan:"bubble",stage:1,base:{hp:49,atk:54,def:43,spd:48},evolvesTo:null,evolveLevel:null,learn:{15:["acento"],25:["fluidez"]},c1:true},
  hojalata: {name:"Hojalata",type:"naturaleza",plan:"plant",stage:0,base:{hp:34,atk:30,def:34,spd:30},evolvesTo:"hojarbol",evolveLevel:15,learn:{1:["placaje","fotosintesis"],10:["raiz"]},c1:true},
  hojarbol: {name:"Hojárbol",type:"naturaleza",plan:"plant",stage:1,base:{hp:58,atk:48,def:54,spd:38},evolvesTo:null,evolveLevel:null,learn:{15:["raiz"],25:["ecosistema"]},c1:true},
  pelotroncho: {name:"Pelotroncho",type:"fisico",plan:"ball",stage:0,base:{hp:36,atk:36,def:30,spd:34},evolvesTo:"pelotitan",evolveLevel:15,learn:{1:["placaje","flexion"],10:["saque"]},c1:true},
  pelotitan: {name:"Pelotitán",type:"fisico",plan:"ball",stage:1,base:{hp:56,atk:58,def:46,spd:44},evolvesTo:null,evolveLevel:null,learn:{15:["saque"],25:["marchaforzada"]},c1:true},
  bibliomante: {name:"Bibliomante",type:"letras",plan:"book",stage:2,base:{hp:60,atk:58,def:50,spd:52},evolvesTo:null,evolveLevel:null,learn:{1:["ortografia","metafora","redaccion"]},c1:true},
  teoremorfo: {name:"Teoremorfo",type:"logica",plan:"golem",stage:2,base:{hp:62,atk:58,def:52,spd:48},evolvesTo:null,evolveLevel:null,learn:{1:["calculo","axioma","logicaplas"]},c1:true},
  atletisaurio: {name:"Atletisaurio",type:"fisico",plan:"pack",stage:2,base:{hp:66,atk:62,def:52,spd:50},evolvesTo:null,evolveLevel:null,learn:{1:["flexion","saque","marchaforzada"]},c1:true},
  musarte: {name:"Musarte",type:"arte",plan:"drip",stage:2,base:{hp:58,atk:60,def:48,spd:56},evolvesTo:null,evolveLevel:null,learn:{1:["pincelada","collage","obramaestra"]},c1:true},
  naturalux: {name:"Naturalux",type:"naturaleza",plan:"plant",stage:2,base:{hp:64,atk:56,def:58,spd:46},evolvesTo:null,evolveLevel:null,learn:{1:["fotosintesis","raiz","ecosistema"]},c1:true},
  lingualord: {name:"Lingualord",type:"idioma",plan:"bubble",stage:2,base:{hp:60,atk:60,def:50,spd:54},evolvesTo:null,evolveLevel:null,learn:{1:["vocabulario","acento","fluidez"]},c1:true},
  directorex: {name:"Directorex",type:"logica",plan:"golem",stage:3,base:{hp:82,atk:68,def:64,spd:58},evolvesTo:null,evolveLevel:null,learn:{1:["axioma","logicaplas","placaje"]},c1:true},
  chispin: {name:"Chispín",type:"logica",plan:"robot",stage:0,base:{hp:44,atk:46,def:42,spd:44},evolvesTo:"circuitron",evolveLevel:22,learn:{1:["placaje","calculo"],12:["axioma"],20:["logicaplas"]},c1:true,color:"#90a4ae",accent:"#ffca28"},
  circuitron: {name:"Circuitrón",type:"logica",plan:"robot",stage:1,base:{hp:66,atk:68,def:62,spd:60},evolvesTo:null,evolveLevel:null,learn:{22:["logicaplas"]},c1:true,color:"#78909c",accent:"#ffca28"},
  corazonix: {name:"Corazonix",type:"naturaleza",plan:"heart",stage:3,base:{hp:90,atk:72,def:68,spd:62},evolvesTo:null,evolveLevel:null,learn:{1:["ecosistema","redaccion","fluidez","logicaplas"]},c1:true,color:"#d32f2f",accent:"#ffd54f"}
};

// ---- Líneas evolutivas nuevas de Coremon 2 ----
// [tipo, cuerpo, [nombres por fase], [niveles de evolución], perfil, tipo de cobertura]
// Cuerpos: beast, biped, bird, fish, serpent, blob, bug, plant, golem, spirit, robot, ball, book, drip, bubble.
const LINES = [
  // fuego
  ['fuego', 'beast', ['Chispazo', 'Brasón', 'Infernox'], [16, 36], 'atk', 'roca'],
  ['fuego', 'biped', ['Lagartizón', 'Salamandrax'], [28], 'spd', 'roca'],
  ['fuego', 'bird', ['Pavesa', 'Fénixor'], [34], 'spd', 'luz'],
  ['fuego', 'blob', ['Ascuín', 'Magmotón'], [30], 'def', 'roca'],
  ['fuego', 'bug', ['Candelilla', 'Farolux'], [24], 'bal', 'luz'],
  ['fuego', 'beast', ['Cenizo', 'Corcelíneo'], [32], 'spd', 'aire'],
  ['fuego', 'serpent', ['Txistorrín', 'Txistorrón'], [26], 'hp', 'fisico'],
  // agua
  ['agua', 'fish', ['Gotín', 'Olaxo', 'Maremoto'], [16, 36], 'bal', 'hielo'],
  ['agua', 'fish', ['Sardinón', 'Atunauta'], [26], 'spd', 'aire'],
  ['agua', 'serpent', ['Anguilón', 'Leviagua'], [40], 'atk', 'sombra'],
  ['agua', 'bug', ['Cangrejito', 'Pinzarrón'], [30], 'def', 'roca'],
  ['agua', 'spirit', ['Medusín', 'Medusoberana'], [33], 'hp', 'electrico'],
  ['agua', 'bird', ['Gaviotín', 'Albatrón'], [27], 'spd', 'aire'],
  ['agua', 'blob', ['Pulpín', 'Pulpotrón'], [30], 'bal', 'sombra'],
  // naturaleza
  ['naturaleza', 'plant', ['Brotín', 'Arbustor', 'Robledón'], [16, 36], 'def', 'roca'],
  ['naturaleza', 'bug', ['Orugalia', 'Mariposela'], [20], 'spd', 'aire'],
  ['naturaleza', 'blob', ['Setilla', 'Hongolem'], [31], 'hp', 'sombra'],
  ['naturaleza', 'beast', ['Ciervito', 'Ciervosque'], [34], 'atk', 'luz'],
  ['naturaleza', 'plant', ['Pétalin', 'Floradiva'], [29], 'bal', 'arte'],
  ['naturaleza', 'plant', ['Pimientín', 'Pimentón'], [24], 'atk', 'fuego'],
  // eléctrico
  ['electrico', 'beast', ['Voltín', 'Voltarrón'], [22], 'spd', 'fisico'],
  ['electrico', 'robot', ['Bitbot', 'Megabyte', 'Gigatrón'], [20, 40], 'def', 'logica'],
  ['electrico', 'bird', ['Rayín', 'Tormentáguila'], [35], 'spd', 'aire'],
  ['electrico', 'bug', ['Chispilla', 'Zumbatrón'], [25], 'spd', 'naturaleza'],
  ['electrico', 'blob', ['Pilita', 'Baterión'], [28], 'hp', 'roca'],
  ['electrico', 'serpent', ['Tranvín', 'Tranvitrón'], [30], 'def', 'fisico'],
  // hielo
  ['hielo', 'beast', ['Escarchito', 'Glaciolobo'], [32], 'atk', 'sombra'],
  ['hielo', 'bird', ['Copito', 'Ventisquero'], [33], 'spd', 'aire'],
  ['hielo', 'golem', ['Cubitón', 'Icebergón'], [38], 'def', 'agua'],
  ['hielo', 'fish', ['Focalín', 'Morsatrón'], [30], 'hp', 'agua'],
  ['hielo', 'spirit', ['Nevadín', 'Auroreal'], [36], 'bal', 'luz'],
  ['hielo', 'blob', ['Granizín', 'Pedriscón'], [27], 'def', 'roca'],
  // roca
  ['roca', 'golem', ['Guijarrín', 'Pedrusco', 'Montañón'], [18, 38], 'def', 'fisico'],
  ['roca', 'beast', ['Tortugrava', 'Caparazón'], [34], 'def', 'agua'],
  ['roca', 'bug', ['Fosilín', 'Ammonitón'], [35], 'def', 'agua'],
  ['roca', 'serpent', ['Grieto'], [], 'atk', 'sombra'],
  ['roca', 'blob', ['Cuarcín', 'Geodón'], [30], 'def', 'luz'],
  ['roca', 'golem', ['Menhirín', 'Dolmenator'], [34], 'hp', 'naturaleza'],
  // aire
  ['aire', 'bird', ['Plumín', 'Vendavalín', 'Huracanix'], [16, 36], 'spd', 'fisico'],
  ['aire', 'spirit', ['Cometín', 'Remolinón'], [28], 'spd', 'luz'],
  ['aire', 'bug', ['Libelulín', 'Libelustorm'], [26], 'spd', 'agua'],
  ['aire', 'blob', ['Nubín', 'Nubarrón'], [30], 'hp', 'electrico'],
  ['aire', 'golem', ['Molinillo', 'Aerogenerón'], [30], 'def', 'electrico'],
  // sombra
  ['sombra', 'spirit', ['Sombrín', 'Espectrón', 'Pesadillux'], [20, 40], 'spd', 'idioma'],
  ['sombra', 'beast', ['Michisombra', 'Panteoscura'], [32], 'atk', 'fisico'],
  ['sombra', 'bird', ['Murcielín', 'Vampirón'], [25], 'spd', 'aire'],
  ['sombra', 'blob', ['Tinieblín', 'Abismoide'], [35], 'hp', 'agua'],
  ['sombra', 'bird', ['Buhíto', 'Lechuzombra'], [30], 'bal', 'letras'],
  ['sombra', 'spirit', ['Akelarrín', 'Sorginón'], [33], 'atk', 'fuego'],
  // luz
  ['luz', 'spirit', ['Destellín', 'Resplandín', 'Solemnix'], [22, 42], 'bal', 'fuego'],
  ['luz', 'bird', ['Albita', 'Aurorapluma'], [34], 'spd', 'aire'],
  ['luz', 'beast', ['Potrillux', 'Unilux'], [38], 'atk', 'fisico'],
  ['luz', 'bug', ['Hadilla', 'Hadaluz'], [28], 'spd', 'arte'],
  ['luz', 'golem', ['Faroluz', 'Faralón'], [31], 'def', 'agua'],
  // físico
  ['fisico', 'biped', ['Puñín', 'Boxeón', 'Campeonix'], [20, 40], 'atk', 'roca'],
  ['fisico', 'beast', ['Torito', 'Bisontazo'], [33], 'atk', 'roca'],
  ['fisico', 'ball', ['Balonín', 'Balonazo'], [25], 'spd', 'aire'],
  ['fisico', 'biped', ['Monito', 'Gorilazo'], [30], 'atk', 'naturaleza'],
  ['fisico', 'ball', ['Pelotari', 'Frontonix'], [29], 'spd', 'logica'],
  // lógica
  ['logica', 'robot', ['Calculín', 'Algoritmón'], [30], 'def', 'electrico'],
  ['logica', 'bird', ['Ajedrecín', 'Jaquemate'], [35], 'bal', 'sombra'],
  ['logica', 'golem', ['Cubín', 'Teseracto'], [40], 'def', 'luz'],
  // letras
  ['letras', 'book', ['Polillibro', 'Bibliopolilla'], [27], 'bal', 'aire'],
  ['letras', 'bird', ['Tintero', 'Plumacrón'], [30], 'spd', 'sombra'],
  ['letras', 'serpent', ['Pergamín', 'Papirón'], [33], 'hp', 'fuego'],
  // arte
  ['arte', 'drip', ['Pintín', 'Pinturón'], [26], 'bal', 'agua'],
  ['arte', 'bird', ['Notilla', 'Sinfonix'], [32], 'spd', 'idioma'],
  ['arte', 'golem', ['Escultín', 'Marmolón'], [36], 'def', 'roca'],
  ['arte', 'blob', ['Txalapartín', 'Txalapartón'], [28], 'atk', 'fisico'],
  // idioma
  ['idioma', 'bird', ['Lorito', 'Loroglot'], [28], 'spd', 'aire'],
  ['idioma', 'bubble', ['Ecoín', 'Babelón'], [35], 'hp', 'sombra']
];

// ---- Legendarios del mundo ----
const LEGENDS = [
  ['cimientor', 'Cimientor', 'roca', 'golem', 'cimientos', 'El gigante que dormía bajo el gimnasio del colegio. Sostiene los cimientos del mundo.'],
  ['mecardio', 'Mecardio', 'electrico', 'robot', 'latido', 'Un corazón mecánico fabricado por CoraCorp para controlar a los demás Coremon.'],
  ['tormentix', 'Tormentix', 'aire', 'bird', 'huracan', 'Dicen que cada tormenta de Iberión nace de un batir de sus alas.'],
  ['glaciara', 'Glaciara', 'hielo', 'spirit', 'glaciacion', 'Duerme en lo más alto de Nevera. Su aliento congela el tiempo.'],
  ['ignisaurio', 'Ignisaurio', 'fuego', 'beast', 'infierno', 'Vive dentro del volcán de Ignea. Cuando ruge, la tierra tiembla.'],
  ['oceanox', 'Oceanox', 'agua', 'serpent', 'tsunami', 'Guardián de la Ría. Las mareas obedecen a su respiración.'],
  ['silvador', 'Silvador', 'naturaleza', 'plant', 'selva', 'El árbol más antiguo del Bosque Olvido. Tiene raíces en todo el continente.'],
  ['eclipsor', 'Eclipsor', 'sombra', 'spirit', 'eclipse', 'Aparece en Umbría las noches sin luna.'],
  ['albor', 'Albor', 'luz', 'bird', 'supernova', 'Su vuelo marca el amanecer en la Cumbre Corazón.']
];

const PROFILES = {
  atk: { hp: 0.24, atk: 0.32, def: 0.2, spd: 0.24 },
  def: { hp: 0.28, atk: 0.22, def: 0.32, spd: 0.18 },
  spd: { hp: 0.22, atk: 0.28, def: 0.18, spd: 0.32 },
  hp:  { hp: 0.34, atk: 0.24, def: 0.24, spd: 0.18 },
  bal: { hp: 0.25, atk: 0.25, def: 0.25, spd: 0.25 }
};

const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const SPECIES = {};
Object.entries(C1_SPECIES).forEach(([id, sp]) => { SPECIES[id] = Object.assign({ id }, sp); });

function statsFor(total, profile, seed) {
  const p = PROFILES[profile], r = mulberry32(seed);
  const o = {};
  ['hp', 'atk', 'def', 'spd'].forEach(k => { o[k] = Math.round(total * p[k] * (0.92 + r() * 0.16)); });
  return o;
}

// aprendizaje por niveles según tipo, cobertura y fase
function genLearn(type, cov, stage, legendSig) {
  const T = TYPE_MOVES[type], C = TYPE_MOVES[cov] || T;
  if (legendSig) return { 1: [legendSig, T[2], C[2], T[3]] };
  return { 1: ['placaje', T[0]], 9: [TYPE_STATUS_MOVE[type]], 16: [T[1]], 26: [C[1]], 34: [T[2]], 46: [T[3]], 54: [C[2]] };
}

LINES.forEach(([type, plan, names, levels, profile, cov], li) => {
  const n = names.length;
  const totals = n === 3 ? [180, 250, 315] : n === 2 ? [190, 290] : [285];
  const ids = names.map(slug);
  names.forEach((name, i) => {
    SPECIES[ids[i]] = {
      id: ids[i], name, type, plan, stage: n === 1 ? 1 : i, line: ids[0], lineIndex: li,
      base: statsFor(totals[i], profile, strSeed(ids[i])),
      evolvesTo: ids[i + 1] || null, evolveLevel: levels[i] || null,
      learn: genLearn(type, cov, i), cov
    };
  });
});
LEGENDS.forEach(([id, name, type, plan, sig, lore]) => {
  SPECIES[id] = { id, name, type, plan, stage: 3, legendary: true, lore,
    base: statsFor(375, 'bal', strSeed(id)), evolvesTo: null, learn: genLearn(type, type, 3, sig) };
});

// los Coremon del colegio también aprenden ataques fuertes del mundo
Object.values(C1_SPECIES).forEach(() => {});
Object.keys(C1_SPECIES).forEach(id => {
  const sp = SPECIES[id];
  sp.learn = Object.assign({}, sp.learn);
  sp.learn[30] = (sp.learn[30] || []).concat([TYPE_STATUS_MOVE[sp.type]]);
  sp.learn[46] = (sp.learn[46] || []).concat([TYPE_MOVES[sp.type][3]]);
});

// habilidad pasiva de cada especie (siempre la misma)
Object.values(SPECIES).forEach(sp => {
  if (sp.legendary) { sp.ability = 'aura'; return; }
  const opts = ['furia', TYPE_ABILITY[sp.type] || 'veloz', ['intimida', 'robusto', 'veloz', 'coraza', 'suerte', 'agallas'][strSeed('ab2:' + (sp.line || sp.id)) % 6]];
  sp.ability = opts[strSeed('ab:' + (sp.line || sp.id)) % 3];
});
function abilityOf(m) { return SPECIES[m.species].ability || 'furia'; }
function abilityName(m) { const a = abilityOf(m); return a === 'furia' ? FURIA_NAME[SPECIES[m.species].type] || 'Furia' : ABILITIES[a].name; }

// número de Coredex: primero los del colegio, luego los del mundo
const DEX_ORDER = Object.keys(SPECIES);
const STARTERS2 = ['chispazo', 'gotin', 'brotin'];

// ---------------- COREMON INDIVIDUALES ----------------
function learnChain(id) {
  const chain = [id];
  for (let cur = id; ;) {
    const prev = Object.keys(SPECIES).find(k => SPECIES[k].evolvesTo === cur);
    if (!prev) break;
    chain.unshift(prev); cur = prev;
  }
  const entries = [];
  chain.forEach(cid => Object.entries(SPECIES[cid].learn || {}).forEach(([lv, ms]) => entries.push([+lv, ms])));
  return entries.sort((a, b) => a[0] - b[0]);
}
function movesUpTo(id, level) {
  let ms = [];
  for (const [lv, list] of learnChain(id)) if (lv <= level) ms = ms.concat(list);
  ms = [...new Set(ms.filter(m => MOVES[m]))];
  // prioriza ataques: como mucho 1 movimiento de estado
  const atk = ms.filter(m => MOVES[m].power > 0), st = ms.filter(m => MOVES[m].power === 0);
  const pick = atk.slice(-3).concat(st.slice(-1));
  return (pick.length < 4 ? ms.slice(-4) : pick).slice(-4);
}
function makeMon(id, level) {
  level = clamp(Math.round(level), 1, 100);
  const m = { species: id, level, exp: 0, status: null, moves: movesUpTo(id, level).map(mid => ({ id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp })) };
  m.hp = monStats(m).hp;
  return m;
}
function monStats(m) {
  const b = SPECIES[m.species].base, L = m.level;
  return {
    hp: Math.floor(b.hp * (1 + L * 0.12)) + 5,
    atk: Math.floor(b.atk * (1 + L * 0.09)),
    def: Math.floor(b.def * (1 + L * 0.09)),
    spd: Math.floor(b.spd * (1 + L * 0.07))
  };
}
function expToNext(level) { return Math.floor(12 * Math.pow(level, 1.6)); }
function monName(m) { return m.nick || SPECIES[m.species].name; }
function healMon(m) { m.hp = monStats(m).hp; m.status = null; m.moves.forEach(x => x.pp = x.maxPp); }
