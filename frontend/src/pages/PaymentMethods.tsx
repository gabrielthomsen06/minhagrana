import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
        <h1 className="text-2xl font-bold text-white">Métodos de Pagamento</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '' }); setShowForm(true) }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Método
        </button>
      </div>
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">{editing ? 'Editar' : 'Novo'} Método de Pagamento</h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input required value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="Nome"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
          </form>
        </div>
      )}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700 text-gray-400">
            <th className="text-left px-4 py-3">Nome</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {methods.map(m => (
              <tr key={m.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-4 py-3 text-white">{m.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditing(m); setForm({ name: m.name }); setShowForm(true) }} className="text-gray-400 hover:text-blue-400"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: m.id })} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
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
