<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Search, Bell, Position, Box, List, Setting, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

async function handleLogout() {
  await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout">
    <el-header class="header">
      <div class="header-inner">
        <div class="logo" @click="router.push('/')">
          <el-icon :size="26" color="#409eff"><Search /></el-icon>
          <span>校园失物招领平台</span>
        </div>
        <el-menu mode="horizontal" :default-active="route.path" router class="nav" :ellipsis="false">
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item v-if="auth.isLoggedIn" index="/publish">发布</el-menu-item>
          <el-menu-item v-if="auth.isLoggedIn" index="/my/items">我的发布</el-menu-item>
          <el-menu-item v-if="auth.isLoggedIn" index="/my/claims">我的申请</el-menu-item>
          <el-menu-item index="/announcements">
            <el-icon><Bell /></el-icon>公告
          </el-menu-item>
          <el-menu-item v-if="auth.isAdmin" index="/admin">
            <el-icon><Setting /></el-icon>管理后台
          </el-menu-item>
        </el-menu>
        <div class="user-area">
          <template v-if="auth.isLoggedIn && auth.user">
            <el-dropdown>
              <span class="user-chip">
                <el-icon><User /></el-icon>
                {{ auth.user.username }}
                <span class="uid">UID: {{ auth.user.uid }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/my/items')">我的发布</el-dropdown-item>
                  <el-dropdown-item @click="router.push('/my/claims')">我的申请</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="router.push('/login')">登录 / 注册</el-button>
          </template>
        </div>
      </div>
    </el-header>
    <el-main class="main">
      <router-view />
    </el-main>
    <el-footer class="footer">校园失物招领平台 · Vue 3 + TypeScript + Node.js</el-footer>
  </el-container>
</template>

<style scoped>
.layout { min-height: 100vh; background: #f5f7fa; }
.header { background: #fff; border-bottom: 1px solid #e4e7ed; padding: 0; position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 24px; height: 60px; padding: 0 16px; }
.logo { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; color: #303133; cursor: pointer; white-space: nowrap; }
.nav { flex: 1; border-bottom: none !important; }
.user-area { white-space: nowrap; }
.user-chip { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #303133; outline: none; }
.uid { color: #909399; font-size: 12px; }
.main { max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.footer { text-align: center; color: #909399; font-size: 13px; height: 48px; line-height: 48px; }
</style>
