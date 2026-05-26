# Documentación de API (funciones públicas)

Aunque el juego no tiene backend, se exponen las siguientes funciones y objetos globales para facilitar la ampliación del código por parte de otros desarrolladores.

## Objetos globales

### `player`
```javascript
{
  x, y, w, h,           // posición y tamaño (hitbox cuadrada)
  hp, maxHp,            // vida actual y máxima
  speed,                // velocidad de movimiento
  damageMult, fireRateMult, critChance,  // multiplicadores
  damageReduction, shield, hpRegen,      // defensa
  currentWeapon, shootCooldown,          // arma activa
  ... // flags de mejoras
}
zombies
Array de objetos zombie. Cada zombie tiene:

type: string (normal, slow, dodger, explosive, fire, ice, poison, launcher)

x, y, r, hp, maxHp, speed, damage

attackTimer (cooldown de ataque en segundos)

projectiles
Array de proyectiles del jugador. Cada proyectil:

x, y, vx, vy, dmg, range, isFire, pierce

Funciones principales
damageZombie(z, dmg, sourceX, sourceY, isCrit, isFire)
Aplica daño a un zombie y maneja efectos secundarios (explosión, quemadura, sangre, XP, drops).

applyDamageToPlayer(dmg)
Aplica daño al jugador tras reducción de defensa y escudo. Activa redFlash y efectos de armadura reactiva.

shootWeapon()
Dispara el arma activa. Calcula el ángulo según la posición del ratón. Soporta armas de proyectil (bullet, shotgun, fire) y cuerpo a cuerpo (melee).

spawnWave()
Genera una nueva oleada según la oleada actual (wave). El número y tipo de zombies escala con la oleada.

showLevelUpMenu()
Pausa el juego y muestra tres mejoras aleatorias (genéricas) para que el jugador elija. Aplica la mejora seleccionada y reanuda.

update(dt)
Bucle principal del juego: mueve al jugador, actualiza cooldowns, procesa colisiones, IA de zombies, proyectiles, pickups y gestión de oleadas.

draw()
Renderiza todos los elementos en el canvas: fondo, zombies, proyectiles, jugador, pickups, partículas y textos flotantes.

Eventos del teclado y ratón
keydown: maneja movimiento, cambio de arma, dash, patada, pausa.

mousemove: actualiza la posición del ratón (para el ángulo de disparo).

mousedown (botón izquierdo): activa el disparo continuo.

mouseup: detiene el disparo continuo.

Cómo extender
Para añadir una nueva arma, basta con agregar su definición en WEAPON_CATALOG al inicio de game.js. El resto de la lógica (disparo, proyectiles) es genérica.