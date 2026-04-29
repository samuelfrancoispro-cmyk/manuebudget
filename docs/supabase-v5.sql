-- ============================================================
-- Budget App — migration v5 (avril 2026)
-- À exécuter dans Supabase → SQL Editor → Run
-- IDEMPOTENTE : peut être relancée sans risque.
-- ============================================================
--
-- Apporte le principe "date de référence" :
--  - Chaque compte a une date où son solde initial est constaté.
--  - Tout ce qui est antérieur ou égal à cette date = historique informatif (n'impacte pas le solde).
--  - Tout ce qui est postérieur = impacte le solde.
--
-- Plus : champ `fondEuros` pour les comptes boursiers (cash dispo / fond en euros du PEA).
-- ============================================================

-- ---------- 1. Comptes courants : dateReference ----------

alter table public.comptes_courants
  add column if not exists "dateReference" date;

-- ---------- 2. Comptes épargne : dateReference + fondEuros ----------

alter table public.comptes_epargne
  add column if not exists "dateReference" date;

alter table public.comptes_epargne
  add column if not exists "fondEuros" numeric;

-- ============================================================
-- Fin migration v5
-- ============================================================
