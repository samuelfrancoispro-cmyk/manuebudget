# Cycle B — Refonte UI complète Fluxo

**Date :** 2026-05-06
**Statut :** spec validée, plan d'implémentation à produire
**Cycle :** B (sur 3 — A: fondations ✅ | B: refonte UI | C: monétisation)
**Prérequis :** Cycle A complété (tokens warm paper, composants brand/, pricing.ts)
**Bloque :** Cycle C (Stripe billing, feature gating runtime)

---

## 1. Contexte & objectif

Le Cycle A a posé les fondations design : tokens warm paper, 8 composants brand, `pricing.ts`. Le Cycle B applique ces fondations à toutes les pages de l'application — publiques et privées — pour donner à Fluxo une identité visuelle cohérente et professionnelle de bout en bout.

**USP rappelée :** sobriété radicale. Chaque ajout doit justifier sa présence. Pas d'ornement.

**Livrables Cycle B :**
- Landing pro (marketing complet + pricing + FAQ)
- Login redesigné + Google OAuth + email verification
- Onboarding redesigné + étape 7 paywall (choix tier)
- Layout app refactorisé (sidebar BrandLogo, tokens warm paper)
- 6 pages app migrées (tokens + composants brand + layout harmonisé)

**Hors-scope Cycle B :** Stripe billing, feature gating runtime, GoCardless, PWA polish, SEO avancé. Tout cela = Cycle C.

---

## 2. Architecture & approche

### 2.1 Approche retenue : Landing-first pur (séquentiel)

Pages publiques d'abord (Landing, Login, Onboarding — indépendantes du `Layout.tsx` app), puis Layout + 6 pages app en phase cohérente.

| Phase | Chantier | Fichiers principaux |
|---|---|---|
| 1 | Landing pro | `src/pages/Landing.tsx`, `src/components/brand/PricingTable.tsx` (nouveau) |
| 2 | Login + Google OAuth | `src/pages/Login.tsx`, `src/lib/auth.tsx`, `src/App.tsx` |
| 3 | Onboarding redesign + paywall | `src/pages/Onboarding.tsx`, `src/components/onboarding/OnboardingTier.tsx` (nouveau), `src/components/onboarding/OnboardingStep.tsx` |
| 4 | Layout + 6 pages app | `src/components/Layout.tsx`, Dashboard, Argent, Épargne, Rapports, Paramètres, Aide |

### 2.2 Règles transversales

- **Tokens :** `bg-paper`, `text-ink`, `text-ink-muted`, `bg-surface`, `border-border`, etc. Jamais `bg-background` / `text-foreground` / `bg-primary` / `text-muted-foreground` dans les fichiers refactorisés.
- **Composants brand :** `KPICard`, `DataRow`, `EmptyState`, `BrandLogo`, `SectionHeader`, `Eyebrow`, `PriceTag`, `ProBadge` utilisés systématiquement dès qu'applicable.
- **i18n :** toutes les nouvelles strings passent par `i18n.ts`. Bilingue FR/EN dès le départ.
- **Dark mode :** chaque page vérifiée clair + sombre avant validation.
- **SEO :** `<title>` + `<meta description>` + OG tags uniquement sur Landing et Login.

---

## 3. Chantier 1 — Landing pro

### 3.1 Structure de la page

| Section | Contenu |
|---|---|
| **Header** | `BrandLogo variant="full"` + nav (Connexion, CTA "Essayer gratuitement") — sticky, `bg-paper` |
| **Hero** | Eyebrow "Gratuit, sans CB" + tagline forte (1 ligne) + sous-titre (2 lignes max) + 2 CTA (primaire = inscription, secondaire = connexion) |
| **Features** | 3–4 features clés : icône + titre + description courte. Grille 2 col desktop / 1 col mobile |
| **Social proof** | 1 ligne de stats sobres : nombre d'utilisateurs, pays, sync. Chiffres à remplacer quand réels. |
| **Pricing** | `SectionHeader` + 3 cartes tier (`PriceTag` + `ProBadge` sur Pro) + tableau comparatif. Toggle mensuel/annuel. |
| **FAQ** | 4–5 questions accordion (shadcn Accordion). Voir section 3.3. |
| **Footer** | Liens légaux (CGU, Politique confidentialité — pages vides) + copyright + toggle langue FR/EN |

### 3.2 Pricing & tableau comparatif

- Toggle mensuel/annuel = state local React (pas de route séparée). Prix barré + `−33%` / `−35%` en annuel.
- Composant `PricingTable` dédié : `src/components/brand/PricingTable.tsx`.
- Consomme `tiers` et `featureMatrix` de `src/lib/pricing.ts` — aucune donnée dupliquée.
- CTA par tier : "Commencer gratuitement" (Free) / "Essayer 14 jours gratuit" (Plus & Pro, sans CB).

### 3.3 FAQ — questions

1. "Mes données sont-elles sécurisées ?"
2. "Puis-je annuler à tout moment ?"
3. "GoCardless, c'est quoi ?"
4. "Le plan gratuit est-il vraiment gratuit ?"
5. "La TVA est-elle incluse dans le prix ?"

### 3.4 SEO

```html
<title>Fluxo — Gérez votre budget simplement</title>
<meta name="description" content="Fluxo, l'application de budget personnel simple et abordable. Synchronisation bancaire, suivi des dépenses, objectifs d'épargne. Gratuit pour démarrer." />
<meta property="og:title" content="Fluxo — Gérez votre budget simplement" />
<meta property="og:description" content="Fluxo, l'application de budget personnel simple et abordable. Synchronisation bancaire, suivi des dépenses, objectifs d'épargne. Gratuit pour démarrer." />
<meta property="og:type" content="website" />
```

### 3.5 Décisions techniques

- Landing = route publique `/` sans `Layout.tsx` app.
- `Accordion` de shadcn/ui pour la FAQ.
- Pas de routing pour le toggle mensuel/annuel.

---

## 4. Chantier 2 — Login + Google OAuth

### 4.1 Layout

Page centrée, fond `bg-paper`, carte `bg-surface` (remplace `bg-muted/30`). `BrandLogo variant="mark"` en haut de la carte. Toggle signin/signup conservé.

### 4.2 Google OAuth

**Flux :**
1. Bouton "Continuer avec Google" → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })`
2. Route `/auth/callback` ajoutée dans `App.tsx` — composant qui attend le token Supabase et redirige vers `/dashboard`.
3. `auth.tsx` : ajout de `signInWithGoogle()`. Supabase émet le même événement `SIGNED_IN` quel que soit le provider.

**Configuration manuelle requise (hors code) :**
- Supabase Dashboard → Authentication → Providers → Google : activer, entrer Client ID + Secret Google Cloud.
- Google Cloud Console : ajouter l'URL de callback Supabase dans les origines autorisées.
- Ces étapes sont documentées dans le plan d'implémentation — à faire par l'utilisateur.

### 4.3 Email verification

Sur signup email/pwd, si Supabase renvoie `email_confirmation_required` : afficher un écran "Vérifiez vos emails" inline (pas de redirect), avec bouton "Renvoyer l'email" (`supabase.auth.resend()`).

### 4.4 Fichiers touchés

- `src/pages/Login.tsx` — redesign complet + Google button + écran confirmation
- `src/lib/auth.tsx` — ajout `signInWithGoogle()`, gestion callback
- `src/App.tsx` — route `/auth/callback`

### 4.5 SEO Login

```html
<title>Connexion — Fluxo</title>
<meta name="description" content="Connectez-vous à Fluxo pour gérer votre budget." />
```

---

## 5. Chantier 3 — Onboarding redesign + paywall

### 5.1 Changements structurels

- Ajout d'une **étape 7** : `OnboardingTier.tsx` (nouveau composant).
- `STEPS` dans `Onboarding.tsx` étendu : `7: OnboardingTier`.
- Barre de progression mise à jour pour refléter 7 étapes.

### 5.2 Redesign visuel étapes 1–6

`OnboardingStep.tsx` est le point central : le migrer vers tokens warm paper (`bg-surface`, `text-ink`, boutons brand) propage le style sur les 6 étapes sans toucher à chacune individuellement.

### 5.3 Étape 7 — `OnboardingTier.tsx`

| Élément | Détail |
|---|---|
| En-tête | `SectionHeader` : "Choisissez votre formule" + "Vous pouvez changer à tout moment" |
| Cartes tiers | 3 cartes (Free / Plus / Pro) consommant `pricing.ts`. `PriceTag` + 5 features clés max + `ProBadge` sur Pro |
| CTA | "Commencer gratuitement" (Free) / "Essayer 14 jours gratuit" (Plus & Pro, sans CB) |
| Comportement | Sélection → `profile.tier` écrit en DB → `profile.onboardingCompleted = true` → redirect `/dashboard` |
| Stripe | Absent — Cycle C. Le tier est enregistré mais pas facturé. Plus/Pro → `trialEndsAt = now() + 14 days` en DB. |

### 5.4 Migrations DB requises

Nouvelles colonnes sur `profiles` :

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'pro'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "trialEndsAt" timestamptz;
```

SQL à créer dans `docs/migrations/cycle-b-profiles-tier.sql` — à exécuter manuellement dans Supabase Dashboard par l'utilisateur.

---

## 6. Chantier 4 — Layout + 6 pages app

### 6.1 Layout.tsx

| Élément | Changement |
|---|---|
| Logo sidebar | `Wallet` remplacé par `<BrandLogo variant="full" />` (desktop) / `variant="mark"` (mobile) |
| Fond sidebar | `bg-paper border-r border-border` |
| Nav actif | `bg-surface text-ink font-medium` |
| Nav inactif | `text-ink-muted hover:bg-surface hover:text-ink` |
| Footer sidebar | Email user + toggle dark/light + logout, tokens warm paper |
| Overlay mobile | `bg-ink/40` |
| Fond main | `bg-paper` |

### 6.2 6 pages app

| Page | Changements clés |
|---|---|
| **Dashboard** | `PageHeader` → `SectionHeader`, KPI cards → `KPICard`, recharts : couleurs `positive`/`negative` tokens |
| **Argent** | Listes transactions → `DataRow`, états vides → `EmptyState`, header harmonisé |
| **Épargne / EpargneHub** | Objectifs → `KPICard` + `Progress` brand, états vides → `EmptyState` |
| **Rapports** | `RapportAnalytique` : tokens couleurs recharts, `SectionHeader` |
| **Paramètres** | Sections → `SectionHeader` + `DataRow`, formulaires → tokens warm paper |
| **Aide** | `EmptyState` sobre ou contenu statique, liens FAQ Landing |

**Règle de complétion :** aucun `bg-background`, `bg-muted`, `bg-primary`, `text-foreground`, `text-muted-foreground` ne subsiste dans ces 6 fichiers + `Layout.tsx` après Cycle B.

### 6.3 PageHeader.tsx

Migré vers tokens warm paper. Conservé tel quel structurellement — absorbé dans `SectionHeader` uniquement si la page concernée n'a plus besoin de ses props spécifiques (titre + action bouton en même ligne). Décision page par page lors de la phase 4.

---

## 7. Critères de complétion (Cycle B)

- [ ] Landing pro : toutes sections présentes, pricing consomme `pricing.ts`, toggle mensuel/annuel fonctionnel, meta SEO en place
- [ ] `PricingTable.tsx` : composant brand dédié, consomme `pricing.ts`
- [ ] Login : tokens warm paper, `BrandLogo`, Google OAuth fonctionnel, écran email confirmation
- [ ] Route `/auth/callback` dans `App.tsx`
- [ ] Onboarding : `OnboardingStep.tsx` redesigné, step 7 `OnboardingTier.tsx` créé, `STEPS` étendu à 7
- [ ] DB : SQL migration `tier` + `trialEndsAt` créé dans `docs/migrations/`
- [ ] `Layout.tsx` : `BrandLogo`, tokens warm paper, nav items redesignés
- [ ] 6 pages app : tokens warm paper, composants brand intégrés, aucun vieux token shadcn résiduel
- [ ] Vérification dark mode : chaque page testée clair + sombre
- [ ] Aucune régression fonctionnelle
- [ ] Toutes nouvelles strings dans `i18n.ts` (FR + EN)
- [ ] `CURRENT.md` mis à jour : Cycle B ✅, prochaine étape Cycle C

---

## 8. Risques & garde-fous

- **Risque :** Google OAuth config Supabase manquante → bouton cassé en prod.
  **Mitigation :** documenter clairement les étapes manuelles dans le plan. Afficher un message d'erreur explicite si `provider` non configuré.

- **Risque :** `OnboardingTier.tsx` enregistre un tier mais pas de Stripe → tiers Plus/Pro sans paiement.
  **Mitigation :** acceptable pour Cycle B (trial 14j flag). Cycle C clôt la boucle avec le vrai billing.

- **Risque :** migration DB `tier`/`trialEndsAt` pas exécutée → erreur runtime onboarding.
  **Mitigation :** SQL dans `docs/migrations/` + instructions dans le plan. App à tester en staging après migration.

- **Risque :** vieux tokens shadcn résiduels invisibles en clair mais visibles en dark.
  **Mitigation :** checklist de complétion exige vérification dark mode sur chaque page.

---

## 9. Suite immédiate (après Cycle B)

→ **Cycle C** : Stripe Subscriptions + Customer Portal + Tax, `useEntitlement(featureKey)` runtime, feature gating effectif, GoCardless Bank Account Data, PWA polish, SEO avancé.
