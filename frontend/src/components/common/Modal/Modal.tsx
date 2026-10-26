import React, { useEffect } from 'react'
import type { ModalProps } from './Modal.types'
import './Modal.css'

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = 540,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div
        className={`custom-modal-container ${className}`}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-modal-header">
          <div className="custom-modal-title">{title}</div>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        <div className="custom-modal-body">{children}</div>
        {footer && <div className="custom-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
