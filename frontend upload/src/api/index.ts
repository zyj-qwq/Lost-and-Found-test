// ============================================================
// api/index.ts —— 统一的"发请求"工具
// ============================================================
// 前端和后端是两个独立的程序，它们通过 HTTP 请求交流（就像表单提交）。
// axios 是一个用来发 HTTP 请求的库（比原生 fetch 更好用）。
//
// 这个文件做三件事：
//   1. 创建一个 axios 实例，统一配置"基地址"和超时时间
//   2. 用"拦截器"自动给每个请求带上登录令牌(token)、统一处理错误
//   3. 封装出 get/post/put/del 四个函数，别的文件 import 后一行代码就能发请求
// ============================================================

// axios：发请求的库；AxiosRequestConfig：请求配置的类型标注（TS 用）
import axios, { type AxiosRequestConfig } from 'axios'
// ElMessage：Element Plus 的消息弹条（右上角弹出的绿色成功/红色错误提示）
import { ElMessage } from 'element-plus'
// 导入路由器：token 失效时要跳转到登录页
import router from '@/router'

// 创建 axios 实例：
// baseURL：以后所有请求都自动加上 /api/v1 前缀（比如 get('/items') 实际请求 /api/v1/items）
//   /api 开头的请求会被 Vite 的代理转发给后端（见 vite.config.ts），这样就没有跨域问题
// timeout：15 秒没收到响应就报错
const request = axios.create({ baseURL: '/api/v1', timeout: 15000 })

// 未授权(10002)时的回调，由 auth store 注册，用于同步清理内存中的登录状态
// （为什么要回调？因为 api 不能反过来 import store，会造成循环引用。
//   所以 api 提供"注册函数"，store 启动时把自己的清理函数塞进来。）
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

// ---- 请求拦截器：每个请求"发出之前"都会经过这里 ----
request.interceptors.request.use((config) => {
  // 从浏览器 localStorage（本地存储，关浏览器也不丢）取出登录令牌
  const token = localStorage.getItem('token')
  // 如果有 token，就自动塞进请求头 Authorization 里（后端靠它识别"你是谁"）
  // Bearer 是固定格式：Bearer 空格 token，JWT 标准写法
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---- 响应拦截器：每个响应"到达之后"都会经过这里 ----
request.interceptors.response.use(
  (response) => {
    // 后端统一返回 { code, msg, data } 格式（见 API.md）
    const res = response.data
    if (res.code === 0) return res.data as any // code=0 表示成功，直接把 data 部分返回给调用方
    if (res.code === 10002) {
      // 10002 = 未登录或令牌无效（token 过期/被改/后端重置了）
      localStorage.removeItem('token') // 清掉本地保存的登录信息
      localStorage.removeItem('user')
      onUnauthorized?.() // 通知 auth store 也清掉内存里的登录状态（否则界面还显示"已登录"）
      ElMessage.error(res.msg || '请先登录') // 弹出红色错误提示
      router.push('/login') // 跳转到登录页
    } else {
      // 其他错误（参数错误、没有权限、重复提交……）：弹后端给的错误消息
      ElMessage.error(res.msg || '请求失败')
    }
    // 返回一个"失败的 Promise"，调用方 try/catch 或 .catch 能接住
    return Promise.reject(new Error(res.msg || '请求失败'))
  },
  (error) => {
    // 走到这里说明 HTTP 请求本身失败了（后端没开、断网、超时等）
    ElMessage.error(error.message === 'Network Error' ? '网络错误，请检查后端是否启动' : error.message || '请求失败')
    return Promise.reject(error)
  }
)

// ---- 封装四个快捷函数，其他文件 import 后直接用 ----
// <T> 是 TS 的"泛型"：调用时可以指定返回数据的类型，比如 get<Item[]>('/items')
// 表示"我知道这个接口返回的是 Item 数组"，编辑器就能自动提示字段名

// GET：获取数据（参数拼在网址上，如 /items?page=1&keyword=钱包）
export function get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, { params, ...config }) as Promise<T>
}
// POST：新建数据（参数放在请求体里）
export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config) as Promise<T>
}
// PUT：更新数据
export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config) as Promise<T>
}
// DELETE：删除数据（del 因为 delete 是 JS 保留字，不能直接当函数名）
export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config) as Promise<T>
}

export default request
