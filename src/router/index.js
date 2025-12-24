// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import ScoringView from '@/views/scoring.vue'
import HistoryView from '@/views/history.vue'

const routes = [
  {
    path: '/',
    redirect: '/scoring'
  },
  {
    path: '/scoring',
    name: 'Scoring',
    component: ScoringView
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryView
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router