# 🧟 ZombiesKiller - OLEADAS: INFIERNO

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

**Juego de defensa por oleadas con mecánicas de mejora, logros y zombies con habilidades especiales.**

> Proyecto desarrollado para la asignatura "El Relevo del Desarrollador". El juego está preparado para ser transferido a un nuevo equipo de mantenimiento, con documentación completa y código modular.

---

## 📋 Requisitos de software

- **Navegador web moderno** (Google Chrome, Firefox, Edge, Safari) con soporte para HTML5, CSS3 y ES6.
- **No requiere** Node.js, Java, Docker ni servidor web. Se ejecuta directamente en el navegador abriendo el archivo `index.html`.
- **Opcional**: Servidor local (Live Server de VS Code) para desarrollo, pero no necesario.

---

## 🚀 Pasos para el despliegue en local

1. **Descargar o clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/ZombiesKiller.git
   cd ZombiesKiller
Abrir el juego:

Método 1: Haz doble clic en el archivo index.html.

Método 2: Si usas VS Code, instala la extensión "Live Server" y haz clic derecho sobre index.html → "Open with Live Server".

¡Jugar! Usa el ratón y el teclado (ver controles en el menú de pausa o la sección de abajo).

Nota: No se requiere configuración de variables de entorno.

🎮 Controles básicos
Acción	Tecla / Ratón
Moverse	WASD o Flechas
Disparar / Atacar	Mantener clic izquierdo
Cambiar arma	1 (largo), 2 (corto), 3 (cuerpo a cuerpo)
Dash (esquive rápido)	Shift
Patada	C
Pausa / Menú	ESC
📂 Estructura del proyecto y arquitectura
text
ZombiesKiller/
├── index.html       # Estructura principal del juego y menús
├── style.css        # Estilos visuales (UI, paneles, overlays)
├── game.js          # Lógica completa del juego (motor, colisiones, IA)
├── README.md        # Este archivo
├── CHANGELOG.md     # Historial de versiones
└── docs/            # Documentación técnica y manuales
Patrón de diseño:

Frontend MVC ligero: El canvas actúa como la Vista (draw()), el objeto player y arrays (zombies, projectiles) son el Modelo, y la función update() junto con los controladores de eventos actúan como Controlador.

Arquitectura por componentes: Separación clara entre lógica de juego (game.js), presentación HTML/CSS y eventos.

Para más detalles, consulta docs/architecture.md.

📖 Documentación de API (funciones públicas)
Al no haber backend, la "API" se refiere a las funciones globales expuestas por el juego para ser usadas en pruebas o ampliaciones:

Función / Variable	Tipo	Descripción
player	Object	Propiedades del jugador (vida, velocidad, armas, mejoras).
zombies	Array	Lista de zombies activos.
projectiles	Array	Proyectiles del jugador.
damageZombie()	function	Inflige daño a un zombie y maneja efectos (explosión, quemadura, etc.).
applyDamageToPlayer()	function	Aplica daño al jugador respetando reducción y escudo.
shootWeapon()	function	Dispara el arma activa según el ángulo del ratón.
spawnWave()	function	Genera una nueva oleada de zombies.
showLevelUpMenu()	function	Muestra el menú de mejora al subir de nivel.
Para una referencia completa, consulta docs/api-documentation.md.

🧪 Mantenibilidad y tests (cómo añadir nuevas funcionalidades)
➕ Añadir un nuevo tipo de zombie
En game.js, localiza la función pickZombieType() y añade el nuevo tipo a la lista pool con su peso de aparición.

En spawnWave(), define su configuración (hp, speed, r, color, score, baseDmg).

En update(), añade sus comportamientos especiales (si aplica) en el bloque de IA.

En damageZombie(), añade efectos especiales al morir (explosión, etc.).

➕ Añadir una nueva arma
En WEAPON_CATALOG, añade un nuevo objeto con nombre, categoría, daño, cadencia, etc.

En shootWeapon(), la lógica genérica ya soporta cualquier arma de proyectil o melee (según su categoría).

➕ Añadir una nueva mejora
En GENERIC_UPGRADES o en el array de mejoras por arma, añade un objeto con name, desc y una función apply(rarity) que modifique las estadísticas del jugador.

La función showLevelUpMenu() elegirá aleatoriamente entre las mejoras disponibles.

🧪 Pruebas
No hay pruebas automáticas. Para validar cambios, ejecuta el juego en el navegador y comprueba comportamientos. Se recomienda usar las herramientas de desarrollador (F12) para depurar.

🗂️ Historial de versiones
Véase el archivo CHANGELOG.md.

📜 Licencia
MIT © [Tu nombre] – Puedes usar, modificar y distribuir libremente.