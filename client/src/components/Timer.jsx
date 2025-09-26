import { useState, useEffect } from 'react'

function Timer({ startedAt, timeLimitSeconds, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!startedAt) return

    const startTime = new Date(startedAt).getTime()
    const endTime = startTime + (timeLimitSeconds * 1000)
    
    setIsActive(true)

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
      
      setTimeLeft(remaining)
      
      if (remaining <= 0) {
        setIsActive(false)
        clearInterval(interval)
        if (onTimeUp) {
          onTimeUp()
        }
      }
    }, 100) // Atualizar a cada 100ms para suavidade

    return () => clearInterval(interval)
  }, [startedAt, timeLimitSeconds, onTimeUp])

  const getTimerClass = () => {
    if (!isActive) return 'timer-circle'
    
    const percentage = (timeLeft / timeLimitSeconds) * 100
    
    if (percentage <= 20) return 'timer-circle timer-danger'
    if (percentage <= 50) return 'timer-circle timer-warning'
    return 'timer-circle'
  }

  const getProgressColor = () => {
    const percentage = (timeLeft / timeLimitSeconds) * 100
    
    if (percentage <= 20) return '#ef4444' // red-500
    if (percentage <= 50) return '#f59e0b' // amber-500
    return '#22c55e' // green-500
  }

  const circumference = 2 * Math.PI * 36 // raio do círculo = 36
  const progress = ((timeLimitSeconds - timeLeft) / timeLimitSeconds) * circumference

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Timer circular com SVG */}
      <div className="relative">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80">
          {/* Círculo de fundo */}
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="#e5e7eb"
            strokeWidth="4"
            fill="none"
          />
          {/* Círculo de progresso */}
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke={getProgressColor()}
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        
        {/* Número no centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${
            timeLeft <= 5 ? 'text-red-600 animate-pulse' : 
            timeLeft <= 10 ? 'text-yellow-600' : 'text-gray-700'
          }`}>
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">
          {isActive ? 'Tempo restante' : 'Tempo esgotado!'}
        </p>
        {timeLeft <= 10 && timeLeft > 0 && (
          <p className="text-xs text-red-600 font-medium animate-pulse">
            ⚡ Responda rapidamente!
          </p>
        )}
      </div>
    </div>
  )
}

export default Timer
