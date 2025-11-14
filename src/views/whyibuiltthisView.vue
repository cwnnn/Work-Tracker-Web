<template>
  <main
    class="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center text-white"
  >
    <h1 class="text-3xl font-bold mb-6 text-purple-500">Why I Built This</h1>

    <div class="max-w-2xl text-gray-900 dark:text-gray-300 space-y-4 mb-12">
      <p>
        I built this project because I needed a simple and honest way to understand how I spend my
        time. Not something complicated or packed with features — just a clean, distraction-free
        tool that helps me focus, stay consistent, and see my progress clearly.
      </p>

      <p>
        It’s designed so anyone can jump in and start using it right away — no setup, no sign-up.
        Everything runs smoothly in your browser with a clean, modern interface focused purely on
        tracking your work sessions and visualizing progress.
      </p>

      <p>
        I want to keep this tool free for everyone, without adding ads or anything that breaks the
        experience. But running and maintaining it does come with some unavoidable costs. If this
        project helps you and you’d like to support its future, your donation would mean a lot. 💙
      </p>
    </div>

    <div class="flex flex-col items-center gap-4 mb-12">
      <a
        href="https://buymeacoffee.com/cwnn"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block"
      >
        <RcsSoftButton
          class="premium-donate-btn relative overflow-hidden rounded-full px-6 py-3"
          size="xl"
        >
          <span
            class="relative z-10 flex items-center gap-2 font-semibold text-[0.9rem] tracking-wide text-yellow-500 dark:text-yellow-200"
          >
            Support Me
          </span>
        </RcsSoftButton>
      </a>
    </div>

    <div class="flex flex-col items-center w-full max-w-md">
      <h3 class="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
        💬 Feedback & Suggestions
      </h3>

      <p class="text-sm text-gray-900 dark:text-gray-300 mb-3">
        Found a bug or have an idea to improve the project? Let me know below 👇
      </p>

      <div class="w-full self-start h-10 p-1">
        <RcsDropdown v-model="selecedType" :items="TypeDropdownItems" class="full" />
      </div>

      <textarea
        v-model="feedback"
        placeholder="Type your message..."
        class="RcsInput h-32 resize-none"
      ></textarea>

      <RcsSoftButton
        @click="submitFeedback"
        :disabled="loading"
        class="mt-3 px-5 py-2 hover:bg-blue-700 relative"
      >
        <span v-if="!loading" class="text-blue-600 dark:text-blue-400">Send Feedback</span>
        <span v-else class="text-blue-300 animate-pulse">Sending...</span>
      </RcsSoftButton>

      <p v-if="sent" class="text-green-400 text-sm mt-2">✅ Thank you for your feedback!</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import RcsDropdown from '@/components/RcsDropdown/RcsDropdown.vue'
import RcsSoftButton from '@/components/RcsSoftButton/RcsSoftButton.vue'
import { useUserStore } from '@/stores/userStore'
import { sendFeedback } from '@/utils/firebaseUtils/feadbackUtils'
import { ref } from 'vue'

const userStore = useUserStore()

const feedback = ref('')
const sent = ref(false)
const loading = ref(false)

const selecedType = ref<'feedback' | 'suggestion' | 'bug'>('feedback')
const TypeDropdownItems = [
  { label: 'General Feedback', value: 'feedback' },
  { label: 'Suggestion', value: 'suggestion' },
  { label: 'Bug Report', value: 'bug' },
]

async function submitFeedback() {
  if (feedback.value.trim().length < 3) return
  if (loading.value) return

  loading.value = true

  try {
    await sendFeedback({
      type: selecedType.value,
      message: feedback.value,
      userId: userStore.userId || null,
    })

    sent.value = true
    feedback.value = ''

    setTimeout(() => (sent.value = false), 3000)
  } catch (err) {
    console.error('Feedback error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style>
@reference "tailwindcss/theme.css";
.premium-donate-btn::after {
  content: '';
  position: absolute;
  top: -150%;
  left: -40%;
  width: 60%;
  height: 400%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.9), transparent);
  transform: translateX(-120%) rotate(18deg);
  opacity: 0.8;
  pointer-events: none;

  /* Her zaman kesintisiz çalışacak animasyon */
  animation: donate-beam 1.8s ease-out infinite;
}

@keyframes donate-beam {
  0% {
    transform: translateX(-120%) rotate(18deg);
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  100% {
    transform: translateX(180%) rotate(18deg);
    opacity: 0;
  }
}

body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;

  box-shadow:
    inset 0 0 50px rgb(255, 215, 0, 0.3),
    inset 0 0 100px rgb(255, 215, 0, 0.2),
    inset 0 0 200px rgb(255, 215, 0, 0.1);

  opacity: 0;
  transition: opacity 0.8s ease;
}

body:has(.premium-donate-btn:hover)::after {
  opacity: 1;
}

.RcsInput {
  @apply w-full m-6 border-none p-4 focus:outline-none rounded-lg font-bold bg-black/5 dark:bg-black/30 text-[#2c3e50] dark:text-[#f0efed];
  box-shadow:
    inset -1px -1px 2px rgba(255, 255, 255, 1),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7),
    inset 2px 2px 2px rgba(0, 0, 0, 0.5);
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    sans-serif;
}

@media (prefers-color-scheme: dark) {
  body::after {
    box-shadow:
      inset 0 0 10px rgba(255, 200, 80, 0.3),
      inset 0 0 40px rgba(255, 200, 80, 0.1),
      inset 0 0 80px rgba(255, 180, 60, 0.06);
  }
  .RcsInput {
    box-shadow:
      inset -1px -1px 2px rgba(255, 255, 255, 0.3),
      inset -2px -2px 4px rgba(255, 255, 255, 0.2),
      inset 2px 2px 2px rgba(0, 0, 0, 0.7);
  }
}
</style>
