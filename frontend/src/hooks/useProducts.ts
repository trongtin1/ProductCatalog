import { useMemo } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { ProductService } from '../services/productApi'
import type {
  ProductQueryResource,
  ProductCreate,
  ProductUpdate,
} from '../models/product'

// Query keys dùng chung
export const productKeys = {
  all: ['products'] as const,

  lists: () => [...productKeys.all, 'list'] as const,

  list: (params: ProductQueryResource = {}) =>
    [...productKeys.lists(), params] as const,

  details: () => [...productKeys.all, 'detail'] as const,

  detail: (id: number) =>
    [...productKeys.details(), id] as const,
}

// Lấy danh sách sản phẩm có phân trang
export function useProducts(params: ProductQueryResource) {
  return useQuery({
    queryKey: productKeys.list(params),

    queryFn: async () => {
      const response = await ProductService.getAll(params)

      if (!response.is_success || response.data === null) {
        throw new Error(
          response.message || 'Không thể tải danh sách sản phẩm',
        )
      }

      return response.data
    },

    staleTime: 60_000,
  })
}

// Lấy chi tiết sản phẩm
export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),

    queryFn: async () => {
      const response = await ProductService.getById(id)

      if (!response.is_success || response.data === null) {
        throw new Error(
          response.message || 'Không tìm thấy sản phẩm',
        )
      }

      return response.data
    },

    enabled: Number.isInteger(id) && id > 0,
  })
}

// Tạo sản phẩm
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProductCreate) => {
      const response = await ProductService.create(data)

      if (!response.is_success || response.data === null) {
        throw new Error(
          response.message || 'Không thể tạo sản phẩm',
        )
      }

      return response.data
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      })
    },
  })
}

// Cập nhật sản phẩm
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: ProductUpdate
    }) => {
      const response = await ProductService.update(id, data)

      if (!response.is_success || response.data === null) {
        throw new Error(
          response.message || 'Không thể cập nhật sản phẩm',
        )
      }

      return response.data
    },

    onSuccess: async (product) => {
      queryClient.setQueryData(
        productKeys.detail(product.id),
        product,
      )

      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      })
    },
  })
}

// Xóa sản phẩm
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await ProductService.delete(id)

      if (!response.is_success) {
        throw new Error(
          response.message || 'Không thể xóa sản phẩm',
        )
      }

      return id
    },

    onSuccess: async (id) => {
      queryClient.removeQueries({
        queryKey: productKeys.detail(id),
      })

      await queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
      })
    },
  })
}
import { useBaseFilters } from './useBaseFilters'

export function useProductFilters() {
  const base = useBaseFilters()

  const categoryId = Number(base.searchParams.get('category_id')) || undefined
  const minPrice = base.searchParams.has('min_price')
    ? Number(base.searchParams.get('min_price'))
    : undefined
  const maxPrice = base.searchParams.has('max_price')
    ? Number(base.searchParams.get('max_price'))
    : undefined

  const query: ProductQueryResource = useMemo(
    () => ({
      ...base.filters.toQuery(),
      category_id: categoryId,
      min_price: minPrice,
      max_price: maxPrice,
    }),
    [base.filters, categoryId, minPrice, maxPrice]
  )

  return {
    ...base,
    categoryId,
    minPrice,
    maxPrice,
    query,
  }
}

