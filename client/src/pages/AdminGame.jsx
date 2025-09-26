import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import Timer from '../components/Timer'
import toast from 'react-hot-toast'

function AdminGame() {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  const { socket, authenticateAdmin, connect } = useSocket()
  
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [questionResult, setQuestionResult] = useState(null)
  const [ranking, setRanking] = useState([])
  const [participants, setParticipants] = useState([])
  const [answeredCount, setAnsweredCount] = useState(0)

  useEffect(() => {
    if (socket) {
      setupSocketListeners()
      connect()
      
      // Autenticar admin
      const token = localStorage.getItem('adminToken')
      authenticateAdmin(token, lobbyId)
    }

    return () => {
      if (socket) {
        socket.off('admin_authenticated')
        socket.off('question_start')
        socket.off('question_end')
        socket.off('score_update')
        socket.off('final_results')
        socket.off('lobby_update')
      }
    }
  }, [socket, lobbyId])

  const setupSocketListeners = () => {
    socket.on('admin_authenticated', (data) => {
      console.log('Admin autenticado no jogo:', data)
    })

    socket.on('question_start', (data) => {
      console.log('Nova pergunta iniciada:', data)
      setCurrentQuestion(data)
      setShowResults(false)
      setQuestionResult(null)
      setAnsweredCount(0)
    })

    socket.on('question_end', (data) => {
      console.log('Pergunta finalizada:', data)
      setQuestionResult(data)
      setShowResults(true)
    })

    socket.on('score_update', (data) => {
      console.log('Ranking atualizado:', data)
      setRanking(data.ranking)
    })

    socket.on('final_results', (data) => {
      console.log('Resultados finais:', data)
      navigate(`/results/${lobbyId}`)
    })

    socket.on('lobby_update', (data) => {
      setParticipants(data.participants || [])
      
      // Contar quantos já responderam (simulação baseada no socket)
      // Em uma implementação real, você receberia essa informação do servidor
    })
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inicializando quiz...</h2>
          <p className="text-gray-600">Preparando primeira pergunta</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-left">
              <p className="text-sm text-gray-600">Modo</p>
              <p className="font-semibold text-primary-600">👨‍💼 Administrador</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Pergunta</p>
              <p className="font-semibold text-gray-900 text-xl">
                {currentQuestion.questionIndex} de {currentQuestion.totalQuestions}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Participantes</p>
              <p className="font-semibold text-primary-600">{participants.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Timer e Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">Timer</h3>
              <div className="flex justify-center">
                <Timer
                  startedAt={currentQuestion.startedAt}
                  timeLimitSeconds={currentQuestion.timeLimitSeconds}
                />
              </div>
            </div>

            {/* Status das respostas */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{participants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Responderam:</span>
                  <span className="font-semibold text-green-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aguardando:</span>
                  <span className="font-semibold text-yellow-600">
                    {participants.length - answeredCount}
                  </span>
                </div>
                
                {/* Barra de progresso */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progresso</span>
                    <span>{participants.length > 0 ? Math.round((answeredCount / participants.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${participants.length > 0 ? (answeredCount / participants.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pergunta e Opções */}
          <div className="lg:col-span-3 space-y-6">
            {/* Pergunta */}
            <div className="card">
              <h1 className="text-3xl font-bold text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </h1>
            </div>

            {/* Opções */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => {
                let cardClass = 'card border-2 transition-all duration-300'
                
                if (showResults && questionResult) {
                  if (option.id === questionResult.correctOptionId) {
                    cardClass += ' border-green-500 bg-green-50'
                  } else {
                    cardClass += ' border-gray-300 bg-gray-50 opacity-75'
                  }
                } else {
                  cardClass += ' border-gray-300 hover:border-primary-300 hover:shadow-md'
                }

                return (
                  <div key={option.id} className={cardClass}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        showResults && questionResult && option.id === questionResult.correctOptionId
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {option.id}
                      </div>
                      <span className="text-xl font-medium">{option.text}</span>
                      
                      {/* Ícone de resposta correta */}
                      {showResults && questionResult && option.id === questionResult.correctOptionId && (
                        <span className="ml-auto text-green-600 text-2xl">✅</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Resultados da pergunta */}
        {showResults && questionResult && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Participantes que acertaram */}
            <div className="card">
              <h2 className="text-xl font-semibold text-green-600 mb-4">
                ✅ Acertaram ({questionResult.correctParticipants.length})
              </h2>
              
              {questionResult.correctParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum participante acertou esta pergunta</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {questionResult.correctParticipants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{participant.nickname}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ranking atual */}
            <div className="card">
              <h2 className="text-xl font-semibold text-primary-600 mb-4">
                🏆 Ranking Atual
              </h2>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {ranking.slice(0, 10).map((participant, index) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                        index < 3 
                          ? 'bg-yellow-400 text-yellow-900' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{participant.nickname}</span>
                    </div>
                    <span className="font-bold text-primary-600 text-lg">
                      {participant.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controles do Admin */}
        <div className="mt-8 card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Controles do Administrador</h3>
              <p className="text-sm text-gray-600">
                O quiz avança automaticamente. Aguarde o término de todas as perguntas.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="btn-secondary"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminGame
