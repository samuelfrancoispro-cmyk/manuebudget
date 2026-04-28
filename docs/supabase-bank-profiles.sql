-- ============================================================
-- Budget App — Profils de banque (mappings CSV sauvegardés)
-- À exécuter UNE FOIS dans Supabase → SQL Editor → Run
-- (additif, ne touche pas au schéma existant)
-- ============================================================

create table if not exists public.bank_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  fingerprint text not null,
  mapping jsonb not null,
  created_at timestamptz not null default now()
);

-- Un même fingerprint ne peut exister qu'une fois par utilisateur
-- (un format CSV donné = un seul profil)
create unique index if not exists uq_bank_profiles_user_fp
  on public.bank_profiles(user_id, fingerprint);

create index if not exists idx_bank_profiles_user
  on public.bank_profiles(user_id);

alter table public.bank_profiles enable row level security;

drop policy if exists "bp_select_own" on public.bank_profiles;
create policy "bp_select_own" on public.bank_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "bp_insert_own" on public.bank_profiles;
create policy "bp_insert_own" on public.bank_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "bp_update_own" on public.bank_profiles;
create policy "bp_update_own" on public.bank_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bp_delete_own" on public.bank_profiles;
create policy "bp_delete_own" on public.bank_profiles
  for delete using (auth.uid() = user_id);
