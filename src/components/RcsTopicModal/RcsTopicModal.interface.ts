export interface RcsTopicModalProps {
  title: string
  mode: 'edit' | 'delete'
  topicName: string
  visible: boolean
}

export type RcsTopicModalEmits = {
  (e: 'confirm', value: string): void
  (e: 'close'): void
}
