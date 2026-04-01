import axios from 'axios'
import type { Category, Bank, PaymentMethod, Transaction, DashboardSummary, CategoryExpense, MonthlyEvolution, AnnualVisionData, CreditCardSummary, CreditCardInvoice, InvestmentPortfolio, InvestmentContributions } from '../types'

const api = axios.create({
  baseURL: '/api',
})

// Auth
export const loginApi = (username: string, password: string) =>
  api.post<{ token: string; username: string }>('/auth/login', { username, password }).then(r => r.data)

// Categories
export const getCategories = (type?: string) =>
  api.get<Category[]>('/categories', { params: type ? { type } : {} }).then(r => r.data)
export const createCategory = (data: Partial<Category>) =>
  api.post<Category>('/categories', data).then(r => r.data)
export const updateCategory = (id: number, data: Partial<Category>) =>
  api.put<Category>(`/categories/${id}`, data).then(r => r.data)
export const deleteCategory = (id: number) =>
  api.delete(`/categories/${id}`)

// Banks
export const getBanks = () =>
  api.get<Bank[]>('/banks').then(r => r.data)
export const createBank = (data: Partial<Bank>) =>
  api.post<Bank>('/banks', data).then(r => r.data)
export const updateBank = (id: number, data: Partial<Bank>) =>
  api.put<Bank>(`/banks/${id}`, data).then(r => r.data)
export const deleteBank = (id: number) =>
  api.delete(`/banks/${id}`)

// Payment Methods
export const getPaymentMethods = () =>
  api.get<PaymentMethod[]>('/payment-methods').then(r => r.data)
export const createPaymentMethod = (data: Partial<PaymentMethod>) =>
  api.post<PaymentMethod>('/payment-methods', data).then(r => r.data)
export const updatePaymentMethod = (id: number, data: Partial<PaymentMethod>) =>
  api.put<PaymentMethod>(`/payment-methods/${id}`, data).then(r => r.data)
export const deletePaymentMethod = (id: number) =>
  api.delete(`/payment-methods/${id}`)

// Transactions
export const getTransactions = (params?: Record<string, unknown>) =>
  api.get<Transaction[]>('/transactions', { params }).then(r => r.data)
export const createTransaction = (data: Record<string, unknown>) =>
  api.post<Transaction>('/transactions', data).then(r => r.data)
export const updateTransaction = (id: number, data: Record<string, unknown>) =>
  api.put<Transaction>(`/transactions/${id}`, data).then(r => r.data)
export const deleteTransaction = (id: number, deleteGroup = false) =>
  api.delete(`/transactions/${id}`, { params: { delete_group: deleteGroup } })

// Dashboard
export const getDashboardSummary = (month: number, year: number) =>
  api.get<DashboardSummary>('/dashboard/summary', { params: { month, year } }).then(r => r.data)
export const getDashboardByCategory = (month: number, year: number) =>
  api.get<CategoryExpense[]>('/dashboard/by-category', { params: { month, year } }).then(r => r.data)
export const getMonthlyEvolution = (year: number) =>
  api.get<MonthlyEvolution[]>('/dashboard/monthly-evolution', { params: { year } }).then(r => r.data)

// Credit Cards
export const getCreditCardsSummary = (month: number, year: number) =>
  api.get<CreditCardSummary[]>('/credit-cards/summary', { params: { month, year } }).then(r => r.data)
export const getCreditCardInvoice = (bankId: number, month: number, year: number) =>
  api.get<CreditCardInvoice>('/credit-cards/invoice', { params: { bank_id: bankId, month, year } }).then(r => r.data)

// Investments
export const getInvestmentPortfolio = () =>
  api.get<InvestmentPortfolio>('/investments/portfolio').then(r => r.data)
export const createInvestmentAccount = (data: { bank_id: number; balance: number }) =>
  api.post('/investments/portfolio', data).then(r => r.data)
export const updateInvestmentAccount = (id: number, data: { balance: number }) =>
  api.put(`/investments/portfolio/${id}`, data).then(r => r.data)
export const deleteInvestmentAccount = (id: number) =>
  api.delete(`/investments/portfolio/${id}`)
export const getInvestmentContributions = (year: number) =>
  api.get<InvestmentContributions>('/investments/contributions', { params: { year } }).then(r => r.data)

// Export
export const exportCSV = (startDate: string, endDate: string) =>
  api.get('/export/csv', { params: { start_date: startDate, end_date: endDate }, responseType: 'blob' }).then(r => r.data)
export const exportExcel = (startDate: string, endDate: string) =>
  api.get('/export/excel', { params: { start_date: startDate, end_date: endDate }, responseType: 'blob' }).then(r => r.data)

// Annual Vision
export const getAnnualVision = (year: number) =>
  api.get<AnnualVisionData>('/annual-vision', { params: { year } }).then(r => r.data)
