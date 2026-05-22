-- ============================================================
--  grana.ok — Supabase Schema
--  Execute no SQL Editor do Supabase (Project > SQL Editor)
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABELAS ─────────────────────────────────────────────────

-- Perfis de usuário (auto-criado pelo trigger abaixo)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT,
  name       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações (despesas + entradas extras)
CREATE TABLE IF NOT EXISTS public.transactions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id         TEXT,                          -- liga parcelas/fixo entre meses
  description      TEXT NOT NULL,
  bank             TEXT DEFAULT '',
  installment      TEXT DEFAULT '-',              -- '-', 'Fixo', '1/6', '2/6', ...
  amount           NUMERIC(12,2) NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('expense', 'extra')),
  month            SMALLINT NOT NULL,             -- 1-12
  year             SMALLINT NOT NULL,             -- ex: 2025
  transaction_date DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Regras de salário (histórico de reajustes)
CREATE TABLE IF NOT EXISTS public.salary_rules (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date_num   INTEGER NOT NULL,                    -- YYYYMM, ex: 202501
  amount     NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_rules ENABLE ROW LEVEL SECURITY;

-- Profiles: só o próprio usuário
CREATE POLICY "profiles_self" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Transactions: só o próprio usuário
CREATE POLICY "transactions_self" ON public.transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Salary rules: só o próprio usuário
CREATE POLICY "salary_rules_self" ON public.salary_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── ÍNDICES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tx_user_month
  ON public.transactions(user_id, year, month);

CREATE INDEX IF NOT EXISTS idx_tx_group
  ON public.transactions(group_id)
  WHERE group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_salary_user_date
  ON public.salary_rules(user_id, date_num);

-- ── TRIGGER: updated_at automático ──────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── TRIGGER: criar perfil no cadastro ───────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_name TEXT;
BEGIN
  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  INSERT INTO public.profiles(id, email, name)
  VALUES (NEW.id, NEW.email, raw_name)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
