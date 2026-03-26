import { X, AlertTriangle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  hasGroup?: boolean
  onConfirmGroup?: () => void
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title = 'Confirmar Exclusão', message = 'Tem certeza que deseja excluir este item?', hasGroup, onConfirmGroup }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-7 w-full max-w-md shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <p className="text-gray-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end flex-wrap">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          {hasGroup && onConfirmGroup && (
            <button onClick={onConfirmGroup}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 shadow-lg shadow-orange-500/20 transition-all duration-200 cursor-pointer">
              Excluir Todas as Parcelas
            </button>
          )}
          <button onClick={onConfirm} className="btn-danger">Excluir</button>
        </div>
      </div>
    </div>
  )
}
