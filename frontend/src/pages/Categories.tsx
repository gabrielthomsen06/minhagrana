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
        <div>
          <h1 className="page-title">Categorias</h1>
          <p className="text-sm text-gray-500 mt-1">Organize suas transações por categoria</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', type: 'expense', icon: '' }); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">{editing ? 'Editar' : 'Nova'} Categoria</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Nome</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da categoria" className="glass-input" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="glass-select">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="both">Ambos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Ícone</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Emoji" className="glass-input w-24" />
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
              <th className="text-left">Ícone</th>
              <th className="text-left">Nome</th>
              <th className="text-left">Tipo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-500">Nenhuma categoria cadastrada</td></tr>
            ) : categories.map(c => (
              <tr key={c.id}>
                <td className="text-xl">{c.icon || '—'}</td>
                <td className="text-white font-medium">{c.name}</td>
                <td>
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                    c.type === 'income' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    c.type === 'expense' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {c.type === 'income' ? 'Receita' : c.type === 'expense' ? 'Despesa' : 'Ambos'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => { setEditing(c); setForm({ name: c.name, type: c.type, icon: c.icon || '' }); setShowForm(true) }} className="icon-btn-edit" aria-label="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleteModal({ open: true, id: c.id })} className="icon-btn-delete" aria-label="Excluir">
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
        onConfirm={async () => { await deleteCategory(deleteModal.id!); toast.success('Excluída!'); setDeleteModal({ open: false, id: null }); load() }}
        title="Excluir Categoria" message="Tem certeza que deseja excluir esta categoria?" />
    </div>
  )
}
