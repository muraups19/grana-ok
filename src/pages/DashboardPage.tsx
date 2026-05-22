import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

import { useFinance } from '@/hooks/useFinance'
import type { Transaction, MonthData, AddExpensePayload, AddExtraPayload, EditPayload } from '@/types'
import { fmtBRL, MONTHS } from '@/lib/utils'

import Header from '@/components/Header'
import SummaryCards from '@/components/SummaryCards'
import TransactionItem from '@/components/TransactionItem'
import ExpenseModal from '@/components/modals/ExpenseModal'
import ExtraModal from '@/components/modals/ExtraModal'
import SalaryModal from '@/components/modals/SalaryModal'
import EditModal from '@/components/modals/EditModal'

type Tab = 'expenses' | 'extras' | 'salary'

// ── Skeleton loader ─────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: '0 14px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 68, marginBottom: 8, borderRadius: 12 }} />
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
        <span className="section-head-total" style={{ color: type === 'extra' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
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
  const [activeTab, setActiveTab] = useState<Tab>('expenses')
  const [syncing, setSyncing] = useState(false)

  // Search filter
  const [search, setSearch] = useState('')

  // Modal state
  const [showExpense, setShowExpense] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [showSalary, setShowSalary] = useState(false)
  const [editItem, setEditItem] = useState<Transaction | null>(null)

  const { getMonthData, addExpense, addExtra, editTransaction, deleteTransaction, updateSalary, forceSync } = useFinance()

  // Default date string for new entries
  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

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

  // ── Computed values ───────────────────────────────────────
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0)
  const totalExtras = data.extras.reduce((s, e) => s + e.amount, 0)

  // Group expenses
  const fixedItems = data.expenses.filter(e => e.installment.toLowerCase() === 'fixo')
  const parcelItems = data.expenses.filter(e => /^\d+\/\d+$/.test(e.installment))
  const otherItems = data.expenses.filter(e => e.installment.toLowerCase() !== 'fixo' && !/^\d+\/\d+$/.test(e.installment))

  // Search filter
  const filterBySearch = (items: Transaction[]) =>
    search ? items.filter(i => i.description.toLowerCase().includes(search.toLowerCase()) || (i.bank || '').toLowerCase().includes(search.toLowerCase())) : items

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'expenses', label: '💸 Despesas', count: data.expenses.length },
    { key: 'extras', label: '💰 Extras', count: data.extras.length },
    { key: 'salary', label: '🏦 Salário' },
  ]

  return (
    <div
      style={{ paddingBottom: 80 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Header
        month={month} year={year}
        onChangeMonth={changeMonth}
        onSelectMonth={(m, y) => { setMonth(m); setYear(y) }}
        onSync={handleSync}
        syncing={syncing}
      />

      {/* Summary */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${month}-${year}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <SummaryCards salary={data.salary} expenses={totalExpenses} extras={totalExtras} />
        </motion.div>
      </AnimatePresence>

      {/* Tabs */}
      <div style={{
        display: 'flex', padding: '14px 14px 0',
        borderBottom: '1px solid var(--border-dim)',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '9px 14px', background: 'none', border: 'none',
              color: activeTab === tab.key ? 'var(--accent-green)' : 'var(--text-muted)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent-green)' : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap', transition: '0.15s',
              fontFamily: 'Figtree, sans-serif',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                background: activeTab === tab.key ? 'var(--accent-green-dim)' : 'var(--bg-raised)',
                color: activeTab === tab.key ? 'var(--accent-green)' : 'var(--text-muted)',
                fontSize: 10, padding: '2px 6px', borderRadius: 99, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '12px 14px' }}>
        {/* Expenses tab */}
        {activeTab === 'expenses' && (
          <>
            <button className="btn-add" onClick={() => setShowExpense(true)}>
              + Nova Compra / Conta Fixa
            </button>

            {/* Search */}
            {data.expenses.length > 3 && (
              <input
                className="form-control"
                placeholder="🔍 Buscar despesa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: 12, fontSize: 14 }}
              />
            )}

            {loadingData ? <Skeleton /> : (
              <AnimatePresence>
                {data.expenses.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">💸</span>
                    Nenhuma despesa em {MONTHS[month - 1]}/{year}
                    <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 13 }} onClick={() => setShowExpense(true)}>
                      + Adicionar despesa
                    </button>
                  </div>
                ) : (
                  <>
                    <TxSection title="Contas Fixas" items={filterBySearch(fixedItems)} total={fixedItems.reduce((s, i) => s + i.amount, 0)} type="expense" onEdit={setEditItem} onDelete={handleDelete} />
                    <TxSection title="Parcelados" items={filterBySearch(parcelItems)} total={parcelItems.reduce((s, i) => s + i.amount, 0)} type="expense" onEdit={setEditItem} onDelete={handleDelete} />
                    <TxSection title="Outras Despesas" items={filterBySearch(otherItems)} total={otherItems.reduce((s, i) => s + i.amount, 0)} type="expense" onEdit={setEditItem} onDelete={handleDelete} />
                    {filterBySearch(data.expenses).length === 0 && search && (
                      <div className="empty-state" style={{ padding: '24px 0' }}>
                        Nenhum resultado para "{search}"
                      </div>
                    )}
                  </>
                )}
              </AnimatePresence>
            )}
          </>
        )}

        {/* Extras tab */}
        {activeTab === 'extras' && (
          <>
            <button className="btn-add green" onClick={() => setShowExtra(true)}>
              + Nova Entrada Extra
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
                    <span className="section-head-title">Entradas Extras</span>
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
          </>
        )}

        {/* Salary tab */}
        {activeTab === 'salary' && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-raised))',
              border: '1px solid var(--border-med)',
              borderRadius: 'var(--radius-lg)', padding: '28px 20px',
              textAlign: 'center', marginBottom: 14,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 8 }}>
                Salário base — {MONTHS[month - 1]} {year}
              </div>
              <div className="font-mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent-green)', letterSpacing: '-1px', marginBottom: 4 }}>
                {fmtBRL(data.salary)}
              </div>
              {totalExtras > 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  + {fmtBRL(totalExtras)} extras = {fmtBRL(data.salary + totalExtras)} total
                </div>
              )}
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', padding: '13px', marginBottom: 8 }}
              onClick={() => setShowSalary(true)}
            >
              ⚙️ Configurar Reajuste Salarial
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              O reajuste aplica o novo valor a partir do mês escolhido,<br />
              preservando o histórico de meses anteriores.
            </p>
          </>
        )}
      </div>

      {/* Modals */}
      <ExpenseModal open={showExpense} onClose={() => setShowExpense(false)} onSave={handleAddExpense} defaultDate={defaultDate} />
      <ExtraModal open={showExtra} onClose={() => setShowExtra(false)} onSave={handleAddExtra} defaultDate={defaultDate} />
      <SalaryModal open={showSalary} onClose={() => setShowSalary(false)} onSave={handleSalary}
        currentSalary={data.salary} currentMonth={month} currentYear={year} />
      <EditModal open={!!editItem} onClose={() => setEditItem(null)} onSave={handleEdit} item={editItem} />
    </div>
  )
}
