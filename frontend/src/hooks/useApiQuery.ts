
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'

import type { Result } from '../models/result'

type ApiResult<T> = Result<T>

type FetchOptions<TData, TError = Error> = Omit<
  UseQueryOptions<TData, TError, TData, QueryKey>,
  'queryKey' | 'queryFn'
>

type MutationOptions<TData, TVariables, TError = Error> = Omit<
  UseMutationOptions<TData, TError, TVariables>,
  'mutationFn'
>

function normalizeKey(key: string | readonly unknown[]): QueryKey {
  return typeof key === 'string' ? [key] : [...key]
}

export function useFetchData<TData, TParams = void>(
  queryKey: string | readonly unknown[],
  fetchFn: (params: TParams) => Promise<ApiResult<TData>>,
  params: TParams,
  options?: FetchOptions<ApiResult<TData>>,
) {
  return useQuery({
    queryKey: [...normalizeKey(queryKey), params],
    queryFn: () => fetchFn(params),
    staleTime: 60_000,
    ...options,
  })
}

export function useFetchPaginatedData<TItem, TParams = void>(
  queryKey: string | readonly unknown[],
  fetchFn: (params: TParams) => Promise<ApiResult<{
    items: TItem[]
    page_size: number
    next_cursor: string | null
    has_more: boolean
  }>>,
  params: TParams,
  options?: FetchOptions<ApiResult<{
    items: TItem[]
    page_size: number
    next_cursor: string | null
    has_more: boolean
  }>>,
) {
  return useQuery({
    queryKey: [...normalizeKey(queryKey), params],
    queryFn: () => fetchFn(params),
    staleTime: 60_000,
    ...options,
  })
}

export function useCreateData<TData, TVariables>(
  queryKey: string | readonly unknown[],
  createFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient()
  const key = normalizeKey(queryKey)

  return useMutation({
    mutationFn: createFn,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: key })
      await options?.onSuccess?.(...args)
    },
    ...options,
  })
}

export function useUpdateData<TData, TVariables>(
  queryKey: string | readonly unknown[],
  updateFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient()
  const key = normalizeKey(queryKey)

  return useMutation({
    mutationFn: updateFn,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: key })
      await options?.onSuccess?.(...args)
    },
    ...options,
  })
}

export function useDeleteData<TData, TVariables>(
  queryKey: string | readonly unknown[],
  deleteFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient()
  const key = normalizeKey(queryKey)

  return useMutation({
    mutationFn: deleteFn,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: key })
      await options?.onSuccess?.(...args)
    },
    ...options,
  })
}
