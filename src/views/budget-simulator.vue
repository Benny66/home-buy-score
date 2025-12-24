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
  repaymentType.value = normalizedData.repaymentType // 处理还款方式
}

// 原有的响应式数据（保持兼容性）
const principal = ref(100)
const annualRate = ref(4.2)
const years = ref(30)
const monthlyIncome = ref(2.5)
const repaymentType = ref('equalPrincipalInterest') // 还款方式

// 错误/边界保护（保持不变）
const normalizedPrincipal = computed(() => Math.max(0, (Number(principal.value) || 0)) * 10000)
const normalizedIncome = computed(() => Math.max(1, (Number(monthlyIncome.value) || 0)) * 10000)
const normalizedRate = computed(() => Math.max(0, Number(annualRate.value) || 0))
const normalizedYears = computed(() => Math.min(30, Math.max(1, Number(years.value) || 1)))

// 风险事件列表（保持不变）
const events = ref([])

// 新增：年份选择器相关
const selectedYear = ref(1)
const selectedEventType = ref('rate')
const selectedEventValue = ref(0)

// 新增：预设场景
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
    events: [{ year: 5, type: 'income-pct', value: -0.2 }]
  },
  {
    name: '收入减少3000元',
    description: '月收入减少3000元',
    events: [{ year: 5, type: 'income-abs', value: -3000 }]
  },
  {
    name: '双重打击',
    description: 'LPR上涨0.3% + 收入下降15%',
    events: [
      { year: 4, type: 'rate', value: 0.3 },
      { year: 4, type: 'income-pct', value: -0.15 }
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

function addEvent() {
  events.value.push({
    year: Number(selectedYear.value),
    type: selectedEventType.value,
    value: Number(selectedEventValue.value)
  })
  // 重置表单
  selectedEventValue.value = 0
}

// 新增：添加预设场景
function addPresetScenario(scenario) {
  scenario.events.forEach(event => {
    events.value.push({ ...event })
  })
}

function removeEvent(idx) {
  events.value.splice(idx, 1)
}

// 新增：清空所有事件
function clearAllEvents() {
  events.value = []
}

// 将事件转为构建器需要的结构（保持不变）
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

// 生成主场景与对比场景（保持不变）
const seriesData = ref(null)

function recalc() {
  const base = buildPressureSeriesByYear({
    principal: normalizedPrincipal.value,
    baseAnnualRate: normalizedRate.value,
    years: normalizedYears.value,
    baseMonthlyIncome: normalizedIncome.value,
    events: normalizedEvents.value,
    repaymentType: repaymentType.value // 传递还款方式
  })
  const baseline = buildPressureSeriesByYear({
    principal: normalizedPrincipal.value,
    baseAnnualRate: normalizedRate.value,
    years: normalizedYears.value,
    baseMonthlyIncome: normalizedIncome.value,
    events: [],
    repaymentType: repaymentType.value // 新增：传递还款方式
  })

  seriesData.value = {
    baseline,
    scenario: base
  }
  renderChart()
}

// ECharts 实例
let chartInstance = null
const chartContainer = ref(null)

// 更新设备信息
function updateDeviceInfo() {
  deviceInfo.value = getDeviceInfo()
  isSmallScreen.value = deviceInfo.value.isMobile || deviceInfo.value.screenSize === 'sm'
}

// 窗口大小变化处理
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

  // 等待DOM更新完成后再初始化图表
  nextTick(() => {
    if (chartContainer.value) {
      chartInstance = echarts.init(chartContainer.value)
      window.addEventListener('resize', handleResize)
      // 初始渲染
      recalc()
    }
  })

  // 添加响应式监听
  addResizeListener(handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})

// 检测临界点（月供占比从 <40% 到 >=40% 的年份）
function findCriticalPoints(details) {
  const points = []
  for (let i = 1; i < details.length; i++) {
    const prev = details[i - 1]
    const curr = details[i]
    if (prev.ratio < 0.4 && curr.ratio >= 0.4) {
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

// 完整的 ECharts 图表渲染
function renderChart() {
  if (!chartInstance || !seriesData.value) return

  const { baseline, scenario } = seriesData.value
  const criticalPoints = findCriticalPoints(scenario.details)

  // 构建超标区域数据（>40% 的部分）
  const exceedAreaData = scenario.details.map((detail, index) => {
    return detail.ratio >= 0.4 ? [detail.year, detail.ratio * 100] : [detail.year, 0]
  })

  // 计算月供金额的最大值，用于设置y轴范围
  const maxMonthlyPay = Math.max(
    ...scenario.details.map(d => d.monthlyPay),
    ...baseline.details.map(d => d.monthlyPay)
  )

  const option = {
    title: {
      text: '月供压力趋势分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const year = params[0].axisValue
        const detail = scenario.details.find(d => d.year === year)
        if (!detail) return ''

        let result = `第 ${year} 年<br/>`
        params.forEach(param => {
          if (param.seriesName === '超标区域') return

          const value = param.value[1]
          if (param.seriesName.includes('月供')) {
            result += `${param.marker} ${param.seriesName}: ${Math.round(value).toLocaleString()} 元<br/>`
          } else {
            result += `${param.marker} ${param.seriesName}: ${value.toFixed(1)}%<br/>`
          }
        })

        if (detail) {
          result += `月供: ${Math.round(detail.monthlyPay).toLocaleString()} 元<br/>`
          result += `占比: ${(detail.ratio * 100).toFixed(1)}%<br/>`
          result += `剩余本金: ${Math.round(detail.remainingPrincipal).toLocaleString()} 元`
        }

        return result
      }
    },
    legend: {
      data: ['无风险基线', '当前场景', '超标区域', '当前月供', '基线月供'],
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
        max: Math.max(...scenario.y.map(y => y * 100), 50),
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
        data: baseline.y.map(y => [baseline.x[baseline.y.indexOf(y)], y * 100]),
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
        data: scenario.y.map(y => [scenario.x[scenario.y.indexOf(y)], y * 100]),
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
          type: 'dashed'
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
          type: 'dashed'
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
      }
    ]
  }
  chartInstance.setOption(option)
  chartInstance.resize()
}

watch([principal, annualRate, years, monthlyIncome, normalizedEvents, repaymentType], recalc, { deep: true, immediate: true })
</script>

<template>
  <div class="budget-page">
    <h2>动态预算模拟器</h2>

    <!-- 使用新的基础测算表单组件 -->
    <BudgetSimulatorForm
      :is-small-screen="isSmallScreen"
      @form-change="handleFormChange"
    />

    <!-- 优化后的风险事件配置 -->
    <section class="events">
      <h3>风险事件配置</h3>

      <!-- 预设场景 -->
      <div class="preset-scenarios">
        <h4>常用场景</h4>
        <div class="scenario-list">
          <div
            v-for="(scenario, index) in presetScenarios"
            :key="index"
            class="scenario-item"
            @click="addPresetScenario(scenario)"
          >
            <div class="scenario-name">{{ scenario.name }}</div>
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
        </div>

        <button class="add-btn" @click="addEvent">添加事件</button>
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

    <!-- ECharts 图表（保持不变） -->
    <section class="chart">
      <h3>月供压力趋势</h3>
      <div ref="chartContainer" class="chart-box" style="width: 100%; height: 400px;"></div>
      <ul class="legend">
        <li><span class="color-dot safe"></span> 安全线：30%</li>
        <li><span class="color-dot warn"></span> 预警线：40%</li>
        <li><span class="color-dot exceed"></span> 超标区域：>40% 使用红色半透明填充</li>
        <li><span class="color-dot critical"></span> 临界点：菱形标记，悬浮展示详细信息</li>
        <li><span class="color-dot current-pay"></span> 当前月供：橙色虚线，显示实际月供金额</li>
        <li><span class="color-dot baseline-pay"></span> 基线月供：蓝色虚线，显示无风险月供金额</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.budget-page {
  max-width: 960px;
  margin: 24px auto;
  padding: 16px;
}

.events {
  margin: 24px 0;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

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
}

.scenario-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.scenario-name {
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 4px;
}

.scenario-desc {
  font-size: 12px;
  color: #666;
}

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

.add-btn:active {
  background: #096dd9;
}

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

.chart {
  margin-top: 24px;
}

.chart-box {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
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
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-group {
    min-width: auto;
  }
  .add-btn {
    margin-top: 8px;
    height: 44px;
  }
  .scenario-list {
    grid-template-columns: 1fr;
  }

  .event-info {
    flex-direction: column;
    align-items: start;
    gap: 4px;
  }
}
@media (max-width: 480px) {
  .form-group select,
  .form-group input {
    height: 44px;
  }
  
  .add-btn {
    height: 48px;
    font-size: 16px;
  }
}
</style>