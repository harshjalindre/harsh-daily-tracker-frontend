import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { routines as routinesApi, categories as catsApi } from '../../api'
import { Plus, X, CheckCircle2 } from 'lucide-react'

const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const PRESETS = [
  { label: '📅 Weekdays',  days: [1,2,3,4,5], freq: 'weekly' },
  { label: '🌤 Weekends',  days: [0,6],        freq: 'weekly' },
  { label: '📆 Every Day', days: [0,1,2,3,4,5,6], freq: 'weekly' },
  { label: '🔁 Daily',     days: null,          freq: 'daily'  },
]

export default function BatchAddModal({ open, onClose, onSaved }) {
  const [habits, setHabits]     = useState([
    { title: '', time: '', done: false }
  ])
  const [preset, setPreset]     = useState(0)          // index into PRESETS
  const [customDays, setCustom] = useState([1,2,3,4,5])
  const [useCustom, setUseCustom] = useState(false)
  const [categoryId, setCatId]  = useState('')
  const [cats, setCats]         = useState([])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState([])          // indexes of successfully saved
  const [error, setError]       = useState('')

  useEffect(() => { catsApi.list().then(r => setCats(r.data || [])) }, [])
  useEffect(() => { if (open) { setHabits([{ title: '', time: '', done: false }]); setSaved([]); setError('') } }, [open])

  const addRow    = () => setHabits(h => [...h, { title: '', time: '', done: false }])
  const removeRow = i  => setHabits(h => h.filter((_, idx) => idx !== i))
  const setField  = (i, k, v) => setHabits(h => h.map((r, idx) => idx === i ? { ...r, [k]: v } : r))

  const toggleCustomDay = d => setCustom(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a,b)=>a-b)
  )

  const activeDays = useCustom ? customDays : (PRESETS[preset].days)
  const activeFreq = useCustom ? 'weekly'   : PRESETS[preset].freq

  const submit = async e => {
    e.preventDefault()
    const toCreate = habits.filter(h => h.title.trim())
    if (!toCreate.length) { setError('Add at least one habit name'); return }
    setSaving(true); setError('')

    const results = []
    for (let i = 0; i < habits.length; i++) {
      const h = habits[i]
      if (!h.title.trim()) continue
      try {
        await routinesApi.create({
          title:          h.title.trim(),
          frequency_type: activeFreq,
          days_of_week:   activeFreq === 'weekly' ? activeDays : null,
          routine_time:   h.time || null,
          category_id:    categoryId || null,
        })
        results.push(i)
        setHabits(prev => prev.map((r, idx) => idx === i ? { ...r, done: true } : r))
      } catch {}
    }

    setSaved(results)
    setSaving(false)
    if (results.length) {
      setTimeout(() => { onSaved?.(); onClose() }, 800)
    }
  }

  const filledCount = habits.filter(h => h.title.trim()).length

  return (
    <Modal open={open} onClose={onClose} title="Batch Add Habits" size="md">
      <form onSubmit={submit} className="p-6 space-y-5">

        {/* Schedule preset */}
        <div>
          <label className="label">Schedule</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {PRESETS.map((p, i) => (
              <button key={i} type="button"
                onClick={() => { setPreset(i); setUseCustom(false) }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                  !useCustom && preset === i
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}>{p.label}</button>
            ))}
          </div>

          {/* Custom day picker */}
          <div>
            <button type="button" onClick={() => setUseCustom(s => !s)}
              className={`text-xs font-semibold mb-2 transition-colors ${useCustom ? 'text-brand-500' : 'text-zinc-400 hover:text-zinc-600'}`}>
              {useCustom ? '✓ Custom days' : '+ Custom days'}
            </button>
            {useCustom && (
              <div className="flex gap-1.5">
                {DAYS_SHORT.map((d, i) => (
                  <button key={i} type="button" onClick={() => toggleCustomDay(i)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      customDays.includes(i)
                        ? 'bg-brand-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}>{d}</button>
                ))}
              </div>
            )}
          </div>

          {/* Active days preview */}
          {activeFreq === 'weekly' && activeDays && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              Repeats on: <span className="font-semibold text-brand-500">
                {activeDays.map(d => DAYS_SHORT[d]).join(', ')}
              </span>
            </p>
          )}
          {activeFreq === 'daily' && (
            <p className="text-xs text-zinc-400 mt-2">Repeats <span className="font-semibold text-brand-500">every day</span></p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="label">Category (same for all)</label>
          <select className="input-field" value={categoryId} onChange={e => setCatId(e.target.value)}>
            <option value="">No category</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        {/* Habit rows */}
        <div>
          <label className="label">Habits ({filledCount} to create)</label>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {habits.map((h, i) => (
              <div key={i} className={`flex items-center gap-2 transition-all ${h.done ? 'opacity-50' : ''}`}>
                {h.done
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  : <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400">{i+1}</span>
                }
                <input
                  className="input-field flex-1 py-2.5 text-sm"
                  placeholder={`e.g. Morning workout, Study block…`}
                  value={h.title}
                  onChange={e => setField(i, 'title', e.target.value)}
                  disabled={h.done}
                />
                <input
                  type="time"
                  className="input-field w-28 py-2.5 text-sm flex-shrink-0"
                  value={h.time}
                  onChange={e => setField(i, 'time', e.target.value)}
                  disabled={h.done}
                  title="Time (optional)"
                />
                {habits.length > 1 && !h.done && (
                  <button type="button" onClick={() => removeRow(i)}
                    className="p-2 text-zinc-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addRow}
            className="mt-3 flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Add another habit
          </button>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 rounded-xl">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving || !filledCount}>
            {saving
              ? `Creating ${filledCount} habit${filledCount > 1 ? 's' : ''}…`
              : `Create ${filledCount} Habit${filledCount !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      </form>
    </Modal>
  )
}
