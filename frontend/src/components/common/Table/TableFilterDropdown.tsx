import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface TableFilterDropdownProps {
  columnTitle: React.ReactNode
  columnKey: string
  isSorted: boolean
  isAscending: boolean
  onSort: (columnKey: string, isAscending: boolean) => void
  onClearSort?: (columnKey: string) => void
}

export const TableFilterDropdown: React.FC<TableFilterDropdownProps> = ({
  columnTitle,
  columnKey,
  isSorted,
  isAscending,
  onSort,
  onClearSort,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  const updateMenuPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    const menuWidth = 200
    setMenuPosition({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
    })
  }

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      updateMenuPosition()
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      window.addEventListener('resize', updateMenuPosition)
      window.addEventListener('scroll', updateMenuPosition, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen])

  const handleSelectAsc = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSort(columnKey, true)
    setIsOpen(false)
  }

  const handleSelectDesc = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSort(columnKey, false)
    setIsOpen(false)
  }

  const handleSelectClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClearSort) {
      onClearSort(columnKey)
    }
    setIsOpen(false)
  }

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div className="table-filter-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`table-filter-trigger ${isSorted ? 'active' : ''}`}
        ref={triggerRef}
        onClick={toggleDropdown}
        title={`Tùy chọn sắp xếp / lọc cho ${typeof columnTitle === 'string' ? columnTitle : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isSorted ? (
          <span className="table-filter-active-icon">
            {isAscending ? '▲' : '▼'}
          </span>
        ) : (
          <svg
            className="table-filter-icon"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="table-filter-menu"
          role="menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <div className="table-filter-menu-header">
            {columnTitle}
          </div>

          <button
            type="button"
            className={`table-filter-menu-item ${isSorted && isAscending ? 'selected' : ''}`}
            onClick={handleSelectAsc}
          >
            <span className="table-filter-menu-icon">↑</span>
            <span>Sắp xếp tăng dần</span>
            {isSorted && isAscending && <span className="table-filter-checkmark">✓</span>}
          </button>

          <button
            type="button"
            className={`table-filter-menu-item ${isSorted && !isAscending ? 'selected' : ''}`}
            onClick={handleSelectDesc}
          >
            <span className="table-filter-menu-icon">↓</span>
            <span>Sắp xếp giảm dần</span>
            {isSorted && !isAscending && <span className="table-filter-checkmark">✓</span>}
          </button>

          {isSorted && (
            <>
              <div className="table-filter-divider" />
              <button
                type="button"
                className="table-filter-menu-item text-muted"
                onClick={handleSelectClear}
              >
                <span className="table-filter-menu-icon">✕</span>
                <span>Bỏ sắp xếp cột này</span>
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
