import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useFetchData,
  useFetchPaginatedData,
  useCreateData,
  useUpdateData,
  useDeleteData,
} from './useApiQuery'
import { ProductService } from '../services/productApi'
import type {
  Product,
  ProductQueryResource,
  ProductCreate,
  ProductUpdate,
} from '../models/product'
import { useBaseFilters } from './useBaseFilters'

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
  return useFetchPaginatedData<Product, ProductQueryResource>(
    productKeys.lists(),
    ProductService.getAll,
    params,
    {
      staleTime: 60_000,
    },
  )
}

// Lấy chi tiết sản phẩm
export function useProduct(id: number) {
  return useFetchData<Product, number>(
    productKeys.details(),
    ProductService.getById,
    id,
    {
      enabled: Number.isInteger(id) && id > 0,
    },
  )
}

// Tạo sản phẩm
export function useCreateProduct() {
  return useCreateData<Product, ProductCreate>(
    productKeys.lists(),
    ProductService.create,
  )
}

// Cập nhật sản phẩm
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useUpdateData<
    Product,
    { id: number; data: ProductUpdate }
  >(
    productKeys.lists(),
    ({ id, data }) => ProductService.update(id, data),
    {
      onSuccess: (product) => {
        queryClient.setQueryData(
          productKeys.detail(product.id),
          product,
        )
      },
    },
  )
}

// Xóa sản phẩm
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useDeleteData<number, null>(
    productKeys.lists(),
    (id: number) => ProductService.delete(id),
    {
      onSuccess: (id) => {
        queryClient.removeQueries({
          queryKey: productKeys.detail(id),
        })
      },
    },
  )
}

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
    [base.filters, categoryId, minPrice, maxPrice],
  )

  return {
    ...base,
    categoryId,
    minPrice,
    maxPrice,
    query,
  }
}
