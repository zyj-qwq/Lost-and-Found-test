<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, put } from '@/api'
import type { UserInfo, PageResult } from '@/types'
import { formatTime, roleMap } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const list = ref<UserInfo[]>([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10, keyword: '' })

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: query.page, page_size: query.page_size }
    if (query.keyword) params.keyword = query.keyword
    const data = await get<PageResult<UserInfo>>('/admin/users', params)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function changeRole(row: UserInfo, role: string) {
  await put(`/admin/users/${row.uid}`, { role })
  ElMessage.success(`已将 ${row.username} 的角色改为「${roleMap[role]}」`)
  row.role = role as UserInfo['role']
}

async function toggleStatus(row: UserInfo) {
  const target = row.status === 'active' ? 'disabled' : 'active'
  await put(`/admin/users/${row.uid}`, { status: target })
  ElMessage.success(target === 'disabled' ? '已禁用该用户' : '已启用该用户')
  row.status = target
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="toolbar">
      <el-input v-model="query.keyword" placeholder="按用户名 / uid 搜索" clearable style="width: 220px"
        @keyup.enter="fetchList" @clear="fetchList" />
      <el-button type="primary" @click="fetchList">查询</el-button>
    </div>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="uid" label="uid" width="90" />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column label="角色" width="200">
        <template #default="{ row }">
          <el-select v-if="auth.user?.uid !== row.uid" :model-value="row.role" size="small" @change="(v: string) => changeRole(row, v)">
            <el-option label="普通用户" value="user" />
            <el-option label="失物招领管理员" value="item_admin" />
            <el-option label="系统管理员" value="system_admin" />
          </el-select>
          <el-tag v-else size="small">{{ roleMap[row.role] }}（我）</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '正常' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button v-if="auth.user?.uid !== row.uid" link :type="row.status === 'active' ? 'danger' : 'success'"
            @click="toggleStatus(row)">
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager" v-if="total > 0">
      <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="query.page_size"
        :current-page="query.page" @current-change="(p: number) => { query.page = p; fetchList() }" />
    </div>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 12px; margin-bottom: 14px; }
.pager { display: flex; justify-content: center; padding-top: 16px; }
</style>
