import { useState } from 'react'
import { FileSpreadsheet, FileText, Download, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { exportCSV, exportExcel } from '../services/api'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Export() {
  const now = new Date()
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`)
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleExport = async (type: 'csv' | 'excel') => {
    setLoading(true)
    try {
      if (type === 'csv') {
        const blob = await exportCSV(startDate, endDate)
        downloadBlob(blob, `minhagrana_${startDate}_${endDate}.csv`)
        toast.success('CSV exportado!')
      } else {
        const blob = await exportExcel(startDate, endDate)
        downloadBlob(blob, `minhagrana_${startDate}_${endDate}.xlsx`)
        toast.success('Excel exportado!')
      }
    } catch {
      toast.error('Erro ao exportar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Exportar Dados</h1>
        <p className="text-sm text-gray-500 mt-1">Exporte suas transações em CSV ou Excel</p>
      </div>

      <div className="glass-card p-8 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/15">
            <Download size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Selecione o Período</h2>
            <p className="text-xs text-gray-500">Escolha as datas e o formato de exportação</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              <Calendar size={12} /> Data Inicial
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="glass-input w-full" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              <Calendar size={12} /> Data Final
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="glass-input w-full" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => handleExport('csv')} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white
                bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500
                shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer">
              <FileText size={18} /> Exportar CSV
            </button>
            <button onClick={() => handleExport('excel')} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white
                bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500
                shadow-lg shadow-green-500/20 hover:shadow-green-500/30
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer">
              <FileSpreadsheet size={18} /> Exportar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
