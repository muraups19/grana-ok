import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ChevronRight, CreditCard, LogOut, RefreshCw, Search, Settings2, Sparkles, Plus, X,
  Inbox, Receipt, TrendingUp, Wallet, AlertTriangle, Repeat, Layers, ShoppingBag,
} from 'lucide-react'

import { useFinance } from '@/hooks/useFinance'
import { useInvestments } from '@/hooks/useInvestments'
import { useCards } from '@/hooks/useCards'
import { useAuth } from '@/contexts/AuthContext'
import type {
  Transaction, MonthData, AddExpensePayload, AddExtraPayload, EditPayload, GroupScope,
  Investment, AddInvestmentPayload, EditInvestmentPayload, Card, CardPayload,
} from '@/types'
import { fmtBRL, MONTHS, MONTHS_FULL, initials } from '@/lib/utils'
import { getCategory, type CategoryHistory } from '@/lib/categories'
import { findCard } from '@/lib/billing'

import Header from '@/components/Header'
import SummaryCards from '@/components/SummaryCards'
import CategoryBreakdown, { effectiveCategory } from '@/components/CategoryBreakdown'
import CardBills from '@/components/CardBills'
import InvestmentSummary from '@/components/InvestmentSummary'
import InvestmentItem from '@/components/InvestmentItem'
import TransactionItem from '@/components/TransactionItem'
import BottomNav, { NavTab, NAV_ITEMS, Sidebar } from '@/components/BottomNav'
import ActionSheet, { type ActionSheetState } from '@/components/ActionSheet'
import { Callout } from '@/components/ui'
import ExpenseModal from '@/components/modals/ExpenseModal'
import ExtraModal from '@/components/modals/ExtraModal'
import SalaryModal from '@/components/modals/SalaryModal'
import EditModal from '@/components/modals/EditModal'
import InvestmentModal from '@/components/modals/InvestmentModal'
import CardsModal from '@/components/modals/CardsModal'

// ── Skeleton ────────────────────────────────────────────────
function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="list" style={{ padding: 12 }}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 48, marginBottom: i === rows - 1 ? 0 : 10 }} />
      ))}
    </div>
  )
}

function Empty({ icon, children, action }: { icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="list">
      <div className="empty-state">
        <div className="empty-icon">{icon}</div>
        {children}
        {action}
      </div>
    </div>
  )
}

// ── Seção agrupada ──────────────────────────────────────────
function TxSection({ title, icon, items, total, type, history, onEdit, onDelete }: {
  title: string; icon?: React.ReactNode; items: Transaction[]; total: number
  type: 'expense' | 'extra'
  history: CategoryHistory
  onEdit: (i: Transaction) => void
  onDelete: (i: Transaction) => void
}) {
  if (!items.length) return null
  return (
    <section>
      <div className="list-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{icon}{title} · {items.length}</span>
        <strong className="num" style={{ color: type === 'extra' ? 'var(--green)' : undefined }}>{fmtBRL(total)}</strong>
      </div>
      <div className="list">
        {items.map(item => (
          <TransactionItem key={item.id} item={item} type={type} history={history} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </section>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const sum = (arr: Transaction[]) => arr.reduce((s, e) => s + e.amount, 0)
const isFixo = (t: Transaction) => t.installment.toLowerCase() === 'fixo'
const isParcela = (t: Transaction) => /^\d+\/\d+$/.test(t.installment)

export default function DashboardPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const [data, setData] = useState<MonthData>({ expenses: [], extras: [], salary: 0 })
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [syncing, setSyncing] = useState(false)

  const [investments, setInvestments] = useState<Investment[]>([])
  const [loadingInvestments, setLoadingInvestments] = useState(true)
  const [showInvestment, setShowInvestment] = useState(false)
  const [editInvestmentItem, setEditInvestmentItem] = useState<Investment | null>(null)

  const [cards, setCards] = useState<Card[]>([])
  const [cardsAvailable, setCardsAvailable] = useState(true)
  const [history, setHistory] = useState<CategoryHistory>(new Map())

  // Filtros (aba Contas)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [bankFilter, setBankFilter] = useState<string | null>(null)

  // Modais
  const [showExpense, setShowExpense] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [showSalary, setShowSalary] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [editItem, setEditItem] = useState<Transaction | null>(null)
  const [sheet, setSheet] = useState<ActionSheetState | null>(null)

  const finance = useFinance()
  const { getInvestments, addInvestment, editInvestment, deleteInvestment } = useInvestments()
  const { getCards, saveCard, deleteCard } = useCards()
  const { profile, signOut } = useAuth()

  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear()
  const pad = (n: number) => String(n).padStart(2, '0')
  const defaultDate = isCurrentMonth
    ? `${year}-${pad(month)}-${pad(today.getDate())}`
    : `${year}-${pad(month)}-${pad(Math.min(today.getDate(), new Date(year, month, 0).getDate()))}`
  const todayISO = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  // ── Carregamento ─────────────────────────────────────────
  const { getMonthData, getCategoryHistory } = finance
  const load = useCallback(async () => {
    setLoadingData(true)
    try {
      setData(await getMonthData(month, year))
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao carregar dados')
    } finally {
      setLoadingData(false)
    }
  }, [month, year, getMonthData])

  useEffect(() => { load() }, [load])

  const loadHistory = useCallback(async () => { setHistory(await getCategoryHistory()) }, [getCategoryHistory])
  useEffect(() => { loadHistory() }, [loadHistory])

  const loadCards = useCallback(async () => {
    try {
      const c = await getCards()
      setCardsAvailable(c !== null)
      setCards(c ?? [])
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao carregar cartões')
    }
  }, [getCards])
  useEffect(() => { loadCards() }, [loadCards])

  const loadInvestments = useCallback(async () => {
    try {
      setInvestments(await getInvestments())
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao carregar investimentos')
    } finally {
      setLoadingInvestments(false)
    }
  }, [getInvestments])
  useEffect(() => { loadInvestments() }, [loadInvestments])

  // ── Mês ──────────────────────────────────────────────────
  function changeMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
  }

  // Swipe lateral para trocar de mês (celular)
  const touch = useRef<{ x: number; y: number; ok: boolean }>({ x: 0, y: 0, ok: false })
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.target as HTMLElement
    touch.current = {
      x: e.touches[0].clientX, y: e.touches[0].clientY,
      ok: !t.closest('.chips, .modal-overlay, input, .segmented'),
    }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current.ok || activeTab === 'config' || activeTab === 'investments') return
    const dx = touch.current.x - e.changedTouches[0].clientX
    const dy = touch.current.y - e.changedTouches[0].clientY
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) changeMonth(dx > 0 ? 1 : -1)
  }

  // Atalhos de teclado (desktop): ← → trocam o mês, N = nova despesa
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [role=dialog], [role=alertdialog]') || document.querySelector('.modal-overlay')) return
      if (e.key === 'ArrowLeft') changeMonth(-1)
      else if (e.key === 'ArrowRight') changeMonth(1)
      else if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setShowExpense(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  // ── Handlers ─────────────────────────────────────────────
  async function handleAddExpense(payload: AddExpensePayload) {
    await toast.promise(finance.addExpense(payload, cards), {
      loading: 'Salvando…',
      success: f => (f.month !== month || f.year !== year)
        ? `Salvo na fatura de ${MONTHS_FULL[f.month - 1]}/${f.year}`
        : 'Despesa salva!',
      error: e => e.message,
    })
    await Promise.all([load(), loadHistory()])
  }

  async function handleAddExtra(payload: AddExtraPayload) {
    await toast.promise(finance.addExtra(payload), {
      loading: 'Salvando…', success: 'Entrada adicionada!', error: e => e.message,
    })
    await Promise.all([load(), loadHistory()])
  }

  async function handleSalary(amount: number, m: number, y: number) {
    await toast.promise(finance.updateSalary(amount, m, y), {
      loading: 'Atualizando…', success: 'Salário atualizado!', error: e => e.message,
    })
    await load()
  }

  async function handleEdit(item: Transaction, payload: EditPayload, scope: GroupScope) {
    await toast.promise(finance.editTransaction(item, payload, scope, cards), {
      loading: 'Salvando…',
      success: scope === 'one' ? 'Alterado!' : scope === 'all' ? 'Todas as parcelas/meses foram alterados!' : 'Alterado daqui em diante!',
      error: e => e.message,
    })
    setEditItem(null)
    await Promise.all([load(), loadHistory()])
  }

  function runDelete(item: Transaction, scope: GroupScope) {
    toast.promise(finance.deleteTransaction(item, scope), {
      loading: 'Removendo…', success: 'Excluído!', error: e => e.message,
    }).then(load, () => {})
  }

  function handleDelete(item: Transaction) {
    const grouped = !!item.group_id && (isFixo(item) || isParcela(item))
    if (!grouped) {
      setSheet({
        title: `Excluir “${item.description}”?`,
        message: 'Esta ação não pode ser desfeita.',
        actions: [{ label: 'Excluir lançamento', destructive: true, onClick: () => runDelete(item, 'one') }],
      })
      return
    }
    if (isParcela(item)) {
      const [cur, tot] = item.installment.split('/').map(Number)
      setSheet({
        title: `“${item.description}” é parcelado`,
        message: `Parcela ${cur} de ${tot}. O que deseja excluir?`,
        actions: [
          { label: 'Só esta parcela', onClick: () => runDelete(item, 'one') },
          ...(cur < tot ? [{ label: `Esta e as próximas (${cur}–${tot})`, destructive: true, onClick: () => runDelete(item, 'future') }] : []),
          { label: `Todas as ${tot} parcelas`, destructive: true, onClick: () => runDelete(item, 'all') },
        ],
      })
      return
    }
    setSheet({
      title: `“${item.description}” é uma conta fixa`,
      message: 'O que deseja excluir?',
      actions: [
        { label: `Só de ${MONTHS[month - 1]}/${year}`, onClick: () => runDelete(item, 'one') },
        { label: 'Deste mês em diante', destructive: true, onClick: () => runDelete(item, 'future') },
        { label: 'De todos os meses', destructive: true, onClick: () => runDelete(item, 'all') },
      ],
    })
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await toast.promise(finance.forceSync(), {
        loading: 'Sincronizando…',
        success: c => c ? `${c} lançamento(s) propagado(s).` : 'Tudo em dia!',
        error: e => e.message,
      })
      await load()
    } catch { /* toast já exibiu */ } finally {
      setSyncing(false)
    }
  }

  async function handleRecategorize() {
    try {
      await toast.promise(finance.recategorize(history), {
        loading: 'Categorizando…',
        success: n => n ? `${n} lançamento(s) categorizados!` : 'Todos os lançamentos já têm categoria.',
        error: e => e.message,
      })
      await Promise.all([load(), loadHistory()])
    } catch { /* toast já exibiu */ }
  }

  async function handleSaveCard(payload: CardPayload, id?: string) {
    await toast.promise(saveCard(payload, id), { loading: 'Salvando…', success: 'Cartão salvo!', error: e => e.message })
    await loadCards()
  }
  async function handleDeleteCard(card: Card) {
    if (!window.confirm(`Excluir o cartão “${card.name}”? Os lançamentos existentes não serão apagados.`)) return
    await toast.promise(deleteCard(card.id), { loading: 'Removendo…', success: 'Cartão excluído!', error: e => e.message })
    await loadCards()
  }

  async function handleAddInvestment(payload: AddInvestmentPayload) {
    await toast.promise(addInvestment(payload), { loading: 'Salvando…', success: 'Investimento adicionado!', error: e => e.message })
    await loadInvestments()
  }
  async function handleEditInvestment(id: string, payload: EditInvestmentPayload) {
    await toast.promise(editInvestment(id, payload), { loading: 'Salvando…', success: 'Investimento atualizado!', error: e => e.message })
    setEditInvestmentItem(null)
    await loadInvestments()
  }
  function handleDeleteInvestment(item: Investment) {
    setSheet({
      title: `Excluir “${item.name}”?`,
      message: 'Esta ação não pode ser desfeita.',
      actions: [{
        label: 'Excluir investimento', destructive: true,
        onClick: () => { toast.promise(deleteInvestment(item.id), { loading: 'Removendo…', success: 'Excluído!', error: e => e.message }).then(loadInvestments, () => {}) },
      }],
    })
  }

  // ── Valores calculados ───────────────────────────────────
  const totalExpenses = sum(data.expenses)
  const totalExtras = sum(data.extras)
  const fixedItems = data.expenses.filter(isFixo)
  const parcelItems = data.expenses.filter(isParcela)
  const otherItems = data.expenses.filter(e => !isFixo(e) && !isParcela(e))

  const totalInvested = investments.reduce((s, i) => s + i.amount_invested, 0)
  const totalCurrentValue = investments.reduce((s, i) => s + i.current_value, 0)

  const q = search.trim().toLowerCase()
  const applyFilters = (items: Transaction[]) => items.filter(i => {
    if (q && !i.description.toLowerCase().includes(q) && !(i.bank || '').toLowerCase().includes(q)) return false
    if (catFilter && effectiveCategory(i, history) !== catFilter) return false
    if (bankFilter) {
      const name = findCard(cards, i.bank)?.name ?? ((i.bank || '').trim() || 'Sem método')
      if (name !== bankFilter) return false
    }
    return true
  })
  const anyFilter = !!(q || catFilter || bankFilter)
  const filteredAll = applyFilters(data.expenses)

  const recentAll = [...data.expenses, ...data.extras]
    .sort((a, b) => (b.transaction_date || '').localeCompare(a.transaction_date || '') || b.created_at.localeCompare(a.created_at))
    .slice(0, 6)

  const userInitials = initials(profile?.name ?? profile?.email ?? '?')
  const firstName = (profile?.name ?? profile?.email ?? '').split(/[ @]/)[0] || ''

  const tabMeta = NAV_ITEMS.find(n => n.key === activeTab)!
  const eyebrow = activeTab === 'home'
    ? `${greeting()}${firstName ? `, ${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}` : ''}`
    : activeTab === 'investments' || activeTab === 'config' ? undefined : `${MONTHS_FULL[month - 1]} de ${year}`

  const contextualAdd = () => {
    if (activeTab === 'extras') setShowExtra(true)
    else if (activeTab === 'investments') setShowInvestment(true)
    else setShowExpense(true)
  }

  const goToCategory = (id: string | null) => {
    setCatFilter(id); setBankFilter(null); setSearch('')
    if (id) setActiveTab('expenses')
  }
  const goToBank = (bank: string) => {
    setBankFilter(bank); setCatFilter(null); setSearch('')
    setActiveTab('expenses')
  }

  const sectionProps = { history, onEdit: setEditItem, onDelete: handleDelete }

  return (
    <div className="app" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <Sidebar active={activeTab} onChange={setActiveTab} onAdd={() => setShowExpense(true)} onSignOut={signOut} />

      <main className="main">
        <div className="main-inner">
          <Header
            title={tabMeta.title}
            eyebrow={eyebrow}
            month={month} year={year}
            onChangeMonth={changeMonth}
            onSelectMonth={(m, y) => { setMonth(m); setYear(y) }}
            onSync={handleSync}
            onAdd={contextualAdd}
            syncing={syncing}
            showMonth={activeTab !== 'investments' && activeTab !== 'config'}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            >
              {/* ── RESUMO ─────────────────────────────────── */}
              {activeTab === 'home' && (
                <div className="grid-2">
                  <div className="stack">
                    <SummaryCards
                      monthLabel={MONTHS_FULL[month - 1].toLowerCase()}
                      salary={data.salary} expenses={totalExpenses} extras={totalExtras}
                      fixed={sum(fixedItems)} installments={sum(parcelItems)}
                    />
                    <CardBills expenses={data.expenses} cards={cards} month={month} year={year}
                      onManage={() => setShowCards(true)} onSelect={goToBank} />
                  </div>
                  <div className="stack">
                    <CategoryBreakdown items={data.expenses} history={history} limit={6} onSelect={goToCategory} title="Gastos por categoria" />
                    <section>
                      <div className="list-header" style={{ paddingTop: 4 }}>
                        <span>Últimos lançamentos</span>
                        <button className="link-btn" style={{ textTransform: 'none', letterSpacing: 0 }} onClick={() => { goToCategory(null); setActiveTab('expenses') }}>Ver todos</button>
                      </div>
                      {loadingData ? <Skeleton /> : recentAll.length === 0 ? (
                        <Empty icon={<Inbox size={26} />} action={<button className="btn btn-ghost btn-sm" onClick={() => setShowExpense(true)}><Plus size={15} /> Adicionar</button>}>
                          Nenhum lançamento em {MONTHS[month - 1]}/{year}
                        </Empty>
                      ) : (
                        <div className="list">
                          {recentAll.map(item => (
                            <TransactionItem key={item.id} item={item} type={item.type} history={history} onEdit={setEditItem} onDelete={handleDelete} />
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              )}

              {/* ── CONTAS ─────────────────────────────────── */}
              {activeTab === 'expenses' && (
                <div className="grid-2">
                  <div>
                    <div className="filter-bar">
                      <div className="search">
                        <Search size={17} />
                        <input className="form-control" placeholder="Buscar por descrição ou cartão" value={search} onChange={e => setSearch(e.target.value)} type="search" />
                      </div>
                      <div className="chips">
                        <button className={`chip${!catFilter && !bankFilter ? ' active' : ''}`} onClick={() => { setCatFilter(null); setBankFilter(null) }}>Todas</button>
                        {bankFilter && (
                          <button className="chip active" onClick={() => setBankFilter(null)}><CreditCard size={14} />{bankFilter}<X size={14} /></button>
                        )}
                        {[...new Set(data.expenses.map(e => effectiveCategory(e, history)))].map(id => {
                          const c = getCategory(id)
                          const Icon = c.icon
                          return (
                            <button key={id} className={`chip${catFilter === id ? ' active' : ''}`} onClick={() => setCatFilter(catFilter === id ? null : id)}>
                              <span className="chip-icon" style={{ background: c.color }}><Icon size={12} strokeWidth={2.4} /></span>{c.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {anyFilter && filteredAll.length > 0 && (
                      <p className="hint num" style={{ margin: '4px 6px 0' }}>{filteredAll.length} lançamento(s) · {fmtBRL(sum(filteredAll))}</p>
                    )}

                    {loadingData ? <Skeleton /> : data.expenses.length === 0 ? (
                      <div style={{ marginTop: 12 }}>
                        <Empty icon={<Receipt size={26} />} action={<button className="btn btn-ghost btn-sm" onClick={() => setShowExpense(true)}><Plus size={15} /> Adicionar despesa</button>}>
                          Nenhuma despesa em {MONTHS[month - 1]}/{year}
                        </Empty>
                      </div>
                    ) : filteredAll.length === 0 ? (
                      <div style={{ marginTop: 12 }}><Empty icon={<Search size={24} />}>Nada encontrado com esses filtros</Empty></div>
                    ) : (
                      <>
                        <TxSection title="Contas fixas" icon={<Repeat size={13} />} items={applyFilters(fixedItems)} total={sum(applyFilters(fixedItems))} type="expense" {...sectionProps} />
                        <TxSection title="Parceladas" icon={<Layers size={13} />} items={applyFilters(parcelItems)} total={sum(applyFilters(parcelItems))} type="expense" {...sectionProps} />
                        <TxSection title="Avulsas" icon={<ShoppingBag size={13} />} items={applyFilters(otherItems)} total={sum(applyFilters(otherItems))} type="expense" {...sectionProps} />
                      </>
                    )}
                  </div>
                  <div className="side-col sticky-col">
                    <div className="stack">
                      <CategoryBreakdown items={data.expenses} history={history} active={catFilter} onSelect={id => { setCatFilter(id); setBankFilter(null) }} limit={10} />
                      <CardBills expenses={data.expenses} cards={cards} month={month} year={year} onManage={() => setShowCards(true)} onSelect={b => { setBankFilter(b); setCatFilter(null) }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── ENTRADAS ───────────────────────────────── */}
              {activeTab === 'extras' && (
                <div className="grid-2">
                  <div className="stack">
                    <section className="hero">
                      <span className="hero-label">Salário base · {MONTHS[month - 1]} {year}</span>
                      <div className="hero-value num">{fmtBRL(data.salary)}</div>
                      <div className="hero-glass-row">
                        <div className="hero-glass-cell"><span>Extras</span><strong className="num">{fmtBRL(totalExtras)}</strong></div>
                        <div className="hero-glass-cell"><span>Total do mês</span><strong className="num">{fmtBRL(data.salary + totalExtras)}</strong></div>
                      </div>
                    </section>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowExtra(true)}><Plus size={18} /> Nova entrada</button>
                      <button className="btn btn-ghost" onClick={() => setShowSalary(true)}><Settings2 size={17} /> Salário</button>
                    </div>
                    {loadingData ? <Skeleton rows={2} /> : data.extras.length === 0 ? (
                      <Empty icon={<Wallet size={26} />}>Nenhuma entrada extra este mês.</Empty>
                    ) : (
                      <TxSection title="Entradas extras" items={data.extras} total={totalExtras} type="extra" {...sectionProps} />
                    )}
                  </div>
                  <div className="stack">
                    <CategoryBreakdown items={data.extras} kind="extra" history={history} title="Entradas por categoria" />
                  </div>
                </div>
              )}

              {/* ── INVESTIMENTOS ──────────────────────────── */}
              {activeTab === 'investments' && (
                <div className="grid-2">
                  <div className="stack">
                    <InvestmentSummary totalInvested={totalInvested} totalCurrent={totalCurrentValue} />
                    <button className="btn btn-primary" onClick={() => setShowInvestment(true)}><Plus size={18} /> Novo investimento</button>
                  </div>
                  <div>
                    {loadingInvestments ? <Skeleton /> : investments.length === 0 ? (
                      <Empty icon={<TrendingUp size={26} />}>Nenhum investimento cadastrado ainda.</Empty>
                    ) : (
                      <section>
                        <div className="list-header">
                          <span>Meus ativos · {investments.length}</span>
                        </div>
                        <div className="list">
                          {investments.map(item => (
                            <InvestmentItem key={item.id} item={item} onEdit={setEditInvestmentItem} onDelete={handleDeleteInvestment} />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              )}

              {/* ── AJUSTES ────────────────────────────────── */}
              {activeTab === 'config' && (
                <div style={{ maxWidth: 680 }}>
                  <div className="list" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--hero-bg)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 750,
                    }}>{userInitials || '?'}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 18, textTransform: 'capitalize' }}>{profile?.name || profile?.email || '—'}</div>
                      <div style={{ fontSize: 14, color: 'var(--label-2)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.email || '—'}</div>
                    </div>
                  </div>

                  {!cardsAvailable && (
                    <div style={{ marginTop: 14 }}>
                      <Callout tone="warn" icon={<AlertTriangle size={16} />}>
                        <strong>Atualize o banco de dados</strong> para usar cartões e categorias: execute
                        {' '}<code>supabase/migrations/003_cards_categories.sql</code> no SQL Editor do Supabase.
                      </Callout>
                    </div>
                  )}

                  <div className="list-header">Finanças</div>
                  <div className="list">
                    <SettingsRow icon={<CreditCard size={17} />} color="#007AFF" label="Meus cartões" value={cards.length ? `${cards.length}` : undefined} onClick={() => setShowCards(true)} />
                    <SettingsRow icon={<Settings2 size={17} />} color="#34C759" label="Salário base" value={fmtBRL(data.salary)} onClick={() => setShowSalary(true)} />
                    <SettingsRow icon={<Sparkles size={17} />} color="#AF52DE" label="Categorizar lançamentos antigos" onClick={handleRecategorize} />
                    <SettingsRow icon={<RefreshCw size={17} />} color="#FF9500" label="Sincronizar fixos e parcelas" onClick={handleSync} />
                  </div>
                  <p className="hint" style={{ margin: '8px 16px 0' }}>
                    A categorização aprende com você: ao mudar a categoria de um lançamento, compras com a mesma descrição passam a usar a sua escolha.
                  </p>

                  <div className="list-header">Conta</div>
                  <div className="list">
                    <SettingsRow icon={<LogOut size={17} />} color="#FF3B30" label="Sair da conta" danger onClick={signOut} />
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--label-2)', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
                    Dados armazenados no Supabase, vinculados à sua conta Google.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* Modais */}
      <ExpenseModal open={showExpense} onClose={() => setShowExpense(false)} onSave={handleAddExpense}
        defaultDate={defaultDate} cards={cards} history={history} onManageCards={() => setShowCards(true)} />
      <ExtraModal open={showExtra} onClose={() => setShowExtra(false)} onSave={handleAddExtra} defaultDate={defaultDate} history={history} />
      <SalaryModal open={showSalary} onClose={() => setShowSalary(false)} onSave={handleSalary}
        currentSalary={data.salary} currentMonth={month} currentYear={year} />
      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleEdit} item={editItem} cards={cards} history={history} />
      <InvestmentModal
        open={showInvestment || !!editInvestmentItem}
        onClose={() => { setShowInvestment(false); setEditInvestmentItem(null) }}
        onSave={handleAddInvestment}
        onSaveEdit={handleEditInvestment}
        defaultDate={todayISO}
        item={editInvestmentItem}
      />
      <CardsModal open={showCards} onClose={() => setShowCards(false)} cards={cards} available={cardsAvailable}
        onSave={handleSaveCard} onDelete={handleDeleteCard} />
      <ActionSheet sheet={sheet} onClose={() => setSheet(null)} />
    </div>
  )
}

function SettingsRow({ icon, color, label, value, onClick, danger }: {
  icon: React.ReactNode; color: string; label: string; value?: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button className="row" onClick={onClick} style={{ minHeight: 52, padding: '10px 16px' }}>
      <div className="row-icon" style={{ background: color, width: 30, height: 30, borderRadius: 8 }}>{icon}</div>
      <div className="row-body"><div className="row-title" style={{ fontWeight: 500, color: danger ? 'var(--red)' : undefined }}>{label}</div></div>
      {value && <span className="num" style={{ color: 'var(--label-2)', fontSize: 15 }}>{value}</span>}
      <ChevronRight size={17} className="row-chevron" />
    </button>
  )
}
