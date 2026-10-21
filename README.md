# Coremon: Corazonistas Vitoria

Un juego tipo Pokémon ambientado en el colegio Corazonistas Vitoria, jugable
directamente en el navegador (HTML/CSS/JS, sin dependencias ni build).

## Jugar

- **Online (GitHub Pages):** activa Pages en este repo (Settings → Pages →
  Deploy from branch) y abre la URL que te dé.
- **Local / descargado:** abre `index.html` con cualquier navegador, o sirve
  la carpeta con `python3 -m http.server` y entra a `localhost:PUERTO`.

## Historia

Es tu primer día en Corazonistas Vitoria. Cada asignatura es un gimnasio
regentado por un profesor con su propio equipo de Coremon. Para llegar a la
Liga Corazonistas y enfrentarte al Director necesitas las 6 insignias:
Matemáticas, Lengua, Educación Física, Arte, Ciencias Naturales e Inglés.

## Cómo se juega

- Muévete con las flechas o WASD.
- Entra en las aulas desde el pasillo central y habla con el profesor para
  retarlo a combate.
- En el Patio y el Jardín hay hierba con Coremon salvajes: lucha, sube de
  nivel y captúralos con tus cromos (🏷️) para ampliar tu equipo.
- La Enfermera del pasillo cura gratis a tu equipo.
- **Consejo:** no reveses directamente a un profesor con un solo Coremon.
  Entrena y captura en el Patio antes de retar a la primera aula.
- El progreso se guarda automáticamente en el navegador (`localStorage`).

## Estado de este primer base

Incluye: mapa completo del colegio (pasillo + 6 aulas + patio + jardín +
despacho del director), selección de inicial, 21 especies con evoluciones,
sistema de tipos (ciclo de 6), combate por turnos con captura y experiencia,
6 profesores + combate final contra el Director, guardado de partida.

Pendiente / siguiente iteración natural:
- Sustituir tiles/sprites placeholder por fotos reales del colegio
  (ver `assets/README.md`).
- Personalizar nombres/diseños de profesores y Coremon con el equipo real.
- Más diálogo de historia entre gimnasios si se quiere alargar la partida.
