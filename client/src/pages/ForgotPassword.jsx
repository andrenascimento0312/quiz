import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [devToken, setDevToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('/admin/forgot-password', { email })
      
      setEmailSent(true)
      toast.success('Instruções de recuperação enviadas!')
      
      // Mostrar token em desenvolvimento
      if (response.data.dev_token) {
        setDevToken(response.data.dev_token)
      }
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error)
      const message = error.response?.data?.error || 'Erro ao solicitar recuperação de senha'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">📧</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email Enviado!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Se o email <strong>{email}</strong> estiver cadastrado em nosso sistema, 
              você receberá as instruções para redefinir sua senha.
            </p>

            {/* Token para desenvolvimento */}
            {devToken && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                  🔧 Modo Desenvolvimento
                </h3>
                <p className="text-xs text-yellow-700 mb-2">
                  Use este token para redefinir a senha:
                </p>
                <code className="text-xs bg-yellow-100 px-2 py-1 rounded break-all">
                  {devToken}
                </code>
              </div>
            )}
            
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Não recebeu o email? Verifique sua caixa de spam.
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                    setDevToken('')
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Tentar outro email
                </button>
                
                <Link
                  to="/admin/login"
                  className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                >
                  ← Voltar ao login
                </Link>
              </div>
            </div>
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
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Esqueceu sua senha?
            </h2>
            <p className="text-gray-600">
              Digite seu email e enviaremos instruções para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="seu@email.com"
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
                  <span>Enviando...</span>
                </div>
              ) : (
                '📧 Enviar Instruções'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/admin/login"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              ← Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
