-- ============================================================
--  grana.ok — Migração 003: Cartões (fechamento/vencimento) + Categorias
--  Execute no SQL Editor do Supabase (Project > SQL Editor).
--  Seguro para rodar em bancos já existentes (usa IF NOT EXISTS).
-- ============================================================

-- Categoria de cada lançamento (despesa ou entrada)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_tx_user_category
  ON public.transactions(user_id, category);

-- Cartões / contas cadastrados pelo usuário
CREATE TABLE IF NOT EXISTS public.cards (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,                 -- ex: Nubank, Inter, Mercado Pago
  closing_day SMALLINT CHECK (closing_day BETWEEN 1 AND 31),  -- dia de fechamento da fatura (NULL = débito/pix)
  due_day     SMALLINT CHECK (due_day BETWEEN 1 AND 31),      -- dia de vencimento
  color       TEXT DEFAULT '#8E8E93',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cards_self" ON public.cards;
CREATE POLICY "cards_self" ON public.cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cards_user ON public.cards(user_id);

DROP TRIGGER IF EXISTS trg_cards_updated ON public.cards;
CREATE TRIGGER trg_cards_updated
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
