import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Repeat2, BarChart3, CalendarDays, Settings } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks' },
  { to: '/routines',  icon: Repeat2,         label: 'Habits' },
  { to: '/analytics', icon: BarChart3,       label: 'Stats' },
  { to: '/calendar',  icon: CalendarDays,    label: 'Calendar' },
  { to: '/settings',  icon: Settings,        label: 'More' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 safe-bottom">
      <div className="flex items-stretch px-2 py-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-brand-500/10' : ''}`}>
                  <Icon className={`w-5 h-5 transition-all ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
