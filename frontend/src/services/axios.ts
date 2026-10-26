import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost:8000/api/v1')

const instance = axios.create({
  baseURL: rawBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Unpack response.data so callers directly receive Result<T>
instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.data) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  }
)

export default instance