import React from 'react'
import type { CardProps } from './Card.types'
import './Card.css'

export const Card: React.FC<CardProps> = ({
  title,
  extra,
  footer,
  noPadding = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`custom-card ${className}`} {...props}>
      {(title || extra) && (
        <div className="custom-card-header">
          <div className="custom-card-title">{title}</div>
          {extra && <div className="custom-card-extra">{extra}</div>}
        </div>
      )}
      <div className={`custom-card-body ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
      {footer && <div className="custom-card-footer">{footer}</div>}
    </div>
  )
}
