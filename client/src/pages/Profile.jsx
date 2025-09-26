import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function Profile() {
  const navigate = useNavigate()
  const { admin, updateAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profile, setProfile] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
    avatar: admin?.avatar || ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (admin) {
      setProfile({
        name: admin.name || '',
        email: admin.email || '',
        phone: admin.phone || '',
        avatar: admin.avatar || ''
      })
    }
  }, [admin])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.put('/admin/profile', {
        name: profile.name.trim(),
        phone: profile.phone.trim() || null,
        avatar: profile.avatar.trim() || null
      })

      updateAdmin(response.data.admin)
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      const message = error.response?.data?.error || 'Erro ao atualizar perfil'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setPasswordLoading(true)

    try {
      await axios.put('/admin/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      toast.success('Senha alterada com sucesso!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      const message = error.response?.data?.error || 'Erro ao alterar senha'
      toast.error(message)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Verificar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    // Converter para base64 (em uma aplicação real, você enviaria para um serviço de upload)
    const reader = new FileReader()
    reader.onload = (event) => {
      setProfile({ ...profile, avatar: event.target.result })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">👤 Meu Perfil</h1>
            <p className="text-blue-100">Gerencie suas informações pessoais e configurações</p>
          </div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200"
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Informações Pessoais
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔒 Segurança
            </button>
          </nav>
        </div>

        {/* Aba de Perfil */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold border-4 border-gray-200">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Foto de Perfil</h3>
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors">
                      📷 Alterar Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                    {profile.avatar && (
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, avatar: '' })}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, PNG ou GIF. Máximo 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="input"
                    required
                    maxLength="100"
                  />
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    className="input bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para alterar o email, entre em contato com o suporte
                  </p>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone/WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="input"
                    placeholder="(11) 99999-9999"
                    maxLength="20"
                  />
                </div>

                {/* Role (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Conta
                  </label>
                  <input
                    type="text"
                    value={admin?.role === 'superadmin' ? 'Super Administrador' : 'Administrador'}
                    className="input bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              {/* Status da Conta */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Status da Conta</h3>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    admin?.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {admin?.status === 'approved' ? '✅ Aprovada' : '⏳ Pendente'}
                  </span>
                  <span className="text-sm text-gray-600">
                    Cadastrado em {admin?.created_at ? new Date(admin.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 rounded-lg font-medium text-white ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {loading ? 'Salvando...' : '💾 Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Aba de Segurança */}
        {activeTab === 'security' && (
          <div className="p-6">
            <div className="max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Alterar Senha</h3>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual *
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input"
                    minLength="6"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo de 6 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className={`w-full py-3 rounded-lg font-medium text-white ${
                      passwordLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {passwordLoading ? 'Alterando...' : '🔒 Alterar Senha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
