import { GameData, Tank, Enemy, Bullet, Wall, PowerUp, Particle, Explosion, FloatingText } from './types';
import { COLORS, ARENA_WIDTH, ARENA_HEIGHT } from './constants';
import { hexToRgba, easeOutCubic } from './utils';

export function render(ctx: CanvasRenderingContext2D, game: GameData, canvasW: number, canvasH: number) {
  const cam = game.camera;
  const cx = cam.x + cam.shakeX;
  const cy = cam.y + cam.shakeY;

  ctx.save();
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.translate(-cx, -cy);

  drawGrid(ctx, cx, cy, canvasW, canvasH);
  drawArenaBorder(ctx);
  drawWalls(ctx, game.walls);
  drawPowerUps(ctx, game.powerUps, game.time);
  drawTrailParticles(ctx, game.particles);
  drawTank(ctx, game.player, true);
  for (const e of game.enemies) {
    if (e.alive) drawEnemy(ctx, e);
  }
  drawBullets(ctx, game.bullets);
  drawParticles(ctx, game.particles);
  drawExplosions(ctx, game.explosions);
  drawFloatingTexts(ctx, game.floatingTexts);

  ctx.restore();

  // HUD
  drawHUD(ctx, game, canvasW, canvasH);
}

function drawGrid(ctx: CanvasRenderingContext2D, cx: number, cy: number, cw: number, ch: number) {
  const gridSize = 60;
  const startX = Math.floor(cx / gridSize) * gridSize;
  const startY = Math.floor(cy / gridSize) * gridSize;

  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;

  for (let x = startX; x < cx + cw + gridSize; x += gridSize) {
    if (x < 0 || x > ARENA_WIDTH) continue;
    ctx.beginPath();
    ctx.moveTo(x, Math.max(0, cy));
    ctx.lineTo(x, Math.min(ARENA_HEIGHT, cy + ch));
    ctx.stroke();
  }
  for (let y = startY; y < cy + ch + gridSize; y += gridSize) {
    if (y < 0 || y > ARENA_HEIGHT) continue;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, cx), y);
    ctx.lineTo(Math.min(ARENA_WIDTH, cx + cw), y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawArenaBorder(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#00d4aa55';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Corner markers
  const s = 30;
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 3;
  const corners = [
    [0, 0, s, 0, 0, s],
    [ARENA_WIDTH, 0, -s, 0, 0, s],
    [0, ARENA_HEIGHT, s, 0, 0, -s],
    [ARENA_WIDTH, ARENA_HEIGHT, -s, 0, 0, -s],
  ];
  for (const [x, y, dx1, dy1, dx2, dy2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + dx1, y + dy1);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx2, y + dy2);
    ctx.stroke();
  }
}

function drawTankBody(ctx: CanvasRenderingContext2D, tank: Tank, w: number, h: number) {
  // Tracks (along X axis — tank forward direction matches angle 0 = right)
  const trackW = w * 0.9;
  const trackH = h * 0.22;
  ctx.fillStyle = '#555555';
  ctx.fillRect(-trackW / 2, -h / 2, trackW, trackH);
  ctx.fillRect(-trackW / 2, h / 2 - trackH, trackW, trackH);

  // Track treads
  const treadCount = 6;
  const treadSpacing = trackW / treadCount;
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < treadCount; i++) {
    const tx = -trackW / 2 + (i * treadSpacing + tank.trackOffset % treadSpacing);
    ctx.beginPath();
    ctx.moveTo(tx, -h / 2);
    ctx.lineTo(tx, -h / 2 + trackH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx, h / 2 - trackH);
    ctx.lineTo(tx, h / 2);
    ctx.stroke();
  }

  // Hull
  ctx.fillStyle = tank.hitFlash > 0 ? '#ffffff' : tank.color;
  ctx.globalAlpha = tank.hitFlash > 0 ? 0.5 + tank.hitFlash * 0.5 : 1;

  // Hull shape - rounded rectangle feel (along X axis)
  const hullW = w * 0.8;
  const hullH = h * 0.55;
  ctx.beginPath();
  ctx.moveTo(-hullW / 2, -hullH / 2);
  ctx.lineTo(hullW / 2, -hullH / 2);
  ctx.lineTo(hullW / 2 + 3, 0);
  ctx.lineTo(hullW / 2, hullH / 2);
  ctx.lineTo(-hullW / 2, hullH / 2);
  ctx.lineTo(-hullW / 2 - 3, 0);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;

  // Hull details
  ctx.strokeStyle = hexToRgba(tank.color, 0.3);
  ctx.lineWidth = 1;
  ctx.strokeRect(-hullW / 4, -hullH / 4, hullW / 2, hullH / 2);
}

function drawTurret(ctx: CanvasRenderingContext2D, tank: Tank, w: number, isPlayer: boolean) {
  ctx.save();
  ctx.rotate(tank.turretAngle - tank.angle);

  // Barrel (drawn along X+ axis, matching Math.atan2 convention: 0° = right)
  const barrelW = w * 0.7;
  const barrelH = w * 0.14;
  ctx.fillStyle = tank.turretColor;
  ctx.fillRect(0, -barrelH / 2, barrelW, barrelH);

  // Barrel tip
  ctx.fillStyle = isPlayer ? '#aaffee' : '#ffaaaa';
  ctx.fillRect(barrelW - 2, -barrelH / 2 - 1, 4, barrelH + 2);

  // Turret base
  const turretR = w * 0.25;
  ctx.beginPath();
  ctx.arc(0, 0, turretR, 0, Math.PI * 2);
  ctx.fillStyle = tank.turretColor;
  ctx.fill();

  // Turret ring
  ctx.beginPath();
  ctx.arc(0, 0, turretR * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(tank.color, 0.4);
  ctx.fill();

  ctx.restore();
}

function drawTank(ctx: CanvasRenderingContext2D, tank: Tank, isPlayer: boolean) {
  ctx.save();
  ctx.translate(tank.x, tank.y);

  // Glow for player
  if (isPlayer) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, tank.width * 1.5);
    gradient.addColorStop(0, hexToRgba(COLORS.player, 0.15));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(-tank.width * 1.5, -tank.height * 1.5, tank.width * 3, tank.height * 3);
  }

  ctx.rotate(tank.angle);
  drawTankBody(ctx, tank, tank.width, tank.height);
  drawTurret(ctx, tank, tank.width, isPlayer);

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  // Direction indicator  
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  // Type indicator glow
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.width);
  glowGrad.addColorStop(0, hexToRgba(enemy.color, 0.12));
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(-enemy.width, -enemy.height, enemy.width * 2, enemy.height * 2);

  ctx.rotate(enemy.angle);
  drawTankBody(ctx, enemy, enemy.width, enemy.height);
  drawTurret(ctx, enemy, enemy.width, false);

  ctx.restore();

  // Health bar
  if (enemy.health < enemy.maxHealth) {
    const barW = enemy.width * 1.2;
    const barH = 4;
    const bx = enemy.x - barW / 2;
    const by = enemy.y - enemy.height / 2 - 12;

    ctx.fillStyle = '#33333399';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(bx, by, barW * (enemy.health / enemy.maxHealth), barH);
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]) {
  for (const b of bullets) {
    // Glow
    const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 3);
    const color = b.isPlayer ? COLORS.bullet.player : COLORS.bullet.enemy;
    gradient.addColorStop(0, hexToRgba(color, 0.6));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(b.x - b.radius * 3, b.y - b.radius * 3, b.radius * 6, b.radius * 6);

    // Core
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Bright center
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, walls: Wall[]) {
  for (const w of walls) {
    // Shadow
    ctx.fillStyle = '#00000033';
    ctx.fillRect(w.x + 3, w.y + 3, w.width, w.height);

    // Wall body
    ctx.fillStyle = w.color;
    ctx.fillRect(w.x, w.y, w.width, w.height);

    // Damage cracks
    const dmg = 1 - w.health / w.maxHealth;
    if (dmg > 0.3) {
      ctx.strokeStyle = '#00000044';
      ctx.lineWidth = 1;
      const cx2 = w.x + w.width / 2;
      const cy2 = w.y + w.height / 2;
      ctx.beginPath();
      ctx.moveTo(cx2 - 5, cy2 - 5);
      ctx.lineTo(cx2 + 3, cy2);
      ctx.lineTo(cx2 - 2, cy2 + 5);
      ctx.stroke();
    }

    // Highlight
    ctx.fillStyle = '#ffffff11';
    ctx.fillRect(w.x, w.y, w.width, 2);
    ctx.fillRect(w.x, w.y, 2, w.height);

    // Bottom/right edge
    ctx.fillStyle = '#00000022';
    ctx.fillRect(w.x, w.y + w.height - 2, w.width, 2);
    ctx.fillRect(w.x + w.width - 2, w.y, 2, w.height);
  }
}

function drawPowerUps(ctx: CanvasRenderingContext2D, powerUps: PowerUp[], time: number) {
  for (const pu of powerUps) {
    const bob = Math.sin(time * 0.003 + pu.bobOffset) * 4;
    const y = pu.y + bob;

    // Glow
    const gradient = ctx.createRadialGradient(pu.x, y, 0, pu.x, y, pu.radius * 2.5);
    gradient.addColorStop(0, hexToRgba(COLORS.powerUp[pu.type], 0.3));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(pu.x - pu.radius * 2.5, y - pu.radius * 2.5, pu.radius * 5, pu.radius * 5);

    // Body
    ctx.save();
    ctx.translate(pu.x, y);
    ctx.rotate(time * 0.002);

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const r = pu.radius;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fillStyle = COLORS.powerUp[pu.type];
    ctx.fill();
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icons = { health: '+', speed: '»', rapid: '⚡' };
    ctx.fillText(icons[pu.type], 0, 0);

    ctx.restore();

    // Blinking when about to expire
    if (pu.life < 120 && Math.floor(pu.life / 8) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }
    ctx.globalAlpha = 1;
  }
}

function drawTrailParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    if (p.type !== 'trail') continue;
    const alpha = p.life / p.maxLife * 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    if (p.type === 'trail') continue;
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;

    if (p.type === 'spark' || p.type === 'muzzle') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'smoke') {
      ctx.fillStyle = hexToRgba('#888888', alpha * 0.4);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'debris') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 0.3);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

function drawExplosions(ctx: CanvasRenderingContext2D, explosions: Explosion[]) {
  for (const exp of explosions) {
    const alpha = exp.life;

    // Outer ring
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(exp.color, alpha * 0.8);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fill
    const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
    gradient.addColorStop(0, hexToRgba('#ffffff', alpha * 0.5));
    gradient.addColorStop(0.3, hexToRgba(exp.color, alpha * 0.4));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  for (const ft of texts) {
    const alpha = ft.life / ft.maxLife;
    const scale = easeOutCubic(1 - ft.life / ft.maxLife) * 0.3 + 1;

    ctx.save();
    ctx.translate(ft.x, ft.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color;
    ctx.font = `bold ${ft.size}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = '#00000088';
    ctx.fillText(ft.text, 1, 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, 0, 0);

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawHUD(ctx: CanvasRenderingContext2D, game: GameData, w: number, h: number) {
  const p = game.player;
  const pad = 20;
  const isMobile = w < 768;

  // Health bar
  const hpBarW = isMobile ? 140 : 200;
  const hpBarH = isMobile ? 14 : 18;
  const hpX = pad;
  const hpY = pad;

  ctx.fillStyle = '#00000088';
  ctx.fillRect(hpX - 2, hpY - 2, hpBarW + 4, hpBarH + 4);
  
  const hpPct = Math.max(0, p.health / p.maxHealth);
  const hpColor = hpPct > 0.5 ? COLORS.player : hpPct > 0.25 ? '#ffaa00' : '#ff3333';
  ctx.fillStyle = '#333333';
  ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
  ctx.fillStyle = hpColor;
  ctx.fillRect(hpX, hpY, hpBarW * hpPct, hpBarH);

  // Health text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${isMobile ? 10 : 12}px 'Courier New', monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`HP ${Math.ceil(p.health)}`, hpX + 5, hpY + hpBarH / 2);

  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${isMobile ? 18 : 24}px 'Courier New', monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`${game.score}`, w - pad, pad + 14);

  // Score label
  ctx.fillStyle = COLORS.ui.textDim;
  ctx.font = `${isMobile ? 10 : 12}px 'Courier New', monospace`;
  ctx.fillText('SCORE', w - pad, pad + (isMobile ? 30 : 36));

  // Wave
  ctx.fillStyle = COLORS.ui.primary;
  ctx.font = `bold ${isMobile ? 14 : 16}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${game.wave}`, w / 2, pad + 10);

  // Enemies remaining
  const aliveCount = game.enemies.filter(e => e.alive).length;
  ctx.fillStyle = COLORS.ui.textDim;
  ctx.font = `${isMobile ? 10 : 12}px 'Courier New', monospace`;
  ctx.fillText(`${aliveCount} ENEMIES`, w / 2, pad + (isMobile ? 26 : 30));

  // Combo
  if (game.combo > 1) {
    const comboAlpha = Math.min(game.comboTimer / 500, 1);
    ctx.globalAlpha = comboAlpha;
    ctx.fillStyle = '#ffcc00';
    ctx.font = `bold ${isMobile ? 20 : 28}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${game.combo}x COMBO`, w / 2, h - (isMobile ? 30 : 50));
    ctx.globalAlpha = 1;
  }

  // Power-up indicators
  let puY = hpY + hpBarH + 10;
  if (game.powerUpTimers.speed > 0) {
    ctx.fillStyle = COLORS.powerUp.speed;
    ctx.font = `bold ${isMobile ? 10 : 12}px 'Courier New', monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ SPEED ${Math.ceil(game.powerUpTimers.speed / 1000)}s`, pad, puY);
    puY += 16;
  }
  if (game.powerUpTimers.rapid > 0) {
    ctx.fillStyle = COLORS.powerUp.rapid;
    ctx.font = `bold ${isMobile ? 10 : 12}px 'Courier New', monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ RAPID ${Math.ceil(game.powerUpTimers.rapid / 1000)}s`, pad, puY);
  }

  // Wave incoming text
  if (game.enemies.filter(e => e.alive).length === 0 && game.waveTimer > 0) {
    const progress = game.waveTimer / game.waveDelay;
    ctx.fillStyle = COLORS.ui.primary;
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
    ctx.font = `bold ${isMobile ? 20 : 28}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${game.wave + 1} INCOMING...`, w / 2, h / 2);
    ctx.globalAlpha = 1;

    // Progress bar
    const pbW = 200;
    ctx.fillStyle = '#333333';
    ctx.fillRect(w / 2 - pbW / 2, h / 2 + 20, pbW, 6);
    ctx.fillStyle = COLORS.ui.primary;
    ctx.fillRect(w / 2 - pbW / 2, h / 2 + 20, pbW * progress, 6);
  }

  // Minimap
  const mmSize = isMobile ? 80 : 120;
  const mmX = w - mmSize - pad;
  const mmY = h - mmSize - pad;
  const mmScaleX = mmSize / ARENA_WIDTH;
  const mmScaleY = mmSize / ARENA_HEIGHT;

  ctx.fillStyle = '#0a0a1aaa';
  ctx.fillRect(mmX, mmY, mmSize, mmSize);
  ctx.strokeStyle = '#333355';
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX, mmY, mmSize, mmSize);

  // Walls on minimap
  ctx.fillStyle = '#44445566';
  for (const wall of game.walls) {
    ctx.fillRect(
      mmX + wall.x * mmScaleX,
      mmY + wall.y * mmScaleY,
      Math.max(1, wall.width * mmScaleX),
      Math.max(1, wall.height * mmScaleY)
    );
  }

  // Player on minimap
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(mmX + p.x * mmScaleX - 2, mmY + p.y * mmScaleY - 2, 4, 4);

  // Enemies on minimap
  for (const e of game.enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = e.color;
    ctx.fillRect(mmX + e.x * mmScaleX - 1.5, mmY + e.y * mmScaleY - 1.5, 3, 3);
  }

  // Power-ups on minimap
  for (const pu of game.powerUps) {
    ctx.fillStyle = COLORS.powerUp[pu.type];
    ctx.fillRect(mmX + pu.x * mmScaleX - 1.5, mmY + pu.y * mmScaleY - 1.5, 3, 3);
  }

  // Camera viewport on minimap
  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    mmX + game.camera.x * mmScaleX,
    mmY + game.camera.y * mmScaleY,
    w * mmScaleX,
    h * mmScaleY
  );
}

export function renderPauseOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#000000aa';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = COLORS.ui.primary;
  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', w / 2, h / 2 - 30);

  ctx.fillStyle = COLORS.ui.textDim;
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText('Press ESC or tap to resume', w / 2, h / 2 + 20);
}

export function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const size = 12;
  const gap = 4;
  
  ctx.strokeStyle = '#00d4aa';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;

  // Top
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y - gap);
  ctx.stroke();

  // Bottom
  ctx.beginPath();
  ctx.moveTo(x, y + gap);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  // Left
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x - gap, y);
  ctx.stroke();

  // Right
  ctx.beginPath();
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#00d4aa';
  ctx.fill();

  ctx.globalAlpha = 1;
}
