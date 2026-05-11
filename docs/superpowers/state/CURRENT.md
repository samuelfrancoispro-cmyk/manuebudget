# Fluxo — État courant

**Dernière mise à jour :** 2026-05-11
**Si tu viens d'arriver via `continu` : lis ce fichier puis reprends sans re-questionner.**

---

## Vision pivot 2026-05-11

**Fluxo = bac à sable financier libre.**
L'utilisateur construit son environnement en glissant des **modules** (briques fonctionnelles) sur un **whiteboard** (canvas infini). Pas de pages fixes, pas de colonnes. Modules configurable, redimensionnable, repositionnable. Complémentaires entre eux.

**Pivot total** — tout le code D1/D2/Cycles A-B-C1 est supprimé. Nouvelle architecture from scratch.

---

## Roadmap (révisée 2026-05-11)

| Phase | Scope | Statut |
|---|---|---|
| **W1** | Whiteboard core — engine + barre flottante + 4 modules MVP + onboarding + paramètres + cleanup | **EN COURS — spec validée** |
| **W2** | Landing refonte visuelle (skills design, proposals localhost) | ⏳ |
| **W3** | Layouts presets, magnétisme, modules supplémentaires, micro-animations page Modules | ⏳ |
| **C2** | GoCardless Bank Account Data | ⏳ |
| **C3** | PWA polish + SEO | ⏳ |
| **E** | Frontend complet — cohérence globale, animations, branding fin | ⏳ |
| **D9** | Agent IA (en dernier) | ⏳ |
| **F** | Lancement SaaS — Stripe réel, OAuth Google, CGV, RGPD, domaine prod | ⏳ |
| **G** | Marketing & Growth | ⏳ |

---

## W1 — état détaillé

**Spec :** `docs/superpowers/specs/2026-05-11-w1-whiteboard-core-design.md`
**Plan :** à créer (writing-plans)

### Ce qui a été fait

- ✅ Cleanup : toutes les specs/plans obsolètes supprimés
- ✅ Cleanup : pages obsolètes supprimées (Argent, Epargne, Rapports, Simulateur, Transactions, etc.)
- ✅ Cleanup : workspace D1/D2 supprimé (src/workspace/)
- ✅ Cleanup : composants obsolètes supprimés (FloatingSidebar, MobileDock, ImportMappingDialog, etc.)
- ✅ Spec W1 rédigée et auto-reviewée

### Plans d'implémentation (créés 2026-05-11)

| Fichier | Contenu | Statut |
|---|---|---|
| `docs/superpowers/plans/2026-05-11-w1-01-fondation.md` | SQL + types + pricing + 4 slices Zustand | ✅ Rédigé |
| `docs/superpowers/plans/2026-05-11-w1-02-engine.md` | collisionUtils + canvas zoom/pan + drag/resize + DropZoneLayer + SheetTabs | ✅ Rédigé |
| `docs/superpowers/plans/2026-05-11-w1-03-toolbar.md` | ModuleShell + FloatingToolbar + ModuleSearch + ModuleCategoryList | ✅ Rédigé |
| `docs/superpowers/plans/2026-05-11-w1-04-modules-mvp.md` | 4 modules MVP (Solde, Dépenses, Récurrentes, Objectif) | ✅ Rédigé |
| `docs/superpowers/plans/2026-05-11-w1-05-integration.md` | Dashboard DnD + App.tsx + Onboarding + Modules + Paramètres | ✅ Rédigé |

### À faire (implémentation)

- [ ] Exécuter `01-fondation` : SQL + types + store
- [ ] Exécuter `02-engine` : canvas + drag/resize
- [ ] Exécuter `03-toolbar` : barre flottante
- [ ] Exécuter `04-modules-mvp` : 4 modules
- [ ] Exécuter `05-integration` : assemblage final
- [ ] FloatingToolbar (nouvelle barre)
- [ ] 4 modules MVP (solde, depenses, recurrentes, objectif-epargne)
- [ ] Onboarding refonte
- [ ] Paramètres refonte
- [ ] Page Modules (catalogue)
- [ ] App.tsx + Layout.tsx nettoyés
- [ ] Design proposals en localhost (skills design)

### Décisions techniques

- **Whiteboard engine** : canvas absolu + dnd-kit + CSS transform (zéro re-render pendant drag)
- **Framer Motion** pour toutes les animations
- **Zoom/pan** : `useRef` pendant interaction, `useState` au release, Supabase debounced
- **Position layout** : `ref` + CSS transform direct pendant drag, batch upsert au pointerup
- **Barre flottante** : `position: fixed`, déplaçable Framer Motion drag, position localStorage
- **Stripe** : mock `setTierDirect()` jusqu'au lancement (Cycle F)

### Nouvelles tables Supabase (à exécuter)

Fichier SQL à créer : `docs/sql/2026-05-11-w1-whiteboard.sql`
⚠️ À runner manuellement dans Supabase Dashboard → SQL Editor.

### Tables conservées

`profiles`, `user_modules`, `categories`, `transactions`, `transactionsRecurrentes`,
`comptesCourants`, `comptes`, `mouvements`, `objectifs`

### Tables à supprimer (dans le SQL)

`dashboard_pages`, `dashboard_widgets`, `projets`, `achatsProjet`,
`rapports`, `rapportLignes`, `bankProfiles`, `virementsRecurrents`, `actifs`

---

## Règles permanentes

- **Stripe** : mock actif (`setTierDirect`). Cycle F = activation réelle après création entreprise.
- **Design** : skills `/huashu-design`, `/ui-ux-pro-max`, `/impeccable`, `leonxlnx/taste-skill` — proposals visuels en localhost avant validation.
- **Sobriété** : USP commerciale. Ne pas surcharger l'UI.
- **SQL Supabase** : créer le fichier dans `docs/sql/`, demander au user de runner.
- **Reprise** : si user tape `continu` → lire ce fichier puis reprendre sans re-questionner.
- **Context engineering** : progressive disclosure, subagents pour tâches complexes, compaction à 70%.
- **Fluidité whiteboard** : contrainte non négociable — 0 re-render pendant drag/resize.
