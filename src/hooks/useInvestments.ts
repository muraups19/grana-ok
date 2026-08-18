import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Investment, AddInvestmentPayload, EditInvestmentPayload } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export function useInvestments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // ─── LOAD ALL INVESTMENTS ──────────────────────────────────
  const getInvestments = useCallback(async (): Promise<Investment[]> => {
    if (!user) throw new Error('Não autenticado')
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('current_value', { ascending: false })
    if (error) throw error
    return (data ?? []) as Investment[]
  }, [user])

  // ─── ADD ────────────────────────────────────────────────────
  const addInvestment = useCallback(async (payload: AddInvestmentPayload) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { error } = await supabase.from('investments').insert({
        user_id: user.id,
        name: payload.name,
        type: payload.type,
        broker: payload.broker,
        amount_invested: payload.amount_invested,
        current_value: payload.current_value,
        invested_at: payload.invested_at,
        notes: payload.notes || null,
      })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [user])

  // ─── EDIT ───────────────────────────────────────────────────
  const editInvestment = useCallback(async (id: string, payload: EditInvestmentPayload) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { error } = await supabase
        .from('investments')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [user])

  // ─── DELETE ─────────────────────────────────────────────────
  const deleteInvestment = useCallback(async (id: string) => {
    if (!user) throw new Error('Não autenticado')
    setLoading(true)
    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }, [user])

  return { loading, getInvestments, addInvestment, editInvestment, deleteInvestment }
}
