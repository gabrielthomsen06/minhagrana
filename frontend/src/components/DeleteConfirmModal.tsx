import { X } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end flex-wrap">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600">Cancelar</button>
          {hasGroup && onConfirmGroup && (
            <button onClick={onConfirmGroup} className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700">Excluir Todas as Parcelas</button>
          )}
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Excluir</button>
        </div>
      </div>
    </div>
  )
}
