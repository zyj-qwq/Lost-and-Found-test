// ============================================================
// stores/auth.ts —— 登录状态仓库（全项目共享）
// ============================================================
// 问题：登录后，"导航栏要不要显示用户名"、"能不能进管理后台"，
//       首页、详情页、后台页等很多组件都需要知道。
//       如果各存一份，退出登录时得挨个改，非常容易漏。
//
// 解决：用 Pinia 建一个"全局仓库"，登录状态只存这一份，
//       任何组件里 useAuthStore() 拿到的都是同一份数据，
//       一处修改，所有用到它的界面自动更新（这就是"响应式"）。
// ============================================================

// defineStore：Pinia 提供的"定义仓库"函数
import { defineStore } from 'pinia'
// ref：让一个值变成"响应式"（值变了，用到它的页面自动更新）
// computed：计算属性——由其他值"算出来"的值，依赖变了它自动重算
import { ref, computed } from 'vue'
// 导入自定义的 TS 类型（见 types/index.ts，规定"用户数据长什么样"）
import type { UserInfo, LoginResult } from '@/types'
// 导入统一封装的发请求函数 和 "未授权回调"注册函数（见 api/index.ts）
import { post, get, setUnauthorizedHandler } from '@/api'

// 定义并导出仓库。'auth' 是仓库的名字，() => {...} 里写仓库的数据和操作。
// 组件里这样用：const auth = useAuthStore(); 然后 auth.user、auth.login(...)
export const useAuthStore = defineStore('auth', () => {
  // ---- 两个核心数据 ----
  // 登录令牌：初始值从 localStorage 读（刷新页面后仍保持登录状态）
  // ref() 的值要用 .value 读写（在模板里则不用加 .value）
  const token = ref<string>(localStorage.getItem('token') || '')
  // 当前登录的用户信息；JSON.parse 把存的字符串转回对象，没存过就是 null
  const user = ref<UserInfo | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  // token 失效时(接口返回10002)同步清理内存状态，保证界面立刻回到未登录
  // （把清理函数注册给 api 层，见 api/index.ts 的注释）
  setUnauthorizedHandler(() => {
    token.value = ''
    user.value = null
  })

  // ---- 计算属性：由上面的数据"推导"出来的值 ----
  // !!token.value：把字符串转成 true/false——有 token 就算"已登录"
  const isLoggedIn = computed(() => !!token.value)
  // 可选链 ?.：user 为 null 时不报错，返回 undefined，再用 || 兜底为 'user'
  const role = computed(() => user.value?.role || 'user')
  // 两种管理员都能进管理后台
  const isAdmin = computed(() => role.value === 'item_admin' || role.value === 'system_admin')
  // 只有系统管理员能管用户和公告
  const isSystemAdmin = computed(() => role.value === 'system_admin')

  // ---- 下面是操作登录状态的方法 ----

  // 登录成功后统一保存 token 和用户信息（内存 + localStorage 各存一份：
  // 内存保证当前页面生效，localStorage 保证刷新页面后仍保持登录）
  function setAuth(result: LoginResult) {
    token.value = result.token
    user.value = { ...result.user, status: 'active' } // ...是"展开合并"，加一个 status 字段
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(user.value)) // 对象不能直接存，要转成 JSON 字符串
  }

  // 登录：把 uid 和密码发给后端，成功后保存返回的 token
  async function login(uid: number, password: string) {
    // await：等待后端返回再执行下一行（异步操作，类似回调但写法更直观）
    const result = await post<LoginResult>('/auth/login', { uid, password })
    setAuth(result)
    // 登录后拉取最新用户信息（确保角色/状态是最新的）
    try {
      const me = await get<UserInfo>('/auth/me')
      user.value = me
      localStorage.setItem('user', JSON.stringify(me))
    } catch {
      /* ignore */
    }
  }

  // 退出登录：内存和 localStorage 全部清空
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 更新本地保存的用户信息（比如管理员改了自己的角色后）
  function refreshUser(info: UserInfo) {
    user.value = info
    localStorage.setItem('user', JSON.stringify(info))
  }

  // 应用启动时校验一次 token：失效则由拦截器清理并跳登录页
  // 防止"后端数据重置了，但浏览器还存着旧 token"造成的假登录
  async function init() {
    if (!token.value) return // 没登录就不用校验
    try {
      const me = await get<UserInfo>('/auth/me') // 有效：刷新一下用户信息
      refreshUser(me)
    } catch {
      /* 拦截器已处理清理和跳转 */
    }
  }

  // 把数据和函数都返回出去，组件里才能通过 auth.xxx 访问
  return { token, user, isLoggedIn, role, isAdmin, isSystemAdmin, login, logout, refreshUser, init }
})
