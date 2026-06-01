-- API Usage Log: registra cada chamada de IA feita pela plataforma
CREATE TABLE IF NOT EXISTS api_usage_log (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL,   -- 'diagnostico_run' | 'forecast_run' | 'roadmap_gen' | 'email_gen'
  model         TEXT,            -- 'gpt-4o' | 'claude-3-5-sonnet' | etc
  input_tokens  INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  cost_usd      NUMERIC(10, 6) DEFAULT 0,
  duration_ms   INT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX api_usage_log_user_idx ON api_usage_log (user_id);
CREATE INDEX api_usage_log_event_idx ON api_usage_log (event_type);
CREATE INDEX api_usage_log_created_idx ON api_usage_log (created_at DESC);

ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode ler/escrever
CREATE POLICY "service role only" ON api_usage_log USING (false);
