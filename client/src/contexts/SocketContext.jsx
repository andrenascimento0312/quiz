import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { SOCKET_URL } from '../config/api'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Criar conexão WebSocket
    console.log('🔌 Conectando WebSocket em:', SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false
    })

    // Event listeners
    newSocket.on('connect', () => {
      console.log('🔌 Conectado ao servidor WebSocket')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Desconectado do servidor WebSocket')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error)
      toast.error('Erro de conexão com o servidor')
    })

    // Eventos de erro globais
    newSocket.on('error', (data) => {
      toast.error(data.message || 'Erro no servidor')
    })

    newSocket.on('auth_error', (data) => {
      toast.error(data.message || 'Erro de autenticação')
    })

    newSocket.on('join_error', (data) => {
      toast.error(data.message || 'Erro ao entrar no lobby')
    })

    newSocket.on('kicked', (data) => {
      toast.error(data.message || 'Você foi removido do lobby')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const connect = () => {
    if (socket && !connected) {
      socket.connect()
    }
  }

  const disconnect = () => {
    if (socket && connected) {
      socket.disconnect()
    }
  }

  // Função para autenticar admin
  const authenticateAdmin = (token, lobbyId) => {
    if (socket) {
      console.log('📤 Enviando admin_auth:', { token: token ? 'presente' : 'ausente', lobbyId })
      socket.emit('admin_auth', { token, lobbyId })
    }
  }

  // Função para participante entrar no lobby
  const joinLobby = (lobbyId, nickname) => {
    if (socket) {
      socket.emit('join_lobby', { lobbyId, nickname })
    }
  }

  // Função para admin iniciar quiz
  const startQuiz = (lobbyId) => {
    if (socket) {
      socket.emit('start_quiz', { lobbyId })
    }
  }

  // Função para submeter resposta
  const submitAnswer = (lobbyId, questionId, optionId) => {
    if (socket) {
      socket.emit('submit_answer', { lobbyId, questionId, optionId })
    }
  }

  // Função para remover participante
  const kickParticipant = (lobbyId, participantId) => {
    if (socket) {
      socket.emit('kick_participant', { lobbyId, participantId })
    }
  }

  const value = {
    socket,
    connected,
    connect,
    disconnect,
    authenticateAdmin,
    joinLobby,
    startQuiz,
    submitAnswer,
    kickParticipant
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de SocketProvider')
  }
  return context
}
