import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { email, logout, isAuthed } = useAuth()
  if (!isAuthed) return null

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" />
        TaskFlow
      </div>
      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
          Dashboard
        </NavLink>
        <NavLink to="/backlog" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Backlog
        </NavLink>
      </nav>
      <div className="account">
        <span className="account-email">{email}</span>
        <button className="btn-ghost" onClick={logout}>Sign out</button>
      </div>
    </header>
  )
}
