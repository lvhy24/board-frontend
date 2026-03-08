import axios from 'axios'

// 获取API基础URL，优先使用环境变量
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://board-backend-production-3c99.up.railway.app/api'

console.log('API Base URL:', API_BASE_URL)

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const tacticAPI = {
  /**
   * 获取所有战术列表
   */
  getTacticList() {
    return axiosClient.get('/tactics')
  },

  /**
   * 根据ID加载战术
   */
  getTacticById(id: number) {
    return axiosClient.get(`/tactics/${id}`)
  },

  /**
   * 创建新战术
   */
  createTactic(dto: any) {
    return axiosClient.post('/tactics', dto)
  },

  /**
   * 更新战术
   */
  updateTactic(id: number, dto: any) {
    return axiosClient.put(`/tactics/${id}`, dto)
  },

  /**
   * 删除战术
   */
  deleteTactic(id: number) {
    return axiosClient.delete(`/tactics/${id}`)
  }
}

export default axiosClient
