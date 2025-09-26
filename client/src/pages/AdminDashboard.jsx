import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'

function AdminDashboard() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, quiz: null })

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      const response = await axios.get('/quiz/admin/quizzes')
      setQuizzes(response.data.quizzes)
    } catch (error) {
      console.error('Erro ao carregar quizzes:', error)
      toast.error('Erro ao carregar quizzes')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (quiz) => {
    setDeleteModal({ isOpen: true, quiz })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, quiz: null })
  }

  const handleDeleteQuiz = async () => {
    if (!deleteModal.quiz) return

    try {
      await axios.delete(`/quiz/admin/quizzes/${deleteModal.quiz.id}`)
      toast.success('Quiz excluído com sucesso!')
      loadQuizzes() // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir quiz:', error)
      toast.error('Erro ao excluir quiz')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusBadge = (quiz) => {
    if (quiz.lobby_status === 'running') {
      return <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">🎮 Em andamento</span>
    }
    if (quiz.lobby_status === 'waiting') {
      return <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">⏳ Aguardando</span>
    }
    if (quiz.published) {
      return <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">✅ Publicado</span>
    }
    return <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">📝 Rascunho</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Gerencie seus quizzes e lobbies</p>
        </div>
        <Link
          to="/admin/quiz/new"
          className="btn-primary flex items-center space-x-2 text-lg px-6 py-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Criar Quiz</span>
        </Link>
      </div>

      {/* Stats - Ocultando "Aguardando" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{quizzes.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Publicados</p>
              <p className="text-2xl font-bold text-gray-900">
                {quizzes.filter(q => q.published).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">
                {quizzes.filter(q => q.lobby_status === 'running').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quizzes List - Grid 2 Colunas */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Meus Quizzes</h2>
        
        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum quiz criado</h3>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro quiz interativo</p>
            <Link to="/admin/quiz/new" className="btn-primary">
              Criar Primeiro Quiz
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
                <div className="flex flex-col h-full">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {quiz.title}
                      </h3>
                      {getStatusBadge(quiz)}
                    </div>
                  </div>
                  
                  {/* Descrição */}
                  {quiz.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}
                  
                  {/* Informações */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{quiz.question_count} pergunta{quiz.question_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDate(quiz.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      {/* Botão Editar */}
                      <Link
                        to={`/admin/quiz/${quiz.id}/edit`}
                        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar quiz"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </Link>
                      
                      {/* Botão Excluir */}
                      <button
                        onClick={() => openDeleteModal(quiz)}
                        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir quiz"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Excluir</span>
                      </button>
                    </div>
                    
                    {/* Botão Principal */}
                    <div>
                      {quiz.lobby_id ? (
                        <Link
                          to={`/admin/quiz/${quiz.id}/lobby`}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          {quiz.lobby_status === 'running' ? '🎮 Ver Jogo' : '🚀 Gerenciar Lobby'}
                        </Link>
                      ) : (
                        <Link
                          to={`/admin/quiz/${quiz.id}/lobby`}
                          className="btn-secondary text-sm px-4 py-2"
                        >
                          📤 Publicar
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteQuiz}
        title="Excluir Quiz"
        message={
          deleteModal.quiz 
            ? `Tem certeza que deseja excluir o quiz "${deleteModal.quiz.title}"?\n\nEsta ação não pode ser desfeita e removerá todas as perguntas, lobbies e respostas associadas.`
            : ''
        }
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}

export default AdminDashboard