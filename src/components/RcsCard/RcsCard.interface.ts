import type { BaseProps } from '../BaseProps'

export interface RcsStatCardProps extends BaseProps {
  title: string
  value: string | number
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}
