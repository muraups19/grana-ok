import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { LogOut, ChevronRight, Settings2 } from 'lucide-react'

import { useFinance } from '@/hooks/useFinance'
import { useInvestments } from '@/hooks/useInvestments'
import { useAuth } from '@/contexts/AuthContext'
import type { Transaction, MonthData, AddExpensePayload, AddExtraPayload, EditPayload, Investment, AddInvestmentPayload, EditInvestmentPayload } from '@/types'
import { fmtBRL, MONTHS, initials } from '@/lib/utils'

import Header from '@/components/Header'
import SummaryCards from '@/components/SummaryCards'
import InvestmentSummary from '@/components/InvestmentSummary'
import InvestmentItem from '@/components/InvestmentItem'
import TransactionItem from '@/components/TransactionItem'
import BottomNav, { NavTab } from '@/components/BottomNav'
import ExpenseModal from '@/components/modals/ExpenseModal'
import ExtraModal from '@/components/modals/ExtraModal'
import SalaryModal from '@/components/modals/SalaryModal'
import EditModal from '@/components/modals/EditModal'
import InvestmentModal from '@/components/modals/InvestmentModal'

// ── Skeleton loader ─────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: '0 16px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 68, marginBottom: 10, borderRadius: 16 }} />
      ))}
    </div>
  )
}

// ── Section group ───────────────────────────────────────────
function TxSection({ title, items, total, type, onEdit, onDelete }: {
  title: string; items: Transaction[]; total: number
  type: 'expense' | 'extra'
  onEdit: (i: Transaction) => void
  onDelete: (i: Transaction) => void
}) {
  if (!items.length) return null
  return (
    <>
      <div className="section-head">
        <span className="section-head-title">{title}</span>
        <span className="section-head-total" style={{ color: type === 'extra' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
          {fmtBRL(total)}
        </span>
      </div>
      {items.map(item => (
        <TransactionItem key={item.id} item={item} type={type} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  )
}

export default function DashboardPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const [data, setData] = useState<MonthData>({ expenses: [], extras: [], salary: 0 })
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [syncing, setSyncing] = useState(false)

  // Investments (não são vinculados a mês/ano — carteira corrente)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loadingInvestments, setLoadingInvestments] = useState(true)
  const [showInvestment, setShowInvestment] = useState(false)
  const [editInvestmentItem, setEditInvestmentItem] = useState<Investment | null>(null)

  // Search filter
  const [search, setSearch] = useState('')

  // Modal state
  const [showExpense, setShowExpense] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [showSalary, setShowSalary] = useState(false)
  const [editItem, setEditItem] = useState<Transaction | null>(null)

  const { getMonthData, addExpense, addExtra, editTransaction, deleteTransaction, updateSalary, forceSync } = useFinance()
  const { getInvestments, addInvestment, editInvestment, deleteInvestment } = useInvestments()
  const { profile, signOut } = useAuth()

  // Default date string for new entries
  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // ── Load data ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoadingData(true)
    try {
      const d = await getMonthData(month, year)
      setData(d)
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao carregar dados')
    } finally {
      setLoadingData(false)
    }
  }, [month, year, getMonthData])

  useEffect(() => { load() }, [load])

  // ── Load investments (carteira independente do mês navegado) ─
  const loadInvestments = useCallback(async () => {
    try {
      const inv = await getInvestments()
      setInvestments(inv)
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao carregar investimentos')
    } finally {
      setLoadingInvestments(false)
    }
  }, [getInvestments])

  useEffect(() => { loadInvestments() }, [loadInvestments])

  // Swipe gesture for month change on mobile
  const touchStartX = useRef<number>(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 60) changeMonth(diff > 0 ? 1 : -1)
  }

  function changeMonth(delta: number) {
    setSearch('')
    const d = new Date(year, month - 1 + delta, 1)
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
  }

  // ── Handlers ──────────────────────────────────────────────
  async function handleAddExpense(payload: AddExpensePayload) {
    await toast.promise(addExpense(payload), {
      loading: 'Salvando...', success: 'Lançamento salvo!', error: e => e.message,
    })
    await load()
  }

  async function handleAddExtra(payload: AddExtraPayload) {
    await toast.promise(addExtra(payload, month, year), {
      loading: 'Salvando...', success: 'Entrada adicionada!', error: e => e.message,
    })
    await load()
  }

  async function handleSalary(amount: number, m: number, y: number) {
    await toast.promise(updateSalary(amount, m, y), {
      loading: 'Atualizando...', success: 'Salário atualizado!', error: e => e.message,
    })
    await load()
  }

  async function handleEdit(id: string, payload: EditPayload) {
    await toast.promise(editTransaction(id, payload), {
      loading: 'Salvando...', success: 'Editado!', error: e => e.message,
    })
    setEditItem(null)
    await load()
  }

  async function handleDelete(item: Transaction) {
    const isFixo = item.installment.toLowerCase() === 'fixo'
    const isParcela = /^\d+\/\d+$/.test(item.installment)

    let msg = `Excluir "${item.description}"?`
    if (isFixo) msg = `"${item.description}" é FIXO.\nSerá removido deste mês em diante. Confirmar?`
    if (isParcela) msg = `"${item.description}" é parcelado.\nTodas as parcelas serão removidas. Confirmar?`
    if (!window.confirm(msg)) return

    await toast.promise(
      deleteTransaction(item.id, item.group_id, item.installment, month, year),
      { loading: 'Removendo...', success: 'Excluído!', error: e => e.message }
    )
    await load()
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await toast.promise(forceSync(), {
        loading: 'Sincronizando...',
        success: c => `Sincronizado! ${c} entrada(s) propagada(s).`,
        error: e => e.message,
      })
      await load()
    } finally {
      setSyncing(false)
    }
  }

  async function handleAddInvestment(payload: AddInvestmentPayload) {
    await toast.promise(addInvestment(payload), {
      loading: 'Salvando...', success: 'Investimento adicionado!', error: e => e.message,
    })
    await loadInvestments()
  }

  async function handleEditInvestment(id: string, payload: EditInvestmentPayload) {
    await toast.promise(editInvestment(id, payload), {
      loading: 'Salvando...', success: 'Investimento atualizado!', error: e => e.message,
    })
    setEditInvestmentItem(null)
    await loadInvestments()
  }

  async function handleDeleteInvestment(item: Investment) {
    if (!window.confirm(`Excluir "${item.name}"? Esta ação não pode ser desfeita.`)) return
    await toast.promise(deleteInvestment(item.id), {
      loading: 'Removendo...', success: 'Investimento excluído!', error: e => e.message,
    })
    await loadInvestments()
  }

  // ── Computed values ───────────────────────────────────────
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0)
  const totalExtras = data.extras.reduce((s, e) => s + e.amount, 0)

  // Group expenses
  const fixedItems = data.expenses.filter(e => e.installment.toLowerCase() === 'fixo')
  const parcelItems = data.expenses.filter(e => /^\d+\/\d+$/.test(e.installment))
  const otherItems = data.expenses.filter(e => e.installment.toLowerCase() !== 'fixo' && !/^\d+\/\d+$/.test(e.installment))

  // Investment totals
  const totalInvested = investments.reduce((s, i) => s + i.amount_invested, 0)
  const totalCurrentValue = investments.reduce((s, i) => s + i.current_value, 0)

  // Search filter
  const filterBySearch = (items: Transaction[]) =>
    search ? items.filter(i => i.description.toLowerCase().includes(search.toLowerCase()) || (i.bank || '').toLowerCase().includes(search.toLowerCase())) : items

  // Recent transactions (for Home tab)
  const recentAll = [...data.expenses.map(e => ({ ...e, _kind: 'expense' as const })), ...data.extras.map(e => ({ ...e, _kind: 'extra' as const }))]
    .sort((a, b) => (b.transaction_date || '').localeCompare(a.transaction_date || ''))
    .slice(0, 5)

  const userInitials = initials(profile?.name ?? profile?.email ?? '?')

  return (
    <div
      style={{ paddingBottom: 100 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Header
        month={month} year={year}
        onChangeMonth={changeMonth}
        onSelectMonth={(m, y) => { setMonth(m); setYear(y) }}
        onSync={handleSync}
        onAdd={() => setShowExpense(true)}
        syncing={syncing}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${month}-${year}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── HOME ─────────────────────────────────────── */}
          {activeTab === 'home' && (
            <>
              <SummaryCards monthLabel={MONTHS[month - 1]} salary={data.salary} expenses={totalExpenses} extras={totalExtras} />

              <div style={{ padding: '18px 16px 0' }}>
                <div className="section-head" style={{ marginTop: 0 }}>
                  <span className="section-head-title">Últimas transações</span>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Ver todas
                  </button>
                </div>

                {loadingData ? <Skeleton /> : recentAll.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    Nenhum lançamento em {MONTHS[month - 1]}/{year}
                  </div>
                ) : (
                  recentAll.map(item => (
                    <TransactionItem
                      key={item.id}
                      item={item}
                      type={item._kind}
                      onEdit={item._kind === 'expense' ? setEditItem : undefined}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* ── CONTAS (despesas) ────────────────────────── */}
          {activeTab === 'expenses' && (
            <div style={{ padding: '10px 16px' }}>
              <button className="btn-add" onClick={() => setShowExpense(true)}>
                + Nova compra / conta fixa
              </button>

              {data.expenses.length > 3 && (
                <input
                  className="form-control"
                  placeholder="Buscar despesa..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ marginBottom: 12, fontSize: 14 }}
                />
              )}

              {loadingData ? <Skeleton /> : (
                <AnimatePresence>
                  {data.expenses.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">🧾</span>
                      Nenhuma despesa em {MONTHS[month - 1]}/{year}
                      <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 13 }} onClick={() => setShowExpense(true)}>
                        + Adicionar despesa
                      </button>
                    </div>
                  ) : (
                    <>
                      <TxSection title="Contas fixas" items={filterBySearch(fixedItems)} total={fixedItems.reduce((s, i) => s + i.amount, 0)} type="expense" onEdit={setEditItem} onDelete={handleDelete} />
                      <TxSection title="Parcelados" items={filterBySearch(parcelItems)} total={parcelItems.reduce((s, i) => s + i.amount, 0)} type="expense" onEdit={setEditItem} onDelete={handleDelete} />
                      <TxSection title="Outras despesas" items={filterBySearch(otherItems)} total={otherItems.reduce((s, i) => s + i.amount, 0)} type="expense" onEdit={setEditItem} onDelete={handleDelete} />
                      {filterBySearch(data.expenses).length === 0 && search && (
                        <div className="empty-state" style={{ padding: '24px 0' }}>
                          Nenhum resultado para "{search}"
                        </div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* ── INVESTIMENTOS ────────────────────────────── */}
          {activeTab === 'investments' && (
            <div style={{ padding: '10px 16px' }}>
              <InvestmentSummary totalInvested={totalInvested} totalCurrent={totalCurrentValue} />

              <button className="btn-add green" onClick={() => setShowInvestment(true)}>
                + Novo investimento
              </button>

              {loadingInvestments ? <Skeleton /> : (
                investments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📈</span>
                    Nenhum investimento cadastrado ainda.
                    <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 13 }} onClick={() => setShowInvestment(true)}>
                      + Adicionar investimento
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="section-head" style={{ marginTop: 0 }}>
                      <span className="section-head-title">Meus ativos</span>
                      <span className="section-head-total">
                        {investments.length} {investments.length === 1 ? 'ativo' : 'ativos'}
                      </span>
                    </div>
                    {investments.map(item => (
                      <InvestmentItem
                        key={item.id}
                        item={item}
                        onEdit={setEditInvestmentItem}
                        onDelete={handleDeleteInvestment}
                      />
                    ))}
                  </>
                )
              )}
            </div>
          )}

          {/* ── ANÁLISE (extras + salário) ───────────────── */}
          {activeTab === 'extras' && (
            <div style={{ padding: '10px 16px' }}>
              <div style={{
                background: 'linear-gradient(155deg, #17171C 0%, #0A0A0D 100%)',
                borderRadius: 'var(--radius-lg)', padding: '22px 20px',
                textAlign: 'center', marginBottom: 18,
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-on-dark-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: 8 }}>
                  Salário base — {MONTHS[month - 1]} {year}
                </div>
                <div className="font-display" style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: 4 }}>
                  {fmtBRL(data.salary)}
                </div>
                {totalExtras > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-on-dark-muted)' }}>
                    + {fmtBRL(totalExtras)} extras = {fmtBRL(data.salary + totalExtras)} total
                  </div>
                )}
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff' }}
                  onClick={() => setShowSalary(true)}
                >
                  <Settings2 size={14} /> Configurar reajuste salarial
                </button>
              </div>

              <button className="btn-add green" onClick={() => setShowExtra(true)}>
                + Nova entrada extra
              </button>

              {loadingData ? <Skeleton /> : (
                data.extras.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">💰</span>
                    Nenhuma entrada extra este mês.
                    <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 13 }} onClick={() => setShowExtra(true)}>
                      + Adicionar entrada
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="section-head">
                      <span className="section-head-title">Entradas extras</span>
                      <span className="section-head-total" style={{ color: 'var(--accent-green)' }}>
                        {fmtBRL(totalExtras)}
                      </span>
                    </div>
                    {data.extras.map(item => (
                      <TransactionItem key={item.id} item={item} type="extra" onDelete={handleDelete} />
                    ))}
                  </>
                )
              )}
            </div>
          )}

          {/* ── CONFIG ───────────────────────────────────── */}
          {activeTab === 'config' && (
            <div style={{ padding: '10px 16px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '18px', marginBottom: 16,
                background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-sub)',
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, color: '#fff',
                }}>
                  {userInitials || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>
                    {profile?.name || profile?.email || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{profile?.email || '—'}</div>
                </div>
              </div>

              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginBottom: 10, justifyContent: 'space-between', padding: '14px 16px' }}
                onClick={() => setShowSalary(true)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Settings2 size={15} /> Reajuste salarial
                </span>
                <ChevronRight size={15} />
              </button>

              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginBottom: 10, justifyContent: 'space-between', padding: '14px 16px' }}
                onClick={handleSync}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Sincronizar dados
                </span>
                <ChevronRight size={15} />
              </button>

              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginBottom: 10, justifyContent: 'space-between', padding: '14px 16px', color: 'var(--accent-red)' }}
                onClick={signOut}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LogOut size={15} /> Sair da conta
                </span>
                <ChevronRight size={15} />
              </button>

              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
                Dados armazenados exclusivamente no Supabase,<br />vinculados à sua conta Google.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* Modals */}
      <ExpenseModal open={showExpense} onClose={() => setShowExpense(false)} onSave={handleAddExpense} defaultDate={defaultDate} />
      <ExtraModal open={showExtra} onClose={() => setShowExtra(false)} onSave={handleAddExtra} defaultDate={defaultDate} />
      <SalaryModal open={showSalary} onClose={() => setShowSalary(false)} onSave={handleSalary}
        currentSalary={data.salary} currentMonth={month} currentYear={year} />
      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleEdit} item={editItem} />
      <InvestmentModal
        open={showInvestment || !!editInvestmentItem}
        onClose={() => { setShowInvestment(false); setEditInvestmentItem(null) }}
        onSave={handleAddInvestment}
        onSaveEdit={handleEditInvestment}
        defaultDate={todayISO}
        item={editInvestmentItem}
      />
    </div>
  )
}
