import { useEffect, useState } from 'react'
import { CreditCard, ChevronDown, ChevronUp, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react'
import { getCreditCardsSummary, getCreditCardInvoice } from '../services/api'
import type { CreditCardSummary, CreditCardInvoice } from '../types'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function getUsageColor(percent: number) {
  if (percent >= 80) return 'from-red-500 to-rose-500'
  if (percent >= 50) return 'from-amber-500 to-orange-500'
  return 'from-green-500 to-emerald-500'
}

function getUsageTextColor(percent: number) {
  if (percent >= 80) return 'text-red-400'
  if (percent >= 50) return 'text-amber-400'
  return 'text-green-400'
}

function getUsageBadge(percent: number) {
  if (percent >= 80) return { icon: AlertTriangle, label: 'Limite alto', bg: 'bg-red-500/10 border-red-500/20 text-red-400' }
  if (percent >= 50) return { icon: AlertTriangle, label: 'Atencao', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' }
  return { icon: ShieldCheck, label: 'Saudavel', bg: 'bg-green-500/10 border-green-500/20 text-green-400' }
}

export default function CreditCards() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [cards, setCards] = useState<CreditCardSummary[]>([])
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [invoiceDetail, setInvoiceDetail] = useState<CreditCardInvoice | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  useEffect(() => {
    getCreditCardsSummary(month, year).then(setCards)
    setExpandedCard(null)
    setInvoiceDetail(null)
  }, [month, year])

  const toggleCard = async (bankId: number) => {
    if (expandedCard === bankId) {
      setExpandedCard(null)
      setInvoiceDetail(null)
      return
    }
    setExpandedCard(bankId)
    setLoadingInvoice(true)
    try {
      const detail = await getCreditCardInvoice(bankId, month, year)
      setInvoiceDetail(detail)
    } finally {
      setLoadingInvoice(false)
    }
  }

  const totalFaturas = cards.reduce((sum, c) => sum + c.current_invoice_total, 0)
  const totalLimite = cards.reduce((sum, c) => sum + c.credit_limit, 0)
  const totalDisponivel = cards.reduce((sum, c) => sum + c.available_limit, 0)
  const totalPercent = totalLimite > 0 ? (totalFaturas / totalLimite) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cartoes de Credito</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe suas faturas e limites</p>
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

      {/* Total Overview */}
      <div className="glass-card p-6 border-purple-500/20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <CreditCard size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Total de Faturas</p>
              <p className={`text-3xl font-bold ${getUsageTextColor(totalPercent)} tracking-tight`}>
                {formatCurrency(totalFaturas)}
              </p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-gray-500">Limite Total</span>
              <span className="text-sm font-semibold text-white">{formatCurrency(totalLimite)}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-gray-500">Disponivel</span>
              <span className="text-sm font-semibold text-green-400">{formatCurrency(totalDisponivel)}</span>
            </div>
          </div>
        </div>
        <div className="relative h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getUsageColor(totalPercent)} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(totalPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">{totalPercent.toFixed(1)}% do limite total utilizado</p>
      </div>

      {/* Individual Cards */}
      {cards.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CreditCard size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum cartao de credito cadastrado</p>
          <p className="text-xs text-gray-600 mt-1">Configure os dados do cartao na pagina de Bancos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map(card => {
            const usagePercent = card.credit_limit > 0 ? (card.current_invoice_total / card.credit_limit) * 100 : 0
            const badge = getUsageBadge(usagePercent)
            const BadgeIcon = badge.icon
            const isExpanded = expandedCard === card.bank_id

            return (
              <div key={card.bank_id} className="glass-card overflow-hidden border-purple-500/10">
                {/* Card Header */}
                <button
                  onClick={() => toggleCard(card.bank_id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/15">
                      <CreditCard size={18} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold text-white">{card.bank_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-500">
                          Fecha dia {card.closing_day} &middot; {formatDate(card.period_start)} a {formatDate(card.period_end)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${badge.bg}`}>
                      <BadgeIcon size={12} />
                      {badge.label}
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getUsageTextColor(usagePercent)}`}>
                        {formatCurrency(card.current_invoice_total)}
                      </p>
                      <p className="text-xs text-gray-500">de {formatCurrency(card.credit_limit)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-5 pb-4">
                  <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getUsageColor(usagePercent)} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-gray-500">{usagePercent.toFixed(0)}% utilizado</span>
                    <span className="text-xs text-gray-400">Disponivel: {formatCurrency(card.available_limit)}</span>
                  </div>
                </div>

                {/* Expanded Invoice Detail */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06]">
                    {loadingInvoice ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : invoiceDetail && invoiceDetail.transactions.length > 0 ? (
                      <div className="divide-y divide-white/[0.04]">
                        {invoiceDetail.transactions.map(t => (
                          <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-sm">
                                {t.category_icon || '\uD83D\uDCB3'}
                              </div>
                              <div>
                                <p className="text-sm text-white font-medium">
                                  {t.description}
                                  {t.installment_total && t.installment_total > 1 && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({t.installment_current}/{t.installment_total})
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">{t.category_name} &middot; {formatDate(t.date)}</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-red-400 tabular-nums">
                              -{formatCurrency(t.amount)}
                            </span>
                          </div>
                        ))}
                        {/* Total */}
                        <div className="flex items-center justify-between px-5 py-4 bg-white/[0.02]">
                          <span className="text-sm font-semibold text-gray-300">Total da Fatura</span>
                          <span className={`text-lg font-bold ${getUsageTextColor(usagePercent)}`}>
                            {formatCurrency(invoiceDetail.invoice_total)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">Nenhuma transacao nesta fatura</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
