
import axios from "./axios"
import type { Result } from '../models/result'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductQueryResource,
  PaginatedProductsResponse,
} from '../models/product'

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
}
