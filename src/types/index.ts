export interface Transaction {
  id: string
  user_id: string
  group_id: string | null
  description: string
  bank: string
  installment: string
  amount: number
  type: 'expense' | 'extra'
  month: number
  year: number
  transaction_date: string | null
  created_at: string
  updated_at: string
}

export interface SalaryRule {
  id: string
  user_id: string
  date_num: number
  amount: number
}

export interface UserProfile {
  id: string
  email: string
  name: string
}

export interface MonthData {
  expenses: Transaction[]
  extras: Transaction[]
  salary: number
}

export interface Investment {
  id: string
  user_id: string
  name: string
  type: InvestmentType
  broker: string
  amount_invested: number
  current_value: number
  invested_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type InvestmentType = 'renda_fixa' | 'tesouro' | 'acoes' | 'fundos' | 'fiis' | 'cripto' | 'outro'

export interface AddInvestmentPayload {
  name: string
  type: InvestmentType
  broker: string
  amount_invested: number
  current_value: number
  invested_at: string
  notes?: string
}

export interface EditInvestmentPayload {
  name?: string
  type?: InvestmentType
  broker?: string
  amount_invested?: number
  current_value?: number
  invested_at?: string | null
  notes?: string | null
}

export type ExpenseInputType = 'total' | 'parcela' | 'fixo'

export interface AddExpensePayload {
  description: string
  amount: number
  qty: number
  date: string          // YYYY-MM-DD
  bank: string
  inputType: ExpenseInputType
}

export interface AddExtraPayload {
  description: string
  amount: number
  date: string
}

export interface EditPayload {
  description?: string
  amount?: number
  bank?: string
  transaction_date?: string | null
}
