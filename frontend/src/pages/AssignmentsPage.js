import React, { useEffect, useState, useCallback } from 'react';
import { getTasks } from '../services/api';
import { useToast } from '../components/Toast';
import AssignModal from '../components/AssignModal';

function statusClass(status) {
  if (status === 'Done') return 'badge-done';
  if (status === 'In Progress') return 'badge-progress';
  if (status === 'Blocked') return 'badge-blocked';
  return 'badge-todo';
}

export default function AssignmentsPage() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState(null);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    getTasks()
      .then(setTasks)
      .catch(() => addToast('Failed to load tasks', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const unassigned = tasks.filter((t) => !t.assigned_to);
  const assigned = tasks.filter((t) => t.assigned_to);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">{unassigned.length} unassigned · {assigned.length} assigned</p>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Unassigned */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠ Unassigned Tasks</span>
            <span className="badge badge-todo">{unassigned.length}</span>
          </div>
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : unassigned.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <div className="empty-title">All tasks assigned!</div>
              <div className="empty-desc">Great job keeping the board organized</div>
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unassigned.map((task) => (
                    <tr key={task.id}>
                      <td><span className="text-xs text-muted">#{task.id}</span></td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                          className={task.priority === 'High' ? 'priority-high' : task.priority === 'Medium' ? 'priority-medium' : 'priority-low'}>
                          {task.priority}
                        </span>
                      </td>
                      <td><span className={`badge ${statusClass(task.status)}`}>{task.status}</span></td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => setAssignTarget(task)}>
                          Assign →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assigned */}
        {assigned.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">✓ Assigned Tasks</span>
              <span className="badge badge-done">{assigned.length}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assigned.map((task) => (
                    <tr key={task.id}>
                      <td><span className="text-xs text-muted">#{task.id}</span></td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: 'var(--accent-dim)', border: '1px solid var(--border-bright)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                          }}>
                            {(task.assigned_to_name || String(task.assigned_to))[0]?.toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13 }}>{task.assigned_to_name || `User #${task.assigned_to}`}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${statusClass(task.status)}`}>{task.status}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAssignTarget(task)}>
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {assignTarget && (
        <AssignModal task={assignTarget} onClose={() => setAssignTarget(null)} onAssigned={fetchTasks} />
      )}
    </>
  );
}
