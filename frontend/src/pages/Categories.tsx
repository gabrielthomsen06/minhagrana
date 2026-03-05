import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api'
import type { Category } from '../types'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ name: '', type: 'expense', icon: '' })
  const [editing, setEditing] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  const load = () => getCategories().then(setCategories)
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateCategory(editing.id, form)
        toast.success('Categoria atualizada!')
      } else {
        await createCategory(form)
        toast.success('Categoria criada!')
      }
      setForm({ name: '', type: 'expense', icon: '' })
      setEditing(null)
      setShowForm(false)
      load()
    } catch {
      toast.error('Erro ao salvar categoria')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Categorias</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', type: 'expense', icon: '' }); setShowForm(true) }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nova Categoria
        </button>
      </div>
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">{editing ? 'Editar' : 'Nova'} Categoria</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm">
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="both">Ambos</option>
            </select>
            <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Ícone (emoji)"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-green-500" />
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm">Cancelar</button>
          </form>
        </div>
      )}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700 text-gray-400">
            <th className="text-left px-4 py-3">Ícone</th>
            <th className="text-left px-4 py-3">Nome</th>
            <th className="text-left px-4 py-3">Tipo</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-4 py-3 text-xl">{c.icon || '—'}</td>
                <td className="px-4 py-3 text-white">{c.name}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${c.type === 'income' ? 'bg-green-500/20 text-green-400' : c.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{c.type === 'income' ? 'Receita' : c.type === 'expense' ? 'Despesa' : 'Ambos'}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditing(c); setForm({ name: c.name, type: c.type, icon: c.icon || '' }); setShowForm(true) }} className="text-gray-400 hover:text-blue-400"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: c.id })} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DeleteConfirmModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={async () => { await deleteCategory(deleteModal.id!); toast.success('Excluída!'); setDeleteModal({ open: false, id: null }); load() }}
        title="Excluir Categoria" message="Tem certeza que deseja excluir esta categoria?" />
    </div>
  )
}
