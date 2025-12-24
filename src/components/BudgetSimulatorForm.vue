<template>
  <section class="budget-form">
    <h3>基础测算参数</h3>
    <div class="desc">填写基础参数后，系统将自动计算月供压力趋势</div>
    
    <el-form :model="formData" :label-width="isSmallScreen ? '50%' : '35%'" class="basic-form">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" v-for="field in formFields" :key="field.prop">
          <el-form-item :label="field.label" class="form-item-responsive">
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
    </el-form>

    <!-- 计算摘要 -->
    <div class="calc-summary">
      <div v-if="summary" class="summary-text">{{ summary }}</div>
      <div v-else class="summary-placeholder">请填写基础参数查看计算结果</div>
    </div>
  </section>
</template>

<script>
import { BUDGET_FORM_FIELDS, REPAYMENT_TYPE_OPTIONS, DEFAULT_FORM_DATA } from '@/utils/budget-simulator-config'
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
      summary: ''
    }
  },
  watch: {
    formData: {
      handler() {
        this.calcSummary()
      },
      deep: true
    }
  },
  mounted() {
    this.calcSummary()
  },
  methods: {
    handleFormChange() {
      this.$emit('form-change', this.getNormalizedFormData())
    },

    getNormalizedFormData() {
      return {
        principal: Math.max(0, (Number(this.formData.principal) || 0)) * 10000,
        annualRate: Math.max(0, Number(this.formData.annualRate) || 0),
        years: Math.min(30, Math.max(1, Number(this.formData.years) || 1)),
        monthlyIncome: Math.max(1, (Number(this.formData.monthlyIncome) || 0)) * 10000,
        repaymentType: this.formData.repaymentType
      }
    },

    calcSummary() {
      const { principal, annualRate, years, monthlyIncome, repaymentType } = this.formData

      if (!principal || !annualRate || !years || !monthlyIncome) {
        this.summary = ''
        return
      }

      const monthlyPay = calcPaymentByType(principal, annualRate, years, repaymentType)
      const monthlyPayFormatted = monthlyPay ? monthlyPay.toFixed(2) : '计算中'
      const pressureRatio = monthlyPay ? (monthlyPay / monthlyIncome * 100).toFixed(1) : '0.0'

      this.summary = `月供估算: ${monthlyPayFormatted} 万元/月 | 月供占收入比: ${pressureRatio}%`

      // 触发父组件更新
      this.$nextTick(() => {
        this.handleFormChange()
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

.muted.tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.full-width {
  width: 100%;
}
</style>