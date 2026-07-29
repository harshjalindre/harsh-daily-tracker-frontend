import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Repeat2, BarChart3, CalendarDays, Settings, LogOut, Zap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks' },
  { to: '/routines',  icon: Repeat2,         label: 'Routines' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
  { to: '/calendar',  icon: CalendarDays,    label: 'Calendar' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 px-3 py-5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-black text-lg gradient-text tracking-tight">DailyTrack</span>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 -mt-0.5">Stay on track ⚡</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{user?.name}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
