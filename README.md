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

La pantalla de abajo tiene el equipo, la mochila, la Coredex, el guardado y
el **objetivo actual** (📍), para saber siempre adónde ir. La partida también
se guarda sola al cambiar de sala. El botón 🔊 quita o pone el sonido (música y
efectos chiptune generados en el propio navegador, sin archivos de audio).

## Historia

En 1817, en Lyon, el joven sacerdote Andrés Coindre encontró a dos niñas
temblando de frío en el pórtico de Saint-Nizier, y en 1821 fundó los Hermanos
del Sagrado Corazón para educar a niños sin hogar. Doscientos años después,
empiezas tu primer día en el colegio de Vitoria, el centro corazonista con más
alumnos de España.

Cada asignatura es un gimnasio. Consigue las 6 insignias, supera la prueba del
Director y enfréntate al jefe final: el Padre Andrés Coindre, en la Sala del
Fundador. Al vencerle te avisa de que bajo el colegio duerme algo mucho más
grande... nos vemos en la Segunda Edición.

Por el colegio hay 8 páginas perdidas del **diario de Txema**, un alumno de
1971 que descubrió de dónde salen los Coremon. Se leen desde la mochila y, si
las juntas todas, hay premio.

**Después del final:** la hierba del patio y del jardín se revuelve (Coremon
de más nivel y muchos más legendarios, Corazonix incluido), aparece un alumno
misterioso muy fuerte en la zona salvaje y la trampilla del gimnasio...
respira.

## El colegio

Los espacios están recreados a partir de fotos reales del colegio.

- **Exterior:** fachada de pilastras de ladrillo rojo, piedra gris y
  ventanales blancos, entrada con arco y logo de Kristau Eskola.
- **Planta Baja:** vestíbulo de granito negro con pasillo central de granito
  beige, paredes de travertino y puertas de madera clara (secretaría,
  enfermería, máquinas expendedoras, taquillas, vitrina de trofeos). Puerta
  de cristal a la entrada principal y, al fondo del pasillo a la derecha, la
  escalera que sube al Patio. Pilares cuadrados de travertino con zócalo de
  granito. Gimnasio (suelo azul, rocódromo y colchonetas azules), Salón de
  Actos (butacas de madera con cojines de colores, escenario con cortinas
  rojas y pantalla), Capilla y Sala de Conferencias.
- **Patio:** se recorre hacia la derecha. Cancha de baloncesto y balonmano,
  fuente, bancos, profe de guardia, alumnos jugando (y el único futbolista,
  chutando contra la pared), la zona salvaje de hierba oscura y, al final del
  camino, el Jardín.
- **Pasillos de las plantas:** ladrillo naranja con mampara de cristal,
  terrazo azul-gris, murales y dibujos. Puertas con marco azul marino y ojo
  de buey: amarillas en 1ª y 3ª planta, azules en 2ª y 4ª.
- **1ª planta (Primaria):** Matemáticas y Lengua.
- **2ª planta (5º-6º):** Ciencias (laboratorio), Inglés, Sala de Apoyo
  (ordenadores, Coremon salvajes) y el **Taller de Tecnología**. Requiere 2
  insignias.
- **3ª planta (ESO):** Arte (caballetes) y Biblioteca. Requiere 4 insignias.
- **4ª planta (Bachillerato):** zona de entrenamiento con Coremon fuertes.
  Requiere 5 insignias.
- **5ª planta (Sala de Profesores):** despacho del Director, Sala de Castigo y
  Sala del Fundador (se abre al vencer al Director). Requiere 6 insignias.

Solo hay personal donde tiene sentido: cada profe en su aula, la enfermera, la
secretaria, la bibliotecaria, el conserje... Además hay alumnos paseando por
los pasillos y alumnos que te retan a combate.

## Misión del Taller: examen práctico

Un minijuego distinto, en primera persona. Tienes que hacer tres montajes
(matriz de LEDs, cableado y código) antes de que se acabe el tiempo. Los
esquemas solo los tienes en el móvil (A o el botón de abajo para mirarlo):

- Míralo solo cuando el profe esté de espaldas escribiendo en la pizarra. Si
  deja de escribir y carraspea (**¡EJEM!**), escóndelo: se va a dar la vuelta.
- Cuando se acaba el tiempo, salta el cuadro eléctrico y la clase se queda a
  oscuras unos segundos. A oscuras, la pantalla del móvil te delata: si lo
  enciendes, sus gafas brillan cada vez más cerca. Y si te vibra, siléncialo
  rápido.
- Si te pilla con el móvil, castigo en el quinto piso. Si apruebas: 1000
  monedas y un Coremon de nivel 18 que sale de tu placa.

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
- `js/taller.js`: minijuego del Taller de Tecnología.
- `js/audio.js`: música y efectos de sonido (WebAudio).

Para cambiar el aspecto de un profesor, edita su `look` en `TRAINERS`
(`js/data.js`): peinado (`short`, `long`, `bald`, `spiky`, `bun`, `cap`),
colores de pelo, piel, camisa y pantalón, gafas, barba, falda o sotana.
