function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="navbar">
      <h2>TaskFlow</h2>

      <div>
        👋 {user?.name || "User"}
      </div>
    </div>
  );
}

export default Navbar;