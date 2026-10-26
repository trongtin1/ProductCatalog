export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  text: string
  duration?: number
}

export interface ToastContextType {
  toasts: ToastMessage[]
  addToast: (type: ToastType, text: string, duration?: number) => void
  removeToast: (id: string) => void
  success: (text: string, duration?: number) => void
  error: (text: string, duration?: number) => void
  info: (text: string, duration?: number) => void
  warning: (text: string, duration?: number) => void
}
