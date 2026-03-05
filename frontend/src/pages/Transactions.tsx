import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getCategories, getBanks, getPaymentMethods } from '../services/api'
import type { Transaction, Category, Bank, PaymentMethod } from '../types'
import TransactionModal from '../components/TransactionModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; transaction: Transaction | null }>({ open: false, transaction: null })

  const load = () => {
    const params: Record<string, unknown> = { month, year }
    if (type) params.type = type
    if (categoryId) params.category_id = categoryId
    if (bankId) params.bank_id = bankId
    getTransactions(params).then(setTransactions)
  }

  useEffect(() => {
    Promise.all([getCategories(), getBanks(), getPaymentMethods()]).then(([c, b, p]) => {
      setCategories(c); setBanks(b); setPaymentMethods(p)
    })
  }, [])

  useEffect(() => { load() }, [month, year, type, categoryId, bankId])

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editTransaction) {
        await updateTransaction(editTransaction.id, data)
        toast.success('Transação atualizada!')
      } else {
        await createTransaction(data)
        toast.success('Transação criada!')
      }
      setModalOpen(false)
      setEditTransaction(null)
      load()
    } catch {
      toast.error('Erro ao salvar transação')
    }
  }

  const handleDelete = async (deleteGroup = false) => {
    if (!deleteModal.transaction) return
    try {
      await deleteTransaction(deleteModal.transaction.id, deleteGroup)
      toast.success('Transação excluída!')
      setDeleteModal({ open: false, transaction: null })
      load()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Transações</h1>
        <button onClick={() => { setEditTransaction(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 flex flex-wrap gap-3">
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm">
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm">
          <option value="">Todos os tipos</option>
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm">
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={bankId} onChange={e => setBankId(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm">
          <option value="">Todos os bancos</option>
          {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-left px-4 py-3">Categoria</th>
              <th className="text-left px-4 py-3">Banco</th>
              <th className="text-left px-4 py-3">Método</th>
              <th className="text-left px-4 py-3">Parcela</th>
              <th className="text-right px-4 py-3">Valor</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhuma transação encontrada</td></tr>
            ) : transactions.map(t => (
              <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-4 py-3 text-gray-300">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-white">{t.description}</td>
                <td className="px-4 py-3 text-gray-300">{t.category.icon} {t.category.name}</td>
                <td className="px-4 py-3 text-gray-300">{t.bank.name}</td>
                <td className="px-4 py-3 text-gray-300">{t.payment_method.name}</td>
                <td className="px-4 py-3 text-gray-400">{t.installment_total ? `${t.installment_current}/${t.installment_total}` : '-'}</td>
                <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditTransaction(t); setModalOpen(true) }} className="text-gray-400 hover:text-blue-400"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteModal({ open: true, transaction: t })} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditTransaction(null) }} onSubmit={handleSubmit} transaction={editTransaction} />
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, transaction: null })}
        onConfirm={() => handleDelete(false)}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação?"
        hasGroup={!!deleteModal.transaction?.installment_group_id}
        onConfirmGroup={() => handleDelete(true)}
      />
    </div>
  )
}
