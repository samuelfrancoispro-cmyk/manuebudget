# Cycle A — Fondations design Fluxo — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place la palette warm paper mono, les design tokens (CSS + Tailwind), 8 composants brand réutilisables, la source de vérité pricing typée, et une doc design system — sans casser aucune fonctionnalité existante.

**Architecture:**
- Rétro-compat totale : on **réutilise les variables CSS shadcn existantes** (`--background`, `--foreground`, `--card`, `--muted`, etc.) et on les **redéfinit** avec les valeurs warm paper. Aucun composant existant ne casse, tous adoptent automatiquement la nouvelle palette.
- En parallèle, on **ajoute** les nouveaux tokens nommés (`--paper`, `--surface`, `--ink`, `--positive`, etc.) consommés par les nouveaux composants `brand/`.
- Logo : slot SVG agnostique. Placeholder posé maintenant (rond noir + F blanc), remplaçable sans toucher au code.

**Tech Stack:** Vite 6, React 18, TypeScript 5.7, Tailwind v3, shadcn (Radix), zustand 5.

**Conventions du projet :**
- **Pas de tests automatisés** à ce stade (cf. CLAUDE.md). Chaque tâche se termine par une **vérification visuelle** + un **smoke check** (build TS + dev server) au lieu d'un test unitaire.
- Filets de sécurité : `npm run build` doit passer, `npm run dev` doit lancer sans erreur console, le Dashboard doit s'afficher sans casser en clair ET en sombre.
- Chaque tâche = 1 commit. Si une tâche casse l'app, on revert ce seul commit.

**Branche :** travailler sur `cycle-a-fondations` (créer en pré-flight).

---

## File Structure

**À créer :**
- `src/components/brand/Eyebrow.tsx` — petit label uppercase letter-spaced
- `src/components/brand/SectionHeader.tsx` — eyebrow + titre + description
- `src/components/brand/ProBadge.tsx` — badge "PRO" (ink/paper)
- `src/components/brand/PriceTag.tsx` — affichage prix tier
- `src/components/brand/DataRow.tsx` — ligne tabulaire libellé/valeur
- `src/components/brand/KPICard.tsx` — carte KPI standardisée
- `src/components/brand/EmptyState.tsx` — état vide
- `src/components/brand/BrandLogo.tsx` — slot SVG logo
- `src/components/brand/index.ts` — barrel export
- `src/lib/pricing.ts` — source de vérité tiers + matrice features (typée)
- `public/logo.svg` — placeholder wordmark+icône
- `public/logo-mark.svg` — placeholder icône seule
- `public/icon-512.svg` — placeholder PWA
- `docs/design-system.md` — doc design system

**À modifier :**
- `src/index.css` — variables CSS HSL refaites (clair + sombre)
- `tailwind.config.js` — ajout des nouveaux tokens (paper, surface, ink, positive, negative, warning, info)
- `src/components/ui/card.tsx` — `rounded-lg` → `rounded-2xl`, retirer `shadow-sm`
- `src/components/ui/badge.tsx` — ajout variant `pro`
- `src/components/ui/tabs.tsx` — `TabsTrigger` minimaliste (underline, pas de bg actif)
- `docs/superpowers/state/CURRENT.md` — marquer Cycle A complété

**Conservés tels quels :** `button.tsx`, `input.tsx`, `select.tsx`, `progress.tsx`, `dialog.tsx`, `separator.tsx`, `textarea.tsx`, `popover.tsx`, `sonner.tsx`, `month-picker.tsx`, `table.tsx`, `label.tsx`, `PageHeader.tsx`, `Layout.tsx`, toutes les `pages/*`, tous les `onboarding/*` — ils héritent automatiquement des nouveaux tokens via les variables CSS shadcn.

---

## Task 0 : Pré-flight — branche dédiée

**Files:** aucun fichier touché.

- [ ] **Step 1 : Vérifier l'état git propre**

```bash
git status
```
Expected : `working tree clean` ou seulement les fichiers de la conversation actuelle. Si modifs en cours non liées, **stop et demander à l'utilisateur**.

- [ ] **Step 2 : Créer la branche**

```bash
git checkout -b cycle-a-fondations
```
Expected : `Switched to a new branch 'cycle-a-fondations'`.

---

## Task 1 : Design tokens — `src/index.css`

**Files:**
- Modify: `src/index.css` (entier remplacé)

- [ ] **Step 1 : Réécrire le fichier complet**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand tokens — Notion warm paper mono (mode clair) */
    --paper: 47 27% 98%;             /* #FAFAF7 */
    --surface: 40 18% 93%;            /* #F1EFEA */
    --surface-strong: 38 14% 83%;     /* #D9D6CF */
    --ink: 0 0% 10%;                  /* #1A1A1A */
    --ink-muted: 38 6% 39%;           /* #6B6760 */
    --border-strong: 0 0% 10% / 0.14;
    --positive: 138 32% 27%;          /* #2F5D3D */
    --negative: 0 45% 33%;            /* #7A2E2E */
    --warning-bg: 39 64% 90%;         /* #F5EBD9 */
    --warning-text: 38 59% 26%;       /* #6B4F1C */
    --info-bg: 60 13% 90%;            /* #E8E8E0 */
    --info-text: 51 5% 22%;           /* #3A3A33 */

    /* Rétro-compat shadcn — mappées sur les brand tokens */
    --background: var(--paper);
    --foreground: var(--ink);
    --card: var(--paper);
    --card-foreground: var(--ink);
    --popover: var(--paper);
    --popover-foreground: var(--ink);
    --primary: var(--ink);
    --primary-foreground: var(--paper);
    --secondary: var(--surface);
    --secondary-foreground: var(--ink);
    --muted: var(--surface);
    --muted-foreground: var(--ink-muted);
    --accent: var(--surface);
    --accent-foreground: var(--ink);
    --destructive: var(--negative);
    --destructive-foreground: var(--paper);
    --success: var(--positive);
    --success-foreground: var(--paper);
    --border: 0 0% 10% / 0.08;
    --input: 0 0% 10% / 0.12;
    --ring: var(--ink);
    --radius: 0.75rem;
  }

  .dark {
    /* Brand tokens — miroir sourd (mode sombre) */
    --paper: 30 12% 6%;               /* #0F0E0C */
    --surface: 36 9% 9%;              /* #1A1916 */
    --surface-strong: 33 9% 13%;      /* #262420 */
    --ink: 39 17% 91%;                /* #EDEAE3 */
    --ink-muted: 36 8% 57%;           /* #9A9388 */
    --border-strong: 39 17% 91% / 0.14;
    --positive: 138 22% 57%;          /* #7AA98A */
    --negative: 0 39% 63%;            /* #C57D7D */
    --warning-bg: 36 38% 16%;         /* #3A2E1A */
    --warning-text: 39 67% 73%;       /* #E5C589 */
    --info-bg: 40 16% 12%;            /* #222018 */
    --info-text: 38 11% 75%;          /* #C5C0B5 */

    /* Rétro-compat shadcn dark */
    --background: var(--paper);
    --foreground: var(--ink);
    --card: var(--paper);
    --card-foreground: var(--ink);
    --popover: var(--surface);
    --popover-foreground: var(--ink);
    --primary: var(--ink);
    --primary-foreground: var(--paper);
    --secondary: var(--surface);
    --secondary-foreground: var(--ink);
    --muted: var(--surface);
    --muted-foreground: var(--ink-muted);
    --accent: var(--surface-strong);
    --accent-foreground: var(--ink);
    --destructive: var(--negative);
    --destructive-foreground: var(--paper);
    --success: var(--positive);
    --success-foreground: var(--paper);
    --border: 39 17% 91% / 0.08;
    --input: 39 17% 91% / 0.12;
    --ring: var(--ink);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1, "tnum" 1;
  }
}
```

- [ ] **Step 2 : Smoke check — l'app compile**

```bash
npm run build
```
Expected : build success, aucun warning bloquant.

- [ ] **Step 3 : Smoke check visuel — dev server**

```bash
npm run dev
```
Ouvrir le navigateur sur l'URL affichée. Visiter `/` (Landing si déconnecté, Dashboard si connecté). Vérifier :
- Pas d'erreur console rouge
- Le fond a viré au papier warm (`#FAFAF7`)
- Le texte est en noir doux
- Les cartes ont un fond paper (pas blanc pur)
- Toggle dark mode (depuis Layout sidebar) → fond noir warm `#0F0E0C`, texte clair

Tuer le dev server quand validé.

- [ ] **Step 4 : Commit**

```bash
git add src/index.css
git commit -m "feat(brand): redéfinir les tokens CSS sur la palette warm paper mono"
```

---

## Task 2 : Tailwind config — ajouter les nouveaux tokens nommés

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1 : Remplacer le fichier complet**

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        // Rétro-compat shadcn
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand tokens (nouveaux noms sémantiques)
        paper: "hsl(var(--paper))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          strong: "hsl(var(--surface-strong))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          muted: "hsl(var(--ink-muted))",
        },
        positive: "hsl(var(--positive))",
        negative: "hsl(var(--negative))",
        warning: {
          DEFAULT: "hsl(var(--warning-text))",
          bg: "hsl(var(--warning-bg))",
        },
        info: {
          DEFAULT: "hsl(var(--info-text))",
          bg: "hsl(var(--info-bg))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add tailwind.config.js
git commit -m "feat(brand): ajouter tokens Tailwind paper/surface/ink/positive/negative/warning/info"
```

---

## Task 3 : Charger Inter + activer tabular-nums dans `index.html`

**Files:**
- Modify: `index.html` (ajouter preconnect + link Google Fonts Inter dans le `<head>`, juste avant le `<title>`)

- [ ] **Step 1 : Lire le fichier actuel pour repérer la zone**

```bash
# Pas besoin d'exécution — utiliser Read sur index.html
```

- [ ] **Step 2 : Ajouter dans le `<head>`, juste après le dernier `<meta>` SEO et AVANT `<title>` :**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 3 : Smoke check dev server**

```bash
npm run dev
```
Ouvrir DevTools → Network → filter "inter" → confirmer que la font Inter charge bien (statut 200).
Visuellement : le texte du Dashboard doit être en Inter (un peu plus géométrique que system-ui par défaut).

- [ ] **Step 4 : Commit**

```bash
git add index.html
git commit -m "feat(brand): charger Inter via Google Fonts (preconnect + display=swap)"
```

---

## Task 4 : Source de vérité pricing — `src/lib/pricing.ts`

**Files:**
- Create: `src/lib/pricing.ts`

- [ ] **Step 1 : Créer le fichier**

```ts
// src/lib/pricing.ts
// Source de vérité tiers + matrice features Fluxo.
// Cycle A : structure typée, pas de gating runtime.
// Spec : docs/superpowers/specs/2026-05-05-cycle-a-fondations-design.md §5

export type TierId = "free" | "plus" | "pro";

export interface Tier {
  id: TierId;
  name: string;
  tagline: string;
  monthlyPriceEUR: number;     // 0 pour free
  yearlyPriceEUR: number;       // 0 pour free
  yearlyDiscountPct: number;    // 0 pour free
  trialDays: number;            // 0 pour free
  isHighlighted?: boolean;      // mise en avant visuelle dans la grille
}

export const tiers: Tier[] = [
  {
    id: "free",
    name: "Gratuit",
    tagline: "Pour découvrir Fluxo, sans engagement.",
    monthlyPriceEUR: 0,
    yearlyPriceEUR: 0,
    yearlyDiscountPct: 0,
    trialDays: 0,
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Tout ce qu'il faut au quotidien, sans limite.",
    monthlyPriceEUR: 2.99,
    yearlyPriceEUR: 24,
    yearlyDiscountPct: 33,
    trialDays: 14,
    isHighlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Sync bancaire automatique et tout l'arsenal.",
    monthlyPriceEUR: 4.99,
    yearlyPriceEUR: 39,
    yearlyDiscountPct: 35,
    trialDays: 14,
  },
];

export type FeatureValue = boolean | number | "unlimited" | string;

export interface Feature {
  key: string;
  label: string;
  section: "limits" | "usage" | "reports" | "banking" | "support";
  values: Record<TierId, FeatureValue>;
}

export const features: Feature[] = [
  // Limites d'utilisation
  { key: "comptes_courants", label: "Comptes courants", section: "limits",
    values: { free: 1, plus: 5, pro: "unlimited" } },
  { key: "comptes_epargne", label: "Comptes épargne", section: "limits",
    values: { free: 1, plus: 5, pro: "unlimited" } },
  { key: "transactions_mois", label: "Transactions / mois", section: "limits",
    values: { free: 50, plus: "unlimited", pro: "unlimited" } },
  { key: "recurrentes", label: "Charges récurrentes", section: "limits",
    values: { free: 5, plus: "unlimited", pro: "unlimited" } },
  { key: "objectifs", label: "Objectifs épargne", section: "limits",
    values: { free: 1, plus: 5, pro: "unlimited" } },
  { key: "projets", label: "Projets simulateur", section: "limits",
    values: { free: 1, plus: 5, pro: "unlimited" } },
  { key: "categories_perso", label: "Catégories personnalisées", section: "limits",
    values: { free: false, plus: true, pro: true } },

  // Restrictions d'usage
  { key: "appareils_simultanes", label: "Appareils simultanés", section: "usage",
    values: { free: 1, plus: "unlimited", pro: "unlimited" } },
  { key: "install_pwa", label: "Installation app (PWA)", section: "usage",
    values: { free: false, plus: true, pro: true } },
  { key: "dark_mode", label: "Mode sombre", section: "usage",
    values: { free: true, plus: true, pro: true } },

  // Rapports & analyse
  { key: "import_csv", label: "Import CSV bancaire", section: "reports",
    values: { free: false, plus: "5 / mois", pro: "unlimited" } },
  { key: "analyse_rapports", label: "Analyse rapports (5 onglets)", section: "reports",
    values: { free: false, plus: true, pro: true } },
  { key: "export_excel", label: "Export Excel multi-feuilles", section: "reports",
    values: { free: false, plus: true, pro: true } },
  { key: "export_json", label: "Export JSON sauvegarde", section: "reports",
    values: { free: true, plus: true, pro: true } },

  // Banking & sync
  { key: "sync_bancaire", label: "Sync auto GoCardless", section: "banking",
    values: { free: false, plus: false, pro: true } },
  { key: "categorisation_auto", label: "Catégorisation auto transactions", section: "banking",
    values: { free: false, plus: false, pro: true } },

  // Support
  { key: "support", label: "Support", section: "support",
    values: { free: "FAQ", plus: "Email 48h", pro: "Email priorité 24h" } },
  { key: "trial", label: "Essai gratuit 14j sans CB", section: "support",
    values: { free: false, plus: true, pro: true } },
];

export const sectionLabels: Record<Feature["section"], string> = {
  limits: "Limites d'utilisation",
  usage: "Restrictions d'usage",
  reports: "Rapports & analyse",
  banking: "Banking & sync",
  support: "Support & garanties",
};

/** Format un prix tier (helper utilisé par PriceTag) */
export function formatTierPrice(eur: number): string {
  if (eur === 0) return "0 €";
  return `${eur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
```

- [ ] **Step 2 : Smoke check TypeScript**

```bash
npm run build
```
Expected : success, pas d'erreur TS.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/pricing.ts
git commit -m "feat(pricing): source de vérité typée tiers + matrice features (Cycle A)"
```

---

## Task 5 : Placeholder logo SVG

**Files:**
- Create: `public/logo.svg`
- Create: `public/logo-mark.svg`
- Create: `public/icon-512.svg`

- [ ] **Step 1 : Créer `public/logo-mark.svg` (icône carrée — favicon, app icon)**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- PLACEHOLDER : remplacer par le logo final (onde + F sur fond noir, par l'utilisateur) -->
  <rect width="32" height="32" rx="7" fill="#1A1A1A"/>
  <path d="M10 8 H22 V11 H13 V15 H20 V18 H13 V24 H10 Z" fill="#FAFAF7"/>
</svg>
```

- [ ] **Step 2 : Créer `public/logo.svg` (wordmark + icône horizontal — header)**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 32" width="140" height="32">
  <!-- PLACEHOLDER : remplacer par le logo final -->
  <rect x="0" y="0" width="32" height="32" rx="7" fill="#1A1A1A"/>
  <path d="M10 8 H22 V11 H13 V15 H20 V18 H13 V24 H10 Z" fill="#FAFAF7"/>
  <text x="42" y="22" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="currentColor" letter-spacing="-0.5">Fluxo</text>
</svg>
```

- [ ] **Step 3 : Créer `public/icon-512.svg` (PWA, 512×512)**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- PLACEHOLDER : remplacer par le logo final -->
  <rect width="512" height="512" rx="112" fill="#1A1A1A"/>
  <path d="M160 128 H352 V176 H208 V240 H320 V288 H208 V384 H160 Z" fill="#FAFAF7"/>
</svg>
```

- [ ] **Step 4 : Smoke check — les SVG s'ouvrent**

Dans le navigateur, ouvrir : `http://localhost:5173/logo.svg`, `http://localhost:5173/logo-mark.svg`, `http://localhost:5173/icon-512.svg` (lancer `npm run dev` si nécessaire).
Expected : chaque SVG s'affiche correctement, fond noir + F blanc.

- [ ] **Step 5 : Commit**

```bash
git add public/logo.svg public/logo-mark.svg public/icon-512.svg
git commit -m "feat(brand): placeholder logos SVG (à remplacer par logo final user)"
```

---

## Task 6 : Composant `Eyebrow`

**Files:**
- Create: `src/components/brand/Eyebrow.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/components/brand/Eyebrow.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * Petit label uppercase letter-spaced.
 * Usage : eyebrow au-dessus d'un titre de section, label de KPI, étiquette discrète.
 */
export const Eyebrow = React.forwardRef<HTMLSpanElement, EyebrowProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-block text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);
Eyebrow.displayName = "Eyebrow";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/Eyebrow.tsx
git commit -m "feat(brand): composant Eyebrow (label uppercase letter-spaced)"
```

---

## Task 7 : Composant `SectionHeader`

**Files:**
- Create: `src/components/brand/SectionHeader.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/components/brand/SectionHeader.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

/**
 * En-tête de section : eyebrow optionnel + titre + description optionnelle.
 * Usage : tête de section landing, intro de page app.
 */
export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, eyebrow, title, description, align = "left", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
      {...props}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-base text-ink-muted max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
);
SectionHeader.displayName = "SectionHeader";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/SectionHeader.tsx
git commit -m "feat(brand): composant SectionHeader (eyebrow + titre + description)"
```

---

## Task 8 : Composant `ProBadge`

**Files:**
- Create: `src/components/brand/ProBadge.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/components/brand/ProBadge.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tier?: "plus" | "pro";
}

/**
 * Badge "PLUS" ou "PRO" sobre — fond ink, texte paper, uppercase letter-spaced.
 * Usage : marquer une feature payante, indicateur dans la sidebar, near-CTA.
 */
export const ProBadge = React.forwardRef<HTMLSpanElement, ProBadgeProps>(
  ({ className, tier = "pro", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-paper",
        className
      )}
      {...props}
    >
      {tier === "pro" ? "Pro" : "Plus"}
    </span>
  )
);
ProBadge.displayName = "ProBadge";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/ProBadge.tsx
git commit -m "feat(brand): composant ProBadge (Plus/Pro, fond ink + texte paper)"
```

---

## Task 9 : Composant `PriceTag`

**Files:**
- Create: `src/components/brand/PriceTag.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/components/brand/PriceTag.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { formatTierPrice } from "@/lib/pricing";

export interface PriceTagProps extends React.HTMLAttributes<HTMLDivElement> {
  amountEUR: number;
  cadence?: "monthly" | "yearly" | "free";
  yearlyDiscountPct?: number;
}

/**
 * Affichage prix d'un tier : montant gros + cadence en petit + badge réduction annuel optionnel.
 * Usage : carte de tier dans la grille pricing landing + paywall onboarding.
 */
export const PriceTag = React.forwardRef<HTMLDivElement, PriceTagProps>(
  ({ className, amountEUR, cadence = "monthly", yearlyDiscountPct, ...props }, ref) => {
    if (cadence === "free" || amountEUR === 0) {
      return (
        <div ref={ref} className={cn("flex items-baseline gap-1", className)} {...props}>
          <span className="text-4xl font-bold tracking-[-0.025em] text-foreground">0 €</span>
          <span className="text-sm text-ink-muted">/ pour toujours</span>
        </div>
      );
    }
    return (
      <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-[-0.025em] text-foreground tabular-nums">
            {formatTierPrice(amountEUR)}
          </span>
          <span className="text-sm text-ink-muted">
            / {cadence === "monthly" ? "mois" : "an"}
          </span>
        </div>
        {yearlyDiscountPct && yearlyDiscountPct > 0 && cadence === "yearly" && (
          <span className="inline-flex w-fit items-center rounded-md bg-positive/10 px-2 py-0.5 text-xs font-medium text-positive">
            −{yearlyDiscountPct}% vs mensuel
          </span>
        )}
      </div>
    );
  }
);
PriceTag.displayName = "PriceTag";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success, pas d'erreur de typing avec `formatTierPrice`.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/PriceTag.tsx
git commit -m "feat(brand): composant PriceTag (montant + cadence + badge réduction)"
```

---

## Task 10 : Composant `DataRow`

**Files:**
- Create: `src/components/brand/DataRow.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/components/brand/DataRow.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Variante visuelle de la valeur — colore le montant. */
  tone?: "default" | "positive" | "negative" | "muted";
  /** Désactive la border-bottom (utile pour la dernière ligne d'un groupe). */
  noBorder?: boolean;
}

const toneClass: Record<NonNullable<DataRowProps["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-positive",
  negative: "text-negative",
  muted: "text-ink-muted",
};

/**
 * Ligne tabulaire : libellé à gauche, valeur à droite, border-bottom subtle.
 * Usage : listes de transactions, détails de KPI, lignes de matrice.
 */
export const DataRow = React.forwardRef<HTMLDivElement, DataRowProps>(
  ({ className, label, value, tone = "default", noBorder, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-3 py-2.5 text-sm",
        !noBorder && "border-b border-border",
        className
      )}
      {...props}
    >
      <span className="text-foreground">{label}</span>
      <span className={cn("font-medium tabular-nums", toneClass[tone])}>{value}</span>
    </div>
  )
);
DataRow.displayName = "DataRow";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/DataRow.tsx
git commit -m "feat(brand): composant DataRow (libellé/valeur tabulaire avec tones)"
```

---

## Task 11 : Composant `KPICard`

**Files:**
- Create: `src/components/brand/KPICard.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/components/brand/KPICard.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

const deltaToneClass: Record<NonNullable<KPICardProps["deltaTone"]>, string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-ink-muted",
};

/**
 * Carte KPI standardisée : label uppercase + valeur tabular + delta optionnel.
 * Usage : KPI Dashboard (revenus, dépenses, solde, taux d'épargne).
 */
export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ className, label, value, delta, deltaTone = "neutral", icon, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border border-border bg-surface px-5 py-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Eyebrow>{label}</Eyebrow>
        {icon && <span className="text-ink-muted">{icon}</span>}
      </div>
      <div className="text-2xl font-semibold tracking-[-0.015em] text-foreground tabular-nums">
        {value}
      </div>
      {delta && (
        <div className={cn("text-xs tabular-nums", deltaToneClass[deltaTone])}>
          {delta}
        </div>
      )}
    </div>
  )
);
KPICard.displayName = "KPICard";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/KPICard.tsx
git commit -m "feat(brand): composant KPICard (label + valeur + delta optionnel)"
```

---

## Task 12 : Composant `EmptyState`

**Files:**
- Create: `src/components/brand/EmptyState.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/components/brand/EmptyState.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * État vide standardisé : icône optionnelle + titre + description + CTA optionnel.
 * Usage : aucune transaction, aucun objectif, aucun rapport, etc.
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-paper px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon && <div className="text-ink-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-md text-sm text-ink-muted leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
);
EmptyState.displayName = "EmptyState";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/EmptyState.tsx
git commit -m "feat(brand): composant EmptyState (icône + titre + description + action)"
```

---

## Task 13 : Composant `BrandLogo`

**Files:**
- Create: `src/components/brand/BrandLogo.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/components/brand/BrandLogo.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.HTMLAttributes<HTMLImageElement> {
  variant?: "full" | "mark";
  /** Taille en px. Pour `mark` : appliqué width=height. Pour `full` : appliqué height. */
  size?: number;
}

/**
 * Slot logo Fluxo. Lit `/logo.svg` (full) ou `/logo-mark.svg` (mark).
 * Hérite couleur via currentColor pour adaptation dark mode.
 * Le SVG final sera fourni par l'utilisateur — placeholder en attendant.
 */
export const BrandLogo = React.forwardRef<HTMLImageElement, BrandLogoProps>(
  ({ className, variant = "full", size = 32, alt = "Fluxo", ...props }, ref) => {
    const src = variant === "mark" ? "/logo-mark.svg" : "/logo.svg";
    const style =
      variant === "mark"
        ? { width: size, height: size }
        : { height: size, width: "auto" };
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        style={style}
        className={cn("select-none", className)}
        draggable={false}
        {...props}
      />
    );
  }
);
BrandLogo.displayName = "BrandLogo";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/BrandLogo.tsx
git commit -m "feat(brand): composant BrandLogo (slot SVG full/mark)"
```

---

## Task 14 : Barrel export `src/components/brand/index.ts`

**Files:**
- Create: `src/components/brand/index.ts`

- [ ] **Step 1 : Créer le fichier**

```ts
// src/components/brand/index.ts
// Barrel export — un seul import depuis `@/components/brand`.
export { Eyebrow } from "./Eyebrow";
export { SectionHeader } from "./SectionHeader";
export { ProBadge } from "./ProBadge";
export { PriceTag } from "./PriceTag";
export { DataRow } from "./DataRow";
export { KPICard } from "./KPICard";
export { EmptyState } from "./EmptyState";
export { BrandLogo } from "./BrandLogo";

export type { EyebrowProps } from "./Eyebrow";
export type { SectionHeaderProps } from "./SectionHeader";
export type { ProBadgeProps } from "./ProBadge";
export type { PriceTagProps } from "./PriceTag";
export type { DataRowProps } from "./DataRow";
export type { KPICardProps } from "./KPICard";
export type { EmptyStateProps } from "./EmptyState";
export type { BrandLogoProps } from "./BrandLogo";
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/brand/index.ts
git commit -m "feat(brand): barrel export src/components/brand"
```

---

## Task 15 : Card UI — `rounded-2xl` + retirer `shadow-sm`

**Files:**
- Modify: `src/components/ui/card.tsx` (ligne 8)

- [ ] **Step 1 : Modifier le composant `Card`**

Remplacer la ligne 8 (qui contient `"rounded-lg border bg-card text-card-foreground shadow-sm"`) par :

```tsx
className={cn("rounded-2xl border bg-card text-card-foreground", className)}
```

(Le diff exact : `rounded-lg` → `rounded-2xl`, suppression de ` shadow-sm`.)

- [ ] **Step 2 : Smoke check build + visuel**

```bash
npm run build
npm run dev
```
Visiter le Dashboard. Les cartes doivent avoir des coins plus arrondis et plus de drop shadow. Vérifier en mode clair ET sombre.

- [ ] **Step 3 : Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "refactor(ui): Card en rounded-2xl sans shadow (sobriété)"
```

---

## Task 16 : Badge UI — ajouter variant `pro`

**Files:**
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1 : Ajouter la variante `pro` dans `badgeVariants`**

Dans le bloc `variants.variant`, ajouter une entrée juste après `outline` :

```tsx
        outline: "text-foreground",
        pro: "border-transparent bg-ink text-paper uppercase tracking-[0.05em] text-[10px] font-semibold",
        success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
```

- [ ] **Step 2 : Smoke check build**

```bash
npm run build
```
Expected : success.

- [ ] **Step 3 : Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat(ui): ajouter variant 'pro' au Badge (fond ink + texte paper)"
```

---

## Task 17 : Tabs UI — TabsTrigger minimaliste

**Files:**
- Modify: `src/components/ui/tabs.tsx` (lignes 11-18 et 27-30)

- [ ] **Step 1 : Modifier `TabsList` (lignes 11-18) — fond transparent + border-bottom**

Remplacer le bloc :

```tsx
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
```

par :

```tsx
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center gap-1 border-b border-border bg-transparent p-0 text-muted-foreground",
      className
    )}
    {...props}
  />
```

- [ ] **Step 2 : Modifier `TabsTrigger` (lignes 27-30) — underline minimaliste**

Remplacer le bloc :

```tsx
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
```

par :

```tsx
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap px-3 py-2 -mb-px text-sm font-medium text-ink-muted ring-offset-background transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-ink",
      className
    )}
    {...props}
  />
```

- [ ] **Step 3 : Smoke check build + visuel**

```bash
npm run build
npm run dev
```
Visiter `/argent` (page avec onglets : Comptes, Transactions, Récurrents) et `/epargne` (Comptes, Objectifs, Historique). Les onglets doivent avoir :
- Plus de fond gris autour
- Une underline noire fine sous l'onglet actif
- Les onglets inactifs en gris (`ink-muted`), hover en noir

- [ ] **Step 4 : Commit**

```bash
git add src/components/ui/tabs.tsx
git commit -m "refactor(ui): Tabs en underline minimaliste (sobriété)"
```

---

## Task 18 : Input + Dialog — polish focus ring & overlay

**Files:**
- Modify: `src/components/ui/input.tsx` (ligne 10)
- Modify: `src/components/ui/dialog.tsx` (ligne 18)

- [ ] **Step 1 : Adoucir le focus ring de `Input`**

Remplacer dans `src/components/ui/input.tsx` la className :

```tsx
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
```

par :

```tsx
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ink/40 focus-visible:ring-1 focus-visible:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-50",
```

(`ring-2` → `ring-1`, `ring-ring` → `ring-ink/10`, ajout `border-ink/40` au focus, suppression `ring-offset-2`.)

- [ ] **Step 2 : Adoucir l'overlay de `Dialog`**

Remplacer dans `src/components/ui/dialog.tsx` la className de `DialogOverlay` :

```tsx
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
```

par :

```tsx
      "fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
```

(`bg-black/60` → `bg-ink/40` pour adaptation dark mode, ajout `backdrop-blur-[2px]` subtil.)

- [ ] **Step 3 : Smoke check build + visuel**

```bash
npm run build
npm run dev
```
Cliquer dans n'importe quel `<Input>` (ex : login `/login`) → focus ring très subtil au lieu d'un anneau noir épais.
Ouvrir n'importe quel `<Dialog>` (ex : Paramètres → "Nouveau compte") → overlay légèrement floutée, plus douce que `bg-black/60`.
Tester en mode clair ET sombre.

- [ ] **Step 4 : Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/dialog.tsx
git commit -m "refactor(ui): adoucir focus ring Input + overlay Dialog (ink/* + blur)"
```

---

## Task 19 : Smoke check global — pages app non-régression

**Files:** aucun fichier touché (vérification visuelle uniquement).

- [ ] **Step 1 : Build complet**

```bash
npm run build
```
Expected : success, aucun warning bloquant TypeScript ou Vite.

- [ ] **Step 2 : Lancer le dev server**

```bash
npm run dev
```

- [ ] **Step 3 : Parcourir toutes les pages — mode CLAIR**

Pour chaque route, vérifier : pas d'erreur console rouge, layout pas cassé, palette warm paper appliquée.

| Route | À vérifier |
|---|---|
| `/` (Landing si déco) | Page s'affiche, hero lisible |
| `/login` | Form lisible, bouton ink |
| `/dashboard` | KPIs lisibles, graphiques OK, transactions listées |
| `/argent` (onglets) | 3 onglets avec underline, contenu de chaque onglet rendu |
| `/epargne` (onglets) | Idem, 3 onglets |
| `/rapports` | Sidebar 320px + détail, dialog d'import s'ouvre |
| `/parametres` | CRUD comptes/catégories listés |
| `/aide` | Articles affichés |

- [ ] **Step 4 : Toggle dark mode + même parcours**

Cliquer le toggle sombre dans la sidebar Layout. Refaire le parcours du Step 3 — toutes les pages doivent rester lisibles, pas de texte invisible (foreground sur background du même ton), pas de carte transparente.

- [ ] **Step 5 : Si régression visible → noter et corriger AVANT le commit final**

Si un composant est cassé : ouvrir le fichier de la page concernée, identifier l'usage problématique, corriger en utilisant les nouveaux tokens (`bg-paper`, `text-foreground`, `border-border`, etc.) si une couleur hardcodée pose problème.

- [ ] **Step 6 : Commit (ou pas, si rien à corriger)**

Si des corrections ont été faites :
```bash
git add -p   # patch par patch, valider chaque correction
git commit -m "fix(brand): corrections de régression visuelle après refonte tokens"
```
Sinon : passer à la suite.

---

## Task 20 : Doc design system — `docs/design-system.md`

**Files:**
- Create: `docs/design-system.md`

- [ ] **Step 1 : Créer le fichier**

```markdown
# Fluxo — Design System

> Spec source : `docs/superpowers/specs/2026-05-05-cycle-a-fondations-design.md`
> Direction : **Notion warm paper mono + accents sourds**

---

## Palette

### Mode clair

| Token Tailwind | CSS variable | Hex | Usage |
|---|---|---|---|
| `bg-paper` | `--paper` | `#FAFAF7` | Fond global, cartes par défaut |
| `bg-surface` | `--surface` | `#F1EFEA` | Surfaces secondaires (KPI, badges discrets) |
| `bg-surface-strong` | `--surface-strong` | `#D9D6CF` | Hover states, surfaces actives |
| `text-foreground` / `text-ink` | `--ink` | `#1A1A1A` | Texte primaire, boutons primaires |
| `text-ink-muted` / `text-muted-foreground` | `--ink-muted` | `#6B6760` | Texte secondaire, labels |
| `border-border` | `--border` | `rgba(26,26,26,.08)` | Bordures par défaut |
| `text-positive` / `bg-positive` | `--positive` | `#2F5D3D` | Revenus, succès, badges Pro |
| `text-negative` / `bg-negative` | `--negative` | `#7A2E2E` | Dépenses, erreurs |
| `bg-warning-bg text-warning` | `--warning-*` | `#F5EBD9` / `#6B4F1C` | Alertes, warnings |
| `bg-info-bg text-info` | `--info-*` | `#E8E8E0` / `#3A3A33` | Infos neutres |

### Mode sombre

Miroir sourd des tokens clairs (cf. `src/index.css` block `.dark`). Jamais de noir/blanc purs.

---

## Typographie

- **Famille :** Inter (variable, Google Fonts) + fallback `system-ui`. Chargée dans `index.html`.
- **Weights utilisés :** 400 (body), 500 (labels, boutons), 600 (titres, KPI), 700 (hero, marque).
- **Tabular-nums :** activé globalement via `font-feature-settings` dans `body`.

### Échelle

| Usage | Classes |
|---|---|
| Hero / brand | `text-4xl font-bold tracking-[-0.025em]` |
| Titre section | `text-2xl sm:text-3xl font-semibold tracking-[-0.025em]` (cf. `<SectionHeader>`) |
| Titre carte | `text-base font-semibold` |
| Body | `text-sm` ou `text-base text-foreground` |
| Body secondaire | `text-sm text-ink-muted` |
| Label uppercase | `text-[11px] font-medium uppercase tracking-[0.08em]` (cf. `<Eyebrow>`) |
| Valeur KPI | `text-2xl font-semibold tabular-nums` |
| Montant | `tabular-nums font-medium` |

---

## Règles d'utilisation des accents

- **Positif (`text-positive`)** : montants positifs (revenus, gains), badges de succès, badge Pro (fond ink), barres de progression d'objectif.
- **Négatif (`text-negative`)** : montants négatifs (dépenses), états d'erreur, suppressions.
- **Warning (`bg-warning-bg text-warning`)** : alertes budgétaires, sur-dépense, expiration consentement banking.
- **Info (`bg-info-bg text-info`)** : tooltips, callouts neutres, "le saviez-vous".

**Règle d'or :** jamais d'accent vif. Tons mats / terre uniquement. Si une couleur "pète", elle n'est pas dans la palette.

---

## Composants brand (`@/components/brand`)

| Composant | Rôle | Exemple d'usage |
|---|---|---|
| `<BrandLogo variant="full" />` | Slot logo (header) | `<BrandLogo size={32} />` |
| `<BrandLogo variant="mark" />` | Slot icône (favicon, sidebar collapsed) | `<BrandLogo variant="mark" size={24} />` |
| `<Eyebrow>` | Petit label uppercase | `<Eyebrow>Solde global</Eyebrow>` |
| `<SectionHeader>` | Tête de section landing/page | `<SectionHeader eyebrow="Tarifs" title="Choisis ton plan" description="..." align="center" />` |
| `<KPICard>` | KPI Dashboard | `<KPICard label="Revenus" value="+ 2 850 €" delta="+12% vs mois dernier" deltaTone="positive" />` |
| `<DataRow>` | Ligne tabulaire | `<DataRow label="Loyer" value="− 1 200,00 €" tone="negative" />` |
| `<EmptyState>` | État vide | `<EmptyState title="Aucune transaction" description="..." action={<Button>Ajouter</Button>} />` |
| `<PriceTag>` | Affichage prix tier | `<PriceTag amountEUR={2.99} cadence="monthly" />` |
| `<ProBadge tier="pro">` | Badge Plus / Pro | `<ProBadge tier="plus" />` |

Tous accessibles via : `import { KPICard, DataRow, ... } from "@/components/brand";`

---

## Composants UI shadcn ajustés

- **`<Card>`** : `rounded-2xl`, sans shadow.
- **`<Badge variant="pro">`** : nouvelle variante (fond ink, texte paper, uppercase).
- **`<Tabs>`** : underline minimaliste sous l'onglet actif (plus de fond gris).

Tous les autres composants `ui/*` héritent automatiquement de la nouvelle palette via les variables CSS shadcn (`--background`, `--card`, `--muted`, etc.).

---

## Logo

**Production :** par l'utilisateur. Direction = onde + F sur fond noir, palette N/B.

**Intégration :**
- `/public/logo.svg` — wordmark + icône horizontal (header)
- `/public/logo-mark.svg` — icône seule (favicon, sidebar collapsed, app icon mobile)
- `/public/icon-512.svg` — version PWA 512×512

Pour remplacer le placeholder : déposer les 3 fichiers SVG aux mêmes chemins. Aucun changement de code requis.

**Couleur :** le composant `<BrandLogo>` utilise `<img>` donc le SVG embarque ses propres couleurs. Si tu veux que le logo s'adapte au dark mode, embarque `currentColor` dans le SVG et expose-le en CSS via `fill: currentColor`.

---

## Pricing

Source de vérité : `src/lib/pricing.ts`. Toujours consommer `tiers` et `features` depuis ce module — jamais de prix/feature en dur.

| Tier | Mensuel | Annuel |
|---|---|---|
| Gratuit | 0 € | — |
| Plus | 2,99 €/mois | 24 €/an (−33%) |
| Pro | 4,99 €/mois | 39 €/an (−35%) |

Trial : 14 jours sans CB.

---

## Mode sombre

- **Activation :** classe `.dark` sur `<html>`, gérée par `useTheme` (cf. `src/lib/theme.ts`).
- **Toggle :** déjà présent dans `Layout.tsx`, à conserver.
- **Boot script inline** dans `index.html` : applique la classe avant React pour éviter le flash.
- **Règle :** chaque composant DOIT être testé en clair ET sombre avant validation.

---

## Roadmap design system

- **Cycle A (en cours)** : tokens + composants brand de base + slot logo + pricing.ts.
- **Cycle B** : refonte landing/login/onboarding/pages app en consommant le design system.
- **Cycle C** : variant guidelines pour formulaires, dialogs lourds (Stripe Checkout integration).
```

- [ ] **Step 2 : Commit**

```bash
git add docs/design-system.md
git commit -m "docs: design system Fluxo (palette, typo, composants, règles)"
```

---

## Task 21 : Mise à jour `CURRENT.md`

**Files:**
- Modify: `docs/superpowers/state/CURRENT.md`

- [ ] **Step 1 : Mettre à jour la section "Cycle A — état détaillé"**

Remplacer la valeur du statut Cycle A dans le tableau (`🟡 SPEC ÉCRITE — plan à produire`) par `✅ COMPLÉTÉ`.

Remplacer le bloc "Cycle A — état détaillé" par :

```markdown
## Cycle A — état détaillé

**✅ Complété le YYYY-MM-DD** (remplacer par date du jour). Spec : `docs/superpowers/specs/2026-05-05-cycle-a-fondations-design.md`. Plan : `docs/superpowers/plans/2026-05-05-cycle-a-fondations-design.md`. Doc design system : `docs/design-system.md`.

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
```

Mettre aussi à jour la section "Historique récent" en ajoutant en première ligne :

```markdown
- **YYYY-MM-DD** (date du jour) : Cycle A complété — design system Fluxo + composants brand + pricing.ts.
```

- [ ] **Step 2 : Commit**

```bash
git add docs/superpowers/state/CURRENT.md
git commit -m "docs(state): Cycle A complété, prochaine étape = Cycle B"
```

---

## Task 22 : Pousser la branche & ouvrir résumé

**Files:** aucun.

- [ ] **Step 1 : Vérifier le log de la branche**

```bash
git log --oneline cycle-a-fondations ^main
```
Expected : ~18-21 commits cohérents et lisibles.

- [ ] **Step 2 : Demander à l'utilisateur si push + merge dans main maintenant ou si revue manuelle d'abord**

Ne PAS pousser ni merger automatiquement. Présenter à l'utilisateur :
- Liste des commits
- Récap des fichiers créés/modifiés
- Demande explicite : "OK pour merger dans `main` ?" ou "Revue manuelle d'abord ?"

---

## Récap final attendu

À la fin du plan, le repo doit contenir :
- ✅ `src/index.css` avec tokens warm paper mono (clair + sombre)
- ✅ `tailwind.config.js` avec mapping `paper/surface/ink/positive/negative/warning/info`
- ✅ `src/lib/pricing.ts` — typé, source de vérité tiers + features
- ✅ `src/components/brand/{Eyebrow,SectionHeader,ProBadge,PriceTag,DataRow,KPICard,EmptyState,BrandLogo}.tsx` + `index.ts`
- ✅ `public/{logo,logo-mark,icon-512}.svg` — placeholders à remplacer
- ✅ `src/components/ui/{card,badge,tabs}.tsx` ajustés
- ✅ `docs/design-system.md`
- ✅ `docs/superpowers/state/CURRENT.md` mis à jour (Cycle A ✅)
- ✅ Inter chargé via Google Fonts dans `index.html`
- ✅ Toutes les pages app continuent de marcher en clair ET en sombre, sans régression fonctionnelle

Aucune nouvelle dépendance npm. Aucun changement de schéma DB. Aucun changement Supabase. Refonte purement front + non-régressive.
