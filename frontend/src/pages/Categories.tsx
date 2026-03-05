import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api'
import type { Category } from '../types'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

interface FormState {
  name: string
  type: 'expense' | 'income' | 'both'
  icon: string
}

const defaultForm: FormState = { name: '', type: 'expense', icon: '' }

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<FormState>(defaultForm)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => getCategories().then(setCategories).catch(() => {})

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await updateCategory(editing.id, form)
        toast.success('Categoria atualizada!')
      } else {
        await createCategory(form)
        toast.success('Categoria criada!')
      }
      setForm(defaultForm)
      setEditing(null)
      load()
    } catch {
      toast.error('Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (c: Category) => {
    setEditing(c)
    setForm({ name: c.name, type: c.type as FormState['type'], icon: c.icon || '' })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCategory(deleteTarget.id)
      toast.success('Categoria excluída!')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Erro ao excluir categoria')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Categorias</h1>

      {/* Form */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-300 mb-4">
          {editing ? 'Editar Categoria' : 'Nova Categoria'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
          <input
            required
            type="text"
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-48"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FormState['type'] }))}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
            <option value="both">Ambos</option>
          </select>
          <input
            type="text"
            placeholder="Ícone (emoji)"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-32"
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
              onClick={() => { setEditing(null); setForm(defaultForm) }}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      {/* List */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-left bg-gray-700/50">
              <th className="px-4 py-3">Ícone</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-8">
                  Nenhuma categoria
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-xl">{c.icon || '—'}</td>
                  <td className="px-4 py-3 text-gray-200">{c.name}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {c.type === 'expense' ? 'Despesa' : c.type === 'income' ? 'Receita' : 'Ambos'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-gray-400 hover:text-blue-400"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
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
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir a categoria "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
