import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../services/api'
import type { PaymentMethod } from '../types'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => getPaymentMethods().then(setMethods).catch(() => {})

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await updatePaymentMethod(editing.id, { name })
        toast.success('Forma de pagamento atualizada!')
      } else {
        await createPaymentMethod({ name })
        toast.success('Forma de pagamento criada!')
      }
      setName('')
      setEditing(null)
      load()
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePaymentMethod(deleteTarget.id)
      toast.success('Excluído!')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Formas de Pagamento</h1>

      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-300 mb-4">
          {editing ? 'Editar' : 'Nova Forma de Pagamento'}
        </h2>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            required
            type="text"
            placeholder="Ex: Débito, Crédito, Pix..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
          />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Plus size={16} />
            {editing ? 'Salvar' : 'Adicionar'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setName('') }}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-left bg-gray-700/50">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {methods.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center text-gray-500 py-8">
                  Nenhuma forma de pagamento
                </td>
              </tr>
            ) : (
              methods.map((m) => (
                <tr key={m.id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-200">{m.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setEditing(m); setName(m.name) }}
                        className="text-gray-400 hover:text-blue-400"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(m)}
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

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir Forma de Pagamento"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
