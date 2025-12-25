<template>
  <el-table :data="scoreItems" border :class="isSmallScreen ? 'my-table-small' :'my-table'" >  
    <el-table-column prop="dimension" label="一级维度" :min-width="isSmallScreen ? '50%' : '100px'" />
    <el-table-column prop="weight" label="权重" :min-width="isSmallScreen ? '40%' : '80px'"/>
    <el-table-column prop="subItem" label="二级子项" :min-width="isSmallScreen ? '70%' : '200px'"/>
    <el-table-column prop="criteria" label="评分标准（0-10 分）" :min-width="isSmallScreen ? '90%' : '280px'">
      <template #default="scope">
        <div v-if="scope && scope.row" class="criteria-content" :class="{ 'small-screen': isSmallScreen }">
          <div v-for="(item, index) in formatCriteria(scope.row.criteria)"
               :key="index"
               class="criteria-item">
            {{ item }}
          </div>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="我的打分" :min-width="isSmallScreen ? '100%' : '80%'">
      <template #default="scope">
        <template v-if="scope && scope.row">
          <el-select v-model="scope.row.score" @change="$emit('recalc')" placeholder="请选择分数" filterable
            allow-create class="full-width" :class="{ 'small-screen': isSmallScreen }">
            <el-option v-for="option in getScoreOptions(scope.row.criteria)"
              :key="option.value"
              :value="option.value"
              :label="option.label" />
          </el-select>
          <span class="weighted" :class="{ 'small-screen': isSmallScreen }">加权得分：<b class="weighted-val">{{ scope.row.weightedScore.toFixed(1) }}</b> 分</span>
        </template>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: 'ScoringTable',
  props: {
    scoreItems: Array,
    isSmallScreen: Boolean
  },
  emits: ['recalc'],
  methods: {
    getScoreOptions(criteria) {
      if (!criteria) return [];
      
      const options = [];
      const scorePattern = /（(\d+)\s*分）/g;
      const parts = criteria.split('、');

      parts.forEach(part => {
        const match = part.match(scorePattern);
        if (match) {
          const score = parseInt(match[0].match(/\d+/)[0]);
          options.push({
            value: score,
            label: `${score}分`
          });
        }
      });
      
      if (!options.some(opt => opt.value === 0)) {
        options.push({
          value: 0,
          label: '0分'
        });
      }
      
      return options.sort((a, b) => b.value - a.value);
    },

    formatCriteria(criteria) {
      if (!criteria) return [];
      return criteria.split('、').filter(item => item.trim());
    }
  }
}
</script>

<style scoped>
/* 表格样式 */
.my-table {
  width: 100%;
}
.my-table-small {
  width: 100%;
  font-size: 10px;
}

.criteria-content {
  line-height: 1.4;
}

.criteria-item {
  margin-bottom: 4px;
  font-size: 12px;
}

.criteria-item:last-child {
  margin-bottom: 0;
}

/* 手机端样式 */
.criteria-content.small-screen .criteria-item {
  font-size: 10px;
  line-height: 1.3;
  margin-bottom: 2px;
}

.full-width.small-screen {
  font-size: 12px;
}

.weighted.small-screen {
  font-size: 10px;
}

/* 表格整体在手机端的字体调整 */
:deep(.el-table.small-screen .el-table__cell) {
  font-size: 12px;
}

:deep(.el-table.small-screen .el-table__header .cell) {
  font-size: 11px;
  font-weight: bold;
}
:deep(.my-table-small .el-select-dropdown__item) {
  font-size: 11px;
  height: 30px;
  line-height: 30px;
  padding: 0 8px;
}

:deep(.my-table-small .el-select-dropdown) {
  font-size: 11px;
}

:deep(.my-table-small .el-select .el-input__prefix) {
  left: 5px;
}
</style>


