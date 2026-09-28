<!-- ============================================================
ItemReview.vue —— 管理后台·信息审核
============================================================
管理员的日常工作页：看到"待审核"的信息，决定通过还是驳回。
本页能学到 ElMessageBox.prompt（带输入框的确认弹窗）的用法。
============================================================ -->

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, put } from '@/api'
import type { Item, PageResult } from '@/types'
import { formatTime, itemStatusMap } from '@/utils/format'
import { Search, Check, Close } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const list = ref<Item[]>([])
const total = ref(0)
// 默认 status='pending'：管理员打开页面就直接看到"待审核"的
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

// 筛选条件变化时回到第 1 页（防止停在超出范围的页码上）
function search() {
  query.page = 1
  fetchList()
}

// 审核：status 是 'approved'（通过）或 'closed'（驳回）
async function review(row: Item, status: 'approved' | 'closed') {
  const action = status === 'approved' ? '通过' : '驳回（关闭）'
  let remark = ''
  try {
    // prompt：带输入框的确认弹窗，管理员可以顺手写审核备注
    // 解构 { value }：弹窗返回 { value, action }，value 就是管理员输入的文字
    const { value } = await ElMessageBox.prompt(`确定${action}「${row.title}」吗？可填写审核备注`, '信息审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '审核备注（可选）'
    })
    remark = value || ''
  } catch {
    return // 点了"取消"会抛异常，直接结束，不发请求
  }
  // PUT /admin/items/3：告诉后端这条信息的审核结果
  await put(`/admin/items/${row.id}`, { status, remark })
  ElMessage.success(`已${action}`)
  fetchList() // 刷新列表（刚处理完的"待审核"会从列表消失）
}

onMounted(fetchList)
</script>

<template>
  <div class="review">
    <!-- 工具栏：状态筛选 + 标题搜索 + 查询按钮，全部触发 search()（重置页码） -->
    <div class="toolbar">
      <div class="tb-left">
        <el-select v-model="query.status" style="width: 140px" @change="search">
          <el-option label="待审核" value="pending" />
          <el-option label="已发布" value="approved" />
          <el-option label="已认领" value="claimed" />
          <el-option label="已关闭" value="closed" />
          <el-option label="全部" value="" />
        </el-select>
        <el-input v-model="query.keyword" placeholder="按标题搜索" clearable style="width: 210px"
          :prefix-icon="Search" @keyup.enter="search" @clear="search" />
        <el-button type="primary" :icon="Search" @click="search">查询</el-button>
      </div>
      <span class="tb-count">共 {{ total }} 条</span>
    </div>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="标题" min-width="160">
        <template #default="{ row }">
          <!-- 点标题可以去详情页看完整内容再决定 -->
          <el-link type="primary" :underline="false" @click="router.push(`/items/${row.id}`)">
            {{ row.title }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="86">
        <template #default="{ row }">
          <el-tag size="small" effect="light" round :type="row.type === 'lost' ? 'danger' : 'success'">
            {{ row.type === 'lost' ? '失物' : '拾物' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="地点" min-width="110" />
      <el-table-column label="发布人" width="110">
        <template #default="{ row }">{{ row.user?.username }}</template>
      </el-table-column>
      <el-table-column label="状态" width="96">
        <template #default="{ row }">
          <el-tag size="small" effect="light" round :type="itemStatusMap[row.status]?.type">
            {{ itemStatusMap[row.status]?.label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="150">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <!-- link：把按钮变成"文字链接"样式，操作列常用 -->
          <!-- 只有待审核的才显示通过/驳回按钮，其他显示"已处理" -->
          <el-button v-if="row.status === 'pending'" link type="success" :icon="Check" @click="review(row, 'approved')">
            通过
          </el-button>
          <el-button v-if="row.status === 'pending'" link type="danger" :icon="Close" @click="review(row, 'closed')">
            驳回
          </el-button>
          <span v-else class="handled">已处理</span>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="没有符合条件的信息" :image-size="110" />
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
