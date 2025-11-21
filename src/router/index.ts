import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TestView from '../views/TestViev.vue'
import DashboardView from '../views/DasboardView.vue'
import AdminView from '../views/AdminView.vue'
import whyibuiltthisView from '../views/whyibuiltthisView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Worx Tracker — Focus Your Time',
        description: 'A modern and minimal time tracking tool to help you stay focused.',
      },
    },
    {
      path: '/test',
      name: 'test',
      component: TestView,
      meta: {
        noindex: true,
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard — WorX Tracker',
        description:
          'Track your focus sessions with clear visual charts and topic-based insights. Analyze your daily, weekly, and monthly performance through interactive graphs and summary cards.',
      },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: {
        noindex: true,
      },
    },
    {
      path: '/whyibuiltthis',
      name: 'whyibuiltthis',
      component: whyibuiltthisView,
      meta: {
        title: 'Why I Built This — WorX Tracker',
        description:
          'A clean, ad-free tool to help you understand your focus patterns through visual charts, session history, and topic-based statistics.',
      },
    },
  ],
})

router.afterEach((to) => {
  // DEFAULTS
  const defaultTitle = 'WorX Tracker'
  const defaultDesc = 'Modern anonymous focus tracker.'

  // TITLE
  document.title = (to.meta.title as string) || defaultTitle

  // DESCRIPTION
  const desc = document.querySelector("meta[name='description']")
  if (desc) {
    desc.setAttribute('content', (to.meta.description as string) || defaultDesc)
  } else {
    const newDesc = document.createElement('meta')
    newDesc.name = 'description'
    newDesc.content = (to.meta.description as string) || defaultDesc
    document.head.appendChild(newDesc)
  }

  // ROBOTS (admin/test için noindex)
  let robots = document.querySelector("meta[name='robots']") as HTMLMetaElement | null

  if (!robots) {
    robots = document.createElement('meta')
    robots.name = 'robots'
    document.head.appendChild(robots)
  }
  robots.setAttribute('content', to.meta.noindex ? 'noindex, nofollow' : 'index, follow')

  // CANONICAL
  const canonicalUrl = window.location.origin + to.fullPath
  let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null
  if (canonical) {
    canonical.setAttribute('href', canonicalUrl)
  } else {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = canonicalUrl
    document.head.appendChild(canonical)
  }
})

export default router
