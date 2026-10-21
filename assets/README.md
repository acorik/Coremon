# Assets de Corazonistas Vitoria

Esta primera versión usa colores planos + emoji como marcador de posición para
tiles, sprites y NPCs (ver `drawTile` / `drawSprite` en `js/game.js`). Está
pensado así para poder sustituirlo por fotos reales del colegio sin tocar la
lógica del juego.

## Carpetas previstas

- `tiles/` — texturas de suelo, hierba, paredes y puertas (32x32 o 40x40 px).
- `sprites/` — sprite del jugador, profesores, director, enfermera y Coremon.
- `ui/` — iconos de insignias, cromos de captura, marco de diálogo, etc.

## Cómo engancharlas más adelante

Cuando tengamos las fotos reales del colegio (patio, pasillos, aulas, fachada),
el siguiente paso natural es:

1. Sustituir `drawTile()` para que dibuje una imagen (`Image` / `drawImage`)
   en vez de un rectángulo de color, con fallback al color si la imagen no
   carga (igual que ahora, pero con `img.onerror`).
2. Sustituir el fondo (`bg`) de cada mapa en `js/maps.js` por una foto del
   lugar real (patio, pasillo, aula concreta).
3. Sustituir los emoji de `drawSprite()` por sprites dibujados de cada
   profesor/personaje cuando los tengamos personalizados.

No hace falta cambiar nada de la lógica de mapas, colisiones, puertas ni
combates: todo eso ya funciona sobre la cuadrícula de datos.
