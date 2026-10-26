import { useSearchParams } from 'react-router-dom'
import type { QueryResource } from '../models/result'

export class BaseFilter {
  cursor?: string
  pageSize: number
  search: string
  sortColumnBy: string
  ascending: boolean

  constructor(searchParams: URLSearchParams) {
    this.cursor = searchParams.get('cursor') || undefined
    this.pageSize = Number(searchParams.get('page_size')) || 10
    this.search = searchParams.get('search') || ''
    this.sortColumnBy = searchParams.get('sort_column_by') || 'id'
    this.ascending = searchParams.get('is_sort_column_ascending') !== 'false'
  }

  toQuery(): QueryResource {
    return {
      cursor: this.cursor,
      page_size: this.pageSize,
      search_term: this.search || undefined,
      sort_column_by: this.sortColumnBy,
      is_sort_column_ascending: this.ascending,
    }
  }
}

export function useBaseFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = new BaseFilter(searchParams)

  const updateFilters = (updates: Record<string, string | number | undefined | null>) => {
    const next = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    })

    setSearchParams(next)
  }

  const resetFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const onCursorChange = (cursor?: string) => {
    updateFilters({ cursor })
  }

  const onPageSizeChange = (nextPageSize: number) => {
    updateFilters({ page_size: nextPageSize, cursor: undefined })
  }

  const onSearchChange = (nextSearch: string) => {
    updateFilters({ search: nextSearch || undefined, cursor: undefined })
  }

  const onSortChange = (column: string, isAscending: boolean) => {
    updateFilters({
      sort_column_by: column,
      is_sort_column_ascending: String(isAscending),
      cursor: undefined,
    })
  }

  return {
    searchParams,
    filters,
    ...filters,
    updateFilters,
    resetFilters,
    onCursorChange,
    onPageSizeChange,
    onSearchChange,
    onSortChange,
  }
}
