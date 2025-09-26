import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  restricted: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-gray-100 text-gray-800 border-gray-200'
}

const STATUS_LABELS = {
  pending: 'Pendente',
  approved: 'Aprovado',
  restricted: 'Restrito',
  rejected: 'Rejeitado'
}

const ACTION_LABELS = {
  approve: 'aprovado',
  reject: 'rejeitado',
  restrict: 'restringido',
  unrestrict: 'desbloqueado',
  delete: 'excluído'
}

function SuperAdminDashboard() {
  const { admin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({})
  const [recentActions, setRecentActions] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionModal, setActionModal] = useState({ show: false, user: null, action: '' })
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        axios.get('/superadmin/users'),
        axios.get('/superadmin/stats')
      ])

      setUsers(usersResponse.data.users)
      setStats(statsResponse.data.stats)
      setRecentActions(statsResponse.data.recent_actions)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do painel')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (user, action) => {
    setActionModal({ show: true, user, action })
    setReason('')
  }

  const confirmAction = async () => {
    if (!actionModal.user || !actionModal.action) return

    setActionLoading(true)
    try {
      await axios.post(`/superadmin/users/${actionModal.user.id}/action`, {
        action: actionModal.action,
        reason: reason.trim() || undefined
      })

      toast.success(`Usuário ${ACTION_LABELS[actionModal.action]} com sucesso!`)
      setActionModal({ show: false, user: null, action: '' })
      setReason('')
      loadData()
    } catch (error) {
      console.error('Erro na ação:', error)
      const message = error.response?.data?.error || 'Erro ao executar ação'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente o usuário "${user.name}"?\n\nEsta ação não pode ser desfeita e todos os dados do usuário serão perdidos.`)) {
      return
    }

    const deleteReason = prompt('Motivo da exclusão (opcional):')
    
    try {
      await axios.delete(`/superadmin/users/${user.id}`, {
        data: { reason: deleteReason }
      })

      toast.success('Usuário excluído com sucesso!')
      loadData()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      const message = error.response?.data?.error || 'Erro ao excluir usuário'
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Carregando painel...</h2>
        </div>
      </div>
    )
  }

  const pendingUsers = users.filter(u => u.status === 'pending')
  const approvedUsers = users.filter(u => u.status === 'approved')
  const restrictedUsers = users.filter(u => u.status === 'restricted')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🛡️ Painel do SuperAdmin</h1>
            <p className="text-purple-100">Gerencie usuários e monitore o sistema</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100">Logado como</p>
            <p className="font-semibold">{admin.name}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.total_users || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Total de Usuários</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.pending_users || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Pendentes</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.approved_users || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Aprovados</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.restricted_users || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Restritos</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.total_quizzes || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Total de Quizzes</div>
        </div>
      </div>

      {/* Usuários Pendentes */}
      {pendingUsers.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            ⏳ Usuários Pendentes ({pendingUsers.length})
          </h2>
          
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-600">📱 {user.phone}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleAction(user, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      ✅ Aprovar
                    </button>
                    <button
                      onClick={() => handleAction(user, 'reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Todos os Usuários */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          👥 Todos os Usuários ({users.length})
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Usuário</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Quizzes</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Cadastro</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-gray-500">📱 {user.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[user.status]}`}>
                      {STATUS_LABELS[user.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium">{user.quiz_count}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {user.approved_by_name && (
                      <p className="text-xs text-gray-500">
                        Aprovado por {user.approved_by_name}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(user, 'approve')}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleAction(user, 'reject')}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                      
                      {user.status === 'approved' && (
                        <button
                          onClick={() => handleAction(user, 'restrict')}
                          className="px-3 py-1 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded font-medium"
                        >
                          Restringir
                        </button>
                      )}
                      
                      {user.status === 'restricted' && (
                        <button
                          onClick={() => handleAction(user, 'unrestrict')}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-medium"
                        >
                          Desbloquear
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(user)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ações Recentes */}
      {recentActions.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            📝 Ações Recentes
          </h2>
          
          <div className="space-y-3">
            {recentActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{action.superadmin_name}</span>
                    {' '}<span className="text-gray-600">{ACTION_LABELS[action.action]}</span>{' '}
                    <span className="font-medium">{action.target_name}</span>
                  </p>
                  {action.reason && (
                    <p className="text-xs text-gray-500 mt-1">Motivo: {action.reason}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(action.created_at).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(action.created_at).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Ação */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Ação
            </h3>
            
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja <strong>{ACTION_LABELS[actionModal.action]}</strong> o usuário{' '}
              <strong>{actionModal.user?.name}</strong>?
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows="3"
                placeholder="Descreva o motivo da ação..."
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setActionModal({ show: false, user: null, action: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading}
                className={`px-6 py-2 rounded-lg font-medium text-white ${
                  actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  actionModal.action === 'restrict' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {actionLoading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminDashboard
