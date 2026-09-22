<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, put, del } from '@/api'
import type { Announcement, PageResult } from '@/types'
import { formatTime } from '@/utils/format'
import type { FormInstance, FormRules } from 'element-plus'

const loading = ref(false)
const list = ref<Announcement[]>([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10 })

async function fetchList() {
  loading.value = true
  try {
    // 管理端使用管理员接口，可看到未发布草稿
    const data = await get<PageResult<Announcement>>('/admin/announcements', { page: query.page, page_size: query.page_size })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ title: '', content: '', published: true })
const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

function openCreate() {
  editingId.value = null
  form.title = ''
  form.content = ''
  form.published = true
  dialogVisible.value = true
}

function openEdit(row: Announcement) {
  editingId.value = row.id
  form.title = row.title
  form.content = row.content
  form.published = row.published
  dialogVisible.value = true
}

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

async function handleDelete(row: Announcement) {
  await ElMessageBox.confirm(`确定删除公告「${row.title}」吗？`, '警告', { type: 'warning' })
  await del(`/admin/announcements/${row.id}`)
  ElMessage.success('删除成功')
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">发布公告</el-button>
    </div>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.published ? 'success' : 'info'">
            {{ row.published ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager" v-if="total > 0">
      <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="query.page_size"
        :current-page="query.page" @current-change="(p: number) => { query.page = p; fetchList() }" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId === null ? '发布公告' : '编辑公告'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="5" />
        </el-form-item>
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
.toolbar { margin-bottom: 14px; }
.pager { display: flex; justify-content: center; padding-top: 16px; }
</style>
