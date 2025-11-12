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

const userStore = useUserStore()
const topicStore = useTopicStore()
const seedStore = useSeedStore()

onMounted(async () => {
  try {
    const result = await signInAnonymously(auth)
    userStore.setUser(result.user.uid)

    await seedStore.loadSeed()
    console.log('Seed:', seedStore.seed)
    console.log('Anonim kullanıcı giriş yaptı:', result.user.uid)
    console.log('Global store userId:', result.user.uid)
    const topics = await getUserTopics(result.user.uid)
    topicStore.setTopics(topics)
    console.log('Topic listesi yüklendi:', topics)
  } catch (err) {
    console.error('App başlatılırken hata:', err)
  }
})
</script>

<template>
  <div id="app" class="flex flex-col min-h-screen">
    <RcsHeader />
    <main class="flex-1">
      <router-view />
    </main>
    <RcsFooter />
  </div>
</template>
