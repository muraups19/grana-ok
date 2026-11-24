import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { genId, dateNum } from '@/lib/utils'
import { billingFor, findCard, addMonths } from '@/lib/billing'
import { autoCategorize, buildHistory, type CategoryHistory } from '@/lib/categories'
import { isMissingSchema } from '@/hooks/useCards'
import type {
  Transaction, MonthData, SalaryRule, Card,
  AddExpensePayload, AddExtraPayload, EditPayload, GroupScope,
} from '@/types'
import { useAuth } from '@/contexts/AuthContext'

type Row = Partial<Transaction>

const PARCEL_RE = /^(\d+)\/(\d+)$/
const isFixoInst = (s: string) => s.toLowerCase() === 'fixo'
const parcelNum  = (s: string) => { const m = s.match(PARCEL_RE); return m ? +m[1] : null }

/** Remove a coluna `category` (para bancos sem a migração 003) */
function stripCategory<T extends object>(obj: T): T {
  const { category: _c, ...rest } = obj as T & { category?: unknown }
  return rest as T
}

export function useFinance() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // ─── HELPERS (com fallback para banco sem migração) ───────
  const insertRows = useCallback(async (rows: Row[]) => {
    if (!rows.length) return
    let { error } = await supabase.from('transactions').insert(rows)
    if (error && isMissingSchema(error)) {
      ({ error } = await supabase.from('transactions').insert(rows.map(stripCategory)))
    }
    if (error) throw error
  }, [])

  const updateWhere = useCallback(async (patch: Row, ids: string[]) => {
    if (!user || !ids.length) return
    let { error } = await supabase.from('transactions').update(patch).in('id', ids).eq('user_id', user.id)
    if (error && isMissingSchema(error)) {
      const p = stripCategory(patch)
      if (!Object.keys(p).length) return
      ;({ error } = await supabase.from('transactions').update(p).in('id', ids).eq('user_id', user.id))
    }
    if (error) throw error
  }, [user])

  // ─── LOAD MONTH DATA ───────────────────────────────────────
  const getMonthData = useCallback(async (month: number, year: number): Promise<MonthData> => {
    if (!user) throw new Error('Não autenticado')

    const [txRes, salRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: true }),
      supabase
        .from('salary_rules')
        .select('*')
        .eq('user_id', user.id)
        .lte('date_num', dateNum(month, year))
        .order('date_num', { ascending: false })
        .limit(1),
    ])

    if (txRes.error) throw txRes.error

    const transactions = ((txRes.data ?? []) as Transaction[]).map(t => ({ ...t, category: t.category ?? null }))
    const salary = (salRes.data?.[0] as SalaryRule | undefined)?.amount ?? 0

    return {
      expenses: transactions.filter(t => t.type === 'expense'),
      extras:   transactions.filter(t => t.type === 'extra'),
      salary,
    }
  }, [user])

  // ─── HISTÓRICO DE CATEGORIAS (aprendizado) ─────────────────
  const getCategoryHistory = useCallback(async (): Promise<CategoryHistory> => {
    if (!user) return new Map()
    const { data, error } = await supabase
      .from('transactions')
      .select('description, category, type')
      .eq('user_id', user.id)
      .not('category', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(3000)
    if (error) return new Map()
    return buildHistory((data ?? []) as { description: string; category: string | null; type: 'expense' | 'extra' }[])
  }, [user])

  // ─── ADD EXPENSE ───────────────────────────────────────────
  const addExpense = useCallback(async (payload: AddExpensePayload, cards: Card[] = []) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { description, amount, qty, date, bank, inputType, category } = payload
      const card = findCard(cards, bank)
      const first = billingFor(date, card)
      const groupId = genId('G')
      const base: Row = {
        user_id: user.id, group_id: groupId, description, bank,
        type: 'expense', transaction_date: date, category,
      }
      const rows: Row[] = []

      if (inputType === 'fixo') {
        rows.push({ ...base, installment: 'Fixo', amount, month: first.month, year: first.year })

        // Propaga para todos os meses futuros que já têm lançamentos
        const startNum = dateNum(first.month, first.year)
        const { data: existing } = await supabase
          .from('transactions')
          .select('month, year')
          .eq('user_id', user.id)
          .gte('year', first.year)
        const seen = new Set<number>()
        for (const { month: m, year: y } of (existing ?? []) as { month: number; year: number }[]) {
          const n = dateNum(m, y)
          if (n <= startNum || seen.has(n)) continue
          seen.add(n)
          rows.push({ ...base, installment: 'Fixo', amount, month: m, year: y })
        }
      } else {
        const perParcel = inputType === 'total'
          ? Math.round((amount / qty) * 100) / 100
          : Math.round(amount * 100) / 100

        for (let i = 1; i <= qty; i++) {
          const { month, year } = addMonths(first.month, first.year, i - 1)
          rows.push({
            ...base,
            installment: qty > 1 ? `${i}/${qty}` : '-',
            amount: perParcel, month, year,
          })
        }
      }

      await insertRows(rows)
      return first
    } finally {
      setLoading(false)
    }
  }, [user, insertRows])

  // ─── ADD EXTRA ─────────────────────────────────────────────
  const addExtra = useCallback(async (payload: AddExtraPayload) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const [y, m] = payload.date.split('-').map(Number)
      await insertRows([{
        user_id: user.id,
        group_id: null,
        description: payload.description,
        bank: '-',
        installment: '-',
        amount: payload.amount,
        type: 'extra',
        month: m, year: y,
        transaction_date: payload.date,
        category: payload.category,
      }])
    } finally {
      setLoading(false)
    }
  }, [user, insertRows])

  // ─── GROUP HELPERS ─────────────────────────────────────────
  /** Retorna os IDs do grupo afetados pela abrangência escolhida */
  const groupTargets = useCallback(async (item: Transaction, scope: GroupScope): Promise<Transaction[]> => {
    if (!user) throw new Error('Não autenticado')
    if (!item.group_id || scope === 'one') return [item]

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('group_id', item.group_id)
    if (error) throw error
    const rows = (data ?? []) as Transaction[]
    if (scope === 'all') return rows

    // scope === 'future' → este e os próximos
    const curParcel = parcelNum(item.installment)
    if (curParcel !== null) return rows.filter(r => (parcelNum(r.installment) ?? 0) >= curParcel)
    const curNum = dateNum(item.month, item.year)
    return rows.filter(r => dateNum(r.month, r.year) >= curNum)
  }, [user])

  // ─── EDIT TRANSACTION ──────────────────────────────────────
  /**
   * Edita um lançamento. Para parcelados e fixos, `scope` define se a alteração
   * vale só para este registro, para este e os próximos, ou para todo o grupo.
   * Ao mudar data ou cartão de uma compra (avulsa ou todas as parcelas),
   * os meses são recalculados pelo fechamento do cartão.
   */
  const editTransaction = useCallback(async (
    item: Transaction, payload: EditPayload, scope: GroupScope = 'one', cards: Card[] = [],
  ) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const isParcela = PARCEL_RE.test(item.installment)
      const isFixo = isFixoInst(item.installment)
      const newBank = payload.bank ?? item.bank
      const newDate = payload.transaction_date ?? item.transaction_date
      const dateChanged = (payload.transaction_date ?? null) !== (item.transaction_date ?? null)
      const bankChanged = (newBank || '').trim().toLowerCase() !== (item.bank || '').trim().toLowerCase()
      const reschedule = !!newDate && (dateChanged || bankChanged) && item.type === 'expense'
      const card = findCard(cards, newBank)

      const targets = await groupTargets(item, scope)

      // Compra avulsa: move para o mês correto da fatura
      if (!isParcela && !isFixo && reschedule) {
        const b = billingFor(newDate!, card)
        await updateWhere({ ...payload, month: b.month, year: b.year }, [item.id])
        return
      }
      // Entrada extra: segue o mês da data
      if (item.type === 'extra' && newDate && dateChanged) {
        const [y, m] = newDate.split('-').map(Number)
        await updateWhere({ ...payload, month: m, year: y }, [item.id])
        return
      }

      // Todas as parcelas + mudou data/cartão → redistribui meses
      if (isParcela && scope === 'all' && reschedule) {
        const b = billingFor(newDate!, card)
        await Promise.all(targets.map(r => {
          const n = parcelNum(r.installment) ?? 1
          const { month, year } = addMonths(b.month, b.year, n - 1)
          return updateWhere({ ...payload, month, year }, [r.id])
        }))
        return
      }

      await updateWhere({ ...payload }, targets.map(t => t.id))
    } finally {
      setLoading(false)
    }
  }, [user, groupTargets, updateWhere])

  // ─── DELETE TRANSACTION ────────────────────────────────────
  const deleteTransaction = useCallback(async (item: Transaction, scope: GroupScope = 'one') => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const targets = await groupTargets(item, scope)
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
        .in('id', targets.map(t => t.id))
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [user, groupTargets])

  // ─── RECATEGORIZAR (lançamentos sem categoria) ─────────────
  const recategorize = useCallback(async (history: CategoryHistory) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, description, type')
        .eq('user_id', user.id)
        .is('category', null)
        .limit(5000)
      if (error) {
        if (isMissingSchema(error)) throw new Error('Execute a migração 003 no Supabase para usar categorias.')
        throw error
      }
      const byCat = new Map<string, string[]>()
      for (const r of (data ?? []) as { id: string; description: string; type: 'expense' | 'extra' }[]) {
        const c = autoCategorize(r.description, r.type, history)
        byCat.set(c, [...(byCat.get(c) ?? []), r.id])
      }
      for (const [category, ids] of byCat) {
        for (let i = 0; i < ids.length; i += 200) {
          await updateWhere({ category }, ids.slice(i, i + 200))
        }
      }
      return (data ?? []).length
    } finally {
      setLoading(false)
    }
  }, [user, updateWhere])

  // ─── UPDATE SALARY ─────────────────────────────────────────
  const updateSalary = useCallback(async (amount: number, month: number, year: number) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const dn = dateNum(month, year)
      const { data: existing } = await supabase
        .from('salary_rules')
        .select('id')
        .eq('user_id', user.id)
        .eq('date_num', dn)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('salary_rules').update({ amount }).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('salary_rules').insert({ user_id: user.id, date_num: dn, amount })
        if (error) throw error
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  // ─── FORCE SYNC ────────────────────────────────────────────
  // Propaga despesas fixas e parceladas para meses futuros que existam
  const forceSync = useCallback(async () => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { data: all, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .order('year')
        .order('month')
      if (error) throw error

      const rows = (all ?? []) as Transaction[]
      const existingKeys = new Set(
        rows.map(r => `${r.group_id}|${r.installment.toLowerCase()}|${r.year}-${r.month}`)
      )
      const toInsert: Row[] = []

      const monthSet = new Set<string>()
      rows.forEach(r => monthSet.add(`${r.year}-${r.month}`))
      const allMonths = Array.from(monthSet)
        .map(s => { const [y, m] = s.split('-'); return { year: +y, month: +m } })
        .sort((a, b) => dateNum(a.month, a.year) - dateNum(b.month, b.year))

      // Para fixos, usa a versão mais recente (valor atualizado) como modelo
      const latestFixo = new Map<string, Transaction>()
      for (const r of rows) {
        if (!isFixoInst(r.installment) || !r.group_id) continue
        const prev = latestFixo.get(r.group_id)
        if (!prev || dateNum(r.month, r.year) > dateNum(prev.month, prev.year)) latestFixo.set(r.group_id, r)
      }

      for (const row of latestFixo.values()) {
        const rowNum = dateNum(row.month, row.year)
        for (const { year, month } of allMonths) {
          if (dateNum(month, year) <= rowNum) continue
          const key = `${row.group_id}|fixo|${year}-${month}`
          if (existingKeys.has(key)) continue
          existingKeys.add(key)
          toInsert.push({
            user_id: user.id, group_id: row.group_id,
            description: row.description, bank: row.bank,
            installment: 'Fixo', amount: row.amount,
            type: 'expense', month, year,
            transaction_date: row.transaction_date, category: row.category,
          })
        }
      }

      for (const row of rows) {
        const parcelMatch = row.installment.match(PARCEL_RE)
        if (!parcelMatch || !row.group_id) continue
        const curr = +parcelMatch[1]
        const tot  = +parcelMatch[2]
        for (let i = curr + 1; i <= tot; i++) {
          const { month: m, year: y } = addMonths(row.month, row.year, i - curr)
          const instStr = `${i}/${tot}`
          const key = `${row.group_id}|${instStr}|${y}-${m}`
          if (existingKeys.has(key)) continue
          if (!monthSet.has(`${y}-${m}`)) continue
          existingKeys.add(key)
          toInsert.push({
            user_id: user.id, group_id: row.group_id,
            description: row.description, bank: row.bank,
            installment: instStr, amount: row.amount,
            type: 'expense', month: m, year: y,
            transaction_date: row.transaction_date, category: row.category,
          })
        }
      }

      await insertRows(toInsert)
      return toInsert.length
    } finally {
      setLoading(false)
    }
  }, [user, insertRows])

  return {
    loading,
    getMonthData,
    getCategoryHistory,
    addExpense,
    addExtra,
    editTransaction,
    deleteTransaction,
    recategorize,
    updateSalary,
    forceSync,
  }
}
