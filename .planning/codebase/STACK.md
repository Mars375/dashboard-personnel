# Technology Stack

**Analysis Date:** 2026-02-11

## Languages

**Primary:**
- TypeScript 5.9 - All source code, strict mode enabled
- React 19.1 - UI framework with JSX/TSX

**Secondary:**
- CSS - Tailwind CSS v4 with custom utilities
- Markdown - Documentation in `docs/`

## Runtime

**Environment:**
- Node.js 18+ or 20+ required
- ES modules (`"type": "module"` in package.json)

**Package Manager:**
- pnpm 8+
- Lockfile: `pnpm-lock.yaml` (present, 205KB)

## Frameworks

**Core:**
- React 19.1.1 - UI component framework
- Vite 7.1.7 - Build tool and dev server
- Tailwind CSS 4.1.16 - Utility-first CSS

**Testing:**
- Vitest 4.0.5 - Test runner (Vite-native)
- Testing Library 16.3.0 - React testing utilities
- jsdom 27.1.0 - DOM simulation

**Build/Dev:**
- @vitejs/plugin-react 5.0.4 - React support for Vite
- esbuild - Minification (via Vite)
- TypeScript 5.9.3 - Type checking

## Key Dependencies

**Critical:**
- `zustand` 5.0.8 - State management with persistence
- `framer-motion` 12.23.24 - Animation library
- `recharts` 2.15.4 - Charts and data visualization
- `date-fns` 4.1.0 - Date manipulation
- `lucide-react` 0.548.0 - Icon library
- `react-grid-layout` 1.5.2 - Drag-and-drop grid system
- `zod` 4.1.12 - Runtime type validation

**UI Components (Radix/shadcn):**
- `@radix-ui/react-dialog` 1.1.15 - Modal dialogs
- `@radix-ui/react-dropdown-menu` 2.1.16 - Dropdown menus
- `@radix-ui/react-popover` 1.1.15 - Popover UI
- `@radix-ui/react-select` 2.2.6 - Select inputs
- `@radix-ui/react-checkbox` 1.3.3 - Checkboxes
- `@radix-ui/react-switch` 1.2.6 - Toggle switches
- `@radix-ui/react-tooltip` 1.2.8 - Tooltips
- `cmdk` 1.1.1 - Command palette
- `sonner` 2.0.7 - Toast notifications

**Infrastructure:**
- `express` 5.1.0 - OAuth proxy server
- `cors` 2.8.5 - CORS middleware
- `next-themes` 0.4.6 - Theme management (dark/light)
- `@tanstack/react-virtual` 3.13.12 - Virtualization for large lists

## Configuration

**Environment:**
- Vite environment variables (VITE_* prefix)
- Required: `VITE_OPENWEATHER_API_KEY` for weather widget
- Optional: OAuth credentials (`VITE_GOOGLE_CLIENT_ID`, `VITE_MICROSOFT_CLIENT_ID`, `VITE_NOTION_CLIENT_ID`)

**Build:**
- `vite.config.ts` - Build configuration with chunk splitting
- `tsconfig.json` - TypeScript configuration with path aliases
- `eslint.config.js` - Linting rules

**Key Config Files:**
- `tsconfig.app.json` - App TypeScript settings
- `tsconfig.node.json` - Node scripts TypeScript settings
- `vitest.config.ts` - Test configuration
- `components.json` - shadcn/ui configuration

## Platform Requirements

**Development:**
- Node.js 18+ or 20+
- pnpm 8+
- Modern browser with ES2020+ support

**Production:**
- Static hosting (Vercel recommended)
- Optional: Node.js server for OAuth proxy (Railway/Render)

---

*Stack analysis: 2026-02-11*
