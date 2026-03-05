import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'
import { getDashboardSummary, getDashboardByCategory, getMonthlyEvolution, getTransactions } from '../services/api'
import type { DashboardSummary, CategoryExpense, MonthlyEvolution, Transaction } from '../types'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Dashboard() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [byCategory, setByCategory] = useState<CategoryExpense[]>([])
  const [evolution, setEvolution] = useState<MonthlyEvolution[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    Promise.all([
      getDashboardSummary(month, year),
      getDashboardByCategory(month, year),
      getMonthlyEvolution(year),
      getTransactions({ month, year }),
    ]).then(([sum, cat, evo, trans]) => {
      setSummary(sum)
      setByCategory(cat)
      setEvolution(evo)
      setRecentTransactions(trans.slice(0, 10))
    })
  }, [month, year])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-5 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-lg"><TrendingUp className="text-green-400" size={20} /></div>
            <div>
              <p className="text-sm text-gray-400">Receitas</p>
              <p className="text-xl font-bold text-green-400">{summary ? formatCurrency(summary.income) : '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-lg"><TrendingDown className="text-red-400" size={20} /></div>
            <div>
              <p className="text-sm text-gray-400">Despesas</p>
              <p className="text-xl font-bold text-red-400">{summary ? formatCurrency(summary.expenses) : '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg"><DollarSign className="text-blue-400" size={20} /></div>
            <div>
              <p className="text-sm text-gray-400">Saldo</p>
              <p className={`text-xl font-bold ${summary && summary.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {summary ? formatCurrency(summary.balance) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Despesas por Categoria</h2>
          {byCategory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                  {byCategory.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Evolução Mensal {year}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={evolution.map(e => ({ ...e, name: MONTHS[e.month - 1] }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Últimas Transações</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhuma transação encontrada</p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.category.icon || '💳'}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{t.description}</p>
                    <p className="text-xs text-gray-400">{t.category.name} · {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
