# Codebase Concerns

**Analysis Date:** 2026-02-11

## Tech Debt

**Large Widget Files:**
- Issue: TodoWidget.tsx is 2556 lines, CalendarWidget.tsx is 1672 lines
- Files: `src/widgets/Todo/TodoWidget.tsx`, `src/widgets/Calendar/CalendarWidget.tsx`
- Impact: Difficult to navigate, maintain, and test; high cognitive load
- Fix approach: Extract sub-components to separate files in `components/` subfolder

**Outlook Sync Incomplete:**
- Issue: Microsoft Outlook sync has placeholder implementations
- Files: `src/lib/sync/outlookSync.ts`
- Impact: Calendar sync with Outlook non-functional
- Fix approach: Implement Microsoft Graph API calls following Google Calendar sync pattern

**Icon Parsing TODO:**
- Issue: External widget icon parsing not implemented
- Files: `src/lib/widgetRegistry.ts` (line 337)
- Impact: External widgets use default icon instead of specified icon
- Fix approach: Parse Lucide icon names and map to components

**Library Loading TODO:**
- Issue: Widget library loading from storage not implemented
- Files: `src/components/Dashboard/WidgetLibraryManager.tsx` (line 56)
- Impact: External widget libraries not persisted between sessions
- Fix approach: Implement loadLibrary() function call on mount

## Known Bugs

**None explicitly documented.**
- Tests pass (447 tests per README)
- No open bug markers in code

## Security Considerations

**Token Storage:**
- Risk: OAuth tokens stored in localStorage (accessible via XSS)
- Files: `src/lib/auth/tokenStorage.ts`
- Current mitigation: HttpOnly cookies not used (client-side only app)
- Recommendations: Consider short token expiry, implement CSP headers

**API Key Exposure:**
- Risk: OpenWeatherMap API key exposed in client bundle
- Files: Environment variable `VITE_OPENWEATHER_API_KEY`
- Current mitigation: Free tier API with usage limits
- Recommendations: Route through OAuth proxy for production

**OAuth Proxy Security:**
- Risk: Proxy server handles secrets
- Files: `server/oauth-proxy.ts`
- Current mitigation: Server-side only, not exposed to client
- Recommendations: Ensure proxy is properly secured in deployment

## Performance Bottlenecks

**Large Bundle Chunks:**
- Problem: React vendor chunk, motion-vendor chunk, charts-vendor chunk
- Files: `vite.config.ts` manualChunks configuration
- Cause: Heavy dependencies (framer-motion, recharts)
- Improvement path: Consider lighter alternatives, lazy load charts

**Widget Re-renders:**
- Problem: Complex widgets may re-render frequently
- Files: `src/widgets/Todo/TodoWidget.tsx`
- Cause: State changes in large component
- Improvement path: More granular memo(), split stores

**Virtualization Threshold:**
- Problem: Virtualization only kicks in at 100 items
- Files: `src/lib/constants.ts` (MAX_TODOS_WITHOUT_VIRTUALIZATION)
- Cause: Balance between complexity and performance
- Improvement path: Lower threshold for slower devices

## Fragile Areas

**Google Tasks Sync:**
- Files: `src/lib/sync/googleTasksSync.ts`
- Why fragile: Complex state management, retry logic, list mapping
- Safe modification: Add tests before changes, use TypeScript strict mode
- Test coverage: Good (multiple test files for sync scenarios)

**Calendar Widget:**
- Files: `src/widgets/Calendar/CalendarWidget.tsx`
- Why fragile: Complex UI with multiple views, drag-drop, recurrence
- Safe modification: Extract components first, maintain virtualization
- Test coverage: Good (10+ test files for calendar)

**OAuth Flow:**
- Files: `src/lib/auth/oauthManager.ts`, `src/pages/OAuthCallback.tsx`
- Why fragile: External dependency on provider behavior, token refresh edge cases
- Safe modification: Test all provider variations, handle error states
- Test coverage: Limited (mostly integration testing)

## Scaling Limits

**localStorage Capacity:**
- Current capacity: ~5-10MB depending on browser
- Limit: Quota exceeded errors, data loss
- Scaling path: Migrate to IndexedDB, implement data archival

**Widget Count:**
- Current capacity: 12 widgets
- Limit: Grid space, performance with many widgets
- Scaling path: Pagination, widget categories, dashboard tabs

**Sync Frequency:**
- Current capacity: 5-minute intervals
- Limit: API rate limits (Google, Microsoft)
- Scaling path: Adaptive sync, background sync API

## Dependencies at Risk

**None identified.**
- React 19 is stable
- Vite 7 is current
- All major dependencies actively maintained

## Missing Critical Features

**E2E Testing:**
- Problem: No end-to-end testing framework
- Blocks: Full user flow validation, regression testing

**Error Boundary:**
- Problem: No global error boundary for widget failures
- Blocks: Graceful degradation when widget crashes

**Offline Support:**
- Problem: No service worker or offline capability
- Blocks: Use without network connection

## Test Coverage Gaps

**OAuth Flow:**
- What's not tested: Full OAuth flow, token refresh
- Files: `src/lib/auth/`
- Risk: Auth failures in production
- Priority: Medium

**Widget Interactions:**
- What's not tested: Drag-drop layout changes, widget resizing
- Files: `src/components/Dashboard/WidgetGrid.tsx`
- Risk: Layout bugs
- Priority: Low

**Stock Widget:**
- What's not tested: API integration (only smoke test)
- Files: `src/widgets/Stock/`
- Risk: API changes breaking widget
- Priority: Low

**RSS Widget:**
- What's not tested: Feed parsing, error handling
- Files: `src/widgets/RSS/`
- Risk: Malformed feeds crashing widget
- Priority: Low

---

*Concerns audit: 2026-02-11*
