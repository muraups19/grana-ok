# 💰 grana.ok — Finanças Pessoais

App web de finanças pessoais migrado do Google Apps Script para **React + Vite + Supabase**.  
Cada usuário tem seus próprios dados, isolados por RLS no banco.

---

## Stack

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend     | React 18 + TypeScript + Vite        |
| Estilo       | Tailwind CSS + CSS Variables        |
| Animações    | Framer Motion                       |
| Ícones       | Lucide React                        |
| Auth + DB    | Supabase (PostgreSQL + RLS + OAuth) |
| Notificações | react-hot-toast                     |

---

## Pré-requisitos

- Node.js 18+ e npm 9+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Projeto no [Google Cloud Console](https://console.cloud.google.com) (para OAuth)

---

## 1 — Configurar o Supabase

### 1.1 Criar projeto
1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Escolha um nome, senha e região (preferencialmente São Paulo)

### 1.2 Executar o schema
1. No painel do Supabase: **SQL Editor → New query**
2. Cole todo o conteúdo de `supabase/schema.sql`
3. Clique em **Run** ▶

### 1.3 Configurar Google OAuth
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto (ou use um existente)
3. Menu → **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Tipo: **Web application**
5. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://SEU-DOMINIO.com
   ```
6. Authorized redirect URIs:
   ```
   https://SEU-PROJETO.supabase.co/auth/v1/callback
   ```
   > Substitua `SEU-PROJETO` pelo ID do seu projeto Supabase (visível na URL do painel)
7. Copie o **Client ID** e o **Client Secret**

8. De volta ao Supabase: **Authentication → Providers → Google**
9. Habilite o provider e cole Client ID + Client Secret
10. Salve

---

## 2 — Configurar o projeto local

```bash
# Clone ou copie a pasta grana-ok
cd grana-ok

# Instale dependências
npm install

# Copie o arquivo de variáveis
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:3000
```

> Encontre `SUPABASE_URL` e `ANON_KEY` em:  
> Supabase → **Project Settings → API → Project URL** e **anon public**

---

## 3 — Rodar em desenvolvimento

```bash
npm run dev
```

Acesse **http://localhost:3000**

---

## 4 — Build para produção

```bash
npm run build
# Arquivos gerados em /dist
```

### Deploy na Vercel (recomendado)
```bash
npm i -g vercel
vercel
```
Configure as variáveis de ambiente no painel da Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Após deploy, atualize os **Authorized redirect URIs** no Google Cloud Console com a URL de produção.

---

## Estrutura do projeto

```
grana-ok/
├── supabase/
│   └── schema.sql              # Tabelas, RLS, triggers, índices
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state + Google OAuth
│   ├── hooks/
│   │   └── useFinance.ts       # CRUD completo (Supabase)
│   ├── lib/
│   │   ├── supabase.ts         # Client Supabase
│   │   └── utils.ts            # Helpers (formatação, datas)
│   ├── pages/
│   │   ├── LoginPage.tsx       # Tela de login
│   │   └── DashboardPage.tsx   # Dashboard principal
│   ├── components/
│   │   ├── Header.tsx          # Header + navegação de mês
│   │   ├── SummaryCards.tsx    # Cards com animação de números
│   │   ├── TransactionItem.tsx # Item expansível
│   │   └── modals/
│   │       ├── Modal.tsx       # Wrapper de modal
│   │       ├── ExpenseModal.tsx # Lançar despesa (total/parcela/fixo)
│   │       ├── ExtraModal.tsx  # Lançar entrada extra
│   │       ├── SalaryModal.tsx # Reajuste de salário
│   │       └── EditModal.tsx   # Editar lançamento
│   ├── types/index.ts          # TypeScript types
│   ├── App.tsx                 # Router + auth guard
│   ├── main.tsx                # Entry point
│   └── index.css               # Design tokens + estilos globais
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Banco de dados

### Tabelas

| Tabela          | Descrição                                          |
|-----------------|----------------------------------------------------|
| `profiles`      | Perfil do usuário (criado via trigger no signup)   |
| `transactions`  | Todas as transações (despesas + extras)            |
| `salary_rules`  | Histórico de reajustes salariais                   |

### Segurança (RLS)
Todas as tabelas têm Row Level Security habilitado.  
Cada usuário só consegue ler e escrever seus próprios dados.

---

## Funcionalidades

- ✅ **Login com Google** via Supabase OAuth
- ✅ **Dashboard mensal** com resumo de saldo, receitas e despesas
- ✅ **Navegação de meses** com swipe no mobile
- ✅ **Despesas**: lançamento avulso, parcelado ou fixo mensal
- ✅ **Extras**: entradas além do salário (freelance, bônus, etc.)
- ✅ **Salário configurável** com histórico de reajustes
- ✅ **Sincronização**: propaga fixos/parcelados para meses futuros
- ✅ **Edição e exclusão** com controle inteligente (fixo = apaga deste mês em diante)
- ✅ **Busca** dentro das despesas do mês
- ✅ **Skeleton loading** e animações de número
- ✅ **Design responsivo** — mobile e desktop
- ✅ **Dados isolados por usuário** (RLS no Supabase)

---

## Solução de problemas

**"Variáveis VITE_SUPABASE_URL não definidas"**  
→ Certifique-se de que o arquivo `.env` existe e foi preenchido.

**Loop de redirect no OAuth**  
→ Verifique se o redirect URI no Google Cloud Console bate exatamente com `https://SEU-PROJETO.supabase.co/auth/v1/callback`.

**RLS bloqueando operações**  
→ Confirme que o SQL do `schema.sql` foi executado completamente, incluindo as políticas RLS.

**Dados não aparecem após login**  
→ Abra o DevTools → Console e verifique erros do Supabase. Certifique-se de que as tabelas foram criadas.
"# grana-ok" 
