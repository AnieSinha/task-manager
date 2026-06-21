import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Backlog from './pages/Backlog'
import Features from './pages/Features'
import Stories from './pages/Stories'
import Tasks from './pages/Tasks'

function Protected({ children }) {
  const { isAuthed } = useAuth()
  if (!isAuthed) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="*"
        element={
          <div className="app-shell">
            <Navbar />
            <main className="content">
              <Routes>
                <Route path="/" element={<Protected><Dashboard /></Protected>} />
                <Route path="/backlog" element={<Protected><Backlog /></Protected>} />
                <Route path="/backlog/:backlogId/features" element={<Protected><Features /></Protected>} />
                <Route path="/features/:featureId/stories" element={<Protected><Stories /></Protected>} />
                <Route path="/stories/:storyId/tasks" element={<Protected><Tasks /></Protected>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  )
}
