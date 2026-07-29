import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { auth as authApi, categories as catsApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useNavigate } from 'react-router-dom'

const THEMES = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const PALETTE = ['#8b5cf6','#ec4899','#22c55e','#f59e0b','#06b6d4','#ef4444','#f97316','#6366f1','#14b8a6','#84cc16']

const ICONS = ['📁','💼','✨','💪','📚','🎯','🏠','💡','🎵','🍎','✈️','💰','🎮','📸','🌱','🔬']

function CategoryRow({ cat, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(cat.name)
  const [color, setColor]     = useState(cat.color)
  const [icon, setIcon]       = useState(cat.icon)
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    await catsApi.update(cat.id, { name, color, icon })
    onRefresh(); setEditing(false); setSaving(false)
  }

  const remove = async () => {
    if (!confirm(`Delete "${cat.name}"? Tasks in this category will be uncategorized.`)) return
    await catsApi.remove(cat.id)
    onRefresh()
  }

  if (!editing) return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-xl">{cat.icon}</span>
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1">{cat.name}</span>
      <button onClick={() => setEditing(true)} className="btn-ghost p-1.5 text-zinc-400">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={remove} className="btn-ghost p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )

  return (
    <div className="py-3 space-y-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3">
      <div className="flex gap-2">
        <input className="input-field flex-1 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="Category name" />
        <button onClick={save} disabled={saving} className="btn-primary px-3 py-2"><Check className="w-4 h-4" /></button>
        <button onClick={() => setEditing(false)} className="btn-secondary px-3 py-2"><X className="w-4 h-4" /></button>
      </div>
      <div>
        <p className="label mb-2">Icon</p>
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map(ic => (
            <button key={ic} type="button" onClick={() => setIcon(ic)}
              className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                icon === ic ? 'bg-brand-500 ring-2 ring-brand-500/50' : 'bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200'
              }`}>{ic}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="label mb-2">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {PALETTE.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-400 scale-110' : 'hover:scale-105'}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, setUser, logout }    = useAuthStore()
  const { preference, setTheme }     = useThemeStore()
  const navigate                     = useNavigate()

  const [profile, setProfile]        = useState({ name: user?.name || '', email: user?.email || '' })
  const [profileSaving, setPS]       = useState(false)
  const [profileMsg, setMsg]         = useState('')

  const [cats, setCats]              = useState([])
  const [newCat, setNewCat]          = useState({ name: '', color: '#8b5cf6', icon: '📁' })
  const [addingCat, setAddingCat]    = useState(false)
  const [showNewCat, setShowNewCat]  = useState(false)

  useEffect(() => { catsApi.list().then(r => setCats(r.data || [])) }, [])

  const saveProfile = async e => {
    e.preventDefault()
    setPS(true)
    try {
      await authApi.update({ name: profile.name })
      const res = await authApi.me()
      setUser(res.data)
      setMsg('Profile saved ✓')
      setTimeout(() => setMsg(''), 2000)
    } finally { setPS(false) }
  }

  const addCategory = async e => {
    e.preventDefault()
    if (!newCat.name.trim()) return
    setAddingCat(true)
    await catsApi.create(newCat)
    const res = await catsApi.list()
    setCats(res.data || [])
    setNewCat({ name: '', color: '#8b5cf6', icon: '📁' })
    setShowNewCat(false)
    setAddingCat(false)
  }

  const refreshCats = () => catsApi.list().then(r => setCats(r.data || []))

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="page-container max-w-2xl">
      <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-6">Settings</h1>

      {/* Theme */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-4">
        <h2 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4">Appearance</h2>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button key={value} onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                preference === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              }`}>
              <Icon className={`w-5 h-5 ${preference === value ? 'text-brand-500' : 'text-zinc-400'}`} />
              <span className={`text-sm font-semibold ${preference === value ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{label}</span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Profile */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6 mb-4">
        <h2 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input-field" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field opacity-60 cursor-not-allowed" value={profile.email} disabled />
            <p className="text-xs text-zinc-400 mt-1">Email can't be changed</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary text-sm" disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
            {profileMsg && <span className="text-sm text-emerald-500 font-medium">{profileMsg}</span>}
          </div>
        </form>
      </motion.section>

      {/* Categories */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-zinc-800 dark:text-zinc-200">Categories</h2>
          <button onClick={() => setShowNewCat(s => !s)} className="btn-secondary text-sm flex items-center gap-1.5 py-2">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {showNewCat && (
          <form onSubmit={addCategory} className="card p-4 mb-4 space-y-3 bg-brand-50 dark:bg-brand-500/5 border-brand-200 dark:border-brand-500/20">
            <input className="input-field text-sm" placeholder="Category name" value={newCat.name}
              onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))} autoFocus />
            <div>
              <p className="label mb-1.5">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setNewCat(n => ({ ...n, icon: ic }))}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center ${newCat.icon === ic ? 'bg-brand-500' : 'bg-white dark:bg-zinc-800'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label mb-1.5">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {PALETTE.map(c => (
                  <button key={c} type="button" onClick={() => setNewCat(n => ({ ...n, color: c }))}
                    className={`w-6 h-6 rounded-full transition-all ${newCat.color === c ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : ''}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowNewCat(false)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
              <button type="submit" className="btn-primary flex-1 text-sm py-2" disabled={addingCat}>Add</button>
            </div>
          </form>
        )}

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {cats.map(c => <CategoryRow key={c.id} cat={c} onRefresh={refreshCats} />)}
          {cats.length === 0 && <p className="text-sm text-zinc-400 py-4 text-center">No categories yet</p>}
        </div>
      </motion.section>

      {/* Danger zone */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6 border-red-100 dark:border-red-900/30">
        <h2 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Account</h2>
        <p className="text-sm text-zinc-400 mb-4">Signed in as <strong>{user?.email}</strong></p>
        <button onClick={handleLogout} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
          Sign Out
        </button>
      </motion.section>
    </div>
  )
}
