# Guía de Estilo y Arquitectura del Proyecto

## Organización de carpetas

- **`index.html`**: Contiene la estructura HTML y los contenedores de los menús. No incluye lógica de estilo ni JavaScript embebido (solo enlaces a los archivos externos).
- **`style.css`**: Todas las reglas CSS, incluyendo variables globales, animaciones, scrollbar personalizada y adaptación a escala de UI.
- **`game.js`**: Código JavaScript puro (sin frameworks) que implementa el motor del juego. Está envuelto en una IIFE para no contaminar el ámbito global.

## Patrón de diseño

Se ha seguido un **patrón MVC adaptado al canvas**:

- **Modelo**: Los objetos `player`, `zombies`, `projectiles`, `pickups`, etc., almacenan el estado del juego.
- **Vista**: La función `draw()` se encarga de pintar todo el estado en el canvas. No modifica datos, solo los representa.
- **Controlador**: La función `update(dt)` modifica el modelo según la entrada del usuario y las reglas del juego. Los eventos (`keydown`, `mousemove`) actualizan las variables de entrada.

## Justificación de la arquitectura

- **Separación de responsabilidades**: El código está dividido en bloques lógicos (actualización, dibujo, eventos), facilitando la localización de errores y la adición de nuevas características.
- **Modularidad**: Aunque no se usan módulos ES6, la encapsulación en una IIFE evita colisiones globales.
- **Escalabilidad**: Añadir un nuevo tipo de zombie o arma requiere cambios localizados en funciones específicas (`pickZombieType`, `spawnWave`, `WEAPON_CATALOG`).

## Convenciones de código

- **Nombres de variables**: CamelCase (`player`, `damageNumbersEnabled`).
- **Funciones**: verbos en infinitivo (`damageZombie`, `applyDamageToPlayer`).
- **Comentarios**: Se usa JSDoc para funciones principales (ver `game.js`). Los comentarios explican el "porqué" cuando la lógica no es trivial.

## Flujo de datos

1. El usuario mueve el ratón → `mousemove` → se actualiza `mouse`.
2. El usuario mantiene clic izquierdo → `mouseLeftDown = true` → en `update()` se llama a `shootWeapon()`.
3. `update()` procesa movimientos, colisiones, IA, etc.
4. `draw()` renderiza el nuevo estado.
5. El bucle `requestAnimationFrame` repite los pasos 3 y 4.

Para más detalles, consultar el código fuente comentado.
