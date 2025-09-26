import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

function Results() {
  const { lobbyId } = useParams()
  const navigate = useNavigate()
  
  const [lobby, setLobby] = useState(null)
  const [ranking, setRanking] = useState([])
  const [participantData, setParticipantData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tentar recuperar dados do participante (se existir)
    const savedData = localStorage.getItem('participantData')
    if (savedData) {
      const data = JSON.parse(savedData)
      if (data.lobbyId === lobbyId) {
        setParticipantData(data)
      }
    }

    loadResults()
  }, [lobbyId])

  const loadResults = async () => {
    try {
      const response = await axios.get(`/lobby/${lobbyId}`)
      setLobby(response.data.lobby)
      
      // Tentar buscar ranking do localStorage (dados do quiz)
      const storedRanking = localStorage.getItem(`ranking_${lobbyId}`)
      if (storedRanking) {
        const parsedRanking = JSON.parse(storedRanking)
        console.log('📊 Ranking carregado do localStorage:', parsedRanking)
        setRanking(parsedRanking)
      } else {
        console.log('⚠️ Nenhum ranking encontrado no localStorage')
        setRanking([])
      }
      
    } catch (error) {
      console.error('Erro ao carregar resultados:', error)
      toast.error('Erro ao carregar resultados')
    } finally {
      setLoading(false)
    }
  }

  const getPodiumEmoji = (position) => {
    switch (position) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return ''
    }
  }

  const getPodiumClass = (position) => {
    switch (position) {
      case 1: return 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-yellow-900'
      case 2: return 'bg-gradient-to-b from-gray-300 to-gray-400 text-gray-900'
      case 3: return 'bg-gradient-to-b from-orange-300 to-orange-400 text-orange-900'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const myPosition = participantData 
    ? ranking.find(p => p.id === participantData.participantId)?.position 
    : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5h5.5l1 5 1-5H16l-2 11H5zm7-9a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎉 Resultados Finais
          </h1>
          
          {lobby && (
            <p className="text-xl text-gray-600 mb-4">
              {lobby.quiz_title}
            </p>
          )}

          {participantData && myPosition && (
            <div className="inline-flex items-center px-6 py-3 bg-white border-2 border-primary-200 rounded-full">
              <span className="text-lg font-semibold text-gray-900">
                {participantData.nickname}, você ficou em 
                <span className="text-primary-600 mx-2 text-xl">
                  {myPosition}° lugar!
                </span>
                {getPodiumEmoji(myPosition)}
              </span>
            </div>
          )}
        </div>

        {/* Pódio */}
        {ranking.length >= 3 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              🏆 Pódio dos Campeões
            </h2>
            
            <div className="flex items-end justify-center space-x-4 mb-8">
              {/* 2º lugar */}
              <div className="text-center">
                <div className="w-24 h-32 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg flex flex-col items-center justify-end pb-4 mb-4">
                  <span className="text-4xl mb-2">🥈</span>
                  <span className="text-white font-bold">2°</span>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <p className="font-bold text-gray-900">{ranking[1]?.nickname}</p>
                  <p className="text-gray-600">{ranking[1]?.score} pontos</p>
                </div>
              </div>

              {/* 1º lugar */}
              <div className="text-center">
                <div className="w-32 h-40 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-lg flex flex-col items-center justify-end pb-4 mb-4">
                  <span className="text-5xl mb-2">🥇</span>
                  <span className="text-yellow-900 font-bold text-lg">1°</span>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-xl border-2 border-yellow-400">
                  <p className="font-bold text-gray-900 text-lg">{ranking[0]?.nickname}</p>
                  <p className="text-gray-600 font-semibold">{ranking[0]?.score} pontos</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      👑 Campeão
                    </span>
                  </div>
                </div>
              </div>

              {/* 3º lugar */}
              <div className="text-center">
                <div className="w-24 h-28 bg-gradient-to-b from-orange-300 to-orange-400 rounded-t-lg flex flex-col items-center justify-end pb-4 mb-4">
                  <span className="text-4xl mb-2">🥉</span>
                  <span className="text-orange-900 font-bold">3°</span>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <p className="font-bold text-gray-900">{ranking[2]?.nickname}</p>
                  <p className="text-gray-600">{ranking[2]?.score} pontos</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking Completo */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📊 Classificação Geral
          </h2>
          
          <div className="space-y-3">
            {ranking.map((participant, index) => (
              <div 
                key={participant.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  participantData && participant.id === participantData.participantId
                    ? 'border-primary-300 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getPodiumClass(participant.position)}`}>
                    {participant.position <= 3 ? getPodiumEmoji(participant.position) : participant.position}
                  </div>
                  
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {participant.nickname}
                      {participantData && participant.id === participantData.participantId && (
                        <span className="ml-3 text-xs bg-primary-600 text-white px-3 py-1 rounded-full">
                          Você
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {participant.position}° lugar
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {participant.score}
                  </p>
                  <p className="text-sm text-gray-500">pontos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {ranking.length}
            </div>
            <p className="text-gray-600">Participantes</p>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {ranking[0]?.score || 0}
            </div>
            <p className="text-gray-600">Melhor Pontuação</p>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {ranking.length > 0 ? Math.round(ranking.reduce((acc, p) => acc + p.score, 0) / ranking.length) : 0}
            </div>
            <p className="text-gray-600">Média de Pontos</p>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-8 text-center space-y-4">
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary"
            >
              🏠 Página Inicial
            </button>
            
            <button
              onClick={() => navigate(`/join/${lobbyId}`)}
              className="btn-secondary"
            >
              🔄 Jogar Novamente
            </button>
          </div>
          
          <p className="text-sm text-gray-500">
            💡 Obrigado por participar! Compartilhe com seus amigos.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Results
