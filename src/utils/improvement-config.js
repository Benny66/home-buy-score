// 改善型购房评分配置
export const IMPROVEMENT_SCORE_ITEMS_CONFIG = [
  {
    dimension: '房源品质',
    weight: 35,
    count: 4,
    subItem: '户型舒适度',
    item: 'layoutComfort',
    criteria: '南北通透 + 大横厅 + 双卫 + 衣帽间（10分）、缺1-2项（8分）、缺3项（5分）、缺4项（2分）'
  },
  {
    dimension: '房源品质',
    weight: 35,
    count: 4,
    subItem: '小区环境',
    item: 'communityEnvironment',
    criteria: '容积率≤2.5 + 绿化率≥35% + 楼间距≥50米（10分）、缺1项（8分）、缺2项（5分）、缺3项（2分）'
  },
  {
    dimension: '房源品质',
    weight: 35,
    count: 4,
    subItem: '物业服务',
    item: 'propertyService',
    criteria: '品牌物业（物业费≥3元/㎡）+ 24小时安保 + 绿化维护好（10分）、缺1项（7分）、缺2项（4分）'
  },
  {
    dimension: '房源品质',
    weight: 35,
    count: 4,
    subItem: '房屋年龄',
    item: 'houseAge',
    criteria: '新房（10分）、次新房（≤5年）（8分）、6-10年（5分）、＞10年（2分）'
  },
  {
    dimension: '区域配套',
    weight: 25,
    count: 3,
    subItem: '高端配套',
    item: 'highEndFacilities',
    criteria: '周边有公园 + 优质医院 + 高端商业（10分）、缺1项（7分）、缺2项（4分）、都无（1分）'
  },
  {
    dimension: '区域配套',
    weight: 25,
    count: 3,
    subItem: '通勤便利性',
    item: 'commuteConvenience',
    criteria: '≤25分钟（10分）、26-35分钟（8分）、36-45分钟（5分）、＞45分钟（2分）'
  },
  {
    dimension: '区域配套',
    weight: 25,
    count: 3,
    subItem: '圈层氛围',
    item: 'communityAtmosphere',
    criteria: '小区业主学历/职业匹配度高（10分）、一般（6分）、杂乱（2分）'
  },
  {
    dimension: '预算适配性',
    weight: 15,
    count: 2,
    subItem: '首付压力',
    item: 'downPaymentPressure',
    criteria: '≤40%（10分）、41-50%（7分）、51-60%（4分）、＞60%（1分）'
  },
  {
    dimension: '预算适配性',
    weight: 15,
    count: 2,
    subItem: '月供压力',
    item: 'monthlyPressure',
    criteria: '≤25%（10分）、26-35%（7分）、36-45%（4分）、＞45%（1分）'
  },
  {
    dimension: '产权风险',
    weight: 15,
    count: 2,
    subItem: '产权合规性',
    item: 'propertyCompliance',
    criteria: '无抵押/查封/居住权（10分）、有抵押可解押（6分）、有查封/居住权（0分）'
  },
  {
    dimension: '产权风险',
    weight: 15,
    count: 2,
    subItem: '增值潜力',
    item: 'appreciationPotential',
    criteria: '核心地段 + 规划利好（10分）、核心地段无规划（7分）、非核心地段有规划（5分）、都无（2分）'
  },
  {
    dimension: '居住需求匹配',
    weight: 10,
    count: 2,
    subItem: '功能适配',
    item: 'functionalFit',
    criteria: '满足二胎/老人同住/办公需求（10分）、部分满足（7分）、不满足（3分）'
  },
  {
    dimension: '居住需求匹配',
    weight: 10,
    count: 2,
    subItem: '噪音/隐私',
    item: 'noisePrivacy',
    criteria: '低楼层无遮挡 + 无噪音污染（10分）、轻微影响（7分）、明显影响（3分）'
  }
];

// 改善型购房专用表单字段
export const IMPROVEMENT_FORM_FIELDS = [
  {
    prop: 'price',
    label: '房屋总价（万元）',
    type: 'number',
    placeholder: '请输入房屋总价',
    min: 0,
    step: 1
  },
  {
    prop: 'downRatio',
    label: '首付比例（%）',
    type: 'number',
    placeholder: '请输入首付比例',
    min: 0,
    max: 100,
    step: 1,
    tip: '改善型建议首付≤40%'
  },
  {
    prop: 'monthlyIncome',
    label: '家庭月收入（万元）',
    type: 'number',
    placeholder: '请输入家庭月收入',
    min: 0,
    step: 0.1,
    tip: '改善型建议月供≤25%收入'
  },
  {
    prop: 'availableFunds',
    label: '可用资金（万元）',
    type: 'number',
    placeholder: '请输入可用资金',
    min: 0,
    step: 1,
    tip: '包括首付+税费+装修等'
  }
];