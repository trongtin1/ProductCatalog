import React from 'react'
import type { PaginationProps } from './Pagination.types'
import './Pagination.css'

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
  // Generate smart page list: 1, ... current-1, current, current+1 ... totalPages
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const pageNumbers = getPageNumbers()
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div className={`custom-pagination ${className}`}>
      <div className="custom-pagination-info">
        Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> trong tổng số{' '}
        <strong>{total}</strong> sản phẩm
      </div>

      <div className="custom-pagination-controls">
        {onPageSizeChange && (
          <select
            className="custom-pagination-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Chọn số sản phẩm mỗi trang"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
        )}

        {/* Nút Trước */}
        <button
          className="custom-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Trang trước"
        >
          &larr; Trước
        </button>

        {/* Danh sách số trang */}
        {pageNumbers.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="custom-pagination-ellipsis">
                ...
              </span>
            )
          }
          return (
            <button
              key={`page-${p}`}
              className={`custom-pagination-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(Number(p))}
            >
              {p}
            </button>
          )
        })}

        {/* Nút Sau */}
        <button
          className="custom-pagination-btn"
          disabled={page >= totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          aria-label="Trang sau"
        >
          Sau &rarr;
        </button>
      </div>
    </div>
  )
}
