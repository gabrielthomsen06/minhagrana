import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Banks from './pages/Banks'
import PaymentMethods from './pages/PaymentMethods'
import Export from './pages/Export'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transacoes" element={<Transactions />} />
            <Route path="/categorias" element={<Categories />} />
            <Route path="/bancos" element={<Banks />} />
            <Route path="/formas-pagamento" element={<PaymentMethods />} />
            <Route path="/exportar" element={<Export />} />
          </Routes>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
        }}
      />
    </BrowserRouter>
  )
}
