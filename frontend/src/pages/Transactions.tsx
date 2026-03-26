import { useCallback, useEffect, useState } from 'react'
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

  const load = useCallback(() => {
    const params: Record<string, unknown> = { month, year }
    if (type) params.type = type
    if (categoryId) params.category_id = categoryId
    if (bankId) params.bank_id = bankId
    getTransactions(params).then(setTransactions)
  }, [month, year, type, categoryId, bankId])

  useEffect(() => {
    Promise.all([getCategories(), getBanks(), getPaymentMethods()]).then(([c, b, p]) => {
      setCategories(c); setBanks(b); setPaymentMethods(p)
    })
  }, [])

  useEffect(() => { load() }, [load])

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Transações</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas receitas e despesas</p>
        </div>
        <button onClick={() => { setEditTransaction(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="glass-select">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="glass-select">
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="glass-select">
          <option value="">Todos os tipos</option>
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="glass-select">
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={bankId} onChange={e => setBankId(e.target.value)} className="glass-select">
          <option value="">Todos os bancos</option>
          {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              <th className="text-left">Data</th>
              <th className="text-left">Descrição</th>
              <th className="text-left">Categoria</th>
              <th className="text-left">Banco</th>
              <th className="text-left">Método</th>
              <th className="text-left">Parcela</th>
              <th className="text-right">Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-500">Nenhuma transação encontrada</td></tr>
            ) : transactions.map(t => (
              <tr key={t.id}>
                <td className="text-gray-400 tabular-nums">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td className="text-white font-medium">{t.description}</td>
                <td className="text-gray-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-base">{t.category.icon}</span> {t.category.name}
                  </span>
                </td>
                <td className="text-gray-400">{t.bank.name}</td>
                <td className="text-gray-400">{t.payment_method.name}</td>
                <td className="text-gray-500">{t.installment_total ? `${t.installment_current}/${t.installment_total}` : '—'}</td>
                <td className={`text-right font-semibold tabular-nums ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => { setEditTransaction(t); setModalOpen(true) }} className="icon-btn-edit" aria-label="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteModal({ open: true, transaction: t })} className="icon-btn-delete" aria-label="Excluir">
                      <Trash2 size={15} />
                    </button>
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
