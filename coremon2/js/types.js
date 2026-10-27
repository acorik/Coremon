// ============================================================
// COREMON 2 — Tipos, tabla de eficacia, movimientos, estados y objetos.
// Los 6 tipos del colegio (Coremon 1) + 8 tipos nuevos del mundo.
// ============================================================

const TYPES = ['logica', 'letras', 'arte', 'idioma', 'naturaleza', 'fisico',
  'agua', 'fuego', 'electrico', 'hielo', 'roca', 'aire', 'sombra', 'luz'];

const TYPE_LABEL = {
  logica: 'Lógica', letras: 'Letras', arte: 'Arte', idioma: 'Idioma', naturaleza: 'Naturaleza', fisico: 'Físico',
  agua: 'Agua', fuego: 'Fuego', electrico: 'Eléctrico', hielo: 'Hielo', roca: 'Roca', aire: 'Aire', sombra: 'Sombra', luz: 'Luz'
};
const TYPE_COLOR = {
  logica: '#4f6df5', letras: '#b05fe0', arte: '#e05f9c', idioma: '#e0a93f', naturaleza: '#4fb259', fisico: '#e05f4f',
  agua: '#2f8fe0', fuego: '#f26a1b', electrico: '#f2c418', hielo: '#7fdcf0', roca: '#a07a4a', aire: '#9fb8e8', sombra: '#5b3f8c', luz: '#f5e27a'
};
const TYPE_ICON = {
  logica: '➗', letras: '📖', arte: '🎨', idioma: '💬', naturaleza: '🌿', fisico: '💪',
  agua: '💧', fuego: '🔥', electrico: '⚡', hielo: '❄️', roca: '🪨', aire: '🌪️', sombra: '🌑', luz: '✨'
};

// Cada tipo es muy eficaz (×1,5) contra los de su lista. Si el defensor es
// muy eficaz contra el atacante, el golpe es poco eficaz (×0,67).
// Los 6 tipos del colegio conservan su ciclo de Coremon 1.
const TYPE_BEATS = {
  logica: ['letras', 'electrico'],
  letras: ['arte', 'sombra'],
  arte: ['idioma', 'luz'],
  idioma: ['naturaleza', 'aire'],
  naturaleza: ['fisico', 'agua', 'roca'],
  fisico: ['logica', 'roca', 'hielo'],
  agua: ['fuego', 'roca'],
  fuego: ['naturaleza', 'hielo', 'letras'],
  electrico: ['agua', 'aire', 'logica'],
  hielo: ['naturaleza', 'aire'],
  roca: ['fuego', 'hielo', 'aire', 'electrico'],
  aire: ['fisico', 'naturaleza'],
  sombra: ['luz', 'idioma', 'letras'],
  luz: ['sombra', 'arte']
};
function typeEff(atk, def) {
  if (!atk || !def) return 1;
  if (TYPE_BEATS[atk].includes(def)) return 1.5;
  if (TYPE_BEATS[def].includes(atk)) return 0.67;
  return 1;
}

// ---------------- ESTADOS ----------------
const STATUS = {
  brn: { name: 'Quemado', short: 'QUE', color: '#f26a1b' },
  psn: { name: 'Envenenado', short: 'ENV', color: '#9c27b0' },
  par: { name: 'Paralizado', short: 'PAR', color: '#f2c418' },
  slp: { name: 'Dormido', short: 'DOR', color: '#78909c' },
  frz: { name: 'Congelado', short: 'CON', color: '#7fdcf0' }
};

// ---------------- MOVIMIENTOS ----------------
// eff: efecto secundario {status, chance}; self/foe: cambios de nivel de estadística;
// heal: fracción de PS que cura al usuario.
const MOVES = {
  // --- heredados de Coremon 1 ---
  placaje:    { name: 'Placaje', type: null, power: 36, acc: 1.00, pp: 30 },
  calculo:    { name: 'Cálculo Exacto', type: 'logica', power: 45, acc: 0.95, pp: 20 },
  axioma:     { name: 'Axioma', type: 'logica', power: 70, acc: 0.90, pp: 10 },
  logicaplas: { name: 'Lógica Aplastante', type: 'logica', power: 95, acc: 0.78, pp: 5 },
  ortografia: { name: 'Zarpazo Ortográfico', type: 'letras', power: 45, acc: 0.95, pp: 20 },
  metafora:   { name: 'Metáfora Cortante', type: 'letras', power: 70, acc: 0.90, pp: 10 },
  redaccion:  { name: 'Redacción Épica', type: 'letras', power: 95, acc: 0.78, pp: 5 },
  pincelada:  { name: 'Pincelada', type: 'arte', power: 45, acc: 0.95, pp: 20 },
  collage:    { name: 'Collage Furioso', type: 'arte', power: 70, acc: 0.90, pp: 10 },
  obramaestra:{ name: 'Obra Maestra', type: 'arte', power: 95, acc: 0.78, pp: 5 },
  vocabulario:{ name: 'Golpe de Vocabulario', type: 'idioma', power: 45, acc: 0.95, pp: 20 },
  acento:     { name: 'Acento Perfecto', type: 'idioma', power: 70, acc: 0.90, pp: 10 },
  fluidez:    { name: 'Fluidez Total', type: 'idioma', power: 95, acc: 0.78, pp: 5 },
  fotosintesis:{ name: 'Fotosíntesis', type: 'naturaleza', power: 45, acc: 0.95, pp: 20 },
  raiz:       { name: 'Latigazo de Raíz', type: 'naturaleza', power: 70, acc: 0.90, pp: 10 },
  ecosistema: { name: 'Ecosistema Furioso', type: 'naturaleza', power: 95, acc: 0.78, pp: 5 },
  flexion:    { name: 'Flexión Rápida', type: 'fisico', power: 45, acc: 0.95, pp: 20 },
  saque:      { name: 'Saque Potente', type: 'fisico', power: 70, acc: 0.90, pp: 10 },
  marchaforzada:{ name: 'Marcha Forzada', type: 'fisico', power: 95, acc: 0.78, pp: 5 },
  // --- nivel 4 de los tipos del colegio ---
  teorema:    { name: 'Teorema Final', type: 'logica', power: 120, acc: 0.75, pp: 5 },
  epopeya:    { name: 'Epopeya', type: 'letras', power: 120, acc: 0.75, pp: 5 },
  performance:{ name: 'Performance Total', type: 'arte', power: 120, acc: 0.75, pp: 5 },
  babel:      { name: 'Torre de Babel', type: 'idioma', power: 120, acc: 0.75, pp: 5 },
  selva:      { name: 'Selva Viva', type: 'naturaleza', power: 120, acc: 0.75, pp: 5 },
  maraton:    { name: 'Maratón', type: 'fisico', power: 120, acc: 0.75, pp: 5 },
  // --- fuego ---
  brasa:      { name: 'Brasa', type: 'fuego', power: 42, acc: 0.95, pp: 20, eff: { status: 'brn', chance: 0.1 } },
  llamarada:  { name: 'Llamarada', type: 'fuego', power: 68, acc: 0.90, pp: 12, eff: { status: 'brn', chance: 0.15 } },
  incendio:   { name: 'Incendio', type: 'fuego', power: 92, acc: 0.82, pp: 8, eff: { status: 'brn', chance: 0.2 } },
  infierno:   { name: 'Infierno', type: 'fuego', power: 120, acc: 0.75, pp: 5 },
  // --- agua ---
  chorro:     { name: 'Chorro', type: 'agua', power: 42, acc: 0.95, pp: 20 },
  burbujas:   { name: 'Burbujas', type: 'agua', power: 68, acc: 0.92, pp: 12, foeChance: { spd: -1, chance: 0.2 } },
  hidrobomba: { name: 'Hidrobomba', type: 'agua', power: 92, acc: 0.82, pp: 8 },
  tsunami:    { name: 'Tsunami', type: 'agua', power: 120, acc: 0.75, pp: 5 },
  // --- eléctrico ---
  chispa:     { name: 'Chispa', type: 'electrico', power: 42, acc: 0.95, pp: 20, eff: { status: 'par', chance: 0.1 } },
  rayo:       { name: 'Rayo', type: 'electrico', power: 68, acc: 0.90, pp: 12, eff: { status: 'par', chance: 0.15 } },
  trueno:     { name: 'Trueno', type: 'electrico', power: 92, acc: 0.80, pp: 8, eff: { status: 'par', chance: 0.2 } },
  apagon:     { name: 'Apagón', type: 'electrico', power: 120, acc: 0.75, pp: 5 },
  // --- hielo ---
  escarcha:   { name: 'Escarcha', type: 'hielo', power: 42, acc: 0.95, pp: 20, eff: { status: 'frz', chance: 0.08 } },
  ventisca:   { name: 'Ventisca', type: 'hielo', power: 68, acc: 0.90, pp: 12, eff: { status: 'frz', chance: 0.1 } },
  granizo:    { name: 'Granizo', type: 'hielo', power: 92, acc: 0.82, pp: 8, eff: { status: 'frz', chance: 0.12 } },
  glaciacion: { name: 'Glaciación', type: 'hielo', power: 120, acc: 0.75, pp: 5 },
  // --- roca ---
  pedrada:    { name: 'Pedrada', type: 'roca', power: 42, acc: 0.95, pp: 20 },
  avalancha:  { name: 'Avalancha', type: 'roca', power: 68, acc: 0.90, pp: 12 },
  terremoto:  { name: 'Terremoto', type: 'roca', power: 92, acc: 0.85, pp: 8 },
  meteorito:  { name: 'Meteorito', type: 'roca', power: 120, acc: 0.75, pp: 5 },
  // --- aire ---
  brisa:      { name: 'Brisa Cortante', type: 'aire', power: 42, acc: 0.95, pp: 20 },
  picotazo:   { name: 'Picotazo Aéreo', type: 'aire', power: 68, acc: 0.92, pp: 12 },
  vendaval:   { name: 'Vendaval', type: 'aire', power: 92, acc: 0.82, pp: 8 },
  huracan:    { name: 'Huracán', type: 'aire', power: 120, acc: 0.75, pp: 5 },
  // --- sombra ---
  sombrafurtiva:{ name: 'Sombra Furtiva', type: 'sombra', power: 42, acc: 1.00, pp: 20 },
  pesadilla:  { name: 'Pesadilla', type: 'sombra', power: 68, acc: 0.90, pp: 12, eff: { status: 'slp', chance: 0.1 } },
  garraoscura:{ name: 'Garra Oscura', type: 'sombra', power: 92, acc: 0.85, pp: 8 },
  eclipse:    { name: 'Eclipse', type: 'sombra', power: 120, acc: 0.75, pp: 5 },
  // --- luz ---
  destello:   { name: 'Destello', type: 'luz', power: 42, acc: 1.00, pp: 20 },
  rayosolar:  { name: 'Rayo Solar', type: 'luz', power: 68, acc: 0.92, pp: 12 },
  resplandor: { name: 'Resplandor', type: 'luz', power: 92, acc: 0.85, pp: 8 },
  supernova:  { name: 'Supernova', type: 'luz', power: 120, acc: 0.75, pp: 5 },
  // --- movimientos de estado ---
  concentracion:{ name: 'Concentración', type: 'fisico', power: 0, acc: 1, pp: 15, self: { atk: 1 } },
  muralla:    { name: 'Muralla', type: 'roca', power: 0, acc: 1, pp: 15, self: { def: 1 } },
  repaso:     { name: 'Repaso', type: 'logica', power: 0, acc: 1, pp: 10, self: { atk: 1, def: 1 } },
  agilidad:   { name: 'Agilidad', type: 'aire', power: 0, acc: 1, pp: 15, self: { spd: 2 } },
  grito:      { name: 'Grito', type: 'idioma', power: 0, acc: 1, pp: 20, foe: { atk: -1 } },
  nana:       { name: 'Nana', type: 'arte', power: 0, acc: 0.7, pp: 10, eff: { status: 'slp', chance: 1 } },
  toxina:     { name: 'Toxina', type: 'naturaleza', power: 0, acc: 0.85, pp: 10, eff: { status: 'psn', chance: 1 } },
  ondaelectrica:{ name: 'Onda Eléctrica', type: 'electrico', power: 0, acc: 0.9, pp: 15, eff: { status: 'par', chance: 1 } },
  fuegofatuo: { name: 'Fuego Fatuo', type: 'sombra', power: 0, acc: 0.85, pp: 12, eff: { status: 'brn', chance: 1 } },
  curacion:   { name: 'Curación', type: 'luz', power: 0, acc: 1, pp: 8, heal: 0.5 },
  // --- firma de los legendarios ---
  cimientos:  { name: 'Cimientos', type: 'roca', power: 130, acc: 0.85, pp: 5 },
  corazonada: { name: 'Corazonada', type: 'luz', power: 110, acc: 0.95, pp: 5, heal: 0.25 },
  latido:     { name: 'Latido Mecánico', type: 'electrico', power: 110, acc: 0.9, pp: 5, eff: { status: 'par', chance: 0.3 } }
};

// 4 niveles de ataque por tipo (para generar los movimientos que aprenden)
const TYPE_MOVES = {
  logica: ['calculo', 'axioma', 'logicaplas', 'teorema'],
  letras: ['ortografia', 'metafora', 'redaccion', 'epopeya'],
  arte: ['pincelada', 'collage', 'obramaestra', 'performance'],
  idioma: ['vocabulario', 'acento', 'fluidez', 'babel'],
  naturaleza: ['fotosintesis', 'raiz', 'ecosistema', 'selva'],
  fisico: ['flexion', 'saque', 'marchaforzada', 'maraton'],
  fuego: ['brasa', 'llamarada', 'incendio', 'infierno'],
  agua: ['chorro', 'burbujas', 'hidrobomba', 'tsunami'],
  electrico: ['chispa', 'rayo', 'trueno', 'apagon'],
  hielo: ['escarcha', 'ventisca', 'granizo', 'glaciacion'],
  roca: ['pedrada', 'avalancha', 'terremoto', 'meteorito'],
  aire: ['brisa', 'picotazo', 'vendaval', 'huracan'],
  sombra: ['sombrafurtiva', 'pesadilla', 'garraoscura', 'eclipse'],
  luz: ['destello', 'rayosolar', 'resplandor', 'supernova']
};
const TYPE_STATUS_MOVE = {
  logica: 'repaso', letras: 'grito', arte: 'nana', idioma: 'grito', naturaleza: 'toxina', fisico: 'concentracion',
  agua: 'agilidad', fuego: 'fuegofatuo', electrico: 'ondaelectrica', hielo: 'muralla', roca: 'muralla', aire: 'agilidad', sombra: 'fuegofatuo', luz: 'curacion'
};

// ---------------- HABILIDADES ----------------
// Cada especie tiene una habilidad pasiva fija. «furia» toma el nombre de su tipo.
const FURIA_NAME = {
  logica: 'Mente Fría', letras: 'Pluma Afilada', arte: 'Inspiración', idioma: 'Labia', naturaleza: 'Espesura', fisico: 'Último Esfuerzo',
  agua: 'Torrente', fuego: 'Mar Llamas', electrico: 'Sobrecarga', hielo: 'Corazón Helado', roca: 'Corteza Viva', aire: 'Ráfaga Final', sombra: 'Rencor', luz: 'Último Brillo'
};
const ABILITIES = {
  furia:    { name: 'Furia', desc: 'Con poca vida, sus ataques de su tipo pegan un 50 % más.' },
  intimida: { name: 'Intimidación', desc: 'Al salir al combate, baja el ataque del rival.' },
  robusto:  { name: 'Robustez', desc: 'Con todos los PS, aguanta con 1 PS un golpe que lo debilitaría.' },
  regenera: { name: 'Regeneración', desc: 'Recupera un poco de vida al final de cada turno.' },
  reactiva: { name: 'Piel Reactiva', desc: 'Quien le golpea puede acabar con un estado alterado.' },
  veloz:    { name: 'Pies Ligeros', desc: 'Es un 25 % más rápido.' },
  coraza:   { name: 'Coraza', desc: 'Recibe un 25 % menos de daño de los ataques muy eficaces.' },
  suerte:   { name: 'Ojo Crítico', desc: 'Hace golpes críticos el doble de a menudo.' },
  agallas:  { name: 'Agallas', desc: 'Con un estado alterado, su ataque sube un 50 % (y no le afecta la quemadura).' },
  aura:     { name: 'Aura Legendaria', desc: 'Sus ataques pegan un 20 % más y nada le baja las estadísticas.' }
};
const TYPE_ABILITY = {
  fuego: 'reactiva', electrico: 'reactiva', hielo: 'reactiva', naturaleza: 'regenera', agua: 'regenera', sombra: 'intimida', letras: 'intimida',
  roca: 'robusto', aire: 'veloz', idioma: 'veloz', luz: 'coraza', fisico: 'agallas', logica: 'suerte', arte: 'suerte'
};
const REACTIVE_STATUS = { fuego: 'brn', electrico: 'par', hielo: 'frz', naturaleza: 'psn', sombra: 'psn' };

// ---------------- OBJETOS ----------------
// Los objetos del colegio siguen valiendo en el mundo.
const ITEMS = {
  bocadillo: { name: 'Bocadillo', desc: 'Recupera 30 PS.', kind: 'heal', amount: 30, price: 150, icon: '🥪' },
  menu:      { name: 'Menú del comedor', desc: 'Recupera 100 PS.', kind: 'heal', amount: 100, price: 400, icon: '🍱' },
  banquete:  { name: 'Banquete', desc: 'Recupera todos los PS.', kind: 'heal', amount: 9999, price: 1200, icon: '🍗' },
  zumo:      { name: 'Zumo de naranja', desc: 'Recupera 10 PP de cada movimiento.', kind: 'pp', amount: 10, price: 300, icon: '🧃' },
  elixir:    { name: 'Elixir', desc: 'Recupera todos los PP.', kind: 'pp', amount: 99, price: 1500, icon: '🧪' },
  antidoto:  { name: 'Antídoto', desc: 'Cura cualquier estado alterado.', kind: 'cure', price: 250, icon: '💊' },
  tirita:    { name: 'Tirita mágica', desc: 'Reanima a un Coremon debilitado con la mitad de PS.', kind: 'revive', amount: 0.5, price: 600, icon: '🩹' },
  botiquin:  { name: 'Botiquín', desc: 'Reanima a un Coremon debilitado con todos los PS.', kind: 'revive', amount: 1, price: 2000, icon: '🧰' },
  cromo:     { name: 'Cromo', desc: 'Para capturar Coremon salvajes.', kind: 'capture', rate: 1.0, price: 200, icon: '🃏' },
  cromoOro:  { name: 'Cromo dorado', desc: 'Más probabilidad de captura.', kind: 'capture', rate: 1.7, price: 550, icon: '🌟' },
  cromoPlatino:{ name: 'Cromo platino', desc: 'Captura muy fácil.', kind: 'capture', rate: 2.6, price: 1200, icon: '💠' },
  cromoMaestro:{ name: 'Cromo maestro', desc: 'Captura cualquier Coremon sin fallar.', kind: 'capture', rate: 999, price: 0, icon: '👑' },
  caramelo:  { name: 'Caramelo raro', desc: 'Sube un nivel a un Coremon.', kind: 'level', price: 0, icon: '🍬' },
  repelente: { name: 'Repelente', desc: 'Evita Coremon salvajes durante un rato.', kind: 'repel', amount: 250, price: 500, icon: '🧴' },
  cana:      { name: 'Caña de pescar', desc: 'Ponte delante del agua y pulsa A para pescar Coremon de agua.', kind: 'key', price: 1500, once: true, icon: '🎣' },
  amuleto:   { name: 'Amuleto Iris', desc: 'Triplica la probabilidad de encontrar Coremon variocolor ✨.', kind: 'key', icon: '🔮' },
  // objetos clave
  bici:      { name: 'Bicicleta', desc: 'Ve mucho más rápido. Úsala desde la mochila.', kind: 'key', icon: '🚲' },
  mapa:      { name: 'Mapa de Iberión', desc: 'Muestra el mapa del mundo.', kind: 'key', icon: '🗺️' },
  pase:      { name: 'Pase de CoraCorp', desc: 'Tarjeta de acceso robada a un recluta de CoraCorp.', kind: 'key', icon: '🪪' },
  moto:      { name: 'Moto', desc: 'Para cruzar Iberión de punta a punta. Hay que conducirla: acelera, frena y no te la pegues.', kind: 'key', price: 12000, once: true, icon: '🏍️' },
  pistola:   { name: 'Pistola de juguete', desc: 'Dispara dardos de espuma. Deja K.O. a la gente un rato... y la policía multa.', kind: 'key', price: 3000, once: true, icon: '🔫' },
  paquete:   { name: 'Paquete', desc: 'Un paquete para entregar. Mira tus misiones.', kind: 'key', icon: '📦' }
};
const SHOP_TIERS = [
  ['bocadillo', 'menu', 'zumo', 'antidoto', 'tirita', 'cromo', 'cromoOro', 'repelente'],
  ['bocadillo', 'menu', 'banquete', 'zumo', 'antidoto', 'tirita', 'cromo', 'cromoOro', 'cromoPlatino', 'repelente'],
  ['menu', 'banquete', 'zumo', 'elixir', 'antidoto', 'tirita', 'botiquin', 'cromoOro', 'cromoPlatino', 'repelente']
];
// se venden en todas las tiendas
SHOP_TIERS.forEach(t => t.push('cana', 'moto', 'pistola'));
