import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '../api'
import { BlueprintPath } from '../components/BlueprintPath'

export default function Stories() {
  const { featureId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const featureFromState = location.state?.feature
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
      .getStories({ feature_id: featureId })
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [featureId])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.')
      return
    }
    setCreating(true)
    try {
      await api.createStory({ feature_id: featureId, ...form })
      setForm({ title: '', description: '' })
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return
    try {
      await api.deleteStory(item.story_id)
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
          { label: backlogFromState?.title || 'Item', tag: '01', to: backlogFromState ? `/backlog/${backlogFromState.backlog_item_id}/features` : null },
          { label: featureFromState?.title || 'Feature', tag: '02', to: null },
          { label: 'Stories', tag: '03', to: null },
        ]}
      />

      <div className="page-head">
        <p className="eyebrow">Step 03</p>
        <h1 className="page-title">Stories</h1>
        <p className="page-sub">User stories scoped to this feature. Open one to add tasks.</p>
      </div>

      <div className="form-panel">
        <h2 className="form-panel-title">New story</h2>
        {formError && <div className="banner banner-error">{formError}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field field-wide">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. As a user, I can export my data as CSV" />
            </div>
            <div className="field field-wide">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Acceptance criteria or detail" />
            </div>
            <div className="field">
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? 'Adding…' : 'Add story'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {loading && <div className="loading-rule" />}
      {error && <div className="banner banner-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p className="empty-title">No stories yet</p>
          <p>Add the first story for this feature above.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="record-list">
          {items.map((item) => (
            <div key={item.story_id} className="record-row">
              <div
                className="record-main clickable"
                onClick={() => navigate(`/stories/${item.story_id}/tasks`, { state: { story: item, feature: featureFromState, backlog: backlogFromState } })}
              >
                <div className="record-id">{item.story_id}</div>
                <h3 className="record-title">{item.title}</h3>
                <p className="record-desc">{item.description}</p>
              </div>
              <div className="record-meta">
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
