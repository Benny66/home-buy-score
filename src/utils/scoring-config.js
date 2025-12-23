// 表单字段配置
export const FORM_FIELDS = [
  {
    prop: 'price',
    label: '房屋总价（万元）',
    type: 'number',
    min: 0,
    step: 0.01,
    placeholder: '例：300'
  },
  {
    prop: 'downRatio',
    label: '首付比例（%）',
    type: 'number',
    min: 0,
    max: 100,
    step: 1,
    placeholder: '20',
    tip: '默认：20%（深圳首套）'
  },
  {
    prop: 'loanType',
    label: '贷款方式',
    type: 'select',
    style: { width: '120px' },
    options: [
      { value: 'gjj', label: '公积金' },
      { value: 'sld', label: '商贷' },
      { value: 'combine', label: '组合贷' }
    ]
  },
  {
    prop: 'rate',
    label: '年化利率（%）',
    type: 'number',
    min: 0,
    step: 0.01,
    placeholder: '2.6',
    tip: '默认：公积金 2.6%，商贷 3.1%，组合贷 2.8%'
  },
  {
    prop: 'years',
    label: '贷款年限（年）',
    type: 'number',
    min: 1,
    max: 30,
    step: 1,
    placeholder: '30',
    tip: '默认：30年'
  },
  {
    prop: 'monthlyIncome',
    label: '家庭月收入（万元）',
    type: 'number',
    min: 0,
    step: 0.01,
    placeholder: '例：3.5'
  },
  {
    prop: 'availableFunds',
    label: '用于首付的可支配资金（万元）',
    type: 'number',
    min: 0,
    step: 0.01,
    placeholder: '例：120'
  },
  {
    prop: 'taxReservePct',
    label: '税费储备比例（%）（占房价）',
    type: 'number',
    min: 0,
    max: 100,
    step: 0.1,
    placeholder: '5',
    tip: '默认：5%（含契税等）'
  }
];

export const COMBINE_LOAN_FIELDS = [
  {
    prop: 'commercialLoanAmt',
    label: '商贷金额（万元）',
    type: 'number',
    min: 0,
    step: 0.01,
    placeholder: '商贷金额',
    inputType: 'commercial'
  },
  {
    prop: 'gjjLoanAmt',
    label: '公积金贷款金额（万元）',
    type: 'number',
    min: 0,
    step: 0.01,
    placeholder: '公积金贷款金额',
    inputType: 'gjj'
  }
];

// 贷款类型对应的默认利率
export const LOAN_TYPE_RATES = {
  'gjj': 2.6,
  'sld': 3.1,
  'combine': 2.8
};

// 评分项配置
export const SCORE_ITEMS_CONFIG = [
  // 预算适配性（30%）
  { dimension: '预算适配性', weight: 30, count: 3, subItem: '首付压力（首付/家庭可支配资金）', criteria: '≤30%（10 分）、31-40%（8 分）、41-50%（5 分）、＞50%（0 分）', item: 'downPaymentPressure' },
  { dimension: '预算适配性', weight: 30, count: 3, subItem: '月供压力（月供/家庭月收入）', criteria: '≤30%（10 分）、31-40%（7 分）、41-50%（3 分）、＞50%（0 分）', item: 'monthlyPressure' },
  { dimension: '预算适配性', weight: 30, count: 3, subItem: '税费储备（税费/房价）', criteria: '预留≥5%（10 分）、3-4%（6 分）、1-2%（2 分）、无储备（0 分）', item: 'taxReserve' },
  
  // 区域配套（25%）
  { dimension: '区域配套', weight: 25, count: 3, subItem: '通勤便利性（高峰期）', criteria: '≤30 分钟（10 分）、31-45 分钟（7 分）、46-60 分钟（4 分）、＞60 分钟（1 分）' },
  { dimension: '区域配套', weight: 25, count: 3, subItem: '学区资源', criteria: '省/市重点学区（10 分）、区重点（8 分）、普通学区（5 分）、无对口学区（2 分）' },
  { dimension: '区域配套', weight: 25, count: 3, subItem: '基础配套', criteria: '步行10分钟内地铁+商超（10 分）、缺一项（7 分）、都无（3 分）' },
  
  // 房源品质（20%）
  { dimension: '房源品质', weight: 20, count: 3, subItem: '户型实用性', criteria: '方正+南北通透+明厨明卫（10 分）、缺 1 项（7 分）、缺 2 项（4 分）、全缺（1 分）' },
  { dimension: '房源品质', weight: 20, count: 3, subItem: '楼层适配', criteria: '中间层（10 分）、中高层/中低层（8 分）、底层（非 1 楼）（5 分）、1 楼/顶楼（2 分）' },
  { dimension: '房源品质', weight: 20, count: 3, subItem: '房屋质量', criteria: '新房（五证齐全）/ 次新房（无维修记录）（10 分）、轻微瑕疵（7 分）、明显问题（3 分）' },
  
  // 产权风险（15%）
  { dimension: '产权风险', weight: 15, count: 2, subItem: '产权合规性', criteria: '无抵押/查封/居住权（10 分）、有抵押但可解押（6 分）、有查封/居住权（0 分）' },
  { dimension: '产权风险', weight: 15, count: 2, subItem: '开发商/业主资质', criteria: '品牌开发商（10 分）、本地知名（8 分）、小开发商（5 分）、无资质证明（0 分）' },
  
  // 居住需求匹配（10%）
  { dimension: '居住需求匹配', weight: 10, count: 2, subItem: '面积适配', criteria: '人均≥25㎡（10 分）、20-24㎡（8 分）、15-19㎡（5 分）、＜15㎡（2 分）' },
  { dimension: '居住需求匹配', weight: 10, count: 2, subItem: '噪音/环境', criteria: '无高压线/垃圾站/高架桥（10 分）、有一项不利因素（5 分）、多项（2 分）' }
];