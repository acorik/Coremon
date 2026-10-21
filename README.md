# Coremon: Corazonistas Vitoria

Un juego tipo Pokémon ambientado en el colegio Corazonistas Vitoria, jugable
directamente en el navegador (HTML/CSS/JS, sin dependencias ni build).

## Jugar

- **Online (GitHub Pages):** activa Pages en este repo (Settings → Pages →
  Deploy from branch) y abre la URL que te dé.
- **Local / descargado:** abre `index.html` con cualquier navegador, o sirve
  la carpeta con `python3 -m http.server` y entra a `localhost:PUERTO`.

## Historia

Es tu primer día en Corazonistas Vitoria. El colegio tiene 6 plantas
conectadas por un ascensor en la Planta Baja, y cada asignatura es un
gimnasio regentado por un profesor con su propio equipo de Coremon. El
ascensor solo sube más alto según las insignias que consigas. Para llegar a
la 5ª planta y enfrentarte al Director en la Liga Corazonistas necesitas las
6 insignias: Lógica (Matemáticas), Letras (Lengua), Física (Ed. Física),
Arte, Natural (Ciencias) e Idioma (Inglés).

## El colegio

- **Planta Baja:** Tatami (gimnasio de Ed. Física), Salón de Actos, Capilla
  y Sala de Conferencias (estas tres solo dan historia/ambiente), más la
  salida al Patio y el Jardín.
- **1º (Primaria):** aulas de Matemáticas y Lengua. Desbloqueada desde el inicio.
- **2º (Primaria 5º-6º):** Ciencias, Inglés y una Sala de Apoyo y Tecnología
  con Coremon salvajes. Requiere 2 insignias.
- **3º (ESO):** aula de Arte y la Biblioteca ESO (Coremon salvajes). Requiere 4 insignias.
- **4º (Bachillerato):** sala de entrenamiento opcional con Coremon más
  fuertes para subir de nivel antes de la Liga. Requiere 5 insignias.
- **5º (Sala de Profesores):** despacho del Director (combate final) y la
  Sala de Castigo. Requiere las 6 insignias.

## Cómo se juega

- Muévete con las flechas o WASD.
- Usa el ascensor (en cada planta) para moverte entre pisos; los pisos
  bloqueados se ven atenuados y dicen cuántas insignias te faltan.
- Entra en las aulas y habla con el profesor para retarlo a combate.
- En el Patio, el Jardín y las salas de apoyo/biblioteca/bachillerato hay
  Coremon salvajes: lucha, sube de nivel y captúralos con tus cromos (🏷️).
- La Enfermera de la Planta Baja cura gratis a tu equipo.
- En combate puedes **Luchar** (cada movimiento gasta PP), **Defender**
  (no atacas esa ronda pero reduces mucho el daño que recibes), cambiar de
  **Equipo**, lanzar un **Cromo** para capturar, o **Huir**. Los golpes
  también pueden ser bloqueados parcialmente al azar (no muy a menudo), así
  que no sirve de nada spamear siempre el mismo ataque.
- **Consejo:** no retes directamente a un profesor con un solo Coremon.
  Entrena y captura antes de retar la primera aula.
- El progreso se guarda automáticamente en el navegador (`localStorage`).

## Estado de este base

Incluye: colegio de 6 plantas con ascensor y desbloqueo progresivo, salas de
historia sin combate, salas de entrenamiento interior, selección de inicial,
21 especies con evoluciones y sprite propio por línea evolutiva, sistema de
tipos (ciclo de 6), combate por turnos animado (con bloqueo, Defender y
texto flotante) con captura y experiencia, 7 profesores + combate final
contra el Director, guardado de partida.

Pendiente / siguiente iteración natural:
- Sustituir tiles/sprites placeholder por fotos y diseños reales del
  colegio (ver `assets/README.md`).
- Sprites propios para cada profesor (de momento comparten plantilla).
- Más diálogo de historia específico de cada planta/profesor.
