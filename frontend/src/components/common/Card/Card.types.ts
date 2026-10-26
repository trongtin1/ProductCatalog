import type React from 'react'

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  extra?: React.ReactNode
  footer?: React.ReactNode
  noPadding?: boolean
}
