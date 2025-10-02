import type { BaseProps } from '../BaseProps'

export interface DropdownItem {
  id: string
  label: string
}

export interface SearchableDropdownProps extends BaseProps {
  items: DropdownItem[]
  modelValue: DropdownItem | null
  placeholder?: string
}
