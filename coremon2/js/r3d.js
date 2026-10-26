// ============================================================
// COREMON 2 — Motor 3D (Three.js, estilo HD-2D): terreno con relieve,
// montañas, agua, árboles y edificios en 3D, personajes pixel-art de pie,
// sol con sombras, noche con farolas, clima y combates en una arena 3D.
// Si el dispositivo no tiene WebGL, el juego usa el dibujado 2D.
// 1 unidad 3D = 1 casilla. x → este, z → sur, y → arriba.
// ============================================================

const R3 = { ok: false, chunks: new Map(), actors: new Map(), items: new Map(), mapId: null, lights: [], nightMats: [], glowMats: [], uTime: { value: 0 } };
const U3 = 1 / TS;

// ---------------- ARRANQUE ----------------
function init3D() {
  if (typeof THREE === 'undefined' || /[?&]2d\b/.test(location.search)) return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.id = 'gl';
    document.body.insertBefore(canvas, cv);
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    if (!r.getContext()) return false;
    r.useLegacyLights = true;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    R3.renderer = r;
    R3.mobile = isTouch();
    R3.aniso = Math.min(8, r.capabilities.getMaxAnisotropy());
    R3.scene = new THREE.Scene();
    R3.world = new THREE.Group(); R3.scene.add(R3.world);
    R3.dyn = new THREE.Group(); R3.scene.add(R3.dyn);
    R3.cam = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    R3.camT = null;
    // luces
    R3.hemi = new THREE.HemisphereLight(0xdfefff, 0x6b5a3a, 0.6);
    R3.sun = new THREE.DirectionalLight(0xfff4e0, 0.8);
    R3.sun.castShadow = true;
    const sz = R3.mobile ? 1024 : 2048;
    R3.sun.shadow.mapSize.set(sz, sz);
    const sc = R3.sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80;
    R3.sun.shadow.bias = -0.0006; R3.sun.shadow.normalBias = 0.03;
    R3.scene.add(R3.hemi, R3.sun, R3.sun.target);
    for (let i = 0; i < (R3.mobile ? 4 : 6); i++) { const l = new THREE.PointLight(0xffd080, 0, 7, 2); R3.scene.add(l); R3.lights.push(l); }
    R3.scene.fog = new THREE.Fog(0x8fd3ff, 30, 60);
    R3.scene.background = new THREE.Color(0x8fd3ff);
    R3.skyCol = new THREE.Color(0x8fd3ff);
    buildSharedAssets();
    resize3D();
    window.addEventListener('resize', resize3D);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); R3.ok = false; });
    R3.ok = true;
    return true;
  } catch (e) {
    console.warn('3D no disponible, se usa 2D:', e);
    const c = document.getElementById('gl'); if (c) c.remove();
    R3.ok = false;
    return false;
  }
}
// calidad adaptativa: si el dispositivo no llega a ~30 fps, baja la resolución y luego las sombras
const PERF = { acc: 0, n: 0, scale: 1, shadows: true };
function perfTick() {
  const t = performance.now(), dt = PERF.last ? t - PERF.last : 0; PERF.last = t;
  if (document.hidden || !dt || dt > 250 || /[?&]hq\b/.test(location.search)) return;   // pestaña oculta, tirón puntual o calidad fija
  PERF.acc += dt; PERF.n++;
  if (PERF.n < 90) return;
  const avg = PERF.acc / PERF.n; PERF.acc = 0; PERF.n = 0;
  if (avg > 36) {
    if (PERF.scale > 0.6) { PERF.scale = Math.max(0.6, PERF.scale - 0.15); resize3D(); }
    else if (PERF.shadows) { PERF.shadows = false; R3.renderer.shadowMap.enabled = false; R3.scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); }
  } else if (avg < 20 && PERF.scale < 1) { PERF.scale = Math.min(1, PERF.scale + 0.1); resize3D(); }
}
function resize3D() {
  if (!R3.renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  R3.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, R3.mobile ? 1.6 : 2) * PERF.scale);
  R3.renderer.setSize(w, h, false);
  const portrait = h > w * 1.05;
  R3.cam.fov = portrait ? 38 : 28;
  R3.cam.aspect = w / h; R3.cam.updateProjectionMatrix();
  if (R3.bcam) { R3.bcam.aspect = w / h; R3.bcam.fov = portrait ? 62 : 42; R3.bcam.updateProjectionMatrix(); }
}

// ---------------- UTILIDADES ----------------
function tex3(src, o) {
  o = o || {};
  const t = new THREE.CanvasTexture(src);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = o.smooth ? THREE.LinearFilter : THREE.NearestFilter;
  t.minFilter = o.mip === false ? (o.smooth ? THREE.LinearFilter : THREE.NearestFilter) : THREE.NearestMipmapLinearFilter;
  if (o.mip === false) t.generateMipmaps = false;
  t.anisotropy = R3.aniso;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function cnv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
const C3 = hex => new THREE.Color(hex);

// pieza de modelo: geometría + color + transformación, sin índices (sombreado plano)
function part(geo, col, x, y, z, sx, sy, sz, ry, rx, rz) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x || 0, y || 0, z || 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz));
  g.applyMatrix4(m);
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), c = C3(col);
  for (let i = 0; i < n; i += 3) {
    const j = 1 + (hash2(i, n, 7) - 0.5) * 0.12;           // pequeña variación por cara
    for (let k = 0; k < 3 && i + k < n; k++) { arr[(i + k) * 3] = c.r * j; arr[(i + k) * 3 + 1] = c.g * j; arr[(i + k) * 3 + 2] = c.b * j; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
function mergeParts(list) {
  let n = 0; list.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  list.forEach(g => { pos.set(g.attributes.position.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

// ---------------- RECURSOS COMPARTIDOS ----------------
const MODELS = {};
function buildSharedAssets() {
  const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, s) => new THREE.CylinderGeometry(a, b, 1, s || 7), ICO = new THREE.IcosahedronGeometry(1, 0),
    CONE = s => new THREE.ConeGeometry(1, 1, s || 7), DOD = new THREE.DodecahedronGeometry(1, 0), OCT = new THREE.OctahedronGeometry(1, 0), SPH = new THREE.SphereGeometry(1, 8, 6);
  const M = (std, glow, opt) => Object.assign({ std: std ? mergeParts(std) : null, glow: glow ? mergeParts(glow) : null }, opt || {});
  const oak = (leaf, s) => M([
    part(CYL(0.11, 0.16), '#6d4c2a', 0, 0.5 * s, 0, s, 1.0 * s, s),
    part(ICO, shade(leaf, -14), 0, 1.35 * s, 0, 0.66 * s, 0.6 * s, 0.66 * s),
    part(ICO, leaf, -0.34 * s, 1.2 * s, 0.14 * s, 0.44 * s),
    part(ICO, leaf, 0.36 * s, 1.26 * s, -0.08 * s, 0.42 * s),
    part(ICO, shade(leaf, 16), 0.04 * s, 1.78 * s, 0.06 * s, 0.4 * s)
  ], null, { rot: true, vary: true });
  MODELS.oak = oak('#3f8f3a', 1); MODELS.oak2 = oak('#2f7a3a', 1.05); MODELS.autumn = oak('#d9862a', 1); MODELS.giant = oak('#2f6b33', 1.7);
  const pine = snow => M([
    part(CYL(0.08, 0.11), '#5d4037', 0, 0.3, 0, 1, 0.6, 1),
    part(CONE(), snow ? '#2f5d4a' : '#2f6b3a', 0, 0.95, 0, 0.66, 0.85, 0.66),
    part(CONE(), snow ? '#335f4c' : '#357a40', 0, 1.42, 0, 0.52, 0.75, 0.52),
    part(CONE(), snow ? '#2f5d4a' : '#2f6b3a', 0, 1.86, 0, 0.36, 0.62, 0.36)
  ].concat(snow ? [part(CONE(), '#f2f6fb', 0, 1.2, 0, 0.5, 0.3, 0.5), part(CONE(), '#f2f6fb', 0, 1.62, 0, 0.38, 0.3, 0.38), part(CONE(), '#ffffff', 0, 2.08, 0, 0.24, 0.24, 0.24)] : []), null, { rot: true, vary: true });
  MODELS.pine = pine(false); MODELS.snowpine = pine(true);
  MODELS.bush = M([part(ICO, '#3d8a3a', -0.16, 0.26, 0, 0.3), part(ICO, '#4c9c45', 0.17, 0.27, 0.04, 0.3), part(ICO, '#5fb253', 0, 0.44, -0.02, 0.26)], null, { rot: true, vary: true });
  MODELS.rock = M([part(DOD, '#8a8580', 0, 0.16, 0, 0.42, 0.3, 0.36)], null, { rot: true, vary: true });
  MODELS.bigrock = M([part(DOD, '#7d776f', 0, 0.3, 0, 0.78, 0.55, 0.6), part(DOD, '#8d877f', 0.42, 0.18, 0.12, 0.36, 0.3, 0.3)], null, { rot: true, vary: true });
  MODELS.lavarock = M([part(DOD, '#3b3230', 0, 0.16, 0, 0.42, 0.3, 0.36)], [part(OCT, '#ff7b29', 0.1, 0.36, 0.05, 0.08)], { rot: true, vary: true });
  MODELS.cactus = M([part(CYL(0.13, 0.15), '#4f8f3a', 0, 0.6, 0, 1, 1.2, 1), part(CYL(0.08, 0.08), '#4f8f3a', -0.25, 0.6, 0, 1, 0.5, 1), part(CYL(0.08, 0.08), '#4f8f3a', -0.16, 0.36, 0, 1, 0.22, 1, 0, 0, Math.PI / 2), part(CYL(0.08, 0.08), '#5aa045', 0.24, 0.78, 0, 1, 0.4, 1), part(CYL(0.08, 0.08), '#5aa045', 0.15, 0.6, 0, 1, 0.2, 1, 0, 0, Math.PI / 2)], null, { rot: true, vary: true });
  MODELS.crystal = M(null, [part(OCT, '#9fe4ff', 0, 0.5, 0, 0.2, 0.5, 0.2), part(OCT, '#c4b5fd', -0.22, 0.3, 0.1, 0.13, 0.3, 0.13, 0, 0, 0.4), part(OCT, '#7dd3fc', 0.22, 0.28, -0.05, 0.12, 0.28, 0.12, 0, 0, -0.4)], { rot: true, vary: true, glowAlways: true });
  MODELS.mush = M([part(CYL(0.07, 0.09), '#efe6d0', 0, 0.16, 0, 1, 0.32, 1), part(new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#c62828', 0, 0.3, 0, 0.26, 0.18, 0.26)], null, { rot: true, vary: true });
  MODELS.stump = M([part(CYL(0.28, 0.32, 9), '#7a5230', 0, 0.16, 0, 1, 0.32, 1), part(CYL(0.26, 0.26, 9), '#c99a5c', 0, 0.33, 0, 1, 0.02, 1)], null, { rot: true });
  MODELS.lamp = M([part(CYL(0.04, 0.06), '#37474f', 0, 0.85, 0, 1, 1.7, 1), part(BOX, '#263238', 0, 0.05, 0, 0.22, 0.1, 0.22), part(BOX, '#263238', 0, 1.82, 0, 0.26, 0.06, 0.26)], [part(BOX, '#ffe08a', 0, 1.7, 0, 0.18, 0.2, 0.18)]);
  MODELS.torch = M([part(CYL(0.05, 0.06), '#5d4037', 0, 0.45, 0, 1, 0.9, 1)], [part(OCT, '#ff8f1f', 0, 1.02, 0, 0.13, 0.2, 0.13), part(OCT, '#ffd54f', 0, 1.0, 0, 0.07, 0.12, 0.07)], { glowAlways: true });
  MODELS.bench = M([part(BOX, '#a1887f', 0, 0.38, 0.05, 1.3, 0.07, 0.36), part(BOX, '#8d6e63', 0, 0.62, -0.13, 1.3, 0.3, 0.06), part(BOX, '#4e342e', -0.55, 0.18, 0.05, 0.08, 0.36, 0.3), part(BOX, '#4e342e', 0.55, 0.18, 0.05, 0.08, 0.36, 0.3)]);
  MODELS.fence = M([part(BOX, '#8d6e63', -0.4, 0.3, 0, 0.1, 0.6, 0.1), part(BOX, '#8d6e63', 0.4, 0.3, 0, 0.1, 0.6, 0.1), part(BOX, '#b0896a', 0, 0.42, 0, 1, 0.08, 0.06), part(BOX, '#b0896a', 0, 0.22, 0, 1, 0.08, 0.06)]);
  MODELS.statue = M([part(BOX, '#9e9e9e', 0, 0.25, 0, 0.85, 0.5, 0.85), part(BOX, '#bdbdbd', 0, 0.52, 0, 0.9, 0.06, 0.9), part(CYL(0.2, 0.28), '#b0bec5', 0, 0.95, 0, 1, 0.8, 1), part(SPH, '#b0bec5', 0, 1.5, 0, 0.22)], [part(new THREE.TorusGeometry(1, 0.12, 4, 16), '#ffd54f', 0, 1.82, 0, 0.2, 0.2, 0.2, 0, Math.PI / 2)]);
  MODELS.fountain = M([part(CYL(1.0, 1.05, 16), '#90a4ae', 0, 0.18, 0, 1, 0.36, 1), part(CYL(0.12, 0.14, 8), '#b0bec5', 0, 0.7, 0, 1, 1.0, 1), part(CYL(0.4, 0.3, 12), '#b0bec5', 0, 1.15, 0, 1, 0.12, 1)], [part(CYL(0.92, 0.92, 16), '#4fa3e0', 0, 0.37, 0, 1, 0.02, 1), part(CYL(0.34, 0.34, 12), '#7cc4f0', 0, 1.22, 0, 1, 0.02, 1)], { glowAlways: true });
  MODELS.gymblock = M([part(BOX, '#ffffff', 0, 0.48, 0, 1, 0.96, 0.46), part(BOX, '#e6e6e6', 0, 0.97, 0, 1.02, 0.06, 0.48)], null, { tint: true });
  MODELS.counter = M([part(BOX, '#c62828', 0, 0.45, 0, 3, 0.9, 0.44), part(BOX, '#ef5350', 0, 0.92, 0, 3.04, 0.06, 0.5)]);
  MODELS.table = M([part(BOX, '#a0703c', 0, 0.7, 0, 1.8, 0.08, 0.9), part(BOX, '#6d4c2a', -0.8, 0.34, -0.35, 0.08, 0.68, 0.08), part(BOX, '#6d4c2a', 0.8, 0.34, -0.35, 0.08, 0.68, 0.08), part(BOX, '#6d4c2a', -0.8, 0.34, 0.35, 0.08, 0.68, 0.08), part(BOX, '#6d4c2a', 0.8, 0.34, 0.35, 0.08, 0.68, 0.08)]);
  MODELS.crate = M([part(BOX, '#a0703c', 0, 0.4, 0, 0.8, 0.8, 0.8), part(BOX, '#7a5230', 0, 0.4, 0.41, 0.82, 0.08, 0.02), part(BOX, '#7a5230', 0, 0.4, -0.41, 0.82, 0.08, 0.02)]);
  MODELS.plant = M([part(CYL(0.2, 0.15, 8), '#8d5a2b', 0, 0.18, 0, 1, 0.36, 1), part(ICO, '#3d8a3a', 0, 0.62, 0, 0.32), part(ICO, '#5fb253', 0.12, 0.8, 0.05, 0.18)]);
  MODELS.shelf = M([part(BOX, '#8d6e63', 0, 0.8, 0, 2, 1.6, 0.4), part(BOX, '#5d4037', 0, 0.45, 0.12, 1.84, 0.34, 0.2), part(BOX, '#5d4037', 0, 0.95, 0.12, 1.84, 0.34, 0.2)].concat([...Array(6)].map((_, i) => part(BOX, ['#e53935', '#42a5f5', '#ffd54f', '#66bb6a'][i % 4], -0.75 + i * 0.3, 0.5 + (i % 2) * 0.5, 0.15, 0.2, 0.26, 0.16))));
  MODELS.barrier = M([part(BOX, '#1d1a26', -0.44, 0.45, 0, 0.12, 0.9, 0.12), part(BOX, '#1d1a26', 0.44, 0.45, 0, 0.12, 0.9, 0.12)].concat([0, 1, 2, 3].map(i => part(BOX, i % 2 ? '#fafafa' : '#e53935', -0.375 + i * 0.25, 0.66, 0, 0.25, 0.2, 0.06))), [part(BOX, '#ff5252', -0.44, 0.95, 0, 0.1, 0.08, 0.1), part(BOX, '#ff5252', 0.44, 0.95, 0, 0.1, 0.08, 0.1)], { glowAlways: true });

  // materiales
  R3.matStd = new THREE.MeshLambertMaterial({ vertexColors: true });
  R3.matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });
  R3.matGlowNight = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0x777777 });
  // hierba alta en 3D (se mueve con el viento)
  const blade = cnv(16, 16, g => { for (let i = 0; i < 7; i++) { const x = 1 + i * 2.1, h = 9 + (i * 5) % 7; g.fillStyle = i % 2 ? '#ffffff' : '#d8d8d8'; g.fillRect(x, 16 - h, 2, h); g.fillStyle = '#f4f4f4'; g.fillRect(x, 16 - h, 1, 2); } });
  R3.grassMat = new THREE.MeshLambertMaterial({ map: tex3(blade, { mip: false }), alphaTest: 0.5, side: THREE.DoubleSide });
  R3.grassMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = R3.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat sw = sin(uTime * 2.2 + instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.6);\ntransformed.x += sw * 0.07 * position.y * 2.2;\n#endif');
  };
  const gq = new THREE.PlaneGeometry(0.62, 0.42); gq.translate(0, 0.21, 0);
  const gq2 = gq.clone(); gq2.rotateY(Math.PI / 2);
  const gq3 = gq.clone(); gq3.rotateY(Math.PI / 4);
  R3.grassGeo = mergeGeosSimple([gq, gq2, gq3]);
  // agua y lava
  const wcv = cnv(64, 64, g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 26; i++) { const x = hash2(i, 1, 3) * 64, y = hash2(i, 2, 3) * 64; g.fillStyle = 'rgba(160,200,235,0.9)'; g.fillRect(x, y, 6 + hash2(i, 3, 3) * 8, 1); g.fillStyle = 'rgba(255,255,255,1)'; g.fillRect(x + 2, y + 1, 3, 1); } });
  R3.waterTex = tex3(wcv, { repeat: true, smooth: true }); R3.waterTex.repeat.set(40, 40);
  R3.waterMat = new THREE.MeshLambertMaterial({ color: 0x2f86c8, map: R3.waterTex, transparent: true, opacity: 0.78, depthWrite: false });
  R3.water = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), R3.waterMat); R3.water.rotation.x = -Math.PI / 2; R3.water.receiveShadow = true; R3.water.renderOrder = 2;
  R3.seabed = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshLambertMaterial({ color: 0x0f4170 })); R3.seabed.rotation.x = -Math.PI / 2;
  const lcv = cnv(32, 32, g => { g.fillStyle = '#ff6a00'; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#ffb300' : '#ffd54f'; g.beginPath(); g.ellipse(hash2(i, 5, 1) * 32, hash2(i, 6, 1) * 32, 5, 2.5, hash2(i, 7, 1) * 3, 0, 7); g.fill(); } });
  R3.lavaTex = tex3(lcv, { repeat: true }); R3.lavaMat = new THREE.MeshBasicMaterial({ map: R3.lavaTex });
  // roca y paredes
  const rtop = cnv(32, 32, g => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#c4c4c4' : '#ececec'; g.fillRect(Math.floor(hash2(i, 9, 2) * 28), Math.floor(hash2(i, 8, 2) * 28), 5, 3); } });
  const rside = cnv(32, 32, g => { g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 6; i++) { g.fillStyle = '#b4b4b4'; g.fillRect(2 + i * 5 + Math.floor(hash2(i, 1, 4) * 3), 2, 2, 28); } g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, 32, 2); g.fillStyle = '#a8a8a8'; g.fillRect(0, 15, 32, 1); });
  R3.rockTopMat = new THREE.MeshLambertMaterial({ map: tex3(rtop, { repeat: true }), vertexColors: true });
  R3.rockSideMat = new THREE.MeshLambertMaterial({ map: tex3(rside, { repeat: true }), vertexColors: true });
  const wside = cnv(32, 64, g => { g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, 32, 64); g.fillStyle = '#c8c8c8'; g.fillRect(0, 56, 32, 8); g.fillStyle = '#e0e0e0'; for (let x = 0; x < 32; x += 8) g.fillRect(x, 0, 1, 56); });
  R3.wallSideMat = new THREE.MeshLambertMaterial({ map: tex3(wside, { repeat: true }), vertexColors: true });
  // personajes, objetos y señales
  R3.geoUnit = new THREE.PlaneGeometry(1, 1); R3.geoUnit.translate(0, 0.5, 0);
  R3.ballGeo = (() => { const g = new THREE.SphereGeometry(0.17, 12, 8).toNonIndexed(); const p = g.attributes.position, c = new Float32Array(p.count * 3); const red = C3('#e53935'), wh = C3('#fafafa'), bk = C3('#1d1a26'); for (let i = 0; i < p.count; i++) { const y = p.getY(i), col = Math.abs(y) < 0.025 ? bk : y > 0 ? red : wh; c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); return g; })();
  const mk = cnv(32, 32, g => { g.fillStyle = '#1d1a26'; g.beginPath(); g.moveTo(4, 6); g.lineTo(28, 6); g.lineTo(16, 28); g.fill(); g.fillStyle = '#ffd54f'; g.beginPath(); g.moveTo(8, 8); g.lineTo(24, 8); g.lineTo(16, 23); g.fill(); });
  R3.markerMat = new THREE.SpriteMaterial({ map: tex3(mk, { mip: false }), depthTest: false });
  const bb = cnv(32, 32, g => { g.fillStyle = '#1d1a26'; g.fillRect(6, 2, 20, 28); g.fillStyle = '#fff'; g.fillRect(8, 4, 16, 24); g.fillStyle = '#e53935'; g.fillRect(14, 7, 4, 12); g.fillRect(14, 21, 4, 4); });
  R3.bubbleMat = new THREE.SpriteMaterial({ map: tex3(bb, { mip: false }), depthTest: false });
}
function mergeGeosSimple(list) {
  let n = 0; list.forEach(g => n += (g.index ? g.index.count : g.attributes.position.count));
  const pos = [], nor = [], uv = [];
  list.forEach(g0 => { const g = g0.index ? g0.toNonIndexed() : g0; pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); uv.push(...g.attributes.uv.array); });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

// ---------------- RELIEVE ----------------
const BIOME_AMP = { meadow: 0.38, coast: 0.25, swamp: 0.1, desert: 0.6, volcano: 0.45, plains: 0.3, forest: 0.35, snow: 0.5, peak: 0.55 };
const WATERY = t => t === T.WATER || t === T.DEEP;
function heights(map) {
  if (map._h3) return map._h3;
  const W = map.w, H = map.h, ch = new Float32Array((W + 1) * (H + 1)), rh = new Float32Array(W * H);
  if (map.outdoor) {
    const rd = bfsDistance(W, H, i => map.tiles[i] !== T.ROCK);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (map.tiles[i] !== T.ROCK) continue;
      const b = CITIES[map.reg[i]].biome, big = b === 'snow' || b === 'peak' || b === 'volcano' ? 1.25 : 1;
      rh[i] = (0.85 + Math.min(rd[i], 5) * 0.48 * big + hash2(x, y, 11) * 0.35);
    }
    for (let cy = 0; cy <= H; cy++) for (let cx = 0; cx <= W; cx++) {
      let nW = 0, deep = false, lava = 0, bridge = false, n = 0;
      for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
        const t = map.tileAt(cx + dx, cy + dy);
        n++;
        if (t === undefined || WATERY(t)) { nW++; if (t !== T.WATER) deep = true; }
        if (t === T.LAVA) lava++;
        if (t === T.BRIDGE) bridge = true;
      }
      let h;
      if (bridge) h = 0.02;
      else if (nW === 4) h = deep ? -1.0 : -0.6;
      else if (nW > 0) h = -0.2;
      else if (lava) h = lava === 4 ? -0.14 : -0.06;
      else {
        const tx = Math.min(W - 1, cx), ty = Math.min(H - 1, cy), c = CITIES[map.reg[ty * W + tx]];
        const amp = BIOME_AMP[c.biome] || 0.3;
        const nz = fbm(cx * 0.085, cy * 0.085, SEED + 77, 3);
        const k = clamp((nz - 0.32) / 0.45, 0, 1);
        // las ciudades son llanas
        const dxC = Math.max(0, Math.abs(cx - c.x) - c.w / 2 - 1), dyC = Math.max(0, Math.abs(cy - c.y) - c.h / 2 - 1);
        const flat = clamp(Math.max(dxC, dyC) / 7, 0, 1);
        h = amp * k * k * (3 - 2 * k) * 1.7 * flat;
      }
      ch[cy * (W + 1) + cx] = h;
    }
  } else {
    for (let i = 0; i < W * H; i++) if (map.tiles[i] === T.WALL) rh[i] = 2.5;
  }
  return (map._h3 = { ch, rh });
}
// altura del suelo en un punto del mundo (en píxeles)
function groundY(map, px, py) {
  const h = heights(map), fx = px / TS, fz = py / TS;
  const x0 = Math.floor(fx), z0 = Math.floor(fz), ax = fx - x0, az = fz - z0, W1 = map.w + 1;
  if (x0 < 0 || z0 < 0 || x0 >= map.w || z0 >= map.h) return 0;
  const a = h.ch[z0 * W1 + x0], b = h.ch[z0 * W1 + x0 + 1], c = h.ch[(z0 + 1) * W1 + x0], d = h.ch[(z0 + 1) * W1 + x0 + 1];
  return (a * (1 - ax) + b * ax) * (1 - az) + (c * (1 - ax) + d * ax) * az;
}

// ---------------- TROZOS DEL MAPA ----------------
function clearWorld3D() {
  for (const ch of R3.chunks.values()) disposeChunk(ch);
  R3.chunks.clear();
  for (const o of R3.actors.values()) disposeActor(o);
  R3.actors.clear();
  for (const o of R3.items.values()) R3.dyn.remove(o);
  R3.items.clear();
  R3.camT = null;
}
function disposeChunk(ch) {
  R3.world.remove(ch.group);
  ch.group.traverse(o => {
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry && o.userData.own) o.geometry.dispose();
    if (o.material && o.userData.ownMat) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
}
function chunkKey(cx, cy) { return cx + ',' + cy; }

function wantedChunks(map, tx, tz) {
  const out = [];
  const ccx = Math.floor(tx / CHUNK), ccy = Math.floor(tz / CHUNK);
  if (!map.outdoor) {
    for (let cy = 0; cy * CHUNK < map.h; cy++) for (let cx = 0; cx * CHUNK < map.w; cx++) out.push([cx, cy, 0]);
    return out;
  }
  const rx = R3.titleMode ? 3 : 2;
  for (let cy = ccy - (R3.titleMode ? 3 : 2); cy <= ccy + 1; cy++) for (let cx = ccx - rx; cx <= ccx + rx; cx++) {
    if (cx < 0 || cy < 0 || cx * CHUNK >= map.w || cy * CHUNK >= map.h) continue;
    const mx = (cx + 0.5) * CHUNK - tx, mz = (cy + 0.5) * CHUNK - tz;
    out.push([cx, cy, mx * mx + mz * mz * 0.6]);
  }
  out.sort((a, b) => a[2] - b[2]);
  return out;
}
function updateChunks(map, tx, tz, budget) {
  const want = wantedChunks(map, tx, tz), keep = new Set();
  let built = 0;
  for (const [cx, cy] of want) {
    const k = chunkKey(cx, cy); keep.add(k);
    if (!R3.chunks.has(k) && built < budget) { R3.chunks.set(k, buildChunk(map, cx, cy)); built++; }
  }
  for (const [k, ch] of R3.chunks) if (!keep.has(k)) { disposeChunk(ch); R3.chunks.delete(k); }
}

function buildChunk(map, cx, cy) {
  const group = new THREE.Group(), ch = { group, lights: [], gates: [], night: [] };
  const H3 = heights(map), W1 = map.w + 1;
  const x0 = cx * CHUNK, z0 = cy * CHUNK, N = CHUNK;
  // --- suelo con la textura pixel-art de las casillas ---
  {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const X = x0 + i, Z = z0 + j;
      const h = X <= map.w && Z <= map.h ? H3.ch[Math.min(Z, map.h) * W1 + Math.min(X, map.w)] : 0;
      pos.push(X, h, Z); uv.push(i / N, 1 - j / N);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (map.tileAt(x0 + i, z0 + j) === undefined) continue;
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ map: tex3(drawChunkCanvas(map, cx, cy)) });
    const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true;
    mesh.userData.own = true; mesh.userData.ownMat = true;
    group.add(mesh);
  }
  // --- montañas (columnas de roca) y paredes ---
  buildColumns(map, cx, cy, group);
  // --- lava ---
  {
    const pos = [], uv = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (map.tileAt(x0 + i, z0 + j) !== T.LAVA) continue;
      const X = x0 + i, Z = z0 + j, y = -0.03;
      pos.push(X, y, Z, X, y, Z + 1, X + 1, y, Z, X + 1, y, Z, X, y, Z + 1, X + 1, y, Z + 1);
      uv.push(X, -Z, X, -Z - 1, X + 1, -Z, X + 1, -Z, X, -Z - 1, X + 1, -Z - 1);
    }
    if (pos.length) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      const m = new THREE.Mesh(geo, R3.lavaMat); m.userData.own = true; group.add(m);
      ch.lights.push({ x: x0 + 8, y: 1, z: z0 + 8, c: 0xff7b29, i: 1.4, always: true });
    }
  }
  // --- hierba alta ---
  if (map.outdoor) {
    const mats = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const t = map.tileAt(x0 + i, z0 + j);
      if (!TALL_T.has(t)) continue;
      const reg = map.regionAt(x0 + i, z0 + j);
      const col = t === T.SNOWTALL ? '#a8c9b0' : t === T.DRYTALL ? '#b89040' : t === T.DARK ? '#2f5a3c' : shade(grassColor(reg), -6);
      for (let k = 0; k < 3; k++) {
        const fx = x0 + i + 0.2 + hash2(x0 + i, z0 + j, k) * 0.6, fz = z0 + j + 0.2 + hash2(x0 + i, z0 + j, k + 5) * 0.6;
        const s = 0.8 + hash2(x0 + i, z0 + j, k + 9) * 0.5;
        mats.push([fx, groundY(map, fx * TS, fz * TS), fz, s, hash2(i, j, k + 2) * 3, col]);
      }
    }
    if (mats.length) {
      const im = new THREE.InstancedMesh(R3.grassGeo, R3.grassMat, mats.length);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
      mats.forEach(([x, y, z, s, r, col], k) => { m4.compose(new THREE.Vector3(x, y - 0.02, z), q.setFromEuler(e.set(0, r, 0)), new THREE.Vector3(s, s * (0.9 + (k % 3) * 0.12), s)); im.setMatrixAt(k, m4); im.setColorAt(k, c.set(col)); });
      im.receiveShadow = true;
      group.add(im);
    }
  }
  // --- objetos ---
  const objs = map.objsIn(x0 * TS, z0 * TS, (x0 + N) * TS, (z0 + N) * TS).filter(o => Math.floor(o.x / TS / CHUNK) === cx && Math.floor((o.y - 2) / TS / CHUNK) === cy);
  const byModel = {}, byCard = {};
  for (const o of objs) {
    if (o.type === 'building') { buildBuilding(o, group, ch); continue; }
    const md = MODELS[o.type];
    if (md) (byModel[o.type] = byModel[o.type] || []).push(o);
    else if (OBJ_DEF[o.type]) { const k = o.type + ':' + ((o.v || 0) % 4); (byCard[k] = byCard[k] || []).push(o); }
    const d = OBJ_DEF[o.type];
    if (d && d.light) ch.lights.push({ x: o.x * U3, y: groundY(map, o.x, o.y) + (-d.light.y) * U3, z: o.y * U3 + 0.1, c: rgbStr(d.light.c), i: 1.2, r: d.light.r * U3 * 1.6, always: !map.outdoor || o.type === 'torch' });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sv = new THREE.Vector3(), c = new THREE.Color();
  for (const type in byModel) {
    const md = MODELS[type], list = byModel[type];
    const place = (im, isGlow) => {
      list.forEach((o, k) => {
        const col = o.col;
        const fx = col ? o.x + col[0] + col[2] / 2 : o.x, fz = col ? o.y + col[1] + col[3] / 2 : o.y;
        const r = md.rot ? hash2(Math.floor(o.x), Math.floor(o.y), 3) * Math.PI * 2 : 0;
        const s = md.vary ? 0.85 + hash2(Math.floor(o.x), Math.floor(o.y), 4) * 0.35 : 1;
        m4.compose(v.set(fx * U3, groundY(map, o.x, o.y), fz * U3), q.setFromEuler(e.set(0, r, 0)), sv.set(s, s, s));
        im.setMatrixAt(k, m4);
        if (md.tint && !isGlow) im.setColorAt(k, c.set(o.color || '#ffffff'));
      });
      im.castShadow = !isGlow; im.receiveShadow = true;
      if (type === 'barrier') (ch.gateMeshes = ch.gateMeshes || []).push(im);
      group.add(im);
    };
    if (md.std) place(new THREE.InstancedMesh(md.std, R3.matStd, list.length), false);
    if (md.glow) place(new THREE.InstancedMesh(md.glow, md.glowAlways ? R3.matGlow : R3.matGlowNight, list.length), true);
    if (type === 'barrier') list.forEach(o => ch.gates.push(o));
  }
  for (const k in byCard) {
    const [type, vv] = k.split(':'), d = OBJ_DEF[type], list = byCard[k];
    const im = new THREE.InstancedMesh(cardGeo(type), cardMat(type, +vv), list.length);
    list.forEach((o, i) => { m4.compose(v.set(o.x * U3, groundY(map, o.x, o.y), o.y * U3), q.identity(), sv.set(1, 1, 1)); im.setMatrixAt(i, m4); });
    im.castShadow = true; im.receiveShadow = true;
    im.customDepthMaterial = cardDepthMat(type, +vv);
    group.add(im);
  }
  R3.world.add(group);
  return ch;
}
function rgbStr(s) { const [r, g, b] = s.split(',').map(Number); return (r << 16) | (g << 8) | b; }
// dibuja las casillas de un trozo en un lienzo nuevo (sin pasar por la caché del 2D)
function drawChunkCanvas(map, cx, cy) {
  const c = document.createElement('canvas'); c.width = c.height = CHUNK * TS;
  const g = c.getContext('2d');
  for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
    const tx = cx * CHUNK + x, ty = cy * CHUNK + y, t = map.tileAt(tx, ty);
    if (t === undefined) { g.fillStyle = map.outdoor ? TILE_COLOR[T.DEEP] : '#0b0a12'; g.fillRect(x * TS, y * TS, TS, TS); continue; }
    if (t === T.ROCK || t === T.WALL) { g.fillStyle = '#6f6253'; g.fillRect(x * TS, y * TS, TS, TS); continue; }
    drawTile(g, map, tx, ty, x * TS, y * TS);
  }
  return c;
}

// columnas de roca (exterior) o paredes (interior)
function buildColumns(map, cx, cy, group) {
  const H3 = heights(map), N = CHUNK, x0 = cx * CHUNK, z0 = cy * CHUNK;
  const top = { pos: [], nor: [], uv: [], col: [] }, side = { pos: [], nor: [], uv: [], col: [] };
  const quad = (B, a, b, c, d, n, uvs, col) => {
    B.pos.push(...a, ...b, ...c, ...c, ...b, ...d);
    for (let i = 0; i < 6; i++) { B.nor.push(...n); B.col.push(col.r, col.g, col.b); }
    B.uv.push(...uvs[0], ...uvs[1], ...uvs[2], ...uvs[2], ...uvs[1], ...uvs[3]);
  };
  const base = map.outdoor ? -0.6 : 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const X = x0 + i, Z = z0 + j;
    if (X >= map.w || Z >= map.h) continue;
    const h = H3.rh[Z * map.w + X];
    if (!h) continue;
    let ct, cs;
    if (map.outdoor) {
      const b = map.regionAt(X, Z);
      ct = C3(b === 'snow' || b === 'peak' ? '#f2f6fb' : b === 'volcano' ? '#5e5450' : b === 'desert' ? '#c9a878' : '#a69882');
      cs = C3(b === 'snow' || b === 'peak' ? '#8f9eab' : b === 'volcano' ? '#3e3634' : b === 'desert' ? '#a07d52' : '#7a6c5c');
      const k = 0.92 + hash2(X, Z, 21) * 0.14; ct.multiplyScalar(k); cs.multiplyScalar(k);
    } else { ct = C3('#2b2735'); cs = C3(map.wall || '#e8dcc8'); }
    quad(top, [X, h, Z], [X, h, Z + 1], [X + 1, h, Z], [X + 1, h, Z + 1], [0, 1, 0], [[X, -Z], [X, -Z - 1], [X + 1, -Z], [X + 1, -Z - 1]], ct);
    const nb = (dx, dz) => { const nx = X + dx, nz = Z + dz; if (nx < 0 || nz < 0 || nx >= map.w || nz >= map.h) return map.outdoor ? base : h; return H3.rh[nz * map.w + nx] || base; };
    const sideQ = (nh, a, b, n) => {
      if (nh >= h) return;
      const L = map.outdoor ? 1 : 1, ys = map.outdoor ? 1 : 1 / 2.5;
      quad(side, [a[0], h, a[1]], [a[0], nh, a[1]], [b[0], h, b[1]], [b[0], nh, b[1]], n, [[0, h * ys], [0, nh * ys], [L, h * ys], [L, nh * ys]], cs);
    };
    sideQ(nb(0, 1), [X, Z + 1], [X + 1, Z + 1], [0, 0, 1]);
    sideQ(nb(0, -1), [X + 1, Z], [X, Z], [0, 0, -1]);
    sideQ(nb(1, 0), [X + 1, Z + 1], [X + 1, Z], [1, 0, 0]);
    sideQ(nb(-1, 0), [X, Z], [X, Z + 1], [-1, 0, 0]);
  }
  const mk = (B, mat) => {
    if (!B.pos.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3));
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.userData.own = true;
    group.add(m);
  };
  mk(top, R3.rockTopMat);
  mk(side, map.outdoor ? R3.rockSideMat : R3.wallSideMat);
}

// objetos sin modelo: recortables de pie (como en un diorama)
const CARD_GEO = {}, CARD_MAT = {}, CARD_DEPTH = {};
function cardGeo(type) {
  if (CARD_GEO[type]) return CARD_GEO[type];
  const d = OBJ_DEF[type], g = new THREE.PlaneGeometry(d.w * U3, d.h * U3);
  g.translate((d.w / 2 - d.ax) * U3, (d.ay - d.h / 2) * U3, 0);
  return (CARD_GEO[type] = g);
}
function cardMat(type, v) {
  const k = type + ':' + v;
  if (!CARD_MAT[k]) CARD_MAT[k] = new THREE.MeshLambertMaterial({ map: tex3(objImage(type, v), { mip: false }), alphaTest: 0.5, side: THREE.DoubleSide });
  return CARD_MAT[k];
}
function cardDepthMat(type, v) {
  const k = type + ':' + v;
  if (!CARD_DEPTH[k]) CARD_DEPTH[k] = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: cardMat(type, v).map, alphaTest: 0.5 });
  return CARD_DEPTH[k];
}

// ---------------- EDIFICIOS ----------------
const BLD_CACHE = {};
function buildBuilding(o, group, ch) {
  const b = o.b, w = b.w, d = b.h - 0.25;
  const isSchool = b.kind === 'school';
  const cvs = isSchool ? schoolCanvas() : buildingCanvas(b);
  const wallTop = isSchool ? 70 : 40 + Math.floor(b.h * TS * 0.42);
  const facadeY = isSchool ? 70 : wallTop - 4, facadeH = cvs.height - 6 - facadeY;
  const H = b.kind === 'corp' ? 7.5 : b.kind === 'liga' ? Math.max(3.6, facadeH * U3 * 1.3) : facadeH * U3 * (isSchool ? 1 : 1.3);
  const cache = BLD_CACHE[b.id] || (BLD_CACHE[b.id] = makeBuildingMats(b, cvs, facadeY, facadeH, H));
  const gx = b.tx + w / 2, gz = b.ty + 0.25 + d / 2, front = b.ty + b.h;
  const gy = groundY(WORLD, o.x, o.y - 4);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, H, d), [cache.side, cache.side, cache.roofFlat, cache.side, cache.front, cache.side]);
  body.position.set(gx, gy + H / 2, gz);
  body.castShadow = body.receiveShadow = true; body.userData.own = true;
  group.add(body);
  // zócalo para que no flote en cuestas
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.8, d + 0.2), cache.plinth);
  plinth.position.set(gx, gy - 0.3, gz); plinth.userData.own = true; plinth.receiveShadow = true;
  group.add(plinth);
  // tejado
  if (b.kind === 'corp') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 1.2, d * 0.6), cache.roofFlat); top.position.set(gx, gy + H + 0.6, gz); top.castShadow = true; top.userData.own = true; group.add(top);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.4, 6), R3.matStd); ant.position.set(gx, gy + H + 2.2, gz); ant.userData.own = true; group.add(ant);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3030 })); beacon.position.set(gx, gy + H + 3.45, gz); beacon.userData.own = true; beacon.userData.ownMat = true; group.add(beacon);
  } else if (isSchool) {
    const tw = 4.4, tower = new THREE.Mesh(new THREE.BoxGeometry(tw, 1.6, 1.2), [cache.side, cache.side, cache.roofFlat, cache.side, cache.towerFront, cache.side]);
    tower.position.set(gx, gy + H + 0.8, front - 0.7); tower.castShadow = true; tower.userData.own = true; group.add(tower);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.18, d + 0.2), cache.plinth); cap.position.set(gx, gy + H + 0.05, gz); cap.userData.own = true; group.add(cap);
  } else {
    const rh = Math.min(2.2, 0.55 + d * 0.32), ov = 0.3;
    const g = new THREE.BufferGeometry();
    const L = b.tx - ov, R = b.tx + w + ov, F = front + ov, Bk = b.ty + 0.25 - ov, Y = gy + H, M = (F + Bk) / 2;
    const p = [
      L, Y, F, R, Y, F, L, Y + rh, M, R, Y, F, R, Y + rh, M, L, Y + rh, M,         // faldón delantero
      R, Y, Bk, L, Y, Bk, R, Y + rh, M, L, Y, Bk, L, Y + rh, M, R, Y + rh, M,      // faldón trasero
      L, Y, Bk, L, Y, F, L, Y + rh, M, R, Y, F, R, Y, Bk, R, Y + rh, M             // hastiales
    ];
    const len = (F - M), uvs = [0, 0, w, 0, 0, len, w, 0, w, len, 0, len, 0, 0, w, 0, 0, len, w, 0, w, len, 0, len, 0, 0, 1, 0, 0.5, 1, 0, 0, 1, 0, 0.5, 1];
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.addGroup(0, 12, 0); g.addGroup(12, 6, 1);
    g.computeVertexNormals();
    const roof = new THREE.Mesh(g, [cache.roof, cache.gable]); roof.castShadow = true; roof.receiveShadow = true; roof.userData.own = true;
    group.add(roof);
    // emblemas
    const em = b.kind === 'center' ? 'center' : b.kind === 'gym' ? 'gym' : b.kind === 'liga' ? 'liga' : null;
    if (em) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), cache.emblem);
      s.position.set(gx, Y + rh * 0.42, (F + M) / 2 + 0.06); s.rotation.x = -Math.atan2(rh, F - M); s.userData.own = true;
      s.position.y += 0.12;
      group.add(s);
    }
  }
  // luz de la puerta
  const doorX = b.tx + Math.floor(w / 2) + 0.5;
  ch.lights.push({ x: doorX, y: gy + 1.4, z: front + 0.5, c: 0xffc878, i: 1.1, r: 4.5 });
}
function makeBuildingMats(b, cvs, fy, fh, H) {
  const W = cvs.width;
  const facade = cnv(W, fh, g => g.drawImage(cvs, 0, fy, W, fh, 0, 0, W, fh));
  // ventanas que se encienden de noche
  const glow = cnv(W, fh, g => {
    const src = facade.getContext('2d').getImageData(0, 0, W, fh), out = g.createImageData(W, fh);
    for (let i = 0; i < src.data.length; i += 4) {
      const r = src.data[i], gg = src.data[i + 1], bb = src.data[i + 2];
      const win = bb > 200 && gg > 180 && r < 220 && bb > r + 20;
      out.data[i] = win ? 255 : 0; out.data[i + 1] = win ? 196 : 0; out.data[i + 2] = win ? 110 : 0; out.data[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
  });
  const wall = b.wall || '#f2e6cf', roofC = b.roof || '#c0504d';
  const sideC = cnv(64, 64, g => {
    g.fillStyle = wall; g.fillRect(0, 0, 64, 64);
    for (let x = 4; x < 64; x += 8) { g.fillStyle = shade(wall, -6); g.fillRect(x, 0, 1, 64); }
    g.fillStyle = shade(wall, -22); g.fillRect(0, 56, 64, 8);
    if (b.kind !== 'school') { g.fillStyle = '#4e6e8a'; g.fillRect(22, 18, 20, 18); g.fillStyle = b.kind === 'corp' ? '#5a3b4a' : '#9fd3f0'; g.fillRect(24, 20, 16, 14); g.fillStyle = '#4e6e8a'; g.fillRect(31, 18, 2, 18); }
    else { for (let y = 4; y < 56; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < 64; x += 12) { g.fillStyle = '#a24e37'; g.fillRect(x, y, 11, 1); } g.fillStyle = '#8ecae6'; g.fillRect(24, 16, 16, 22); }
  });
  const sideT = tex3(sideC, { repeat: true });
  sideT.repeat.set(1, 1);
  const roofCv = cnv(32, 32, g => { g.fillStyle = roofC; g.fillRect(0, 0, 32, 32); for (let y = 0; y < 32; y += 6) { g.fillStyle = shade(roofC, -14); g.fillRect(0, y, 32, 2); } for (let i = 0; i < 6; i++) { g.fillStyle = shade(roofC, 10); g.fillRect(hash2(i, 1, 9) * 30, hash2(i, 2, 9) * 30, 3, 1); } });
  const roofT = tex3(roofCv, { repeat: true });
  const mats = {
    front: new THREE.MeshLambertMaterial({ map: tex3(facade), emissiveMap: tex3(glow), emissive: 0xffffff, emissiveIntensity: 0 }),
    side: new THREE.MeshLambertMaterial({ map: sideT }),
    roof: new THREE.MeshLambertMaterial({ map: roofT }),
    roofFlat: new THREE.MeshLambertMaterial({ color: C3(shade(roofC, -10)) }),
    gable: new THREE.MeshLambertMaterial({ color: C3(shade(wall, -8)) }),
    plinth: new THREE.MeshLambertMaterial({ color: C3(b.kind === 'school' ? '#8e8e8e' : shade(wall, -40)) })
  };
  R3.nightMats.push(mats.front);
  if (b.kind === 'school') {
    const tw = 140, tf = cnv(tw, 46, g => g.drawImage(cvs, cvs.width / 2 - tw / 2, 24, tw, 46, 0, 0, tw, 46));
    mats.towerFront = new THREE.MeshLambertMaterial({ map: tex3(tf) });
  }
  if (b.kind === 'center' || b.kind === 'gym' || b.kind === 'liga') {
    const e = cnv(32, 32, g => {
      if (b.kind === 'center') { g.fillStyle = '#fafafa'; g.fillRect(2, 2, 28, 28); g.fillStyle = '#e53935'; g.fillRect(13, 5, 6, 22); g.fillRect(5, 13, 22, 6); }
      else { g.fillStyle = '#fafafa'; g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill(); g.fillStyle = b.kind === 'liga' ? '#ffd54f' : (b.accent || '#ffd54f'); g.beginPath(); g.arc(16, 16, 12, 0, 7); g.fill(); g.fillStyle = '#fafafa'; g.fillRect(15, 3, 2, 26); }
    });
    mats.emblem = new THREE.MeshBasicMaterial({ map: tex3(e, { mip: false }), transparent: true, alphaTest: 0.5 });
  }
  return mats;
}

// ---------------- PERSONAJES ----------------
const SHEET_TEX = new Map();
function sheetTexture(src) {
  let t = SHEET_TEX.get(src);
  if (!t) { t = tex3(src, { mip: false }); SHEET_TEX.set(src, t); }
  return t;
}
function actorSource(a) {
  if (a.custom) { loadCustomSheet(a.custom); const c = CUSTOM_SHEETS[a.custom]; if (c) return c; }
  return personSheet(a.look || LOOKS2.player);
}
function actorObj(a) {
  let o = R3.actors.get(a);
  if (o) return o;
  const mat = new THREE.MeshLambertMaterial({ alphaTest: 0.5, side: THREE.DoubleSide });
  const m = new THREE.Mesh(R3.geoUnit, mat);
  m.castShadow = true; m.rotation.x = -0.22;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
  R3.dyn.add(m);
  o = { m, mat, src: null, tex: null };
  if (a.isPlayer) {
    const sm = new THREE.MeshBasicMaterial({ color: 0x7fb4ff, transparent: true, opacity: 0.5, depthWrite: false, depthFunc: THREE.GreaterDepth, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    o.sil = new THREE.Mesh(R3.geoUnit, sm); o.sil.renderOrder = 10; o.sil.rotation.x = -0.22; o.silMat = sm;
    R3.dyn.add(o.sil);
  }
  R3.actors.set(a, o);
  return o;
}
function disposeActor(o) {
  R3.dyn.remove(o.m); if (o.sil) R3.dyn.remove(o.sil);
  if (o.tex) o.tex.dispose(); o.mat.dispose(); o.m.customDepthMaterial.dispose();
  if (o.silMat) o.silMat.dispose();
  if (o.marker) R3.dyn.remove(o.marker);
  if (o.bubble) R3.dyn.remove(o.bubble);
}
function updateActor(a, map) {
  const o = actorObj(a);
  const src = actorSource(a);
  if (src !== o.src) {
    if (o.tex) o.tex.dispose();
    o.tex = sheetTexture(src).clone(); o.tex.needsUpdate = true;
    o.tex.repeat.set(0.25, 0.25);
    o.mat.map = o.tex; o.mat.needsUpdate = true;
    o.m.customDepthMaterial.map = o.tex; o.m.customDepthMaterial.needsUpdate = true;
    if (o.silMat) { o.silMat.map = o.tex; o.silMat.needsUpdate = true; }
    o.src = src;
    const h = 1.32, w = h * (src.width / 4) / (src.height / 4);
    o.m.scale.set(w, h, 1); if (o.sil) o.sil.scale.set(w, h, 1);
  }
  const row = Math.max(0, DIRS4.indexOf(a.dir || 'down')), col = a.moving ? (a.frame || 0) % 4 : 0;
  o.tex.offset.set(col * 0.25, 1 - (row + 1) * 0.25);
  const y = groundY(map, a.x, a.y);
  o.m.position.set(a.x * U3, y, a.y * U3 - 0.05);
  o.m.visible = !a.hidden;
  if (o.sil) { o.sil.position.copy(o.m.position); o.sil.visible = !a.hidden; }
  // señal amarilla y bocadillo de "¡!"
  const showMk = a.marker && !a.hidden;
  if (showMk && !o.marker) { o.marker = new THREE.Sprite(R3.markerMat); o.marker.scale.set(0.42, 0.42, 1); o.marker.renderOrder = 20; R3.dyn.add(o.marker); }
  if (o.marker) { o.marker.visible = showMk; o.marker.position.set(a.x * U3, y + 1.7 + Math.sin(now / 250) * 0.06, a.y * U3); }
  if (a.bubble && !o.bubble) { o.bubble = new THREE.Sprite(R3.bubbleMat); o.bubble.scale.set(0.45, 0.45, 1); o.bubble.renderOrder = 21; R3.dyn.add(o.bubble); }
  if (o.bubble) { o.bubble.visible = !!a.bubble; o.bubble.position.set(a.x * U3, y + 1.85, a.y * U3); }
}
function updateActors(map) {
  const seen = new Set();
  const list = map.npcs.concat(STATE !== 'TITLE' ? [player] : []);
  for (const a of list) { updateActor(a, map); seen.add(a); }
  for (const [a, o] of R3.actors) if (!seen.has(a)) { disposeActor(o); R3.actors.delete(a); }
  // objetos del suelo (cromos)
  const itSeen = new Set();
  for (const it of map.items) {
    if (G && G.picked[it.id]) continue;
    itSeen.add(it.id);
    let m = R3.items.get(it.id);
    if (!m) { m = new THREE.Mesh(R3.ballGeo, R3.matStd); m.castShadow = true; R3.dyn.add(m); R3.items.set(it.id, m); }
    m.position.set(it.x * U3, groundY(map, it.x, it.y) + 0.22 + Math.sin(now / 250) * 0.05, it.y * U3);
    m.rotation.y = now / 700;
  }
  for (const [id, m] of R3.items) if (!itSeen.has(id)) { R3.dyn.remove(m); R3.items.delete(id); }
}

// ---------------- CIELO, LUZ Y CLIMA ----------------
const SKY_DAY = { meadow: '#8fd3ff', coast: '#7fc8ff', swamp: '#9fb5a8', desert: '#f2d9a6', volcano: '#c08a78', plains: '#9fd8ff', forest: '#a5d4b8', snow: '#d5e6f5', peak: '#a9c4ea' };
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function updateEnv(map, tx, tz, minutes, dt) {
  const interior = !map.outdoor;
  const n = interior ? 0 : clamp(darknessAt(minutes) / 0.62, 0, 1);
  const hr = (minutes % 1440) / 60;
  const warm = interior ? 0 : Math.max(0, 1 - Math.abs(hr - 19.3) / 1.4) + Math.max(0, 1 - Math.abs(hr - 6.3) / 1.1);
  const reg = interior ? 'indoor' : map.regionAt(Math.floor(tx), Math.floor(tz));
  const wk = interior ? null : (typeof weather !== 'undefined' ? weather.kind : null);
  // cielo
  if (interior) _c1.set('#0b0a12');
  else {
    _c1.set(SKY_DAY[reg] || '#8fd3ff');
    if (wk === 'rain') _c1.lerp(_c2.set('#7d8b99'), 0.6);
    if (wk === 'fog') _c1.lerp(_c2.set('#b8c4bc'), 0.5);
    _c1.lerp(_c2.set('#ff9a5c'), Math.min(1, warm) * 0.55);
    _c1.lerp(_c2.set('#0c1030'), n);
  }
  const k = 1 - Math.exp(-dt / 600);
  R3.skyCol.lerp(_c1, R3.snapSky ? 1 : k); R3.snapSky = false;
  R3.scene.background.copy(R3.skyCol);
  R3.scene.fog.color.copy(R3.skyCol);
  const d = R3.camDist || 16;
  if (interior) { R3.scene.fog.near = 60; R3.scene.fog.far = 120; }
  else {
    const thick = wk === 'fog' ? 0.45 : wk === 'sand' ? 0.6 : wk === 'rain' ? 0.75 : 1;
    R3.scene.fog.near = d * (0.9 + 0.5 * thick); R3.scene.fog.far = d * (1.6 + 1.6 * thick) + (R3.titleMode ? 30 : 0);
  }
  // luces
  if (interior) {
    R3.hemi.color.set('#fff6e8'); R3.hemi.groundColor.set('#6a5a50'); R3.hemi.intensity = 0.75;
    R3.sun.color.set('#fff2dc'); R3.sun.intensity = 0.55;
  } else {
    R3.hemi.color.copy(_c1.set('#dcefff').lerp(_c2.set('#33427a'), n)); R3.hemi.groundColor.copy(_c1.set('#6b5a3a').lerp(_c2.set('#141826'), n));
    R3.hemi.intensity = lerp(0.62, 0.42, n) * (wk === 'rain' ? 0.85 : 1);
    R3.sun.color.copy(_c1.set('#fff4e0').lerp(_c2.set('#ff9a5c'), Math.min(1, warm) * 0.7).lerp(_c2.set('#8fa6ff'), n));
    R3.sun.intensity = lerp(0.85, 0.25, n) * (wk === 'rain' || wk === 'fog' ? 0.6 : 1);
  }
  R3.sun.position.set(tx - 6, 15, tz + 9);
  R3.sun.target.position.set(tx, 0, tz);
  // ventanas y farolas
  const glowK = interior ? 0 : clamp(n * 1.4, 0, 1);
  for (const m of R3.nightMats) m.emissiveIntensity = glowK * 0.9;
  R3.matGlowNight.color.setScalar(0.45 + 0.55 * glowK);
  // puntos de luz más cercanos
  const cands = [];
  for (const ch of R3.chunks.values()) for (const L of ch.lights) {
    if (!L.always && glowK <= 0.02) continue;
    const dd = (L.x - tx) ** 2 + (L.z - tz) ** 2;
    if (dd < 400) cands.push([dd, L]);
  }
  cands.sort((a, b) => a[0] - b[0]);
  R3.lights.forEach((l, i) => {
    const c = cands[i];
    if (!c) { l.intensity = 0; return; }
    const L = c[1];
    l.position.set(L.x, L.y, L.z); l.color.setHex(L.c);
    l.distance = L.r ? Math.max(3, L.r) : 7;
    l.intensity = (L.always ? 1 : glowK) * (L.i || 1) * 1.4;
  });
  // agua animada
  R3.waterTex.offset.set((now / 9000) % 1, (now / 13000) % 1);
  R3.lavaTex.offset.set((now / 6000) % 1, (now / 8000) % 1);
  R3.uTime.value = now / 1000;
}
function darknessAt(m) {
  m = m % 1440; const h = m / 60;
  if (h >= 7 && h < 18.5) return 0;
  if (h >= 18.5 && h < 20.5) return (h - 18.5) / 2 * 0.62;
  if (h >= 5 && h < 7) return (7 - h) / 2 * 0.62;
  return 0.62;
}

const WX = { kind: null, obj: null, n: 0, vel: null };
function updateWeather3D(tx, ty, tz, dt) {
  const k = (MAP && MAP.outdoor && typeof weather !== 'undefined') ? weather.kind : null;
  if (k !== WX.kind) {
    if (WX.obj) { R3.scene.remove(WX.obj); WX.obj.geometry.dispose(); WX.obj.material.dispose(); WX.obj = null; }
    WX.kind = k;
    if (k && k !== 'fog') {
      const N = { rain: 700, snow: 600, sand: 500, ash: 400, leaves: 160 }[k] || 300;
      const geo = new THREE.BufferGeometry(), arr = new Float32Array(N * (k === 'rain' ? 6 : 3));
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      WX.n = N; WX.seed = [...Array(N)].map(() => [Math.random() * 36 - 18, Math.random() * 14, Math.random() * 36 - 26, Math.random()]);
      if (k === 'rain') WX.obj = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xb4d2ff, transparent: true, opacity: 0.55 }));
      else WX.obj = new THREE.Points(geo, new THREE.PointsMaterial({ color: { snow: 0xffffff, sand: 0xe0b878, ash: 0x5a5050, leaves: 0xd9862a }[k], size: { snow: 0.12, sand: 0.07, ash: 0.09, leaves: 0.16 }[k], transparent: true, opacity: 0.9 }));
      WX.obj.frustumCulled = false;
      R3.scene.add(WX.obj);
    }
  }
  if (!WX.obj) return;
  const arr = WX.obj.geometry.attributes.position.array, t = now / 1000, f = dt / 16;
  for (let i = 0; i < WX.n; i++) {
    const p = WX.seed[i];
    if (k === 'rain') { p[1] -= 0.55 * f; p[0] -= 0.08 * f; }
    else if (k === 'snow') { p[1] -= 0.035 * f * (0.6 + p[3]); p[0] += Math.sin(t + p[3] * 6) * 0.01 * f; }
    else if (k === 'sand') { p[0] += 0.18 * f * (0.6 + p[3]); p[1] += Math.sin(t * 2 + p[3] * 9) * 0.01; }
    else if (k === 'ash') { p[1] -= 0.02 * f; p[0] += Math.sin(t * 0.7 + p[3] * 6) * 0.01 * f; }
    else { p[1] -= 0.025 * f; p[0] += Math.sin(t * 1.5 + p[3] * 6) * 0.03 * f; }
    if (p[1] < 0) p[1] += 14; if (p[0] < -18) p[0] += 36; if (p[0] > 18) p[0] -= 36;
    const x = tx + p[0], y = ty + p[1], z = tz + p[2];
    if (k === 'rain') { arr.set([x, y, z, x + 0.06, y + 0.45, z], i * 6); }
    else { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; }
  }
  WX.obj.geometry.attributes.position.needsUpdate = true;
}

// ---------------- CÁMARA ----------------
function camDistance(map) {
  const asp = window.innerWidth / window.innerHeight, t = Math.tan(R3.cam.fov * Math.PI / 360);
  let d = clamp(Math.max(10.5 / (2 * t * asp), 13.5 / (2 * t)), 14, 42);
  if (!map.outdoor) d *= 0.88;
  else if (G && G.bike) d *= 1.1;
  return d;
}
const PITCH = 0.9;   // ~52°
function updateCamera(map, tx, ty, tz, dt, snap) {
  const d = camDistance(map);
  R3.camDist = d;
  if (!R3.camT || snap) R3.camT = new THREE.Vector3(tx, ty, tz);
  const k = 1 - Math.exp(-dt / 110);
  R3.camT.x += (tx - R3.camT.x) * k; R3.camT.y += (ty - R3.camT.y) * k * 0.6; R3.camT.z += (tz - R3.camT.z) * k;
  const c = R3.camT;
  R3.cam.position.set(c.x, c.y + d * Math.sin(PITCH), c.z + d * Math.cos(PITCH));
  R3.cam.lookAt(c.x, c.y, c.z);
}

// ---------------- MUNDO: DIBUJADO ----------------
function ensureMap3D(map) {
  if (R3.mapId === map.id) return;
  clearWorld3D();
  R3.mapId = map.id;
  R3.snapSky = true;
  R3.world.remove(R3.water); R3.world.remove(R3.seabed);
  if (map.outdoor) { R3.world.add(R3.water); R3.world.add(R3.seabed); }
}
function render3DWorld(dt) {
  const map = MAP;
  ensureMap3D(map);
  R3.titleMode = false;
  perfTick();
  let tx = player.x * U3, tz = player.y * U3;
  const ty = groundY(map, player.x, player.y);
  if (!map.outdoor) {
    // en interiores la cámara encuadra la sala
    tx = map.w <= 17 ? map.w / 2 : clamp(tx, 7, map.w - 7);
    tz = map.h <= 12 ? map.h / 2 + 0.5 : clamp(tz, 5.5, map.h - 4.5);
  }
  const first = !R3.camT || Math.abs(R3.camT.x - tx) + Math.abs(R3.camT.z - tz) > 12;
  updateChunks(map, tx, tz, first ? 99 : 2);
  updateActors(map);
  // barreras abiertas o cerradas
  for (const ch of R3.chunks.values()) if (ch.gateMeshes) { const open = ch.gates.every(gateOpen); ch.gateMeshes.forEach(m => m.visible = !open); }
  updateCamera(map, tx, ty + 0.55, tz, dt, first);
  R3.water.position.set(Math.round(R3.camT.x), -0.1, Math.round(R3.camT.z)); R3.seabed.position.set(Math.round(R3.camT.x), -1.3, Math.round(R3.camT.z));
  updateEnv(map, R3.camT.x, R3.camT.z, G.time, dt);
  updateWeather3D(R3.camT.x, R3.camT.y, R3.camT.z, dt);
  R3.renderer.render(R3.scene, R3.cam);
}
// pantalla de título: vuelo lento sobre Gasteiz al atardecer
function render3DTitle(dt) {
  const map = WORLD;
  if (!map) return;
  ensureMap3D(map);
  R3.titleMode = true;
  const c = CITY.gasteiz, t = now / 1000;
  const cx = c.x + 0.5, cz = c.y - 2;
  updateChunks(map, cx, cz - 6, R3.camT ? 2 : 99);
  updateActors(map);
  if (!R3.camT) R3.camT = new THREE.Vector3(cx, 0, cz);
  const a = t * 0.06, rad = 24;
  R3.cam.position.set(cx + Math.sin(a) * rad, 13, cz + Math.cos(a) * rad);
  R3.cam.lookAt(cx, 1.5, cz);
  R3.water.position.set(Math.round(cx), -0.1, Math.round(cz)); R3.seabed.position.set(Math.round(cx), -1.3, Math.round(cz));
  updateEnv(map, cx, cz, 19 * 60 + 10, dt);
  R3.scene.fog.near = 30; R3.scene.fog.far = 80;
  R3.renderer.render(R3.scene, R3.cam);
}

// ---------------- COMBATE EN 3D ----------------
const BSCENE = {
  meadow: { props: ['oak', 'oak2', 'bush', 'rock'], ground: '#7cc35a', ground2: '#5aa13f' },
  plains: { props: ['oak2', 'fence', 'bush', 'rock'], ground: '#a5cf63', ground2: '#7fae45' },
  coast: { props: ['rock', 'bigrock', 'bush'], ground: '#f2dfa0', ground2: '#d8c07a', sea: true },
  swamp: { props: ['stump', 'mush', 'oak2', 'bush'], ground: '#5f7a46', ground2: '#46603a' },
  desert: { props: ['cactus', 'bigrock', 'rock'], ground: '#e8cf8a', ground2: '#cfa860' },
  volcano: { props: ['lavarock', 'bigrock', 'rock'], ground: '#5a4a46', ground2: '#3e3230', lava: true },
  snow: { props: ['snowpine', 'snowpine', 'rock'], ground: '#eef4fb', ground2: '#c7dbe8' },
  forest: { props: ['pine', 'oak2', 'giant', 'bush', 'mush'], ground: '#4f8f3e', ground2: '#3b7032' },
  peak: { props: ['snowpine', 'bigrock', 'crystal'], ground: '#8aa86e', ground2: '#6f8f58' },
  indoor: { room: '#4a4560', ground: '#b8a888', ground2: '#8d7d60' },
  gym: { room: '#3a2f55', ground: '#d9cfc4', ground2: '#b5a998', props: ['torch'] },
  corp: { room: '#1d1a26', ground: '#3a3640', ground2: '#26232c', props: ['torch'] },
  liga: { room: '#3a2a10', ground: '#e8dcc0', ground2: '#c4b48c', props: ['torch', 'statue'] }
};
const BPOS = { p: new THREE.Vector3(0, 0, 0), e: new THREE.Vector3(3.3, 0, -5.4) };
function battleScene3D(name) {
  R3.bscenes = R3.bscenes || {};
  if (R3.bscenes[name]) return R3.bscenes[name];
  const S = BSCENE[name] || BSCENE.meadow, sc = new THREE.Scene(), cfg = SCENE_COL[name] || SCENE_COL.meadow;
  const r = mulberry32(strSeed('b3:' + name));
  sc.background = C3(cfg[0]);
  sc.fog = new THREE.Fog(C3(cfg[1]), 18, 46);
  const hemi = new THREE.HemisphereLight(0xe6f2ff, C3(S.ground2), 0.65);
  const sun = new THREE.DirectionalLight(0xfff2dc, 0.75);
  sun.position.set(-7, 14, 9); sun.target.position.set(1.5, 0, -3);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  const scam = sun.shadow.camera; scam.left = -12; scam.right = 12; scam.top = 12; scam.bottom = -12; scam.near = 1; scam.far = 50;
  sun.shadow.bias = -0.0008;
  sc.add(hemi, sun, sun.target);
  // suelo
  const gcv = cnv(128, 128, g => { g.fillStyle = S.ground; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 260; i++) { g.fillStyle = r() > 0.5 ? S.ground2 : shade(S.ground, 10); g.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 2 + Math.floor(r() * 3), 2); } });
  const gt = tex3(gcv, { repeat: true }); gt.repeat.set(14, 14);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshLambertMaterial({ map: gt }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
  if (S.room) {
    const wm = new THREE.MeshLambertMaterial({ color: C3(S.room) });
    const back = new THREE.Mesh(new THREE.BoxGeometry(40, 9, 1), wm); back.position.set(2, 4.5, -16); back.receiveShadow = true; sc.add(back);
    [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.BoxGeometry(1, 9, 30), wm); w.position.set(2 + s * 14, 4.5, -4); w.receiveShadow = true; sc.add(w); });
    sc.background = C3(shade(S.room, -30)); sc.fog = new THREE.Fog(C3(shade(S.room, -30)), 25, 60);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(40, 0.4, 1.1), new THREE.MeshBasicMaterial({ color: C3(shade(S.room, 40)) })); stripe.position.set(2, 3, -15.9); sc.add(stripe);
  }
  if (S.sea) { const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshLambertMaterial({ color: 0x2f86c8, map: R3.waterTex })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.02, -42); sc.add(sea); }
  if (S.lava) { const lv = new THREE.Mesh(new THREE.CircleGeometry(5, 20), R3.lavaMat); lv.rotation.x = -Math.PI / 2; lv.position.set(-9, 0.02, -14); sc.add(lv); const pl = new THREE.PointLight(0xff7b29, 3, 14, 2); pl.position.set(-9, 1.5, -14); sc.add(pl); }
  // plataformas
  const pm = new THREE.MeshLambertMaterial({ color: C3(shade(S.ground, 14)) });
  for (const k of ['p', 'e']) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.65, 0.16, 32), pm);
    p.position.copy(BPOS[k]).y = 0.08; p.receiveShadow = true; sc.add(p);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.05, 4, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    ring.rotation.x = Math.PI / 2; ring.position.copy(BPOS[k]).y = 0.17; sc.add(ring);
  }
  // decorado alrededor (sin tapar la cámara)
  if (S.props) {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const spots = [];
    const n = S.room ? 8 : 46;
    for (let i = 0; i < n * 3 && spots.length < n; i++) {
      const a = r() * Math.PI * 2, rad = S.room ? 7 + r() * 5 : 8 + r() * 22;
      const x = 1.5 + Math.cos(a) * rad, z = -3 + Math.sin(a) * rad;
      if (z > -1 && Math.abs(x) < 14) continue;              // delante de la cámara
      if (S.room && z > -2) continue;
      spots.push([x, z]);
    }
    const by = {};
    spots.forEach(([x, z], i) => { const t = S.props[i % S.props.length]; (by[t] = by[t] || []).push([x, z]); });
    for (const t in by) {
      const md = MODELS[t]; if (!md) continue;
      const add = (geo, mat, cast) => { const im = new THREE.InstancedMesh(geo, mat, by[t].length); by[t].forEach(([x, z], k) => { const s = md.vary ? 0.9 + r() * 0.5 : 1; m4.compose(new THREE.Vector3(x, 0, z), q.setFromEuler(e.set(0, md.rot ? r() * 6.3 : 0, 0)), new THREE.Vector3(s, s, s)); im.setMatrixAt(k, m4); }); im.castShadow = cast; im.receiveShadow = true; sc.add(im); };
      if (md.std) add(md.std, R3.matStd, true);
      if (md.glow) add(md.glow, R3.matGlow, false);
    }
  }
  // criaturas y entrenadores
  const cm = () => { const mat = new THREE.MeshLambertMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, transparent: true, emissive: 0xffffff, emissiveIntensity: 0 }); const m = new THREE.Mesh(R3.geoUnit, mat); m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 }); sc.add(m); return m; };
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex3(cnv(64, 64, g => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,230,120,0.9)'); gr.addColorStop(1, 'rgba(255,213,79,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }), { smooth: true, mip: false }), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  aura.scale.set(4, 4, 1); sc.add(aura);
  const bs = { scene: sc, sun, hemi, e: cm(), p: cm(), tr: cm(), me: cm(), aura, srcs: {} };
  return (R3.bscenes[name] = bs);
}
function setCreatureTex(bs, k, id, flip) {
  if (bs.srcs[k] === id) return;
  bs.srcs[k] = id;
  const m = bs[k], t = sheetTexture(creatureCanvas(id));
  m.material.map = t; m.material.needsUpdate = true;
  m.customDepthMaterial.map = t; m.customDepthMaterial.needsUpdate = true;
  m.userData.flip = flip;
}
function setPersonTex(bs, k, look, custom) {
  const src = custom && CUSTOM_SHEETS[custom] ? CUSTOM_SHEETS[custom] : personSheet(look);
  if (bs.srcs[k] === src) return;
  bs.srcs[k] = src;
  const m = bs[k];
  const t = sheetTexture(src).clone(); t.needsUpdate = true; t.repeat.set(0.25, 0.25);
  t.offset.set(0, k === 'me' ? 0 : 0.75);
  if (m.material.map && m.material.map !== t) m.material.map.dispose();
  m.material.map = t; m.material.needsUpdate = true;
  m.customDepthMaterial.map = t; m.customDepthMaterial.needsUpdate = true;
  const h = 2.6; m.scale.set(h * (src.width / 4) / (src.height / 4), h, 1);
}
function render3DBattle() {
  const a = B.anim, bs = battleScene3D(B.scene);
  const t = now / 1000;
  const portrait = window.innerHeight > window.innerWidth * 1.05;
  const night = MAP && MAP.outdoor && !(BSCENE[B.scene] || {}).room ? clamp(darkness() / 0.62, 0, 1) : 0;
  bs.hemi.intensity = lerp(0.65, 0.4, night); bs.sun.intensity = lerp(0.75, 0.3, night);
  // cámara: detrás de tu Coremon, mirando al rival
  if (!R3.bcam) { R3.bcam = new THREE.PerspectiveCamera(42, 1, 0.1, 200); resize3D(); }
  const cam = R3.bcam;
  const intro = Math.max(a.eOff, 0);
  const sway = Math.sin(t * 0.35) * 0.35, bob = Math.sin(t * 0.27) * 0.12;
  const sh = a.shake > 0 ? (Math.random() - 0.5) * a.shake * 0.02 : 0;
  if (portrait) {
    cam.position.set(1.7 + sway - intro * 3 + sh, 4.6 + bob + intro * 1.6, 8.8 + intro * 5);
    cam.lookAt(1.7, -1.2, -2.8);
  } else {
    cam.position.set(2.4 + sway - intro * 3 + sh, 2.9 + bob + intro * 1.6, 6.8 + intro * 5);
    cam.lookAt(1.9, 0.75, -2.8);
  }
  // Coremon
  const SZ = 2.4;
  const place = (k, mon, show, off, faint, white, flash, lungeK) => {
    const m = bs[k];
    m.visible = !!(show && faint < 1 && !(flash > 0 && Math.floor(flash) % 4 < 2));
    if (!mon) { m.visible = false; return; }
    setCreatureTex(bs, k, mon.species, k === 'p');
    const base = BPOS[k], other = BPOS[k === 'p' ? 'e' : 'p'];
    const big = (SPECIES[mon.species].legendary ? 1.25 : 1) * (k === 'e' ? 1.25 : 1);
    m.scale.set(SZ * big * (k === 'p' ? -1 : 1), SZ * big, 1);
    m.position.set(base.x + off, 0.16 - faint * 1.4 + Math.sin(t * 2.2 + (k === 'p' ? 1 : 0)) * 0.04 - SZ * big * 0.04, base.z);
    if (lungeK) m.position.lerp(new THREE.Vector3(other.x, m.position.y, other.z), lungeK * 0.32);
    m.material.opacity = 1 - faint;
    m.material.emissiveIntensity = white;
    m.lookAt(cam.position.x, m.position.y, cam.position.z);
  };
  const lg = a.lunge;
  place('e', B.enemyTeam[B.ei], a.eShow, a.eOff * 12, a.faint.e, a.white.e, a.flash.e, lg && lg.side === 'e' ? lg.k : 0);
  place('p', G.team[B.pi], a.pShow, -a.pOff * 12, a.faint.p, a.white.p, a.flash.p, lg && lg.side === 'p' ? lg.k : 0);
  const e = B.enemyTeam[B.ei], leg = e && (e.legendary || SPECIES[e.species].legendary);
  bs.aura.visible = !!(leg && a.eShow && a.faint.e < 1);
  bs.aura.position.set(BPOS.e.x + a.eOff * 12, 1.4, BPOS.e.z - 0.3);
  bs.aura.material.opacity = 0.5 + 0.25 * Math.sin(t * 3);
  // entrenadores
  bs.tr.visible = !!(a.tShow && B.trainer);
  if (bs.tr.visible) { setPersonTex(bs, 'tr', B.trainer.look || LOOKS2.grunt, B.trainer.custom); bs.tr.position.set(BPOS.e.x + 1.9 + a.tOff * 12, 0.16, BPOS.e.z - 0.8); bs.tr.lookAt(cam.position.x, 0.16, cam.position.z); }
  bs.me.visible = !a.pShow && a.pOff > 0.01;
  if (bs.me.visible) { setPersonTex(bs, 'me', LOOKS2.player, 'jugador'); bs.me.position.set(BPOS.p.x - 0.6 - a.pOff * 10, 0.16, BPOS.p.z + 0.4); bs.me.lookAt(cam.position.x, 0.16, cam.position.z); }
  R3.waterTex.offset.set((now / 9000) % 1, (now / 13000) % 1);
  R3.renderer.render(bs.scene, cam);
  // posiciones en pantalla para los cuadros, números y partículas (en píxeles del lienzo 2D)
  const proj = (v, h) => {
    const p = v.clone().project(cam), top = v.clone().add(new THREE.Vector3(0, h, 0)).project(cam);
    return { x: (p.x + 1) / 2 * VW, y: (1 - p.y) / 2 * VH, s: Math.abs(top.y - p.y) / 2 * VH };
  };
  const ui = ($('battle-ui').getBoundingClientRect().height || 160) * DPR;
  R3.bl = { portrait, ui, e: proj(new THREE.Vector3(BPOS.e.x, 0.16, BPOS.e.z), SZ * 1.25), p: proj(new THREE.Vector3(BPOS.p.x, 0.16, BPOS.p.z), SZ) };
}
