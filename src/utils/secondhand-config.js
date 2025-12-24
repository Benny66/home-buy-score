// 二手房购房评分配置
export const SECONDHAND_SCORE_ITEMS_CONFIG = [
  {
    dimension: '产权风险',
    weight: 30,
    count: 3,
    subItem: '产权核查',
    item: 'propertyVerification',
    criteria: '无抵押/查封/居住权 + 户口已迁出（10分）、缺1项（7分）、缺2项（3分）、缺3项（0分）'
  },
  {
    dimension: '产权风险',
    weight: 30,
    count: 3,
    subItem: '房屋抵押情况',
    item: 'mortgageStatus',
    criteria: '无抵押（10分）、有抵押但可解押（6分）、多次抵押（2分）、抵押无法解押（0分）'
  },
  {
    dimension: '产权风险',
    weight: 30,
    count: 3,
    subItem: '业主资质',
    item: 'ownerQualification',
    criteria: '产权清晰 + 无债务纠纷（10分）、产权清晰有小额债务（7分）、有债务纠纷（0分）'
  },
  {
    dimension: '房源品质',
    weight: 25,
    count: 3,
    subItem: '房龄与折旧',
    item: 'houseAgeDepreciation',
    criteria: '≤5年（10分）、6-10年（8分）、11-15年（5分）、16-20年（3分）、＞20年（1分）'
  },
  {
    dimension: '房源品质',
    weight: 25,
    count: 3,
    subItem: '房屋质量',
    item: 'houseQuality',
    criteria: '无漏水/空鼓/裂缝 + 水电线路正常（10分）、轻微问题（7分）、明显问题（3分）、严重问题（0分）'
  },
  {
    dimension: '房源品质',
    weight: 25,
    count: 3,
    subItem: '装修适配',
    item: 'renovationFit',
    criteria: '近5年精装修（10分）、简装可直接入住（7分）、需局部翻新（4分）、需全拆重装（1分）'
  },
  {
    dimension: '预算适配性',
    weight: 20,
    count: 3,
    subItem: '总价性价比',
    item: 'priceValue',
    criteria: '低于同小区均价5-10%（10分）、持平（7分）、高于5%（4分）、高于10%（1分）'
  },
  {
    dimension: '预算适配性',
    weight: 20,
    count: 3,
    subItem: '税费成本',
    item: 'taxCost',
    criteria: '满五唯一（10分）、满二唯一（7分）、满二不唯一（4分）、不满二（1分）'
  },
  {
    dimension: '预算适配性',
    weight: 20,
    count: 3,
    subItem: '维修储备',
    item: 'maintenanceReserve',
    criteria: '预留≥3%（10分）、1-2%（6分）、无储备（2分）（维修基金/房价）'
  },
  {
    dimension: '区域配套',
    weight: 15,
    count: 2,
    subItem: '配套成熟度',
    item: 'facilityMaturity',
    criteria: '地铁 + 商超 + 学校 + 医院齐全（10分）、缺1项（7分）、缺2项（4分）、缺3项（1分）'
  },
  {
    dimension: '区域配套',
    weight: 15,
    count: 2,
    subItem: '小区入住率',
    item: 'occupancyRate',
    criteria: '≥80%（10分）、60-79%（7分）、40-59%（4分）、＜40%（1分）'
  },
  {
    dimension: '居住需求匹配',
    weight: 10,
    count: 2,
    subItem: '户型/面积适配',
    item: 'layoutAreaFit',
    criteria: '完全满足需求（10分）、基本满足（7分）、部分满足（4分）、不满足（1分）'
  },
  {
    dimension: '居住需求匹配',
    weight: 10,
    count: 2,
    subItem: '邻里环境',
    item: 'neighborhoodEnvironment',
    criteria: '无纠纷 + 作息规律（10分）、一般（6分）、有纠纷（2分）'
  }
];

// 二手房专用表单字段
export const SECONDHAND_FORM_FIELDS = [
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
    tip: '二手房首付比例通常较高'
  },
  {
    prop: 'houseAge',
    label: '房屋年龄（年）',
    type: 'number',
    placeholder: '请输入房屋建成年龄',
    min: 0,
    step: 1,
    tip: '影响贷款年限和房屋价值'
  },
  {
    prop: 'communityAvgPrice',
    label: '小区均价（万元/㎡）',
    type: 'number',
    placeholder: '请输入小区均价',
    min: 0,
    step: 0.1,
    tip: '用于计算性价比'
  },
  {
    prop: 'houseArea',
    label: '房屋面积（㎡）',
    type: 'number',
    placeholder: '请输入房屋面积',
    min: 0,
    step: 1,
    tip: '影响总价和税费计算'
  },
  {
    prop: 'taxType',
    label: '税费类型',
    type: 'select',
    placeholder: '请选择税费类型',
    options: [
      { value: 'full5unique', label: '满五唯一' },
      { value: 'full2unique', label: '满二唯一' },
      { value: 'full2notunique', label: '满二不唯一' },
      { value: 'notfull2', label: '不满二' }
    ],
    tip: '影响税费成本评分'
  }
];