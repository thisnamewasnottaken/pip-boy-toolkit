# Contributing to Pip-Boy OS

> *"War never changes. But good code always can."*

Thank you for your interest in contributing to Pip-Boy OS! This document covers everything you need to get up and running, understand the architecture, and submit high-quality pull requests.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Architecture Overview](#architecture-overview)
4. [Development Workflow](#development-workflow)
5. [Adding a New Module](#adding-a-new-module)
6. [Styling & Theme Guidelines](#styling--theme-guidelines)
7. [Testing Requirements](#testing-requirements)
8. [Pull Request Process](#pull-request-process)
9. [Commit Message Convention](#commit-message-convention)
10. [Project Conventions](#project-conventions)
11. [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)

---

## Code of Conduct

Be excellent to each other. This project follows a standard contributor code of conduct — be respectful, constructive, and inclusive in all interactions.

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| Git | Any recent version |

### Local Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/pip-boy-toolkit.git
cd pip-boy-toolkit

# 2. Install dependencies
npm install

# 3. Start the development server (http://localhost:3000)
npm run dev
```

The dev server supports Hot Module Replacement (HMR) — changes to components, CSS, and config are reflected instantly without a full page reload.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Type-check (`tsc --noEmit`) then produce a production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type-checking (`tsc --noEmit`) |
| `npm test` | Run Vitest unit tests (single pass) |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## Architecture Overview

Pip-Boy OS is a **static single-page application (SPA)** — no backend, no server-side rendering. Understanding the core architecture is essential before making changes.

### Tech Stack

| Concern | Technology |
|---------|------------|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 (with `@tailwindcss/vite` plugin) |
| Animations | Motion (Framer Motion v12) |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |
| Deployment | GitHub Pages via GitHub Actions |

### Component Structure

```
src/
├── App.tsx           # Root component — owns state: activeApp, theme, debugMode
├── index.css         # Tailwind v4 @theme tokens + CRT design system
├── main.tsx          # ReactDOM entry point
├── components/
│   ├── Layout.tsx    # Dual-mode shell (RobCo Terminal / Pip-Boy 3000)
│   ├── Timer.tsx     # Pomodoro timer module
│   ├── Weather.tsx   # Climate dashboard (Open-Meteo API)
│   ├── Hacking.tsx   # Terminal hacking mini-game
│   ├── Piptris.tsx   # Tetris clone
│   └── Settings.tsx  # Theme & debug settings
└── test/
    ├── setup.ts      # Testing Library global setup
    ├── Timer.test.tsx
    ├── Hacking.test.tsx
    ├── Settings.test.tsx
    └── Piptris.test.tsx
```

### State & Data Flow

All application-level state lives in `App.tsx`:

- **`activeApp`** (`AppId`) — which module is currently displayed
- **`theme`** (`string`) — active CSS theme class (`theme-green`, `theme-amber`, `theme-white`, `theme-blue`)
- **`debugMode`** (`boolean`) — accelerated timer durations for testing

`Layout.tsx` receives `activeApp` and `setActiveApp` to drive navigation. Modules are rendered via a `switch` statement in `renderApp()`. Most modules are self-contained (their own local state); only `Timer` accepts `debugMode` and `Settings` accepts theme/debugMode setters.

### Dual Layout Strategy

Two completely separate layouts are rendered depending on viewport width:

- **≥ 768px → RobCo Terminal**: Side navigation, chunky borders, full-width content
- **< 768px → Pip-Boy 3000**: Bottom tab navigation, compact wrist-mounted aesthetic

Both layouts live within `Layout.tsx` and share the same module components.

### Theme System

Themes are implemented as CSS classes on `<body>`:

```css
/* index.css */
.theme-green  { --term-color: #4ade80; }
.theme-amber  { --term-color: #fbbf24; }
.theme-white  { --term-color: #f8fafc; }
.theme-blue   { --term-color: #60a5fa; }
```

All components reference `var(--term-color)` — never hardcode a theme color directly.

### CRT Effect System

The CRT aesthetic is assembled from stacked layers (all defined in `index.css`):

| Layer | z-index | Purpose |
|-------|---------|---------|
| Background | 0 | `#050505` near-black |
| UI content | 20–30 | Interactive components |
| CRT overlay | 50 | Scanlines + flicker (`pointer-events: none`) |

---

## Development Workflow

### Branching Strategy

Branch off from `master`:

```bash
git checkout master
git pull origin master
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-description
```

**Branch naming conventions:**

| Prefix | Use case |
|--------|----------|
| `feat/` | New feature or module |
| `fix/` | Bug fix |
| `chore/` | Maintenance, dependency updates, tooling |
| `docs/` | Documentation-only changes |
| `refactor/` | Code restructure without behaviour change |
| `test/` | Adding or improving tests |

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD, defined in `.github/workflows/static.yml`. 

| Trigger | What it does |
|---------|--------------|
| Push to `master` | `npm ci` → `npm run test:coverage` → `vite build` → copy coverage JSON to `dist` → deploy to GitHub Pages |

> ⚠️ **Tests must pass before deployment.** A failing test blocks the build and deploy. Never merge code that breaks the test suite.

**Dynamic Coverage Badge**: We do not use 3rd party services like Codecov. Instead, the build process copies `coverage-summary.json` into the production `dist/` folder. The badge in the README dynamically fetches this JSON from the live site via Shields.io.

---

## Adding a New Module

The architecture is designed to make adding modules straightforward. Follow these four steps — navigation and routing are automatic.

### Step 1 — Create the component

```tsx
// src/components/Wasteland.tsx
export function Wasteland() {
    return (
        <div data-testid="wasteland-module">
            {/* Your module content */}
        </div>
    );
}
```

> Add `data-testid` attributes to key interactive elements — they are required for unit tests and future end-to-end tests.

### Step 2 — Register the `AppId` type and render case in `App.tsx`

```tsx
// Extend the union type
export type AppId = 'timer' | 'weather' | 'hacking' | 'piptris' | 'settings' | 'wasteland';

// Add a case to renderApp()
case 'wasteland':
    return <Wasteland />;
```

### Step 3 — Add to `Layout.tsx`

Find the `APPS` array and `MODULE_TITLES` record:

```tsx
// APPS array — controls navigation order and labels
{ id: 'wasteland', label: 'WASTELAND' }

// MODULE_TITLES — controls the header display name
wasteland: 'WASTELAND ROVER',
```

### Step 4 — Write tests

```bash
# src/test/Wasteland.test.tsx
```

Every module **must** have a corresponding test file before it can be merged. See [Testing Requirements](#testing-requirements) for guidance.

---

## Styling & Theme Guidelines

### Do

- Use `var(--term-color)` for all primary text, borders, and glow effects
- Use Tailwind utility classes for layout and spacing
- Use the `font-mono` token (VT323) for display text
- Build for both desktop and mobile layouts (large flagship iphone, samsung, as well as pixel - e.g. the Pixel 10 Pro XL with screen 6.8-inch,1344px x 2992px, 486 ppi, 20:9 aspect)
- Use smooth animations via Motion (`AnimatePresence`, `motion.div`)

### Don't

- ❌ Hardcode colour values like `#4ade80` — use `var(--term-color)` instead
- ❌ Use generic default colours (plain red/blue/green) for new UI elements
- ❌ Break the CRT aesthetic — no rounded corners, no flat modern card styles
- ❌ Add backend dependencies — this is a **static-first** application
- ❌ Introduce external API keys — if an API requires a key, consider it off-limits for this project (see how Open-Meteo is used: no key required)
- ❌ Add new runtime npm dependencies without a strong justification in the PR description

### Aesthetic Standards

Pip-Boy OS has a very specific visual identity. New UI must feel authentic to the Fallout terminal aesthetic:

- **Typography**: `VT323` monospace for headings and displays; standard monospace for body
- **Borders**: Chunky, double-stroke style; no thin hairlines
- **Glow**: `text-shadow` using `var(--term-color)` for CRT phosphor glow on key text
- **Animations**: Subtle flicker, scanline scrolling, motion transitions — nothing "poppy" or "modern"
- **Colour palette**: Near-black backgrounds (`#050505`), high-contrast terminal colours only

---

## Testing Requirements

The project uses **Vitest** with **React Testing Library** and **jsdom**.

### Rules

1. **All new modules must have a corresponding test file** at `src/test/<ModuleName>.test.tsx`.
2. **All new features must have unit tests** covering the key behaviours.
3. **Tests must pass locally** before opening a PR. Run `npm test` to verify.
4. **Do not break existing tests.** If a refactor changes a component's API or testid, update the corresponding test file in the same commit.

### Writing Tests

Follow the patterns established in the existing test files:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

// Mock heavy dependencies (motion, lucide, browser APIs)
vi.mock('motion/react', () => ({
    motion: { div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div> },
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('MyModule', () => {
    it('renders in its initial state', () => {
        render(<MyModule />);
        expect(screen.getByTestId('my-module-root')).toBeInTheDocument();
    });
});
```

**Key patterns:**

- Mock `motion/react` and `lucide-react` to avoid animation/icon side-effects in tests
- Use `vi.useFakeTimers()` / `vi.useRealTimers()` when testing timer-dependent behaviour
- Mock browser APIs (`Audio`, `navigator.geolocation`) that are not available in jsdom
- Prefer `data-testid` selectors over ARIA or text selectors for stability

### Running Coverage

```bash
npm run test:coverage
```

Coverage is provided by `@vitest/coverage-v8`. The build process uses the `json-summary` reporter to produce `coverage-summary.json`, which is hosted on GitHub Pages for the badge.

To check locally before pushing:
```bash
npm run test:coverage
# Open coverage/index.html in a browser for a visual line-by-line report
```

Do not submit PRs that regress statement or branch coverage on already-covered components (`Hacking`, `Settings`, `Timer`).

---

## Pull Request Process

1. **Ensure your branch is up-to-date with `master`** before opening a PR:
   ```bash
   git fetch origin
   git rebase origin/master
   ```

2. **Run the full check suite locally:**
   ```bash
   npm run lint   # TypeScript check
   npm test       # All tests pass
   npm run build  # Production build succeeds
   ```

3. **Open a PR against `master`** with a clear title and description:
   - What does this change do?
   - Why is it needed?
   - Any notable design decisions or trade-offs?
   - Screenshots / screen recordings are strongly encouraged for visual changes

4. **PR checklist** (complete before requesting review):
   - [ ] Branch is rebased on latest `master`
   - [ ] `npm run lint` passes (no TypeScript errors)
   - [ ] `npm test` passes (all tests green)
   - [ ] `npm run build` succeeds
   - [ ] New code follows theme and styling guidelines
   - [ ] New features/modules include unit tests
   - [ ] `data-testid` attributes added to all key interactive elements
   - [ ] Local coverage report (`npm run test:coverage`) reviewed for regressions
   - [ ] `README.md` updated if the feature affects the module list or tech stack
   - [ ] `docs/ARCHITECTURE.md` updated if architectural patterns change

5. A maintainer will review and merge once the PR is approved and CI passes.

---

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or module |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Refactor without behaviour change |
| `test` | Adding or fixing tests |
| `chore` | Tooling, CI, dependency updates |

### Examples

```
feat(hacking): add difficulty scaling based on attempt history

fix(weather): show fallback banner when geolocation is denied

test(timer): add debug mode countdown coverage

docs(architecture): update component hierarchy diagram

chore(deps): bump vite from 6.1.0 to 6.2.0
```

---

## Project Conventions

### File & Naming

| Convention | Example |
|-----------|---------|
| React components | `PascalCase.tsx` (`NewModule.tsx`) |
| Test files | `PascalCase.test.tsx` (`NewModule.test.tsx`) |
| Exported component names | Match the filename (`export function NewModule`) |
| `data-testid` format | `kebab-case`, namespaced to component (`timer-display`, `hacking-word-grid`) |

### TypeScript

- **Strict mode is enabled** (`tsconfig.json`). Do not use `any` except where absolutely necessary (e.g., mocking).
- Prefer explicit prop interfaces over inline types for component props.
- Export the `AppId` type from `App.tsx` — use it everywhere a module ID is referenced.

### Dependencies

- Keep the dependency count lean. This is a portfolio/fun project — new deps need a clear justification.
- All new `dependencies` (runtime) require a comment in the PR explaining why an existing dep can't solve the problem.
- `devDependencies` (build/test tooling) are less restrictive but still require justification.

### No Backend / No API Keys

The project is deliberately **static-first**. Contributions that require:

- A server or serverless function
- An API key (even in environment variables)
- A database

…will not be accepted in their current form. Re-architect to use a free, key-less API (like Open-Meteo) or a pure client-side approach.

---

## Reporting Bugs & Requesting Features

### Bugs

Open a GitHub Issue with:

- A clear title
- Steps to reproduce
- Expected vs. actual behaviour
- Browser / OS / device (especially for mobile layout issues)
- Screenshot or screen recording if applicable

### Feature Requests

Open a GitHub Issue with:

- What you want to add and why
- Which existing module it relates to (or that it's a new module)
- Any thoughts on implementation approach
- Mockups or sketches are very welcome

---

*Happy hacking, Vault Dweller. May your tests always pass and your builds never fail.*
