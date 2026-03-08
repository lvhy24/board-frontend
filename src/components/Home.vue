<template>
    <div class="home-container">
        <h1>board!</h1>
        <p class="subtitle">智能电子战术板，让战术布置更简单</p>
        <div style="margin-bottom:20px;text-align:center;">
            <button  @click="goToIntro">详情</button>
        </div>
    </div>
    <div class="buttons">
        <div style="margin-bottom:20px;text-align:center;">
            <button  @click="goTodemo">经典战术库</button>
        </div>
        <div style="margin-bottom:20px;text-align:center;">
            <button  @click="goToself">自定义战术库</button>
        </div>
        <div style="margin-bottom:20px;text-align:center;">
            <button  @click="video_analysis">视频分析</button>
        </div>
    </div>
</template>
<script setup lang="ts">
    import router from '@/router';
    const goTodemo=()=>{
        router.push('/classic')
    }
    const goToself=()=>{
        router.push('/self')
    }
    const video_analysis=()=>{
        router.push('/video_analysis')
    }
    const goToIntro=()=>{
        router.push('/intro')
    }
</script>
<style scoped>
.home-container{
    max-width:800px;
    margin:0 auto;
    padding:40px 20px;
    text-align:center;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
h1{
    font-size:3em;
    color:#2c3e50;
    margin-bottom:10px;
    background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
    -webkit-background-clip:text;
    background-clip:text;
    -webkit-text-fill-color:transparent;
}
.subtitle{
    font-size:1.2em;
    color:#666;
    margin-bottom:30px;
}
button{
    padding:15px 30px;
    border:none;
    border-radius:8px;
    font-size:1.1em;
    cursor:pointer;
    transition:all 0.3s;
    font-weight:600;
}
</style>