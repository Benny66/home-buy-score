// 预算模拟器表单配置
export const BUDGET_FORM_FIELDS = [
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
    prop: 'annualRate',
    label: '年化利率 / LPR（%）',
    type: 'number',
    min: 0,
    step: 0.05,
    placeholder: '例如：4.2',
    tip: '年化利率百分比'
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
  principal: 100,
  annualRate: 4.2,
  years: 30,
  monthlyIncome: 2.5,
  repaymentType: 'equalPrincipalInterest'
}