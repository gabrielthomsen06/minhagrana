import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Banks from './pages/Banks'
import PaymentMethods from './pages/PaymentMethods'
import Export from './pages/Export'
import VisaoAnual from './pages/VisaoAnual'

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-900">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/banks" element={<Banks />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
            <Route path="/export" element={<Export />} />
            <Route path="/visao-anual" element={<VisaoAnual />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb' } }} />
    </BrowserRouter>
  )
}

export default App
