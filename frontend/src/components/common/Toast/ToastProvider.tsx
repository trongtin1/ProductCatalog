import React, { useState, useCallback } from 'react'
import type { ToastMessage, ToastType } from './Toast.types'
import { ToastContext } from './ToastContext'
import './Toast.css'

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (type: ToastType, text: string, duration = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const newToast: ToastMessage = { id, type, text, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        window.setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback((text: string, duration?: number) => addToast('success', text, duration), [addToast])
  const error = useCallback((text: string, duration?: number) => addToast('error', text, duration), [addToast])
  const info = useCallback((text: string, duration?: number) => addToast('info', text, duration), [addToast])
  const warning = useCallback((text: string, duration?: number) => addToast('warning', text, duration), [addToast])

  const renderIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, warning }}
    >
      {children}
      <div className="custom-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`custom-toast-item ${toast.type}`}>
            <span className="custom-toast-icon">{renderIcon(toast.type)}</span>
            <div className="custom-toast-content">{toast.text}</div>
            <button
              className="custom-toast-close"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
