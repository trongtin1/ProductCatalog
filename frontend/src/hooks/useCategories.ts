
import { useQuery } from '@tanstack/react-query'
import { CategoryService } from '../services/categoryApi'
import type { CategoryQueryResource } from '../models/category'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => ['categories', 'list'] as const,
  list: (params: CategoryQueryResource = {}) =>
    ['categories', 'list', params] as const,
}

export function useCategories(params: CategoryQueryResource = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),

    queryFn: async () => {
      const response = await CategoryService.getAll({
        page_size: 100,
        ...params,
      })

      if (!response.is_success || response.data === null) {
        throw new Error(response.message || 'Không thể tải danh mục')
      }

      return response.data.items
    },

    staleTime: 5 * 60 * 1000,
  })
}
