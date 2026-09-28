<!-- ============================================================
ClaimReview.vue —— 管理后台·认领审核
============================================================
流程：用户在详情页提交认领申请 → 管理员在这里看到 →
判断"证明"是否可信 → 通过（物品变为已认领）/ 驳回。
结构和信息审核页几乎一样，对比着看更容易理解。
============================================================ -->

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, put } from '@/api'
import type { Claim, PageResult } from '@/types'
import { formatTime, claimStatusMap } from '@/utils/format'
import { Search, Check, Close } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const list = ref<Claim[]>([])
const total = ref(0)
// 默认显示"待审核"的申请
const query = reactive({ page: 1, page_size: 10, status: 'pending' })

// 拉取认领申请列表（管理员接口 /admin/claims）
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

// 筛选条件变化时回到第 1 页
function search() {
  query.page = 1
  fetchList()
}

// 审核：status 是 'approved'（通过）或 'rejected'（驳回）
async function review(row: Claim, status: 'approved' | 'rejected') {
  const action = status === 'approved' ? '通过' : '驳回'
  let remark = ''
  try {
    // 弹窗文案里用三元表达式：通过时额外提醒"物品将标记为已认领"
    const { value } = await ElMessageBox.prompt(
      `确定${action}「${row.username}」对物品的认领申请吗？${status === 'approved' ? '通过后该物品将标记为已认领。' : ''}`,
      '认领审核',
      { confirmButtonText: '确定', cancelButtonText: '取消', inputPlaceholder: '审核备注（可选）' }
    )
    remark = value || ''
  } catch {
    return // 点"取消"则不发请求
  }
  await put(`/admin/claims/${row.id}`, { status, remark })
  ElMessage.success(`已${action}`)
  fetchList()
  // 注意：后端在"通过"时会自动把对应物品标记为 claimed，
  // 并把同一物品的其他待审核申请自动驳回（见后端 index.js）
}

onMounted(fetchList)
</script>

<template>
  <div class="review">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="tb-left">
        <el-select v-model="query.status" style="width: 140px" @change="search">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="全部" value="" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="search">查询</el-button>
      </div>
      <span class="tb-count">共 {{ total }} 条</span>
    </div>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="物品" min-width="140">
        <template #default="{ row }">
          <el-link v-if="row.item" type="primary" :underline="false" @click="router.push(`/items/${row.item.id}`)">
            {{ row.item.title }}
          </el-link>
          <el-tag v-else size="small" type="info" effect="plain">已删除</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="申请人" width="110" />
      <!-- 认领证明是审核的关键依据，给最宽的列 -->
      <el-table-column prop="proof" label="认领证明" min-width="220" show-overflow-tooltip />
      <el-table-column prop="contact" label="联系方式" width="130" />
      <el-table-column label="状态" width="96">
        <template #default="{ row }">
          <el-tag size="small" effect="light" round :type="claimStatusMap[row.status]?.type">
            {{ claimStatusMap[row.status]?.label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <!-- 已处理过的申请不再显示按钮，改成显示当时的备注 -->
          <template v-if="row.status === 'pending'">
            <el-button link type="success" :icon="Check" @click="review(row, 'approved')">通过</el-button>
            <el-button link type="danger" :icon="Close" @click="review(row, 'rejected')">驳回</el-button>
          </template>
          <span v-else class="handled">{{ row.remark || '已处理' }}</span>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="没有符合条件的认领申请" :image-size="110" />
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
.handled {
  color: var(--text-4);
  font-size: 13px;
}
</style>
