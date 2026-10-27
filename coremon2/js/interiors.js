// ============================================================
// COREMON 2 — Interiores: centro Coremon, tienda, casas, gimnasios,
// laboratorio, colegio, Torre CoraCorp y Liga. Los personajes de cada
// interior los pone story.js (populateInterior).
// ============================================================

const INTERIOR_THEMES = {
  center: { w: 15, h: 11, floor: '#e8e0d0', floorStyle: 'tiles', wall: '#f5ece0', name: 'Centro Coremon', music: 'calm' },
  shop: { w: 13, h: 10, floor: '#d9cfc4', floorStyle: 'tiles', wall: '#e3eef8', name: 'Tienda', music: 'city' },
  house: { w: 11, h: 9, floor: '#c8a165', wall: '#f2e6cf', name: 'Casa', music: 'calm' },
  lab: { w: 13, h: 10, floor: '#d8e6ea', floorStyle: 'tiles', wall: '#e8f4f4', name: 'Laboratorio de la Dra. Olaia', music: 'calm' },
  school: { w: 15, h: 10, floor: '#2b2a30', floorStyle: 'tiles', wall: '#d9c7a3', name: 'Colegio Corazonistas', music: 'calm' },
  gym: { w: 17, h: 20, floor: '#d9cfc4', floorStyle: 'tiles', wall: '#3a2f55', name: 'Gimnasio', music: 'boss', windows: false },
  corp: { w: 19, h: 18, floor: '#3a3640', floorStyle: 'tiles', wall: '#26232c', name: 'Torre CoraCorp', music: 'corp', windows: false },
  liga: { w: 15, h: 30, floor: '#e8dcc0', floorStyle: 'tiles', wall: '#3a2a10', name: 'Liga Coremon', music: 'boss', windows: false }
};
const GYM_FLOOR = { naturaleza: '#a5d6a7', agua: '#90caf9', sombra: '#5e4a7e', roca: '#c8b08a', fuego: '#ffab91', electrico: '#fff59d', aire: '#e3f2fd', hielo: '#e0f7fa' };

function buildInterior(id) {
  const bid = id.slice(4);                    // 'int:gasteiz:center' -> 'gasteiz:center'
  const b = WORLD.buildings.find(x => x.id === bid);
  const th = INTERIOR_THEMES[b.kind] || INTERIOR_THEMES.house;
  const m = new GameMap(id, th.w, th.h);
  m.outdoor = false;
  m.floor = th.floor; m.floorStyle = th.floorStyle; m.wall = th.wall; m.windows = th.windows;
  m.music = th.music;
  m.building = b;
  m.name = b.kind === 'gym' ? `Gimnasio de ${CITY[b.city].name}` : b.kind === 'house' ? `Casa de ${placeById(b.city).name}` : th.name;
  m.battleScene = b.kind === 'gym' ? 'gym' : b.kind === 'corp' ? 'corp' : b.kind === 'liga' ? 'liga' : 'indoor';
  if (b.kind === 'gym') m.floor = GYM_FLOOR[CITY[b.city].gym] || th.floor;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) m.set(x, y, (y < 2 || x === 0 || x === m.w - 1) ? T.WALL : T.FLOOR);
  // salida (felpudo abajo en el centro)
  const ex = Math.floor(m.w / 2);
  m.set(ex, m.h - 1, T.MAT);
  m.warps.push({ x: ex * TS, y: (m.h - 1) * TS + 6, w: TS, h: 24, toWorld: true, exitDir: 'down' });
  m.spawn = { x: ex * TS + 16, y: (m.h - 2) * TS + 26 };
  const O = (type, tx, ty, extra) => m.addObj(Object.assign({ type, x: tx * TS + 16, y: ty * TS + 28, v: (tx + ty) % 4 }, extra || {}));
  switch (b.kind) {
    case 'center':
      m.addObj({ type: 'counter', x: 7 * TS + 16, y: 4 * TS + 20, col: [-48, -14, 96, 14] });
      O('pc', 2, 2, { action: 'pc', text: null });
      O('plant', 1, 2); O('plant', 13, 2); O('plant', 1, 9); O('plant', 13, 9);
      O('table', 11, 7); O('tv', 12, 2);
      for (let x = 3; x < 12; x++) if (x !== 7) m.set(x, 8, T.CARPET);
      break;
    case 'shop':
      m.addObj({ type: 'counter', x: 6 * TS + 16, y: 4 * TS + 20, col: [-48, -14, 96, 14] });
      O('shelf', 2, 6); O('shelf', 10, 6); O('shelf', 2, 8); O('shelf', 10, 8); O('plant', 1, 2); O('plant', 11, 2);
      break;
    case 'house':
      O('bed', 2, 3); O('table', 7, 5); O('tv', 9, 2); O('plant', 1, 7); O('plant', 9, 7); O('crate', 5, 2);
      for (let x = 4; x < 9; x++) m.set(x, 6, T.CARPET);
      break;
    case 'lab':
      O('machine', 3, 3); O('machine', 9, 3); O('pc', 6, 2); O('table', 6, 6); O('plant', 1, 8); O('plant', 11, 8); O('crate', 11, 3);
      break;
    case 'school':
      m.carpet = '#d9c7a3';
      for (let y = 2; y < m.h - 1; y++) for (let x = 6; x < 9; x++) m.set(x, y, T.CARPET);
      O('statue', 7, 3, { action: 'school_door', col: [-14, -10, 28, 10] });
      O('plant', 1, 2); O('plant', 13, 2); O('bench', 3, 6); O('bench', 11, 6); O('shelf', 2, 3); O('shelf', 12, 3);
      break;
    case 'gym': {
      const ty = CITY[b.city].gym, col = TYPE_COLOR[ty];
      m.carpet = shade(col, -10); m.mat = col;
      for (let x = 6; x < 11; x++) m.set(x, 3, T.CARPET);
      for (let y = 15; y < m.h - 1; y++) m.set(8, y, T.CARPET);
      // laberinto: tres hileras de bloques con el hueco alternando de lado
      const gaps = { 14: [2, 3], 10: [13, 14], 6: [2, 3] };
      for (const ry in gaps) for (let x = 1; x < m.w - 1; x++) if (!gaps[ry].includes(x))
        m.addObj({ type: 'gymblock', color: col, x: x * TS + 16, y: +ry * TS + 28, col: [-16, -14, 32, 14] });
      const deco = { naturaleza: 'bush', agua: 'fountain', sombra: 'torch', roca: 'bigrock', fuego: 'torch', electrico: 'machine', aire: 'flowers', hielo: 'crystal' }[ty] || 'plant';
      [[1, 4], [15, 4], [1, 17], [15, 17], [15, 12], [1, 8]].forEach(([x, y]) => O(deco, x, y));
      O('statue', 5, 17, { text: [`GIMNASIO DE ${CITY[b.city].name.toUpperCase()}`, `Tipo ${TYPE_LABEL[ty]}. Líder: ${GYMS[b.city] ? GYMS[b.city].name : '???'}.`] });
      O('statue', 11, 17, { text: ['Entrenadores que han vencido aquí:', G && G.badges.includes(b.city) ? G.name + ' (¡tú!)' : '... todavía nadie este año.'] });
      break;
    }
    case 'corp':
      m.carpet = '#4a1c24';
      for (let y = 3; y < m.h - 1; y++) m.set(9, y, T.CARPET);
      [[3, 4], [15, 4], [3, 9], [15, 9], [3, 14], [15, 14]].forEach(([x, y]) => O('machine', x, y));
      [[6, 7], [12, 7], [6, 12], [12, 12]].forEach(([x, y]) => O('table', x, y));
      O('pc', 9, 2, { text: ['Pantalla de CoraCorp: «PROYECTO NÚCLEO. Objetivo: capturar a Cimientor y controlar el Núcleo de Iberión».', '«Fase 1: Mecardio — COMPLETADA. Fase 2: Cumbre Corazón — EN CURSO».'] });
      break;
    case 'liga':
      m.carpet = '#8e1c1c';
      for (let y = 3; y < m.h - 1; y++) m.set(7, y, T.CARPET);
      for (let y = 4; y < m.h - 2; y += 4) { O('torch', 3, y); O('torch', 11, y); }
      O('statue', 4, 2); O('statue', 10, 2);
      break;
  }
  populateInterior(b, m);
  return m;
}
