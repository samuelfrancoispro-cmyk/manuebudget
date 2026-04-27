-- ============================================================
-- Budget App — schéma + RLS
-- À exécuter UNE SEULE FOIS dans Supabase → SQL Editor → Run
-- ============================================================

-- Extension uuid (généralement déjà active)
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  type text not null check (type in ('revenu','depense')),
  couleur text not null default '#94a3b8',
  created_at timestamptz not null default now()
);

create table if not exists public.comptes_courants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  type text not null check (type in ('perso','joint')) default 'perso',
  "soldeInitial" numeric not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('revenu','depense')),
  montant numeric not null,
  "categorieId" uuid,
  "compteCourantId" uuid,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.recurrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  libelle text not null,
  type text not null check (type in ('revenu','depense')),
  montant numeric not null,
  "categorieId" uuid,
  "compteCourantId" uuid,
  "jourMois" int not null check ("jourMois" between 1 and 28) default 1,
  "moisDebut" text not null,
  "moisFin" text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.comptes_epargne (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  "soldeInitial" numeric not null default 0,
  "tauxAnnuel" numeric not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.mouvements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  "compteId" uuid not null,
  date date not null,
  montant numeric not null,
  type text not null check (type in ('versement','retrait','interet')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.objectifs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  "montantCible" numeric not null,
  "dateCible" date,
  "compteId" uuid,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.projets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  "montantCible" numeric not null,
  "versementMensuel" numeric not null default 0,
  "apportInitial" numeric not null default 0,
  "tauxAnnuel" numeric not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.achats_projet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  "projetId" uuid not null references public.projets(id) on delete cascade,
  libelle text not null,
  montant numeric not null,
  date date not null,
  valide boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEX
-- ============================================================

create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists idx_cc_user on public.comptes_courants(user_id);
create index if not exists idx_tx_user on public.transactions(user_id);
create index if not exists idx_rec_user on public.recurrentes(user_id);
create index if not exists idx_ce_user on public.comptes_epargne(user_id);
create index if not exists idx_mvt_user on public.mouvements(user_id);
create index if not exists idx_obj_user on public.objectifs(user_id);
create index if not exists idx_proj_user on public.projets(user_id);
create index if not exists idx_ach_user on public.achats_projet(user_id);
create index if not exists idx_ach_projet on public.achats_projet("projetId");

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.categories         enable row level security;
alter table public.comptes_courants   enable row level security;
alter table public.transactions       enable row level security;
alter table public.recurrentes        enable row level security;
alter table public.comptes_epargne    enable row level security;
alter table public.mouvements         enable row level security;
alter table public.objectifs          enable row level security;
alter table public.projets            enable row level security;
alter table public.achats_projet      enable row level security;

-- Helper macro : on crée 4 policies par table (select/insert/update/delete)
-- Postgres ne supporte pas DRY, donc on duplique.

-- categories
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

-- comptes_courants
drop policy if exists "cc_select_own" on public.comptes_courants;
create policy "cc_select_own" on public.comptes_courants for select using (auth.uid() = user_id);
drop policy if exists "cc_insert_own" on public.comptes_courants;
create policy "cc_insert_own" on public.comptes_courants for insert with check (auth.uid() = user_id);
drop policy if exists "cc_update_own" on public.comptes_courants;
create policy "cc_update_own" on public.comptes_courants for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "cc_delete_own" on public.comptes_courants;
create policy "cc_delete_own" on public.comptes_courants for delete using (auth.uid() = user_id);

-- transactions
drop policy if exists "tx_select_own" on public.transactions;
create policy "tx_select_own" on public.transactions for select using (auth.uid() = user_id);
drop policy if exists "tx_insert_own" on public.transactions;
create policy "tx_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
drop policy if exists "tx_update_own" on public.transactions;
create policy "tx_update_own" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tx_delete_own" on public.transactions;
create policy "tx_delete_own" on public.transactions for delete using (auth.uid() = user_id);

-- recurrentes
drop policy if exists "rec_select_own" on public.recurrentes;
create policy "rec_select_own" on public.recurrentes for select using (auth.uid() = user_id);
drop policy if exists "rec_insert_own" on public.recurrentes;
create policy "rec_insert_own" on public.recurrentes for insert with check (auth.uid() = user_id);
drop policy if exists "rec_update_own" on public.recurrentes;
create policy "rec_update_own" on public.recurrentes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "rec_delete_own" on public.recurrentes;
create policy "rec_delete_own" on public.recurrentes for delete using (auth.uid() = user_id);

-- comptes_epargne
drop policy if exists "ce_select_own" on public.comptes_epargne;
create policy "ce_select_own" on public.comptes_epargne for select using (auth.uid() = user_id);
drop policy if exists "ce_insert_own" on public.comptes_epargne;
create policy "ce_insert_own" on public.comptes_epargne for insert with check (auth.uid() = user_id);
drop policy if exists "ce_update_own" on public.comptes_epargne;
create policy "ce_update_own" on public.comptes_epargne for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ce_delete_own" on public.comptes_epargne;
create policy "ce_delete_own" on public.comptes_epargne for delete using (auth.uid() = user_id);

-- mouvements
drop policy if exists "mvt_select_own" on public.mouvements;
create policy "mvt_select_own" on public.mouvements for select using (auth.uid() = user_id);
drop policy if exists "mvt_insert_own" on public.mouvements;
create policy "mvt_insert_own" on public.mouvements for insert with check (auth.uid() = user_id);
drop policy if exists "mvt_update_own" on public.mouvements;
create policy "mvt_update_own" on public.mouvements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "mvt_delete_own" on public.mouvements;
create policy "mvt_delete_own" on public.mouvements for delete using (auth.uid() = user_id);

-- objectifs
drop policy if exists "obj_select_own" on public.objectifs;
create policy "obj_select_own" on public.objectifs for select using (auth.uid() = user_id);
drop policy if exists "obj_insert_own" on public.objectifs;
create policy "obj_insert_own" on public.objectifs for insert with check (auth.uid() = user_id);
drop policy if exists "obj_update_own" on public.objectifs;
create policy "obj_update_own" on public.objectifs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "obj_delete_own" on public.objectifs;
create policy "obj_delete_own" on public.objectifs for delete using (auth.uid() = user_id);

-- projets
drop policy if exists "proj_select_own" on public.projets;
create policy "proj_select_own" on public.projets for select using (auth.uid() = user_id);
drop policy if exists "proj_insert_own" on public.projets;
create policy "proj_insert_own" on public.projets for insert with check (auth.uid() = user_id);
drop policy if exists "proj_update_own" on public.projets;
create policy "proj_update_own" on public.projets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "proj_delete_own" on public.projets;
create policy "proj_delete_own" on public.projets for delete using (auth.uid() = user_id);

-- achats_projet
drop policy if exists "ach_select_own" on public.achats_projet;
create policy "ach_select_own" on public.achats_projet for select using (auth.uid() = user_id);
drop policy if exists "ach_insert_own" on public.achats_projet;
create policy "ach_insert_own" on public.achats_projet for insert with check (auth.uid() = user_id);
drop policy if exists "ach_update_own" on public.achats_projet;
create policy "ach_update_own" on public.achats_projet for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ach_delete_own" on public.achats_projet;
create policy "ach_delete_own" on public.achats_projet for delete using (auth.uid() = user_id);
