import React, { useState, useEffect } from 'react';
import { createTask, getStories } from '../services/api';
import { useToast } from './Toast';

export default function TaskModal({ onClose, onCreated }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    story_id: '',
  });
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStories().then(setStories).catch(() => {});
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        ...(form.story_id ? { story_id: Number(form.story_id) } : {}),
      });
      addToast('Task created successfully!', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to create task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Create New Task</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                name="title"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                name="description"
                placeholder="Add more details…"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟠 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Story (optional)</label>
                <select className="form-select" name="story_id" value={form.story_id} onChange={handleChange}>
                  <option value="">— None —</option>
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating…</> : '+ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
