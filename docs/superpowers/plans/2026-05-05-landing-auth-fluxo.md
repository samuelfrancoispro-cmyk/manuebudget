# Landing + Auth + Renommage Fluxo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une landing page publique SEO-friendly, renommer l'app "Fluxo", et router correctement login/signup vers onboarding ou dashboard.

**Architecture:** App.tsx expose `/` → Landing et `/login` → LoginPage quand l'user n'est pas connecté. Landing.tsx est un composant statique sobre avec 2 CTA. Login.tsx lit `?mode=` depuis l'URL pour pré-sélectionner signin/signup.

**Tech Stack:** React 18, React Router v6, react-i18next, Tailwind v3, shadcn/Radix, Supabase Auth

---

## Fichiers touchés

| Action | Fichier | Rôle |
|--------|---------|------|
| Modify | `index.html` | Titre + SEO meta tags |
| Modify | `src/locales/fr.json` | appName → "Fluxo" + section `landing` |
| Modify | `src/locales/en.json` | appName → "Fluxo" + section `landing` |
| Create | `src/pages/Landing.tsx` | Page publique avec CTA |
| Modify | `src/pages/Login.tsx` | Lire `?mode=` depuis URL |
| Modify | `src/App.tsx` | Routing !user : `/` → Landing, `/login` → Login |

---

## Task 1 : Renommer "Budget" → "Fluxo" + SEO meta tags

**Files:**
- Modify: `index.html`
- Modify: `src/locales/fr.json`
- Modify: `src/locales/en.json`

- [ ] **Step 1 : Mettre à jour `index.html`**

Remplacer le contenu du `<head>` pour avoir :

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/icon-512.svg" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucean" />
    <meta name="apple-mobile-web-app-title" content="Fluxo" />
    <title>Fluxo — Gérez votre budget simplement</title>
    <meta name="description" content="Fluxo est l'outil de gestion de budget personnel simple et accessible. Suivez vos comptes, dépenses récurrentes et épargne en un clin d'œil." />
    <meta name="robots" content="index, follow" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Fluxo — Gérez votre budget simplement" />
    <meta property="og:description" content="Fluxo est l'outil de gestion de budget personnel simple et accessible." />
    <meta property="og:locale" content="fr_FR" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Fluxo" />
    <meta name="twitter:description" content="Gérez votre budget personnel simplement avec Fluxo." />
    <script>
      (function () {
        try {
          var t = localStorage.getItem("budget-app-theme");
          if (!t) t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
          if (t === "dark") document.documentElement.classList.add("dark");
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2 : Mettre à jour `src/locales/fr.json`**

Changer la clé `nav.appName` et ajouter une section `landing` :

```json
"nav": {
  "appName": "Fluxo",
  ...
},
"landing": {
  "tagline": "Gérez votre budget, simplement.",
  "subtitle": "Suivez vos comptes, dépenses et épargne en un seul endroit. Gratuit pour commencer.",
  "feature1": "Tout en un",
  "feature1Desc": "Comptes, récurrents, épargne",
  "feature2": "Simple",
  "feature2Desc": "Onboarding en 5 minutes",
  "feature3": "Sécurisé",
  "feature3Desc": "Données chiffrées, aucune banque connectée",
  "signIn": "Se connecter",
  "createAccount": "Créer un compte",
  "footer": "© 2026 Fluxo"
}
```

- [ ] **Step 3 : Mettre à jour `src/locales/en.json`**

Même structure :

```json
"nav": {
  "appName": "Fluxo",
  ...
},
"landing": {
  "tagline": "Budget management, made simple.",
  "subtitle": "Track your accounts, recurring expenses and savings in one place. Free to get started.",
  "feature1": "All-in-one",
  "feature1Desc": "Accounts, recurring, savings",
  "feature2": "Simple",
  "feature2Desc": "5-minute onboarding",
  "feature3": "Secure",
  "feature3Desc": "Encrypted data, no bank connection",
  "signIn": "Sign in",
  "createAccount": "Create account",
  "footer": "© 2026 Fluxo"
}
```

- [ ] **Step 4 : Commit**

```bash
git add index.html src/locales/fr.json src/locales/en.json
git commit -m "feat: renommer app Fluxo + SEO meta tags index.html"
```

---

## Task 2 : Créer `src/pages/Landing.tsx`

**Files:**
- Create: `src/pages/Landing.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wallet, LayoutDashboard, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: LayoutDashboard, label: t("landing.feature1"), desc: t("landing.feature1Desc") },
    { icon: Zap,             label: t("landing.feature2"), desc: t("landing.feature2Desc") },
    { icon: ShieldCheck,     label: t("landing.feature3"), desc: t("landing.feature3Desc") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">{t("nav.appName")}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/login?mode=signin")}>
          {t("landing.signIn")}
        </Button>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <div className="space-y-3 max-w-lg">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.tagline")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("landing.subtitle")}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => navigate("/login?mode=signup")}>
            {t("landing.createAccount")}
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/login?mode=signin")}>
            {t("landing.signIn")}
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4 max-w-2xl w-full">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-lg border border-border p-4 text-left space-y-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "feat: créer Landing.tsx page publique Fluxo"
```

---

## Task 3 : Mettre à jour `Login.tsx` pour lire `?mode=`

**Files:**
- Modify: `src/pages/Login.tsx`

- [ ] **Step 1 : Ajouter `useSearchParams` et initialiser le mode depuis l'URL**

Ajouter l'import en haut du fichier (après les imports existants) :

```tsx
import { useSearchParams } from "react-router-dom";
```

Remplacer la ligne :

```tsx
const [mode, setMode] = useState<"signin" | "signup">("signin");
```

Par :

```tsx
const [searchParams] = useSearchParams();
const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
const [mode, setMode] = useState<"signin" | "signup">(initialMode);
```

- [ ] **Step 2 : Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat: Login lit ?mode=signin|signup depuis l'URL"
```

---

## Task 4 : Mettre à jour `App.tsx` — routing !user

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1 : Importer Landing et ajouter les routes publiques**

Ajouter l'import :

```tsx
import Landing from "./pages/Landing";
```

Remplacer le bloc `if (!user)` :

```tsx
// AVANT
if (!user) {
  return (
    <>
      <LoginPage />
      <Toaster position="bottom-right" />
    </>
  );
}
```

Par :

```tsx
// APRÈS
if (!user) {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/App.tsx
git commit -m "feat: routing public / → Landing, /login → LoginPage"
```

---

## Task 5 : Vérification manuelle + push final

- [ ] **Step 1 : Lancer le dev server et tester**

```bash
npm run dev
```

Checklist :
- [ ] `/` affiche la landing Fluxo
- [ ] Clic "Créer un compte" → `/login?mode=signup` (formulaire signup pré-sélectionné)
- [ ] Clic "Se connecter" → `/login?mode=signin` (formulaire signin pré-sélectionné)
- [ ] Signup d'un nouveau user → redirect automatique vers `/onboarding`
- [ ] Login d'un user existant → redirect vers `/dashboard`
- [ ] URL inconnue non-auth → redirect vers `/`
- [ ] Mode sombre/clair fonctionne sur la landing

- [ ] **Step 2 : Build de vérification**

```bash
npm run build
```

Attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Push**

```bash
git push origin main
```

---

## Note Supabase (action manuelle requise)

Pour que `signUp` connecte l'user immédiatement sans mail de confirmation :
> Dashboard Supabase → Authentication → Email → désactiver **"Enable email confirmations"**

Sans ça, le user reçoit un mail et doit cliquer avant d'accéder à l'app.
