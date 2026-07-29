import clsx from 'clsx'

const variants = {
  priority: {
    high:   'bg-red-100   text-red-700   dark:bg-red-500/20   dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    low:    'bg-blue-100  text-blue-700  dark:bg-blue-500/20  dark:text-blue-400',
  },
  status: {
    pending:     'bg-zinc-100  text-zinc-600  dark:bg-zinc-700/50 dark:text-zinc-300',
    in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    completed:   'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    cancelled:   'bg-red-100   text-red-600   dark:bg-red-500/20   dark:text-red-400',
  },
  type: {
    todo:     'bg-zinc-100  text-zinc-600  dark:bg-zinc-700/50 dark:text-zinc-300',
    timed:    'bg-blue-100  text-blue-700  dark:bg-blue-500/20  dark:text-blue-400',
    deadline: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  },
  freq: {
    daily:   'bg-cyan-100  text-cyan-700   dark:bg-cyan-500/20  dark:text-cyan-400',
    weekly:  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
    monthly: 'bg-pink-100  text-pink-700   dark:bg-pink-500/20  dark:text-pink-400',
  },
}

export default function Badge({ type = 'priority', value, className }) {
  const base = 'inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full'
  const variant = variants[type]?.[value] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300'
  return (
    <span className={clsx(base, variant, className)}>
      {value?.replace('_', ' ')}
    </span>
  )
}
