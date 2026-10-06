import { InputState } from './types';

export function createInputState(): InputState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    pause: false,
    touchMove: null,
    touchAim: null,
    touchShooting: false,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    usingMouse: false,
  };
}

export function setupKeyboardInput(input: InputState): () => void {
  const keyMap: Record<string, keyof InputState> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
    Space: 'shoot',
  };

  const onDown = (e: KeyboardEvent) => {
    const key = keyMap[e.code];
    if (key) {
      (input as any)[key] = true;
      e.preventDefault();
    }
    if (e.code === 'Escape') {
      input.pause = true;
    }
  };

  const onUp = (e: KeyboardEvent) => {
    const key = keyMap[e.code];
    if (key) {
      (input as any)[key] = false;
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    input.mouseX = e.clientX;
    input.mouseY = e.clientY;
    input.usingMouse = true;
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      input.mouseDown = true;
      input.usingMouse = true;
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      input.mouseDown = false;
    }
  };

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
  };
}

interface TouchZone {
  id: number;
  startX: number;
  startY: number;
  isLeft: boolean;
}

export function setupTouchInput(
  input: InputState,
  canvas: HTMLCanvasElement
): () => void {
  const activeTouches = new Map<number, TouchZone>();

  const handleStart = (e: TouchEvent) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const midX = rect.width / 2;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      const isLeft = x < midX;

      activeTouches.set(t.identifier, {
        id: t.identifier,
        startX: x,
        startY: y,
        isLeft,
      });

      if (!isLeft) {
        input.touchShooting = true;
        input.touchAim = null;
      }
    }
  };

  const handleMove = (e: TouchEvent) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const zone = activeTouches.get(t.identifier);
      if (!zone) continue;

      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;

      if (zone.isLeft) {
        input.touchMove = {
          x: x - zone.startX,
          y: y - zone.startY,
        };
      } else {
        input.touchAim = {
          x: x - zone.startX,
          y: y - zone.startY,
        };
        input.touchShooting = true;
      }
    }
  };

  const handleEnd = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const zone = activeTouches.get(t.identifier);
      if (!zone) continue;

      if (zone.isLeft) {
        input.touchMove = null;
      } else {
        input.touchAim = null;
        input.touchShooting = false;
      }

      activeTouches.delete(t.identifier);
    }
  };

  canvas.addEventListener('touchstart', handleStart, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleEnd, { passive: false });

  return () => {
    canvas.removeEventListener('touchstart', handleStart);
    canvas.removeEventListener('touchmove', handleMove);
    canvas.removeEventListener('touchend', handleEnd);
    canvas.removeEventListener('touchcancel', handleEnd);
  };
}

export function drawTouchControls(
  ctx: CanvasRenderingContext2D,
  input: InputState,
  w: number,
  h: number
) {
  if (!('ontouchstart' in window)) return;

  const alpha = 0.2;
  const joyRadius = 50;

  // Left joystick zone
  const ljx = 90;
  const ljy = h - 100;

  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(ljx, ljy, joyRadius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (input.touchMove) {
    const len = Math.sqrt(input.touchMove.x ** 2 + input.touchMove.y ** 2);
    const maxLen = joyRadius;
    const clampedLen = Math.min(len, maxLen);
    const nx = (input.touchMove.x / (len || 1)) * clampedLen;
    const ny = (input.touchMove.y / (len || 1)) * clampedLen;

    ctx.beginPath();
    ctx.arc(ljx + nx, ljy + ny, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(ljx, ljy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff44';
    ctx.fill();
  }

  // Right zone (aim/shoot)
  const rjx = w - 90;
  const rjy = h - 100;

  ctx.beginPath();
  ctx.arc(rjx, rjy, joyRadius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (input.touchAim) {
    const len = Math.sqrt(input.touchAim.x ** 2 + input.touchAim.y ** 2);
    const maxLen = joyRadius;
    const clampedLen = Math.min(len, maxLen);
    const nx = (input.touchAim.x / (len || 1)) * clampedLen;
    const ny = (input.touchAim.y / (len || 1)) * clampedLen;

    ctx.beginPath();
    ctx.arc(rjx + nx, rjy + ny, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(rjx, rjy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ff444444';
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // Labels
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MOVE', ljx, ljy + joyRadius + 16);
  ctx.fillStyle = '#ff4444';
  ctx.fillText('AIM & FIRE', rjx, rjy + joyRadius + 16);
  ctx.globalAlpha = 1;
}
