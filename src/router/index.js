// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'   
import ScoringView from '@/views/scoring.vue'
import ImprovementView from '@/views/improvement.vue'
import SecondhandView from '@/views/secondhand.vue'
import HistoryView from '@/views/history.vue'
import BudgetSimulatorView from '@/views/budget-simulator.vue'
import ShenzhenMapView from '@/views/shenzhen-map.vue'
import AboutView from '@/views/about.vue'
import PolicyView from '@/views/policy.vue' // 新增政策相关页面

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
    path: '/budget-simulator',
    name: 'BudgetSimulator',
    component: BudgetSimulatorView
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryView
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView
  },
  // 新增房产信息大模块
  {
    path: '/real-estate',
    name: 'RealEstate',
    redirect: '/real-estate/policy',
    children: [
      {
        path: 'policy',
        name: 'Policy',
        component: PolicyView
      }
      // 可以继续添加其他房产信息相关的子路由
    ]
  },
  // 购房评估大模块（包含原有的评估表）
  {
    path: '/evaluation',
    name: 'Evaluation',
    redirect: '/evaluation/scoring',
    children: [
      {
        path: 'scoring',
        name: 'Scoring',
        component: ScoringView
      },
      {
        path: 'improvement',
        name: 'Improvement',
        component: ImprovementView
      },
      {
        path: 'secondhand',
        name: 'Secondhand',
        component: SecondhandView
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router