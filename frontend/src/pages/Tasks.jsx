import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { api } from '../api'
import { BlueprintPath } from '../components/BlueprintPath'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Tasks() {
  const { storyId } = useParams()
  const location = useLocation()
  const storyFromState = location.state?.story
  const featureFromState = location.state?.feature
  const backlogFromState = location.state?.backlog

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', due_date: '' })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const [users, setUsers] = useState([])
  const [assignments, setAssignments] = useState({}) // task_id -> array

  function load() {
    setLoading(true)
    setError('')
    api
      .getTasks({ story_id: storyId, ...filters })
      .then(async (tasks) => {
        setItems(tasks)
        // best-effort: load assignments per task; ignore failures (route may not exist yet)
        const entries = await Promise.all(
          tasks.map(async (t) => {
            try {
              const a = await api.getTaskAssignments(t.task_id)
              return [t.task_id, a]
            } catch {
              return [t.task_id, []]
            }
          })
        )
        setAssignments(Object.fromEntries(entries))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [storyId, filters.status, filters.priority])

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => setUsers([]))
  }, [])

  async function handleStatusChange(item, status) {
    try {
      await api.updateTask(item.task_id, { status })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handlePriorityChange(item, priority) {
    try {
      await api.updateTask(item.task_id, { priority })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return
    try {
      await api.deleteTask(item.task_id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAssign(taskId, assigned_to, reason) {
    if (!assigned_to) return
    try {
      await api.assignTask(taskId, { assigned_to, reason: reason || 'Assigned via TaskFlow' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim() || !form.description.trim() || !form.due_date) {
      setFormError('Title, description, and due date are required.')
      return
    }
    setCreating(true)
    try {
      const due_date = new Date(form.due_date).toISOString()
      await api.createTask({ story_id: storyId, title: form.title, description: form.description, priority: form.priority, due_date })
      setForm({ title: '', description: '', priority: 'Medium', due_date: '' })
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <BlueprintPath
        crumbs={[
          { label: 'Backlog', tag: '01', to: '/backlog' },
          { label: backlogFromState?.title || 'Item', tag: '01', to: backlogFromState ? `/backlog/${backlogFromState.backlog_item_id}/features` : null },
          { label: featureFromState?.title || 'Feature', tag: '02', to: featureFromState ? `/features/${featureFromState.feature_id}/stories` : null },
          { label: storyFromState?.title || 'Story', tag: '03', to: null },
          { label: 'Tasks', tag: '04', to: null },
        ]}
      />

      <div className="page-head">
        <p className="eyebrow">Step 04</p>
        <h1 className="page-title">Tasks</h1>
        <p className="page-sub">The concrete, assignable work items for this story.</p>
      </div>

      <div className="form-panel">
        <h2 className="form-panel-title">New task</h2>
        {formError && <div className="banner banner-error">{formError}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field field-wide">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build CSV download endpoint" />
            </div>
            <div className="field field-wide">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What needs to happen?" />
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
              <label>Due date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="field">
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? 'Adding…' : 'Add task'}
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
          <p className="empty-title">No tasks yet</p>
          <p>Add the first task for this story above.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="record-list">
          {items.map((item) => (
            <TaskRow
              key={item.task_id}
              item={item}
              users={users}
              assignedTo={assignments[item.task_id] || []}
              onStatusChange={(s) => handleStatusChange(item, s)}
              onPriorityChange={(p) => handlePriorityChange(item, p)}
              onDelete={() => handleDelete(item)}
              onAssign={(userId, reason) => handleAssign(item.task_id, userId, reason)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ item, users, assignedTo, onStatusChange, onPriorityChange, onDelete, onAssign }) {
  const [assignUser, setAssignUser] = useState('')
  const [reason, setReason] = useState('')
  const [showAssign, setShowAssign] = useState(false)

  function submitAssign() {
    onAssign(assignUser, reason)
    setAssignUser('')
    setReason('')
    setShowAssign(false)
  }

  return (
    <div className="record-row">
      <div className="record-main">
        <div className="record-id">{item.task_id}</div>
        <h3 className="record-title">{item.title}</h3>
        <p className="record-desc">{item.description}</p>
        {assignedTo.length > 0 && (
          <p className="record-due" style={{ marginTop: 6 }}>
            Assigned to: {assignedTo.map((a) => a.assigned_to).join(', ')}
          </p>
        )}
        {users.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {!showAssign ? (
              <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 9px' }} onClick={() => setShowAssign(true)}>
                Assign…
              </button>
            ) : (
              <>
                <select
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink)', borderRadius: 'var(--radius)', padding: '5px 7px', fontSize: 12 }}
                >
                  <option value="">Select person…</option>
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>{u.name || u.email}</option>
                  ))}
                </select>
                <input
                  placeholder="Reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink)', borderRadius: 'var(--radius)', padding: '5px 7px', fontSize: 12, width: 160 }}
                />
                <button className="btn-primary" style={{ fontSize: 11, padding: '5px 10px' }} onClick={submitAssign} disabled={!assignUser}>
                  Confirm
                </button>
                <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 9px' }} onClick={() => setShowAssign(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="record-meta">
        <div className="row-badges">
          <select
            value={item.status || 'Pending'}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink)', borderRadius: 'var(--radius)', padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: 11 }}
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
          <select
            value={item.priority || 'Medium'}
            onChange={(e) => onPriorityChange(e.target.value)}
            style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink)', borderRadius: 'var(--radius)', padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: 11 }}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <span className="record-due">Due {formatDate(item.due_date)}</span>
        <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 9px' }} onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}
