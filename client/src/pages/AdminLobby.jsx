import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import QRCodeModal from '../components/QRCodeModal'

function AdminLobby() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { socket, authenticateAdmin, startQuiz, kickParticipant, connect } = useSocket()
  
  const [lobby, setLobby] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [startAllowed, setStartAllowed] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [needed, setNeeded] = useState(2)
  const [showQRModal, setShowQRModal] = useState(false)
  const [joinLink, setJoinLink] = useState('')

  useEffect(() => {
    initializeLobby()
  }, [quizId])

  useEffect(() => {
    if (socket && lobby) {
      setupSocketListeners()
      
      // Conectar e autenticar
      connect()
      const token = localStorage.getItem('adminToken')
      console.log('🔐 Tentando autenticar admin no lobby:', lobby.lobbyId)
      authenticateAdmin(token, lobby.lobbyId)
    }

    return () => {
      if (socket) {
        socket.off('admin_authenticated')
        socket.off('lobby_update')
        socket.off('start_allowed')
        socket.off('question_start')
      }
    }
  }, [socket, lobby])

  const initializeLobby = async () => {
    try {
      // Primeiro tentar publicar o quiz (se ainda não foi)
      const publishResponse = await axios.post(`/quiz/${quizId}/publish`)
      const { lobbyId, joinLink: link } = publishResponse.data
      
      setJoinLink(link)
      
      // Buscar dados do lobby e quiz
      console.log(`📡 Buscando dados do lobby: ${lobbyId}`);
      const [lobbyResponse, quizResponse] = await Promise.all([
        axios.get(`/lobby/${lobbyId}`),
        axios.get(`/lobby/${lobbyId}/quiz`)
      ])
      
      console.log('📊 Lobby Response:', lobbyResponse.data);
      console.log('📋 Quiz Response:', quizResponse.data);

      const lobbyData = lobbyResponse.data.lobby;
      // Normalizar o nome do campo lobbyId
      if (lobbyData.lobby_id && !lobbyData.lobbyId) {
        lobbyData.lobbyId = lobbyData.lobby_id;
      }
      
      setLobby(lobbyData)
      setQuiz(quizResponse.data.quiz)
      
    } catch (error) {
      console.error('Erro ao inicializar lobby:', error)
      toast.error('Erro ao carregar lobby')
      navigate('/admin/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const setupSocketListeners = () => {
    socket.on('admin_authenticated', (data) => {
      console.log('🔐 Admin autenticado:', data)
    })

    socket.on('lobby_update', (data) => {
      console.log('📊 Atualização do lobby recebida:', data)
      setParticipants(data.participants || [])
      setParticipantCount(data.count || 0)
    })

    socket.on('start_allowed', (data) => {
      console.log('🚦 Start allowed recebido:', data)
      setStartAllowed(data.allowed)
      setNeeded(data.needed || 0)
    })

    socket.on('question_start', (data) => {
      console.log('🎯 Pergunta iniciada, redirecionando para AdminGame:', data)
      // Quiz iniciado, redirecionar para tela de admin do jogo
      navigate(`/admin/game/${lobby.lobbyId}/admin`)
    })
  }

  const handleStartQuiz = () => {
    if (!startAllowed) {
      toast.error(`Necessário pelo menos 2 participantes (faltam ${needed})`)
      return
    }
    
    startQuiz(lobby.lobbyId)
  }

  const handleKickParticipant = (participantId) => {
    if (window.confirm('Tem certeza que deseja remover este participante?')) {
      kickParticipant(lobby.lobbyId, participantId)
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!lobby || !quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Lobby não encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-600 mt-1">Gerenciar Lobby • ID: {lobby.lobbyId}</p>
        </div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="btn-secondary"
        >
          Voltar ao Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel de Controle */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status do Lobby</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Participantes:</span>
                <span className="font-semibold text-2xl text-primary-600">
                  {participantCount}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Necessário:</span>
                <span className="font-semibold text-lg">
                  {startAllowed ? '✅ Pronto' : `${needed} mais`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Perguntas:</span>
                <span className="font-semibold">{quiz.questions?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowQRModal(true)}
                className="btn-secondary w-full"
              >
                📱 Mostrar QR Code
              </button>
              
              <button
                onClick={handleStartQuiz}
                disabled={!startAllowed}
                className={`w-full ${startAllowed ? 'btn-success' : 'btn-disabled'}`}
              >
                {startAllowed ? '🚀 Iniciar Quiz' : `⏳ Aguardando ${needed} participantes`}
              </button>
            </div>

            {!startAllowed && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  💡 Compartilhe o link ou QR Code para que os participantes entrem no lobby.
                  Mínimo de 2 participantes necessário.
                </p>
              </div>
            )}
          </div>

          {/* Link de Acesso */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Link de Acesso</h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border text-sm font-mono break-all">
                {window.location.origin}{joinLink}
              </div>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${joinLink}`)
                  toast.success('Link copiado!')
                }}
                className="btn-secondary w-full text-sm"
              >
                📋 Copiar Link
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Participantes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Participantes ({participantCount})
              </h2>
              <div className="text-sm text-gray-500">
                Atualizando em tempo real
              </div>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum participante ainda
                </h3>
                <p className="text-gray-600">
                  Compartilhe o link ou QR Code para que as pessoas entrem no lobby
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div 
                    key={participant.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {participant.nickname}
                        </p>
                        <p className="text-sm text-gray-500">
                          Entrou às {formatTime(participant.joinedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${participant.socketId ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-500">
                          {participant.socketId ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleKickParticipant(participant.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        joinLink={joinLink}
        quizTitle={quiz.title}
      />
    </div>
  )
}

export default AdminLobby
