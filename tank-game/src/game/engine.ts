import {
  GameData, Tank, Enemy, Particle,
  Wall, PowerUp, InputState, Camera
} from './types';
import {
  ARENA_WIDTH, ARENA_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, PLAYER_ROT_SPEED,
  PLAYER_FIRE_RATE, BULLET_SPEED, BULLET_RADIUS, BULLET_DAMAGE,
  PARTICLE_LIMIT, EXPLOSION_LIMIT, WAVE_DELAY, COMBO_TIMEOUT,
  COLORS, ENEMY_CONFIGS
} from './constants';
import {
  dist, angleTo, normalizeAngle, lerp, clamp, rand, randInt,
  circleRectIntersect, rectIntersect
} from './utils';
import * as Audio from './audio';

let nextEnemyId = 0;

export function createGame(): GameData {
  return {
    state: 'menu',
    player: createPlayer(),
    enemies: [],
    bullets: [],
    particles: [],
    explosions: [],
    walls: [],
    powerUps: [],
    camera: { x: 0, y: 0, shakeX: 0, shakeY: 0, shakeIntensity: 0, shakeDuration: 0, shakeTime: 0 },
    score: 0,
    wave: 0,
    waveTimer: 0,
    waveDelay: WAVE_DELAY,
    enemiesRemaining: 0,
    combo: 0,
    comboTimer: 0,
    arenaWidth: ARENA_WIDTH,
    arenaHeight: ARENA_HEIGHT,
    time: 0,
    kills: 0,
    floatingTexts: [],
    powerUpTimers: { speed: 0, rapid: 0 },
  };
}

function createPlayer(): Tank {
  return {
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    angle: -Math.PI / 2,
    turretAngle: -Math.PI / 2,
    speed: 0,
    maxSpeed: PLAYER_SPEED,
    rotSpeed: PLAYER_ROT_SPEED,
    health: 100,
    maxHealth: 100,
    lastShot: 0,
    fireRate: PLAYER_FIRE_RATE,
    color: COLORS.player,
    turretColor: COLORS.playerTurret,
    trackOffset: 0,
    isMoving: false,
    hitFlash: 0,
    vx: 0,
    vy: 0,
  };
}

export function startGame(game: GameData) {
  game.state = 'playing';
  game.player = createPlayer();
  game.enemies = [];
  game.bullets = [];
  game.particles = [];
  game.explosions = [];
  game.powerUps = [];
  game.score = 0;
  game.wave = 0;
  game.waveTimer = 0;
  game.enemiesRemaining = 0;
  game.combo = 0;
  game.comboTimer = 0;
  game.time = 0;
  game.kills = 0;
  game.floatingTexts = [];
  game.powerUpTimers = { speed: 0, rapid: 0 };
  game.camera = { x: 0, y: 0, shakeX: 0, shakeY: 0, shakeIntensity: 0, shakeDuration: 0, shakeTime: 0 };
  generateWalls(game);
  spawnWave(game);
  Audio.resumeAudio();
}

function generateWalls(game: GameData) {
  game.walls = [];
  const wallCount = randInt(15, 25);
  for (let i = 0; i < wallCount; i++) {
    const isHorizontal = Math.random() > 0.5;
    const w: Wall = {
      x: rand(100, ARENA_WIDTH - 300),
      y: rand(100, ARENA_HEIGHT - 300),
      width: isHorizontal ? rand(60, 180) : rand(30, 50),
      height: isHorizontal ? rand(30, 50) : rand(60, 180),
      health: 100,
      maxHealth: 100,
      color: COLORS.wall.concrete,
      type: Math.random() > 0.6 ? 'brick' : 'concrete',
    };
    // Don't place walls near center (player spawn)
    const cx = w.x + w.width / 2;
    const cy = w.y + w.height / 2;
    if (dist({ x: cx, y: cy }, { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 }) > 200) {
      w.color = w.type === 'brick' ? COLORS.wall.brick : COLORS.wall.concrete;
      game.walls.push(w);
    }
  }
}

function spawnWave(game: GameData) {
  game.wave++;
  game.waveTimer = 0;

  // Wave 1 starts with just 3 enemies for quick action
  const enemyCount = game.wave === 1 ? 3 : Math.min(2 + game.wave * 2, 18);
  game.enemiesRemaining = enemyCount;

  Audio.playWaveStart();

  // Spawn delay is shorter for wave 1
  const spawnDelay = game.wave === 1 ? 200 : 350;

  for (let i = 0; i < enemyCount; i++) {
    setTimeout(() => {
      if (game.state !== 'playing') return;
      const enemy = createEnemy(game);
      if (enemy) {
        game.enemies.push(enemy);
        // Spawn particle effect
        spawnParticles(game, enemy.x, enemy.y, 8, enemy.color, 'spark', [2, 5], [2, 5], [15, 30]);
      }
    }, i * spawnDelay);
  }
}

function createEnemy(game: GameData): Enemy | null {
  const types: Array<'basic' | 'fast' | 'heavy' | 'sniper'> = ['basic'];
  if (game.wave >= 2) types.push('fast');
  if (game.wave >= 3) types.push('heavy');
  if (game.wave >= 5) types.push('sniper');

  const type = types[randInt(0, types.length - 1)];
  const config = ENEMY_CONFIGS[type];

  // Spawn at edges
  let x: number, y: number;
  const side = randInt(0, 3);
  switch (side) {
    case 0: x = rand(50, ARENA_WIDTH - 50); y = 50; break;
    case 1: x = ARENA_WIDTH - 50; y = rand(50, ARENA_HEIGHT - 50); break;
    case 2: x = rand(50, ARENA_WIDTH - 50); y = ARENA_HEIGHT - 50; break;
    default: x = 50; y = rand(50, ARENA_HEIGHT - 50); break;
  }

  const colorKey = type as keyof typeof COLORS.enemy;

  const enemy: Enemy = {
    id: nextEnemyId++,
    x, y,
    width: config.width,
    height: config.height,
    angle: angleTo({ x, y }, { x: game.player.x, y: game.player.y }),
    turretAngle: 0,
    speed: 0,
    maxSpeed: config.maxSpeed + game.wave * 0.05,
    rotSpeed: config.rotSpeed,
    health: config.health + game.wave * 5,
    maxHealth: config.health + game.wave * 5,
    lastShot: Date.now() + rand(500, 2000),
    fireRate: Math.max(config.fireRate - game.wave * 30, 400),
    color: COLORS.enemy[colorKey],
    turretColor: COLORS.enemy[colorKey],
    trackOffset: 0,
    isMoving: false,
    hitFlash: 0,
    vx: 0,
    vy: 0,
    ai: { ...config.ai },
    scoreValue: config.scoreValue,
    type,
    targetAngle: 0,
    moveTimer: rand(0, 2000),
    shootTimer: rand(500, 2000),
    moveDir: Math.random() > 0.5 ? 1 : -1,
    alive: true,
    deathTime: 0,
  };

  return enemy;
}

function shakeCamera(camera: Camera, intensity: number, duration: number) {
  camera.shakeIntensity = Math.max(camera.shakeIntensity, intensity);
  camera.shakeDuration = Math.max(camera.shakeDuration, duration);
  camera.shakeTime = 0;
}

function spawnParticles(
  game: GameData, x: number, y: number, count: number,
  color: string, type: Particle['type'], speedRange: [number, number] = [1, 5],
  sizeRange: [number, number] = [2, 5], lifeRange: [number, number] = [15, 40]
) {
  for (let i = 0; i < count; i++) {
    if (game.particles.length >= PARTICLE_LIMIT) {
      game.particles.shift();
    }
    const angle = rand(0, Math.PI * 2);
    const speed = rand(speedRange[0], speedRange[1]);
    game.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(lifeRange[0], lifeRange[1]),
      maxLife: lifeRange[1],
      size: rand(sizeRange[0], sizeRange[1]),
      color,
      type,
    });
  }
}

function spawnExplosion(game: GameData, x: number, y: number, radius: number, color: string = COLORS.explosion) {
  if (game.explosions.length >= EXPLOSION_LIMIT) game.explosions.shift();
  game.explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius,
    life: 1,
    maxLife: 1,
    color,
  });
  spawnParticles(game, x, y, 15, color, 'spark', [2, 8], [2, 6], [20, 50]);
  spawnParticles(game, x, y, 8, '#555555', 'smoke', [0.5, 2], [4, 10], [30, 60]);
  spawnParticles(game, x, y, 6, '#888888', 'debris', [3, 7], [3, 7], [25, 45]);
}

function addFloatingText(game: GameData, x: number, y: number, text: string, color: string, size: number = 16) {
  game.floatingTexts.push({ x, y, text, life: 60, maxLife: 60, color, size });
}

function playerShoot(game: GameData, now: number) {
  const p = game.player;
  const fireRate = game.powerUpTimers.rapid > 0 ? p.fireRate * 0.4 : p.fireRate;
  if (now - p.lastShot < fireRate) return;
  p.lastShot = now;

  const bx = p.x + Math.cos(p.turretAngle) * (p.width * 0.8);
  const by = p.y + Math.sin(p.turretAngle) * (p.height * 0.8);

  game.bullets.push({
    x: bx, y: by,
    vx: Math.cos(p.turretAngle) * BULLET_SPEED,
    vy: Math.sin(p.turretAngle) * BULLET_SPEED,
    speed: BULLET_SPEED,
    damage: BULLET_DAMAGE,
    isPlayer: true,
    life: 120,
    radius: BULLET_RADIUS,
  });

  // Muzzle flash
  spawnParticles(game, bx, by, 5, COLORS.bullet.player, 'muzzle', [1, 4], [2, 5], [5, 15]);
  shakeCamera(game.camera, 2, 5);
  Audio.playShoot();
}

function enemyShoot(game: GameData, enemy: Enemy, now: number) {
  if (now - enemy.lastShot < enemy.fireRate) return;
  enemy.lastShot = now;

  const aimAngle = enemy.turretAngle + rand(-0.15, 0.15) * (1 - enemy.ai.accuracy);
  const speed = enemy.type === 'sniper' ? BULLET_SPEED * 1.3 : BULLET_SPEED * 0.7;
  const bx = enemy.x + Math.cos(aimAngle) * (enemy.width * 0.8);
  const by = enemy.y + Math.sin(aimAngle) * (enemy.height * 0.8);

  game.bullets.push({
    x: bx, y: by,
    vx: Math.cos(aimAngle) * speed,
    vy: Math.sin(aimAngle) * speed,
    speed,
    damage: enemy.type === 'heavy' ? 20 : 12,
    isPlayer: false,
    life: 100,
    radius: enemy.type === 'heavy' ? 5 : 3,
  });

  spawnParticles(game, bx, by, 3, COLORS.bullet.enemy, 'muzzle', [1, 3], [2, 4], [5, 10]);
  Audio.playEnemyShoot();
}

function resolveTankWallCollision(tank: Tank, walls: Wall[]) {
  for (const wall of walls) {
    const hw = tank.width / 2;
    const hh = tank.height / 2;
    if (rectIntersect(
      tank.x - hw, tank.y - hh, tank.width, tank.height,
      wall.x, wall.y, wall.width, wall.height
    )) {
      // Push tank out
      const overlapX1 = (tank.x + hw) - wall.x;
      const overlapX2 = (wall.x + wall.width) - (tank.x - hw);
      const overlapY1 = (tank.y + hh) - wall.y;
      const overlapY2 = (wall.y + wall.height) - (tank.y - hh);

      const minOverlapX = Math.min(overlapX1, overlapX2);
      const minOverlapY = Math.min(overlapY1, overlapY2);

      if (minOverlapX < minOverlapY) {
        tank.x += overlapX1 < overlapX2 ? -overlapX1 : overlapX2;
      } else {
        tank.y += overlapY1 < overlapY2 ? -overlapY1 : overlapY2;
      }
    }
  }
}

export function update(game: GameData, input: InputState, dt: number, canvasW: number, canvasH: number) {
  if (game.state !== 'playing') return;

  const now = Date.now();
  game.time += dt;

  const p = game.player;
  const speedMult = game.powerUpTimers.speed > 0 ? 1.5 : 1.0;

  // --- Player Input ---
  if (input.touchMove) {
    const tmx = input.touchMove.x;
    const tmy = input.touchMove.y;
    const moveLen = Math.sqrt(tmx * tmx + tmy * tmy);
    if (moveLen > 10) {
      const targetAngle = Math.atan2(tmy, tmx);
      const angleDiff = normalizeAngle(targetAngle - p.angle);
      p.angle += clamp(angleDiff, -p.rotSpeed * 2, p.rotSpeed * 2);
      p.speed = lerp(p.speed, p.maxSpeed * speedMult * Math.min(moveLen / 50, 1), 0.15);
      p.isMoving = true;
    } else {
      p.speed = lerp(p.speed, 0, 0.15);
      p.isMoving = false;
    }
  } else {
    let moving = false;
    if (input.up) { p.speed = lerp(p.speed, p.maxSpeed * speedMult, 0.12); moving = true; }
    else if (input.down) { p.speed = lerp(p.speed, -p.maxSpeed * 0.6 * speedMult, 0.12); moving = true; }
    else { p.speed = lerp(p.speed, 0, 0.15); }

    if (input.left) p.angle -= p.rotSpeed;
    if (input.right) p.angle += p.rotSpeed;
    p.isMoving = moving;
  }

  // Move player
  p.vx = Math.cos(p.angle) * p.speed;
  p.vy = Math.sin(p.angle) * p.speed;
  p.x += p.vx;
  p.y += p.vy;

  // Arena bounds
  const margin = p.width / 2 + 5;
  p.x = clamp(p.x, margin, ARENA_WIDTH - margin);
  p.y = clamp(p.y, margin, ARENA_HEIGHT - margin);

  // Wall collision
  resolveTankWallCollision(p, game.walls);

  // Turret aim
  if (input.touchAim) {
    const targetAngle = Math.atan2(input.touchAim.y, input.touchAim.x);
    p.turretAngle = targetAngle;
  } else if (input.usingMouse) {
    // Mouse aiming - convert screen mouse pos to world pos
    const worldMouseX = game.camera.x + input.mouseX;
    const worldMouseY = game.camera.y + input.mouseY;
    const targetAngle = angleTo(p, { x: worldMouseX, y: worldMouseY });
    p.turretAngle = targetAngle;
  } else {
    // Turret follows body angle on keyboard only
    const turretTarget = p.angle;
    const diff = normalizeAngle(turretTarget - p.turretAngle);
    p.turretAngle += diff * 0.15;
  }

  // Track animation
  if (p.isMoving) p.trackOffset += Math.abs(p.speed) * 0.3;

  // Shooting
  if (input.shoot || input.touchShooting || input.mouseDown) {
    playerShoot(game, now);
  }

  // Hit flash decay
  if (p.hitFlash > 0) p.hitFlash -= 0.08;

  // Power-up timers
  if (game.powerUpTimers.speed > 0) game.powerUpTimers.speed -= dt;
  if (game.powerUpTimers.rapid > 0) game.powerUpTimers.rapid -= dt;

  // --- Enemies ---
  for (const e of game.enemies) {
    if (!e.alive) continue;

    const distToPlayer = dist(e, p);
    const angleToPlayer = angleTo(e, p);

    // Turret tracking
    const turretDiff = normalizeAngle(angleToPlayer - e.turretAngle);
    e.turretAngle += turretDiff * 0.05;

    // AI movement
    e.moveTimer -= dt;
    if (e.moveTimer <= 0) {
      e.moveTimer = rand(1000, 3000);
      e.moveDir = Math.random() > 0.5 ? 1 : -1;
    }

    // Move towards preferred distance
    const distDiff = distToPlayer - e.ai.preferredDist;
    let targetMoveAngle = angleToPlayer;
    if (Math.abs(distDiff) < 50) {
      // Strafe
      targetMoveAngle = angleToPlayer + (Math.PI / 2) * e.moveDir;
    } else if (distDiff < 0) {
      // Too close, back away
      targetMoveAngle = angleToPlayer + Math.PI;
    }

    const bodyDiff = normalizeAngle(targetMoveAngle - e.angle);
    e.angle += clamp(bodyDiff, -e.rotSpeed, e.rotSpeed);

    e.speed = lerp(e.speed, e.maxSpeed * (Math.abs(bodyDiff) < 1 ? 1 : 0.3), 0.08);
    e.vx = Math.cos(e.angle) * e.speed;
    e.vy = Math.sin(e.angle) * e.speed;
    e.x += e.vx;
    e.y += e.vy;

    // Bounds
    const em = e.width / 2 + 5;
    e.x = clamp(e.x, em, ARENA_WIDTH - em);
    e.y = clamp(e.y, em, ARENA_HEIGHT - em);

    resolveTankWallCollision(e, game.walls);

    e.isMoving = e.speed > 0.3;
    if (e.isMoving) e.trackOffset += Math.abs(e.speed) * 0.3;

    // Shooting
    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && distToPlayer < 600) {
      enemyShoot(game, e, now);
      e.shootTimer = e.fireRate + rand(-200, 200);
    }

    if (e.hitFlash > 0) e.hitFlash -= 0.08;

    // Track particles
    if (e.isMoving && Math.random() < 0.1) {
      spawnParticles(game, e.x, e.y, 1, '#44444466', 'trail', [0.2, 0.5], [2, 3], [10, 20]);
    }
  }

  // --- Bullets ---
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    // Trail
    if (Math.random() < 0.3) {
      const color = b.isPlayer ? COLORS.bullet.player : COLORS.bullet.enemy;
      game.particles.push({
        x: b.x + rand(-2, 2),
        y: b.y + rand(-2, 2),
        vx: rand(-0.3, 0.3),
        vy: rand(-0.3, 0.3),
        life: rand(5, 12),
        maxLife: 12,
        size: rand(1, 3),
        color,
        type: 'trail',
      });
    }

    // Out of bounds
    if (b.x < 0 || b.x > ARENA_WIDTH || b.y < 0 || b.y > ARENA_HEIGHT || b.life <= 0) {
      game.bullets.splice(i, 1);
      continue;
    }

    // Wall collision
    let bulletHitWall = false;
    for (const wall of game.walls) {
      if (circleRectIntersect(b.x, b.y, b.radius, wall.x, wall.y, wall.width, wall.height)) {
        spawnParticles(game, b.x, b.y, 4, '#aaaaaa', 'spark', [1, 3], [1, 3], [8, 15]);
        game.bullets.splice(i, 1);
        bulletHitWall = true;
        wall.health -= b.damage * 0.3;
        if (wall.health <= 0) {
          spawnParticles(game, wall.x + wall.width / 2, wall.y + wall.height / 2, 12, wall.color, 'debris', [1, 4], [3, 8], [20, 40]);
          game.walls = game.walls.filter(w => w !== wall);
        }
        Audio.playHit();
        break;
      }
    }
    if (bulletHitWall) continue;

    // Player bullet -> enemy
    if (b.isPlayer) {
      for (const e of game.enemies) {
        if (!e.alive) continue;
        if (dist(b, e) < e.width / 2 + b.radius) {
          e.health -= b.damage;
          e.hitFlash = 1;
          spawnParticles(game, b.x, b.y, 6, e.color, 'spark', [1, 5], [2, 4], [10, 25]);
          game.bullets.splice(i, 1);
          shakeCamera(game.camera, 3, 6);
          Audio.playHit();

          if (e.health <= 0) {
            e.alive = false;
            e.deathTime = game.time;
            game.enemiesRemaining--;

            // Combo
            game.combo++;
            game.comboTimer = COMBO_TIMEOUT;
            const comboMult = Math.min(game.combo, 10);
            const points = e.scoreValue * comboMult;
            game.score += points;
            game.kills++;

            if (comboMult > 1) {
              addFloatingText(game, e.x, e.y - 20, `${comboMult}x COMBO!`, '#ffcc00', 20);
              Audio.playCombo();
            }
            addFloatingText(game, e.x, e.y, `+${points}`, '#ffffff', 16);

            spawnExplosion(game, e.x, e.y, 40 + e.width);
            shakeCamera(game.camera, 8, 15);
            Audio.playExplosion();

            // Chance to drop power-up
            if (Math.random() < 0.2) {
              const types: PowerUp['type'][] = ['health', 'speed', 'rapid'];
              game.powerUps.push({
                x: e.x,
                y: e.y,
                type: types[randInt(0, 2)],
                radius: 14,
                life: 600,
                bobOffset: rand(0, Math.PI * 2),
              });
            }
          }
          break;
        }
      }
    } else {
      // Enemy bullet -> player
      if (dist(b, p) < p.width / 2 + b.radius) {
        p.health -= b.damage;
        p.hitFlash = 1;
        spawnParticles(game, b.x, b.y, 8, COLORS.player, 'spark', [1, 4], [2, 5], [10, 25]);
        game.bullets.splice(i, 1);
        shakeCamera(game.camera, 6, 12);
        Audio.playPlayerHit();

        if (p.health <= 0) {
          game.state = 'gameover';
          spawnExplosion(game, p.x, p.y, 60);
          shakeCamera(game.camera, 15, 30);
          Audio.playGameOver();
          saveHighScore(game.score, game.wave);
        }
      }
    }
  }

  // Remove dead enemies
  game.enemies = game.enemies.filter(e => e.alive || game.time - e.deathTime < 0.5);

  // --- Particles ---
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const part = game.particles[i];
    part.x += part.vx;
    part.y += part.vy;
    part.vx *= 0.96;
    part.vy *= 0.96;
    part.life--;
    if (part.type === 'smoke') {
      part.size *= 1.02;
      part.vy -= 0.02;
    }
    if (part.life <= 0) game.particles.splice(i, 1);
  }

  // --- Explosions ---
  for (let i = game.explosions.length - 1; i >= 0; i--) {
    const exp = game.explosions[i];
    exp.life -= 0.04;
    exp.radius = lerp(0, exp.maxRadius, 1 - exp.life);
    if (exp.life <= 0) game.explosions.splice(i, 1);
  }

  // --- Floating texts ---
  for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
    const ft = game.floatingTexts[i];
    ft.life--;
    ft.y -= 0.8;
    if (ft.life <= 0) game.floatingTexts.splice(i, 1);
  }

  // --- Power-ups ---
  for (let i = game.powerUps.length - 1; i >= 0; i--) {
    const pu = game.powerUps[i];
    pu.life--;
    if (pu.life <= 0) {
      game.powerUps.splice(i, 1);
      continue;
    }
    if (dist(pu, p) < pu.radius + p.width / 2) {
      switch (pu.type) {
        case 'health':
          p.health = Math.min(p.health + 30, p.maxHealth);
          addFloatingText(game, pu.x, pu.y, '+HEALTH', COLORS.powerUp.health, 18);
          break;
        case 'speed':
          game.powerUpTimers.speed = 8000;
          addFloatingText(game, pu.x, pu.y, 'SPEED UP!', COLORS.powerUp.speed, 18);
          break;
        case 'rapid':
          game.powerUpTimers.rapid = 6000;
          addFloatingText(game, pu.x, pu.y, 'RAPID FIRE!', COLORS.powerUp.rapid, 18);
          break;
      }
      Audio.playPowerUp();
      spawnParticles(game, pu.x, pu.y, 10, COLORS.powerUp[pu.type], 'spark', [2, 5], [2, 5], [15, 30]);
      game.powerUps.splice(i, 1);
    }
  }

  // --- Combo timer ---
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) {
      game.combo = 0;
    }
  }

  // --- Wave management ---
  const aliveEnemies = game.enemies.filter(e => e.alive).length;
  if (aliveEnemies === 0 && game.enemiesRemaining <= 0) {
    game.waveTimer += dt;
    if (game.waveTimer >= game.waveDelay) {
      spawnWave(game);
    }
  }

  // --- Camera ---
  const cam = game.camera;
  cam.x = lerp(cam.x, p.x - canvasW / 2, 0.08);
  cam.y = lerp(cam.y, p.y - canvasH / 2, 0.08);
  cam.x = clamp(cam.x, 0, ARENA_WIDTH - canvasW);
  cam.y = clamp(cam.y, 0, ARENA_HEIGHT - canvasH);

  if (cam.shakeDuration > 0) {
    cam.shakeTime += dt;
    const progress = cam.shakeTime / cam.shakeDuration;
    if (progress >= 1) {
      cam.shakeDuration = 0;
      cam.shakeIntensity = 0;
      cam.shakeX = 0;
      cam.shakeY = 0;
    } else {
      const decay = 1 - progress;
      cam.shakeX = (Math.random() * 2 - 1) * cam.shakeIntensity * decay;
      cam.shakeY = (Math.random() * 2 - 1) * cam.shakeIntensity * decay;
    }
  }

  // Player track particles
  if (p.isMoving && Math.random() < 0.15) {
    spawnParticles(game, p.x - p.vx * 2, p.y - p.vy * 2, 1, '#44444466', 'trail', [0.1, 0.3], [2, 3], [15, 25]);
  }
}

export function getHighScores(): Array<{ score: number; wave: number; date: string }> {
  try {
    const raw = localStorage.getItem('battletank_highscores');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHighScore(score: number, wave: number) {
  const scores = getHighScores();
  scores.push({ score, wave, date: new Date().toLocaleDateString() });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem('battletank_highscores', JSON.stringify(scores.slice(0, 10)));
}
