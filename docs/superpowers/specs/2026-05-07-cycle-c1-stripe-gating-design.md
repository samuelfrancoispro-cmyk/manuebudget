# Cycle C1 — Monétisation core : Stripe + Feature Gating

**Date :** 2026-05-07
**Statut :** spec validée, plan d'implémentation à produire
**Cycle :** C1 (Stripe billing + feature gating runtime)
**Prérequis :** Cycles A ✅ + B ✅ (`profiles.tier`, `profiles.trialEndsAt` en DB)
**Bloque :** C2 (GoCardless — requiert tier Pro vérifié)

---

## 1. Contexte & objectif

Les Cycles A et B ont posé les fondations design et la refonte UI. `profiles.tier` et `profiles.trialEndsAt` sont déjà en DB (Cycle B). Le Cycle C1 connecte Fluxo à Stripe pour encaisser les abonnements et enforce les limites de chaque tier à l'exécution.

**Objectif :** un utilisateur peut s'abonner à Plus ou Pro, être facturé automatiquement, gérer son abonnement en self-service, et les limites de son tier sont réelles — pas seulement affichées.

**Hors-scope C1 :** GoCardless (C2), PWA polish (C3), SEO avancé (C3), parrainage, codes promo, historique factures custom.

---

## 2. Décisions clés

| Sujet | Décision | Raison |
|---|---|---|
| Checkout | Stripe Checkout hébergé (redirect) | Zéro surface PCI, rapide à implémenter |
| Trial | In-house (`trialEndsAt` en DB, pas via Stripe) | Préserve la promesse "14j sans CB" |
| Backend | Supabase Edge Functions (Deno) | Cohérent avec le stack, zéro infra nouvelle |
| Gating | Mixte : hard gate limites numériques, soft gate features absentes | USP sobriété — pas de modaux agressifs |
| TVA | Stripe Tax automatique (activé dashboard) | Zéro code — EU+UK auto |
| Customer Portal | Stripe hébergé | Factures, CB, annulation en self-service |

---

## 3. Schéma DB — migration profiles

3 colonnes à ajouter sur `profiles` (colonnes existantes : `tier`, `trialEndsAt`) :

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"    text,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" text,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus"  text;
```

Fichier SQL à créer : `docs/sql/2026-05-07-profiles-stripe-columns.sql`
Le user exécute ce fichier dans le dashboard Supabase.

### États `subscriptionStatus`

| Valeur | Signification |
|---|---|
| `null` | Free ou trial (pas d'abonnement Stripe) |
| `trialing` | Non utilisé (trial géré in-house) |
| `active` | Abonnement actif, paiement OK |
| `past_due` | Paiement échoué, accès maintenu 7j |
| `canceled` | Abonnement résilié |

---

## 4. Edge Functions Supabase

### 4.1 `create-checkout-session`

**Déclencheur :** appel authentifié depuis le front (bouton upgrade).
**Input :** `{ tierId: 'plus' | 'pro', period: 'monthly' | 'yearly' }`
**Logique :**
1. Récupérer `profile` de l'utilisateur connecté.
2. Créer ou récupérer un `Stripe.Customer` (upsert via `stripeCustomerId`).
3. Créer une `Stripe.Checkout.Session` :
   - `mode: 'subscription'`
   - `line_items` : le Price ID Stripe correspondant au tier + période
   - `success_url` : `/parametres?checkout=success`
   - `cancel_url` : `/parametres?checkout=cancel`
   - `customer` : `stripeCustomerId`
   - `automatic_tax: { enabled: true }`
4. Retourner `{ url: session.url }`.

**Price IDs Stripe** (à créer dans le dashboard) :

| Tier | Période | Constante env |
|---|---|---|
| Plus | Mensuel | `STRIPE_PRICE_PLUS_MONTHLY` |
| Plus | Annuel | `STRIPE_PRICE_PLUS_YEARLY` |
| Pro | Mensuel | `STRIPE_PRICE_PRO_MONTHLY` |
| Pro | Annuel | `STRIPE_PRICE_PRO_YEARLY` |

---

### 4.2 `stripe-webhook`

**Déclencheur :** POST Stripe → endpoint public (URL enregistrée dans le dashboard Stripe).
**Sécurité :** `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` — rejet 400 si signature invalide.

**Événements traités :**

| Événement | Action sur `profiles` |
|---|---|
| `checkout.session.completed` | `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus = 'active'`, `tier` confirmé |
| `customer.subscription.updated` | `subscriptionStatus`, `tier` (si changement de plan) |
| `customer.subscription.deleted` | `tier = 'free'`, `subscriptionStatus = 'canceled'`, `stripeSubscriptionId = null` |
| `invoice.payment_failed` | `subscriptionStatus = 'past_due'` |
| `invoice.payment_succeeded` | `subscriptionStatus = 'active'` |

Lookup user : via metadata `userId` injectée dans le Customer Stripe lors de sa création (`metadata: { userId: user.id }`). Toujours préféré au lookup par `stripeCustomerId` (plus fiable si le Customer est créé avant le webhook).

---

### 4.3 `create-portal-session`

**Déclencheur :** appel authentifié depuis le front (bouton "Gérer mon abonnement").
**Logique :**
1. Récupérer `stripeCustomerId` du profil.
2. Créer une `Stripe.BillingPortal.Session` avec `return_url: /parametres`.
3. Retourner `{ url: session.url }`.

---

## 5. Hook `useEntitlement`

**Fichier :** `src/hooks/useEntitlement.ts`

```ts
type EntitlementResult = {
  allowed: boolean;
  limit?: number;           // valeur max du tier (si limite numérique)
  reason?: 'feature' | 'limit' | 'trial_expired';
  requiredTier: TierId;     // tier minimal pour débloquer
};

function useEntitlement(featureKey: FeatureKey): EntitlementResult
```

**Logique interne :**
1. Lire `profile.tier`, `profile.trialEndsAt`, `profile.subscriptionStatus` depuis le store Zustand.
2. Calculer `effectiveTier` :
   - Si `subscriptionStatus === 'active'` → tier réel
   - Si trial valide (`trialEndsAt` > now) → tier réel
   - Sinon → `'free'`
3. Consulter `features[]` de `pricing.ts` pour la valeur du tier.
4. Si `subscriptionStatus === 'past_due'` : `effectiveTier` maintenu (accès conservé), mais `reason` peut inclure un signal d'alerte côté UI.
5. Retourner `allowed`, `limit`, `reason`, `requiredTier`.

**Zéro appel réseau** — synchrone, basé uniquement sur le store.

---

## 6. Composants gate

### 6.1 `<HardGate>` — blocage dur

**Fichier :** `src/components/gate/HardGate.tsx`
**Usage :** entoure un bouton/action soumis à une limite numérique.

```tsx
<HardGate featureKey="comptes_courants" current={comptes.length}>
  <Button onClick={addCompte}>Ajouter un compte</Button>
</HardGate>
```

**Comportement :**
- Si `allowed` → rend les enfants normalement.
- Si `!allowed` → rend une card inline sobre à la place :
  - Message : "Limite atteinte (X / Y). Passez à [Tier] pour continuer."
  - Bouton "Voir les formules" → redirect `/parametres#abonnement`
  - Pas de modal.

### 6.2 `<UpgradeBadge>` — découverte douce

**Fichier :** `src/components/gate/UpgradeBadge.tsx`
**Usage :** badge sur une feature absente du tier.

```tsx
<UpgradeBadge featureKey="import_csv" />
```

**Comportement :**
- Affiche le `ProBadge` existant + tooltip "Disponible en [Tier]".
- Aucun blocage — l'utilisateur peut voir et cliquer pour en savoir plus.

### 6.3 Banner trial expiré — dans `Layout.tsx`

**Condition :** `trialEndsAt` passé ET `subscriptionStatus` null ou `canceled`.
**UI :** bandeau 1 ligne en haut du layout, fond `bg-amber-50` (clair) / fond sombre adapté.
**Contenu :** "Votre essai a expiré. [Voir les formules →]"
**Disparaît :** dès que `subscriptionStatus === 'active'`.

### 6.4 Banner `past_due` — dans `Layout.tsx`

**Condition :** `subscriptionStatus === 'past_due'`
**UI :** bandeau 1 ligne, fond `bg-red-50`.
**Contenu :** "Paiement échoué. [Mettre à jour ma carte →]" → Customer Portal.

---

## 7. Page Paramètres > Abonnement

**Fichier :** `src/pages/Parametres.tsx` (nouvelle section dans la page existante)

### Blocs UI

| Bloc | Composant | Contenu |
|---|---|---|
| Statut actuel | `KPICard` | Tier actif + statut lisible + date renouvellement |
| Features incluses | liste `DataRow` | Consomme `features[]` filtrées par tier actif |
| Toggle période | switch Mensuel/Annuel | Affiche l'économie annuelle en badge |
| Actions | Boutons | Free/expiré → "Passer Plus" + "Passer Pro" ; Abonné → "Gérer" |

### États de la section

| État | Affichage |
|---|---|
| Trial actif | badge amber "Essai — X jours restants" + lien discret "Ajouter une carte" |
| Free | features actuelles + CTA upgrade |
| Abonné actif | plan + date prochaine facture + bouton "Gérer mon abonnement" |
| `past_due` | alerte sobre + bouton "Mettre à jour ma carte" → portail |
| Canceled | affiche Free + CTA upgrade |

---

## 8. Variables d'environnement

| Variable | Côté | Usage |
|---|---|---|
| `STRIPE_SECRET_KEY` | Edge Functions | SDK Stripe (secret, jamais côté front) |
| `STRIPE_WEBHOOK_SECRET` | Edge Function webhook | Validation signature |
| `STRIPE_PRICE_PLUS_MONTHLY` | Edge Function checkout | Price ID Stripe |
| `STRIPE_PRICE_PLUS_YEARLY` | Edge Function checkout | Price ID Stripe |
| `STRIPE_PRICE_PRO_MONTHLY` | Edge Function checkout | Price ID Stripe |
| `STRIPE_PRICE_PRO_YEARLY` | Edge Function checkout | Price ID Stripe |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Front (optionnel) | Pas utilisé en Checkout hébergé — réservé C2 |

Variables Edge Functions : Dashboard Supabase > Edge Functions > Secrets.

---

## 9. Flux utilisateur complet

```
[Free / trial expiré]
  → Paramètres > Abonnement
  → Choisit Plus mensuel
  → Toggle période si besoin
  → Clique "Passer Plus"
  → create-checkout-session → URL Stripe Checkout
  → Saisit CB sur page Stripe hébergée
  → Succès → redirect /parametres?checkout=success
  → stripe-webhook reçoit checkout.session.completed
  → profiles mis à jour (tier=plus, subscriptionStatus=active, stripeCustomerId, stripeSubscriptionId)
  → store Zustand rechargé → banner disparaît, HardGates se lèvent

[Abonné — gestion]
  → Clique "Gérer mon abonnement"
  → create-portal-session → URL Customer Portal Stripe
  → Annule / change CB / télécharge facture
  → Retour /parametres
  → stripe-webhook reçoit subscription.deleted → tier=free

[Paiement échoué]
  → invoice.payment_failed → subscriptionStatus=past_due
  → Banner rouge apparaît dans Layout
  → Clique "Mettre à jour ma carte" → Customer Portal
  → invoice.payment_succeeded → subscriptionStatus=active → banner disparaît
```

---

## 10. i18n

Toutes les nouvelles strings passent par `src/locales/fr.json` + `src/locales/en.json`.
Clés à ajouter sous `subscription.*`, `gate.*`, `parametres.abonnement.*`.

---

## 11. Ordre d'implémentation suggéré

1. **SQL migration** — colonnes Stripe sur `profiles`
2. **Edge Functions** — `create-checkout-session`, `stripe-webhook`, `create-portal-session`
3. **Hook `useEntitlement`** — logique pure, testable sans Stripe
4. **Composants gate** — `HardGate`, `UpgradeBadge`, banners Layout
5. **Page Paramètres** — section Abonnement
6. **i18n** — strings FR + EN
7. **Câblage** — intégrer gates sur les 6 pages app existantes
