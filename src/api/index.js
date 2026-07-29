import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost/harsh-daily-tracker/backend'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('dt_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dt_token')
      localStorage.removeItem('dt_user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export const auth = {
  login:   b => api.post('/auth/login', b),
  register:b => api.post('/auth/register', b),
  me:      () => api.get('/auth/me'),
  update:  b => api.put('/auth/me', b),
}

export const tasks = {
  list:         q => api.get('/tasks', { params: q }),
  create:       b => api.post('/tasks', b),
  update:       (id, b) => api.put(`/tasks/${id}`, b),
  remove:       id => api.delete(`/tasks/${id}`),
  complete:     id => api.patch(`/tasks/${id}/complete`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
}

export const routines = {
  list:    () => api.get('/routines'),
  create:  b => api.post('/routines', b),
  update:  (id, b) => api.put(`/routines/${id}`, b),
  remove:  id => api.delete(`/routines/${id}`),
  complete:    (id, date, status = 'done') => api.post(`/routines/${id}/complete`, { date, status }),
  weeklyGrid:  (start) => api.get('/routines/week', { params: { start } }),
  convert: (id, b) => api.post(`/routines/${id}/convert`, b),
}

export const categories = {
  list:   () => api.get('/categories'),
  create: b => api.post('/categories', b),
  update: (id, b) => api.put(`/categories/${id}`, b),
  remove: id => api.delete(`/categories/${id}`),
}

export const analytics = {
  overview:   () => api.get('/analytics/overview'),
  trends:     days => api.get('/analytics/trends', { params: { days } }),
  categories: () => api.get('/analytics/categories'),
  priority:   () => api.get('/analytics/priority'),
  streaks:    () => api.get('/analytics/streaks'),
  habits:     () => api.get('/analytics/habits'),
  calendar:   (month) => api.get('/analytics/calendar', { params: { month } }),
}

export default api
