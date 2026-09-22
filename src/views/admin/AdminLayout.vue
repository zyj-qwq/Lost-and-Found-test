<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <div class="admin">
    <el-card shadow="never" class="admin-card">
      <el-container>
        <el-aside width="200px" class="aside">
          <el-menu :default-active="route.path" router>
            <el-menu-item index="/admin">📊 数据统计</el-menu-item>
            <el-menu-item index="/admin/items">📋 信息审核</el-menu-item>
            <el-menu-item index="/admin/claims">✅ 认领审核</el-menu-item>
            <el-menu-item index="/admin/users">👥 用户管理</el-menu-item>
            <el-menu-item index="/admin/announcements">📢 公告管理</el-menu-item>
          </el-menu>
        </el-aside>
        <el-main class="content">
          <router-view />
        </el-main>
      </el-container>
    </el-card>
  </div>
</template>

<style scoped>
.admin-card :deep(.el-card__body) { padding: 0; }
.aside { border-right: 1px solid #e4e7ed; min-height: 560px; }
.aside :deep(.el-menu) { border-right: none; }
.content { min-height: 560px; }
</style>
