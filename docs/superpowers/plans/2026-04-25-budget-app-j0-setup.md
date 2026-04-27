# Budget app — J0 Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place les fondations techniques de Budget app : repo Git, projet Next.js 15 avec Tailwind v4, shadcn/ui, Vitest + Playwright, projet Supabase provisionné avec schéma DB complet et RLS, flux d'authentification fonctionnel (magic link), shell applicatif (sidebar + header + routes stubs). À la fin de J0, l'app se lance, un user peut se connecter, voir le shell, et la DB est entièrement prête à recevoir des données.

**Architecture:** Next.js 15 App Router monorepo simple (pas de monorepo Turbo). Le code de l'app vit à la racine de "Budget app" (qui devient le repo). Le fichier Excel source est déplacé en `reference/`. Supabase sert de DB + Auth via `@supabase/ssr` (pattern officiel Next.js). Les composants shadcn sont installés à la demande dans `components/ui`. Tests : Vitest pour unitaires (schemas, server actions), Playwright pour E2E (flux utilisateur).

**Tech Stack:**
- Next.js 15 (App Router, TypeScript strict)
- Tailwind v4
- shadcn/ui (déjà en devDep, à initialiser)
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Zod (validation schemas partagés)
- Vitest (unit tests)
- Playwright (E2E tests)
- Bash (Unix syntax sur Windows — environnement déjà confirmé)

---

## Avant de commencer

L'environnement actuel contient :
- `Budget prévisionnel.xls` (à déplacer en `reference/`)
- `node_modules/`, `package.json` (shadcn devDep), `package-lock.json` — tous à remplacer par l'init Next.js
- `.mcp.json` (Supabase + shadcn MCPs) — à préserver
- `docs/superpowers/specs/2026-04-25-budget-app-design.md` — à préserver
- `docs/superpowers/plans/2026-04-25-budget-app-j0-setup.md` (ce plan) — à préserver
- `analyse-xls.cjs`, `analyse-special.cjs` — déjà supprimés
- Pas de git repo initialisé

L'utilisatrice du produit final = la mère de Samuel. Aucun email réel ne doit être hardcodé dans les tests ou seeds.

---

## File Structure (créés/modifiés à J0)

| Path | Responsabilité | Phase |
|---|---|---|
| `.gitignore` | Exclusions git (node_modules, .env*, .next…) | 0.1 |
| `.gitattributes` | LF normalisation, traitement xls binary | 0.1 |
| `reference/Budget prévisionnel.xls` | Fichier source (déplacé) | 0.1 |
| `package.json` | Dépendances projet (réécrit) | 0.2 |
| `tsconfig.json` | Config TS strict | 0.2 |
| `next.config.ts` | Config Next.js | 0.2 |
| `tailwind.config.ts` + `app/globals.css` | Tailwind v4 | 0.2 |
| `vitest.config.ts` + `tests/unit/example.test.ts` | Vitest setup | 0.3 |
| `playwright.config.ts` + `tests/e2e/smoke.spec.ts` | Playwright setup | 0.3 |
| `components.json` | shadcn config | 0.4 |
| `components/ui/*.tsx` | Composants shadcn (button, card, input, label, sidebar, sheet, dialog) | 0.4 |
| `lib/utils.ts` | Helper `cn()` shadcn | 0.4 |
| `supabase/migrations/20260425000001_initial_schema.sql` | Création tables | 0.5 |
| `supabase/migrations/20260425000002_rls_policies.sql` | Policies RLS | 0.5 |
| `supabase/migrations/20260425000003_triggers.sql` | Trigger profile auto-create | 0.5 |
| `.env.example` | Template env vars | 0.6 |
| `.env.local` | Vars locales (non commit) | 0.6 |
| `lib/supabase/client.ts` | Browser client | 0.6 |
| `lib/supabase/server.ts` | Server (RSC, Server Action) client | 0.6 |
| `lib/supabase/middleware.ts` | Middleware helper | 0.6 |
| `middleware.ts` | Next.js middleware (auth check) | 0.7 |
| `app/(auth)/login/page.tsx` | Form magic link | 0.7 |
| `app/(auth)/auth/callback/route.ts` | Échange code → session | 0.7 |
| `app/(auth)/layout.tsx` | Layout pages auth (centré) | 0.7 |
| `app/(app)/layout.tsx` | Layout principal avec sidebar | 0.8 |
| `components/layout/sidebar.tsx` | Sidebar 5 entrées | 0.8 |
| `components/layout/header.tsx` | Header (avatar + logout) | 0.8 |
| `app/(app)/page.tsx` | Dashboard stub | 0.8 |
| `app/(app)/budget/page.tsx` | Stub | 0.8 |
| `app/(app)/savings/page.tsx` | Stub | 0.8 |
| `app/(app)/projects/page.tsx` | Stub | 0.8 |
| `app/(app)/scenarios/page.tsx` | Stub | 0.8 |
| `app/(app)/settings/page.tsx` | Stub | 0.8 |
| `tests/e2e/auth.spec.ts` | Login flow + redirect | 0.9 |
| `tests/unit/supabase-rls.test.ts` | RLS isolation 2 users | 0.9 |
| `README.md` | Setup local + commands | 0.10 |

---

## Phase 0.1 — Repo Git initial

### Task 1: Initialiser git + déplacer le xls + .gitignore

**Files:**
- Create: `.gitignore`, `.gitattributes`, `reference/` (dossier)
- Move: `Budget prévisionnel.xls` → `reference/Budget prévisionnel.xls`
- Delete: `node_modules/`, `package.json`, `package-lock.json` (seront recréés en 0.2)

- [ ] **Step 1: Initialiser git**

```bash
git init
git config core.autocrlf input
```

- [ ] **Step 2: Déplacer le fichier Excel**

```bash
mkdir -p reference
mv "Budget prévisionnel.xls" "reference/Budget prévisionnel.xls"
```

- [ ] **Step 3: Supprimer les artefacts shadcn préinstallés**

```bash
rm -rf node_modules package.json package-lock.json
```

- [ ] **Step 4: Écrire `.gitignore`**

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/

# Testing
coverage/
.nyc_output/
playwright-report/
test-results/
.playwright/

# Env
.env
.env.local
.env*.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Logs
npm-debug.log*
yarn-debug.log*
*.log

# Supabase local
supabase/.branches/
supabase/.temp/
```

- [ ] **Step 5: Écrire `.gitattributes`**

```
* text=auto eol=lf
*.xls binary
*.xlsx binary
```

- [ ] **Step 6: Premier commit**

```bash
git add .gitignore .gitattributes reference/ .mcp.json docs/
git commit -m "chore: initialize repo with spec, plan and Excel reference"
```

Expected: commit créé avec ~5 fichiers stagés.

---

## Phase 0.2 — Next.js + Tailwind init

### Task 2: Initialiser le projet Next.js 15

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tailwind.config.ts` (Tailwind v4 utilise CSS principalement, mais on garde un placeholder)
- Modify: `.gitignore` (ajouter `.next/` si pas déjà fait)

- [ ] **Step 1: Lancer create-next-app non-interactif**

```bash
npx --yes create-next-app@15 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --turbopack --use-npm
```

Expected: `package.json`, `tsconfig.json`, `app/page.tsx` etc. créés. Si l'outil refuse à cause de fichiers existants (.gitignore, .gitattributes, reference/, docs/, .mcp.json), réponse interactive `Y` pour overwrite — vu qu'on utilise `--yes`, ça devrait passer ; sinon, exécuter avec `--force` (si supporté) ou recréer manuellement le `.gitignore` après.

- [ ] **Step 2: Vérifier que le serveur démarre**

```bash
npm run dev -- --port 3000
```

Expected: `Ready in Xs` sur http://localhost:3000. Tuer ensuite le process (Ctrl+C ou `taskkill /F /IM node.exe` si bloqué).

- [ ] **Step 3: Confirmer TypeScript strict**

Lire `tsconfig.json` et confirmer `"strict": true`. Si manquant, ajouter.

- [ ] **Step 4: Réappliquer notre `.gitignore` si écrasé**

Vérifier `.gitignore` contient bien les blocs de Task 1 Step 4. Si `create-next-app` l'a remplacé par sa version, remerger : conserver les blocs Next.js et ajouter les blocs Playwright/Supabase qu'on avait.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 with TS strict and Tailwind v4"
```

### Task 3: Nettoyer le hello world Next.js

**Files:**
- Modify: `app/page.tsx` (vider, sera remplacé en 0.8)
- Modify: `app/globals.css` (garder Tailwind imports seulement)

- [ ] **Step 1: Réécrire `app/page.tsx`**

```tsx
export default function HomePage() {
  return <main className="p-8 font-sans">Budget app — initialisation</main>;
}
```

- [ ] **Step 2: Vérifier visuel**

```bash
npm run dev
```
Naviguer http://localhost:3000, voir le texte. Tuer le process.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "chore: replace boilerplate home page"
```

---

## Phase 0.3 — Quality gates (Vitest + Playwright)

### Task 4: Installer & configurer Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/unit/example.test.ts`
- Modify: `package.json` (ajout scripts test)

- [ ] **Step 1: Installer dépendances**

```bash
npm install --save-dev vitest @vitest/ui @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Écrire `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Écrire `tests/unit/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Écrire test failing**

```ts
// tests/unit/example.test.ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("should add numbers", () => {
    expect(1 + 1).toBe(3);
  });
});
```

- [ ] **Step 5: Ajouter scripts dans `package.json`**

Dans `"scripts"` :
```json
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```

- [ ] **Step 6: Lancer test pour confirmer le FAIL**

```bash
npm run test:unit
```

Expected: 1 failed assertion, message `expected 2 to be 3`.

- [ ] **Step 7: Corriger le test**

```ts
expect(1 + 1).toBe(2);
```

- [ ] **Step 8: Lancer test pour confirmer le PASS**

```bash
npm run test:unit
```

Expected: 1 passed.

- [ ] **Step 9: Commit**

```bash
git add tests/unit vitest.config.ts package.json package-lock.json
git commit -m "feat: setup Vitest with example test"
```

### Task 5: Installer & configurer Playwright

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (scripts E2E)

- [ ] **Step 1: Installer Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: navigateur Chromium téléchargé sous `~/.cache/ms-playwright/`.

- [ ] **Step 2: Écrire `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Écrire smoke test**

```ts
// tests/e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toContainText("Budget app");
});
```

- [ ] **Step 4: Ajouter scripts**

Dans `package.json` :
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 5: Lancer test pour confirmer PASS**

```bash
npm run test:e2e
```

Expected: 1 passed (le serveur dev démarre automatiquement).

- [ ] **Step 6: Commit**

```bash
git add tests/e2e playwright.config.ts package.json package-lock.json
git commit -m "feat: setup Playwright with smoke test"
```

---

## Phase 0.4 — shadcn/ui init

### Task 6: Initialiser shadcn

**Files:**
- Create: `components.json`, `lib/utils.ts`, `components/ui/*` (générés par CLI)
- Modify: `app/globals.css` (variables CSS shadcn)

- [ ] **Step 1: Lancer init shadcn**

```bash
npx --yes shadcn@latest init -d
```

Expected: génère `components.json`, `lib/utils.ts` (avec `cn()`), variables CSS dans `app/globals.css`. Le flag `-d` accepte les défauts (style: new-york, base color: zinc, CSS variables: yes).

- [ ] **Step 2: Installer composants requis pour J0+J1**

```bash
npx --yes shadcn@latest add button input label card sidebar sheet dialog dropdown-menu separator skeleton toast
```

Expected: fichiers créés dans `components/ui/`.

- [ ] **Step 3: Sanity check — utiliser un Button dans la home**

Modifier `app/page.tsx` :
```tsx
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="p-8 font-sans">
      <h1 className="text-2xl font-bold">Budget app — initialisation</h1>
      <Button className="mt-4">Test shadcn</Button>
    </main>
  );
}
```

- [ ] **Step 4: Lancer test E2E pour vérifier**

Mettre à jour `tests/e2e/smoke.spec.ts` :
```ts
import { test, expect } from "@playwright/test";

test("home page renders with shadcn button", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Budget app");
  await expect(page.getByRole("button", { name: "Test shadcn" })).toBeVisible();
});
```

```bash
npm run test:e2e
```

Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add components.json components/ui lib/utils.ts app/globals.css app/page.tsx tests/e2e/smoke.spec.ts package.json package-lock.json
git commit -m "feat: initialize shadcn/ui with base components"
```

---

## Phase 0.5 — Supabase project & DB schema

### Task 7: Authentifier le MCP Supabase et créer le projet

**Files:** aucun fichier modifié à cette étape (interaction MCP).

- [ ] **Step 1: Lancer authentification Supabase**

Utiliser l'outil MCP : `mcp__plugin_supabase_supabase__authenticate`.

Expected: URL d'auth retournée. L'utilisateur ouvre l'URL dans son navigateur, complète l'auth, retourne le code à Claude.

- [ ] **Step 2: Compléter authentification**

Utiliser `mcp__plugin_supabase_supabase__complete_authentication` avec le code retourné.

Expected: connexion confirmée.

- [ ] **Step 3: Créer le projet Supabase**

Utiliser le MCP pour créer un projet nommé `budget-app-prod` (ou similaire). Région : Europe (probablement `eu-central-1` ou `eu-west-1`).

Expected: projet créé, URL + anon key + service_role key disponibles.

- [ ] **Step 4: Récupérer les credentials**

Demander au MCP les credentials du projet et les noter pour Phase 0.6 (.env.local).

**Note:** PAS de commit ici — pas de fichier modifié.

### Task 8: Migration initiale — schéma DB complet

**Files:**
- Create: `supabase/migrations/20260425000001_initial_schema.sql`

- [ ] **Step 1: Écrire la migration**

```sql
-- supabase/migrations/20260425000001_initial_schema.sql

-- profiles : extension de auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

-- categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- current_accounts
create table public.current_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text,
  position int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- savings_accounts
create table public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  is_locked boolean not null default false,
  color text,
  position int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- savings_goals (1-1 avec savings_accounts)
create table public.savings_goals (
  savings_account_id uuid primary key references public.savings_accounts(id) on delete cascade,
  target_date date,
  target_amount numeric(14,2),
  monthly_contribution numeric(14,2),
  updated_at timestamptz not null default now()
);

-- budget_post_templates
create table public.budget_post_templates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  default_account_id uuid references public.current_accounts(id) on delete set null,
  default_kind text not null check (default_kind in ('credit','debit')),
  category_id uuid references public.categories(id) on delete set null,
  end_date date,
  position int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- months
create table public.months (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  kind text not null check (kind in ('real','scenario')),
  parent_month_id uuid references public.months(id) on delete set null,
  label text,
  notes text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  -- un seul mois 'real' par profile + year + month
  constraint months_real_unique unique (profile_id, year, month, kind),
  -- parent_month_id n'est autorisé que pour les scenarios
  constraint months_parent_only_for_scenario check (
    (kind = 'scenario') or (parent_month_id is null)
  )
);

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('location','travaux','etudes_enfants','achat','autre')),
  status text not null default 'active' check (status in ('active','archived')),
  start_date date not null,
  end_date date,
  auto_inject_account_id uuid references public.current_accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

-- project_entries
create table public.project_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  kind text not null check (kind in ('credit','debit')),
  amount numeric(14,2) not null,
  occurred_on date not null,
  recurring_monthly boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- monthly_entries
create table public.monthly_entries (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months(id) on delete cascade,
  post_template_id uuid references public.budget_post_templates(id) on delete set null,
  account_id uuid not null references public.current_accounts(id) on delete restrict,
  kind text not null check (kind in ('credit','debit')),
  amount numeric(14,2) not null default 0,
  linked_savings_account_id uuid references public.savings_accounts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  -- linked_savings_account_id et project_id mutuellement exclusifs
  constraint entries_savings_xor_project check (
    not (linked_savings_account_id is not null and project_id is not null)
  )
);

-- savings_balances : solde mensuel par compte
create table public.savings_balances (
  savings_account_id uuid not null references public.savings_accounts(id) on delete cascade,
  month_id uuid not null references public.months(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (savings_account_id, month_id)
);

-- Indexes utiles
create index idx_current_accounts_profile on public.current_accounts(profile_id) where archived_at is null;
create index idx_savings_accounts_profile on public.savings_accounts(profile_id) where archived_at is null;
create index idx_post_templates_profile on public.budget_post_templates(profile_id) where archived_at is null;
create index idx_months_profile_kind on public.months(profile_id, kind, year desc, month desc);
create index idx_monthly_entries_month on public.monthly_entries(month_id);
create index idx_project_entries_project on public.project_entries(project_id);
create index idx_savings_balances_account on public.savings_balances(savings_account_id);
```

- [ ] **Step 2: Appliquer la migration via MCP**

Utiliser l'outil MCP Supabase pour appliquer le SQL ci-dessus au projet créé. Si le MCP a une commande dédiée (apply_migration ou run_sql), l'utiliser. Sinon, copier le SQL dans le SQL Editor de la console Supabase.

Expected: aucune erreur, toutes les tables créées.

- [ ] **Step 3: Vérification**

Via MCP, lister les tables du schéma `public`. Confirmer la présence de : profiles, categories, current_accounts, savings_accounts, savings_goals, budget_post_templates, months, projects, project_entries, monthly_entries, savings_balances.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260425000001_initial_schema.sql
git commit -m "feat(db): initial schema with all entities and constraints"
```

### Task 9: Migration RLS — policies de sécurité

**Files:**
- Create: `supabase/migrations/20260425000002_rls_policies.sql`

- [ ] **Step 1: Écrire la migration RLS**

```sql
-- supabase/migrations/20260425000002_rls_policies.sql

-- Activer RLS sur toutes les tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.current_accounts enable row level security;
alter table public.savings_accounts enable row level security;
alter table public.savings_goals enable row level security;
alter table public.budget_post_templates enable row level security;
alter table public.months enable row level security;
alter table public.projects enable row level security;
alter table public.project_entries enable row level security;
alter table public.monthly_entries enable row level security;
alter table public.savings_balances enable row level security;

-- Policy générique : un user ne voit que ses propres données via profile_id
-- Pattern : "owner_only" appliqué partout

-- profiles : id = auth.uid()
create policy "profiles_owner_select" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_owner_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_owner_insert" on public.profiles
  for insert with check (id = auth.uid());

-- Helper : tables avec colonne profile_id
-- on duplique la policy pour chaque table (verbose mais explicite)

-- categories
create policy "categories_owner_all" on public.categories
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- current_accounts
create policy "current_accounts_owner_all" on public.current_accounts
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- savings_accounts
create policy "savings_accounts_owner_all" on public.savings_accounts
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- savings_goals : indirect via savings_accounts
create policy "savings_goals_owner_all" on public.savings_goals
  for all using (
    exists (
      select 1 from public.savings_accounts sa
      where sa.id = savings_goals.savings_account_id and sa.profile_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.savings_accounts sa
      where sa.id = savings_goals.savings_account_id and sa.profile_id = auth.uid()
    )
  );

-- budget_post_templates
create policy "budget_post_templates_owner_all" on public.budget_post_templates
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- months
create policy "months_owner_all" on public.months
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- projects
create policy "projects_owner_all" on public.projects
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- project_entries : indirect via projects
create policy "project_entries_owner_all" on public.project_entries
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_entries.project_id and p.profile_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = project_entries.project_id and p.profile_id = auth.uid()
    )
  );

-- monthly_entries : indirect via months
create policy "monthly_entries_owner_all" on public.monthly_entries
  for all using (
    exists (
      select 1 from public.months m
      where m.id = monthly_entries.month_id and m.profile_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.months m
      where m.id = monthly_entries.month_id and m.profile_id = auth.uid()
    )
  );

-- savings_balances : indirect via savings_accounts
create policy "savings_balances_owner_all" on public.savings_balances
  for all using (
    exists (
      select 1 from public.savings_accounts sa
      where sa.id = savings_balances.savings_account_id and sa.profile_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.savings_accounts sa
      where sa.id = savings_balances.savings_account_id and sa.profile_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Appliquer via MCP**

Idem Task 8 Step 2.

Expected: aucune erreur. RLS activée sur toutes les tables.

- [ ] **Step 3: Sanity check**

Via MCP, exécuter :
```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

Expected: `rowsecurity = true` pour chaque table listée.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260425000002_rls_policies.sql
git commit -m "feat(db): RLS policies for all tables (owner-only)"
```

### Task 10: Trigger auto-création profile à l'inscription

**Files:**
- Create: `supabase/migrations/20260425000003_triggers.sql`

- [ ] **Step 1: Écrire le trigger**

```sql
-- supabase/migrations/20260425000003_triggers.sql

-- Quand un nouvel auth.users est créé, créer automatiquement un profile lié
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Appliquer via MCP**

Expected: trigger créé sans erreur.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260425000003_triggers.sql
git commit -m "feat(db): auto-create profile on auth user signup"
```

---

## Phase 0.6 — Supabase clients + env

### Task 11: Configurer les variables d'env

**Files:**
- Create: `.env.example`, `.env.local`

- [ ] **Step 1: Écrire `.env.example`**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
# Service role key — uniquement utilisée côté serveur, jamais exposée au client
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

- [ ] **Step 2: Écrire `.env.local`** (avec les vraies valeurs récupérées Task 7)

```bash
NEXT_PUBLIC_SUPABASE_URL=<url réelle>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key réelle>
SUPABASE_SERVICE_ROLE_KEY=<service role réelle>
```

⚠ Vérifier que `.env.local` est bien dans `.gitignore` (déjà ajouté Task 1).

- [ ] **Step 3: Commit (uniquement .env.example)**

```bash
git add .env.example
git commit -m "chore: add env vars template"
```

### Task 12: Installer & créer les clients Supabase

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `lib/database.types.ts`

- [ ] **Step 1: Installer dépendances**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Générer les types TypeScript depuis le schéma DB**

Via MCP Supabase ou commande :
```bash
npx --yes supabase@latest gen types typescript --project-id <PROJECT_ID> > lib/database.types.ts
```

Si la CLI Supabase n'est pas dispo, utiliser le MCP qui a souvent une commande équivalente. Sinon, écrire un type minimal manuellement à étoffer plus tard :

```ts
// lib/database.types.ts (placeholder à régénérer plus tard)
export type Database = {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
    }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
```

- [ ] **Step 3: Écrire `lib/supabase/client.ts` (browser)**

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: Écrire `lib/supabase/server.ts` (RSC, Server Action)**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // RSC : ignorer (cookies en lecture seule)
          }
        },
      },
    },
  );
}
```

- [ ] **Step 5: Écrire `lib/supabase/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Routes publiques : login + auth callback
  const isPublic =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase lib/database.types.ts package.json package-lock.json
git commit -m "feat(supabase): browser, server, middleware clients with typed database"
```

---

## Phase 0.7 — Auth flow

### Task 13: Middleware Next.js (auth check sur toutes les routes)

**Files:**
- Create: `middleware.ts` (à la racine)

- [ ] **Step 1: Écrire le middleware**

```ts
// middleware.ts (racine)
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Test E2E — accès à `/` redirige vers `/login`**

Mettre à jour `tests/e2e/smoke.spec.ts` :
```ts
import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
```

```bash
npm run test:e2e
```

Expected: PASS — redirection visible.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts tests/e2e/smoke.spec.ts
git commit -m "feat(auth): middleware redirects unauthenticated users to login"
```

### Task 14: Page de login (magic link)

**Files:**
- Create: `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/login/login-form.tsx`, `lib/actions/auth.ts`

- [ ] **Step 1: Écrire layout auth**

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
```

- [ ] **Step 2: Écrire Server Action `signInWithMagicLink`**

```ts
// lib/actions/auth.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const SignInSchema = z.object({ email: z.string().email() });

export type SignInResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signInWithMagicLink(formData: FormData): Promise<SignInResult> {
  const parsed = SignInSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Email invalide" };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
```

- [ ] **Step 3: Écrire le composant client `LoginForm`**

```tsx
// app/(auth)/login/login-form.tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithMagicLink, type SignInResult } from "@/lib/actions/auth";

const initialState: SignInResult | null = null;

async function action(_: SignInResult | null, formData: FormData) {
  return await signInWithMagicLink(formData);
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Envoi…" : "Recevoir un lien magique"}
      </Button>
      {state?.ok === true && (
        <p className="text-sm text-green-600">Lien envoyé. Vérifie ta boîte mail.</p>
      )}
      {state?.ok === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Écrire la page**

```tsx
// app/(auth)/login/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Reçois un lien magique pour te connecter.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Test unitaire de la validation Zod**

```ts
// tests/unit/actions/auth.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";

const SignInSchema = z.object({ email: z.string().email() });

describe("SignInSchema", () => {
  it("accepts valid email", () => {
    expect(SignInSchema.safeParse({ email: "x@y.com" }).success).toBe(true);
  });
  it("rejects empty", () => {
    expect(SignInSchema.safeParse({ email: "" }).success).toBe(false);
  });
  it("rejects malformed", () => {
    expect(SignInSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
```

```bash
npm run test:unit
```

Expected: 3 passed.

- [ ] **Step 6: Test E2E — formulaire login affiché**

Mettre à jour `tests/e2e/smoke.spec.ts` :
```ts
import { test, expect } from "@playwright/test";

test("login page displays form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: /lien magique/i })).toBeVisible();
});

test("invalid email shows error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("notanemail");
  // HTML5 validation l'empêche de soumettre, mais on vérifie l'état
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
});
```

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/\(auth\) lib/actions tests
git commit -m "feat(auth): magic link login form with Server Action"
```

### Task 15: Auth callback handler

**Files:**
- Create: `app/(auth)/auth/callback/route.ts`

- [ ] **Step 1: Écrire le handler**

```ts
// app/(auth)/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${url.origin}${next}`);
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/auth
git commit -m "feat(auth): callback exchanges code for session"
```

---

## Phase 0.8 — App shell (sidebar + header + stubs)

### Task 16: Sidebar component

**Files:**
- Create: `components/layout/sidebar.tsx`

- [ ] **Step 1: Écrire la sidebar**

```tsx
// components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Wallet, PiggyBank, FolderKanban, GitBranch, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/savings", label: "Épargne", icon: PiggyBank },
  { href: "/projects", label: "Projets", icon: FolderKanban },
  { href: "/scenarios", label: "Scénarios", icon: GitBranch },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="px-2 py-1 text-lg font-semibold">Budget app</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/sidebar.tsx
git commit -m "feat(layout): app sidebar with 5 main entries + settings"
```

### Task 17: Header component

**Files:**
- Create: `components/layout/header.tsx`, `lib/actions/auth.ts` (modify : ajouter signOut)

- [ ] **Step 1: Ajouter `signOut` dans `lib/actions/auth.ts`**

Après les exports existants :
```ts
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
```

- [ ] **Step 2: Écrire le header**

```tsx
// components/layout/header.tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

export function AppHeader({ userEmail }: { userEmail: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{userEmail}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userEmail}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/header.tsx lib/actions/auth.ts
git commit -m "feat(layout): app header with user menu and sign out"
```

### Task 18: Layout principal `(app)` + page stubs

**Files:**
- Create: `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `app/(app)/budget/page.tsx`, `app/(app)/savings/page.tsx`, `app/(app)/projects/page.tsx`, `app/(app)/scenarios/page.tsx`, `app/(app)/settings/page.tsx`
- Modify: `app/page.tsx` (à supprimer car `(app)/page.tsx` prend le relais)

- [ ] **Step 1: Supprimer la home root**

```bash
rm app/page.tsx
```

- [ ] **Step 2: Écrire le layout `(app)/layout.tsx`**

```tsx
// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader userEmail={user.email ?? ""} />
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 3: Écrire les stubs**

`app/(app)/page.tsx` :
```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Bientôt disponible (J4).</p>
    </div>
  );
}
```

`app/(app)/budget/page.tsx` :
```tsx
export default function BudgetPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Budget mensuel</h1>
      <p className="mt-2 text-muted-foreground">Bientôt disponible (J2).</p>
    </div>
  );
}
```

`app/(app)/savings/page.tsx` :
```tsx
export default function SavingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Épargne</h1>
      <p className="mt-2 text-muted-foreground">Bientôt disponible (J3).</p>
    </div>
  );
}
```

`app/(app)/projects/page.tsx` :
```tsx
export default function ProjectsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Projets</h1>
      <p className="mt-2 text-muted-foreground">Bientôt disponible (J5).</p>
    </div>
  );
}
```

`app/(app)/scenarios/page.tsx` :
```tsx
export default function ScenariosPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Scénarios</h1>
      <p className="mt-2 text-muted-foreground">Bientôt disponible (J6).</p>
    </div>
  );
}
```

`app/(app)/settings/page.tsx` :
```tsx
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Paramètres</h1>
      <p className="mt-2 text-muted-foreground">Bientôt disponible (J1).</p>
    </div>
  );
}
```

- [ ] **Step 4: Type-check + lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)
git commit -m "feat(layout): app shell with sidebar, header and route stubs"
```

---

## Phase 0.9 — Tests E2E + RLS isolation

### Task 19: Test E2E auth flow complet (avec session injectée)

Ce test contourne le magic link en injectant directement une session via service_role (uniquement en environnement test).

**Files:**
- Create: `tests/e2e/auth.spec.ts`, `tests/e2e/helpers/test-user.ts`
- Modify: `playwright.config.ts` (ajouter env vars test)

- [ ] **Step 1: Écrire helper de création d'user de test**

```ts
// tests/e2e/helpers/test-user.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function createTestUser(emailPrefix: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) throw new Error("Missing Supabase env vars");

  const admin = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `${emailPrefix}+${Date.now()}@example.test`;
  const password = `pwd_${Date.now()}_!Aa1`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("Failed to create test user");

  return { id: data.user.id, email, password, admin };
}

export async function deleteTestUser(adminClient: ReturnType<typeof createClient>, userId: string) {
  await adminClient.auth.admin.deleteUser(userId);
}
```

- [ ] **Step 2: Écrire le test E2E**

```ts
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/test-user";

test.describe("Auth flow", () => {
  test("user can sign in with password and reach dashboard", async ({ page }) => {
    const user = await createTestUser("auth-test");

    try {
      // Direct sign-in via password (contourne magic link en test)
      await page.goto("/login");

      // En test, on injecte la session via une route admin éphémère.
      // Plus simple : faire signInWithPassword directement côté test.
      await page.evaluate(async ({ url, anon, email, password }) => {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const sb = createClient(url, anon, {
          auth: { persistSession: true, storageKey: "sb-test", flowType: "pkce" },
        });
        await sb.auth.signInWithPassword({ email, password });
      }, {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        email: user.email,
        password: user.password,
      });

      await page.goto("/");
      await expect(page.locator("h1")).toContainText("Dashboard");
    } finally {
      await deleteTestUser(user.admin, user.id);
    }
  });
});
```

⚠ Note pratique : l'approche `evaluate` ci-dessus est fragile car la lib supabase doit s'enregistrer dans le même cookie store que celui lu par le middleware Next.js (qui utilise `@supabase/ssr`, pas `supabase-js` direct côté browser). **Approche plus robuste retenue** : créer une route API de test `/api/test/login` (active uniquement en `NODE_ENV=test`) qui appelle `supabase.auth.admin.createSession` ou `setSession` côté serveur et set le cookie httpOnly correctement. **Implémenter cette route de test au Step suivant.**

- [ ] **Step 3: Créer route de test pour login programmatique**

```ts
// app/(auth)/auth/test-login/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Sécurité : disponible uniquement en dev/test
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const { email, password } = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? "no session" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Réécrire le test E2E avec la route**

```ts
// tests/e2e/auth.spec.ts (réécrit)
import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/test-user";

test.describe("Auth flow", () => {
  test("user can sign in and reach dashboard", async ({ page, request }) => {
    const user = await createTestUser("auth");

    try {
      const res = await request.post("/auth/test-login", {
        data: { email: user.email, password: user.password },
      });
      expect(res.ok()).toBe(true);

      await page.goto("/");
      await expect(page.locator("h1")).toContainText("Dashboard");

      // Test logout
      await page.getByRole("button", { name: user.email }).click();
      await page.getByRole("menuitem", { name: /déconnecter/i }).click();
      await expect(page).toHaveURL(/\/login$/);
    } finally {
      await deleteTestUser(user.admin, user.id);
    }
  });

  test("unauthenticated user cannot access dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});
```

- [ ] **Step 5: Lancer test, confirmer PASS**

```bash
npm run test:e2e -- auth.spec.ts
```

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/auth.spec.ts tests/e2e/helpers app/\(auth\)/auth/test-login
git commit -m "test(e2e): auth flow with test login route"
```

### Task 20: Test RLS isolation entre 2 users

**Files:**
- Create: `tests/unit/supabase-rls.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// tests/unit/supabase-rls.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient<Database>;
}

let userA: TestUser;
let userB: TestUser;
let admin: SupabaseClient<Database>;

async function makeUser(prefix: string): Promise<TestUser> {
  const email = `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const password = `pwd_${Date.now()}_!Aa1`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("createUser failed");

  const client = createClient<Database>(url, anon);
  const signInRes = await client.auth.signInWithPassword({ email, password });
  if (signInRes.error) throw signInRes.error;

  return { id: data.user.id, email, password, client };
}

describe("RLS isolation between users", () => {
  beforeAll(async () => {
    if (!url || !anon || !serviceKey) throw new Error("Missing env vars for RLS test");
    admin = createClient<Database>(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    userA = await makeUser("rls-a");
    userB = await makeUser("rls-b");
  }, 30_000);

  afterAll(async () => {
    if (userA) await admin.auth.admin.deleteUser(userA.id);
    if (userB) await admin.auth.admin.deleteUser(userB.id);
  }, 30_000);

  it("user A creates a current_account, user B cannot see it", async () => {
    const insert = await userA.client
      .from("current_accounts")
      .insert({ profile_id: userA.id, name: "A's account" })
      .select()
      .single();
    expect(insert.error).toBeNull();
    expect(insert.data?.name).toBe("A's account");

    const aRows = await userA.client.from("current_accounts").select("*");
    expect(aRows.data?.length).toBeGreaterThanOrEqual(1);

    const bRows = await userB.client.from("current_accounts").select("*");
    expect(bRows.error).toBeNull();
    expect(bRows.data?.find((r) => r.name === "A's account")).toBeUndefined();
  });

  it("user B cannot insert with userA's profile_id", async () => {
    const res = await userB.client
      .from("current_accounts")
      .insert({ profile_id: userA.id, name: "intrusion" });
    // Doit échouer (policy WITH CHECK)
    expect(res.error).not.toBeNull();
  });

  it("user A's profile is auto-created via trigger", async () => {
    const profile = await userA.client.from("profiles").select("*").eq("id", userA.id).single();
    expect(profile.error).toBeNull();
    expect(profile.data?.id).toBe(userA.id);
  });
});
```

- [ ] **Step 2: Lancer test**

```bash
npm run test:unit
```

Expected: 3 passed (en plus des autres tests).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/supabase-rls.test.ts
git commit -m "test(rls): verify isolation between users on current_accounts"
```

---

## Phase 0.10 — Documentation

### Task 21: README de setup local

**Files:**
- Create: `README.md`

- [ ] **Step 1: Écrire README**

````markdown
# Budget app

Application web de gestion budgétaire personnelle, inspirée d'un fichier Excel maison.

Voir le spec : [docs/superpowers/specs/2026-04-25-budget-app-design.md](./docs/superpowers/specs/2026-04-25-budget-app-design.md).

## Stack
- Next.js 15 (App Router, TS strict)
- Tailwind v4 + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- Vitest (unit) + Playwright (E2E)

## Setup local

### 1. Cloner & installer
```bash
git clone <repo>
cd "Budget app"
npm install
```

### 2. Configurer Supabase
1. Créer un projet sur [supabase.com](https://supabase.com).
2. Appliquer les migrations dans `supabase/migrations/` (via SQL Editor ou CLI).
3. Copier `.env.example` vers `.env.local` et renseigner les clés.

```bash
cp .env.example .env.local
# éditer .env.local
```

### 3. Lancer l'app
```bash
npm run dev
```
Ouvrir http://localhost:3000.

### 4. Lancer les tests
```bash
npm run test:unit       # Vitest
npm run test:e2e        # Playwright (lance le serveur dev automatiquement)
```

## Structure
```
app/                          Routes Next.js (App Router)
  (auth)/                     Login + callback
  (app)/                      Routes authentifiées (sidebar)
components/
  ui/                         Composants shadcn
  layout/                     Sidebar, header
lib/
  supabase/                   Clients browser/server/middleware
  actions/                    Server Actions
  database.types.ts           Types DB générés
supabase/
  migrations/                 SQL versionné
tests/
  unit/                       Vitest
  e2e/                        Playwright
docs/superpowers/
  specs/                      Design specs
  plans/                      Plans d'implémentation
reference/
  Budget prévisionnel.xls     Source d'inspiration (lecture seule)
```

## État du projet
- ✅ J0 — Setup, DB, Auth, Shell
- ⏳ J1 — Settings (CRUD comptes, postes, catégories)
- ⏳ J2-J7 — Voir [spec](./docs/superpowers/specs/2026-04-25-budget-app-design.md)
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

## Self-Review

**1. Spec coverage** — pour chaque section du spec, le J0 couvre-t-il ?

| Section spec | J0 task | Statut |
|---|---|---|
| 2.1 Tout nommable | Schema sans pré-remplissage (pas de seed) | ✅ |
| 2.2 Postes récurrents | Tables `budget_post_templates`, `monthly_entries` créées | ✅ |
| 2.3 Trois espaces | `months.kind`, `projects` créées | ✅ |
| 2.4 Épargne hybride | `monthly_entries.linked_savings_account_id`, `is_locked` | ✅ |
| 3 Stack | Next 15 + Supabase + shadcn + Vitest + Playwright | ✅ |
| 3.1 RLS | Migration 002 + test isolation Task 20 | ✅ |
| 4 Modèle DB | Migration 001 complète, contraintes incluses | ✅ |
| 4.1 Contraintes | `unique`, `check`, mutual exclusion implémentés | ✅ |
| 4.2 Triggers | Trigger `handle_new_user` ; le trigger épargne hybride sera implémenté en J3 (logique app d'abord, conformément au spec section 4.2) | ✅ partiel attendu |
| 5.1 Navigation | Sidebar + header + 5 routes stubs | ✅ |
| 5.2-5.7 UX pages | Stubs présents, contenu en J1-J7 | ✅ partiel attendu |
| 9 Risques RLS | Test isolation cross-user | ✅ |

Pas de gap pour le périmètre J0.

**2. Placeholder scan** — recherche de "TBD", "TODO", "implement later", code sans implementation, références non définies.

- Aucun TODO/TBD trouvé
- Tous les blocs de code sont complets (pas de `...`)
- Tous les types et fonctions référencés sont définis dans le plan ou la lib externe
- Une note "approche fragile" en Task 19 Step 2 est explicitement résolue dans Steps 3-4 par une route alternative.

**3. Type consistency** — vérifications croisées :

- `signInWithMagicLink` retourne `SignInResult` (Task 14 Step 2) — utilisé identiquement dans `LoginForm` (Task 14 Step 3) ✅
- `createClient()` côté server est `async` (Task 12 Step 4) — bien `await` partout (`(auth)/auth/callback`, layout, server action) ✅
- `Database` type importé partout via `@/lib/database.types` ✅
- Tables nommées identiquement entre migration 001 et types : `current_accounts`, `savings_accounts`, etc. ✅

**4. Risques identifiés à l'exécution :**

- Tailwind v4 a changé sa config par rapport à v3 — si `npm run build` échoue, vérifier `app/globals.css` contient `@import "tailwindcss";` au lieu des directives v3. Le `create-next-app@15` génère le bon format par défaut.
- shadcn `sidebar` requiert `cookie` package (auto-installé). Si erreur de build, run `npm install cookie`.
- `useActionState` requiert React 19 (Next.js 15 par défaut). Si error, downgrade vers `useFormState`.
- Sur Windows bash, les commandes `mv` et `rm` fonctionnent. Si problème, utiliser PowerShell équivalents (`Move-Item`, `Remove-Item`).

---

## Critère de fin de J0

- [ ] `npm run dev` ouvre http://localhost:3000
- [ ] Non connecté → redirige vers `/login`
- [ ] Saisie d'un email valide → "Lien envoyé" affiché
- [ ] Connecté (via test-login) → voit le shell avec sidebar 5 entrées + header
- [ ] Click sur chaque entrée navigue vers la page stub
- [ ] Click déconnexion → retour `/login`
- [ ] `npm run test:unit` → tous PASS (incluant 3 RLS tests)
- [ ] `npm run test:e2e` → tous PASS (incluant auth.spec.ts)
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] `npm run lint` → 0 erreur
- [ ] DB Supabase contient toutes les tables avec RLS activée

---

## Suite (hors-scope J0)

Après livraison J0 validée, lancer un nouveau cycle `brainstorming → writing-plans` pour **J1 — Settings** : CRUD comptes courants, comptes épargne, post templates, catégories, profil + bouton "Charger un template" opt-in.
