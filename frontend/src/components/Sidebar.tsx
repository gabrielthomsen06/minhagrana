import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Tag, Building2, CreditCard, Download, CalendarRange, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/visao-anual', icon: CalendarRange, label: 'Visão Anual' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/categories', icon: Tag, label: 'Categorias' },
  { to: '/banks', icon: Building2, label: 'Bancos' },
  { to: '/payment-methods', icon: CreditCard, label: 'Métodos de Pagamento' },
  { to: '/export', icon: Download, label: 'Exportar' },
]

export default function Sidebar() {
  const { username, logout } = useAuth()

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
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{username}</p>
            <p className="text-xs text-gray-500">Conectado</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}
