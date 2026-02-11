# External Integrations

**Analysis Date:** 2026-02-11

## APIs & External Services

**Weather API:**
- OpenWeatherMap API
  - SDK/Client: Native `fetch` in `src/hooks/useWeather.ts`
  - Auth: `VITE_OPENWEATHER_API_KEY` environment variable
  - Endpoints: Current weather, 5-day forecast, city search

**Stock API:**
- Financial data API (Alpha Vantage or similar)
  - SDK/Client: `src/lib/api/stockApi.ts`
  - Auth: Via proxy or API key
  - Features: Real-time quotes, search

## Data Storage

**Databases:**
- None (client-side only)

**File Storage:**
- Local filesystem only via localStorage
- All data persisted in browser localStorage

**Caching:**
- In-memory cache for stock quotes (`src/store/stockStorage.ts`)
- localStorage as persistent cache

## Authentication & Identity

**Auth Provider:**
- OAuth 2.0 (Google, Microsoft, Notion)
  - Implementation: `src/lib/auth/oauthManager.ts`
  - Token storage: `src/lib/auth/tokenStorage.ts`
  - OAuth proxy: `server/oauth-proxy.ts`

**Supported Providers:**
- Google (Calendar, Tasks, UserInfo)
- Microsoft (Outlook Calendar, UserInfo)
- Notion (Tasks integration)

**OAuth Flow:**
- PKCE flow for security
- Token refresh handling
- Connection persistence in localStorage

## Third-Party API Integrations

**Google APIs:**
- Google Tasks API
  - Client: `src/lib/sync/googleTasksApi.ts`
  - Sync: `src/lib/sync/googleTasksSync.ts`
  - Scopes: `tasks`, `calendar`, `calendar.events`

- Google Calendar API
  - Client: `src/lib/sync/googleCalendarApi.ts`
  - Sync: `src/lib/sync/googleCalendarSync.ts`
  - Mapper: `src/lib/sync/googleCalendarMapper.ts`

**Microsoft APIs:**
- Microsoft Graph API (Outlook)
  - Client: `src/lib/sync/outlookSync.ts`
  - Status: Partially implemented (TODO markers present)
  - Scopes: `User.Read`, `Calendars.ReadWrite`, `offline_access`

**Notion API:**
- Notion API
  - Client: `src/lib/sync/notionSync.ts`
  - For todo/task synchronization

## RSS Feeds

**RSS Reader:**
- Native `fetch` for RSS feed parsing
- Implementation: `src/widgets/RSS/RSSWidget.tsx`
- Features: Multiple feed management, article preview

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Custom logger in `src/lib/logger.ts`
- Console-based with DEBUG prefix
- Production: errors only

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel (recommended)
- OAuth Backend: Railway or Render

**CI Pipeline:**
- None configured in repository
- Build: `pnpm build`
- Test: `pnpm test`

**Deployment Config:**
- `vercel.json` - Vercel routing configuration

## Environment Configuration

**Required env vars:**
```bash
VITE_OPENWEATHER_API_KEY=your_key  # Weather widget
```

**Optional OAuth env vars:**
```bash
VITE_GOOGLE_CLIENT_ID=xxx          # Google OAuth
VITE_GOOGLE_REDIRECT_URI=xxx       # Google callback URL
VITE_MICROSOFT_CLIENT_ID=xxx       # Microsoft OAuth
VITE_MICROSOFT_TENANT=common       # Microsoft tenant
VITE_MICROSOFT_REDIRECT_URI=xxx    # Microsoft callback URL
VITE_NOTION_CLIENT_ID=xxx          # Notion OAuth
VITE_NOTION_REDIRECT_URI=xxx       # Notion callback URL
```

**Secrets location:**
- `.env.local` (gitignored)
- Vercel environment variables for production

## Webhooks & Callbacks

**Incoming:**
- OAuth callbacks at `/oauth/{provider}/callback`
- Handled by `src/pages/OAuthCallback.tsx`

**Outgoing:**
- None

---

*Integration audit: 2026-02-11*
