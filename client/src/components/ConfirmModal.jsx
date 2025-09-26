import { useState, useEffect } from 'react'

function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar ação", 
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger" // danger, warning, info
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        }
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        }
      default:
        return {
          icon: '❓',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          confirmButton: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
        }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <div 
      className={`fixed inset-0 z-50 transition-all duration-200 ${
        isOpen ? 'bg-black bg-opacity-50 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-full p-4">
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Ícone */}
          <div className="flex items-center justify-center mb-6">
            <div className={`w-16 h-16 rounded-full ${typeStyles.iconBg} flex items-center justify-center`}>
              <span className="text-3xl">{typeStyles.icon}</span>
            </div>
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
            {title}
          </h3>

          {/* Mensagem */}
          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            {message}
          </p>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-6 py-3 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${typeStyles.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
