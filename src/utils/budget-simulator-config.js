// 预算模拟器表单配置
export const LOAN_TYPES = { 
  COMMERCIAL: 'commercial',
  PROVIDENT: 'provident',
  COMBINED: 'combined'
}

export const LOAN_TYPE_OPTIONS = [
  { value: LOAN_TYPES.COMMERCIAL, label: '商业贷款' },
  { value: LOAN_TYPES.PROVIDENT, label: '公积金贷款' },
  { value: LOAN_TYPES.COMBINED, label: '组合贷款' }
]

export const BUDGET_FORM_FIELDS = [
  {
    prop: 'loanType',
    label: '贷款类型',
    type: 'select',
    options: LOAN_TYPE_OPTIONS,
    placeholder: '选择贷款类型'
  },
  {
    prop: 'principal',
    label: '贷款本金（万元）',
    type: 'number',
    min: 0,
    step: 1,
    placeholder: '例如：100',
    tip: '贷款总金额，单位：万元'
  },
  {
    prop: 'commercialRate',
    label: '商业贷款利率（%）',
    type: 'number',
    min: 0,
    step: 0.05,
    placeholder: '例如：3.1',
    tip: '商业贷款年化利率',
    showCondition: (formData) => formData.loanType === LOAN_TYPES.COMBINED || formData.loanType === LOAN_TYPES.COMMERCIAL
  },
  {
    prop: 'providentRate',
    label: '公积金利率（%）',
    type: 'number',
    min: 0,
    step: 0.05,
    placeholder: '例如：2.6',
    tip: '公积金贷款年化利率',
    showCondition: (formData) => formData.loanType === LOAN_TYPES.COMBINED || formData.loanType === LOAN_TYPES.PROVIDENT
  },
  {
    prop: 'commercialAmount',
    label: '商业贷款金额（万元）',
    type: 'number',
    min: 0,
    step: 1,
    placeholder: '例如：50',
    tip: '商业贷款部分金额',
    showCondition: (formData) => formData.loanType === LOAN_TYPES.COMBINED
  },
  {
    prop: 'providentAmount',
    label: '公积金贷款金额（万元）',
    type: 'number',
    min: 0,
    step: 1,
    placeholder: '例如：50',
    tip: '公积金贷款部分金额',
    showCondition: (formData) => formData.loanType === LOAN_TYPES.COMBINED
  },
  {
    prop: 'years',
    label: '贷款年限（年）',
    type: 'number',
    min: 1,
    max: 30,
    step: 1,
    placeholder: '例如：30',
    tip: '1-30年'
  },
  {
    prop: 'monthlyIncome',
    label: '月收入（万元）',
    type: 'number',
    min: 0.1,
    step: 0.1,
    placeholder: '例如：2.5',
    tip: '家庭月收入，单位：万元'
  }
]

// 还款方式选项
export const REPAYMENT_TYPE_OPTIONS = [
  { value: 'equalPrincipalInterest', label: '等额本息' },
  { value: 'equalPrincipal', label: '等额本金' }
]

// 默认表单数据
export const DEFAULT_FORM_DATA = {
  loanType: LOAN_TYPES.COMMERCIAL,
  principal: 100,
  commercialRate: 3.1,
  providentRate: 2.6,
  commercialAmount: 0,
  providentAmount: 0,
  years: 30,
  monthlyIncome: 2.5,
  repaymentType: 'equalPrincipalInterest'
}

// 获取当前有效的利率
export function getEffectiveRate(formData) {
  switch (formData.loanType) {
    case LOAN_TYPES.COMMERCIAL:
      return formData.commercialRate
    case LOAN_TYPES.PROVIDENT:
      return formData.providentRate
    case LOAN_TYPES.COMBINED:
      // 组合贷款按金额加权平均计算综合利率
      const total = (formData.commercialAmount || 0) + (formData.providentAmount || 0)
      if (total === 0) return 0
      return ((formData.commercialAmount || 0) * formData.commercialRate + 
              (formData.providentAmount || 0) * formData.providentRate) / total
    default:
      return formData.commercialRate
  }
}

// 验证组合贷款金额
export function validateCombinedLoan(formData) {
  if (formData.loanType === LOAN_TYPES.COMBINED) {
    const commercial = formData.commercialAmount || 0
    const provident = formData.providentAmount || 0
    const total = commercial + provident
    
    if (total === 0) return { valid: false, message: '请填写商业贷款和公积金贷款金额' }
    if (Math.abs(total - formData.principal) > 0.01) {
      return { 
        valid: false, 
        message: `组合贷款总额(${total}万元)与总本金(${formData.principal}万元)不一致` 
      }
    }
  }
  return { valid: true }
}
