# Coremon 2 — estado y hoja de ruta

Coremon 2 empieza al vencer al Padre Andrés Coindre en Coremon 1 (o al bajar
por la trampilla del gimnasio siendo campeón). Coremon 1 está en `../coremon1/`
y no se toca, salvo el enlace hacia aquí.

## Qué hay ya (jugable de principio a fin)

- **Mundo abierto de Iberión**, de 320 × 240 casillas, generado siempre igual
  (semilla 2026). Tiene 9 regiones con su bioma y clima:
  - Gasteiz (pradera)
  - Ría (costa)
  - Umbría (ciénaga)
  - Almar (desierto)
  - Ignea (volcán)
  - Voltia (llanura tecnológica)
  - Bosque Olvido
  - Nevera (nieve)
  - Cumbre Corazón / Liga
- **Caminos y barreras.** Hay caminos con puentes y pasos de montaña. Las
  barreras de CoraCorp se abren según las medallas.
- **Motor:**
  - movimiento libre en 8 direcciones, con correr y bici;
  - día y noche con luces;
  - lluvia, nieve, ceniza y niebla;
  - minimapa y mapa completo;
  - joystick táctil, teclado y mando.
- **190 especies**: las 31 del colegio y 159 nuevas, con 14 tipos y 9
  legendarios. Los sprites son procedurales, de 64 × 64 con sombreado.
- **Combate completo:**
  - estados alterados y cambios de estadísticas;
  - golpes críticos y bonificación por tipo;
  - inteligencia artificial en los entrenadores;
  - capturas y evoluciones;
  - mochila y cambios de Coremon.
- **Historia:**
  1. Olaia y el inicial.
  2. Rival Unai.
  3. Ocho gimnasios con laberinto y dos entrenadores cada uno.
  4. Reclutas en la Ría.
  5. Lucía en Umbría.
  6. Hugo en Ignea, que suelta el pase.
  7. La Torre CoraCorp en Voltia.
  8. Segundo combate con Unai (6 medallas).
  9. La Cumbre: el presidente Coraza con Mecardio y luego Cimientor.
  10. La Liga: cuatro del Alto Mando y el campeón Unai.
  11. Los legendarios en sus santuarios tras ser campeón. Eclipsor solo sale de
      noche y Albor al amanecer.
- **En el mundo:**
  - 32 entrenadores en las rutas, 16 en los gimnasios y los reclutas de CoraCorp;
  - vecinos y casas con historia;
  - regalos;
  - unos 63 objetos por el suelo;
  - tiendas por niveles;
  - Centros Coremon;
  - un PC para la caja.
- **Partida.** Se importa la de Coremon 1: equipo, caja, cromos, dinero,
  Coredex e insignias. Se guarda en `localStorage` (`coremon2_save_v1`). Desde
  el colegio de Gasteiz se puede volver a Coremon 1.

Duración estimada:

- Historia principal: 3–4 h. Los niveles van del 15 al 60 y los gimnasios
  piden subir de nivel.
- Completar la Coredex y los legendarios: bastante más.

## Mapa del código (`js/`, en orden de carga)

| Archivo | Qué contiene |
|---|---|
| `audio.js` | Música chiptune y efectos con WebAudio |
| `core.js` | Pantalla, utilidades, ruido, estado `G`, guardado, importar de C1, entrada |
| `types.js` | Tipos, tabla de eficacias, estados, movimientos, objetos, tiendas |
| `species.js` | Las 190 especies, líneas evolutivas, estadísticas, `makeMon` |
| `gfx_creatures.js` | Generador de sprites de Coremon |
| `gfx_people.js` | Sprites de personas y texturas propias (`assets/personajes/`) |
| `gfx_world.js` | Casillas, objetos decorativos y edificios |
| `world.js` | Generación del mundo, ciudades, colisiones, render por trozos y minimapa |
| `story.js` | Coremon salvajes, líderes, CoraCorp, Liga, NPC y guiones |
| `interiors.js` | Interiores: centro, tienda, casas, laboratorio, colegio, gimnasios, torre y Liga |
| `battle.js` | Motor de combate y escenas |
| `ui.js` | Diálogos, menús, mochila, Coredex, mapa, tienda, caja y título |
| `main.js` | Jugador, NPC, interacción, clima, luz, HUD y bucle principal |

Las variables globales son compartidas, porque son scripts clásicos sin
módulos. Antes de crear una nueva, mira que el nombre no exista ya.

## Pruebas

- Servidor local: `python3 -m http.server 8000` en la raíz del repositorio.
- Abre `http://localhost:8000/coremon2/index.html`.
- Para probar la historia rápido desde la consola del navegador:

```js
window.say = async () => {}; window.ask = async () => 0;
window.startBattle = async o => o.kind === 'trainer' ? 'win' : 'capture';
startNewGame();
```

Con eso se pueden llamar los guiones con `talkTo(npc)` y comprobar las
banderas en `G.flags` y `G.badges`.

## Pendiente o ideas

- [ ] Texturas de personajes que pasará acorik (ver `assets/personajes/LEEME.md`).
- [ ] Modo online: combates e intercambios. Ahora es un aviso de «Próximamente»
      en el menú. Idea: WebRTC con un servidor de señalización pequeño, o
      Cloudflare Durable Objects.
- [ ] Puzles propios en cada gimnasio, además del laberinto: interruptores,
      hielo que resbala, teletransportes.
- [ ] Más escenas de CoraCorp: el barco negro de la Ría, la excavación de
      Almar.
- [ ] Movimientos con efectos secundarios más variados y habilidades pasivas.
- [ ] Revisar el equilibrio con partidas reales. El equipo importado de C1
      llega a nivel 20–30, así que los dos primeros gimnasios pueden ser
      fáciles.
- [ ] Subir versiones a 2.0.0 en Android y escritorio, recompilar el APK y
      sacar la release.
