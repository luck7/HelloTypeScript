import { useEffect, useRef, useState, useCallback } from 'react';
import { GameData } from './game/types';
import { createGame, startGame, update, getHighScores } from './game/engine';
import { render, renderPauseOverlay, drawCrosshair } from './game/renderer';
import { createInputState, setupKeyboardInput, setupTouchInput, drawTouchControls } from './game/input';
import { resumeAudio } from './game/audio';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(createGame());
  const inputRef = useRef(createInputState());
  const animRef = useRef<number>(0);
  const [screen, setScreen] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(0);
  const [kills, setKills] = useState(0);
  const [highScores, setHighScores] = useState(getHighScores());
  const lastTimeRef = useRef(0);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    const cleanupKb = setupKeyboardInput(inputRef.current);
    const canvas = canvasRef.current;
    let cleanupTouch: (() => void) | undefined;
    if (canvas) {
      cleanupTouch = setupTouchInput(inputRef.current, canvas);
    }
    return () => {
      cleanupKb();
      cleanupTouch?.();
    };
  }, []);

  const gameLoop = useCallback((time: number) => {
    const game = gameRef.current;
    const input = inputRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Delta time (capped)
    const rawDt = time - (lastTimeRef.current || time);
    lastTimeRef.current = time;
    const dt = Math.min(rawDt, 33.33); // Cap at ~30fps equivalent to prevent large jumps

    // Handle pause toggle
    if (input.pause) {
      input.pause = false;
      if (game.state === 'playing') {
        game.state = 'paused';
        setScreen('paused');
      } else if (game.state === 'paused') {
        game.state = 'playing';
        setScreen('playing');
      }
    }

    if (game.state === 'playing') {
      update(game, input, dt, w, h);

      // Check if game state changed (state can mutate during update)
      const currentState = game.state as string;
      if (currentState === 'gameover') {
        setScreen('gameover');
        setScore(game.score);
        setWave(game.wave);
        setKills(game.kills);
        setHighScores(getHighScores());
      }
    }

    // Render
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (game.state === 'playing' || game.state === 'paused' || game.state === 'gameover') {
      render(ctx, game, w, h);
      drawTouchControls(ctx, input, w, h);

      // Draw crosshair for mouse users
      if (input.usingMouse && game.state === 'playing') {
        drawCrosshair(ctx, input.mouseX, input.mouseY);
      }

      if (game.state === 'paused') {
        renderPauseOverlay(ctx, w, h);
      }
    }

    ctx.restore();

    animRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameLoop]);

  const handleStart = useCallback(() => {
    resumeAudio();
    const game = gameRef.current;
    startGame(game);
    setScreen('playing');
    lastTimeRef.current = 0;
  }, []);

  const handleResume = useCallback(() => {
    const game = gameRef.current;
    game.state = 'playing';
    setScreen('playing');
  }, []);

  const handleRestart = useCallback(() => {
    resumeAudio();
    const game = gameRef.current;
    startGame(game);
    setScreen('playing');
    lastTimeRef.current = 0;
  }, []);

  const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window;

  return (
    <div className="fixed inset-0 bg-[#0a0a1a] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none', cursor: screen === 'playing' ? 'none' : 'default' }}
      />

      {/* Menu Screen */}
      {screen === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2e] via-[#1a1a3e] to-[#0a0a2e]" />

          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(0,212,170,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.3) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              animation: 'gridMove 4s linear infinite',
            }} />
          </div>

          <div className="relative text-center px-6 max-w-lg w-full">
            {/* Tank icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 flex items-center justify-center text-6xl animate-pulse">
                  🎯
                </div>
                <div className="absolute -inset-4 bg-[#00d4aa] opacity-10 rounded-full blur-xl animate-pulse" />
              </div>
            </div>

            <h1 className="font-mono text-5xl md:text-7xl font-bold text-[#00d4aa] mb-2 tracking-wider drop-shadow-[0_0_20px_rgba(0,212,170,0.5)]">
              BATTLE
            </h1>
            <h1 className="font-mono text-5xl md:text-7xl font-bold text-white mb-6 tracking-wider">
              TANK
            </h1>

            <p className="font-mono text-[#888899] text-sm mb-8 tracking-wide">
              DESTROY ALL ENEMIES • SURVIVE THE WAVES
            </p>

            <button
              onClick={handleStart}
              className="group relative font-mono text-lg md:text-xl font-bold text-[#0a0a2e] bg-[#00d4aa] px-12 py-4 rounded-sm tracking-widest
                hover:bg-[#00f5c8] hover:shadow-[0_0_30px_rgba(0,212,170,0.5)] transition-all duration-200
                active:scale-95 cursor-pointer mb-8 w-full max-w-xs mx-auto block"
            >
              <span className="relative z-10">START GAME</span>
              <div className="absolute inset-0 bg-[#00f5c8] opacity-0 group-hover:opacity-100 transition-opacity rounded-sm" />
            </button>

            {/* Controls */}
            <div className="space-y-3 mb-8">
              {!isMobile ? (
                <div className="font-mono text-xs text-[#666677] space-y-1">
                  <p><span className="text-[#00d4aa]">WASD / ↑↓←→</span> Move</p>
                  <p><span className="text-[#00d4aa]">SPACE</span> Shoot</p>
                  <p><span className="text-[#00d4aa]">ESC</span> Pause</p>
                </div>
              ) : (
                <div className="font-mono text-xs text-[#666677] space-y-1">
                  <p><span className="text-[#00d4aa]">LEFT STICK</span> Move</p>
                  <p><span className="text-[#e94560]">RIGHT STICK</span> Aim & Shoot</p>
                </div>
              )}
            </div>

            {/* High Scores */}
            {highScores.length > 0 && (
              <div className="border border-[#2a2a4a] bg-[#0f0f23cc] p-4 rounded-sm">
                <h3 className="font-mono text-sm text-[#00d4aa] mb-3 tracking-widest">HIGH SCORES</h3>
                <div className="space-y-1">
                  {highScores.slice(0, 5).map((hs, i) => (
                    <div key={i} className="flex justify-between font-mono text-xs">
                      <span className="text-[#666677]">#{i + 1}</span>
                      <span className="text-white">{hs.score.toLocaleString()}</span>
                      <span className="text-[#666677]">W{hs.wave}</span>
                      <span className="text-[#444455]">{hs.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pause Screen */}
      {screen === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative text-center px-6">
            <h2 className="font-mono text-4xl md:text-5xl font-bold text-[#00d4aa] mb-6 tracking-widest">
              PAUSED
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleResume}
                className="font-mono text-lg font-bold text-[#0a0a2e] bg-[#00d4aa] px-10 py-3 rounded-sm tracking-widest
                  hover:bg-[#00f5c8] hover:shadow-[0_0_20px_rgba(0,212,170,0.4)] transition-all duration-200
                  active:scale-95 cursor-pointer block w-full max-w-xs mx-auto"
              >
                RESUME
              </button>

              <button
                onClick={handleRestart}
                className="font-mono text-sm font-bold text-[#888899] bg-transparent border border-[#333355] px-10 py-3 rounded-sm tracking-widest
                  hover:border-[#00d4aa] hover:text-[#00d4aa] transition-all duration-200
                  active:scale-95 cursor-pointer block w-full max-w-xs mx-auto"
              >
                RESTART
              </button>

              <button
                onClick={() => {
                  const game = gameRef.current;
                  game.state = 'menu';
                  setScreen('menu');
                  setHighScores(getHighScores());
                }}
                className="font-mono text-sm font-bold text-[#888899] bg-transparent border border-[#333355] px-10 py-3 rounded-sm tracking-widest
                  hover:border-[#e94560] hover:text-[#e94560] transition-all duration-200
                  active:scale-95 cursor-pointer block w-full max-w-xs mx-auto"
              >
                QUIT
              </button>
            </div>

            <p className="font-mono text-xs text-[#444455] mt-6">Press ESC to resume</p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {screen === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative text-center px-6 max-w-md w-full">
            <div className="text-5xl mb-4">💥</div>
            <h2 className="font-mono text-4xl md:text-5xl font-bold text-[#e94560] mb-2 tracking-widest">
              GAME OVER
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 my-8">
              <div className="border border-[#2a2a4a] bg-[#0f0f23cc] p-3 rounded-sm">
                <div className="font-mono text-2xl font-bold text-white">{score.toLocaleString()}</div>
                <div className="font-mono text-xs text-[#666677] tracking-widest">SCORE</div>
              </div>
              <div className="border border-[#2a2a4a] bg-[#0f0f23cc] p-3 rounded-sm">
                <div className="font-mono text-2xl font-bold text-[#00d4aa]">{wave}</div>
                <div className="font-mono text-xs text-[#666677] tracking-widest">WAVE</div>
              </div>
              <div className="border border-[#2a2a4a] bg-[#0f0f23cc] p-3 rounded-sm">
                <div className="font-mono text-2xl font-bold text-[#ffcc00]">{kills}</div>
                <div className="font-mono text-xs text-[#666677] tracking-widest">KILLS</div>
              </div>
            </div>

            {/* New high score? */}
            {highScores.length > 0 && highScores[0].score === score && (
              <div className="font-mono text-lg text-[#ffcc00] mb-4 animate-pulse tracking-widest">
                ★ NEW HIGH SCORE! ★
              </div>
            )}

            <div className="space-y-3 mb-6">
              <button
                onClick={handleRestart}
                className="font-mono text-lg font-bold text-[#0a0a2e] bg-[#00d4aa] px-10 py-3 rounded-sm tracking-widest
                  hover:bg-[#00f5c8] hover:shadow-[0_0_20px_rgba(0,212,170,0.4)] transition-all duration-200
                  active:scale-95 cursor-pointer block w-full max-w-xs mx-auto"
              >
                PLAY AGAIN
              </button>

              <button
                onClick={() => {
                  const game = gameRef.current;
                  game.state = 'menu';
                  setScreen('menu');
                  setHighScores(getHighScores());
                }}
                className="font-mono text-sm font-bold text-[#888899] bg-transparent border border-[#333355] px-10 py-3 rounded-sm tracking-widest
                  hover:border-[#00d4aa] hover:text-[#00d4aa] transition-all duration-200
                  active:scale-95 cursor-pointer block w-full max-w-xs mx-auto"
              >
                MAIN MENU
              </button>
            </div>

            {/* High Scores */}
            {highScores.length > 0 && (
              <div className="border border-[#2a2a4a] bg-[#0f0f23cc] p-4 rounded-sm">
                <h3 className="font-mono text-sm text-[#00d4aa] mb-3 tracking-widest">HIGH SCORES</h3>
                <div className="space-y-1">
                  {highScores.slice(0, 5).map((hs, i) => (
                    <div key={i} className={`flex justify-between font-mono text-xs ${hs.score === score && i === 0 ? 'text-[#ffcc00]' : ''}`}>
                      <span className="text-[#666677]">#{i + 1}</span>
                      <span className={hs.score === score ? 'text-[#ffcc00]' : 'text-white'}>{hs.score.toLocaleString()}</span>
                      <span className="text-[#666677]">W{hs.wave}</span>
                      <span className="text-[#444455]">{hs.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pause button for mobile during gameplay */}
      {screen === 'playing' && (
        <button
          onClick={() => {
            const game = gameRef.current;
            game.state = 'paused';
            setScreen('paused');
          }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 md:hidden
            font-mono text-xs text-[#666677] bg-[#0f0f23aa] border border-[#2a2a4a] px-3 py-1 rounded-sm
            active:bg-[#1a1a3a] cursor-pointer"
          style={{ touchAction: 'manipulation' }}
        >
          ▐▐ PAUSE
        </button>
      )}

      {/* Subtle scanline overlay for retro feel */}
      <div className="scanline-overlay" />
    </div>
  );
}

export default App;
