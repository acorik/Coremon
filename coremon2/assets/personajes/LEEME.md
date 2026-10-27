# Texturas de los personajes de Coremon 2

Deja aquí un PNG con el nombre del personaje y el juego lo usará en lugar del
sprite generado, tanto en el mundo como en los combates. Si el archivo no
existe, se usa el dibujo de siempre: no hace falta tenerlos todos.

## Formato

- **PNG con fondo transparente.**
- Una hoja de **4 × 4 fotogramas** del mismo tamaño:

| Fila | Mirando hacia |
|---|---|
| 1 | abajo (hacia la cámara) |
| 2 | izquierda |
| 3 | derecha |
| 4 | arriba (de espaldas) |

Columnas: quieto, paso con un pie, quieto, paso con el otro pie.

- Tamaño recomendado de cada fotograma: **24 × 32 px** (hoja de 96 × 128) o
  cualquier múltiplo (48 × 64, 96 × 128...). El juego lo escala para que mida
  40 px de alto en el mundo, con los pies abajo del todo y centrado.
- Pixel art sin suavizar: el juego lo dibuja con píxeles nítidos.

## Nombres de archivo

| Archivo | Personaje |
|---|---|
| `jugador.png` | Tú |
| `olaia.png` | Dra. Olaia |
| `unai.png` | Unai, el rival (y campeón) |
| `recluta.png` | Reclutas de CoraCorp |
| `lucia.png` | Administradora Lucía |
| `hugo.png` | Administrador Hugo |
| `coraza.png` | Presidente Ricardo Coraza |
| `enfermera.png` | Enfermera del Centro Coremon |
| `dependiente.png` | Dependiente de la tienda |
| `lider_gasteiz.png` | Amaia (Naturaleza) |
| `lider_ria.png` | Capitán Koldo (Agua) |
| `lider_umbria.png` | Sorgina Maite (Sombra) |
| `lider_almar.png` | Arqueóloga Nerea (Roca) |
| `lider_ignea.png` | Herrero Iker (Fuego) |
| `lider_voltia.png` | Ingeniera Zuriñe (Eléctrico) |
| `lider_bosque.png` | Pastor Beñat (Aire) |
| `lider_nevera.png` | Montañera Garazi (Hielo) |
| `liga1.png` … `liga4.png` | Alto Mando: Argia, Euclides, Oihana, Mikel |

Después de añadir o cambiar un PNG, recarga la página (en el móvil, cierra y
abre la app; la APK hay que volver a compilarla).
