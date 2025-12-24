<template>
  <div class="improvement-container"> 
    <!-- 说明卡片 -->
    <ScoringCard 
      title="深圳改善型购房评分表（核心：品质提升 + 配套升级）"
      :collapsed="collapsedCards.intro"
      @toggle="toggleCard('intro')">
      <div class="desc">
        适用人群：二次购房、预算充足、优先满足"居住舒适度 + 圈层 + 增值潜力"<br/>
        评分说明：总分100分。决策阈值：≥85分（强烈推荐）、70-84分（值得考虑）、60-69分（需优化）、＜60分（不建议）<br/>
        权重规则：每个二级子项的最终得分 = "我的打分" × 一级维度权重 ÷ 该维度下二级子项数量。
      </div>
    </ScoringCard>

    <!-- 基础测算表单 -->
    <ScoringCard 
      title="基础测算表单"
      :collapsed="collapsedCards.basic"
      @toggle="toggleCard('basic')">
      <div class="desc">填写基础参数后，系统将自动推算"预算适配性"的两个子项分数。</div>
      <el-form :model="formData" :label-width="isMobile ? '50%' : '35%'" class="basic-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" v-for="field in formFields" :key="field.prop">
            <el-form-item :label="field.label" class="form-item-responsive">
              <el-input v-model.number="formData[field.prop]" :type="field.type" 
                :min="field.min" :max="field.max" :step="field.step"
                :placeholder="field.placeholder" @blur="autoFillBudgetScores" 
                class="full-width" />
              <span v-if="field.tip" class="muted tip">{{ field.tip }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div class="dim-summary">
        {{ calcSummary }}
      </div>
      <div class="dim-summary" style="color:var(--primary);margin-top:8px">
        {{ safetySuggestion }}
      </div>
    </ScoringCard>

    <!-- 评分表格 -->
    <ScoringCard 
      title="改善型购房评分表"
      :collapsed="collapsedCards.scoring"
      @toggle="toggleCard('scoring')">
      <ScoringTable 
        :score-items="scoreItems" 
        :is-small-screen="isMobile"
        @recalc="recalc" />
      <div class="dim-summary" style="margin-top:10px">
        {{ dimensionSummaries }}
      </div>
    </ScoringCard>

    <!-- 总分展示 -->
    <el-card class="card">
      <div class="total-box">
        <div class="total-score">当前总得分：{{ totalScore }} 分</div>
        <div :class="['badge', levelClass]">{{ levelText }}</div>
        <div class="actions">
          <el-button @click="saveCurrentScore">保存本次评分</el-button>
          <el-button @click="resetScores">重置打分</el-button>
        </div>
      </div>
      <div class="muted" style="margin-top:8px">
        {{ adviceText }}
      </div>
    </el-card>
  </div>
</template>

<script>
import { IMPROVEMENT_SCORE_ITEMS_CONFIG, IMPROVEMENT_FORM_FIELDS } from '@/utils/improvement-config.js'
import { getDeviceInfo, addResizeListener } from '@/utils/device-utils.js'
import ScoringCard from '@/components/ScoringCard.vue'
import ScoringTable from '@/components/ScoringTable.vue'

export default {
  name: 'ImprovementView',
  components: {
    ScoringCard,
    ScoringTable
  },
  data() {
    return {
      formData: {
        price: null,
        downRatio: 30,
        monthlyIncome: null,
        availableFunds: null
      },
      formFields: IMPROVEMENT_FORM_FIELDS,
      scoreItems: [],
      calcSummary: '将根据上述参数自动计算：首付金额、贷款金额、月供估算等。',
      safetySuggestion: '改善型安全建议：月供不超过家庭月收入的25%，首付比例建议≤40%',
      dimensionSummaries: '维度总分：将自动计算并展示。',
      totalScore: 0,
      levelClass: 'danger',
      levelText: '不建议入手',
      adviceText: '请在表格中为各子项输入0-10的整数分，系统将自动计算加权得分与等级建议。',
      isMobile: false,
      deviceInfo: {},
      collapsedCards: {
        intro: false,
        basic: false,
        scoring: false
      },
      currentRecordId: null, // 添加当前记录ID
    }
  },
  created() {
    this.updateDeviceInfo()
    this.initScoreItems()
  },
  methods: {
    initScoreItems() {
      this.scoreItems = IMPROVEMENT_SCORE_ITEMS_CONFIG.map(item => ({
        ...item,
        score: 0,
        weightedScore: 0
      }))
    },
    loadHistoryRecord(recordId) {
      try {
        const stored = localStorage.getItem('houseScoringHistory')
        if (!stored) {
          this.$message.warning('未找到历史记录')
          return false
        }

        const allRecords = JSON.parse(stored)
        const record = allRecords.find(r => r.id === recordId)
        
        if (!record) {
          this.$message.warning('未找到对应的历史记录')
          return false
        }

        // 填充表单数据
        if (record.formData) {
          this.formData = { ...record.formData }
        }

        // 填充评分项数据
        if (record.scoreItems && Array.isArray(record.scoreItems)) {
          this.scoreItems = record.scoreItems.map(item => ({
            ...item
          }))
        }

        // 重新计算总分
        this.recalc()
        
        this.currentRecordId = recordId
        this.$message.success('历史记录加载成功')
        return true
      } catch (error) {
        console.error('加载历史记录失败:', error)
        this.$message.error('加载历史记录失败')
        return false
      }
    },
    autoFillBudgetScores() {
      const { price, downRatio, monthlyIncome, availableFunds } = this.formData

      if (!price || !downRatio) {
        this.calcSummary = '请至少填写房屋总价和首付比例。'
        return
      }

      const downAmtWan = price * (downRatio / 100)
      const monthlyPayWan = price * 0.7 * 0.05 / 12 // 简化估算：贷款70%，利率5%，30年

      // 计算首付压力评分（改善型标准）
      if (availableFunds && availableFunds > 0) {
        const dpRatio = downAmtWan / availableFunds
        let downScore = 0
        if (dpRatio <= 0.4) downScore = 10
        else if (dpRatio <= 0.5) downScore = 7
        else if (dpRatio <= 0.6) downScore = 4
        else downScore = 1

        const downPaymentItem = this.scoreItems.find(item => item.item === 'downPaymentPressure')
        if (downPaymentItem) downPaymentItem.score = downScore
      }

      // 计算月供压力评分（改善型标准）
      if (monthlyPayWan && monthlyIncome && monthlyIncome > 0) {
        const mpRatio = monthlyPayWan / monthlyIncome
        let monthlyScore = 0
        if (mpRatio <= 0.25) monthlyScore = 10
        else if (mpRatio <= 0.35) monthlyScore = 7
        else if (mpRatio <= 0.45) monthlyScore = 4
        else monthlyScore = 1

        const monthlyPressureItem = this.scoreItems.find(item => item.item === 'monthlyPressure')
        if (monthlyPressureItem) monthlyPressureItem.score = monthlyScore
      }

      // 更新计算摘要
      this.calcSummary = `房屋总价≈ ${price.toFixed(2)}万元，首付≈ ${downAmtWan.toFixed(2)}万元，估算月供≈ ${monthlyPayWan.toFixed(2)}万元/月`
      this.recalc()
    },

    recalc() {
      const dimTotals = {}
      const dimWeights = {}
      const dimCounts = {}
      let total = 0

      this.scoreItems.forEach(item => {
        const { dimension, weight, count, score } = item

        dimWeights[dimension] = weight
        dimCounts[dimension] = count

        let weighted = 0
        if (score !== null && !isNaN(score)) {
          weighted = (score * (weight / count)) / 10
        }

        item.weightedScore = weighted
        dimTotals[dimension] = (dimTotals[dimension] || 0) + weighted
        total += weighted
      })

      this.dimensionSummaries = Object.keys(dimTotals).map(dim => {
        return `${dim}：${dimTotals[dim].toFixed(1)}分（权重${dimWeights[dim]}%，${dimCounts[dim]}个子项）`
      }).join('； ') || '维度总分：将自动计算并展示。'

      this.totalScore = Math.round(total)
      this.updateLevelAndAdvice()
    },

    updateLevelAndAdvice() {
      if (this.totalScore >= 85) {
        this.levelClass = 'ok'
        this.levelText = '强烈推荐'
        this.adviceText = '品质与配套俱佳，增值潜力明确。建议重点考虑，尽快锁定优质房源。'
      } else if (this.totalScore >= 70) {
        this.levelClass = 'warn'
        this.levelText = '值得考虑'
        this.adviceText = '整体表现良好，可在价格谈判或细节优化后入手。'
      } else if (this.totalScore >= 60) {
        this.levelClass = 'warn'
        this.levelText = '需优化'
        this.adviceText = '存在明显短板，建议针对低分项优化或寻找更匹配的房源。'
      } else {
        this.levelClass = 'danger'
        this.levelText = '不建议入手'
        this.adviceText = '与改善需求匹配度低，建议调整预算或更换目标区域。'
      }
    },

    resetScores() {
      this.scoreItems.forEach(item => {
        item.score = 0
        item.weightedScore = 0
      })
      this.dimensionSummaries = '维度总分：将自动计算并展示。'
      this.totalScore = 0
      this.levelClass = 'danger'
      this.levelText = '不建议入手'
      this.adviceText = '请在表格中为各子项输入0-10的整数分，系统将自动计算加权得分与等级建议。'
      this.currentRecordId = null // 清除当前记录ID
      this.formData = {
        price: null,
        downRatio: 30,
        monthlyIncome: null,
        availableFunds: null
      }
    },

    saveCurrentScore() {
      if (this.totalScore === 0) {
        this.$message.warning('请先完成评分再保存')
        return
      }

      const record = {
        id: this.currentRecordId || Date.now().toString(), // 如果是加载的记录，使用原ID
        date: new Date().toLocaleString('zh-CN'),
        totalScore: this.totalScore,
        type: '改善型购房',
        price: this.formData.price || 0,
        dimensionBreakdown: this.getDimensionBreakdown(),
        suggestion: this.generateSmartSuggestion(),
        formData: { ...this.formData },
        scoreItems: this.scoreItems.map(item => ({ ...item }))
      }

      this.saveHistoryRecords(record)
      if (this.currentRecordId) {
        this.$message.success(`改善型评分已更新！当前总分：${this.totalScore}分`)
      } else {
        this.$message.success(`改善型评分已保存！当前总分：${this.totalScore}分`)
      }
    },
    // 添加缺失的方法
    getDimensionBreakdown() {
    const dimTotals = {}
    this.scoreItems.forEach(item => {
        dimTotals[item.dimension] = (dimTotals[item.dimension] || 0) + item.weightedScore
    })

    return Object.entries(dimTotals)
        .map(([dim, score]) => `${dim}:${score.toFixed(1)}`)
        .join('; ')
    },

    generateSmartSuggestion() {
    const score = this.totalScore
    if (score >= 85) return '优质选择'
    if (score >= 70) return '值得考虑'
    if (score >= 60) return '需优化'
    return '谨慎决策'
    },
    // 修改保存到历史记录的方法，支持更新操作
    saveHistoryRecords(record) {
      try {
        const allRecords = this.getAllHistoryRecords()
        
        if (this.currentRecordId) {
          // 更新现有记录
          const index = allRecords.findIndex(r => r.id === this.currentRecordId)
          if (index !== -1) {
            allRecords[index] = record
          } else {
            allRecords.unshift(record)
          }
        } else {
          // 新增记录
          allRecords.unshift(record)
        }
        
        localStorage.setItem('houseScoringHistory', JSON.stringify(allRecords))
      } catch (error) {
        console.error('保存历史记录失败:', error)
        this.$message.error('保存历史记录失败')
      }
    },
    // 获取所有历史记录
    getAllHistoryRecords() {
        try {
            const stored = localStorage.getItem('houseScoringHistory')
            return stored ? JSON.parse(stored) : []
        } catch (error) {
            return []
        }
    },
    updateDeviceInfo() {
      this.deviceInfo = getDeviceInfo()
      this.isMobile = this.deviceInfo.isMobile
    },

    toggleCard(cardKey) {
      this.collapsedCards[cardKey] = !this.collapsedCards[cardKey]
    }
  },
  mounted() {
    this.recalc()
    this.removeResizeListener = addResizeListener((info) => {
      this.deviceInfo = info
      this.isMobile = info.isMobile
    })
    this.$nextTick(() => {
      const loadRecordId = this.$route.query.loadRecord
      if (loadRecordId) {
        this.loadHistoryRecord(loadRecordId)
      }
    })
  },
  watch: {
    '$route.query.loadRecord': {
      handler(newVal) {
        if (newVal) {
          this.loadHistoryRecord(newVal)
        }
      },
      immediate: false
    }
  },
  beforeUnmount() {
    if (this.removeResizeListener) {
      this.removeResizeListener()
    }
  }
}
</script>

<style scoped>
.improvement-container {
  max-width: 100%;
  margin: 24px auto;
  padding: 0 16px;
}

.desc {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.dim-summary {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-top: 6px;
}

.total-box {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.total-score {
  font-size: 28px;
  font-weight: 800;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.badge.ok {
  background: #e6f7e6;
  color: #2d7a2d;
}

.badge.warn {
  background: #fff7e6;
  color: #8a5a00;
}

.badge.danger {
  background: #ffecec;
  color: #a12626;
}

.actions {
  display: flex;
  gap: 10px;
}

.muted {
  color: var(--el-text-color-secondary);
}
</style>