// ============================================================
// COREMON - Taller de Tecnología: examen práctico en primera persona
// (estilo "noche de terror"): resuelve los montajes mirando los esquemas
// en el móvil sin que el profe te pille. Al acabar el tiempo de cada
// montaje salta el cuadro eléctrico y la clase se queda a oscuras unos
// segundos: a oscuras, la pantalla del móvil te delata.
// ============================================================

let taller = null;
const TALLER_ROUNDS = [
  { kind:'leds',      time: 32000, turnWarn: 950, watch:[1500, 2300], board:[3200, 5600] },
  { kind:'cables',    time: 30000, turnWarn: 800, watch:[1600, 2500], board:[2800, 5000], buzz: true },
  { kind:'secuencia', time: 28000, turnWarn: 650, watch:[1700, 2700], board:[2400, 4400], buzz: true }
];
const BLACKOUT_MS = 5600, FLICKER_MS = 900;
const WIRE_COLORS = [['Rojo', '#e53935'], ['Azul', '#1e88e5'], ['Verde', '#43a047'], ['Amarillo', '#fdd835'], ['Blanco', '#eceff1']];
const SEQ_KEYS = [['▲', '#e53935'], ['●', '#1e88e5'], ['■', '#43a047'], ['★', '#fdd835'], ['♥', '#ec407a'], ['◆', '#8e24aa']];

// ---------------- CONVERSACIÓN CON EL PROFE ----------------
async function tallerTalk(a) {
  STATE = 'CUTSCENE';
  const P = 'Profe de Tecnología';
  if (!game.flags.tallerIntro) {
    await say([`${P}: Bienvenido al taller. Aquí se aprende con las manos, no con la boca.`,
      `${P}: Hoy toca examen práctico: tres montajes, cada uno con su tiempo. Si funcionan los tres, aprobado.`,
      `${P}: Y nada de móviles. Al que pille con el móvil, directo al quinto piso, al aula de castigo.`,
      `${P}: Ah, y si se va la luz, que nadie se mueva. El cuadro eléctrico de este taller salta cuando le da la gana.`]);
    game.flags.tallerIntro = true;
  } else if (game.flags.tallerDone) {
    await say(`${P}: ¿Quieres repetir el examen práctico? Si apruebas, te llevas 150 monedas.`);
  } else {
    await say(`${P}: ¿Vienes a recuperar el examen práctico?`);
  }
  const yes = await askYesNo('¿Empezar el examen práctico?', 'Sí, ¡vamos!', 'Ahora no');
  if (!yes) { await say(`${P}: Tú mismo. El taller no se va a mover de aquí.`); STATE = 'OVERWORLD'; return; }
  await say([`${P}: Muy bien. Siéntate en tu banco. El tiempo empieza... ¡ya!`]);
  await fadeTo(1, 400);
  startTaller();
  await fadeTo(0, 400);
}

function startTaller() {
  taller = { active: true, round: 0, phone: false, phoneK: 0, fx: [], log: '' };
  STATE = 'MINIGAME';
  music('tense');
  showTouch('taller');
  beginRound(0);
}

function beginRound(i) {
  const R = TALLER_ROUNDS[i];
  Object.assign(taller, {
    round: i, phase: 'intro', t0: now, timeMax: R.time, timeLeft: R.time, solved: false,
    teacher: { state: 'board', until: now + 2400 + R.board[0], x: 0.5, dir: 1, step: 0 },
    dark: null, chalk: 0, nextTick: 0
  });
  taller.puzzle = makePuzzle(R.kind);
  tallerUI();
}

const rnd = n => Math.floor(Math.random() * n);
const between = (a, b) => a + Math.random() * (b - a);
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = rnd(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function makePuzzle(kind) {
  if (kind === 'leds') {
    const target = new Array(16).fill(false);
    shuffle([...Array(16).keys()]).slice(0, 7).forEach(i => { target[i] = true; });
    return { kind, target, cells: new Array(16).fill(false) };
  }
  if (kind === 'cables') {
    return { kind, target: shuffle([0, 1, 2, 3, 4]), links: [null, null, null, null, null], sel: null };
  }
  const target = [];
  for (let i = 0; i < 7; i++) { let k; do { k = rnd(SEQ_KEYS.length); } while (k === target[i - 1]); target.push(k); }
  return { kind: 'secuencia', target, pos: 0, flash: null };
}

function puzzleSolved(p) {
  if (p.kind === 'leds') return p.cells.every((c, i) => c === p.target[i]);
  if (p.kind === 'cables') return p.links.every((l, i) => l === p.target[i]);
  return p.pos >= p.target.length;
}

// ---------------- MÓVIL ----------------
function tallerPhone() {
  if (!taller || !taller.active) return;
  const d = taller.dark;
  if (d && d.buzzing) {
    d.buzzing = false; d.silenced = true;
    taller.phone = false;
    sfx('ok');
    tallerUI();
    return;
  }
  if (!['on', 'blackout', 'intro'].includes(taller.phase)) return;
  taller.phone = !taller.phone;
  tallerUI();
}

// ---------------- BUCLE ----------------
function updateTaller(dt) {
  const T = taller;
  if (!T || !T.active) return;
  const R = TALLER_ROUNDS[T.round];
  const target = T.phone || (T.dark && T.dark.buzzing) ? 1 : 0;
  T.phoneK += (target - T.phoneK) * Math.min(1, dt / 90);
  const el = now - T.t0;

  if (T.phase === 'intro') {
    if (el > 2200) { T.phase = 'on'; T.t0 = now; }
    return;
  }

  if (T.phase === 'on') {
    T.timeLeft -= dt * (T.solved ? 5 : 1);
    if (now > T.nextTick) { sfx('tick'); T.nextTick = now + (T.timeLeft < 8000 ? 500 : 1000); }
    const tc = T.teacher;
    if (tc.state === 'board') {
      T.chalk += dt;
      tc.x += tc.dir * dt / 9000;
      if (tc.x > 0.72 || tc.x < 0.28) tc.dir *= -1;
      tc.step += dt;
      if (now > tc.until) { tc.state = 'turning'; tc.until = now + R.turnWarn; sfx('cough'); }
    } else if (tc.state === 'turning') {
      if (now > tc.until) { tc.state = 'watching'; tc.until = now + between(R.watch[0], R.watch[1]); }
    } else if (tc.state === 'watching') {
      if (T.phoneK > 0.35) { caughtInTaller('phone'); return; }
      if (now > tc.until) { tc.state = 'board'; tc.until = now + between(R.board[0], R.board[1]); }
    }
    if (T.timeLeft <= 0) {
      T.timeLeft = 0;
      T.phase = 'blackout'; T.t0 = now;
      music(null); sfx('clack');
      T.dark = { approach: 0, gx: 0.5, gy: 0.3, nextStep: now + 500, nextBeat: now + 700,
        buzzAt: R.buzz ? now + between(1400, 3300) : null, buzzing: false, buzzT: 0, silenced: false };
      tallerUI();
    }
    return;
  }

  if (T.phase === 'blackout') {
    const d = T.dark;
    if (now > d.nextStep) { sfx('step'); d.nextStep = now + 520 + Math.random() * 300; }
    if (now > d.nextBeat) { sfx('heart'); d.nextBeat = now + (d.approach > 0.4 ? 520 : 850); }
    // el profe pasea a oscuras: sus gafas brillan
    d.gx = 0.5 + Math.sin(el / 900) * 0.32 * (1 - d.approach);
    d.gy = 0.28 + d.approach * 0.45;
    const lit = T.phoneK > 0.35;
    // mirar el móvil a oscuras te delata rápido; la vibración, algo menos (tienes un momento para silenciarlo)
    const rate = d.buzzing ? 1 / 3200 : 1 / 1300;
    d.approach = Math.max(0, Math.min(1, d.approach + (lit ? dt * rate : -dt / 5000)));
    if (d.buzzAt && !d.buzzing && !d.silenced && now > d.buzzAt) {
      d.buzzing = true; d.buzzT = now; sfx('buzz'); tallerUI();
    }
    if (d.buzzing && Math.floor((now - d.buzzT) / 380) !== Math.floor((now - d.buzzT - dt) / 380)) sfx('buzz');
    if (d.buzzing && now - d.buzzT > 1700) { caughtInTaller('buzz'); return; }
    if (d.approach >= 1) { caughtInTaller('phone'); return; }
    if (el > BLACKOUT_MS) { T.phase = 'flicker'; T.t0 = now; sfx('hum'); tallerUI(); }
    return;
  }

  if (T.phase === 'flicker') {
    if (Math.floor(el / 110) !== Math.floor((el - dt) / 110) && Math.random() < 0.6) sfx('clack');
    if (el > FLICKER_MS) {
      T.dark = null;
      if (T.phoneK > 0.35) { caughtInTaller('phone'); return; }
      if (!T.solved) { caughtInTaller('time'); return; }
      T.phase = 'pass'; T.t0 = now; sfx('ok');
      tallerUI();
    }
    return;
  }

  if (T.phase === 'pass') {
    if (el > 1600) {
      if (T.round + 1 < TALLER_ROUNDS.length) { music('tense'); beginRound(T.round + 1); }
      else tallerFinish('win');
    }
    return;
  }

  if (T.phase === 'caught') {
    if (el > 2200) tallerFinish(T.reason);
  }
}

function caughtInTaller(reason) {
  taller.phase = 'caught'; taller.t0 = now; taller.reason = reason;
  taller.dark = null;
  music(null); sfx('caught');
  shake = 1; setTimeout(() => { shake = 0; }, 450);
  tallerUI();
}

async function tallerFinish(result) {
  const T = taller;
  T.active = false; taller = null;
  STATE = 'CUTSCENE';
  showTouch('main');
  music(roomTrack(game.room));
  const P = 'Profe de Tecnología';
  if (result === 'win') {
    sfx('win');
    await say([`${P}: A ver... LEDs, bien. Cables, bien. Secuencia... funciona.`, `${P}: Tres de tres. Aprobado. Y sin móvil, ¿eh? Así me gusta.`]);
    if (!game.flags.tallerDone) {
      game.flags.tallerDone = true;
      game.coins += 1000;
      await say(['¡Has recibido 1000 monedas!', '¡De repente, tu placa empieza a echar chispas!']);
      sfx('rumble');
      await cinematic({ type:'gift', species:'chispin' }, 3200);
      const mon = createPokemon('chispin', 18);
      game.seen.chispin = true; game.caught.chispin = true;
      if (game.team.length < 6) game.team.push(mon); else game.box.push(mon);
      sfx('levelup');
      await say([`¡Un Chispín de nivel 18 ha salido de tu circuito!`,
        game.team.includes(mon) ? 'Chispín se une a tu equipo.' : 'Tu equipo está lleno: Chispín va a las taquillas del vestíbulo.',
        `${P}: Vaya... eso solo pasa cuando un circuito funciona a la primera. Cuídalo bien.`]);
      if (!game.flags.page5) await givePage(5);
    } else {
      game.coins += 150;
      await say('¡Has recibido 150 monedas!');
    }
    STATE = 'OVERWORLD'; saveGame(); refreshTouch();
    return;
  }
  if (result === 'time') {
    await say([`${P}: Se acabó el tiempo y este montaje no funciona.`, `${P}: Suspendido. Puedes repetirlo cuando quieras, pero practica antes.`]);
    STATE = 'OVERWORLD'; saveGame(); refreshTouch();
    return;
  }
  // pillado con el móvil: castigo en el quinto piso
  await say([`${P}: ¡¿ESO ES UN MÓVIL?!`, `${P}: Requisado. Y tú, al quinto piso. Al aula de castigo. ¡Ya!`]);
  await fadeTo(1, 400);
  game.castigoUntil = Date.now() + CASTIGO_MS;
  game.castigoReason = 'taller';
  const c = MAPS.sala_castigo;
  enterRoom('sala_castigo', c.spawn.x, c.spawn.y, 'up');
  saveGame();
  await fadeTo(0, 400);
  await say(['Te quedas aquí 45 segundos sin móvil, pensando en lo que has hecho.', 'Mira el contador de la pantalla de abajo.']);
  STATE = 'OVERWORLD';
  refreshTouch();
}

// ---------------- PANTALLA INFERIOR ----------------
const tlCanvas = document.getElementById('tl-canvas');
const tlCtx = tlCanvas.getContext('2d');
const TLW = tlCanvas.width, TLH = tlCanvas.height;

function tallerUI() {
  const T = taller;
  if (!T) return;
  const btn = document.getElementById('tl-phone');
  const d = T.dark;
  btn.classList.toggle('alarm', !!(d && d.buzzing));
  btn.textContent = d && d.buzzing ? '🔕 ¡SILENCIAR EL MÓVIL!' : T.phone ? '📱 ESCONDER MÓVIL (A)' : '📱 MIRAR MÓVIL (A)';
  document.getElementById('touch-taller').classList.toggle('dark', !!d);
  document.getElementById('tl-round').textContent = `MONTAJE ${T.round + 1}/3`;
}

function drawTallerTouch() {
  const T = taller;
  const g = tlCtx;
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#2e3b2f'; g.fillRect(0, 0, TLW, TLH);
  // placa de prototipos
  box(g, 6, 6, TLW - 12, TLH - 12, '#1b5e20', OUT);
  g.fillStyle = '#2e7d32';
  for (let x = 16; x < TLW - 12; x += 10) for (let y = 16; y < TLH - 12; y += 10) g.fillRect(x, y, 2, 2);
  const p = T.puzzle;
  if (p.kind === 'leds') {
    const s = 46, ox = TLW / 2 - s * 2, oy = 22;
    for (let i = 0; i < 16; i++) {
      const cx = ox + (i % 4) * s + s / 2, cy = oy + Math.floor(i / 4) * s + s / 2;
      circ(g, cx, cy, 17, '#263238', OUT);
      circ(g, cx, cy, 12, p.cells[i] ? '#ff5252' : '#5d1b1b', OUT);
      if (p.cells[i]) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(cx - 5, cy - 6, 4, 4); }
    }
    g.fillStyle = '#c8e6c9'; g.font = 'bold 11px monospace'; g.textAlign = 'center';
    g.fillText('Enciende los LEDs como en el esquema', TLW / 2, TLH - 14);
  } else if (p.kind === 'cables') {
    for (let i = 0; i < 5; i++) {
      const y = 30 + i * 38;
      box(g, 30, y - 10, 40, 20, WIRE_COLORS[i][1], OUT);
      if (p.sel === i) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(26, y - 14, 48, 28); }
      box(g, TLW - 70, y - 12, 40, 24, '#cfd8dc', OUT);
      g.fillStyle = '#263238'; g.font = 'bold 14px monospace'; g.textAlign = 'center';
      g.fillText(String(i + 1), TLW - 50, y + 5);
      if (p.links[i] != null) {
        const ty = 30 + p.links[i] * 38;
        g.strokeStyle = OUT; g.lineWidth = 7;
        g.beginPath(); g.moveTo(70, y); g.bezierCurveTo(TLW / 2, y, TLW / 2, ty, TLW - 70, ty); g.stroke();
        g.strokeStyle = WIRE_COLORS[i][1]; g.lineWidth = 4; g.stroke();
      }
    }
    g.fillStyle = '#c8e6c9'; g.font = 'bold 11px monospace'; g.textAlign = 'center';
    g.fillText('Toca un cable y luego su borne', TLW / 2, TLH - 14);
  } else {
    for (let i = 0; i < 6; i++) {
      const x = 52 + (i % 3) * 120, y = 34 + Math.floor(i / 3) * 74;
      const lit = p.flash && p.flash.k === i && now - p.flash.t < 200;
      box(g, x, y, 92, 58, lit ? '#ffffff' : SEQ_KEYS[i][1], OUT);
      g.fillStyle = lit ? SEQ_KEYS[i][1] : '#fafafa'; g.font = 'bold 30px monospace'; g.textAlign = 'center';
      g.fillText(SEQ_KEYS[i][0], x + 46, y + 40);
    }
    for (let i = 0; i < p.target.length; i++) circ(g, TLW / 2 - (p.target.length - 1) * 11 + i * 22, 192, 6, i < p.pos ? '#76ff03' : '#33691e', OUT);
    g.fillStyle = '#c8e6c9'; g.font = 'bold 11px monospace'; g.textAlign = 'center';
    g.fillText('Pulsa la secuencia en orden', TLW / 2, TLH - 14);
  }
  if (T.solved) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, TLW, TLH);
    g.fillStyle = '#76ff03'; g.font = 'bold 20px monospace'; g.textAlign = 'center';
    g.fillText('✔ MONTAJE TERMINADO', TLW / 2, TLH / 2 - 6);
    g.font = 'bold 12px monospace'; g.fillStyle = '#fafafa';
    g.fillText('Esconde el móvil y disimula...', TLW / 2, TLH / 2 + 16);
  }
  if (T.dark) { g.fillStyle = 'rgba(0,0,0,0.92)'; g.fillRect(0, 0, TLW, TLH); }
  const bar = document.getElementById('tl-time');
  bar.style.width = (T.timeLeft / T.timeMax * 100) + '%';
  bar.className = T.timeLeft < 8000 ? 'low' : '';
}

function tallerClick(e) {
  const T = taller;
  if (!T || T.phase !== 'on' || T.solved) return;
  const r = tlCanvas.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * TLW, y = (e.clientY - r.top) / r.height * TLH;
  const p = T.puzzle;
  if (p.kind === 'leds') {
    const s = 46, ox = TLW / 2 - s * 2, oy = 22;
    const cx = Math.floor((x - ox) / s), cy = Math.floor((y - oy) / s);
    if (cx < 0 || cx > 3 || cy < 0 || cy > 3) return;
    p.cells[cy * 4 + cx] = !p.cells[cy * 4 + cx];
    sfx('blip');
  } else if (p.kind === 'cables') {
    const row = Math.round((y - 30) / 38);
    if (row < 0 || row > 4) return;
    if (x < TLW / 2) { p.sel = row; sfx('blip'); }
    else if (p.sel != null) {
      p.links.forEach((l, i) => { if (l === row) p.links[i] = null; });
      p.links[p.sel] = row; p.sel = null; sfx('select');
    }
  } else {
    let k = -1;
    for (let i = 0; i < 6; i++) {
      const bx = 52 + (i % 3) * 120, by = 34 + Math.floor(i / 3) * 74;
      if (x >= bx && x <= bx + 92 && y >= by && y <= by + 58) k = i;
    }
    if (k < 0) return;
    p.flash = { k, t: now };
    if (p.target[p.pos] === k) { p.pos++; sfx('blip'); }
    else { p.pos = 0; sfx('bad'); }
  }
  if (puzzleSolved(p)) { T.solved = true; sfx('ok'); }
}
tlCanvas.addEventListener('pointerdown', e => { e.preventDefault(); tallerClick(e); });
document.getElementById('tl-phone').addEventListener('pointerdown', e => { e.preventDefault(); tallerPhone(); });

// ---------------- PANTALLA SUPERIOR (POV) ----------------
const PW = { l: 96, r: 416, t: 52, b: 222 }; // pared del fondo

function drawTaller() {
  const T = taller;
  const c = ctx;
  c.imageSmoothingEnabled = false;
  const sx = shake ? Math.random() * 6 - 3 : 0;
  c.save(); c.translate(sx, 0);
  if (T.phase === 'caught') { drawCaught(c, T); c.restore(); drawTallerTouch(); return; }
  let lights = 1;
  if (T.phase === 'blackout') lights = 0;
  if (T.phase === 'flicker') lights = Math.random() < 0.5 ? 1 : 0.1;
  if (T.phase === 'intro' && now - T.t0 < 700) lights = Math.floor((now - T.t0) / 90) % 2 ? 0.15 : 1; // los fluorescentes parpadean al encenderse
  drawClassroom(c, T);
  if (lights < 1) {
    c.fillStyle = `rgba(0,0,0,${1 - lights * 0.97})`;
    c.fillRect(-10, 0, VIEW_W + 20, VIEW_H);
    drawDarkness(c, T, lights);
  }
  drawPhone(c, T, lights);
  drawHud(c, T);
  c.restore();
  drawTallerTouch();
}

function poly(c, pts, fill) { c.fillStyle = fill; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); }

function drawClassroom(c, T) {
  // techo con fluorescentes
  poly(c, [[0, 0], [VIEW_W, 0], [PW.r, PW.t], [PW.l, PW.t]], '#d7dde0');
  for (let i = 0; i < 3; i++) {
    const y = 8 + i * 15, w = 150 - i * 30;
    box(c, VIEW_W / 2 - w / 2, y, w, 6, '#ffffff', '#9e9e9e');
  }
  // paredes laterales
  poly(c, [[0, 0], [PW.l, PW.t], [PW.l, PW.b], [0, 300]], '#c1734a');
  poly(c, [[VIEW_W, 0], [PW.r, PW.t], [PW.r, PW.b], [VIEW_W, 300]], '#b5683f');
  c.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 1; i < 9; i++) {
    const k = i / 9;
    c.fillRect(0, k * 300 * 0.9 + (1 - k) * 0, PW.l * 0.98, 1);
  }
  // panel de herramientas (izquierda) y persianas bajadas (derecha)
  poly(c, [[14, 70], [80, 84], [80, 170], [14, 190]], '#c8a165');
  c.fillStyle = '#6d4c41'; c.fillRect(30, 100, 4, 40); c.fillStyle = '#e53935'; c.fillRect(50, 110, 6, 22); c.fillStyle = '#90a4ae'; c.fillRect(64, 96, 10, 4);
  poly(c, [[VIEW_W - 14, 64], [PW.r + 16, 80], [PW.r + 16, 186], [VIEW_W - 14, 210]], '#90a4ae');
  c.fillStyle = '#78909c';
  for (let i = 0; i < 12; i++) c.fillRect(PW.r + 18, 86 + i * 9, VIEW_W - PW.r - 34, 2);
  // cartel de salida (izquierda, arriba)
  box(c, 20, 40, 44, 14, '#1b5e20', OUT); c.fillStyle = '#b9f6ca'; c.font = 'bold 8px monospace'; c.textAlign = 'center'; c.fillText('SALIDA', 42, 50);
  // pared del fondo de ladrillo
  box(c, PW.l, PW.t, PW.r - PW.l, PW.b - PW.t, '#cf7d52');
  c.fillStyle = 'rgba(0,0,0,0.13)';
  for (let y = PW.t + 8; y < PW.b; y += 8) c.fillRect(PW.l, y, PW.r - PW.l, 1);
  // pizarra con lo que va escribiendo el profe
  box(c, 150, 78, 212, 84, '#5d4037', OUT);
  box(c, 154, 82, 204, 76, '#2e5e3a');
  c.fillStyle = '#e8f5e9'; c.font = 'bold 12px monospace'; c.textAlign = 'left';
  c.fillText('TECNOLOGÍA - Examen práctico', 160, 98);
  const lines = ['V = I · R', 'P = V · I', 'Resistencia: 220 Ω', 'LED: ánodo (+) cátodo (-)'];
  const shown = Math.min(lines.length * 14, Math.floor(T.chalk / 400));
  let left = shown;
  lines.forEach((l, i) => { const n = Math.min(l.length, left); left -= n; c.fillText(l.slice(0, n), 160, 116 + i * 12); });
  // reloj con el tiempo que queda
  circ(c, 386, 74, 15, '#fafafa', OUT);
  const ang = -Math.PI / 2 + (1 - T.timeLeft / T.timeMax) * Math.PI * 2;
  c.strokeStyle = '#d32f2f'; c.lineWidth = 2; c.beginPath(); c.moveTo(386, 74); c.lineTo(386 + Math.cos(ang) * 11, 74 + Math.sin(ang) * 11); c.stroke();
  // cuadro eléctrico
  box(c, 120, 100, 18, 24, '#9e9e9e', OUT);
  c.fillStyle = Math.floor(now / 200) % 5 === 0 ? '#ff1744' : '#4a0b0b'; c.fillRect(126, 114, 4, 4);
  // suelo
  poly(c, [[0, 300], [PW.l, PW.b], [PW.r, PW.b], [VIEW_W, 300], [VIEW_W, VIEW_H], [0, VIEW_H]], '#a7a7a7');
  c.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i = 0; i < 6; i++) { const y = PW.b + i * i * 6; c.fillRect(0, y, VIEW_W, 1); }
  // profe en la pizarra
  const tc = T.teacher;
  const facing = tc.state === 'board' ? 'up' : tc.state === 'turning' ? (tc.dir > 0 ? 'right' : 'left') : 'down';
  const frame = tc.state === 'board' && Math.floor(tc.step / 260) % 4 === 1 ? 1 : 0;
  const tx = 160 + tc.x * 190;
  drawPerson(c, TECNO_LOOK, tx, 224, 104, facing, frame);
  if (tc.state === 'turning') bubbleText(c, tx + 34, 128, '¡EJEM!', '#fff59d');
  if (tc.state === 'watching') bubbleText(c, tx + 34, 128, '👀', '#ffffff');
  // bancos y compañeros (de espaldas)
  bench(c, 120, 248, 272, 18);
  [152, 256, 360].forEach((x, i) => drawPerson(c, randomStudentLook(i * 7 + 3), x, 262, 66, 'up', 0));
  bench(c, 120, 248, 272, 18, true);
  [60, 452].forEach((x, i) => drawPerson(c, randomStudentLook(i * 11 + 20), x, 318, 92, 'up', 0));
  bench(c, 0, 300, 120, 22, true); bench(c, VIEW_W - 120, 300, 120, 22, true);
  // tu banco
  box(c, 60, 330, 392, 60, '#c8a165', OUT);
  c.fillStyle = '#a8834f'; c.fillRect(60, 344, 392, 2);
  // tu placa en miniatura
  box(c, 200, 334, 112, 30, '#1b5e20', OUT);
  const p = T.puzzle;
  if (p.kind === 'leds') p.cells.forEach((on, i) => { c.fillStyle = on ? '#ff5252' : '#4a1010'; c.fillRect(214 + (i % 4) * 22, 337 + Math.floor(i / 4) * 6, 8, 4); });
  else if (p.kind === 'cables') p.links.forEach((l, i) => { if (l != null) { c.fillStyle = WIRE_COLORS[i][1]; c.fillRect(210, 338 + i * 5, 92, 2); } });
  else for (let i = 0; i < p.target.length; i++) { c.fillStyle = i < p.pos ? '#76ff03' : '#33691e'; c.fillRect(214 + i * 13, 344, 8, 8); }
  // tus manos (uniforme azul marino)
  box(c, 300 + Math.sin(now / 300) * 3, 352, 40, 40, '#1f3b73', OUT);
  box(c, 302 + Math.sin(now / 300) * 3, 344, 26, 16, '#f2c49b', OUT);
}

function bench(c, x, y, w, h, front) {
  if (front) { box(c, x, y, w, h, '#b38b55', OUT); c.fillStyle = '#8d6e63'; c.fillRect(x, y + h - 4, w, 4); return; }
  box(c, x, y - 4, w, 8, '#c8a165', OUT);
}

function bubbleText(c, x, y, text, bg) {
  c.font = 'bold 12px monospace'; c.textAlign = 'center';
  const w = c.measureText(text).width + 12;
  box(c, x - w / 2, y - 14, w, 18, bg, OUT);
  c.fillStyle = '#1d1a26'; c.fillText(text, x, y);
}

function drawDarkness(c, T, lights) {
  const d = T.dark;
  // cartel de salida verde: lo único que se ve
  c.fillStyle = 'rgba(105,240,174,0.25)'; c.beginPath(); c.arc(42, 47, 30, 0, Math.PI * 2); c.fill();
  box(c, 20, 40, 44, 14, '#1b5e20', OUT); c.fillStyle = '#b9f6ca'; c.font = 'bold 8px monospace'; c.textAlign = 'center'; c.fillText('SALIDA', 42, 50);
  if (!d) return;
  // brillo de las gafas del profe, cada vez más cerca si el móvil está encendido
  const gx = d.gx * VIEW_W, gy = d.gy * VIEW_H, s = 1 + d.approach * 3.2;
  if (d.approach > 0.55) {
    c.fillStyle = `rgba(30,30,40,${(d.approach - 0.55) * 1.6})`;
    c.beginPath(); c.ellipse(gx, gy + 40 * s, 26 * s, 50 * s, 0, 0, Math.PI * 2); c.fill();
  }
  const blink = Math.floor(now / 1700) % 4 === 3 && now % 1700 < 140;
  if (!blink) {
    c.fillStyle = '#fff9c4';
    c.fillRect(gx - 9 * s, gy, 7 * s, 3 * s); c.fillRect(gx + 2 * s, gy, 7 * s, 3 * s);
  }
  c.textAlign = 'center'; c.font = 'italic 13px monospace';
  const el = now - T.t0;
  c.fillStyle = 'rgba(200,200,200,0.7)';
  if (d.approach > 0.3) c.fillText('«¿Quién tiene el móvil encendido...?»', VIEW_W / 2, VIEW_H - 70);
  else if (el < 1600) c.fillText('¡CLAC! Se ha ido la luz...', VIEW_W / 2, VIEW_H - 70);
  else c.fillText('(no te muevas...)', VIEW_W / 2, VIEW_H - 70);
  if (d.buzzing) {
    c.fillStyle = '#ff5252'; c.font = 'bold 16px monospace';
    c.fillText('📳 ¡BZZZ! ¡El móvil vibra! ¡Siléncialo!', VIEW_W / 2 + 40, 100);
  }
}

function drawPhone(c, T, lights) {
  const k = T.phoneK;
  const w = 168, h = 250;
  const x = 18, y = VIEW_H - 18 - k * (h - 16);
  if (k < 0.02) { box(c, x + 10, VIEW_H - 8, w - 20, 14, '#212121', OUT); return; }
  // a oscuras, la pantalla ilumina tu cara y tu banco
  if (lights < 0.5) {
    const g = c.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, 260);
    g.addColorStop(0, `rgba(120,180,255,${0.45 * k})`); g.addColorStop(1, 'rgba(120,180,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  // mano que sujeta el móvil
  box(c, x + w - 30, y + h - 40, 44, 60, '#f2c49b', OUT);
  box(c, x, y, w, h, '#1b1b1f', OUT);
  box(c, x + 8, y + 18, w - 16, h - 36, '#eceff1');
  c.fillStyle = '#424242'; c.fillRect(x + w / 2 - 14, y + 7, 28, 4);
  const sx = x + 8, sy = y + 18, sw = w - 16;
  const d = T.dark;
  if (d && d.buzzing) {
    box(c, sx, sy, sw, h - 36, '#1565c0');
    c.fillStyle = '#fff'; c.font = 'bold 13px monospace'; c.textAlign = 'center';
    c.fillText('📞 MAMÁ', sx + sw / 2, sy + 70); c.font = '11px monospace';
    c.fillText('llamada entrante...', sx + sw / 2, sy + 92);
    c.fillText('¡SILENCIA (A)!', sx + sw / 2, sy + 150);
    return;
  }
  box(c, sx, sy, sw, 22, '#075e54');
  c.fillStyle = '#fff'; c.font = 'bold 10px monospace'; c.textAlign = 'left';
  c.fillText('Esquemas Tecno 📎', sx + 6, sy + 15);
  const p = T.puzzle;
  const cx = sx + sw / 2;
  c.textAlign = 'center';
  if (p.kind === 'leds') {
    c.fillStyle = '#263238'; c.font = 'bold 10px monospace';
    c.fillText('Montaje 1: matriz LED', cx, sy + 40);
    for (let i = 0; i < 16; i++) {
      const lx = cx - 52 + (i % 4) * 28 + 14, ly = sy + 66 + Math.floor(i / 4) * 28;
      circ(c, lx, ly, 10, p.target[i] ? '#ff5252' : '#cfd8dc', OUT);
    }
    c.fillStyle = '#607d8b'; c.font = '9px monospace'; c.fillText('rojo = encendido', cx, sy + 192);
  } else if (p.kind === 'cables') {
    c.fillStyle = '#263238'; c.font = 'bold 10px monospace';
    c.fillText('Montaje 2: cableado', cx, sy + 40);
    p.target.forEach((t, i) => {
      const ly = sy + 62 + i * 28;
      box(c, sx + 12, ly - 9, 30, 16, WIRE_COLORS[i][1], OUT);
      c.fillStyle = '#263238'; c.font = 'bold 13px monospace'; c.textAlign = 'center';
      c.fillText('→  ' + (t + 1), cx + 18, ly + 4);
    });
  } else {
    c.fillStyle = '#263238'; c.font = 'bold 10px monospace';
    c.fillText('Montaje 3: código', cx, sy + 40);
    p.target.forEach((t, i) => {
      const lx = sx + 22 + (i % 4) * 32, ly = sy + 60 + Math.floor(i / 4) * 44;
      box(c, lx - 13, ly, 26, 30, SEQ_KEYS[t][1], OUT);
      c.fillStyle = '#fff'; c.font = 'bold 16px monospace'; c.fillText(SEQ_KEYS[t][0], lx, ly + 21);
      c.fillStyle = i < p.pos ? '#2e7d32' : '#9e9e9e'; c.font = '9px monospace'; c.fillText(String(i + 1), lx, ly + 40);
    });
  }
}

function drawHud(c, T) {
  c.textAlign = 'center';
  if (T.phase === 'intro') {
    box(c, VIEW_W / 2 - 150, 150, 300, 70, 'rgba(10,10,20,0.85)', OUT);
    c.fillStyle = '#ffd54f'; c.font = 'bold 22px monospace';
    c.fillText(`MONTAJE ${T.round + 1}/3`, VIEW_W / 2, 182);
    c.fillStyle = '#fafafa'; c.font = '12px monospace';
    c.fillText(['Matriz de LEDs', 'Cableado', 'Código de seguridad'][T.round], VIEW_W / 2, 204);
  }
  if (T.phase === 'pass') {
    box(c, VIEW_W / 2 - 150, 150, 300, 60, 'rgba(10,30,10,0.85)', OUT);
    c.fillStyle = '#76ff03'; c.font = 'bold 20px monospace';
    c.fillText('¡MONTAJE CORRECTO!', VIEW_W / 2, 186);
  }
  if (T.phase === 'on') {
    const secs = Math.ceil(T.timeLeft / 1000);
    box(c, VIEW_W - 92, 6, 84, 22, 'rgba(10,10,20,0.75)', OUT);
    c.fillStyle = secs <= 8 ? '#ff5252' : '#fafafa'; c.font = 'bold 13px monospace';
    c.fillText(`⏱ ${secs}s`, VIEW_W - 50, 22);
  }
}

function drawCaught(c, T) {
  const el = now - T.t0;
  c.fillStyle = '#2a0606'; c.fillRect(0, 0, VIEW_W, VIEW_H);
  const z = Math.min(1, el / 220);
  // el profe se planta delante de tu banco, a un palmo de tu cara
  drawPerson(c, TECNO_LOOK, VIEW_W / 2, VIEW_H + 150 + (1 - z) * 220, 470, 'down', 0);
  const v = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 120, VIEW_W / 2, VIEW_H / 2, 330);
  v.addColorStop(0, 'rgba(120,0,0,0)'); v.addColorStop(1, `rgba(120,0,0,${0.75 + 0.2 * Math.sin(el / 60)})`);
  c.fillStyle = v; c.fillRect(0, 0, VIEW_W, VIEW_H);
  if (el < 120) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(0, 0, VIEW_W, VIEW_H); }
  c.textAlign = 'center'; c.font = 'bold 24px monospace'; c.lineWidth = 6; c.strokeStyle = '#000';
  const msg = T.reason === 'time' ? '¿Y ESTE MONTAJE?' : T.reason === 'buzz' ? '¡¿QUÉ ES ESE RUIDO?!' : '¡¿ESO ES UN MÓVIL?!';
  c.strokeText(msg, VIEW_W / 2, 52); c.fillStyle = '#fff'; c.fillText(msg, VIEW_W / 2, 52);
}
