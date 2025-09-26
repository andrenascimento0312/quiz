import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

// Configurar axios
const API_BASE = import.meta.env.VITE_API_URL || '/api'
axios.defaults.baseURL = API_BASE

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  // Interceptor para adicionar token automaticamente
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    // Interceptor de resposta para tratar erros de autenticação
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
          toast.error('Sessão expirada. Faça login novamente.')
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  // Verificar token ao carregar
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const response = await axios.get('/admin/profile')
      setAdmin(response.data.admin)
    } catch (error) {
      console.error('Erro ao verificar token:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/admin/login', { email, password })
      const { admin: adminData, token } = response.data

      // Salvar token
      localStorage.setItem('adminToken', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setAdmin(adminData)
      toast.success('Login realizado com sucesso!')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao fazer login'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/admin/register', { name, email, password })
      const { admin: adminData, token } = response.data

      // Salvar token
      localStorage.setItem('adminToken', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setAdmin(adminData)
      toast.success('Conta criada com sucesso!')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao criar conta'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    delete axios.defaults.headers.common['Authorization']
    setAdmin(null)
    toast.success('Logout realizado com sucesso!')
  }

  const value = {
    admin,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
