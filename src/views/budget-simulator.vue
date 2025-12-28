<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'     
import * as echarts from 'echarts'
import {
  calcEqualPIMonthly,
  buildPressureSeriesByYear
} from '@/utils/loan-calculator'
import BudgetSimulatorForm from '@/components/BudgetSimulatorForm.vue'
import { getDeviceInfo, addResizeListener } from '@/utils/device-utils'

// 设备响应式
const isSmallScreen = ref(false)
const deviceInfo = ref({})

// 处理表单变化
function handleFormChange(normalizedData) {
  // 更新响应式数据
  principal.value = normalizedData.principal / 10000
  annualRate.value = normalizedData.annualRate
  years.value = normalizedData.years
  monthlyIncome.value = normalizedData.monthlyIncome / 10000
  repaymentType.value = normalizedData.repaymentType
}

// 原有的响应式数据
const principal = ref(100)
const annualRate = ref(4.2)
const years = ref(30)
const monthlyIncome = ref(2.5)
const repaymentType = ref('equalPrincipalInterest')

// 错误/边界保护
const normalizedPrincipal = computed(() => Math.max(0, (Number(principal.value) || 0)) * 10000)
const normalizedIncome = computed(() => Math.max(1, (Number(monthlyIncome.value) || 0)) * 10000)
const normalizedRate = computed(() => Math.max(0, Number(annualRate.value) || 0))
const normalizedYears = computed(() => Math.min(30, Math.max(1, Number(years.value) || 1)))

// 风险事件列表
const events = ref([])

// 新增：年份选择器相关
const selectedYear = ref(1)
const selectedEventType = ref('rate')
const selectedEventValue = ref(0)

// 新增：多场景对比相关
const selectedScenarios = ref(new Set())
const customWarningThreshold = ref(30) // 用户自定义预警线

// 新增：场景预览相关
const previewScenario = ref(null)
const previewPosition = ref({ x: 0, y: 0 })
const showPreview = ref(false)

// 新增：自定义场景保存相关
const customScenarios = ref([])
const showSaveDialog = ref(false)
const newScenarioName = ref('')

// 新增：场景后果计算
function calculateScenarioImpact(scenario) {
  const tempEvents = scenario.events.map(event => {
    if (event.type === 'rate') {
      return { year: event.year, rateDeltaPct: event.value }
    } else if (event.type === 'income-pct') {
      return { year: event.year, incomeDeltaPct: event.value }
    } else if (event.type === 'income-abs') {
      return { year: event.year, incomeDeltaAbs: event.value }
    }
    return null
  }).filter(Boolean)
  const result = buildPressureSeriesByYear({
    principal: normalizedPrincipal.value,
    baseAnnualRate: normalizedRate.value,
    years: normalizedYears.value,
    baseMonthlyIncome: normalizedIncome.value,
    events: tempEvents,
    repaymentType: repaymentType.value
  })

  // 计算平均影响
  const avgRatio = result.details.reduce((sum, d) => sum + d.ratio, 0) / result.details.length
  const maxRatio = Math.max(...result.details.map(d => d.ratio))
  const monthlyPayChange = result.details[0]?.monthlyPay - (result.details[0]?.monthlyPay / (1 + (tempEvents.find(e => e.rateDeltaPct)?.rateDeltaPct || 0) / 100))

  return {
    avgRatio: (avgRatio * 100).toFixed(1),
    maxRatio: (maxRatio * 100).toFixed(1),
    monthlyPayChange: Math.round(monthlyPayChange || 0),
    riskLevel: calculateRiskLevel(maxRatio)
  }
}

// 新增：风险等级计算
function calculateRiskLevel(maxRatio) {
  if (maxRatio >= 0.5) return 'high'
  if (maxRatio >= 0.4) return 'warning'
  return 'low'
}

// 新增：获取风险等级标签
function getRiskLabel(level) {
  const labels = {
    high: { text: '高风险', color: '#ff4d4f', bgColor: '#fff2f0' },
    warning: { text: '预警', color: '#faad14', bgColor: '#fffbe6' },
    low: { text: '低风险', color: '#52c41a', bgColor: '#f6ffed' }
  }
  return labels[level] || labels.low
}

// 新增：预设场景（包含高频真实场景和压力测试套餐）
const presetScenarios = ref([
  {
    name: 'LPR轻微上涨',
    description: 'LPR上涨0.25个百分点',
    events: [{ year: 5, type: 'rate', value: 0.25 }]
  },
  {
    name: 'LPR大幅上涨',
    description: 'LPR上涨0.5个百分点',
    events: [{ year: 3, type: 'rate', value: 0.5 }]
  },
  {
    name: '收入下降10%',
    description: '收入下降10%',
    events: [{ year: 5, type: 'income-pct', value: -0.1 }]
  },
  {
    name: '收入下降20%',
    description: '收入下降20%',
    events: [{ year: 10, type: 'income-pct', value: -0.2 }]
  },
  {
    name: '收入减少3000元',
    description: '月收入减少3000元',
    events: [{ year: 2, type: 'income-abs', value: -3000 }]
  },
  {
    name: '双重打击',
    description: 'LPR上涨0.3% + 收入下降15%',
    events: [
      { year: 4, type: 'rate', value: 0.3 },
      { year: 4, type: 'income-pct', value: -0.15 }
    ]
  },
  // 新增高频真实场景
  {
    name: '收入断供3个月',
    description: '连续3个月无收入，第4个月恢复',
    events: [
      { year: 3, type: 'income-abs', value: -normalizedIncome.value },
      { year: 3, type: 'income-abs', value: -normalizedIncome.value },
      { year: 3, type: 'income-abs', value: -normalizedIncome.value }
    ]
  },
  {
    name: '新增育儿支出',
    description: '月支出增加5000元',
    events: [{ year: 2, type: 'income-abs', value: -5000 }]
  },
  {
    name: '固定转LPR浮动',
    description: '利率由4.5%转为LPR+0.3%',
    events: [{ year: 1, type: 'rate', value: -0.2 }] // 假设当前LPR为4.3%
  },
  // 新增压力测试套餐
  {
    name: '经济下行套餐',
    description: 'LPR涨0.5% + 收入降15% + 支出增20%',
    events: [
      { year: 3, type: 'rate', value: 0.5 },
      { year: 3, type: 'income-pct', value: -0.15 },
      { year: 3, type: 'income-abs', value: -normalizedIncome.value * 0.2 }
    ]
  }
])

// 新增：年份选项
const yearOptions = computed(() => {
  const options = []
  for (let i = 1; i <= normalizedYears.value; i++) {
    options.push(i)
  }
  return options
})

// 新增：场景悬浮预览
function showScenarioPreview(scenario, event) {
  previewScenario.value = scenario
  previewPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  showPreview.value = true
}

function hideScenarioPreview() {
  showPreview.value = false
  previewScenario.value = null
}

function applyPreviewScenario() {
  if (previewScenario.value) {
    addPresetScenario(previewScenario.value)
  }
  hideScenarioPreview()
}

// 新增：多场景对比
function toggleScenarioSelection(scenario, index) {
  const key = `${index}-${scenario.name}`
  if (selectedScenarios.value.has(key)) {
    selectedScenarios.value.delete(key)
  } else {
    selectedScenarios.value.add(key)
  }
}

function compareSelectedScenarios() {
  if (selectedScenarios.value.size < 2) return

  // 清空当前事件，添加选中的场景事件
  events.value = []
  presetScenarios.value.forEach((scenario, index) => {
    const key = `${index}-${scenario.name}`
    if (selectedScenarios.value.has(key)) {
      scenario.events.forEach(event => {
        events.value.push({ ...event })
      })
    }
  })

  recalc()
}

// 新增：自定义场景保存
function saveCustomScenario() {
  if (!newScenarioName.value.trim() || events.value.length === 0) return

  customScenarios.value.push({
    name: newScenarioName.value,
    description: '自定义场景',
    events: [...events.value]
  })

  newScenarioName.value = ''
  showSaveDialog.value = false
}

function removeCustomScenario(index) {
  customScenarios.value.splice(index, 1)
}

// 原有的事件管理函数
function addEvent() {
  events.value.push({
    year: Number(selectedYear.value),
    type: selectedEventType.value,
    value: Number(selectedEventValue.value)
  })
  selectedEventValue.value = 0
}

function addPresetScenario(scenario) {
  scenario.events.forEach(event => {
    events.value.push({ ...event })
  })
  recalc()
}

function removeEvent(idx) {
  events.value.splice(idx, 1)
}

function clearAllEvents() {
  events.value = []
  selectedScenarios.value.clear()
}

// 将事件转为构建器需要的结构
const normalizedEvents = computed(() => {
  return events.value.map(e => {
    if (e.type === 'rate') {
      return { year: Number(e.year), rateDeltaPct: Number(e.value) }
    } else if (e.type === 'income-pct') {
      return { year: Number(e.year), incomeDeltaPct: Number(e.value) }
    } else if (e.type === 'income-abs') {
      return { year: Number(e.year), incomeDeltaAbs: Number(e.value) }
    }
    return null
  }).filter(Boolean)
})

// 生成主场景与对比场景
const seriesData = ref(null)

function recalc() {
  const base = buildPressureSeriesByYear({
    principal: normalizedPrincipal.value,
    baseAnnualRate: normalizedRate.value,
    years: normalizedYears.value,
    baseMonthlyIncome: normalizedIncome.value,
    events: normalizedEvents.value,
    repaymentType: repaymentType.value
  })
  const baseline = buildPressureSeriesByYear({
    principal: normalizedPrincipal.value,
    baseAnnualRate: normalizedRate.value,
    years: normalizedYears.value,
    baseMonthlyIncome: normalizedIncome.value,
    events: [],
    repaymentType: repaymentType.value
  })

  seriesData.value = {
    baseline,
    scenario: base
  }
  renderChart()
}

// ECharts 实例和相关函数保持不变...
let chartInstance = null
const chartContainer = ref(null)

function updateDeviceInfo() {
  deviceInfo.value = getDeviceInfo()
  isSmallScreen.value = deviceInfo.value.isMobile || deviceInfo.value.screenSize === 'sm'
}

function handleResize(info) {
  const wasMobile = isSmallScreen.value
  deviceInfo.value = info
  isSmallScreen.value = info.isMobile || info.screenSize === 'sm'
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  updateDeviceInfo()
  nextTick(() => {
    if (chartContainer.value) {
      chartInstance = echarts.init(chartContainer.value)
      window.addEventListener('resize', handleResize)
      recalc()
    }
  })
  addResizeListener(handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})

function findCriticalPoints(details) {
  const points = []
  for (let i = 1; i < details.length; i++) {
    const prev = details[i - 1]
    const curr = details[i]
    if (prev.ratio < customWarningThreshold.value / 100 && curr.ratio >= customWarningThreshold.value / 100) {
      points.push({
        year: curr.year,
        monthlyPay: curr.monthlyPay,
        ratio: curr.ratio,
        remainingPrincipal: curr.remainingPrincipal
      })
    }
  }
  return points
}

function renderChart() {
  if (!chartInstance || !seriesData.value) return

  const { baseline, scenario } = seriesData.value
  const criticalPoints = findCriticalPoints(scenario.details)
  const exceedAreaData = scenario.details.map((detail, index) => {
    return detail.ratio >= customWarningThreshold.value / 100 ? [detail.year, detail.ratio * 100] : [detail.year, 0]
  })

  const maxMonthlyPay = Math.max(
    ...scenario.details.map(d => d.monthlyPay),
    ...baseline.details.map(d => d.monthlyPay)
  )
  const maxRatio = Math.max(
    ...scenario.details.map(d => d.ratio * 100),
    ...baseline.details.map(d => d.ratio * 100),
    customWarningThreshold.value + 10
  )

  const option = {
    title: {
      text: `月供压力趋势分析 - ${repaymentType.value === 'equalPrincipal' ? '等额本金' : '等额本息'}`,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const yearData = params.find(param => param.seriesName === '当前场景')
        if (!yearData) return ''
        
        const year = yearData.value[0]
        const scenarioDetail = scenario.details.find(d => d.year === year)
        const baselineDetail = baseline.details.find(d => d.year === year)
        
        if (!scenarioDetail) return ''

        let result = `<div style="font-weight: bold; margin-bottom: 8px;">第 ${year} 年</div>`
        result += `<div style="color: #5470c6; font-weight: 500; margin-bottom: 6px;">当前场景</div>`
        result += `<div style="margin-left: 10px;">`
        result += `月供: <span style="float: right;">${Math.round(scenarioDetail.monthlyPay).toLocaleString()} 元</span><br/>`
        result += `占比: <span style="float: right;">${(scenarioDetail.ratio * 100).toFixed(1)}%</span><br/>`
        result += `剩余本金: <span style="float: right;">${Math.round(scenarioDetail.remainingPrincipal).toLocaleString()} 元</span><br/>`
        result += `年利率: <span style="float: right;">${scenarioDetail.annualRate.toFixed(2)}%</span><br/>`
        result += `月收入: <span style="float: right;">${Math.round(scenarioDetail.monthlyIncome).toLocaleString()} 元</span>`
        result += `</div><br/>`

        result += `<div style="color: #91cc75; font-weight: 500; margin-bottom: 6px;">无风险基线</div>`
        result += `<div style="margin-left: 10px;">`
        result += `月供: <span style="float: right;">${Math.round(baselineDetail.monthlyPay).toLocaleString()} 元</span><br/>`
        result += `占比: <span style="float: right;">${(baselineDetail.ratio * 100).toFixed(1)}%</span><br/>`
        result += `剩余本金: <span style="float: right;">${Math.round(baselineDetail.remainingPrincipal).toLocaleString()} 元</span>`
        result += `</div>`

        return result
      }
    },
    legend: {
      data: ['无风险基线', '当前场景', '超标区域', '当前月供', '基线月供', '自定义预警线'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      name: '贷款年限（年）',
      data: scenario.x,
      axisLine: {
        lineStyle: {
          color: '#666'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '月供占收入比（%）',
        min: 0,
        max: maxRatio,
        axisLabel: {
          formatter: '{value}%'
        },
        axisLine: {
          lineStyle: {
            color: '#666'
          }
        },
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      {
        type: 'value',
        name: '月供金额（元）',
        min: 0,
        max: maxMonthlyPay,
        axisLabel: {
          formatter: function(value) {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万'
            }
            return value.toLocaleString()
          }
        },
        axisLine: {
          lineStyle: {
            color: '#ff7f50'
          }
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '无风险基线',
        type: 'line',
        data: baseline.details.map(detail => [detail.year, detail.ratio * 100]),
        lineStyle: {
          color: '#91cc75',
          width: 2
        },
        itemStyle: {
          color: '#91cc75'
        },
        smooth: true
      },
      {
        name: '当前场景',
        type: 'line',
        data: scenario.details.map(detail => [detail.year, detail.ratio * 100]),
        lineStyle: {
          color: '#5470c6',
          width: 3
        },
        itemStyle: {
          color: '#5470c6'
        },
        smooth: true
      },
      {
        name: '超标区域',
        type: 'line',
        data: exceedAreaData,
        lineStyle: {
          width: 0
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(255, 0, 0, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(255, 0, 0, 0.1)'
            }]
          }
        },
        stack: '总量',
        emphasis: {
          disabled: true
        }
      },
      {
        name: '当前月供',
        type: 'line',
        yAxisIndex: 1,
        data: scenario.details.map(detail => [detail.year, detail.monthlyPay]),
        lineStyle: {
          color: '#ff7f50',
          width: 2,
          type: repaymentType.value === 'equalPrincipal' ? 'solid' : 'dashed'
        },
        itemStyle: {
          color: '#ff7f50'
        },
        smooth: true
      },
      {
        name: '基线月供',
        type: 'line',
        yAxisIndex: 1,
        data: baseline.details.map(detail => [detail.year, detail.monthlyPay]),
        lineStyle: {
          color: '#73c0de',
          width: 2,
          type: repaymentType.value === 'equalPrincipal' ? 'solid' : 'dashed'
        },
        itemStyle: {
          color: '#73c0de'
        },
        smooth: true
      },
      {
        name: '临界点',
        type: 'scatter',
        data: criticalPoints.map(point => [point.year, point.ratio * 100]),
        symbol: 'diamond',
        symbolSize: 12,
        itemStyle: {
          color: '#ff0000',
          borderColor: '#fff',
          borderWidth: 2
        },
        tooltip: {
          formatter: function (params) {
            const point = criticalPoints.find(p => p.year === params.value[0])
            if (!point) return ''
            return `临界点警告<br/>第 ${point.year} 年<br/>月供: ${Math.round(point.monthlyPay).toLocaleString()} 元<br/>占比: ${(point.ratio * 100).toFixed(1)}%<br/>剩余本金: ${Math.round(point.remainingPrincipal).toLocaleString()} 元`
          }
        }
      },
      {
        name: '自定义预警线',
        type: 'line',
        markLine: {
          data: [
            {
              yAxis: customWarningThreshold.value,
              lineStyle: {
                color: '#faad14',
                type: 'dashed',
                width: 2
              },
              label: {
                formatter: `我的预警线: ${customWarningThreshold.value}%`,
                position: 'end'
              }
            }
          ]
        }
      }
    ]
  }
  chartInstance.setOption(option)
  chartInstance.resize()
}
watch([principal, annualRate, years, monthlyIncome, normalizedEvents, repaymentType, customWarningThreshold], recalc, { deep: true, immediate: true })
</script>

<template>
  <div class="budget-page">
    <div class="layout-container">
      <!-- 左侧：表单区域 -->
      <div class="form-section">
        <BudgetSimulatorForm
          :is-small-screen="isSmallScreen"
          @form-change="handleFormChange"
        />

        <!-- 优化后的风险事件配置 -->
        <section class="events">
          <h3>风险事件配置</h3>

          <!-- 多场景对比控制 -->
          <div class="scenario-controls" v-if="selectedScenarios.size >= 2">
            <button class="compare-btn" @click="compareSelectedScenarios">
              🆚 对比选中场景 ({{ selectedScenarios.size }}个)
            </button>
          </div>

          <!-- 预设场景 -->
          <div class="preset-scenarios">
            <h4>常用场景</h4>
            <div class="scenario-list">
              <div
                v-for="(scenario, index) in presetScenarios"
                :key="index"
                class="scenario-item"
                :class="{ selected: selectedScenarios.has(`${index}-${scenario.name}`) }"
                @click="addPresetScenario(scenario)"
                @mouseenter="showScenarioPreview(scenario, $event)"
                @mouseleave="hideScenarioPreview"
              >
                <div class="scenario-header">
                  <input
                    type="checkbox"
                    :checked="selectedScenarios.has(`${index}-${scenario.name}`)"
                    @click.stop="toggleScenarioSelection(scenario, index)"
                    class="scenario-checkbox"
                  />
                  <div class="scenario-name">{{ scenario.name }}</div>
                  <span
                    class="risk-tag"
                    :style="{
                      backgroundColor: getRiskLabel(calculateScenarioImpact(scenario).riskLevel).bgColor,
                      color: getRiskLabel(calculateScenarioImpact(scenario).riskLevel).color
                    }"
                  >
                    {{ getRiskLabel(calculateScenarioImpact(scenario).riskLevel).text }}
                  </span>
                </div>
                <div class="scenario-desc">{{ scenario.description }}</div>
                <div class="scenario-impact">
                  <div class="impact-title">场景影响</div>
                  <div class="impact-details">
                    <span>月供占比 → {{ calculateScenarioImpact(scenario).avgRatio }}%</span>
                    <span>月供变化 → {{ calculateScenarioImpact(scenario).monthlyPayChange > 0 ? '+' : '' }}{{ calculateScenarioImpact(scenario).monthlyPayChange }}元/月</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 我的自定义场景 -->
          <div class="custom-scenarios" v-if="customScenarios.length > 0">
            <h4>我的场景</h4>
            <div class="scenario-list">
              <div
                v-for="(scenario, index) in customScenarios"
                :key="'custom-' + index"
                class="scenario-item custom"
                @click="addPresetScenario(scenario)"
              >
                <div class="scenario-header">
                  <div class="scenario-name">{{ scenario.name }}</div>
                  <button class="delete-custom-btn" @click.stop="removeCustomScenario(index)">
                    ×
                  </button>
                </div>
                <div class="scenario-desc">{{ scenario.description }}</div>
              </div>
            </div>
          </div>

          <!-- 自定义事件添加 -->
          <div class="custom-event-form">
            <h4>自定义事件</h4>
            <div class="form-row">
              <div class="form-group">
                <label>发生年份</label>
                <select v-model="selectedYear">
                  <option
                    v-for="year in yearOptions"
                    :key="year"
                    :value="year"
                  >
                    第 {{ year }} 年
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>事件类型</label>
                <select v-model="selectedEventType">
                  <option value="rate">LPR 浮动（百分比点）</option>
                  <option value="income-pct">收入按比例变化</option>
                  <option value="income-abs">收入绝对变化（元）</option>
                </select>
              </div>

              <div class="form-group">
                <label>变化值</label>
                <input
                  type="number"
                  v-model.number="selectedEventValue"
                  :step="selectedEventType === 'rate' ? 0.1 : selectedEventType === 'income-pct' ? 0.01 : 100"
                />
                <span class="value-hint">
                  {{ selectedEventType === 'rate' ? '个百分点' : selectedEventType === 'income-pct' ? '比例（如-0.1表示-10%）' : '元' }}
                </span>
                <div v-if="selectedEventValue !== 0" class="impact-preview">
                  预计月供占比变为 {{ calculateScenarioImpact({ events: [{ year: selectedYear, type: selectedEventType, value: selectedEventValue }] }).avgRatio }}%
                </div>
              </div>

              <div class="form-actions">
                <button class="add-btn" @click="addEvent">添加事件</button>
                <button
                  class="save-scenario-btn"
                  @click="showSaveDialog = true"
                  :disabled="events.length === 0"
                >
                  保存为我的场景
                </button>
              </div>
            </div>
          </div>

          <!-- 事件列表 -->
          <div class="event-list-section">
            <div class="section-header">
              <h4>已配置事件</h4>
              <button v-if="events.length > 0" class="clear-btn" @click="clearAllEvents">
                清空所有
              </button>
            </div>

            <div v-if="events.length === 0" class="empty-state">
              <p>暂无风险事件配置</p>
              <p class="hint">点击上方预设场景或自定义添加事件</p>
            </div>

            <div v-else class="event-list">
              <div class="event-item" v-for="(e, idx) in events" :key="idx">
                <div class="event-info">
                  <span class="event-year">第 {{ e.year }} 年</span>
                  <span class="event-type">
                    {{
                      e.type === 'rate' ? 'LPR浮动' :
                      e.type === 'income-pct' ? '收入比例变化' :
                      '收入绝对变化'
                    }}
                  </span>
                  <span class="event-value" :class="{ negative: e.value < 0 }">
                    {{ e.value > 0 ? '+' : '' }}{{ e.value }}
                    {{
                      e.type === 'rate' ? '个百分点' :
                      e.type === 'income-pct' ? '' :
                      '元'
                    }}
                  </span>
                </div>
                <button class="remove-btn" @click="removeEvent(idx)">删除</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧：图表区域 -->
      <div class="chart-section">
        <!-- 图表控制栏 -->
        <div class="chart-controls">
          <div class="warning-threshold-control">
            <label>预警线设置：</label>
            <input
              type="number"
              v-model.number="customWarningThreshold"
              min="10"
              max="60"
              class="threshold-input"
            />
            <span>%</span>
          </div>
        </div>

        <!-- ECharts 图表 -->
        <section class="chart">
          <h3>月供压力趋势</h3>
          <div ref="chartContainer" class="chart-box"></div>
          <ul class="legend">
            <li><span class="color-dot safe"></span> 安全线：30%</li>
            <li><span class="color-dot warn"></span> 预警线：{{ customWarningThreshold }}%</li>
            <li><span class="color-dot exceed"></span> 超标区域：>{{ customWarningThreshold }}% 使用红色半透明填充</li>
            <li><span class="color-dot critical"></span> 临界点：菱形标记，悬浮展示详细信息</li>
            <li><span class="color-dot current-pay"></span> 当前月供：橙色虚线，显示实际月供金额</li>
            <li><span class="color-dot baseline-pay"></span> 基线月供：蓝色虚线，显示无风险月供金额</li>
          </ul>
        </section>
      </div>
    </div>

    <!-- 场景预览弹窗 -->
    <div
      v-if="showPreview && previewScenario"
      class="scenario-preview"
      :style="{
        left: previewPosition.x + 'px',
        top: previewPosition.y + 'px'
      }"
      @mouseenter="showPreview = true"
      @mouseleave="hideScenarioPreview"
    >
      <div class="preview-header">
        <h4>场景预览：{{ previewScenario.name }}</h4>
      </div>
      <div class="preview-content">
        <div class="preview-impact">
          <div>月供金额：{{ calculateScenarioImpact(previewScenario).monthlyPayChange > 0 ? '+' : '' }}{{ Math.round(calcEqualPIMonthly(normalizedPrincipal.value, normalizedRate.value, normalizedYears.value) + calculateScenarioImpact(previewScenario).monthlyPayChange).toLocaleString() }} 元/月</div>
          <div>月供占比：{{ calculateScenarioImpact(previewScenario).avgRatio }}%</div>
        </div>
        <div class="preview-actions">
          <!-- <button class="confirm-btn" @click="applyPreviewScenario">确认生效</button>
          <button class="cancel-btn" @click="hideScenarioPreview">取消</button> -->
        </div>
      </div>
    </div>

    <!-- 保存场景弹窗 -->
    <div v-if="showSaveDialog" class="save-dialog-overlay" @click="showSaveDialog = false">
      <div class="save-dialog" @click.stop>
        <h4>保存自定义场景</h4>
        <input
          v-model="newScenarioName"
          placeholder="输入场景名称"
          class="scenario-name-input"
        />
        <div class="dialog-actions">
          <button class="confirm-btn" @click="saveCustomScenario" :disabled="!newScenarioName.trim()">确认</button>
          <button class="cancel-btn" @click="showSaveDialog = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.budget-page {
  max-width: 1600px;
  padding: 16px;
}

.layout-container {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.form-section {
  flex: 0 0 500px;
  min-width: 0;
}

.chart-section {
  flex: 1;
  min-width: 0;
  position: sticky;
  top: 24px;
}

.events {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.chart {
  height: 100%;
}

.chart-box {
  width: 100%;
  height: 500px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

/* 场景控制栏 */
.scenario-controls {
  margin-bottom: 16px;
  padding: 12px;
  background: #e6f7ff;
  border-radius: 6px;
  border: 1px solid #91d5ff;
}

.compare-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.compare-btn:hover {
  background: #40a9ff;
}

/* 场景卡片样式优化 */
.preset-scenarios {
  margin-bottom: 24px;
}

.preset-scenarios h4 {
  margin-bottom: 12px;
  color: #333;
}

.scenario-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.scenario-item {
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.scenario-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.scenario-item.selected {
  border-color: #1890ff;
  background: #f0f8ff;
}

.scenario-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.scenario-checkbox {
  margin: 0;
}
  
.scenario-name {
  font-weight: bold;
  color: #1890ff;
  flex: 1;
}

.risk-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.scenario-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.scenario-impact {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.impact-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.impact-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.impact-details span {
  color: #666;
}

/* 自定义场景 */
.custom-scenarios {
  margin-bottom: 24px;
}

.scenario-item.custom {
  border-color: #52c41a;
}

.delete-custom-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
}

.delete-custom-btn:hover {
  background: #ff7875;
}

/* 自定义事件表单优化 */
.custom-event-form {
  margin-bottom: 24px;
}

.custom-event-form h4 {
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  min-width: 140px;
  flex: 1;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
}

.form-group select,
.form-group input {
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  height: 40px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.value-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  line-height: 1.4;
}

.impact-preview {
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.add-btn:hover {
  background: #40a9ff;
}

.save-scenario-btn {
  padding: 10px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.save-scenario-btn:hover:not(:disabled) {
  background: #73d13d;
}

.save-scenario-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

/* 图表控制栏 */
.chart-controls {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.warning-threshold-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.threshold-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

/* 弹窗样式 */
.scenario-preview {
  position: fixed;
  z-index: 1000;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  min-width: 280px;
  transform: translate(-50%, 10px);
}

.preview-header h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.preview-impact {
  margin-bottom: 16px;
  font-size: 14px;
}

.preview-impact div {
  margin-bottom: 6px;
  color: #666;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.confirm-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
}

.confirm-btn:hover {
  background: #40a9ff;
}

.cancel-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
}

.cancel-btn:hover {
  background: #e6e6e6;
}

/* 保存弹窗样式 */
.save-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-dialog {
  background: white;
  border-radius: 8px;
  padding: 24px;
  min-width: 300px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.save-dialog h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.scenario-name-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.scenario-name-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 事件列表样式保持不变 */
.event-list-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  color: #333;
}

.clear-btn {
  padding: 4px 8px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.clear-btn:hover {
  background: #ff7875;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state .hint {
  font-size: 12px;
  margin-top: 8px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}

.event-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.event-year {
  font-weight: bold;
  color: #1890ff;
}

.event-type {
  color: #666;
}

.event-value.negative {
  color: #ff4d4f;
}

.remove-btn {
  padding: 4px 8px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.remove-btn:hover {
  background: #ff7875;
}

.legend {
  list-style: none;
  padding: 0;
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.legend li {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.safe { background-color: #91cc75; }
.warn { background-color: #fac858; }
.exceed { background-color: rgba(255, 0, 0, 0.3); }
.critical { background-color: #ff0000; }
.current-pay { background-color: #ff7f50; }
.baseline-pay { background-color: #73c0de; }

/* 响应式设计 */
@media (max-width: 1024px) {
  .layout-container {
    flex-direction: column;
    gap: 16px;
  }

  .form-section {
    flex: none;
    width: 100%;
  }

  .chart-section {
    position: static;
    width: 100%;
  }

  .chart-box {
    height: 400px;
  }

  .scenario-list {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .budget-page {
    padding: 12px;
    margin: 16px auto;
  }

  .layout-container {
    gap: 12px;
  }

  .events {
    margin-top: 16px;
    padding: 16px;
  }

  .form-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-group {
    min-width: auto;
  }

  .form-actions {
    flex-direction: column;
  }

  .add-btn, .save-scenario-btn {
    margin-top: 8px;
    height: 44px;
    width: 100%;
  }

  .scenario-list {
    grid-template-columns: 1fr;
  }

  .scenario-header {
    flex-wrap: wrap;
  }

  .risk-tag {
    order: 3;
    margin-top: 4px;
  }

  .event-info {
    flex-direction: column;
    align-items: start;
    gap: 4px;
  }

  .chart-box {
    height: 350px;
  }

  .legend {
    flex-direction: column;
    gap: 8px;
  }

  .scenario-preview {
    position: fixed;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 90%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .form-group select,
  .form-group input {
    height: 44px;
  }

  .add-btn, .save-scenario-btn {
    height: 48px;
    font-size: 16px;
  }

  .chart-box {
    height: 300px;
  }

  .scenario-impact .impact-details {
    flex-direction: column;
  }
}

/* 动画效果 */
.scenario-item {
  transition: all 0.3s ease;
}

.scenario-preview {
  animation: fadeIn 0.2s ease-out;
}

.save-dialog {
  animation: scaleIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 10px);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 闪烁动画用于超标区域 */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.exceed-area-blink {
  animation: blink 1s infinite;
}
</style>