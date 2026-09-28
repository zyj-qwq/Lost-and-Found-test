<!-- ============================================================
MyItemsView.vue —— 我的发布（表格 + 编辑 + 删除）
============================================================
本页能学到：
  1. el-table 表格的用法：:data 传数组，列自动循环生成。
  2. 插槽 #default="{ row }"：自定义某一列怎么显示，row 是当前行数据。
  3. "表格里点编辑 → 弹窗 → 保存 → 刷新表格" 的完整闭环。

【本次改版说明】
  加了"只属于自己"的页面头部：标题 + 一句说明 + 快捷按钮。
  表格上方加了一排状态统计小卡片，点一下就按该状态筛选，
  比只有一个下拉框更好用、也更直观。
============================================================ -->

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Files, Clock, Check, CircleClose } from '@element-plus/icons-vue'
import { get, put, del } from '@/api'
import type { Item, ItemForm, PageResult } from '@/types'
import { formatTime, itemStatusMap } from '@/utils/format'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const list = ref<Item[]>([])  // 我发布的信息列表
const total = ref(0)
// 查询条件：status='' 表示全部状态
const query = reactive({ page: 1, page_size: 10, status: '' })

const PAGE_SIZE = 10

// 从后端拉"我发布的"信息（接口是 /me/items，后端会根据 token 自动识别"我"是谁）
async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: query.page, page_size: query.page_size }
    if (query.status) params.status = query.status
    const data = await get<PageResult<Item>>('/me/items', params)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

// 状态筛选的"快捷入口"配置。
// 点其中一张卡片就等于把 query.status 设成对应值再查询
const statusTabs = [
  { value: '', label: '全部', icon: Files, tone: 'blue' },
  { value: 'pending', label: '待审核', icon: Clock, tone: 'amber' },
  { value: 'approved', label: '已发布', icon: Check, tone: 'green' },
  { value: 'claimed', label: '已认领', icon: Check, tone: 'purple' },
  { value: 'closed', label: '已关闭', icon: CircleClose, tone: 'gray' }
]

// 点状态卡片切换筛选
function pickStatus(v: string) {
  query.status = v
  search()
}

// 筛选条件变化时回到第 1 页再查（不重置的话可能停在一个空页上）
function search() {
  query.page = 1
  fetchList()
}

// 当前筛选状态对应的中文名（显示在表格标题里）
const currentStatusLabel = computed(
  () => statusTabs.find((t) => t.value === query.status)?.label || '全部'
)

// 删除某一行
async function handleDelete(row: Item) {
  // 模板字符串把标题带进确认文案；点"取消"会抛异常，后面不执行
  await ElMessageBox.confirm(`确定删除「${row.title}」吗？删除后不可恢复。`, '警告', { type: 'warning' })
  await del(`/items/${row.id}`)
  ElMessage.success('删除成功')
  fetchList() // 刷新列表
}

// ================= 编辑部分 =================
const editVisible = ref(false)
const editRef = ref<FormInstance>()
const editId = ref<number>(0) // 记录"正在编辑哪一条"的 id
const editForm = ref<ItemForm>({
  type: 'lost', title: '', description: '', location: '', lost_at: '', contact: '', images: []
})
const editRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }]
}

// 点"编辑"：把该行数据复制进表单再弹窗
function openEdit(row: Item) {
  editId.value = row.id
  editForm.value = {
    type: row.type, title: row.title, description: row.description, location: row.location,
    lost_at: row.lost_at, contact: row.contact, images: [...row.images]
  }
  editVisible.value = true
}

// 弹窗里点"保存"
async function submitEdit() {
  await editRef.value?.validate().catch(() => Promise.reject())
  await put(`/items/${editId.value}`, editForm.value)
  ElMessage.success('修改成功，已重新提交审核')
  editVisible.value = false
  fetchList()
}

// 页面打开先加载一次
onMounted(fetchList)
</script>

<template>
  <div class="my-items pf-rise">
    <!-- 页头 -->
    <header class="page-head">
      <div>
        <h1 class="pf-page-title">我的发布</h1>
        <p class="head-sub">这里是你发布过的全部信息。修改后需要重新审核，已认领或已关闭的信息无法再编辑。</p>
      </div>
      <el-button type="primary" :icon="Plus" round size="large" @click="router.push('/publish')">
        发布新信息
      </el-button>
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
        <h3>信息列表 <em>· {{ currentStatusLabel }}</em></h3>
        <span class="count">共 {{ total }} 条</span>
      </div>

      <!-- el-table：把 list 数组渲染成表格；stripe=斑马纹 -->
      <el-table v-loading="loading" :data="list" stripe>
        <!-- label=列标题；width/min-width=列宽 -->
        <el-table-column label="标题" min-width="180">
          <!-- #default 是"单元格插槽"：这列不直接显示文字，而是自定义内容。
               { row } 是解构写法，等于 (slotProps) => slotProps.row -->
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="router.push(`/items/${row.id}`)">
              {{ row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="86">
          <template #default="{ row }">
            <el-tag :type="row.type === 'lost' ? 'danger' : 'success'" size="small" effect="light" round>
              {{ row.type === 'lost' ? '失物' : '拾物' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- prop="location"：不用插槽的简单写法，直接显示 row.location -->
        <el-table-column prop="location" label="地点" min-width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="light" round :type="itemStatusMap[row.status]?.type">
              {{ itemStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <!-- fixed="right"：横向滚动时这一列固定在右侧 -->
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <!-- 已认领/已关闭的不允许编辑（数组.includes 判断） -->
            <el-button v-if="!['claimed', 'closed'].includes(row.status)" link type="primary" :icon="Edit"
              @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>

        <!-- 表格为空时，用插槽显示更友好的提示 -->
        <template #empty>
          <el-empty description="还没有发布过信息" :image-size="110" />
        </template>
      </el-table>

      <div class="pf-pager" v-if="total > PAGE_SIZE">
        <!-- 翻页：@current-change 拿到新页码 p，改 query.page 后重新查询 -->
        <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="PAGE_SIZE"
          :current-page="query.page" @current-change="(p: number) => { query.page = p; fetchList() }" />
      </div>
    </div>

    <!-- 编辑弹窗。append-to-body：把弹窗挂到 <body> 下，
         避免被页面元素的 transform 影响（否则遮罩铺不满全屏、弹窗被裁剪） -->
    <el-dialog v-model="editVisible" title="编辑信息" width="580px" append-to-body>
      <el-alert type="info" :closable="false" show-icon
        title="保存后会重新进入待审核状态，审核通过前不会公开展示" class="edit-tip" />
      <el-form ref="editRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="editForm.type">
            <el-radio-button value="lost">失物</el-radio-button>
            <el-radio-button value="found">拾物</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title"><el-input v-model="editForm.title" maxlength="50" /></el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="地点" prop="location"><el-input v-model="editForm.location" /></el-form-item>
        <el-form-item label="联系方式" prop="contact"><el-input v-model="editForm.contact" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ---------------- 页头 ---------------- */
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.head-sub {
  margin: 8px 0 0;
  font-size: 13.5px;
  color: var(--text-3);
  line-height: 1.7;
  max-width: 640px;
}

/* ---------------- 状态快捷筛选 ---------------- */
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
/* 每种的选中态用不同色调，和状态标签的颜色语义保持一致 */
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
.status-chip.on.tone-purple {
  background: linear-gradient(135deg, #7c5cff, #5b3fd6);
  box-shadow: 0 6px 18px rgba(124, 92, 255, 0.3);
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

.edit-tip {
  margin-bottom: 16px;
  border-radius: var(--radius-md);
}

/* 小屏适配 */
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
