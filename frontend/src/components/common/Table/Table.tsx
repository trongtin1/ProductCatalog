import type { TableProps, ColumnType } from './Table.types'
import { TableFilterDropdown } from './TableFilterDropdown'
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
  onClearSort,
  onRowClick,
  className = '',
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    const val = (record as Record<string, unknown>)[rowKey as string]
    if (typeof val === 'string' || typeof val === 'number') {
      return val
    }
    return index
  }

  const handleHeaderClick = (col: ColumnType<T>) => {
    if (!col.sortable || !onSortChange) return
    const targetKey = col.sortKey || (col.dataIndex as string) || col.key
    if (sortColumn === targetKey) {
      onSortChange(targetKey, !isAscending)
    } else {
      onSortChange(targetKey, true)
    }
  }

  const handleDropdownSort = (columnKey: string, asc: boolean) => {
    if (onSortChange) {
      onSortChange(columnKey, asc)
    }
  }

  const handleClearSort = () => {
    if (onClearSort) {
      onClearSort()
    } else if (onSortChange) {
      // Default fallback: reset sort to id ascending
      onSortChange('id', true)
    }
  }

  return (
    <div className={`custom-table-wrapper ${className}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const targetKey = col.sortKey || (col.dataIndex as string) || col.key
              const isSorted = Boolean(col.sortable && sortColumn === targetKey)
              const showDropdown = col.showFilterDropdown !== false && col.sortable

              return (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => handleHeaderClick(col)}
                >
                  <div
                    className="custom-table-th-content"
                    style={{
                      justifyContent:
                        col.align === 'right'
                          ? 'flex-end'
                          : col.align === 'center'
                          ? 'center'
                          : 'space-between',
                    }}
                  >
                    <div className="custom-table-th-title">
                      <span>{col.title}</span>
                      {col.sortable && !showDropdown && (
                        <span className={`custom-table-sort-icon ${isSorted ? 'active' : ''}`}>
                          {isSorted ? (isAscending ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </div>

                    {showDropdown && (
                      <TableFilterDropdown
                        columnTitle={col.title}
                        columnKey={targetKey}
                        isSorted={isSorted}
                        isAscending={isAscending}
                        onSort={handleDropdownSort}
                        onClearSort={handleClearSort}
                      />
                    )}
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
            dataSource.map((record, index) => {
              const key = getRowKey(record, index)
              return (
                <tr
                  key={key}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  onClick={() => onRowClick && onRowClick(record)}
                >
                  {columns.map((col) => {
                    const value = col.dataIndex
                      ? (record as Record<string, unknown>)[col.dataIndex as string]
                      : undefined
                    return (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {col.render ? col.render(value, record, index) : (value as React.ReactNode)}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
