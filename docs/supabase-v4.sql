-- ============================================================
-- Budget App — migration v4 (avril 2026)
-- À exécuter dans Supabase → SQL Editor → Run
-- IDEMPOTENTE : peut être relancée sans risque.
-- ============================================================
--
-- Apporte :
--  1. comptes_epargne : ajout colonne `type` (livret/assurance-vie/boursier/autre)
--  2. Nouvelle table `actifs_boursier` : positions boursières (ISIN, quantité, prix)
-- ============================================================

-- ---------- 1. Type de compte épargne ----------

alter table public.comptes_epargne
  add column if not exists type text
    check (type in ('livret','assurance-vie','boursier','autre'))
    default 'livret';

-- ---------- 2. Table `actifs_boursier` ----------

create table if not exists public.actifs_boursier (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  "compteId" uuid not null,
  nom text not null,
  isin text,
  quantite numeric not null check (quantite > 0),
  "prixAchat" numeric not null check ("prixAchat" >= 0),
  "dateAchat" date not null,
  "prixActuel" numeric,
  "dateMAJ" date,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ab_user on public.actifs_boursier(user_id);
create index if not exists idx_ab_compte on public.actifs_boursier("compteId");

alter table public.actifs_boursier enable row level security;

drop policy if exists "ab_select_own" on public.actifs_boursier;
create policy "ab_select_own" on public.actifs_boursier
  for select using (auth.uid() = user_id);

drop policy if exists "ab_insert_own" on public.actifs_boursier;
create policy "ab_insert_own" on public.actifs_boursier
  for insert with check (auth.uid() = user_id);

drop policy if exists "ab_update_own" on public.actifs_boursier;
create policy "ab_update_own" on public.actifs_boursier
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ab_delete_own" on public.actifs_boursier;
create policy "ab_delete_own" on public.actifs_boursier
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Fin migration v4
-- ============================================================
