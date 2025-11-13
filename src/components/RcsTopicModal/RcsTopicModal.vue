<template>
  <div v-if="visible" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-container">
      <h2 class="modal-title">{{ title }}</h2>

      <p class="modal-message">{{ message }}</p>

      <input
        v-model="userInput"
        type="text"
        class="modal-input"
        :placeholder="
          mode === 'delete' ? `Type: ${topicName}` : `Enter new name (current: ${topicName})`
        "
        @keyup.enter="handleConfirm"
      />

      <div class="modal-actions">
        <RcsSoftButton class="modal-btn cancel" @click="$emit('close')" label="Cancel" />
        <RcsSoftButton
          class="modal-btn confirm"
          :disabled="!isValid || loading"
          @click="handleConfirm"
          label="Confirm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RcsSoftButton from '../RcsSoftButton/RcsSoftButton.vue'

interface Props {
  visible: boolean
  title: string
  message: string
  topicName: string
  mode: 'edit' | 'delete'
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'confirmed', value: string): void }>()

const userInput = ref('')

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      userInput.value = props.mode === 'edit' ? props.topicName : ''
    }
  },
)

const isValid = computed(() => {
  const val = userInput.value.trim()
  if (props.mode === 'delete') return val === props.topicName.trim()
  if (props.mode === 'edit') return val.length > 0 && val !== props.topicName.trim()
  return false
})

const loading = ref(false)

async function handleConfirm() {
  if (!isValid.value || loading.value) return
  loading.value = true
  try {
    await emit('confirmed', userInput.value.trim())
  } finally {
    loading.value = false
  }
}
</script>

<style src="./RcsTopicModal.style.css"></style>
