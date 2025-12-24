<template>
  <el-table :data="scoreItems" border style="width: 100%">
    <el-table-column prop="dimension" label="一级维度" :min-width="isSmallScreen ? '50%' : '100px'" />
    <el-table-column prop="weight" label="权重" :min-width="isSmallScreen ? '40%' : '80px'"/>
    <el-table-column prop="subItem" label="二级子项" :min-width="isSmallScreen ? '70%' : '200px'"/>
    <el-table-column prop="criteria" label="评分标准（0-10 分）" :min-width="isSmallScreen ? '90%' : '280px'"/>
    <el-table-column label="我的打分" :min-width="isSmallScreen ? '100%' : '80%'">
      <template #default="scope">
        <template v-if="scope && scope.row">
          <el-select v-model="scope.row.score" @change="$emit('recalc')" placeholder="请选择分数" filterable
            allow-create class="full-width">
            <el-option v-for="option in getScoreOptions(scope.row.criteria)" 
              :key="option.value" 
              :value="option.value" 
              :label="option.label" />
          </el-select>
          <span class="weighted">加权得分：<b class="weighted-val">{{ scope.row.weightedScore.toFixed(1) }}</b> 分</span>
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
    }
  }
}
</script>