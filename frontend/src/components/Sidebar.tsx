import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Tag, Building2, CreditCard, Download, CalendarRange, LogOut, DollarSign } from 'lucide-react'
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
    <aside className="fixed top-0 left-0 h-full w-64 backdrop-blur-xl bg-[#0F172A]/80 border-r border-white/[0.06] flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <DollarSign size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Minha<span className="text-green-400">Grana</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Controle Financeiro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-400 border border-green-500/20 shadow-sm shadow-green-500/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-green-400">
                {username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{username}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Conectado</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200 cursor-pointer"
            title="Sair"
            aria-label="Fazer logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
