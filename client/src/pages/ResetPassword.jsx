import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setFormData(prev => ({ ...prev, token }))
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (!formData.token.trim()) {
      toast.error('Token de recuperação é obrigatório')
      return
    }

    setLoading(true)

    try {
      await axios.post('/admin/reset-password', {
        token: formData.token.trim(),
        newPassword: formData.newPassword
      })

      setSuccess(true)
      toast.success('Senha redefinida com sucesso!')
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/admin/login')
      }, 3000)

    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      const message = error.response?.data?.error || 'Erro ao redefinir senha'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✅</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Senha Redefinida!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em alguns segundos.
            </p>
            
            <Link
              to="/admin/login"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔑</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Redefinir Senha
            </h2>
            <p className="text-gray-600">
              Digite sua nova senha abaixo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token de Recuperação
              </label>
              <input
                type="text"
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors font-mono text-sm"
                placeholder="Cole aqui o token recebido por email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Digite sua nova senha"
                minLength="6"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Confirme sua nova senha"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Redefinindo...</span>
                </div>
              ) : (
                '🔑 Redefinir Senha'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              to="/admin/forgot-password"
              className="block text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Solicitar novo token
            </Link>
            
            <Link
              to="/admin/login"
              className="block text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              ← Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
