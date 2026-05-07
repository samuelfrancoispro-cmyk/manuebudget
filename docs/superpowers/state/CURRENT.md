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

## Décision 2026-05-07 — Stripe en mode mock jusqu'au lancement

**Stripe postponé** (création entreprise requise avant activation paiement réel).
- `src/lib/stripe.ts` = mock `setTierDirect()` → update Supabase direct, pas d'Edge Functions.
- Les 7 étapes manuelles Stripe (Price IDs, Tax, Portal, Secrets, Deploy, Webhook) sont documentées en session — à faire au moment du lancement.
- Le gating (HardGate, UpgradeBadge, useEntitlement) est **fonctionnel** et testable via le sélecteur de tier dans Paramètres.

**Focus actuel :** praticité + fonctionnel + qualité. Backend/API = placeholders jusqu'au lancement.

---

## Décision 2026-05-07 — Vision Fluxo v3 validée

**Spec stratégique complète :** `docs/superpowers/specs/2026-05-07-fluxo-v3-vision.md`

**Concept fondateur :** Bac à sable financier sobre, alimenté par IA.
- 11 modules activables/désactivables
- Dashboard multi-pages drag & drop (Pages/Sheets)
- Agent IA de navigation (tutoriels, alertes, insights — pas chatbot)
- 45 features planifiées

**Modules défaut ON :** Budget, Forecast, Épargne, Simulateur, Rapports
**Modules optionnels :** Investissements, Patrimoine, Dettes, Fiscalité, Duo, Freelance, Multi-devise

**Navigation retenue :** Sidebar flottante desktop → dock bottom mobile

**Cycles d'implémentation planifiés :**
- D1 : Workspace (pages/sheets + widget drag&drop)
- D2 : Navigation flottante + registre modules
- D3 : Budget v2 (date de paie, fenêtre dépense, calendrier, détecteurs)
- D4 : Forecast (algorithme 30-90j, alertes, patterns)
- D5 : Investissements
- D6 : Patrimoine + Net Worth + Score santé
- D7 : Dettes & Emprunts
- D8 : Épargne v2 (pots, défis)
- D9 : Agent IA
- D10 : Fiscalité
- D11 : Rapports v2
- D12 : Modules avancés (Duo, Freelance, Multi-devise)
- D13 : Règles automatiques + défis

**Stripe :** Postponé (mock direct DB actif). Activer au moment de la création de l'entreprise.
**C2 GoCardless / C3 PWA+SEO :** Intégrés dans la roadmap v3 — GoCardless = sync bancaire dans module Budget.

## Reprise au prochain `continu`

1. Tu lis ce fichier.
2. Cycles A ✅ B ✅ C1 ✅ + Vision v3 ✅ (spec validée).
3. Prochain cycle = **D1 Workspace** (pages/sheets + dashboard drag&drop) ou **D2 Navigation** selon priorité user.
4. Stripe = mock, ne pas demander les étapes manuelles.
5. Design visuel (couleurs/animations) = délégué à Claude Design — ne pas implémenter manuellement.
