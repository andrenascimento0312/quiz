import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const TIME_OPTIONS = [15, 30, 45, 60]
const OPTION_IDS = ['A', 'B', 'C', 'D']

function QuizBuilder() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    questions: []
  })

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

    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion]
    })
  }

  const removeQuestion = (questionId) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter(q => q.id !== questionId)
    })
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
        return false
      }

      if (question.options.some(opt => !opt.text.trim())) {
        toast.error(`Pergunta ${i + 1}: Todas as opções devem ter texto`)
        return false
      }

      const correctOption = question.options.find(opt => opt.id === question.correctOptionId)
      if (!correctOption) {
        toast.error(`Pergunta ${i + 1}: Selecione uma resposta correta`)
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
      toast.error(error.response?.data?.error || 'Erro ao criar quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Quiz</h1>
          <p className="text-gray-600 mt-1">Monte seu quiz interativo</p>
        </div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="btn-secondary"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Quiz Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Quiz</h2>
          
          <div className="space-y-4">
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

        {/* Questions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Perguntas ({quiz.questions.length}/20)
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              disabled={quiz.questions.length >= 20}
              className={quiz.questions.length >= 20 ? 'btn-disabled' : 'btn-primary'}
            >
              Adicionar Pergunta
            </button>
          </div>

          {quiz.questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">Nenhuma pergunta adicionada ainda</p>
            </div>
          ) : (
            <div className="space-y-6">
              {quiz.questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Pergunta {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto da pergunta *
                      </label>
                      <textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                        className="input h-20"
                        placeholder="Digite sua pergunta aqui..."
                        maxLength="500"
                        required
                      />
                    </div>

                    {/* Options */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Opções de resposta
                        </label>
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          disabled={question.options.length >= 4}
                          className={`text-sm ${question.options.length >= 4 ? 'text-gray-400' : 'text-primary-600 hover:text-primary-700'}`}
                        >
                          + Adicionar opção
                        </button>
                      </div>

                      <div className="space-y-3">
                        {question.options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctOptionId === option.id}
                                onChange={() => updateQuestion(question.id, 'correctOptionId', option.id)}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                              />
                              <label className="ml-2 text-sm font-medium text-gray-700">
                                {option.id}
                              </label>
                            </div>
                            
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                              className="flex-1 input"
                              placeholder={`Opção ${option.id}`}
                              maxLength="200"
                              required
                            />
                            
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(question.id, option.id)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Time Limit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo limite (segundos)
                      </label>
                      <select
                        value={question.timeLimitSeconds}
                        onChange={(e) => updateQuestion(question.id, 'timeLimitSeconds', parseInt(e.target.value))}
                        className="input w-auto"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}s</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || quiz.questions.length === 0}
            className={loading || quiz.questions.length === 0 ? 'btn-disabled' : 'btn-primary'}
          >
            {loading ? 'Salvando...' : 'Criar Quiz'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuizBuilder
