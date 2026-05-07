# Cycle C1 — Stripe Billing + Feature Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connecter Fluxo à Stripe (checkout hébergé, webhooks, portail client) et enforcer les limites de chaque tier via `useEntitlement` + composants gate.

**Architecture:** Supabase Edge Functions (Deno) pour le backend Stripe (create-checkout-session, stripe-webhook, create-portal-session). Hook `useEntitlement` synchrone côté front basé sur le store Zustand. Composants `HardGate` (blocage dur sur limites numériques) et `UpgradeBadge` (découverte douce sur features absentes). Banners Layout pour trial expiré et past_due.

**Tech Stack:** React 18 + TypeScript 5.7, Zustand 5, Supabase Edge Functions (Deno), Stripe API v14, Tailwind v3 + shadcn/Radix, react-i18next.

---

## Prérequis manuels (à faire avant de commencer)

Avant de lancer l'implémentation, le user doit :

1. **Créer un compte Stripe** (si pas déjà fait) sur https://dashboard.stripe.com
2. **Créer 4 Price IDs** dans le dashboard Stripe (Products > Add product) :
   - Plus Mensuel : 2,99 €/mois recurring → noter l'ID `price_xxx`
   - Plus Annuel : 24 €/an recurring → noter l'ID `price_xxx`
   - Pro Mensuel : 4,99 €/mois recurring → noter l'ID `price_xxx`
   - Pro Annuel : 39 €/an recurring → noter l'ID `price_xxx`
3. **Activer Stripe Tax** : Dashboard > Tax > Enable automatic tax
4. **Configurer le Customer Portal** : Dashboard > Billing > Customer Portal > Activate
5. **Récupérer les clés Stripe** :
   - Secret key (`sk_test_xxx`) → pour les Edge Functions
   - Publishable key (`pk_test_xxx`) → pour le front (optionnel en Checkout hébergé)
6. **Installer Supabase CLI** si pas présent : `npm install -g supabase`

---

## Structure des fichiers

```
docs/sql/
  2026-05-07-profiles-stripe-columns.sql   (NOUVEAU — migration DB)

supabase/functions/
  create-checkout-session/
    index.ts                                (NOUVEAU — Edge Function)
  stripe-webhook/
    index.ts                                (NOUVEAU — Edge Function)
  create-portal-session/
    index.ts                                (NOUVEAU — Edge Function)

src/
  lib/
    pricing.ts                              (MODIFIÉ — ajouter FeatureKey type)
    stripe.ts                               (NOUVEAU — helpers front appel Edge Functions)
  hooks/
    useEntitlement.ts                       (NOUVEAU — hook gating synchrone)
  components/
    gate/
      HardGate.tsx                          (NOUVEAU — blocage dur)
      UpgradeBadge.tsx                      (NOUVEAU — badge doux)
    Layout.tsx                              (MODIFIÉ — banners trial expiré + past_due)
  pages/
    Parametres.tsx                          (MODIFIÉ — section Abonnement)
    Epargne.tsx                             (MODIFIÉ — HardGate comptes_epargne + objectifs)
    Recurrents.tsx                          (MODIFIÉ — HardGate recurrentes)
    Simulateur.tsx                          (MODIFIÉ — HardGate projets)
    Rapports.tsx                            (MODIFIÉ — UpgradeBadge import_csv + export_excel)
  types/
    index.ts                                (MODIFIÉ — Profile + champs Stripe)
  locales/
    fr.json                                 (MODIFIÉ — nouvelles clés i18n)
    en.json                                 (MODIFIÉ — nouvelles clés i18n)
```

---

## Task 1 : SQL migration — colonnes Stripe sur `profiles`

**Files:**
- Create: `docs/sql/2026-05-07-profiles-stripe-columns.sql`

- [ ] **Step 1 : Créer le fichier SQL**

```sql
-- docs/sql/2026-05-07-profiles-stripe-columns.sql
-- Cycle C1 : ajout des colonnes Stripe sur profiles.
-- Exécuter dans : Supabase Dashboard > SQL Editor.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"     text,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" text,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus"   text;

-- Index pour lookup rapide par stripeCustomerId (utilisé par le webhook)
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_idx
  ON profiles ("stripeCustomerId");
```

- [ ] **Step 2 : Demander au user d'exécuter ce fichier**

Ouvrir Supabase Dashboard > SQL Editor > coller le contenu de `docs/sql/2026-05-07-profiles-stripe-columns.sql` > Run.

Vérifier : Table Editor > profiles > colonnes `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus` présentes.

- [ ] **Step 3 : Commit**

```bash
git add docs/sql/2026-05-07-profiles-stripe-columns.sql
git commit -m "feat(db): add Stripe columns to profiles (C1)"
```

---

## Task 2 : Mise à jour des types et du store

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/store/useStore.ts`

- [ ] **Step 1 : Ajouter les champs Stripe à l'interface `Profile` dans `src/types/index.ts`**

Trouver le bloc `export interface Profile {` et remplacer par :

```ts
export interface Profile {
  firstName: string | null;
  preferredLanguage: string;
  preferredCurrency: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  tier: TierId;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: "active" | "past_due" | "canceled" | null;
}
```

- [ ] **Step 2 : Mettre à jour `loadProfile` dans `src/store/useStore.ts` pour lire les nouveaux champs**

Trouver la fonction `loadProfile` dans le store. Elle fait un `select` sur `profiles`. S'assurer que le select inclut les nouveaux champs. La fonction `strip()` déjà en place les inclura automatiquement (elle strip seulement `user_id` et `created_at`). Vérifier que le select est `select("*")` ou équivalent — si ce n'est pas le cas, ajouter les colonnes au select.

- [ ] **Step 3 : Commit**

```bash
git add src/types/index.ts src/store/useStore.ts
git commit -m "feat(types): add Stripe fields to Profile type (C1)"
```

---

## Task 3 : i18n — nouvelles clés

**Files:**
- Modify: `src/locales/fr.json`
- Modify: `src/locales/en.json`

- [ ] **Step 1 : Ajouter les clés dans `src/locales/fr.json`**

Ajouter après la dernière clé de premier niveau (avant le `}` final) :

```json
  "gate": {
    "limitReached": "Limite atteinte ({{current}} / {{limit}})",
    "upgradeTo": "Passez à {{tier}} pour continuer",
    "seePlans": "Voir les formules",
    "availableIn": "Disponible en {{tier}}"
  },
  "subscription": {
    "trialExpiredBanner": "Votre essai gratuit a expiré.",
    "trialExpiredCta": "Voir les formules →",
    "pastDueBanner": "Paiement échoué — accès maintenu temporairement.",
    "pastDueCta": "Mettre à jour ma carte →",
    "trialActive": "Essai — {{days}} jours restants",
    "statusActive": "Actif",
    "statusCanceled": "Résilié",
    "statusPastDue": "Paiement échoué",
    "statusFree": "Gratuit",
    "renewsOn": "Prochain renouvellement : {{date}}",
    "manageSubscription": "Gérer mon abonnement",
    "upgradePlus": "Passer Plus",
    "upgradePro": "Passer Pro",
    "addCard": "Ajouter une carte de paiement",
    "periodMonthly": "Mensuel",
    "periodYearly": "Annuel",
    "yearlySaving": "−{{pct}} %",
    "checkoutSuccess": "Abonnement activé, bienvenue !",
    "checkoutCancel": "Paiement annulé.",
    "loading": "Redirection vers le paiement…",
    "portalLoading": "Ouverture du portail…",
    "sectionTitle": "Abonnement"
  }
```

- [ ] **Step 2 : Ajouter les clés dans `src/locales/en.json`**

Ajouter après la dernière clé de premier niveau (avant le `}` final) :

```json
  "gate": {
    "limitReached": "Limit reached ({{current}} / {{limit}})",
    "upgradeTo": "Upgrade to {{tier}} to continue",
    "seePlans": "See plans",
    "availableIn": "Available in {{tier}}"
  },
  "subscription": {
    "trialExpiredBanner": "Your free trial has expired.",
    "trialExpiredCta": "See plans →",
    "pastDueBanner": "Payment failed — access temporarily maintained.",
    "pastDueCta": "Update your card →",
    "trialActive": "Trial — {{days}} days left",
    "statusActive": "Active",
    "statusCanceled": "Canceled",
    "statusPastDue": "Payment failed",
    "statusFree": "Free",
    "renewsOn": "Next renewal: {{date}}",
    "manageSubscription": "Manage subscription",
    "upgradePlus": "Upgrade to Plus",
    "upgradePro": "Upgrade to Pro",
    "addCard": "Add payment method",
    "periodMonthly": "Monthly",
    "periodYearly": "Yearly",
    "yearlySaving": "−{{pct}}%",
    "checkoutSuccess": "Subscription activated, welcome!",
    "checkoutCancel": "Payment canceled.",
    "loading": "Redirecting to payment…",
    "portalLoading": "Opening portal…",
    "sectionTitle": "Subscription"
  }
```

- [ ] **Step 3 : Commit**

```bash
git add src/locales/fr.json src/locales/en.json
git commit -m "feat(i18n): add gate + subscription keys (C1)"
```

---

## Task 4 : `FeatureKey` type + helper dans `pricing.ts`

**Files:**
- Modify: `src/lib/pricing.ts`

- [ ] **Step 1 : Ajouter le type `FeatureKey` dans `src/lib/pricing.ts`**

Ajouter après `export type FeatureValue = ...` :

```ts
export type FeatureKey =
  | "comptes_courants"
  | "comptes_epargne"
  | "transactions_mois"
  | "recurrentes"
  | "objectifs"
  | "projets"
  | "categories_perso"
  | "appareils_simultanes"
  | "install_pwa"
  | "dark_mode"
  | "import_csv"
  | "analyse_rapports"
  | "export_excel"
  | "export_json"
  | "sync_bancaire"
  | "categorisation_auto"
  | "support"
  | "trial";

/** Retourne la valeur d'une feature pour un tier donné. */
export function getFeatureValue(key: FeatureKey, tier: TierId): FeatureValue {
  const feat = features.find((f) => f.key === key);
  return feat ? feat.values[tier] : false;
}

/** Retourne le tier minimal qui débloque une feature (premier tier où la valeur est truthy/non-zéro). */
export function getRequiredTier(key: FeatureKey): TierId {
  const order: TierId[] = ["free", "plus", "pro"];
  for (const tier of order) {
    const val = getFeatureValue(key, tier);
    if (val !== false && val !== 0) return tier;
  }
  return "pro";
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/lib/pricing.ts
git commit -m "feat(pricing): add FeatureKey type + helpers (C1)"
```

---

## Task 5 : `src/lib/stripe.ts` — helpers front

**Files:**
- Create: `src/lib/stripe.ts`

- [ ] **Step 1 : Créer `src/lib/stripe.ts`**

```ts
// src/lib/stripe.ts
// Appels aux Edge Functions Supabase pour le billing Stripe.
import { supabase } from "@/lib/supabase";

export async function createCheckoutSession(
  tierId: "plus" | "pro",
  period: "monthly" | "yearly"
): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { tierId, period },
  });
  if (error) throw new Error(error.message);
  return data as { url: string };
}

export async function createPortalSession(): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke("create-portal-session", {
    body: {},
  });
  if (error) throw new Error(error.message);
  return data as { url: string };
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat(stripe): front helpers for Edge Functions (C1)"
```

---

## Task 6 : Edge Function `create-checkout-session`

**Files:**
- Create: `supabase/functions/create-checkout-session/index.ts`

- [ ] **Step 1 : Créer le répertoire et le fichier**

```bash
mkdir -p supabase/functions/create-checkout-session
```

- [ ] **Step 2 : Créer `supabase/functions/create-checkout-session/index.ts`**

```ts
// supabase/functions/create-checkout-session/index.ts
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const PRICE_IDS: Record<string, string> = {
  "plus-monthly": Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY")!,
  "plus-yearly":  Deno.env.get("STRIPE_PRICE_PLUS_YEARLY")!,
  "pro-monthly":  Deno.env.get("STRIPE_PRICE_PRO_MONTHLY")!,
  "pro-yearly":   Deno.env.get("STRIPE_PRICE_PRO_YEARLY")!,
};

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Authentifier l'utilisateur via le JWT Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    // Récupérer le profil pour stripeCustomerId existant
    const { data: profile } = await supabase
      .from("profiles")
      .select('"stripeCustomerId", tier')
      .eq("user_id", user.id)
      .single();

    const { tierId, period } = await req.json() as { tierId: "plus" | "pro"; period: "monthly" | "yearly" };
    const priceKey = `${tierId}-${period}`;
    const priceId = PRICE_IDS[priceKey];
    if (!priceId) return new Response("Invalid tier/period", { status: 400 });

    // Créer ou récupérer le Customer Stripe
    let stripeCustomerId: string = profile?.stripeCustomerId ?? "";
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      // Sauvegarder immédiatement le stripeCustomerId
      await supabase
        .from("profiles")
        .update({ "stripeCustomerId": stripeCustomerId })
        .eq("user_id", user.id);
    }

    // Créer la Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: { enabled: true },
      customer_update: { address: "auto" },
      success_url: `${APP_URL}/parametres?checkout=success`,
      cancel_url: `${APP_URL}/parametres?checkout=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
```

- [ ] **Step 3 : Ajouter `APP_URL` dans les secrets Supabase Edge Functions**

Dashboard Supabase > Edge Functions > Secrets > Ajouter :
- `STRIPE_SECRET_KEY` = `sk_test_xxx`
- `STRIPE_PRICE_PLUS_MONTHLY` = `price_xxx`
- `STRIPE_PRICE_PLUS_YEARLY` = `price_xxx`
- `STRIPE_PRICE_PRO_MONTHLY` = `price_xxx`
- `STRIPE_PRICE_PRO_YEARLY` = `price_xxx`
- `APP_URL` = `https://votre-domaine.vercel.app` (ou `http://localhost:5173` pour dev)

- [ ] **Step 4 : Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts
git commit -m "feat(edge): create-checkout-session Edge Function (C1)"
```

---

## Task 7 : Edge Function `stripe-webhook`

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`

- [ ] **Step 1 : Créer `supabase/functions/stripe-webhook/index.ts`**

```ts
// supabase/functions/stripe-webhook/index.ts
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

// Map Price ID → TierId (rempli depuis les env vars)
function tierFromPriceId(priceId: string): "plus" | "pro" | null {
  const map: Record<string, "plus" | "pro"> = {
    [Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY") ?? ""]: "plus",
    [Deno.env.get("STRIPE_PRICE_PLUS_YEARLY") ?? ""]:  "plus",
    [Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? ""]:  "pro",
    [Deno.env.get("STRIPE_PRICE_PRO_YEARLY") ?? ""]:   "pro",
  };
  return map[priceId] ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Client Supabase avec la service_role key pour bypasser RLS
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  async function updateProfileByCustomerId(
    stripeCustomerId: string,
    updates: Record<string, unknown>
  ) {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq('"stripeCustomerId"', stripeCustomerId);
    if (error) console.error("Profile update error:", error);
  }

  async function updateProfileByUserId(
    userId: string,
    updates: Record<string, unknown>
  ) {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);
    if (error) console.error("Profile update error:", error);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Récupérer le tier depuis la subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const tier = tierFromPriceId(priceId);

        // Lookup userId depuis le Customer metadata
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = customer.metadata?.userId;

        if (userId) {
          await updateProfileByUserId(userId, {
            "stripeCustomerId": customerId,
            "stripeSubscriptionId": subscriptionId,
            subscriptionStatus: "active",
            ...(tier ? { tier } : {}),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const tier = tierFromPriceId(priceId);
        await updateProfileByCustomerId(customerId, {
          subscriptionStatus: sub.status === "active" ? "active" : sub.status,
          ...(tier ? { tier } : {}),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await updateProfileByCustomerId(customerId, {
          tier: "free",
          subscriptionStatus: "canceled",
          "stripeSubscriptionId": null,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await updateProfileByCustomerId(customerId, { subscriptionStatus: "past_due" });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        // Uniquement si c'est un renouvellement (pas la première invoice qui a déjà été traitée par checkout.session.completed)
        if (invoice.billing_reason === "subscription_cycle") {
          await updateProfileByCustomerId(customerId, { subscriptionStatus: "active" });
        }
        break;
      }

      default:
        // Événement non géré — ignorer silencieusement
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 2 : Ajouter `STRIPE_WEBHOOK_SECRET` et `SUPABASE_SERVICE_ROLE_KEY` dans les secrets**

Dashboard Supabase > Edge Functions > Secrets :
- `STRIPE_WEBHOOK_SECRET` = clé de signature webhook Stripe (créée à l'étape de déploiement)
- `SUPABASE_SERVICE_ROLE_KEY` = dans Supabase > Settings > API > service_role

- [ ] **Step 3 : Enregistrer le webhook dans Stripe**

Après déploiement de la function (Task 8 déploiement), aller sur Stripe Dashboard > Developers > Webhooks > Add endpoint :
- URL : `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
- Copier le Signing secret → mettre dans `STRIPE_WEBHOOK_SECRET`

- [ ] **Step 4 : Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat(edge): stripe-webhook Edge Function (C1)"
```

---

## Task 8 : Edge Function `create-portal-session`

**Files:**
- Create: `supabase/functions/create-portal-session/index.ts`

- [ ] **Step 1 : Créer `supabase/functions/create-portal-session/index.ts`**

```ts
// supabase/functions/create-portal-session/index.ts
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select('"stripeCustomerId"')
      .eq("user_id", user.id)
      .single();

    const stripeCustomerId = profile?.stripeCustomerId;
    if (!stripeCustomerId) {
      return new Response(JSON.stringify({ error: "No Stripe customer" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${APP_URL}/parametres`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("create-portal-session error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
```

- [ ] **Step 2 : Déployer les 3 Edge Functions**

```bash
supabase functions deploy create-checkout-session --project-ref <votre-project-ref>
supabase functions deploy stripe-webhook --project-ref <votre-project-ref>
supabase functions deploy create-portal-session --project-ref <votre-project-ref>
```

- [ ] **Step 3 : Commit**

```bash
git add supabase/functions/create-portal-session/index.ts
git commit -m "feat(edge): create-portal-session Edge Function (C1)"
```

---

## Task 9 : Hook `useEntitlement`

**Files:**
- Create: `src/hooks/useEntitlement.ts`

- [ ] **Step 1 : Créer `src/hooks/useEntitlement.ts`**

```ts
// src/hooks/useEntitlement.ts
import { useStore } from "@/store/useStore";
import {
  type FeatureKey,
  type TierId,
  type FeatureValue,
  getFeatureValue,
  getRequiredTier,
} from "@/lib/pricing";

export interface EntitlementResult {
  /** L'utilisateur peut utiliser cette feature (ou est sous la limite numérique si current fourni) */
  allowed: boolean;
  /** Limite numérique du tier actif (undefined si feature boolean) */
  limit?: number;
  /** Tier actif effectif calculé (free si trial expiré et pas d'abo actif) */
  effectiveTier: TierId;
  /** Raison du blocage */
  reason?: "feature" | "limit" | "trial_expired";
  /** Tier minimal pour débloquer cette feature */
  requiredTier: TierId;
}

/**
 * Calcule l'accès effectif à une feature selon le tier actif de l'utilisateur.
 * Synchrone — basé uniquement sur le store Zustand, zéro appel réseau.
 *
 * @param featureKey  Clé de feature définie dans pricing.ts
 * @param current     Nombre actuel d'éléments (pour les features à limite numérique)
 */
export function useEntitlement(featureKey: FeatureKey, current?: number): EntitlementResult {
  const profile = useStore((s) => s.profile);

  // Tier effectif : subscription active > trial valide > free
  const effectiveTier: TierId = (() => {
    if (!profile) return "free";
    if (profile.subscriptionStatus === "active") return profile.tier;
    if (profile.subscriptionStatus === "past_due") return profile.tier; // accès maintenu
    if (profile.trialEndsAt && new Date(profile.trialEndsAt) > new Date()) return profile.tier;
    return "free";
  })();

  const trialExpired =
    !!profile?.trialEndsAt &&
    new Date(profile.trialEndsAt) <= new Date() &&
    !profile?.subscriptionStatus;

  const value: FeatureValue = getFeatureValue(featureKey, effectiveTier);
  const requiredTier = getRequiredTier(featureKey);

  // Feature booléenne absente
  if (value === false) {
    return {
      allowed: false,
      effectiveTier,
      reason: trialExpired ? "trial_expired" : "feature",
      requiredTier,
    };
  }

  // Feature illimitée ou string descriptive
  if (value === "unlimited" || typeof value === "string") {
    return { allowed: true, effectiveTier, requiredTier };
  }

  // Feature booléenne présente
  if (typeof value === "boolean") {
    return { allowed: true, effectiveTier, requiredTier };
  }

  // Limite numérique
  if (typeof value === "number") {
    const limit = value;
    const underLimit = current === undefined || current < limit;
    return {
      allowed: underLimit,
      limit,
      effectiveTier,
      reason: underLimit ? undefined : (trialExpired ? "trial_expired" : "limit"),
      requiredTier,
    };
  }

  return { allowed: true, effectiveTier, requiredTier };
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/hooks/useEntitlement.ts
git commit -m "feat(hooks): useEntitlement hook (C1)"
```

---

## Task 10 : Composant `HardGate`

**Files:**
- Create: `src/components/gate/HardGate.tsx`

- [ ] **Step 1 : Créer `src/components/gate/HardGate.tsx`**

```tsx
// src/components/gate/HardGate.tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlement } from "@/hooks/useEntitlement";
import { type FeatureKey, tiers } from "@/lib/pricing";

interface HardGateProps {
  featureKey: FeatureKey;
  /** Nombre actuel d'éléments (pour les limites numériques) */
  current: number;
  children: React.ReactNode;
}

/**
 * Bloque une action quand la limite numérique du tier est atteinte.
 * Rend les enfants normalement si l'accès est autorisé.
 */
export function HardGate({ featureKey, current, children }: HardGateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allowed, limit, requiredTier } = useEntitlement(featureKey, current);

  if (allowed) return <>{children}</>;

  const tierName = tiers.find((t) => t.id === requiredTier)?.name ?? requiredTier;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm text-ink-muted">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
        <div className="space-y-2">
          <p className="text-ink">
            {limit !== undefined
              ? t("gate.limitReached", { current, limit })
              : t("gate.upgradeTo", { tier: tierName })}
          </p>
          <p className="text-xs">{t("gate.upgradeTo", { tier: tierName })}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/parametres#abonnement")}
          >
            {t("gate.seePlans")}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/gate/HardGate.tsx
git commit -m "feat(gate): HardGate component (C1)"
```

---

## Task 11 : Composant `UpgradeBadge`

**Files:**
- Create: `src/components/gate/UpgradeBadge.tsx`

- [ ] **Step 1 : Créer `src/components/gate/UpgradeBadge.tsx`**

```tsx
// src/components/gate/UpgradeBadge.tsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEntitlement } from "@/hooks/useEntitlement";
import { ProBadge } from "@/components/brand/ProBadge";
import { type FeatureKey, tiers } from "@/lib/pricing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UpgradeBadgeProps {
  featureKey: FeatureKey;
  /** Si true, affiche toujours le badge même si l'accès est autorisé (pour forcer l'affichage) */
  force?: boolean;
}

/**
 * Badge doux affiché sur une feature absente du tier actuel.
 * N'empêche rien — invite à découvrir les formules supérieures.
 */
export function UpgradeBadge({ featureKey, force = false }: UpgradeBadgeProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allowed, requiredTier } = useEntitlement(featureKey);

  if (allowed && !force) return null;

  const tierName = tiers.find((ti) => ti.id === requiredTier)?.name ?? requiredTier;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => navigate("/parametres#abonnement")}
            className="inline-flex items-center"
            aria-label={t("gate.availableIn", { tier: tierName })}
          >
            <ProBadge />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("gate.availableIn", { tier: tierName })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/gate/UpgradeBadge.tsx
git commit -m "feat(gate): UpgradeBadge component (C1)"
```

---

## Task 12 : Banners dans `Layout.tsx`

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1 : Ajouter l'import et les banners dans `src/components/Layout.tsx`**

En haut du fichier, ajouter l'import :
```tsx
import { useStore } from "@/store/useStore";
```

Ajouter l'import de `createPortalSession` en haut du fichier :
```tsx
import { createPortalSession } from "@/lib/stripe";
```

Dans le composant `Layout`, après le `const { t } = useTranslation();` existant, ajouter :
```tsx
const profile = useStore((s) => s.profile);
const [portalLoading, setPortalLoading] = useState(false);

const handlePortal = async () => {
  setPortalLoading(true);
  try {
    const { url } = await createPortalSession();
    window.location.href = url;
  } catch {
    setPortalLoading(false);
  }
};

const trialExpired =
  !!profile?.trialEndsAt &&
  new Date(profile.trialEndsAt) <= new Date() &&
  !profile?.subscriptionStatus;
const isPastDue = profile?.subscriptionStatus === "past_due";
```

Dans le JSX, juste avant `<Outlet />` (ou à l'endroit où le contenu principal est rendu), ajouter les banners :

```tsx
{/* Banner trial expiré */}
{trialExpired && (
  <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
    <span>{t("subscription.trialExpiredBanner")}</span>
    <Link to="/parametres#abonnement" className="font-medium underline underline-offset-2">
      {t("subscription.trialExpiredCta")}
    </Link>
  </div>
)}

{/* Banner paiement échoué */}
{isPastDue && (
  <div className="flex items-center justify-center gap-2 bg-red-50 px-4 py-2 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
    <span>{t("subscription.pastDueBanner")}</span>
    <button
      type="button"
      onClick={handlePortal}
      className="font-medium underline underline-offset-2"
    >
      {t("subscription.pastDueCta")}
    </button>
  </div>
)}
```

Ajouter `Link` à l'import react-router-dom si pas déjà présent :
```tsx
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat(layout): trial-expired + past_due banners (C1)"
```

---

## Task 13 : Section Abonnement dans `Parametres.tsx`

**Files:**
- Modify: `src/pages/Parametres.tsx`

- [ ] **Step 1 : Ajouter les imports nécessaires**

En haut de `src/pages/Parametres.tsx`, ajouter :
```tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { tiers, features, formatTierPrice } from "@/lib/pricing";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe";
import { KPICard } from "@/components/brand/KPICard";
import { useStore } from "@/store/useStore";
```

- [ ] **Step 2 : Ajouter la logique de la section Abonnement dans le composant**

Dans le composant `ParametresPage`, ajouter après les états existants :

```tsx
const profile = useStore((s) => s.profile);
const loadProfile = useStore((s) => s.loadProfile);
const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
const [checkoutLoading, setCheckoutLoading] = useState<"plus" | "pro" | null>(null);
const [portalLoading, setPortalLoading] = useState(false);
const [searchParams, setSearchParams] = useSearchParams();

// Gérer le retour depuis Stripe Checkout
useEffect(() => {
  const checkout = searchParams.get("checkout");
  if (checkout === "success") {
    toast.success(t("subscription.checkoutSuccess"));
    // Recharger le profil après 2s pour laisser le webhook traiter
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await loadProfile(user.id);
    }, 2000);
    setSearchParams({});
  } else if (checkout === "cancel") {
    toast.info(t("subscription.checkoutCancel"));
    setSearchParams({});
  }
}, [searchParams]);

const handleUpgrade = async (tierId: "plus" | "pro") => {
  setCheckoutLoading(tierId);
  try {
    const { url } = await createCheckoutSession(tierId, period);
    window.location.href = url;
  } catch {
    toast.error(t("common.error"));
    setCheckoutLoading(null);
  }
};

const handlePortal = async () => {
  setPortalLoading(true);
  try {
    const { url } = await createPortalSession();
    window.location.href = url;
  } catch {
    toast.error(t("common.error"));
    setPortalLoading(false);
  }
};

// Statut lisible
const subscriptionLabel = (() => {
  if (!profile) return "";
  if (profile.subscriptionStatus === "active") return t("subscription.statusActive");
  if (profile.subscriptionStatus === "past_due") return t("subscription.statusPastDue");
  if (profile.subscriptionStatus === "canceled") return t("subscription.statusCanceled");
  if (profile.trialEndsAt && new Date(profile.trialEndsAt) > new Date()) {
    const days = Math.ceil((new Date(profile.trialEndsAt).getTime() - Date.now()) / 86400000);
    return t("subscription.trialActive", { days });
  }
  return t("subscription.statusFree");
})();

const isSubscribed = profile?.subscriptionStatus === "active" || profile?.subscriptionStatus === "past_due";
const tierName = tiers.find((ti) => ti.id === (profile?.tier ?? "free"))?.name ?? "Gratuit";
```

Ajouter aussi l'import de supabase si pas déjà présent :
```tsx
import { supabase } from "@/lib/supabase";
```

- [ ] **Step 3 : Ajouter la section JSX Abonnement dans le rendu**

Chercher dans le rendu la section des catégories ou en bas de la page, ajouter une nouvelle section avec l'id `abonnement` :

```tsx
{/* ── Section Abonnement ── */}
<section id="abonnement" className="space-y-4 scroll-mt-20">
  <SectionHeader title={t("subscription.sectionTitle")} />

  {/* Statut actuel */}
  <KPICard
    label={tierName}
    value={subscriptionLabel}
  />

  {/* Toggle mensuel / annuel (affiché seulement si pas encore abonné) */}
  {!isSubscribed && (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => setPeriod("monthly")}
        className={cn(
          "rounded-lg px-3 py-1.5 font-medium transition-colors",
          period === "monthly"
            ? "bg-ink text-paper"
            : "text-ink-muted hover:text-ink"
        )}
      >
        {t("subscription.periodMonthly")}
      </button>
      <button
        type="button"
        onClick={() => setPeriod("yearly")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
          period === "yearly"
            ? "bg-ink text-paper"
            : "text-ink-muted hover:text-ink"
        )}
      >
        {t("subscription.periodYearly")}
        <span className="rounded-full bg-positive/20 px-1.5 py-0.5 text-xs text-positive">
          {t("subscription.yearlySaving", { pct: 33 })}
        </span>
      </button>
    </div>
  )}

  {/* Actions */}
  {isSubscribed ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePortal}
      disabled={portalLoading}
    >
      {portalLoading ? t("subscription.portalLoading") : t("subscription.manageSubscription")}
    </Button>
  ) : (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        onClick={() => handleUpgrade("plus")}
        disabled={checkoutLoading !== null}
      >
        {checkoutLoading === "plus"
          ? t("subscription.loading")
          : t("subscription.upgradePlus")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleUpgrade("pro")}
        disabled={checkoutLoading !== null}
      >
        {checkoutLoading === "pro"
          ? t("subscription.loading")
          : t("subscription.upgradePro")}
      </Button>
    </div>
  )}

  {/* Features du tier actif */}
  <div className="space-y-1">
    {features
      .filter((f) => f.section !== "support")
      .map((f) => {
        const val = f.values[profile?.tier ?? "free"];
        const displayVal =
          val === true ? "✓" :
          val === false ? "—" :
          val === "unlimited" ? "∞" :
          String(val);
        return (
          <DataRow key={f.key} label={f.label} value={displayVal} />
        );
      })}
  </div>
</section>
```

Ajouter `cn` à l'import utils si pas déjà présent et `DataRow` à l'import brand.

- [ ] **Step 4 : Commit**

```bash
git add src/pages/Parametres.tsx
git commit -m "feat(parametres): subscription section (C1)"
```

---

## Task 14 : Câblage HardGate sur les pages app

**Files:**
- Modify: `src/pages/Epargne.tsx`
- Modify: `src/pages/Recurrents.tsx`
- Modify: `src/pages/Simulateur.tsx`
- Modify: `src/pages/Parametres.tsx` (HardGate sur addCompteCourant)

### Epargne.tsx — comptes épargne + objectifs

- [ ] **Step 1 : Ajouter l'import dans `src/pages/Epargne.tsx`**

```tsx
import { HardGate } from "@/components/gate/HardGate";
```

- [ ] **Step 2 : Wrapper le bouton "Ajouter un compte épargne"**

Trouver le bouton qui ouvre le dialog/form pour créer un compte épargne. L'entourer :

```tsx
<HardGate featureKey="comptes_epargne" current={comptes.length}>
  <Button size="sm" onClick={() => { /* ouverture dialog */ }}>
    {t("common.add")} {/* bouton existant */}
  </Button>
</HardGate>
```

- [ ] **Step 3 : Wrapper le bouton "Ajouter un objectif"**

Trouver le bouton qui crée un objectif. L'entourer :

```tsx
<HardGate featureKey="objectifs" current={objectifs.length}>
  {/* bouton existant */}
</HardGate>
```

### Recurrents.tsx — récurrentes

- [ ] **Step 4 : Ajouter l'import et wrapper dans `src/pages/Recurrents.tsx`**

```tsx
import { HardGate } from "@/components/gate/HardGate";
```

Wrapper le bouton d'ajout de récurrente :

```tsx
<HardGate featureKey="recurrentes" current={recurrentes.length}>
  {/* bouton existant */}
</HardGate>
```

### Simulateur.tsx — projets

- [ ] **Step 5 : Ajouter l'import et wrapper dans `src/pages/Simulateur.tsx`**

```tsx
import { HardGate } from "@/components/gate/HardGate";
```

Wrapper le bouton d'ajout de projet :

```tsx
<HardGate featureKey="projets" current={projets.length}>
  {/* bouton existant */}
</HardGate>
```

### Parametres.tsx — comptes courants

- [ ] **Step 6 : Wrapper le bouton de création de compte courant dans `src/pages/Parametres.tsx`**

`HardGate` est déjà importé via Task 13. Trouver le bouton qui ouvre la dialog de création de compte courant (ligne ~270-280) et wrapper :

```tsx
<HardGate featureKey="comptes_courants" current={store.comptesCourants.length}>
  {/* bouton "Ajouter un compte" existant */}
</HardGate>
```

- [ ] **Step 7 : Commit**

```bash
git add src/pages/Epargne.tsx src/pages/Recurrents.tsx src/pages/Simulateur.tsx src/pages/Parametres.tsx
git commit -m "feat(gate): HardGate on comptes/objectifs/recurrentes/projets (C1)"
```

---

## Task 15 : Câblage UpgradeBadge sur Rapports

**Files:**
- Modify: `src/pages/Rapports.tsx`

- [ ] **Step 1 : Ajouter l'import dans `src/pages/Rapports.tsx`**

```tsx
import { UpgradeBadge } from "@/components/gate/UpgradeBadge";
```

- [ ] **Step 2 : Ajouter badge sur le bouton Import CSV**

Trouver le bouton/section Import CSV et ajouter le badge à côté du titre ou label :

```tsx
<div className="flex items-center gap-2">
  <span>{/* label import CSV existant */}</span>
  <UpgradeBadge featureKey="import_csv" />
</div>
```

- [ ] **Step 3 : Ajouter badge sur le bouton Export Excel**

Trouver le bouton Export Excel et ajouter le badge :

```tsx
<div className="flex items-center gap-2">
  {/* bouton export existant */}
  <UpgradeBadge featureKey="export_excel" />
</div>
```

- [ ] **Step 4 : Commit**

```bash
git add src/pages/Rapports.tsx
git commit -m "feat(gate): UpgradeBadge on import_csv + export_excel (C1)"
```

---

## Vérification finale

- [ ] L'app compile sans erreur TypeScript : `npm run build`
- [ ] Navigation vers `/parametres#abonnement` → section visible
- [ ] Toggle mensuel/annuel fonctionne
- [ ] Bouton "Passer Plus" redirige vers Stripe Checkout (en mode test)
- [ ] Retour sur `/parametres?checkout=success` → toast + rechargement profil
- [ ] Créer plus de 5 récurrentes en Free → `HardGate` s'affiche
- [ ] Sur Rapports, le badge `UpgradeBadge` apparaît sur Import CSV pour un compte Free
- [ ] Banner trial expiré visible si `trialEndsAt` passé et pas de subscription
