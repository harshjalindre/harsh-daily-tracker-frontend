import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { routines as routinesApi, categories as catsApi } from '../../api'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const FREQS = [
  { value: 'daily',   label: '📆 Daily',   desc: 'Every day' },
  { value: 'weekly',  label: '📅 Weekly',  desc: 'Specific days' },
  { value: 'monthly', label: '🗓 Monthly', desc: 'One day/month' },
]

const empty = { title:'', description:'', frequency_type:'daily', days_of_week:[1,2,3,4,5], day_of_month:1, routine_time:'', category_id:'' }

export default function RoutineModal({ open, onClose, onSaved, routine }) {
  const [form, setForm]     = useState(empty)
  const [cats, setCats]     = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => { catsApi.list().then(r => setCats(r.data || [])) }, [])

  useEffect(() => {
    if (routine) {
      setForm({
        title:          routine.title          || '',
        description:    routine.description    || '',
        frequency_type: routine.frequency_type || 'daily',
        days_of_week:   routine.days_of_week   || [1,2,3,4,5],
        day_of_month:   routine.day_of_month   || 1,
        routine_time:   routine.routine_time   ? routine.routine_time.slice(0,5) : '',
        category_id:    routine.category_id    || '',
      })
    } else { setForm(empty) }
    setError('')
  }, [routine, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleDay = d => {
    const days = form.days_of_week.includes(d)
      ? form.days_of_week.filter(x => x !== d)
      : [...form.days_of_week, d].sort((a,b) => a-b)
    set('days_of_week', days)
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    if (form.frequency_type === 'weekly' && !form.days_of_week.length) {
      setError('Pick at least one day'); return
    }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        routine_time: form.routine_time || null,
        day_of_month: form.frequency_type === 'monthly' ? form.day_of_month : null,
        days_of_week: form.frequency_type === 'weekly'  ? form.days_of_week : null,
      }
      if (routine?.id) await routinesApi.update(routine.id, payload)
      else              await routinesApi.create(payload)
      onSaved?.(); onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={routine ? 'Edit Habit' : 'New Habit'}>
      <form onSubmit={submit} className="p-6 space-y-5">
        {/* Frequency */}
        <div>
          <label className="label">Frequency</label>
          <div className="grid grid-cols-3 gap-2">
            {FREQS.map(f => (
              <button key={f.value} type="button" onClick={() => set('frequency_type', f.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.frequency_type === f.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <div className="text-base">{f.label.split(' ')[0]}</div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{f.label.split(' ')[1]}</div>
                <div className="text-[10px] text-zinc-400">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="label">Habit Name *</label>
          <input className="input-field" placeholder="e.g., Morning workout" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Details..." value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        {/* Weekly days */}
        {form.frequency_type === 'weekly' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Days of week</label>
              <div className="flex gap-1">
                {[
                  { label: 'Weekdays', days: [1,2,3,4,5] },
                  { label: 'Weekends', days: [0,6] },
                  { label: 'Every day', days: [0,1,2,3,4,5,6] },
                ].map(preset => {
                  const active = JSON.stringify([...form.days_of_week].sort()) === JSON.stringify([...preset.days].sort())
                  return (
                    <button key={preset.label} type="button"
                      onClick={() => set('days_of_week', preset.days)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        active
                          ? 'bg-brand-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >{preset.label}</button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              {DAYS.map((d, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    form.days_of_week.includes(i)
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Monthly day */}
        {form.frequency_type === 'monthly' && (
          <div>
            <label className="label">Day of month</label>
            <input type="number" min="1" max="31" className="input-field" value={form.day_of_month}
              onChange={e => set('day_of_month', parseInt(e.target.value))} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Time (optional)</label>
            <input type="time" className="input-field" value={form.routine_time} onChange={e => set('routine_time', e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">None</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 rounded-xl">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving…' : routine ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
