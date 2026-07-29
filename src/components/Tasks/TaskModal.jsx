import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { tasks as tasksApi, categories as catsApi } from '../../api'

const TYPES = [
  { value: 'todo',     label: '✅ Todo',     desc: 'Simple task' },
  { value: 'timed',    label: '⏰ Timed',    desc: 'Has a time' },
  { value: 'deadline', label: '📅 Deadline', desc: 'Due by date' },
]
const PRIORITIES = [
  { value: 'low',    label: 'Low',    dot: 'bg-blue-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-500' },
  { value: 'high',   label: 'High',   dot: 'bg-red-500' },
]

const empty = { title:'', description:'', type:'todo', priority:'medium', category_id:'', due_date:'', due_time:'' }

export default function TaskModal({ open, onClose, onSaved, task }) {
  const [form, setForm]     = useState(empty)
  const [cats, setCats]     = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    catsApi.list().then(r => setCats(r.data || []))
  }, [])

  useEffect(() => {
    if (task) {
      setForm({
        title:       task.title       || '',
        description: task.description || '',
        type:        task.type        || 'todo',
        priority:    task.priority    || 'medium',
        category_id: task.category_id || '',
        due_date:    task.due_date    || '',
        due_time:    task.due_time    ? task.due_time.slice(0,5) : '',
      })
    } else {
      setForm(empty)
    }
    setError('')
  }, [task, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        due_date:    form.due_date    || null,
        due_time:    form.due_time    || null,
      }
      if (task?.id) await tasksApi.update(task.id, payload)
      else           await tasksApi.create(payload)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'New Task'}>
      <form onSubmit={submit} className="p-6 space-y-5">
        {/* Type selector */}
        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value} type="button"
                onClick={() => set('type', t.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.type === t.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <div className="text-lg">{t.label.split(' ')[0]}</div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{t.label.split(' ')[1]}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            className="input-field"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input-field resize-none"
            rows={2}
            placeholder="Add some details..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="label">Priority</label>
            <div className="space-y-1.5">
              {PRIORITIES.map(p => (
                <button
                  key={p.value} type="button"
                  onClick={() => set('priority', p.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.priority === p.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              className="input-field"
              value={form.category_id}
              onChange={e => set('category_id', e.target.value)}
            >
              <option value="">No category</option>
              {cats.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date / Time */}
        {(form.type === 'deadline' || form.type === 'timed') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input-field" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            {form.type === 'timed' && (
              <div>
                <label className="label">Time</label>
                <input type="time" className="input-field" value={form.due_time} onChange={e => set('due_time', e.target.value)} />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 rounded-xl">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
