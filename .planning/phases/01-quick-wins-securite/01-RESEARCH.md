# Phase 1: Quick Wins & Sécurité - Research

**Research Date:** 2026-02-11
**Status:** Standard research completed

---

## Research Overview

Phase 1 involves security improvements and developer experience enhancements:
1. Browser DevTools integration for Zustand debugging
2. OAuth token migration to HttpOnly cookies
3. Content Security Policy with nonces for Tailwind CSS v4
4. Form validation with Zod

This research documents implementation patterns and best practices for each area.

---

## 1. Debug Panel (Browser DevTools Integration)

### Chrome DevTools Panel Extension

**Pattern: Browser DevTools Panel**

Chrome extensions can add custom panels to DevTools using `chrome.devtools.panels` API.

**Key Implementation Points:**

```typescript
// devtools/panel.html
<!DOCTYPE html>
<html>
<head>
  <script src="panel.js"></script>
</head>
<body>
  <div id="app"></div>
</body>
</html>

// devtools/panel.js - executes in DevTools context
chrome.devtools.panels.create(
  "Zustand Stores",
  "icon.png",
  "panel.html",
  (panel) => {
    panel.onShown.addListener(() => {
      // Initialize panel UI
      initializeStoreInspector();
    });
  }
);
```

**Communication Pattern (Background ↔ Content Script ↔ Page):**

1. **Background script** (`devtools.js`) - creates panel
2. **Panel** (`panel.html` + `panel.js`) - UI for inspecting stores
3. **Content script** (`content.js`) - injected into app page, reads stores
4. **Message passing** - `chrome.runtime.sendMessage()` between contexts

```typescript
// Content script reads stores from window
function getStores() {
  return {
    todos: window.__ZUSTAND_STORES__?.todos?.getState(),
    dashboard: window.__ZUSTAND_STORES__?.dashboard?.getState(),
    weather: window.__ZUSTAND_STORES__?.weather?.getState()
  };
}

// Send to panel on request
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'getStores') {
    chrome.runtime.sendMessage({ stores: getStores() });
  }
});
```

### Zustand Store Exposure Pattern

Zustand stores need to be exposed to `window.__ZUSTAND_STORES__` for inspection:

```typescript
// In each store file
import { create } from 'zustand';

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
}));

// Development-only exposure
if (import.meta.env.DEV) {
  (window as any).__ZUSTAND_STORES__ = (window as any).__ZUSTAND_STORES__ || {};
  (window as any).__ZUSTAND_STORES__.todos = useTodoStore;
}
```

### State Diff Implementation

For highlighting changes between actions:

```typescript
// Simple diff algorithm
function diffState<T>(prev: T, curr: T): Record<string, {from: any, to: any}> {
  const changes: Record<string, {from: any, to: any}> = {};
  for (const key in curr) {
    if (prev[key] !== curr[key]) {
      changes[key] = { from: prev[key], to: curr[key] };
    }
  }
  return changes;
}

// Track state changes
const prevState = getState();
middleware((config) => (set, get, api) =>
  config(
    (partial, replace) => {
      set(partial, replace);
      const newState = get();
      const changes = diffState(prevState, newState);
      actionHistory.push({ type: 'setState', changes, timestamp: Date.now() });
    },
    get,
    api
  )
);
```

**Don't Hand Roll:**
- Don't build a full state management debugging system from scratch
- Use existing patterns from Redux DevTools extension as reference

---

## 2. OAuth Token Migration to HttpOnly Cookies

### Security Rationale

**XSS Vulnerability with localStorage:**
- JavaScript can read localStorage → tokens exposed to XSS attacks
- HttpOnly cookies inaccessible to JavaScript → tokens protected

### Current Architecture Analysis

**OAuth Flow (Google OAuth example):**

1. Frontend: `window.location.href = /api/auth/google` (OAuth proxy)
2. Proxy: Redirects to Google OAuth consent screen
3. Google: Redirects back to `/api/auth/callback?code=...`
4. Proxy: Exchanges code for access token, stores it
5. Proxy: Sets encrypted cookie with token, redirects to frontend

**Current Issue:** Tokens stored in localStorage for API calls

### Migration Strategy

**Step 1: Backend - Set HttpOnly Cookie in OAuth Proxy**

```typescript
// server/routes/auth.ts
import express from 'express';
import cookieParser from 'cookie-parser';

const router = express.Router();

router.get('/google', (req, res) => {
  // Redirect to Google OAuth
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?...`;
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Store in HttpOnly, Secure cookie
  res.cookie('auth_tokens', JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    provider: 'google'
  }), {
    httpOnly: true,    // Inaccessible to JavaScript
    secure: true,       // HTTPS only
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.redirect('http://localhost:5173/dashboard');
});
```

**Step 2: Backend - Token Endpoint for Proxy Requests**

```typescript
// server/middleware/auth.ts
export function extractTokens(req: Request): { access_token?: string } {
  const cookieHeader = req.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const authData = cookies.auth_tokens ? JSON.parse(cookies.auth_tokens) : null;
  return authData || {};
}

// server/routes/proxy.ts
router.all('/api/*', async (req, res) => {
  const tokens = extractTokens(req);

  if (!tokens.access_token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Forward request to external API with Bearer token
  const response = await fetch(req.url.replace('/api', ''), {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`
    }
  });

  res.json(response.json());
});
```

**Step 3: Frontend - Migration Script**

```typescript
// src/lib/auth/tokenMigration.ts
import { logger } from '@/lib/logger';

export async function migrateTokens(): Promise<boolean> {
  const legacyTokens = {
    google: localStorage.getItem('google_tokens'),
    microsoft: localStorage.getItem('microsoft_tokens'),
    notion: localStorage.getItem('notion_tokens'),
  };

  const providers = Object.entries(legacyTokens).filter(([_, token]) => token);

  if (providers.length === 0) {
    logger.info('No legacy tokens to migrate');
    return true;
  }

  for (const [provider, tokenString] of providers) {
    try {
      const tokens = JSON.parse(tokenString);

      // Send to backend for cookie migration
      const response = await fetch('/api/auth/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, tokens }),
      });

      if (response.ok) {
        localStorage.removeItem(`${provider}_tokens`);
        localStorage.removeItem(`${provider}_user`);
        logger.info(`Migrated ${provider} tokens to cookies`);
      }
    } catch (error) {
      logger.error(`Failed to migrate ${provider} tokens`, error);
    }
  }

  return true;
}
```

**Step 4: Exponential Backoff Retry**

```typescript
// src/lib/auth/tokenMigration.ts
async function migrateWithRetry(provider: string, tokens: any): Promise<boolean> {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch('/api/auth/migrate', { /* ... */ });
      if (response.ok) return true;
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        logger.error(`Migration failed after ${maxAttempts} attempts`);
        return false;
      }
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}
```

**Step 5: User Communication (Progressive)**

```typescript
// src/App.tsx - Show notice after migration
useEffect(() => {
  const migrationShown = sessionStorage.getItem('migration_notice_shown');

  migrateTokens().then(() => {
    if (!migrationShown) {
      toast.success("Sécurité améliorée ! Votre session a été préservée.", {
        duration: 5000,
        position: 'bottom-right',
      });
      sessionStorage.setItem('migration_notice_shown', 'true');
    }
  });
}, []);
```

**Don't Hand Roll:**
- Don't implement your own cookie parsing/security
- Use `cookie-parser` middleware
- Don't manually encrypt cookies — use HTTPS + httpOnly
- Don't implement OAuth flow from scratch — use existing proxy

---

## 3. Content Security Policy (CSP) with Nonces

### CSP Basics

**CSP Header Format:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'nonce-{random}' 'unsafe-inline'
```

### Tailwind CSS v4 + CSP Challenge

**Problem:** Tailwind generates dynamic `<style>` tags with utility classes → CSP blocks inline styles.

**Solution:** Use nonces for specific style tags.

### Implementation Pattern

**Step 1: Generate Nonce in Vite Config**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

export default defineConfig({
  plugins: [
    react({
      // Pass nonce to template
      template: ({ nonce }) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy"
                  content="default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';">
            <style nonce="${nonce}">
              /* Tailwind will inject here */
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `
    }),
  ],
});
```

**Step 2: Proxy Server Middleware for CSP Header**

```typescript
// server/middleware/csp.ts
import { generateNonce } from './utils';

export function cspMiddleware(req: Request, res: any, next: () => void) {
  const nonce = generateNonce();

  // CSP header with nonce
  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: https:`,
    `connect-src 'self' https://accounts.google.com https://graph.microsoft.com`,
    `frame-src https://accounts.google.com`,
  ].join('; ');

  // Attach nonce to request for use in templates
  res.locals.nonce = nonce;

  // Report-only mode (first week)
  res.setHeader('Content-Security-Policy-Report-Only', cspHeader);

  // After report-only period:
  // res.setHeader('Content-Security-Policy', cspHeader);

  next();
}
```

**Step 3: CSP Violation Logging**

```typescript
// server/routes/csp.ts
router.post('/csp-report', express.json({ type: 'application/csp-report'' }), (req, res) => {
  const report = req.body['csp-report'];

  logger.warn('CSP Violation:', {
    violatedDirective: report['violated-directive'],
    blockedURI: report['blocked-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
  });

  res.status(204).end();
});
```

**Step 4: Vite Plugin for CSP Development**

```typescript
// vite-plugin-csp.ts
import { Plugin } from 'vite';

export function cspPlugin(): Plugin {
  return {
    name: 'vite-plugin-csp',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/index.html') {
            const nonce = crypto.randomBytes(16).toString('base64');
            res.setHeader('Content-Security-Policy-Report-Only', `script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';`);
          }
          next();
        });
      };
    },
  };
}
```

**Moderate CSP Policy (recommended):**
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{nonce}';
  style-src 'self' 'nonce-{nonce}';
  img-src 'self' data: https:;
  connect-src 'self' https://accounts.google.com https://login.microsoftonline.com https://www.notionapi.com;
  frame-src https://accounts.google.com https://login.microsoftonline.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  report-uri /csp-report
```

**Don't Hand Roll:**
- Don't write your own nonce generator — use `crypto.randomBytes`
- Don't inline styles without nonces
- Don't forget CSP report endpoint for debugging
- Don't skip report-only period — you'll break the app

---

## 4. Form Validation with Zod

### Zod + React Hook Form Pattern

**Setup:**
```bash
pnpm add zod react-hook-form @hookform/resolvers
```

**Schema Definition:**
```typescript
// src/lib/validations/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

**Form Implementation:**
```typescript
// src/components/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit', // Progressive validation
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast.success('Connexion réussie');
    } catch (error) {
      if (error instanceof AuthError) {
        setError('root', { message: error.message });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label>Email</label>
        <input
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <span className="error">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label>Mot de passe</label>
        <input
          type="password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <span className="error">{errors.password.message}</span>
        )}
      </div>

      {errors.root && (
        <div className="error">{errors.root.message}</div>
      )}

      <button type="submit" disabled={isSubmitting}>
        Connexion
      </button>
    </form>
  );
}
```

### Progressive Validation

**On Submit First, Then On Change:**
```typescript
const [hasSubmitted, setHasSubmitted] = useState(false);

const {
  register,
  trigger,
  formState: { errors },
} = useForm({
  mode: hasSubmitted ? 'onChange' : 'onSubmit',
  resolver: zodResolver(schema),
});

const handleChange = (field: string) => {
  if (hasSubmitted) {
    trigger(field); // Validate only this field
  }
};

<input
  {...register('email', {
    onChange: () => handleChange('email'),
  })}
/>
```

### Context-Aware Submission

**Critical Forms (auth):**
```typescript
const onSubmit = async (data) => {
  const result = await schema.safeParse(data);
  if (!result.success) {
    // Block submission
    return;
  }
  // Proceed
};
```

**Standard Forms (todos):**
```typescript
const onSubmit = async (data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    toast.warning('Certaines données sont invalides mais ont été enregistrées');
  }
  // Always proceed
  await saveTodo(data);
};
```

### Validation Error Tone

**Friendly but Precise (French):**
```typescript
const commonErrors = {
  required: (field: string) => `${field} est requis`,
  email: "Format d'email invalide",
  minLength: (min: number) => `Au moins ${min} caractères requis`,
  pattern: (name: string) => `Format de ${name} invalide`,
};

export const todoSchema = z.object({
  title: z.string().min(1, commonErrors.required('Titre')),
  description: z.string().optional(),
  dueDate: z.string().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Date invalide' }
  ),
});
```

**Don't Hand Roll:**
- Don't write your own validation logic
- Don't ignore `safeParse` errors
- Don't show aggressive errors while typing
- Don't use toast spam for validation errors

---

## Common Pitfalls

### Debug Panel
- **Pitfall:** Forgetting to expose stores in dev mode only
- **Fix:** Wrap in `if (import.meta.env.DEV)`

### OAuth Migration
- **Pitfall:** Breaking existing sessions
- **Fix:** Progressive migration + fallback to re-auth
- **Pitfall:** Not cleaning up localStorage
- **Fix:** Remove legacy tokens after successful migration

### CSP
- **Pitfall:** Blocking Tailwind inline styles
- **Fix:** Use nonces for style tags
- **Pitfall:** Forgetting OAuth provider domains
- **Fix:** Include Google, Microsoft, Notion in CSP

### Form Validation
- **Pitfall:** Showing errors while typing
- **Fix:** Progressive validation (on submit → on change)
- **Pitfall:** Generic error messages
- **Fix:** Use friendly, specific messages

---

## Architecture Patterns

### Debug Panel Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Browser DevTools Extension                              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Background Script (devtools.js)                   │  │
│  │ - Creates panel on install                       │  │
│  │ - Listens for messages                           │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
│               ▼                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Panel (panel.html + panel.js)                     │  │
│  │ - Tabbed interface for stores                     │  │
│  │ - State diff viewer                              │  │
│  │ - Action history                                  │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
└───────────────┼─────────────────────────────────────────┘
                │
                │ chrome.runtime.sendMessage()
                ▼
┌─────────────────────────────────────────────────────────┐
│ Content Script (content.js)                              │
│ - Reads window.__ZUSTAND_STORES__                        │
│ - Sends store data to panel                             │
└─────────────────────────────────────────────────────────┘
```

### Token Migration Flow

```
┌─────────────────┐
│   Frontend      │
│  (React App)    │
└────────┬────────┘
         │
         │ 1. Check localStorage
         ▼
    ┌────────────────┐
    │ Legacy Tokens? │
    └────┬───────┬───┘
         │ Yes   │ No
         ▼       │
    ┌─────────┐   │
    │ Migrate │   │
    │ Script  │   │
    └────┬────┘   │
         │        │
         │ 2. POST /api/auth/migrate
         ▼
┌────────────────────────────┐
│   Proxy Server            │
│ (Express + OAuth Proxy)   │
└────────┬───────────────────┘
         │
         │ 3. Set HttpOnly cookie
         ▼
    ┌─────────────┐
    │  Set-Cookie│
    │  httpOnly  │
    └─────────────┘
         │
         │ 4. Redirect to dashboard
         ▼
    ┌────────────┐
    │  Success  │
    └────────────┘
```

---

## Recommended Libraries

- **Zustand DevTools:** Use Chrome extension pattern (not Zustand's built-in devtools)
- **Form Validation:** `zod` + `react-hook-form` + `@hookform/resolvers`
- **Cookie Parser:** `cookie-parser` for Express
- **CSP:** Custom middleware (no additional library needed)

---

## Testing Strategy

- **Debug Panel:** Manual testing in dev mode only
- **OAuth Migration:** E2E test (login → check cookie → verify localStorage cleaned)
- **CSP:** Browser console → check for violations → test report-only mode
- **Form Validation:** Unit tests for schemas, smoke tests for forms

---

**Research complete. Ready for planning.**
