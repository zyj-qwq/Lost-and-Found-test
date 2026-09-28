<!-- ============================================================
AnnouncementManage.vue —— 管理后台·公告管理（仅系统管理员可见）
============================================================
一个页面同时实现"增删改查"四个操作，是最经典的 CRUD 页面：
  查：fetchList 拉列表
  增：openCreate → 弹空表单 → submit 发 POST
  改：openEdit → 弹窗回填数据 → submit 发 PUT（共用同一个弹窗！）
  删：handleDelete 确认后发 DELETE
"编辑Id 是否为 null"用来区分这次弹窗是新增还是编辑。
============================================================ -->

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, put, del } from '@/api'
import type { Announcement, PageResult } from '@/types'
import { formatTime } from '@/utils/format'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const list = ref<Announcement[]>([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10 })

// 拉取公告列表（管理端接口能同时看到"已发布"和"草稿"，
// 而首页公开接口只显示已发布的）
async function fetchList() {
  loading.value = true
  try {
    const data = await get<PageResult<Announcement>>('/admin/announcements', { page: query.page, page_size: query.page_size })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

// ---- 弹窗与表单 ----
const dialogVisible = ref(false)
// null=当前是"新增"模式；有数字=当前是"编辑"模式（编辑第几条）
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ title: '', content: '', published: true })
const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 点"发布公告"：清空表单，进入新增模式
function openCreate() {
  editingId.value = null
  form.title = ''
  form.content = ''
  form.published = true
  dialogVisible.value = true
}

// 点"编辑"：把该行数据填进表单，进入编辑模式
function openEdit(row: Announcement) {
  editingId.value = row.id
  form.title = row.title
  form.content = row.content
  form.published = row.published
  dialogVisible.value = true
}

// 弹窗点"确定"：根据模式决定发 POST（新建）还是 PUT（更新）
async function submit() {
  await formRef.value?.validate().catch(() => Promise.reject())
  if (editingId.value === null) {
    await post('/admin/announcements', { ...form })
    ElMessage.success('公告已发布')
  } else {
    await put(`/admin/announcements/${editingId.value}`, { ...form })
    ElMessage.success('公告已更新')
  }
  dialogVisible.value = false
  fetchList()
}

// 删除公告
async function handleDelete(row: Announcement) {
  await ElMessageBox.confirm(`确定删除公告「${row.title}」吗？`, '警告', { type: 'warning' })
  await del(`/admin/announcements/${row.id}`)
  ElMessage.success('删除成功')
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div class="review">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreate">发布公告</el-button>
      <span class="tb-count">共 {{ total }} 条公告</span>
    </div>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="content" label="内容" min-width="260" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <!-- 三元表达式：true 显示"已发布"（绿），false 显示"草稿"（灰） -->
          <el-tag size="small" effect="light" round :type="row.published ? 'success' : 'info'">
            {{ row.published ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="还没有发布过公告" :image-size="110" />
      </template>
    </el-table>

    <div class="pf-pager" v-if="total > query.page_size">
      <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="query.page_size"
        :current-page="query.page" @current-change="(p: number) => { query.page = p; fetchList() }" />
    </div>

    <!-- 弹窗标题也是动态的：:title 绑定三元表达式 -->
    <el-dialog v-model="dialogVisible" :title="editingId === null ? '发布公告' : '编辑公告'" width="580px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" maxlength="60" show-word-limit /></el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
        <!-- 开关：true=立即发布公开可见，false=存为草稿只有管理员可见 -->
        <el-form-item label="发布">
          <el-switch v-model="form.published" active-text="立即发布" inactive-text="存为草稿" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.tb-count {
  font-size: 13px;
  color: var(--text-4);
}
</style>
