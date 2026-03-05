import { useState } from 'react'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Export() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState<'csv' | 'excel' | null>(null)

  const buildUrl = (format: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return `/api/export/${format}?${params.toString()}`
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    setLoading(format)
    try {
      const url = buildUrl(format)
      const response = await fetch(url)
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = format === 'csv' ? 'transacoes.csv' : 'transacoes.xlsx'
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Download iniciado!')
    } catch {
      toast.error('Erro ao exportar')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Exportar Dados</h1>

      <div className="bg-gray-800 rounded-xl p-6 max-w-md space-y-5">
        <p className="text-gray-400 text-sm">
          Selecione o período desejado e escolha o formato de exportação.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={loading !== null}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Download size={16} />
            {loading === 'csv' ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={loading !== null}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Download size={16} />
            {loading === 'excel' ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>
    </div>
  )
}
