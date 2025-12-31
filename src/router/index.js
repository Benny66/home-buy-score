// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'   
import ScoringView from '@/views/scoring.vue'
import ImprovementView from '@/views/improvement.vue'
import SecondhandView from '@/views/secondhand.vue'
import HistoryView from '@/views/history.vue'
import BudgetSimulatorView from '@/views/budget-simulator.vue'
import ShenzhenMapView from '@/views/shenzhen-map.vue'
import AboutView from '@/views/about.vue'
import LotteryView from '@/views/lottery.vue'

const routes = [
  {
    path: '/',
    redirect: '/scoring'
  },
  {
    path: '/shenzhen-map',
    name:'ShenzhenMap',
    component: ShenzhenMapView
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
  },
  {
    path: '/improvement',
    name: 'Improvement',
    component: ImprovementView
  },
  {
    path: '/secondhand',
    name: 'Secondhand',
    component: SecondhandView
  },
  {
    path: '/budget-simulator',
    name: 'BudgetSimulator',
    component: BudgetSimulatorView
  },
  {
    path: '/lottery',
    name: 'Lottery',
    component: LotteryView
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router