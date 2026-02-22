# Architecture Overview

## System Architecture

Pip-Boy OS is a **static single-page application (SPA)** built with React 19, TypeScript, and Vite, deployed to GitHub Pages. The architecture follows a modular component pattern with dual responsive layouts.

## High-Level Architecture

```mermaid
block-beta
    columns 1
    
    block:hosting["GitHub Pages"]
        columns 1
        H["Static file hosting + CDN"]
    end
    
    block:build["Vite 6 Build Output"]
        columns 1
        B["index.html + bundled JS/CSS chunks"]
    end
    
    block:spa["React 19 SPA"]
        columns 3
        
        block:root["App.tsx"]
            columns 1
            R["State: activeApp | theme | debugMode"]
        end
        
        block:layout["Layout.tsx"]
            columns 2
            DT["Desktop: RobCo Terminal ≥768px"]
            MB["Mobile: Pip-Boy 3000 <768px"]
        end
        
        block:modules["Modules"]
            columns 5
            M1["Timer"] M2["Weather"] M3["Hacking"] M4["Piptris"] M5["Settings"]
        end
    end
    
    block:external["External Services"]
        columns 3
        E1["Open-Meteo Weather API"] E2["Google Fonts (VT323)"] E3["Web Audio (SFX)"]
    end
```

## Component Architecture

### Component Hierarchy

```mermaid
graph TD
    App["App.tsx"] --> Layout["Layout.tsx"]

    Layout --> DesktopNav["Desktop Nav<br/><i>side panel</i>"]
    Layout --> MobileNav["Mobile Nav<br/><i>bottom tabs</i>"]
    Layout --> Content["Content Area<br/><i>animated transitions</i>"]

    Content --> Timer["Timer"]
    Content --> Weather["Weather"]
    Content --> Hacking["Hacking"]
    Content --> Piptris["Piptris"]
    Content --> Settings["Settings"]

    Timer --> AlertOverlay["Alert Overlay<br/><i>AnimatePresence</i>"]

    Weather --> StatCards["Stat Cards<br/><i>grid</i>"]
    Weather --> Chart["Recharts LineChart"]

    Hacking --> MemoryDump["Memory Dump<br/><i>decorative</i>"]
    Hacking --> WordGrid["Word Grid<br/><i>interactive</i>"]
    Hacking --> HistoryLog["History Log"]

    Piptris --> GameBoard["Game Board<br/><i>CSS Grid</i>"]
    Piptris --> ScorePanel["Score Panel"]

    Settings --> ThemeSelector["Theme Selector"]
    Settings --> DebugToggle["Debug Toggle"]
    Settings --> SystemInfo["System Info"]

    style App fill:#b2f2bb,stroke:#2f9e44
    style Layout fill:#ffc9c9,stroke:#e03131
    style Content fill:#fff5f5,stroke:#e03131
    style Timer fill:#a5d8ff,stroke:#1971c2
    style Weather fill:#a5d8ff,stroke:#1971c2
    style Hacking fill:#a5d8ff,stroke:#1971c2
    style Piptris fill:#a5d8ff,stroke:#1971c2
    style Settings fill:#fff4e6,stroke:#e8590c
```

### Data Flow

```mermaid
graph TD
    App["App.tsx<br/><b>State:</b> activeApp, theme, debugMode"] -->|activeApp, setActiveApp| Layout["Layout.tsx"]
    App -->|debugMode| Timer["Timer"]
    App -->|theme, setTheme<br/>debugMode, setDebugMode| Settings["Settings"]
    App -->|children| Weather["Weather<br/><i>self-contained</i>"]
    App -->|children| Hacking["Hacking<br/><i>self-contained</i>"]
    App -->|children| Piptris["Piptris<br/><i>self-contained</i>"]

    Settings -.->|setTheme<br/>setDebugMode| App

    Weather -->|fetch| OpenMeteo["Open-Meteo API"]
    Timer -->|play| Audio["Web Audio"]
    Weather -->|geolocation| Browser["Browser Geolocation API"]

    style App fill:#b2f2bb,stroke:#2f9e44
    style Layout fill:#ffc9c9,stroke:#e03131
    style Timer fill:#a5d8ff,stroke:#1971c2
    style Settings fill:#fff4e6,stroke:#e8590c
    style Weather fill:#a5d8ff,stroke:#1971c2
    style Hacking fill:#a5d8ff,stroke:#1971c2
    style Piptris fill:#a5d8ff,stroke:#1971c2
    style OpenMeteo fill:#f8f0fc,stroke:#862e9c
    style Audio fill:#f8f0fc,stroke:#862e9c
    style Browser fill:#f8f0fc,stroke:#862e9c
```

## Design System

### CSS Architecture

The design system uses **Tailwind CSS v4** with custom theme tokens defined in `index.css`:

```css
@theme {
  --color-term-green: #4ade80;    /* Default phosphor green */
  --color-term-amber: #fbbf24;    /* Amber CRT */
  --color-term-white: #f8fafc;    /* White terminal */
  --color-term-blue: #60a5fa;     /* Blue display */
  --color-term-bg: #050505;       /* Near-black background */
  --font-mono: 'VT323', monospace;/* Retro terminal font */
}
```

### Theme Switching Mechanism

1. `App.tsx` stores theme state (e.g., `'theme-green'`)
2. Applied to `<body className={theme}>` via `useEffect`
3. Each theme class sets `--term-color` CSS custom property
4. All components reference `var(--term-color)` for their colors
5. Result: instant, cascading theme change across the entire UI

### CRT Effect Layers

```mermaid
graph TB
    subgraph Rendering Stack
        direction TB
        CRT["CRT Overlay<br/><i>z-index: 50</i><br/>scanlines, pointer-events: none"] 
        UI["UI Content<br/><i>z-index: 20-30</i><br/>interactive components"]
        BG["Background<br/><i>z-index: 0</i><br/>body bg-color"]
    end

    CRT ~~~ UI ~~~ BG

    style CRT fill:#d0ebff,stroke:#1971c2
    style UI fill:#b2f2bb,stroke:#2f9e44
    style BG fill:#e9ecef,stroke:#495057
```

Effects applied:
- **Scanlines**: Alternating transparent/dark horizontal lines, animated scrolling
- **Flicker**: Subtle opacity oscillation (0.85–0.95)
- **Glow**: `text-shadow` with theme color for CRT phosphor glow
- **Chunky borders**: Double-width borders with inset/outset box-shadow

## Module Specifications

### Timer (Pomodoro)

| Feature | Details |
|---------|---------|
| Work duration | 25 min (5 sec in debug mode) |
| Break duration | 5 min (3 sec in debug mode) |
| Alert system | Escalating audio (volume ramps every 10s) |
| Visual alert | Full-screen skull animation overlay |
| State | `timeLeft`, `isActive`, `mode`, `showAnimation` |

### Weather (Climate)

| Feature | Details |
|---------|---------|
| Data source | Open-Meteo API (no key required) |
| Location | Browser geolocation with Berlin fallback (with clear warning) |
| Fallback UX | Amber warning banner + LOC panel shows "BERLIN, DE (DEFAULT)" |
| Metrics | Temperature, precipitation, UV index |
| Chart | 24-hour forecast (Recharts LineChart) |
| Refresh | On component mount |

### Hacking

| Feature | Details |
|---------|---------|
| Word pool | 30 Fallout-themed words |
| Difficulty | Random word length (5–8 chars) |
| Attempts | 4 per round |
| Memory dump | Decorative hex/garbage character display |
| Win/lose | Match feedback, reboot on game end |

### Piptris

| Feature | Details |
|---------|---------|
| Board | 10×20 grid |
| Pieces | 7 standard tetrominoes (I, J, L, O, S, T, Z) |
| Controls | Arrow keys (← → ↓ ↑ for rotate) |
| Scoring | 40/100/300/1200 × (level+1) |
| Speed | Increases with level (10 rows per level) |

### Settings

| Feature | Details |
|---------|---------|
| Themes | 4 color presets |
| Debug mode | Accelerated timers |
| System info | Decorative RobCo system stats |

## Build & Deployment Pipeline

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant GH as GitHub
    participant CI as GitHub Actions
    participant GP as GitHub Pages
    actor User as Users

    Dev->>GH: git push (master)
    GH->>CI: Trigger workflow
    CI->>CI: npm ci
    CI->>CI: vitest run
    
    alt Tests fail
        CI--xGH: ❌ Deploy blocked
    else Tests pass
        CI->>CI: vite build
        CI->>GP: Deploy dist/
        GP->>User: 🌐 /pip-boy-toolkit/
    end
```

## Adding New Modules

To add a new module:

1. **Create component**: `src/components/NewModule.tsx`
2. **Register in App.tsx**: Add to the `AppId` type union and `renderApp()` switch
3. **Add to Layout.tsx**: Add entry to the `APPS` array and `MODULE_TITLES` record
4. **Write tests**: `src/test/NewModule.test.tsx`
5. Done — the navigation and routing are automatic

```typescript
// 1. In App.tsx:
export type AppId = 'timer' | 'weather' | ... | 'newmodule';

// 2. In the switch:
case 'newmodule':
  return <NewModule />;

// 3. In Layout.tsx APPS array:
{ id: 'newmodule', label: 'NEW MOD' }

// 4. In MODULE_TITLES:
newmodule: 'NEW MODULE',
```

## Performance Considerations

- **Vite code splitting**: Each module is lazily importable (future enhancement)
- **CRT overlay**: Single fixed-position element, GPU-composited
- **Recharts**: Only loaded when Weather module is active
- **No backend**: Zero API latency for navigation/theme changes
- **Font preconnect**: Google Fonts loaded with `preconnect` hint
