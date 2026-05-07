-- docs/sql/2026-05-07-profiles-stripe-columns.sql
-- Cycle C1 : ajout des colonnes Stripe sur profiles.
-- Exécuter dans : Supabase Dashboard > SQL Editor.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"     text,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" text,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus"   text;

-- Index pour lookup rapide par stripeCustomerId (utilisé par le webhook)
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_idx
  ON profiles ("stripeCustomerId");
