-- D2 Navigation : user_modules
-- À exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS user_modules (
  user_id      uuid REFERENCES auth.users NOT NULL,
  module_key   text NOT NULL,
  active       boolean DEFAULT false,
  activated_at timestamptz,
  PRIMARY KEY (user_id, module_key)
);

ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own modules"
  ON user_modules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_modules_user_id ON user_modules(user_id);
