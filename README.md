# AILive Orb

AILive Orb is a reusable React/Three.js neural orb for AI interfaces, dashboards, chat agents, and automation views.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static build is generated in `dist/`.

## Product Notes

- Reusable component: `src/components/ai-mascot/AILiveOrb.tsx`.
- Lower-level component: `src/components/ai-mascot/AIMascotOrb.tsx`.
- Deployment target: GitHub Pages static hosting.

## Usage

```tsx
import { AILiveOrb } from './components/ai-mascot';

<AILiveOrb view="automation" size="lg" intensity="high" autoCycle interactive showConnections />
```
