import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getBanks, createBank, updateBank, deleteBank } from '../services/api'
import type { Bank } from '../types'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

export default function Banks() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Bank | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => getBanks().then(setBanks).catch(() => {})

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await updateBank(editing.id, { name })
        toast.success('Banco atualizado!')
      } else {
        await createBank({ name })
        toast.success('Banco criado!')
      }
      setName('')
      setEditing(null)
      load()
    } catch {
      toast.error('Erro ao salvar banco')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteBank(deleteTarget.id)
      toast.success('Banco excluído!')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Erro ao excluir banco')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Bancos</h1>

      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-300 mb-4">
          {editing ? 'Editar Banco' : 'Novo Banco'}
        </h2>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            required
            type="text"
            placeholder="Nome do banco"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-56"
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
            {banks.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center text-gray-500 py-8">Nenhum banco</td>
              </tr>
            ) : (
              banks.map((b) => (
                <tr key={b.id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-200">{b.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setEditing(b); setName(b.name) }}
                        className="text-gray-400 hover:text-blue-400"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(b)}
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
        title="Excluir Banco"
        message={`Tem certeza que deseja excluir o banco "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
