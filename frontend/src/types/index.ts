export interface Category {
  id: number
  name: string
  type: 'expense' | 'income' | 'both'
  icon: string | null
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
  type: 'income' | 'expense'
  amount: number
  description: string | null
  category_id: number | null
  bank_id: number | null
  payment_method_id: number | null
  date: string
  installment_current: number | null
  installment_total: number | null
  installment_group_id: string | null
  created_at: string
  updated_at: string
  category: Category | null
  bank: Bank | null
  payment_method: PaymentMethod | null
}

export interface TransactionCreate {
  type: 'income' | 'expense'
  amount: number
  description?: string
  category_id?: number | null
  bank_id?: number | null
  payment_method_id?: number | null
  date: string
  installment_total?: number
}

export interface DashboardSummary {
  total_income: number
  total_expenses: number
  balance: number
  month: number
  year: number
}

export interface CategoryExpense {
  category: string
  icon: string | null
  total: number
}

export interface MonthlyEvolution {
  month: number
  income: number
  expenses: number
}
