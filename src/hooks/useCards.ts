import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Card, CardPayload } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

/** Erro de tabela/coluna inexistente (migração 003 ainda não executada) */
export function isMissingSchema(err: { code?: string; message?: string } | null | undefined) {
  if (!err) return false
  return err.code === '42P01' || err.code === 'PGRST205' || err.code === 'PGRST204' || err.code === '42703'
    || /does not exist|could not find|schema cache/i.test(err.message ?? '')
}

export function useCards() {
  const { user } = useAuth()

  /** Retorna `null` quando a tabela ainda não existe (migração pendente). */
  const getCards = useCallback(async (): Promise<Card[] | null> => {
    if (!user) throw new Error('Não autenticado')
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (error) {
      if (isMissingSchema(error)) return null
      throw error
    }
    return (data ?? []) as Card[]
  }, [user])

  const saveCard = useCallback(async (payload: CardPayload, id?: string) => {
    if (!user) throw new Error('Não autenticado')
    const q = id
      ? supabase.from('cards').update(payload).eq('id', id).eq('user_id', user.id)
      : supabase.from('cards').insert({ ...payload, user_id: user.id })
    const { error } = await q
    if (error) throw error
  }, [user])

  const deleteCard = useCallback(async (id: string) => {
    if (!user) throw new Error('Não autenticado')
    const { error } = await supabase.from('cards').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
  }, [user])

  return { getCards, saveCard, deleteCard }
}
