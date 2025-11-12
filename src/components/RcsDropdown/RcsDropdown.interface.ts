import type { BaseProps } from '../BaseProps'

export interface DropdownItem {
  label: string
  value: string
  premium?: boolean
}

export interface RcsDropdownProps extends BaseProps {
  modelValue: string
  items: DropdownItem[]
}
