<template>
  <section class="budget-form"> 
    <h3>基础测算参数</h3>
    <div class="desc">填写基础参数后，系统将自动计算月供压力趋势</div>
    
    <el-form :model="formData" :label-width="isSmallScreen ? '50%' : '35%'" class="basic-form">
      <el-row :gutter="20">
        <!-- 贷款类型选择 -->
        <el-col :xs="24" :sm="12">
          <el-form-item label="贷款类型" class="form-item-responsive">
            <el-select 
              v-model="formData.loanType"
              @change="handleLoanTypeChange"
              class="full-width"
            >
              <el-option 
                v-for="option in loanTypeOptions"
                :key="option.value" 
                :value="option.value"
                :label="option.label" 
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 动态字段渲染 -->
      <el-row :gutter="20" v-for="field in visibleFields" :key="field.prop">
        <el-col :xs="24" :sm="field.prop === 'loanType' ? 24 : 12">
          <el-form-item :label="field.label" class="form-item-responsive">
            <template v-if="field.type === 'select'">
              <el-select
                v-model="formData[field.prop]"
                @change="handleFormChange"
                class="full-width"
              >
                <el-option
                  v-for="option in field.options"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </el-select>
            </template>
            <template v-else>
              <el-input
                v-model.number="formData[field.prop]"
                :type="field.type"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                :placeholder="field.placeholder"
                @blur="handleFormChange"
                class="full-width"
              />
            </template>
            <span v-if="field.tip" class="muted tip">{{ field.tip }}</span>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 还款方式选择 -->
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-form-item label="还款方式" class="form-item-responsive">
            <el-select
              v-model="formData.repaymentType"
              @change="handleFormChange"
              class="full-width"
            >
              <el-option
                v-for="option in repaymentTypeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </el-select>
            <span class="muted tip">等额本息：月供固定；等额本金：前期月供较高</span>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 利率显示 -->
      <el-row :gutter="20" v-if="effectiveRate > 0">
        <el-col :xs="24">
          <div class="rate-display">
            <span class="rate-label">综合年化利率：</span>
            <span class="rate-value">{{ effectiveRate.toFixed(2) }}%</span>
            <span v-if="formData.loanType === 'combined'" class="rate-detail">
              （商业{{ formData.commercialRate }}% + 公积金{{ formData.providentRate }}%）
            </span>
          </div>
        </el-col>
      </el-row>
    </el-form>

    <!-- 计算摘要 -->
    <div class="calc-summary">
      <div v-if="summary" class="summary-text">{{ summary }}</div>
      <div v-else class="summary-placeholder">请填写基础参数查看计算结果</div>
      <div v-if="validationMessage" class="validation-error">{{ validationMessage }}</div>
    </div>
  </section>
</template>

<script>
import {
  BUDGET_FORM_FIELDS,
  REPAYMENT_TYPE_OPTIONS,
  DEFAULT_FORM_DATA,
  LOAN_TYPE_OPTIONS,
  getEffectiveRate,
  validateCombinedLoan
} from '@/utils/budget-simulator-config'
import { calcPaymentByType } from '@/utils/loan-calculator'

export default {
  name: 'BudgetSimulatorForm',
  props: {
    isSmallScreen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      formData: { ...DEFAULT_FORM_DATA },
      formFields: BUDGET_FORM_FIELDS,
      repaymentTypeOptions: REPAYMENT_TYPE_OPTIONS,
      loanTypeOptions: LOAN_TYPE_OPTIONS,
      summary: '',
      validationMessage: '',
      effectiveRate: 0
    }
  },
  computed: {
    visibleFields() {
      return this.formFields.filter(field => {
        // 过滤掉重复的贷款类型
        if (field.prop === 'loanType') return false
        if (!field.showCondition) return true
        return field.showCondition(this.formData)
      })
    }
  },
  watch: {
    formData: {
      handler() {
        this.calcSummary()
        this.effectiveRate = getEffectiveRate(this.formData)
      },
      deep: true
    }
  },
  mounted() {
    this.calcSummary()
    this.effectiveRate = getEffectiveRate(this.formData)
  },
  methods: {
    handleLoanTypeChange() {
      // 重置相关字段
      if (this.formData.loanType !== 'combined') {
        this.formData.commercialAmount = 0
        this.formData.providentAmount = 0
      }
      this.handleFormChange()
    },

    handleFormChange() {
      const validation = validateCombinedLoan(this.formData)
      if (!validation.valid) {
        this.validationMessage = validation.message
      } else {
        this.validationMessage = ''
        this.$emit('form-change', this.getNormalizedFormData())
      }
    },

    getNormalizedFormData() {
      const baseData = {
        principal: Math.max(0, (Number(this.formData.principal) || 0)) * 10000,
        annualRate: this.effectiveRate,
        years: Math.min(30, Math.max(1, Number(this.formData.years) || 1)),
        monthlyIncome: Math.max(1, (Number(this.formData.monthlyIncome) || 0)) * 10000,
        repaymentType: this.formData.repaymentType,
        loanType: this.formData.loanType,
        commercialRate: Number(this.formData.commercialRate) || 0,
        providentRate: Number(this.formData.providentRate) || 0,
        commercialAmount: Math.max(0, (Number(this.formData.commercialAmount) || 0)) * 10000,
        providentAmount: Math.max(0, (Number(this.formData.providentAmount) || 0)) * 10000
      }

      return baseData
    },

    calcSummary() {
      const normalizedData = this.getNormalizedFormData()
      const { principal, annualRate, years, monthlyIncome, repaymentType } = normalizedData

      if (!principal || !annualRate || !years || !monthlyIncome) {
        this.summary = ''
        return
      }

      // 注意：calcPaymentByType 期望 principal 是以万元为单位的
      const principalInWan = principal / 10000
      const monthlyPay = calcPaymentByType(principalInWan, annualRate, years, repaymentType)
      const monthlyPayFormatted = monthlyPay ? monthlyPay.toFixed(2) : '计算中'
      const pressureRatio = monthlyPay ? (monthlyPay * 10000 / monthlyIncome * 100).toFixed(1) : '0.0'

      this.summary = `月供估算: ${monthlyPayFormatted} 万元/月 | 月供占收入比: ${pressureRatio}%`

      // 触发父组件更新
      this.$nextTick(() => {
        if (!this.validationMessage) {
          this.handleFormChange()
        }
      })
    }
  }
}
</script>

<style scoped>
.budget-form {
  margin-bottom: 24px;
}

.desc {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.calc-summary {
  margin-top: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid var(--el-color-primary);
}

.summary-text {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.summary-placeholder {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.validation-error {
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 8px;
  font-weight: 500;
}

.rate-display {
  background: #e6f7ff;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #91d5ff;
  margin-bottom: 16px;
}

.rate-label {
  font-weight: 500;
  color: #1890ff;
}

.rate-value {
  font-weight: bold;
  color: #ff4d4f;
  margin: 0 4px;
}

.rate-detail {
  font-size: 12px;
  color: #666;
}

.muted.tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.full-width {
  width: 100%;
}
</style>