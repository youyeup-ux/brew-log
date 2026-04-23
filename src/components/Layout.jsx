import { Outlet, NavLink } from 'react-router-dom'
import { Package, Coffee, Star, Settings } from 'lucide-react'

const navItems = [
  { to: '/beans',        icon: Package, label: '원두'   },
  { to: '/extractions',  icon: Coffee,  label: '추출'   },
  { to: '/best-recipes', icon: Star,    label: '베스트' },
  { to: '/settings',     icon: Settings,label: '설정'   },
]

export default function Layout() {
  return (
    <div className="flex flex-col h-full max-w-lg mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="bottom-nav fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-coffee-100 flex z-20">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-coffee-600' : 'text-coffee-300'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
