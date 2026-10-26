// ============================================================
// COREMON 1 — Motor 3D (Three.js, estilo HD-2D) para el colegio:
// cada sala se levanta como un diorama (paredes con su pixel-art de
// siempre, muebles con volumen, decorados de pie, hierba alta 3D, luz con
// sombras) y los combates tienen fondo 3D con sprites 2D, como en la DS.
// Sin WebGL (o con ?2d en la dirección) se usa el dibujado 2D original.
// 1 unidad = 1 casilla en el suelo; lo vertical se estira x1.25.
// ============================================================

const R1 = { ok: false, room: null, roomKey: null, actors: new Map(), items: new Map(), cards: [], uTime: { value: 0 } };
const VS = 1.25;   // escala vertical

function init3D1() {
  if (typeof THREE === 'undefined' || /[?&]2d\b/.test(location.search)) return false;
  try {
    const top = document.getElementById('top-screen');
    const c = document.createElement('canvas'); c.id = 'gl1';
    top.insertBefore(c, top.firstChild);
    const r = new THREE.WebGLRenderer({ canvas: c, antialias: true });
    if (!r.getContext()) throw new Error('sin WebGL');
    r.useLegacyLights = true;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    R1.renderer = r;
    R1.aniso = Math.min(8, r.capabilities.getMaxAnisotropy());
    R1.scene = new THREE.Scene();
    R1.cam = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 300);
    R1.hemi = new THREE.HemisphereLight(0xfff6e8, 0x6a5a50, 0.72);
    R1.sun = new THREE.DirectionalLight(0xfff2dc, 0.55);
    R1.sun.castShadow = true; R1.sun.shadow.mapSize.set(1024, 1024);
    const sc = R1.sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 70;
    R1.sun.shadow.bias = -0.0006; R1.sun.shadow.normalBias = 0.03;
    R1.scene.add(R1.hemi, R1.sun, R1.sun.target);
    R1.scene.background = new THREE.Color(0x14121c);
    R1.dyn = new THREE.Group(); R1.scene.add(R1.dyn);
    buildShared1();
    resize3D1();
    window.addEventListener('resize', resize3D1);
    c.addEventListener('webglcontextlost', e => { e.preventDefault(); R1.ok = false; });
    R1.ok = true;
    return true;
  } catch (e) {
    console.warn('3D no disponible, se usa 2D:', e);
    const c = document.getElementById('gl1'); if (c) c.remove();
    return false;
  }
}
function resize3D1() {
  if (!R1.renderer) return;
  const el = document.getElementById('top-screen');
  const w = el.clientWidth || 512, h = el.clientHeight || 384;
  R1.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  R1.renderer.setSize(w, h, false);
}

// ---------------- UTILIDADES ----------------
function tx1(src, o) {
  o = o || {};
  const t = new THREE.CanvasTexture(src);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = o.mip === false ? THREE.NearestFilter : THREE.NearestMipmapLinearFilter;
  if (o.mip === false) t.generateMipmaps = false;
  t.anisotropy = R1.aniso;
  if (o.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function cv1(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function h1(x, y, i) { const s = Math.sin(x * 127.1 + y * 311.7 + i * 74.7) * 43758.5453; return s - Math.floor(s); }
function part1(geo, col, x, y, z, sx, sy, sz) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy == null ? sx : sy, sz == null ? sx : sz)));
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), c = new THREE.Color(col);
  for (let i = 0; i < n; i++) { const j = 1 + (h1(Math.floor(i / 3), n, 7) - 0.5) * 0.12; arr[i * 3] = c.r * j; arr[i * 3 + 1] = c.g * j; arr[i * 3 + 2] = c.b * j; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
function merge1(list) {
  let n = 0; list.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  list.forEach(g => { pos.set(g.attributes.position.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

function buildShared1() {
  R1.matStd = new THREE.MeshLambertMaterial({ vertexColors: true });
  R1.geoUnit = new THREE.PlaneGeometry(1, 1); R1.geoUnit.translate(0, 0.5, 0);
  // hierba alta 3D
  const blade = cv1(16, 16, g => { for (let i = 0; i < 7; i++) { const x = 1 + i * 2.1, hh = 9 + (i * 5) % 7; g.fillStyle = i % 2 ? '#ffffff' : '#d8d8d8'; g.fillRect(x, 16 - hh, 2, hh); } });
  R1.grassMat = new THREE.MeshLambertMaterial({ map: tx1(blade, { mip: false }), alphaTest: 0.5, side: THREE.DoubleSide });
  R1.grassMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = R1.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(uTime * 2.2 + instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.6) * 0.07 * position.y * 2.2;\n#endif');
  };
  const q = new THREE.PlaneGeometry(0.62, 0.42); q.translate(0, 0.21, 0);
  const q2 = q.clone(); q2.rotateY(Math.PI / 2);
  const q3 = q.clone(); q3.rotateY(Math.PI / 4);
  const pos = [], nor = [], uv = [];
  [q, q2, q3].forEach(g0 => { const g = g0.toNonIndexed(); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); uv.push(...g.attributes.uv.array); });
  R1.grassGeo = new THREE.BufferGeometry();
  R1.grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  R1.grassGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  R1.grassGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  // cromo del suelo
  R1.ballGeo = (() => { const g = new THREE.SphereGeometry(0.17, 12, 8).toNonIndexed(); const p = g.attributes.position, c = new Float32Array(p.count * 3); const red = new THREE.Color('#e53935'), wh = new THREE.Color('#fafafa'), bk = new THREE.Color('#1d1a26'); for (let i = 0; i < p.count; i++) { const y = p.getY(i), col = Math.abs(y) < 0.025 ? bk : y > 0 ? red : wh; c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); return g; })();
  R1.pageMat = new THREE.MeshLambertMaterial({ map: tx1(cv1(16, 20, g => { g.fillStyle = '#1d1a26'; g.fillRect(0, 0, 16, 20); g.fillStyle = '#f3e5c0'; g.fillRect(1, 1, 14, 18); g.fillStyle = '#8d6e63'; for (let i = 0; i < 4; i++) g.fillRect(4, 5 + i * 3, 8, 1); }), { mip: false }), side: THREE.DoubleSide });
  const bb = cv1(32, 32, g => { g.fillStyle = '#1d1a26'; g.fillRect(6, 2, 20, 28); g.fillStyle = '#fff'; g.fillRect(8, 4, 16, 24); g.fillStyle = '#e53935'; g.fillRect(14, 7, 4, 12); g.fillRect(14, 21, 4, 4); });
  R1.bubbleMat = new THREE.SpriteMaterial({ map: tx1(bb, { mip: false }), depthTest: false });
  const zz = cv1(32, 32, g => { g.font = 'bold 22px monospace'; g.lineWidth = 4; g.strokeStyle = '#1d1a26'; g.strokeText('z', 8, 24); g.fillStyle = '#e3f2fd'; g.fillText('z', 8, 24); });
  R1.zzzMat = new THREE.SpriteMaterial({ map: tx1(zz, { mip: false }), depthTest: false });
  // árbol low-poly para fondos de combate
  const CYL = new THREE.CylinderGeometry(0.11, 0.16, 1, 7), ICO = new THREE.IcosahedronGeometry(1, 0);
  R1.treeGeo = merge1([part1(CYL, '#6d4c2a', 0, 0.5, 0, 1, 1, 1), part1(ICO, '#2e7d32', 0, 1.35, 0, 0.66, 0.6, 0.66), part1(ICO, '#388e3c', -0.34, 1.2, 0.14, 0.44), part1(ICO, '#43a047', 0.36, 1.26, -0.08, 0.42), part1(ICO, '#4caf50', 0.04, 1.78, 0.06, 0.4)]);
}

// ---------------- SALA EN 3D ----------------
const COL_T = t => t === '#';
const FURN_H = { counter: 0.85, bench: 0.4, stage: 0.3, seat: 0.45, pew: 0.5, confTable: 0.7, chair: 0.45, teacherDesk: 0.7, desk: 0.6, labBench: 0.8, readingTable: 0.7, mats: 0.18, draftTable: 0.8, sofa: 0.5, bigDesk: 0.75, bin: 0.55, woodSeat: 0.45, stageSteps: 0.15, workbench: 0.8 };
const CARD_FORCE = new Set(['bush', 'sign', 'bikeRack', 'footballGoal']);

function isColumn(map, x, y) {
  const t = tileAt(map, x, y);
  if (t === undefined) return false;
  if (t === '#') return true;
  if (t === 'D' || t === 'L' || t === 'A') {
    const up = y === 0 ? '#' : tileAt(map, x, y - 1), dn = tileAt(map, x, y + 1);
    return (up === '#' || up === undefined) && dn !== undefined && dn !== '#' && !'DLA'.includes(dn);
  }
  return false;
}
function columnH(map, x, y) {
  const H = map.grid.length;
  if (map.outdoor) {
    const fr = map.facadeRows || [];
    if (fr.includes(y)) return fr.length * 1.7;
    return 0.9;
  }
  if (y === H - 1) return 0.35;
  return (map.tallWall ? 2 : 1) * VS;
}
// textura de la sala: la capa estática + lo animado de las paredes + rótulos de las puertas
function roomTexture(map) {
  const T = TILE, W = map.grid[0].length, H = map.grid.length;
  return cv1(W * T, H * T, g => {
    g.drawImage(staticLayer, 0, 0);
    for (const d of map.decor) { const def = decorDef(d.type); if (def.wall && def.anim) def.draw(g, d.x * T, d.y * T, T, d, 0); }
    for (const d of map.doors) if (tileAt(map, d.x, d.y) === 'A') drawDoor(g, d.x * T, d.y * T, T, d, null, 0, map);
    g.font = 'bold 8px monospace'; g.textAlign = 'center';
    for (const d of map.doors) {
      if (!d.short || (d.exit && !d.style)) continue;
      const w = g.measureText(d.short).width + 6;
      const side = d.x === 0 ? 1 : d.x === W - 1 ? -1 : 0;
      const cx = d.x * T + T / 2 + side * (w / 2 - T / 2 + 2), y = d.y * T + (map.tallWall && d.y === 1 ? -14 : side ? -12 : 2);
      box(g, cx - w / 2, y, w, 11, d.locked && !doorOpen(d) ? '#4a148c' : '#263238', OUT);
      g.fillStyle = '#ffd54f'; g.fillText(d.short, cx, y + 8);
    }
  });
}
function clearRoom1() {
  if (R1.room) {
    R1.scene.remove(R1.room);
    R1.room.traverse(o => { if (o.isInstancedMesh) o.dispose(); if (o.geometry && o.userData.own) o.geometry.dispose(); if (o.material && o.userData.ownMat) { [].concat(o.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
  }
  for (const o of R1.actors.values()) { R1.dyn.remove(o.m); if (o.bub) R1.dyn.remove(o.bub); if (o.zz) R1.dyn.remove(o.zz); o.mat.dispose(); }
  R1.actors.clear();
  for (const m of R1.items.values()) R1.dyn.remove(m);
  R1.items.clear();
  R1.cards = []; R1.room = null; R1.camT = null;
}
function buildRoom1(map) {
  clearRoom1();
  const T = TILE, W = map.grid[0].length, H = map.grid.length;
  const group = new THREE.Group();
  const roomTex = tx1(roomTexture(map));
  const texMat = new THREE.MeshLambertMaterial({ map: roomTex });
  // suelo
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, H), texMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, H / 2); floor.receiveShadow = true;
  floor.userData.own = true; floor.userData.ownMat = true;
  group.add(floor);
  // paredes / fachada / setos
  const F = { pos: [], nor: [], uv: [] }, S = { pos: [], nor: [], col: [] };
  const topC = new THREE.Color(map.outdoor ? '#3c7a34' : (map.wallTop || '#2b2735')), facC = new THREE.Color('#7a3a2a'), sideC = new THREE.Color(map.outdoor ? '#2f6e2a' : '#4a4452');
  const colH = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) colH[y * W + x] = isColumn(map, x, y) ? columnH(map, x, y) : 0;
  const hAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : colH[y * W + x];
  const pushS = (a, b, c, d, n, col) => { S.pos.push(...a, ...b, ...c, ...c, ...b, ...d); for (let i = 0; i < 6; i++) { S.nor.push(...n); S.col.push(col.r, col.g, col.b); } };
  const pushF = (a, b, c, d, n, uvs) => { F.pos.push(...a, ...b, ...c, ...c, ...b, ...d); for (let i = 0; i < 6; i++) F.nor.push(...n); F.uv.push(...uvs[0], ...uvs[1], ...uvs[2], ...uvs[2], ...uvs[1], ...uvs[3]); };
  const fr = map.facadeRows || [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const h = hAt(x, y); if (!h) continue;
    const isFac = map.outdoor && fr.includes(y);
    pushS([x, h, y], [x, h, y + 1], [x + 1, h, y], [x + 1, h, y + 1], [0, 1, 0], isFac ? facC : topC);
    // cara delantera (sur): el pixel-art de la pared, de la fachada o del seto
    const hs = hAt(x, y + 1);
    if (hs < h) {
      let n = 1;
      if (isFac) n = y - Math.min(...fr) + 1;
      else if (!map.outdoor && map.tallWall && y > 0 && isColumn(map, x, y - 1)) n = 2;
      const u0 = x / W, u1 = (x + 1) / W, vt = 1 - (y - n + 1) / H, vb = 1 - (y + 1) / H;
      const vh = hs > 0 ? vb + (vt - vb) * (hs / h) : vb;
      pushF([x, h, y + 1], [x, hs, y + 1], [x + 1, h, y + 1], [x + 1, hs, y + 1], [0, 0, 1], [[u0, vt], [u0, vh], [u1, vt], [u1, vh]]);
    }
    const side = (nh, a, b, n) => { if (nh < h) pushS([a[0], h, a[1]], [a[0], nh, a[1]], [b[0], h, b[1]], [b[0], nh, b[1]], n, map.outdoor && !isFac ? sideC : isFac ? facC : sideC); };
    side(hAt(x, y - 1), [x + 1, y], [x, y], [0, 0, -1]);
    side(hAt(x + 1, y), [x + 1, y + 1], [x + 1, y], [1, 0, 0]);
    side(hAt(x - 1, y), [x, y], [x, y + 1], [-1, 0, 0]);
  }
  const mkGeo = (B, withUv) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3)); if (withUv) g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2)); else g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3)); return g; };
  if (F.pos.length) { const m = new THREE.Mesh(mkGeo(F, true), texMat); m.castShadow = m.receiveShadow = true; m.userData.own = true; group.add(m); }
  if (S.pos.length) { const m = new THREE.Mesh(mkGeo(S, false), R1.matStd); m.castShadow = m.receiveShadow = true; m.userData.own = true; group.add(m); }
  // muebles con volumen (su dibujo va encima y delante)
  const FB = { pos: [], nor: [], uv: [] }, FS = { pos: [], nor: [], col: [] };
  const dark = new THREE.Color('#4e3b30');
  for (const d of map.decor) {
    const def = decorDef(d.type);
    if (def.wall || def.tall || def.anim || CARD_FORCE.has(d.type)) continue;
    if (def.solid === false || d.solid === false) continue;
    const hh = FURN_H[d.type] || 0.5;
    const x0 = d.x, z0 = d.y, x1 = d.x + (d.w || 1), z1 = d.y + (d.h || 1);
    const u0 = x0 / W, u1 = x1 / W, v0 = 1 - z0 / H, v1 = 1 - z1 / H;
    // tapa
    FB.pos.push(x0, hh, z0, x0, hh, z1, x1, hh, z0, x1, hh, z0, x0, hh, z1, x1, hh, z1);
    for (let i = 0; i < 6; i++) FB.nor.push(0, 1, 0);
    FB.uv.push(u0, v0, u0, v1, u1, v0, u1, v0, u0, v1, u1, v1);
    // frente: la última fila del dibujo
    const vf = 1 - (z1 - 0.5) / H;
    FB.pos.push(x0, hh, z1, x0, 0, z1, x1, hh, z1, x1, hh, z1, x0, 0, z1, x1, 0, z1);
    for (let i = 0; i < 6; i++) FB.nor.push(0, 0, 1);
    FB.uv.push(u0, vf, u0, v1, u1, vf, u1, vf, u0, v1, u1, v1);
    pushS2(FS, [x1, hh, z1], [x1, 0, z1], [x1, hh, z0], [x1, 0, z0], [1, 0, 0], dark);
    pushS2(FS, [x0, hh, z0], [x0, 0, z0], [x0, hh, z1], [x0, 0, z1], [-1, 0, 0], dark);
  }
  if (FB.pos.length) { const m = new THREE.Mesh(mkGeo(FB, true), texMat); m.castShadow = m.receiveShadow = true; m.userData.own = true; group.add(m); }
  if (FS.pos.length) { const m = new THREE.Mesh(mkGeo(FS, false), R1.matStd); m.castShadow = true; m.userData.own = true; group.add(m); }
  // decorados de pie (recortables)
  const M = 112;
  for (const d of map.decor) {
    const def = decorDef(d.type);
    if (def.wall) continue;
    if (!(def.tall || def.anim || CARD_FORCE.has(d.type))) continue;
    const w = (d.w || 1) * T, hpx = (d.h || 1) * T + M;
    const c = cv1(w, hpx, g => def.draw(g, 0, M, T, d, 0));
    const t = tx1(c, { mip: false });
    const mat = new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide });
    const m = new THREE.Mesh(R1.geoUnit, mat);
    m.scale.set(w / T, hpx / T * VS, 1);
    m.position.set(d.x + (d.w || 1) / 2, 0, d.y + (d.h || 1) - 0.4);
    m.castShadow = true; m.receiveShadow = true;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 });
    m.userData.ownMat = true;
    group.add(m);
    if (def.anim) R1.cards.push({ d, def, c, t, w, hpx });
  }
  // hierba alta
  const tufts = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = tileAt(map, x, y);
    if (t !== ',' && t !== 'h') continue;
    for (let k = 0; k < 3; k++) tufts.push([x + 0.2 + h1(x, y, k) * 0.6, y + 0.2 + h1(x, y, k + 5) * 0.6, 0.85 + h1(x, y, k + 9) * 0.45, h1(x, y, k + 2) * 3, t === 'h' ? '#2f5a3c' : '#3f8f3a']);
  }
  if (tufts.length) {
    const im = new THREE.InstancedMesh(R1.grassGeo, R1.grassMat, tufts.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
    tufts.forEach(([x, z, s, r, col], i) => { m4.compose(new THREE.Vector3(x, 0, z), q.setFromEuler(e.set(0, r, 0)), new THREE.Vector3(s, s, s)); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(col)); });
    im.receiveShadow = true; group.add(im);
  }
  // luz y cielo
  if (map.outdoor) {
    R1.scene.background = new THREE.Color('#8fd3ff');
    R1.scene.fog = new THREE.Fog(0x8fd3ff, 40, 90);
    R1.hemi.color.set('#dcefff'); R1.hemi.groundColor.set('#6b5a3a'); R1.hemi.intensity = 0.62;
    R1.sun.color.set('#fff4e0'); R1.sun.intensity = 0.85;
  } else {
    R1.scene.background = new THREE.Color('#14121c'); R1.scene.fog = null;
    R1.hemi.color.set('#fff6e8'); R1.hemi.groundColor.set('#6a5a50'); R1.hemi.intensity = 0.74;
    R1.sun.color.set('#fff2dc'); R1.sun.intensity = 0.55;
  }
  R1.scene.add(group);
  R1.room = group;
  R1.roomW = W; R1.roomH = H;
}
function pushS2(S, a, b, c, d, n, col) { S.pos.push(...a, ...b, ...c, ...c, ...b, ...d); for (let i = 0; i < 6; i++) { S.nor.push(...n); S.col.push(col.r, col.g, col.b); } }

// ---------------- PERSONAJES ----------------
const P1_TEX = new Map();
function personTex1(look, dir, frame) {
  const k = JSON.stringify(look) + dir + frame;
  let t = P1_TEX.get(k);
  if (!t) { t = tx1(cv1(36, 36, g => drawPerson(g, look, 18, 36, 36, dir, frame)), { mip: false }); P1_TEX.set(k, t); }
  return t;
}
function updateActors1(map) {
  const seen = new Set();
  const list = actors.concat(STATE === 'TITLE' ? [] : [player]);
  for (const a of list) {
    seen.add(a);
    let o = R1.actors.get(a);
    if (!o) {
      const mat = new THREE.MeshLambertMaterial({ alphaTest: 0.5, side: THREE.DoubleSide });
      const m = new THREE.Mesh(R1.geoUnit, mat); m.castShadow = true; m.rotation.x = -0.2;
      m.scale.set(1.125, 1.125 * VS, 1);
      m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
      R1.dyn.add(m);
      o = { m, mat, key: null };
      R1.actors.set(a, o);
    }
    const fr = actorFrame(a), key = (a.facing || 'down') + fr;
    if (o.key !== key || o.look !== a.look) {
      const t = personTex1(a.look, a.facing || 'down', fr);
      o.mat.map = t; o.mat.needsUpdate = true; o.m.customDepthMaterial.map = t; o.m.customDepthMaterial.needsUpdate = true;
      o.key = key; o.look = a.look;
    }
    o.m.position.set(a.px / TILE + 0.5, 0, a.py / TILE + 0.92);
    if (a.bubble && !o.bub) { o.bub = new THREE.Sprite(R1.bubbleMat); o.bub.scale.set(0.45, 0.45, 1); o.bub.renderOrder = 20; R1.dyn.add(o.bub); }
    if (o.bub) { o.bub.visible = !!a.bubble; o.bub.position.set(o.m.position.x, 1.85, o.m.position.z); }
    const z = a.sleepy && !a.bubble && !game.badges.includes(a.id);
    if (z && !o.zz) { o.zz = new THREE.Sprite(R1.zzzMat); o.zz.scale.set(0.4, 0.4, 1); o.zz.renderOrder = 20; R1.dyn.add(o.zz); }
    if (o.zz) { o.zz.visible = z; const k = (now / 900) % 1; o.zz.position.set(o.m.position.x + 0.3 + k * 0.2, 1.6 + k * 0.4, o.m.position.z); o.zz.material.opacity = 1 - k; }
  }
  for (const [a, o] of R1.actors) if (!seen.has(a)) { R1.dyn.remove(o.m); if (o.bub) R1.dyn.remove(o.bub); if (o.zz) R1.dyn.remove(o.zz); o.mat.dispose(); R1.actors.delete(a); }
  // objetos del suelo y páginas del diario
  const itSeen = new Set();
  for (const it of map.items) {
    if (game.picked[it.id]) continue;
    itSeen.add(it.id);
    let m = R1.items.get(it.id);
    if (!m) {
      m = it.page ? new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), R1.pageMat) : new THREE.Mesh(R1.ballGeo, R1.matStd);
      m.castShadow = true; R1.dyn.add(m); R1.items.set(it.id, m);
    }
    m.position.set(it.x + 0.5, 0.25 + Math.sin(now / 250) * 0.05, it.y + 0.6);
    m.rotation.y = now / 700;
  }
  for (const [id, m] of R1.items) if (!itSeen.has(id)) { R1.dyn.remove(m); R1.items.delete(id); }
}

// ---------------- CÁMARA Y DIBUJO ----------------
const PITCH1 = 0.72;
function render3DTitle1() {
  if (R1.roomKey !== '__title') { buildStaticLayer(MAPS.exterior); buildRoom1(MAPS.exterior); R1.roomKey = '__title'; R1.layer = staticLayer; }
  render3D1(MAPS.exterior);
}
function render3D1(map) {
  if (STATE !== 'TITLE' && (R1.roomKey !== game.room || R1.layer !== staticLayer)) { buildRoom1(map); R1.roomKey = game.room; R1.layer = staticLayer; }
  updateActors1(map);
  // decorados animados (máquinas, peceras, velas...)
  if (R1.cards.length && now - (R1.cardT || 0) > 160) {
    R1.cardT = now;
    for (const c of R1.cards) { const g = c.c.getContext('2d'); g.clearRect(0, 0, c.w, c.hpx); c.def.draw(g, 0, 112, TILE, c.d, now); c.t.needsUpdate = true; }
  }
  const W = R1.roomW, H = R1.roomH;
  let tx = player.px / TILE + 0.5, tz = player.py / TILE + 0.6;
  if (STATE === 'TITLE') { tx = W / 2; tz = H / 2; }
  const fov = R1.cam.fov, t = Math.tan(fov * Math.PI / 360);
  const d = Math.max(10.2 / (2 * t), 14 / (2 * t * R1.cam.aspect));
  // encuadre: la sala pegada al borde de abajo de la pantalla y sin salirse por los lados
  const f2 = fov * Math.PI / 360, hc = d * Math.sin(PITCH1), dc = d * Math.cos(PITCH1);
  const south = dc - hc / Math.tan(PITCH1 + f2), north = hc / Math.tan(PITCH1 - f2) - dc;
  const halfW = d * t * R1.cam.aspect * 0.92;
  tx = W <= halfW * 2 ? W / 2 : clamp1(tx, halfW, W - halfW);
  const tzMin = north - 1.2, tzMax = H + 0.25 - south;
  tz = tzMin >= tzMax ? tzMax : clamp1(tz, tzMin, tzMax);
  if (!R1.camT || STATE === 'TITLE') R1.camT = new THREE.Vector3(tx, 0, tz);
  R1.camT.x += (tx - R1.camT.x) * 0.15; R1.camT.z += (tz - R1.camT.z) * 0.15;
  const c = R1.camT, sh = shake ? (Math.random() - 0.5) * 0.12 : 0;
  if (STATE === 'TITLE') {
    const a = Math.sin(now / 9000) * 0.5;
    R1.cam.position.set(c.x + Math.sin(a) * d * 0.9, d * 0.62, c.z + Math.cos(a) * d * 0.9);
    R1.cam.lookAt(c.x, 1.5, c.z - 1);
  } else {
    R1.cam.position.set(c.x + sh, d * Math.sin(PITCH1), c.z + d * Math.cos(PITCH1));
    R1.cam.lookAt(c.x + sh, 0, c.z);
  }
  R1.sun.position.set(c.x - 6, 15, c.z + 9); R1.sun.target.position.set(c.x, 0, c.z);
  R1.uTime.value = now / 1000;
  R1.renderer.render(R1.scene, R1.cam);
}
function clamp1(v, a, b) { return v < a ? a : v > b ? b : v; }

// ---------------- FONDO 3D DE LOS COMBATES ----------------
function battleBg3D(b) {
  const key = b.bgOutdoor ? 'out' : 'in:' + (b.map && b.map.name);
  if (R1.bkey !== key) {
    R1.bkey = key;
    if (R1.bscene) R1.bscene.traverse(o => { if (o.userData.own) { o.geometry.dispose(); [].concat(o.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
    const s = new THREE.Scene(), own = o => { o.userData.own = true; return o; };
    const hemi = new THREE.HemisphereLight(0xe6f2ff, 0x6b5a3a, 0.65), sun = new THREE.DirectionalLight(0xfff2dc, 0.75);
    sun.position.set(-6, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    const scs = sun.shadow.camera; scs.left = -14; scs.right = 14; scs.top = 14; scs.bottom = -14;
    s.add(hemi, sun);
    if (b.bgOutdoor) {
      s.background = new THREE.Color('#7ec4f2'); s.fog = new THREE.Fog(0xcdeaf8, 16, 42);
      const gt = tx1(cv1(64, 64, g => { g.fillStyle = '#8fd16a'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 90; i++) { g.fillStyle = h1(i, 1, 2) > 0.5 ? '#7cc35a' : '#a5dd84'; g.fillRect(Math.floor(h1(i, 2, 2) * 62), Math.floor(h1(i, 3, 2) * 62), 2, 2); } }), { repeat: true });
      gt.repeat.set(20, 20);
      const ground = own(new THREE.Mesh(new THREE.CircleGeometry(50, 40), new THREE.MeshLambertMaterial({ map: gt })));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
      const n = 26, im = new THREE.InstancedMesh(R1.treeGeo, R1.matStd, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 1.2 - Math.PI * 1.1, r = 11 + h1(i, 4, 1) * 10, sc = 0.9 + h1(i, 5, 1) * 0.6; m4.compose(new THREE.Vector3(Math.cos(a) * r, 0, -4 + Math.sin(a) * r), q.setFromEuler(e.set(0, h1(i, 6, 1) * 6, 0)), new THREE.Vector3(sc, sc, sc)); im.setMatrixAt(i, m4); }
      im.castShadow = true; s.add(im);
    } else {
      const m = b.map, T = TILE;
      s.background = new THREE.Color('#14121c');
      const ft = tx1(cv1(T * 4, T * 4, g => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) drawFloor(g, m, x * T, y * T, T, x, y + 5); }), { repeat: true });
      ft.repeat.set(10, 10);
      const floor = own(new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ map: ft })));
      floor.rotation.x = -Math.PI / 2; floor.position.z = -6; floor.receiveShadow = true; s.add(floor);
      const wt = tx1(cv1(T * 4, T * 2, g => { for (let x = 0; x < 4; x++) { drawUpperWall(g, m, x * T, 0, T, x); drawWall(g, m, x * T, T, T, true, x, 3); } }), { repeat: true });
      wt.repeat.set(10, 1);
      const wall = own(new THREE.Mesh(new THREE.PlaneGeometry(40, 2 * VS * 2), new THREE.MeshLambertMaterial({ map: wt })));
      wall.position.set(0, VS * 2, -13); wall.receiveShadow = true; s.add(wall);
    }
    // plataformas bajo los Coremon
    const plat = (sx, sy, r) => {
      const p = groundPoint1(sx / 512, sy / 384);
      const m = own(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, 0.14, 32), new THREE.MeshLambertMaterial({ color: b.bgOutdoor ? 0xa8d98a : 0xd8d0c4 })));
      m.position.set(p.x, 0.07, p.z); m.receiveShadow = true; s.add(m);
    };
    R1.bcam = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 200);
    R1.bcam.position.set(0, 2.4, 6.5); R1.bcam.lookAt(0, 0.8, -3);
    R1.bcam.updateMatrixWorld();
    plat(POS.enemy.x, POS.enemy.y + 8, 1.6);
    plat(POS.player.x, POS.player.y + 12, 1.3);
    R1.bscene = s;
  }
  const t = performance.now() / 1000;
  R1.bcam.position.set(Math.sin(t * 0.3) * 0.08, 2.4 + Math.sin(t * 0.21) * 0.04, 6.5);
  R1.bcam.lookAt(0, 0.8, -3);
  R1.renderer.render(R1.bscene, R1.bcam);
}
// punto del suelo bajo una posición de la pantalla (0..1)
function groundPoint1(u, v) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(u * 2 - 1, -(v * 2 - 1)), R1.bcam);
  const p = new THREE.Vector3();
  ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p);
  return p;
}
