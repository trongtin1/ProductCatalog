import React from 'react'
import type { PaginationProps } from './Pagination.types'
import './Pagination.css'

export const Pagination: React.FC<PaginationProps> = ({
  itemCount,
  pageSize,
  hasMore,
  pageSizeOptions = [10, 20, 50, 100],
  onNext,
  onReset,
  onPageSizeChange,
  className = '',
}) => (
  <div className={`custom-pagination ${className}`}>
    <div className="custom-pagination-info">
      Hiển thị <strong>{itemCount}</strong> sản phẩm trong lượt xem này
    </div>

    <div className="custom-pagination-controls">
      {onPageSizeChange && (
        <select
          className="custom-pagination-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Chọn số sản phẩm mỗi lượt xem"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option} / lượt
            </option>
          ))}
        </select>
      )}

      {onReset && (
        <button className="custom-pagination-btn" onClick={onReset}>
          Về đầu
        </button>
      )}

      <button
        className="custom-pagination-btn"
        disabled={!hasMore}
        onClick={onNext}
      >
        Trang sau →
      </button>
    </div>
  </div>
)
