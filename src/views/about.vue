<template>
  <div class="about-container">
    <div class="about-card">
      <h1>关于本项目</h1>
      
      <section class="about-section">
        <h2>项目背景</h2>
        <p>这个项目源于我个人的购房需求。在准备买房的过程中，我发现需要评估各种购房场景、预算规划等复杂计算，于是开发了这个工具来帮助自己和其他有类似需求的朋友。</p>
      </section>

      <section class="about-section">
        <h2>免责声明</h2>
        <p>本工具提供的计算结果仅供参考，不构成任何投资建议。购房决策涉及重大财务安排，请务必结合个人实际情况和专业顾问意见进行综合考虑。</p>
      </section>

      <section class="about-section">
        <h2>隐私保护</h2>
        <p>我们非常重视您的隐私安全。本网站不会存储您的任何个人信息或评估数据，所有计算都在您的本地浏览器中完成。</p>
      </section>

      <section class="about-section">
        <h2>联系交流</h2>
        <p>如果您有任何建议、想法或发现了什么问题，欢迎扫描下方二维码添加我的微信好友进行讨论：</p>
        <div class="qr-code-container">
          <img src="@/assets/img/wechat-qr-code.jpg" alt="微信二维码" class="qr-code">
          <p class="qr-tip">扫描二维码添加微信好友</p>
        </div>
      </section>

      <section class="about-section">
        <h2>感谢</h2>
        <p>感谢所有使用本工具的朋友，希望这个工具能对您的购房决策有所帮助！</p>
      </section>
    </div>
  </div>
</template>

<script>
export default {
    name: 'AboutView',
    data() {
        return {};
    }
}
</script>

<style scoped>
.about-container {
  max-width: 800px;
  margin: 24px auto;
  padding: 0 16px;
}

.about-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  padding: 32px;
  line-height: 1.6;
}

.about-card h1 {
  text-align: center;
  color: var(--el-text-color-primary);
  margin-bottom: 32px;
  font-size: 28px;
}

.about-section {
  margin-bottom: 32px;
}

.about-section h2 {
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  font-size: 20px;
  border-left: 4px solid #42b983;
  padding-left: 12px;
}

.about-section p {
  color: var(--el-text-color-regular);
  font-size: 15px;
}

.qr-code-container {
  text-align: center;
  margin-top: 20px;
}

.qr-code {
  width: 300px;
  height: 400px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.qr-tip {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .about-card {
    padding: 20px;
  }
  
  .about-card h1 {
    font-size: 24px;
  }

  .qr-code {
    width: 180px;
    height: 180px;
  }
}
</style>