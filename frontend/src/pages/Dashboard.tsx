import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import {
  getDashboardSummary,
  getByCategory,
  getMonthlyEvolution,
  getTransactions,
} from '../services/api'
import type {
  DashboardSummary,
  CategoryExpense,
  MonthlyEvolution,
  Transaction,
} from '../types'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#06b6d4',
]

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Dashboard() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [byCategory, setByCategory] = useState<CategoryExpense[]>([])
  const [evolution, setEvolution] = useState<MonthlyEvolution[]>([])
  const [lastTransactions, setLastTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    getDashboardSummary(month, year).then(setSummary).catch(() => setSummary(null))
    getByCategory(month, year).then(setByCategory).catch(() => setByCategory([]))
    getMonthlyEvolution(year).then(setEvolution).catch(() => setEvolution([]))
    getTransactions({ month, year })
      .then((t) => setLastTransactions(t.slice(0, 10)))
      .catch(() => setLastTransactions([]))
  }, [month, year])

  const evolutionData = evolution.map((e) => ({
    name: MONTH_NAMES[e.month - 1],
    Receitas: e.income,
    Despesas: e.expenses,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
          >
            {[2023, 2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Receitas"
          value={summary?.total_income ?? 0}
          icon={<TrendingUp size={24} />}
          color="green"
        />
        <SummaryCard
          label="Despesas"
          value={summary?.total_expenses ?? 0}
          icon={<TrendingDown size={24} />}
          color="red"
        />
        <SummaryCard
          label="Saldo"
          value={summary?.balance ?? 0}
          icon={<Wallet size={24} />}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Despesas por Categoria</h2>
          {byCategory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                >
                  {byCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Evolução Mensal {year}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtCurrency(v)} />
              <Legend />
              <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Last Transactions */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-300 mb-4">Últimas 10 Transações</h2>
        {lastTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">Sem transações neste período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-700">
                  <th className="pb-2 pr-4">Data</th>
                  <th className="pb-2 pr-4">Descrição</th>
                  <th className="pb-2 pr-4">Categoria</th>
                  <th className="pb-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lastTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 text-gray-400">
                      {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="py-2 pr-4 text-gray-200">{t.description || '—'}</td>
                    <td className="py-2 pr-4 text-gray-400">
                      {t.category ? `${t.category.icon ?? ''} ${t.category.name}` : '—'}
                    </td>
                    <td
                      className={`py-2 text-right font-medium ${
                        t.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} {fmtCurrency(Number(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'green' | 'red' | 'blue'
}) {
  const colorMap = {
    green: 'bg-green-900/40 text-green-400 border-green-800',
    red: 'bg-red-900/40 text-red-400 border-red-800',
    blue: 'bg-blue-900/40 text-blue-400 border-blue-800',
  }
  return (
    <div className={`rounded-xl p-5 border ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">
        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
    </div>
  )
}
