-- content_edits: override layer para conteúdo MDX editado via admin
-- O filesystem continua como source of truth; este registro sobrescreve em runtime.
-- Aplicar: Supabase Dashboard → SQL Editor → Run

CREATE TABLE content_edits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Tipo de conteúdo: 'ebook' | 'template_description' | 'template_body' | 'template_rubrica'
  content_type  TEXT NOT NULL,
  -- Slug: '01-principios-edson-rigonatti', '01-arquitetura-de-dados', etc.
  slug          TEXT NOT NULL,
  -- Corpo markdown SEM frontmatter
  body          TEXT NOT NULL,
  -- Email de quem salvou
  updated_by    TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT content_edits_unique UNIQUE (content_type, slug)
);

ALTER TABLE content_edits ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode acessar (admin usa createServiceClient)
CREATE POLICY "no_client_access" ON content_edits
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE INDEX ON content_edits (content_type, slug);
