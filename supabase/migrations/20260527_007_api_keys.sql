-- API Keys for agent access
CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Meu agente',
  key_hash     TEXT NOT NULL UNIQUE,           -- SHA-256 of the plain key
  key_prefix   TEXT NOT NULL,                  -- first 8 chars of plain key (for display)
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by hash
CREATE INDEX api_keys_hash_idx ON api_keys(key_hash);
CREATE INDEX api_keys_user_idx ON api_keys(user_id);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);
