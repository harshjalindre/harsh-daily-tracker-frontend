import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadialBarChart, RadialBar, Legend,
} from 'recharts'
import { Flame, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { analytics } from '../api'
import HabitHeatmap from '../components/Analytics/HabitHeatmap'

const DOW_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

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

function RateBar({ name, rate, done, missed, streak, icon }) {
  return (
    <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
      className="flex items-center gap-3 py-3 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
      <div className="w-7 text-center text-base flex-shrink-0">{icon || '🔁'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate pr-2">{name}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {streak > 0 && (
              <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5">
                <Flame className="w-3 h-3" />{streak}
              </span>
            )}
            <span className={`text-xs font-black ${rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {rate}%
            </span>
          </div>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 rounded-l-full transition-all duration-700"
            style={{ width: `${(done / (done + missed || 1)) * rate}%` }} />
          <div className="h-full bg-red-400 transition-all duration-700"
            style={{ width: `${(missed / (done + missed || 1)) * rate}%` }} />
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" /> {done} done
          </span>
          <span className="text-[10px] text-red-500 dark:text-red-400 font-semibold flex items-center gap-0.5">
            <XCircle className="w-3 h-3" /> {missed} missed
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function HabitAnalytics() {
  const [data, setData]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    analytics.habits()
      .then(r => setData(r.data))
      .catch(err => setError(err?.message || 'Failed to load habit analytics'))
      .finally(() => setLoad(false))
  }, [])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
      <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
    </div>
  )

  if (error) return (
    <div className="px-4 py-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-400">
      <p className="font-bold mb-1">⚠️ Failed to load: {error}</p>
      <p>Run this SQL in phpMyAdmin to fix it:</p>
      <code className="block mt-2 font-mono text-xs bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-xl">
        ALTER TABLE routine_completions ADD COLUMN status ENUM('done','missed') NOT NULL DEFAULT 'done' AFTER completion_date;
      </code>
    </div>
  )

  if (!data) return null

  const { habits, weeklyTrend, dowResult, heatmap } = data

  const totalDone   = habits.reduce((s, h) => s + h.done_count, 0)
  const totalMissed = habits.reduce((s, h) => s + h.missed_count, 0)
  const totalAll    = totalDone + totalMissed
  const overallRate = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0
  const bestStreak  = Math.max(...habits.map(h => h.streak), 0)

  const weeklyData = weeklyTrend.map(w => ({
    week: w.week_start ? w.week_start.slice(5) : w.wk,
    done: Number(w.done), missed: Number(w.missed),
  }))

  const dowData = dowResult.map(d => ({
    day: DOW_LABELS[d.dow], done: d.done, missed: d.missed,
    total: d.done + d.missed,
  }))

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Overall Rate',    value: `${overallRate}%`, icon: TrendingUp,   color: 'from-brand-500 to-violet-600' },
          { label: 'Total Done',      value: totalDone,          icon: CheckCircle2, color: 'from-emerald-500 to-green-600' },
          { label: 'Total Missed',    value: totalMissed,        icon: XCircle,      color: 'from-red-500 to-rose-600' },
          { label: 'Best Streak',     value: `${bestStreak}🔥`,  icon: Flame,        color: 'from-orange-500 to-amber-600' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
            className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Heatmap */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="card p-5">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">16-Week Activity</h3>
        <p className="text-xs text-zinc-400 mb-4">Green = all done · Red = all missed · Amber = mixed</p>
        <HabitHeatmap heatmap={heatmap} />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Per-habit completion rates */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">Per Habit</h3>
          {habits.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No habit data yet</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {habits.map(h => (
                <RateBar key={h.id} name={h.title} rate={h.rate}
                  done={h.done_count} missed={h.missed_count} streak={h.streak} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Weekly done vs missed */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">Weekly Trend</h3>
          {weeklyData.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{ top:5, right:5, bottom:0, left:-20 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                <XAxis dataKey="week" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="done"   name="Done"   fill="#22c55e" radius={[4,4,0,0]} stackId="a" />
                <Bar dataKey="missed" name="Missed" fill="#ef4444" radius={[4,4,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Day of week breakdown */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} className="card p-5">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Best Days of the Week</h3>
        <p className="text-xs text-zinc-400 mb-4">Which days you're most consistent</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dowData} margin={{ top:5, right:5, bottom:0, left:-20 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
            <XAxis dataKey="day" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="done"   name="Done"   radius={[4,4,0,0]} stackId="b">
              {dowData.map((_, i) => <Cell key={i} fill="#8b5cf6" />)}
            </Bar>
            <Bar dataKey="missed" name="Missed" radius={[0,0,0,0]} stackId="b" fill="#ef444460" />
          </BarChart>
        </ResponsiveContainer>
        {dowData.length > 0 && (() => {
          const best  = [...dowData].sort((a,b) => b.done   - a.done)[0]
          const worst = [...dowData].filter(d=>d.total>0).sort((a,b) => a.done/a.total - b.done/b.total)[0]
          return best && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">🏆 Best day: <strong className="text-emerald-500">{best?.day}</strong></p>
              {worst && <p className="text-xs text-zinc-500">⚠️ Needs work: <strong className="text-red-500">{worst?.day}</strong></p>}
            </div>
          )
        })()}
      </motion.div>
    </div>
  )
}
