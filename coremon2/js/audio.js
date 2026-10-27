// ============================================================
// COREMON 2 - Sonido chiptune (WebAudio, sin archivos externos)
// sfx(nombre) para efectos, music(pista|null) para la música.
// El navegador solo deja sonar audio tras la primera pulsación.
// ============================================================

let AC = null, master = null, musicBus = null, sfxBus = null;
let audioOn = true;
try { audioOn = localStorage.getItem('coremon_audio') !== 'off'; } catch (e) {}

function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  AC = new Ctx();
  master = AC.createGain(); master.gain.value = audioOn ? 0.5 : 0; master.connect(AC.destination);
  musicBus = AC.createGain(); musicBus.gain.value = 0.2; musicBus.connect(master);
  sfxBus = AC.createGain(); sfxBus.gain.value = 0.45; sfxBus.connect(master);
  if (track.want) startTrack(track.want);
}

function setAudio(on) {
  audioOn = on;
  try { localStorage.setItem('coremon_audio', on ? 'on' : 'off'); } catch (e) {}
  if (master) master.gain.setTargetAtTime(on ? 0.5 : 0, AC.currentTime, 0.05);
  document.querySelectorAll('.audio-btn').forEach(b => { b.textContent = on ? '🔊' : '🔇'; });
}

const NOTE_IDX = { C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11 };
function noteFreq(n) {
  const m = /^([A-G][#b]?)(\d)$/.exec(n);
  if (!m) return 0;
  return 440 * Math.pow(2, (NOTE_IDX[m[1]] + (+m[2] + 1) * 12 - 69) / 12);
}

function tone(freq, at, dur, type, vol, dest, slideTo) {
  if (!AC || !freq) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol || 0.3, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(dest || sfxBus);
  o.start(at); o.stop(at + dur + 0.02);
}

let noiseBuf = null;
function noise(at, dur, vol, dest, freq) {
  if (!AC) return;
  if (!noiseBuf) {
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  s.buffer = noiseBuf;
  f.type = 'lowpass'; f.frequency.value = freq || 4000;
  g.gain.setValueAtTime(vol || 0.3, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f); f.connect(g); g.connect(dest || sfxBus);
  s.start(at); s.stop(at + dur + 0.02);
}

const SFX = {
  blip(t) { tone(880, t, 0.03, 'square', 0.08); },
  select(t) { tone(988, t, 0.05, 'square', 0.15); tone(1319, t + 0.05, 0.07, 'square', 0.15); },
  door(t) { noise(t, 0.12, 0.25, null, 1200); tone(220, t, 0.1, 'triangle', 0.2, null, 110); },
  encounter(t) { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.06, 0.08, 'square', 0.18)); },
  hit(t) { noise(t, 0.18, 0.5, null, 2500); tone(160, t, 0.15, 'square', 0.25, null, 60); },
  crit(t) { noise(t, 0.3, 0.6, null, 5000); tone(320, t, 0.25, 'sawtooth', 0.25, null, 50); },
  guard(t) { tone(1200, t, 0.08, 'triangle', 0.3); tone(1600, t + 0.06, 0.12, 'triangle', 0.25); },
  faint(t) { tone(600, t, 0.6, 'square', 0.2, null, 80); },
  levelup(t) { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.12, 'square', 0.2)); tone(1319, t + 0.36, 0.3, 'square', 0.2); },
  capture(t) { [0, 0.35, 0.7].forEach(d => { tone(300, t + d, 0.08, 'square', 0.2); noise(t + d, 0.06, 0.2, null, 1500); }); },
  item(t) { [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.07, 0.1, 'triangle', 0.25)); },
  heal(t) { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.14, 'triangle', 0.25)); },
  badge(t) { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.13, 'square', 0.2)); },
  rumble(t) { noise(t, 1.4, 0.6, null, 180); tone(55, t, 1.4, 'sawtooth', 0.3, null, 35); },
  clack(t) { noise(t, 0.08, 0.7, null, 6000); tone(90, t, 0.25, 'square', 0.35, null, 40); },
  hum(t) { tone(120, t, 0.5, 'sawtooth', 0.06); },
  buzz(t) { for (let i = 0; i < 3; i++) tone(70, t + i * 0.18, 0.12, 'sawtooth', 0.35); },
  step(t) { noise(t, 0.07, 0.35, null, 500); },
  heart(t) { tone(60, t, 0.12, 'sine', 0.6); tone(55, t + 0.2, 0.14, 'sine', 0.5); },
  tick(t) { tone(2000, t, 0.02, 'square', 0.06); },
  cough(t) { noise(t, 0.12, 0.4, null, 900); noise(t + 0.18, 0.1, 0.35, null, 800); },
  caught(t) { [880, 0, 698, 0, 523].forEach((f, i) => f && tone(f, t + i * 0.08, 0.2, 'sawtooth', 0.25)); noise(t, 0.4, 0.4, null, 3000); },
  win(t) { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.1, 0.14, 'square', 0.2)); },
  ok(t) { tone(1047, t, 0.07, 'square', 0.15); tone(1568, t + 0.07, 0.12, 'square', 0.15); },
  bad(t) { tone(200, t, 0.18, 'square', 0.2, null, 120); },
  bump(t) { noise(t, 0.12, 0.5, null, 700); tone(80, t, 0.12, 'square', 0.25, null, 50); },
  shot(t) { noise(t, 0.16, 0.7, null, 4000); tone(900, t, 0.08, 'square', 0.2, null, 120); },
  engine(t) { tone(70, t, 0.6, 'sawtooth', 0.18, null, 140); noise(t, 0.6, 0.15, null, 400); },
  ko(t) { [700, 500, 300].forEach((f, i) => tone(f, t + i * 0.08, 0.1, 'square', 0.18)); },
  quest(t) { [659, 784, 988, 1319].forEach((f, i) => tone(f, t + i * 0.08, 0.14, 'triangle', 0.25)); },
  siren(t) { for (let i = 0; i < 4; i++) tone(i % 2 ? 660 : 880, t + i * 0.22, 0.2, 'square', 0.12); },
  shiny(t) { [1568, 2093, 2637, 3136, 2637, 3136].forEach((f, i) => tone(f, t + i * 0.06, 0.12, 'triangle', 0.16)); },
  splash(t) { noise(t, 0.35, 0.35, null, 1800); tone(400, t, 0.2, 'sine', 0.15, null, 900); },
  bite(t) { tone(1200, t, 0.06, 'square', 0.25); tone(1200, t + 0.1, 0.06, 'square', 0.25); tone(1600, t + 0.2, 0.1, 'square', 0.25); },
  whoosh(t) { noise(t, 0.9, 0.35, null, 900); tone(200, t, 0.9, 'sine', 0.12, null, 600); },
  trophy(t) { [784, 988, 1175, 1568, 1175, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.07, 0.12, 'triangle', 0.22)); }
};

function sfx(name) {
  if (!AC || !audioOn || !SFX[name]) return;
  SFX[name](AC.currentTime + 0.01);
}

// ---------------- MÚSICA ----------------
// Cada pista: tempo (corcheas por minuto) y voces con notas separadas por
// espacios: 'E5' nota, '-' silencio, '=' alarga la nota anterior.
const TRACKS = {
  overworld: { bpm: 280, voices: [
    { wave:'square', vol:0.16, notes:'E5 = G5 = C6 = B5 A5 G5 = E5 = C5 = D5 E5 F5 = A5 = F5 = D5 = E5 F5 G5 = = = - - E5 = G5 = C6 = D6 C6 B5 = G5 = E5 = F5 E5 D5 = G5 = B4 = C5 = = = = = - - - -' },
    { wave:'triangle', vol:0.3, notes:'C3 - G3 - C3 - G3 - A2 - E3 - A2 - E3 - F2 - C3 - F2 - C3 - G2 - D3 - G2 - B2 - C3 - G3 - C3 - G3 - A2 - E3 - A2 - E3 - F2 - C3 - G2 - D3 - C3 - G3 - C3 - - -' }
  ]},
  battle: { bpm: 340, voices: [
    { wave:'square', vol:0.15, notes:'A4 C5 E5 A5 G5 E5 C5 E5 F5 A5 C6 A5 G5 E5 D5 E5 A4 C5 E5 A5 B5 A5 G5 E5 F5 = E5 = D5 = E5 = A5 = = G5 F5 = E5 = D5 = F5 = E5 = C5 = A4 C5 E5 G5 F5 E5 D5 C5 B4 = C5 = D5 = E5 =' },
    { wave:'triangle', vol:0.32, notes:'A2 A3 A2 A3 A2 A3 A2 A3 F2 F3 F2 F3 G2 G3 G2 G3 A2 A3 A2 A3 A2 A3 A2 A3 F2 F3 G2 G3 E2 E3 E2 E3 D2 D3 D2 D3 D2 D3 D2 D3 F2 F3 F2 F3 A2 A3 A2 A3 F2 F3 F2 F3 G2 G3 G2 G3 E2 E3 E2 E3 E2 E3 E2 E3' }
  ]},
  tense: { bpm: 220, voices: [
    { wave:'triangle', vol:0.35, notes:'A1 - - - A1 - - - Bb1 - - - A1 - - - A1 - - - A1 - - - C2 - - - B1 - - -' },
    { wave:'square', vol:0.06, notes:'- - - - E5 - - - - - - - F5 - - - - - - - E5 - - - - - - - D#5 - - -' }
  ]},
  calm: { bpm: 180, voices: [
    { wave:'triangle', vol:0.22, notes:'E5 = = D5 C5 = D5 E5 G5 = = = E5 = = = F5 = = E5 D5 = C5 D5 E5 = = = = = - - C5 = = D5 E5 = G5 A5 G5 = = E5 C5 = = = D5 = = E5 F5 = E5 D5 C5 = = = = = - -' },
    { wave:'triangle', vol:0.25, notes:'C3 = = = G3 = = = A2 = = = E3 = = = F2 = = = C3 = = = G2 = = = G3 = = = C3 = = = G3 = = = A2 = = = E3 = = = F2 = = = G2 = = = C3 = = = = = = =' }
  ]}
};

// ---- Pistas nuevas de Coremon 2 ----
Object.assign(TRACKS, {
  // campo abierto: alegre y amplia
  field: { bpm: 300, voices: [
    { wave:'square', vol:0.13, notes:'G4 = B4 = D5 = G5 = F#5 = D5 = E5 = C5 = A4 = = = B4 C5 D5 = E5 = D5 = B4 = G4 = A4 = B4 = A4 = = = - - G4 = B4 = D5 = G5 = A5 = G5 = F#5 = E5 = D5 = C5 = B4 =' },
    { wave:'triangle', vol:0.3, notes:'G2 - D3 - G2 - D3 - C3 - G3 - C3 - G3 - A2 - E3 - A2 - E3 - D3 - A3 - D3 - F#3 - G2 - D3 - G2 - D3 - E2 - B2 - E2 - B2 - C3 - G3 - D3 - A3 - G2 - D3 - G2 - - -' }
  ]},
  // ciudad: tranquila y con paso
  city: { bpm: 240, voices: [
    { wave:'triangle', vol:0.24, notes:'C5 = E5 = G5 = E5 = F5 = A5 = G5 = = = E5 = D5 = F5 = E5 = C5 = D5 = = = - - C5 = E5 = G5 = C6 = B5 = G5 = A5 = F5 = D5 = E5 = C5 = = = = = - - - - - -' },
    { wave:'square', vol:0.08, notes:'C3 C3 G3 G3 A2 A2 E3 E3 F2 F2 C3 C3 G2 G2 D3 D3 C3 C3 G3 G3 A2 A2 E3 E3 F2 F2 G2 G2 C3 C3 - -' }
  ]},
  // combate salvaje del mundo
  wild: { bpm: 360, voices: [
    { wave:'square', vol:0.14, notes:'E5 G5 B5 E6 D6 B5 G5 B5 C6 E6 G6 E6 D6 B5 A5 B5 E5 G5 B5 E6 F#6 E6 D6 B5 C6 = B5 = A5 = B5 = E6 = = D6 C6 = B5 = A5 = C6 = B5 = G5 = E5 G5 B5 D6 C6 B5 A5 G5 F#5 = G5 = A5 = B5 =' },
    { wave:'triangle', vol:0.32, notes:'E2 E3 E2 E3 E2 E3 E2 E3 C2 C3 C2 C3 D2 D3 D2 D3 E2 E3 E2 E3 E2 E3 E2 E3 C2 C3 D2 D3 B1 B2 B1 B2 A1 A2 A1 A2 A1 A2 A1 A2 C2 C3 C2 C3 E2 E3 E2 E3 C2 C3 C2 C3 D2 D3 D2 D3 B1 B2 B1 B2 B1 B2 B1 B2' }
  ]},
  // líderes de gimnasio, CoraCorp y Liga
  boss: { bpm: 380, voices: [
    { wave:'sawtooth', vol:0.09, notes:'A4 A4 C5 A4 D5 A4 E5 D5 C5 C5 E5 C5 F5 E5 D5 C5 B4 B4 D5 B4 E5 D5 C5 B4 A4 = E5 = A5 = G5 = F5 F5 A5 F5 G5 F5 E5 D5 E5 E5 G5 E5 A5 G5 F5 E5 D5 D5 F5 D5 G5 F5 E5 D5 C5 = B4 = A4 = = =' },
    { wave:'triangle', vol:0.34, notes:'A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 F1 F2 F1 F2 G1 G2 G1 G2 G1 G2 G1 G2 E1 E2 E1 E2 E1 E2 E1 E2 D2 D3 D2 D3 D2 D3 D2 D3 C2 C3 C2 C3 C2 C3 C2 C3 B1 B2 B1 B2 B1 B2 B1 B2 E1 E2 E1 E2 E1 E2 E1 E2' }
  ]},
  // noche en el mundo
  night: { bpm: 160, voices: [
    { wave:'triangle', vol:0.2, notes:'E5 = = = B4 = = = C5 = = D5 E5 = = = G5 = = = F#5 = = = E5 = = = - - - - D5 = = = A4 = = = B4 = = C5 D5 = = = F#5 = = = E5 = = = D5 = = = - - - -' },
    { wave:'triangle', vol:0.22, notes:'E3 = = = = = = = C3 = = = = = = = A2 = = = = = = = B2 = = = = = = = D3 = = = = = = = B2 = = = = = = = C3 = = = = = = = B2 = = = = = = =' }
  ]},
  // CoraCorp: marcha fría y metálica
  corp: { bpm: 260, voices: [
    { wave:'square', vol:0.1, notes:'D5 - D5 - F5 - D5 - G5 - F5 - E5 - C5 - D5 - D5 - F5 - A5 - G#5 = = = - - - - D5 - D5 - F5 - D5 - G5 - A5 - Bb5 - A5 - G5 - F5 - E5 - C5 - D5 = = = - - - -' },
    { wave:'sawtooth', vol:0.07, notes:'D2 D2 D3 D2 D2 D2 D3 D2 C2 C2 C3 C2 C2 C2 C3 C2 Bb1 Bb1 Bb2 Bb1 Bb1 Bb1 Bb2 Bb1 A1 A1 A2 A1 A1 A1 A2 A1' }
  ]},
  // victoria
  victory: { bpm: 320, voices: [
    { wave:'square', vol:0.14, notes:'C5 E5 G5 C6 = = G5 C6 = = = = - - - - D5 F5 A5 D6 = = A5 D6 = = = = - - - - E5 G5 B5 E6 = = D6 = C6 = B5 = C6 = = = = = = = - - - -' },
    { wave:'triangle', vol:0.3, notes:'C3 = = = G3 = = = C3 = = = - - - - D3 = = = A3 = = = D3 = = = - - - - E3 = = = B3 = = = C3 = = = = = = = - - - - - - - -' }
  ]}
});

const track = { name: null, want: null, timer: null, step: 0, next: 0 };

function music(name) {
  track.want = name;
  if (!AC) return;
  if (track.name === name) return;
  startTrack(name);
}

function startTrack(name) {
  if (track.timer) { clearInterval(track.timer); track.timer = null; }
  track.name = name;
  if (!name || !TRACKS[name]) return;
  const tr = TRACKS[name];
  const voices = tr.voices.map(v => Object.assign({}, v, { seq: v.notes.trim().split(/\s+/) }));
  const L = Math.max(...voices.map(v => v.seq.length));
  voices.forEach(v => { const n = v.seq.length; if (L % n === 0) { const r = v.seq.slice(); while (v.seq.length < L) v.seq.push(...r); } });
  const stepDur = 60 / tr.bpm;
  track.step = 0; track.next = AC.currentTime + 0.1;
  track.timer = setInterval(() => {
    while (track.next < AC.currentTime + 0.25) {
      voices.forEach(v => {
        const n = v.seq[track.step % v.seq.length];
        if (n === '-' || n === '=') return;
        let len = 1;
        while (v.seq[(track.step + len) % v.seq.length] === '=' && len < 16) len++;
        tone(noteFreq(n), track.next, stepDur * len * 0.92, v.wave, v.vol, musicBus);
      });
      track.step++; track.next += stepDur;
    }
  }, 60);
}


// La primera pulsación del usuario desbloquea el audio; cualquier botón hace "clic".
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, audioInit, true));
document.addEventListener('click', e => { if (e.target.closest('button')) sfx('select'); }, true);
