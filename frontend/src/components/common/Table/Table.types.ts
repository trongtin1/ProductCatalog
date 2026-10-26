import type React from 'react'

export interface ColumnType<T> {
  key: string
  title: React.ReactNode
  dataIndex?: keyof T
  render?: (value: unknown, record: T, index: number) => React.ReactNode
  sortable?: boolean
  sortKey?: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  showFilterDropdown?: boolean
}

export interface TableProps<T> {
  columns: ColumnType<T>[]
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string | number)
  loading?: boolean
  emptyText?: React.ReactNode
  sortColumn?: string
  isAscending?: boolean
  onSortChange?: (sortColumn: string, isAscending: boolean) => void
  onClearSort?: () => void
  onRowClick?: (record: T) => void
  className?: string
}
