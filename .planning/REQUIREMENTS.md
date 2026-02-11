# Requirements: Dashboard Personnel Améliorations

**Defined:** 2026-02-11
**Core Value:** Un dashboard personnel performant, sécurisé et maintenable

## v1 Requirements

Requirements pour améliorer le dashboard existant.

### Sécurité

- [ ] **SEC-01**: Stocker les tokens OAuth en HttpOnly cookies via le proxy existant
- [ ] **SEC-02**: Implémenter Content Security Policy strict
- [ ] **SEC-03**: Nettoyer les tokens invalides du localStorage

### Performance

- [ ] **PERF-01**: Découper TodoWidget.tsx (2556 lignes) en sous-composants
- [ ] **PERF-02**: Découper CalendarWidget.tsx (1672 lignes) en sous-composants
- [ ] **PERF-03**: Analyser et optimiser le bundle size (framer-motion, recharts)
- [ ] **PERF-04**: Baisser le seuil de virtualisation de 100 à 50 items pour mobile
- [ ] **PERF-05**: Lazy charger Recharts (chart-lazy existe déjà)

### Architecture

- [ ] **ARCH-01**: Créer Error Boundary global pour éviter crash complet
- [ ] **ARCH-02**: Implémenter Repository pattern pour data layer
- [ ] **ARCH-03**: Normaliser state management (relations cross-widgets)
- [ ] **ARCH-04**: Parser les icônes Lucide pour widgets externes

### Tests

- [ ] **TEST-01**: Créer tests E2E avec Playwright (OAuth flow, drag-drop)
- [ ] **TEST-02**: Couvrir oauthManager.ts (token refresh, multi-providers)
- [ ] **TEST-03**: Tests Error Boundary avec crash scenarios

### Sync & Intégrations

- [ ] **SYNC-01**: Implémenter Outlook sync complet (Microsoft Graph API)
- [ ] **SYNC-02**: Suivre le pattern de googleCalendarSync.ts

### UX/DX

- [ ] **UX-01**: Créer PWA avec Service Worker (offline support)
- [ ] **UX-02**: Implémenter export/import de données (backup)
- [ ] **UX-03**: Loading states globaux avec Suspense + skeletons
- [ ] **UX-04**: Toasts regroupés pour éviter spam

### Quality of Life

- [ ] **QOL-01**: Debug panel (window.__ZUSTAND_STORES__) en dev
- [ ] **QOL-02**: Validation des formulaires avec Zod
- [ ] **QOL-03**: Performance monitor (Web Vitals)

## v2 Requirements

Améliorations différées.

- [ ] **V2-SEARCH-01**: Recherche globale (Ctrl+K)
- [ ] **V2-SHORTCUT-01**: Shortcuts clavier globaux
- [ ] **V2-THEME-01**: Thèmes personnalisables (color schemes)
- [ ] **V2-MARKET-01**: Marketplace widgets communautaires

## Out of Scope

| Feature | Reason |
|---------|--------|
| Réécriture complète | Améliorations incrémentales sur base existante |
| Nouveaux widgets | Focus sur qualité/existants, pas nouvelles features |
| Backend complexe | Garder SPA avec proxy OAuth léger |
| Mobile app native | Web-first, PWA suffisant (v2) |
| Real-time collaboration | Hors scope personnel dashboard |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| QOL-01 | Phase 1 | Pending |
| QOL-02 | Phase 1 | Pending |
| QOL-03 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| PERF-01 | Phase 2 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |
| PERF-04 | Phase 2 | Pending |
| PERF-05 | Phase 3 | Pending |
| ARCH-01 | Phase 4 | Pending |
| ARCH-02 | Phase 6 | Pending |
| ARCH-03 | Phase 6 | Pending |
| ARCH-04 | Phase 3 | Pending |
| TEST-01 | Phase 5 | Pending |
| TEST-02 | Phase 7 | Pending |
| TEST-03 | Phase 1 | Pending |
| SYNC-01 | Phase 7 | Pending |
| SYNC-02 | Phase 3 | Pending |
| UX-01 | Phase 8 | Pending |
| UX-02 | Phase 2 | Pending |
| UX-03 | Phase 2 | Pending |
| UX-04 | Phase 2 | Pending |
| PERF-01 | Phase 2 | Pending |
| PERF-02 | Phase 2 | Pending |
| PERF-03 | Phase 3 | Pending |
| PERF-04 | Phase 2 | Pending |
| PERF-05 | Phase 3 | Pending |
| ARCH-01 | Phase 1 | Pending |
| ARCH-02 | Phase 4 | Pending |
| ARCH-03 | Phase 4 | Pending |
| ARCH-04 | Phase 3 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 1 | Pending |
| TEST-03 | Phase 1 | Pending |
| SYNC-01 | Phase 3 | Pending |
| SYNC-02 | Phase 3 | Pending |
| UX-01 | Phase 4 | Pending |
| UX-02 | Phase 2 | Pending |
| UX-03 | Phase 2 | Pending |
| UX-04 | Phase 2 | Pending |
| QOL-01 | Phase 1 | Pending |
| QOL-02 | Phase 2 | Pending |
| QOL-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
