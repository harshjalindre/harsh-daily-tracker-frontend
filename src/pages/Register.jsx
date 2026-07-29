import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { auth as authApi } from '../api'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { setAuth }           = useAuthStore()
  const navigate              = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await authApi.register(form)
      setAuth(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/50 border border-zinc-100 dark:border-zinc-800 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center shadow-xl shadow-brand-500/30 mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black gradient-text">Get Started</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Create your free account ✨</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Your Name</label>
              <input type="text" required className="input-field" placeholder="Alex Johnson"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input-field" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} required minLength={6}
                  className="input-field pr-11" placeholder="Min 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 rounded-xl">{error}</p>}

            <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
            Already have one?{' '}
            <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
