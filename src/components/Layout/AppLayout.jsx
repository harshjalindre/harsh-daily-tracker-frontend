import { Outlet } from 'react-router-dom'
import Sidebar   from './Sidebar'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
