import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addMonths, subMonths, startOfMonth, endOfMonth,
         startOfWeek, addDays, isSameMonth, isSameDay, isAfter, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, X, CheckCircle2, XCircle, Circle, CalendarDays } from 'lucide-react'
import { analytics, routines as routinesApi } from '../api'

/* ─── helpers ─────────────────────────────────────────────────── */
function cellBg(rate, done, missed, total) {
  if (total === 0) return ''
  if (rate === null) return ''
  if (rate === 100) return 'bg-emerald-500'
  if (rate >= 75)   return 'bg-emerald-400'
  if (rate >= 50)   return 'bg-amber-400'
  if (rate >= 25)   return 'bg-red-400'
  if (done === 0 && missed > 0) return 'bg-red-500'
  return 'bg-red-300'
}

function cellTextColor(rate, total) {
  if (total === 0) return 'text-zinc-400 dark:text-zinc-600'
  return rate > 0 ? 'text-white' : 'text-white'
}

/* ─── Day detail panel ─────────────────────────────────────────── */
function DayPanel({ day, data, onClose, onMark }) {
  const [busy, setBusy] = useState(null)

  if (!day) return null

  const habits    = data?.habits || []
  const isToday   = isSameDay(parseISO(day), new Date())
  const isFutureDay = isAfter(parseISO(day), new Date())

  const mark = async (routineId, currentStatus) => {
    const next = currentStatus === 'done' ? 'missed' : currentStatus === 'missed' ? null : 'done'
    setBusy(routineId)
    try {
      if (next === null) await routinesApi.complete(routineId, day, currentStatus) // toggle off
      else               await routinesApi.complete(routineId, day, next)
      onMark?.()
    } finally { setBusy(null) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="w-full lg:w-80 flex-shrink-0 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 self-start sticky top-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {format(parseISO(day), 'EEEE')}
          </p>
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
            {format(parseISO(day), 'MMM d, yyyy')}
            {isToday    && <span className="ml-2 text-xs font-bold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full">Today</span>}
            {isFutureDay && <span className="ml-2 text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">Upcoming</span>}
          </h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Day stats */}
      {data && data.scheduled > 0 && (
        isFutureDay ? (
          <div className="flex mb-4">
            <div className="flex-1 text-center bg-zinc-100 dark:bg-zinc-800 rounded-xl py-2">
              <p className="text-lg font-black text-zinc-500">{data.scheduled}</p>
              <p className="text-[10px] font-semibold text-zinc-400">Scheduled</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mb-4">
            <div className="flex-1 text-center bg-emerald-50 dark:bg-emerald-500/10 rounded-xl py-2">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{data.done}</p>
              <p className="text-[10px] font-semibold text-emerald-600/70 dark:text-emerald-400/70">Done</p>
            </div>
            <div className="flex-1 text-center bg-red-50 dark:bg-red-500/10 rounded-xl py-2">
              <p className="text-lg font-black text-red-500">{data.missed}</p>
              <p className="text-[10px] font-semibold text-red-500/70">Missed</p>
            </div>
            <div className="flex-1 text-center bg-zinc-100 dark:bg-zinc-800 rounded-xl py-2">
              <p className="text-lg font-black text-zinc-500">{data.unmarked}</p>
              <p className="text-[10px] font-semibold text-zinc-400">Open</p>
            </div>
          </div>
        )
      )}

      {/* Habit list */}
      {habits.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6">No habits scheduled</p>
      ) : (
        <div className="space-y-2">
          {habits.map(h => {
            const isFuture = h.status === 'future'
            const status   = isFuture ? null : h.status
            return (
              <div key={h.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                  ${status === 'done'   ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10' :
                    status === 'missed' ? 'border-red-200    dark:border-red-800    bg-red-50    dark:bg-red-500/10'    :
                                          'border-zinc-100   dark:border-zinc-800   bg-zinc-50   dark:bg-zinc-800/50'}`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {status === 'done'   && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {status === 'missed' && <XCircle      className="w-5 h-5 text-red-500" />}
                  {!status             && <Circle       className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate
                    ${status === 'done' ? 'text-zinc-500 dark:text-zinc-400 line-through' :
                      'text-zinc-800 dark:text-zinc-200'}`}>
                    {h.title}
                  </p>
                  {h.unscheduled && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">not scheduled today</p>
                  )}
                </div>

                {/* Mark buttons — only for non-future days */}
                {!isFuture && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => mark(h.id, status)}
                      disabled={busy === h.id}
                      title={status === 'done' ? 'Undo' : 'Mark done'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs
                        ${status === 'done'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-emerald-500 hover:text-white text-zinc-400'
                        } ${busy === h.id ? 'opacity-50' : ''}`}
                    >✓</button>
                    <button
                      onClick={async () => {
                        setBusy(h.id)
                        try {
                          if (status === 'missed') await routinesApi.complete(h.id, day, 'missed') // undo
                          else await routinesApi.complete(h.id, day, 'missed')
                          onMark?.()
                        } finally { setBusy(null) }
                      }}
                      disabled={busy === h.id}
                      title={status === 'missed' ? 'Undo' : 'Mark missed'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs
                        ${status === 'missed'
                          ? 'bg-red-500 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-red-500 hover:text-white text-zinc-400'
                        } ${busy === h.id ? 'opacity-50' : ''}`}
                    >✗</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Main Calendar Page ──────────────────────────────────────── */
export default function HabitCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calData, setCalData]           = useState({})
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [selectedDay, setSelectedDay]   = useState(null)

  const monthStr = format(currentMonth, 'yyyy-MM')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analytics.calendar(monthStr)
      setCalData(res.data?.days || {})
    } catch (err) {
      setError(err?.message || 'Failed to load calendar data')
    } finally { setLoading(false) }
  }, [monthStr])

  useEffect(() => { load() }, [load])

  // Build calendar grid (6 weeks × 7 days, starting Monday)
  const monthStart  = startOfMonth(currentMonth)
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 })
  const days        = Array.from({ length: 42 }, (_, i) => addDays(calStart, i))
  const today       = new Date()
  const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  // Month stats
  const monthDays  = Object.values(calData).filter(d => d.total > 0)
  const totalDone  = monthDays.reduce((s, d) => s + d.done, 0)
  const totalMissed= monthDays.reduce((s, d) => s + d.missed, 0)
  const totalAll   = totalDone + totalMissed
  const monthRate  = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0
  const perfectDays= monthDays.filter(d => d.rate === 100).length

  const prevMonth = () => { setSelectedDay(null); setCurrentMonth(m => subMonths(m, 1)) }
  const nextMonth = () => { setSelectedDay(null); setCurrentMonth(m => addMonths(m, 1)) }

  return (
    <div className="page-container max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Habit Calendar</h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Click any day to view & mark habits</p>
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-ghost p-2 rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="font-bold text-zinc-900 dark:text-zinc-100 w-36 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </p>
          <button onClick={nextMonth} className="btn-ghost p-2 rounded-xl"
            disabled={format(currentMonth, 'yyyy-MM') >= format(today, 'yyyy-MM')}>
            <ChevronRight className={`w-5 h-5 ${format(currentMonth,'yyyy-MM') >= format(today,'yyyy-MM') ? 'opacity-30':''}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-400 font-medium">
          ⚠️ {error}
          <span className="ml-2 text-xs opacity-70">— Run this SQL: <code className="font-mono bg-red-100 dark:bg-red-900/30 px-1 rounded">ALTER TABLE routine_completions ADD COLUMN status ENUM('done','missed') NOT NULL DEFAULT 'done' AFTER completion_date;</code></span>
        </div>
      )}

      {/* Month summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Completion Rate', value: `${monthRate}%`,   color: 'text-brand-500',   bg: 'bg-brand-50 dark:bg-brand-500/10' },
          { label: 'Total Done',      value: totalDone,          color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Total Missed',    value: totalMissed,        color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
          { label: 'Perfect Days 🌟', value: perfectDays,        color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl px-4 py-3 text-center`}>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className={`text-xs font-semibold ${color} opacity-70 mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar + Day panel */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          <div className="card overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
              {DAY_HEADERS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {loading ? (
              <div className="grid grid-cols-7">
                {[...Array(42)].map((_, i) => (
                  <div key={i} className="aspect-square p-1">
                    <div className="w-full h-full rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const ds          = format(day, 'yyyy-MM-dd')
                  const isThisMonth = isSameMonth(day, currentMonth)
                  const isToday_    = isSameDay(day, today)
                  const isFuture_   = isAfter(day, today)
                  const data        = calData[ds]
                  const isSelected  = selectedDay === ds
                  const scheduled   = data?.scheduled ?? 0
                  const hasHabits   = isThisMonth && scheduled > 0

                  // Solid colored bg only for past/today with completions
                  const bg = isThisMonth && data && !isFuture_
                    ? cellBg(data.rate, data.done, data.missed, data.total)
                    : ''

                  // Future days with scheduled habits get a dashed border
                  const futureBorder = isThisMonth && isFuture_ && scheduled > 0
                    ? 'border border-dashed border-zinc-300 dark:border-zinc-600'
                    : ''

                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: isThisMonth ? 1.04 : 1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => isThisMonth && setSelectedDay(isSelected ? null : ds)}
                      className={`relative aspect-square p-1 transition-all
                        ${!isThisMonth ? 'opacity-20 cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className={`w-full h-full rounded-xl flex flex-col items-center justify-start pt-1.5 gap-0.5 overflow-hidden transition-all
                        ${bg || 'bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                        ${futureBorder}
                        ${isSelected ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : ''}
                        ${isToday_   ? 'ring-2 ring-brand-500/60' : ''}`}
                      >
                        {/* Date number */}
                        <span className={`text-xs font-bold leading-none
                          ${bg ? 'text-white' : isToday_ ? 'text-brand-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {format(day, 'd')}
                        </span>

                        {/* Mini dots — past/today: colored by status; future: muted circles */}
                        {hasHabits && (
                          <div className="flex flex-wrap gap-[2px] justify-center px-1 mt-0.5">
                            {(data.habits || []).slice(0, 6).map((h, hi) => (
                              <span key={hi} className={`rounded-full
                                ${isFuture_
                                  ? 'w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 opacity-60'
                                  : `w-1.5 h-1.5 ${
                                      h.status === 'done'   ? (bg ? 'bg-white/80' : 'bg-emerald-500') :
                                      h.status === 'missed' ? (bg ? 'bg-white/40' : 'bg-red-400') :
                                                              (bg ? 'bg-white/20' : 'bg-zinc-300 dark:bg-zinc-600')
                                    }`
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Bottom label — past: done/total; future: scheduled count */}
                        {hasHabits && isThisMonth && (
                          <span className={`hidden sm:block text-[9px] font-black leading-none mt-0.5
                            ${bg ? 'text-white/90' : isFuture_ ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>
                            {isFuture_ ? `${scheduled}` : `${data.done}/${data.total}`}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-zinc-50 dark:border-zinc-800 flex-wrap">
              <span className="text-[10px] font-semibold text-zinc-400">Rate:</span>
              {[
                ['bg-emerald-500','100%'],
                ['bg-emerald-400','75%+'],
                ['bg-amber-400',  '50%+'],
                ['bg-red-400',    '25%+'],
                ['bg-red-500',    '0%'],
              ].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                  <span className={`w-3 h-3 rounded ${c}`} />{l}
                </span>
              ))}
              <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                <span className="w-3 h-3 rounded border border-dashed border-zinc-400" />Scheduled
              </span>
              <span className="text-[10px] text-zinc-300 dark:text-zinc-600 ml-auto">Click a day for details</span>
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        <AnimatePresence>
          {selectedDay && (
            <DayPanel
              key={selectedDay}
              day={selectedDay}
              data={calData[selectedDay]}
              onClose={() => setSelectedDay(null)}
              onMark={load}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
