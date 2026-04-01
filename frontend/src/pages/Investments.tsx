import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, Pencil, Check, X, Plus, Trash2, Building2 } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import toast from 'react-hot-toast'
import {
  getInvestmentPortfolio, getInvestmentContributions,
  updateInvestmentAccount, createInvestmentAccount, deleteInvestmentAccount,
  getBanks,
} from '../services/api'
import type { InvestmentPortfolio, InvestmentContributions, Bank } from '../types'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#f97316']

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

export default function Investments() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [portfolio, setPortfolio] = useState<InvestmentPortfolio | null>(null)
  const [contributions, setContributions] = useState<InvestmentContributions | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBankId, setNewBankId] = useState<number | ''>('')
  const [newBalance, setNewBalance] = useState('')

  // Simulator
  const [aporteMensal, setAporteMensal] = useState(600)
  const [taxaAnual, setTaxaAnual] = useState(12)
  const [periodo, setPeriodo] = useState(10)

  const loadData = () => {
    getInvestmentPortfolio().then(setPortfolio)
    getInvestmentContributions(year).then(setContributions)
    getBanks().then(setBanks)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { getInvestmentContributions(year).then(setContributions) }, [year])

  const startEdit = (id: number, currentBalance: number) => {
    setEditingId(id)
    setEditValue(String(currentBalance))
  }

  const saveEdit = async (id: number) => {
    const val = parseFloat(editValue.replace(',', '.'))
    if (isNaN(val)) return
    try {
      await updateInvestmentAccount(id, { balance: val })
      toast.success('Saldo atualizado!')
      setEditingId(null)
      loadData()
    } catch { toast.error('Erro ao atualizar') }
  }

  const handleAdd = async () => {
    if (!newBankId || !newBalance) return
    try {
      await createInvestmentAccount({ bank_id: Number(newBankId), balance: parseFloat(newBalance.replace(',', '.')) })
      toast.success('Conta adicionada!')
      setShowAddForm(false)
      setNewBankId('')
      setNewBalance('')
      loadData()
    } catch { toast.error('Erro ao adicionar (ja existe conta para esse banco?)') }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteInvestmentAccount(id)
      toast.success('Conta removida!')
      loadData()
    } catch { toast.error('Erro ao remover') }
  }

  // Simulator calculations
  const saldoInicial = portfolio?.total_balance ?? 0
  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1
  const n = periodo * 12
  const saldoFinal = taxaMensal > 0
    ? saldoInicial * Math.pow(1 + taxaMensal, n) + aporteMensal * (Math.pow(1 + taxaMensal, n) - 1) / taxaMensal
    : saldoInicial + aporteMensal * n
  const totalAportado = saldoInicial + aporteMensal * n
  const rendimento = saldoFinal - totalAportado

  const simData = useMemo(() => {
    const rows = []
    let saldo = saldoInicial
    for (let i = 1; i <= n; i++) {
      saldo = saldo * (1 + taxaMensal) + aporteMensal
      rows.push({ mes: i, saldo: parseFloat(saldo.toFixed(2)) })
    }
    return rows
  }, [saldoInicial, aporteMensal, taxaMensal, n])

  // Pie data
  const pieData = portfolio?.accounts.map(a => ({ name: a.bank_name, value: a.balance })) ?? []

  // Banks available for new account (not already in portfolio)
  const usedBankIds = portfolio?.accounts.map(a => a.bank_id) ?? []
  const availableBanks = banks.filter(b => !usedBankIds.includes(b.id))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Investimentos</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe sua carteira e simule o futuro</p>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-3 gap-5">
        {/* Total Card */}
        <div className="glass-card p-6 border-green-500/20 col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Patrimonio Total</p>
              <p className="text-3xl font-bold text-green-400 tracking-tight">
                {portfolio ? formatCurrency(portfolio.total_balance) : '\u2014'}
              </p>
            </div>
          </div>

          {/* Contributions this year */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Aportado em {year}</span>
              <span className="text-sm font-semibold text-blue-400">
                {contributions ? formatCurrency(contributions.total_contributed) : '\u2014'}
              </span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-6 col-span-1">
          <h2 className="text-sm font-semibold text-white mb-3">Distribuicao da Carteira</h2>
          {pieData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Nenhuma conta cadastrada</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  strokeWidth={0}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Accounts List */}
        <div className="glass-card p-6 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Contas</h2>
            {availableBanks.length > 0 && (
              <button onClick={() => setShowAddForm(!showAddForm)} className="text-green-400 hover:text-green-300 cursor-pointer">
                <Plus size={16} />
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="flex gap-2 items-end mb-4 pb-4 border-b border-white/[0.06]">
              <select
                value={newBankId}
                onChange={e => setNewBankId(Number(e.target.value))}
                className="glass-input text-sm !py-1.5 flex-1"
              >
                <option value="">Banco...</option>
                {availableBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input
                placeholder="Saldo"
                value={newBalance}
                onChange={e => setNewBalance(e.target.value)}
                className="glass-input text-sm !py-1.5 w-28"
              />
              <button onClick={handleAdd} className="text-green-400 hover:text-green-300 cursor-pointer"><Check size={16} /></button>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-300 cursor-pointer"><X size={16} /></button>
            </div>
          )}

          <div className="space-y-3">
            {portfolio?.accounts.map((acc, i) => (
              <div key={acc.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-300">{acc.bank_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === acc.id ? (
                    <>
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(acc.id)}
                        className="glass-input text-sm !py-1 !px-2 w-28 text-right"
                      />
                      <button onClick={() => saveEdit(acc.id)} className="text-green-400 hover:text-green-300 cursor-pointer"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300 cursor-pointer"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-white tabular-nums">{formatCurrency(acc.balance)}</span>
                      <button onClick={() => startEdit(acc.id, acc.balance)} className="text-gray-600 hover:text-gray-300 cursor-pointer"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(acc.id)} className="text-gray-600 hover:text-red-400 cursor-pointer"><Trash2 size={12} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contributions + Simulator side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Contributions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Aportes Realizados</h2>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="glass-select text-sm">
              {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {!contributions || contributions.monthly.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-500 text-sm">Nenhum aporte registrado em {year}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.monthly.map(m => (
                <div key={m.month} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{MONTHS[m.month - 1]}</span>
                    <span className="text-sm font-bold text-blue-400 tabular-nums">{formatCurrency(m.total)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {m.transactions.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{t.description} <span className="text-gray-600">({t.bank_name})</span></span>
                        <span className="text-gray-300 tabular-nums">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Simulator */}
        <div className="glass-card p-6 space-y-5 border-green-500/10 h-fit">
          <h2 className="text-base font-semibold text-white uppercase tracking-wider">Simulador de Investimentos</h2>

          {/* Starting balance info */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Saldo inicial (patrimonio atual)</span>
            <span className="text-sm font-semibold text-green-400">{formatCurrency(saldoInicial)}</span>
          </div>

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
              <span className="text-gray-500">Periodo</span>
              <span className="text-white font-medium">{periodo} anos</span>
            </div>
            <input type="range" min={1} max={30} step={1} value={periodo}
              onChange={e => setPeriodo(Number(e.target.value))} className="w-full accent-green-500 cursor-pointer" />
          </div>

          {/* Results */}
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

          {/* Chart */}
          <div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={simData}>
                <defs>
                  <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `M${v}`} interval={Math.max(1, Math.floor(n / 5))} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Mes ${l}`} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="saldo" stroke="#10b981" fill="url(#invGradient)" strokeWidth={2} dot={false} name="Saldo" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 text-center mt-2">
              Projecao com juros compostos &middot; saldo inicial {formatCurrency(saldoInicial)} + {formatCurrency(aporteMensal)}/mes &middot; taxa {taxaAnual}% a.a. &middot; {periodo} ano(s)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
