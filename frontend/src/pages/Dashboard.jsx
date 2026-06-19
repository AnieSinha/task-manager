import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-head">
        <p className="eyebrow">Overview</p>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">A running count across the full build hierarchy — backlog through to task.</p>
      </div>

      {loading && <div className="loading-rule" />}
      {error && <div className="banner banner-error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-cell">
            <div className="stat-number">{stats.total_backlogs}</div>
            <div className="stat-label">Backlog items</div>
          </div>
          <div className="stat-cell">
            <div className="stat-number">{stats.total_features}</div>
            <div className="stat-label">Features</div>
          </div>
          <div className="stat-cell">
            <div className="stat-number">{stats.total_stories}</div>
            <div className="stat-label">Stories</div>
          </div>
          <div className="stat-cell">
            <div className="stat-number">{stats.total_tasks}</div>
            <div className="stat-label">Tasks</div>
          </div>
          <div className="stat-cell accent">
            <div className="stat-number">{stats.pending_tasks}</div>
            <div className="stat-label">Pending tasks</div>
          </div>
        </div>
      )}

      <p className="eyebrow" style={{ marginBottom: 14 }}>Build path</p>
      <div className="hierarchy-rail">
        <Link to="/backlog" className="rail-card">
          <div className="rail-step">01 — Backlog</div>
          <div className="rail-name">Backlog items</div>
          <div className="rail-desc">Raw ideas and requests, prioritized.</div>
        </Link>
        <div className="rail-card" style={{ opacity: 0.6, cursor: 'default' }}>
          <div className="rail-step">02 — Feature</div>
          <div className="rail-name">Features</div>
          <div className="rail-desc">Open a backlog item to view its features.</div>
        </div>
        <div className="rail-card" style={{ opacity: 0.6, cursor: 'default' }}>
          <div className="rail-step">03 — Story</div>
          <div className="rail-name">Stories</div>
          <div className="rail-desc">Open a feature to view its stories.</div>
        </div>
        <div className="rail-card" style={{ opacity: 0.6, cursor: 'default' }}>
          <div className="rail-step">04 — Task</div>
          <div className="rail-name">Tasks</div>
          <div className="rail-desc">Open a story to view and create tasks.</div>
        </div>
      </div>
    </div>
  )
}
