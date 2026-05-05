# Onboarding Wizard + i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Installer react-i18next (FR + EN, auto-detect), créer la table `profiles` Supabase, migrer les pages existantes, et construire un wizard d'onboarding 6 étapes pour les nouveaux utilisateurs.

**Architecture:** Trois phases séquentielles — (1) infrastructure i18n + profiles + store, (2) migration des pages existantes vers les clés i18n, (3) composants du wizard. Chaque phase produit du code fonctionnel. Les composants du wizard réutilisent les actions store existantes (`addCompteCourant`, `addCompte`, `addRecurrente`, `addObjectif`).

**Tech Stack:** React 18, TypeScript, react-i18next 14+, i18next, zustand 5, Supabase (Postgres + Auth + RLS), shadcn/Radix UI, Tailwind CSS, react-router-dom 6.

**Note tests:** Ce projet n'a pas de setup de tests — les étapes TDD sont omises. Chaque tâche se termine par une vérification manuelle (`npm run build` sans erreurs TypeScript) et un commit.

**Spec de référence:** `docs/superpowers/specs/2026-05-02-onboarding-wizard-design.md`

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `src/i18n.ts` | Créer |
| `src/locales/fr.json` | Créer |
| `src/locales/en.json` | Créer |
| `src/main.tsx` | Modifier — import i18n |
| `docs/supabase-v3.sql` | Modifier — table profiles + RLS |
| `src/types/index.ts` | Modifier — type Profile |
| `src/store/useStore.ts` | Modifier — profile state + actions + seed cleanup |
| `src/App.tsx` | Modifier — route /onboarding + redirect |
| `src/pages/Login.tsx` | Modifier — migration i18n |
| `src/components/Layout.tsx` | Modifier — migration i18n |
| `src/pages/Dashboard.tsx` | Modifier — migration i18n |
| `src/pages/Argent.tsx` | Modifier — migration i18n |
| `src/pages/EpargneHub.tsx` | Modifier — migration i18n |
| `src/pages/Rapports.tsx` | Modifier — migration i18n |
| `src/pages/Parametres.tsx` | Modifier — migration i18n |
| `src/pages/Aide.tsx` | Modifier — migration i18n |
| `src/pages/Onboarding.tsx` | Créer |
| `src/components/onboarding/OnboardingStep.tsx` | Créer |
| `src/components/onboarding/OnboardingProfil.tsx` | Créer |
| `src/components/onboarding/OnboardingComptesCourants.tsx` | Créer |
| `src/components/onboarding/OnboardingEpargne.tsx` | Créer |
| `src/components/onboarding/OnboardingBourse.tsx` | Créer |
| `src/components/onboarding/OnboardingRecurrents.tsx` | Créer |
| `src/components/onboarding/OnboardingObjectifs.tsx` | Créer |

---

## Task 1 — Install i18n + locales + main.tsx

**Files:**
- Create: `src/i18n.ts`
- Create: `src/locales/fr.json`
- Create: `src/locales/en.json`
- Modify: `src/main.tsx`
- Modify: `package.json` (via npm install)

- [ ] **Step 1 : Installer les dépendances**

```bash
cd "C:\Users\samue\Documents\Claude-projet\Budget app"
npm install react-i18next i18next
```

Résultat attendu : `react-i18next` et `i18next` apparaissent dans `package.json > dependencies`.

- [ ] **Step 2 : Créer `src/i18n.ts`**

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

const detected = navigator.language.startsWith("fr") ? "fr" : "en";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: detected,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 3 : Créer `src/locales/fr.json`**

```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "add": "Ajouter",
    "back": "Retour",
    "next": "Suivant",
    "skip": "Passer cette étape",
    "finish": "Accéder à mon tableau de bord",
    "loading": "Chargement…",
    "syncing": "Synchronisation des données…",
    "error": "Une erreur est survenue",
    "confirm": "Confirmer",
    "close": "Fermer",
    "allAccounts": "Tous les comptes",
    "lightMode": "Mode clair",
    "darkMode": "Mode sombre"
  },
  "nav": {
    "appName": "Budget",
    "dashboard": "Tableau de bord",
    "money": "Argent",
    "savings": "Épargne & projets",
    "reports": "Rapports CSV",
    "settings": "Paramètres",
    "help": "Aide",
    "logout": "Se déconnecter",
    "toggleTheme": "Changer le thème",
    "openMenu": "Ouvrir le menu",
    "close": "Fermer"
  },
  "auth": {
    "signInDesc": "Connecte-toi à ton espace",
    "signUpDesc": "Crée ton compte",
    "email": "Email",
    "emailPlaceholder": "ton@email.fr",
    "password": "Mot de passe",
    "passwordHint": "Au moins 6 caractères.",
    "submitSignIn": "Se connecter",
    "submitSignUp": "Créer le compte",
    "busy": "…",
    "noAccount": "Pas de compte ?",
    "createAccount": "Créer un compte",
    "alreadySignedUp": "Déjà inscrit ?",
    "goToSignIn": "Se connecter",
    "errorRequired": "Email et mot de passe requis",
    "successSignIn": "Connexion réussie",
    "successSignUp": "Compte créé"
  },
  "onboarding": {
    "stepOf": "Étape {{step}} sur {{total}}",
    "step1": {
      "title": "Ton profil",
      "description": "Quelques informations pour personnaliser ton expérience.",
      "welcome": "Bienvenue ! Quelques minutes suffisent pour configurer ton tableau de bord.",
      "firstName": "Prénom",
      "firstNamePlaceholder": "Ton prénom",
      "currency": "Devise préférée"
    },
    "step2": {
      "title": "Tes comptes courants",
      "description": "Ajoute au moins un compte courant pour que ton tableau de bord fonctionne.",
      "addAccount": "Ajouter un compte",
      "accountName": "Nom du compte",
      "accountType": "Type",
      "typePerso": "Perso",
      "typeJoint": "Joint",
      "balance": "Solde actuel (€)",
      "minError": "Ajoute au moins un compte pour continuer.",
      "skipNote": "Tu pourras compléter ça dans Paramètres à tout moment."
    },
    "step3": {
      "title": "Tes comptes épargne",
      "description": "Livrets, assurance-vie, PEL…",
      "addAccount": "Ajouter un compte épargne",
      "accountName": "Nom du compte",
      "rate": "Taux annuel (%)",
      "balance": "Solde actuel (€)",
      "skipNote": "Tu pourras compléter ça dans Épargne à tout moment."
    },
    "step4": {
      "title": "Tes comptes bourse",
      "description": "PEA, CTO, compte-titres…",
      "addAccount": "Ajouter un compte bourse",
      "accountName": "Nom du compte",
      "balance": "Valeur actuelle (€)",
      "isinNote": "Tu pourras ajouter tes actifs ISIN dans Mes comptes.",
      "skipNote": "Tu pourras compléter ça dans Épargne à tout moment."
    },
    "step5": {
      "title": "Tes revenus & charges récurrents",
      "description": "Salaire, loyer, abonnements… ce qui revient chaque mois.",
      "revenues": "Revenus",
      "expenses": "Charges",
      "addRevenue": "Ajouter un revenu",
      "addExpense": "Ajouter une charge",
      "label": "Libellé",
      "amount": "Montant (€)",
      "dayOfMonth": "Jour du mois",
      "category": "Catégorie",
      "skipNote": "Tu pourras compléter ça dans Récurrents à tout moment."
    },
    "step6": {
      "title": "Tes objectifs d'épargne",
      "description": "Voyage, voiture, fonds d'urgence…",
      "addObjectif": "Ajouter un objectif",
      "name": "Nom de l'objectif",
      "target": "Montant cible (€)",
      "targetDate": "Date cible (optionnel)",
      "skipNote": "Tu pourras créer des objectifs dans Épargne à tout moment."
    }
  }
}
```

- [ ] **Step 4 : Créer `src/locales/en.json`**

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "back": "Back",
    "next": "Next",
    "skip": "Skip this step",
    "finish": "Go to my dashboard",
    "loading": "Loading…",
    "syncing": "Syncing data…",
    "error": "An error occurred",
    "confirm": "Confirm",
    "close": "Close",
    "allAccounts": "All accounts",
    "lightMode": "Light mode",
    "darkMode": "Dark mode"
  },
  "nav": {
    "appName": "Budget",
    "dashboard": "Dashboard",
    "money": "Money",
    "savings": "Savings & projects",
    "reports": "CSV Reports",
    "settings": "Settings",
    "help": "Help",
    "logout": "Log out",
    "toggleTheme": "Toggle theme",
    "openMenu": "Open menu",
    "close": "Close"
  },
  "auth": {
    "signInDesc": "Sign in to your account",
    "signUpDesc": "Create your account",
    "email": "Email",
    "emailPlaceholder": "your@email.com",
    "password": "Password",
    "passwordHint": "At least 6 characters.",
    "submitSignIn": "Sign in",
    "submitSignUp": "Create account",
    "busy": "…",
    "noAccount": "No account?",
    "createAccount": "Create an account",
    "alreadySignedUp": "Already registered?",
    "goToSignIn": "Sign in",
    "errorRequired": "Email and password are required",
    "successSignIn": "Signed in successfully",
    "successSignUp": "Account created"
  },
  "onboarding": {
    "stepOf": "Step {{step}} of {{total}}",
    "step1": {
      "title": "Your profile",
      "description": "A few details to personalise your experience.",
      "welcome": "Welcome! A few minutes is all it takes to set up your dashboard.",
      "firstName": "First name",
      "firstNamePlaceholder": "Your first name",
      "currency": "Preferred currency"
    },
    "step2": {
      "title": "Your current accounts",
      "description": "Add at least one current account to power your dashboard.",
      "addAccount": "Add an account",
      "accountName": "Account name",
      "accountType": "Type",
      "typePerso": "Personal",
      "typeJoint": "Joint",
      "balance": "Current balance (€)",
      "minError": "Add at least one account to continue.",
      "skipNote": "You can complete this in Settings at any time."
    },
    "step3": {
      "title": "Your savings accounts",
      "description": "Savings accounts, life insurance, bonds…",
      "addAccount": "Add a savings account",
      "accountName": "Account name",
      "rate": "Annual rate (%)",
      "balance": "Current balance (€)",
      "skipNote": "You can complete this in Savings at any time."
    },
    "step4": {
      "title": "Your investment accounts",
      "description": "Stock market accounts, ETF portfolios…",
      "addAccount": "Add an investment account",
      "accountName": "Account name",
      "balance": "Current value (€)",
      "isinNote": "You can add your ISIN assets in My accounts.",
      "skipNote": "You can complete this in Savings at any time."
    },
    "step5": {
      "title": "Recurring income & expenses",
      "description": "Salary, rent, subscriptions… things that happen every month.",
      "revenues": "Income",
      "expenses": "Expenses",
      "addRevenue": "Add income",
      "addExpense": "Add expense",
      "label": "Label",
      "amount": "Amount (€)",
      "dayOfMonth": "Day of month",
      "category": "Category",
      "skipNote": "You can complete this in Recurring at any time."
    },
    "step6": {
      "title": "Your savings goals",
      "description": "Travel, car, emergency fund…",
      "addObjectif": "Add a goal",
      "name": "Goal name",
      "target": "Target amount (€)",
      "targetDate": "Target date (optional)",
      "skipNote": "You can create goals in Savings at any time."
    }
  }
}
```

- [ ] **Step 5 : Modifier `src/main.tsx` — ajouter import i18n**

Ajouter la ligne suivante au tout début des imports (avant les imports React) :

```typescript
import "./i18n";
```

Fichier complet après modification :
```typescript
import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
```

⚠️ Lire `src/main.tsx` d'abord pour vérifier que ce contenu est exact avant d'écraser.

- [ ] **Step 6 : Vérifier la compilation**

```bash
npm run build
```

Résultat attendu : build réussi, aucune erreur TypeScript.

- [ ] **Step 7 : Commit**

```bash
git add src/i18n.ts src/locales/fr.json src/locales/en.json src/main.tsx package.json package-lock.json
git commit -m "feat(i18n): install react-i18next + locales FR/EN + auto-detect"
```

---

## Task 2 — Table `profiles` Supabase + type Profile

**Files:**
- Modify: `docs/supabase-v3.sql`
- Modify: `src/types/index.ts`

- [ ] **Step 1 : Ajouter la table profiles dans `docs/supabase-v3.sql`**

Ajouter à la fin du fichier existant :

```sql
-- =============================================
-- TABLE: profiles (pivot SaaS 2026-05-02)
-- =============================================
create table if not exists profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  "firstName"          text,
  "preferredLanguage"  text not null default 'auto',
  "preferredCurrency"  text not null default 'EUR',
  "onboardingCompleted" boolean not null default false,
  "onboardingStep"     int not null default 0,
  "createdAt"          timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select" on profiles
  for select using (auth.uid() = user_id);

create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = user_id);

create policy "profiles_delete" on profiles
  for delete using (auth.uid() = user_id);

create index if not exists profiles_user_id_idx on profiles(user_id);
```

- [ ] **Step 2 : Exécuter le SQL dans Supabase**

⚠️ **Action manuelle requise** — Claude ne peut pas exécuter le SQL côté Supabase.

1. Aller sur https://supabase.com → projet → SQL Editor
2. Copier-coller le bloc SQL ci-dessus
3. Cliquer "Run"
4. Vérifier que la table `profiles` apparaît dans Table Editor

- [ ] **Step 3 : Ajouter le type `Profile` dans `src/types/index.ts`**

Ajouter à la fin du fichier :

```typescript
export interface Profile {
  firstName: string | null;
  preferredLanguage: string;
  preferredCurrency: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
}
```

- [ ] **Step 4 : Commit**

```bash
git add docs/supabase-v3.sql src/types/index.ts
git commit -m "feat(profiles): SQL table profiles + type Profile"
```

---

## Task 3 — Store : profile state + actions + nettoyage seed

**Files:**
- Modify: `src/store/useStore.ts`

- [ ] **Step 1 : Ajouter `Profile` aux imports de types**

En haut de `src/store/useStore.ts`, ajouter `Profile` à la liste des imports :

```typescript
import type {
  Categorie,
  Transaction,
  TransactionRecurrente,
  CompteEpargne,
  CompteCourant,
  MouvementEpargne,
  Objectif,
  Projet,
  AchatProjet,
  RapportCSV,
  RapportLigne,
  BankProfile,
  VirementRecurrent,
  ActifBoursier,
  Profile,
} from "@/types";
```

- [ ] **Step 2 : Ajouter `profile` à l'interface `State`**

Dans l'interface `State`, après `actifs: ActifBoursier[];`, ajouter :

```typescript
  profile: Profile | null;

  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  setOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
```

- [ ] **Step 3 : Ajouter `profile: null` à l'état initial**

Dans `create<State>()((set, get) => ({`, après `actifs: [],`, ajouter :

```typescript
  profile: null,
```

- [ ] **Step 4 : Ajouter `profile: null` dans `clearLocal`**

Dans la fonction `clearLocal`, ajouter `profile: null` à l'objet de reset :

```typescript
  clearLocal: () =>
    set({
      loaded: false,
      loadedUserId: null,
      categories: [],
      transactions: [],
      recurrentes: [],
      comptesCourants: [],
      comptes: [],
      mouvements: [],
      objectifs: [],
      projets: [],
      achatsProjet: [],
      rapports: [],
      rapportLignes: [],
      bankProfiles: [],
      virementsRecurrents: [],
      actifs: [],
      profile: null,
    }),
```

- [ ] **Step 5 : Ajouter le chargement du profil dans `loadAll`**

À la fin de `loadAll`, après le bloc `try { ... const [cats, ccs, ...] = await Promise.all([...])`, et juste avant le `set(...)` final qui définit `loaded: true`, ajouter le chargement + upsert du profil :

```typescript
      // Charger ou créer le profil
      let profile: Profile | null = null;
      const { data: profRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profRow) {
        profile = strip<Profile>(profRow);
      } else {
        // Nouvel utilisateur — créer le profil avec les valeurs par défaut
        const { data: newProf } = await supabase
          .from("profiles")
          .insert({ user_id: userId })
          .select("*")
          .single();
        profile = newProf ? strip<Profile>(newProf) : null;
      }

      // Migration : utilisateurs existants (ont déjà des comptes) → onboarding auto-complété
      const comptesCourantsList = (ccs.data ?? []).map((r: any) => strip<CompteCourant>(r));
      if (profile && !profile.onboardingCompleted && comptesCourantsList.length > 0) {
        await supabase
          .from("profiles")
          .update({ "onboardingCompleted": true, "onboardingStep": 6 })
          .eq("user_id", userId);
        profile = { ...profile, onboardingCompleted: true, onboardingStep: 6 };
      }
```

Et inclure `profile` dans le `set(...)` final de `loadAll` :

```typescript
      set({
        loaded: true,
        loading: false,
        loadedUserId: userId,
        categories,
        comptesCourants: comptesCourantsList,
        // ... tous les autres champs existants ...
        profile,
      });
```

⚠️ Note : remplacer aussi `comptesCourants` dans le set final par `comptesCourantsList` (la variable renommée) pour éviter le double strip.

- [ ] **Step 6 : Supprimer le seed du compte courant par défaut**

Dans `loadAll`, localiser le bloc :

```typescript
      if (comptesCourants.length === 0) {
        const { data, error } = await supabase
          .from("comptes_courants")
          .insert({
            user_id: userId,
            nom: "Compte courant",
            type: "perso",
            soldeInitial: 0,
            description: "Compte courant principal",
          })
          .select("*")
        // ...
      }
```

**Supprimer entièrement ce bloc.** Les nouveaux utilisateurs créent leurs comptes dans le wizard d'onboarding. Les catégories par défaut (seed `categoriesDefaut`) sont conservées.

- [ ] **Step 7 : Ajouter les actions profile à la fin du store**

Avant la parenthèse fermante finale `}));`, ajouter :

```typescript
  loadProfile: async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) set((s) => ({ ...s, profile: strip<Profile>(data) }));
  },

  updateProfile: async (data: Partial<Profile>) => {
    const userId = await getUserId();
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", userId);
    if (error) throw error;
    set((s) => ({ ...s, profile: s.profile ? { ...s.profile, ...data } : null }));
  },

  setOnboardingStep: async (step: number) => {
    const userId = await getUserId();
    await supabase
      .from("profiles")
      .update({ "onboardingStep": step })
      .eq("user_id", userId);
    set((s) => ({ ...s, profile: s.profile ? { ...s.profile, onboardingStep: step } : null }));
  },

  completeOnboarding: async () => {
    const userId = await getUserId();
    await supabase
      .from("profiles")
      .update({ "onboardingCompleted": true, "onboardingStep": 6 })
      .eq("user_id", userId);
    set((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, onboardingCompleted: true, onboardingStep: 6 } : null,
    }));
  },
```

- [ ] **Step 8 : Vérifier compilation**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 9 : Commit**

```bash
git add src/store/useStore.ts
git commit -m "feat(store): profile state + loadProfile + updateProfile + setOnboardingStep + completeOnboarding"
```

---

## Task 4 — App.tsx : route `/onboarding` + redirect

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1 : Modifier `src/App.tsx`**

Fichier complet après modifications :

```typescript
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Argent from "./pages/Argent";
import EpargneHub from "./pages/EpargneHub";
import Parametres from "./pages/Parametres";
import Aide from "./pages/Aide";
import Rapports from "./pages/Rapports";
import LoginPage from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./lib/auth";
import { useStore } from "./store/useStore";

export default function App() {
  const { user, loading } = useAuth();
  const { loaded, loadedUserId, loading: storeLoading, loadAll, clearLocal, profile } = useStore();

  useEffect(() => {
    if (user && user.id !== loadedUserId && !storeLoading) {
      loadAll(user.id);
    }
    if (!user && (loaded || loadedUserId)) {
      clearLocal();
    }
  }, [user, loaded, loadedUserId, storeLoading, loadAll, clearLocal]);

  if (loading) return <SplashLoader label="Chargement…" />;

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster position="bottom-right" />
      </>
    );
  }

  if (!loaded || loadedUserId !== user.id) {
    return <SplashLoader label="Synchronisation des données…" />;
  }

  // Redirect to onboarding if not completed
  if (profile && !profile.onboardingCompleted) {
    return (
      <>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/argent" element={<Argent />} />
          <Route path="/epargne" element={<EpargneHub />} />
          <Route path="/comptes" element={<Navigate to="/argent?tab=comptes" replace />} />
          <Route path="/transactions" element={<Navigate to="/argent?tab=transactions" replace />} />
          <Route path="/recurrents" element={<Navigate to="/argent?tab=recurrents" replace />} />
          <Route path="/simulateur" element={<Navigate to="/epargne?tab=simulateur" replace />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/aide" element={<Aide />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </>
  );
}

function SplashLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {label}
      </div>
    </div>
  );
}
```

⚠️ `Onboarding` sera créé en Task 8 — l'import est ajouté maintenant pour éviter un oubli. Le build échouera jusqu'à Task 8 si `src/pages/Onboarding.tsx` n'existe pas encore. Créer un fichier vide temporaire si besoin :

```typescript
// src/pages/Onboarding.tsx — placeholder temporaire
export default function Onboarding() { return null; }
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/App.tsx src/pages/Onboarding.tsx
git commit -m "feat(routing): route /onboarding + redirect si onboarding non complété"
```

---

## Task 5 — Migration i18n : Login.tsx + Layout.tsx

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1 : Remplacer `src/pages/Login.tsx`**

```typescript
import { useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error(t("auth.errorRequired"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) toast.error(error);
        else toast.success(t("auth.successSignIn"));
      } else {
        const { error, message } = await signUp(email.trim(), password);
        if (error) toast.error(error);
        else if (message) toast.info(message);
        else toast.success(t("auth.successSignUp"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5" />
          </div>
          <CardTitle>{t("nav.appName")}</CardTitle>
          <CardDescription>
            {mode === "signin" ? t("auth.signInDesc") : t("auth.signUpDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">{t("auth.email")}</Label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{t("auth.password")}</Label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? t("auth.busy") : mode === "signin" ? t("auth.submitSignIn") : t("auth.submitSignUp")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <>
                {t("auth.noAccount")}{" "}
                <button type="button" className="font-medium underline" onClick={() => setMode("signup")}>
                  {t("auth.createAccount")}
                </button>
              </>
            ) : (
              <>
                {t("auth.alreadySignedUp")}{" "}
                <button type="button" className="font-medium underline" onClick={() => setMode("signin")}>
                  {t("auth.goToSignIn")}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2 : Remplacer `src/components/Layout.tsx`**

```typescript
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PiggyBank,
  Settings,
  Wallet,
  PieChart,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const nav = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/argent", label: t("nav.money"), icon: Wallet },
    { to: "/epargne", label: t("nav.savings"), icon: PiggyBank },
    { to: "/rapports", label: t("nav.reports"), icon: PieChart },
    { to: "/parametres", label: t("nav.settings"), icon: Settings },
    { to: "/aide", label: t("nav.help"), icon: HelpCircle },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <span className="font-semibold">{t("nav.appName")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={t("nav.toggleTheme")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label={t("nav.openMenu")}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80%] border-r bg-background shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="font-semibold">{t("nav.appName")}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label={t("nav.close")}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavList nav={nav} onClick={() => setMobileOpen(false)} />
            <div className="mt-2 space-y-2 border-t p-3">
              {user?.email && (
                <div className="truncate px-1 text-xs text-muted-foreground" title={user.email}>
                  {user.email}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={toggle}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? t("common.lightMode") : t("common.darkMode")}
              </Button>
              <Button variant="ghost" className="w-full" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Wallet className="h-5 w-5" />
          <span className="font-semibold">{t("nav.appName")}</span>
        </div>
        <NavList nav={nav} />
        <div className="mt-auto space-y-2 border-t p-3">
          {user?.email && (
            <div className="truncate px-1 text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </div>
          )}
          <Button variant="outline" className="w-full justify-start" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? t("common.lightMode") : t("common.darkMode")}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavList({ nav, onClick }: { nav: { to: string; label: string; icon: React.ElementType }[]; onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 4 : Commit**

```bash
git add src/pages/Login.tsx src/components/Layout.tsx
git commit -m "feat(i18n): migrer Login + Layout vers react-i18next"
```

---

## Task 6 — Migration i18n : pages restantes

**Files:**
- Modify: `src/pages/Dashboard.tsx`, `src/pages/Argent.tsx`, `src/pages/EpargneHub.tsx`, `src/pages/Rapports.tsx`, `src/pages/Parametres.tsx`, `src/pages/Aide.tsx`

**Procédure pour chaque page :**

1. Lire le fichier complet
2. Identifier TOUTES les chaînes de texte visibles dans le JSX (titres, labels, boutons, messages d'erreur, placeholders, toasts)
3. Ajouter chaque chaîne à `src/locales/fr.json` sous la clé `"<page>.<section>.<clé>"` et à `src/locales/en.json` avec la traduction anglaise
4. Remplacer chaque chaîne dans le JSX par `{t("<page>.<section>.<clé>")}`
5. Ajouter `const { t } = useTranslation();` en haut du composant
6. Ajouter `import { useTranslation } from "react-i18next";` aux imports

**Conventions de clés :**
- `"dashboard.title"`, `"dashboard.kpi.revenues"`, `"dashboard.table.lastTransactions"`
- `"argent.tabs.accounts"`, `"argent.form.amount"`
- `"epargne.tabs.savings"`, `"epargne.objectif.target"`
- `"reports.import.title"`, `"reports.analysis.categories"`
- `"settings.accounts.title"`, `"settings.categories.add"`
- `"help.search.placeholder"`, `"help.article.firstSteps"`

**Toast strings :** les messages `toast.success("...")`, `toast.error("...")` passent aussi par `t()`.

**Strings dynamiques avec variables :** utiliser l'interpolation i18next :
```typescript
// fr.json
"savingsRate": "Taux d'épargne : {{rate}}%"

// composant
t("dashboard.kpi.savingsRate", { rate: tauxEpargne.toFixed(1) })
```

- [ ] **Step 1 : Migrer Dashboard.tsx** (lire le fichier, extraire, remplacer)

- [ ] **Step 2 : Migrer Argent.tsx** (lire le fichier, extraire, remplacer)

- [ ] **Step 3 : Migrer EpargneHub.tsx** (lire le fichier, extraire, remplacer)

- [ ] **Step 4 : Migrer Rapports.tsx** (lire le fichier, extraire, remplacer)

- [ ] **Step 5 : Migrer Parametres.tsx** (lire le fichier, extraire, remplacer)

- [ ] **Step 6 : Migrer Aide.tsx** (lire le fichier, extraire, remplacer)

- [ ] **Step 7 : Vérifier compilation**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript. Si une clé `t("x.y.z")` est manquante dans les locales, i18next affiche la clé brute (pas d'erreur TS) — vérifier visuellement que les strings s'affichent correctement.

- [ ] **Step 8 : Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Argent.tsx src/pages/EpargneHub.tsx src/pages/Rapports.tsx src/pages/Parametres.tsx src/pages/Aide.tsx src/locales/fr.json src/locales/en.json
git commit -m "feat(i18n): migrer toutes les pages vers react-i18next"
```

---

## Task 7 — OnboardingStep.tsx : shell réutilisable

**Files:**
- Create: `src/components/onboarding/OnboardingStep.tsx`

- [ ] **Step 1 : Créer `src/components/onboarding/OnboardingStep.tsx`**

```typescript
import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingStepProps {
  step: number;
  total: number;
  title: string;
  description: string;
  skippable?: boolean;
  canProceed: boolean;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  loading?: boolean;
  children: ReactNode;
}

export function OnboardingStep({
  step,
  total,
  title,
  description,
  skippable,
  canProceed,
  onNext,
  onBack,
  onSkip,
  loading,
  children,
}: OnboardingStepProps) {
  const { t } = useTranslation();
  const isLast = step === total;
  const showPasser = skippable && !canProceed;
  const showNext = !showPasser;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
        <span className="font-semibold text-sm">{t("nav.appName")}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t("onboarding.stepOf", { step, total })}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i < step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <h1 className="mb-1 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mb-8 text-muted-foreground">{description}</p>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex shrink-0 items-center justify-between border-t bg-background px-6 py-4">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("common.back")}
          </Button>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          {showPasser && onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} disabled={loading}>
              {isLast ? t("common.finish") : `${t("common.skip")} →`}
            </Button>
          )}
          {showNext && (
            <Button size="sm" onClick={onNext} disabled={!canProceed || loading}>
              {isLast ? t("common.finish") : `${t("common.next")} →`}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/onboarding/OnboardingStep.tsx
git commit -m "feat(onboarding): OnboardingStep shell component"
```

---

## Task 8 — Onboarding.tsx : page shell

**Files:**
- Modify: `src/pages/Onboarding.tsx` (remplace le placeholder créé en Task 4)

- [ ] **Step 1 : Remplacer `src/pages/Onboarding.tsx`**

```typescript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import OnboardingProfil from "@/components/onboarding/OnboardingProfil";
import OnboardingComptesCourants from "@/components/onboarding/OnboardingComptesCourants";
import OnboardingEpargne from "@/components/onboarding/OnboardingEpargne";
import OnboardingBourse from "@/components/onboarding/OnboardingBourse";
import OnboardingRecurrents from "@/components/onboarding/OnboardingRecurrents";
import OnboardingObjectifs from "@/components/onboarding/OnboardingObjectifs";

const STEPS: Record<number, React.ComponentType> = {
  1: OnboardingProfil,
  2: OnboardingComptesCourants,
  3: OnboardingEpargne,
  4: OnboardingBourse,
  5: OnboardingRecurrents,
  6: OnboardingObjectifs,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile } = useStore();

  useEffect(() => {
    if (profile?.onboardingCompleted) {
      navigate("/dashboard", { replace: true });
    }
  }, [profile?.onboardingCompleted, navigate]);

  const currentStep = Math.max(1, profile?.onboardingStep ?? 1);
  const StepComponent = STEPS[currentStep] ?? STEPS[1];

  return <StepComponent />;
}
```

⚠️ Les imports des composants steps (Tasks 9-14) provoqueront des erreurs jusqu'à leur création. Créer des placeholders temporaires si besoin :

```bash
for f in OnboardingProfil OnboardingComptesCourants OnboardingEpargne OnboardingBourse OnboardingRecurrents OnboardingObjectifs; do
  echo "export default function $f() { return null; }" > "src/components/onboarding/$f.tsx"
done
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/pages/Onboarding.tsx src/components/onboarding/
git commit -m "feat(onboarding): Onboarding page shell + step routing"
```

---

## Task 9 — OnboardingProfil.tsx (étape 1)

**Files:**
- Modify: `src/components/onboarding/OnboardingProfil.tsx`

- [ ] **Step 1 : Écrire `src/components/onboarding/OnboardingProfil.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STEP = 1;
const TOTAL = 6;

export default function OnboardingProfil() {
  const { t } = useTranslation();
  const { profile, updateProfile, setOnboardingStep } = useStore();
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [currency, setCurrency] = useState(profile?.preferredCurrency ?? "EUR");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!firstName.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ firstName: firstName.trim(), preferredCurrency: currency });
      await setOnboardingStep(STEP + 1);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step1.title")}
      description={t("onboarding.step1.description")}
      canProceed={firstName.trim().length > 0}
      onNext={handleNext}
      loading={loading}
    >
      <p className="mb-6 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        {t("onboarding.step1.welcome")}
      </p>
      <div className="space-y-4">
        <div>
          <Label className="mb-1.5 block">{t("onboarding.step1.firstName")}</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("onboarding.step1.firstNamePlaceholder")}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && firstName.trim()) handleNext(); }}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">{t("onboarding.step1.currency")}</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR €</SelectItem>
              <SelectItem value="GBP">GBP £</SelectItem>
              <SelectItem value="USD">USD $</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </OnboardingStep>
  );
}
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/onboarding/OnboardingProfil.tsx
git commit -m "feat(onboarding): étape 1 — profil (prénom + devise)"
```

---

## Task 10 — OnboardingComptesCourants.tsx (étape 2)

**Files:**
- Modify: `src/components/onboarding/OnboardingComptesCourants.tsx`

- [ ] **Step 1 : Écrire `src/components/onboarding/OnboardingComptesCourants.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TypeCompteCourant } from "@/types";

const STEP = 2;
const TOTAL = 6;

type Draft = { nom: string; type: TypeCompteCourant; soldeInitial: number };
const EMPTY_DRAFT: Draft = { nom: "", type: "perso", soldeInitial: 0 };

export default function OnboardingComptesCourants() {
  const { t } = useTranslation();
  const { comptesCourants, addCompteCourant, deleteCompteCourant, setOnboardingStep } = useStore();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(comptesCourants.length === 0);
  const [loading, setLoading] = useState(false);

  const addAndReset = async () => {
    if (!draft.nom.trim()) return;
    setLoading(true);
    try {
      await addCompteCourant({
        nom: draft.nom.trim(),
        type: draft.type,
        soldeInitial: draft.soldeInitial,
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (comptesCourants.length === 0) return;
    setLoading(true);
    try {
      await setOnboardingStep(STEP + 1);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => setOnboardingStep(STEP - 1);

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step2.title")}
      description={t("onboarding.step2.description")}
      canProceed={comptesCourants.length > 0}
      onBack={handleBack}
      onNext={handleNext}
      loading={loading}
    >
      <div className="space-y-3">
        {/* Comptes existants */}
        {comptesCourants.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{c.nom}</span>
                <span className="text-xs capitalize text-muted-foreground">{c.type}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteCompteCourant(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Formulaire inline */}
        {showForm ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step2.accountName")}</Label>
              <Input
                value={draft.nom}
                onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Compte BNP"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step2.accountType")}</Label>
                <Select
                  value={draft.type}
                  onValueChange={(v) => setDraft((d) => ({ ...d, type: v as TypeCompteCourant }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perso">{t("onboarding.step2.typePerso")}</SelectItem>
                    <SelectItem value="joint">{t("onboarding.step2.typeJoint")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step2.balance")}</Label>
                <Input
                  type="number"
                  value={draft.soldeInitial}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, soldeInitial: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={addAndReset}
                disabled={!draft.nom.trim() || loading}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
              {comptesCourants.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("onboarding.step2.addAccount")}
          </Button>
        )}

        {/* Message d'erreur si 0 compte */}
        {comptesCourants.length === 0 && !showForm && (
          <p className="text-center text-sm text-muted-foreground">
            {t("onboarding.step2.minError")}
          </p>
        )}
      </div>
    </OnboardingStep>
  );
}
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/onboarding/OnboardingComptesCourants.tsx
git commit -m "feat(onboarding): étape 2 — comptes courants (obligatoire)"
```

---

## Task 11 — OnboardingEpargne.tsx (étape 3, skippable)

**Files:**
- Modify: `src/components/onboarding/OnboardingEpargne.tsx`

- [ ] **Step 1 : Écrire `src/components/onboarding/OnboardingEpargne.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STEP = 3;
const TOTAL = 6;

type Draft = { nom: string; tauxAnnuel: number; soldeInitial: number };
const EMPTY_DRAFT: Draft = { nom: "", tauxAnnuel: 0, soldeInitial: 0 };

export default function OnboardingEpargne() {
  const { t } = useTranslation();
  const { comptes, addCompte, deleteCompte, setOnboardingStep } = useStore();
  // Filtrer uniquement les comptes épargne non-boursiers
  const epargneComptes = comptes.filter((c) => c.type !== "boursier");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const addAndReset = async () => {
    if (!draft.nom.trim()) return;
    setLoading(true);
    try {
      await addCompte({
        nom: draft.nom.trim(),
        tauxAnnuel: draft.tauxAnnuel,
        soldeInitial: draft.soldeInitial,
        type: "livret",
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const nav = (step: number) => setOnboardingStep(step);

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step3.title")}
      description={t("onboarding.step3.description")}
      skippable
      canProceed={epargneComptes.length > 0}
      onBack={() => nav(STEP - 1)}
      onNext={() => nav(STEP + 1)}
      onSkip={() => nav(STEP + 1)}
      loading={loading}
    >
      <p className="mb-4 text-xs text-muted-foreground">{t("onboarding.step3.skipNote")}</p>
      <div className="space-y-3">
        {epargneComptes.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{c.nom}</span>
                <span className="text-xs text-muted-foreground">{c.tauxAnnuel}%</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteCompte(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step3.accountName")}</Label>
              <Input
                value={draft.nom}
                onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Livret A"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step3.rate")}</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={draft.tauxAnnuel}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, tauxAnnuel: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step3.balance")}</Label>
                <Input
                  type="number"
                  value={draft.soldeInitial}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, soldeInitial: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addAndReset} disabled={!draft.nom.trim() || loading}>
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
              {epargneComptes.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("onboarding.step3.addAccount")}
          </Button>
        )}
      </div>
    </OnboardingStep>
  );
}
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/onboarding/OnboardingEpargne.tsx
git commit -m "feat(onboarding): étape 3 — comptes épargne (skippable)"
```

---

## Task 12 — OnboardingBourse.tsx (étape 4, skippable)

**Files:**
- Modify: `src/components/onboarding/OnboardingBourse.tsx`

- [ ] **Step 1 : Écrire `src/components/onboarding/OnboardingBourse.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STEP = 4;
const TOTAL = 6;

type Draft = { nom: string; soldeInitial: number };
const EMPTY_DRAFT: Draft = { nom: "", soldeInitial: 0 };

export default function OnboardingBourse() {
  const { t } = useTranslation();
  const { comptes, addCompte, deleteCompte, setOnboardingStep } = useStore();
  const bourseComptes = comptes.filter((c) => c.type === "boursier");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const addAndReset = async () => {
    if (!draft.nom.trim()) return;
    setLoading(true);
    try {
      await addCompte({
        nom: draft.nom.trim(),
        tauxAnnuel: 0,
        soldeInitial: draft.soldeInitial,
        type: "boursier",
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const nav = (step: number) => setOnboardingStep(step);

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step4.title")}
      description={t("onboarding.step4.description")}
      skippable
      canProceed={bourseComptes.length > 0}
      onBack={() => nav(STEP - 1)}
      onNext={() => nav(STEP + 1)}
      onSkip={() => nav(STEP + 1)}
      loading={loading}
    >
      <p className="mb-4 text-xs text-muted-foreground">{t("onboarding.step4.skipNote")}</p>
      <div className="space-y-3">
        {bourseComptes.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{c.nom}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteCompte(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step4.accountName")}</Label>
              <Input
                value={draft.nom}
                onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: PEA Boursorama"
                autoFocus
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step4.balance")}</Label>
              <Input
                type="number"
                value={draft.soldeInitial}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, soldeInitial: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("onboarding.step4.isinNote")}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={addAndReset} disabled={!draft.nom.trim() || loading}>
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
              {bourseComptes.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("onboarding.step4.addAccount")}
          </Button>
        )}
      </div>
    </OnboardingStep>
  );
}
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/onboarding/OnboardingBourse.tsx
git commit -m "feat(onboarding): étape 4 — comptes bourse (skippable)"
```

---

## Task 13 — OnboardingRecurrents.tsx (étape 5, skippable)

**Files:**
- Modify: `src/components/onboarding/OnboardingRecurrents.tsx`

- [ ] **Step 1 : Écrire `src/components/onboarding/OnboardingRecurrents.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TypeTransaction } from "@/types";

const STEP = 5;
const TOTAL = 6;

type Draft = { libelle: string; montant: number; jourMois: number; categorieId: string; type: TypeTransaction };
const emptyDraft = (type: TypeTransaction): Draft => ({ libelle: "", montant: 0, jourMois: 1, categorieId: "", type });

export default function OnboardingRecurrents() {
  const { t } = useTranslation();
  const { recurrentes, categories, addRecurrente, deleteRecurrente, setOnboardingStep } = useStore();

  const revenus = recurrentes.filter((r) => r.type === "revenu");
  const charges = recurrentes.filter((r) => r.type === "depense");

  const [activeTab, setActiveTab] = useState<TypeTransaction>("revenu");
  const [draft, setDraft] = useState<Draft>(emptyDraft("revenu"));
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const catsFiltered = categories.filter((c) => c.type === activeTab);

  const addAndReset = async () => {
    if (!draft.libelle.trim() || !draft.categorieId) return;
    setLoading(true);
    try {
      const today = new Date();
      const dateDebut = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(draft.jourMois).padStart(2, "0")}`;
      await addRecurrente({
        libelle: draft.libelle.trim(),
        type: draft.type,
        montant: draft.montant,
        categorieId: draft.categorieId,
        frequence: "mois",
        intervalle: 1,
        dateDebut,
      });
      setDraft(emptyDraft(activeTab));
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const nav = (step: number) => setOnboardingStep(step);
  const hasAny = revenus.length > 0 || charges.length > 0;

  const RecurrenteList = ({ items }: { items: typeof recurrentes }) => (
    <div className="space-y-2">
      {items.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{r.libelle}</span>
              <span className="text-xs text-muted-foreground">{r.montant}€</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => deleteRecurrente(r.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step5.title")}
      description={t("onboarding.step5.description")}
      skippable
      canProceed={hasAny}
      onBack={() => nav(STEP - 1)}
      onNext={() => nav(STEP + 1)}
      onSkip={() => nav(STEP + 1)}
      loading={loading}
    >
      <p className="mb-4 text-xs text-muted-foreground">{t("onboarding.step5.skipNote")}</p>
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const type = v as TypeTransaction;
          setActiveTab(type);
          setDraft(emptyDraft(type));
          setShowForm(false);
        }}
      >
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="revenu" className="flex-1">
            {t("onboarding.step5.revenues")}
          </TabsTrigger>
          <TabsTrigger value="depense" className="flex-1">
            {t("onboarding.step5.expenses")}
          </TabsTrigger>
        </TabsList>

        {(["revenu", "depense"] as TypeTransaction[]).map((type) => (
          <TabsContent key={type} value={type} className="space-y-3">
            <RecurrenteList items={type === "revenu" ? revenus : charges} />

            {showForm && activeTab === type ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <Label className="mb-1.5 block">{t("onboarding.step5.label")}</Label>
                  <Input
                    value={draft.libelle}
                    onChange={(e) => setDraft((d) => ({ ...d, libelle: e.target.value }))}
                    placeholder={type === "revenu" ? "Ex: Salaire" : "Ex: Loyer"}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block">{t("onboarding.step5.amount")}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={draft.montant}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, montant: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">{t("onboarding.step5.dayOfMonth")}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="28"
                      value={draft.jourMois}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          jourMois: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">{t("onboarding.step5.category")}</Label>
                  <Select
                    value={draft.categorieId}
                    onValueChange={(v) => setDraft((d) => ({ ...d, categorieId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {catsFiltered.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addAndReset}
                    disabled={!draft.libelle.trim() || !draft.categorieId || loading}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {t("common.add")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDraft(emptyDraft(type));
                  setShowForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {type === "revenu" ? t("onboarding.step5.addRevenue") : t("onboarding.step5.addExpense")}
              </Button>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </OnboardingStep>
  );
}
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/onboarding/OnboardingRecurrents.tsx
git commit -m "feat(onboarding): étape 5 — récurrents revenus + charges (skippable)"
```

---

## Task 14 — OnboardingObjectifs.tsx (étape 6, dernière)

**Files:**
- Modify: `src/components/onboarding/OnboardingObjectifs.tsx`

- [ ] **Step 1 : Écrire `src/components/onboarding/OnboardingObjectifs.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STEP = 6;
const TOTAL = 6;

type Draft = { nom: string; montantCible: number; dateEcheance: string };
const EMPTY_DRAFT: Draft = { nom: "", montantCible: 0, dateEcheance: "" };

export default function OnboardingObjectifs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { objectifs, addObjectif, deleteObjectif, setOnboardingStep, completeOnboarding } = useStore();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const addAndReset = async () => {
    if (!draft.nom.trim() || draft.montantCible <= 0) return;
    setLoading(true);
    try {
      await addObjectif({
        nom: draft.nom.trim(),
        montantCible: draft.montantCible,
        dateEcheance: draft.dateEcheance || undefined,
        compteEpargneId: undefined,
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error(t("common.error"));
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step6.title")}
      description={t("onboarding.step6.description")}
      skippable
      canProceed={objectifs.length > 0}
      onBack={() => setOnboardingStep(STEP - 1)}
      onNext={handleFinish}
      onSkip={handleFinish}
      loading={loading}
    >
      <p className="mb-4 text-xs text-muted-foreground">{t("onboarding.step6.skipNote")}</p>
      <div className="space-y-3">
        {objectifs.map((o) => (
          <Card key={o.id}>
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{o.nom}</span>
                <span className="text-xs text-muted-foreground">{o.montantCible}€</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteObjectif(o.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step6.name")}</Label>
              <Input
                value={draft.nom}
                onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Voyage Japon"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step6.target")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.montantCible}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, montantCible: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step6.targetDate")}</Label>
                <Input
                  type="date"
                  value={draft.dateEcheance}
                  onChange={(e) => setDraft((d) => ({ ...d, dateEcheance: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={addAndReset}
                disabled={!draft.nom.trim() || draft.montantCible <= 0 || loading}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
              {objectifs.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("onboarding.step6.addObjectif")}
          </Button>
        )}
      </div>
    </OnboardingStep>
  );
}
```

- [ ] **Step 2 : Vérifier compilation**

```bash
npm run build
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/onboarding/OnboardingObjectifs.tsx
git commit -m "feat(onboarding): étape 6 — objectifs épargne (dernière étape)"
```

---

## Task 15 — Vérification finale

**Files:** Aucun nouveau fichier — vérification et commit récapitulatif.

- [ ] **Step 1 : Build final sans erreurs**

```bash
npm run build
```

Résultat attendu : 0 erreur TypeScript, build réussi.

- [ ] **Step 2 : Vérification manuelle — flux complet**

1. Lancer `npm run dev`
2. Créer un nouveau compte (signup) → vérifier que le wizard s'affiche à l'étape 1
3. Remplir le prénom → cliquer Suivant → vérifier passage à l'étape 2
4. Ajouter 1 compte courant → cliquer Suivant → vérifier passage à l'étape 3
5. Cliquer "Passer cette étape" sur étapes 3, 4, 5, 6 → vérifier arrivée sur dashboard
6. Recharger la page → vérifier que le dashboard s'affiche (onboarding non re-proposé)
7. Se connecter avec un compte existant (données déjà en place) → vérifier accès direct au dashboard (sans onboarding)
8. Changer la langue dans Paramètres → vérifier que l'interface bascule EN/FR

- [ ] **Step 3 : Commit final si des ajustements mineurs ont été faits**

```bash
git add -A
git commit -m "feat(onboarding): wizard complet 6 étapes + i18n FR/EN"
```

---

## Annexe — Vérification type `Objectif`

Avant Task 14, vérifier dans `src/types/index.ts` que `Objectif` a bien un champ `dateEcheance` (ou équivalent) et `compteEpargneId`. Adapter le code de `addAndReset` si les noms de champs diffèrent.

```bash
grep -n "interface Objectif" src/types/index.ts
```
