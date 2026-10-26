import { forwardRef } from 'react'
import type { InputProps } from './Input.types'
import './Input.css'

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="custom-input-group">
        {label && <label className="custom-input-label">{label}</label>}
        <div className="custom-input-wrapper">
          {leftIcon && <span className="custom-input-icon-left">{leftIcon}</span>}
          <input
            ref={ref}
            className={`custom-input ${leftIcon ? 'custom-input-has-left' : ''} ${
              rightIcon ? 'custom-input-has-right' : ''
            } ${error ? 'has-error' : ''} ${className}`}
            {...props}
          />
          {rightIcon && <span className="custom-input-icon-right">{rightIcon}</span>}
        </div>
        {error && <span className="custom-input-error">{error}</span>}
        {!error && helperText && <span className="custom-input-helper">{helperText}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
