import { forwardRef } from 'react'
import type { SelectProps } from './Select.types'
import './Select.css'

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="custom-select-group">
        {label && <label className="custom-select-label">{label}</label>}
        <select
          ref={ref}
          className={`custom-select ${error ? 'has-error' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="custom-select-error">{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
