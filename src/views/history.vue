<template>
  <div class="history-container">
    <el-card class="card">
      <template #header>
        <div class="card-header">
          <span>历史评分记录</span>
        </div>
      </template>
      <div class="card-content">
        <div class="filter-section">
          <el-select v-model="sortBy" placeholder="排序方式" @change="handleSortChange">
            <el-option label="按时间降序" value="date-desc" />
            <el-option label="按时间升序" value="date-asc" />
            <el-option label="按分数降序" value="score-desc" />
            <el-option label="按分数升序" value="score-asc" />
          </el-select>
          <el-button @click="clearAllRecords" type="danger" plain>清空所有记录</el-button>
        </div>
        
        <el-table :data="sortedHistoryRecords" border style="width: 100%">
          <el-table-column prop="date" label="评分时间" min-width="120px" />
          <el-table-column prop="type" label="评分类型" min-width="100px" />
          <el-table-column prop="totalScore" label="总分" min-width="80px">
            <template #default="scope">
              <span :class="getScoreClass(scope.row.totalScore)">{{ scope.row.totalScore }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="房屋总价(万)" min-width="100px" />
          <el-table-column prop="dimensionBreakdown" label="维度得分" min-width="200px"/>
          <el-table-column prop="suggestion" label="智能建议" min-width="120px" />
          <el-table-column label="操作" width="160px">
            <template #default="scope">
              <el-button size="small" @click="viewRecord(scope.row)">查看详情</el-button>
              <el-button size="small" type="danger" @click="deleteRecord(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="history-summary">
          <span>历史最高分：<strong>{{ maxScore }}</strong> 分</span>
          <span style="margin-left: 20px">历史平均分：<strong>{{ avgScore.toFixed(1) }}</strong> 分</span>
          <span style="margin-left: 20px">共 <strong>{{ historyRecords.length }}</strong> 次评分</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'HistoryView',
  data() {
    return {
      historyRecords: [],
      sortBy: 'date-desc'
    }
  },
  computed: {
    sortedHistoryRecords() {
      const records = [...this.historyRecords];
      switch (this.sortBy) {
        case 'score-desc':
          return records.sort((a, b) => b.totalScore - a.totalScore);
        case 'score-asc':
          return records.sort((a, b) => a.totalScore - b.totalScore);
        case 'date-asc':
          return records.sort((a, b) => new Date(a.date) - new Date(b.date));
        default: // date-desc
          return records.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    },
    maxScore() {
      return this.historyRecords.length > 0
        ? Math.max(...this.historyRecords.map(r => r.totalScore))
        : 0;
    },
    avgScore() {
      return this.historyRecords.length > 0
        ? this.historyRecords.reduce((sum, r) => sum + r.totalScore, 0) / this.historyRecords.length
        : 0;
    }
  },
  methods: {
    loadHistoryRecords() {
      try {
        const stored = localStorage.getItem('houseScoringHistory')
        if (stored) {
          this.historyRecords = JSON.parse(stored)
        } else {
          this.historyRecords = []
        }
      } catch (error) {
        console.error('加载历史记录失败:', error)
        this.historyRecords = []
      }
    },
    saveHistoryRecords() {
      try {
        localStorage.setItem('houseScoringHistory', JSON.stringify(this.historyRecords));
      } catch (error) {
        console.error('保存历史记录失败:', error);
        this.$message.error('保存历史记录失败');
      }
    },
    getScoreClass(score) {
      if (score >= 80) return 'score-high';
      if (score >= 60) return 'score-medium';
      return 'score-low';
    },
    
    viewRecord(record) {
      // 根据记录类型跳转到对应的评分页面
      let targetRoute = '/scoring'
      if (record.type === '改善型购房') targetRoute = '/improvement'
      if (record.type === '二手房购房') targetRoute = '/secondhand'
      
      this.$router.push({ 
        path: targetRoute, 
        query: { loadRecord: record.id } 
      })
    },
    deleteRecord(id) {
      this.$confirm('确定要删除这条记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.historyRecords = this.historyRecords.filter(record => record.id !== id);
        this.saveHistoryRecords();
        this.$message.success('记录已删除');
      });
    },
    clearAllRecords() {
      this.$confirm('确定要清空所有历史记录吗？此操作不可恢复！', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.historyRecords = [];
        this.saveHistoryRecords();
        this.$message.success('所有记录已清空');
      });
    },
    handleSortChange() {
      // 排序改变时自动更新
    }
  },
  mounted() {
    this.loadHistoryRecords();
  }
}
</script>

<style scoped>
.history-container {
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 16px;
}

.card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-weight: 600;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.card-content {
  padding-top: 12px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-summary {
  margin-top: 10px;
  padding: 8px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.score-high {
  color: #67c23a;
  font-weight: bold;
}

.score-medium {
  color: #e6a23c;
  font-weight: bold;
}

.score-low {
  color: #f56c6c;
  font-weight: bold;
}
</style>