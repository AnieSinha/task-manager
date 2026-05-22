import React, { useEffect, useState } from 'react';
import { getTasks } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  'To Do': '#7878a0',
  'In Progress': '#ffd166',
  Done: '#00e5a0',
  Blocked: '#ff4d6d',
};

export default function Dashboard({ onNav }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'To Do').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    done: tasks.filter((t) => t.status === 'Done').length,
  };

  const priorityCounts = {
    High: tasks.filter((t) => t.priority === 'High').length,
    Medium: tasks.filter((t) => t.priority === 'Medium').length,
    Low: tasks.filter((t) => t.priority === 'Low').length,
  };

  const recent = tasks.slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNav('tasks')}>
          + New Task
        </button>
      </div>

      <div className="page-body">
        {/* Welcome */}
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--accent-dim) 0%, transparent 60%)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Good {getGreeting()},</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{user?.name} 👋</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                You have <strong style={{ color: 'var(--yellow)' }}>{counts.inProgress}</strong> tasks in progress and <strong style={{ color: 'var(--red)' }}>{counts.todo}</strong> to do.
              </div>
            </div>
            <div style={{ fontSize: 48, opacity: 0.3 }}>⬡</div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Tasks', value: counts.total, icon: '◈', color: 'var(--accent)' },
            { label: 'To Do', value: counts.todo, icon: '○', color: 'var(--text-muted)' },
            { label: 'In Progress', value: counts.inProgress, icon: '◑', color: 'var(--yellow)' },
            { label: 'Completed', value: counts.done, icon: '●', color: 'var(--green)' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          {/* Recent Tasks */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Tasks</span>
              <button className="btn btn-ghost btn-sm" onClick={() => onNav('tasks')}>View all →</button>
            </div>
            {loading ? (
              <div className="page-loader"><div className="spinner" /> Loading...</div>
            ) : recent.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <div className="empty-title">No tasks yet</div>
                <div className="empty-desc">Create your first task to get started</div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((task) => (
                      <tr key={task.id}>
                        <td style={{ fontWeight: 500 }}>{task.title}</td>
                        <td>
                          <span className={`badge ${statusClass(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td>
                          <span className={`text-xs priority-${task.priority?.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Priority breakdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">By Priority</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(priorityCounts).map(([p, count]) => {
                const pct = counts.total ? Math.round((count / counts.total) * 100) : 0;
                const col = p === 'High' ? 'var(--red)' : p === 'Medium' ? 'var(--orange)' : 'var(--green)';
                return (
                  <div key={p}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{p}</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: col }}>{count}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}

              {counts.total === 0 && !loading && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</p>
              )}
            </div>

            <div className="divider" style={{ margin: 0 }} />

            <div className="card-body" style={{ paddingTop: 16 }}>
              <button className="btn btn-primary w-full" onClick={() => onNav('kanban')}>
                View Kanban Board →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function statusClass(status) {
  if (status === 'Done') return 'badge-done';
  if (status === 'In Progress') return 'badge-progress';
  if (status === 'Blocked') return 'badge-blocked';
  return 'badge-todo';
}
