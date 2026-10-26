// Tương đương schemas/category.py

import type { QueryResource } from './result'

// CategoryBase
export interface CategoryBase {
  name: string
  description: string | null
}

// CategoryCreate(CategoryBase)
export type CategoryCreate = CategoryBase

// CategoryUpdate
export interface CategoryUpdate {
  name?: string
  description?: string | null
}

// CategoryInDBBase(CategoryBase) → Category(CategoryInDBBase)
export interface Category extends CategoryBase {
  id: number
  created_at: string
}

export interface PaginatedCategoriesResponse {
  items: Category[]
  page_size: number
  next_cursor: string | null
  has_more: boolean
}

// CategoryQueryResource(QueryResource)
export interface CategoryQueryResource extends QueryResource {
  name?: string
  description?: string
}
