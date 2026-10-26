import React, { useEffect, useState } from 'react'
import type { SearchInputProps } from './SearchInput.types'
import { useDebounce } from '../../../hooks/useDebounce'
import './SearchInput.css'

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChangeText,
  placeholder = 'Tìm kiếm sản phẩm...',
  delay = 500,
  className = '',
  disabled = false,
}) => {
  const [text, setText] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  // Adjust state during render when prop changes (React recommended pattern)
  if (value !== prevValue) {
    setPrevValue(value)
    setText(value)
  }

  const debouncedText = useDebounce(text, delay)

  useEffect(() => {
    if (onChangeText) {
      onChangeText(debouncedText)
    }
  }, [debouncedText, onChangeText])

  return (
    <div className={`custom-search-input ${className}`}>
      <span className="custom-search-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="text"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
      />
      {text && !disabled && (
        <button
          type="button"
          className="custom-search-clear"
          onClick={() => {
            setText('')
            if (onChangeText) onChangeText('')
          }}
          title="Xóa tìm kiếm"
        >
          ×
        </button>
      )}
    </div>
  )
}
