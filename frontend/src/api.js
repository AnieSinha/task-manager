const BASE_URL = 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('taskflow_token')
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    throw new Error(
      'Could not reach the API. Is the backend running on http://localhost:8000?'
    )
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    // some endpoints may return no body
  }

  if (!res.ok) {
    const message = data?.detail || data?.message || `Request failed (${res.status})`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  return data
}

export const api = {
  // ---- auth ----
  async signup({ name, email, password }) {
    return request('/signup', { method: 'POST', auth: false, body: { name, email, password } })
  },
  async login({ email, password }) {
    const data = await request('/login', { method: 'POST', auth: false, body: { email, password } })
    // backend returns 200 even on bad credentials, with no "token" field in that case
    if (!data?.token) {
      throw new Error(data?.message || 'Invalid email or password')
    }
    return data
  },
  async protected() {
    return request('/protected')
  },

  // ---- dashboard ----
  async getStats() {
    return request('/dashboard/stats')
  },

  // ---- backlog ----
  async getBacklog(params = {}) {
    const qs = buildQuery(params)
    return request(`/backlog${qs}`)
  },
  async createBacklog({ title, description, priority }) {
    return request('/backlog', { method: 'POST', body: { title, description, priority } })
  },

  // ---- features ----
  async getFeatures(params = {}) {
    const qs = buildQuery(params)
    return request(`/features${qs}`)
  },
  async createFeature({ backlog_item_id, title, description }) {
    return request('/feature', { method: 'POST', body: { backlog_item_id, title, description } })
  },

  // ---- stories ----
  async getStories(params = {}) {
    const qs = buildQuery(params)
    return request(`/stories${qs}`)
  },
  async createStory({ feature_id, title, description }) {
    return request('/story', { method: 'POST', body: { feature_id, title, description } })
  },

  // ---- tasks ----
  async getTasks(params = {}) {
    const qs = buildQuery(params)
    return request(`/tasks${qs}`)
  },
  async createTask({ story_id, title, description, priority, due_date }) {
    return request('/tasks', { method: 'POST', body: { story_id, title, description, priority, due_date } })
  },
  async getTask(taskId) {
    return request(`/tasks/${taskId}`)
  },
  async updateTask(taskId, payload) {
    return request(`/tasks/${taskId}`, { method: 'PATCH', body: payload })
  },
  async deleteTask(taskId) {
    return request(`/tasks/${taskId}`, { method: 'DELETE' })
  },

  // ---- backlog update/delete ----
  async getBacklogItem(id) {
    return request(`/backlog/${id}`)
  },
  async updateBacklog(id, payload) {
    return request(`/backlog/${id}`, { method: 'PATCH', body: payload })
  },
  async deleteBacklog(id) {
    return request(`/backlog/${id}`, { method: 'DELETE' })
  },

  // ---- feature update/delete ----
  async getFeature(id) {
    return request(`/feature/${id}`)
  },
  async updateFeature(id, payload) {
    return request(`/feature/${id}`, { method: 'PATCH', body: payload })
  },
  async deleteFeature(id) {
    return request(`/feature/${id}`, { method: 'DELETE' })
  },

  // ---- story delete (no status field on Story yet) ----
  async getStory(id) {
    return request(`/story/${id}`)
  },
  async deleteStory(id) {
    return request(`/story/${id}`, { method: 'DELETE' })
  },

  // ---- assignment ----
  async getUsers() {
    return request('/users')
  },
  async assignTask(taskId, { assigned_to, reason }) {
    return request(`/tasks/${taskId}/assign`, { method: 'POST', body: { assigned_to, reason } })
  },
  async getTaskAssignments(taskId) {
    return request(`/tasks/${taskId}/assignments`)
  },
}

function buildQuery(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (!entries.length) return ''
  const usp = new URLSearchParams(entries)
  return `?${usp.toString()}`
}

export { getToken, BASE_URL }
