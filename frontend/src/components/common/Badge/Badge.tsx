import React from 'react'
import type { BadgeProps } from './Badge.types'
import './Badge.css'

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  className = '',
  children,
  ...props
}) => {
  return (
    <span className={`custom-badge custom-badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  )
}
