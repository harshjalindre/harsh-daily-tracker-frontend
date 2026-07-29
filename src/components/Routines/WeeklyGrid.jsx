import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { format, addDays, startOfWeek, isSameDay, isAfter, parseISO } from 'date-fns'
import { routines as routinesApi } from '../../api'

function nextStatus(current) {
  if (!current)          return 'done'
  if (current === 'done') return 'missed'
  return null
}

function CellButton({ status, onClick, isFuture, isToday }) {
  const base = `w-full h-10 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-150 text-base
                ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-90'}`

  if (status === 'done') return (
    <button onClick={onClick} disabled={isFuture} className={`${base} bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30`}>
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    </button>
  )
  if (status === 'missed') return (
    <button onClick={onClick} disabled={isFuture} className={`${base} bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30`}>
      <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
    </button>
  )
  return (
    <button onClick={onClick} disabled={isFuture} className={`${base} hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isToday ? 'ring-2 ring-brand-500/40 rounded-xl' : ''}`}>
      <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
    </button>
  )
}

export default function WeeklyGrid() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  )
  const [routines, setRoutines]       = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading]         = useState(true)
  const [marking, setMarking]         = useState(null) // `${rid}-${date}`

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const start = format(weekStart, 'yyyy-MM-dd')
      const res   = await routinesApi.weeklyGrid(start)
      setRoutines(res.data.routines    || [])
      setCompletions(res.data.completions || {})
    } finally { setLoading(false) }
  }, [weekStart])

  useEffect(() => { load() }, [load])

  const mark = async (routineId, date) => {
    const key     = `${routineId}-${date}`
    const current = completions[routineId]?.[date] ?? null
    const next    = nextStatus(current)

    // Optimistic update
    setCompletions(prev => {
      const updated = { ...prev, [routineId]: { ...(prev[routineId] || {}) } }
      if (next === null) delete updated[routineId][date]
      else updated[routineId][date] = next
      return updated
    })

    setMarking(key)
    try {
      if (next === null) {
        // Toggle to remove: call with current status to undo
        await routinesApi.complete(routineId, date, current)
      } else {
        await routinesApi.complete(routineId, date, next)
      }
    } catch {
      load() // revert on error
    } finally { setMarking(null) }
  }

  const prevWeek = () => setWeekStart(d => addDays(d, -7))
  const nextWeek = () => setWeekStart(d => addDays(d, 7))
  const goToday  = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))

  // Stats for this week
  const totalCells    = routines.length * 7
  const doneCells     = Object.values(completions).flatMap(d => Object.values(d)).filter(s => s === 'done').length
  const missedCells   = Object.values(completions).flatMap(d => Object.values(d)).filter(s => s === 'missed').length

  return (
    <div>
      {/* Week nav */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="btn-ghost p-2 rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
            {isCurrentWeek && <p className="text-xs text-brand-500 font-semibold">This week</p>}
          </div>
          <button onClick={nextWeek} className="btn-ghost p-2 rounded-xl" disabled={isCurrentWeek}>
            <ChevronRight className={`w-5 h-5 ${isCurrentWeek ? 'opacity-30' : ''}`} />
          </button>
        </div>
        {!isCurrentWeek && (
          <button onClick={goToday} className="btn-secondary text-xs py-1.5 px-3">Today</button>
        )}
      </div>

      {/* Weekly stats */}
      {routines.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{doneCells}</p>
            <p className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70">Done</p>
          </div>
          <div className="flex-1 bg-red-50 dark:bg-red-500/10 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-red-500 dark:text-red-400">{missedCells}</p>
            <p className="text-xs font-semibold text-red-500/70 dark:text-red-400/70">Missed</p>
          </div>
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-zinc-600 dark:text-zinc-300">{totalCells - doneCells - missedCells}</p>
            <p className="text-xs font-semibold text-zinc-400">Pending</p>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="card p-6 animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />)}
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
          No habits yet. Create some habits first.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider w-36 sticky left-0 bg-white dark:bg-zinc-900">
                    Habit
                  </th>
                  {days.map(day => {
                    const isToday    = isSameDay(day, today)
                    const isFuture   = isAfter(day, today)
                    return (
                      <th key={day.toISOString()} className={`px-1 py-3 text-center min-w-[52px] ${isToday ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}>
                        <p className={`text-[10px] font-bold uppercase ${isToday ? 'text-brand-500' : 'text-zinc-400'}`}>
                          {format(day, 'EEE')}
                        </p>
                        <p className={`text-sm font-black mt-0.5 ${isToday ? 'text-brand-600 dark:text-brand-400' : isFuture ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {format(day, 'd')}
                        </p>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {routines.map((routine, ri) => (
                  <motion.tr
                    key={routine.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ri * 0.04 }}
                    className="border-b border-zinc-50 dark:border-zinc-800/50 last:border-0"
                  >
                    {/* Habit name — sticky on mobile */}
                    <td className="px-4 py-2 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                      <div className="flex items-center gap-2">
                        {routine.category_icon && (
                          <span className="text-base flex-shrink-0">{routine.category_icon}</span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[100px]">
                            {routine.title}
                          </p>
                          {routine.streak > 0 && (
                            <p className="text-[10px] text-orange-500 font-bold">🔥 {routine.streak}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Day cells */}
                    {days.map(day => {
                      const dateStr  = format(day, 'yyyy-MM-dd')
                      const status   = completions[routine.id]?.[dateStr] ?? null
                      const isFuture = isAfter(day, today)
                      const isToday  = isSameDay(day, today)
                      const key      = `${routine.id}-${dateStr}`

                      return (
                        <td key={dateStr} className={`px-1 py-2 ${isToday ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`}>
                          <div className={`transition-opacity ${marking === key ? 'opacity-50' : ''}`}>
                            <CellButton
                              status={status}
                              isFuture={isFuture}
                              isToday={isToday}
                              onClick={() => !isFuture && mark(routine.id, dateStr)}
                            />
                          </div>
                        </td>
                      )
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-3 border-t border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
            <span className="text-xs text-zinc-400 font-medium">Tap to mark:</span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Done
            </span>
            <span className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 font-semibold">
              <XCircle className="w-3.5 h-3.5" /> Missed
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-400 font-semibold">
              <Circle className="w-3.5 h-3.5" /> Clear
            </span>
            <span className="text-xs text-zinc-300 dark:text-zinc-600 ml-auto italic">tap cycles: ○ → ✅ → ❌ → ○</span>
          </div>
        </div>
      )}
    </div>
  )
}
