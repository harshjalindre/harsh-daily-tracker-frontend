import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LayoutGrid, Table2 } from 'lucide-react'
import WeeklyGrid  from '../components/Routines/WeeklyGrid'
import BatchAddModal from '../components/Routines/BatchAddModal'
import { routines as routinesApi } from '../api'
import RoutineCard  from '../components/Routines/RoutineCard'
import RoutineModal from '../components/Routines/RoutineModal'
import Modal from '../components/common/Modal'

const TABS = [
  { value: 'daily',   label: '📆 Daily' },
  { value: 'weekly',  label: '📅 Weekly' },
  { value: 'monthly', label: '🗓 Monthly' },
]

const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const FREQS = ['daily','weekly','monthly']

function ConvertModal({ open, onClose, routine, onConverted }) {
  const [target, setTarget] = useState('weekly')
  const [days, setDays]     = useState([1,2,3,4,5])
  const [dom, setDom]       = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (routine) {
      const opts = FREQS.filter(f => f !== routine.frequency_type)
      setTarget(opts[0])
    }
  }, [routine])

  const submit = async () => {
    setSaving(true)
    try {
      await routinesApi.convert(routine.id, {
        frequency_type: target,
        days_of_week:   target === 'weekly'  ? days : null,
        day_of_month:   target === 'monthly' ? dom  : null,
      })
      onConverted?.(); onClose()
    } finally { setSaving(false) }
  }

  if (!routine) return null
  const opts = FREQS.filter(f => f !== routine.frequency_type)

  return (
    <Modal open={open} onClose={onClose} title="Convert Habit" size="sm">
      <div className="p-6 space-y-5">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Converting <strong className="text-zinc-800 dark:text-zinc-200">{routine.title}</strong> from <span className="text-brand-500">{routine.frequency_type}</span>
        </p>
        <div>
          <label className="label">New Frequency</label>
          <div className="space-y-2">
            {opts.map(f => (
              <button key={f} type="button" onClick={() => setTarget(f)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  target === f ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{f}</span>
              </button>
            ))}
          </div>
        </div>

        {target === 'weekly' && (
          <div>
            <label className="label">Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_FULL.map((d, i) => (
                <button key={i} type="button"
                  onClick={() => setDays(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev,i].sort())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    days.includes(i) ? 'bg-brand-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}>{d.slice(0,3)}</button>
              ))}
            </div>
          </div>
        )}

        {target === 'monthly' && (
          <div>
            <label className="label">Day of month</label>
            <input type="number" min="1" max="31" className="input-field" value={dom}
              onChange={e => setDom(parseInt(e.target.value))} />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Converting…' : 'Convert'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Routines() {
  const [list, setList]               = useState([])
  const [tab, setTab]                 = useState('daily')
  const [view, setView]               = useState('cards') // 'cards' | 'grid'
  const [modal, setModal]             = useState(false)
  const [batchModal, setBatchModal]   = useState(false)
  const [editing, setEditing]         = useState(null)
  const [converting, setConverting]   = useState(null)
  const [loading, setLoading]         = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await routinesApi.list()
      setList(res.data || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered  = list.filter(r => r.frequency_type === tab)
  const completed = filtered.filter(r => r.today_status === 'done').length
  const missed    = filtered.filter(r => r.today_status === 'missed').length
  const reviewed  = completed + missed

  const openEdit    = r => { setEditing(r); setModal(true) }
  const openConvert = r => setConverting(r)
  const closeModal  = () => { setModal(false); setEditing(null) }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Habits</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">{list.length} total habits</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button onClick={() => setView('cards')} title="Card view"
              className={`p-2 rounded-lg transition-all ${view === 'cards' ? 'bg-white dark:bg-zinc-900 shadow-sm text-brand-500' : 'text-zinc-400 hover:text-zinc-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('grid')} title="Weekly grid"
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white dark:bg-zinc-900 shadow-sm text-brand-500' : 'text-zinc-400 hover:text-zinc-600'}`}>
              <Table2 className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setBatchModal(true)} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Batch Add
          </button>
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Habit
          </button>
        </div>
      </div>

      {/* Weekly grid view */}
      {view === 'grid' && <WeeklyGrid />}

      {/* Tabs — only in card view */}
      {view === 'cards' && <>
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl mb-6">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.value
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Progress bar */}
      {filtered.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Today's Review</p>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-emerald-500">{completed} done</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-red-400">{missed} missed</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-zinc-400">{filtered.length - reviewed} left</span>
            </div>
          </div>
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${filtered.length ? (completed/filtered.length)*100 : 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-l-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${filtered.length ? (missed/filtered.length)*100 : 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              className="h-full bg-gradient-to-r from-red-400 to-red-500"
            />
          </div>
          {reviewed === filtered.length && filtered.length > 0 && (
            <p className="text-xs text-center text-brand-500 font-semibold mt-2">
              {missed === 0 ? '🎉 Perfect day!' : `✅ Review done — ${completed}/${filtered.length} completed`}
            </p>
          )}
        </motion.div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-2/3" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">{tab === 'daily' ? '📆' : tab === 'weekly' ? '📅' : '🗓'}</div>
          <p className="font-bold text-zinc-700 dark:text-zinc-300 text-lg">No {tab} habits yet</p>
          <p className="text-zinc-400 dark:text-zinc-500 mt-1 text-sm">Build consistency with a new habit</p>
          <button onClick={() => setModal(true)} className="btn-primary mt-5 text-sm">Add Habit</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filtered.map(r => (
              <RoutineCard key={r.id} routine={r} onRefresh={load} onEdit={openEdit} onConvert={openConvert} />
            ))}
          </AnimatePresence>
        </div>
      )}

      </> /* end card view */}

      {/* FAB */}
      <button onClick={() => setModal(true)} className="fab md:hidden">
        <Plus className="w-6 h-6" />
      </button>

      <RoutineModal  open={modal}        onClose={closeModal}                onSaved={load} routine={editing} />
      <ConvertModal  open={!!converting} onClose={() => setConverting(null)} routine={converting} onConverted={load} />
      <BatchAddModal open={batchModal}   onClose={() => setBatchModal(false)} onSaved={load} />
    </div>
  )
}
