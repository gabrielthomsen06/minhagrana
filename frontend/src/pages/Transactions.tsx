import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  getBanks,
  getPaymentMethods,
} from '../services/api'
import type { Transaction, Category, Bank, PaymentMethod } from '../types'
import TransactionModal from '../components/TransactionModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Transactions() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [type, setType] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [bankId, setBankId] = useState('')

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadTransactions = () => {
    const params: Record<string, unknown> = { month, year }
    if (type) params.type = type
    if (categoryId) params.category_id = categoryId
    if (bankId) params.bank_id = bankId
    getTransactions(params).then(setTransactions).catch(() => setTransactions([]))
  }

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getBanks().then(setBanks).catch(() => {})
    getPaymentMethods().then(setPaymentMethods).catch(() => {})
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [month, year, type, categoryId, bankId])

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true)
    try {
      if (editing) {
        await updateTransaction(editing.id, data)
        toast.success('Transação atualizada!')
      } else {
        await createTransaction(data as unknown as Parameters<typeof createTransaction>[0])
        toast.success('Transação criada!')
      }
      setModalOpen(false)
      setEditing(null)
      loadTransactions()
    } catch {
      toast.error('Erro ao salvar transação')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTransaction(deleteTarget.id)
      toast.success('Transação excluída!')
      setDeleteOpen(false)
      setDeleteTarget(null)
      loadTransactions()
    } catch {
      toast.error('Erro ao excluir transação')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Transações</h1>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
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
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Todos os tipos</option>
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Todos os bancos</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left bg-gray-700/50">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Banco</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Parcela</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-10">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-400">
                      {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-gray-200">{t.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {t.category ? `${t.category.icon ?? ''} ${t.category.name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{t.bank?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{t.payment_method?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {t.installment_total
                        ? `${t.installment_current}/${t.installment_total}`
                        : '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        t.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} {fmtCurrency(Number(t.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setEditing(t); setModalOpen(true) }}
                          className="text-gray-400 hover:text-blue-400"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(t); setDeleteOpen(true) }}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        transaction={editing}
        loading={saving}
      />
      <DeleteConfirmModal
        isOpen={deleteOpen}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null) }}
        loading={deleting}
      />
    </div>
  )
}
