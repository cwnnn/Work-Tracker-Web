<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import RcsHeader from './components/RcsHeader/RcsHeader.vue'
import RcsFooter from './components/RcsFooter/RcsFooter.vue'
import { auth, signInAnonymously } from './firebase'
import { useUserStore } from './stores/userStore'
import { useTopicStore } from '@/stores/topicStore'
import { useSeedStore } from '@/stores/seedStore'
import { getUserTopics } from '@/utils/firebaseUtils/firebaseUtils'
import { saveGlobalErrorLog } from './utils/firebaseUtils/firebaseUtils'

const userStore = useUserStore()
const topicStore = useTopicStore()
const seedStore = useSeedStore()

onMounted(async () => {
  try {
    const result = await signInAnonymously(auth)
    userStore.setUser(result.user.uid)

    await seedStore.loadSeed()
    const topics = await getUserTopics(result.user.uid)
    topicStore.setTopics(topics)
  } catch (err) {
    await saveGlobalErrorLog(
      err instanceof Error ? err.message : String(err),
      'AppMounted',
      undefined,
      err instanceof Error ? err.stack : undefined,
    )
  }
})
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
