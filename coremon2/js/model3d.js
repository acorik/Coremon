// ============================================================
// COREMON — Modelos 3D compartidos (los usan el colegio y el mundo):
// personas chibi en 3D con andar animado y Coremon en 3D construidos a
// partir de las piezas del generador de sprites (elipses → volúmenes,
// polígonos → piezas extruidas), con sombreado cel y contorno, como en
// los juegos de Pokémon en 3D. Solo depende de THREE.
// ============================================================

const M3 = { geo: {}, toon: null, outlineMats: {} };

function m3shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = v => Math.max(0, Math.min(255, v + amt));
  return '#' + ((1 << 24) + (c(n >> 16) << 16) + (c((n >> 8) & 255) << 8) + c(n & 255)).toString(16).slice(1);
}
function m3hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// material cel (3 tonos) compartido
function m3toon() {
  if (M3.toon) return M3.toon;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const g = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  g.minFilter = g.magFilter = THREE.NearestFilter; g.needsUpdate = true;
  M3.grad = g;
  M3.toon = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: g });
  m3rim(M3.toon);
  return M3.toon;
}
// luz de borde (rim light): da volumen y brillo a los modelos, como en los juegos 3D de Pokémon
function m3rim(mat, k) {
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `float m3r = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 3.0);\noutgoingLight += m3r * ${(k || 0.32).toFixed(2)} * (0.6 + 0.4 * outgoingLight);\n#include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'rim' + (k || 0.32);
  return mat;
}
// contorno: casco invertido empujado por las normales
function m3outline(color, width) {
  const k = color + ':' + width;
  if (M3.outlineMats[k]) return M3.outlineMats[k];
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.BackSide });
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed += normal * ${width.toFixed(4)};`); };
  m.customProgramCacheKey = () => 'ol' + width.toFixed(4);
  return (M3.outlineMats[k] = m);
}
function m3part(geo, col, pos, scale, rot) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.deleteAttribute('uv');
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...(pos || [0, 0, 0])), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0, 0, 0]))), new THREE.Vector3(...(scale || [1, 1, 1])));
  g.applyMatrix4(m);
  const c = new THREE.Color(col), n = g.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
function m3merge(list) {
  let n = 0; list.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  list.forEach(g => {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count; g.dispose();
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  return geo;
}
const M3G = {};
function m3g() {
  if (M3G.sph) return M3G;
  M3G.sph = new THREE.SphereGeometry(1, 20, 14);
  M3G.sphLo = new THREE.SphereGeometry(1, 10, 8);
  M3G.hemi = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  M3G.torus = new THREE.TorusGeometry(1, 0.2, 6, 18);
  M3G.cyl = new THREE.CylinderGeometry(1, 1, 1, 10);
  M3G.cone = new THREE.ConeGeometry(1, 1, 10);
  M3G.box = new THREE.BoxGeometry(1, 1, 1);
  M3G.cap = new THREE.CapsuleGeometry(1, 1, 5, 14);
  return M3G;
}

// ---------------- PERSONAS ----------------
// look (formato del colegio o del mundo): skin, hair (short|long|spiky|bun|cap|bald|ponytail|curly|crest),
// hairColor, shirt, pants, shoes, skirt, robe, coat/labcoat, glasses, beard, tie, cap, corp
const SKINS3 = ['#f2c49b', '#e0ac69', '#c68642', '#ffdbac', '#8d5524', '#f6d8c4'];
function personParts3D(look) {
  const key = JSON.stringify(look);
  if (M3.geo['p:' + key]) return M3.geo['p:' + key];
  const G = m3g();
  const h = m3hash(key);
  const skin = look.skin || SKINS3[h % 2 === 0 ? 0 : 3];
  const hair = look.hairColor || '#3b2416', shirt = look.shirt || '#1f3b73', pants = look.pants || '#33334a', shoes = look.shoes || '#212121';
  const iris = look.eyes || ['#4e342e', '#2e5d9f', '#3b7a3b', '#6d4c41', '#1d1a26'][h % 5];
  const coat = look.coat || look.labcoat;
  const sleeve = coat ? '#f5f5f5' : look.hoodie ? shirt : m3shade(shirt, -10);
  const body = [], legL = [], legR = [], armL = [], armR = [];
  // ---- piernas (pivote en la cadera, y = 0.47) ----
  const leg = (arr, x) => {
    arr.push(m3part(G.cap, look.skirt ? skin : pants, [x, -0.2, 0], [0.075, 0.14, 0.075]));
    if (!look.skirt) arr.push(m3part(G.cyl, m3shade(pants, -12), [x, -0.36, 0], [0.082, 0.05, 0.082]));        // bajo del pantalón
    arr.push(m3part(G.box, shoes, [x, -0.425, 0.035], [0.13, 0.07, 0.21]));                                         // zapatilla
    arr.push(m3part(G.box, '#f5f5f5', [x, -0.462, 0.035], [0.135, 0.022, 0.215]));                                   // suela
    arr.push(m3part(G.box, m3shade(shoes, 40), [x, -0.39, 0.11], [0.07, 0.015, 0.06]));                              // cordones
  };
  leg(legL, 0.09); leg(legR, -0.09);
  // ---- tronco ----
  if (look.robe) body.push(m3part(G.cone, shirt, [0, 0.55, 0], [0.28, 0.82, 0.24]));
  body.push(m3part(G.cap, shirt, [0, 0.69, 0], [0.18, 0.13, 0.135]));
  body.push(m3part(G.sph, shirt, [0, 0.82, 0], [0.22, 0.07, 0.15]));                                                 // hombros
  if (look.skirt) body.push(m3part(G.cone, pants, [0, 0.5, 0], [0.22, 0.26, 0.18]));
  else { body.push(m3part(G.cap, pants, [0, 0.5, 0], [0.175, 0.04, 0.13])); body.push(m3part(G.box, '#3e2723', [0, 0.56, 0], [0.36, 0.035, 0.27])); body.push(m3part(G.box, '#ffd54f', [0, 0.56, 0.135], [0.05, 0.03, 0.01])); }
  // cuello de la camisa en V
  body.push(m3part(G.box, look.collar || (look.tie ? '#fafafa' : m3shade(shirt, 25)), [0.045, 0.845, 0.11], [0.07, 0.035, 0.03], [0, 0, -0.5]));
  body.push(m3part(G.box, look.collar || (look.tie ? '#fafafa' : m3shade(shirt, 25)), [-0.045, 0.845, 0.11], [0.07, 0.035, 0.03], [0, 0, 0.5]));
  if (!coat && !look.robe) { body.push(m3part(G.box, m3shade(shirt, -18), [0.08, 0.7, 0.13], [0.07, 0.06, 0.01])); }   // bolsillo
  if (coat) { body.push(m3part(G.box, '#f5f5f5', [0.12, 0.62, 0.03], [0.1, 0.5, 0.28])); body.push(m3part(G.box, '#f5f5f5', [-0.12, 0.62, 0.03], [0.1, 0.5, 0.28])); body.push(m3part(G.box, '#e0e0e0', [0.12, 0.62, 0.17], [0.02, 0.46, 0.01])); }
  if (look.hoodie) body.push(m3part(G.hemi, m3shade(shirt, -15), [0, 0.86, -0.1], [0.17, 0.12, 0.12], [-1.4, 0, 0]));
  if (look.tie) { body.push(m3part(G.box, look.tie, [0, 0.72, 0.14], [0.045, 0.2, 0.02])); body.push(m3part(G.box, look.tie, [0, 0.82, 0.14], [0.06, 0.04, 0.025])); }
  if (look.corp) { body.push(m3part(G.sph, '#e53935', [-0.09, 0.76, 0.14], [0.04, 0.04, 0.015])); body.push(m3part(G.sph, '#fafafa', [-0.09, 0.76, 0.152], [0.015, 0.015, 0.005])); }
  if (look.backpack) {                                                                                              // mochila de entrenador
    const bp = look.backpack === true ? '#e53935' : look.backpack;
    body.push(m3part(G.cap, bp, [0, 0.7, -0.17], [0.15, 0.1, 0.09]));
    body.push(m3part(G.box, m3shade(bp, -25), [0, 0.64, -0.255], [0.18, 0.12, 0.03]));
    body.push(m3part(G.box, '#ffd54f', [0, 0.66, -0.272], [0.05, 0.03, 0.01]));
    for (const s of [-1, 1]) body.push(m3part(G.box, m3shade(bp, -35), [s * 0.11, 0.72, 0.02], [0.035, 0.3, 0.3], [0, 0, 0]));
  }
  // cuello
  body.push(m3part(G.cyl, skin, [0, 0.9, 0], [0.055, 0.07, 0.055]));
  // ---- cabeza ----
  const HY = 1.13, HR = 0.25;
  body.push(m3part(G.sph, skin, [0, HY, 0], [HR, HR * 0.97, HR * 0.94]));
  body.push(m3part(G.sph, skin, [0, HY - 0.1, 0.05], [HR * 0.78, HR * 0.55, HR * 0.8]));                            // mandíbula
  for (const s of [-1, 1]) body.push(m3part(G.sph, m3shade(skin, -8), [s * HR * 0.97, HY - 0.01, 0], [0.035, 0.055, 0.03]));   // orejas
  // ojos de anime: blanco, iris, pupila y dos brillos
  for (const s of [-1, 1]) {
    const ex = s * 0.088, ey = HY - 0.005, ez = HR * 0.86;
    body.push(m3part(G.sph, '#ffffff', [ex, ey, ez], [0.048, 0.062, 0.028]));
    body.push(m3part(G.sph, iris, [ex, ey - 0.006, ez + 0.012], [0.036, 0.05, 0.022]));
    body.push(m3part(G.sph, '#120d18', [ex, ey - 0.008, ez + 0.02], [0.019, 0.028, 0.016]));
    body.push(m3part(G.sph, '#ffffff', [ex - s * 0.012, ey + 0.02, ez + 0.03], [0.012, 0.013, 0.008]));
    body.push(m3part(G.sph, '#ffffff', [ex + s * 0.012, ey - 0.022, ez + 0.03], [0.006, 0.006, 0.005]));
    body.push(m3part(G.box, m3shade(hair, -10), [ex, ey + 0.075, ez + 0.01], [0.06, 0.014, 0.02], [0, 0, s * -0.12]));   // ceja
    body.push(m3part(G.sph, '#ff8a80', [s * 0.15, HY - 0.07, HR * 0.78], [0.032, 0.016, 0.01]));                          // rubor
  }
  body.push(m3part(G.sph, m3shade(skin, -14), [0, HY - 0.05, HR * 0.95], [0.018, 0.016, 0.014]));                           // nariz
  body.push(m3part(G.box, '#8a3b3b', [0, HY - 0.12, HR * 0.86], [0.05, 0.014, 0.012]));                                      // boca
  if (look.glasses) {
    const gc = look.glassesColor || '#1d1a26';
    for (const s of [-1, 1]) body.push(m3part(new THREE.TorusGeometry(0.058, 0.01, 5, 16), gc, [s * 0.088, HY - 0.005, HR * 0.95], [1, 1, 1]));
    body.push(m3part(G.box, gc, [0, HY + 0.005, HR * 0.95], [0.06, 0.012, 0.012]));
  }
  if (look.beard) body.push(m3part(G.sph, look.beardColor || hair, [0, HY - 0.14, HR * 0.5], [0.19, 0.12, 0.15]));
  // ---- pelo por capas ----
  const st = look.hair || 'short';
  const tuft = (x, y, z, sx, sy, sz, rx, rz, c) => body.push(m3part(G.sph, c || hair, [x, y, z], [sx, sy, sz], [rx || 0, 0, rz || 0]));
  if (st === 'bald') { body.push(m3part(G.sph, hair, [0, HY - 0.03, -0.06], [HR * 1.02, HR * 0.55, HR * 0.92])); }
  else if (st === 'cap') {
    const cc = typeof look.cap === 'string' ? look.cap : '#c62828';
    body.push(m3part(G.sph, hair, [0, HY - 0.04, -0.06], [HR * 1.03, HR * 0.75, HR * 0.95]));
    tuft(0.12, HY - 0.02, 0.12, 0.06, 0.07, 0.05, 0, 0.3); tuft(-0.12, HY - 0.02, 0.12, 0.06, 0.07, 0.05, 0, -0.3);
    body.push(m3part(G.hemi, cc, [0, HY + 0.03, 0], [HR * 1.08, HR * 0.95, HR * 1.08]));
    body.push(m3part(G.hemi, '#fafafa', [0, HY + 0.03, 0.002], [HR * 1.085, HR * 0.4, HR * 1.085], [0, Math.PI / 2, 0]));
    body.push(m3part(G.box, m3shade(cc, -25), [0, HY + 0.05, HR * 0.98], [HR * 1.3, 0.025, 0.24]));
    body.push(m3part(G.sph, '#fafafa', [0, HY + 0.14, HR * 0.85], [0.05, 0.05, 0.02]));
    body.push(m3part(G.sph, cc, [0, HY + 0.14, HR * 0.87], [0.03, 0.03, 0.015]));
  } else {
    body.push(m3part(G.hemi, hair, [0, HY + 0.015, -0.01], [HR * 1.09, HR * 1.07, HR * 1.09]));
    body.push(m3part(G.sph, hair, [0, HY - 0.04, -0.08], [HR * 1.04, HR * 0.86, HR * 0.92]));
    // flequillo en mechones
    for (let i = -2; i <= 2; i++) tuft(i * 0.075, HY + 0.13 - Math.abs(i) * 0.02, HR * 0.78, 0.065, 0.085, 0.05, 0.3, i * 0.18);
    for (const s of [-1, 1]) tuft(s * HR * 0.92, HY + 0.02, 0.05, 0.05, 0.11, 0.06, 0, s * 0.15);   // patillas
    if (st === 'long') { body.push(m3part(G.cap, hair, [0, HY - 0.2, -0.12], [0.2, 0.18, 0.09])); for (const s of [-1, 1]) body.push(m3part(G.cap, hair, [s * 0.2, HY - 0.16, 0.02], [0.06, 0.15, 0.06])); }
    if (st === 'ponytail') { body.push(m3part(G.sph, look.tie || '#e53935', [0, HY + 0.02, -0.25], [0.04, 0.04, 0.03])); body.push(m3part(G.cap, hair, [0, HY - 0.12, -0.3], [0.07, 0.14, 0.07], [0.45, 0, 0])); }
    if (st === 'bun') { body.push(m3part(G.sph, hair, [0, HY + 0.28, -0.07], [0.1, 0.09, 0.1])); body.push(m3part(G.torus, m3shade(hair, 30), [0, HY + 0.22, -0.06], [0.07, 0.07, 0.07], [Math.PI / 2, 0, 0])); }
    if (st === 'spiky') for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.2; body.push(m3part(G.cone, hair, [Math.sin(a) * 0.17, HY + 0.2 + Math.cos(a) * 0.04, -0.04 - Math.cos(a) * 0.03], [0.065, 0.2, 0.065], [-0.35, 0, -a * 0.7])); }
    if (st === 'curly') for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; tuft(Math.cos(a) * 0.19, HY + 0.12 + Math.sin(a * 3) * 0.03, Math.sin(a) * 0.19 - 0.04, 0.095, 0.095, 0.095); }
    if (st === 'crest') body.push(m3part(G.cone, hair, [0, HY + 0.3, 0], [0.07, 0.22, 0.13]));
  }
  // ---- brazos (pivote en el hombro, y = 0.82) ----
  const arm = (arr, x) => {
    arr.push(m3part(G.sph, sleeve, [x, -0.02, 0], [0.07, 0.07, 0.07]));
    arr.push(m3part(G.cap, sleeve, [x, -0.14, 0], [0.058, 0.1, 0.058]));
    arr.push(m3part(G.cap, coat ? '#f5f5f5' : skin, [x, -0.29, 0], [0.05, 0.06, 0.05]));
    arr.push(m3part(G.sph, skin, [x, -0.38, 0.01], [0.058, 0.06, 0.058]));
  };
  arm(armL, 0.235); arm(armR, -0.235);
  const out = { body: m3merge(body), legL: m3merge(legL), legR: m3merge(legR), armL: m3merge(armL), armR: m3merge(armR), outline: m3shade(hair, -30) };
  M3.geo['p:' + key] = out;
  return out;
}
// figura animable: group con .userData.parts para animar
function makePerson3D(look, scale) {
  const p = personParts3D(look), mat = m3toon();
  const g = new THREE.Group(), inner = new THREE.Group();
  g.add(inner);
  const mk = (geo, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y || 0; m.castShadow = true; m.receiveShadow = false; inner.add(m); return m; };
  const body = mk(p.body), legL = mk(p.legL, 0.47), legR = mk(p.legR, 0.47), armL = mk(p.armL, 0.82), armR = mk(p.armR, 0.82);
  const ol = new THREE.Mesh(p.body, m3outline('#1d1a26', 0.01)); inner.add(ol);
  for (const lm of [legL, legR, armL, armR]) { const o2 = new THREE.Mesh(lm.geometry, m3outline('#1d1a26', 0.008)); lm.add(o2); }
  inner.scale.setScalar(scale || 1);
  g.userData.anim = { inner, body, legL, legR, armL, armR, ol, yaw: 0 };
  return g;
}
const DIR_YAW = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 };
// phase: avance del paso; moving: si camina; dt en ms; yawTarget en radianes
function animatePerson3D(g, moving, phase, yawTarget, dt, opts) {
  const a = g.userData.anim; if (!a) return;
  let d = yawTarget - a.yaw;
  while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
  a.yaw += d * Math.min(1, dt / 90);
  a.inner.rotation.y = a.yaw;
  const sw = moving ? Math.sin(phase) : 0, amp = opts && opts.run ? 0.9 : 0.6;
  a.legL.rotation.x = sw * amp; a.legR.rotation.x = -sw * amp;
  a.armL.rotation.x = -sw * amp * 0.8; a.armR.rotation.x = sw * amp * 0.8;
  a.armL.rotation.z = 0.08; a.armR.rotation.z = -0.08;
  const bob = moving ? Math.abs(Math.cos(phase)) * 0.03 : Math.sin(performance.now() / 600) * 0.006;
  a.inner.position.y = bob;
  if (opts && opts.seated) { a.legL.rotation.x = a.legR.rotation.x = -1.2; a.armL.rotation.x = a.armR.rotation.x = -0.9; }
  if (opts && opts.aim) { a.armR.rotation.x = -1.5; }
}

// ---------------- COREMON EN 3D ----------------
// parts: [{ kind:'e'|'p'|'ring', x, y, rx, ry, rot, pts, w, role, color }] en una rejilla 64×64
const FLAT3 = { eyeW: 1, pupil: 1, shine: 1, mouth: 1, glow: 1, screen: 1, iris: 1 };
function creatureGeo3D(id, parts, outlineCol) {
  if (M3.geo['c:' + id]) return M3.geo['c:' + id];
  const G = m3g(), U = 1 / 64, list = [], placed = [];
  const inside = (q, x, y) => {
    if (q.kind === 'ring') return false;
    const c = Math.cos(-(q.rot || 0)), s = Math.sin(-(q.rot || 0)), dx = x - q.x, dy = y - q.y;
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    const v = (lx / q.rx) ** 2 + (ly / q.ry) ** 2;
    return v < 1 ? v : -1;
  };
  // iris de color (el del acento de la criatura) entre el blanco del ojo y la pupila
  const irisC = (parts.find(p => p.role === 'acc') || {}).color || '#5c6bc0';
  const P2 = [];
  parts.forEach(p => {
    if (p.role === 'pupil' && p.kind === 'e') P2.push(Object.assign({}, p, { role: 'iris', color: irisC, rx: p.rx * 1.25, ry: p.ry * 1.2 }));
    P2.push(p);
    if (p.role === 'shine' && p.kind === 'e') P2.push(Object.assign({}, p, { x: p.x + p.rx * 2.6, y: p.y + p.ry * 3, rx: p.rx * 0.55, ry: p.ry * 0.55 }));
  });
  parts = P2;
  parts.forEach((p, i) => {
    const flat = FLAT3[p.role] || p.role === 'iris';
    const m = Math.min(p.rx, p.ry);
    let rz = flat ? Math.max(0.6, m * 0.3) : p.role === 'belly' ? m * 0.45 : (p.role === 'body' ? (p.rx + p.ry) / 2 * 0.78 : m * 0.75);
    // se apoya sobre la última pieza que tiene debajo (ojos sobre la cabeza, tripa sobre el cuerpo...)
    let z = 0;
    for (let j = placed.length - 1; j >= 0; j--) {
      const q = placed[j];
      if (q.p.kind === 'ring' || (!flat && FLAT3[q.p.role])) continue;
      const v = inside(q.p, p.x, p.y);
      if (v >= 0) { z = q.z + q.rz * Math.sqrt(Math.max(0, 1 - v)) * (flat ? 0.92 : 0.55); break; }
    }
    const X = (p.x - 32) * U, Y = (61 - p.y) * U, Z = z * U;
    if (p.kind === 'e') {
      if (p.rx < 0.4 || p.ry < 0.4) return;
      list.push(m3part(G.sph, p.color, [X, Y, Z], [p.rx * U, p.ry * U, rz * U], [0, 0, -(p.rot || 0)]));
    } else if (p.kind === 'ring') {
      list.push(m3part(new THREE.TorusGeometry(1, Math.max(0.6, p.w) * 0.5 / p.rx, 6, 28), p.color, [X, Y, Z], [p.rx * U, p.rx * U, p.rx * U], [Math.PI / 2, 0, 0]));
      rz = 0;
    } else {
      const sh = new THREE.Shape();
      p.pts.forEach(([x, y], j) => { const px = (x - p.x) * U, py = (p.y - y) * U; j ? sh.lineTo(px, py) : sh.moveTo(px, py); });
      const depth = Math.max(1.2, Math.min(9, m * (flat ? 0.3 : 0.7))) * U;
      const bev = Math.min(m * 0.18, 2.2) * U;
      const eg = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: !flat, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 4 });
      eg.translate(0, 0, -depth / 2);
      list.push(m3part(eg, p.color, [X, Y, Z], [1, 1, 1]));
      rz = depth / U / 2 + 0.5;
    }
    placed.push({ p, z, rz });
  });
  const geo = m3merge(list);
  geo.computeBoundingBox();
  // sombreado por volumen: más oscuro abajo, como si le diera la luz desde arriba
  const bb = geo.boundingBox, hh = Math.max(0.01, bb.max.y - bb.min.y), pa = geo.attributes.position, ca = geo.attributes.color;
  for (let i = 0; i < pa.count; i++) { const k = 0.72 + 0.28 * Math.min(1, (pa.getY(i) - bb.min.y) / hh * 1.5); ca.setXYZ(i, ca.getX(i) * k, ca.getY(i) * k, ca.getZ(i) * k); }
  const out = { geo, outline: outlineCol || '#1d1a26', height: geo.boundingBox.max.y };
  M3.geo['c:' + id] = out;
  return out;
}
function makeCreature3D(id, parts, outlineCol, size) {
  const c = creatureGeo3D(id, parts, outlineCol);
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const mat = m3rim(m3toon().clone(), 0.4);
  mat.emissive = new THREE.Color(0xffffff); mat.emissiveIntensity = 0;
  const m = new THREE.Mesh(c.geo, mat); m.castShadow = true; inner.add(m);
  const olm = m3outline(c.outline, 0.012).clone();
  const ol = new THREE.Mesh(c.geo, olm); inner.add(ol);
  const s = (size || 1);
  inner.scale.setScalar(s);
  g.userData.anim = { inner, mesh: m, ol, mat, olm, base: s };
  return g;
}
// white 0..1 (destello), alpha 0..1, bob en unidades
function styleCreature3D(g, white, alpha) {
  const a = g.userData.anim; if (!a) return;
  a.mat.emissiveIntensity = white || 0;
  const tr = alpha < 0.999;
  if (a.mat.transparent !== tr) { a.mat.transparent = tr; a.olm.transparent = tr; a.mat.needsUpdate = true; a.olm.needsUpdate = true; }
  a.mat.opacity = alpha; a.olm.opacity = alpha;
  a.ol.visible = alpha > 0.6;
}
