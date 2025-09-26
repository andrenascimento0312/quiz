import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import axios from 'axios'
import toast from 'react-hot-toast'

function JoinLobby() {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  const { socket, joinLobby, connect } = useSocket()
  
  const [lobby, setLobby] = useState(null)
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadLobbyInfo()
  }, [lobbyId])

  useEffect(() => {
    if (socket) {
      setupSocketListeners()
      connect()
    }

    return () => {
      if (socket) {
        socket.off('join_success')
        socket.off('join_error')
      }
    }
  }, [socket])

  const loadLobbyInfo = async () => {
    try {
      const response = await axios.get(`/lobby/${lobbyId}`)
      setLobby(response.data.lobby)
      
      if (response.data.lobby.status !== 'waiting') {
        toast.error('Este lobby não está mais aceitando participantes')
        return
      }
    } catch (error) {
      console.error('Erro ao carregar lobby:', error)
      toast.error('Lobby não encontrado')
    } finally {
      setLoading(false)
    }
  }

  const setupSocketListeners = () => {
    socket.on('join_success', (data) => {
      console.log('Entrou no lobby:', data)
      // Salvar dados do participante no localStorage
      localStorage.setItem('participantData', JSON.stringify({
        participantId: data.participantId,
        nickname: data.nickname,
        lobbyId: data.lobbyId
      }))
      
      navigate(`/lobby/${lobbyId}/waiting`)
    })

    socket.on('join_error', (data) => {
      toast.error(data.message)
      setJoining(false)
    })
  }

  const handleJoin = (e) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      toast.error('Digite um nickname')
      return
    }

    if (nickname.length < 2) {
      toast.error('Nickname deve ter pelo menos 2 caracteres')
      return
    }

    if (nickname.length > 20) {
      toast.error('Nickname deve ter no máximo 20 caracteres')
      return
    }

    setJoining(true)
    joinLobby(lobbyId, nickname.trim())
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lobby não encontrado</h1>
          <p className="text-gray-600">Este lobby pode ter expirado ou não existe.</p>
        </div>
      </div>
    )
  }

  if (lobby.status !== 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lobby não disponível</h1>
          <p className="text-gray-600">
            {lobby.status === 'running' ? 'Este quiz já começou.' : 'Este quiz já foi finalizado.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {lobby.quiz_title}
            </h1>
            
            {lobby.quiz_description && (
              <p className="text-gray-600 mb-4">{lobby.quiz_description}</p>
            )}
            
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>Admin: {lobby.admin_name}</span>
              <span>•</span>
              <span>{lobby.participantCount} participantes</span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                Escolha seu nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input text-center text-lg"
                placeholder="Digite seu nickname"
                maxLength="20"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Entre 2 e 20 caracteres. Deve ser único neste lobby.
              </p>
            </div>

            <button
              type="submit"
              disabled={joining || !nickname.trim()}
              className={`w-full text-lg py-3 ${joining || !nickname.trim() ? 'btn-disabled' : 'btn-primary'}`}
            >
              {joining ? 'Entrando...' : '🚀 Entrar no Lobby'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">ℹ️ Como funciona</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Aguarde outros participantes entrarem</li>
              <li>• O quiz começará quando houver pelo menos 5 pessoas</li>
              <li>• Responda as perguntas o mais rápido possível</li>
              <li>• Veja o ranking em tempo real</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinLobby
