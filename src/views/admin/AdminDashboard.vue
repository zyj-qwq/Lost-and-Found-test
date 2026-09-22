<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/api'
import type { Statistics } from '@/types'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const stats = ref<Statistics | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    stats.value = await get<Statistics>('/admin/statistics')
  } finally {
    loading.value = false
  }
})

const cards = [
  { key: 'total_items', label: '信息总数', color: '#409eff' },
  { key: 'pending_items', label: '待审核信息', color: '#e6a23c' },
  { key: 'claimed_items', label: '已认领物品', color: '#67c23a' },
  { key: 'total_users', label: '注册用户', color: '#909399' },
  { key: 'total_claims', label: '认领申请数', color: '#f56c6c' }
]
</script>

<template>
  <div v-loading="loading">
    <h3>数据统计</h3>
    <el-row :gutter="16" v-if="stats">
      <el-col v-for="c in cards" :key="c.key" :xs="12" :sm="8" :md="6" :lg="4" style="margin-bottom: 16px">
        <el-card shadow="hover">
          <div class="stat-value" :style="{ color: c.color }">{{ stats[c.key as keyof Statistics] }}</div>
          <div class="stat-label">{{ c.label }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-alert type="info" :closable="false" show-icon
      :title="`当前管理员：${auth.user?.username}（${auth.role === 'system_admin' ? '系统管理员' : '失物招领管理员'}）`"
      style="margin-top: 8px" />
  </div>
</template>

<style scoped>
.stat-value { font-size: 30px; font-weight: 700; }
.stat-label { color: #909399; margin-top: 6px; font-size: 13px; }
</style>
