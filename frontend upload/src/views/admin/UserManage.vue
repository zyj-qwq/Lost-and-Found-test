<!-- ============================================================
UserManage.vue —— 管理后台·用户管理（仅系统管理员可见）
============================================================
能做的操作：把普通用户提升为管理员、禁用/启用账号。
本页能学到：el-select 用 :model-value（单向绑定）+ @change 的组合——
下拉框显示的是"当前值"，用户改选时触发函数发请求。
============================================================ -->

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get, put } from '@/api'
import type { UserInfo, PageResult } from '@/types'
import { formatTime, roleMap } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import { Search } from '@element-plus/icons-vue'

const auth = useAuthStore()
const loading = ref(false)
const list = ref<UserInfo[]>([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10, keyword: '' })

// 拉取用户列表（系统管理员专用接口 /admin/users）
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

// 搜索条件变化时回到第 1 页
function search() {
  query.page = 1
  fetchList()
}

// 修改某用户的角色（在下拉框里改选时触发）
async function changeRole(row: UserInfo, role: string) {
  await put(`/admin/users/${row.uid}`, { role })
  ElMessage.success(`已将 ${row.username} 的角色改为「${roleMap[role]}」`)
  row.role = role as UserInfo['role'] // 本地同步更新，不用重新拉列表
}

// 禁用 / 启用某用户
async function toggleStatus(row: UserInfo) {
  // 三元表达式算出"目标状态"：正常的 → 禁用；禁用的 → 启用
  const target = row.status === 'active' ? 'disabled' : 'active'
  await put(`/admin/users/${row.uid}`, { status: target })
  ElMessage.success(target === 'disabled' ? '已禁用该用户' : '已启用该用户')
  row.status = target as UserInfo['status']
}

onMounted(fetchList)
</script>

<template>
  <div class="review">
    <!-- 搜索工具栏 -->
    <div class="toolbar">
      <div class="tb-left">
        <el-input v-model="query.keyword" placeholder="按用户名 / uid 搜索" clearable style="width: 230px"
          :prefix-icon="Search" @keyup.enter="search" @clear="search" />
        <el-button type="primary" :icon="Search" @click="search">查询</el-button>
      </div>
      <span class="tb-count">共 {{ total }} 位用户</span>
    </div>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="uid" label="uid" width="92" />
      <el-table-column prop="username" label="用户名" min-width="130" />
      <el-table-column label="角色" width="210">
        <template #default="{ row }">
          <!-- 不能改自己的角色（防止系统管理员把自己降级后没法管理）：
               用 v-if 判断"这行不是我自己"才显示下拉框 -->
          <el-select v-if="auth.user?.uid !== row.uid" :model-value="row.role" size="small"
            @change="(v: string) => changeRole(row, v)">
            <el-option label="普通用户" value="user" />
            <el-option label="失物招领管理员" value="item_admin" />
            <el-option label="系统管理员" value="system_admin" />
          </el-select>
          <!-- 我自己的行：只显示标签，不能操作 -->
          <el-tag v-else size="small" effect="light" round type="primary">{{ roleMap[row.role] }}（我）</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" effect="light" round :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '正常' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <!-- 禁用后用户无法登录（登录接口会拒绝）；自己不能禁用自己 -->
          <el-button v-if="auth.user?.uid !== row.uid" link
            :type="row.status === 'active' ? 'danger' : 'success'"
            @click="toggleStatus(row)">
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="没有找到用户" :image-size="110" />
      </template>
    </el-table>

    <div class="pf-pager" v-if="total > query.page_size">
      <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="query.page_size"
        :current-page="query.page" @current-change="(p: number) => { query.page = p; fetchList() }" />
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.tb-left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.tb-count {
  font-size: 13px;
  color: var(--text-4);
}
</style>
