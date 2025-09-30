<script setup lang="ts">
import RcsSoftButton from '@/components/RcsSoftButton/RcsSoftButton.vue'

function onButtonClick(ev: MouseEvent) {
  console.log('Button clicked!', ev)
}

function onButtonPress(pressed: boolean) {
  console.log('Button pressed state:', pressed)
}
</script>

<template>
  <main class="flex flex-col items-center justify-center min-h-screen text-center">
    <h1 class="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
    <p class="text-lg">
      This is the home view of the application. Use the navigation links to explore different
      sections.
    </p>

    <RcsSoftButton
      label="Click Me"
      variant="soft"
      size="xl"
      @click="onButtonClick"
      @press="onButtonPress"
    />
  </main>
</template>
