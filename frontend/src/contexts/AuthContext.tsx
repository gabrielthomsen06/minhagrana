import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { loginApi } from '../services/api'

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (token && savedUser) {
      setIsAuthenticated(true)
      setUsername(savedUser)
    }
    setIsLoading(false)
  }, [])

  const login = async (user: string, password: string) => {
    const response = await loginApi(user, password)
    localStorage.setItem('auth_token', response.token)
    localStorage.setItem('auth_user', response.username)
    setIsAuthenticated(true)
    setUsername(response.username)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setIsAuthenticated(false)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
