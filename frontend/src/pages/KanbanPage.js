import React, { useEffect, useState, useCallback } from 'react';
import { getTasks, updateTaskStatus } from '../services/api';
import { useToast } from '../components/Toast';
import TaskModal from '../components/TaskModal';
import AssignModal from '../components/AssignModal';

const COLUMNS = [
  { status: 'To Do', color: '#7878a0', dot: '#555577' },
  { status: 'In Progress', color: '#ffd166', dot: '#ffd166' },
  { status: 'Done', color: '#00e5a0', dot: '#00e5a0' },
  { status: 'Blocked', color: '#ff4d6d', dot: '#ff4d6d' },
];

function priorityClass(p) {
  if (p === 'High') return 'priority-high';
  if (p === 'Medium') return 'priority-medium';
  return 'priority-low';
}

export default function KanbanPage() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [dragging, setDragging] = useState(null);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    getTasks()
      .then(setTasks)
      .catch(() => addToast('Failed to load tasks', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDragStart = (e, task) => {
    setDragging(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!dragging || dragging.status === newStatus) { setDragging(null); return; }
    const prev = tasks;
    setTasks((ts) => ts.map((t) => t.id === dragging.id ? { ...t, status: newStatus } : t));
    try {
      await updateTaskStatus(dragging.id, newStatus);
      addToast(`Moved to "${newStatus}"`, 'success');
    } catch {
      setTasks(prev);
      addToast('Failed to update', 'error');
    }
    setDragging(null);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="page-subtitle">Drag & drop to change task status</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Task
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="page-loader"><div className="spinner" /> Loading board…</div>
        ) : (
          <div className="kanban-board">
            {COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.status);
              return (
                <div
                  key={col.status}
                  className="kanban-col"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.status)}
                  style={{ borderTop: `3px solid ${col.dot}` }}
                >
                  <div className="kanban-col-header">
                    <div className="kanban-col-title">
                      <span className="col-dot" style={{ background: col.dot }} />
                      {col.status}
                    </div>
                    <span className="kanban-col-count">{colTasks.length}</span>
                  </div>

                  <div className="kanban-col-body">
                    {colTasks.length === 0 && (
                      <div style={{
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: 'var(--text-dim)',
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        Drop tasks here
                      </div>
                    )}
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        style={{ opacity: dragging?.id === task.id ? 0.4 : 1 }}
                      >
                        <div className="task-card-title">{task.title}</div>
                        <div className="task-card-meta">
                          <span className="task-card-id">#{task.id}</span>
                          <span className={`task-card-priority ${priorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="task-card-actions">
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 11 }}
                            onClick={() => setAssignTarget(task)}
                          >
                            Assign
                          </button>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                            ⠿ drag
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && <TaskModal onClose={() => setShowCreate(false)} onCreated={fetchTasks} />}
      {assignTarget && (
        <AssignModal task={assignTarget} onClose={() => setAssignTarget(null)} onAssigned={fetchTasks} />
      )}
    </>
  );
}
