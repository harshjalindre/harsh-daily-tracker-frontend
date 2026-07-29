import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { tasks as tasksApi, categories as catsApi } from '../api'
import TaskCard  from '../components/Tasks/TaskCard'
import TaskModal from '../components/Tasks/TaskModal'

const STATUS_TABS = [
  { value: '',          label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Done' },
]

const PRIORITIES = ['', 'high', 'medium', 'low']

export default function Tasks() {
  const [taskList, setTaskList]   = useState([])
  const [cats, setCats]           = useState([])
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    status: '', priority: '', category_id: '', search: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v))
      const res = await tasksApi.list(params)
      setTaskList(res.data || [])
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])
  useEffect(() => { catsApi.list().then(r => setCats(r.data || [])) }, [])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ status: '', priority: '', category_id: '', search: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  const openEdit = task => { setEditing(task); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const groups = {
    high:   taskList.filter(t => t.priority === 'high'   && t.status !== 'completed'),
    medium: taskList.filter(t => t.priority === 'medium' && t.status !== 'completed'),
    low:    taskList.filter(t => t.priority === 'low'    && t.status !== 'completed'),
    done:   taskList.filter(t => t.status === 'completed'),
  }

  const shouldGroup = !filters.status && !filters.priority && !filters.search && !filters.category_id

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Tasks</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">{taskList.length} total</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            className="input-field pl-10"
            placeholder="Search tasks…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
          {filters.search && (
            <button onClick={() => setFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`btn-secondary flex items-center gap-2 text-sm px-4 ${hasFilters ? 'border-brand-500 text-brand-600 dark:text-brand-400' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
        </button>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-4 mb-4 space-y-4">
              {/* Status tabs */}
              <div>
                <label className="label">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_TABS.map(s => (
                    <button key={s.value} onClick={() => setFilter('status', s.value)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                        filters.status === s.value
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select className="input-field" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
                    <option value="">All</option>
                    {PRIORITIES.slice(1).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input-field" value={filters.category_id} onChange={e => setFilter('category_id', e.target.value)}>
                    <option value="">All</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>

              {hasFilters && (
                <button onClick={clearFilters} className="btn-ghost text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-3/4" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : taskList.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <p className="font-bold text-zinc-700 dark:text-zinc-300 text-lg">{hasFilters ? 'No matches' : 'No tasks yet'}</p>
          <p className="text-zinc-400 dark:text-zinc-500 mt-1 text-sm">
            {hasFilters ? 'Try adjusting your filters' : 'Create your first task to get started'}
          </p>
          {!hasFilters && (
            <button onClick={() => setModal(true)} className="btn-primary mt-5 text-sm">Add Task</button>
          )}
        </div>
      ) : shouldGroup ? (
        <div className="space-y-6">
          {groups.high.length > 0 && (
            <section>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2.5 px-1">🔴 High Priority</p>
              <div className="space-y-2.5"><AnimatePresence>{groups.high.map(t => <TaskCard key={t.id} task={t} onRefresh={load} onEdit={openEdit} />)}</AnimatePresence></div>
            </section>
          )}
          {groups.medium.length > 0 && (
            <section>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2.5 px-1">🟡 Medium Priority</p>
              <div className="space-y-2.5"><AnimatePresence>{groups.medium.map(t => <TaskCard key={t.id} task={t} onRefresh={load} onEdit={openEdit} />)}</AnimatePresence></div>
            </section>
          )}
          {groups.low.length > 0 && (
            <section>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2.5 px-1">🔵 Low Priority</p>
              <div className="space-y-2.5"><AnimatePresence>{groups.low.map(t => <TaskCard key={t.id} task={t} onRefresh={load} onEdit={openEdit} />)}</AnimatePresence></div>
            </section>
          )}
          {groups.done.length > 0 && (
            <section>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 px-1">✅ Completed ({groups.done.length})</p>
              <div className="space-y-2.5"><AnimatePresence>{groups.done.map(t => <TaskCard key={t.id} task={t} onRefresh={load} onEdit={openEdit} />)}</AnimatePresence></div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>{taskList.map(t => <TaskCard key={t.id} task={t} onRefresh={load} onEdit={openEdit} />)}</AnimatePresence>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setModal(true)} className="fab md:hidden" title="New task">
        <Plus className="w-6 h-6" />
      </button>

      <TaskModal open={modal} onClose={closeModal} onSaved={load} task={editing} />
    </div>
  )
}
