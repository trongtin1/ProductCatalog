// Tương đương base.py → Result, QueryResource

export interface Result<T> {
  status_code: number
  is_success: boolean
  message: string
  data: T | null
}

export interface QueryResource {
  page?: number
  page_size?: number
  search?: string
  sort_by?: string
  order?: 'asc' | 'desc'
}
