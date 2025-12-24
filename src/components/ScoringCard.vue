<template>
  <el-card class="card">
    <template #header>
      <div class="card-header" @click="$emit('toggle')">
        <span>{{ title }}</span>
        <el-icon class="collapse-icon" :class="{ 'rotate-180': !collapsed }">
          <ArrowDown />
        </el-icon>
      </div>
    </template>
    <div v-show="!collapsed" class="card-content">
      <slot></slot>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'ScoringCard',
  props: {
    title: String,
    collapsed: Boolean
  },
  emits: ['toggle']
}
</script>

<style scoped>
.card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;
  font-weight: 600;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.card-header:hover {
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
}

.collapse-icon {
  transition: transform 0.3s ease;
  color: var(--el-text-color-secondary);
}

.collapse-icon.rotate-180 {
  transform: rotate(180deg);
}

.card-content {
  padding-top: 12px;
}
</style>