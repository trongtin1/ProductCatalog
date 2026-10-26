import type { Product } from '../../../models/product'

export interface ProductFormModalProps {
  isOpen: boolean
  product?: Product | null // null = create mode, Product = edit mode
  onClose: () => void
  onSuccess?: () => void
}

export interface ProductFormErrors {
  name?: string
  price?: string
  stock?: string
  category_id?: string
  image_url?: string
}
