// ============================================================
// COREMON 2 — Historia: Dra. Olaia, el rival Unai, CoraCorp (la Empresa
// Corazonista), los 8 gimnasios de Iberión, la Liga, los legendarios y
// todos los personajes del mundo.
// ============================================================

// ---------------- COREMON SALVAJES POR REGIÓN ----------------
const WILD = {
  gasteiz: { pool: ['orugalia', 'setilla', 'ciervito', 'voltin', 'plumin', 'balonin', 'monito', 'pimientin', 'guijarrin', 'gomitas', 'hojalata', 'pelotroncho', 'librillo', 'petalin', 'torito'], dark: ['mariposela', 'hongolem', 'ciervosque', 'vendavalin', 'gorilazo', 'naturalux'] },
  ria: { pool: ['sardinon', 'gaviotin', 'cangrejito', 'medusin', 'anguilon', 'pulpin', 'txistorrin', 'pelotari', 'lorito', 'focalin'], dark: ['atunauta', 'albatron', 'pinzarron', 'medusoberana', 'lingualord'] },
  umbria: { pool: ['sombrin', 'tinieblin', 'setilla', 'akelarrin', 'murcielin', 'buhito', 'polillibro', 'ecoin', 'pergamin', 'anguilon'], dark: ['espectron', 'abismoide', 'vampiron', 'lechuzombra', 'bibliomante'] },
  almar: { pool: ['cuarcin', 'tortugrava', 'fosilin', 'grieto', 'lagartizon', 'ascuin', 'pintin', 'escultin', 'menhirin'], dark: ['geodon', 'caparazon', 'ammoniton', 'salamandrax', 'musarte'] },
  ignea: { pool: ['ascuin', 'lagartizon', 'pavesa', 'candelilla', 'cenizo', 'guijarrin', 'menhirin', 'txistorrin'], dark: ['magmoton', 'fenixor', 'farolux', 'corcelineo', 'atletisaurio'] },
  voltia: { pool: ['bitbot', 'rayin', 'chispilla', 'pilita', 'tranvin', 'calculin', 'ajedrecin', 'cubin', 'molinillo', 'torito', 'tizorex', 'vocabulix'], dark: ['megabyte', 'tormentaguila', 'zumbatron', 'algoritmon', 'teoremorfo'] },
  bosque: { pool: ['plumin', 'cometin', 'libelulin', 'nubin', 'petalin', 'ciervito', 'hadilla', 'notilla', 'txalapartin', 'lorito', 'tintero', 'acuarelix', 'plumavox'], dark: ['remolinon', 'libelustorm', 'nubarron', 'floradiva', 'sinfonix', 'naturalux'] },
  nevera: { pool: ['escarchito', 'copito', 'cubiton', 'focalin', 'nevadin', 'granizin', 'albita', 'potrillux'], dark: ['glaciolobo', 'ventisquero', 'icebergon', 'auroreal', 'aurorapluma'] },
  liga: { pool: ['destellin', 'michisombra', 'punin', 'tintero', 'pergamin', 'faroluz', 'hadilla', 'escarchito', 'mochiloide'], dark: ['resplandin', 'panteoscura', 'boxeon', 'faralon', 'unilux', 'lingualord'] }
};
function wildEncounter(city, tile) {
  const w = WILD[city.id], r = Math.random;
  const dark = tile === T.DARK;
  let lv = city.lv[0] + Math.floor(r() * (city.lv[1] - city.lv[0] + 1));
  if (dark) lv += 5 + Math.floor(r() * 4);
  // legendarios del colegio: rarísimos en la hierba oscura
  const list = dark ? (r() < 0.6 ? w.dark : w.pool) : w.pool;
  let sp = list[Math.floor(r() * list.length)];
  const legend = SPECIES[sp].c1 && SPECIES[sp].stage >= 2 && !SPECIES[sp].evolvesTo && ['teoremorfo', 'bibliomante', 'atletisaurio', 'musarte', 'naturalux', 'lingualord'].includes(sp);
  if (legend && r() > 0.25) sp = w.pool[Math.floor(r() * w.pool.length)];
  const isLegend = ['teoremorfo', 'bibliomante', 'atletisaurio', 'musarte', 'naturalux', 'lingualord'].includes(sp);
  lv = clamp(lv, 2, 100);
  return { species: isLegend ? sp : evolveForLevel(sp, lv), level: lv, legendary: isLegend, shiny: !isLegend && rollShiny() };
}
function teamFrom(city, lv, n, seed) {
  const r = mulberry32(seed), w = WILD[city];
  const out = [];
  for (let i = 0; i < n; i++) { const sp = w.pool[Math.floor(r() * w.pool.length)]; const l = lv + Math.floor(r() * 3) - 1; out.push([evolveForLevel(sp, l), l]); }
  return out;
}

// ---------------- LÍDERES DE GIMNASIO ----------------
const GYMS = {
  gasteiz: { name: 'Amaia', title: 'Líder Amaia', look: { skin: '#f2c49b', hair: 'ponytail', hairColor: '#6d3b1f', shirt: '#558b2f', pants: '#4e342e', cap: '#558b2f' }, prize: 2400,
    team: [['setilla', 15], ['ciervito', 16], ['arbustor', 18]],
    intro: ['Bienvenido al Gimnasio de Gasteiz. Soy Amaia, guardabosques de la Pradera.', 'Esta ciudad se llama verde por algo. Las raíces aguantan todo... ¿y tu equipo?'],
    win: ['Tienes raíces fuertes. Toma la Medalla Raíz.', 'Con ella, la barrera de CoraCorp hacia el Puerto de la Ría ya no te detendrá.'] },
  ria: { name: 'Koldo', title: 'Capitán Koldo', look: { skin: '#c68642', hair: 'cap', cap: '#1565c0', hairColor: '#1a1a1a', shirt: '#eceff1', pants: '#1a237e', beard: true, beardColor: '#424242' }, prize: 2900,
    team: [['sardinon', 20], ['pulpin', 20], ['medusin', 21], ['atunauta', 22]],
    intro: ['¡Ah del barco! Soy Koldo, capitán del puerto.', 'Gracias por echar a esos de CoraCorp de mis muelles. Pero en el agua no regalo nada.'],
    win: ['¡Hundido! Toma la Medalla Marea.', 'Al este está Umbría. Ten cuidado: dicen que CoraCorp anda por la ciénaga.'] },
  umbria: { name: 'Maite', title: 'Sorgina Maite', look: { skin: '#f6d8c4', hair: 'long', hairColor: '#1a1a1a', shirt: '#4a148c', pants: '#1d1a26', robe: true }, prize: 3400,
    team: [['murcielin', 24], ['michisombra', 24], ['akelarrin', 25], ['espectron', 26]],
    intro: ['La niebla me dijo que vendrías.', 'Soy Maite. Las sombras de Umbría guardan secretos... y mis Coremon también.'],
    win: ['La luz de tu equipo atraviesa la niebla. Medalla Eclipse para ti.', 'En el desierto de Almar CoraCorp está excavando. Buscan algo enterrado.'] },
  almar: { name: 'Nerea', title: 'Arqueóloga Nerea', look: { skin: '#e0ac69', hair: 'cap', cap: '#c8a165', hairColor: '#6d3b1f', shirt: '#a1887f', pants: '#5d4037', glasses: true }, prize: 3900,
    team: [['cuarcin', 28], ['tortugrava', 28], ['fosilin', 29], ['pedrusco', 30]],
    intro: ['Llevo diez años excavando estas dunas. CoraCorp lleva diez días y ya lo ha destrozado todo.', 'Soy Nerea. Enséñame que tu equipo es tan duro como la roca.'],
    win: ['Duro como el granito. Toma la Medalla Duna.', 'CoraCorp buscaba restos del Núcleo... la energía que hace nacer a los Coremon. Algo traman.'] },
  ignea: { name: 'Iker', title: 'Herrero Iker', look: { skin: '#c68642', hair: 'short', hairColor: '#3b2416', shirt: '#bf360c', pants: '#3e2723', beard: true, beardColor: '#3b2416' }, prize: 4400,
    team: [['candelilla', 32], ['cenizo', 32], ['lagartizon', 33], ['magmoton', 34]],
    intro: ['Aquí forjamos el acero con el calor del volcán.', 'Soy Iker. Si tu equipo no se funde, saldrá más fuerte.'],
    win: ['¡Forjado a fuego! La Medalla Brasa es tuya.', 'Con el pase de CoraCorp podrás entrar en su torre de Voltia. Ten cuidado ahí dentro.'] },
  voltia: { name: 'Zuriñe', title: 'Ingeniera Zuriñe', look: { skin: '#f2c49b', hair: 'short', hairColor: '#f2c418', shirt: '#263238', pants: '#37474f', glasses: true, coat: true }, prize: 4900,
    team: [['voltarron', 36], ['megabyte', 36], ['zumbatron', 37], ['baterion', 37], ['tranvitron', 38]],
    intro: ['Me encerraron en su torre por negarme a construir a Mecardio. Gracias por sacarme.', 'Ahora, como líder de Voltia, me toca probarte. ¡A plena potencia!'],
    win: ['Cortocircuito total. Medalla Voltio para ti.', 'Si Mecardio llega a la Cumbre Corazón, CoraCorp controlará a Cimientor. Necesitas todas las medallas.'] },
  bosque: { name: 'Beñat', title: 'Pastor Beñat', look: { skin: '#e0ac69', hair: 'curly', hairColor: '#8d5524', shirt: '#2e7d32', pants: '#5d4037' }, prize: 5400,
    team: [['libelustorm', 40], ['remolinon', 40], ['nubarron', 41], ['aerogeneron', 41], ['huracanix', 42]],
    intro: ['El viento del Bosque Olvido sopla desde que el mundo es mundo.', 'Soy Beñat. Veamos si tu equipo aguanta un buen vendaval.'],
    win: ['Has calmado la tormenta. Medalla Pluma.', 'Al norte, Nevera. La última medalla antes de la Cumbre.'] },
  nevera: { name: 'Garazi', title: 'Montañera Garazi', look: { skin: '#ffdbac', hair: 'bun', hairColor: '#d4a017', shirt: '#0277bd', pants: '#263238', cap: '#0277bd' }, prize: 5900,
    team: [['ventisquero', 44], ['glaciolobo', 44], ['icebergon', 45], ['morsatron', 45], ['auroreal', 46]],
    intro: ['He subido todas las cumbres de Iberión. Esta es la más fría: mi gimnasio.', 'Soy Garazi. Si aguantas el frío, la Cumbre Corazón te espera.'],
    win: ['¡Has fundido el hielo! La Medalla Escarcha es la última.', 'Con ocho medallas, la barrera de la Cumbre Corazón caerá. CoraCorp ya está allí. ¡Corre!'] }
};
// entrenadores dentro de cada gimnasio
function gymTrainers(city) {
  const c = CITY[city], lv = c.lv[1] - 1, ty = c.gym;
  const pool = DEX_ORDER.filter(id => SPECIES[id].type === ty && !SPECIES[id].legendary && !SPECIES[id].c1 && !STARTERS2.includes(SPECIES[id].line));
  const r = mulberry32(strSeed('gym:' + city));
  const pick = () => { const sp = pool[Math.floor(r() * pool.length)]; return [evolveForLevel(SPECIES[sp].line || sp, lv), lv]; };
  return [
    { id: 'gymA_' + city, name: 'Aprendiz ' + ['Ane', 'Jon', 'Uxue', 'Mikel', 'Leire', 'Asier', 'Nahia', 'Unax'][CITIES.indexOf(c)], team: [pick(), pick()], prize: lv * 50,
      intro: `¡El líder no tiene tiempo para principiantes!`, win: '¡Vaya! Puede que sí estés preparado.' },
    { id: 'gymB_' + city, name: 'Ayudante ' + ['Gorka', 'Irati', 'Eneko', 'Maialen', 'Ibai', 'Lorea', 'Aitor', 'Haizea'][CITIES.indexOf(c)], team: [pick(), pick(), pick()], prize: lv * 60,
      intro: 'Para llegar al líder tienes que pasar por encima de mí.', win: 'Adelante. El líder te espera arriba.' }
  ];
}

// ---------------- CORACORP ----------------
const CORP = {
  lucia: { name: 'Administradora Lucía', look: LOOKS2.admin, corp: true, boss: true, prize: 3200, team: [['vampiron', 24], ['tinieblin', 24], ['espectron', 26]],
    intro: ['Vaya, vaya. El niño del colegio.', 'Soy Lucía, administradora de CoraCorp. Esta ciénaga está llena de energía del Núcleo, y nos la vamos a llevar.'],
    win: ['Esto no ha terminado. El presidente Coraza sabrá de ti.'] },
  hugo: { name: 'Administrador Hugo', look: Object.assign({}, LOOKS2.admin, { hair: 'spiky', hairColor: '#424242' }), corp: true, boss: true, prize: 4200, team: [['magmoton', 32], ['salamandrax', 32], ['megabyte', 33], ['fenixor', 34]],
    intro: ['¡Alto! Estamos perforando el volcán por orden del presidente.', 'El calor de Ignea alimentará a Mecardio. Y tú no vas a impedirlo.'],
    win: ['¡Mi pase! Se me ha caído... ¡Devuélvemelo!', '...Da igual. En la Torre de Voltia no tendrás ninguna oportunidad.'] },
  ceo1: { name: 'Presidente Coraza', look: LOOKS2.ceo, corp: true, boss: true, prize: 6000, team: [['algoritmon', 37], ['tormentaguila', 37], ['panteoscura', 38], ['gigatron', 39]],
    intro: ['Así que tú eres el alumno que despertó a Cimientor. Te debo un favor.', 'Me llamo Ricardo Coraza. Compré el nombre de los Corazonistas porque vende confianza.', 'Pero lo que de verdad quiero está bajo tierra: el Núcleo. Con Mecardio, Cimientor me obedecerá.'],
    win: ['Impresionante. Pero llegas tarde: Mecardio ya está terminado.', 'Nos veremos en la Cumbre Corazón. Allí Cimientor será mío.'] },
  ceo2: { name: 'Presidente Coraza', look: LOOKS2.ceo, corp: true, boss: true, prize: 9000, team: [['algoritmon', 45], ['panteoscura', 46], ['gigatron', 47], ['tormentaguila', 47], ['mecardio', 50]],
    intro: ['Ocho medallas. Qué tenaz.', 'Mira. Ahí abajo, Cimientor se despierta. Y Mecardio late al mismo ritmo que su corazón.', 'Con él, CoraCorp será dueña de todos los Coremon de Iberión. ¡Apártate!'],
    win: ['¡No... Mecardio...! ¡El corazón mecánico se ha roto!', 'Todo... todo para nada.'] },
  grunt: (id, lv, city, n) => ({ name: 'Recluta de CoraCorp', look: LOOKS2.grunt, corp: true, prize: lv * 45, team: teamFrom(city, lv, n || 2, strSeed(id)),
    intro: ['¡Eh, tú! ¡Esto es propiedad privada de CoraCorp!', '¡La Empresa Corazonista no acepta curiosos!'][strSeed(id) % 2],
    win: ['¡Agh! Me van a despedir...', '¡Esto no quedará así! ¡El presidente se enterará!'][strSeed(id) % 2] })
};

// ---------------- LIGA ----------------
const LIGA = [
  { id: 'elite1', name: 'Alto Mando Argia', look: { skin: '#ffdbac', hair: 'long', hairColor: '#fff59d', shirt: '#fff8e1', pants: '#fff8e1', robe: true }, prize: 7000, team: [['albita', 48], ['potrillux', 48], ['hadaluz', 49], ['resplandin', 49], ['aurorapluma', 50]],
    intro: ['Bienvenido a la Liga Coremon. Soy Argia, la luz que abre el camino.', 'Cuatro del Alto Mando y un campeón. ¿Estás preparado?'], win: ['Tu luz brilla más que la mía. Adelante.'] },
  { id: 'elite2', name: 'Alto Mando Euclides', look: { skin: '#e0ac69', hair: 'bald', hairColor: '#9e9e9e', shirt: '#1a237e', pants: '#1a237e', glasses: true, beard: true, beardColor: '#bdbdbd' }, prize: 7500, team: [['algoritmon', 49], ['jaquemate', 49], ['teseracto', 50], ['tizormax', 50], ['teoremorfo', 51]],
    intro: ['La lógica no falla. Tú, quizá sí.', 'He calculado cuarenta y dos formas de ganarte.'], win: ['Error en mis cálculos. Acepto la derrota.'] },
  { id: 'elite3', name: 'Alto Mando Oihana', look: { skin: '#c68642', hair: 'ponytail', hairColor: '#1a1a1a', shirt: '#c62828', pants: '#fafafa' }, prize: 8000, team: [['boxeon', 50], ['bisontazo', 50], ['frontonix', 51], ['gorilazo', 51], ['campeonix', 52]],
    intro: ['¡Calienta! Aquí se suda.', 'Pelota, balonmano, boxeo... da igual el deporte: yo no pierdo.'], win: ['¡Qué partido! Te has ganado seguir.'] },
  { id: 'elite4', name: 'Alto Mando Mikel', look: { skin: '#f2c49b', hair: 'curly', hairColor: '#b23a3a', shirt: '#ad1457', pants: '#263238' }, prize: 8500, team: [['sinfonix', 51], ['marmolon', 51], ['bibliopolilla', 52], ['loroglot', 52], ['musarte', 53]],
    intro: ['Arte, letras, idiomas... todo lo que aprendiste en el colegio vuelve ahora.', 'A ver si recuerdas tus lecciones.'], win: ['Una obra maestra. El campeón te espera.'] },
  { id: 'champ', name: 'Campeón Unai', look: LOOKS2.rival, prize: 15000, champion: true, team: [['huracanix', 53], ['glaciolobo', 53], ['magmoton', 54], ['gigatron', 54], ['lingualord', 55], ['corazonix', 57]],
    intro: ['Al final has llegado. Te lo dije en el patio del colegio: yo venía de aquí fuera.', 'Me hice campeón mientras tú perseguías a CoraCorp. Ahora, el último combate.', '¡Sin contenerse!'], win: ['...Has ganado. Eres el nuevo campeón de Iberión.', 'Me alegro de que fueras tú.'] }
];

// ---------------- RIVAL ----------------
function rivalTeam(stage) {
  const counter = { chispazo: 'gotin', gotin: 'brotin', brotin: 'chispazo' }[G.starter2] || 'gotin';
  const evo = (id, lv) => evolveForLevel(id, lv);
  if (stage === 1) return [['plumin', 13], [counter, 14]];
  return [[evo('vendavalin', 38), 38], [evo('glaciolobo', 38), 38], [evo('gigatron', 39), 39], [evo('lingualord', 40), 40], [evo(counter, 41), 41]];
}

// ---------------- OBJETIVO ACTUAL ----------------
function nextGymCity() { return CITIES.find(c => c.gym && !G.badges.includes(c.id)); }
function questText() {
  if (!G) return '';
  if (!G.flags.starterGiven) return '📍 Habla con la Dra. Olaia frente al colegio.';
  if (!G.flags.rival1) return '📍 Tu rival te espera a la salida del laboratorio.';
  const c = nextGymCity();
  if (c) {
    if (c.id === 'ria' && !G.flags.riaClear) return '📍 Echa a los reclutas de CoraCorp del Puerto de la Ría.';
    if (c.id === 'umbria' && !G.flags.lucia) return '📍 Detén a la administradora Lucía en la ciénaga de Umbría.';
    if (c.id === 'voltia' && !G.flags.towerDone) return G.bag.pase ? '📍 Entra en la Torre CoraCorp de Voltia y libera a la líder.' : '📍 Consigue el pase de CoraCorp (el administrador de Ignea lo tiene).';
    if (c.id === 'ignea' && !G.flags.hugo) return '📍 Para la perforación de CoraCorp en el volcán de Ignea.';
    return `📍 Ve a ${c.name} y gana la ${c.badge} (${G.badges.length}/8).`;
  }
  if (!G.flags.ceoBeaten) return '📍 ¡Sube a la Cumbre Corazón! CoraCorp va a por Cimientor.';
  if (!G.flags.champion) return '📍 Entra en la Liga Coremon y vence al Alto Mando y al campeón.';
  return '📍 Eres el campeón de Iberión. Busca a los legendarios... y espera el modo online.';
}

// ---------------- PREPARACIÓN DEL MUNDO ----------------
function npcAt(map, o) {
  const n = Object.assign({ dir: 'down', frame: 0, x: o.tx * TS + 16, y: o.ty * TS + 26 }, o);
  n.look = n.look || randomLook(strSeed(n.id));
  n.home = [n.x, n.y];
  map.npcs.push(n);
  return n;
}
// casilla libre más cercana (sin paredes ni objetos)
function freeSpot(map, tx, ty) {
  for (let r = 0; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = tx + dx, y = ty + dy;
    if (!blockedAt(map, x * TS + 16, y * TS + 26)) return [x, y];
  }
  return [tx, ty];
}
function refreshNpcs() {
  if (!MAP) return;
  for (const n of MAP.npcs) n.hidden = n.cond ? !n.cond() : false;
}

const TOWNSFOLK = {
  gasteiz: ['¿Has visto el colegio? Dicen que anoche tembló entero y que algo enorme salió por un túnel.', 'Gasteiz es la ciudad más verde de Iberión. Hasta los Coremon vienen a pasear.', 'Mi abuela estudió en Corazonistas. Dice que ahí dentro ya había Coremon antes de que se supiera.', 'CoraCorp ha comprado medio Iberión. Dicen que el presidente usa el nombre del colegio para parecer de fiar.'],
  ria: ['El puerto huele a sardinas y a salitre. ¡Me encanta!', 'Los de CoraCorp han amarrado un barco negro en el muelle. No dejan pescar a nadie.', 'Si sigues la costa verás gaviotas por todas partes. Algunas son Gaviotín.'],
  umbria: ['En Umbría la niebla nunca se va del todo.', 'Mi abuela dice que las sorginak (las brujas) protegían esta ciénaga. Ahora la protege Maite.', 'Por la noche se ven luces moradas en el agua. Mejor no acercarse.'],
  almar: ['Bajo estas dunas hay ruinas más antiguas que cualquier ciudad.', 'CoraCorp trajo excavadoras. Lo están rompiendo todo.', 'Si te pica un Grieto, no te preocupes: no es venenoso. Creo.'],
  ignea: ['El volcán lleva cien años dormido. Desde que llegó CoraCorp, ruge cada noche.', 'Aquí todo el mundo es herrero, cocinero o bombero. O las tres cosas.', 'La txistorra de Ignea es la mejor del mundo. La asan en la lava.'],
  voltia: ['Voltia es la ciudad del futuro: tranvías, robots y luces por todas partes.', 'La Torre CoraCorp es el edificio más alto de Iberión. Nadie sabe qué hay en la última planta.', 'La líder Zuriñe desapareció hace días. El gimnasio está cerrado.'],
  bosque: ['El Bosque Olvido recuerda a todos los que lo cruzan.', 'Hay un árbol tan viejo que dicen que tiene raíces en todo el continente.', 'Si silbas, los Plumín te contestan.'],
  nevera: ['¡Brrr! ¿Vienes sin abrigo? Valiente.', 'En lo alto de los montes vive Glaciara. Dicen que su aliento congela el tiempo.', 'Desde aquí se ve la Cumbre Corazón. Últimamente brilla de color rojo.'],
  liga: ['Solo los entrenadores con ocho medallas llegan aquí.', 'La Liga Coremon se fundó hace muchos años. El campeón actual es muy joven.', 'En la cumbre hay un santuario. Dicen que al amanecer aparece Albor.']
};
const ROUTE_CLASSES = {
  meadow: ['Excursionista', 'Chica del campo', 'Pelotari'], coast: ['Pescador', 'Nadadora', 'Marinero'], swamp: ['Bruja', 'Explorador', 'Botánica'],
  desert: ['Arqueólogo', 'Motorista', 'Exploradora'], volcano: ['Bombero', 'Herrera', 'Cocinero'], plains: ['Científica', 'Ciclista', 'Informático'],
  forest: ['Ornitóloga', 'Campista', 'Guardabosques'], snow: ['Esquiadora', 'Montañero', 'Alpinista'], peak: ['Veterano', 'Entrenadora experta', 'Monje']
};
const NAMES = ['Ane', 'Jon', 'Uxue', 'Mikel', 'Leire', 'Asier', 'Nahia', 'Unax', 'Lucía', 'Pablo', 'Irati', 'Hugo', 'Maialen', 'Aitor', 'Sara', 'Iván', 'Nerea', 'Oier', 'Laia', 'Marcos', 'Ainhoa', 'Xabi', 'Paula', 'Eneko'];
const ROUTE_LINES = [
  ['¡Nuestras miradas se han cruzado! ¡Eso significa combate!', '¡Bah! Me has ganado bien.'],
  ['¡He entrenado toda la mañana para esto!', 'Tendré que entrenar también la tarde...'],
  ['¿Un alumno de Corazonistas? ¡A ver qué te enseñaron!', 'Te enseñaron bien, sí.'],
  ['¡Mi equipo es el más fuerte de esta ruta!', 'Bueno... el segundo más fuerte.'],
  ['¡Alto ahí! Nadie pasa sin luchar.', 'Vale, vale. Pasa.']
];

function setupStory(world) {
  world.onEnter = refreshNpcs;
  // --- vecinos de cada ciudad ---
  CITIES.forEach((c, ci) => {
    const lines = TOWNSFOLK[c.id];
    lines.forEach((l, i) => {
      const [x, y] = freeSpot(world, c.x - 8 + ((i * 7) % 16), c.y - 3 + ((i * 5) % 7));
      npcAt(world, { id: 'tf_' + c.id + i, tx: x, ty: y, kind: 'talk', lines: [l], wander: true });
    });
  });
  // --- entrenadores en los caminos ---
  world.roads.forEach((rd, ri) => {
    const p = rd.path, toCity = CITY[rd.b];
    let side = 1;
    for (let k = 14; k < p.length - 14; k += 16) {
      const [x, y] = p[k];
      if (inCity(world, x * TS, y * TS)) continue;
      if (world.gates.some(g => Math.abs(g.x - x) + Math.abs(g.y - y) < 8)) continue;
      const [x0, y0] = p[k - 2], [x1, y1] = p[k + 2];
      const dx = x1 - x0, dy = y1 - y0, horiz = Math.abs(dx) > Math.abs(dy);
      const ox = horiz ? 0 : side * 3, oy = horiz ? side * 3 : 0;
      const [tx, ty] = freeSpot(world, x + ox, y + oy);
      const id = `rt_${ri}_${k}`, reg = CITIES[world.regionIdx(tx, ty)];
      const r = mulberry32(strSeed(id));
      const cls = ROUTE_CLASSES[reg.biome][Math.floor(r() * 3)], nm = NAMES[Math.floor(r() * NAMES.length)];
      const lines = ROUTE_LINES[Math.floor(r() * ROUTE_LINES.length)];
      const lv = Math.max(reg.lv[0], toCity.lv[0] - 2) + Math.floor(r() * 3);
      const dir = horiz ? (side > 0 ? 'up' : 'down') : (side > 0 ? 'left' : 'right');
      npcAt(world, { id, tx, ty, dir, sight: 4, trainer: { name: `${cls} ${nm}`, team: teamFrom(reg.id, lv, 1 + Math.floor(r() * 3), strSeed(id)), prize: lv * 40, intro: lines[0], win: lines[1] } });
      side = -side;
    }
  });
  // --- objetos por el mundo ---
  const loot = ['cromo', 'cromo', 'menu', 'zumo', 'cromoOro', 'tirita', 'caramelo', 'antidoto', 'repelente', 'banquete', 'cromoPlatino', 'elixir'];
  CITIES.forEach((c, ci) => {
    const r = mulberry32(strSeed('loot:' + c.id));
    let placed = 0, tries = 0;
    while (placed < 12 && tries++ < 600) {
      const x = Math.floor(c.x + (r() - 0.5) * 70 * WS), y = Math.floor(c.y + (r() - 0.5) * 60 * WS);
      if (world.regionIdx(x, y) !== ci || inCity(world, x * TS, y * TS)) continue;
      const t = world.tileAt(x, y);
      if (t === undefined || SOLID_T.has(t) || blockedAt(world, x * TS + 16, y * TS + 26)) continue;
      const item = loot[Math.floor(r() * Math.min(loot.length, 6 + ci))];
      world.items.push({ id: `it_${c.id}_${placed}`, x: x * TS + 16, y: y * TS + 26, item, qty: item === 'cromo' ? 3 : 1 });
      placed++;
    }
  });
  // --- inicio: Dra. Olaia frente al colegio ---
  const g = CITY.gasteiz;
  const school = world.buildings.find(b => b.kind === 'school');
  const sx = school.tx + 6, sy = school.ty + school.h + 2;
  world.startPos = { x: sx * TS + 16, y: (sy) * TS + 20 };
  npcAt(world, { id: 'olaia', tx: sx + 2, ty: sy + 1, look: LOOKS2.olaia, custom: 'olaia', dir: 'left', script: olaiaScript, cond: () => !G.flags.starterGiven, marker: true });
  npcAt(world, { id: 'unai1', tx: sx - 3, ty: sy + 4, look: LOOKS2.rival, custom: 'unai', dir: 'right', script: rival1Script, cond: () => G.flags.starterGiven && !G.flags.rival1, marker: true });
  // --- segundo combate con Unai: a la salida de Voltia hacia el Bosque (6 medallas) ---
  { const rd = world.roads.find(r => r.a === 'voltia' && r.b === 'bosque') || world.roads.find(r => r.b === 'bosque');
    const p = rd.path[Math.min(rd.path.length - 1, 28)], [x, y] = freeSpot(world, p[0], p[1]);
    npcAt(world, { id: 'unai2', tx: x, ty: y, look: LOOKS2.rival, custom: 'unai', dir: 'down', sight: 5, ambush: true, script: rival2Script, cond: () => G.badges.length >= 6 && !G.flags.rival2, marker: true }); }
  // --- CoraCorp por las ciudades ---
  const ria = CITY.ria;
  [[-1, 0], [1, 0]].forEach(([d], i) => {
    const [x, y] = freeSpot(world, ria.x + 4 + i * 2, ria.y - 5);
    npcAt(world, { id: 'riaGrunt' + i, tx: x, ty: y, look: LOOKS2.grunt, custom: 'recluta', dir: 'down', trainer: Object.assign(CORP.grunt('riaGrunt' + i, 19, 'ria', 2), { onWin: async () => { if (G.beaten.riaGrunt0 && G.beaten.riaGrunt1) { G.flags.riaClear = true; await say(['Los reclutas huyen hacia su barco negro, que zarpa a toda prisa.', 'El gimnasio del Puerto de la Ría vuelve a estar abierto.']); } } }), cond: () => !G.beaten['riaGrunt' + i] });
  });
  const um = CITY.umbria; { const [x, y] = freeSpot(world, um.x + 8, um.y - 6); npcAt(world, { id: 'lucia', tx: x, ty: y, look: LOOKS2.admin, custom: 'lucia', dir: 'down', trainer: Object.assign({}, CORP.lucia, { onWin: async () => { G.flags.lucia = true; } }), cond: () => !G.flags.lucia, marker: true }); }
  const ig = CITY.ignea; { const [x, y] = freeSpot(world, ig.x + 8, ig.y - 7); npcAt(world, { id: 'hugo', tx: x, ty: y, look: CORP.hugo.look, custom: 'hugo', dir: 'down', trainer: Object.assign({}, CORP.hugo, { onWin: async () => { G.flags.hugo = true; G.bag.pase = 1; sfx('item'); await say('¡Has conseguido el Pase de CoraCorp! Con él podrás entrar en la Torre de Voltia.'); } }), cond: () => !G.flags.hugo, marker: true }); }
  CITIES.forEach(c => {
    if (['ria', 'umbria', 'ignea'].includes(c.id)) return;
    const [x, y] = freeSpot(world, c.x - 10, c.y + 6);
    npcAt(world, { id: 'grunt_' + c.id, tx: x, ty: y, look: LOOKS2.grunt, custom: 'recluta', dir: 'right', sight: 3, trainer: CORP.grunt('grunt_' + c.id, c.lv[0] + 1, c.id, 2), cond: () => !G.flags.ceoBeaten });
  });
  // --- Cumbre Corazón: el presidente y Cimientor ---
  const lg = CITY.liga, ligaB = world.buildings.find(b => b.kind === 'liga');
  { const [x, y] = freeSpot(world, ligaB.tx + 5, ligaB.ty + ligaB.h + 3); npcAt(world, { id: 'ceo2', tx: x, ty: y, look: LOOKS2.ceo, custom: 'coraza', dir: 'down', script: summitScript, cond: () => !G.flags.ceoBeaten, marker: true }); }
  // --- santuarios de los legendarios (tras ser campeón) ---
  const shrines = [['tormentix', 'voltia', 22, -14], ['glaciara', 'nevera', 14, -14], ['ignisaurio', 'ignea', -16, 14], ['oceanox', 'ria', -12, 12], ['silvador', 'bosque', -16, -14], ['eclipsor', 'umbria', -16, 12], ['albor', 'liga', 16, -10], ['cimientor', 'liga', -14, -10], ['mecardio', 'voltia', -22, 12]];
  shrines.forEach(([id, city, dx, dy]) => {
    const c = CITY[city], [x, y] = freeSpot(world, c.x + Math.round(dx * WS), c.y + Math.round(dy * WS));
    world.addObj({ type: 'statue', x: x * TS + 16, y: y * TS + 28, action: 'legend', legend: id, text: null });
  });
}

// ---------------- INTERIORES ----------------
function populateInterior(b, m) {
  m.onEnter = refreshNpcs;
  const city = CITY[b.city];
  const N = o => npcAt(m, o);
  switch (b.kind) {
    case 'center':
      N({ id: 'nurse_' + b.city, tx: 7, ty: 3, look: LOOKS2.nurse, custom: 'enfermera', kind: 'nurse', counter: true });
      N({ id: 'cfan_' + b.city, tx: 11, ty: 8, kind: 'talk', wander: true, lines: ['Los PC del Centro Coremon guardan los Coremon que no caben en tu equipo.', 'Si pierdes un combate, vuelves al último Centro Coremon donde te curaron.'] });
      break;
    case 'shop':
      N({ id: 'clerk_' + b.city, tx: 6, ty: 3, look: LOOKS2.clerk, custom: 'dependiente', kind: 'shop', counter: true, lines: ['¡Bienvenido! Tenemos de todo para tu aventura.'] });
      break;
    case 'house': {
      const r = mulberry32(strSeed(b.id));
      const lore = HOUSE_LINES[b.city] || [];
      const line = lore[Math.floor(r() * lore.length)] || ['Hola. ¿Quieres un vaso de agua?'];
      N({ id: 'h_' + b.id, tx: 6, ty: 4, kind: 'talk', lines: line, wander: true });
      const gift = HOUSE_GIFTS[b.id];
      if (gift) N({ id: 'gift_' + b.id, tx: 3, ty: 5, script: giftScript(gift), marker: true, cond: () => !G.flags['gift_' + b.id] });
      break;
    }
    case 'lab':
      N({ id: 'olaia_lab', tx: 6, ty: 4, look: LOOKS2.olaia, custom: 'olaia', script: olaiaLabScript });
      break;
    case 'school':
      N({ id: 'conserje2', tx: 4, ty: 5, look: { skin: '#f2c49b', hair: 'bald', hairColor: '#8d8d8d', shirt: '#6d4c41', pants: '#3e2723', beard: true, beardColor: '#9e9e9e' }, kind: 'talk',
        lines: ['Conserje: ¡Hombre, el antiguo alumno! Desde que se abrió la trampilla esto no para de temblar.', 'Conserje: La estatua del vestíbulo lleva al colegio de siempre. Si quieres volver a clase, ya sabes.'] });
      break;
    case 'gym': {
      const L = GYMS[b.city];
      N({ id: 'leader_' + b.city, tx: 8, ty: 3, look: L.look, custom: 'lider_' + b.city, dir: 'down', script: gymLeaderScript(b.city) });
      gymTrainers(b.city).forEach((t, i) => N({ id: t.id, tx: i ? 6 : 11, ty: i ? 8 : 12, dir: i ? 'right' : 'left', sight: 5, trainer: t }));
      N({ id: 'guide_' + b.city, tx: 10, ty: 16, kind: 'talk', lines: [`¡Hola, aspirante! Este es un gimnasio de tipo ${TYPE_LABEL[city.gym]}.`, `Los ataques de tipo ${TYPE_LABEL[Object.keys(TYPE_BEATS).find(t => TYPE_BEATS[t].includes(city.gym)) || 'fuego']} le hacen mucho daño. ¡Suerte!`] });
      break;
    }
    case 'corp': {
      const gl = [[5, 14, 'right'], [13, 11, 'left'], [5, 8, 'right'], [13, 5, 'left']];
      gl.forEach(([x, y, d], i) => N({ id: 'tower' + i, tx: x, ty: y, look: LOOKS2.grunt, custom: 'recluta', dir: d, sight: 4, trainer: CORP.grunt('tower' + i, 34 + i, 'voltia', 3) }));
      N({ id: 'ceo1', tx: 9, ty: 3, look: LOOKS2.ceo, custom: 'coraza', dir: 'down', script: towerCeoScript, cond: () => !G.flags.towerDone });
      N({ id: 'zurine_tower', tx: 16, ty: 3, look: GYMS.voltia.look, custom: 'lider_voltia', kind: 'talk', lines: ['Zuriñe: ¡Gracias por sacarme de aquí! Te espero en mi gimnasio.'], cond: () => G.flags.towerDone });
      break;
    }
    case 'liga':
      LIGA.forEach((L, i) => N({ id: L.id, tx: 7, ty: 25 - i * 5, look: L.look, custom: L.champion ? 'unai' : 'liga' + (i + 1), dir: 'down', script: ligaScript(i) }));
      break;
  }
}
const HOUSE_LINES = {
  gasteiz: [['Mi hijo estudia en Corazonistas. Anoche volvió diciendo que había un monstruo de piedra en el gimnasio.'], ['¿Sabías que en Gasteiz hay más zonas verdes por persona que en casi cualquier ciudad? Por eso hay tantos Coremon de Naturaleza.']],
  ria: [['Mi padre era pescador. CoraCorp le quitó su barca para "investigar el mar".'], ['Desde la ventana se ve el faro. Dicen que Oceanox duerme debajo.']],
  umbria: [['Si oyes cantar en la niebla, no sigas la voz.'], ['Mi abuela era curandera. Me enseñó que el veneno y la medicina son la misma planta.']],
  almar: [['Encontré un fósil con forma de caracol. Lo guardé en un cajón y ahora el cajón se mueve.'], ['Aquí solo llueve dos días al año. Este año aún no ha llovido ninguno.']],
  ignea: [['Las paredes de esta casa están calientes. Es por el volcán. En invierno es una ventaja.'], ['Mi hermano trabaja para CoraCorp. Dice que están construyendo un "corazón de metal".']],
  voltia: [['Trabajo en la Torre CoraCorp, pero no puedo hablar de ello. Bueno... digamos que no me gusta lo que hacen.'], ['El tranvía de Voltia es tan rápido que hasta los Tranvín intentan adelantarlo.']],
  bosque: [['El Bosque Olvido se llama así porque quien entra sin rumbo se olvida de salir.'], ['Los pájaros callan cuando pasa Tormentix.']],
  nevera: [['Toma un chocolate caliente. ...Ah, que no puedo dártelo por la pantalla.'], ['Mi abuelo vio a Glaciara una vez. Dice que el tiempo se paró un minuto entero.']],
  liga: [['Aquí descansan los entrenadores antes de la Liga.']]
};
const HOUSE_GIFTS = {
  'ria:house:-14,3': { items: { cromoOro: 3 }, text: ['Pescadora: ¡Has echado a CoraCorp de nuestro puerto! Toma, cromos dorados de mi colección.'] },
  'umbria:house:-14,3': { items: { antidoto: 3, banquete: 1 }, text: ['Curandera: Para el veneno de la ciénaga. Y un banquete, que estás en los huesos.'] },
  'almar:house:-14,3': { mon: ['fosilin', 25], text: ['Arqueólogo: ¡Este fósil se ha despertado! Necesita un entrenador. ¿Te lo quedas?'] },
  'ignea:house:-14,3': { items: { elixir: 2 }, text: ['Bombera: Para que tus Coremon no se queden sin fuerzas.'] },
  'voltia:house:-14,3': { items: { cromoPlatino: 3 }, text: ['Informático: Me los llevé de la torre cuando me despidieron. Úsalos bien.'] },
  'bosque:house:-14,3': { mon: ['hadilla', 39], text: ['Anciana: Esta Hadilla siempre viene a mi ventana. Creo que quiere irse contigo.'] },
  'nevera:house:-14,3': { items: { caramelo: 3 }, text: ['Montañero: Caramelos raros para la última subida.'] }
};
function giftScript(gift) {
  return async n => {
    await say(gift.text);
    if (gift.items) Object.entries(gift.items).forEach(([k, q]) => { G.bag[k] = (G.bag[k] || 0) + q; });
    if (gift.mon) giveMon(gift.mon[0], gift.mon[1]);
    sfx('item');
    await say(gift.items ? '¡Has recibido: ' + Object.entries(gift.items).map(([k, q]) => q + ' × ' + ITEMS[k].name).join(', ') + '!' : `¡Has recibido a ${SPECIES[gift.mon[0]].name}!`);
    G.flags['gift_' + MAP.building.id] = true;
    refreshNpcs();
  };
}
function giveMon(id, lv) {
  const m = makeMon(id, lv);
  G.seen[id] = true; G.caught[id] = true;
  if (G.team.length < 6) G.team.push(m); else G.box.push(m);
  return m;
}

// ---------------- ESCENAS ----------------
async function olaiaScript(n) {
  if (G.flags.starterGiven) return;
  await say([
    'Dra. Olaia: ¡Eh! ¡Tú! ¿Acabas de salir por el túnel del gimnasio?',
    'Dra. Olaia: Entonces lo has visto... Cimientor. El gigante que dormía bajo el colegio se ha despertado y ha salido al mundo.',
    'Dra. Olaia: Me llamo Olaia. Trabajaba para CoraCorp, la "Empresa Corazonista"... hasta que descubrí lo que planean.',
    'Dra. Olaia: Los Coremon nacen cuando alguien aprende algo de verdad. Y bajo Iberión hay una fuente enorme de esa energía: el Núcleo.',
    'Dra. Olaia: Cimientor lo protegía. Ahora que ha despertado, CoraCorp irá a por él.',
    G.team.length ? `Dra. Olaia: Veo que traes a tu equipo del colegio. ${monName(G.team[0])} parece fuerte.` : 'Dra. Olaia: ¿No tienes Coremon? Eso hay que arreglarlo.',
    'Dra. Olaia: Pero aquí fuera hay tipos que no viste en clase: fuego, agua, eléctrico, hielo... Toma, elige un compañero del mundo.'
  ]);
  const i = await ask('¿Qué Coremon eliges?', ['🔥 Chispazo', '💧 Gotín', '🌿 Brotín']);
  const sp = STARTERS2[i];
  G.starter2 = sp;
  giveMon(sp, G.team.length ? 14 : 13);
  sfx('levelup');
  G.bag.cromo = (G.bag.cromo || 0) + 10; G.bag.menu = (G.bag.menu || 0) + 3; G.bag.mapa = 1;
  await say([`¡${SPECIES[sp].name} se une a tu equipo!`, 'Dra. Olaia: Toma también 10 cromos, 3 menús y un mapa de Iberión.',
    'Dra. Olaia: Para pararles los pies a CoraCorp necesitarás las ocho medallas de Iberión. La primera está aquí, en el gimnasio de Gasteiz.',
    'Dra. Olaia: Mi laboratorio está al este de la plaza. ¡Pásate cuando quieras!']);
  G.flags.starterGiven = true;
  n.walkTo = [n.x + 140, n.y]; n.speed = 90;
  refreshNpcs();
  saveGame(true);
}
async function rival1Script(n) {
  await say(['???: ¡Eh, tú! Te acuerdas de mí, ¿verdad? Del patio del colegio.', 'Unai: Soy Unai. Te dije que venía de fuera del colegio... ¿a que no te lo creías?', 'Unai: Yo también voy a por las ocho medallas. Veamos quién llega antes a la Liga.']);
  const res = await startBattle({ kind: 'trainer', trainer: { name: 'Rival Unai', look: LOOKS2.rival, custom: 'unai', team: rivalTeam(1), prize: 1200 } });
  if (res === 'win') await say(['Unai: ...Vale. Eres bueno. Pero esto acaba de empezar.', 'Unai: ¡Nos vemos en la Liga!']);
  else await say(['Unai: ¡Ja! Entrena un poco más. ¡Nos vemos en la Liga!']);
  G.flags.rival1 = true;
  refreshNpcs();
  saveGame(true);
}
async function rival2Script(n) {
  if (!G.team.some(m => m.hp > 0)) { await say('Unai: Tus Coremon están agotados. Cúralos y luego hablamos.'); return; }
  await say(['Unai: ¡Por fin te encuentro! Me han contado que has entrado en la Torre CoraCorp tú solo.', 'Unai: Yo llevo seis medallas también. Y mi equipo ha crecido mucho desde el colegio.', 'Unai: Antes de la Cumbre, quiero saber quién de los dos es más fuerte. ¡Ahora!']);
  const res = await startBattle({ kind: 'trainer', trainer: { name: 'Rival Unai', look: LOOKS2.rival, custom: 'unai', team: rivalTeam(2), prize: 5000, boss: true } });
  if (res !== 'win') { await say('Unai: ¡Ja! Todavía no estás listo para la Cumbre. Vuelve cuando quieras la revancha.'); return; }
  await say(['Unai: ...Otra vez. No sé cómo lo haces.', 'Unai: Me voy a la Liga a esperar. Yo llegaré primero a campeón... y tú tendrás que ganarme allí.', 'Unai: Toma, lo vas a necesitar más que yo.']);
  G.bag.botiquin = (G.bag.botiquin || 0) + 3; sfx('item');
  await say('¡Has recibido 3 × Botiquín!');
  G.flags.rival2 = true;
  n.walkTo = [n.x, n.y - 200]; n.speed = 120;
  saveGame(true);
}
async function olaiaLabScript(n) {
  if (G.badges.length >= 4 && !G.flags.olaiaMaster) {
    await say(['Dra. Olaia: ¡Cuatro medallas! He estado investigando lo que me contaste de CoraCorp.', 'Dra. Olaia: Les robé esto antes de irme: un Cromo maestro. Captura cualquier Coremon sin fallar.', 'Dra. Olaia: Guárdalo para un legendario. Créeme.']);
    G.bag.cromoMaestro = (G.bag.cromoMaestro || 0) + 1; G.flags.olaiaMaster = true; sfx('item');
    await say('¡Has recibido un Cromo maestro! 👑');
    return;
  }
  if (G.badges.length >= 1 && !G.bag.bici) {
    await say(['Dra. Olaia: ¡Tu primera medalla! Te mereces esto.', 'Dra. Olaia: Es la bici que usaba para huir de las reuniones de CoraCorp. Úsala desde la mochila.']);
    G.bag.bici = 1; sfx('item');
    await say('¡Has recibido la Bicicleta! 🚲');
    return;
  }
  healTeamAll();
  await say(['Dra. Olaia: He curado a tu equipo. ¿Qué tal va la aventura?', `Dra. Olaia: Llevas ${G.badges.length} medalla${G.badges.length === 1 ? '' : 's'} y has capturado ${DEX_ORDER.filter(i => G.caught[i]).length} Coremon distintos. ¡Sigue así!`]);
}
function healTeamAll() { G.team.forEach(healMon); sfx('heal'); }

function gymLeaderScript(city) {
  return async n => {
    const L = GYMS[city];
    if (G.badges.includes(city)) { await say(`${L.title}: Ya tienes la ${CITY[city].badge}. ¡Sigue adelante!`); return; }
    if (!G.team.some(m => m.hp > 0)) { await say(`${L.title}: Cura a tu equipo antes de retarme.`); return; }
    await say(L.intro.map(l => `${L.title}: ${l}`));
    const res = await startBattle({ kind: 'trainer', trainer: { name: L.title, look: L.look, custom: 'lider_' + city, team: L.team, prize: L.prize, boss: true } });
    if (res !== 'win') return;
    G.badges.push(city);
    sfx('badge');
    await badgeCinematic(CITY[city]);
    await say(L.win.map(l => `${L.title}: ${l}`));
    saveGame(true);
  };
}
async function badgeCinematic(c) {
  const ov = $('fade'); ov.classList.add('on'); await wait(300);
  toast(`🏅 ¡Has conseguido la ${c.badge}! (${G.badges.length}/8)`, 3500);
  ov.classList.remove('on'); await wait(300);
}

async function towerCeoScript(n) {
  await say(CORP.ceo1.intro.map(l => `Presidente Coraza: ${l}`));
  const res = await startBattle({ kind: 'trainer', trainer: Object.assign({}, CORP.ceo1, { custom: 'coraza' }) });
  if (res !== 'win') return;
  await say(CORP.ceo1.win.map(l => `Presidente Coraza: ${l}`));
  await say('El presidente sale corriendo hacia el ascensor. En la sala de al lado, alguien golpea la puerta: ¡es la líder Zuriñe!');
  G.flags.towerDone = true;
  refreshNpcs();
  saveGame(true);
}

async function summitScript(n) {
  if (G.badges.length < 8) { await say('Presidente Coraza: Vuelve cuando tengas las ocho medallas. Si es que llegas.'); return; }
  await say(CORP.ceo2.intro.map(l => `Presidente Coraza: ${l}`));
  const res = await startBattle({ kind: 'trainer', trainer: Object.assign({}, CORP.ceo2, { custom: 'coraza' }), noRun: true });
  if (res !== 'win') return;
  await say(CORP.ceo2.win.map(l => `Presidente Coraza: ${l}`));
  G.flags.ceoBeaten = true;
  await say(['¡La montaña tiembla! Del suelo, en mitad de la Cumbre Corazón, emerge una figura gigantesca de piedra.', 'Es Cimientor. Te mira... y parece reconocerte. Fuiste tú quien lo despertó.']);
  const r2 = await startBattle({ kind: 'wild', mon: { species: 'cimientor', level: 53, legendary: true }, noRun: true, music: 'boss' });
  if (r2 === 'capture') await say(['¡Cimientor se ha unido a tu equipo!', 'Sin él, CoraCorp ya no podrá llegar nunca al Núcleo. El presidente Coraza se entrega a la policía de Iberión.']);
  else await say(['Cimientor se hunde lentamente en la tierra... pero esta vez no está furioso. Vuelve a proteger el Núcleo.', 'Quizá vuelva a aparecer en su santuario de la cumbre. El presidente Coraza se entrega a la policía de Iberión.']);
  await say(['Dra. Olaia (por teléfono): ¡Lo has conseguido! CoraCorp ha caído. Ahora... la Liga Coremon te espera.']);
  refreshNpcs();
  saveGame(true);
}

function ligaScript(i) {
  return async n => {
    const L = LIGA[i];
    if (G.beaten[L.id]) { await say(`${L.name}: ${[].concat(L.win)[0]}`); return; }
    if (i > 0 && !G.beaten[LIGA[i - 1].id]) { await say(`${L.name}: Primero vence a quien está antes que yo.`); return; }
    if (!G.flags.ceoBeaten) { await say(`${L.name}: La Liga está cerrada mientras CoraCorp amenace la Cumbre.`); return; }
    await say(L.intro.map(l => `${L.name}: ${l}`));
    const res = await startBattle({ kind: 'trainer', trainer: { name: L.name, look: L.look, custom: L.champion ? 'unai' : 'liga' + (i + 1), team: L.team, prize: L.prize, boss: true }, noRun: true });
    if (res !== 'win') return;
    G.beaten[L.id] = true;
    await say([].concat(L.win).map(l => `${L.name}: ${l}`));
    if (L.champion) await championEnding();
    else { n.walkTo = [n.x + 64, n.y]; n.speed = 90; }
    saveGame(true);
  };
}
async function championEnding() {
  G.flags.champion = true;
  music('victory');
  await say(['¡¡Eres el nuevo campeón de la Liga Coremon de Iberión!!', 'Del colegio Corazonistas de Vitoria a lo más alto del mundo.',
    'Ahora los legendarios de Iberión se dejarán ver en sus santuarios: Tormentix, Glaciara, Ignisaurio, Oceanox, Silvador, Eclipsor, Albor... y Mecardio.',
    'Y muy pronto llegará el modo online: combates e intercambios con otros entrenadores.', 'COREMON — un juego de acorik. ¡Gracias por jugar!']);
}

// ---------------- ACCIONES DE OBJETOS ----------------
const ACTIONS = {
  pc: () => openBox(),
  school_door: async () => {
    const i = await ask('La estatua del vestíbulo... Por aquí se vuelve al colegio de siempre. ¿Volver?', ['Sí, volver al colegio', 'No']);
    if (i === 0) { saveGame(true); location.href = '../coremon1/index.html'; }
  },
  legend: async o => {
    const id = o.legend, sp = SPECIES[id];
    if (G.caught[id] || G.flags['legend_' + id]) { await say(`Un santuario antiguo. ${sp.name} ya no está aquí.`); return; }
    const special = id === 'cimientor' ? G.flags.ceoBeaten : G.flags.champion;
    if (!special) { await say(['Un santuario de piedra muy antiguo. Hay una inscripción:', `«${sp.lore}»`]); return; }
    if (id === 'eclipsor' && !isNight()) { await say('El santuario está en silencio. Dicen que solo despierta de noche.'); return; }
    if (id === 'albor' && !(G.time % 1440 >= 300 && G.time % 1440 < 540)) { await say('El santuario está en calma. Dicen que Albor aparece al amanecer.'); return; }
    await say([`Un santuario de piedra. La inscripción dice: «${sp.lore}»`, `¡${sp.name} aparece!`]);
    const r = await startBattle({ kind: 'wild', mon: { species: id, level: 55, legendary: true } });
    if (r === 'capture' || r === 'win') G.flags['legend_' + id] = r === 'capture';
  }
};

// ---------------- ENTRADAS BLOQUEADAS ----------------
function canEnterBuilding(b) {
  if (b.kind === 'gym' && b.city === 'ria' && !G.flags.riaClear) return 'La puerta del gimnasio está bloqueada. Dos reclutas de CoraCorp vigilan el muelle.';
  if (b.kind === 'gym' && b.city === 'umbria' && !G.flags.lucia) return 'Un cartel en la puerta: «CERRADO POR ORDEN DE CORACORP». La administradora Lucía anda por la plaza.';
  if (b.kind === 'gym' && b.city === 'voltia' && !G.flags.towerDone) return 'El gimnasio está cerrado. Una nota dice: «La líder Zuriñe ha desaparecido. Vista por última vez: Torre CoraCorp».';
  if (b.kind === 'corp' && !G.bag.pase && !G.flags.towerDone) return 'La puerta de la Torre CoraCorp tiene un lector de tarjetas. Necesitas un pase.';
  if (b.kind === 'liga' && !G.flags.ceoBeaten) return 'La Liga Coremon está cerrada. Delante de la puerta hay alguien de CoraCorp...';
  return null;
}
function visitCity(c) {
  if (!G.flags['visit_' + c.id]) { G.flags['visit_' + c.id] = true; toast(`Has llegado a ${c.name}. ${cityMotto(c.id)}`, 3200); }
}
function onMapEntered(id) {}

// ---------------- NUEVA PARTIDA / CONTINUAR ----------------
async function startNewGame() {
  hideTitle();
  G = newGame();
  const c1 = readC1Save();
  if (c1) importFromC1(G, c1);
  if (!G.bag.cromo) G.bag.cromo = 5;
  STATE = 'WORLD';
  setMap('world', WORLD.startPos.x, WORLD.startPos.y, 'down');
  showWorldUI(true);
  setWorldControls();
  busy = true;
  await fadeOut();
  await say(c1 ? ['Bajas por la trampilla del gimnasio. Un túnel larguísimo atraviesa la tierra...', 'Al final, una luz. Y de repente...'] : ['Una mañana cualquiera en Gasteiz. Pero el suelo no deja de temblar...']);
  await fadeIn();
  busy = false;
  await say(['¡Estás fuera del colegio! Delante tienes Gasteiz... y el mundo de Iberión entero.', c1 ? `Tu equipo del colegio viene contigo: ${G.team.map(monName).join(', ')}.` : '', 'Alguien corre hacia ti...']);
  refreshNpcs();
  dailyGift();
  saveGame(true);
}
function continueGame() {
  const g = loadGame();
  if (!g) { startNewGame(); return; }
  G = g;
  hideTitle();
  STATE = 'WORLD';
  try { setMap(G.map, G.x, G.y, G.facing || 'down'); }
  catch (e) { setMap('world', WORLD.startPos.x, WORLD.startPos.y, 'down'); }
  if (blockedAt(MAP, player.x, player.y)) { const sp = MAP === WORLD ? WORLD.startPos : MAP.spawn; player.x = sp.x; player.y = sp.y; }
  showWorldUI(true);
  setWorldControls();
  refreshNpcs();
  setTimeout(dailyGift, 1800);
}
