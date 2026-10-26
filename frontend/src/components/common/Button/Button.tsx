import React from 'react'
import type { ButtonProps } from './Button.types'
import './Button.css'

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`custom-btn custom-btn-${variant} custom-btn-${size} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="custom-btn-spinner" />}
      {!isLoading && icon && <span className="custom-btn-icon">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
