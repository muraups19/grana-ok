import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { genId, dateNum, isoToBR } from '@/lib/utils'
import type {
  Transaction, MonthData, SalaryRule,
  AddExpensePayload, AddExtraPayload, EditPayload,
} from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export function useFinance() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

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

    const transactions = (txRes.data ?? []) as Transaction[]
    const salary = (salRes.data?.[0] as SalaryRule | undefined)?.amount ?? 0

    return {
      expenses: transactions.filter(t => t.type === 'expense'),
      extras:   transactions.filter(t => t.type === 'extra'),
      salary,
    }
  }, [user])

  // ─── ADD EXPENSE ───────────────────────────────────────────
  const addExpense = useCallback(async (payload: AddExpensePayload) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { description, amount, qty, date, bank, inputType } = payload
      const [yyyy, mm] = date.split('-').map(Number)
      const groupId = genId('G')
      const rows: Partial<Transaction>[] = []

      if (inputType === 'fixo') {
        // Insere no mês atual
        rows.push({
          user_id: user.id, group_id: groupId,
          description, bank, installment: 'Fixo',
          amount, type: 'expense',
          month: mm, year: yyyy, transaction_date: date,
        })
        // Propaga para todos os meses futuros já existentes
        const { data: existingSheets } = await supabase
          .from('transactions')
          .select('month, year')
          .eq('user_id', user.id)
          .gt('year', yyyy)
          .order('year, month')

        const seen = new Set<string>()
        for (const { month: m, year: y } of (existingSheets ?? [])) {
          const key = `${y}-${m}`
          if (seen.has(key)) continue
          seen.add(key)
          if (y * 100 + m > yyyy * 100 + mm) {
            rows.push({
              user_id: user.id, group_id: groupId,
              description, bank, installment: 'Fixo',
              amount, type: 'expense',
              month: m, year: y, transaction_date: date,
            })
          }
        }
      } else {
        // Total ÷ parcelas  OR  valor por parcela
        const perParcel = inputType === 'total'
          ? parseFloat((amount / qty).toFixed(2))
          : parseFloat(amount.toFixed(2))

        for (let i = 1; i <= qty; i++) {
          const d = new Date(yyyy, mm - 1 + (i - 1), 1)
          rows.push({
            user_id: user.id, group_id: groupId,
            description, bank,
            installment: qty > 1 ? `${i}/${qty}` : '-',
            amount: perParcel, type: 'expense',
            month: d.getMonth() + 1, year: d.getFullYear(),
            transaction_date: date,
          })
        }
      }

      const { error } = await supabase.from('transactions').insert(rows)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [user])

  // ─── ADD EXTRA ─────────────────────────────────────────────
  const addExtra = useCallback(async (payload: AddExtraPayload, month: number, year: number) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        group_id: null,
        description: payload.description,
        bank: '-',
        installment: '-',
        amount: payload.amount,
        type: 'extra',
        month, year,
        transaction_date: payload.date,
      })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [user])

  // ─── EDIT TRANSACTION ──────────────────────────────────────
  const editTransaction = useCallback(async (id: string, payload: EditPayload) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [user])

  // ─── DELETE TRANSACTION ────────────────────────────────────
  const deleteTransaction = useCallback(async (
    id: string,
    groupId: string | null,
    installment: string,
    month: number,
    year: number,
  ) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const isFixo    = installment.toLowerCase() === 'fixo'
      const isParcela = /^\d+\/\d+$/.test(installment)

      if (groupId) {
        if (isFixo) {
          // Remove este mês em diante
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id)
            .eq('group_id', groupId)
            .gte('year',  year)
            .or(`year.gt.${year},and(year.eq.${year},month.gte.${month})`)
          if (error) throw error
        } else if (isParcela) {
          // Remove todas as parcelas
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id)
            .eq('group_id', groupId)
          if (error) throw error
        } else {
          // Remove apenas este
          const { error } = await supabase
            .from('transactions').delete().eq('id', id).eq('user_id', user.id)
          if (error) throw error
        }
      } else {
        const { error } = await supabase
          .from('transactions').delete().eq('id', id).eq('user_id', user.id)
        if (error) throw error
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  // ─── UPDATE SALARY ─────────────────────────────────────────
  const updateSalary = useCallback(async (amount: number, month: number, year: number) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const dn = dateNum(month, year)
      // Upsert by user_id + date_num
      const { data: existing } = await supabase
        .from('salary_rules')
        .select('id')
        .eq('user_id', user.id)
        .eq('date_num', dn)
        .single()

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
      // Busca todas as transações do usuário
      const { data: all, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .order('year, month')
      if (error) throw error

      const rows = (all ?? []) as Transaction[]
      const existingKeys = new Set(
        rows.map(r => `${r.group_id}|${r.installment.toLowerCase()}|${r.year}-${r.month}`)
      )
      const toInsert: Partial<Transaction>[] = []

      // Distinct months present in DB
      const monthSet = new Set<string>()
      rows.forEach(r => monthSet.add(`${r.year}-${r.month}`))
      const allMonths = Array.from(monthSet)
        .map(s => { const [y,m] = s.split('-'); return { year: +y, month: +m } })
        .sort((a,b) => dateNum(a.month,a.year) - dateNum(b.month,b.year))

      // Process each row that could propagate
      for (const row of rows) {
        const inst = row.installment.toLowerCase()
        const isFixo = inst === 'fixo'
        const parcelMatch = row.installment.match(/^(\d+)\/(\d+)$/)
        const rowNum = dateNum(row.month, row.year)

        if (isFixo && row.group_id) {
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
              transaction_date: row.transaction_date,
            })
          }
        } else if (parcelMatch && row.group_id) {
          const curr = +parcelMatch[1]
          const tot  = +parcelMatch[2]
          for (let i = curr + 1; i <= tot; i++) {
            const d = new Date(row.year, row.month - 1 + (i - curr), 1)
            const m = d.getMonth() + 1, y = d.getFullYear()
            const instStr = `${i}/${tot}`
            const key = `${row.group_id}|${instStr.toLowerCase()}|${y}-${m}`
            if (existingKeys.has(key)) continue
            // Only insert if that month already has other data (opt-in)
            if (!monthSet.has(`${y}-${m}`)) continue
            existingKeys.add(key)
            toInsert.push({
              user_id: user.id, group_id: row.group_id,
              description: row.description, bank: row.bank,
              installment: instStr, amount: row.amount,
              type: 'expense', month: m, year: y,
              transaction_date: row.transaction_date,
            })
          }
        }
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from('transactions').insert(toInsert)
        if (insErr) throw insErr
      }
      return toInsert.length
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    loading,
    getMonthData,
    addExpense,
    addExtra,
    editTransaction,
    deleteTransaction,
    updateSalary,
    forceSync,
  }
}
