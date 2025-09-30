<script setup lang="ts">
import { RouterView } from 'vue-router'

import RcsHeader from './components/RcsHeader/RcsHeader.vue'
import RcsFooter from './components/RcsFooter/RcsFooter.vue'
</script>

<template>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  />
  <div id="app" class="flex flex-col min-h-screen">
    <RcsHeader />
    <main class="flex-1">
      <router-view />
    </main>
    <RcsFooter />
  </div>
</template>
>
