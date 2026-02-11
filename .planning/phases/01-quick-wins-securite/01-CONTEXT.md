# Phase 1: Quick Wins & Sécurité Critique - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Infrastructure and security improvements including developer experience tools and critical XSS hardening. This phase delivers: (1) a debug panel for development with state inspection capabilities, (2) OAuth token migration from localStorage to HttpOnly cookies for XSS protection, (3) Content Security Policy implementation, and (4) form validation with Zod. These are foundational improvements that enable safer development and deployment — no user-facing features.

</domain>

<decisions>
## Implementation Decisions

### Debug Panel Interface
- **Data visibility:** Stores + action history + state diff (highlight changes between actions)
- **Interface style:** Browser DevTools panel integration (not floating widget or standalone page)
- **Available actions:** Read-only inspection only (no state reset, time-travel, or modifications)
- **Multiple stores:** Tabbed interface (separate tab for each store — todos, dashboard, weather, etc.)

### OAuth Token Migration Strategy
- **Migration approach:** Hybrid — attempt automatic token migration via backend, fall back to forced re-login if migration fails
- **User communication:** Progressive — small notice on next login ("We've improved security. Your session was preserved."), no action required
- **Migration failures:** Retry silently with exponential backoff (3 attempts max), fall back to natural token expiration triggering re-authentication
- **Timing:** Immediate migration on first app load after deployment (not lazy or deferred)

### Content Security Policy Strictness
- **Deployment mode:** Report-only for 1 week (collect violations without blocking), then enforce
- **Inline styles:** Use nonces for `<style>` tags (proxy server generates per-request nonce)
- **Policy strictness:** Moderate — allow app domain + CDNs (for assets) + OAuth providers (Google, Microsoft, Notion)
- **Violation reporting:** Log to server via existing logger infrastructure (no external service or alerting initially)

### Form Validation User Experience
- **Validation timing:** Progressive — on submit first, then on change after first validation attempt (no aggressive errors while initially typing)
- **Error display:** Inline errors directly below each invalid field (no toast spam or summary component)
- **Submission behavior:** Context-aware based on form criticality
  - Critical forms (auth, dangerous actions): Block submission completely
  - Standard forms (todos, settings): Allow submit with warnings
  - Minor forms (non-destructive updates): Allow submit + flag errors post-submit
- **Error tone:** Friendly but precise (e.g., "Please enter a valid email address" — clear and actionable without being condescending)

### Claude's Discretion
The following areas were delegated to Claude's discretion during planning/implementation:
- **Debug panel multiple stores:** Tabbed interface chosen as best practice (familiar from Redux DevTools)
- **OAuth migration failure handling:** Silent retry with backoff, natural expiration fallback
- **OAuth migration timing:** Immediate on app load for fastest security improvement
- **CSP deployment timeline:** 1 week report-only balances safety with urgency
- **CSP inline style approach:** Nonces are standard for Tailwind + CSP integration
- **CSP policy strictness:** Moderate allows functionality while providing strong XSS protection
- **CSP violation monitoring:** Server logging uses existing infrastructure
- **Form validation timing:** Progressive validation provides best UX
- **Form validation display:** Inline errors follow principle of proximity
- **Form validation submission:** Context-aware approach matches form risk levels
- **Form validation tone:** Friendly but precise balances clarity with brevity

</decisions>

<specifics>
## Specific Ideas

No specific requirements or references mentioned during discussion. All decisions based on best practices and security/UX principles.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope (debug panel, OAuth security, CSP, form validation). No new capabilities suggested that would belong in future phases.

</deferred>

---

*Phase: 01-quick-wins-securite*
*Context gathered: 2026-02-11*
