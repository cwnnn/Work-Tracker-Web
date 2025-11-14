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
    },
    {
      path: '/test',
      name: 'test',
      component: TestView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/admin',
      name: 'amin',
      component: AdminView,
    },
    {
      path: '/whyibuiltthis',
      name: 'whyibuiltthis',
      component: whyibuiltthisView,
    },
  ],
})

export default router
