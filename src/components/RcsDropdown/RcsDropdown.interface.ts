import type { BaseProps } from '../BaseProps'

export interface DropdownItem {
  label: string
  value: string
}

export interface RcsDropdownProps extends BaseProps {
  modelValue: string
  items: DropdownItem[]
}
