import { useState } from 'react'
import { Clock, Calendar, MoreVertical, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import Badge from '../common/Badge'
import { tasks as tasksApi } from '../../api'

export default function TaskCard({ task, onRefresh, onEdit }) {
  const [menu, setMenu]         = useState(false)
  const [toggling, setToggling] = useState(false)

  const done = task.status === 'completed'

  const toggle = async e => {
    e.stopPropagation()
    setToggling(true)
    try {
      await tasksApi.complete(task.id)
      onRefresh?.()
    } finally { setToggling(false) }
  }

  const remove = async () => {
    if (!confirm('Delete this task?')) return
    await tasksApi.remove(task.id)
    onRefresh?.()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`card p-4 transition-all duration-200 group hover:shadow-md ${done ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={toggle}
          disabled={toggling}
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        >
          {done
            ? <CheckCircle2 className="w-5 h-5 text-brand-500 fill-brand-500/20" />
            : <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-zinc-900 dark:text-zinc-100 leading-snug ${done ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
              {task.title}
            </p>
            {/* Menu */}
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
                    className="absolute right-0 top-7 z-20 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700 py-1 min-w-[130px]"
                    onMouseLeave={() => setMenu(false)}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); setMenu(false); onEdit?.(task) }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setMenu(false); remove() }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-1">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <Badge type="priority" value={task.priority} />
            {task.category_name && (
              <span className="badge text-xs" style={{ background: task.category_color + '22', color: task.category_color }}>
                {task.category_icon} {task.category_name}
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date + 'T00:00:00'), 'MMM d')}
              </span>
            )}
            {task.due_time && (
              <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                <Clock className="w-3 h-3" />
                {task.due_time.slice(0,5)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
