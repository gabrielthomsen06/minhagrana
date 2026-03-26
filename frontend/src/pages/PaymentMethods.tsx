import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '../services/api'
import type { PaymentMethod } from '../types'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [form, setForm] = useState({ name: '' })
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  const load = () => getPaymentMethods().then(setMethods)
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) { await updatePaymentMethod(editing.id, form); toast.success('Atualizado!') }
      else { await createPaymentMethod(form); toast.success('Criado!') }
      setForm({ name: '' }); setEditing(null); setShowForm(false); load()
    } catch { toast.error('Erro ao salvar') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Métodos de Pagamento</h1>
          <p className="text-sm text-gray-500 mt-1">Configure seus meios de pagamento</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '' }); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Novo Método
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">{editing ? 'Editar' : 'Novo'} Método de Pagamento</h2>
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Nome</label>
              <input required value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="Nome do método" className="glass-input" />
            </div>
            <button type="submit" className="btn-primary">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="btn-secondary">Cancelar</button>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              <th className="text-left">Método</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {methods.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-12 text-gray-500">Nenhum método cadastrado</td></tr>
            ) : methods.map(m => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <CreditCard size={14} className="text-purple-400" />
                    </div>
                    <span className="text-white font-medium">{m.name}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => { setEditing(m); setForm({ name: m.name }); setShowForm(true) }} className="icon-btn-edit" aria-label="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteModal({ open: true, id: m.id })} className="icon-btn-delete" aria-label="Excluir">
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
        onConfirm={async () => { await deletePaymentMethod(deleteModal.id!); toast.success('Excluído!'); setDeleteModal({ open: false, id: null }); load() }}
        title="Excluir Método" message="Tem certeza que deseja excluir este método de pagamento?" />
    </div>
  )
}
