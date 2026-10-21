# Lanzamiento en itch.io — Coremon: Edición Corazonistas Vitoria

Todo lo necesario para crear la página en <https://itch.io/game/new>. Copia y pega cada bloque.

---

## 1. Datos básicos

| Campo | Valor |
|---|---|
| **Title** | Coremon: Edición Corazonistas Vitoria |
| **Project URL** | `https://acorik.itch.io/coremon` |
| **Short description or tagline** | Captura Coremon, vence a los profes y descubre qué duerme bajo el gimnasio. |
| **Classification** | Games |
| **Kind of project** | HTML (y además archivos descargables) |
| **Release status** | Released |
| **Pricing** | No payments (gratis) o "Donate" con 0 € mínimo |
| **Genre** | Role Playing |
| **Made with** | HTML5, JavaScript, Electron |
| **Average session** | About an hour |
| **Languages** | Spanish |
| **Inputs** | Keyboard, Touchscreen |
| **Accessibility** | Interactive tutorial |
| **Player count** | Singleplayer |
| **Cover image** | `launch/cover-630x500.png` |
| **Banner** (opcional, "Edit theme") | `launch/banner-960x320.png` |
| **Screenshots** | `launch/screenshots/01-titulo.png` … `08-fundador.png` |

**Tags** (máximo 10): `pixel-art`, `creature-collector`, `turn-based`, `rpg`, `retro`, `school`, `2d`, `singleplayer`, `spanish`, `mobile`

---

## 2. Archivos (Uploads)

| Archivo | Marcar como | Notas |
|---|---|---|
| `Coremon-1.0.0-web.zip` | ✅ **This file will be played in the browser** | Sale de `tools/build-web.sh` o del artifact `coremon-web` |
| `Coremon-1.0.0.apk` | Android | El oficial está en `android/release/` y en la release v1.0.0 de GitHub |
| `Coremon-1.0.0-portable.exe` | Windows | Se juega sin instalar |
| `Coremon-Setup-1.0.0.exe` | Windows | Instalador (solo desde GitHub Actions) |
| `Coremon-1.0.0.AppImage` | Linux | |
| `Coremon-1.0.0-mac-arm64.dmg` / `-mac-x64.dmg` | macOS | Apple Silicon / Intel; no está firmado (clic derecho → Abrir) |

### Opciones de la versión del navegador (Embed options)

- **Viewport dimensions:** 960 × 640 (el juego se adapta y pone las dos pantallas en horizontal)
- ✅ **Mobile friendly** → Orientation: *Default*
- ✅ **Fullscreen button**
- ❌ Automatically start on page load (mejor con "Run game": así el sonido arranca con el primer clic)
- ❌ SharedArrayBuffer support (no hace falta)

---

## 3. Descripción (español) — pegar en "Description"

> **Coremon: Edición Corazonistas Vitoria** es un RPG de captura de criaturas con alma de Nintendo DS, ambientado en un colegio de verdad: el Colegio Sagrado Corazón – Corazonistas de Vitoria-Gasteiz.
>
> Es tu primer día de cole. En este colegio cada asignatura es un gimnasio, cada profe es un rival y cada pasillo esconde Coremon salvajes. Elige a tu compañero (Tizorex, Plumavox o Mochiloide), gana las 6 insignias, supera la prueba del Director… y enfréntate al fundador en persona: **el Padre Andrés Coindre**.
>
> ### Qué te espera
>
> - 🎮 **Doble pantalla estilo DS**: el mundo arriba, menús y controles táctiles abajo.
> - 🏫 **El colegio recreado a partir de fotos reales**: vestíbulo de granito, pasillos de ladrillo con puertas amarillas y azules, gimnasio con rocódromo, capilla, salón de actos, biblioteca, patio…
> - 👩‍🏫 **Profes con personalidad**: Alfonsín (que se jubila este año), Gema ("¡el boli tiene que echar humo!"), Iñigo San Juan (se duerme en clase), Jun Arrieta y sus plantas, Mr. Shakespeare, el cascarrabias de Robertiño, el Director…
> - ⚔️ **Combates por turnos** con tipos (Lógica, Letras, Arte, Idioma, Naturaleza y Físico), PP, defensa, críticos, evoluciones y **legendarios**.
> - 📱 **Una misión en primera persona**: el examen práctico del Taller. Resuelve los montajes mirando el móvil a escondidas… y cuando se va la luz, que no te pille el profe.
> - 🕵️ **Secretos**: la sala de profesores (y su castigo en el quinto piso), un diario perdido de 1971, un pasadizo detrás de un cuadro…
> - 🌙 **Contenido tras el final**: legendarios más fuertes, un rival misterioso y una trampilla que respira.
> - 🔊 Música y efectos chiptune.
> - ⏱️ **Más de una hora** de historia, y bastante más si quieres completar la Coredex y todos los secretos.
>
> ### Controles
>
> | | Teclado | Móvil |
> |---|---|---|
> | Moverse | Flechas / WASD | Cruceta |
> | Correr | Shift | Mantener B |
> | Hablar / aceptar | Enter, Espacio, Z | A |
> | Atrás | Esc, X | B |
>
> La partida se guarda automáticamente en tu navegador o dispositivo.
>
> ### Plataformas
>
> Juégalo aquí mismo en el navegador (PC o móvil) o descárgalo para **Android (APK)**, **Windows**, **Linux** y **macOS**.
>
> *Android: al instalar el APK, permite "instalar apps de origen desconocido". La app no pide ningún permiso y funciona sin conexión.*
>
> ---
>
> **Un juego de acorik.** Proyecto de fans hecho por y para la comunidad Corazonistas Vitoria. Inspirado en la historia real del Padre Andrés Coindre (1787–1826), fundador de los Hermanos del Sagrado Corazón.

---

## 4. Description (English) — opcional, debajo de la española

> **Coremon: Corazonistas Vitoria Edition** is a Nintendo DS–style creature-collecting RPG set in a real school in Vitoria-Gasteiz, Spain.
>
> It's your first day at school, where every subject is a gym and every teacher is a rival. Pick your partner, earn 6 badges, pass the Headmaster's trial and face the school's founder himself, Father André Coindre.
>
> - Dual-screen DS layout with touch controls
> - A real school recreated from photos
> - Turn-based battles with 6 types, PP, guarding, evolutions and legendaries
> - A first-person stealth mission: finish your workshop exam while secretly checking your phone, and survive the blackouts
> - Secrets, a lost 1971 diary and post-game content
> - Chiptune music and sound
>
> Play in the browser or download for Android, Windows, Linux and macOS. *(The game text is in Spanish.)*
>
> **A game by acorik.**

---

## 5. Privacidad (por si la piden)

Coremon no recoge datos personales. No tiene anuncios, ni cuentas, ni analíticas, ni conexión a internet. La partida se guarda solo en el propio dispositivo (localStorage). La app de Android no pide ningún permiso.

---

## 6. Post de lanzamiento (devlog de itch.io)

**Título:** ¡Coremon 1.0 ya está aquí!

> Después de muchas horas de pasillos, pizarras y combates, **Coremon: Edición Corazonistas Vitoria** sale hoy en versión 1.0.
>
> Puedes jugarlo gratis en el navegador, en el móvil (APK de Android) o en PC (Windows, Linux y Mac).
>
> Reta a los profes, captura a los Seis Grandes, aprueba el examen del Taller sin que te pillen con el móvil y descubre qué esconde el cuadro del Padre Coindre…
>
> ¡Y esto no acaba aquí! Nos vemos en la **Segunda Edición**. 👀
>
> — acorik

## 7. Texto corto para redes / WhatsApp

> 🎮 ¡Ya está aquí **COREMON: Edición Corazonistas Vitoria**! Un juego estilo Pokémon de DS ambientado en NUESTRO cole: los profes son los líderes de gimnasio, hay legendarios, un examen del taller a oscuras y un jefe final que lleva esperando desde 1821. Gratis para móvil y PC 👉 https://acorik.itch.io/coremon — hecho por acorik ❤️

*(Aquí "estilo Pokémon" es solo una comparación informal. En la página oficial del juego es mejor no usar la marca.)*
