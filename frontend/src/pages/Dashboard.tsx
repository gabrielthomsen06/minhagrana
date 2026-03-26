import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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
      setRecentTransactions(trans.slice(0, 8))
    })
  }, [month, year])

  const summaryCards = [
    {
      label: 'Receitas',
      value: summary?.income ?? 0,
      icon: TrendingUp,
      arrow: ArrowUpRight,
      gradient: 'from-green-500 to-emerald-600',
      shadowColor: 'shadow-green-500/15',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/20',
    },
    {
      label: 'Despesas',
      value: summary?.expenses ?? 0,
      icon: TrendingDown,
      arrow: ArrowDownRight,
      gradient: 'from-red-500 to-rose-600',
      shadowColor: 'shadow-red-500/15',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/20',
    },
    {
      label: 'Saldo',
      value: summary?.balance ?? 0,
      icon: DollarSign,
      arrow: summary && summary.balance >= 0 ? ArrowUpRight : ArrowDownRight,
      gradient: 'from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/15',
      textColor: summary && summary.balance >= 0 ? 'text-blue-400' : 'text-red-400',
      borderColor: 'border-blue-500/20',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral das suas finanças</p>
        </div>
        <div className="flex gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="glass-select">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="glass-select">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-5">
        {summaryCards.map(({ label, value, icon: Icon, gradient, shadowColor, textColor, borderColor }) => (
          <div key={label} className={`glass-card p-5 ${borderColor}`}>
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadowColor}`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
                <p className={`text-2xl font-bold ${textColor} tracking-tight`}>
                  {summary ? formatCurrency(value) : '—'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-5">Despesas por Categoria</h2>
          {byCategory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">Sem dados para este período</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  strokeWidth={0}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {byCategory.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-5">Evolução Mensal {year}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evolution.map(e => ({ ...e, name: MONTHS[e.month - 1] }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-5">Últimas Transações</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Nenhuma transação encontrada</p>
        ) : (
          <div className="space-y-1">
            {recentTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/[0.02] transition-colors duration-150">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                    t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {t.category.icon || '💳'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.description}</p>
                    <p className="text-xs text-gray-500">{t.category.name} · {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
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
