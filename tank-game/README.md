# Battle Tank

A retro-styled top-down tank battle game built with React, TypeScript, and HTML5 Canvas.

## Features

- **Wave-based survival** — enemies spawn in increasingly difficult waves
- **4 enemy types** — Basic, Fast, Heavy, and Sniper, each with unique AI behavior
- **Power-ups** — Health, Speed Boost, and Rapid Fire
- **Combo system** — chain kills for bonus points
- **Destructible walls** — concrete, brick, and metal terrain
- **High score tracking** — persisted in localStorage
- **Retro visual style** — neon glow effects, particle systems, screen shake, scanlines
- **Responsive** — keyboard + mouse on desktop, dual-stick touch controls on mobile
- **Single-file build** — outputs one self-contained HTML file via `vite-plugin-singlefile`

## Controls

| Platform | Action | Input |
|----------|--------|-------|
| Desktop | Move | `WASD` / `Arrow Keys` |
| Desktop | Shoot | `Space` / `Mouse Click` |
| Desktop | Aim | `Mouse` |
| Desktop | Pause | `Esc` |
| Mobile | Move | Left virtual stick |
| Mobile | Aim & Shoot | Right virtual stick |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production (single HTML file)
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS 4
- HTML5 Canvas

## Project Structure

```
src/
├── main.tsx              # App entry point
├── App.tsx               # Root component (screens, game loop)
├── index.css             # Global styles
├── game/
│   ├── types.ts          # TypeScript type definitions
│   ├── constants.ts      # Game constants, colors, enemy configs
│   ├── engine.ts         # Core game logic and update loop
│   ├── renderer.ts       # Canvas rendering
│   ├── input.ts          # Keyboard, mouse, and touch input
│   ├── audio.ts          # Sound effects
│   └── utils.ts          # Utility functions
└── utils/
    └── cn.ts             # CSS class name helper
```

## License

MIT
