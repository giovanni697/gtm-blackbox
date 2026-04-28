-- ════════════════════════════════════════════════════════════════════
-- GTM BlackBox · Migration 001 · Init Schema
-- Data: 2026-04-26
-- Aplicar via: Supabase Dashboard → SQL Editor → New query → Run
-- Idempotente: pode ser rodado múltiplas vezes sem erro
-- ════════════════════════════════════════════════════════════════════

-- ─── Extensões necessárias ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════════════
-- 1. PROFILES — extensão de auth.users
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                     TEXT,
  empresa                  TEXT,
  cnpj                     TEXT,
  cargo                    TEXT,
  setor                    TEXT,

  -- Faturamento em BRL (ADR 0011 — canônico)
  faturamento_atual        TEXT CHECK (faturamento_atual IN ('ate_20M_brl', '20M_200M_brl', 'acima_200M_brl')),
  estagio                  TEXT CHECK (estagio IN ('ARMV', 'ARPE', 'ARE')),

  -- Multi-motion: array com [{modal, acv_brl, ciclo_dias, pct_arr}, ...]
  -- Soma de pct_arr deve = 100 (validado em app, não em SQL)
  motions                  JSONB DEFAULT '[]'::jsonb,

  tamanho_time_gtm         INT,

  diagnostico_concluido    BOOLEAN DEFAULT FALSE,
  forecast_concluido       BOOLEAN DEFAULT FALSE,

  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: cria profile automaticamente no signup (resolve §1.8 #4 do prompt master)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════
-- 2. DIAGNOSTICOS — resultado completo de uma sessão de diagnóstico
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.diagnosticos (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estagio                  TEXT CHECK (estagio IN ('ARMV', 'ARPE', 'ARE')),

  -- 5 Pilares (BlackBox) — taxonomia top-down (ADR 0003)
  -- P1 Arquitetura de Dados · P2 Metodologia Unificada · P3 Processos Padronizados
  -- P4 Stack Parametrizada · P5 Loop de Melhoria Contínua
  p1_nivel                 INT CHECK (p1_nivel BETWEEN 0 AND 3),
  p2_nivel                 INT CHECK (p2_nivel BETWEEN 0 AND 3),
  p3_nivel                 INT CHECK (p3_nivel BETWEEN 0 AND 3),
  p4_nivel                 INT CHECK (p4_nivel BETWEEN 0 AND 3),
  p5_nivel                 INT CHECK (p5_nivel BETWEEN 0 AND 3),

  -- Sub-camadas P1 (Arquitetura de Dados)
  p1_nomenclatura          INT CHECK (p1_nomenclatura BETWEEN 0 AND 3),
  p1_criterios             INT CHECK (p1_criterios BETWEEN 0 AND 3),
  p1_originacao            INT CHECK (p1_originacao BETWEEN 0 AND 3),
  p1_centralizacao         INT CHECK (p1_centralizacao BETWEEN 0 AND 3),
  p1_enriquecimento        INT CHECK (p1_enriquecimento BETWEEN 0 AND 3),

  -- TOC: pilar identificado como gargalo (1-5)
  gargalo_pilar            INT CHECK (gargalo_pilar BETWEEN 1 AND 5),
  score_total              INT,
  percentual_maturidade    DECIMAL(5,2),

  -- Gates de readiness
  ai_ready                 BOOLEAN DEFAULT FALSE,
  arpe_ready               BOOLEAN DEFAULT FALSE,
  are_ready                BOOLEAN DEFAULT FALSE,

  -- Reservado para v2 (ADR 0013 — gtm-brain export deferred)
  cs_health_proxy          DECIMAL(5,2),

  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_user ON public.diagnosticos(user_id);

-- ════════════════════════════════════════════════════════════════════
-- 3. CHECKLIST_RESPOSTAS — uma row por (diagnostico × pergunta)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.checklist_respostas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostico_id           UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,

  pilar                    INT CHECK (pilar BETWEEN 1 AND 5),
  subcamada                TEXT,                -- apenas P1 (nomenclatura/criterios/etc)

  -- ID estável da pergunta (ADR 0002 — vem do frontmatter Markdown)
  pergunta_id              TEXT NOT NULL,
  resposta                 TEXT CHECK (resposta IN ('sim', 'nao', 'parcial')),

  created_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (diagnostico_id, pergunta_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_diag ON public.checklist_respostas(diagnostico_id);
CREATE INDEX IF NOT EXISTS idx_checklist_user ON public.checklist_respostas(user_id);

-- ════════════════════════════════════════════════════════════════════
-- 4. ROADMAP_ITENS — ações priorizadas pela engine TOC
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.roadmap_itens (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostico_id           UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,

  pilar                    INT CHECK (pilar BETWEEN 1 AND 5),
  acao                     TEXT NOT NULL,
  descricao                TEXT,

  -- Cross-links para Módulo 1 (ebook) e Módulo 3 (templates)
  template_slug            TEXT,
  chapter_slug             TEXT,

  esforco                  TEXT,
  prioridade               INT,
  is_gargalo               BOOLEAN DEFAULT FALSE,
  sprint_sugerido          INT,

  status                   TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluido')),

  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_user ON public.roadmap_itens(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_diag ON public.roadmap_itens(diagnostico_id);

-- ════════════════════════════════════════════════════════════════════
-- 5. WIZARD_SESSIONS — autosave do progresso do diagnóstico
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.wizard_sessions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  pilar_atual              INT CHECK (pilar_atual BETWEEN 1 AND 5),
  respostas                JSONB DEFAULT '{}'::jsonb,

  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wizard_user ON public.wizard_sessions(user_id);

-- ════════════════════════════════════════════════════════════════════
-- 6. FORECAST_SESSIONS — Módulo 4: Capacity & Forecast (multi-motion)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.forecast_sessions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Inputs do wizard 7 blocos (Meta · Funil · Marketing · Pré · Vendas · CS · Constantes)
  inputs                   JSONB NOT NULL,

  -- Outputs calculados pela engine multi-motion
  outputs                  JSONB,
  capacity_verdict         JSONB,    -- { funcao × motion → status (sobra/ok/falta/critico) }
  hiring_plan              JSONB,    -- { actions[], viavel: bool }

  completed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_user ON public.forecast_sessions(user_id);

-- ════════════════════════════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY — habilitar em todas as tabelas
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_itens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wizard_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_sessions   ENABLE ROW LEVEL SECURITY;

-- Policies — cada usuário só vê/escreve seus próprios dados
DO $$ BEGIN
  -- profiles: id = auth.uid() (não user_id)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_insert_own' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  -- diagnosticos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'diagnosticos_own' AND tablename = 'diagnosticos') THEN
    CREATE POLICY "diagnosticos_own" ON public.diagnosticos FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- checklist_respostas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'checklist_own' AND tablename = 'checklist_respostas') THEN
    CREATE POLICY "checklist_own" ON public.checklist_respostas FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- roadmap_itens
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roadmap_own' AND tablename = 'roadmap_itens') THEN
    CREATE POLICY "roadmap_own" ON public.roadmap_itens FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- wizard_sessions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wizard_own' AND tablename = 'wizard_sessions') THEN
    CREATE POLICY "wizard_own" ON public.wizard_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- forecast_sessions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'forecast_own' AND tablename = 'forecast_sessions') THEN
    CREATE POLICY "forecast_own" ON public.forecast_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 8. UPDATED_AT triggers (mantém timestamp em sync automaticamente)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS wizard_sessions_updated_at ON public.wizard_sessions;
CREATE TRIGGER wizard_sessions_updated_at
  BEFORE UPDATE ON public.wizard_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS forecast_sessions_updated_at ON public.forecast_sessions;
CREATE TRIGGER forecast_sessions_updated_at
  BEFORE UPDATE ON public.forecast_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 001 aplicada.
-- Verificação rápida:
--   SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';
--   → esperado: pelo menos 6 (profiles, diagnosticos, checklist_respostas,
--     roadmap_itens, wizard_sessions, forecast_sessions)
--   SELECT proname FROM pg_proc WHERE proname IN ('handle_new_user', 'set_updated_at');
--   → esperado: 2 rows
--   SELECT COUNT(*) FROM pg_policies WHERE schemaname='public';
--   → esperado: pelo menos 8 policies
-- ════════════════════════════════════════════════════════════════════
