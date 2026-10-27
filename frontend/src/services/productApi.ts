
import axios from "./axios"
import type { Result } from '../models/result'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductQueryResource,
  PaginatedProductsResponse,
} from '../models/product'

const toFormData = (
  data: ProductCreate | ProductUpdate,
  file?: File | null,
): FormData => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  })
  if (file) formData.append('file', file)
  return formData
}

export const ProductService = {
  // Get paginated products
  getAll: async (
    request?: ProductQueryResource,
  ): Promise<Result<PaginatedProductsResponse>> => {
    return await axios({
      method: 'get',
      url: '/products/',
      params: {
        ...request,
      },
    })
  },

  // Get product detail
  getById: async (
    id: number,
  ): Promise<Result<Product>> => {
    return await axios({
      method: 'get',
      url: `/products/${id}`,
    })
  },

  // Create product
  create: async (
    data: ProductCreate,
    file?: File | null,
  ): Promise<Result<Product>> => {
    return await axios({
      method: 'post',
      url: '/products/',
      data: toFormData(data, file),
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Update product
  update: async (
    id: number,
    data: ProductUpdate,
    file?: File | null,
  ): Promise<Result<Product>> => {
    return await axios({
      method: 'patch',
      url: `/products/${id}`,
      data: toFormData(data, file),
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Delete product
  delete: async (
    id: number,
  ): Promise<Result<null>> => {
    return await axios({
      method: 'delete',
      url: `/products/${id}`,
    })
  },

}
