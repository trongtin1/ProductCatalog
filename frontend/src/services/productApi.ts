
import axios from "./axios"
import type { Result } from '../models/result'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductQueryResource,
  PaginatedProductsResponse,
} from '../models/product'

// Separate axios instance for multipart/form-data (no fixed Content-Type header)
import axiosRaw from 'axios'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost:8000/api/v1')

const uploadInstance = axiosRaw.create({
  baseURL: rawBaseUrl,
  timeout: 30000,
})
uploadInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.data) return Promise.reject(error.response.data)
    return Promise.reject(error)
  }
)

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
  ): Promise<Result<Product>> => {
    return await axios({
      method: 'post',
      url: '/products/',
      data,
    })
  },

  // Update product
  update: async (
    id: number,
    data: ProductUpdate,
  ): Promise<Result<Product>> => {
    return await axios({
      method: 'patch',
      url: `/products/${id}`,
      data,
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

  // Upload product image → POST /products/{id}/image (multipart/form-data)
  uploadImage: async (
    id: number,
    file: File,
  ): Promise<Result<Product>> => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadInstance.post(`/products/${id}/image`, formData)
  },
}
