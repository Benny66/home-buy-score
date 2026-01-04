<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  isMobileDevice,
  getScreenSize,
  addResizeListener,
  getDeviceInfo
} from '@/utils/device-utils'

const isMobile = ref(false)
const isMenuOpen = ref(false)
const deviceInfo = ref({})

// 更新设备信息
const updateDeviceInfo = () => {
  deviceInfo.value = getDeviceInfo()
  isMobile.value = isMobileDevice()
}

// 监听窗口大小变化
let removeResizeListener = null

onMounted(() => {
  updateDeviceInfo()
  removeResizeListener = addResizeListener(updateDeviceInfo)
})

onUnmounted(() => {
  if (removeResizeListener) {
    removeResizeListener()
  }
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  if (isMobile.value) {
    isMenuOpen.value = false
  }
}

// 根据屏幕尺寸动态调整导航链接显示
const getVisibleLinks = () => {
  const allLinks = [
    { to: '/scoring', text: '刚需购房评估', priority: 1 },
    { to: '/improvement', text: '改善型购房评估', priority: 1 },
    { to: '/secondhand', text: '二手房购房评估', priority: 1 },
    { to: '/budget-simulator', text: '预算模拟器', priority: 2 },
    { to: '/shenzhen-map', text: '深圳地图', priority: 2 },
    { to: '/history', text: '历史记录', priority: 3 },
    { to: '/about', text: '关于', priority: 3 }
  ]

  if (isMobile.value) {
    // 移动端显示所有链接
    return allLinks
  }

  const screenSize = getScreenSize()

  // 根据屏幕尺寸决定显示哪些链接
  switch (screenSize) {
    case 'xs':
    case 'sm':
      return allLinks.filter(link => link.priority <= 1)
    case 'md':
      return allLinks.filter(link => link.priority <= 2)
    default:
      return allLinks // lg, xl 显示所有链接
  }
}
</script> 

<template>
  <div>
    <!-- 移动端汉堡菜单按钮 -->
    <div v-if="isMobile" class="mobile-header">
      <button class="menu-toggle" @click="toggleMenu" :aria-expanded="isMenuOpen">
        <span :class="{ 'active': isMenuOpen }"></span>
        <span :class="{ 'active': isMenuOpen }"></span>
        <span :class="{ 'active': isMenuOpen }"></span>
      </button>
      <h1 class="app-title">购房评估工具</h1>
      <div class="screen-indicator" :title="`屏幕尺寸: ${deviceInfo.screenSize}`">
        {{ deviceInfo.screenSize.toUpperCase() }}
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav :class="{
      'mobile-nav': isMobile,
      'nav-open': isMenuOpen,
      [`screen-${deviceInfo.screenSize}`]: true
    }">
      <div class="nav-container">
        <router-link
          v-for="link in getVisibleLinks()"
          :key="link.to"
          :to="link.to"
          @click="closeMenu"
          class="nav-link"
          :class="`priority-${link.priority}`"
        >
          {{ link.text }}
          <span v-if="link.priority > 1" class="link-badge">新</span>
        </router-link>

        <!-- 更多菜单（在中等屏幕下显示） -->
        <div v-if="!isMobile && getScreenSize() === 'md'" class="more-menu">
          <button class="more-button">更多 ⋯</button>
          <div class="more-dropdown">
            <router-link
              v-for="link in getVisibleLinks().filter(l => l.priority > 2)"
              :key="link.to"
              :to="link.to"
              class="dropdown-link"
            >
              {{ link.text }}
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main :class="{
      'menu-open': isMenuOpen,
      'touch-device': deviceInfo.isTouch
    }">
      <router-view />
    </main>

    <!-- 移动端菜单遮罩 -->
    <div
      v-if="isMobile && isMenuOpen"
      class="menu-overlay"
      @click="closeMenu"
    ></div>

  </div>
</template>

<style scoped>
/* 基础样式 */
nav {
  padding: 16px 0;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 20px;
}

.nav-link {
  position: relative;
  margin: 0 6px;
  text-decoration: none;
  color: #2c3e50;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link:hover {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-link.router-link-active {
  color: #42b983;
  font-weight: 600;
  background: linear-gradient(135deg, #42b98315, #42b98308);
  border-color: #42b98330;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background: #42b983;
  border-radius: 1px;
}

.link-badge {
  background: #ff6b6b;
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  margin-left: 2px;
}

/* 优先级样式 */
.nav-link.priority-1 {
  font-weight: 600;
}

.nav-link.priority-2 {
  opacity: 0.9;
}

.nav-link.priority-3 {
  opacity: 0.8;
}

/* 更多菜单样式 */
.more-menu {
  position: relative;
}

.more-button {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.more-button:hover {
  background: #e9ecef;
}

.more-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}

.more-menu:hover .more-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-link {
  display: block;
  padding: 12px 16px;
  text-decoration: none;
  color: #2c3e50;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.dropdown-link:hover {
  background: #f8f9fa;
}

.dropdown-link.router-link-active {
  color: #42b983;
  background: #f0f9f4;
}

/* 移动端样式 */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 101;
}

.menu-toggle {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 32px;
  height: 32px;
  justify-content: center;
  align-items: center;
}

.menu-toggle span {
  width: 20px;
  height: 2px;
  background: #2c3e50;
  transition: all 0.3s ease;
  transform-origin: center;
}

.menu-toggle span.active:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.menu-toggle span.active:nth-child(2) {
  opacity: 0;
}

.menu-toggle span.active:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

.app-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.screen-indicator {
  font-size: 10px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  color: #666;
}

.mobile-nav {
  position: fixed;
  top: 0;
  left: -100%;
  width: 280px;
  height: 100vh;
  background: #ffffff;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.15);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 102;
  padding: 70px 0 20px;
  overflow-y: auto;
}

.mobile-nav.nav-open {
  left: 0;
}

.mobile-nav .nav-container {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 0;
}

.mobile-nav .nav-link {
  margin: 0;
  padding: 16px 24px;
  border-radius: 0;
  border: none;
  border-left: 4px solid transparent;
  text-align: left;
  background: transparent;
  font-size: 16px;
}

.mobile-nav .nav-link:hover {
  transform: none;
  box-shadow: none;
  background: #f8f9fa;
  border-left-color: #42b983;
}

.mobile-nav .nav-link.router-link-active {
  border-left-color: #42b983;
  background: #f0f9f4;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 101;
  backdrop-filter: blur(2px);
}

main.menu-open {
  transform: translateX(280px);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 触摸设备优化 */
.touch-device .nav-link {
  min-height: 44px; /* 满足触摸最小尺寸 */
}

.touch-device .nav-link:hover {
  transform: none; /* 触摸设备禁用悬停效果 */
}

/* 响应式断点适配 */
nav.screen-xs .nav-container {
  padding: 0 12px;
  gap: 4px;
}

nav.screen-xs .nav-link {
  font-size: 12px;
  padding: 8px 10px;
  margin: 0 2px;
}

nav.screen-sm .nav-link {
  font-size: 13px;
  padding: 8px 12px;
}

/* 设备调试信息 */
.device-debug {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }

  .menu-toggle span {
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .nav-link {
    border-width: 2px;
  }
}
</style>


