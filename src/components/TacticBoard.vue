<template>
  <h1>自定义战术</h1>
  <div style="display:flex;gap:20px;">
    <!--左侧控制面板-->
    <div style="width:250px;padding:10px;border-right:1px solid #CCC;">
      <h3>当前战术</h3>
      <!--名称输入-->
      <div style="margin-bottom:10px;height:40px;">
        <input
          v-model="tacticName"
          placeholder="输入战术名称"
          style="width:100%;padding:1px;"
        />
        <!-- 编辑模式提示 -->
        <div v-if="currentEditingId!=0&&currentEditingId!=1" style="color: #4CAF50; font-size: 14px; margin-top: 5px;">
          编辑模式 (ID: {{ currentEditingId }}) - 保存将更新原战术
        </div>
        <div v-else style="color: #666; font-size: 14px; margin-top: 5px;">
          新建模式 - 保存将创建新战术
        </div>
      </div>

      <!--操作按钮-->
      <div style="margin-bottom:20px;">
        <div style="margin-bottom:20px;">
          <input
          v-model="tacticMessage"
          placeholder="输入战术描述"
          style="width:100%;padding:1px;"
          />
        </div>
        <button @click="save" style="width:100%;padding:8px;background:#4CAF50;color:white;border:none;cursor:pointer;">
          保存战术
        </button>
      </div>
      <div >
        <!-- 播放/暂停/停止按钮 -->
        <button @click="togglePlay" style="margin-right: 5px;">
          {{ isPlaying && !isPaused ? '⏸ 暂停' : (isPaused ? '▶ 继续' : '▶ 播放') }}
        </button>
        <button @click="stop" :disabled="!isPlaying && !isPaused" style="margin-right: 5px;">🛑 停止</button>
        <div>
           <!-- 新增倍速按钮 -->
          <button @click="playSpeed = 0.5" :style="playSpeed === 0.5 ? 'background:#2196F3;color:white;' : ''" style="margin-right: 1px;width:40px;">0.5×</button>
          <button @click="playSpeed = 1" :style="playSpeed === 1 ? 'background:#2196F3;color:white;' : ''" style="margin-right: 1px;width:40px;">1×</button>
          <button @click="playSpeed = 1.5" :style="playSpeed === 1.5 ? 'background:#2196F3;color:white;' : ''" style="margin-right: 1px;width:40px;">1.5×</button>
          <button @click="playSpeed = 2" :style="playSpeed === 2 ? 'background:#2196F3;color:white;' : ''" style="margin-right: 1px;width:40px;">2×</button>
        </div>
      </div>
      <button @click="back" style="width:100%;padding:8px;margin-bottom:20px;">
        返回
      </button>

      <!--战术列表-->
      <h3>战术列表</h3>
      <ul style="list-style:none;padding:0;max-height:300px;overflow-y:auto;">
        <li
          v-for="tactic in tacticList"
          :key="tactic.id"
          @click="loadTactic(tactic.id)"
          style="padding:8px;cursor:pointer;margin-bottom:5px;background:#f5f5f5;border-radius:4px;font-size:14px;"
        >
          <div style="font-weight:bold;color:#333;">{{ tactic.title }}</div>
          <!--删除按钮-->
          <button @click="deleteTactic(tactic.id,$event)" style="background:#ff4444;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px">
            删除
          </button>
          <button @click="updateTactic(tactic.id,$event)" style="background:#2196F3;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;margin-left:2px;">
            编辑
          </button>
          <button @click="stopupdate(tactic.id,$event)" style="background:#999;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;margin-left:2px;">
            退出编辑
          </button>
        </li>    
      </ul>
    </div>

    <!--中间战术板-->
    <div>
      <Stage
        ref="stageRef"
        :config="stageConfig"
      >
        <Layer>
          <Image
            v-if="useImage && woodImage"
            :config="imageConfig"
          />
          <Group
            v-for="player in players":key="player.id":config="{x:player.x,y:player.y,draggable:player.draggable,dragBoundFunc:createDragBoundFunc(player)}"@dragend="handleDragEnd($event,player)"@click="handleClickEvent($event,player)"
          >
            <!--球员被选中的高亮圈-->
            <Circle
              v-if="player.isSelected"
              :config="{
                x:0,
                y:0,
                radius:player.radius+4,
                fill:'transparent',
                stroke:'#FFD700',
                strokeWidth:3
              }"
            />
            <Circle
            :key="player.id"
            :id="player.id"
            :config="{x:0,y:0,radius:player.radius,fill:player.fill,stroke: 'black',strokeWidth: 1}"
            />
            <Text
              :config="{x:-4,y:-5,text:player.id,fontSize:12,fontFamily:'Arial',fill:'white',fontStyle:'bold'}"
            >
            </Text>
          </Group>
          <Circle :config="{x:ball.x,y:ball.y,radius:ball.radius,fill:ball.fill,stroke:'black',strokeWidth: 1,draggable:ball.draggable}" @dragend="handleDragBall($event,ball)"/>
        </Layer>
      </Stage>
    </div>
    <!--右侧帧编辑器-->
    <div  style="width:250px;padding:10px;border-left:1px solid #CCC;">
      <h3>帧播放器</h3>
      <!--帧导航-->
      <!-- 时间轴可视化（进度条版） -->
      <div class="timeline-container" style="margin-top: 15px; padding: 0 10px;">
        <!-- 时间刻度显示 -->
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 5px;">
          <span>0s</span>
          <span>{{ Math.ceil(totalDuration / 2000) }}s</span>
          <span>{{ Math.ceil(totalDuration / 1000) }}s</span>
        </div>
        <!-- 时间轴可视化 -->
        <div 
          class="timeline-track" 
          style="position: relative; height: 20px; background: #e0e0e0; border-radius: 4px; cursor: pointer;" 
          @mousedown="handleProgressMouseDown"
        >
          <!-- 背景刻度线（每2秒一个） -->
          <div 
            v-for="tick in Math.ceil(totalDuration / 2000)" 
            :key="tick"
            style="position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(0,0,0,0.1);"
            :style="{ left: ((tick * 2000) / totalDuration * 100) + '%' }" 
          ></div>
          
          <!-- 所有帧的标记点 -->
          <div v-if="!isPlaying&&!isPaused"
            v-for="(frame, index) in frames" 
            :key="index"
            class="frame-marker"
            :class="{ active: currentFrameIndex === index }"
            @click.stop="handlePointClick(index)"
            :style="[{
              position: 'absolute',
              top: '50%',
              left: (frame.time*1000 / totalDuration * 100) + '%',
              transform: 'translateX(-50%)',
              width: currentFrameIndex === index ? '16px' : '12px',
              height: currentFrameIndex === index ? '16px' : '12px',
              marginTop: currentFrameIndex === index ? '-8px' : '-6px',
              borderRadius: '50%',
              background: currentFrameIndex === index ? '#2196F3' : '#999',
              border: '2px solid white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 2
            }]"
          >
            <!-- 悬停显示时间 -->
            <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);  background: #333; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; white-space: nowrap;opacity: 0;pointer-events: none;"
              class="time-tooltip">
               {{ frame.time }}s (帧{{ index }})
            </div>
          </div>
          
          <!-- 当前播放进度条 -->
          <div v-if="isPlaying||isPaused"
            style="position: absolute; top: 0; bottom: 0; left:0; background: #ff5722; transition: left 0.1s;"
            :style="{ width: progressPercent + '%' }"
          ></div>
          
          <!-- 进度条拖动滑块 -->
          <div 
            v-if="(isPlaying||isPaused)&&totalDuration > 0"
            style="position: absolute; top: 50%; width: 12px; height: 12px; margin-top: -6px; border-radius: 50%; background: white; border: 2px solid #ff5722; cursor: pointer; z-index: 3;"
            :style="{ left: progressPercent + '%', transform: 'translateX(-50%)' }"
          ></div>
        </div>
        
        <!-- 帧信息提示 -->
        <div style="margin-top: 8px; font-size: 13px; color: #555;">
          <span style="font-weight: bold; color: #2196F3;">
            {{ isPlaying ? `播放中: ${Math.floor(currentTime/1000)}s/${Math.floor(totalDuration/1000)}s` : 
              `当前: 第${currentFrameIndex}帧 (${frames[currentFrameIndex]?.time || 0}s)` }}
          </span>
          <span style="margin-left: 15px; color: #999;">点击轨道跳转，点击圆点切换</span>
        </div>
      </div>
      
      <!-- 帧操作 -->
      <div class="frame-actions" style="margin-top:10px" v-if="currentEditingId!=0">
        <h3>帧编辑器</h3>
        <div class="frame-nav" style="margin-bottom: 10px;">
          <span style="margin: 0 10px; font-weight: bold;">
            第 {{ currentFrameIndex}} 帧 / 共 {{ frames.length-1 }} 帧
          </span>
          <div style="margin-top: 5px;">
            <button @click="prevFrame" :disabled="currentFrameIndex<=1">◀ 上一帧</button>
            <button @click="nextFrame" :disabled="currentFrameIndex >= frames.length-1">下一帧 ▶</button>
          </div>
        </div>
        <button @click="firstFrame" :disabled="currentFrameIndex > 0">创建第一帧</button>
         <input
          v-model="frameTime"
          placeholder="输入此帧的时间（秒）"
          type="number"
          step="0.1"
          min="0"
          style="width:100%;padding:1px;"
        />
        <div style="margin-top:10px">
          <button @click="addFrame" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 4px;">+ 添加帧</button>
          <button @click="editFrame" style="background: #2196F3; color: white; margin-left: 5px; border: none; padding: 5px 10px; border-radius: 4px;" :disabled="frames.length <= 1">修改帧</button>
          <div style="margin-top:10px">
            <button @click="deleteFrame" style="background: #ff4444; color: white; margin-left: 5px; border: none; padding: 5px 10px; border-radius: 4px;" :disabled="frames.length <= 1">-删除帧</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 画布 -->
    <div style="display: flex; gap: 20px;">
      <!-- 左侧信息 -->
      <div style="width: 150px;">
        <h4>操作提示</h4>
        <ul style="font-size: 12px; padding-left: 15px;">
          <li>拖拽球员设置位置</li>
          <li>添加帧复制当前布局</li>
          <li>修改时间可调整节奏</li>
        </ul>
        <hr>
        <h3>当前战术信息</h3>
        <p>战术名称：{{tacticName}}</p>
        <p>战术描述: {{ tacticMessage}}</p >
        <hr>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, nextTick } from 'vue'
import router from '@/router';
import { Stage, Layer, Image, Circle,Group,Text} from 'vue-konva';
import type { Ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tacticName = ref('') // 绑定输入框
const tacticMessage=ref('')//绑定输入框
const frameTime=ref('')//绑定输入框
const tacticList = ref<any[]>([]) // 存储所有战术列表
const currentEditingId = ref<number | null>(1) // 标记当前是否在编辑战术
const isPlaying = ref(false) 
const isPaused = ref(false)
const playSpeed = ref(1) // 默认1倍速，可选0.5/1.5/2
const currentPlayIndex = ref(1)      // 当前播放帧索引
const segmentElapsed = ref(0)        // 当前片段已播放时间(ms)
const animationFrameId = ref(0)
const currentTime = ref(0)           // 当前播放时间点(ms)
const isDragging = ref(false)        // 是否正在拖动进度条

interface KonvaNode {
  position: () => { x: number; y: number }
  x: () => number
  y: () => number
}

interface KonvaEvent {
  target: KonvaNode
}


// 球员数据
const players = ref(
  [1, 2, 3, 4, 5].map(i => ({
    id: i.toString(),
    x: i * 50,
    y: 560,
    radius: 10,
    fill: 'black',
    draggable: !isPlaying,  // 播放时动态控制拖拽
    isSelected:false //是否被选中
  }))
)
const ball=ref({
  x:300,
  y:560,
  radius:5,
  fill:'orange',
  draggable:true}
)
// 核心：时间线数据结构
const frames: Ref<{ time: number; players: any[];ball:any}[]> = ref([
  {
    time: 0,
    players: JSON.parse(JSON.stringify(players.value)),
    ball:JSON.parse(JSON.stringify(ball.value)),
  }
])

const currentFrameIndex: Ref<number> = ref(0)  // 当前编辑第几帧

const props = withDefaults(defineProps<{
  stageWidth?: number
  stageHeight?: number
  useImage?: boolean
  id: number
}>(), {
  stageWidth: 900,
  stageHeight: 600,
  useImage: true,
  id: 1
})

const woodImage = ref<HTMLImageElement>()

// 重置为默认状态
const resetToDefault = async () => {
  frames.value = [
    {
      time: 0,
      players: [
        { id: "1", x: 50, y: 560, radius: 10, fill: 'white', draggable: true,isSelected:false },
        { id: "2", x: 100, y: 560, radius: 10, fill: 'white', draggable: true,isSelected:false },
        { id: "3", x: 150, y: 560, radius: 10, fill: 'white', draggable: true,isSelected:false },
        { id: "4", x: 200, y: 560, radius: 10, fill: 'white', draggable: true,isSelected:false},
        { id: "5", x: 250, y: 560, radius: 10, fill: 'white', draggable: true,isSelected:false}
      ],
      ball:{x:300,y:560,radius:5,fill:'orange',draggable:true}
    }
  ]
  // 更新球员位置
  const newPlayers = frames.value[0]?.players
  if (newPlayers) {
    newPlayers.forEach((player) => {
      const p = players.value.find(item => item.id === player.id)
      if (p) {
        p.x = player.x
        p.y = player.y
        p.isSelected=player.isSelected
      }
    })
  }
  //更新球的位置
  const newBall= frames.value[0]?.ball
  if(newBall){
    ball.value.x=newBall.x,
    ball.value.y=newBall.y
  }
  currentFrameIndex.value = 0
  tacticName.value = ''
  currentEditingId.value = 1
  
  // 停止播放
  stop()
}
onMounted(async () => {
  if (route.path === '/self') {
    resetToDefault()
  }
  
  if (props.id && props.id !== 1) { // 有ID就加载数据
    try {
      await loadTactic(Number(props.id))
    } catch (error) {
      alert('加载失败' + error)
      console.error(error)
    }
  }
  
  if (props.useImage) {
    const img = document.createElement('img')
    img.src = '/court.jpg'
    img.addEventListener('load', () => {
      woodImage.value = img
    })
  }
  
  await loadTacticList() // 获取所有战术列表
})

/* 舞台配置 */
const stageConfig = computed(() => ({
  width: props.stageWidth ?? 900,
  height: props.stageHeight ?? 600,
  draggable: false
}))

// 创建舞台引用
const stageRef = ref<any>(null)

// 总时长(ms)
const totalDuration = computed(() => {
  if (!frames.value || frames.value.length < 2) {
    return 0
  }
  
  // 找到最后一帧的时间
  const lastFrame = frames.value[frames.value.length - 1]
  if(!lastFrame) return 0
  return Math.max(1000, lastFrame.time * 1000)
})

// 当前进度百分比 (0-100)
const progressPercent = computed(() => {
  if (totalDuration.value === 0) return 0
  return Math.min(100, (currentTime.value / totalDuration.value) * 100) //总进度
})

// 帧管理
const firstFrame = () => { // 创建第一帧
  const firstFrame = {
    time: 0,
    players: JSON.parse(JSON.stringify(players.value)),
    ball:JSON.parse(JSON.stringify(ball.value))
  }
  
  // 如果第一帧已存在，先删除
  if (frames.value.length > 1 ) {
    return
  }
  
  frames.value.splice(1, 0, firstFrame)
  currentFrameIndex.value = 1
}

const addFrame = () => { // 添加新帧
  if (currentFrameIndex.value < 1) {
    alert('请先创建第一帧')
    return
  }
  
  const currentFrame = frames.value[currentFrameIndex.value]
  if (!currentFrame) return
  
  // 计算新帧时间（基于当前帧时间+2秒）
  const newTime = Number(frameTime.value)||currentFrame.time + 2
  
  const newFrame = {
    time: newTime,
    players: JSON.parse(JSON.stringify(players.value)),
    ball:JSON.parse(JSON.stringify(ball.value))
  }
  
  frames.value.splice(currentFrameIndex.value + 1, 0, newFrame)
  currentFrameIndex.value++ // 自动切换到新帧
  
  // 重新排序
  frames.value.sort((a, b) => a.time - b.time)
}
const editFrame=()=>{
  // 1. 校验当前帧是否合法
  if (currentFrameIndex.value === 0) {
    alert('初始帧不允许修改！');
    return;
  }
  if (frames.value.length <= 1) {
    alert('暂无可修改的帧，请先添加帧！');
    return;
  }

  // 2. 获取并校验输入的时间
  const inputTime = Number(frameTime.value);
  if (isNaN(inputTime) || inputTime < 0) {
    alert('请输入有效的非负时间（秒）！');
    return;
  }

  // 3. 更新当前帧的时间 + 同步拖拽后的球员位置
  frames.value[currentFrameIndex.value] = {
    time: inputTime,
    players: JSON.parse(JSON.stringify(players.value)), 
    ball:JSON.parse(JSON.stringify(ball.value))
  };

  // 4. 重新排序帧（按时间升序）+ 提示修改成功
  frames.value.sort((a, b) => a.time - b.time);
  // 重新定位当前帧索引（排序后可能变化）
  currentFrameIndex.value = frames.value.findIndex(
    frame => frame.time === inputTime && 
             JSON.stringify(frame.players) === JSON.stringify(players.value)
  );
  alert('当前帧已修改！');
  // 清空输入框（可选）
  frameTime.value = '';
}
const deleteFrame = () => { // 删除当前帧
  if (frames.value.length <= 1) {
    alert('至少保留一帧')
    return
  }
  
  if (currentFrameIndex.value === 0) {
    alert('不能删除初始帧')
    return
  }
  
  frames.value.splice(currentFrameIndex.value, 1)
  
  // 防止删除后数组越界
  if (currentFrameIndex.value >= frames.value.length) {
    currentFrameIndex.value = frames.value.length - 1
  }
  
  // 更新球员位置到当前帧
  const newPlayers = frames.value[currentFrameIndex.value]?.players
  if (newPlayers) {
    newPlayers.forEach((player) => {
      const p = players.value.find(item => item.id === player.id)
      if (p) {
        p.x = player.x
        p.y = player.y
      }
    })
  }
  const newBall=frames.value[currentFrameIndex.value]?.ball
  if(newBall){
    ball.value.x=newBall.x
    ball.value.y=newBall.y
  }
}

const prevFrame = () => { // 上一帧
  if (currentFrameIndex.value <= 1) {
    return
  }
  
  currentFrameIndex.value--
  
  // 更新球员位置
  const newPlayers = frames.value[currentFrameIndex.value]?.players
  if (newPlayers) {
    newPlayers.forEach((player) => {
      const p = players.value.find(item => item.id === player.id)
      if (p) {
        p.x = player.x
        p.y = player.y
      }
    })
  }
  const newBall=frames.value[currentFrameIndex.value]?.ball
  if(newBall){
    ball.value.x=newBall.x
    ball.value.y=newBall.y
  }
}

const nextFrame = () => { // 下一帧
  if (currentFrameIndex.value >= frames.value.length - 1) {
    return
  }
  
  currentFrameIndex.value++
  
  // 更新球员位置
  const newPlayers = frames.value[currentFrameIndex.value]?.players
  if (newPlayers) {
    newPlayers.forEach((player) => {
      const p = players.value.find(item => item.id === player.id)
      if (p) {
        p.x = player.x
        p.y = player.y
      }
    })
  }
  const newBall=frames.value[currentFrameIndex.value]?.ball
  if(newBall){
    ball.value.x=newBall.x
    ball.value.y=newBall.y
  }
}

// 保存战术数据到后端
const save = async () => {
  // 如果没输入名字，用时间默认命名
  const name = tacticName.value.trim() || `战术-${new Date().toLocaleTimeString()}`
  const message=tacticMessage.value.trim()||null
  const dto = {
    title: name,
    m:message,
    framesJson: JSON.stringify(frames.value)
  }
  
  try {
    if (currentEditingId.value != 0 && currentEditingId.value != 1) { // 更新模式
      const { data } = await axios.put(
        `http://board-backend-production-3c99.up.railway.app/api/tactics/${currentEditingId.value}`, dto
      )
      alert(`已更新战术：${data.title} (ID=${data.id})`)
      router.push(`/self/tactic/${data.id}`)
    } else {
      const { data } = await axios.post('http://board-backend-production-3c99.up.railway.app/api/tactics', dto)
      alert(`已保存: ${data.title} (ID=${data.id})`)
      router.push(`/self/tactic/${data.id}`)
      currentEditingId.value = data.id
    }
    
    loadTacticList() // 更新战术列表
  } catch (error) {
    alert('保存失败' + error)
  }
}

// 获取所有战术列表
const loadTacticList = async () => {
  try {
    const { data } = await axios.get('http://board-backend-production-3c99.up.railway.app/api/tactics')
    tacticList.value = data
    console.log('加载列表', data)
  } catch (e) {
    console.error('加载失败', e)
  }
}

// 根据ID加载战术
const loadTactic = async (id: number) => {
  try {
    const { data } = await axios.get(`http://board-backend-production-3c99.up.railway.app/api/tactics/${id}`)
    frames.value = JSON.parse(data.framesJson)
    currentFrameIndex.value = Math.min(1, frames.value.length - 1)
    currentEditingId.value = id
    tacticName.value = data.title
    tacticMessage.value=data.message||null
    
    // 更新球员位置
    const newPlayers = frames.value[currentFrameIndex.value]?.players
    if (newPlayers) {
      newPlayers.forEach((player) => {
        const p = players.value.find(item => item.id === player.id)
        if (p) {
          p.x = player.x
          p.y = player.y
        }
      })
    }
    const newBall=frames.value[currentFrameIndex.value]?.ball
    if(newBall){
      ball.value.x=newBall.x
      ball.value.y=newBall.y
    }
    router.push(`/self/tactic/${id}`)
    alert(`已加载：${data.title} (ID=${data.id})`)
  } catch (e) {
    alert('加载失败' + e)
  }
}

// 删除战术
const deleteTactic = async (id: Number, event: Event) => {
  event.stopPropagation()
  
  if (!confirm('确定要删除这个战术吗？')) {
    return
  }
  
  try {
    await axios.delete(`http://board-backend-production-3c99.up.railway.app/api/tactics/${id}`)
    alert('删除成功')
    router.push('/self')
    resetToDefault()
    tacticList.value = tacticList.value.filter(t => t.id !== id)
  } catch (e) {
    alert('删除失败' + e)
  }
}

// 编辑战术
const updateTactic = async (id: number, event: Event) => {
  event.stopPropagation()
  currentEditingId.value = id
  router.push(`/self/tactic/${id}`)
}

// 退出编辑
const stopupdate = async (id: number, event: Event) => {
  event.stopPropagation()
  currentEditingId.value = 0
}
const createDragBoundFunc=(player:any)=>(pos:any)=>({
  x:Math.max(player.radius,Math.min(stageConfig.value.width-player.radius,pos.x)),
  y:Math.max(player.radius,Math.min(stageConfig.value.height-player.radius,pos.y))
})
// 拖拽球员更新位置
function handleDragEnd(e: KonvaEvent,player:any) {
  if (isPlaying.value) return // 播放时禁止拖拽
  
  //const node = e.target as any
  const grouPos = e.target.position()
  //const id = node.id && node.id()
  const x = grouPos.x
  const y = grouPos.y
  if(x<20||x>881||y<52||y>492){
    alert('该球员出界')
  }
  //const p = players.value.find(item => item.id === id)
  if (player) {
    player.x = x
    player.y = y
  }
  //console.log(x,y)
}
function handleClickEvent(e: KonvaEvent,player:any){
  if (isPlaying.value) return // 播放时禁止点击
  player.isSelected=!player.isSelected//改变当前球员选中状态
}
function handleDragBall(e:KonvaEvent,ball:any){ //处理球的拖拽
  if(isPlaying.value) return
  const node=e.target as any
  const x=node.x()
  const y=node.y()
  if(ball){
    ball.x=x
    ball.y=y
  }
  console.log(ball.x,ball.y)
}
// 播放/暂停切换
const togglePlay = () => {
  if (isPlaying.value && !isPaused.value) {
    pause()
  } else {
    play()
  }
}

// 开始播放
const play = () => {
  // 检查帧数
  if (frames.value.length < 2) {
    alert('至少需要两帧才能播放')
    return
  }
  
  // 播放时禁止拖拽
  players.value.forEach(p => p.draggable = false)
  ball.value.draggable=false
  isPlaying.value = true
  isPaused.value = false
  
  // 如果是第一次播放，从头开始
  if (currentPlayIndex.value === 1&&currentTime.value==0) {
    currentPlayIndex.value = 1
    currentTime.value = 0
    segmentElapsed.value = 0
    playSegment(0)
  } else{
    // 从当前位置继续播放
    playSegment(segmentElapsed.value)
  }
}

// 暂停播放
const pause = () => {
  isPaused.value = true
  isPlaying.value = false
  
  // 暂停时恢复拖拽
  players.value.forEach(p => p.draggable = true)
  ball.value.draggable=true
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
}

// 停止播放
const stop = () => {
  isPlaying.value = false
  isPaused.value = false
  
  // 停止时恢复拖拽
  players.value.forEach(p => p.draggable = true)
  ball.value.draggable=true
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
  
  // 重置所有播放状态
  currentPlayIndex.value = 1
  segmentElapsed.value = 0
  currentTime.value = 0
  
  // 重置画面到第一帧
  resetToFrame(1)
}

// 播放片段（帧间过渡）
const playSegment = (continueFrom = 0) => {
  if (currentPlayIndex.value >= frames.value.length - 1) {
    alert('播放完成！')
    onPlayComplete()
    return
  }
  
  const startFrame = frames.value[currentPlayIndex.value]
  const endFrame = frames.value[currentPlayIndex.value + 1]
  
  if (!endFrame || !startFrame) return
  
  // 计算当前片段的持续时间
  const segmentDuration = Math.max(100, (endFrame.time - startFrame.time) * 1000)
   // 新增：根据倍速调整片段实际播放时长
  const actualSegmentDuration = segmentDuration/playSpeed.value
  
  // 如果有续播时间，使用它，否则从0开始
  const startOffset = continueFrom > 0 ? continueFrom : 0
  const startTime = Date.now() - startOffset
  
  const tick = () => {
    if (!isPlaying.value || isPaused.value) return
    
    const elapsed = Date.now() - startTime
    segmentElapsed.value = elapsed
    //新增：实际流逝时间 = 真实时间 * 倍速
    const actualElapsed = elapsed * playSpeed.value
    currentTime.value = startFrame.time * 1000 + actualElapsed
    
    // 计算段内进度（0-1）
    const progress = Math.min(actualElapsed / actualSegmentDuration, 1)
    
    // 更新球员位置（插值）
    updatePlayerPositions(startFrame.players, endFrame.players, progress)
    //更新篮球位置
    updateBallPosition(startFrame.ball,endFrame.ball,progress)
    // 强制刷新舞台
    stageRef.value?.getStage()?.batchDraw()
    
    // 如果当前片段未播放完，继续
    if (progress < 1) {
      animationFrameId.value = requestAnimationFrame(tick)
    } else {
      // 播放完当前片段，切换到下一段
      currentPlayIndex.value++
      segmentElapsed.value = 0
      playSegment(0)
    }
  }
  tick()
}

// 计算球员位置插值（平滑过渡）
const updatePlayerPositions = (startPlayers: any[], endPlayers: any[], progress: number) => {
  startPlayers.forEach((start) => {
    const end = endPlayers.find(p => p.id === start.id)
    if (!end) return
    const player = players.value.find(p => p.id === start.id)
    if (player) {
      // 线性插值计算中间位置
      player.x = start.x + (end.x - start.x) * progress
      player.y = start.y + (end.y - start.y) * progress
    }
  })
}
//计算篮球位置
const updateBallPosition = (startBall: any, endBall: any, progress: number) => {
  // 线性插值计算中间位置
  ball.value.x = startBall.x + (endBall.x - startBall.x) * progress
  ball.value.y = startBall.y + (endBall.y - startBall.y) * progress
}
// 重置到指定帧
const resetToFrame = (frameIndex: number) => {
  const frame = frames.value[frameIndex]
  if (!frame) return
  
  // 更新球员位置
  const newPlayers = frame.players
  if (newPlayers) {
    newPlayers.forEach((player) => {
      const p = players.value.find(item => item.id === player.id)
      if (p) {
        p.x = player.x
        p.y = player.y
      }
    })
  }
  const newBall=frame.ball
    if(newBall){
      ball.value.x=newBall.x
      ball.value.y=newBall.y
    }
  // 更新当前帧索引
  currentFrameIndex.value = frameIndex
  
  // 强制刷新
  nextTick(() => {
    stageRef.value?.getStage()?.batchDraw()
  })
}

// 播放完成回调
const onPlayComplete = () => {
  isPlaying.value = false
  isPaused.value = false
  
  // 恢复拖拽
  players.value.forEach(p => p.draggable = true)
  ball.value.draggable=true
  currentTime.value = totalDuration.value
  setTimeout(()=>{
    // 重置所有播放状态
    currentPlayIndex.value = 1
    segmentElapsed.value = 0
    currentTime.value = 0
  
    // 重置画面到第一帧
    resetToFrame(1)
  },1000)
}

// 根据进度百分比计算当前帧和位置
const getPositionByPercent = (percent: number) => {
  const targetTime = (percent / 100) * totalDuration.value
  
  // 遍历找到当前处于哪两个帧之间
  for (let i = 0; i < frames.value.length - 1; i++) {
    const currentFrame = frames.value[i]
    const nextFrame = frames.value[i + 1]
    
    if (!currentFrame || !nextFrame) continue
    
    const currentTimeMs = currentFrame.time * 1000
    const nextTimeMs = nextFrame.time * 1000
    
    if (targetTime >= currentTimeMs && targetTime <= nextTimeMs) {
      const segmentProgress = (targetTime - currentTimeMs) / (nextTimeMs - currentTimeMs)
      return {
        frameIndex: i,
        segmentProgress: segmentProgress,
        isLastFrame: false
      }
    }
  }
  
  // 超过最后一帧
  return {
    frameIndex: frames.value.length - 1,
    segmentProgress: 0,
    isLastFrame: true
  }
}

// 进度条鼠标按下（开始拖动）
const handleProgressMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  const wasPlaying = isPlaying.value
  
  // 拖动时暂停播放
  if (wasPlaying) {
    pause()
  }
  
  // 更新进度
  updateProgressFromEvent(e)
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleProgressMouseMove)
  document.addEventListener('mouseup', handleProgressMouseUp)
  
  // 保存播放状态
  document.body.dataset.wasPlaying = String(wasPlaying)
}

// 进度条拖动中
const handleProgressMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  updateProgressFromEvent(e)
}

// 进度条拖动结束
const handleProgressMouseUp = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 移除全局监听
  document.removeEventListener('mousemove', handleProgressMouseMove)
  document.removeEventListener('mouseup', handleProgressMouseUp)
  
  // 如果拖动前正在播放，则继续播放
  const wasPlaying = document.body.dataset.wasPlaying === 'true'
  if (wasPlaying) {
    segmentElapsed.value = segmentElapsed.value / playSpeed.value
    play()
  }
}

// 根据鼠标事件更新进度
const updateProgressFromEvent = (e: MouseEvent) => {
  const track = e.currentTarget as HTMLElement
  const rect = track.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100))
  
  // 更新当前时间
  currentTime.value = (percent / 100) * totalDuration.value
  
  // 计算对应的帧和位置
  const positionInfo = getPositionByPercent(percent)
  
  if (positionInfo.isLastFrame) {
    // 最后一帧，直接跳转
    resetToFrame(positionInfo.frameIndex)
    currentPlayIndex.value = positionInfo.frameIndex
  } else {
    // 在两帧之间，计算插值位置
    const startFrame = frames.value[positionInfo.frameIndex]
    const endFrame = frames.value[positionInfo.frameIndex + 1]
    
    if (startFrame && endFrame) {
      updatePlayerPositions(startFrame.players, endFrame.players, positionInfo.segmentProgress)
      updateBallPosition(startFrame.ball, endFrame.ball, positionInfo.segmentProgress)
      currentPlayIndex.value = positionInfo.frameIndex
      segmentElapsed.value = positionInfo.segmentProgress * (endFrame.time - startFrame.time) * 1000
      
      // 更新当前编辑帧索引
      currentFrameIndex.value = positionInfo.frameIndex
      
      // 刷新舞台
      stageRef.value?.getStage()?.batchDraw()
    }
  }
}

// 帧标记点点击
const handlePointClick = (index: number) => {
  if (isNaN(index) || index < 0 || index >= frames.value.length) return
  
  // 停止播放
  if (isPlaying.value) {
    pause()
  }
  
  // 切换到对应帧
  currentFrameIndex.value = index
  resetToFrame(index)
  
  // 更新播放进度
  if(!frames.value[index]) return
  const frameTime = frames.value[index].time * 1000
  currentTime.value = frameTime
  currentPlayIndex.value = index
  segmentElapsed.value = 0
}

// 返回上一页
const back = async () => {
  let path=route.path//获取当前路径
  if(path==='/self'||path==='/classic'||path==='/video_analysis'||path==='/intro'){
    await router.push('/')//回到根路径
  }
  if(path.includes('/self/tactic')){
    //console.log('21')
    await router.push('/self')
  }
  if(path.includes('/classic/tactic')){
    await router.push('/classic')
  }
  resetToDefault()
}

// 图片配置
const imageConfig = computed(() => ({
  x: 0,
  y: 0,
  image: woodImage.value ?? null,
  width: stageConfig.value.width,
  height: stageConfig.value.height
}))
</script>

<style scoped>
.konvajs-content {
  border: 1px solid #ccc;
  display: inline-block;
  background-color: #f5f5f5;
}

/* 帧标记悬停效果 */
.frame-marker:hover .time-tooltip {
  opacity: 1 !important;
}

.frame-marker:hover {
  transform: translateX(-50%) scale(1.2) !important;
}

/* 轨道悬停效果 */
.timeline-track:hover {
  background: #d5d5d5;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #ddd;
  cursor: pointer;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.1s linear;
}

button {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  border: none;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 美化按钮样式 */
button:not(:disabled):hover {
  opacity: 0.9;
}
 
.frame-marker.active {
  box-shadow: 0 0 0 2px #2196F3;
}
.tactic-board {
  position: relative;
  width: 800px;
  height: 600px;
}

.action-menu {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  padding: 4px 0;
  z-index: 100;
  min-width: 100px;
  transform: translate(-50%, -120%); /* 显示在球员上方 */
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.pass { color: #4CAF50; }
.menu-item.finish { color: #FF5722; }
.menu-item.cancel { color: #999; border-top: 1px solid #eee; }

.target-hint {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  pointer-events: none;
}
</style>