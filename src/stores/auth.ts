import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginResult } from '@/types'
import { post, get } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role || 'user')
  const isAdmin = computed(() => role.value === 'item_admin' || role.value === 'system_admin')
  const isSystemAdmin = computed(() => role.value === 'system_admin')

  function setAuth(result: LoginResult) {
    token.value = result.token
    user.value = { ...result.user, status: 'active' }
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function login(uid: number, password: string) {
    const result = await post<LoginResult>('/auth/login', { uid, password })
    setAuth(result)
    // 登录后拉取最新用户信息
    try {
      const me = await get<UserInfo>('/auth/me')
      user.value = me
      localStorage.setItem('user', JSON.stringify(me))
    } catch {
      /* ignore */
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function refreshUser(info: UserInfo) {
    user.value = info
    localStorage.setItem('user', JSON.stringify(info))
  }

  return { token, user, isLoggedIn, role, isAdmin, isSystemAdmin, login, logout, refreshUser }
})
