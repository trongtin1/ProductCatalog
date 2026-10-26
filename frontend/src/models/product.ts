// Tương đương schemas/product.py

import type { Category } from './category'
import type { QueryResource } from './result'

// ProductBase
export interface ProductBase {
  name: string                 // min_length=1
  description: string | null
  price: number                // gt=0
  stock: number                // ge=0, default=0
  category_id: number
  image_url: string | null
}

// ProductCreate(ProductBase)
export type ProductCreate = ProductBase

// ProductUpdate (tất cả optional)
export interface ProductUpdate {
  name?: string
  description?: string | null
  price?: number
  stock?: number
  category_id?: number | null
  image_url?: string | null
}

// ProductInDBBase(ProductBase)
export interface ProductInDBBase extends ProductBase {
  id: number
  created_at: string
  updated_at: string
}

// ProductResponse(ProductInDBBase) — object category được nhúng
export interface ProductResponse extends ProductInDBBase {
  category: Category | null
}

// Alias ngắn gọn dùng trong code
export type Product = ProductResponse

// PaginatedProductsResponse
export interface PaginatedProductsResponse {
  items: ProductResponse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ProductQueryResource(QueryResource)
export interface ProductQueryResource extends QueryResource {
  category_id?: number
  min_price?: number
  max_price?: number
}
