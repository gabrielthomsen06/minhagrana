import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Landmark,
  CreditCard,
  Download,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/categorias', label: 'Categorias', icon: Tag },
  { to: '/bancos', label: 'Bancos', icon: Landmark },
  { to: '/formas-pagamento', label: 'Formas de Pag.', icon: CreditCard },
  { to: '/exportar', label: 'Exportar', icon: Download },
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-gray-800 flex flex-col py-6 px-3 shrink-0">
      <div className="mb-8 px-3">
        <h1 className="text-xl font-bold text-green-400">💰 Minha Grana</h1>
        <p className="text-xs text-gray-400 mt-1">Controle Financeiro</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-green-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700'
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
