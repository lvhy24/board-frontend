import { createRouter, createWebHistory } from 'vue-router'

const ClassicTactic=()=>import('../components/ClassicTactic.vue')
const TacticBoard=()=>import('../components/TacticBoard.vue')
const Home=()=>import('../components/Home.vue')
const video_analysis=()=>import('../components/video_analysis.vue')
const Intro=()=>import('../components/Intro.vue')

const routes = [
  //根路径，进入开始界面
  {path:'/',component:Home},
  // 模板战术库
  { path: '/classic', component: ClassicTactic },
  //自定义战术库
  {path:'/self',component:TacticBoard},
  // 带参数路径：查看模板战术库中已有战术（:id 是占位符）
  { path: '/classic/tactic/:id', component: ClassicTactic, props: true },
  // 带参数路径：查看/编辑自定义战术库中已有战术（:id 是占位符）
  { path: '/self/tactic/:id', component: TacticBoard, props: true },
  //视频分析
  {path:'/video_analysis',component:video_analysis},
  //临时路由
  {path:'/temp',component:TacticBoard},
  {path:'/intro',component:Intro}
]

const router = createRouter({
  history: createWebHistory(),  // 使用浏览器历史模式（无 # 号）
  routes
})

export default router