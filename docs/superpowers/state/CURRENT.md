# Fluxo — État courant

**Dernière mise à jour :** 2026-05-05
**Si tu viens d'arriver via `continu` : lis ce fichier puis reprends sans re-questionner.**

---

## Où on en est

Refonte complète du SaaS Fluxo en cours, organisée en **3 macro-cycles** :

| Cycle | Scope | Statut |
|---|---|---|
| **A** | Fondations design (brand, palette, design system, pricing) | **✅ COMPLÉTÉ 2026-05-06** |
| **B** | Refonte UI complète (Landing pro, Login + Google OAuth, Onboarding redesign, refonte 6 pages app) | ⏳ Attend Cycle A |
| **C** | Monétisation (Stripe billing, feature gating runtime, PWA polish, SEO avancé) | ⏳ Attend Cycle B |

---

## Cycle A — état détaillé

**✅ Complété le 2026-05-06**. Spec : `docs/superpowers/specs/2026-05-05-cycle-a-fondations-design.md`. Plan : `docs/superpowers/plans/2026-05-05-cycle-a-fondations-design.md`. Doc design system : `docs/design-system.md`.

**Livrables :**
- Tokens CSS warm paper mono (clair + sombre) dans `src/index.css`
- Tokens Tailwind nouveaux (`paper`, `surface`, `ink`, `positive`, etc.)
- 8 composants brand dans `src/components/brand/` + barrel export
- Source de vérité pricing typée : `src/lib/pricing.ts`
- Placeholders logo SVG (`public/logo*.svg`) — à remplacer par le logo final user
- 3 composants ui ajustés : Card (rounded-2xl), Badge (variant pro), Tabs (underline)
- Doc design system

**Prochaine étape : Cycle B — refonte UI complète**
- Landing pro + Pricing page + tableau comparatif (consomme `tiers` + `features` de `pricing.ts`)
- Login redesign + Google OAuth + email verif
- Onboarding redesign + paywall fin de wizard
- Refonte des 6 pages app avec composants brand/

Démarrer Cycle B : invoquer `superpowers:brainstorming` avec input = "refonte UI Cycle B Fluxo".

---

## Reprise au prochain `continu`

1. Tu lis ce fichier.
2. Cycle A ✅ complété — les tokens, composants brand, pricing.ts et doc design system sont livrés.
3. Prochaine étape = **Cycle B — refonte UI complète**.
4. Pour démarrer : invoquer `superpowers:brainstorming` avec input = "refonte UI Cycle B Fluxo".

---

## Historique récent

- **2026-05-06** : Cycle A complété — design system Fluxo + composants brand + pricing.ts.
- **2026-05-05** : Brainstorming Cycle A complété, spec écrite, mémoires `project_brand.md` + `project_pricing.md` créées.
- **2026-05-05** : Landing + auth flow Fluxo livrés (chantier 0 SaaS).
- **2026-05-04** : Onboarding wizard 6 étapes livré.
- **2026-05-02** : Pivot SaaS B2C, vision produit définie, marché EU+UK, conformité documentée.
