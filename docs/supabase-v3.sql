-- ============================================================
-- Budget App — migration v3 (avril 2026)
-- À exécuter dans Supabase → SQL Editor → Run
-- Cette migration est IDEMPOTENTE : tu peux la relancer sans risque.
-- ============================================================
--
-- Apporte :
--  1. Récurrents flexibles : fréquence (jour/semaine/mois/année) + intervalle
--     + dateDebut/dateFin (au lieu de jourMois/moisDebut/moisFin uniquement)
--  2. Nouvelle table `virements_recurrents` : virements automatiques
--     d'un compte courant vers un compte épargne (loyer-épargne, mise de côté…)
-- ============================================================

-- ---------- 1. Étendre `recurrentes` ----------

alter table public.recurrentes
  add column if not exists frequence text
    check (frequence in ('jour','semaine','mois','annee'))
    default 'mois';

alter table public.recurrentes
  add column if not exists intervalle int default 1
    check (intervalle >= 1);

alter table public.recurrentes
  add column if not exists "dateDebut" date;

alter table public.recurrentes
  add column if not exists "dateFin" date;

-- Backfill : pour les anciennes lignes (mois uniquement), reconstruire
-- une dateDebut depuis moisDebut + jourMois si dateDebut est null
update public.recurrentes
   set "dateDebut" = (
     ("moisDebut" || '-' || lpad("jourMois"::text, 2, '0'))::date
   )
 where "dateDebut" is null
   and "moisDebut" is not null;

-- Pareil pour dateFin (dernier jour du mois fin)
update public.recurrentes
   set "dateFin" = (
     ("moisFin" || '-' || lpad("jourMois"::text, 2, '0'))::date
   )
 where "dateFin" is null
   and "moisFin" is not null;

-- Les anciennes contraintes NOT NULL gênent désormais : on les relâche
alter table public.recurrentes
  alter column "jourMois" drop not null;

alter table public.recurrentes
  alter column "moisDebut" drop not null;

-- ---------- 2. Table `virements_recurrents` ----------

create table if not exists public.virements_recurrents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  libelle text not null,
  "compteCourantId" uuid not null,
  "compteEpargneId" uuid not null,
  montant numeric not null check (montant > 0),
  frequence text not null
    check (frequence in ('jour','semaine','mois','annee'))
    default 'mois',
  intervalle int not null default 1 check (intervalle >= 1),
  "dateDebut" date not null,
  "dateFin" date,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_vr_user on public.virements_recurrents(user_id);
create index if not exists idx_vr_cc on public.virements_recurrents("compteCourantId");
create index if not exists idx_vr_ce on public.virements_recurrents("compteEpargneId");

alter table public.virements_recurrents enable row level security;

drop policy if exists "vr_select_own" on public.virements_recurrents;
create policy "vr_select_own" on public.virements_recurrents
  for select using (auth.uid() = user_id);

drop policy if exists "vr_insert_own" on public.virements_recurrents;
create policy "vr_insert_own" on public.virements_recurrents
  for insert with check (auth.uid() = user_id);

drop policy if exists "vr_update_own" on public.virements_recurrents;
create policy "vr_update_own" on public.virements_recurrents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "vr_delete_own" on public.virements_recurrents;
create policy "vr_delete_own" on public.virements_recurrents
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Fin migration v3
-- ============================================================
