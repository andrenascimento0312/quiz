import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import axios from 'axios'
import toast from 'react-hot-toast'

function ParticipantWaiting() {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  const { socket, connect } = useSocket()
  
  const [lobby, setLobby] = useState(null)
  const [participants, setParticipants] = useState([])
  const [participantCount, setParticipantCount] = useState(0)
  const [needed, setNeeded] = useState(5)
  const [participantData, setParticipantData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se tem dados do participante salvos
    const savedData = localStorage.getItem('participantData')
    if (!savedData) {
      toast.error('Dados do participante não encontrados')
      navigate(`/join/${lobbyId}`)
      return
    }

    const data = JSON.parse(savedData)
    if (data.lobbyId !== lobbyId) {
      toast.error('Lobby inválido')
      navigate(`/join/${lobbyId}`)
      return
    }

    setParticipantData(data)
    loadLobbyInfo()
  }, [lobbyId, navigate])

  useEffect(() => {
    if (socket && participantData) {
      setupSocketListeners()
      connect()
      
      // Reconectar ao lobby se necessário
      // O socket handler vai reconhecer o participante pelo nickname
    }

    return () => {
      if (socket) {
        socket.off('lobby_update')
        socket.off('start_allowed')
        socket.off('question_start')
        socket.off('kicked')
      }
    }
  }, [socket, participantData])

  const loadLobbyInfo = async () => {
    try {
      const response = await axios.get(`/lobby/${lobbyId}`)
      setLobby(response.data.lobby)
    } catch (error) {
      console.error('Erro ao carregar lobby:', error)
      toast.error('Erro ao carregar lobby')
    } finally {
      setLoading(false)
    }
  }

  const setupSocketListeners = () => {
    socket.on('lobby_update', (data) => {
      setParticipants(data.participants || [])
      setParticipantCount(data.count || 0)
    })

    socket.on('start_allowed', (data) => {
      setNeeded(data.needed || 0)
    })

    socket.on('question_start', () => {
      // Quiz iniciado, redirecionar para tela de jogo
      navigate(`/game/${lobbyId}/participant`)
    })

    socket.on('kicked', () => {
      localStorage.removeItem('participantData')
      toast.error('Você foi removido do lobby pelo administrador')
      navigate(`/join/${lobbyId}`)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!lobby || !participantData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar lobby</h1>
          <button
            onClick={() => navigate(`/join/${lobbyId}`)}
            className="btn-primary"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {lobby.quiz_title}
          </h1>
          
          <p className="text-lg text-gray-600 mb-4">
            Olá, <span className="font-semibold text-primary-600">{participantData.nickname}</span>!
          </p>
          
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            ⏳ Aguardando início do quiz...
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Status do Lobby</h2>
            
            <div className="space-y-6">
              {/* Contador de participantes */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary-600 mb-2">
                  {participantCount}
                </div>
                <p className="text-gray-600">
                  {participantCount === 1 ? 'participante' : 'participantes'} conectado{participantCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Progresso */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso para iniciar</span>
                  <span className="font-medium">
                    {Math.max(0, participantCount)}/5
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (participantCount / 5) * 100)}%` }}
                  ></div>
                </div>
                
                {needed > 0 && (
                  <p className="text-center text-sm text-gray-600">
                    Aguardando mais <span className="font-semibold text-primary-600">{needed}</span> participante{needed !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Status indicator */}
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Conectado ao lobby</span>
              </div>
            </div>
          </div>

          {/* Lista de participantes */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Participantes ({participantCount})
            </h2>
            
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando participantes...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {participants
                  .sort((a, b) => a.nickname.localeCompare(b.nickname))
                  .map((participant, index) => (
                  <div 
                    key={participant.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${
                      participant.id === participantData.participantId 
                        ? 'border-primary-300 bg-primary-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      participant.id === participantData.participantId
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {participant.nickname}
                        {participant.id === participantData.participantId && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
                            Você
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className={`w-2 h-2 rounded-full ${
                      participant.socketId ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="card mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Como Jogar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Aguarde o início</h3>
                  <p className="text-sm text-gray-600">O quiz começará automaticamente quando houver pelo menos 5 participantes.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Responda rapidamente</h3>
                  <p className="text-sm text-gray-600">Cada pergunta tem um tempo limite. Clique na resposta correta o mais rápido possível.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Acompanhe o ranking</h3>
                  <p className="text-sm text-gray-600">Veja sua posição no ranking após cada pergunta.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Dispute o pódio</h3>
                  <p className="text-sm text-gray-600">Tente chegar ao top 3 para aparecer no pódio final!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParticipantWaiting
