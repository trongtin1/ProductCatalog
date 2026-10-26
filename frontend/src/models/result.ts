// Tương đương base.py → Result, QueryResource

export interface Result<T> {
  status_code: number
  is_success: boolean
  message: string
  data: T | null
}

export interface QueryResource {
  sort_column_by?: string
  is_sort_column_ascending?: boolean
  page?: number
  page_size?: number         // default: 10, ge=1, le=100
  search_term?: string
}
