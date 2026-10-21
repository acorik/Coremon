// Copia el juego web (raíz del repo) dentro de ./game antes de empaquetar.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(__dirname, 'game');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest']) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of ['css', 'js', 'icons']) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
console.log('Juego copiado en desktop/game');
