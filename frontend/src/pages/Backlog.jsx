import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { PriorityBadge } from '../components/Badges'
import { BlueprintPath } from '../components/BlueprintPath'

export default function Backlog() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium' })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getBacklog(filters)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters.status, filters.priority])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.')
      return
    }
    setCreating(true)
    try {
      await api.createBacklog(form)
      setForm({ title: '', description: '', priority: 'Medium' })
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(item, status) {
    try {
      await api.updateBacklog(item.backlog_item_id, { status })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return
    try {
      await api.deleteBacklog(item.backlog_item_id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <BlueprintPath crumbs={[{ label: 'Backlog', tag: '01', to: null }]} />

      <div className="page-head">
        <p className="eyebrow">Step 01</p>
        <h1 className="page-title">Backlog</h1>
        <p className="page-sub">Where raw ideas land before they become features. Open an item to break it into features.</p>
      </div>

      <div className="form-panel">
        <h2 className="form-panel-title">New backlog item</h2>
        {formError && <div className="banner banner-error">{formError}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field field-wide">
              <label>Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Allow CSV export of reports"
              />
            </div>
            <div className="field field-wide">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this need to cover?"
              />
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="field">
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? 'Adding…' : 'Add to backlog'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="form-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 200px))' }}>
        <div className="field">
          <label>Filter by status</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <div className="field">
          <label>Filter by priority</label>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading-rule" />}
      {error && <div className="banner banner-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p className="empty-title">No backlog items yet</p>
          <p>Add one above to start the build path toward features, stories, and tasks.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="record-list">
          {items.map((item) => (
            <div key={item.backlog_item_id} className="record-row">
              <div
                className="record-main clickable"
                onClick={() => navigate(`/backlog/${item.backlog_item_id}/features`, { state: { backlog: item } })}
              >
                <div className="record-id">{item.backlog_item_id}</div>
                <h3 className="record-title">{item.title}</h3>
                <p className="record-desc">{item.description}</p>
              </div>
              <div className="record-meta">
                <div className="row-badges">
                  <select
                    value={item.status || 'Pending'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(item, e.target.value)}
                    style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink)', borderRadius: 'var(--radius)', padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                  <PriorityBadge priority={item.priority} />
                </div>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '5px 9px' }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
