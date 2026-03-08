<template>
  <div class="intro-container">
    <h1>详情介绍</h1>
    <a href=" " @click.prevent="goBack">返回首页</a >
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.intro-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}
h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 20px;
}
a {
  color: #667eea;
  text-decoration: none;
  font-size: 1.2em;
}
</style>