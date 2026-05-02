# Spec : Onboarding Wizard + Décisions transverses SaaS

**Date** : 2026-05-02  
**Statut** : Approuvé — prêt pour implémentation  
**Périmètre** : Chantier 1 (sur 4) du pivot SaaS Budget app

---

## 1. Décisions transverses (s'appliquent à tous les chantiers)

### 1.1 i18n — react-i18next

**Stack** : `react-i18next` + `i18next`

**Fichiers** :
- `src/i18n.ts` — configuration et initialisation
- `src/locales/fr.json` — strings français
- `src/locales/en.json` — strings anglais

**Init** : importé dans `src/main.tsx` avant le render React.

**Détection de langue** : `navigator.language` → si `fr*` → FR, sinon → EN (fallback). Changeable dans Paramètres (stocké dans `profiles.preferredLanguage`).

**Convention clés** : `"page.section.élément"` (ex: `"dashboard.kpi.revenues"`, `"onboarding.step1.title"`)

**Usage** : `const { t } = useTranslation()` dans chaque composant. Aucune string visible hardcodée dans le JSX.

**Migration** : toutes les strings hardcodées des 9 pages existantes sont extraites vers `fr.json` + `en.json` en une passe dédiée au début de l'implémentation.

---

### 1.2 Authentification

**Actuel** : email + mot de passe via Supabase Auth — conservé tel quel.

**Social login (Google)** : chantier séparé post-MVP, documenté dans `docs/superpowers/state/SAAS-PIPELINE.md`. Ne bloque pas l'onboarding.

---

### 1.3 Table `profiles`

Table centrale multi-chantiers. Créée une fois, étendue au fil des chantiers.

```sql
create table profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  "firstName"          text,
  "preferredLanguage"  text default 'auto',
  "preferredCurrency"  text default 'EUR',
  "onboardingCompleted" boolean default false,
  "onboardingStep"     int default 0,
  "createdAt"          timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
create policy "select own profile" on profiles for select using (auth.uid() = user_id);
create policy "insert own profile" on profiles for insert with check (auth.uid() = user_id);
create policy "update own profile" on profiles for update using (auth.uid() = user_id);
create policy "delete own profile" on profiles for delete using (auth.uid() = user_id);

-- Index
create index on profiles(user_id);
```

**Colonnes futures** (ajoutées à chaque chantier) :
- Chantier 3 Billing : `"stripeCustomerId"`, `"subscriptionStatus"`, `"subscriptionTier"`
- Chantier 2 Banking : rien dans profiles, table `bank_connections` séparée

**Création du profil** : upsert lors du premier `loadProfile(userId)` dans `useStore` (si le profil n'existe pas encore, on l'insère avec les valeurs par défaut).

---

### 1.4 Conformité (transverse)

- Hébergement : Supabase région EU (Frankfurt)
- Pas de stockage de credentials bancaires (GoCardless gère)
- RGPD : droit à l'effacement = cascade `on delete cascade` sur `profiles` + route dédiée "Supprimer mon compte" dans Paramètres (à ajouter)
- MFA TOTP : chantier séparé post-MVP
- Audit log (`audit_events`) : chantier séparé post-MVP

---

## 2. Onboarding Wizard

### 2.1 Routing

- Route : `/onboarding`
- Page hors du `Layout` existant (pas de sidebar)
- Logique dans `App.tsx` :
  - `user` connecté + `profile.onboardingCompleted === false` → redirect `/onboarding`
  - `user` connecté + `profile.onboardingCompleted === true` → comportement actuel (redirect `/dashboard`)
  - Pas de `user` → page Login

### 2.2 Structure visuelle

```
┌──────────────────────────────────────────────┐
│  [Logo]          Étape 3 sur 6   ●●●○○○      │  ← header fixe
├──────────────────────────────────────────────┤
│                                              │
│   [Titre de l'étape]                         │
│   [Description courte]                       │
│                                              │
│   [Contenu de l'étape — composant dédié]     │
│                                              │
├──────────────────────────────────────────────┤
│  [← Retour]     [Passer →]   [Suivant →]     │  ← footer fixe
└──────────────────────────────────────────────┘
```

- Progress dots : remplis = étapes complétées, vide = étapes restantes
- Bouton "← Retour" : masqué à l'étape 1 (pas d'étape précédente)
- "Passer →" : visible uniquement sur étapes skippables ET si liste vide (0 item ajouté)
- "Suivant →" : visible si étape obligatoire OU si ≥ 1 item ajouté sur étape skippable
- Dernière étape (6) : "Suivant →" remplacé par "Accéder à mon tableau de bord"

### 2.3 Composant shell partagé

`src/components/onboarding/OnboardingStep.tsx`

Props :
```ts
interface OnboardingStepProps {
  step: number           // 1-6
  total: number          // 6
  title: string
  description: string
  skippable?: boolean
  canProceed: boolean    // active le bouton Suivant
  onNext: () => void
  onBack: () => void
  onSkip?: () => void
  children: ReactNode
}
```

### 2.4 Les 6 étapes

#### Étape 1 — Profil *(obligatoire)*
**Composant** : `OnboardingProfil.tsx`

Champs :
- Prénom (text input, requis, max 50 chars)
- Devise préférée (select : EUR €, GBP £, USD $)

Message d'accueil en haut de l'étape : *"Bienvenue ! Quelques minutes suffisent pour configurer ton tableau de bord."*

Save on "Suivant" : `updateProfile({ firstName, preferredCurrency, onboardingStep: 2 })`

---

#### Étape 2 — Comptes courants *(obligatoire : ≥ 1 compte)*
**Composant** : `OnboardingComptesCourants.tsx`

Interface :
- Liste des comptes déjà créés (cartes avec nom, type, solde — icône ✓ + bouton supprimer)
- Bouton "Ajouter un compte" → formulaire inline (pas de dialog)

Mini-formulaire inline :
- Nom (text, requis)
- Type : Perso / Joint (radio ou select)
- Solde actuel (number, requis, peut être 0)

Validation : bouton "Suivant" désactivé si 0 compte. Message : *"Ajoute au moins un compte pour continuer."*

Save : chaque compte sauvegardé en DB à son ajout (via `addCompteCourant` existant dans le store). `onboardingStep: 3` au clic "Suivant".

---

#### Étape 3 — Épargne *(skippable)*
**Composant** : `OnboardingEpargne.tsx`

Interface identique à Étape 2.

Mini-formulaire :
- Nom (text)
- Taux annuel % (number, 0-100)
- Solde actuel (number)

Message sous titre : *"Tu pourras compléter ou modifier ça dans Épargne à tout moment."*

Save : via `addCompteEpargne` existant. `onboardingStep: 4` au Suivant/Passer.

---

#### Étape 4 — Bourse *(skippable)*
**Composant** : `OnboardingBourse.tsx`

Interface identique.

Mini-formulaire :
- Nom du compte bourse (text)
- Solde actuel (number)

Note informative : *"Tu pourras ajouter tes actifs ISIN dans Mes comptes."*

Save : les comptes bourse sont des `comptes_courants` avec un champ type identifiant (ex: `"bourse"`) dans le store existant — vérifier le type exact dans `src/types/index.ts` avant implémentation. `onboardingStep: 5`.

---

#### Étape 5 — Récurrents *(skippable)*
**Composant** : `OnboardingRecurrents.tsx`

Interface : 2 listes séparées visuellement — **Revenus** | **Charges**

Mini-formulaire (même pour revenus et charges) :
- Libellé (text)
- Montant (number)
- Jour du mois (1-28, number input ou select)
- Catégorie (select filtré par type — revenus/dépenses)

Save : via `addRecurrente` existant. `onboardingStep: 6`.

---

#### Étape 6 — Objectifs *(skippable)*
**Composant** : `OnboardingObjectifs.tsx`

Interface identique (liste + ajouter).

Mini-formulaire :
- Nom de l'objectif (text)
- Montant cible (number)
- Date cible (date input, optionnel)

Bouton final : **"Accéder à mon tableau de bord"** (remplace "Suivant")

Save : via `addObjectif` existant. `completeOnboarding()` → `profiles.onboardingCompleted = true, onboardingStep: 6` → redirect `/dashboard`.

---

### 2.5 Save & resume

- À chaque "Suivant" / "Passer" : `updateProfile({ onboardingStep: N })` en DB
- Si l'utilisateur ferme et revient : `App.tsx` redirige vers `/onboarding` → `Onboarding.tsx` lit `profile.onboardingStep` → affiche l'étape correspondante
- Les données des étapes précédentes sont déjà en DB (comptes, récurrents, objectifs) et donc visibles dans les listes de chaque étape

---

### 2.6 Nouveaux fichiers

```
src/
  i18n.ts
  locales/
    fr.json
    en.json
  pages/
    Onboarding.tsx
  components/onboarding/
    OnboardingStep.tsx
    OnboardingProfil.tsx
    OnboardingComptesCourants.tsx
    OnboardingEpargne.tsx
    OnboardingBourse.tsx
    OnboardingRecurrents.tsx
    OnboardingObjectifs.tsx
```

### 2.7 Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/App.tsx` | Redirect `/onboarding` si `!profile.onboardingCompleted` |
| `src/main.tsx` | Import `./i18n` |
| `src/store/useStore.ts` | Ajout `profile`, `loadProfile`, `updateProfile`, `setOnboardingStep`, `completeOnboarding` |
| `src/types/index.ts` | Ajout type `Profile` |
| `docs/supabase-v3.sql` | Table `profiles` + RLS |
| Toutes les pages existantes | Migration strings → `t("clé")` |

---

## 3. Hors périmètre (chantiers suivants)

Ces sujets sont documentés mais ne sont PAS dans ce plan d'implémentation :

| Sujet | Chantier |
|---|---|
| Social login (Google) | Post-MVP |
| Open Banking GoCardless | Chantier 2 |
| Billing Stripe | Chantier 3 |
| Feature gating | Chantier 4 |
| Rebranding | Post-MVP |
| MFA TOTP | Post-MVP |
| Audit log | Post-MVP |
| Suppression de compte (RGPD) | À ajouter dans Paramètres — Chantier 1b |

---

## 4. Pipeline SaaS global

Voir `docs/superpowers/state/SAAS-PIPELINE.md` pour le suivi de tous les chantiers.
