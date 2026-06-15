import React, { useEffect, useState, useCallback } from 'react';
import { getTasks, updateTaskStatus } from '../services/api';
import { useToast } from '../components/Toast';
import TaskModal from '../components/TaskModal';
import AssignModal from '../components/AssignModal';

const STATUSES = ['To Do', 'In Progress', 'Done', 'Blocked'];
const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

function statusClass(status) {
  if (status === 'Done') return 'badge-done';
  if (status === 'In Progress') return 'badge-progress';
  if (status === 'Blocked') return 'badge-blocked';
  return 'badge-todo';
}

function priorityClass(p) {
  if (p === 'High') return 'priority-high';
  if (p === 'Medium') return 'priority-medium';
  return 'priority-low';
}

export default function TasksPage() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState({});

  const fetchTasks = useCallback(() => {
    setLoading(true);
    getTasks()
      .then(setTasks)
      .catch(() => addToast('Failed to load tasks', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusChange = async (task, newStatus) => {
    setUpdating((p) => ({ ...p, [task.id]: true }));
    try {
      await updateTaskStatus(task.id, newStatus);
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
      addToast('Status updated', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdating((p) => ({ ...p, [task.id]: false }));
    }
  };

  const filtered = tasks.filter((t) => {
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} total · {filtered.length} shown</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Task
        </button>
      </div>

      <div className="page-body">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
            <span className="search-icon">⌕</span>
            <input
              className="form-input"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                className={`filter-pill ${filterPriority === p ? 'active' : ''}`}
                onClick={() => setFilterPriority(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...STATUSES].map((s) => (
              <button
                key={s}
                className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="page-loader"><div className="spinner" /> Loading tasks…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <div className="empty-title">No tasks found</div>
              <div className="empty-desc">Try adjusting filters or create a new task</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task) => (
                    <tr key={task.id}>
                      <td><span className="text-xs text-muted">#{task.id}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`text-xs font-bold ${priorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: 12, width: 'auto', minWidth: 130 }}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                          disabled={updating[task.id]}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setAssignTarget(task)}
                            title="Assign to user"
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <TaskModal onClose={() => setShowCreate(false)} onCreated={fetchTasks} />
      )}

      {assignTarget && (
        <AssignModal
          task={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={fetchTasks}
        />
      )}
    </>
  );
}
