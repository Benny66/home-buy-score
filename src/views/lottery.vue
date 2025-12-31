<template>
  <div class="lottery-page"> 
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        <span class="label">已抽人数</span>
        <span class="value">{{ winners.length }} / {{ participants.length }}</span>
      </div>
      <div class="status-item">
        <span class="label">已中奖名单</span>
        <span class="value">{{ winners.map(w => w.name).join('、') || '暂无' }}</span>
      </div>
    </div>

    <!-- 3D 地球形滚动容器 -->
    <div class="globe-wrap">
      <div
        class="globe"
        :class="{ spin: !drawingInProgress }"
        :style="{
          transform: `rotateX(${globeRX}deg) rotateY(${globeRY}deg)`
        }"
      >
        <!-- 将 v-for 从 participants 改为 nodes（重复后的节点集合） -->
        <div
          v-for="(n, idx) in nodes"
          :key="n.key"
          class="node"
          :class="{
            drawn: n.person.drawn,
            highlight: highlightIndex === idx,
            winner: winnerId === n.personId
          }"
          :style="nodeStyle(idx)"
        >
          <div class="avatar-wrap">
            <img :src="n.person.img" :alt="n.person.name" />
            <div class="glow"></div>
          </div>
          <div class="name">{{ n.person.name }}</div>
          <div class="badge" v-if="n.person.drawn">已中</div>
        </div>
      </div>
    </div>

   <!-- 右侧垂直居中的悬浮控制面板（Element Plus 按钮） -->
   <div class="control-dock">
      <el-button
        class="ep-btn primary"
        type="primary"
        :disabled="isAllDrawn || drawingInProgress"
        @click="handleDraw"
      >
        抽奖
      </el-button>

      <el-button
        class="ep-btn ghost"
        :disabled="drawingInProgress"
        @click="handleReset"
      >
        重置
      </el-button>

      <div class="hint" v-if="isAllDrawn">全部已抽完，可点击重置</div>
    </div>

    <!-- 中奖弹窗 -->
    <div class="modal-mask" v-if="showWinnerModal" @click.self="showWinnerModal = false">
      <div class="modal">
        <div class="modal-title">恭喜中奖</div>
        <div class="modal-body" v-if="currentWinner">
          <div class="modal-avatar">
            <img :src="currentWinner.img" :alt="currentWinner.name" />
          </div>
          <div class="modal-name">{{ currentWinner.name }}</div>
        </div>
        <div class="modal-actions">
          <button class="btn primary" @click="showWinnerModal = false">知道了</button>
        </div>
      </div>
    </div>

    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import lotteryData from '@/assets/json/lottery.json'

const rawList = lotteryData?.lottery ?? []

function resolveImg(path) {
  // 将 "@/assets/..." 转为实际可加载的 URL（适用于 Vite）
  const resolved = path.replace(/^@/, '/src')
  return new URL(resolved, import.meta.url).href
}

const participants = ref(
  rawList.map(item => ({
    id: item.id,
    name: item.name,
    img: resolveImg(item.img),
    drawn: false
  }))
)

// 每个人在球面显示的重复次数
const REPEAT_COUNT = 10

// 重复后的“节点”集合，用于球面渲染（显示可以重复，但抽奖以人唯一）
const nodes = computed(() => {
  return participants.value.flatMap(p => {
    return Array.from({ length: REPEAT_COUNT }, (_, i) => ({
      key: `${p.id}-${i}`,
      personId: p.id,
      person: p,
      dupIndex: i
    }))
  })
})

// 用于快速查找某人的全部节点索引
const personIdToNodeIndices = computed(() => {
  const map = new Map()
  nodes.value.forEach((n, idx) => {
    if (!map.has(n.personId)) map.set(n.personId, [])
    map.get(n.personId).push(idx)
  })
  return map
})

const winners = ref([])
const drawingInProgress = ref(false)
const highlightIndex = ref(-1)
const winnerId = ref(null)
const isAllDrawn = computed(() => participants.value.every(p => p.drawn))

// 3D 球体旋转角度（度）
const globeRX = ref(-8)
const globeRY = ref(0)

// 中奖弹窗
const showWinnerModal = ref(false)
const currentWinner = ref(null)

// Fibonacci 球分布，注意这里用 nodes 的数量（重复后的总节点数）
const spherePositions = computed(() => {
  const n = nodes.value.length || 1
  const positions = []
  const offset = 2 / n
  const increment = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(1 - y * y)
    const phi = i * increment
    const x = Math.cos(phi) * r
    const z = Math.sin(phi) * r
    const theta = Math.acos(y)
    const azimuth = Math.atan2(z, x)
    positions.push({ x, y, z, theta, azimuth })
  }
  return positions
})

const radius = 220
function radToDeg(r) { return (r * 180) / Math.PI }
function nodeStyle(idx) {
  const pos = spherePositions.value[idx]
  if (!pos) return {}
  const t = `rotateY(${radToDeg(pos.azimuth)}deg) rotateX(${radToDeg(pos.theta) - 90}deg) translateZ(${radius}px)`
  const depth = pos.z
  const zIndex = Math.round((depth + 1) * 1000)
  const opacity = 0.65 + (depth + 1) * 0.175
  return { transform: t, zIndex, opacity }
}

// 高亮闪烁：基于 nodes 数量随机闪动
let flickerTimer = null
function startFlicker() {
  stopFlicker()
  flickerTimer = setInterval(() => {
    const n = nodes.value.length
    if (n > 0) highlightIndex.value = Math.floor(Math.random() * n)
  }, 150)
}
function stopFlicker() {
  if (flickerTimer) { clearInterval(flickerTimer); flickerTimer = null }
}

// tween 与缓动
function tween(from, to, duration, onUpdate, onDone, easing = (t)=>t) {
  const start = performance.now()
  function frame(now) {
    const p = Math.min(1, (now - start) / duration)
    const e = easing(p)
    onUpdate(from + (to - from) * e)
    if (p < 1) requestAnimationFrame(frame)
    else onDone && onDone()
  }
  requestAnimationFrame(frame)
}
function easeInCubic(t){ return t*t*t }
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3) }
function normalizeAngleClose(from, to) {
  let a = to
  while (a - from > 180) a -= 360
  while (from - a > 180) a += 360
  return a
}

// 抽奖：从“未中奖的人员”中选 1 人；对齐该人任意一个节点到正前方
function handleDraw() {
  if (drawingInProgress.value || isAllDrawn.value) return
  const pool = participants.value.filter(p => !p.drawn)
  if (!pool.length) return

  drawingInProgress.value = true
  winnerId.value = null
  stopFlicker()

  // 目标“人”
  const targetPerson = pool[Math.floor(Math.random() * pool.length)]

  // 从该人的所有节点里随机选一个节点索引对齐
  const indices = personIdToNodeIndices.value.get(targetPerson.id) || []
  const targetNodeIndex = indices[Math.floor(Math.random() * indices.length)] ?? 0
  const pos = spherePositions.value[targetNodeIndex]
  if (!pos) return

  // 目标对齐到正前方（Z+）
  const targetRY = -radToDeg(pos.azimuth)
  const targetRX = -(radToDeg(pos.theta) - 90)

  // 做一点加速减速感
  const extraTurns = 360 * (1 + Math.floor(Math.random() * 2))
  const fromRY = globeRY.value
  const midRY = fromRY + extraTurns
  tween(fromRY, midRY, 700, v => (globeRY.value = v), () => {
    tween(midRY, normalizeAngleClose(midRY, targetRY), 900, v => (globeRY.value = v), () => {
      finalizeWinner(targetPerson)
    }, easeOutCubic)
  }, easeInCubic)

  tween(globeRX.value, normalizeAngleClose(globeRX.value, targetRX), 1200, v => (globeRX.value = v), null, easeOutCubic)
}

function finalizeWinner(person) {
  // 标记该“人”中奖（其所有节点都显示已中）
  const idx = participants.value.findIndex(p => p.id === person.id)
  if (idx !== -1) {
    participants.value[idx].drawn = true
  }
  winners.value.push(person)
  winnerId.value = person.id

  // 弹窗
  currentWinner.value = person
  showWinnerModal.value = true

  setTimeout(() => {
    drawingInProgress.value = false
    startFlicker()
  }, 800)
}

function handleReset() {
  if (drawingInProgress.value) return
  participants.value = participants.value.map(p => ({ ...p, drawn: false }))
  winners.value = []
  winnerId.value = null
  highlightIndex.value = -1
  showWinnerModal.value = false
  currentWinner.value = null
  globeRX.value = -8
  globeRY.value = 0
}

onMounted(() => { startFlicker() })
onBeforeUnmount(() => { stopFlicker() })
</script>

<style scoped>
/* 科技感背景 */
.lottery-page {
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(1200px 800px at 20% 20%, rgba(0, 255, 255, 0.12), transparent 40%),
              radial-gradient(900px 600px at 80% 30%, rgba(140, 0, 255, 0.12), transparent 50%),
              linear-gradient(180deg, #0b0f1a 0%, #060912 100%);
  color: #e6f7ff;
  position: relative;
  overflow: hidden;
}

/* 顶部状态栏 */
.status-bar {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  grid-auto-flow: row;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(0, 255, 255, 0.25);
  border-radius: 12px;
  background: rgba(10, 18, 32, 0.35);
  backdrop-filter: blur(8px);
  box-shadow: 0 0 24px rgba(0, 255, 255, 0.15), inset 0 0 24px rgba(0, 255, 255, 0.06);
}
.status-item .label {
  font-size: 12px;
  color: #7adfff;
  letter-spacing: 0.4px;
}
.status-item .value {
  font-size: 14px;
  color: #d5f9ff;
}

/* 3D 球体区域 */
.globe-wrap {
  margin-top: 96px;
  height: 520px;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(15, 24, 40, 0.6), rgba(10, 16, 28, 0.6));
  backdrop-filter: blur(6px);
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.12), inset 0 0 30px rgba(0, 255, 255, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
}
.globe {
  width: 520px;
  height: 520px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 120ms linear; /* 平滑，但主要由 tween 控制 */
}
.globe.spin {
  animation: globeSpin 20s linear infinite;
}
@keyframes globeSpin {
  0%   { transform: rotateX(-8deg) rotateY(0deg); }
  100% { transform: rotateX(-8deg) rotateY(360deg); }
}

/* 球面上的节点卡片 */
.node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  width: 120px;      /* 调小宽度 */
  height: 170px;     /* 调小高度 */
  margin: -85px 0 0 -60px; /* 以自身中心定位：-height/2 与 -width/2 */
  border-radius: 16px;
  background: rgba(8, 14, 26, 0.55);
  border: 1px solid rgba(0, 255, 255, 0.18);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.05);
  padding: 12px;
  transition: border-color 240ms ease, box-shadow 240ms ease, transform 240ms ease, opacity 240ms ease;
}
.node.highlight {
  border-color: rgba(0, 255, 255, 0.55);
  box-shadow: 0 0 18px rgba(0, 255, 255, 0.35), inset 0 0 20px rgba(0, 255, 255, 0.22);
  transform: translateZ(1px);
}
.node.winner {
  animation: winnerPulse 800ms ease-out 1, winnerGlow 1400ms ease-out 1;
}
@keyframes winnerPulse {
  0% { transform: translateZ(1px) scale(1); }
  40% { transform: translateZ(1px) scale(1.08); }
  100% { transform: translateZ(1px) scale(1.02); }
}
@keyframes winnerGlow {
  0% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
  100% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.35), inset 0 0 28px rgba(255, 215, 0, 0.35); }
}

/* 头像与名称样式（沿用原有） */
.avatar-wrap {
  width: 100%;
  height: 100px; /* 原 130px -> 100px */
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: rgba(20, 32, 52, 0.55);
  border: 1px solid rgba(0, 255, 255, 0.15);
}
.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;   /* 由 cover 改为 contain，完整展示图片 */
  padding: 6px;          /* 留白，让缩小更明显 */
  filter: saturate(1.05) contrast(1.02);
  background: radial-gradient(180px 120px at 50% 50%, rgba(0, 255, 255, 0.08), transparent 60%);
}
.avatar-wrap .glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(240px 140px at 20% 20%, rgba(0, 255, 255, 0.22), transparent 60%);
  pointer-events: none;
}
.name {
  margin-top: 8px;       /* 原 10px -> 8px */
  font-size: 13px;       /* 可视情况稍微缩小文字 */
  text-align: center;
  font-weight: 600;
  color: #d9f6ff;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.25);
}
.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 999px;
  color: #001a1a;
  background: linear-gradient(90deg, #5fffe0, #23ffd3);
  box-shadow: 0 0 12px rgba(35, 255, 211, 0.35);
}
.node.drawn {
  filter: grayscale(0.2);
}

/* 中奖弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 10, 20, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9990;
}
.modal {
  width: 360px;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(0, 255, 255, 0.25);
  background: rgba(10, 18, 32, 0.9);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.2), inset 0 0 24px rgba(0, 255, 255, 0.08);
  text-align: center;
  color: #dffbff;
}
.modal-title {
  font-size: 18px;
  margin-bottom: 12px;
  color: #8af8ff;
  letter-spacing: 1px;
}
.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.modal-avatar {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 255, 0.25);
  box-shadow: 0 0 18px rgba(0, 255, 255, 0.2);
}
.modal-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.modal-name {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 0 12px rgba(0, 255, 255, 0.35);
}
.modal-actions {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}

/* 节点缩到 60x60，保持中心定位 */
.node {

  width: 60px;
  height: 60px;
  margin: -30px 0 0 -30px; /* 以中心定位 */
  padding: 6px;            /* 内边距略缩 */
  border-radius: 10px;
}

/* 头像占满卡片，完整显示图片（不裁切） */
.avatar-wrap {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: rgba(20, 32, 52, 0.45);
  border: 1px solid rgba(0, 255, 255, 0.15);
}
.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;  /* 保证在小尺寸下看清完整头像 */
  padding: 2px;         /* 留出一点边距 */
  filter: saturate(1.05) contrast(1.02);
}

/* 小尺寸下隐藏名称，避免拥挤；如需保留可改为 font-size: 10px; */
.name {
  display: none;
}

/* 已中徽标缩小，贴角显示 */
.badge {
  top: 4px;
  right: 4px;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 999px;
}

/* 高亮与赢家动画可保持原样 */

/* 悬浮控制面板：固定在右侧，垂直居中 */
.control-dock {
  position: fixed;
  top: 88%;
  right: 24px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  padding: 14px 12px;
  border: 1px solid rgba(0, 255, 255, 0.25);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(10, 18, 32, 0.65), rgba(8, 14, 26, 0.55));
  backdrop-filter: blur(8px);
  box-shadow: 0 0 24px rgba(0, 255, 255, 0.18), inset 0 0 24px rgba(0, 255, 255, 0.08);
  z-index: 1000;
}

/* Element Plus 按钮的科幻风样式（使用 :deep 以作用到子组件） */
.control-dock :deep(.el-button.ep-btn) {
  width: 140px;
  height: 42px;
  font-weight: 600;
  letter-spacing: 1px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.35);
  color: #eaffff;
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.22), rgba(102, 0, 255, 0.22));
  box-shadow: 0 6px 16px rgba(0, 255, 255, 0.18), inset 0 0 16px rgba(0, 255, 255, 0.12);
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
}
.control-dock :deep(.el-button.ep-btn:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(0, 255, 255, 0.28), inset 0 0 20px rgba(0, 255, 255, 0.18);
  filter: brightness(1.06);
}
.control-dock :deep(.el-button.ep-btn.is-disabled),
.control-dock :deep(.el-button.ep-btn.is-disabled:hover) {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
  cursor: not-allowed;
}

/* 主按钮与次按钮区分配色 */
.control-dock :deep(.el-button.ep-btn.primary) {
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.28), rgba(102, 0, 255, 0.28));
}
.control-dock :deep(.el-button.ep-btn.ghost) {
  background: linear-gradient(90deg, rgba(10, 18, 32, 0.45), rgba(10, 18, 32, 0.45));
  color: #c8f7ff;
  border-color: rgba(0, 255, 255, 0.28);
}

/* 提示文字 */
.hint {
  margin-top: 4px;
  color: #90f7ff;
  font-size: 12px;
  opacity: 0.9;
  text-align: center;
}
</style>