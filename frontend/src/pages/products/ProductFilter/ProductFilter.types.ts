export interface ProductFilterProps {
  searchTerm: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  onSearchChange: (value: string) => void
  onCategoryChange: (categoryId?: number) => void
  onPriceRangeChange: (minPrice?: number, maxPrice?: number) => void
  onReset: () => void
  onAddNew: () => void
  className?: string
}
