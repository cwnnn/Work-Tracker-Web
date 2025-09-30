export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps {
  label?: string
  size?: ButtonSize
  disabled?: boolean
  icon?: string
}
