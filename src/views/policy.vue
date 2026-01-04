<!-- src/views/policy.vue -->
<template>
    <div class="policy-page">
      <h1>2023-2025年深圳房产政策时间轴</h1>
      <div class="policy-content">
        <!-- 时间轴图表容器 -->
        <div ref="chartRef" class="timeline-chart"></div>
        
        <!-- 详情面板 -->
        <div class="detail-panel" v-if="selectedPolicy">
          <div class="detail-header">
            <h2>{{ selectedPolicy.time }} - {{ selectedPolicy.title }}</h2>
            <span class="policy-tag" :style="{ backgroundColor: getTagColor(selectedPolicy.type) }">
              {{ selectedPolicy.type }}
            </span>
          </div>
          <div class="detail-content">
            <div class="detail-section">
              <h3>政策影响</h3>
              <p>{{ selectedPolicy.impact }}</p>
            </div>
            <div class="detail-section">
              <h3>举例说明</h3>
              <p>{{ selectedPolicy.example }}</p>
            </div>
            <div class="detail-section">
              <h3>数据来源</h3>
              <p><a :href="selectedPolicy.source" target="_blank">{{ selectedPolicy.source }}</a></p>
            </div>
          </div>
          <button class="close-btn" @click="selectedPolicy = null">关闭详情</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import * as echarts from 'echarts'
  
  // 政策数据
  const policyData = [
    {
      time: '2023-01-05',
      title: '二手房"带押过户"模式',
      type: '交易流程',
      summary: '二手房带押过户落地，无需赎楼即可交易',
      impact: '简化交易流程，缩短交易周期，降低卖方赎楼资金成本，激活二手房市场流动性。',
      example: '业主A有一套价值500万的房子，尚有200万房贷未还清，通过"带押过户"可直接卖给买家B，买家B的贷款直接用于偿还业主A的剩余房贷，无需提前筹款赎楼。',
      source: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zwdt/content/post_10370323.html'
    },
    {
      time: '2023-03-24',
      title: '新版公积金贷款规定',
      type: '公积金',
      summary: '人才公积金贷款额度提高至126万元',
      impact: '降低人才及刚需群体购房门槛，减少商业贷款依赖，支持刚性和改善性住房需求。',
      example: '35岁的博士毕业生李先生在深圳工作满2年，购买一套400万的首套房，使用公积金贷款可贷126万，比普通家庭多贷36万，降低商业贷款压力。',
      source: 'https://www.sz.gov.cn/zl/gbm/content/post_10870837.html'
    },
    {
      time: '2023-04-20',
      title: '二手房参考价与房贷脱钩',
      type: '限贷',
      summary: '参考价仅作参考，按网签价或评估价核定贷款',
      impact: '解决"参考价低于市场价"导致的贷款额度不足问题，提高购房者实际贷款能力，提振二手房交易信心。',
      example: '一套市场价800万的二手房，官方参考价600万，政策前最多贷420万，政策后可贷560万，增加140万贷款额度。',
      source: 'http://companies.caixin.com/m/2023-04-21/102022381.html'
    },
    {
      time: '2023-08-31',
      title: '认房不认贷政策',
      type: '限贷',
      summary: '名下无房即按首套执行，降低改善型购房门槛',
      impact: '降低改善型购房者首付比例和利率成本，释放跨区域改善性住房需求，优化信贷资源配置。',
      example: '市民张先生曾在外地贷款买房，已还清并出售，现深圳购房按首套执行，首付30%(此前需40%)，利率4.1%(此前需4.5%)。',
      source: 'http://big5.china.com.cn/gate/big5/news.china.com.cn/2024-11/19/content_117557372.shtml'
    },
    {
      time: '2023-09-29',
      title: '房贷利率下限调整',
      type: '限贷',
      summary: '首套房贷利率降至LPR-10个基点(4.1%)',
      impact: '直接降低购房月供成本，减轻购房者还款压力，刺激刚性和改善性购房需求释放。',
      example: '贷款300万，30年期，首套房贷月供从15921元降至15360元，每月减少561元，30年共节省201960元。',
      source: 'https://news.cnstock.com/news,bwkx-202309-5130055.htm'
    },
    {
      time: '2023-09-18',
      title: '取消离婚购房限制',
      type: '限购',
      summary: '离婚后按个人名下实际住房套数认定资格',
      impact: '保障离婚人士合理购房需求，消除政策歧视，补充部分改善性购房购买力。',
      example: '王女士与丈夫离婚，名下无房，离婚后可立即按首套政策购房，无需等待3年。',
      source: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zwdt/content/mpost_11274173.html'
    },
    {
      time: '2023-11-23',
      title: '二套首付比例调整',
      type: '限贷',
      summary: '二套首付统一调整为40%，取消豪宅税价格标准',
      impact: '大幅降低改善型购房门槛，取消"豪宅税"认定的价格标准，降低大户型交易税费，激活改善型市场。',
      example: '购买一套价值1000万、140㎡的改善型住房，此前按非普宅需首付800万，调整后只需首付400万，节省400万资金。',
      source: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zwdt/content/post_10370323.html'
    },
    {
      time: '2024-09-29',
      title: '929新政',
      type: '限购',
      summary: '非核心区取消限购，首付比例降至历史最低',
      impact: '购房门槛降至历史最低，激活刚需和投资需求；二手房交易成本大幅降低，促进"以旧换新"；市场活跃度显著提升，成交量激增。',
      example: '1. 非深户在龙岗区购房，无需社保即可购买，首付只需15%；2. 一套购买3年的500万住房出售，此前需缴25万增值税，政策后免征。',
      source: 'https://www.sz.gov.cn/ztfw/zfly/'
    },
    {
      time: '2024-11-19',
      title: '取消普通住房标准',
      type: '税收',
      summary: '彻底消除"豪宅税"，降低大户型交易成本',
      impact: '彻底消除"豪宅税"，降低大户型和高价房交易成本，促进改善型住房流通，提升豪宅市场活跃度。',
      example: '出售一套1500万的大户型住房，此前按非普宅需缴差额增值税和2%个税，政策后满2年免征增值税，个税按1%核定，节省税费约40万元。',
      source: 'http://www.news.cn/20241126/66f0d28e77e9419f8cefd8ad0f1f31e0/c.html'
    },
    {
      time: '2025-03-26',
      title: '城市更新规范意见',
      type: '旧改',
      summary: '建立房票制度，探索城市更新补偿多元化',
      impact: '为旧改提供新安置方式，加速存量旧改项目推进；引导拆迁补偿资金流入楼市，定向消化库存，促进房地产市场与城市更新良性互动。',
      example: '坪山咸水湖片区城中村改造项目，通过房票制度对村民进行补偿，村民可凭房票购买商品房。',
      source: 'https://www.sz.gov.cn/szzt2010/zdlyzl/zf/zf/'
    },
    {
      time: '2025-09-05',
      title: '分区限购优化+信贷调整',
      type: '限购',
      summary: '核心区深户/非深户满1年社保可购，利率最低3.05%',
      impact: '进一步放松限购，扩大购房群体；降低融资成本，加速去库存；非核心区和远郊区楼市流动性显著提升。',
      example: '非深户在深圳工作不满1年，可在罗湖区购买2套住房，无需等待社保满1年。',
      source: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zwdt/content/mpost_11274173.html'
    },
    {
      time: '2025-12-18',
      title: '房票制度正式落地',
      type: '旧改',
      summary: '房票24个月有效，可分次使用，不受限购限制',
      impact: '创新旧改安置模式，打通安置补偿与商品房市场通道；定向导入旧改刚需购买力，提振市场需求；降低政府安置房建设财政支出。',
      example: '深圳首张房票价值4055万元，由西丽福光实业股份有限公司获得，可用于购买任何区域商品房，不受限购限制。',
      source: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/zwdt/content/mpost_11274173.html'
    }
  ]
  
  const chartRef = ref(null)
  const selectedPolicy = ref(null)
  let chartInstance = null
  
  // 政策类型颜色映射
  const getTagColor = (type) => {
    const colorMap = {
      '限购': '#E53935',
      '限贷': '#1E88E5',
      '公积金': '#43A047',
      '旧改': '#FF9800',
      '交易流程': '#8E24AA',
      '税收': '#F4511E'
    }
    return colorMap[type] || '#757575'
  }
  
  // 初始化图表
  const initChart = () => {
    if (!chartRef.value) return
    
    chartInstance = echarts.init(chartRef.value)
    
    // 处理数据格式
    const seriesData = policyData.map((item, index) => {
      return {
        name: item.title,
        value: [item.time, index, item.summary, item.type],
        itemStyle: {
          color: getTagColor(item.type)
        }
      }
    })
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const policy = policyData[params.data.value[1]]
          return `
            <div style="padding: 10px; max-width: 300px;">
              <div style="font-weight: bold; margin-bottom: 5px;">${policy.time}</div>
              <div style="margin-bottom: 5px;">${policy.title}</div>
              <div style="color: ${getTagColor(policy.type)}; margin-bottom: 5px;">${policy.type}</div>
              <div style="color: #666;">${policy.summary}</div>
              <div style="margin-top: 8px; text-align: center;">
                <button style="background: #1E88E5; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
                  查看详情
                </button>
              </div>
            </div>
          `
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '10%'
      },
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: {
            color: '#ccc',
            width: 2
          }
        },
        axisLabel: {
          color: '#666',
          formatter: function(value) {
            const date = new Date(value)
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        show: false
      },
      dataZoom: [
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'filter',
          bottom: '5%',
          height: 20,
          borderColor: 'transparent',
          backgroundColor: '#f5f5f5',
          dataBackground: {
            lineStyle: { color: '#ccc' },
            areaStyle: { color: '#e0e0e0' }
          },
          selectedDataBackground: {
            lineStyle: { color: '#1E88E5' },
            areaStyle: { color: '#bbdefb' }
          },
          handleStyle: {
            color: '#1E88E5'
          },
          textStyle: {
            color: '#666'
          }
        }
      ],
      series: [
        {
          type: 'scatter',
          symbolSize: 16,
          data: seriesData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
    
    chartInstance.setOption(option)
    
    // 添加点击事件
    chartInstance.on('click', (params) => {
      if (params.componentType === 'series') {
        selectedPolicy.value = policyData[params.data.value[1]]
      }
    })
    
    // 默认显示最后一个政策内容
    selectedPolicy.value = policyData[policyData.length - 1]

    // 默认定位到最后一个政策
    const lastIndex = policyData.length - 1
    setTimeout(() => {
      chartInstance.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: lastIndex
      })
    }, 500)
  }
  // 响应式调整
  const handleResize = () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  }
  
  onMounted(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })
  
  onUnmounted(() => {
    if (chartInstance) {
      chartInstance.dispose()
    }
    window.removeEventListener('resize', handleResize)
  })
  </script>
  
  <style scoped>
  .policy-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }
  
  .policy-page h1 {
    color: #333;
    text-align: center;
    margin-bottom: 30px;
    font-weight: 600;
  }
  
  .policy-content {
    margin-top: 20px;
  }
  
  .timeline-chart {
    width: 100%;
    height: 400px;
    margin-bottom: 30px;
  }
  
  .detail-panel {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
  }
  
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 15px;
  }
  
  .detail-header h2 {
    color: #333;
    margin: 0;
    font-size: 1.4rem;
  }
  
  .policy-tag {
    color: white;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .detail-section {
    margin-bottom: 20px;
  }
  
  .detail-section h3 {
    color: #333;
    margin-bottom: 8px;
    font-size: 1.1rem;
  }
  
  .detail-section p {
    color: #666;
    line-height: 1.6;
    margin: 0;
  }
  
  .detail-section a {
    color: #1E88E5;
    text-decoration: none;
  }
  
  .detail-section a:hover {
    text-decoration: underline;
  }
  
  .close-btn {
    background: #757575;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 10px;
  }
  
  .close-btn:hover {
    background: #616161;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .policy-page {
      padding: 10px;
    }
    
    .timeline-chart {
      height: 300px;
    }
    
    .detail-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .policy-tag {
      margin-top: 10px;
    }
  }
  </style>