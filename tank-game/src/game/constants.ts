export const ARENA_WIDTH = 2400;
export const ARENA_HEIGHT = 2400;
export const PLAYER_SIZE = 36;
export const PLAYER_SPEED = 3.2;
export const PLAYER_ROT_SPEED = 0.045;
export const PLAYER_FIRE_RATE = 280;
export const BULLET_SPEED = 8;
export const BULLET_RADIUS = 4;
export const BULLET_DAMAGE = 34;
export const PARTICLE_LIMIT = 300;
export const EXPLOSION_LIMIT = 20;
export const WAVE_DELAY = 3000;
export const COMBO_TIMEOUT = 2000;

export const COLORS = {
  bg: '#1a1a2e',
  bgGrid: '#16213e',
  gridLine: '#1a2744',
  player: '#00d4aa',
  playerTurret: '#00f5c8',
  playerGlow: '#00d4aa44',
  enemy: {
    basic: '#e94560',
    fast: '#ff8c32',
    heavy: '#8b5cf6',
    sniper: '#f72585',
  },
  bullet: {
    player: '#00ffcc',
    enemy: '#ff4466',
  },
  wall: {
    concrete: '#4a5568',
    brick: '#9b5d3a',
    metal: '#718096',
  },
  explosion: '#ff6b35',
  ui: {
    primary: '#00d4aa',
    secondary: '#e94560',
    text: '#e0e0e0',
    textDim: '#888899',
    panel: '#0f0f23',
    panelBorder: '#2a2a4a',
  },
  powerUp: {
    health: '#22c55e',
    speed: '#3b82f6',
    rapid: '#f59e0b',
  },
};

export const ENEMY_CONFIGS = {
  basic: {
    width: 32,
    height: 32,
    maxSpeed: 1.5,
    rotSpeed: 0.03,
    health: 60,
    fireRate: 1200,
    scoreValue: 100,
    ai: { aggressiveness: 0.5, accuracy: 0.6, reactionTime: 800, preferredDist: 250 },
  },
  fast: {
    width: 26,
    height: 26,
    maxSpeed: 2.8,
    rotSpeed: 0.055,
    health: 35,
    fireRate: 900,
    scoreValue: 150,
    ai: { aggressiveness: 0.8, accuracy: 0.4, reactionTime: 500, preferredDist: 180 },
  },
  heavy: {
    width: 42,
    height: 42,
    maxSpeed: 1.0,
    rotSpeed: 0.02,
    health: 150,
    fireRate: 1800,
    scoreValue: 250,
    ai: { aggressiveness: 0.3, accuracy: 0.8, reactionTime: 1000, preferredDist: 350 },
  },
  sniper: {
    width: 30,
    height: 30,
    maxSpeed: 1.2,
    rotSpeed: 0.025,
    health: 45,
    fireRate: 2200,
    scoreValue: 200,
    ai: { aggressiveness: 0.2, accuracy: 0.95, reactionTime: 1200, preferredDist: 500 },
  },
};
