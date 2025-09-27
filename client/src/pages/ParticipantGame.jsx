import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import Timer from '../components/Timer'
import toast from 'react-hot-toast'

function ParticipantGame() {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  const { socket, submitAnswer, connect } = useSocket()
  
  const [participantData, setParticipantData] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [questionResult, setQuestionResult] = useState(null)
  const [ranking, setRanking] = useState([])
  const [myPosition, setMyPosition] = useState(null)

  useEffect(() => {
    // Verificar dados do participante
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
  }, [lobbyId, navigate])

  useEffect(() => {
    if (socket && participantData) {
      console.log('🔌 ParticipantGame: Conectando socket para participante:', participantData)
      setupSocketListeners()
      connect()
      
      // IMPORTANTE: Reconectar ao lobby quando chegar na página do jogo
      console.log('🔄 ParticipantGame: Reconectando ao lobby...')
      // CORREÇÃO DEFINITIVA: Enviar join_lobby IMEDIATAMENTE
      console.log('📡 ParticipantGame: Enviando join_lobby...')
      console.log('🔍 DEBUG: Socket conectado antes do join:', socket.connected)
      console.log('🔍 DEBUG: Socket ID antes do join:', socket.id)
      socket.emit('join_lobby', { 
        lobbyId: participantData.lobbyId, 
        nickname: participantData.nickname 
      })
      
      // Verificar se entrou no room após 1 segundo
      setTimeout(() => {
        console.log('🔍 DEBUG: Socket conectado após join:', socket.connected)
        console.log('🔍 DEBUG: Socket ID após join:', socket.id)
        console.log('🔍 DEBUG: Rooms do socket:', socket.rooms)
        
        // FORÇAR entrada no room se não estiver
        if (!socket.rooms || !socket.rooms.has(participantData.lobbyId)) {
          console.log('🚨 CORREÇÃO: Forçando entrada no room')
          socket.emit('join_lobby', { 
            lobbyId: participantData.lobbyId, 
            nickname: participantData.nickname 
          })
        }
      }, 1000)
    }

    return () => {
      if (socket) {
        socket.off('question_start')
        socket.off('timer_started')
        socket.off('question_end')
        socket.off('score_update')
        socket.off('final_results')
        socket.off('answer_submitted')
        socket.off('join_success')
      }
    }
  }, [socket, participantData])

  const setupSocketListeners = () => {
    console.log('🔧 ParticipantGame: Configurando listeners do socket')
    
    socket.on('question_start', (data) => {
      console.log('🎯 ParticipantGame: Nova pergunta recebida!', data)
      console.log('🔍 DEBUG: Socket ID:', socket.id)
      console.log('🔍 DEBUG: Lobby ID:', participantData.lobbyId)
      console.log('🔍 DEBUG: Socket conectado:', socket.connected)
      console.log('🔍 DEBUG: Rooms do socket:', socket.rooms)
      setCurrentQuestion(data)
      setSelectedOption(null)
      setHasAnswered(false)
      setShowResults(false)
      setQuestionResult(null)
      
      console.log('✅ ParticipantGame: Pergunta configurada no estado!')
    })

    socket.on('timer_started', (data) => {
      console.log('⏰ Timer oficial iniciado:', data)
      // Aqui você pode sincronizar o timer visual se tiver um
    })

    socket.on('join_success', (data) => {
      console.log('✅ ParticipantGame: Join success recebido:', data)
      console.log('🔍 DEBUG: Socket conectado após join_success:', socket.connected)
      console.log('🔍 DEBUG: Socket ID após join_success:', socket.id)
    })

    socket.on('question_end', (data) => {
      console.log('Fim da pergunta:', data)
      setQuestionResult(data)
      setShowResults(true)
    })

    socket.on('score_update', (data) => {
      console.log('Atualização do ranking:', data)
      setRanking(data.ranking)
      
      // Encontrar posição do participante atual
      const position = data.ranking.findIndex(p => p.id === participantData.participantId) + 1
      setMyPosition(position)
    })

    socket.on('final_results', (data) => {
      console.log('Resultados finais:', data)
      
      // Salvar ranking no localStorage para a página de resultados
      if (data.ranking) {
        localStorage.setItem(`ranking_${lobbyId}`, JSON.stringify(data.ranking))
        console.log('💾 Ranking salvo no localStorage:', data.ranking)
      }
      
      navigate(`/results/${lobbyId}`)
    })

    socket.on('answer_submitted', (data) => {
      console.log('Resposta enviada:', data)
      setHasAnswered(true)
      
      if (data.correct) {
        toast.success('Resposta correta! ✅')
      } else {
        toast.error('Resposta incorreta ❌')
      }
    })
  }

  const handleOptionClick = (optionId) => {
    if (hasAnswered || !currentQuestion) return
    
    setSelectedOption(optionId)
    submitAnswer(lobbyId, currentQuestion.questionId, optionId)
  }

  const handleTimeUp = () => {
    if (!hasAnswered) {
      toast.error('Tempo esgotado! ⏰')
      setHasAnswered(true)
    }
  }

  if (!participantData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // CORREÇÃO DEFINITIVA: NUNCA mostrar loading - sempre mostrar interface
  // Se não tem pergunta, mostrar interface vazia mas funcional
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <p className="text-sm text-gray-600">Participante</p>
                <p className="font-semibold text-primary-600">{participantData.nickname}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Lobby</p>
                <p className="font-semibold text-primary-600">{lobbyId}</p>
              </div>
            </div>
          </div>

          {/* Interface vazia mas funcional */}
          <div className="text-center">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Aguardando pergunta...</h2>
              <p className="text-gray-600">O quiz será iniciado em breve</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-left">
              <p className="text-sm text-gray-600">Participante</p>
              <p className="font-semibold text-primary-600">{participantData.nickname}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Pergunta</p>
              <p className="font-semibold text-gray-900">
                {currentQuestion.questionIndex} de {currentQuestion.totalQuestions}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Posição</p>
              <p className="font-semibold text-primary-600">
                {myPosition ? `${myPosition}°` : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer */}
          <div className="lg:col-span-1 flex justify-center">
            <Timer
              startedAt={currentQuestion.startedAt}
              timeLimitSeconds={currentQuestion.timeLimitSeconds}
              onTimeUp={handleTimeUp}
            />
          </div>

          {/* Pergunta e Opções */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pergunta */}
            <div className="card">
              <h1 className="text-2xl font-bold text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </h1>
            </div>

            {/* Opções */}
            <div className="space-y-4">
              {currentQuestion.options.map((option) => {
                let buttonClass = 'option-button'
                
                if (showResults && questionResult) {
                  if (option.id === questionResult.correctOptionId) {
                    buttonClass += ' option-correct'
                  } else if (option.id === selectedOption) {
                    buttonClass += ' option-incorrect'
                  }
                } else if (selectedOption === option.id) {
                  buttonClass += ' option-selected'
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    disabled={hasAnswered}
                    className={`${buttonClass} ${hasAnswered ? 'cursor-not-allowed opacity-75' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        {option.id}
                      </div>
                      <span className="text-lg">{option.text}</span>
                      
                      {/* Ícones de resultado */}
                      {showResults && questionResult && (
                        <>
                          {option.id === questionResult.correctOptionId && (
                            <span className="ml-auto text-green-600 text-xl">✅</span>
                          )}
                          {option.id === selectedOption && option.id !== questionResult.correctOptionId && (
                            <span className="ml-auto text-red-600 text-xl">❌</span>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Status */}
            <div className="text-center">
              {hasAnswered && !showResults && (
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  ✓ Resposta enviada! Aguardando outros participantes...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resultados da pergunta */}
        {showResults && questionResult && (
          <div className="mt-8 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resultado da Pergunta
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Participantes que acertaram */}
              <div>
                <h3 className="font-medium text-green-600 mb-3">
                  ✅ Acertaram ({questionResult.correctParticipants.length})
                </h3>
                {questionResult.correctParticipants.length === 0 ? (
                  <p className="text-gray-500 text-sm">Ninguém acertou esta pergunta</p>
                ) : (
                  <div className="space-y-2">
                    {questionResult.correctParticipants.map((participant, index) => (
                      <div 
                        key={participant.id}
                        className={`flex items-center space-x-3 p-2 rounded ${
                          participant.id === participantData.participantId
                            ? 'bg-green-100 border border-green-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}.
                        </span>
                        <span className="font-medium">
                          {participant.nickname}
                          {participant.id === participantData.participantId && (
                            <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                              Você
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ranking atual */}
              <div>
                <h3 className="font-medium text-primary-600 mb-3">
                  🏆 Ranking Atual (Top 5)
                </h3>
                <div className="space-y-2">
                  {ranking.slice(0, 5).map((participant, index) => (
                    <div 
                      key={participant.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        participant.id === participantData.participantId
                          ? 'bg-primary-100 border border-primary-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-gray-600 w-6">
                          {index + 1}°
                        </span>
                        <span className="font-medium">
                          {participant.nickname}
                          {participant.id === participantData.participantId && (
                            <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-1 rounded-full">
                              Você
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="font-bold text-primary-600">
                        {participant.score} pts
                      </span>
                    </div>
                  ))}
                </div>
                
                {myPosition && myPosition > 5 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      Sua posição atual: <span className="font-bold">{myPosition}°</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ParticipantGame
