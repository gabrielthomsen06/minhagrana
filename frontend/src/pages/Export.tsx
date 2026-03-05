import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
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
      <h1 className="text-2xl font-bold text-white">Exportar Dados</h1>
      <div className="bg-gray-800 rounded-xl p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Selecione o Período</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data Inicial</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data Final</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => handleExport('csv')} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg text-sm font-medium">
              <FileText size={18} /> Exportar CSV
            </button>
            <button onClick={() => handleExport('excel')} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg text-sm font-medium">
              <FileSpreadsheet size={18} /> Exportar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
