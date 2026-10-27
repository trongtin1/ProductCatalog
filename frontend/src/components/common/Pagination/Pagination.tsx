import React from 'react'
import type { PaginationProps } from './Pagination.types'
import './Pagination.css'

const getPageItems = (currentPage: number, totalPages: number): (number | string)[] => {
  if (totalPages <= 0) return []
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: (number | string)[] = []
  const leftSiblingIndex = Math.max(currentPage - 1, 1)
  const rightSiblingIndex = Math.min(currentPage + 1, totalPages)

  const shouldShowLeftDots = leftSiblingIndex > 2
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2

  if (!shouldShowLeftDots && shouldShowRightDots) {
    for (let i = 1; i <= 5; i++) {
      items.push(i)
    }
    items.push('ellipsis-right')
    items.push(totalPages)
  } else if (shouldShowLeftDots && !shouldShowRightDots) {
    items.push(1)
    items.push('ellipsis-left')
    for (let i = totalPages - 4; i <= totalPages; i++) {
      items.push(i)
    }
  } else {
    items.push(1)
    items.push('ellipsis-left')
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      items.push(i)
    }
    items.push('ellipsis-right')
    items.push(totalPages)
  }

  return items
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  totalPages,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  className = '',
}) => {
  const pageItems = getPageItems(page, totalPages)

  return (
    <div className={`custom-pagination ${className}`}>
      <div className="custom-pagination-info">
        Tổng cộng <strong>{total}</strong> sản phẩm
      </div>
      <div className="custom-pagination-controls">
        {onPageSizeChange && (
          <select
            className="custom-pagination-size-select"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label="Chọn số sản phẩm mỗi trang"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / trang
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="custom-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Trước
        </button>
        {pageItems.map((item) => {
          if (typeof item === 'string') {
            return (
              <span key={item} className="custom-pagination-ellipsis">
                …
              </span>
            )
          }

          return (
            <button
              type="button"
              key={item}
              className={`custom-pagination-btn ${item === page ? 'active' : ''}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        })}
        <button
          type="button"
          className="custom-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau →
        </button>
      </div>
    </div>
  )
}
