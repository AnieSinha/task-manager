import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '../api'
import { BlueprintPath } from '../components/BlueprintPath'

export default function Features() {
  const { backlogId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backlogFromState = location.state?.backlog

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getFeatures({ backlog_item_id: backlogId })
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [backlogId])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.')
      return
    }
    setCreating(true)
    try {
      await api.createFeature({ backlog_item_id: backlogId, ...form })
      setForm({ title: '', description: '' })
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(item, status) {
    try {
      await api.updateFeature(item.feature_id, { status })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return
    try {
      await api.deleteFeature(item.feature_id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <BlueprintPath
        crumbs={[
          { label: 'Backlog', tag: '01', to: '/backlog' },
          { label: backlogFromState?.title || 'Item', tag: '01', to: null },
          { label: 'Features', tag: '02', to: null },
        ]}
      />

      <div className="page-head">
        <p className="eyebrow">Step 02</p>
        <h1 className="page-title">Features</h1>
        <p className="page-sub">Features scoped to this backlog item. Open one to plan its stories.</p>
      </div>

      <div className="form-panel">
        <h2 className="form-panel-title">New feature</h2>
        {formError && <div className="banner banner-error">{formError}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field field-wide">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Export module" />
            </div>
            <div className="field field-wide">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this feature deliver?" />
            </div>
            <div className="field">
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? 'Adding…' : 'Add feature'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {loading && <div className="loading-rule" />}
      {error && <div className="banner banner-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p className="empty-title">No features yet</p>
          <p>Add the first feature for this backlog item above.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="record-list">
          {items.map((item) => (
            <div key={item.feature_id} className="record-row">
              <div
                className="record-main clickable"
                onClick={() => navigate(`/features/${item.feature_id}/stories`, { state: { feature: item, backlog: backlogFromState } })}
              >
                <div className="record-id">{item.feature_id}</div>
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
