import { useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="sidebar">
      <h3>Menu</h3>

      <p>📋 Tasks</p>
      <p>📊 Dashboard</p>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Sidebar;