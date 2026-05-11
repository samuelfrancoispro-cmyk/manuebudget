-- ============================================================
-- W1 — Whiteboard Core — Migration Supabase
-- Runner : Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Supprimer tables obsolètes
DROP TABLE IF EXISTS "achatsProjet" CASCADE;
DROP TABLE IF EXISTS projets CASCADE;
DROP TABLE IF EXISTS "rapportLignes" CASCADE;
DROP TABLE IF EXISTS rapports CASCADE;
DROP TABLE IF EXISTS dashboard_widgets CASCADE;
DROP TABLE IF EXISTS dashboard_pages CASCADE;
DROP TABLE IF EXISTS "bankProfiles" CASCADE;
DROP TABLE IF EXISTS "virementsRecurrents" CASCADE;
DROP TABLE IF EXISTS actifs CASCADE;

-- 2. Modifier profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "firstName" text,
  ADD COLUMN IF NOT EXISTS "lastName"  text,
  ADD COLUMN IF NOT EXISTS country     text,
  ADD COLUMN IF NOT EXISTS "onboardingStep" integer DEFAULT 0;

-- 3. Créer whiteboard_sheets
CREATE TABLE IF NOT EXISTS whiteboard_sheets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users NOT NULL,
  name       text NOT NULL DEFAULT 'Ma sheet',
  "order"    integer DEFAULT 0,
  zoom       float DEFAULT 1,
  pan_x      float DEFAULT 0,
  pan_y      float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. Créer whiteboard_modules
CREATE TABLE IF NOT EXISTS whiteboard_modules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id   uuid REFERENCES whiteboard_sheets ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users NOT NULL,
  module_key text NOT NULL,
  x          float NOT NULL DEFAULT 0,
  y          float NOT NULL DEFAULT 0,
  w          float NOT NULL DEFAULT 320,
  h          float NOT NULL DEFAULT 240,
  config     jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 5. RLS
ALTER TABLE whiteboard_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sheets" ON whiteboard_sheets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own modules" ON whiteboard_modules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Index
CREATE INDEX IF NOT EXISTS idx_wb_sheets_user   ON whiteboard_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_modules_sheet ON whiteboard_modules(sheet_id);
CREATE INDEX IF NOT EXISTS idx_wb_modules_user  ON whiteboard_modules(user_id);
