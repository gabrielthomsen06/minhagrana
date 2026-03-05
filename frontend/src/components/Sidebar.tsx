import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Tag, Building2, CreditCard, Download } from 'lucide-react'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/categories', icon: Tag, label: 'Categorias' },
  { to: '/banks', icon: Building2, label: 'Bancos' },
  { to: '/payment-methods', icon: CreditCard, label: 'Métodos de Pagamento' },
  { to: '/export', icon: Download, label: 'Exportar' },
]

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-green-400">💰 Minha Grana</h1>
        <p className="text-xs text-gray-400 mt-1">Controle Financeiro</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
