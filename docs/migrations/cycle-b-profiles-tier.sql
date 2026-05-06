-- Cycle B : ajout colonnes tier + trialEndsAt sur profiles
-- À exécuter manuellement dans Supabase Dashboard → SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'plus', 'pro'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "trialEndsAt" timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles (tier);
