import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Building2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { getBanks, createBank, updateBank, deleteBank } from '../services/api'
import type { Bank } from '../types'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Banks() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [form, setForm] = useState<{ name: string; closing_day: string; credit_limit: string }>({ name: '', closing_day: '', credit_limit: '' })
  const [editing, setEditing] = useState<Bank | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  const load = () => getBanks().then(setBanks)
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        closing_day: form.closing_day ? Number(form.closing_day) : null,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
      }
      if (editing) { await updateBank(editing.id, payload); toast.success('Banco atualizado!') }
      else { await createBank(payload); toast.success('Banco criado!') }
      setForm({ name: '', closing_day: '', credit_limit: '' }); setEditing(null); setShowForm(false); load()
    } catch { toast.error('Erro ao salvar banco') }
  }

  const startEdit = (b: Bank) => {
    setEditing(b)
    setForm({
      name: b.name,
      closing_day: b.closing_day ? String(b.closing_day) : '',
      credit_limit: b.credit_limit ? String(b.credit_limit) : '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bancos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas contas bancarias e cartoes</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', closing_day: '', credit_limit: '' }); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Novo Banco
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">{editing ? 'Editar' : 'Novo'} Banco</h2>
          <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Nome</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do banco" className="glass-input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Dia Fechamento</label>
              <input
                type="number" min="1" max="31"
                value={form.closing_day}
                onChange={e => setForm({ ...form, closing_day: e.target.value })}
                placeholder="Ex: 25"
                className="glass-input w-28"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Limite Credito</label>
              <input
                type="number" step="0.01" min="0"
                value={form.credit_limit}
                onChange={e => setForm({ ...form, credit_limit: e.target.value })}
                placeholder="Ex: 2600.00"
                className="glass-input w-36"
              />
            </div>
            <button type="submit" className="btn-primary">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="btn-secondary">Cancelar</button>
          </form>
          <p className="text-xs text-gray-600 mt-3">Deixe os campos de fechamento e limite vazios se nao for um cartao de credito.</p>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              <th className="text-left">Banco</th>
              <th className="text-left">Cartao de Credito</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {banks.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-12 text-gray-500">Nenhum banco cadastrado</td></tr>
            ) : banks.map(b => (
              <tr key={b.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Building2 size={14} className="text-blue-400" />
                    </div>
                    <span className="text-white font-medium">{b.name}</span>
                  </div>
                </td>
                <td>
                  {b.closing_day ? (
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-purple-400" />
                      <span className="text-sm text-gray-300">
                        Fecha dia {b.closing_day} &middot; Limite: {formatCurrency(b.credit_limit ?? 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">-</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => startEdit(b)} className="icon-btn-edit" aria-label="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteModal({ open: true, id: b.id })} className="icon-btn-delete" aria-label="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={async () => { await deleteBank(deleteModal.id!); toast.success('Excluido!'); setDeleteModal({ open: false, id: null }); load() }}
        title="Excluir Banco" message="Tem certeza que deseja excluir este banco?" />
    </div>
  )
}
