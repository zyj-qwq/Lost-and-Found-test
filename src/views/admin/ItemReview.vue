<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, put } from '@/api'
import type { Item, PageResult } from '@/types'
import { formatTime, itemStatusMap } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const list = ref<Item[]>([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10, status: 'pending', keyword: '' })

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: query.page, page_size: query.page_size }
    if (query.status) params.status = query.status
    if (query.keyword) params.keyword = query.keyword
    const data = await get<PageResult<Item>>('/admin/items', params)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function review(row: Item, status: 'approved' | 'closed') {
  const action = status === 'approved' ? '通过' : '驳回（关闭）'
  let remark = ''
  try {
    const { value } = await ElMessageBox.prompt(`确定${action}「${row.title}」吗？可填写审核备注`, '信息审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '审核备注（可选）'
    })
    remark = value || ''
  } catch {
    return
  }
  await put(`/admin/items/${row.id}`, { status, remark })
  ElMessage.success(`已${action}`)
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="toolbar">
      <el-select v-model="query.status" style="width: 140px" @change="fetchList">
        <el-option label="待审核" value="pending" />
        <el-option label="已发布" value="approved" />
        <el-option label="已认领" value="claimed" />
        <el-option label="已关闭" value="closed" />
        <el-option label="全部" value="" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="按标题搜索" clearable style="width: 200px"
        @keyup.enter="fetchList" @clear="fetchList" />
      <el-button type="primary" @click="fetchList">查询</el-button>
    </div>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="标题" min-width="140">
        <template #default="{ row }">
          <el-link type="primary" @click="router.push(`/items/${row.id}`)">{{ row.title }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="row.type === 'lost' ? 'danger' : 'success'">
            {{ row.type === 'lost' ? '失物' : '拾物' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="地点" min-width="100" />
      <el-table-column label="发布人" width="100">
        <template #default="{ row }">{{ row.user?.username }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="itemStatusMap[row.status]?.type">{{ itemStatusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" link type="success" @click="review(row, 'approved')">通过</el-button>
          <el-button v-if="row.status === 'pending'" link type="danger" @click="review(row, 'closed')">驳回</el-button>
          <span v-else style="color:#c0c4cc">已处理</span>
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
