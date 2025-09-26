import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const TIME_OPTIONS = [15, 30, 45, 60]
const OPTION_IDS = ['A', 'B', 'C', 'D']

function QuizBuilder() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    questions: []
  })

  // Adicionar primeira pergunta automaticamente se não existir
  const ensureQuestionExists = () => {
    if (quiz.questions.length === 0) {
      addQuestion()
    }
  }

  const addQuestion = () => {
    if (quiz.questions.length >= 20) {
      toast.error('Máximo de 20 perguntas por quiz')
      return
    }

    const newQuestion = {
      id: Date.now(),
      text: '',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' }
      ],
      correctOptionId: 'A',
      timeLimitSeconds: 30
    }

    const newQuestions = [...quiz.questions, newQuestion]
    setQuiz({ ...quiz, questions: newQuestions })
    setCurrentQuestionIndex(newQuestions.length - 1)
  }

  const removeQuestion = (questionId) => {
    const newQuestions = quiz.questions.filter(q => q.id !== questionId)
    setQuiz({ ...quiz, questions: newQuestions })
    
    // Ajustar índice atual se necessário
    if (currentQuestionIndex >= newQuestions.length) {
      setCurrentQuestionIndex(Math.max(0, newQuestions.length - 1))
    }
  }

  const updateQuestion = (questionId, field, value) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    })
  }

  const addOption = (questionId) => {
    const question = quiz.questions.find(q => q.id === questionId)
    if (question.options.length >= 4) {
      toast.error('Máximo de 4 opções por pergunta')
      return
    }

    const nextOptionId = OPTION_IDS[question.options.length]
    const newOption = { id: nextOptionId, text: '' }

    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...q.options, newOption] }
          : q
      )
    })
  }

  const removeOption = (questionId, optionId) => {
    const question = quiz.questions.find(q => q.id === questionId)
    if (question.options.length <= 2) {
      toast.error('Mínimo de 2 opções por pergunta')
      return
    }

    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options.filter(opt => opt.id !== optionId),
              correctOptionId: q.correctOptionId === optionId ? q.options[0].id : q.correctOptionId
            }
          : q
      )
    })
  }

  const updateOption = (questionId, optionId, text) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => 
        q.id === questionId 
          ? {
              ...q,
              options: q.options.map(opt => 
                opt.id === optionId ? { ...opt, text } : opt
              )
            }
          : q
      )
    })
  }

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index)
  }

  const validateQuiz = () => {
    if (!quiz.title.trim()) {
      toast.error('Título do quiz é obrigatório')
      return false
    }

    if (quiz.questions.length === 0) {
      toast.error('Adicione pelo menos uma pergunta')
      return false
    }

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i]
      
      if (!question.text.trim()) {
        toast.error(`Pergunta ${i + 1}: Texto é obrigatório`)
        goToQuestion(i)
        return false
      }

      if (question.options.some(opt => !opt.text.trim())) {
        toast.error(`Pergunta ${i + 1}: Todas as opções devem ter texto`)
        goToQuestion(i)
        return false
      }

      const correctOption = question.options.find(opt => opt.id === question.correctOptionId)
      if (!correctOption) {
        toast.error(`Pergunta ${i + 1}: Selecione uma resposta correta`)
        goToQuestion(i)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateQuiz()) return

    setLoading(true)
    try {
      const response = await axios.post('/quiz/admin/quizzes', quiz)
      toast.success('Quiz criado com sucesso!')
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Erro ao criar quiz:', error)
      
      // Mostrar erro mais específico
      if (error.response) {
        // Erro do servidor (4xx, 5xx)
        const message = error.response.data?.error || `Erro ${error.response.status}: ${error.response.statusText}`
        toast.error(message)
      } else if (error.request) {
        // Erro de rede/conexão
        toast.error('Erro de conexão. Verifique se o servidor está rodando.')
      } else {
        // Outro tipo de erro
        toast.error('Erro inesperado ao criar quiz')
      }
    } finally {
      setLoading(false)
    }
  }

  // Garantir que existe pelo menos uma pergunta
  if (quiz.questions.length === 0) {
    ensureQuestionExists()
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header com botões destacados */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎯 Criar Quiz Interativo</h1>
            <p className="text-primary-100">Monte seu quiz com perguntas personalizadas</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200"
            >
              ← Cancelar
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações do Quiz */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            📝 Informações do Quiz
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Quiz *
              </label>
              <input
                type="text"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                className="input"
                placeholder="Ex: Quiz de Geografia do Brasil"
                maxLength="200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total de Perguntas
              </label>
              <div className="input bg-gray-50 flex items-center justify-between">
                <span className="font-semibold text-primary-600 text-lg">
                  {quiz.questions.length}
                </span>
                <span className="text-gray-500 text-sm">/ 20 máximo</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={quiz.description}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                className="input h-20"
                placeholder="Breve descrição sobre o quiz..."
                maxLength="500"
              />
            </div>
          </div>
        </div>

        {/* Navegação das Perguntas - Slider */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              ❓ Perguntas ({quiz.questions.length}/20)
            </h2>
            
            {/* Botão Adicionar Pergunta - SUPER DESTACADO */}
            <button
              type="button"
              onClick={addQuestion}
              disabled={quiz.questions.length >= 20}
              className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-200 ${
                quiz.questions.length >= 20 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 hover:shadow-xl'
              }`}
            >
              ➕ Nova Pergunta
            </button>
          </div>

          {/* Slider de Navegação */}
          {quiz.questions.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-2 px-4 pt-5">
                {quiz.questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => goToQuestion(index)}
                    className={`flex-shrink-0 w-14 h-14 rounded-full font-bold text-lg transition-all duration-200 ${
                      index === currentQuestionIndex
                        ? 'bg-primary-600 text-white shadow-lg scale-110'
                        : question.text.trim() 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              {/* Indicador de progresso */}
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${quiz.questions.length > 0 ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>Pergunta {currentQuestionIndex + 1}</span>
                <span>{quiz.questions.length} total</span>
              </div>
            </div>
          )}

          {/* Editor da Pergunta Atual */}
          {currentQuestion && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  📋 Pergunta {currentQuestionIndex + 1}
                </h3>
                
                <div className="flex items-center space-x-3">
                  {/* Remover pergunta */}
                  {quiz.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(currentQuestion.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors font-medium"
                      title="Remover pergunta"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Texto da pergunta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto da pergunta *
                  </label>
                  <textarea
                    value={currentQuestion.text}
                    onChange={(e) => updateQuestion(currentQuestion.id, 'text', e.target.value)}
                    className="input h-24 text-lg"
                    placeholder="Digite sua pergunta aqui..."
                    maxLength="500"
                    required
                  />
                </div>

                {/* Opções */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Opções de resposta
                    </label>
                    {currentQuestion.options.length < 4 && (
                      <button
                        type="button"
                        onClick={() => addOption(currentQuestion.id)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg font-medium"
                      >
                        + Opção
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option) => (
                      <div 
                        key={option.id} 
                        className={`p-4 border-2 rounded-lg transition-all ${
                          currentQuestion.correctOptionId === option.id
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                              <div className="flex items-center space-x-3 mb-3">
                          <input
                            type="radio"
                            name={`correct-${currentQuestion.id}`}
                            checked={currentQuestion.correctOptionId === option.id}
                            onChange={() => updateQuestion(currentQuestion.id, 'correctOptionId', option.id)}
                            className="w-5 h-5 text-green-600 focus:ring-green-500"
                          />
                          <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                            {option.id}
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {currentQuestion.correctOptionId === option.id ? '✅ Correta' : 'Opção'}
                          </span>
                          
                          {currentQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(currentQuestion.id, option.id)}
                              className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(currentQuestion.id, option.id, e.target.value)}
                          className="w-full input"
                          placeholder={`Texto da opção ${option.id}`}
                          maxLength="200"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tempo limite */}
                <div className="flex items-center space-x-4">
                  <label className="block text-sm font-medium text-gray-700">
                    ⏱️ Tempo limite:
                  </label>
                  <select
                    value={currentQuestion.timeLimitSeconds}
                    onChange={(e) => updateQuestion(currentQuestion.id, 'timeLimitSeconds', parseInt(e.target.value))}
                    className="input w-auto"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time} segundos</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Botão para adicionar primeira pergunta */}
          {quiz.questions.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Nenhuma pergunta ainda
              </h3>
              <p className="text-gray-500 mb-6">
                Comece criando sua primeira pergunta
              </p>
              <button
                type="button"
                onClick={addQuestion}
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                🚀 Criar Primeira Pergunta
              </button>
            </div>
          )}
        </div>

        {/* Botões de Ação - SUPER DESTACADOS */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all duration-200 min-w-48"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={loading || quiz.questions.length === 0}
              className={`px-12 py-4 rounded-xl font-bold text-xl shadow-xl transform transition-all duration-200 min-w-48 ${
                loading || quiz.questions.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              {loading ? '⏳ Criando...' : '🎯 Criar Quiz & Publicar'}
            </button>
          </div>
          
          {quiz.questions.length === 0 && (
            <p className="text-center text-red-500 text-sm mt-4">
              ⚠️ Adicione pelo menos uma pergunta para criar o quiz
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

export default QuizBuilder