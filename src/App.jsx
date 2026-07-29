import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/Layout/AppLayout'
import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import Tasks      from './pages/Tasks'
import Routines   from './pages/Routines'
import Analytics  from './pages/Analytics'
import Settings      from './pages/Settings'
import HabitCalendar from './pages/HabitCalendar'

function PrivateRoute({ children }) {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  return isLoggedIn() ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks"     element={<Tasks />} />
          <Route path="/routines"  element={<Routines />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calendar"  element={<HabitCalendar />} />
          <Route path="/settings"  element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
