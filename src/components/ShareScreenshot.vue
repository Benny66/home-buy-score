<template>
  <div class="share-screenshot"> 
    <el-button 
      type="primary" 
      @click="showPreviewDialog"
      class="screenshot-btn"
    >
      <el-icon><Camera /></el-icon>
      生成分享截图
    </el-button>
    
    <!-- 预览弹窗 -->
    <el-dialog
      v-model="showPreview"
      title="预览分享截图"
      style="margin: 10px;"
      width="400px"
      :before-close="handleClose"
    >
      <div class="preview-container">
        <div class="screenshot-content" ref="screenshotRef">
          <div class="share-background">
            <div class="bg-decoration"></div>

            <div class="share-main">
              <!-- 标题 -->
              <div class="share-title">
                <h2>🏠 购房评分分析报告</h2>
                <div class="share-subtitle">{{ currentDate }}</div>
              </div>

              <!-- 基本信息 -->
              <div class="basic-info">
                <div class="info-item" v-if="propertyName">
                  <span class="label">楼盘名称：</span>
                  <span class="value">{{ propertyName }}</span>
                </div>
                <div class="info-item" v-if="totalPrice">
                  <span class="label">房屋总价：</span>
                  <span class="value">{{ totalPrice.toFixed(2) }} 万元</span>
                </div>
                <div class="info-item" v-if="monthlyPayment">
                  <span class="label">月供估算：</span>
                  <span class="value">{{ monthlyPayment.toFixed(2) }} 万/月</span>
                </div>
              </div>
          
              <!-- 评分详情 -->
              <div class="score-details">
                <h3>📊 各维度评分</h3>
                <div class="dimension-scores">
                  <div
                    v-for="dimension in dimensionScores"
                    :key="dimension.name"
                    class="dimension-item"
                  >
                    <div class="dimension-header">
                      <span class="dimension-name">{{ dimension.name }}</span>
                      <span class="dimension-score">{{ dimension.score }}分</span>
                    </div>
                    <div class="progress-container">
                      <div
                        class="progress-bar"
                        :style="{ width: `${Math.min(dimension.percentage, 100)}%`, background: getProgressColor(dimension.percentage) }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 总分和建议 -->
              <div class="final-result">
                <div class="total-score-section">
                  <div class="total-label">综合得分</div>
                  <div class="total-number">{{ totalScore }}分</div>
                  <div :class="['total-level', levelClass]">{{ levelText }}</div>
                </div>
                <div class="advice-section">
                  <h4>💡 购房建议</h4>
                  <div class="advice-content">{{ adviceText }}</div>
                </div>
              </div>

              <!-- 底部信息 -->
              <div class="share-footer">
                <div class="footer-text">扫描二维码体验购房评分工具</div>
                    <div class="qrcode-container">
                    <img 
                        src="@/assets/img/web-qr-code.png" 
                        alt="购房评分工具二维码" 
                        class="qrcode-image"
                    />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="preview-actions">
          <el-button @click="generateScreenshot" type="primary" :loading="generating">
            <el-icon><Download /></el-icon>
            保存图片
          </el-button>
          <el-button @click="showPreview = false">取消</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Camera, Download } from '@element-plus/icons-vue'
import html2canvas from 'html2canvas'

export default {
  name: 'ShareScreenshot',
  components: {
    Camera,
    Download
  },
  props: {
    propertyName: {
      type: String,
      default: ''
    },
    totalPrice: {
      type: Number,
      default: 0
    },
    monthlyPayment: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    },
    levelText: {
      type: String,
      default: ''
    },
    levelClass: {
      type: String,
      default: ''
    },
    adviceText: {
      type: String,
      default: ''
    },
    dimensionScores: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      generating: false,
      showPreview: false,
      currentDate: new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  },
  methods: {
    showPreviewDialog() {
      if (this.propertyName === '') {
        this.$message.warning('请先填写楼盘名称后截图');
        return;
      }
      if (this.totalScore === 0) {
        this.$message.warning('请先完成评分再截图');
        return;
      }
      this.showPreview = true
    },
    async generateScreenshot() {
      if (this.generating) return
      
      this.generating = true
      
      try {
        // 等待DOM完全渲染
        await this.$nextTick()
        
        const element = this.$refs.screenshotRef
        
        // 修复html2canvas配置
        const canvas = await html2canvas(element, {
          backgroundColor: null, // 设置为null以保持透明背景
          scale: 3, // 提高分辨率
          logging: false, // 关闭日志
          useCORS: true,
          allowTaint: false,
          width: element.offsetWidth,
          height: element.offsetHeight,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        })
        
        // 转换为Blob确保数据完整性
        canvas.toBlob((blob) => {
          this.downloadBlob(blob)
        }, 'image/png', 1.0)
      } catch (error) {
        console.error('生成截图失败:', error)
        this.$message.error('生成截图失败，请重试')
      } finally {
        this.generating = false
      }
    },
    
    downloadBlob(blob) {
      if (!blob) {
        this.$message.error('生成图片数据失败')
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `购房评分报告_${this.propertyName || '未知楼盘'}_${new Date().getTime()}.png`
      link.href = url
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 清理URL对象
      setTimeout(() => URL.revokeObjectURL(url), 100)

      this.$message.success('截图保存成功！')
      this.showPreview = false
    },
    
    getProgressColor(percentage) {
      if (percentage >= 80) return '#67c23a'
      if (percentage >= 60) return '#e6a23c'
      return '#f56c6c'
    },

    handleClose(done) {
      if (this.generating) {
        this.$message.warning('正在生成图片，请稍候...')
        return
      }
      done()
    }
  }
}
</script>

<style scoped>
.share-screenshot {
  display: inline-block;
}

.screenshot-btn {
  margin-left: 10px;
}

.preview-container {
  text-align: center;
}

/* 截图内容样式 */
.screenshot-content {
  width: 350px;
  min-height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.bg-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(75px, -75px);
}

.share-main {
  padding: 25px 20px;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.98);
  margin: 15px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

.share-title {
  text-align: center;
  margin-bottom: 20px;
}

.share-title h2 {
  color: #2c3e50;
  font-size: 20px;
  margin: 0 0 6px 0;
  font-weight: 600;
}

.share-subtitle {
  color: #7f8c8d;
  font-size: 13px;
}

.basic-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #2c3e50;
  font-weight: 600;
}

.score-details h3 {
  color: #2c3e50;
  font-size: 16px;
  margin-bottom: 12px;
  font-weight: 600;
}

.dimension-item {
  margin-bottom: 12px;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.dimension-name {
  color: #555;
}

.dimension-score {
  color: #2c3e50;
  font-weight: 600;
}

.progress-container {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.final-result {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.total-score-section {
  flex: 1;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px;
  border-radius: 12px;
}

.total-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.total-number {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
}

.total-level {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  display: inline-block;
}

.advice-section {
  flex: 2;
}

.advice-section h4 {
  color: #2c3e50;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.advice-content {
  color: #666;
  font-size: 13px;
  line-height: 1.4;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 6px;
}

.share-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.footer-text {
  color: #7f8c8d;
  font-size: 11px;
  margin-bottom: 8px;
}

.qrcode-placeholder {
  width: 60px;
  height: 60px;
  background: #f0f0f0;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24px;
  border-radius: 6px;
}
.qrcode-container {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fa;
  padding: 5px;
}

.qrcode-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}
.preview-actions {
  margin-top: 20px;
  text-align: center;
}

.preview-actions .el-button {
  margin: 0 8px;
}
</style>