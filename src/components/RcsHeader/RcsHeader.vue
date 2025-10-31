<template>
  <header class="header">
    <div class="logo">
      <router-link to="/" class="logo-link"
        >Work Tracker
        <sup class="ml-1 text-[10px] tracking-wide text-yellow-500">BETA</sup>
      </router-link>
    </div>

    <nav class="nav-links">
      <router-link to="/" class="nav-link" exact-active-class="active">Home</router-link>
      <router-link to="/dashboard" class="nav-link" exact-active-class="active"
        >Dashboard</router-link
      >

      <router-link to="/aboutme" class="nav-link" exact-active-class="active">About Me</router-link>
    </nav>

    <button class="menu-toggle-button" @click="isOpen = !isOpen">☰</button>
    <ul v-if="isOpen" class="md:hidden">
      <li>
        <router-link to="/" class="nav-link" exact-active-class="active" @click="isOpen = false"
          >Home</router-link
        >
      </li>
      <li>
        <router-link
          to="/dashboard"
          class="nav-link"
          exact-active-class="active"
          @click="isOpen = false"
          >Dashboard</router-link
        >
      </li>
      <li>
        <router-link
          to="/aboutme"
          class="nav-link"
          exact-active-class="active"
          @click="isOpen = false"
          >About Me</router-link
        >
      </li>
    </ul>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const isOpen = ref(false)
</script>

<style scoped src="./RcsHeader.css"></style>
