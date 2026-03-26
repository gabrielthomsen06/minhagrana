import { useEffect, useState, useMemo } from 'react'
import { Pencil, Check, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area,
} from 'recharts'
import { getAnnualVision } from '../services/api'
import type { AnnualVisionData } from '../types'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const tooltipStyle = {
  background: 'rgba(15, 23, 42, 0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
}

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
        <span className="text-gray-500 text-sm">{label}: R$</span>
        <input
          autoFocus
          className="glass-input w-28 !py-1 !px-2 text-sm"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={confirm}
          onKeyDown={e => e.key === 'Enter' && confirm()}
        />
        <button onClick={confirm} className="text-green-400 hover:text-green-300 cursor-pointer"><Check size={14} /></button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-500">
      {label}: {formatCurrency(value)}
      <button onClick={() => { setDraft(String(value)); setEditing(true) }} className="text-gray-600 hover:text-gray-300 ml-1 cursor-pointer">
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

  const [aporteMensal, setAporteMensal] = useState(500)
  const [taxaAnual, setTaxaAnual] = useState(12)
  const [periodo, setPeriodo] = useState(10)

  useEffect(() => { getAnnualVision(year).then(setData) }, [year])

  const currentMonth = data?.current_month ?? 0
  const accumulated = data?.accumulated ?? { income: 0, expenses: 0, investments: 0, free_balance: 0 }
  const avgExpense = data?.average_monthly_expense ?? 0

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

  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
  const n = periodo * 12
  const saldoFinal = taxaMensal > 0 ? aporteMensal * (Math.pow(1 + taxaMensal, n) - 1) / taxaMensal : aporteMensal * n
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

  const rangeLabel = currentMonth > 0 ? `JAN–${MONTHS[currentMonth - 1].toUpperCase()}` : 'JAN–DEZ'
  const metaProgress = metaAnual > 0 ? Math.min((accumulated.investments / metaAnual) * 100, 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Visão Anual</h1>
          <p className="text-sm text-gray-500 mt-1">Projeções e simulações financeiras</p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="glass-select">
          {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Accumulated */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Acumulado {rangeLabel} (Real)
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Receitas', value: accumulated.income, color: 'text-green-400', border: 'border-green-500/15' },
            { label: 'Despesas', value: accumulated.expenses, color: 'text-red-400', border: 'border-red-500/15' },
            { label: 'Investido', value: accumulated.investments, color: 'text-blue-400', border: 'border-blue-500/15' },
            { label: 'Saldo Livre', value: accumulated.free_balance, color: 'text-emerald-400', border: 'border-emerald-500/15' },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={`glass-card p-5 ${border}`}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-bold ${color} tabular-nums`}>{formatCurrency(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Projection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Projeção {year}</h2>
          <InlineEdit value={salarioLiquido} onSave={setSalarioLiquido} label="Salário líquido mensal" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-5 border-green-500/15">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Receita Anual Projetada</p>
            <p className="text-xl font-bold text-green-400 tabular-nums">{formatCurrency(salarioLiquido * 12)}</p>
            <p className="text-xs text-gray-600 mt-1">{formatCurrency(salarioLiquido)}/mês · salário definido por você</p>
          </div>
          <div className="glass-card p-5 border-red-500/15">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Despesa Anual Projetada</p>
            <p className="text-xl font-bold text-red-400 tabular-nums">{formatCurrency(avgExpense * 12)}</p>
            <p className="text-xs text-gray-600 mt-1">≈ {formatCurrency(avgExpense)}/mês · média dos meses anteriores</p>
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-5">Evolução Mensal {year}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
            <Legend verticalAlign="top" />
            {currentMonth > 0 && currentMonth < 12 && (
              <ReferenceLine x={MONTHS[currentMonth]} stroke="#475569" strokeDasharray="4 4"
                label={{ value: 'Projetado', position: 'insideTopRight', fill: '#64748b', fontSize: 11 }} />
            )}
            <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
            <Bar dataKey="investments" name="Investimentos" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Investments Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: investments summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-green-400" />
            <h2 className="text-base font-semibold text-white">Investimentos</h2>
          </div>

          <div className="glass-card p-5 border-green-500/15">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Investido em {year}</p>
            <p className="text-2xl font-bold text-green-400 tabular-nums">{formatCurrency(accumulated.investments)}</p>
            <p className="text-xs text-gray-600 mt-1">em {data?.monthly_investments.length ?? 0} aportes realizados</p>

            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <InlineEdit value={metaAnual} onSave={setMetaAnual} label="Meta anual" />
                <span className="font-medium">{metaProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/[0.04] rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${metaProgress}%` }} />
              </div>
              {metaAnual > 0 && (
                <p className="text-xs text-gray-600 mt-1.5">
                  Faltam {formatCurrency(Math.max(metaAnual - accumulated.investments, 0))} para atingir a meta
                </p>
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Aportes Realizados</p>
            {data?.monthly_investments.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum aporte registrado</p>
            ) : (
              <div className="space-y-2.5">
                {data?.monthly_investments.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{MONTHS[inv.month - 1]} · {inv.description}</span>
                    <span className="text-blue-400 font-medium tabular-nums">{formatCurrency(inv.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: simulator */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-white uppercase tracking-wider">Simulador de Aportes</h2>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500">Aporte Mensal</span>
              <span className="text-white font-medium tabular-nums">{formatCurrency(aporteMensal)}</span>
            </div>
            <input type="range" min={0} max={10000} step={100} value={aporteMensal}
              onChange={e => setAporteMensal(Number(e.target.value))} className="w-full accent-green-500 cursor-pointer" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500">Taxa de Rendimento Anual</span>
              <span className="text-white font-medium">{taxaAnual} %</span>
            </div>
            <input type="range" min={0} max={30} step={0.5} value={taxaAnual}
              onChange={e => setTaxaAnual(Number(e.target.value))} className="w-full accent-green-500 cursor-pointer" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500">Período</span>
              <span className="text-white font-medium">{periodo} anos</span>
            </div>
            <input type="range" min={1} max={30} step={1} value={periodo}
              onChange={e => setPeriodo(Number(e.target.value))} className="w-full accent-green-500 cursor-pointer" />
          </div>

          {/* Result */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Aportado</p>
              <p className="text-sm font-bold text-green-400 tabular-nums">{formatCurrency(totalAportado)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Rendimento</p>
              <p className="text-sm font-bold text-amber-400 tabular-nums">{formatCurrency(rendimento)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Saldo Final</p>
              <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(saldoFinal)}</p>
            </div>
          </div>

          {/* Area chart */}
          <div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={simData}>
                <defs>
                  <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `M${v}`} interval={Math.max(1, Math.floor(n / 5))} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Mês ${l}`} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="saldo" stroke="#10b981" fill="url(#simGradient)" strokeWidth={2} dot={false} name="Saldo" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 text-center mt-2">
              Projeção com juros compostos · taxa {taxaAnual}% a.a. · {periodo} ano(s)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
