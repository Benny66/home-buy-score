<!-- src/views/scoring.vue -->
<template>       
  <div :class="isSmallScreen() ? 'scoring-container-small' : 'scoring-container'" >
    <!-- 说明卡片 -->
    <ScoringCard
      title="深圳刚需购房评分表（粗算）"
      :collapsed="collapsedCards.intro"
      @toggle="toggleCard('intro')">
      <div class="desc">
        评分说明：总分 100 分。决策阈值：≥80 分（强烈推荐入手）、60-79 分（谨慎考虑，需优化短板）、＜60 分（不建议入手）。<br />
        权重规则：每个二级子项的最终得分 = "我的打分" × 一级维度权重 ÷ 该维度下二级子项数量。例如：预算适配性 30% 权重下有 3 个子项，则每个子项权重为 10%。
      </div>
    </ScoringCard>
    <!-- 基础测算表单 -->
    <ScoringCard
      title="基础测算表单"
      :collapsed="collapsedCards.basic"
      @toggle="toggleCard('basic')">
      <div class="desc">填写基础参数后，系统将自动推算"预算适配性"的三个子项分数并填入表格。</div>

      <!-- 添加自动计算状态提示 -->
      <div v-if="hasAutoCalculated" class="auto-calc-notice">
        <el-alert
          title="已自动计算预算适配性分数"
          type="success"
          :closable="false"
          show-icon
          class="mb-16">
          <template #description>
            首付压力、月供压力、税费储备比例已根据您的输入自动评分
          </template>
        </el-alert>
      </div>

      <el-form :model="formData" :label-width="isSmallScreen() ? '50%': '35%'" class="basic-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" v-for="field in formFields" :key="field.prop">
            <el-form-item :label="field.label" class="form-item-responsive">
              <template v-if="field.type === 'select'">
                <el-select v-model="formData[field.prop]" :style="field.style"
                  @change="field.prop === 'loanType' ? handleLoanTypeChange() : autoFillBudgetScores()"
                  :placeholder="field.placeholder" class="full-width">
                  <el-option v-for="option in field.options" :key="option.value" :value="option.value"
                    :label="option.label" />
                </el-select>
              </template>
              <template v-else>
                <el-input v-model.number="formData[field.prop]" :type="field.type" :min="field.min" :max="field.max"
                  :step="field.step" :placeholder="field.placeholder" @blur="autoFillBudgetScores" class="full-width" />
              </template>
              <span v-if="field.tip" class="muted tip">{{ field.tip }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 组合贷特殊字段 -->
        <div v-if="formData.loanType === 'combine'" class="combine-loan-fields">
          <el-divider>组合贷金额分配</el-divider>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" v-for="field in combineLoanFields" :key="field.prop">
              <el-form-item :label="field.label" class="form-item-responsive">
                <el-input v-model.number="formData[field.prop]" :type="field.type" :min="field.min" :step="field.step"
                  :placeholder="field.placeholder" @blur="() => handleCombineLoanInput(field.inputType)"
                  class="full-width" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <div class="dim-summary strong-reminder">
        {{ calcSummary }}
      </div>
      <div class="dim-summary strong-reminder" style="color:var(--primary);margin-top:8px">
        {{ safetySuggestion }}
      </div>
    </ScoringCard>
    <!-- 评分表格 -->
    <ScoringCard
      title="场景：深圳刚需购房（核心：预算安全 + 基础配套）"
      :collapsed="collapsedCards.scoring"
      @toggle="toggleCard('scoring')">
      <div class="auto-items-notice" :class="{ 'small-screen': isSmallScreen() }">
        <el-tag type="success" size="small" class="mr-8">自动计算</el-tag>
        <span class="muted">前三项（首付压力、月供压力、税费储备）已根据基础表单自动评分</span>
      </div>

      <ScoringTable
        :score-items="scoreItems"
        :is-small-screen="isSmallScreen()"
        @recalc="recalc" />
      <div class="dim-summary strong-reminder" style="margin-top:10px">
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

      <!-- 添加楼盘名称输入 -->
      <div class="property-name-input" style="margin-top: 16px;">
        <el-input
          v-model="propertyName"
          placeholder="输入楼盘名称（用于分享截图）"
          clearable
          :size="isSmallScreen() ? 'small' : 'default'"
          style="width: 300px;"
        >
          <template #prepend>🏠</template>
        </el-input>
         <!-- 添加截图按钮 -->
       <ShareScreenshot
            :property-name="propertyName"
            :total-price="formData.price"
            :monthly-payment="monthlyPaymentForShare"
            :total-score="totalScore"
            :level-text="levelText"
            :level-class="levelClass"
            :advice-text="adviceText"
            :dimension-scores="dimensionScoresForShare"
          />
      </div>
      
    </el-card>
  </div>
</template>

<script>
// 导入配置
import {
  FORM_FIELDS,
  COMBINE_LOAN_FIELDS,
  LOAN_TYPE_RATES,
  SCORE_ITEMS_CONFIG
} from '@/utils/scoring-config.js'
// 导入设备检测工具
import { 
  isMobileDevice, 
  getDeviceInfo, 
  addResizeListener 
} from '@/utils/device-utils.js'
// 导入贷款计算工具
import { 
  calcPaymentByType 
} from '@/utils/loan-calculator.js'
// 导入组件
import ScoringCard from '@/components/ScoringCard.vue'
import ScoringTable from '@/components/ScoringTable.vue'
import ShareScreenshot from '@/components/ShareScreenshot.vue'

export default {
  name: 'ScoringView',
  components: {
    ScoringCard,
    ScoringTable,
    ShareScreenshot  // 添加截图组件
  },
  data() {
    return {
      formData: {
        price: null,
        downRatio: 20,
        loanType: 'gjj',
        rate: 2.6,
        years: 30,
        monthlyIncome: null,
        availableFunds: null,
        taxReservePct: 5,
        repaymentType: 'equalPrincipalInterest',
        // 组合贷相关字段
        commercialLoanAmt: null,
        gjjLoanAmt: null,
      },
      formFields: FORM_FIELDS,
      combineLoanFields: COMBINE_LOAN_FIELDS,
      scoreItems: [],
      calcSummary: '将根据上述参数自动计算：首付金额、贷款金额、月供估算、首付压力、月供压力、税费储备比例等。',
      safetySuggestion: '安全月供建议：月供不超过家庭月收入的30%',
      dimensionSummaries: '维度总分：将自动计算并展示。',
      totalScore: 0,
      levelClass: 'danger',
      levelText: '不建议入手',
      adviceText: '请在表格中为各子项输入 0-10 的整数分，系统将自动计算加权得分与等级建议。',
      isMobile: false,
      deviceInfo: {},
      collapsedCards: {
        intro: false,
        basic: false,
        scoring: false
      },
      currentRecordId: null, // 添加当前记录ID
      hasAutoCalculated: false, // 添加自动计算状态标志
      propertyName: '', // 添加楼盘名称字段
    }
  },
  computed: {
    // 添加计算属性用于截图组件
    dimensionScoresForShare() {
      const dimTotals = {}
      this.scoreItems.forEach(item => {
        const { dimension, score } = item
        if (score !== null && !isNaN(score)) {
          dimTotals[dimension] = (dimTotals[dimension] || 0) + score
        }
      })

      return Object.keys(dimTotals).map(dim => ({
        name: dim,
        score: Math.round(dimTotals[dim]),
        percentage: Math.round((dimTotals[dim] / 30) * 100) // 每个维度最多30分
      }))
    },

    monthlyPaymentForShare() {
      const { price, downRatio, rate, years, loanType, commercialLoanAmt, gjjLoanAmt, repaymentType } = this.formData

      if (!price || !downRatio) return 0

      const totalLoanAmt = price * (1 - downRatio / 100)

      if (loanType === 'combine' && commercialLoanAmt !== null && gjjLoanAmt !== null) {
        const commercialMonthly = this.calcPaymentByType(commercialLoanAmt, 3.1, years, repaymentType)
        const gjjMonthly = this.calcPaymentByType(gjjLoanAmt, 2.6, years, repaymentType)
        return (commercialMonthly || 0) + (gjjMonthly || 0)
      } else {
        return this.calcPaymentByType(totalLoanAmt, rate, years, repaymentType) || 0
      }
    }
  },
  created() {
    this.updateDeviceInfo();
    this.initScoreItems()
  },
  methods: {
    initScoreItems() {
      this.scoreItems = SCORE_ITEMS_CONFIG.map(item => ({
        ...item,
        score: 0,
        weightedScore: 0
      }));
    },
    // 添加加载历史记录的方法
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
        this.autoFillBudgetScores() // 重新计算预算相关分数

        this.currentRecordId = recordId
        this.$message.success('历史记录加载成功')
        return true
      } catch (error) {
        console.error('加载历史记录失败:', error)
        this.$message.error('加载历史记录失败')
        return false
      }
    },
    // 贷款类型变化处理
    handleLoanTypeChange() {
      this.formData.rate = LOAN_TYPE_RATES[this.formData.loanType] || 2.8;

      if (this.formData.loanType === 'combine' && this.formData.price && this.formData.downRatio) {
        this.calcInitialLoanDistribution()
      } else {
        this.formData.commercialLoanAmt = null
        this.formData.gjjLoanAmt = null
      }

      this.autoFillBudgetScores()
    },

    // 计算初始贷款金额分配
    calcInitialLoanDistribution() {
      const { price, downRatio } = this.formData
      const totalLoanAmt = price * (1 - downRatio / 100)

      const gjjMax = 90
      this.formData.gjjLoanAmt = Math.min(totalLoanAmt, gjjMax)
      this.formData.commercialLoanAmt = totalLoanAmt - this.formData.gjjLoanAmt
    },

    // 处理组合贷输入
    handleCombineLoanInput(inputType) {
      const { price, downRatio, commercialLoanAmt, gjjLoanAmt } = this.formData

      if (!price || !downRatio) {
        this.$message.warning('请先填写房屋总价和首付比例')
        return
      }

      const totalLoanAmt = price * (1 - downRatio / 100)

      if (inputType === 'commercial' && commercialLoanAmt !== null) {
        if (commercialLoanAmt > totalLoanAmt) {
          this.$message.error('商贷金额不能超过总贷款金额')
          this.formData.commercialLoanAmt = totalLoanAmt
          this.formData.gjjLoanAmt = 0
        } else {
          this.formData.gjjLoanAmt = totalLoanAmt - commercialLoanAmt
        }
      } else if (inputType === 'gjj' && gjjLoanAmt !== null) {
        if (gjjLoanAmt > totalLoanAmt) {
          this.$message.error('公积金贷款金额不能超过总贷款金额')
          this.formData.gjjLoanAmt = totalLoanAmt
          this.formData.commercialLoanAmt = 0
        } else {
          this.formData.commercialLoanAmt = totalLoanAmt - gjjLoanAmt
        }
      }

      this.autoFillBudgetScores()
    },

    // 自动填充预算适配性分数
    autoFillBudgetScores() {
      const { price, downRatio, rate, years, monthlyIncome, availableFunds,
        taxReservePct, loanType, commercialLoanAmt, gjjLoanAmt, repaymentType  } = this.formData

      if (!price || !downRatio || !rate || !years) {
        this.calcSummary = '请至少填写：房屋总价、首付比例、贷款方式/利率、贷款年限。'
        this.safetySuggestion = '安全月供建议：月供不超过家庭月收入的30%'
        this.hasAutoCalculated = false
        return
      }

      const downAmtWan = price * (downRatio / 100)
      const totalLoanAmt = price - downAmtWan
      let monthlyPayWan = null
      if (loanType === 'combine') {
        if (commercialLoanAmt !== null && gjjLoanAmt !== null) {
          const inputTotalLoanAmt = commercialLoanAmt + gjjLoanAmt
          if (Math.abs(inputTotalLoanAmt - totalLoanAmt) > 0.01) {
            this.adjustLoanAmounts(totalLoanAmt)
            return
          }

          const commercialMonthly = calcPaymentByType(commercialLoanAmt, 3.1, years, repaymentType)
          const gjjMonthly = calcPaymentByType(gjjLoanAmt, 2.6, years, repaymentType)
          monthlyPayWan = (commercialMonthly || 0) + (gjjMonthly || 0)
        } else {
          this.calcSummary = '组合贷模式下请填写贷款金额'
          return
        }
      } else {
        monthlyPayWan = calcPaymentByType(totalLoanAmt, rate, years, repaymentType)
      }

      this.updateSafetySuggestion(monthlyPayWan, repaymentType)

      // 计算首付压力评分
      if (availableFunds && availableFunds > 0) {
        const dpRatio = downAmtWan / availableFunds
        let downScore = 0
        if (dpRatio <= 0.3) downScore = 10
        else if (dpRatio <= 0.4) downScore = 8
        else if (dpRatio <= 0.5) downScore = 5
        else downScore = 0

        const downPaymentItem = this.scoreItems.find(item => item.item === 'downPaymentPressure')
        if (downPaymentItem) downPaymentItem.score = downScore
      }

      // 计算月供压力评分
      if (monthlyPayWan && monthlyIncome && monthlyIncome > 0) {
        const mpRatio = monthlyPayWan / monthlyIncome
        let monthlyScore = 0
        if (mpRatio <= 0.3) monthlyScore = 10
        else if (mpRatio <= 0.4) monthlyScore = 7
        else if (mpRatio <= 0.5) monthlyScore = 3
        else monthlyScore = 0

        const monthlyPressureItem = this.scoreItems.find(item => item.item === 'monthlyPressure')
        if (monthlyPressureItem) monthlyPressureItem.score = monthlyScore
      }

      // 计算税费储备评分
      if (Number.isFinite(taxReservePct)) {
        let taxScore = 0
        if (taxReservePct >= 5) taxScore = 10
        else if (taxReservePct >= 3) taxScore = 6
        else if (taxReservePct >= 1) taxScore = 2
        else taxScore = 0

        const taxReserveItem = this.scoreItems.find(item => item.item === 'taxReserve')
        if (taxReserveItem) taxReserveItem.score = taxScore
      }

      this.updateCalcSummary({
        price,
        downAmtWan,
        totalLoanAmt,
        monthlyPayWan,
        loanType,
        commercialLoanAmt,
        gjjLoanAmt
      })
      this.recalc()

      // 显示成功提示
      this.$message.success('预算适配性分数已自动计算完成！')
    },

    // 调整贷款金额
    adjustLoanAmounts(totalLoanAmt) {
      const { commercialLoanAmt, gjjLoanAmt } = this.formData

      if (commercialLoanAmt !== null && gjjLoanAmt === null) {
        this.formData.gjjLoanAmt = totalLoanAmt - commercialLoanAmt
      } else if (gjjLoanAmt !== null && commercialLoanAmt === null) {
        this.formData.commercialLoanAmt = totalLoanAmt - gjjLoanAmt
      } else {
        const ratio = totalLoanAmt / (commercialLoanAmt + gjjLoanAmt)
        this.formData.commercialLoanAmt = commercialLoanAmt * ratio
        this.formData.gjjLoanAmt = gjjLoanAmt * ratio
      }

      this.$message.info('已自动调整贷款金额分配')
      this.autoFillBudgetScores()
    },

    // 更新计算摘要
    updateCalcSummary(payload) {
      if (!payload) {
        this.calcSummary = '将根据上述参数自动计算：首付金额、贷款金额、月供估算、首付压力、月供压力、税费储备比例等。'
        return
      }

      const parts = []
      if (payload.price) parts.push(`房屋总价≈ ${payload.price.toFixed(2)} 万元`)
      if (Number.isFinite(payload.downAmtWan)) parts.push(`首付≈ ${payload.downAmtWan.toFixed(2)} 万`)
      if (Number.isFinite(payload.totalLoanAmt)) parts.push(`贷款总额≈ ${payload.totalLoanAmt.toFixed(2)} 万`)

      if (payload.loanType === 'combine' && payload.commercialLoanAmt !== null && payload.gjjLoanAmt !== null) {
        parts.push(`商贷 ${payload.commercialLoanAmt.toFixed(2)} 万(3.1%)`)
        parts.push(`公积金 ${payload.gjjLoanAmt.toFixed(2)} 万(2.6%)`)
      }

      if (Number.isFinite(payload.monthlyPayWan)) {
        const monthlyDesc = this.formData.repaymentType === 'equalPrincipal' ?
          '首月月供' : '月供'
        parts.push(`${monthlyDesc}≈ ${payload.monthlyPayWan.toFixed(2)} 万/月`)
      }

      this.calcSummary = parts.join('； ')
    },

    // 更新安全建议
    updateSafetySuggestion(monthlyPayWan, repaymentType) {
      if (monthlyPayWan && monthlyPayWan > 0) {
        const safeIncome = (monthlyPayWan / 0.3).toFixed(2)
        const repaymentDesc = repaymentType === 'equalPrincipal' ?
          '（等额本金，首月月供较高）' : '（等额本息，月供固定）'
        this.safetySuggestion = `安全月供建议：月供 ${monthlyPayWan.toFixed(2)} 万${repaymentDesc} → 建议家庭月收入 ≥ ${safeIncome} 万（月供占收入≤30%）`
      } else {
        this.safetySuggestion = '安全月供建议：月供不超过家庭月收入的30%'
      }
    },

    // 重新计算总分
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
        return `${dim}：${dimTotals[dim].toFixed(1)} 分（权重 ${dimWeights[dim]}%）`
      }).join('；\n') || '维度总分：将自动计算并展示。'

      this.totalScore = Math.round(total)
      this.updateLevelAndAdvice()
    },

    // 更新等级和建议
    updateLevelAndAdvice() {
      if (this.totalScore >= 80) {
        this.levelClass = 'ok'
        this.levelText = '强烈推荐入手'
        this.adviceText = '综合匹配度高。建议锁定价格、确认贷款与合同细节，完成产权风控后尽快推进。'
      } else if (this.totalScore >= 60) {
        this.levelClass = 'warn'
        this.levelText = '谨慎考虑（需优化短板）'
        this.adviceText = '存在短板。建议针对低分项优化（如通勤/学区/产权/月供），必要时更换房源或延后决策。'
      } else {
        this.levelClass = 'danger'
        this.levelText = '不建议入手'
        this.adviceText = '风险或需求不匹配。建议调整预算/区域/产品类型，或继续观望。'
      }
    },

    // 重置分数
    resetScores() {
      this.scoreItems.forEach(item => {
        item.score = 0
        item.weightedScore = 0
      })
      this.dimensionSummaries = '维度总分：将自动计算并展示。'
      this.totalScore = 0
      this.levelClass = 'danger'
      this.levelText = '不建议入手'
      this.adviceText = '请在表格中为各子项输入 0-10 的整数分，系统将自动计算加权得分与等级建议。'
      this.currentRecordId = null // 清除当前记录ID
      this.formData = {
        price: null,
        downRatio: 20,
        loanType: 'gjj',
        rate: 2.6,
        years: 30,
        monthlyIncome: null,
        availableFunds: null,
        taxReservePct: 5,
        repaymentType: 'equalPrincipalInterest',
        commercialLoanAmt: null,
        gjjLoanAmt: null,
      }
      this.calcSummary = '将根据上述参数自动计算：首付金额、贷款金额、月供估算、首付压力、月供压力、税费储备比例等。'
      this.safetySuggestion = '安全月供建议：月供不超过家庭月收入的30%'
      this.hasAutoCalculated = false
    },

    // 保存当前评分
    saveCurrentScore() {
      if (this.totalScore === 0) {
        this.$message.warning('请先完成评分再保存');
        return;
      }

      const record = {
        id: this.currentRecordId || Date.now().toString(), // 如果是加载的记录，使用原ID
        date: new Date().toLocaleString('zh-CN'),
        totalScore: this.totalScore,
        type: '刚需购房',
        price: this.formData.price || 0,
        dimensionBreakdown: this.getDimensionBreakdown(),
        suggestion: this.generateSmartSuggestion(),
        formData: { ...this.formData },
        scoreItems: this.scoreItems.map(item => ({ ...item }))
      };

      this.saveHistoryRecords(record);
      if (this.currentRecordId) {
        this.$message.success(`评分已更新！当前总分：${this.totalScore}分`)
      } else {
        this.$message.success(`评分已保存！当前总分：${this.totalScore}分,可在"历史记录"页面查看所有保存的评分`);
      }
    },
    // 获取维度得分详情
    getDimensionBreakdown() {
      const dimTotals = {};
      this.scoreItems.forEach(item => {
        dimTotals[item.dimension] = (dimTotals[item.dimension] || 0) + item.weightedScore;
      });

      return Object.entries(dimTotals)
        .map(([dim, score]) => `${dim}:${score.toFixed(1)}`)
        .join('; ');
    },

    // 生成智能建议
    generateSmartSuggestion() {
      const score = this.totalScore;
      if (score >= 80) return '优质选择';
      if (score >= 70) return '值得考虑';
      if (score >= 60) return '需优化';
      return '谨慎决策';
    },

    // 保存历史记录到localStorage
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
        console.error('保存历史记录失败:', error);
        this.$message.error('保存历史记录失败');
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

    // 更新设备信息
    updateDeviceInfo() {
      this.deviceInfo = getDeviceInfo();
      this.isMobile = this.deviceInfo.isMobile;
    },
    // 判断是否是小屏幕
    isSmallScreen() {
      return this.isMobile || this.deviceInfo.screenSize === 'sm';
    },

    // 切换卡片收起状态
    toggleCard(cardKey) {
      this.collapsedCards[cardKey] = !this.collapsedCards[cardKey]
    },
     // 窗口大小变化处理
     handleResize(deviceInfo) {
      const wasMobile = this.isMobile;
      this.deviceInfo = deviceInfo;
      this.isMobile = deviceInfo.isMobile;

      if (wasMobile !== this.isMobile) {
        console.log(`设备类型切换: ${this.isMobile ? '移动端' : '桌面端'}`);
        this.$forceUpdate();
      }
    },
    // 添加贷款计算方法的本地版本，避免依赖问题
    calcPaymentByType(amount, rate, years, type) {
      if (!amount || !rate || !years) return 0

      const monthlyRate = rate / 100 / 12
      const months = years * 12

      if (type === 'equalPrincipalInterest') {
        // 等额本息
        return amount * monthlyRate * Math.pow(1 + monthlyRate, months) /
               (Math.pow(1 + monthlyRate, months) - 1)
      } else {
        // 等额本金（首月月供）
        return amount / months + amount * monthlyRate
      }
    },
  },
  mounted() {
    this.recalc()
    this.removeResizeListener = addResizeListener((info) => {
      this.handleResize(info);
    });
    // 检查URL参数并加载记录
    this.$nextTick(() => {
      const loadRecordId = this.$route.query.loadRecord
      if (loadRecordId) {
        this.loadHistoryRecord(loadRecordId)
      }
    })
  },
  // 监听路由变化
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
      this.removeResizeListener();
    }
  },

}
</script>

<style scoped>
.scoring-container {
  max-width: 60%;
  margin: 24px auto;
  padding: 24px;
}
.scoring-container-small{
  max-width: 100%;
  margin: 24px auto;
  padding: 0px;
}
.desc {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.dim-summary {
  color: var(--el-text-color-prim);
  font-size: 13px;
  margin-top: 6px;
  line-height: 1.8; /* 增加行高使换行更美观 */
  white-space: pre-line; /* 添加这一行，支持换行显示 */
}
.dim-summary.strong-reminder {
  color: #f96960;
  font-weight: 700;
  font-size: 14px;
  background-color: #fff2f0;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 4px solid #f96960;
  margin-top: 8px;
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

.auto-calc-notice {
  margin-bottom: 16px;
}

.auto-items-notice {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border-radius: 4px;
  border-left: 4px solid #1890ff;
}
.auto-items-notice.small-screen{
  font-size: 12px;
  padding: 4px 6px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mr-8 {
  margin-right: 8px;
}

.property-name-input {
  display: flex;
  justify-content: start;
}

/* 小屏幕适配 */
@media (max-width: 768px) {
  .total-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .actions {
    width: 100%;
    justify-content: space-between;
  }

  .property-name-input {
    justify-content: flex-start;
  }

  .property-name-input .el-input {
    width: 100% !important;
  }
}

</style>





