import { useState } from 'react'
import { Clock, Flame, Pencil, Trash2, RefreshCw, MoreVertical, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import Badge from '../common/Badge'
import { routines as routinesApi } from '../../api'

const DAYS_SHORT = ['S','M','T','W','T','F','S']

export default function RoutineCard({ routine, onRefresh, onEdit, onConvert }) {
  const [menu, setMenu]     = useState(false)
  const [busy, setBusy]     = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  const mark = async (status, e) => {
    e?.stopPropagation()
    setBusy(true)
    try {
      await routinesApi.complete(routine.id, today, status)
      onRefresh?.()
    } finally { setBusy(false) }
  }

  const todayStatus = routine.today_status  // 'done' | 'missed' | null

  const remove = async () => {
    if (!confirm('Delete this habit?')) return
    await routinesApi.remove(routine.id)
    onRefresh?.()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`card p-4 group transition-all hover:shadow-md ${!routine.is_active ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 flex-shrink-0">
          {todayStatus === 'done'   && <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />}
          {todayStatus === 'missed' && <XCircle      className="w-5 h-5 text-red-400   fill-red-400/10"   />}
          {!todayStatus             && <Circle       className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-zinc-900 dark:text-zinc-100 ${routine.completed_today ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
              {routine.title}
            </p>
            <div className="relative flex-shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setMenu(m => !m) }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <MoreVertical className="w-4 h-4 text-zinc-400" />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-7 z-20 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700 py-1 min-w-[150px]"
                    onMouseLeave={() => setMenu(false)}
                  >
                    <button onClick={e => { e.stopPropagation(); setMenu(false); onEdit?.(routine) }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={e => { e.stopPropagation(); setMenu(false); onConvert?.(routine) }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300">
                      <RefreshCw className="w-3.5 h-3.5" /> Convert
                    </button>
                    <button onClick={e => { e.stopPropagation(); setMenu(false); remove() }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {routine.description && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-1">{routine.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <Badge type="freq" value={routine.frequency_type} />
            {routine.category_name && (
              <span className="badge text-xs" style={{ background: routine.category_color + '22', color: routine.category_color }}>
                {routine.category_icon} {routine.category_name}
              </span>
            )}
            {routine.routine_time && (
              <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                <Clock className="w-3 h-3" /> {routine.routine_time.slice(0,5)}
              </span>
            )}
            {routine.streak > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                <Flame className="w-3 h-3" /> {routine.streak} day{routine.streak !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Weekly days indicator */}
          {routine.frequency_type === 'weekly' && routine.days_of_week && (
            <div className="flex gap-1 mt-2.5">
              {DAYS_SHORT.map((d, i) => (
                <span key={i} className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                  routine.days_of_week.includes(i)
                    ? 'bg-brand-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}>{d}</span>
              ))}
            </div>
          )}

          {/* Done / Missed buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={e => mark('done', e)} disabled={busy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                todayStatus === 'done'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {todayStatus === 'done' ? 'Done ✓' : 'Mark Done'}
            </button>
            <button
              onClick={e => mark('missed', e)} disabled={busy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                todayStatus === 'missed'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              {todayStatus === 'missed' ? 'Missed ✗' : 'Missed'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
