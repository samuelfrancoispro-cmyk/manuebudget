# Budget app — Contexte projet

## Vision (pivot 2026-05-02)
**SaaS B2C** de gestion de budget personnel grand public francophone.
**Fond de commerce : simplicité radicale.** Tout doit être sobre, facile d'accès, synchronisé.
Concurrents : Bankin', Linxo, YNAB, Lydia. Différenciateur : UX épurée + onboarding 5 min + multi-tier abordable.

## Marché & modèle économique (décidés 2026-05-02)
- **Marché** : EU + UK + Irlande. **Bilingue FR + EN obligatoire dès le start.**
- **Tiers** : Gratuit / Plus / Pro. Moins cher que tous les concurrents. Réduction annuel avec engagement. Objectif autosuffisance infra.
- **Provider banking** : GoCardless Bank Account Data (ex-Nordigen) — free tier, 31 pays EEA + UK, AISP délégué.
- **Provider billing** : Stripe (Subscriptions + Customer Portal + Tax).
- **Statut légal** : lecture seule uniquement → pas d'agrément ACPR. Toujours respecter RGPD + cybersécurité (cf. `project_compliance.md`).

## Chantiers SaaS — ordre fixé
1. **Onboarding wizard** ← PROCHAIN — collecte 1ère connexion (comptes, revenus, charges) → dashboard pré-rempli
2. **Open Banking GoCardless** — sync temps réel via redirect-flow + webhook
3. **Billing Stripe** — abonnements, webhooks edge function, portail client
4. **Feature gating / paywall** — droits par tier, badges "Pro" sobres

## Stack
Vite 6 + React 18 + TS 5.7 + Tailwind v3 + shadcn (Radix) + zustand 5 + Supabase (Postgres+Auth+RLS) + recharts 3 + PWA. Déployé Vercel.

## Conventions critiques
- Colonnes Supabase **camelCase entre guillemets** (`"compteCourantId"`)
- RLS systématique (`auth.uid() = user_id`) sur toute nouvelle table + index `user_id`
- Récurrentes = expand-à-la-volée (`expandRecurrentesPourMois`), pas de lignes en DB
- Soldes : `soldeInitial` = point de référence, `soldeCompteCourant()` calcule le réel
- Store Zustand = cache front Supabase, pas de persist middleware
- `useStore.loadAll(userId)` au login, **reset state d'abord** (sécurité multi-user)
- Locale `fr-FR` partout, formats `formatEUR`/`formatDate`/`monthKey`/`monthLabel`

## Règles de collaboration
- **Style sobre** = USP commerciale (pas juste préférence). Ne pas surcharger l'UI.
- **Demander avant d'ajouter complexité visible** (nouveaux écrans, options).
- Complexité technique cachée (banking, billing, webhooks) est OK — mais invisible à l'utilisateur final.
- **SQL Supabase** : créer le fichier dans `docs/`, demander au user de runner — Claude n'exécute pas le SQL côté Supabase.
- **Reprise** : si user tape `continu` → lire `docs/superpowers/state/CURRENT.md` puis reprendre sans re-questionner.
- Pas de tests/CI imposés à ce stade — à proposer quand le sujet stabilité émergera (avant lancement payant).

## Périmètre v2 actuel (au 2026-05-02)
9 pages : Dashboard, Comptes, Transactions, Récurrents, Épargne, Simulateur, Rapports CSV, Paramètres, Aide.
Auth Supabase email/pwd. Mode sombre/clair persisté. PWA installable.
