# Coremon: Edición Corazonistas Vitoria

Un juego tipo Pokémon con aspecto de Nintendo DS (dos pantallas), ambientado en
el colegio Corazonistas de Vitoria-Gasteiz. HTML/CSS/JS puro: sin dependencias
ni compilación.

## Jugar

- **Online (GitHub Pages):** activa Pages en el repo (Settings → Pages →
  Deploy from branch) y abre la URL.
- **Descargado:** baja el repo entero (botón "Code" → "Download ZIP"),
  descomprime y abre `index.html`. Necesitas toda la carpeta (`css/`, `js/`),
  no solo el HTML.

## Controles

| Acción | Teclado | Pantalla táctil |
|---|---|---|
| Moverse | Flechas / WASD | Cruceta |
| Correr | Mantener Shift | Mantener B |
| Hablar / usar (A) | Enter, Espacio o Z | Botón A |
| Atrás (B) | Esc, X o Retroceso | Botón B |

La pantalla de abajo tiene el equipo, la mochila, la Coredex y el guardado.
La partida también se guarda sola al cambiar de sala.

## Historia

En 1817, en Lyon, el joven sacerdote Andrés Coindre encontró a dos niñas
temblando de frío en el pórtico de Saint-Nizier, y en 1821 fundó los Hermanos
del Sagrado Corazón para educar a niños sin hogar. Doscientos años después,
empiezas tu primer día en el colegio de Vitoria, el centro corazonista con más
alumnos de España.

Cada asignatura es un gimnasio. Consigue las 6 insignias, supera la prueba del
Director y enfréntate al jefe final: el Padre Andrés Coindre, en la Sala del
Fundador.

## El colegio

Los espacios están recreados a partir de fotos reales del colegio.

- **Exterior:** fachada de pilastras de ladrillo rojo, piedra gris y
  ventanales blancos, entrada con arco y logo de Kristau Eskola.
- **Planta Baja:** vestíbulo de granito negro con pasillo central de granito
  beige, paredes de travertino y puertas de madera clara (secretaría,
  enfermería, máquinas expendedoras, taquillas, vitrina de trofeos). Puerta
  de cristal a la entrada principal y puertas dobles con la escalera que sube
  al Patio. Gimnasio (suelo azul, rocódromo y colchonetas azules), Salón de Actos (butacas de madera con
  cojines de colores, escenario con cortinas rojas y pantalla), Capilla y
  Sala de Conferencias. Del Patio (cancha de baloncesto) se pasa al Jardín.
- **Pasillos de las plantas:** ladrillo naranja con mampara de cristal,
  terrazo azul-gris, murales y dibujos. Puertas con marco azul marino y ojo
  de buey: amarillas en 1ª y 3ª planta, azules en 2ª y 4ª.
- **1ª planta (Primaria):** Matemáticas y Lengua.
- **2ª planta (5º-6º):** Ciencias (laboratorio), Inglés y Sala de Apoyo y
  Tecnología (ordenadores, Coremon salvajes). Requiere 2 insignias.
- **3ª planta (ESO):** Arte (caballetes) y Biblioteca. Requiere 4 insignias.
- **4ª planta (Bachillerato):** zona de entrenamiento con Coremon fuertes.
  Requiere 5 insignias.
- **5ª planta (Sala de Profesores):** despacho del Director, Sala de Castigo y
  Sala del Fundador (se abre al vencer al Director). Requiere 6 insignias.

Solo hay personal donde tiene sentido: cada profe en su aula, la enfermera, la
secretaria, la bibliotecaria, el conserje... Además hay alumnos paseando por
los pasillos y alumnos que te retan a combate.

## Combate

- **Luchar:** cada movimiento gasta PP. Los ataques de tu mismo tipo hacen un
  20% más, hay golpes críticos y bloqueos ocasionales.
- **Defender:** no atacas esa ronda, pero encajas muchísimo menos daño.
- **Mochila:** bocadillos y menús (curan), zumo (PP), tirita (reanima),
  caramelo raro (sube nivel), cromos y cromos dorados (capturar).
- **Equipo** y **Huir** (no se puede huir de un profesor).
- La experiencia se reparte: el que lucha recibe toda y el resto del equipo la
  mitad.
- El daño es constante: apenas varía entre un golpe y otro.
- Los Coremon salvajes suben de nivel a la vez que tu equipo. La **hierba
  oscura** (zona salvaje del patio y fondo del jardín) tiene Coremon de más
  nivel, ya evolucionados, y el doble de probabilidad de **legendarios** (★).
- Dicen que en la capilla el retrato del fundador esconde algo...

## Archivos

- `js/data.js`: tipos, movimientos, especies, objetos, profesores y alumnos.
- `js/sprites.js`: sprites pixel-art de Coremon (una silueta por línea
  evolutiva) y de personas (cada profe con su aspecto).
- `js/scenery.js`: suelos, paredes, puertas y decoración (con animaciones).
- `js/maps.js`: todas las salas del colegio.
- `js/game.js`: mundo, movimiento, diálogos y cinemáticas.
- `js/ui.js`: pantalla inferior (menús, mochila, tienda, taquillas, Coredex).
- `js/battle.js`: combate.

Para cambiar el aspecto de un profesor, edita su `look` en `TRAINERS`
(`js/data.js`): peinado (`short`, `long`, `bald`, `spiky`, `bun`, `cap`),
colores de pelo, piel, camisa y pantalón, gafas, barba, falda o sotana.
