import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import HabitAnalytics from './HabitAnalytics'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendingUp, CheckSquare, Flame, Target } from 'lucide-react'
import { analytics } from '../api'

const COLORS = ['#8b5cf6','#ec4899','#22c55e','#f59e0b','#06b6d4','#f43f5e','#a78bfa']

function StatCard({ icon: Icon, label, value, sub, gradient }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [tab, setTab]              = useState('tasks') // 'tasks' | 'habits'
  const [overview, setOverview]    = useState(null)
  const [trends, setTrends]        = useState([])
  const [catStats, setCatStats]    = useState([])
  const [streaks, setStreaks]      = useState([])
  const [priorityData, setPriority] = useState([])
  const [days, setDays]            = useState(7)
  const [loading, setLoading]      = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      analytics.overview(),
      analytics.trends(days),
      analytics.categories(),
      analytics.streaks(),
      analytics.priority(),
    ]).then(([ov, tr, ct, st, pr]) => {
      setOverview(ov.data)
      setTrends((tr.data || []).map(d => ({
        ...d, date: format(parseISO(d.date), days <= 7 ? 'EEE' : 'MMM d')
      })))
      setCatStats(ct.data || [])
      setStreaks((st.data || []).slice(0, 5))
      setPriority(pr.data || [])
    }).finally(() => setLoading(false))
  }, [days])

  if (loading) return (
    <div className="page-container">
      <div className="space-y-4">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-28 animate-pulse" />)}
        </div>
      </div>
    </div>
  )

  const pieData = catStats.filter(c => c.total > 0).map((c, i) => ({
    name: `${c.icon} ${c.name}`, value: Number(c.total), color: c.color || COLORS[i % COLORS.length]
  }))

  const priorityMap = { high: 0, medium: 0, low: 0 }
  priorityData.forEach(p => { priorityMap[p.priority] = Number(p.total) })
  const prData = [
    { name: '🔴 High',   value: priorityMap.high,   color: '#ef4444' },
    { name: '🟡 Medium', value: priorityMap.medium, color: '#f59e0b' },
    { name: '🔵 Low',    value: priorityMap.low,    color: '#3b82f6' },
  ].filter(d => d.value > 0)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Analytics</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Your productivity at a glance 📊</p>
        </div>
        {tab === 'tasks' && (
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  days === d ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'
                }`}>{d}d</button>
            ))}
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl mb-6">
        <button onClick={() => setTab('tasks')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'tasks' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'
          }`}>✅ Tasks</button>
        <button onClick={() => setTab('habits')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'habits' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'
          }`}>🔥 Habits</button>
      </div>

      {/* Habits tab */}
      {tab === 'habits' && <HabitAnalytics />}

      {/* Tasks tab */}
      {tab === 'tasks' && <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={CheckSquare} label="Total Tasks"     value={overview?.total}      sub="created"          gradient="from-brand-500 to-violet-600" />
        <StatCard icon={TrendingUp}  label="Completion Rate" value={`${overview?.completionRate ?? 0}%`} sub="30 days" gradient="from-emerald-500 to-green-600" />
        <StatCard icon={Flame}       label="Best Streak"     value={overview?.max_streak} sub="days"             gradient="from-orange-500 to-amber-600"  />
        <StatCard icon={Target}      label="Pending"         value={overview?.pending}    sub="to complete"      gradient="from-pink-500 to-rose-600"     />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Trend chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">Task Activity ({days}d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trends} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-zinc-400" />
              <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-zinc-400" allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradComp)" />
              <Area type="monotone" dataKey="created"   name="Created"   stroke="#ec4899" strokeWidth={2} fill="url(#gradCr)" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">By Category</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-zinc-400 dark:text-zinc-500 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Priority distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">Priority Distribution</h3>
          {prData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={prData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Tasks" radius={[6,6,0,0]}>
                  {prData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Streak leaderboard */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">🔥 Top Streaks</h3>
          {streaks.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Complete habits to build streaks</div>
          ) : (
            <div className="space-y-3">
              {streaks.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-black text-zinc-400">#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                          style={{ width: `${Math.min((r.streak / (streaks[0]?.streak || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-orange-500 flex-shrink-0">{r.streak}🔥</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      </> /* end tasks tab */}
    </div>
  )
}
