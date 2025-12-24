<script setup>
</script> 

<template>
  <div>
    <nav>
      <router-link to="/scoring">刚需购房评估</router-link>
      <router-link to="/improvement">改善型购房评估</router-link>
      <router-link to="/secondhand">二手房购房评估</router-link>
      <router-link to="/history">历史记录</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style>
nav {
  padding: 20px;
  text-align: center;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

nav a {
  margin: 0 15px;
  text-decoration: none;
  color: #2c3e50;
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

nav a:hover {
  background-color: #e8f4fd;
}

nav a.router-link-active {
  color: #42b983;
  font-weight: bold;
  background-color: #e8f4fd;
}
</style>






