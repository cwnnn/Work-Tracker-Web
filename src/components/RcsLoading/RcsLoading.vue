<template>
  <transition name="fade" appear>
    <div v-if="visible" class="overlay">
      <div class="modal-content">
        <template v-if="status === 'loading'">
          <div class="loader">
            <div class="loader-ring"></div>
            <div class="loader-base"></div>
          </div>
          <p class="text-loading">{{ text || 'Processing...' }}</p>
        </template>

        <template v-else-if="status === 'success'">
          <div class="status-icon success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p class="text-success">{{ text || 'Success!' }}</p>
        </template>

        <template v-else-if="status === 'error'">
          <div class="status-icon error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p class="text-error">{{ text || 'Something went wrong' }}</p>
        </template>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  status: 'loading' | 'success' | 'error'
  text?: string
}>()
</script>

<style src="./RcsLoading.style.css"></style>
