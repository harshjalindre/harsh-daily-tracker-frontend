import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { CheckSquare, Repeat2, Flame, TrendingUp, Plus, ArrowRight, Zap } from 'lucide-react'
import { analytics, tasks as tasksApi, routines as routinesApi } from '../api'
import { useAuthStore } from '../store/authStore'
import TaskCard    from '../components/Tasks/TaskCard'
import RoutineCard from '../components/Routines/RoutineCard'
import TaskModal   from '../components/Tasks/TaskModal'
import RoutineModal from '../components/Routines/RoutineModal'

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:  'from-brand-500  to-violet-600',
    pink:   'from-pink-500   to-rose-600',
    green:  'from-emerald-500 to-green-600',
    orange: 'from-orange-500 to-amber-600',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user }            = useAuthStore()
  const [stats, setStats]   = useState(null)
  const [todayTasks, setTodayTasks]     = useState([])
  const [routines, setRoutines]         = useState([])
  const [taskModal, setTaskModal]       = useState(false)
  const [routineModal, setRoutineModal] = useState(false)

  const load = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const [s, t, r] = await Promise.all([
      analytics.overview(),
      tasksApi.list({ date: today }),
      routinesApi.list(),
    ])
    setStats(s.data)
    setTodayTasks((t.data || []).slice(0, 5))
    setRoutines((r.data || []).filter(x => x.frequency_type === 'daily').slice(0, 4))
  }, [])

  useEffect(() => { load() }, [load])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{greeting} 👋</p>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
          Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>!
        </h1>
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={CheckSquare} label="Completed Today"  value={stats?.today}            sub="tasks done"        color="brand"  />
        <StatCard icon={Repeat2}     label="Habits Today"     value={`${stats?.completed_routines_today ?? 0}/${stats?.total_routines ?? 0}`} sub="completed"  color="green"  />
        <StatCard icon={Flame}       label="Best Streak"      value={stats?.max_streak}       sub="days"              color="orange" />
        <StatCard icon={TrendingUp}  label="Completion Rate"  value={stats?.completionRate != null ? `${stats.completionRate}%` : '—'} sub="last 30 days" color="pink" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Today's Tasks</h2>
            <Link to="/tasks" className="text-sm text-brand-500 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">All clear!</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">No tasks for today</p>
              <button onClick={() => setTaskModal(true)} className="btn-primary mt-4 text-sm px-5 py-2">
                Add a task
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map(t => <TaskCard key={t.id} task={t} onRefresh={load} />)}
            </div>
          )}
        </div>

        {/* Daily habits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Daily Habits</h2>
            <Link to="/routines" className="text-sm text-brand-500 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {routines.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">🔥</div>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Build a streak!</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">No daily habits yet</p>
              <button onClick={() => setRoutineModal(true)} className="btn-primary mt-4 text-sm px-5 py-2">
                Add a habit
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {routines.map(r => <RoutineCard key={r.id} routine={r} onRefresh={load} />)}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setTaskModal(true)} className="fab" title="New task">
        <Plus className="w-6 h-6" />
      </button>

      <TaskModal    open={taskModal}    onClose={() => setTaskModal(false)}    onSaved={load} />
      <RoutineModal open={routineModal} onClose={() => setRoutineModal(false)} onSaved={load} />
    </div>
  )
}
