import { createContext } from 'react'
import type { ToastContextType } from './Toast.types'

export const ToastContext = createContext<ToastContextType | undefined>(undefined)
