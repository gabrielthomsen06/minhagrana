import axios from 'axios'
import type {
  Transaction,
  TransactionCreate,
  Category,
  Bank,
  PaymentMethod,
  DashboardSummary,
  CategoryExpense,
  MonthlyEvolution,
} from '../types'

const api = axios.create({
  baseURL: '/api',
})

// ── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions = (params?: Record<string, unknown>) =>
  api.get<Transaction[]>('/transactions', { params }).then((r) => r.data)

export const createTransaction = (data: TransactionCreate) =>
  api.post<Transaction[]>('/transactions', data).then((r) => r.data)

export const updateTransaction = (id: number, data: Partial<TransactionCreate>) =>
  api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data)

export const deleteTransaction = (id: number, deleteGroup = false) =>
  api.delete(`/transactions/${id}`, { params: { delete_group: deleteGroup } })

// ── Categories ───────────────────────────────────────────────────────────────
export const getCategories = (type?: string) =>
  api.get<Category[]>('/categories', { params: type ? { type } : {} }).then((r) => r.data)

export const createCategory = (data: Partial<Category>) =>
  api.post<Category>('/categories', data).then((r) => r.data)

export const updateCategory = (id: number, data: Partial<Category>) =>
  api.put<Category>(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id: number) => api.delete(`/categories/${id}`)

// ── Banks ─────────────────────────────────────────────────────────────────────
export const getBanks = () => api.get<Bank[]>('/banks').then((r) => r.data)

export const createBank = (data: Partial<Bank>) =>
  api.post<Bank>('/banks', data).then((r) => r.data)

export const updateBank = (id: number, data: Partial<Bank>) =>
  api.put<Bank>(`/banks/${id}`, data).then((r) => r.data)

export const deleteBank = (id: number) => api.delete(`/banks/${id}`)

// ── Payment Methods ───────────────────────────────────────────────────────────
export const getPaymentMethods = () =>
  api.get<PaymentMethod[]>('/payment-methods').then((r) => r.data)

export const createPaymentMethod = (data: Partial<PaymentMethod>) =>
  api.post<PaymentMethod>('/payment-methods', data).then((r) => r.data)

export const updatePaymentMethod = (id: number, data: Partial<PaymentMethod>) =>
  api.put<PaymentMethod>(`/payment-methods/${id}`, data).then((r) => r.data)

export const deletePaymentMethod = (id: number) => api.delete(`/payment-methods/${id}`)

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardSummary = (month: number, year: number) =>
  api
    .get<DashboardSummary>('/dashboard/summary', { params: { month, year } })
    .then((r) => r.data)

export const getByCategory = (month: number, year: number) =>
  api
    .get<CategoryExpense[]>('/dashboard/by-category', { params: { month, year } })
    .then((r) => r.data)

export const getMonthlyEvolution = (year: number) =>
  api
    .get<MonthlyEvolution[]>('/dashboard/monthly-evolution', { params: { year } })
    .then((r) => r.data)

export default api
