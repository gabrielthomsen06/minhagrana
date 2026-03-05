export type CategoryType = 'expense' | 'income' | 'both'
export type TransactionType = 'income' | 'expense'

export interface Category {
  id: number
  name: string
  type: CategoryType
  icon?: string
  created_at: string
}

export interface Bank {
  id: number
  name: string
  created_at: string
}

export interface PaymentMethod {
  id: number
  name: string
  created_at: string
}

export interface Transaction {
  id: number
  type: TransactionType
  amount: number
  description: string
  category_id: number
  bank_id: number
  payment_method_id: number
  date: string
  installment_current?: number
  installment_total?: number
  installment_group_id?: string
  created_at: string
  updated_at: string
  category: Category
  bank: Bank
  payment_method: PaymentMethod
}

export interface DashboardSummary {
  income: number
  expenses: number
  balance: number
}

export interface CategoryExpense {
  category: string
  icon?: string
  total: number
}

export interface MonthlyEvolution {
  month: number
  income: number
  expenses: number
}
