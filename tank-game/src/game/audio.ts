// Tiny synthesized sound effects using Web Audio API
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

function playTone(freq: number, duration: number, type: OscillatorType, volume: number, rampDown = true) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* ignore audio errors */ }
}

function playNoise(duration: number, volume: number) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch { /* ignore */ }
}

export function playShoot() {
  playTone(600, 0.08, 'square', 0.12);
  playTone(200, 0.12, 'sawtooth', 0.08);
  playNoise(0.06, 0.1);
}

export function playEnemyShoot() {
  playTone(400, 0.06, 'square', 0.06);
  playTone(150, 0.08, 'sawtooth', 0.04);
}

export function playExplosion() {
  // Initial blast
  playNoise(0.6, 0.3);
  playTone(120, 0.2, 'square', 0.2);
  // Low rumble
  playTone(60, 0.8, 'sine', 0.25);
  playTone(30, 1.2, 'sine', 0.2);
  // Secondary crackle
  setTimeout(() => playNoise(0.4, 0.15), 200);
  setTimeout(() => playTone(80, 0.5, 'sawtooth', 0.12), 300);
  // Debris
  setTimeout(() => playTone(200, 0.15, 'square', 0.06), 400);
  setTimeout(() => playTone(150, 0.1, 'square', 0.05), 550);
  // Tail
  setTimeout(() => playTone(25, 0.8, 'sine', 0.1), 600);
}

export function playHit() {
  playTone(300, 0.05, 'square', 0.1);
  playNoise(0.08, 0.08);
}

export function playPlayerHit() {
  playTone(200, 0.1, 'sawtooth', 0.15);
  playTone(100, 0.15, 'sine', 0.1);
  playNoise(0.1, 0.12);
}

export function playPowerUp() {
  playTone(400, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(600, 0.1, 'sine', 0.1), 80);
  setTimeout(() => playTone(800, 0.15, 'sine', 0.12), 160);
}

export function playWaveStart() {
  playTone(300, 0.15, 'sine', 0.08);
  setTimeout(() => playTone(400, 0.15, 'sine', 0.08), 120);
  setTimeout(() => playTone(500, 0.2, 'sine', 0.1), 240);
}

export function playGameOver() {
  playTone(400, 0.2, 'sawtooth', 0.1);
  setTimeout(() => playTone(300, 0.2, 'sawtooth', 0.1), 200);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.12), 400);
  setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.1), 600);
}

export function playCombo() {
  playTone(500, 0.08, 'sine', 0.08);
  playTone(700, 0.1, 'sine', 0.08);
}
