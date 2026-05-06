# Fluxo — État courant

**Dernière mise à jour :** 2026-05-06
**Si tu viens d'arriver via `continu` : lis ce fichier puis reprends sans re-questionner.**

---

## Où on en est

Refonte complète du SaaS Fluxo en cours, organisée en **3 macro-cycles** :

| Cycle | Scope | Statut |
|---|---|---|
| **A** | Fondations design (brand, palette, design system, pricing) | **✅ COMPLÉTÉ 2026-05-06** |
| **B** | Refonte UI complète (Landing pro, Login + Google OAuth, Onboarding redesign, refonte 6 pages app) | **✅ COMPLÉTÉ 2026-05-06** |
| **C** | Monétisation (Stripe billing, feature gating runtime, PWA polish, SEO avancé) | ⏳ Attend Cycle B |

---

## Cycle B — état détaillé

**✅ Complété le 2026-05-06**. Spec : `docs/superpowers/specs/2026-05-06-cycle-b-design.md`. Plan : `docs/superpowers/plans/2026-05-06-cycle-b-refonte-ui.md`.

**Livrables :**
- Landing pro complète (hero, features, social proof, pricing PricingTable, FAQ, footer)
- Login redesign + Google OAuth + écran email confirmation
- Route `/auth/callback` pour le callback OAuth
- Onboarding redesigné (warm paper) + étape 7 `OnboardingTier` (choix tier)
- DB : colonnes `tier` + `trialEndsAt` sur `profiles`
- Layout.tsx refactorisé (BrandLogo, warm paper, nav redesign)
- 6 pages app migrées (tokens warm paper, KPICard, DataRow, EmptyState, SectionHeader)
- `PricingTable.tsx` composant brand dédié

**Prochaine étape : Cycle C — Monétisation**
- Stripe Subscriptions + Customer Portal + Tax
- `useEntitlement(featureKey)` runtime — enforcement des tiers
- GoCardless Bank Account Data (Pro uniquement)
- PWA polish (install prompt, offline)
- SEO avancé (sitemap, structured data)

---

## Reprise au prochain `continu`

1. Tu lis ce fichier.
2. Cycles A ✅ et B ✅ complétés.
3. Prochaine étape = **Cycle C — Monétisation**.
4. Pour démarrer : invoquer `superpowers:brainstorming` avec input = "Cycle C Fluxo — Monétisation".
