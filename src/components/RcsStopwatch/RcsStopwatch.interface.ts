import type { BaseProps } from '../BaseProps'

export interface StopwatchExpose extends BaseProps {
  start: () => void
  stop: () => void
  reset: () => void
  time: number
}
