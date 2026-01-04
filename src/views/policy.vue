<!-- src/views/policy.vue -->
<template>   
  <div class="policy-page">
    <h1>2023-2025年深圳房产政策时间轴</h1>
    <!-- 筛选控件 -->
    <div class="filter-controls">
      <div class="filter-group">
        <span class="filter-label">政策类型：</span>
        <div class="filter-tags">
          <span
            v-for="type in policyTypes"
            :key="type"
            class="filter-tag"
            :class="{ active: activeTypes.includes(type) }"
            @click="toggleFilter(type)"
            :style="{ borderColor: getTagColor(type) }"
          >
            <span class="tag-color" :style="{ backgroundColor: getTagColor(type) }"></span>
            {{ type }}
          </span>
        </div>
        <button class="clear-filter" @click="clearFilters">清除筛选</button>
      </div>
    </div>

    <!-- 主要内容区域 - 左右布局 -->
    <div class="main-content">
      <!-- 左侧时间线 -->
      <div class="timeline-section">
        <div class="timeline-container">
          <el-timeline>
            <el-timeline-item
              v-for="(policy, index) in reversedPolicyData"
              :key="policy.time"
              :timestamp="policy.time"
              :type="getTimelineType(policy.type)"
              :color="getTagColor(policy.type)"
              placement="top"
              :hide-timestamp="false"
              @click="selectPolicy(policy, reversedPolicyData.length - 1 - index)"
              class="timeline-item"
              :class="{ active: selectedPolicy && selectedPolicy.time === policy.time }"
            >
              <div class="timeline-content">
                <div class="policy-header">
                  <h3>{{ policy.title }}</h3>
                  <span class="policy-tag" :style="{ backgroundColor: getTagColor(policy.type) }">
                    {{ policy.type }}
                  </span>
                </div>
                <p class="policy-summary">{{ policy.summary }}</p>
                <button class="detail-btn" @click.stop="selectPolicy(policy, reversedPolicyData.length - 1 - index)">
                  查看详情
                </button>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 时间轴导航 -->
        <div class="timeline-nav">
          <button class="nav-btn" @click="navigateTimeline('prev')" :disabled="!canNavigatePrev">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            上一个政策
          </button>
          <span class="nav-info">当前显示: {{ currentPolicyIndex + 1 }} / {{ filteredPolicyData.length }}</span>
          <button class="nav-btn" @click="navigateTimeline('next')" :disabled="!canNavigateNext">
            下一个政策
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="detail-section" v-if="selectedPolicy">
        <div class="detail-panel">
          <div class="detail-header">
            <h2>{{ selectedPolicy.time }} - {{ selectedPolicy.title }}</h2>
            <span class="policy-tag" :style="{ backgroundColor: getTagColor(selectedPolicy.type) }">
              {{ selectedPolicy.type }}
            </span>
          </div>
          <div class="detail-content">
            <div class="detail-item">
              <h3>政策影响</h3>
              <p>{{ selectedPolicy.impact }}</p>
            </div>
            <div class="detail-item">
              <h3>举例说明</h3>
              <p>{{ selectedPolicy.example }}</p>
            </div>
            <div class="detail-item">
              <h3>数据来源</h3>
              <p><a :href="selectedPolicy.source" target="_blank">{{ selectedPolicy.source }}</a></p>
            </div>
          </div>
          <button class="close-btn" @click="selectedPolicy = null">关闭详情</button>
        </div>
      </div>

      <!-- 移动端详情占位符 -->
      <div class="mobile-detail-placeholder" v-if="!selectedPolicy && isMobile">
        <div class="placeholder-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>请选择一个政策查看详情</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElTimeline, ElTimelineItem } from 'element-plus'

// 政策数据（保持不变）
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

const selectedPolicy = ref(null)
const activeTypes = ref([])
const currentPolicyIndex = ref(0)
const isMobile = ref(false)

// 计算属性
const policyTypes = computed(() => {
  return [...new Set(policyData.map(policy => policy.type))]
})

const filteredPolicyData = computed(() => {
  if (activeTypes.value.length === 0) {
    return policyData
  }
  return policyData.filter(policy => activeTypes.value.includes(policy.type))
})

// 新增：倒序显示的政策数据
const reversedPolicyData = computed(() => {
  return [...filteredPolicyData.value].reverse()
})

const canNavigatePrev = computed(() => currentPolicyIndex.value > 0)
const canNavigateNext = computed(() => currentPolicyIndex.value < filteredPolicyData.value.length - 1)

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

// 获取时间线类型
const getTimelineType = (type) => {
  const typeMap = {
    '限购': 'primary',
    '限贷': 'success',
    '公积金': 'warning',
    '旧改': 'danger',
    '交易流程': 'info',
    '税收': 'primary'
  }
  return typeMap[type] || 'primary'
}

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 筛选功能
const toggleFilter = (type) => {
  const index = activeTypes.value.indexOf(type)
  if (index > -1) {
    activeTypes.value.splice(index, 1)
  } else {
    activeTypes.value.push(type)
  }
  // 重置选中状态
  currentPolicyIndex.value = 0
  if (filteredPolicyData.value.length > 0) {
    selectedPolicy.value = filteredPolicyData.value[0]
  } else {
    selectedPolicy.value = null
  }
}

const clearFilters = () => {
  activeTypes.value = []
  currentPolicyIndex.value = 0
  if (filteredPolicyData.value.length > 0) {
    selectedPolicy.value = filteredPolicyData.value[0]
  } else {
    selectedPolicy.value = null
  }
}

// 选择政策
const selectPolicy = (policy, index) => {
  selectedPolicy.value = policy
  currentPolicyIndex.value = index
  // 移动端滚动到详情区域
  if (isMobile.value) {
    setTimeout(() => {
      const detailSection = document.querySelector('.detail-section')
      if (detailSection) {
        detailSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }
}

// 时间轴导航
const navigateTimeline = (direction) => {
  if (direction === 'prev' && canNavigatePrev.value) {
    currentPolicyIndex.value--
  } else if (direction === 'next' && canNavigateNext.value) {
    currentPolicyIndex.value++
  }

  // 更新选中的政策
  selectedPolicy.value = filteredPolicyData.value[currentPolicyIndex.value]

  // 滚动到选中的时间线项
  scrollToSelectedItem()
}

// 滚动到选中的时间线项
const scrollToSelectedItem = () => {
  const selectedItem = document.querySelector('.timeline-item.active')
  if (selectedItem) {
    selectedItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  }
}

onMounted(() => {
  // 检测移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // 默认显示最新的政策（倒序后的第一个）
  selectedPolicy.value = filteredPolicyData.value[filteredPolicyData.value.length - 1]
  currentPolicyIndex.value = filteredPolicyData.value.length - 1

  // 延迟滚动到选中的项
  setTimeout(() => {
    scrollToSelectedItem()
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.policy-page {
  max-width: 1400px;
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

/* 筛选控件样式 */
.filter-controls {
  margin-bottom: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-label {
  font-weight: 500;
  color: #555;
  white-space: nowrap;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.filter-tag.active {
  background: #f0f7ff;
  font-weight: 500;
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
}

.clear-filter {
  background: #6c757d;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.3s;
}

.clear-filter:hover {
  background: #5a6268;
}

/* 主要内容区域 - 左右布局 */
.main-content {
  display: flex;
  gap: 30px;
  min-height: 600px;
}

/* 左侧时间线区域 */
.timeline-section {
  flex: 1;
  min-width: 0;
}

.timeline-container {
  max-height: 500px;
  overflow-y: auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.timeline-item {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.timeline-item:hover {
  background: #f5f7fa;
}

.timeline-item.active {
  background: #e3f2fd;
  border-left: 3px solid #1E88E5;
  padding-left: 15px;
}

.timeline-content {
  padding: 10px;
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.policy-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  flex: 1;
  margin-right: 10px;
}

.policy-tag {
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.policy-summary {
  color: #666;
  margin: 8px 0;
  line-height: 1.5;
  font-size: 0.9rem;
}

.detail-btn {
  background: #1E88E5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.3s;
}

.detail-btn:hover {
  background: #1565C0;
}

/* 右侧详情区域 */
.detail-section {
  flex: 0 0 400px;
  position: sticky;
  top: 20px;
  height: fit-content;
  max-height: calc(100vh - 100px);
}

.detail-panel {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 15px;
}

.detail-header h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  line-height: 1.4;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
}

.detail-item {
  margin-bottom: 25px;
}

.detail-item h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.1rem;
  font-weight: 600;
}

.detail-item p {
  color: #666;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.detail-item a {
  color: #1E88E5;
  text-decoration: none;
  word-break: break-all;
}

.detail-item a:hover {
  text-decoration: underline;
}

.close-btn {
  background: #757575;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 20px;
  width: 100%;
}

.close-btn:hover {
  background: #616161;
}

/* 移动端详情占位符 */
.mobile-detail-placeholder {
  display: none;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.placeholder-content svg {
  margin-bottom: 15px;
}

.placeholder-content p {
  margin: 0;
  font-size: 1rem;
}

/* 时间轴导航样式 */
.timeline-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-top: 1px solid #e0e0e0;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1E88E5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.nav-btn:disabled {
  background: #b0bec5;
  cursor: not-allowed;
}

.nav-btn:not(:disabled):hover {
  background: #1565C0;
}

.nav-info {
  color: #666;
  font-size: 0.9rem;
}

/* 响应式设计 - 移动端 */
@media (max-width: 768px) {
  .policy-page {
    padding: 10px;
  }

  .main-content {
    flex-direction: column;
    gap: 20px;
  }

  .timeline-section {
    order: 1;
  }

  .detail-section {
    flex: none;
    position: static;
    max-height: none;
    order: 2;
    display: block !important;
  }

  .mobile-detail-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    order: 2;
  }

  .timeline-container {
    max-height: 400px;
    padding: 15px;
  }

  .policy-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .policy-header h3 {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-tags {
    margin: 10px 0;
  }

  .timeline-nav {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
  }

  .detail-panel {
    padding: 15px;
  }

  .detail-header h2 {
    font-size: 1.2rem;
  }
}

/* 中等屏幕适配 */
@media (max-width: 1024px) {
  .main-content {
    gap: 20px;
  }

  .detail-section {
    flex: 0 0 350px;
  }
}
</style>