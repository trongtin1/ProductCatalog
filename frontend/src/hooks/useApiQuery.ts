import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'

import type { Result } from '../models/result'

export type FetchOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
  'queryKey' | 'queryFn'
>

export type MutationOptions<TData, TVariables, TError = Error> = Omit<
  UseMutationOptions<TData, TError, TVariables>,
  'mutationFn'
>

export interface PaginatedData<TItem> {
  items: TItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

function normalizeKey(key: string | readonly unknown[]): unknown[] {
  return typeof key === 'string' ? [key] : [...key]
}

export function useFetchData<
  TData,
  TParams = void,
  TResultData = TData,
>(
  queryKey: string | readonly unknown[],
  fetchFn: (params: TParams) => Promise<Result<TData>>,
  params?: TParams,
  options?: FetchOptions<TData, Error, TResultData>,
) {
  const normalizedKey = normalizeKey(queryKey)
  const fullKey: QueryKey =
    params !== undefined ? [...normalizedKey, params] : normalizedKey

  return useQuery({
    queryKey: fullKey,
    queryFn: async () => {
      const response = await fetchFn(params as TParams)

      if (!response.is_success || response.data === null) {
        throw new Error(response.message || 'Không thể tải dữ liệu')
      }

      return response.data
    },
    staleTime: 60_000,
    ...options,
  })
}

export function useFetchPaginatedData<
  TItem,
  TParams = void,
  TResultData = PaginatedData<TItem>,
>(
  queryKey: string | readonly unknown[],
  fetchFn: (params: TParams) => Promise<Result<PaginatedData<TItem>>>,
  params?: TParams,
  options?: FetchOptions<PaginatedData<TItem>, Error, TResultData>,
) {
  const normalizedKey = normalizeKey(queryKey)
  const fullKey: QueryKey =
    params !== undefined ? [...normalizedKey, params] : normalizedKey

  return useQuery({
    queryKey: fullKey,
    queryFn: async () => {
      const response = await fetchFn(params as TParams)

      if (!response.is_success || response.data === null) {
        throw new Error(
          response.message || 'Không thể tải danh sách dữ liệu',
        )
      }

      return response.data
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    ...options,
  })
}

export function useCreateData<TData, TVariables>(
  queryKey: string | readonly unknown[],
  createFn: (variables: TVariables) => Promise<Result<TData>>,
  options?: MutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient()
  const key = normalizeKey(queryKey)
  const { onSuccess, ...restOptions } = options || {}

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await createFn(variables)

      if (!response.is_success || response.data === null) {
        throw new Error(response.message || 'Không thể tạo dữ liệu')
      }

      return response.data
    },
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: key })
      await onSuccess?.(...args)
    },
    ...restOptions,
  })
}

export function useUpdateData<TData, TVariables>(
  queryKey: string | readonly unknown[],
  updateFn: (variables: TVariables) => Promise<Result<TData>>,
  options?: MutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient()
  const key = normalizeKey(queryKey)
  const { onSuccess, ...restOptions } = options || {}

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await updateFn(variables)

      if (!response.is_success || response.data === null) {
        throw new Error(response.message || 'Không thể cập nhật dữ liệu')
      }

      return response.data
    },
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: key })
      await onSuccess?.(...args)
    },
    ...restOptions,
  })
}

export function useDeleteData<TVariables = number, TData = unknown>(
  queryKey: string | readonly unknown[],
  deleteFn: (variables: TVariables) => Promise<Result<TData>>,
  options?: MutationOptions<TVariables, TVariables>,
) {
  const queryClient = useQueryClient()
  const key = normalizeKey(queryKey)
  const { onSuccess, ...restOptions } = options || {}

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await deleteFn(variables)

      if (!response.is_success) {
        throw new Error(response.message || 'Không thể xóa dữ liệu')
      }

      return variables
    },
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: key })
      await onSuccess?.(...args)
    },
    ...restOptions,
  })
}
