
import axios from './axios'
import type { Result } from '../models/result'
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryQueryResource,
} from '../models/category'

export const CategoryService = {
  // Get all categories
  getAll: async (
    request?: CategoryQueryResource,
  ): Promise<Result<Category[]>> => {
    return await axios({
      method: 'get',
      url: '/categories/',
      params: {
        ...request,
      },
    })
  },

  // Get category detail
  getById: async (
    id: number,
  ): Promise<Result<Category>> => {
    return await axios({
      method: 'get',
      url: `/categories/${id}`,
    })
  },

  // Create category
  create: async (
    data: CategoryCreate,
  ): Promise<Result<Category>> => {
    return await axios({
      method: 'post',
      url: '/categories/',
      data,
    })
  },

  // Update category
  update: async (
    id: number,
    data: CategoryUpdate,
  ): Promise<Result<Category>> => {
    return await axios({
      method: 'patch',
      url: `/categories/${id}`,
      data,
    })
  },

  // Delete category
  delete: async (
    id: number,
  ): Promise<Result<null>> => {
    return await axios({
      method: 'delete',
      url: `/categories/${id}`,
    })
  },
}
