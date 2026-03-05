import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Transaction, Category, Bank, PaymentMethod } from '../types'
import { getCategories, getBanks, getPaymentMethods } from '../services/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  transaction?: Transaction | null
  loading?: boolean
}

const defaultForm = {
  type: 'expense',
  amount: '',
  description: '',
  category_id: '',
  bank_id: '',
  payment_method_id: '',
  date: new Date().toISOString().slice(0, 10),
  installment_total: '',
}

export default function TransactionModal({ isOpen, onClose, onSave, transaction, loading }: Props) {
  const [form, setForm] = useState({ ...defaultForm })
  const [categories, setCategories] = useState<Category[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  useEffect(() => {
    if (!isOpen) return
    Promise.all([getCategories(), getBanks(), getPaymentMethods()]).then(([c, b, pm]) => {
      setCategories(c)
      setBanks(b)
      setPaymentMethods(pm)
    })
  }, [isOpen])

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: String(transaction.amount),
        description: transaction.description || '',
        category_id: transaction.category_id ? String(transaction.category_id) : '',
        bank_id: transaction.bank_id ? String(transaction.bank_id) : '',
        payment_method_id: transaction.payment_method_id
          ? String(transaction.payment_method_id)
          : '',
        date: transaction.date.slice(0, 10),
        installment_total: '',
      })
    } else {
      setForm({ ...defaultForm })
    }
  }, [transaction, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description || undefined,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      bank_id: form.bank_id ? parseInt(form.bank_id) : null,
      payment_method_id: form.payment_method_id ? parseInt(form.payment_method_id) : null,
      date: new Date(form.date + 'T12:00:00').toISOString(),
      installment_total: form.installment_total ? parseInt(form.installment_total) : undefined,
    })
  }

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === 'both',
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tipo */}
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t, category_id: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {t === 'expense' ? 'Despesa' : 'Receita'}
              </button>
            ))}
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Data</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Categoria</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione...</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Banco */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Banco</label>
            <select
              value={form.bank_id}
              onChange={(e) => setForm((f) => ({ ...f, bank_id: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione...</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Forma de Pagamento</label>
            <select
              value={form.payment_method_id}
              onChange={(e) => setForm((f) => ({ ...f, payment_method_id: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione...</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Parcelas (apenas para novas transações) */}
          {!transaction && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Parcelar em (deixe vazio para à vista)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.installment_total}
                onChange={(e) => setForm((f) => ({ ...f, installment_total: e.target.value }))}
                placeholder="Ex: 12"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
