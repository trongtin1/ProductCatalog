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
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

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
            {pageSizeOptions.map((option) => <option key={option} value={option}>{option} / trang</option>)}
          </select>
        )}
        <button className="custom-pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ← Trước
        </button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`custom-pagination-btn ${pageNumber === page ? 'active' : ''}`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button className="custom-pagination-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Sau →
        </button>
      </div>
    </div>
  )
}
