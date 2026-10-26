import React from 'react'
import type { LoadingProps } from './Loading.types'
import './Loading.css'

export const Loading: React.FC<LoadingProps> = ({
  tip = 'Đang tải dữ liệu...',
  fullPage = false,
  size = 'md',
}) => {
  return (
    <div className={`custom-loading-container ${fullPage ? 'full-page' : ''}`}>
      <div className={`custom-spinner custom-spinner-${size}`} />
      {tip && <div className="custom-loading-tip">{tip}</div>}
    </div>
  )
}
