// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import ScoringView from '../views/scoring.vue'  // 引入您的评分表组件

const routes = [
  {
    path: '/scoring',
    name: 'Scoring',
    component: ScoringView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router