<!-- src/views/scoring.vue -->
<template>  
  <div class="scoring-container">
    <el-card class="card">
      <template #header>
        <div class="card-header" @click="toggleCard('intro')">
          <span>深圳刚需购房评分表（打分 + 自动计算）</span>
          <el-icon class="collapse-icon" :class="{ 'rotate-180': !collapsedCards.intro }">
            <ArrowDown />
          </el-icon>
        </div>
      </template>
      <div v-show="!collapsedCards.intro" class="card-content">
        <div class="desc">
          评分说明：总分 100 分。决策阈值：≥80 分（强烈推荐入手）、60-79 分（谨慎考虑，需优化短板）、＜60 分（不建议入手）。<br />
          权重规则：每个二级子项的最终得分 = "我的打分" × 一级维度权重 ÷ 该维度下二级子项数量。例如：预算适配性 30% 权重下有 3 个子项，则每个子项权重为 10%。
        </div>
      </div>
    </el-card>

    <!-- 基础测算表单 -->
    <el-card class="card" id="basic-form-card">
      <template #header>
        <div class="card-header" @click="toggleCard('basic')">
          <span>基础测算表单</span>
          <el-icon class="collapse-icon" :class="{ 'rotate-180': !collapsedCards.basic }">
            <ArrowDown />
          </el-icon>
        </div>
      </template>
      <div v-show="!collapsedCards.basic" class="card-content">
        <div class="desc">填写基础参数后，系统将自动推算"预算适配性"的三个子项分数并填入表格。</div>
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
        <div class="dim-summary" id="calc-summary">
          {{ calcSummary }}
        </div>
        <div class="dim-summary" id="safety-suggestion" style="color:var(--primary);margin-top:8px">
          {{ safetySuggestion }}
        </div>
      </div>
    
    </el-card>

    <!-- 评分表格 -->
    <el-card class="card">
      <template #header>
        <div class="card-header" @click="toggleCard('scoring')">
          <span>场景：深圳刚需购房（核心：预算安全 + 基础配套）</span>
          <el-icon class="collapse-icon" :class="{ 'rotate-180': !collapsedCards.scoring }">
            <ArrowDown />
          </el-icon>
        </div>
      </template>
      <div v-show="!collapsedCards.scoring" class="card-content">
        <el-table :data="scoreItems" border style="width: 100%">
          <el-table-column prop="dimension" label="一级维度" :min-width="isSmallScreen() ? '50%': '100px'" />
          <el-table-column prop="weight" label="权重" :min-width="isSmallScreen() ? '40%': '80px'"/>
          <el-table-column prop="subItem" label="二级子项" :min-width="isSmallScreen() ? '70%': '200px'"/>
          <el-table-column prop="criteria" label="评分标准（0-10 分）" :min-width="isSmallScreen() ? '90%': '280px'"/>
          <el-table-column label="我的打分" :min-width="isSmallScreen() ? '100%': '80%'">
            <template #default="scope">
              <template v-if="scope && scope.row">
                <el-select v-model="scope.row.score" @change="recalc" placeholder="请选择分数" filterable
                  allow-create class="full-width" >
                  <el-option v-for="option in getScoreOptions(scope.row.criteria)" 
                    :key="option.value" 
                    :value="option.value" 
                    :label="option.label" />
                </el-select>
                <span class="weighted">加权得分：<b class="weighted-val">{{ scope.row.weightedScore.toFixed(1) }}</b> 分</span>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <div id="dim-summaries" class="dim-summary" style="margin-top:10px">
          {{ dimensionSummaries }}
        </div>
      </div>
     
    </el-card>

    <!-- 总分展示 -->
    <el-card class="card">
      <div class="total-box">
        <div class="total-score" id="totalScore">当前总得分：{{ totalScore }} 分</div>
        <div :class="['badge', levelClass]" id="levelBadge">{{ levelText }}</div>
        <div class="actions">
          <el-button @click="saveCurrentScore">保存本次评分</el-button>
          <el-button @click="resetScores">重置打分</el-button>
        </div>
      </div>
      <div class="muted" id="advice" style="margin-top:8px">
        {{ adviceText }}
      </div>
    </el-card>
    <el-card class="card" v-if="showHistorySection">
      <template #header>
        <div class="card-header" @click="toggleCard('history')">
          <span>历史评分记录</span>
          <el-icon class="collapse-icon" :class="{ 'rotate-180': !collapsedCards.history }">
            <ArrowDown />
          </el-icon>
        </div>
      </template>
      <div v-show="!collapsedCards.history" class="card-content">
        <el-table :data="sortedHistoryRecords" border style="width: 100%">
          <el-table-column prop="date" label="评分时间" :min-width="isSmallScreen() ? '50%': '120px'" />
          <el-table-column prop="totalScore" label="总分" :min-width="isSmallScreen() ? '50%': '80px'">
            <template #default="scope">
              <span :class="getScoreClass(scope.row.totalScore)">{{ scope.row.totalScore }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="房屋总价(万)" :min-width="isSmallScreen() ? '50%': '100px'" />
          <el-table-column prop="dimensionBreakdown" label="维度得分" :min-width="isSmallScreen() ? '100%': '200px'"/>
          <el-table-column prop="suggestion" label="智能建议" :min-width="isSmallScreen() ? '100%': '120px'" />
          <el-table-column label="操作" width="160px">
            <template #default="scope">
              <el-button size="small" @click="viewRecord(scope.row)">查看</el-button>
              <el-button size="small" type="danger" @click="deleteRecord(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="history-summary">
          <span>历史最高分：<strong>{{ maxScore }}</strong> 分</span>
          <span style="margin-left: 20px">历史平均分：<strong>{{ avgScore.toFixed(1) }}</strong> 分</span>
          <span style="margin-left: 20px">共 <strong>{{ historyRecords.length }}</strong> 次评分</span>
        </div>
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
export default {
  name: 'ScoringView',
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
        repaymentType: 'equalPrincipalInterest', // 新增：还款方式，默认等额本息
        // 新增组合贷相关字段
        commercialLoanAmt: null,  // 商贷金额（万元）
        gjjLoanAmt: null,         // 公积金贷款金额（万元）
        historyRecords: [], // 历史记录数组
        showHistorySection: false, // 控制历史记录部分的显示
        sortBy: 'date-desc' // 排序方式
      },
      formFields: FORM_FIELDS,
      combineLoanFields: COMBINE_LOAN_FIELDS,
      scoreItems: [], // 先初始化为空数组，确保不为null
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
        intro: false,      // 说明卡片
        basic: false,      // 基础测算表单
        scoring: false,    // 评分表格
        total: false,      // 总分展示
        history: false     // 历史记录
      }
    }
  },
  created() {
    // 使用工具类初始化设备检测
    this.updateDeviceInfo();
    this.initScoreItems()
    this.loadHistoryRecords();
    // 创建后立即检查是否有历史记录
    this.showHistorySection = this.historyRecords.length > 0;
  },
  computed: {
    // 排序后的历史记录
    sortedHistoryRecords() {
      const records = [...this.historyRecords];
      switch (this.sortBy) {
        case 'score-desc':
          return records.sort((a, b) => b.totalScore - a.totalScore);
        case 'score-asc':
          return records.sort((a, b) => a.totalScore - b.totalScore);
        case 'date-asc':
          return records.sort((a, b) => new Date(a.date) - new Date(b.date));
        default: // date-desc
          return records.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    },
    // 历史最高分
    maxScore() {
      return this.historyRecords.length > 0
        ? Math.max(...this.historyRecords.map(r => r.totalScore))
        : 0;
    },
    // 历史平均分
    avgScore() {
      return this.historyRecords.length > 0
        ? this.historyRecords.reduce((sum, r) => sum + r.totalScore, 0) / this.historyRecords.length
        : 0;
    }
  },
  methods: {
    initScoreItems() {
      // 使用配置初始化评分项
      this.scoreItems = SCORE_ITEMS_CONFIG.map(item => ({
        ...item,
        score: 0,
        weightedScore: 0
      }));
    },
    // 根据评分标准生成下拉选项
    getScoreOptions(criteria) {
      if (!criteria) return [];
      
      // 解析评分标准文本，提取分数和描述
      const options = [];
      const scorePattern = /（(\d+)\s*分）/g;
      const parts = criteria.split('、');

      parts.forEach(part => {
        const match = part.match(scorePattern);
        if (match) {
          const score = parseInt(match[0].match(/\d+/)[0]);
          options.push({
            value: score,
            label: `${score}分`
          });
        }
      });
      
      // 添加0分选项（如果没有在标准中明确列出）
      if (!options.some(opt => opt.value === 0)) {
        options.push({
          value: 0,
          label: '0分'
        });
      }
      
      // 按分数降序排列
      return options.sort((a, b) => b.value - a.value);
    },
    

    // 贷款类型变化处理（修改）
    handleLoanTypeChange() {
      // 使用配置的利率
      this.formData.rate = LOAN_TYPE_RATES[this.formData.loanType] || 2.8;

      // 如果是组合贷，自动计算初始贷款金额分配
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

      // 默认分配：公积金贷款优先，最高可贷90万，剩余部分商贷
      const gjjMax = 90 // 深圳公积金贷款最高额度（万元）
      this.formData.gjjLoanAmt = Math.min(totalLoanAmt, gjjMax)
      this.formData.commercialLoanAmt = totalLoanAmt - this.formData.gjjLoanAmt
    },

    // 处理组合贷输入（新增方法）
    handleCombineLoanInput(inputType) {
      const { price, downRatio, commercialLoanAmt, gjjLoanAmt } = this.formData

      if (!price || !downRatio) {
        this.$message.warning('请先填写房屋总价和首付比例')
        return
      }

      const totalLoanAmt = price * (1 - downRatio / 100)

      if (inputType === 'commercial' && commercialLoanAmt !== null) {
        // 输入了商贷金额，自动计算公积金贷款金额
        if (commercialLoanAmt > totalLoanAmt) {
          this.$message.error('商贷金额不能超过总贷款金额')
          this.formData.commercialLoanAmt = totalLoanAmt
          this.formData.gjjLoanAmt = 0
        } else {
          this.formData.gjjLoanAmt = totalLoanAmt - commercialLoanAmt
        }
      } else if (inputType === 'gjj' && gjjLoanAmt !== null) {
        // 输入了公积金贷款金额，自动计算商贷金额
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

    // 自动填充预算适配性分数（修改）
    autoFillBudgetScores() {
      const { price, downRatio, rate, years, monthlyIncome, availableFunds, 
        taxReservePct, loanType, commercialLoanAmt, gjjLoanAmt, repaymentType  } = this.formData

      if (!price || !downRatio || !rate || !years) {
        this.calcSummary = '请至少填写：房屋总价、首付比例、贷款方式/利率、贷款年限。'
        this.safetySuggestion = '安全月供建议：月供不超过家庭月收入的30%'
        return
      }

      const downAmtWan = price * (downRatio / 100)
      const totalLoanAmt = price - downAmtWan
      let monthlyPayWan = null
      // 根据贷款类型计算月供
      if (loanType === 'combine') {
        // 组合贷：分别计算商贷和公积金贷款的月供
        if (commercialLoanAmt !== null && gjjLoanAmt !== null) {
          // 验证贷款总额是否匹配
          const inputTotalLoanAmt = commercialLoanAmt + gjjLoanAmt
          if (Math.abs(inputTotalLoanAmt - totalLoanAmt) > 0.01) {
            // 如果不匹配，自动调整
            this.adjustLoanAmounts(totalLoanAmt)
            return
          }

          const commercialMonthly = calcPaymentByType(commercialLoanAmt, 3.1, years, repaymentType) // 商贷利率3.1%
          const gjjMonthly = calcPaymentByType(gjjLoanAmt, 2.6, years, repaymentType) // 公积金利率2.6%
          monthlyPayWan = (commercialMonthly || 0) + (gjjMonthly || 0)
        } else {
          this.calcSummary = '组合贷模式下请填写贷款金额'
          return
        }
      } else {
        // 单一贷款类型
        monthlyPayWan = calcPaymentByType(totalLoanAmt, rate, years, repaymentType)
      }

      // 更新月供安全建议
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

      // 更新计算摘要
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
    },

    // 调整贷款金额（新增方法）
    adjustLoanAmounts(totalLoanAmt) {
      const { commercialLoanAmt, gjjLoanAmt } = this.formData

      if (commercialLoanAmt !== null && gjjLoanAmt === null) {
        // 只有商贷金额，自动计算公积金贷款金额
        this.formData.gjjLoanAmt = totalLoanAmt - commercialLoanAmt
      } else if (gjjLoanAmt !== null && commercialLoanAmt === null) {
        // 只有公积金贷款金额，自动计算商贷金额
        this.formData.commercialLoanAmt = totalLoanAmt - gjjLoanAmt
      } else {
        // 两个金额都有但不匹配，按比例调整
        const ratio = totalLoanAmt / (commercialLoanAmt + gjjLoanAmt)
        this.formData.commercialLoanAmt = commercialLoanAmt * ratio
        this.formData.gjjLoanAmt = gjjLoanAmt * ratio
      }

      this.$message.info('已自动调整贷款金额分配')
      this.autoFillBudgetScores()
    },

    // 更新计算摘要（修改）
    updateCalcSummary(payload) {
      if (!payload) {
        this.calcSummary = '将根据上述参数自动计算：首付金额、贷款金额、月供估算、首付压力、月供压力、税费储备比例等。'
        return
      }

      const parts = []
      if (payload.price) parts.push(`房屋总价≈ ${payload.price.toFixed(2)} 万元`)
      if (Number.isFinite(payload.downAmtWan)) parts.push(`首付≈ ${payload.downAmtWan.toFixed(2)} 万`)
      if (Number.isFinite(payload.totalLoanAmt)) parts.push(`贷款总额≈ ${payload.totalLoanAmt.toFixed(2)} 万`)

      // 组合贷显示详细信息
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

    // 分数输入校验（移除 $index 参数）
    handleScoreBlur(event, row) {
      const value = Number(event.target.value)
      if (isNaN(value) || !Number.isInteger(value) || value < 0 || value > 10) {
        this.$message.error('请输入 0-10 的整数分')
        row.score = 0  // 改为 0 而不是 null
        event.target.value = ''
      } else {
        row.score = value
      }
      this.recalc()
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

      // 更新维度摘要
      this.dimensionSummaries = Object.keys(dimTotals).map(dim => {
        return `${dim}：${dimTotals[dim].toFixed(1)} 分（权重 ${dimWeights[dim]}%，${dimCounts[dim]} 个子项）`
      }).join('； ') || '维度总分：将自动计算并展示。'

      // 更新总分和等级
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
        item.score = 0  // 改为 0 而不是 null
        item.weightedScore = 0
      })
      this.dimensionSummaries = '维度总分：将自动计算并展示。'
      this.totalScore = 0
      this.levelClass = 'danger'
      this.levelText = '不建议入手'
      this.adviceText = '请在表格中为各子项输入 0-10 的整数分，系统将自动计算加权得分与等级建议。'
    },

    // 加载历史记录
    loadHistoryRecords() {
      try {
        const stored = localStorage.getItem('houseScoringHistory');
        if (stored) {
          this.historyRecords = JSON.parse(stored);
          // 加载后检查是否显示历史记录区域
          this.showHistorySection = this.historyRecords.length > 0;
        } else {
          this.historyRecords = [];
        }
      } catch (error) {
        console.error('加载历史记录失败:', error);
        this.historyRecords = [];
      }
    },

    // 保存历史记录到localStorage
    saveHistoryRecords() {
      try {
        localStorage.setItem('houseScoringHistory', JSON.stringify(this.historyRecords));
      } catch (error) {
        console.error('保存历史记录失败:', error);
        this.$message.error('保存历史记录失败');
      }
    },
    // 保存当前评分
    saveCurrentScore() {
      if (this.totalScore === 0) {
        this.$message.warning('请先完成评分再保存');
        return;
      }

      const record = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('zh-CN'),
        totalScore: this.totalScore,
        price: this.formData.price || 0,
        dimensionBreakdown: this.getDimensionBreakdown(),
        suggestion: this.generateSmartSuggestion(),
        formData: { ...this.formData },
        scoreItems: this.scoreItems.map(item => ({ ...item }))
      };

      this.historyRecords.unshift(record);
      this.saveHistoryRecords();
      // 保存后立即显示历史记录区域
      this.showHistorySection = true;
      this.$message.success(`评分已保存！当前总分：${this.totalScore}分`);
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
    // 获取分数样式类
    getScoreClass(score) {
      if (score >= 80) return 'score-high';
      if (score >= 60) return 'score-medium';
      return 'score-low';
    },
    // 查看历史记录
    viewRecord(record) {
      // 填充表单数据
      this.formData = { ...record.formData };
      this.scoreItems = record.scoreItems.map(item => ({ ...item }));

      // 重新计算
      this.recalc();

      this.$message.info(`已加载 ${record.date} 的评分记录`);
    },
    // 删除记录
    deleteRecord(id) {
      this.$confirm('确定要删除这条记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.historyRecords = this.historyRecords.filter(record => record.id !== id);
        this.saveHistoryRecords();
        // 删除后检查是否还需要显示历史记录区域
        this.showHistorySection = this.historyRecords.length > 0;
        this.$message.success('记录已删除');
      });
    },
    // 更新设备信息（简化版）
    updateDeviceInfo() {
      this.deviceInfo = getDeviceInfo();
      this.isMobile = this.deviceInfo.isMobile;
    },
    // 窗口大小变化处理（简化版）
    handleResize(deviceInfo) {
      const wasMobile = this.isMobile;
      this.deviceInfo = deviceInfo;
      this.isMobile = deviceInfo.isMobile;
      
      if (wasMobile !== this.isMobile) {
        console.log(`设备类型切换: ${this.isMobile ? '移动端' : '桌面端'}`);
        // 这里可以触发界面更新或其他逻辑
        this.$forceUpdate(); // 强制更新视图（如果需要）
      }
    },
    // 判断是否是小屏幕（新增便捷方法）
    isSmallScreen() {
      return this.isMobile || this.deviceInfo.screenSize === 'sm';
    },
    // 切换卡片收起状态
    toggleCard(cardKey) {
      this.collapsedCards[cardKey] = !this.collapsedCards[cardKey]
    },

  },
  mounted() {
    this.recalc()
    // 使用工具类添加窗口大小变化监听
    this.removeResizeListener = addResizeListener((info) => {
      this.handleResize(info);
    });
  },
   beforeUnmount() {
    // 清理事件监听
    if (this.removeResizeListener) {
      this.removeResizeListener();
    }
  },
}
</script>

<style scoped>
.scoring-container {
  max-width: 100%;
  margin: 24px auto;
  padding: 0 16px;
}

.card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;
  font-weight: 600;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.card-header:hover {
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
}

.collapse-icon {
  transition: transform 0.3s ease;
  color: var(--el-text-color-secondary);
}

.collapse-icon.rotate-180 {
  transform: rotate(180deg);
}
.card-content {
  padding-top: 12px;
}
h1 {
  margin: 0 0 10px;
  font-size: 22px;
}

.desc {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.dim-title {
  font-weight: 600;
  font-size: 15px;
  margin: 8px 0;
  color: var(--el-text-color-primary);
}

.dim-summary {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-top: 6px;
}

.weighted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-left: 8px;
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

/* 历史记录相关样式 */
.history-summary {
  margin-top: 10px;
  padding: 8px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.score-high {
  color: #67c23a;
  font-weight: bold;
}

.score-medium {
  color: #e6a23c;
  font-weight: bold;
}

.score-low {
  color: #f56c6c;
  font-weight: bold;
}
</style>
