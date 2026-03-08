<template>
    <div class="app">
        <!--上传区-->
        <div v-if="!videoSrc" class="upload-zone" @drop.prevent="onDrop" @dragover.prevent>
            <input type="file" ref="fileInput" accept="video/*" @change="onFileChange" hidden>
            <div class="upload-content" @click="$refs.fileInput.click()">
                <h3>上传视频</h3>
                <p>拖拽或点击选择MP4文件</p>
            </div>
        </div>

        <!--工作区-->
        <div v-else class="workspace">
            <!--左侧：视频标注-->
            <div class="video-section">
                <div class="video-container" ref="videoContainer">
                    <video
                        ref="video"
                        :src="videoSrc"
                        @loadedmetadata="onVideoLoad"
                        @timeupdate="onTimeUpdate"
                        @click="onVideoClick"
                    ></video>

                    <!--标注层-->
                    <div class="overlay">
                        <div
                            v-for="mark in currentMarks"
                            :key="mark.id"
                            class="player-dot"
                            :class="mark.team"
                            :style="{left:mark.x+'%',top:mark.y+'%'}"
                            @click.stop="removeMark(mark.id)"
                        >
                            {{ mark.number||'?' }}
                        </div>
                    </div>
                </div>

                <!--控制栏-->
                <div clas="controls">
                    <button @click="prevFrame">上一帧</button>
                    <button @click="togglePlay">{{ playing?'⏸' :'▶'}}</button>
                    <button @click="nextFrame">下一帧</button>
                    <span class="time">{{ formatTime(currentTime) }}/{{ formatTime(duration) }}</span>
                    <button class="btn-capture" @click="captureFrame">捕获当前帧</button>
                </div>

                <!--当前帧标注工具-->
                <div class="toolbar">
                    <div class="team-selector">
                        <button
                        :class="{active:currentTeam==='home'}"
                        @click="currentTeam='home'"
                        class="team-btn home">
                            主队
                        </button>
                        <button
                        :class="{active:currentTeam==='away'}"
                        @click="currentTeam='away'"
                        class="team-btn away">
                            客队
                        </button>
                    </div>
                    <input
                        v-model="currentNumber"
                        placeholder="号码"
                        class="number-input"
                        @keyup.enter="focusVideo"
                    />
                    <button @click="clearCurrentMarks" class="btn-clear">清除当前</button>
                </div>
            </div>

            <!--右侧：战术预览与时间轴-->
            <div class="tactic-section">
                <div class="preview-header">
                    <h3>战术预览</h3>
                    <button
                        v-if="capturedFrames.length>=2"
                        @click="playTactic"
                        class="btn-play"
                    >
                        播放战术
                    </button>
                </div>

                <!--时间轴-->
                <div class="timeline">
                    <div
                        v-for="(frame,idx) in capturedFrames"
                        :key="idx"
                        class="frame-card"
                        :class="{active:currentFrameIndex===idx}"
                    >
                        <div class="frame-preview" @click="loadFrame(idx)">
                            <div class="mini-court">
                                <div
                                    v-for="p in frame.players"
                                    :key="p.id"
                                    class="mini-player"
                                    :class="p.team"
                                    :style="{left:p.x+'%',top:p.y+'%'}"
                                ></div>
                            </div>
                            <span class="frame-num">#{{ idx+1 }}</span>
                        </div>
                        <button class="btn-delete" @click="removeFrame(idx)">×</button>
                    </div>

                    <div v-if="capturedFrames.length===0" class="empty-tip">
                        点击“捕获当前帧”添加战术帧
                    </div>
                </div>

                <!--简易战术动画预览-->
                <div v-if="showTacticPlayer" class="tactic=player">
                    <div class="court">
                        <svg viewBox="0 0 100 100" class="cpurt-svg">
                            <!--球场-->
                            <rect x="0" y="0" width="100" height="100" fill="#1e3a1e"/>
                            <circle cx="50" cy="50" r="10" fill="none" stroke="white" stroke-width="0.5"/>
                            <line x1="50" y1="0" x2="50" y2="100" stroke="white" stroke-width="0.5"/>

                            <!--球员轨迹-->
                            <g v-for="player in animatedPlayers" :key="player.id">
                                <path
                                    :d="player.path"
                                    fill="none"
                                    :stroke="player.color"
                                    stroke-width="0.5"
                                    stroke-dasharray="2,2"
                                />
                                <circle
                                    :cx="player.currentX"
                                    :cy="player.currentY"
                                    r="3"
                                    :fill="player.color"
                                >
                                    <animate
                                        attributeName="cx"
                                        :values="player.xValues"
                                        :dur="tacticDuration+'s'"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="cy"
                                        :values="player.yValues"
                                        :dur="tacticDuration+'s'"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {ref,computed,nextTick} from 'vue'
import { useRoute } from 'vue-router'
const videoSrc=ref('')
const video=ref(null)
const videoContainer=ref(null)
const fileInput=ref(null)

const duration=ref(0)
const currentTime=ref(0)
const playing=ref(false)

const currentTeam=ref('home')
const currentNumber=ref('')
const currentMarks=ref([])//当前视频帧的临时标注

const capturedFrames=ref([])//已经捕获的战术帧
const currentFrameIndex=ref(-1)

const showTacticPlayer=ref(false)
const tacticduration=ref(3)

const historytMarks=computer(()=>{ //
    if(currentFrameIndex.value>=0){
        return capturedFrames.value[currentFrameIndex.value]?players:[]
    }
    return currentMarks.value
})

const onFileChange=(e)=>{
    const file =e.target.files[0]
    if(file) loadVideo(file)
}

const onDrop=(e)=>{
    const file=e.dataTransfer.files[0]
    if(file&&file.type.startsWith('video/')) loadVideo(file)
}

const loadVideo=()=>{
    videoSrc.value=URL.createObjectURL(file)
}

const onTimeUpdate=()=>{
    currentTime.value=video.value.currentTime
}

const formatTime=(s)=>{
    const m=Math.floor(s/60)
    const sec=Math.floor(s%60)
    return `${m}:${sec.toString().padStart(2,'0')}`
}

const togglePlay=()=>{
    if(playing.value){
        video.value.pause()
    }
    else{
        video.value.play()
    }
    playing.value=!playing,value
}

const FPS=30
const prevFrame=()=>{
    video.value.currentTime=Math.max(0,currentTime.value-1/FPS)
}
const nextFrame=()=>{
    video.value.currentTime=Math.min(duration.value,currentTime.value+1/FPS)
}

const onVideoClick=(e)=>{
    const rect=videoContainer.value.getBoundingClientRect()
    const x=((e.clientX-rect.left)/rect.width)*100
    const y=((e.clientY-rect.top)/rect.height)*100
    currentMarks.value.push({
        id:Date.now(),
        x,y,
        team:currentTeam.value,
        number:currentNumber.value||'?'
    })
    if(currentNumber.value&&!isNaN(currentNumber.value)){
        currentNumber.value=String(parseInt(currentNumber.value)+1)
    }
}
const removeMark=(id)=>{
    currentMarks.value=[]
    currentFrameIndex.value=-1
}
const focusVideo=()=>{
    video.value?.focus()
}
const captureFrame=()=>{//保存当前标注为战术帧
    capturedFrames.value.push({
        time:currentTime.value,
        players:[...currentMarks.value]
    })
    currentMarks.value=[]
    currentNumber.value=''
    video.value.currentTime+=2
}
const loadFrame=(idx)=>{
    currentFrameIndex.value=idx
    const frame=capturedFrames.value[idx]
    video.value.currentTime=frame.time
}
const removeFrame=(idx)=>{
    capturedFrames.value.splice(idx,1)
    if(currentFrameIndex.value===idx){
        currentFrameIndex.value=-1
    }
}
const animatedPlayers=ref([])
const playTactic=()=>{
    showTacticPlayer.value=true
    const playerTracks=new Map()//构建球员轨迹
    capturedFrames.value.forEach((frame,frameIdx)=>{
        frame.players.forEach(p=>{
            if(!playerTracks.has(p.id)){
                playerTracks.set(p.id,{
                    id:p.id,
                    team:p.team,
                    color:p.team==='home'?'#ff4444':'#4444ff',
                    positions:[]
                })
            }
            playerTracks.get(p.id).positions.push({
                x:p.x,y:p.y,framd:frameIdx
            })
        })
    })
    animatedPlayers.value=Array.from(playerTracks.values()).map(track=>{
        const xVals=track.positions.map(p=>p.x).join(';')
        const yVals=track.positions.map(p=>p.y).join(';')
        //构建路径
        const pathD=track.positions.map((p,i)=>
            (i===0?'M':'L')+`${p.x} ${p.y}`
        ).join(' ')
        return{
            ...track,
            xValues:xVals,
            yValues:yVals,
            path:pathD,
            currentX:track.positions[0]?.x||0,
            currentY:track.positions[0]?.y||0
        }
    })
}
</script>
<style scoped>
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0a0a0a;
  min-height: 100vh;
  color: #fff;
}

.upload-zone {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px dashed #333;
  margin: 20px;
  border-radius: 12px;
  transition: all 0.3s;
}

.upload-zone:hover {
  border-color: #4CAF50;
  background: #111;
}

.upload-content {
  text-align: center;
  cursor: pointer;
  padding: 60px;
}

.icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.workspace {
  display: grid;
  grid-template-columns: 1fr 400px;
  height: 100vh;
  gap: 1px;
  background: #222;
}

.video-section {
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
}

.video-container {
  position: relative;
  flex: 1;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

video {
  max-width: 100%;
  max-height: 100%;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.player-dot {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.player-dot.home {
  background: #ff4444;
}

.player-dot.away {
  background: #4444ff;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #1a1a1a;
  border-top: 1px solid #333;
}

.controls button {
  background: #333;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-capture {
  background: #4CAF50 !important;
  margin-left: auto;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #141414;
  border-top: 1px solid #333;
}

.team-selector {
  display: flex;
  gap: 10px;
}

.team-btn {
  padding: 8px 16px;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.team-btn.home {
  background: #3a1a1a;
  color: #ff6666;
}

.team-btn.home.active {
  border-color: #ff4444;
  background: #ff4444;
  color: white;
}

.team-btn.away {
  background: #1a1a3a;
  color: #6666ff;
}

.team-btn.away.active {
  border-color: #4444ff;
  background: #4444ff;
  color: white;
}

.number-input {
  width: 60px;
  padding: 8px;
  background: #222;
  border: 1px solid #444;
  color: white;
  border-radius: 4px;
  text-align: center;
}

.tactic-section {
  background: #141414;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.preview-header {
  padding: 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-play {
  background: #4CAF50;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.timeline {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.frame-card {
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.frame-card:hover, .frame-card.active {
  border-color: #4CAF50;
}

.frame-preview {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-court {
  width: 60px;
  height: 60px;
  background: #1e3a1e;
  border-radius: 4px;
  position: relative;
  border: 1px solid #2a5a2a;
}

.mini-player {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.mini-player.home {
  background: #ff4444;
}

.mini-player.away {
  background: #4444ff;
}

.btn-delete {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #ff4444;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-tip {
  text-align: center;
  color: #666;
  padding: 40px;
  font-style: italic;
}

.tactic-player {
  padding: 20px;
  border-top: 1px solid #333;
}

.court {
  background: #1e3a1e;
  border-radius: 8px;
  overflow: hidden;
}

.court-svg {
  width: 100%;
  aspect-ratio: 1;
}
</style>