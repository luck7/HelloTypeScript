export interface Vec2 {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'smoke' | 'debris' | 'trail' | 'muzzle';
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  damage: number;
  isPlayer: boolean;
  life: number;
  radius: number;
}

export interface Tank {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  turretAngle: number;
  speed: number;
  maxSpeed: number;
  rotSpeed: number;
  health: number;
  maxHealth: number;
  lastShot: number;
  fireRate: number;
  color: string;
  turretColor: string;
  trackOffset: number;
  isMoving: boolean;
  hitFlash: number;
  vx: number;
  vy: number;
}

export interface Enemy extends Tank {
  id: number;
  ai: EnemyAI;
  scoreValue: number;
  type: 'basic' | 'fast' | 'heavy' | 'sniper';
  targetAngle: number;
  moveTimer: number;
  shootTimer: number;
  moveDir: number;
  alive: boolean;
  deathTime: number;
}

export interface EnemyAI {
  aggressiveness: number;
  accuracy: number;
  reactionTime: number;
  preferredDist: number;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  color: string;
  type: 'concrete' | 'brick' | 'metal';
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'speed' | 'rapid';
  radius: number;
  life: number;
  bobOffset: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export interface HighScore {
  score: number;
  wave: number;
  date: string;
}

export interface Camera {
  x: number;
  y: number;
  shakeX: number;
  shakeY: number;
  shakeIntensity: number;
  shakeDuration: number;
  shakeTime: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  pause: boolean;
  touchMove: Vec2 | null;
  touchAim: Vec2 | null;
  touchShooting: boolean;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  usingMouse: boolean;
}

export interface GameData {
  state: GameState;
  player: Tank;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  explosions: Explosion[];
  walls: Wall[];
  powerUps: PowerUp[];
  camera: Camera;
  score: number;
  wave: number;
  waveTimer: number;
  waveDelay: number;
  enemiesRemaining: number;
  combo: number;
  comboTimer: number;
  arenaWidth: number;
  arenaHeight: number;
  time: number;
  kills: number;
  floatingTexts: FloatingText[];
  powerUpTimers: { speed: number; rapid: number };
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
