import { createApp } from 'vue'
import App from './App.vue'
import router from './router'  // 导入创建的路由

const app = createApp(App)
app.use(router)  // 挂载路由插件
app.mount('#app')
