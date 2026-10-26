import type { Product } from '../../../models/product'

export interface ProductDetailModalProps {
  isOpen: boolean
  product?: Product | null
  onClose: () => void
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
}
