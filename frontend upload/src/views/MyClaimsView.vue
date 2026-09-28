<!-- ============================================================
MyClaimsView.vue —— 我的认领申请（最简单的"查询页"模板）
============================================================
页面套路：打开 → onMounted 发请求 → 存到 list → 表格渲染。
比"我的发布"更简单，没有任何操作按钮，适合作为看懂表格页的第一站。

【本次改版说明】
  和"我的发布"保持同一套视觉语言：页头 + 状态快捷筛选 + 表格卡片。
  另外把"认领证明"和"审核结果"的呈现做得更清楚，
  因为这两列才是用户真正关心的内容。
============================================================ -->

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/api'
import type { Claim, PageResult } from '@/types'
import { formatTime, claimStatusMap } from '@/utils/format'
import { Files, Clock, Check, CircleClose } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const list = ref<Claim[]>([]) // 我提交的认领申请列表
const total = ref(0)
const query = reactive({ page: 1, page_size: 10, status: '' })

const PAGE_SIZE = 10

// 拉取"我提交的"申请（接口 /me/claims，后端按 token 识别身份）
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

// 状态快捷筛选（和"我的发布"同一套交互）
const statusTabs = [
  { value: '', label: '全部', icon: Files, tone: 'blue' },
  { value: 'pending', label: '待审核', icon: Clock, tone: 'amber' },
  { value: 'approved', label: '已通过', icon: Check, tone: 'green' },
  { value: 'rejected', label: '已驳回', icon: CircleClose, tone: 'gray' }
]

function pickStatus(v: string) {
  query.status = v
  search()
}

// 状态筛选变化时回到第 1 页
function search() {
  query.page = 1
  fetchList()
}

const currentStatusLabel = computed(
  () => statusTabs.find((t) => t.value === query.status)?.label || '全部'
)

onMounted(fetchList)
</script>

<template>
  <div class="my-claims pf-rise">
    <!-- 页头 -->
    <header class="page-head">
      <h1 class="pf-page-title">我的认领申请</h1>
      <p class="head-sub">这里记录了你提交过的全部认领申请。审核结果和备注会实时同步过来。</p>
    </header>

    <!-- 状态快捷筛选 -->
    <div class="status-bar">
      <button
        v-for="t in statusTabs"
        :key="t.value"
        class="status-chip"
        :class="[`tone-${t.tone}`, { on: query.status === t.value }]"
        @click="pickStatus(t.value)"
      >
        <el-icon><component :is="t.icon" /></el-icon>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <div class="card-head">
        <h3>申请列表 <em>· {{ currentStatusLabel }}</em></h3>
        <span class="count">共 {{ total }} 条</span>
      </div>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="物品" min-width="150">
          <template #default="{ row }">
            <!-- row.item 可能是 null（原信息被删了），所以要 v-if 判断后才能用 row.item.id -->
            <el-link v-if="row.item" type="primary" :underline="false" @click="router.push(`/items/${row.item.id}`)">
              {{ row.item.title }}
            </el-link>
            <el-tag v-else size="small" type="info" effect="plain">已删除</el-tag>
          </template>
        </el-table-column>
        <!-- show-overflow-tooltip：内容太长时省略号显示，鼠标悬停看全文 -->
        <el-table-column prop="proof" label="认领证明" min-width="220" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系方式" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="light" round :type="claimStatusMap[row.status]?.type">
              {{ claimStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="150" show-overflow-tooltip>
          <!-- 没有备注时显示 '-'（|| 的短路用法：左边为空就取右边） -->
          <template #default="{ row }">
            <span :class="{ muted: !row.remark }">{{ row.remark || '暂无备注' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>

        <template #empty>
          <el-empty description="还没有提交过认领申请" :image-size="110" />
        </template>
      </el-table>

      <div class="pf-pager" v-if="total > PAGE_SIZE">
        <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="PAGE_SIZE"
          :current-page="query.page" @current-change="(p: number) => { query.page = p; fetchList() }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 18px;
}
.head-sub {
  margin: 8px 0 0;
  font-size: 13.5px;
  color: var(--text-3);
  line-height: 1.7;
  max-width: 640px;
}

/* ---------------- 状态快捷筛选（与 MyItemsView 一致） ---------------- */
.status-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-base);
  background: #fff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  box-shadow: var(--shadow-xs);
}
.status-chip:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: var(--brand-200);
  color: var(--brand-600);
}
.status-chip.on {
  color: #fff;
  border-color: transparent;
}
.status-chip.on.tone-blue {
  background: var(--grad-brand);
  box-shadow: var(--shadow-brand);
}
.status-chip.on.tone-amber {
  background: linear-gradient(135deg, #f5a524, #e08a0c);
  box-shadow: 0 6px 18px rgba(245, 165, 36, 0.3);
}
.status-chip.on.tone-green {
  background: linear-gradient(135deg, #12b886, #0a9668);
  box-shadow: 0 6px 18px rgba(18, 184, 134, 0.3);
}
.status-chip.on.tone-gray {
  background: linear-gradient(135deg, #6b7688, #4d5666);
  box-shadow: 0 6px 18px rgba(107, 118, 136, 0.3);
}

/* ---------------- 表格卡片 ---------------- */
.table-card {
  background: #fff;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 18px 20px 20px;
}
.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-head h3 {
  font-size: 15.5px;
  font-weight: 700;
  margin: 0;
}
.card-head h3 em {
  font-style: normal;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-4);
}
.count {
  font-size: 13px;
  color: var(--text-4);
}
.muted {
  color: var(--text-4);
}

@media (max-width: 640px) {
  .table-card {
    padding: 14px 12px 16px;
  }
  .status-chip {
    padding: 7px 12px;
    font-size: 12.5px;
  }
}
</style>
