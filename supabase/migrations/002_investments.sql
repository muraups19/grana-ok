-- ============================================================
--  grana.ok — Migração: Aba de Investimentos
--  Execute no SQL Editor do Supabase (Project > SQL Editor)
--  Seguro para rodar em bancos já existentes (usa IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.investments (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'outro'
                   CHECK (type IN ('renda_fixa','tesouro','acoes','fundos','fiis','cripto','outro')),
  broker           TEXT DEFAULT '',
  amount_invested  NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_value    NUMERIC(12,2) NOT NULL DEFAULT 0,
  invested_at      DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investments_self" ON public.investments;
CREATE POLICY "investments_self" ON public.investments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_investments_user
  ON public.investments(user_id);

DROP TRIGGER IF EXISTS trg_investments_updated ON public.investments;
CREATE TRIGGER trg_investments_updated
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
