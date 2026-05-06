# Cycle B — Refonte UI complète Fluxo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer le design system Fluxo (Cycle A) à toutes les pages — Landing pro, Login + Google OAuth, Onboarding + paywall, Layout + 6 pages app.

**Architecture:** Approche séquentielle landing-first. Les pages publiques (Landing, Login, Onboarding) sont indépendantes du Layout app et se livrent en premier. Layout + app pages forment une phase cohérente en second. Tous les vieux tokens shadcn (`bg-background`, `text-foreground`, `bg-primary`) sont remplacés par les tokens warm paper dans chaque fichier touché.

**Tech Stack:** React 18 + TypeScript 5.7 + Tailwind v3 + shadcn/ui (Radix) + Supabase Auth + i18next + pricing.ts (source de vérité tiers)

---

## Fichiers créés / modifiés

| Action | Fichier | Rôle |
|---|---|---|
| Créer | `src/components/brand/PricingTable.tsx` | Cartes tiers + tableau comparatif, consomme pricing.ts |
| Créer | `src/pages/AuthCallback.tsx` | Page callback OAuth Google |
| Créer | `src/components/onboarding/OnboardingTier.tsx` | Étape 7 : choix du tier |
| Créer | `docs/migrations/cycle-b-profiles-tier.sql` | Migration DB : colonne tier + trialEndsAt |
| Modifier | `src/locales/fr.json` + `en.json` | Nouvelles strings Landing, Login, OnboardingTier |
| Modifier | `src/pages/Landing.tsx` | Réécriture complète — 7 sections |
| Modifier | `src/pages/Login.tsx` | Redesign warm paper + Google OAuth + email confirmation |
| Modifier | `src/lib/auth.tsx` | Ajout signInWithGoogle() |
| Modifier | `src/App.tsx` | Route /auth/callback + SplashLoader tokens |
| Modifier | `src/components/onboarding/OnboardingStep.tsx` | Redesign warm paper |
| Modifier | `src/pages/Onboarding.tsx` | Étape 7 dans STEPS, total=7 |
| Modifier | `src/types/index.ts` | Profile : ajouter tier + trialEndsAt |
| Modifier | `src/components/Layout.tsx` | BrandLogo, warm paper tokens, nav redesign |
| Modifier | `src/pages/Dashboard.tsx` | SectionHeader, KPICard, recharts colors |
| Modifier | `src/pages/Argent.tsx` | DataRow, EmptyState, tokens |
| Modifier | `src/pages/EpargneHub.tsx` | KPICard, EmptyState, tokens |
| Modifier | `src/pages/Rapports.tsx` | SectionHeader, tokens |
| Modifier | `src/pages/Parametres.tsx` | SectionHeader, DataRow, tokens |
| Modifier | `src/pages/Aide.tsx` | EmptyState, tokens |
| Modifier | `src/components/PageHeader.tsx` | Tokens warm paper |
| Modifier | `src/components/brand/SectionHeader.tsx` | Fix text-foreground → text-ink (résidu Cycle A) |
| Modifier | `src/components/brand/KPICard.tsx` | Fix text-foreground → text-ink (résidu Cycle A) |
| Modifier | `src/components/brand/DataRow.tsx` | Fix text-foreground → text-ink (résidu Cycle A) |
| Modifier | `src/components/brand/EmptyState.tsx` | Fix text-foreground → text-ink (résidu Cycle A) |
| Modifier | `src/components/brand/PriceTag.tsx` | Fix text-foreground → text-ink (résidu Cycle A) |
| Modifier | `src/components/brand/index.ts` | Exporter PricingTable |
| Modifier | `docs/superpowers/state/CURRENT.md` | Cycle B ✅ |

---

## PHASE 0 — Corrections Cycle A (résidus text-foreground)

### Task 0: Corriger text-foreground dans les composants brand

Cinq composants Cycle A utilisent encore `text-foreground` au lieu de `text-ink`. À corriger avant d'utiliser ces composants dans les nouvelles pages.

**Files:**
- Modify: `src/components/brand/KPICard.tsx:34`
- Modify: `src/components/brand/SectionHeader.tsx:25`
- Modify: `src/components/brand/DataRow.tsx:14,30`
- Modify: `src/components/brand/EmptyState.tsx:23`
- Modify: `src/components/brand/PriceTag.tsx:17,25`

- [ ] **Step 1: Corriger KPICard.tsx**

Dans `src/components/brand/KPICard.tsx`, remplacer ligne 34 :
```tsx
// avant
<div className="text-2xl font-semibold tracking-[-0.015em] text-foreground tabular-nums">
// après
<div className="text-2xl font-semibold tracking-[-0.015em] text-ink tabular-nums">
```

- [ ] **Step 2: Corriger SectionHeader.tsx**

Dans `src/components/brand/SectionHeader.tsx`, remplacer ligne 25 :
```tsx
// avant
<h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground leading-tight">
// après
<h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-ink leading-tight">
```

- [ ] **Step 3: Corriger DataRow.tsx**

Dans `src/components/brand/DataRow.tsx` :
```tsx
// avant (ligne 14)
default: "text-foreground",
// après
default: "text-ink",
```
```tsx
// avant (ligne 30)
<span className="text-foreground">{label}</span>
// après
<span className="text-ink">{label}</span>
```

- [ ] **Step 4: Corriger EmptyState.tsx**

Dans `src/components/brand/EmptyState.tsx`, remplacer ligne 23 :
```tsx
// avant
<h3 className="text-base font-semibold text-foreground">{title}</h3>
// après
<h3 className="text-base font-semibold text-ink">{title}</h3>
```

- [ ] **Step 5: Corriger PriceTag.tsx**

Dans `src/components/brand/PriceTag.tsx` :
```tsx
// avant (ligne 17, cadence=free)
<span className="text-4xl font-bold tracking-[-0.025em] text-foreground">0 €</span>
// après
<span className="text-4xl font-bold tracking-[-0.025em] text-ink">0 €</span>
```
```tsx
// avant (ligne 25, cadence=monthly/yearly)
<span className="text-4xl font-bold tracking-[-0.025em] text-foreground tabular-nums">
// après
<span className="text-4xl font-bold tracking-[-0.025em] text-ink tabular-nums">
```

- [ ] **Step 6: Commit**

```bash
git add src/components/brand/KPICard.tsx src/components/brand/SectionHeader.tsx src/components/brand/DataRow.tsx src/components/brand/EmptyState.tsx src/components/brand/PriceTag.tsx
git commit -m "fix(brand): remplacer text-foreground par text-ink dans composants brand (résidus Cycle A)"
```

---

## PHASE 1 — Landing pro

### Task 1: Installer shadcn Accordion + ajouter les strings i18n Landing

**Files:**
- Modify: `src/locales/fr.json`
- Modify: `src/locales/en.json`

- [ ] **Step 1: Installer le composant Accordion**

```bash
npx shadcn@latest add accordion
```

Vérifier que `src/components/ui/accordion.tsx` est bien créé.

- [ ] **Step 2: Ajouter les strings FR dans fr.json**

Remplacer la section `"landing"` existante dans `src/locales/fr.json` :

```json
"landing": {
  "tagline": "Gérez votre budget, simplement.",
  "subtitle": "Suivez vos comptes, dépenses et épargne en un seul endroit. Gratuit pour commencer.",
  "eyebrow": "Gratuit, sans CB",
  "tryFree": "Essayer gratuitement",
  "signIn": "Se connecter",
  "features": {
    "eyebrow": "Fonctionnalités",
    "title": "Tout ce dont vous avez besoin",
    "subtitle": "Une application complète, sans surcharge.",
    "f1Title": "Tableau de bord complet",
    "f1Desc": "Suivi en temps réel de vos comptes courants, épargne et charges récurrentes.",
    "f2Title": "Onboarding en 5 minutes",
    "f2Desc": "Configurez vos comptes et commencez à suivre vos finances immédiatement.",
    "f3Title": "Données sécurisées",
    "f3Desc": "Hébergé en Europe, chiffré, lecture seule. Vos données ne quittent jamais l'UE.",
    "f4Title": "Multi-devises",
    "f4Desc": "EUR, GBP et plus — adapté au marché européen dès le départ."
  },
  "stats": {
    "val1": "2 000+", "label1": "utilisateurs",
    "val2": "31",    "label2": "pays couverts",
    "val3": "< 5 min", "label3": "pour démarrer"
  },
  "pricing": {
    "eyebrow": "Tarifs",
    "title": "Simple. Transparent. Abordable.",
    "subtitle": "Moins cher que tous nos concurrents. Changez de formule à tout moment.",
    "monthly": "Mensuel",
    "yearly": "Annuel",
    "ctaFree": "Commencer gratuitement",
    "ctaTrial": "Essayer 14 jours gratuit",
    "forever": "/ pour toujours",
    "perMonth": "/ mois",
    "perYear": "/ an"
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Questions fréquentes",
    "q1": "Mes données sont-elles sécurisées ?",
    "a1": "Oui. Toutes vos données sont hébergées sur Supabase (EU), chiffrées au repos et en transit. Fluxo fonctionne en lecture seule — nous n'avons jamais accès à vos identifiants bancaires.",
    "q2": "Puis-je annuler à tout moment ?",
    "a2": "Oui, sans conditions et sans frais. Vous pouvez annuler depuis votre espace client à tout moment. Aucun engagement, aucune surprise.",
    "q3": "GoCardless, c'est quoi ?",
    "a3": "GoCardless Bank Account Data (ex-Nordigen) est un agrégateur bancaire certifié en Europe. Il permet à Fluxo de récupérer vos transactions en lecture seule, sans jamais stocker vos identifiants.",
    "q4": "Le plan gratuit est-il vraiment gratuit ?",
    "a4": "Oui, sans carte bancaire et sans limite de durée. Le plan gratuit inclut 1 compte courant, 1 compte épargne, 50 transactions par mois et 5 charges récurrentes.",
    "q5": "La TVA est-elle incluse dans le prix ?",
    "a5": "Les prix affichés sont hors TVA. La TVA applicable (selon votre pays) est calculée automatiquement par Stripe Tax lors du paiement."
  },
  "footer": "© 2026 Fluxo · EU & UK",
  "legal": {
    "terms": "Conditions d'utilisation",
    "privacy": "Politique de confidentialité"
  }
}
```

- [ ] **Step 3: Ajouter les strings EN dans en.json**

Remplacer la section `"landing"` existante dans `src/locales/en.json` :

```json
"landing": {
  "tagline": "Budget management, made simple.",
  "subtitle": "Track your accounts, recurring expenses and savings in one place. Free to get started.",
  "eyebrow": "Free, no credit card",
  "tryFree": "Try for free",
  "signIn": "Sign in",
  "features": {
    "eyebrow": "Features",
    "title": "Everything you need",
    "subtitle": "A complete app, without the clutter.",
    "f1Title": "Full dashboard",
    "f1Desc": "Real-time tracking of your current accounts, savings and recurring charges.",
    "f2Title": "5-minute onboarding",
    "f2Desc": "Set up your accounts and start tracking your finances immediately.",
    "f3Title": "Secure data",
    "f3Desc": "Hosted in Europe, encrypted, read-only. Your data never leaves the EU.",
    "f4Title": "Multi-currency",
    "f4Desc": "EUR, GBP and more — built for the European market from day one."
  },
  "stats": {
    "val1": "2,000+", "label1": "users",
    "val2": "31",     "label2": "countries covered",
    "val3": "< 5 min", "label3": "to get started"
  },
  "pricing": {
    "eyebrow": "Pricing",
    "title": "Simple. Transparent. Affordable.",
    "subtitle": "Cheaper than all our competitors. Switch plans at any time.",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "ctaFree": "Get started for free",
    "ctaTrial": "Try free for 14 days",
    "forever": "/ forever",
    "perMonth": "/ month",
    "perYear": "/ year"
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Frequently asked questions",
    "q1": "Is my data secure?",
    "a1": "Yes. All your data is hosted on Supabase (EU), encrypted at rest and in transit. Fluxo is read-only — we never have access to your banking credentials.",
    "q2": "Can I cancel at any time?",
    "a2": "Yes, with no conditions and no fees. You can cancel from your account portal at any time. No commitment, no surprises.",
    "q3": "What is GoCardless?",
    "a3": "GoCardless Bank Account Data (formerly Nordigen) is a European-certified bank aggregator. It allows Fluxo to retrieve your transactions read-only, without ever storing your credentials.",
    "q4": "Is the free plan really free?",
    "a4": "Yes, no credit card and no time limit. The free plan includes 1 current account, 1 savings account, 50 transactions per month and 5 recurring charges.",
    "q5": "Is VAT included in the price?",
    "a5": "Displayed prices are ex-VAT. Applicable VAT (depending on your country) is automatically calculated by Stripe Tax at checkout."
  },
  "footer": "© 2026 Fluxo · EU & UK",
  "legal": {
    "terms": "Terms of use",
    "privacy": "Privacy policy"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/fr.json src/locales/en.json src/components/ui/accordion.tsx
git commit -m "feat(i18n): strings Landing pro + install shadcn Accordion"
```

---

### Task 2: Créer PricingTable

**Files:**
- Create: `src/components/brand/PricingTable.tsx`

- [ ] **Step 1: Créer PricingTable.tsx**

```tsx
// src/components/brand/PricingTable.tsx
import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tiers, features, sectionLabels, type TierId, type FeatureValue } from "@/lib/pricing";
import { PriceTag } from "./PriceTag";
import { ProBadge } from "./ProBadge";
import { Eyebrow } from "./Eyebrow";

const HIGHLIGHTS: Record<TierId, string[]> = {
  free: [
    "1 compte courant",
    "1 compte épargne",
    "50 transactions / mois",
    "5 charges récurrentes",
    "Export JSON sauvegarde",
  ],
  plus: [
    "5 comptes courants & épargne",
    "Transactions illimitées",
    "Import CSV bancaire (5/mois)",
    "Export Excel multi-feuilles",
    "Essai 14j sans CB",
  ],
  pro: [
    "Comptes illimités",
    "Sync automatique GoCardless",
    "Catégorisation auto des transactions",
    "Support prioritaire 24h",
    "Essai 14j sans CB",
  ],
};

function renderFeatureValue(val: FeatureValue): React.ReactNode {
  if (val === true) return <Check className="h-4 w-4 text-positive mx-auto" />;
  if (val === false) return <Minus className="h-4 w-4 text-ink-muted mx-auto" />;
  if (val === "unlimited") return <span className="text-ink">Illimité</span>;
  return <span className="text-ink">{String(val)}</span>;
}

interface PricingTableProps {
  onSelectTier?: (tierId: TierId) => void;
  ctaLabel?: (tierId: TierId) => string;
  className?: string;
}

export function PricingTable({ onSelectTier, ctaLabel, className }: PricingTableProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className={cn("space-y-10", className)}>
      {/* Toggle mensuel / annuel */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setBilling("monthly")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            billing === "monthly"
              ? "bg-ink text-paper"
              : "text-ink-muted hover:text-ink"
          )}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            billing === "yearly"
              ? "bg-ink text-paper"
              : "text-ink-muted hover:text-ink"
          )}
        >
          Annuel
        </button>
      </div>

      {/* Cartes tiers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiers.map((tier) => {
          const isHighlighted = !!tier.isHighlighted;
          const price =
            billing === "yearly" && tier.yearlyPriceEUR > 0
              ? tier.yearlyPriceEUR / 12
              : tier.monthlyPriceEUR;
          const yearlyPrice = tier.yearlyPriceEUR;

          return (
            <div
              key={tier.id}
              className={cn(
                "flex flex-col gap-6 rounded-2xl border p-6",
                isHighlighted
                  ? "border-ink bg-ink text-paper"
                  : "border-border bg-surface"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-base font-semibold",
                      isHighlighted ? "text-paper" : "text-ink"
                    )}
                  >
                    {tier.name}
                  </span>
                  {tier.id === "pro" && <ProBadge />}
                </div>
                <p
                  className={cn(
                    "text-sm",
                    isHighlighted ? "text-paper/70" : "text-ink-muted"
                  )}
                >
                  {tier.tagline}
                </p>
              </div>

              <div>
                {tier.monthlyPriceEUR === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-4xl font-bold tracking-[-0.025em]",
                        isHighlighted ? "text-paper" : "text-ink"
                      )}
                    >
                      0 €
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        isHighlighted ? "text-paper/60" : "text-ink-muted"
                      )}
                    >
                      / pour toujours
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-4xl font-bold tracking-[-0.025em] tabular-nums",
                          isHighlighted ? "text-paper" : "text-ink"
                        )}
                      >
                        {price.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          isHighlighted ? "text-paper/60" : "text-ink-muted"
                        )}
                      >
                        / mois
                      </span>
                    </div>
                    {billing === "yearly" && yearlyPrice > 0 && (
                      <p
                        className={cn(
                          "text-xs",
                          isHighlighted ? "text-paper/70" : "text-ink-muted"
                        )}
                      >
                        Facturé {yearlyPrice} € / an — économisez {tier.yearlyDiscountPct}%
                      </p>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-2">
                {HIGHLIGHTS[tier.id].map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        isHighlighted ? "text-paper" : "text-positive"
                      )}
                    />
                    <span className={isHighlighted ? "text-paper/90" : "text-ink"}>
                      {h}
                    </span>
                  </li>
                ))}
              </ul>

              {onSelectTier && (
                <Button
                  variant={isHighlighted ? "secondary" : "outline"}
                  className={cn(
                    "mt-auto w-full",
                    isHighlighted &&
                      "bg-paper text-ink hover:bg-surface"
                  )}
                  onClick={() => onSelectTier(tier.id)}
                >
                  {ctaLabel
                    ? ctaLabel(tier.id)
                    : tier.trialDays > 0
                    ? "Essayer 14 jours gratuit"
                    : "Commencer gratuitement"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Tableau comparatif complet */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Fonctionnalité</th>
              {tiers.map((t) => (
                <th key={t.id} className="px-4 py-3 text-center font-medium text-ink">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(sectionLabels).map(([section, sectionLabel]) => {
              const sectionFeatures = features.filter((f) => f.section === section);
              if (sectionFeatures.length === 0) return null;
              return (
                <>
                  <tr key={`section-${section}`} className="border-b border-border bg-surface/50">
                    <td colSpan={4} className="px-4 py-2">
                      <Eyebrow>{sectionLabel}</Eyebrow>
                    </td>
                  </tr>
                  {sectionFeatures.map((feature) => (
                    <tr
                      key={feature.key}
                      className="border-b border-border last:border-0 hover:bg-surface/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-ink">{feature.label}</td>
                      {tiers.map((t) => (
                        <td key={t.id} className="px-4 py-3 text-center">
                          {renderFeatureValue(feature.values[t.id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Exporter depuis brand/index.ts**

Dans `src/components/brand/index.ts`, ajouter :
```ts
export { PricingTable } from "./PricingTable";
```

- [ ] **Step 3: Vérification visuelle**

Importer temporairement `PricingTable` dans `Landing.tsx` existant et lancer `npm run dev`. Vérifier que le tableau s'affiche correctement en mode clair et sombre. Supprimer l'import temporaire.

- [ ] **Step 4: Commit**

```bash
git add src/components/brand/PricingTable.tsx src/components/brand/index.ts
git commit -m "feat(brand): PricingTable — cartes tiers + tableau comparatif, consomme pricing.ts"
```

---

### Task 3: Landing.tsx — réécriture complète

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Step 1: Réécrire Landing.tsx**

```tsx
// src/pages/Landing.tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Zap, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { PricingTable } from "@/components/brand/PricingTable";

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goSignUp = () => navigate("/login?mode=signup");
  const goSignIn = () => navigate("/login?mode=signin");

  const featureIcons = [LayoutDashboard, Zap, ShieldCheck, Globe];
  const featureKeys = ["f1", "f2", "f3", "f4"] as const;
  const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

  const stats = [
    { val: t("landing.stats.val1"), label: t("landing.stats.label1") },
    { val: t("landing.stats.val2"), label: t("landing.stats.label2") },
    { val: t("landing.stats.val3"), label: t("landing.stats.label3") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-paper/90 px-6 py-3 backdrop-blur-sm">
        <BrandLogo variant="full" className="h-7" />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goSignIn}>
            {t("landing.signIn")}
          </Button>
          <Button size="sm" onClick={goSignUp}>
            {t("landing.tryFree")}
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center gap-8 px-4 py-20 text-center">
          <Eyebrow>{t("landing.eyebrow")}</Eyebrow>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-bold tracking-[-0.025em] sm:text-5xl leading-tight">
              {t("landing.tagline")}
            </h1>
            <p className="text-base text-ink-muted sm:text-lg max-w-xl mx-auto">
              {t("landing.subtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={goSignUp}>
              {t("landing.tryFree")}
            </Button>
            <Button size="lg" variant="outline" onClick={goSignIn}>
              {t("landing.signIn")}
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-surface px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-10">
            <SectionHeader
              eyebrow={t("landing.features.eyebrow")}
              title={t("landing.features.title")}
              description={t("landing.features.subtitle")}
              align="center"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featureKeys.map((key, i) => {
                const Icon = featureIcons[i];
                return (
                  <div
                    key={key}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-paper p-5"
                  >
                    <div className="rounded-lg bg-surface p-2 shrink-0">
                      <Icon className="h-5 w-5 text-ink-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-ink">
                        {t(`landing.features.${key}Title`)}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {t(`landing.features.${key}Desc`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-t border-border px-4 py-10 sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 sm:flex-row sm:justify-around">
            {stats.map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold tracking-[-0.025em] text-ink tabular-nums">
                  {val}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-border bg-surface px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-10">
            <SectionHeader
              eyebrow={t("landing.pricing.eyebrow")}
              title={t("landing.pricing.title")}
              description={t("landing.pricing.subtitle")}
              align="center"
            />
            <PricingTable
              onSelectTier={() => goSignUp()}
              ctaLabel={(id) =>
                id === "free"
                  ? t("landing.pricing.ctaFree")
                  : t("landing.pricing.ctaTrial")
              }
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-8">
            <SectionHeader
              eyebrow={t("landing.faq.eyebrow")}
              title={t("landing.faq.title")}
              align="center"
            />
            <Accordion type="single" collapsible className="space-y-2">
              {faqKeys.map((key, i) => (
                <AccordionItem
                  key={key}
                  value={key}
                  className="rounded-xl border border-border px-4"
                >
                  <AccordionTrigger className="text-sm font-medium text-ink hover:no-underline">
                    {t(`landing.faq.${key}`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-ink-muted pb-4">
                    {t(`landing.faq.a${i + 1}`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-ink-muted">{t("landing.footer")}</p>
          <div className="flex gap-4">
            <a href="/legal/terms" className="text-xs text-ink-muted hover:text-ink transition-colors">
              {t("landing.legal.terms")}
            </a>
            <a href="/legal/privacy" className="text-xs text-ink-muted hover:text-ink transition-colors">
              {t("landing.legal.privacy")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Ajouter meta SEO dans index.html**

Dans `index.html`, remplacer le `<title>` existant et ajouter les meta :
```html
<title>Fluxo — Gérez votre budget simplement</title>
<meta name="description" content="Fluxo, l'application de budget personnel simple et abordable. Synchronisation bancaire, suivi des dépenses, objectifs d'épargne. Gratuit pour démarrer." />
<meta property="og:title" content="Fluxo — Gérez votre budget simplement" />
<meta property="og:description" content="Fluxo, l'application de budget personnel simple et abordable. Synchronisation bancaire, suivi des dépenses, objectifs d'épargne. Gratuit pour démarrer." />
<meta property="og:type" content="website" />
```

- [ ] **Step 3: Vérifier visuellement**

`npm run dev` → ouvrir `/`. Vérifier :
- Header sticky scroll
- Hero centré avec CTA
- 4 features cards 2 colonnes
- Stats 3 colonnes
- Pricing avec toggle mensuel/annuel + tableau
- FAQ accordion
- Footer
- Mode sombre : chaque section reste lisible

- [ ] **Step 4: Commit**

```bash
git add src/pages/Landing.tsx index.html
git commit -m "feat(landing): Landing pro complète — hero, features, pricing, FAQ, footer"
```

---

## PHASE 2 — Login + Google OAuth

### Task 4: Strings i18n Login + OAuth + App.tsx tokens

**Files:**
- Modify: `src/locales/fr.json`
- Modify: `src/locales/en.json`

- [ ] **Step 1: Ajouter strings FR auth OAuth**

Dans `src/locales/fr.json`, dans la section `"auth"`, ajouter après `"successSignUp"` :
```json
"continueGoogle": "Continuer avec Google",
"orSeparator": "ou",
"emailConfirmTitle": "Vérifiez vos emails",
"emailConfirmDesc": "Un lien de confirmation a été envoyé à {{email}}. Cliquez sur le lien pour activer votre compte.",
"resendEmail": "Renvoyer l'email",
"resendSent": "Email renvoyé",
"backToLogin": "Retour à la connexion"
```

- [ ] **Step 2: Ajouter strings EN auth OAuth**

Dans `src/locales/en.json`, dans la section `"auth"`, ajouter après `"successSignUp"` :
```json
"continueGoogle": "Continue with Google",
"orSeparator": "or",
"emailConfirmTitle": "Check your emails",
"emailConfirmDesc": "A confirmation link has been sent to {{email}}. Click the link to activate your account.",
"resendEmail": "Resend email",
"resendSent": "Email resent",
"backToLogin": "Back to login"
```

- [ ] **Step 3: Commit**

```bash
git add src/locales/fr.json src/locales/en.json
git commit -m "feat(i18n): strings OAuth + email confirmation"
```

---

### Task 5: auth.tsx + AuthCallback + App.tsx

**Files:**
- Modify: `src/lib/auth.tsx`
- Create: `src/pages/AuthCallback.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Mettre à jour auth.tsx**

Remplacer le contenu de `src/lib/auth.tsx` :
```tsx
// src/lib/auth.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.session) return {};
    return { message: "confirm" };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message };
  };

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
```

Note : `signUp` retourne maintenant `{ message: "confirm" }` au lieu du message texte hardcodé — Login.tsx utilisera la clé i18n.

- [ ] **Step 2: Créer AuthCallback.tsx**

```tsx
// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard", { replace: true });
      }
    });
    // Timeout de sécurité : si pas de session après 5s, retour login
    const t = setTimeout(() => navigate("/login", { replace: true }), 5000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Connexion en cours…
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Mettre à jour App.tsx**

Dans `src/App.tsx` :

1. Ajouter l'import `AuthCallback` :
```tsx
import AuthCallback from "./pages/AuthCallback";
```

2. Dans le bloc routes non-authentifiées (autour de la ligne `<Route path="/login"...>`), ajouter la route callback :
```tsx
<Route path="/auth/callback" element={<AuthCallback />} />
```

3. Corriger le token dans `SplashLoader` :
```tsx
// avant
<div className="flex min-h-screen items-center justify-center bg-muted/30">
  <div className="flex items-center gap-3 text-sm text-muted-foreground">
// après
<div className="flex min-h-screen items-center justify-center bg-paper">
  <div className="flex items-center gap-3 text-sm text-ink-muted">
```

- [ ] **Step 4: Vérification**

`npm run dev` → naviguer vers `/auth/callback`. Vérifier qu'il s'affiche (spinner) sans crash. TS sans erreur : `npx tsc --noEmit`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.tsx src/pages/AuthCallback.tsx src/App.tsx
git commit -m "feat(auth): signInWithGoogle(), AuthCallback, route /auth/callback"
```

**Note configuration manuelle :** avant de tester Google OAuth en vrai, aller dans Supabase Dashboard → Authentication → Providers → Google, activer et entrer le Client ID + Secret Google Cloud. Dans Google Cloud Console → OAuth 2.0 → ajouter `https://<ref>.supabase.co/auth/v1/callback` dans les URIs de redirection autorisées.

---

### Task 6: Login.tsx redesign

**Files:**
- Modify: `src/pages/Login.tsx`

- [ ] **Step 1: Réécrire Login.tsx**

```tsx
// src/pages/Login.tsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand/BrandLogo";

type Screen = "form" | "confirm";

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("form");

  const handleSubmit = async (e: React.FormEvent) => {
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
        else if (message === "confirm") setScreen("confirm");
        else toast.success(t("auth.successSignUp"));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
      setBusy(false);
    }
    // Si pas d'erreur : redirect vers Google, page quitte — pas besoin de setBusy(false)
  };

  const handleResend = async () => {
    const { error } = await signUp(email.trim(), password);
    if (!error) toast.success(t("auth.resendSent"));
  };

  if (screen === "confirm") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <BrandLogo variant="mark" className="mx-auto h-10" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-ink">{t("auth.emailConfirmTitle")}</h1>
            <p className="text-sm text-ink-muted">
              {t("auth.emailConfirmDesc", { email })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleResend}>
              {t("auth.resendEmail")}
            </Button>
            <Button variant="ghost" onClick={() => setScreen("form")}>
              {t("auth.backToLogin")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <BrandLogo variant="mark" className="h-10" />
          <p className="text-sm text-ink-muted">
            {mode === "signin" ? t("auth.signInDesc") : t("auth.signUpDesc")}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 bg-paper"
            onClick={handleGoogle}
            disabled={busy}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("auth.continueGoogle")}
          </Button>

          {/* Séparateur */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-ink-muted">{t("auth.orSeparator")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Formulaire email / pwd */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-ink">{t("auth.email")}</Label>
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
              <Label className="mb-1.5 block text-ink">{t("auth.password")}</Label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-ink-muted">{t("auth.passwordHint")}</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy
                ? t("auth.busy")
                : mode === "signin"
                ? t("auth.submitSignIn")
                : t("auth.submitSignUp")}
            </Button>
          </form>

          {/* Toggle signin/signup */}
          <p className="text-center text-sm text-ink-muted">
            {mode === "signin" ? (
              <>
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  className="font-medium text-ink underline-offset-4 hover:underline"
                  onClick={() => setMode("signup")}
                >
                  {t("auth.createAccount")}
                </button>
              </>
            ) : (
              <>
                {t("auth.alreadySignedUp")}{" "}
                <button
                  type="button"
                  className="font-medium text-ink underline-offset-4 hover:underline"
                  onClick={() => setMode("signin")}
                >
                  {t("auth.goToSignIn")}
                </button>
              </>
            )}
          </p>
        </div>

        {/* Meta SEO (via Helmet ou directement dans index.html selon config) */}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ajouter meta SEO Login dans index.html**

Note : les meta SEO pour Login sont dynamiques (titre change). Si le projet n'utilise pas `react-helmet`, il suffit d'avoir des meta génériques dans `index.html`. Sinon, ignorer (le meta Landing suffit pour Cycle B).

- [ ] **Step 3: Vérification visuelle**

`npm run dev` → `/login`. Vérifier :
- Fond `bg-paper`, carte `bg-surface`
- BrandLogo visible
- Bouton Google présent
- Séparateur "ou"
- Formulaire fonctionnel
- Toggle signin/signup
- Écran confirmation email (forcer `setScreen("confirm")` temporairement)
- Mode sombre

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat(login): redesign warm paper + Google OAuth + écran confirmation email"
```

---

## PHASE 3 — Onboarding redesign + paywall

### Task 7: DB migration SQL

**Files:**
- Create: `docs/migrations/cycle-b-profiles-tier.sql`

- [ ] **Step 1: Créer le fichier SQL**

```sql
-- docs/migrations/cycle-b-profiles-tier.sql
-- Cycle B : ajout colonnes tier + trialEndsAt sur profiles
-- À exécuter manuellement dans Supabase Dashboard → SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'plus', 'pro'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "trialEndsAt" timestamptz;

-- Index optionnel (utilisé pour le feature gating au Cycle C)
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles (tier);
```

- [ ] **Step 2: Mettre à jour le type Profile dans types/index.ts**

Dans `src/types/index.ts`, étendre l'interface `Profile` :
```typescript
export interface Profile {
  firstName: string | null;
  preferredLanguage: string;
  preferredCurrency: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  tier: "free" | "plus" | "pro";       // ajout Cycle B
  trialEndsAt: string | null;           // ajout Cycle B (ISO date string)
}
```

- [ ] **Step 3: Exécuter la migration**

Aller dans Supabase Dashboard → SQL Editor → coller le contenu du fichier SQL → Exécuter.

- [ ] **Step 4: Vérifier dans Supabase**

Table Editor → `profiles` → vérifier que les colonnes `tier` et `trialEndsAt` sont présentes. Vérifier que les lignes existantes ont `tier = 'free'`.

- [ ] **Step 5: Commit**

```bash
git add docs/migrations/cycle-b-profiles-tier.sql src/types/index.ts
git commit -m "feat(db): migration profiles tier + trialEndsAt, type Profile mis à jour"
```

---

### Task 8: Strings i18n OnboardingTier

**Files:**
- Modify: `src/locales/fr.json`
- Modify: `src/locales/en.json`

- [ ] **Step 1: Ajouter strings FR step7**

Dans `src/locales/fr.json`, dans la section `"onboarding"`, après `"step6"` :
```json
"step7": {
  "title": "Choisissez votre formule",
  "description": "Vous pouvez changer de formule à tout moment.",
  "ctaFree": "Commencer gratuitement",
  "ctaTrial": "Essayer 14 jours gratuit",
  "saving": "Enregistrement…"
}
```

- [ ] **Step 2: Ajouter strings EN step7**

Dans `src/locales/en.json`, dans la section `"onboarding"`, après `"step6"` :
```json
"step7": {
  "title": "Choose your plan",
  "description": "You can change your plan at any time.",
  "ctaFree": "Get started for free",
  "ctaTrial": "Try free for 14 days",
  "saving": "Saving…"
}
```

- [ ] **Step 3: Commit**

```bash
git add src/locales/fr.json src/locales/en.json
git commit -m "feat(i18n): strings OnboardingTier step7"
```

---

### Task 9: OnboardingStep.tsx redesign

**Files:**
- Modify: `src/components/onboarding/OnboardingStep.tsx`

- [ ] **Step 1: Réécrire OnboardingStep.tsx**

```tsx
// src/components/onboarding/OnboardingStep.tsx
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
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <span className="font-semibold text-sm text-ink">Fluxo</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-muted">
            {t("onboarding.stepOf", { step, total })}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors",
                  i < step ? "bg-ink" : "bg-surface-strong"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mb-8 text-ink-muted">{description}</p>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex shrink-0 items-center justify-between border-t border-border bg-paper px-6 py-4">
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

Changements clés vs original :
- `bg-background` → `bg-paper`
- `text-muted-foreground` → `text-ink-muted`
- `bg-primary` (dots) → `bg-ink`
- `bg-muted` (dots inactifs) → `bg-surface-strong`
- `border-b` → `border-b border-border`
- Progress bar : rectangles larges au lieu de ronds (plus sobre)

- [ ] **Step 2: Vérification visuelle**

`npm run dev` → se connecter → déclencher l'onboarding (ou simuler via l'URL `/onboarding`). Vérifier que les étapes 1–6 ont bien le nouveau style warm paper en mode clair et sombre.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/OnboardingStep.tsx
git commit -m "refactor(onboarding): OnboardingStep warm paper tokens, progress bar rectangulaire"
```

---

### Task 10: OnboardingTier.tsx — étape 7

**Files:**
- Create: `src/components/onboarding/OnboardingTier.tsx`

- [ ] **Step 1: Créer OnboardingTier.tsx**

```tsx
// src/components/onboarding/OnboardingTier.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tiers, type TierId } from "@/lib/pricing";
import { ProBadge } from "@/components/brand/ProBadge";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

const HIGHLIGHTS: Record<TierId, string[]> = {
  free: [
    "1 compte courant",
    "1 compte épargne",
    "50 transactions / mois",
    "5 charges récurrentes",
    "Export JSON",
  ],
  plus: [
    "5 comptes courants & épargne",
    "Transactions illimitées",
    "Import CSV bancaire",
    "Export Excel",
    "Essai 14j sans CB",
  ],
  pro: [
    "Comptes illimités",
    "Sync GoCardless auto",
    "Catégorisation automatique",
    "Support prioritaire",
    "Essai 14j sans CB",
  ],
};

export default function OnboardingTier() {
  const { t } = useTranslation();
  const { updateProfile, completeOnboarding } = useStore();
  const [selected, setSelected] = useState<TierId | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const tier = selected;
      const trialDays = tiers.find((t) => t.id === tier)?.trialDays ?? 0;
      const trialEndsAt =
        trialDays > 0
          ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Non connecté");

      await supabase
        .from("profiles")
        .update({ tier, trialEndsAt })
        .eq("user_id", authData.user.id);

      await updateProfile({ tier, trialEndsAt });
      await completeOnboarding();
    } catch (err) {
      toast.error("Une erreur est survenue. Réessayez.");
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <span className="font-semibold text-sm text-ink">Fluxo</span>
        <span className="text-sm text-ink-muted">
          {t("onboarding.stepOf", { step: 7, total: 7 })}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {t("onboarding.step7.title")}
            </h1>
            <p className="text-ink-muted">{t("onboarding.step7.description")}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tiers.map((tier) => {
              const isSelected = selected === tier.id;
              const isHighlighted = !!tier.isHighlighted;

              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelected(tier.id)}
                  className={cn(
                    "flex flex-col gap-5 rounded-2xl border p-5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
                    isSelected
                      ? "border-ink bg-ink text-paper ring-2 ring-ink"
                      : isHighlighted
                      ? "border-ink/30 bg-surface hover:border-ink"
                      : "border-border bg-surface hover:border-ink-muted"
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-semibold",
                          isSelected ? "text-paper" : "text-ink"
                        )}
                      >
                        {tier.name}
                      </span>
                      {tier.id === "pro" && <ProBadge />}
                    </div>
                    <p
                      className={cn(
                        "text-xs",
                        isSelected ? "text-paper/70" : "text-ink-muted"
                      )}
                    >
                      {tier.monthlyPriceEUR === 0
                        ? "Gratuit"
                        : `${tier.monthlyPriceEUR.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € / mois`}
                    </p>
                  </div>

                  <ul className="space-y-1.5">
                    {HIGHLIGHTS[tier.id].map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs">
                        <Check
                          className={cn(
                            "mt-0.5 h-3.5 w-3.5 shrink-0",
                            isSelected ? "text-paper" : "text-positive"
                          )}
                        />
                        <span className={isSelected ? "text-paper/90" : "text-ink"}>
                          {h}
                        </span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex shrink-0 items-center justify-end border-t border-border bg-paper px-6 py-4">
        <Button
          onClick={handleConfirm}
          disabled={!selected || saving}
          size="sm"
        >
          {saving
            ? t("onboarding.step7.saving")
            : selected === "free"
            ? t("onboarding.step7.ctaFree")
            : t("onboarding.step7.ctaTrial")}
        </Button>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Vérification**

`npm run dev`. TypeScript : `npx tsc --noEmit`. Vérifier que `profile.tier` et `profile.trialEndsAt` sont bien dans le type `Profile` (Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/OnboardingTier.tsx
git commit -m "feat(onboarding): OnboardingTier — étape 7, sélection tier + écriture DB"
```

---

### Task 11: Onboarding.tsx — ajouter step 7

**Files:**
- Modify: `src/pages/Onboarding.tsx`

- [ ] **Step 1: Mettre à jour Onboarding.tsx**

```tsx
// src/pages/Onboarding.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import OnboardingProfil from "@/components/onboarding/OnboardingProfil";
import OnboardingComptesCourants from "@/components/onboarding/OnboardingComptesCourants";
import OnboardingEpargne from "@/components/onboarding/OnboardingEpargne";
import OnboardingBourse from "@/components/onboarding/OnboardingBourse";
import OnboardingRecurrents from "@/components/onboarding/OnboardingRecurrents";
import OnboardingObjectifs from "@/components/onboarding/OnboardingObjectifs";
import OnboardingTier from "@/components/onboarding/OnboardingTier";

const STEPS: Record<number, React.ComponentType> = {
  1: OnboardingProfil,
  2: OnboardingComptesCourants,
  3: OnboardingEpargne,
  4: OnboardingBourse,
  5: OnboardingRecurrents,
  6: OnboardingObjectifs,
  7: OnboardingTier,
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

Chaque composant étape 1–6 appelle `setOnboardingStep(step + 1)` pour avancer. Quand l'étape 6 appelle `setOnboardingStep(7)`, l'onboarding passe à `OnboardingTier`.

Note : vérifier que chaque `OnboardingXxx` (étapes 1–6) appelle bien `setOnboardingStep(n+1)` dans son `onNext` — et que le total passé à `OnboardingStep` est 7 (non 6). Mettre à jour le prop `total={7}` si ce n'est pas déjà le cas.

- [ ] **Step 2: Vérifier le prop total dans les étapes 1–6**

Ouvrir chaque `OnboardingXxx.tsx` (étapes 1–6) et vérifier que `<OnboardingStep step={X} total={6} ...>` passe bien. Changer `total={6}` → `total={7}` dans chacun.

- [ ] **Step 3: Vérification**

Parcourir l'onboarding de l'étape 1 à 7. Vérifier que la barre de progression affiche bien 7 segments, que l'étape 7 s'affiche correctement et que la sélection d'un tier redirige vers `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Onboarding.tsx src/components/onboarding/
git commit -m "feat(onboarding): step 7 OnboardingTier ajouté, total=7 dans la progression"
```

---

## PHASE 4 — Layout + 6 pages app

### Task 12: Layout.tsx redesign

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Réécrire Layout.tsx**

```tsx
// src/components/Layout.tsx
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
import { BrandLogo } from "@/components/brand/BrandLogo";

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
    <div className="flex min-h-screen bg-paper">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-paper px-4 md:hidden">
        <BrandLogo variant="mark" className="h-7" />
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
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80%] border-r border-border bg-paper shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <BrandLogo variant="full" className="h-7" />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label={t("nav.close")}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavList nav={nav} onClick={() => setMobileOpen(false)} />
            <div className="mt-2 space-y-2 border-t border-border p-3">
              {user?.email && (
                <div className="truncate px-1 text-xs text-ink-muted" title={user.email}>
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
      <aside className="hidden w-60 shrink-0 border-r border-border bg-paper md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <BrandLogo variant="full" className="h-7" />
        </div>
        <NavList nav={nav} />
        <div className="mt-auto space-y-2 border-t border-border p-3">
          {user?.email && (
            <div className="truncate px-1 text-xs text-ink-muted" title={user.email}>
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

function NavList({
  nav,
  onClick,
}: {
  nav: { to: string; label: string; icon: React.ElementType }[];
  onClick?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-surface text-ink"
                : "text-ink-muted hover:bg-surface hover:text-ink"
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

- [ ] **Step 2: Vérification visuelle**

`npm run dev` → naviguer dans l'app. Vérifier :
- Sidebar desktop : BrandLogo visible, fond paper, nav items sobres
- Mobile : drawer avec BrandLogo "full"
- Nav actif : fond `bg-surface`, texte `text-ink`
- Nav inactif : `text-ink-muted`, hover `bg-surface`
- Mode sombre

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "refactor(layout): BrandLogo, warm paper tokens, nav items redesign"
```

---

### Task 13: PageHeader.tsx + Dashboard.tsx migration

**Files:**
- Modify: `src/components/PageHeader.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Lire PageHeader.tsx**

Ouvrir `src/components/PageHeader.tsx` et identifier les tokens à migrer. Remplacer :
- `text-foreground` → `text-ink`
- `text-muted-foreground` → `text-ink-muted`
- Tout token shadcn résiduel

- [ ] **Step 2: Migrer Dashboard.tsx**

Ouvrir `src/pages/Dashboard.tsx`. Remplacer :
- `PageHeader` → `SectionHeader` (importer depuis `@/components/brand`)
- Blocs Card + CardHeader + CardTitle → garder ou remplacer par `KPICard` pour les KPIs numériques
- Couleurs recharts hardcodées → utiliser les tokens CSS :
  ```tsx
  // Pattern pour recharts : utiliser getComputedStyle
  // ou définir des constantes :
  const CHART_POSITIVE = "hsl(var(--positive))";
  const CHART_NEGATIVE = "hsl(var(--negative))";
  const CHART_MUTED = "hsl(var(--ink-muted))";
  ```
- `text-muted-foreground` → `text-ink-muted` partout
- `text-foreground` → `text-ink` partout
- Imports `CardHeader`, `CardTitle`, `CardDescription` : garder si utilisés pour structure, sinon supprimer

Pour les KPI blocks du dashboard, remplacer les patterns `<Card><CardContent>...</CardContent></Card>` qui affichent un chiffre + label par :
```tsx
<KPICard
  label="Revenus prévus"
  value={formatEUR(montant)}
  deltaTone="positive"
/>
```

- [ ] **Step 3: Vérification**

`npm run dev` → Dashboard. Vérifier visuel clair + sombre. `npx tsc --noEmit`.

- [ ] **Step 4: Commit**

```bash
git add src/components/PageHeader.tsx src/pages/Dashboard.tsx
git commit -m "refactor(dashboard): warm paper tokens, KPICard, SectionHeader, recharts colors"
```

---

### Task 14: Argent.tsx migration

**Files:**
- Modify: `src/pages/Argent.tsx`

- [ ] **Step 1: Migrer Argent.tsx**

Ouvrir `src/pages/Argent.tsx`. Remplacer :
- `text-muted-foreground` → `text-ink-muted` partout
- `text-foreground` → `text-ink` partout
- `bg-muted` / `bg-background` → `bg-paper` / `bg-surface`
- Listes de transactions : remplacer par `DataRow` si la structure label/valeur s'y prête
- États vides : remplacer par `EmptyState`
- Header de section : `SectionHeader`
- Importer depuis `@/components/brand` : `{ DataRow, EmptyState, SectionHeader }`

- [ ] **Step 2: Vérification**

`npm run dev` → Argent → 3 onglets. Clair + sombre.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Argent.tsx
git commit -m "refactor(argent): warm paper tokens, DataRow, EmptyState, SectionHeader"
```

---

### Task 15: EpargneHub.tsx migration

**Files:**
- Modify: `src/pages/EpargneHub.tsx`

- [ ] **Step 1: Migrer EpargneHub.tsx**

Ouvrir `src/pages/EpargneHub.tsx`. Remplacer :
- Tokens muted → ink-muted / paper / surface
- KPI épargne totale → `KPICard`
- Objectifs : `KPICard` + `Progress` pour la barre de progression
- États vides → `EmptyState`
- Headers → `SectionHeader`

Pattern `Progress` brand pour les objectifs :
```tsx
<div className="space-y-1">
  <Progress value={pct} className="h-1.5" />
  <div className="flex justify-between text-xs text-ink-muted">
    <span>{formatEUR(current)}</span>
    <span>{pct}%</span>
    <span>{formatEUR(target)}</span>
  </div>
</div>
```

- [ ] **Step 2: Vérification**

`npm run dev` → Épargne → tous les onglets. Clair + sombre.

- [ ] **Step 3: Commit**

```bash
git add src/pages/EpargneHub.tsx
git commit -m "refactor(epargne): warm paper tokens, KPICard, EmptyState, Progress brand"
```

---

### Task 16: Rapports.tsx migration

**Files:**
- Modify: `src/pages/Rapports.tsx`

- [ ] **Step 1: Migrer Rapports.tsx**

Ouvrir `src/pages/Rapports.tsx`. Remplacer :
- Tokens muted → ink-muted / paper / surface
- Header page → `SectionHeader`
- Couleurs recharts dans `RapportAnalytique` : utiliser `hsl(var(--positive))` / `hsl(var(--negative))` / `hsl(var(--ink-muted))`
- États vides (pas de rapport importé) → `EmptyState`

Note : `RapportAnalytique.tsx` est un composant séparé. Migrer aussi ses tokens si nécessaire (ouvrir le fichier et vérifier).

- [ ] **Step 2: Vérification**

`npm run dev` → Rapports. Tester import CSV si possible. Clair + sombre.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Rapports.tsx src/components/RapportAnalytique.tsx
git commit -m "refactor(rapports): warm paper tokens, SectionHeader, recharts colors"
```

---

### Task 17: Parametres.tsx migration

**Files:**
- Modify: `src/pages/Parametres.tsx`

- [ ] **Step 1: Migrer Parametres.tsx**

Ouvrir `src/pages/Parametres.tsx`. Remplacer :
- Tokens muted → ink-muted / paper / surface
- Sections de paramètres → `SectionHeader` pour chaque catégorie
- Lignes de paramètre label/valeur → `DataRow`
- Formulaires : Labels et Inputs déjà dans le design system — vérifier que bg/border sont bien sur tokens warm paper

- [ ] **Step 2: Vérification**

`npm run dev` → Paramètres. Clair + sombre.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Parametres.tsx
git commit -m "refactor(parametres): warm paper tokens, SectionHeader, DataRow"
```

---

### Task 18: Aide.tsx migration + CURRENT.md

**Files:**
- Modify: `src/pages/Aide.tsx`
- Modify: `docs/superpowers/state/CURRENT.md`

- [ ] **Step 1: Migrer Aide.tsx**

Ouvrir `src/pages/Aide.tsx`. Remplacer :
- Tokens muted → ink-muted / paper / surface
- Contenu statique sobre avec `SectionHeader` + `EmptyState` si pas encore de contenu
- Ajouter un lien vers la FAQ de la Landing : `<a href="/">Voir la FAQ</a>`

- [ ] **Step 2: Vérification finale globale**

`npm run dev`. Parcourir toutes les pages :
- `/` Landing ✓
- `/login` Login + OAuth ✓
- `/onboarding` étapes 1–7 ✓
- `/dashboard` ✓
- `/argent` ✓
- `/epargne` ✓
- `/rapports` ✓
- `/parametres` ✓
- `/aide` ✓

Pour chaque page : vérifier en mode clair ET sombre. Aucun `bg-background`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `bg-primary` résiduel visible.

`npx tsc --noEmit` → zéro erreur.

- [ ] **Step 3: Mettre à jour CURRENT.md**

Remplacer le contenu de `docs/superpowers/state/CURRENT.md` :
```markdown
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

---

## Historique récent

- **2026-05-06** : Cycle B complété — Landing pro, Login OAuth, Onboarding + paywall, Layout + 6 pages app.
- **2026-05-06** : Cycle A complété — design system Fluxo + composants brand + pricing.ts.
- **2026-05-05** : Landing + auth flow Fluxo livrés (chantier 0 SaaS).
- **2026-05-04** : Onboarding wizard 6 étapes livré.
- **2026-05-02** : Pivot SaaS B2C, vision produit définie, marché EU+UK, conformité documentée.
```

- [ ] **Step 4: Commit final**

```bash
git add src/pages/Aide.tsx docs/superpowers/state/CURRENT.md
git commit -m "refactor(aide): warm paper tokens + CURRENT.md Cycle B ✅"
```

---

## Self-review checklist

Spec coverage :
- [x] Landing pro (7 sections) → Tasks 1-3
- [x] PricingTable consomme pricing.ts → Task 2
- [x] Meta SEO Landing + Login → Task 3 + 6
- [x] Login warm paper + BrandLogo → Task 6
- [x] Google OAuth → Task 5 (auth.tsx + AuthCallback)
- [x] Email confirmation screen → Task 6
- [x] Route /auth/callback → Task 5
- [x] DB migration tier + trialEndsAt → Task 7
- [x] Type Profile mis à jour → Task 7
- [x] OnboardingStep redesign → Task 9
- [x] OnboardingTier step 7 → Task 10
- [x] STEPS étendu à 7 → Task 11
- [x] total=7 dans les étapes 1-6 → Task 11 step 2
- [x] Layout BrandLogo + warm paper → Task 12
- [x] 6 pages app migrées → Tasks 13-18
- [x] Résidus text-foreground brand components → Task 0
- [x] CURRENT.md mis à jour → Task 18
- [x] Dark mode vérifié → chaque task a une vérification
- [x] i18n toutes nouvelles strings → Tasks 1, 4, 8
