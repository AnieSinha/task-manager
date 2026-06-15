import React, { useState, useEffect } from 'react';
import { assignTask, getUsers } from '../services/api';
import { useToast } from './Toast';

export default function AssignModal({ task, onClose, onAssigned }) {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignedTo) return;
    setLoading(true);
    try {
      await assignTask({ task_id: task.id, assigned_to: Number(assignedTo) });
      addToast('Task assigned successfully!', 'success');
      onAssigned?.();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to assign task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Assign Task</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="card" style={{ background: 'var(--surface2)', marginBottom: 4 }}>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                  ID #{task.id} · {task.priority} priority
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign to</label>
              <select
                className="form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
              >
                <option value="">Select a team member…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="form-error" style={{ color: 'var(--text-muted)' }}>
                  ℹ No users loaded — check if GET /api/users is available on your backend.
                </p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !assignedTo}>
              {loading ? <><span className="spinner" /> Assigning…</> : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
