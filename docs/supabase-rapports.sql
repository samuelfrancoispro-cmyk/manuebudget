-- ============================================================
-- Budget App — module Rapports CSV (analytique import banque)
-- À exécuter UNE FOIS dans Supabase → SQL Editor → Run
-- (additif, ne touche pas au schéma existant)
-- ============================================================

create table if not exists public.rapports_csv (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  "compteCourantId" uuid,
  nom text not null,
  mois text not null,
  "dateImport" timestamptz not null default now(),
  "fichierNom" text,
  "totalDebit" numeric not null default 0,
  "totalCredit" numeric not null default 0,
  "nbLignes" int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rapport_lignes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  "rapportId" uuid not null references public.rapports_csv(id) on delete cascade,
  date date not null,
  libelle text not null,
  "libelleOperation" text,
  "infosComplementaires" text,
  "typeOperation" text,
  categorie text,
  "sousCategorie" text,
  montant numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rap_user on public.rapports_csv(user_id);
create index if not exists idx_rap_compte on public.rapports_csv("compteCourantId");
create index if not exists idx_rapl_user on public.rapport_lignes(user_id);
create index if not exists idx_rapl_rap on public.rapport_lignes("rapportId");

alter table public.rapports_csv    enable row level security;
alter table public.rapport_lignes  enable row level security;

drop policy if exists "rap_select_own" on public.rapports_csv;
create policy "rap_select_own" on public.rapports_csv for select using (auth.uid() = user_id);
drop policy if exists "rap_insert_own" on public.rapports_csv;
create policy "rap_insert_own" on public.rapports_csv for insert with check (auth.uid() = user_id);
drop policy if exists "rap_update_own" on public.rapports_csv;
create policy "rap_update_own" on public.rapports_csv for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "rap_delete_own" on public.rapports_csv;
create policy "rap_delete_own" on public.rapports_csv for delete using (auth.uid() = user_id);

drop policy if exists "rapl_select_own" on public.rapport_lignes;
create policy "rapl_select_own" on public.rapport_lignes for select using (auth.uid() = user_id);
drop policy if exists "rapl_insert_own" on public.rapport_lignes;
create policy "rapl_insert_own" on public.rapport_lignes for insert with check (auth.uid() = user_id);
drop policy if exists "rapl_update_own" on public.rapport_lignes;
create policy "rapl_update_own" on public.rapport_lignes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "rapl_delete_own" on public.rapport_lignes;
create policy "rapl_delete_own" on public.rapport_lignes for delete using (auth.uid() = user_id);
