import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token'))
  const [email, setEmail] = useState(() => localStorage.getItem('taskflow_email'))

  const login = useCallback(async (creds) => {
    const data = await api.login(creds)
    localStorage.setItem('taskflow_token', data.token)
    localStorage.setItem('taskflow_email', creds.email)
    setToken(data.token)
    setEmail(creds.email)
    return data
  }, [])

  const signup = useCallback(async (payload) => {
    return api.signup(payload)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('taskflow_token')
    localStorage.removeItem('taskflow_email')
    setToken(null)
    setEmail(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, email, login, signup, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
