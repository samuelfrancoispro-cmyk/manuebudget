# Fluxo — État courant

**Dernière mise à jour :** 2026-05-07
**Si tu viens d'arriver via `continu` : lis ce fichier puis reprends sans re-questionner.**

---

## Où on en est

Refonte complète du SaaS Fluxo en cours, organisée en **3 macro-cycles** décomposés :

| Cycle | Scope | Statut |
|---|---|---|
| **A** | Fondations design (brand, palette, design system, pricing) | **✅ COMPLÉTÉ 2026-05-06** |
| **B** | Refonte UI complète (Landing pro, Login + Google OAuth, Onboarding redesign, refonte 6 pages app) | **✅ COMPLÉTÉ 2026-05-06** |
| **C1** | Stripe billing + feature gating runtime | **✅ COMPLÉTÉ 2026-05-07** |
| **C2** | GoCardless Bank Account Data (sync bancaire Pro) | ⏳ Attend C1 |
| **C3** | PWA polish + SEO avancé | ⏳ En attente |

---

## Cycle C1 — état détaillé

**✅ Complété le 2026-05-07**
Spec : `docs/superpowers/specs/2026-05-07-cycle-c1-stripe-gating-design.md`
Plan : `docs/superpowers/plans/2026-05-07-cycle-c1-stripe-gating.md`

**Livrables :**
- SQL migration : `docs/sql/2026-05-07-profiles-stripe-columns.sql` ← **à exécuter dans Supabase Dashboard**
- 3 Edge Functions Supabase : `create-checkout-session`, `stripe-webhook`, `create-portal-session`
- Hook `useEntitlement(featureKey, current?)` — gating synchrone basé sur le store
- Composants `HardGate` + `UpgradeBadge` dans `src/components/gate/`
- Banners trial expiré + past_due dans `Layout.tsx`
- Section Abonnement dans `Parametres.tsx` (checkout, portail, toggle mensuel/annuel)
- HardGate câblé sur : comptes courants (Parametres), comptes épargne + objectifs (Epargne), récurrentes (Recurrents), projets (Simulateur)
- UpgradeBadge câblé sur : import CSV + export Excel (Rapports)

**Actions manuelles restantes avant que C1 soit opérationnel :**
1. Exécuter `docs/sql/2026-05-07-profiles-stripe-columns.sql` dans Supabase Dashboard > SQL Editor
2. Créer les 4 Price IDs dans Stripe Dashboard (Plus mensuel/annuel, Pro mensuel/annuel)
3. Activer Stripe Tax dans le dashboard
4. Configurer le Customer Portal Stripe
5. Ajouter les secrets dans Supabase Edge Functions (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*, APP_URL, SUPABASE_SERVICE_ROLE_KEY)
6. Déployer les Edge Functions : `supabase functions deploy create-checkout-session --project-ref <ref>` (idem pour les 2 autres)
7. Enregistrer le webhook dans Stripe Dashboard → URL : `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

---

## Prochaine étape : Cycle C2 — GoCardless

Pour démarrer : invoquer `superpowers:brainstorming` avec input = "Cycle C2 Fluxo — GoCardless Bank Account Data".

## Reprise au prochain `continu`

1. Tu lis ce fichier.
2. Cycles A ✅, B ✅, C1 ✅ complétés.
3. C1 : vérifier si les actions manuelles Stripe/Supabase ont été faites (demander au user).
4. Prochaine étape = **Cycle C2 — GoCardless** ou **Cycle C3 — PWA+SEO** selon priorité user.
