<script setup>
// 移除 HelloWorld 导入，因为现在通过路由显示
</script>

<template>
  <div>
    <nav>
      <router-link to="/">首页</router-link> |
      <router-link to="/scoring">购房评分表</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style>
nav {
  padding: 20px;
  text-align: center;
}

nav a {
  margin: 0 10px;
  text-decoration: none;
  color: #2c3e50;
}

nav a.router-link-active {
  color: #42b983;
  font-weight: bold;
}
</style>





