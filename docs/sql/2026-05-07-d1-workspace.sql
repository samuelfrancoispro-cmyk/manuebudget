-- D1 Workspace : dashboard_pages + dashboard_widgets
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Pages du dashboard
CREATE TABLE IF NOT EXISTS dashboard_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL DEFAULT 'Accueil',
  "order" integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dashboard_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own pages"
  ON dashboard_pages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_pages_user_id ON dashboard_pages(user_id);

-- Widgets par page
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES dashboard_pages ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  widget_type text NOT NULL,
  col_span integer DEFAULT 1 CHECK (col_span IN (1, 2, 4)),
  row_span integer DEFAULT 1 CHECK (row_span IN (1, 2)),
  "order" integer DEFAULT 0,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own widgets"
  ON dashboard_widgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_page_id ON dashboard_widgets(page_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
