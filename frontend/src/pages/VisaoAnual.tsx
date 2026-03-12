import { useEffect, useState, useMemo } from 'react'
import { Pencil, Check } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area,
} from 'recharts'
import { getAnnualVision } from '../services/api'
import type { AnnualVisionData } from '../types'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function useLocalNumber(key: string, defaultValue = 0) {
  const [value, setValue] = useState<number>(() => {
    const stored = localStorage.getItem(key)
    return stored ? Number(stored) : defaultValue
  })
  const set = (v: number) => {
    localStorage.setItem(key, String(v))
    setValue(v)
  }
  return [value, set] as const
}

function InlineEdit({ value, onSave, label }: { value: number; onSave: (v: number) => void; label: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  const confirm = () => {
    const num = parseFloat(draft.replace(',', '.')) || 0
    onSave(num)
    setEditing(false)
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-gray-400 text-sm">{label}: R$</span>
        <input
          autoFocus
          className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-0.5 text-sm w-28"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={confirm}
          onKeyDown={e => e.key === 'Enter' && confirm()}
        />
        <button onClick={confirm} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-400">
      {label}: {formatCurrency(value)}
      <button onClick={() => { setDraft(String(value)); setEditing(true) }} className="text-gray-500 hover:text-gray-300 ml-1">
        <Pencil size={13} />
      </button>
    </span>
  )
}

export default function VisaoAnual() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState<AnnualVisionData | null>(null)
  const [salarioLiquido, setSalarioLiquido] = useLocalNumber('minhagrana_salario_liquido', 0)
  const [metaAnual, setMetaAnual] = useLocalNumber('minhagrana_meta_investimento_anual', 0)

  // Simulator state
  const [aporteMensal, setAporteMensal] = useState(500)
  const [taxaAnual, setTaxaAnual] = useState(12)
  const [periodo, setPeriodo] = useState(10)

  useEffect(() => {
    getAnnualVision(year).then(setData)
  }, [year])

  const currentMonth = data?.current_month ?? 0
  const accumulated = data?.accumulated ?? { income: 0, expenses: 0, investments: 0, free_balance: 0 }
  const avgExpense = data?.average_monthly_expense ?? 0

  // Bar chart data: real for past months, projected for future
  const barData = useMemo(() => {
    return MONTHS.map((name, i) => {
      const monthNum = i + 1
      const series = data?.monthly_series.find(s => s.month === monthNum)
      if (monthNum <= currentMonth && series) {
        return { name, income: series.income, expenses: series.expenses, investments: series.investments }
      }
      return {
        name,
        income: monthNum > currentMonth ? salarioLiquido : 0,
        expenses: monthNum > currentMonth ? avgExpense : 0,
        investments: 0,
      }
    })
  }, [data, currentMonth, salarioLiquido, avgExpense])

  // Simulator calculations
  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
  const n = periodo * 12
  const saldoFinal = taxaMensal > 0
    ? aporteMensal * (Math.pow(1 + taxaMensal, n) - 1) / taxaMensal
    : aporteMensal * n
  const totalAportado = aporteMensal * n
  const rendimento = saldoFinal - totalAportado

  const simData = useMemo(() => {
    const rows = []
    let saldo = 0
    for (let i = 1; i <= n; i++) {
      saldo = saldo * (1 + taxaMensal) + aporteMensal
      rows.push({ mes: i, saldo: parseFloat(saldo.toFixed(2)) })
    }
    return rows
  }, [aporteMensal, taxaMensal, n])

  const rangeLabel = currentMonth > 0
    ? `JAN–${MONTHS[currentMonth - 1].toUpperCase()}`
    : 'JAN–DEZ'

  const metaProgress = metaAnual > 0 ? Math.min((accumulated.investments / metaAnual) * 100, 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Visão Anual</h1>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
        >
          {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Section 1 — Accumulated */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Acumulado {rangeLabel} (Real)
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'RECEITAS', value: accumulated.income, color: 'text-green-400' },
            { label: 'DESPESAS', value: accumulated.expenses, color: 'text-red-400' },
            { label: 'INVESTIDO', value: accumulated.investments, color: 'text-blue-400' },
            { label: 'SALDO LIVRE', value: accumulated.free_balance, color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — Projection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Projeção {year}
          </h2>
          <InlineEdit value={salarioLiquido} onSave={setSalarioLiquido} label="Salário líquido mensal" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">RECEITA ANUAL PROJETADA</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(salarioLiquido * 12)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(salarioLiquido)}/mês · salário definido por você
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">DESPESA ANUAL PROJETADA</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(avgExpense * 12)}</p>
            <p className="text-xs text-gray-500 mt-1">
              ≈ {formatCurrency(avgExpense)}/mês · média dos meses anteriores
            </p>
          </div>
        </div>
      </div>

      {/* Section 3 — Monthly Bar Chart */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">Evolução Mensal {year}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
            <Legend verticalAlign="top" />
            {currentMonth > 0 && currentMonth < 12 && (
              <ReferenceLine
                x={MONTHS[currentMonth]}
                stroke="#6b7280"
                strokeDasharray="4 4"
                label={{ value: 'Projetado', position: 'insideTopRight', fill: '#9ca3af', fontSize: 11 }}
              />
            )}
            <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="investments" name="Investimentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section 4 — Investments */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: investments summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">📈 Investimentos</h2>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              TOTAL INVESTIDO EM {year}
            </p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(accumulated.investments)}</p>
            <p className="text-xs text-gray-500 mt-1">
              em {data?.monthly_investments.length ?? 0} aportes realizados
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>
                  <InlineEdit value={metaAnual} onSave={setMetaAnual} label="Meta anual" />
                </span>
                <span>{metaProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded h-2">
                <div
                  className="bg-green-500 h-2 rounded transition-all"
                  style={{ width: `${metaProgress}%` }}
                />
              </div>
              {metaAnual > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Faltam {formatCurrency(Math.max(metaAnual - accumulated.investments, 0))} para atingir a meta
                </p>
              )}
            </div>
          </div>

          {/* List of contributions */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">APORTES REALIZADOS</p>
            {data?.monthly_investments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum aporte registrado</p>
            ) : (
              <div className="space-y-2">
                {data?.monthly_investments.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {MONTHS[inv.month - 1]} · {inv.description}
                    </span>
                    <span className="text-blue-400 font-medium">{formatCurrency(inv.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: simulator */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 space-y-4">
          <h2 className="text-lg font-semibold text-white">SIMULADOR DE APORTES</h2>

          {/* Aporte mensal */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Aporte Mensal</span>
              <span className="text-white font-medium">{formatCurrency(aporteMensal)}</span>
            </div>
            <input
              type="range" min={0} max={10000} step={100} value={aporteMensal}
              onChange={e => setAporteMensal(Number(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>

          {/* Taxa */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Taxa de Rendimento Anual</span>
              <span className="text-white font-medium">{taxaAnual} %</span>
            </div>
            <input
              type="range" min={0} max={30} step={0.5} value={taxaAnual}
              onChange={e => setTaxaAnual(Number(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>

          {/* Período */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Período</span>
              <span className="text-white font-medium">{periodo} anos</span>
            </div>
            <input
              type="range" min={1} max={30} step={1} value={periodo}
              onChange={e => setPeriodo(Number(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>

          {/* Result card */}
          <div className="bg-gray-900 rounded-lg p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-1">TOTAL APORTADO</p>
              <p className="text-sm font-bold text-green-400">{formatCurrency(totalAportado)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">RENDIMENTO</p>
              <p className="text-sm font-bold text-amber-400">{formatCurrency(rendimento)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">SALDO FINAL</p>
              <p className="text-sm font-bold text-white">{formatCurrency(saldoFinal)}</p>
            </div>
          </div>

          {/* Area chart */}
          <div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={simData}>
                <defs>
                  <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={v => `M${v}`} interval={Math.max(1, Math.floor(n / 5))} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={l => `Mês ${l}`}
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="saldo" stroke="#10b981" fill="url(#simGradient)" strokeWidth={2} dot={false} name="Saldo" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 text-center mt-2">
              Projeção com juros compostos · taxa {taxaAnual}% a.a. · {periodo} ano(s)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
