function TaskCard({ task, updateStatus }) {
  return (
    <div className="task-card">
      <h3>{task.title}</h3>

      <p><b>Status:</b> {task.status}</p>

      <p className={task.priority.toLowerCase()}>
        <b>Priority:</b> {task.priority}
      </p>

      <select
        value={task.status}
        onChange={(e) => updateStatus(task.id, e.target.value)}
      >
        <option>To Do</option>
        <option>In Progress</option>
        <option>Completed</option>
      </select>
    </div>
  );
}

export default TaskCard;