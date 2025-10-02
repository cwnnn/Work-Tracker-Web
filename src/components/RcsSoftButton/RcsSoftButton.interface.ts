import type { BaseProps } from '../BaseProps'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends BaseProps {
  label?: string
  size?: ButtonSize
  disabled?: boolean
  icon?: string
  pressed?: boolean
}
