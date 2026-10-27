import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { QueryResource } from '../models/result'

export class BaseFilter {
  page: number
  pageSize: number
  search: string
  sortBy: string
  order: 'asc' | 'desc'

  constructor(searchParams: URLSearchParams) {
    this.page = Math.max(1, Number(searchParams.get('page')) || 1)
    this.pageSize = Number(searchParams.get('page_size')) || 10
    this.search = searchParams.get('search') || ''
    this.sortBy = searchParams.get('sort_by') || 'id'
    this.order = searchParams.get('order')?.toLowerCase() === 'desc' ? 'desc' : 'asc'
  }

  toQuery(): QueryResource {
    return {
      page: this.page,
      page_size: this.pageSize,
      search: this.search || undefined,
      sort_by: this.sortBy,
      order: this.order,
    }
  }
}

export function useBaseFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => new BaseFilter(searchParams), [searchParams])

  const updateFilters = useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const next = new URLSearchParams(searchParams)
      let hasChanges = false

      Object.entries(updates).forEach(([key, value]) => {
        const currentVal = next.get(key)
        if (value === undefined || value === null || value === '') {
          if (next.has(key)) {
            next.delete(key)
            hasChanges = true
          }
        } else {
          const strVal = String(value)
          if (currentVal !== strVal) {
            next.set(key, strVal)
            hasChanges = true
          }
        }
      })

      if (hasChanges) {
        setSearchParams(next)
      }
    },
    [searchParams, setSearchParams]
  )

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  const onPageChange = useCallback(
    (page: number) => updateFilters({ page }),
    [updateFilters]
  )

  const onPageSizeChange = useCallback(
    (pageSize: number) => updateFilters({ page_size: pageSize, page: 1 }),
    [updateFilters]
  )

  const onSearchChange = useCallback(
    (search: string) => {
      const newSearch = search || ''
      const currentSearch = searchParams.get('search') || ''
      if (newSearch === currentSearch) return
      updateFilters({ search: newSearch || undefined, page: 1 })
    },
    [searchParams, updateFilters]
  )

  const onSortChange = useCallback(
    (column: string, isAscending: boolean) => {
      updateFilters({
        sort_by: column,
        order: isAscending ? 'asc' : 'desc',
        page: 1,
      })
    },
    [updateFilters]
  )

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
