import { QRCodeSVG } from 'qrcode.react'

function QRCodeModal({ isOpen, onClose, joinLink, quizTitle }) {
  if (!isOpen) return null

  const fullUrl = `${window.location.origin}${joinLink}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      // Você pode adicionar um toast aqui se quiser
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Link do Quiz
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">{quizTitle}</h3>
            <p className="text-sm text-gray-600">
              Escaneie o QR Code ou compartilhe o link
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <QRCodeSVG 
                value={fullUrl}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Link */}
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm font-mono text-gray-700 break-all">
                {fullUrl}
              </p>
            </div>
            
            <button
              onClick={copyToClipboard}
              className="btn-primary w-full"
            >
              📋 Copiar Link
            </button>
          </div>

          <div className="text-xs text-gray-500">
            💡 Os participantes devem acessar este link para entrar no lobby
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeModal
