import { useEffect, useState } from "react";
import API from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";

function Dashboard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await API.get("/tasks");

      setTasks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const createTask = async (taskData) => {
    try {
      await API.post("/tasks", taskData);

      fetchTasks();
    } catch (err) {
      console.log(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/tasks/${id}/status`, {
        status,
      });

      fetchTasks();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="dashboard-layout">
        <Sidebar />

        <div className="dashboard-content">
          <TaskForm createTask={createTask} />

          {tasks.length === 0 ? (
            <p>No tasks yet. Create one 🚀</p>
          ) : (
            <div className="task-grid">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  updateStatus={updateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;