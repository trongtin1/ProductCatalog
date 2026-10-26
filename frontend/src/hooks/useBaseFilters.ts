import { useSearchParams } from 'react-router-dom'
import type { QueryResource } from '../models/result'

export class BaseFilter {
  page: number
  pageSize: number
  search: string
  sortColumnBy: string
  ascending: boolean

  constructor(searchParams: URLSearchParams) {
    this.page = Math.max(1, Number(searchParams.get('page')) || 1)
    this.pageSize = Number(searchParams.get('page_size')) || 10
    this.search = searchParams.get('search') || ''
    this.sortColumnBy = searchParams.get('sort_column_by') || 'id'
    this.ascending = searchParams.get('is_sort_column_ascending') !== 'false'
  }

  toQuery(): QueryResource {
    return {
      page: this.page,
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
      if (value === undefined || value === null || value === '') next.delete(key)
      else next.set(key, String(value))
    })
    setSearchParams(next)
  }

  const resetFilters = () => setSearchParams(new URLSearchParams())
  const onPageChange = (page: number) => updateFilters({ page })
  const onPageSizeChange = (pageSize: number) => updateFilters({ page_size: pageSize, page: 1 })
  const onSearchChange = (search: string) => updateFilters({ search: search || undefined, page: 1 })
  const onSortChange = (column: string, isAscending: boolean) => {
    updateFilters({
      sort_column_by: column,
      is_sort_column_ascending: String(isAscending),
      page: 1,
    })
  }

  return {
    searchParams,
    filters,
    ...filters,
    updateFilters,
    resetFilters,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onSortChange,
  }
}
