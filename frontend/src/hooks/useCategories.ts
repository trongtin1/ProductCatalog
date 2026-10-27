import { useFetchPaginatedData } from './useApiQuery'
import { CategoryService } from '../services/categoryApi'
import type { Category, CategoryQueryResource } from '../models/category'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => ['categories', 'list'] as const,
  list: (params: CategoryQueryResource = {}) =>
    ['categories', 'list', params] as const,
}

export function useCategories(params: CategoryQueryResource = {}) {
  return useFetchPaginatedData<Category, CategoryQueryResource, Category[]>(
    categoryKeys.lists(),
    CategoryService.getAll,
    {
      page_size: 100,
      ...params,
    },
    {
      staleTime: 5 * 60 * 1000,
      select: (data) => data.items,
    },
  )
}
