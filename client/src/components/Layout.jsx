import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

function Layout({ children }) {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/admin/dashboard" className="text-xl font-bold text-gray-900 hover:text-primary-600">
                Quiz Tempo Real
              </Link>
              
              {/* Navigation */}
              <nav className="flex items-center space-x-6">
                <Link
                  to="/admin/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/admin/dashboard') 
                      ? 'text-primary-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {admin?.role === 'superadmin' ? '🛡️ Painel' : '📊 Dashboard'}
                </Link>
                
                {admin?.role === 'admin' && (
                  <Link
                    to="/admin/quiz/new"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/admin/quiz/new') 
                        ? 'text-primary-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ➕ Novo Quiz
                  </Link>
                )}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User info with avatar */}
              <div className="flex items-center space-x-3">
                {admin?.avatar ? (
                  <img src={admin.avatar} alt={admin.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {admin?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                  <p className="text-xs text-gray-500">
                    {admin?.role === 'superadmin' ? 'Super Admin' : 'Administrador'}
                  </p>
                </div>
              </div>
              
              {/* Dropdown menu */}
              <div className="relative group">
                <button className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Dropdown content */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      to="/admin/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      👤 Meu Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🚪 Sair
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
