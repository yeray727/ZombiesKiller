// ============================================================================
// Juego "Oleadas: Infierno"
// Autor: Yeray
// Descripción: Juego de supervivencia por oleadas con mecánicas de mejora, logros y múltiples tipos de zombies.
// ============================================================================

// IIFE (Immediately Invoked Function Expression) para aislar el código y no contaminar el ámbito global.
(function(){
  // --------------------------------------------------------------------------
  // 1. ELEMENTOS DEL DOM Y CONFIGURACIÓN INICIAL
  // --------------------------------------------------------------------------
  const canvas = document.getElementById('gameCanvas');   // Lienzo donde se dibuja todo
  const ctx = canvas.getContext('2d');                  // Contexto de dibujo 2D
  const W = canvas.width, H = canvas.height;            // Dimensiones fijas del canvas (1200x700)

  // --------------------------------------------------------------------------
  // 2. CATÁLOGO DE ARMAS (todas las armas disponibles en el juego)
  // Cada arma tiene: nombre, categoría (largo, corto o melee), cadencia, daño, alcance, etc.
  // --------------------------------------------------------------------------
  const WEAPON_CATALOG = {
    sniper:   { name:"🔭 Francotirador", category:"long", cooldown:1.1, projectileType:"bullet", projDamage:52, projSpeed:1250, projRange:700, projectileCount:1, desc:"Alto daño" },
    ballesta: { name:"🏹 Ballesta", category:"long", cooldown:0.75, projectileType:"bullet", projDamage:36, projSpeed:1100, projRange:620, projectileCount:1 },
    arco:     { name:"🏹 Arco largo", category:"long", cooldown:0.65, projectileType:"bullet", projDamage:26, projSpeed:1050, projRange:580, projectileCount:1 },
    rifle:    { name:"🔫 Rifle asalto", category:"long", cooldown:0.22, projectileType:"bullet", projDamage:13, projSpeed:1000, projRange:520, projectileCount:1 },
    escopeta: { name:"💥 Escopeta", category:"short", cooldown:0.85, projectileType:"shotgun", projDamage:15, projSpeed:950, projRange:340, projectileCount:7 },
    subfusil: { name:"⚡ Subfusil", category:"short", cooldown:0.09, projectileType:"bullet", projDamage:9, projSpeed:1050, projRange:420, projectileCount:1 },
    lanzallamas: { name:"🔥 Lanzallamas", category:"short", cooldown:0.06, projectileType:"fire", projDamage:6, projSpeed:700, projRange:250, projectileCount:1, desc:"Quemadura 3s" },
    doblePistola: { name:"🔫 Doble Pistola", category:"short", cooldown:0.34, projectileType:"bullet", projDamage:24, projSpeed:1080, projRange:470, projectileCount:2 },
    cuchillo: { name:"🔪 Cuchillo", category:"melee", cooldown:0.55, meleeDamage:32, meleeRange:55, meleeAngle:70 },
    guadaña:  { name:"🌙 Guadaña", category:"melee", cooldown:1.05, meleeDamage:58, meleeRange:85, meleeAngle:120 },
    hacha:    { name:"🪓 Hacha", category:"melee", cooldown:0.85, meleeDamage:48, meleeRange:62, meleeAngle:80 },
    martillo: { name:"🔨 Martillo", category:"melee", cooldown:1.25, meleeDamage:74, meleeRange:75, meleeAngle:90 },
    katana:   { name:"⚔️ Katana", category:"melee", cooldown:0.7, meleeDamage:42, meleeRange:60, meleeAngle:70 }
  };
  
  // Armas seleccionadas por el jugador en el menú de inicio (valores por defecto)
  let selectedLong = "ballesta";
  let selectedShort = "escopeta";
  let selectedMelee = "cuchillo";
  let weapons = [];             // Aquí se guardarán los objetos de las tres armas elegidas
  
  // --------------------------------------------------------------------------
  // 3. VARIABLES DE ESTADO DEL JUEGO
  // --------------------------------------------------------------------------
  let gameActive = false;       // ¿La partida está en curso?
  let gamePaused = false;       // ¿El juego está pausado?
  let pauseMenuOpen = false;    // ¿El menú de pausa está visible?
  let wave = 1;                 // Oleada actual
  let score = 0;                // Puntuación total
  let coins = 0;                // Monedas (no se usan actualmente, pero se mantienen)
  
  // Listas de entidades dinámicas
  let zombies = [];             // Zombies vivos
  let projectiles = [];         // Proyectiles del jugador
  let zombieProjectiles = [];   // Proyectiles de los zombies lanzadores
  let particles = [];           // Efectos visuales (partículas)
  let pickups = [];             // Power-ups en el suelo
  let floatingTexts = [];       // Textos flotantes (daño, XP, etc.)
  
  // Sistema de experiencia y nivel
  let currentXP = 0;            // XP acumulada
  let currentLevel = 1;         // Nivel actual
  let pendingLevelUp = false;   // ¿Estamos en medio de la selección de mejora?
  
  // Opciones visuales (se pueden cambiar desde el menú de pausa)
  let bloodEnabled = true;       // Mostrar sangre al golpear
  let damageNumbersEnabled = true; // Mostrar números de daño
  let redFlash = 0;              // Intensidad del flash rojo al recibir daño (se desvanece con el tiempo)
  
  // --------------------------------------------------------------------------
  // 4. ESTADÍSTICAS Y LOGROS
  // --------------------------------------------------------------------------
  let stats = {
    totalKills: 0,
    killsByType: { normal:0, slow:0, dodger:0, explosive:0, fire:0, ice:0, poison:0, launcher:0 },
    totalPowerups: 0,
    maxWave: 0
  };
  let achievementsUnlocked = [];   // IDs de logros desbloqueados
  
  // Lista de logros disponibles, con nombre, descripción, condición y función de progreso
  const achievementsList = [
    { id: "matar100", name: "Carnicero", desc: "Mata 100 zombies", condition: () => stats.totalKills >= 100, progress: () => `${Math.min(100, stats.totalKills)}/100` },
    { id: "matar500", name: "Masacre", desc: "Mata 500 zombies", condition: () => stats.totalKills >= 500, progress: () => `${Math.min(500, stats.totalKills)}/500` },
    { id: "explosivo", name: "Peligro inminente", desc: "Revienta 50 zombies explosivos", condition: () => (stats.killsByType.explosive||0) >= 50, progress: () => `${Math.min(50, stats.killsByType.explosive||0)}/50` },
    { id: "nivel10", name: "Superviviente", desc: "Alcanza el nivel 10", condition: () => currentLevel >= 10, progress: () => `${Math.min(10, currentLevel)}/10` },
    { id: "oleada15", name: "Resistencia", desc: "Supera la oleada 15", condition: () => wave >= 15, progress: () => `${Math.min(15, wave)}/15` },
    { id: "powerups", name: "Coleccionista", desc: "Recoge 30 power-ups", condition: () => stats.totalPowerups >= 30, progress: () => `${Math.min(30, stats.totalPowerups)}/30` }
  ];
  
  // Comprueba si se ha cumplido algún logro y lo muestra con un toast
  function checkAchievements(){
    achievementsList.forEach(ach => {
      if(!achievementsUnlocked.includes(ach.id) && ach.condition()){
        achievementsUnlocked.push(ach.id);
        // Crear notificación visual (toast)
        let toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = '#121a24';
        toast.style.borderLeft = `5px solid #ff5a3c`;
        toast.style.padding = '10px 18px';
        toast.style.borderRadius = '16px';
        toast.style.color = '#e8e8e8';
        toast.style.fontWeight = 'bold';
        toast.style.zIndex = '300';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        toast.innerHTML = `🏆 ${ach.name}<br><span style="font-size:12px;">${ach.desc}</span>`;
        document.body.appendChild(toast);
        setTimeout(()=> toast.style.opacity = '1', 10);
        setTimeout(()=> { toast.style.opacity = '0'; setTimeout(()=> toast.remove(), 500); }, 3000);
      }
    });
  }
  
  // Actualiza la interfaz de la lista de logros en el menú de pausa
  function refreshAchievementsUI(){
    let container = document.getElementById('achievementsList');
    if(!container) return;
    container.innerHTML = '';
    achievementsList.forEach(ach => {
      let unlocked = achievementsUnlocked.includes(ach.id);
      let div = document.createElement('div');
      div.className = `achievement-item ${unlocked ? 'achievement-unlocked' : 'achievement-locked'}`;
      div.innerHTML = `<strong>${ach.name}</strong> ${unlocked ? '✅' : '🔒'}<br><span style="font-size:12px;">${ach.desc}</span><br><span style="font-size:11px;">Progreso: ${ach.progress()}</span>`;
      container.appendChild(div);
    });
  }
  
  // --------------------------------------------------------------------------
  // 5. FUNCIONES AUXILIARES (matemáticas, colisiones, etc.)
  // --------------------------------------------------------------------------
  // Coste de XP para subir de nivel (crece un 15% cada nivel)
  function getXPNeeded(level) { return Math.floor(40 * Math.pow(1.15, level - 1)); }
  function rand(a,b){ return Math.random()*(b-a)+a; }
  function clamp(v,mn,mx){ return Math.min(mx,Math.max(mn,v)); }
  function distCircle(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2); }
  
  // Colisión entre un rectángulo (hitbox del jugador) y un círculo (zombie)
  function rectCircleCollide(px, py, w, h, cx, cy, r) {
    let closestX = Math.max(px - w/2, Math.min(cx, px + w/2));
    let closestY = Math.max(py - h/2, Math.min(cy, py + h/2));
    let dx = cx - closestX;
    let dy = cy - closestY;
    return (dx * dx + dy * dy) < r * r;
  }
  
  // Colisión entre un punto (proyectil) y un rectángulo (jugador)
  function pointRectCollide(px, py, rx, ry, rw, rh) {
    return (px >= rx - rw/2 && px <= rx + rw/2 && py >= ry - rh/2 && py <= ry + rh/2);
  }
  
  // --------------------------------------------------------------------------
  // 6. ENTRADA DEL USUARIO (ratón y teclado)
  // --------------------------------------------------------------------------
  let mouse = { x:W/2, y:H/2 };     // Posición del ratón en coordenadas del canvas
  let mouseLeftDown = false;         // ¿Botón izquierdo presionado? (para disparo continuo)
  const keys = {};                   // Estado de las teclas (WASD, flechas, etc.)
  
  // --------------------------------------------------------------------------
  // 7. OBJETO JUGADOR (estadísticas, mejoras, hitbox)
  // --------------------------------------------------------------------------
  const player = {
    x: W/2, y: H/2,                // Posición central
    w: 38, h: 38,                  // Hitbox cuadrada (ancho y alto)
    hp: 100, maxHp: 100,
    speed: 240, angle: 0,          // Velocidad base y ángulo de rotación (apunta al ratón)
    damageReduction: 0.0, shield: 0,  // Defensa y escudo
    speedBoost:0, damageBoost:0, regenBoost:0, slowDebuff:0,  // Efectos temporales
    burnTimer:0, burnDps:0, poisonTimer:0, freezeTimer:0,     // Estados alterados
    damageMult: 1.0, fireRateMult:1.0, critChance:0.0, hpRegen:0, meleeBonus:0, baseSpeed:240,
    currentWeapon:0,               // Índice del arma activa (0,1,2)
    shootCooldown:0, dashCd:0, kickCd:0, invincibleTimer:0,
    meleeHitEffect: { active:false, x:0,y:0, angle:0, range:0, angleWidth:0, timer:0 }, // Efecto visual de ataque melee
    // Mejoras permanentes (flags y modificadores)
    meleeLifesteal:0, katanaDouble:0, axeSlow:0, stunChance:0, reactiveArmor:false,
    explosiveShield:false, lifeStealOnKill:0, critSlow:false, knockback:false, infernalReload:false,
    katanaSpeedStack:0, katanaSpeedTimer:0, martilloHitCount:0, hachaBleed:false, cuchilloExecute:false,
    guadañaSouls:false, martilloShockwave:0, adrenalina:false, adrenalinaActive:false, adrenalinaCooldown:0,
    bloodLoot:false, dashCharges:1, magnetActive:false
  };
  
  // --------------------------------------------------------------------------
  // 8. POWER-UPS (objetos que caen al matar zombies)
  // --------------------------------------------------------------------------
  const POWERUP_TYPES = ['speed', 'shield', 'damage', 'regen', 'vampire', 'magnet', 'invincible'];
  
  // Crea un power-up en una posición (x,y) con una duración determinada
  function spawnPowerup(x,y){
    let type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    pickups.push({ x, y, type, timer: (type==='invincible'? 5 : 9) });
  }
  
  // Aplica el efecto del power-up al jugador
  function applyPowerup(type){
    switch(type){
      case 'vampire': player.lifeStealOnKill = Math.max(player.lifeStealOnKill, 10); floatingTexts.push({ x:player.x, y:player.y-20, text:"🩸 VAMPIRO", timer:1.5, color:'#ff6a88' }); break;
      case 'magnet': player.magnetActive = true; setTimeout(()=>{ player.magnetActive = false; }, 6000); floatingTexts.push({ x:player.x, y:player.y-20, text:"🧲 IMÁN XP", timer:1.5, color:'#aaffdd' }); break;
      case 'invincible': player.invincibleTimer = 4; floatingTexts.push({ x:player.x, y:player.y-20, text:"✨ INVINCIBLE", timer:1.5, color:'#ffdd88' }); break;
      default:
        if(type==='speed') player.speedBoost = 5;
        else if(type==='shield') player.shield = 60;
        else if(type==='damage') player.damageBoost = 5;
        else if(type==='regen') player.regenBoost = 5;
    }
    stats.totalPowerups++;
    checkAchievements();
  }
  
  // --------------------------------------------------------------------------
  // 9. EFECTOS VISUALES: SANGRE
  // --------------------------------------------------------------------------
  function addBlood(x,y){
    if(!bloodEnabled) return;
    for(let i=0;i<6;i++) particles.push({ x:x+rand(-8,8), y:y+rand(-8,8), vx:rand(-50,50), vy:rand(-40,20), life:0.5, color:`hsl(${rand(0,20)},80%,45%)`, size:rand(3,6) });
  }
  
  // --------------------------------------------------------------------------
  // 10. GESTIÓN DE DAÑO (zombies y jugador)
  // --------------------------------------------------------------------------
  // Aplica daño a un zombie, maneja muerte, explosiones, XP, drops y efectos de estado
  function damageZombie(z, dmg, sourceX, sourceY, isCrit=false, isFire=false){
    if(z.dead) return;
    let final = isCrit ? dmg*2 : dmg;
    z.hp -= final;
    if(damageNumbersEnabled) floatingTexts.push({ x:z.x, y:z.y-10, text:`${isCrit?'💥':''}${isFire?'🔥':''}-${Math.round(final)}`, timer:0.9, color:'#ff4444' });
    addBlood(z.x, z.y);
    if(isFire && z.type !== 'fire') { z.burnTimer = 3.0; z.burnDps = 8; }
    if(z.hp <= 0){
      z.dead = true;
      stats.totalKills++; stats.killsByType[z.type] = (stats.killsByType[z.type]||0)+1;
      if(player.lifeStealOnKill) player.hp = Math.min(player.maxHp, player.hp + player.lifeStealOnKill);
      if(player.guadañaSouls) currentXP += 2;
      // Zombie explosivo: explota al morir
      if(z.type==='explosive'){
        for(let i=0;i<20;i++) particles.push({ x:z.x,y:z.y, vx:rand(-150,150), vy:rand(-150,150), life:0.7, color:'#ff6a4d', size:7 });
        let rad=85;
        if(rectCircleCollide(player.x, player.y, player.w, player.h, z.x, z.y, rad)) applyDamageToPlayer(32);
        zombies.forEach(oz=>{ if(oz!==z && !oz.dead && distCircle(oz.x,oz.y,z.x,z.y)<rad) oz.hp -= 30; });
      }
      currentXP += 12;
      score += z.score;
      coins += 6 + Math.floor(wave/1.5);
      floatingTexts.push({ x:z.x, y:z.y-22, text:`+12 XP`, timer:1.2, color:'#6aff9b' });
      let dropChance = player.bloodLoot ? 0.37 : 0.22;
      if(Math.random()<dropChance) spawnPowerup(z.x, z.y);
      for(let i=0;i<12;i++) particles.push({ x:z.x,y:z.y, vx:rand(-70,70), vy:rand(-60,50), life:0.6, color:'#c06134', size:5 });
      checkAchievements();
    }
  }
  
  // Aplica daño al jugador, teniendo en cuenta reducción de daño, escudo y efectos reactivos
  function applyDamageToPlayer(dmg){
    if(player.invincibleTimer > 0) return;
    let final = dmg * (1 - player.damageReduction);
    if(player.shield > 0) {
      let a = Math.min(player.shield, final);
      player.shield -= a;
      final -= a;
      if(player.explosiveShield && a>0 && player.shield<=0) {
        for(let i=0;i<15;i++) particles.push({ x:player.x,y:player.y, vx:rand(-100,100), vy:rand(-100,100), life:0.5, color:'#ffaa55', size:6 });
        zombies.forEach(z=>{ if(rectCircleCollide(player.x, player.y, player.w, player.h, z.x, z.y, 70)) damageZombie(z,50,player.x,player.y); });
      }
    }
    if(final > 0) {
      player.hp = Math.max(0, player.hp - final);
      if(damageNumbersEnabled) floatingTexts.push({ x:player.x+rand(-15,15), y:player.y-10, text:`-${Math.round(final)}`, timer:0.8, color:'#ff4444' });
      if(player.hp<=0) gameOver();
      redFlash = 0.3;
    }
    if(player.reactiveArmor && final>0) player.speedBoost = 2.0;
    if(player.adrenalina && player.hp < player.maxHp*0.3 && !player.adrenalinaActive && player.adrenalinaCooldown<=0) {
      player.adrenalinaActive=true;
      player.adrenalinaCooldown=30;
      setTimeout(()=>{ player.adrenalinaActive=false; },5000);
    }
  }
  
  // --------------------------------------------------------------------------
  // 11. SISTEMA DE DISPARO
  // --------------------------------------------------------------------------
  function shootWeapon(){
    if(!gameActive||gamePaused) return;
    if(player.shootCooldown>0) return;
    let wp = weapons[player.currentWeapon];
    if(!wp) return;
    // Ángulo de disparo: dirección desde el jugador hacia el ratón
    let shootAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    // Armas cuerpo a cuerpo (melee)
    if(wp.category === 'melee'){
      player.shootCooldown = wp.cooldown / player.fireRateMult;
      let dmg = (wp.meleeDamage + player.meleeBonus) * player.damageMult;
      if(player.damageBoost>0) dmg*=1.5;
      let crit = Math.random()<player.critChance;
      let range = wp.meleeRange;
      let halfAngle = (wp.meleeAngle * Math.PI/180)/2;
      for(let z of zombies){
        if(z.dead) continue;
        let dx=z.x-player.x, dy=z.y-player.y;
        if(Math.hypot(dx,dy)>range) continue;
        let angTo=Math.atan2(dy,dx);
        let diff=Math.abs(angTo - shootAngle);
        diff=Math.min(diff,Math.abs(diff-Math.PI*2));
        if(diff<halfAngle){ 
          damageZombie(z,dmg,player.x,player.y,crit,false);
          if(player.meleeLifesteal) player.hp = Math.min(player.maxHp, player.hp + dmg*player.meleeLifesteal);
          if(player.martilloShockwave){
            player.martilloHitCount++;
            if(player.martilloHitCount>=3){
              player.martilloHitCount=0;
              zombies.forEach(oz=>{ if(distCircle(oz.x,oz.y,player.x,player.y)<80) damageZombie(oz,player.martilloShockwave,player.x,player.y); });
            }
          }
        }
      }
      // Efecto visual del área de ataque melee
      player.meleeHitEffect.active=true;
      player.meleeHitEffect.x=player.x;
      player.meleeHitEffect.y=player.y;
      player.meleeHitEffect.angle=shootAngle;
      player.meleeHitEffect.range=range;
      player.meleeHitEffect.angleWidth=wp.meleeAngle;
      player.meleeHitEffect.timer=0.12;
      return;
    }
    
    // Armas de proyectil (a distancia)
    player.shootCooldown = wp.cooldown / player.fireRateMult;
    let baseDmg = (wp.projDamage||14) * player.damageMult;
    if(player.damageBoost>0) baseDmg*=1.5;
    let count = wp.projectileCount || 1;
    let spread = (wp.projectileType==='shotgun')?0.32:0.08;
    for(let i=0;i<count;i++){
      let a = shootAngle + (count>1? rand(-spread,spread):0);
      let spd = (wp.projSpeed||950)+rand(-30,40);
      let isFire = (wp.projectileType === 'fire');
      projectiles.push({
        x:player.x+Math.cos(shootAngle)*20,
        y:player.y+Math.sin(shootAngle)*20,
        vx:Math.cos(a)*spd,
        vy:Math.sin(a)*spd,
        dmg:baseDmg,
        range:wp.projRange||500,
        isFire:isFire
      });
    }
    // Partículas de disparo
    for(let i=0;i<4;i++) particles.push({ x:player.x, y:player.y, vx:rand(-40,40), vy:rand(-40,40), life:0.25, color:'#ffaa77', size:4 });
  }
  
  // --------------------------------------------------------------------------
  // 12. GENERACIÓN DE OLEADAS
  // --------------------------------------------------------------------------
  // Selecciona el tipo de zombie según la oleada (los más fuertes aparecen más tarde)
  function pickZombieType(){
    let pool = [
      {type:'normal',w:18},{type:'slow',w:10},{type:'dodger',w:9},{type:'explosive',w:12},
      {type:'fire',w:wave>=2?16:0},{type:'ice',w:wave>=3?14:0},{type:'poison',w:wave>=3?11:0},{type:'launcher',w:wave>=4?10:0}
    ];
    let total = pool.reduce((s,p)=>s+p.w,0);
    let v = Math.random()*total;
    for(let p of pool) if((v-=p.w)<=0) return p.type;
    return 'normal';
  }
  
  // Crea una nueva oleada de zombies
  function spawnWave(){
    zombies = [];
    zombieProjectiles = [];
    let baseCount = 5 + wave * 3 + Math.floor(wave/3);
    for(let i=0;i<baseCount;i++){
      // Aparecen en los bordes del canvas
      let side = Math.floor(Math.random()*4);
      let sx,sy;
      if(side===0){ sx=-60; sy=rand(40,H-40); }
      else if(side===1){ sx=W+60; sy=rand(40,H-40); }
      else if(side===2){ sx=rand(40,W-40); sy=-60; }
      else { sx=rand(40,W-40); sy=H+60; }
      let type = pickZombieType();
      let hpMult = 1 + (wave-1)*0.28;
      let spdMult = 1 + (wave-1)*0.05;
      let dmgMult = 1 + (wave-1)*0.12;
      let cfg = {
        normal:{hp:55,speed:92,r:18,color:'#4a7a4a',score:11,baseDmg:10},
        slow:{hp:110,speed:48,r:24,color:'#3aa87a',score:13,baseDmg:12},
        dodger:{hp:50,speed:135,r:16,color:'#c4a060',score:15,baseDmg:9},
        explosive:{hp:70,speed:72,r:20,color:'#cc3333',score:16,baseDmg:14},
        fire:{hp:68,speed:88,r:19,color:'#dd5511',score:19,baseDmg:13},
        ice:{hp:72,speed:74,r:20,color:'#3388ee',score:19,baseDmg:12},
        poison:{hp:88,speed:62,r:22,color:'#44bb22',score:17,baseDmg:10},
        launcher:{hp:82,speed:52,r:21,color:'#9944dd',score:23,baseDmg:11}
      }[type];
      let finalDmg = Math.round(cfg.baseDmg * dmgMult);
      let z = {
        id: Date.now()+Math.random()+i,
        type, x:sx, y:sy, r:cfg.r,
        hp: Math.round(cfg.hp * hpMult),
        maxHp: Math.round(cfg.hp * hpMult),
        speed: cfg.speed * spdMult,
        color: cfg.color, score: cfg.score,
        damage: finalDmg,
        zigzagTimer:0, dead:false,
        shootTimer:0, attackTimer:0,
        burnTimer:0, burnDps:0
      };
      if(type==='launcher') z.shootTimer = rand(1.2,2.2);
      zombies.push(z);
    }
  }
  
  // --------------------------------------------------------------------------
  // 13. BUCLE PRINCIPAL (UPDATE) - Actualiza la lógica del juego cada frame
  // --------------------------------------------------------------------------
  function update(dt){
    if(!gameActive||gamePaused||pendingLevelUp) return;
    
    // Actualizar efectos visuales temporales
    if(redFlash>0) redFlash-=dt;
    if(player.invincibleTimer>0) player.invincibleTimer-=dt;
    
    // Disparo continuo mientras se mantenga el clic izquierdo
    if(mouseLeftDown && player.shootCooldown<=0) shootWeapon();
    
    // Movimiento del jugador (WASD o flechas)
    let mx=0,my=0;
    if(keys['w']||keys['arrowup']) my--;
    if(keys['s']||keys['arrowdown']) my++;
    if(keys['a']||keys['arrowleft']) mx--;
    if(keys['d']||keys['arrowright']) mx++;
    let len = Math.hypot(mx,my);
    if(len>0){ mx/=len; my/=len; }
    
    let spd = player.baseSpeed;
    if(player.speedBoost>0) spd *= 1.5;
    if(player.slowDebuff>0) spd *= 0.85;
    if(player.freezeTimer>0) spd *= 0.75;
    if(player.adrenalinaActive) spd *= 1.4;
    
    player.x += mx * spd * dt;
    player.y += my * spd * dt;
    // Limitar dentro del canvas respetando la hitbox
    player.x = clamp(player.x, 20 + player.w/2, W - 20 - player.w/2);
    player.y = clamp(player.y, 20 + player.h/2, H - 20 - player.h/2);
    
    // Rotación del jugador hacia el ratón (para el dibujo)
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    // Actualizar cooldowns y temporizadores del jugador
    if(player.shootCooldown>0) player.shootCooldown -= dt;
    if(player.dashCd>0) player.dashCd -= dt;
    if(player.kickCd>0) player.kickCd -= dt;
    if(player.speedBoost>0) player.speedBoost -= dt;
    if(player.damageBoost>0) player.damageBoost -= dt;
    if(player.regenBoost>0) player.regenBoost -= dt;
    if(player.slowDebuff>0) player.slowDebuff -= dt;
    
    // Efectos de estado (quemadura, veneno, etc.)
    if(player.burnTimer>0){
      player.burnTimer -= dt;
      let bdmg = player.burnDps * dt * (1 - player.damageReduction*0.4);
      if(player.shield>0){
        let a = Math.min(player.shield, bdmg);
        player.shield -= a;
      } else {
        player.hp -= bdmg;
        if(player.hp<=0) gameOver();
      }
      redFlash = 0.2;
    }
    if(player.poisonTimer>0){
      player.poisonTimer -= dt;
      player.hp -= 4*dt*(1 - player.damageReduction*0.3);
      if(player.hp<=0) gameOver();
      redFlash = 0.2;
    }
    if(player.freezeTimer>0) player.freezeTimer -= dt;
    if(player.regenBoost>0) player.hp = Math.min(player.maxHp, player.hp+12*dt);
    if(player.hpRegen>0) player.hp = Math.min(player.maxHp, player.hp+player.hpRegen*dt);
    
    if(player.meleeHitEffect.active){
      player.meleeHitEffect.timer -= dt;
      if(player.meleeHitEffect.timer<=0) player.meleeHitEffect.active=false;
    }
    if(player.adrenalinaCooldown>0) player.adrenalinaCooldown -= dt;
    
    // Actualizar proyectiles del jugador
    for(let i=0;i<projectiles.length;i++){
      let p = projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.range -= Math.hypot(p.vx, p.vy) * dt;
      if(p.range <= 0){
        projectiles.splice(i,1);
        i--;
        continue;
      }
      let hit = false;
      for(let z of zombies){
        if(z.dead) continue;
        if(distCircle(p.x, p.y, z.x, z.y) < z.r + 7){
          let crit = Math.random() < player.critChance;
          damageZombie(z, p.dmg, p.x, p.y, crit, p.isFire===true);
          hit = true;
          break;
        }
      }
      if(hit){
        projectiles.splice(i,1);
        i--;
      }
    }
    
    // Quemadura de zombies (daño por segundo)
    for(let z of zombies){
      if(z.burnTimer > 0){
        z.burnTimer -= dt;
        let burnTick = z.burnDps * dt;
        z.hp -= burnTick;
        if(z.hp <= 0){
          z.dead = true;
          stats.totalKills++;
          stats.killsByType[z.type]++;
          currentXP += 12;
          score += z.score;
          coins += 6 + Math.floor(wave/1.5);
          floatingTexts.push({ x:z.x, y:z.y-22, text:`+12 XP`, timer:1.2, color:'#6aff9b' });
          if(Math.random()<0.22) spawnPowerup(z.x, z.y);
        } else {
          if(damageNumbersEnabled) floatingTexts.push({ x:z.x, y:z.y-8, text:`🔥${Math.round(burnTick)}`, timer:0.6, color:'#ff8844' });
          addBlood(z.x, z.y);
        }
      }
    }
    zombies = zombies.filter(z=>!z.dead);
    
    // IA de los zombies (movimiento y ataque)
    for(let z of zombies){
      if(z.attackTimer > 0) z.attackTimer -= dt;
      const distanceToPlayer = distCircle(player.x, player.y, z.x, z.y);
      const attackRange = z.r + Math.max(player.w, player.h)/2 + 2;
      
      if(distanceToPlayer <= attackRange) {
        // Dentro del rango de ataque: no se mueve
      } else {
        if(z.type === 'launcher'){
          let d2p = distanceToPlayer, ideal = 210;
          let ang2p = Math.atan2(player.y - z.y, player.x - z.x);
          if(d2p < ideal - 35){
            z.x -= Math.cos(ang2p) * z.speed * dt;
            z.y -= Math.sin(ang2p) * z.speed * dt;
          } else if(d2p > ideal + 55){
            z.x += Math.cos(ang2p) * z.speed * dt;
            z.y += Math.sin(ang2p) * z.speed * dt;
          } else {
            z.zigzagTimer += dt * 2.2;
            let lat = ang2p + Math.PI/2;
            z.x += Math.cos(lat) * z.speed * 0.6 * Math.sin(z.zigzagTimer) * dt;
            z.y += Math.sin(lat) * z.speed * 0.6 * Math.sin(z.zigzagTimer) * dt;
          }
          if(z.shootTimer <= 0){
            z.shootTimer = Math.max(1.0, 2.2 - wave * 0.05);
            let a = Math.atan2(player.y - z.y, player.x - z.x);
            zombieProjectiles.push({
              x: z.x + Math.cos(a)*22, y: z.y + Math.sin(a)*22,
              vx: Math.cos(a)*(270+wave*6), vy: Math.sin(a)*(270+wave*6),
              dmg: 12 + Math.floor(wave*0.9), r: 7, life: 3.2
            });
          } else {
            z.shootTimer -= dt;
          }
        } else {
          let tx = player.x, ty = player.y;
          if(z.type === 'dodger'){
            z.zigzagTimer += dt * 4.5;
            let perp = Math.atan2(player.y - z.y, player.x - z.x) + Math.PI/2;
            tx += Math.cos(perp) * Math.sin(z.zigzagTimer) * 30;
            ty += Math.sin(perp) * Math.sin(z.zigzagTimer) * 30;
          }
          let ang = Math.atan2(ty - z.y, tx - z.x);
          z.x += Math.cos(ang) * z.speed * dt;
          z.y += Math.sin(ang) * z.speed * dt;
        }
      }
      
      // Ataque cuerpo a cuerpo del zombie
      if(rectCircleCollide(player.x, player.y, player.w, player.h, z.x, z.y, z.r) && z.attackTimer <= 0){
        let dmgContact = z.damage;
        if(z.type === 'fire'){ player.burnTimer = 3.2; player.burnDps = 9; dmgContact = 8; }
        if(z.type === 'ice'){ player.freezeTimer = 2.3; dmgContact = 7; }
        if(z.type === 'poison'){ player.poisonTimer = 3.8; dmgContact = 7; }
        if(z.type === 'slow') player.slowDebuff = 2.0;
        applyDamageToPlayer(dmgContact);
        z.attackTimer = 1.0;
      }
    }
    zombies = zombies.filter(z=>!z.dead);
    
    // Proyectiles de los zombies lanzadores
    for(let i=0;i<zombieProjectiles.length;i++){
      let p = zombieProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if(p.life<=0 || p.x<-50 || p.x>W+50 || p.y<-50 || p.y>H+50){
        zombieProjectiles.splice(i,1);
        i--;
        continue;
      }
      if(pointRectCollide(p.x, p.y, player.x, player.y, player.w, player.h) && player.invincibleTimer<=0){
        applyDamageToPlayer(p.dmg);
        zombieProjectiles.splice(i,1);
        i--;
      }
    }
    
    // Recoger power-ups (con efecto imán)
    for(let i=0;i<pickups.length;i++){
      let p = pickups[i];
      p.timer -= dt;
      let dx = p.x - player.x, dy = p.y - player.y;
      if(player.magnetActive && Math.hypot(dx,dy) < 200){
        p.x -= dx * 0.2;
        p.y -= dy * 0.2;
      }
      if(pointRectCollide(p.x, p.y, player.x, player.y, player.w, player.h)){
        applyPowerup(p.type);
        pickups.splice(i,1);
        i--;
      } else if(p.timer <= 0){
        pickups.splice(i,1);
        i--;
      }
    }
    
    // Actualizar textos flotantes y partículas
    floatingTexts = floatingTexts.filter(f=>(f.timer-=dt)>0);
    particles = particles.filter(pr=>(pr.life-=dt)>0);
    
    // Si no quedan zombies, avanzar a la siguiente oleada
    if(zombies.length === 0){
      wave++;
      if(wave > stats.maxWave) stats.maxWave = wave;
      spawnWave();
      // Pequeña curación entre oleadas
      player.hp = Math.min(player.maxHp, player.hp + 12);
      
      // Subir de nivel si se ha alcanzado la XP necesaria
      let needed = getXPNeeded(currentLevel);
      if(currentXP >= needed){
        currentXP -= needed;
        currentLevel++;
        showLevelUpMenu();   // Muestra el menú de mejoras
      }
    }
    
    if(player.hp <= 0) gameOver();
    updateHUD();   // Actualizar todos los elementos de la interfaz
  }
  
  // --------------------------------------------------------------------------
  // 14. MEJORAS Y SUBIDA DE NIVEL
  // --------------------------------------------------------------------------
  const GENERIC_UPGRADES = [
    { id:'dmg', name:'⚔️ Puño de hierro', desc:'Daño +25% y 5% de aturdir', apply:(r)=>{ player.damageMult += 0.25*r.mult; player.stunChance = 0.05; } },
    { id:'def', name:'🛡️ Armadura reactiva', desc:'-15% daño + vel al recibir daño', apply:(r)=>{ player.damageReduction = Math.min(0.65, player.damageReduction+0.15*r.mult); player.reactiveArmor = true; } },
    { id:'spd', name:'💨 Movimiento fantasmal', desc:'+20 vel, dash extra', apply:(r)=>{ player.baseSpeed = Math.min(450, player.baseSpeed+20*r.mult); player.dashCharges = 2; } },
    { id:'crit', name:'✨ Ojo de halcón', desc:'+12% crítico, críticos ralentizan', apply:(r)=>{ player.critChance = Math.min(0.45, player.critChance+0.12*r.mult); player.critSlow = true; } },
    { id:'regen', name:'💚 Sangre voraz', desc:'2.5 HP/s, matar da 5 HP', apply:(r)=>{ player.hpRegen += 2.5*r.mult; player.lifeStealOnKill = 5; } }
  ];
  
  // Selecciona una rareza aleatoria para la mejora (con probabilidades)
  function pickRarity(){
    let r = Math.random() * 100;
    if(r < 75) return {mult:1, name:"Común", class:"common"};
    if(r < 90) return {mult:1.2, name:"Poco común", class:"uncommon"};
    if(r < 97) return {mult:1.5, name:"Raro", class:"rare"};
    if(r < 99) return {mult:2, name:"Épico", class:"epic"};
    return {mult:3, name:"Legendario", class:"legend"};
  }
  
  // Muestra el menú de selección de mejora (se pausa el juego)
  function showLevelUpMenu(){
    gamePaused = true;
    pendingLevelUp = true;
    let menu = document.getElementById('levelUpMenu');
    let cont = document.getElementById('upgradeChoices');
    cont.innerHTML = '';
    // Elegir 3 mejoras aleatorias (sin repetición)
    let shuffled = [...GENERIC_UPGRADES];
    for(let i=shuffled.length-1;i>0;i--){
      let j = Math.floor(Math.random()*(i+1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    let choices = shuffled.slice(0,3);
    choices.forEach(up => {
      let rar = pickRarity();
      let card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `<div class="rarity-tag ${rar.class}">✨ ${rar.name}</div><strong style="color:#ff5a3c;">${up.name}</strong><div style="font-size:13px; margin:8px 0; color:#b0c4de;">${up.desc}</div>`;
      card.onclick = () => {
        up.apply(rar);
        gamePaused = false;
        pendingLevelUp = false;
        menu.classList.remove('show');
        updateHUD();
      };
      cont.appendChild(card);
    });
    menu.classList.add('show');
  }
  
  // --------------------------------------------------------------------------
  // 15. CONSTRUCCIÓN DEL SET DE ARMAS (seleccionadas por el jugador)
  // --------------------------------------------------------------------------
  function buildWeaponSet(){
    let l = WEAPON_CATALOG[selectedLong];
    let s = WEAPON_CATALOG[selectedShort];
    let m = WEAPON_CATALOG[selectedMelee];
    if(!l || !s || !m) return false;
    weapons = [{ ...l, id:"long" }, { ...s, id:"short" }, { ...m, id:"melee" }];
    return true;
  }
  
  // --------------------------------------------------------------------------
  // 16. ACTUALIZACIÓN DE LA INTERFAZ (HUD)
  // --------------------------------------------------------------------------
  function updateHUD(){
    document.getElementById('waveDisplay').textContent = wave;
    document.getElementById('zombieCount').textContent = zombies.length;
    document.getElementById('coinDisplay').textContent = coins;
    document.getElementById('hpDisplay').textContent = Math.max(0, Math.floor(player.hp));
    document.getElementById('maxHpDisplay').textContent = player.maxHp;
    document.getElementById('levelDisplay').textContent = currentLevel;
    let needed = getXPNeeded(currentLevel);
    document.getElementById('xpDisplay').textContent = currentXP;
    document.getElementById('xpNeededDisplay').textContent = needed;
    document.getElementById('xpBarFill').style.width = clamp(currentXP/needed*100,0,100) + '%';
    document.getElementById('scoreDisplay').textContent = score;
    if(weapons[player.currentWeapon]) document.getElementById('weaponName').innerHTML = weapons[player.currentWeapon].name;
    
    let icons = '';
    if(player.burnTimer>0) icons += `🔥${player.burnTimer.toFixed(1)}s `;
    if(player.poisonTimer>0) icons += `☠️${player.poisonTimer.toFixed(1)}s `;
    if(player.freezeTimer>0) icons += `❄️${player.freezeTimer.toFixed(1)}s `;
    document.getElementById('statusIcons').innerHTML = icons;
    
    refreshAchievementsUI();
  }
  
  // Refresca las estadísticas en el menú de pausa
  function refreshPauseStats(){
    document.getElementById('statHp').innerText = `${Math.floor(player.hp)}/${player.maxHp}`;
    document.getElementById('statDef').innerText = `${Math.round(player.damageReduction*100)}%`;
    document.getElementById('statSpeed').innerText = Math.floor(player.baseSpeed);
    document.getElementById('statDmg').innerText = `${Math.round((player.damageMult-1)*100)}%`;
    document.getElementById('statFireRate').innerText = `${Math.round((player.fireRateMult-1)*100)}%`;
    document.getElementById('statCrit').innerText = `${Math.round(player.critChance*100)}%`;
    document.getElementById('statRegen').innerText = player.hpRegen.toFixed(1);
    document.getElementById('statShield').innerText = Math.floor(player.shield);
    document.getElementById('statXp').innerText = currentXP;
    
    for(let i=0;i<3;i++){
      let w = weapons[i];
      let div = document.getElementById(`weapon${i+1}Stats`);
      if(w){
        if(w.category === 'melee'){
          div.innerHTML = `<div class="stat-row">🔪 Daño: ${w.meleeDamage + player.meleeBonus}</div><div class="stat-row">⚡ Cooldown: ${(w.cooldown/player.fireRateMult).toFixed(2)}s</div>`;
        } else {
          div.innerHTML = `<div class="stat-row">💥 Daño: ${w.projDamage}</div><div class="stat-row">⚡ Cadencia: ${(1/w.cooldown).toFixed(1)}/s</div>`;
        }
      } else {
        div.innerHTML = '-';
      }
    }
  }
  
  // --------------------------------------------------------------------------
  // 17. MENÚS (pausa, fin del juego, etc.)
  // --------------------------------------------------------------------------
  function openPauseMenu(){
    if(!gameActive) return;
    gamePaused = true;
    pauseMenuOpen = true;
    refreshPauseStats();
    refreshAchievementsUI();
    document.getElementById('pauseMenu').classList.add('show');
  }
  
  function closePauseMenu(){
    if(!gameActive) return;
    gamePaused = false;
    pauseMenuOpen = false;
    document.getElementById('pauseMenu').classList.remove('show');
  }
  
  function gameOver(){
    gameActive = false;
    document.getElementById('finalStats').innerHTML = `🌊 Oleada ${wave}<br>🏆 ${score} pts · 🪙 ${coins}<br>⭐ Nivel ${currentLevel}<br>💀 Zombis muertos: ${stats.totalKills}`;
    document.getElementById('gameOverMenu').classList.add('show');
  }
  
  // Reinicia completamente el juego (vuelve al estado inicial)
  function resetGame(){
    buildWeaponSet();
    if(!weapons.length) return;
    gameActive = true;
    gamePaused = false;
    pendingLevelUp = false;
    wave = 1;
    score = 0;
    coins = 0;
    currentXP = 0;
    currentLevel = 1;
    stats = { totalKills:0, killsByType:{}, totalPowerups:0, maxWave:0 };
    achievementsUnlocked = [];
    // Resetear todas las propiedades del jugador
    player.hp = 100; player.maxHp = 100;
    player.damageMult = 1;
    player.baseSpeed = 240;
    player.fireRateMult = 1;
    player.critChance = 0;
    player.damageReduction = 0;
    player.hpRegen = 0;
    player.meleeBonus = 0;
    player.speedBoost = 0;
    player.shield = 0;
    player.damageBoost = 0;
    player.regenBoost = 0;
    player.slowDebuff = 0;
    player.burnTimer = 0;
    player.poisonTimer = 0;
    player.freezeTimer = 0;
    player.currentWeapon = 0;
    player.shootCooldown = 0;
    player.dashCd = 0;
    player.kickCd = 0;
    player.invincibleTimer = 0;
    player.meleeLifesteal = 0;
    player.magnetActive = false;
    player.lifeStealOnKill = 0;
    // Limpiar listas
    zombies = [];
    projectiles = [];
    zombieProjectiles = [];
    particles = [];
    pickups = [];
    floatingTexts = [];
    player.x = W/2;
    player.y = H/2;
    spawnWave();
    updateHUD();
    // Cerrar todos los menús
    document.querySelectorAll('.overlay-menu').forEach(m=>m.classList.remove('show'));
  }
  
  // --------------------------------------------------------------------------
  // 18. DIBUJO (RENDERIZADO) - Todo lo que se ve en el canvas
  // --------------------------------------------------------------------------
  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0,0,W,H);
    if(redFlash>0){
      ctx.fillStyle = `rgba(255, 68, 68, ${redFlash*0.5})`;
      ctx.fillRect(0,0,W,H);
    }
    // Fondo con líneas decorativas
    ctx.strokeStyle = 'rgba(255,90,60,0.1)';
    for(let x=0;x<W;x+=70){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=70){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    
    // Dibujar power-ups
    pickups.forEach(p=>{
      let col = p.type==='speed'?'#6fef6f':p.type==='shield'?'#5fafff':p.type==='damage'?'#ef6f6f':p.type==='regen'?'#ef9fef':p.type==='vampire'?'#ff66aa':p.type==='magnet'?'#66ffcc':'#ffff88';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI*2);
      ctx.fill();
    });
    
    // Dibujar proyectiles de zombies
    zombieProjectiles.forEach(p=>{
      ctx.fillStyle = '#ff5a3c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    
    // Dibujar zombies
    zombies.forEach(z=>{
      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#ff5a3c';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Barra de vida sobre el zombie
      ctx.fillStyle = '#00000099';
      ctx.fillRect(z.x - z.r, z.y - z.r - 9, z.r * 2, 5);
      let hpPct = z.hp / z.maxHp;
      ctx.fillStyle = hpPct>0.5 ? '#6aff9b' : (hpPct>0.25 ? '#ffaa44' : '#ff4444');
      ctx.fillRect(z.x - z.r, z.y - z.r - 9, hpPct * z.r * 2, 5);
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#fff';
      let emoji = {fire:'🔥', ice:'❄️', poison:'☠️', launcher:'🎯', explosive:'💣', slow:'🐢', dodger:'💨'}[z.type] || '';
      if(emoji) ctx.fillText(emoji, z.x, z.y - z.r - 12);
      if(z.burnTimer>0) ctx.fillText('🔥', z.x-8, z.y - z.r - 8);
    });
    
    // Dibujar proyectiles del jugador
    projectiles.forEach(p=>{
      ctx.fillStyle = p.isFire ? '#ff8844' : '#ffffaa';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
      ctx.fill();
    });
    
    // Dibujar jugador (con rotación)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    // Cuerpo (armadura)
    ctx.fillStyle = "#3a6ea5";
    ctx.beginPath();
    ctx.rect(-player.w/2, -player.h/2, player.w, player.h);
    ctx.fill();
    // Cabeza
    ctx.fillStyle = "#f7d9a0";
    ctx.beginPath();
    ctx.arc(0, -12, 12, 0, Math.PI*2);
    ctx.fill();
    // Ojos
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(-5, -15, 2.2, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -15, 2.2, 0, Math.PI*2);
    ctx.fill();
    // Visor
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.rect(-8, -20, 16, 6);
    ctx.fill();
    // Cinturón
    ctx.fillStyle = "#5c3a21";
    ctx.fillRect(-12, 8, 24, 6);
    ctx.fillStyle = "#c9ae74";
    ctx.fillRect(-4, 8, 8, 6);
    ctx.shadowBlur = 0;
    ctx.restore();
    
    // Efectos de escudo e invencibilidad
    if(player.shield>0){
      ctx.beginPath();
      ctx.strokeStyle = '#6aff9b';
      ctx.lineWidth = 4;
      ctx.arc(player.x, player.y, Math.max(player.w, player.h)/2+5, 0, Math.PI*2);
      ctx.stroke();
    }
    if(player.invincibleTimer>0){
      ctx.beginPath();
      ctx.strokeStyle = '#ffdd88';
      ctx.lineWidth = 4;
      ctx.arc(player.x, player.y, Math.max(player.w, player.h)/2+8, 0, Math.PI*2);
      ctx.stroke();
    }
    
    // Efecto de ataque melee
    if(player.meleeHitEffect.active){
      let e = player.meleeHitEffect;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0, 0, e.range, -e.angleWidth*Math.PI/360, e.angleWidth*Math.PI/360);
      ctx.fillStyle = 'rgba(255,90,60,0.3)';
      ctx.fill();
      ctx.strokeStyle = '#ff5a3c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.range, -e.angleWidth*Math.PI/360, e.angleWidth*Math.PI/360);
      ctx.lineTo(0,0);
      ctx.stroke();
      ctx.restore();
    }
    
    // Partículas y textos flotantes
    particles.forEach(pr=>{
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.size * pr.life, 0, Math.PI*2);
      ctx.fill();
    });
    floatingTexts.forEach(ft=>{
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 2;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y - 12 * ft.timer);
    });
    ctx.shadowBlur = 0;
  }
  
  // --------------------------------------------------------------------------
  // 19. EVENTOS DE TECLADO Y RATÓN
  // --------------------------------------------------------------------------
  window.addEventListener('keydown', e => {
    let k = e.key.toLowerCase();
    keys[k] = true;
    if(!gameActive || gamePaused) return;
    // Dash (esquive rápido)
    if(k === 'shift' && player.dashCd <= 0){
      let angleDash = Math.atan2(mouse.y - player.y, mouse.x - player.x);
      player.dashCd = 2.2;
      player.x += Math.cos(angleDash) * 130;
      player.y += Math.sin(angleDash) * 130;
      player.x = clamp(player.x, 20+player.w/2, W-20-player.w/2);
      player.y = clamp(player.y, 20+player.h/2, H-20-player.h/2);
    }
    // Patada (ataque extra)
    if(k === 'c' && player.kickCd <= 0){
      player.kickCd = 1.2;
      zombies.forEach(z=>{
        if(!z.dead && distCircle(player.x, player.y, z.x, z.y) < z.r + 48){
          damageZombie(z, 20+player.meleeBonus, player.x, player.y, Math.random()<player.critChance, false);
        }
      });
    }
    // Cambio de arma (1,2,3)
    if(k === '1') player.currentWeapon = 0;
    if(k === '2') player.currentWeapon = 1;
    if(k === '3') player.currentWeapon = 2;
    // Abrir/cerrar menú de pausa con ESC
    if(k === 'escape'){
      if(pauseMenuOpen) closePauseMenu();
      else if(gameActive && !gamePaused && !document.getElementById('levelUpMenu').classList.contains('show')) openPauseMenu();
    }
  });
  
  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });
  
  canvas.addEventListener('mousemove', e => {
    let r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (W / r.width);
    mouse.y = (e.clientY - r.top) * (H / r.height);
  });
  
  canvas.addEventListener('mousedown', e => {
    if(e.button === 0) mouseLeftDown = true;
  });
  
  window.addEventListener('mouseup', e => {
    if(e.button === 0) mouseLeftDown = false;
  });
  
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  // --------------------------------------------------------------------------
  // 20. INICIALIZACIÓN DE SELECTORES DE ARMAS Y BOTONES DE INTERFAZ
  // --------------------------------------------------------------------------
  function fillSelects(){
    let longSel = document.getElementById('longRangeSelect');
    let shortSel = document.getElementById('shortRangeSelect');
    let meleeSel = document.getElementById('meleeSelect');
    let longOps = ["sniper","ballesta","arco","rifle"];
    let shortOps = ["escopeta","subfusil","lanzallamas","doblePistola"];
    let meleeOps = ["cuchillo","guadaña","hacha","martillo","katana"];
    
    longOps.forEach(k=>{
      let opt = document.createElement('option');
      opt.value = k;
      opt.textContent = WEAPON_CATALOG[k].name;
      longSel.appendChild(opt);
    });
    shortOps.forEach(k=>{
      let opt = document.createElement('option');
      opt.value = k;
      opt.textContent = WEAPON_CATALOG[k].name;
      shortSel.appendChild(opt);
    });
    meleeOps.forEach(k=>{
      let opt = document.createElement('option');
      opt.value = k;
      opt.textContent = WEAPON_CATALOG[k].name;
      meleeSel.appendChild(opt);
    });
    
    longSel.value = selectedLong;
    shortSel.value = selectedShort;
    meleeSel.value = selectedMelee;
    
    let updatePreview = () => {
      selectedLong = longSel.value;
      selectedShort = shortSel.value;
      selectedMelee = meleeSel.value;
      document.getElementById('longPreview').innerText = WEAPON_CATALOG[selectedLong]?.desc || '';
      document.getElementById('shortPreview').innerText = WEAPON_CATALOG[selectedShort]?.desc || '';
      document.getElementById('meleePreview').innerText = WEAPON_CATALOG[selectedMelee]?.desc || '';
    };
    longSel.addEventListener('change', updatePreview);
    shortSel.addEventListener('change', updatePreview);
    meleeSel.addEventListener('change', updatePreview);
    updatePreview();
  }
  fillSelects();
  
  // Asignar eventos a los botones
  document.getElementById('startGameBtn').onclick = () => {
    selectedLong = document.getElementById('longRangeSelect').value;
    selectedShort = document.getElementById('shortRangeSelect').value;
    selectedMelee = document.getElementById('meleeSelect').value;
    if(buildWeaponSet()) resetGame();
  };
  document.getElementById('restartBtn').onclick = () => resetGame();
  document.getElementById('restartFromOverBtn').onclick = () => resetGame();
  document.getElementById('menuFromOverBtn').onclick = () => {
    document.getElementById('gameOverMenu').classList.remove('show');
    document.getElementById('startMenu').classList.add('show');
    gameActive = false;
  };
  document.getElementById('howToPlayBtn').onclick = () => alert("Subes de nivel al final de cada ronda. Elige mejora entre 3 (rareza). +15% XP por nivel.\nHielo ralentiza 25%.\nMantén clic disparo, 1/2/3 armas, Shift dash, C patada.");
  document.getElementById('pauseBtn').onclick = () => { if(gameActive && !gamePaused) openPauseMenu(); };
  document.getElementById('closePause').onclick = () => closePauseMenu();
  
  // Toggles de opciones visuales
  let bloodToggle = document.getElementById('bloodToggle');
  let damageToggle = document.getElementById('damageToggle');
  bloodToggle.addEventListener('click', () => {
    bloodEnabled = !bloodEnabled;
    bloodToggle.classList.toggle('active', bloodEnabled);
  });
  damageToggle.addEventListener('click', () => {
    damageNumbersEnabled = !damageNumbersEnabled;
    damageToggle.classList.toggle('active', damageNumbersEnabled);
  });
  
  // Control deslizante de escala de UI
  const slider = document.getElementById('uiScaleSlider');
  const scaleValue = document.getElementById('scaleValue');
  slider.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    document.documentElement.style.setProperty('--ui-scale', val);
    scaleValue.innerText = Math.round(val*100) + '%';
  });
  
  // --------------------------------------------------------------------------
  // 21. BUCLE DE ANIMACIÓN (requestAnimationFrame)
  // --------------------------------------------------------------------------
  let last = performance.now();
  function loop(now){
    let dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if(gameActive && !gamePaused && !pendingLevelUp) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  
  // Mostrar el menú de inicio al cargar la página
  document.getElementById('startMenu').classList.add('show');
})();