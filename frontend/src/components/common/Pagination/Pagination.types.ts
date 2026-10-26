export interface PaginationProps {
  itemCount: number
  pageSize: number
  hasMore: boolean
  pageSizeOptions?: number[]
  onNext: () => void
  onReset?: () => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}
