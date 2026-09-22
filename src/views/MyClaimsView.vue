<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/api'
import type { Claim, PageResult } from '@/types'
import { formatTime, claimStatusMap } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const list = ref<Claim[]>([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10, status: '' })

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: query.page, page_size: query.page_size }
    if (query.status) params.status = query.status
    const data = await get<PageResult<Claim>>('/me/claims', params)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="header-bar">
        <h3 style="margin: 0">我的认领申请</h3>
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="fetchList">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
      </div>
    </template>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="物品" min-width="140">
        <template #default="{ row }">
          <el-link v-if="row.item" type="primary" @click="router.push(`/items/${row.item.id}`)">
            {{ row.item.title }}
          </el-link>
          <span v-else>已删除</span>
        </template>
      </el-table-column>
      <el-table-column prop="proof" label="认领证明" min-width="200" show-overflow-tooltip />
      <el-table-column prop="contact" label="联系方式" width="140" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="claimStatusMap[row.status]?.type">{{ claimStatusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="审核备注" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.remark || '-' }}</template>
      </el-table-column>
      <el-table-column label="申请时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
    </el-table>
    <div class="pager" v-if="total > 0">
      <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="query.page_size"
        :current-page="query.page" @current-change="(p: number) => { query.page = p; fetchList() }" />
    </div>
  </el-card>
</template>

<style scoped>
.header-bar { display: flex; justify-content: space-between; align-items: center; }
.pager { display: flex; justify-content: center; padding-top: 16px; }
</style>
