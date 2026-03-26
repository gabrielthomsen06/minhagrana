import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getBanks, createBank, updateBank, deleteBank } from '../services/api'
import type { Bank } from '../types'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

export default function Banks() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [form, setForm] = useState({ name: '' })
  const [editing, setEditing] = useState<Bank | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  const load = () => getBanks().then(setBanks)
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) { await updateBank(editing.id, form); toast.success('Banco atualizado!') }
      else { await createBank(form); toast.success('Banco criado!') }
      setForm({ name: '' }); setEditing(null); setShowForm(false); load()
    } catch { toast.error('Erro ao salvar banco') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bancos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas contas bancárias</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '' }); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Novo Banco
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">{editing ? 'Editar' : 'Novo'} Banco</h2>
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Nome</label>
              <input required value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="Nome do banco" className="glass-input" />
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
              <th className="text-left">Banco</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {banks.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-12 text-gray-500">Nenhum banco cadastrado</td></tr>
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
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => { setEditing(b); setForm({ name: b.name }); setShowForm(true) }} className="icon-btn-edit" aria-label="Editar">
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
        onConfirm={async () => { await deleteBank(deleteModal.id!); toast.success('Excluído!'); setDeleteModal({ open: false, id: null }); load() }}
        title="Excluir Banco" message="Tem certeza que deseja excluir este banco?" />
    </div>
  )
}
