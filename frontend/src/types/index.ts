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
  closing_day?: number | null
  credit_limit?: number | null
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
  debit_expenses: number
  credit_expenses: number
  real_balance: number
}

export interface CreditCardSummary {
  bank_id: number
  bank_name: string
  closing_day: number
  credit_limit: number
  current_invoice_total: number
  available_limit: number
  period_start: string
  period_end: string
}

export interface CreditCardInvoiceTransaction {
  id: number
  description: string
  amount: number
  date: string
  category_name: string
  category_icon?: string
  installment_current?: number
  installment_total?: number
}

export interface CreditCardInvoice {
  bank_id: number
  bank_name: string
  closing_day: number
  credit_limit: number
  invoice_total: number
  available_limit: number
  period_start: string
  period_end: string
  transactions: CreditCardInvoiceTransaction[]
}

export interface InvestmentAccountItem {
  id: number
  bank_id: number
  bank_name: string
  balance: number
  percentage: number
  updated_at: string | null
}

export interface InvestmentPortfolio {
  total_balance: number
  accounts: InvestmentAccountItem[]
}

export interface ContributionTransaction {
  description: string
  amount: number
  date: string
  bank_name: string
}

export interface MonthlyContribution {
  month: number
  total: number
  transactions: ContributionTransaction[]
}

export interface InvestmentContributions {
  year: number
  total_contributed: number
  monthly: MonthlyContribution[]
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

export interface MonthlyInvestment {
  month: number
  description: string
  amount: number
}

export interface MonthlySeries {
  month: number
  income: number
  expenses: number
  investments: number
}

export interface AnnualVisionData {
  year: number
  current_month: number
  accumulated: {
    income: number
    expenses: number
    investments: number
    free_balance: number
  }
  average_monthly_expense: number
  monthly_investments: MonthlyInvestment[]
  monthly_series: MonthlySeries[]
}
