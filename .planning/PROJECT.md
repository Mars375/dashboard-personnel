# Dashboard Personnel - Améliorations

## What This Is

Dashboard personnel existant avec 12 widgets (météo, tâches, calendrier, finances, etc.) construit avec React 19, TypeScript, Vite 7. L'objectif est d'améliorer la sécurité, performance, qualité du code et l'expérience utilisateur.

## Core Value

**Un dashboard personnel performant, sécurisé et maintenable** qui permette aux utilisateurs d'organiser leur vie quotidienne avec des widgets synchronisables.

## Requirements

### Validated

- ✓ **Widgets fonctionnels** — 12 widgets existants (Todo, Calendar, Weather, Finance, etc.)
- ✓ **Architecture modulaire** — Système de widgets avec lazy loading
- ✓ **État persistant** — Zustand + localStorage
- ✓ **Sync OAuth** — Google Tasks/Calendar, Notion partiellement implémenté
- ✓ **Tests** — 447 tests unit/intégration

### Active

- [ ] **Sécurité tokens OAuth** — Stocker les tokens en HttpOnly cookies au lieu de localStorage
- [ ] **Refactor widgets géants** — Découper TodoWidget (2556 lignes) et CalendarWidget (1672 lignes)
- [ ] **Optimisation bundle** — Réduire taille de framer-motion et recharts
- [ ] **Virtualisation améliorée** — Baisser seuil de 100 à 50-75 items
- [ ] **Tests E2E** — Ajouter Playwright pour flows critiques
- [ ] **Error Boundary** — Boundary global pour éviter crash complet
- [ ] **Coverage OAuth** — Tests complets pour auth/oauthManager
- [ ] **Outlook sync complète** — Implémenter sync Microsoft Graph
- [ ] **Parsing icônes widgets** — Parser les noms Lucide pour widgets externes
- [ ] **State management** — Normalisation ou patterns relationnels
- [ ] **Data layer abstraction** — Repository pattern au lieu de localStorage direct
- [ ] **PWA** — Service worker + manifest pour offline
- [ ] **Export/import données** — Backup et migration entre navigateurs
- [ ] **Loading states globaux** — Suspense avec skeletons par widget

### Out of Scope

- **Réécriture complète** — Améliorations incrémentales, pas de rewrite
- **Nouveaux widgets** — Focus sur améliorations existantes
- **Backend complexe** — Garder architecture SPA avec proxy OAuth léger
- **Mobile app native** — Web-first, PWA suffisant

## Context

**Environnement technique:**
- React 19.1, TypeScript 5.9, Vite 7
- Tailwind CSS v4, Zustand 5.0
- shadcn/ui (Radix), Framer Motion, Recharts
- OAuth proxy Express pour Google/Microsoft/Notion

**Architecture actuelle:**
- Widget-based avec lazy loading
- Stores séparés (todoStore, calendarStore, etc.)
- Sync providers pour Google/Notion
- localStorage direct pour persistance

**Problèmes connus:**
- Tokens vulnérables à XSS (localStorage)
- Widgets trop gros (difficiles à maintenir)
- Pas de tests E2E
- Outlook sync non implémenté
- Pas d'Error Boundary global

## Constraints

- **Stack**: Maintenir React 19, TypeScript, Vite, Tailwind
- **Backward compatibility**: Ne pas casser les widgets existants
- **Performance**: Ne pas augmenter le bundle size
- **Testing**: Maintenir les 447 tests existants

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Quick wins prioritaire | Impact rapide, momentum | — Pending |
| Sécurité d'abord | XSS vulnérabilité critique | — Pending |
| Refactor progressif | Pas de big-bang rewrite | — Pending |

---
*Last updated: 2026-02-11 after initialization*
