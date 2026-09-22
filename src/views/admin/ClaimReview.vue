<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, put } from '@/api'
import type { Claim, PageResult } from '@/types'
import { formatTime, claimStatusMap } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const list = ref<Claim[]>([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10, status: 'pending' })

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: query.page, page_size: query.page_size }
    if (query.status) params.status = query.status
    const data = await get<PageResult<Claim>>('/admin/claims', params)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function review(row: Claim, status: 'approved' | 'rejected') {
  const action = status === 'approved' ? '通过' : '驳回'
  let remark = ''
  try {
    const { value } = await ElMessageBox.prompt(
      `确定${action}「${row.username}」对物品的认领申请吗？${status === 'approved' ? '通过后该物品将标记为已认领。' : ''}`,
      '认领审核',
      { confirmButtonText: '确定', cancelButtonText: '取消', inputPlaceholder: '审核备注（可选）' }
    )
    remark = value || ''
  } catch {
    return
  }
  await put(`/admin/claims/${row.id}`, { status, remark })
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
        <el-option label="已通过" value="approved" />
        <el-option label="已驳回" value="rejected" />
        <el-option label="全部" value="" />
      </el-select>
      <el-button type="primary" @click="fetchList">查询</el-button>
    </div>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="物品" min-width="130">
        <template #default="{ row }">
          <el-link v-if="row.item" type="primary" @click="router.push(`/items/${row.item.id}`)">
            {{ row.item.title }}
          </el-link>
          <span v-else>已删除</span>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="申请人" width="110" />
      <el-table-column prop="proof" label="认领证明" min-width="200" show-overflow-tooltip />
      <el-table-column prop="contact" label="联系方式" width="130" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="claimStatusMap[row.status]?.type">{{ claimStatusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button link type="success" @click="review(row, 'approved')">通过</el-button>
            <el-button link type="danger" @click="review(row, 'rejected')">驳回</el-button>
          </template>
          <span v-else style="color:#c0c4cc">{{ row.remark || '已处理' }}</span>
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
