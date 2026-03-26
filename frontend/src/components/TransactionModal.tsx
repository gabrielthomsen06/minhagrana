import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Category, Bank, PaymentMethod, Transaction } from '../types'
import { getCategories, getBanks, getPaymentMethods } from '../services/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
  transaction?: Transaction | null
}

export default function TransactionModal({ isOpen, onClose, onSubmit, transaction }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category_id: '',
    bank_id: '',
    payment_method_id: '',
    date: new Date().toISOString().split('T')[0],
    installment_total: '',
  })

  useEffect(() => {
    if (!isOpen) return
    Promise.all([getCategories(), getBanks(), getPaymentMethods()]).then(([cats, banks, pms]) => {
      setCategories(cats)
      setBanks(banks)
      setPaymentMethods(pms)
    })
  }, [isOpen])

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: String(transaction.amount),
        description: transaction.description,
        category_id: String(transaction.category_id),
        bank_id: String(transaction.bank_id),
        payment_method_id: String(transaction.payment_method_id),
        date: transaction.date,
        installment_total: '',
      })
    }
  }, [transaction])

  useEffect(() => {
    if (!isOpen) {
      setForm({ type: 'expense', amount: '', description: '', category_id: '', bank_id: '', payment_method_id: '', date: new Date().toISOString().split('T')[0], installment_total: '' })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const categoryId = parseInt(form.category_id)
    const bankId = parseInt(form.bank_id)
    const paymentMethodId = parseInt(form.payment_method_id)
    const amount = parseFloat(form.amount)

    if (isNaN(categoryId) || isNaN(bankId) || isNaN(paymentMethodId) || isNaN(amount)) return

    const data: Record<string, unknown> = {
      type: form.type, amount, description: form.description,
      category_id: categoryId, bank_id: bankId, payment_method_id: paymentMethodId, date: form.date,
    }
    if (!transaction && form.installment_total && parseInt(form.installment_total) > 1) {
      data.installment_total = parseInt(form.installment_total)
    }
    onSubmit(data)
  }

  const filteredCategories = categories.filter(c => c.type === form.type || c.type === 'both')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-7 w-full max-w-lg shadow-2xl shadow-black/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{transaction ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <button type="button" onClick={() => setForm(f => ({ ...f, type: 'expense', category_id: '' }))}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                form.type === 'expense'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}>
              Despesa
            </button>
            <button type="button" onClick={() => setForm(f => ({ ...f, type: 'income', category_id: '' }))}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                form.type === 'income'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}>
              Receita
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Descrição</label>
            <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="glass-input w-full" placeholder="Ex: Almoço, Salário..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Valor (R$)</label>
              <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Data</label>
              <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="glass-input w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Categoria</label>
            <select required value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="glass-select w-full">
              <option value="">Selecione...</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Banco</label>
              <select required value={form.bank_id} onChange={e => setForm(f => ({ ...f, bank_id: e.target.value }))} className="glass-select w-full">
                <option value="">Selecione...</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Pagamento</label>
              <select required value={form.payment_method_id} onChange={e => setForm(f => ({ ...f, payment_method_id: e.target.value }))} className="glass-select w-full">
                <option value="">Selecione...</option>
                {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {!transaction && (
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Parcelas (opcional)</label>
              <input type="number" min="1" max="60" value={form.installment_total} onChange={e => setForm(f => ({ ...f, installment_total: e.target.value }))}
                placeholder="Ex: 12 para 12x" className="glass-input w-full" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
