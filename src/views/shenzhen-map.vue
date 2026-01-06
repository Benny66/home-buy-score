<template>
  <div class="map-container">  
    <div ref="chartRef" class="chart"></div>

    <!-- 新增：移动端下方平移按钮 -->
    <div class="mobile-controls" v-if="isMobile">
      <button class="btn" @click="panMap('left')">左移</button>
      <button class="btn" @click="panMap('right')">右移</button>
    </div>
  </div>
</template>

<script setup>
/**
 * 依赖：
 * - ECharts（地理坐标系）
 * 数据：
 * - ./assets/area/shenzhen.json 作为深圳GeoJSON
 * - ./doc/2026年深圳新开楼盘预测.json 楼盘点数据
 */
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as echarts from 'echarts'
import shenzhenGeo from '@/assets/area/shenzhen.json'
import buildingsRaw from '@/doc/2026年深圳新开楼盘预测.json'
// 修改导入方式为动态加载
async function loadData() {
  try {
    // 动态加载地图数据
    const shenzhenResponse = await fetch('/assets/area/shenzhen.json')
    const shenzhenGeo = await shenzhenResponse.json()
    
    // 动态加载楼盘数据
    const buildingsResponse = await fetch('/assets/area/2026年深圳新开楼盘预测.json')
    const buildingsRaw = await buildingsResponse.json()
    
    return { shenzhenGeo, buildingsRaw }
  } catch (error) {
    console.error('加载数据失败:', error)
    return null
  }
}
// 分类与颜色映射（可按需调整）
const categoryColor = {
  '住宅': '#e74c3c',
  '公寓': '#3498db',
  '办公': '#9b59b6',
  '酒店': '#f1c40f',
  '商业/其他': '#2ecc71'
}
const categories = Object.keys(categoryColor)

const chartRef = ref(null)
let chart
let baseSeries = []  // 新增：缓存基础系列，用于防拥挤重算

// 新增：移动端检测
const isMobile = ref(false)
function updateIsMobile() {
  isMobile.value = window.innerWidth <= 768
}

function getPrimaryCategory(propertyType) {
  // 优先级：住宅 > 公寓 > 办公 > 酒店 > 商业/其他
  const text = (propertyType || '').toString()
  if (text.includes('住宅')) return '住宅'
  if (text.includes('公寓')) return '公寓'
  if (text.includes('办公')) return '办公'
  if (text.includes('酒店')) return '酒店'
  return '商业/其他'
}

function toPointData(record) {
  // 坐标格式："lng,lat" -> [lng, lat]
  const [lngStr, latStr] = (record.coordinates || '').split(',')
  const lng = Number(lngStr)
  const lat = Number(latStr)
  return {
    name: record.building_name,
    value: [lng, lat],
    info: {
      行政区: record.administrative_district,
      片区: record.area,
      物业类型: record.property_type,
      户型参考: record.reference_house_type,
      备注: record.remarks
    }
  }
}

function buildSeries(data) {
  const grouped = new Map()
  for (const cat of categories) grouped.set(cat, [])

  for (const item of data) {
    const cat = getPrimaryCategory(item.property_type)
    grouped.get(cat).push(toPointData(item))
  }

  // 生成每类一个 scatter 系列（根据是否移动端调整尺寸与标签样式）
  const series = categories.map(cat => ({
    name: cat,
    type: 'scatter',
    coordinateSystem: 'geo',
    data: grouped.get(cat),
    symbolSize: isMobile.value ? 8 : 10,
    itemStyle: { color: categoryColor[cat] },
    label: {
      show: true,
      formatter: p => p.name || '',
      position: 'right',
      offset: isMobile.value ? [4, 0] : [6, 0],
      color: '#666',
      fontSize: isMobile.value ? 9 : 10
    },
    emphasis: {
      scale: true,
      label: { show: true }
    }
  }))
  return series
}

// 新增：标签防拥挤（移动端阈值更保守）
function applyDeclutter() {
  if (!chart) return
  const threshold = isMobile.value ? 20 : 18
  const occupied = []

  const decluttered = baseSeries.map(s => {
    const newData = s.data.map(item => {
      const px = chart.convertToPixel('geo', item.value)
      let show = true
      for (const p of occupied) {
        if (Math.abs(px[0] - p[0]) < threshold && Math.abs(px[1] - p[1]) < threshold) {
          show = false
          break
        }
      }
      if (show) occupied.push(px)
      return {
        ...item,
        label: {
          show,
          formatter: item.label?.formatter || ((p) => p.name || ''),
          position: item.label?.position || 'right',
          offset: item.label?.offset || (isMobile.value ? [4, 0] : [6, 0]),
          color: item.label?.color || '#666',
          fontSize: item.label?.fontSize || (isMobile.value ? 9 : 10)
        }
      }
    })
    return { ...s, data: newData }
  })

  chart.setOption({ series: decluttered }, false)
}

// 新增：地图平移（左右按钮）
function panMap(direction) {
  if (!chart) return
  const opt = chart.getOption()
  const currentZoom = opt?.geo?.[0]?.zoom || 1
  // 步长按缩放动态调整，缩放越大，像素位移稍减，保证平移“视觉合理”
  const baseStep = isMobile.value ? 80 : 60
  const step = Math.max(30, Math.round(baseStep / Math.sqrt(currentZoom)))
  const dx = direction === 'left' ? -step : step
  chart.dispatchAction({
    type: 'geoRoam',
    // componentType 不填也可，由 geoRoam 推断；若填可用：componentType: 'geo'
    // name: 'Shenzhen', // 若有多个 geo，可指定名字，这里单个 geo 可省略
    // 只做平移：dx 像素水平位移
    dx,
    dy: 0
  })
}

async function initChart() {
  if (!chartRef.value) return
  const data = await loadData()
  if (!data) return
  const { shenzhenGeo, buildingsRaw } = data

  chart = echarts.init(chartRef.value)

  // 注册地图
  echarts.registerMap('Shenzhen', shenzhenGeo)

  updateIsMobile() // 初始化移动端状态

  baseSeries = buildSeries(buildingsRaw.data || [])
  const option = {
    backgroundColor: '#ffffff',
    title: {
      text: buildingsRaw.title || '2026年深圳新开楼盘预测',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: isMobile.value ? 14 : 16
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: params => {
        const d = params.data
        if (!d || !d.info) return params.name || ''
        const info = d.info
        return [
          `<div style="min-width:${isMobile.value ? 180 : 220}px;">`,
          `<div style="font-weight:bold;margin-bottom:6px;">${params.name}</div>`,
          `<div>行政区：${info.行政区}</div>`,
          `<div>片区：${info.片区}</div>`,
          `<div>物业类型：${info.物业类型}</div>`,
          `<div>户型参考：${info.户型参考}</div>`,
          `<div>备注：${info.备注}</div>`,
          `</div>`
        ].join('')
      }
    },
    legend: {
      orient: isMobile.value ? 'vertical' : 'horizontal',
      top: isMobile.value ? 'middle' : 40,
      right: isMobile.value ? 8 : 'auto',
      left: isMobile.value ? 'auto' : 'center',
      itemWidth: isMobile.value ? 10 : 14,
      itemHeight: isMobile.value ? 10 : 14,
      textStyle: { fontSize: isMobile.value ? 11 : 12 },
      data: categories
    },
    geo: {
      map: 'Shenzhen',
      roam: true,
      zoom: isMobile.value ? 2.0 : 1.8, // 移动端进一步放大
      label: { show: false },
      itemStyle: {
        areaColor: '#f5f7fa',
        borderColor: '#dcdfe6',
        borderWidth: 1
      },
      emphasis: {
        itemStyle: { areaColor: '#e6f7ff' }
      }
    },
    series: baseSeries
  }

  chart.setOption(option)

  // 初次应用防拥挤
  applyDeclutter()

  // 地图拖拽/缩放时，重算标签可见性
  chart.on('georoam', () => {
    applyDeclutter()
  })

  // 响应式
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  if (chart) {
    updateIsMobile()
    // 移动端状态变化时，重建基础 series 并更新
    baseSeries = buildSeries(buildingsRaw.data || [])
    chart.setOption({
      legend: {
        orient: isMobile.value ? 'vertical' : 'horizontal',
        top: isMobile.value ? 'middle' : 40,
        right: isMobile.value ? 8 : 'auto',
        left: isMobile.value ? 'auto' : 'center',
        itemWidth: isMobile.value ? 10 : 14,
        itemHeight: isMobile.value ? 10 : 14,
        textStyle: { fontSize: isMobile.value ? 11 : 12 }
      },
      geo: {
        zoom: isMobile.value ? 2.0 : 1.8
      },
      title: {
        textStyle: { fontSize: isMobile.value ? 14 : 16 }
      },
      series: baseSeries
    }, false)

    chart.resize()
    // 重新计算标签拥挤情况
    applyDeclutter()
  }
}

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column; /* 新增：按钮在图下方 */
}
.chart {
  flex: 1;
  min-height: 520px;
}

/* 新增：移动端更高的视窗高度与控件样式 */
@media (max-width: 768px) {
  .chart {
    min-height: 70vh;
  }
  .mobile-controls {
    display: flex;
    gap: 12px;
    justify-content: center;
    padding: 10px 12px 14px;
    border-top: 1px solid #eee;
    background: #fff;
  }
  .mobile-controls .btn {
    padding: 8px 14px;
    font-size: 14px;
    color: #333;
    background: #f5f7fa;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .mobile-controls .btn:active {
    background: #e9eef5;
  }
}
</style>