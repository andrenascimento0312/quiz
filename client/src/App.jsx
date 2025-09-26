import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Pages
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import QuizBuilder from './pages/QuizBuilder'
import QuizEditor from './pages/QuizEditor'
import AdminLobby from './pages/AdminLobby'
import JoinLobby from './pages/JoinLobby'
import ParticipantWaiting from './pages/ParticipantWaiting'
import ParticipantGame from './pages/ParticipantGame'
import AdminGame from './pages/AdminGame'
import Results from './pages/Results'

// Layout
import Layout from './components/Layout'

function App() {
  const { admin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/join/:lobbyId" element={<JoinLobby />} />
      <Route path="/lobby/:lobbyId/waiting" element={<ParticipantWaiting />} />
      <Route path="/game/:lobbyId/participant" element={<ParticipantGame />} />
      <Route path="/results/:lobbyId" element={<Results />} />

      {/* Rotas de admin */}
      <Route path="/admin/login" element={
        admin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />
      } />
      
      <Route path="/admin/forgot-password" element={
        admin ? <Navigate to="/admin/dashboard" replace /> : <ForgotPassword />
      } />
      
      <Route path="/admin/reset-password" element={
        admin ? <Navigate to="/admin/dashboard" replace /> : <ResetPassword />
      } />
      
      <Route path="/admin/*" element={
        admin ? (
          <Layout>
            <Routes>
              <Route path="/dashboard" element={
                admin.role === 'superadmin' ? <SuperAdminDashboard /> : <AdminDashboard />
              } />
              <Route path="/profile" element={<Profile />} />
              <Route path="/quiz/new" element={
                admin.role === 'admin' ? <QuizBuilder /> : <Navigate to="/admin/dashboard" replace />
              } />
              <Route path="/quiz/:quizId/edit" element={
                admin.role === 'admin' ? <QuizEditor /> : <Navigate to="/admin/dashboard" replace />
              } />
              <Route path="/quiz/:quizId/lobby" element={
                admin.role === 'admin' ? <AdminLobby /> : <Navigate to="/admin/dashboard" replace />
              } />
              <Route path="/game/:lobbyId/admin" element={
                admin.role === 'admin' ? <AdminGame /> : <Navigate to="/admin/dashboard" replace />
              } />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </Layout>
        ) : (
          <Navigate to="/admin/login" replace />
        )
      } />

      {/* Rota raiz */}
      <Route path="/" element={
        <Navigate to={admin ? "/admin/dashboard" : "/admin/login"} replace />
      } />
      
      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600 mb-8">Página não encontrada</p>
            <a href="/" className="btn-primary">
              Voltar ao início
            </a>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App
