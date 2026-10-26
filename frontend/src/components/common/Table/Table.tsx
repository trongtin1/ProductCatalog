import type { TableProps, ColumnType } from './Table.types'
import { Loading } from '../Loading'
import './Table.css'

export function Table<T>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  emptyText = 'Không có dữ liệu',
  sortColumn,
  isAscending = true,
  onSortChange,
  onRowClick,
  className = '',
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(record)

    const value = (record as Record<string, unknown>)[rowKey as string]
    return typeof value === 'string' || typeof value === 'number' ? value : index
  }

  const handleHeaderClick = (column: ColumnType<T>) => {
    if (!column.sortable || !onSortChange) return

    const sortKey = column.sortKey || (column.dataIndex as string) || column.key
    onSortChange(sortKey, sortColumn === sortKey ? !isAscending : true)
  }

  return (
    <div className={`custom-table-wrapper ${className}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((column) => {
              const sortKey = column.sortKey || (column.dataIndex as string) || column.key
              const isSorted = Boolean(column.sortable && sortColumn === sortKey)

              return (
                <th
                  key={column.key}
                  style={{ width: column.width, textAlign: column.align || 'left' }}
                  className={column.sortable ? 'sortable' : ''}
                  onClick={() => handleHeaderClick(column)}
                >
                  <div
                    className="custom-table-th-content"
                    style={{
                      justifyContent:
                        column.align === 'right'
                          ? 'flex-end'
                          : column.align === 'center'
                            ? 'center'
                            : 'space-between',
                    }}
                  >
                    <span className="custom-table-th-title">
                      {column.title}
                      {column.sortable && (
                        <span className={`custom-table-sort-icon ${isSorted ? 'active' : ''}`}>
                          {isSorted ? (isAscending ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="custom-table-loading-overlay">
                  <Loading tip="Đang tải dữ liệu..." />
                </div>
              </td>
            </tr>
          ) : dataSource.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="custom-table-empty">{emptyText}</div>
              </td>
            </tr>
          ) : (
            dataSource.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                onClick={() => onRowClick?.(record)}
              >
                {columns.map((column) => {
                  const value = column.dataIndex
                    ? (record as Record<string, unknown>)[column.dataIndex as string]
                    : undefined

                  return (
                    <td key={column.key} style={{ textAlign: column.align || 'left' }}>
                      {column.render ? column.render(value, record, index) : (value as React.ReactNode)}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
