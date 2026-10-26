import React from 'react'

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}
