import React from 'react'

export interface ConfirmModalProps {
  isOpen: boolean
  title?: React.ReactNode
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'primary'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}
