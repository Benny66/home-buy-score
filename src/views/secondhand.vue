<template>
  <div class="secondhand-container">
    <!-- 说明卡片 -->
    <ScoringCard 
      title="二手房购房评分表（核心：产权安全 + 房龄适配）"
      :collapsed="collapsedCards.intro"
      @toggle="toggleCard('intro')">
      <div class="desc">
        适用人群：考虑二手房、追求性价比、重点规避"产权风险 + 隐性问题"<br/>
        评分说明：总分100分。决策阈值：≥80分（推荐入手）、60-79分（谨慎考虑）、＜60分（不建议）<br/>
        权重规则：每个二级子项的最终得分 = "我的打分" × 一级维度权重 ÷ 该维度下二级子项数量。
      </div>
    </ScoringCard>

    <!-- 基础测算表单 -->
    <ScoringCard 
      title="二手房基础信息"
      :collapsed="collapsedCards.basic"
      @toggle="toggleCard('basic')">
      <div class="desc">填写二手房基础信息后，系统将自动推算相关评分项。</div>
      <el-form :model="formData" :label-width="isMobile ? '50%' : '35%'" class="basic-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" v-for="field in formFields" :key="field.prop">
            <el-form-item :label="field.label" class="form-item-responsive">
              <template v-if="field.type === 'select'">
                <el-select v-model="formData[field.prop]" :placeholder="field.placeholder" 
                  @change="autoFillBudgetScores" class="full-width">
                  <el-option v-for="option in field.options" :key="option.value" 
                    :value="option.value" :label="option.label" />
                </el-select>
              </template>
              <template v-else>
                <el-input v-model.number="formData[field.prop]" :type="field.type" 
                  :min="field.min" :max="field.max" :step="field.step"
                  :placeholder="field.placeholder" @blur="autoFillBudgetScores" 
                  class="full-width" />
              </template>
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
      title="二手房购房评分表"
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
import { SECONDHAND_SCORE_ITEMS_CONFIG, SECONDHAND_FORM_FIELDS } from '@/utils/secondhand-config.js'
import { getDeviceInfo, addResizeListener } from '@/utils/device-utils.js'
import ScoringCard from '@/components/ScoringCard.vue'
import ScoringTable from '@/components/ScoringTable.vue'

export default {
  name: 'SecondhandView',
  components: {
    ScoringCard,
    ScoringTable
  },
  data() {
    return {
      formData: {
        price: null,
        downRatio: 40,
        houseAge: null,
        communityAvgPrice: null,
        houseArea: null,
        taxType: 'full5unique'
      },
      formFields: SECONDHAND_FORM_FIELDS,
      scoreItems: [],
      calcSummary: '将根据上述参数自动计算：性价比、税费成本、维修储备等评分。',
      safetySuggestion: '二手房重点关注：产权安全、房屋质量、税费成本',
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
      historyRecords: []
    }
  },
  created() {
    this.updateDeviceInfo()
    this.initScoreItems()
  },
  methods: {
    initScoreItems() {
      this.scoreItems = SECONDHAND_SCORE_ITEMS_CONFIG.map(item => ({
        ...item,
        score: 0,
        weightedScore: 0
      }))
    },

    autoFillBudgetScores() {
      const { price, houseAge, communityAvgPrice, houseArea, taxType } = this.formData

      if (!price || !houseArea) {
        this.calcSummary = '请至少填写房屋总价和面积。'
        return
      }

      // 计算总价性价比评分
      if (communityAvgPrice && communityAvgPrice > 0) {
        const unitPrice = price / houseArea
        const priceDiffRatio = (unitPrice - communityAvgPrice) / communityAvgPrice * 100
        
        let priceScore = 0
        if (priceDiffRatio <= -5) priceScore = 10
        else if (priceDiffRatio <= 0) priceScore = 7
        else if (priceDiffRatio <= 5) priceScore = 4
        else priceScore = 1

        const priceValueItem = this.scoreItems.find(item => item.item === 'priceValue')
        if (priceValueItem) priceValueItem.score = priceScore
      }

      // 计算税费成本评分
      if (taxType) {
        let taxScore = 0
        switch (taxType) {
          case 'full5unique': taxScore = 10; break
          case 'full2unique': taxScore = 7; break
          case 'full2notunique': taxScore = 4; break
          case 'notfull2': taxScore = 1; break
        }

        const taxCostItem = this.scoreItems.find(item => item.item === 'taxCost')
        if (taxCostItem) taxCostItem.score = taxScore
      }

      // 计算房龄与折旧评分
      if (houseAge !== null) {
        let ageScore = 0
        if (houseAge <= 5) ageScore = 10
        else if (houseAge <= 10) ageScore = 8
        else if (houseAge <= 15) ageScore = 5
        else if (houseAge <= 20) ageScore = 3
        else ageScore = 1

        const ageDepreciationItem = this.scoreItems.find(item => item.item === 'houseAgeDepreciation')
        if (ageDepreciationItem) ageDepreciationItem.score = ageScore
      }

      // 更新计算摘要
      this.updateCalcSummary()
      this.recalc()
    },

    updateCalcSummary() {
      const { price, houseArea, houseAge, taxType } = this.formData
      const parts = []

      if (price) parts.push(`总价≈ ${price.toFixed(2)}万元`)
      if (houseArea) parts.push(`面积≈ ${houseArea}㎡`)
      if (houseAge !== null) parts.push(`房龄≈ ${houseAge}年`)
      if (taxType) {
        const taxLabels = {
          'full5unique': '满五唯一',
          'full2unique': '满二唯一', 
          'full2notunique': '满二不唯一',
          'notfull2': '不满二'
        }
        parts.push(`税费: ${taxLabels[taxType]}`)
      }

      this.calcSummary = parts.length > 0 ? parts.join('； ') : '请填写二手房基础信息。'
      this.safetySuggestion = '二手房交易提示：务必核实产权、检查房屋质量、了解邻里环境'
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
      if (this.totalScore >= 80) {
        this.levelClass = 'ok'
        this.levelText = '推荐入手'
        this.adviceText = '产权安全、性价比高。建议尽快完成产权核查和房屋质量检查，推进交易。'
      } else if (this.totalScore >= 60) {
        this.levelClass = 'warn'
        this.levelText = '谨慎考虑'
        this.adviceText = '存在一定风险或不足。建议重点核实产权风险、房屋质量问题，谨慎决策。'
      } else {
        this.levelClass = 'danger'
        this.levelText = '不建议入手'
        this.adviceText = '风险较高或匹配度低。建议放弃或寻找更合适的二手房源。'
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
    },

    saveCurrentScore() {
        if (this.totalScore === 0) {
            this.$message.warning('请先完成评分再保存')
            return
        }

        const record = {
            id: Date.now().toString(),
            date: new Date().toLocaleString('zh-CN'),
            totalScore: this.totalScore,
            type: '二手房购房',
            price: this.formData.price || 0,
            dimensionBreakdown: this.getDimensionBreakdown(),
            suggestion: this.generateSmartSuggestion(),
            formData: { ...this.formData },
            scoreItems: this.scoreItems.map(item => ({ ...item }))
        }

        this.historyRecords.unshift(record)
        this.saveHistoryRecords()
        this.$message.success(`二手房评分已保存！当前总分：${this.totalScore}分`)
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
        if (score >= 80) return '推荐入手'
        if (score >= 60) return '谨慎考虑'
        return '不建议入手'
    },

    saveHistoryRecords() {
        try {
            // 统一使用相同的localStorage key
            const allRecords = this.getAllHistoryRecords()
            allRecords.unshift(this.historyRecords[0]) // 添加最新记录
            localStorage.setItem('houseScoringHistory', JSON.stringify(allRecords))
        } catch (error) {
            console.error('保存历史记录失败:', error)
            this.$message.error('保存历史记录失败')
        }
    },

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
  },
  beforeUnmount() {
    if (this.removeResizeListener) {
      this.removeResizeListener()
    }
  }
}
</script>

<style scoped>
.secondhand-container {
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