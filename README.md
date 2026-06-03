# ZombiesKiller - OLEADAS: INFIERNO

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

**Juego de defensa por oleadas con mecánicas de mejora, logros y zombies con habilidades especiales.**

---

## Requisitos de software

- **Navegador web moderno** (Google Chrome, Firefox, Edge, Safari) con soporte para HTML5, CSS3 y ES6.
- Se ejecuta directamente en el navegador abriendo el archivo `index.html`.

---

## Pasos para el despliegue en local

1. **Descargar o clonar el repositorio:**
   ```bash
   git clone https://github.com/yeray727/ZombiesKiller.git
   cd ZombiesKiller
Abrir el juego:

Método 1: Haz doble clic en el archivo index.html.

Método 2: Si usas VS Code, instala la extensión "Live Server" y haz clic derecho sobre index.html → "Open with Live Server".

Usa el ratón y el teclado (ver controles en el menú de pausa o la sección de abajo).

Controles básicos
Acción	Tecla / Ratón
Moverse	WASD o Flechas
Disparar / Atacar	Mantener clic izquierdo
Cambiar arma	1 (largo), 2 (corto), 3 (cuerpo a cuerpo)
Dash (esquive rápido)	Shift
Patada	C
Pausa / Menú	ESC

Estructura del proyecto y arquitectura
```text
ZombiesKiller/
├── index.html       # Estructura principal del juego y menús
├── style.css        # Estilos visuales (UI, paneles, overlays)
├── game.js          # Lógica completa del juego (motor, colisiones, IA)
├── README.md        # Este archivo
├── CHANGELOG.md     # Historial de versiones
└── docs/            # Documentación técnica y manuales
```
Patrón de diseño:

Arquitectura por componentes: Separación clara entre lógica de juego (game.js), presentación HTML/CSS y eventos.

Para más detalles, consulta docs/architecture.md.

Documentación de API (funciones públicas)
Al no haber backend, la "API" se refiere a las funciones globales expuestas por el juego para ser usadas en pruebas o ampliaciones:

```text
Función / Variable           # Tipo	Descripción
player Objecto               # Propiedades del jugador (vida, velocidad, armas, mejoras).
zombies Array                # Lista de zombies activos.
projectiles	Array            # Proyectiles del jugador.
damageZombie() function      # Inflige daño a un zombie y maneja efectos (explosión, quemadura, etc.).
applyDamageToPlayer()        # function	Aplica daño al jugador respetando reducción y escudo.
shootWeapon() function       # Dispara el arma activa según el ángulo del ratón.
spawnWave()	function         # Genera una nueva oleada de zombies.
showLevelUpMenu() function   # Muestra el menú de mejora al subir de nivel.
```

Para una referencia completa, consulta docs/api-documentation.md.

Mantenibilidad y tests (cómo añadir nuevas funcionalidades)
Añadir un nuevo tipo de zombie
En game.js, localiza la función pickZombieType() y añade el nuevo tipo a la lista pool con su tiempo de aparición.

En spawnWave(), define su configuración (hp, speed, r, color, score, baseDmg).

En update(), añade sus comportamientos especiales en el bloque de IA.

En damageZombie(), añade efectos especiales al morir.

Añadir una nueva arma
En WEAPON_CATALOG, añade un nuevo objeto con nombre, categoría, daño, cadencia, etc.

En shootWeapon(), la lógica genérica ya soporta cualquier arma de proyectil o melee.

Añadir una nueva mejora
En GENERIC_UPGRADES o en el array de mejoras por arma, añade un objeto con name, desc y una función apply(rarity) que modifique las estadísticas del jugador.

La función showLevelUpMenu() elegirá aleatoriamente entre las mejoras disponibles.

Historial de versiones
Véase el archivo CHANGELOG.md.

Licencia
MIT © [yeray727] – Puedes usar, modificar y distribuir libremente.
