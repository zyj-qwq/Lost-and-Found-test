<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, put, del } from '@/api'
import type { Item, ItemForm, PageResult } from '@/types'
import { formatTime, itemStatusMap } from '@/utils/format'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const list = ref<Item[]>([])
const total = ref(0)
const query = reactive({ page: 1, page_size: 10, status: '' })

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

async function handleDelete(row: Item) {
  await ElMessageBox.confirm(`确定删除「${row.title}」吗？`, '警告', { type: 'warning' })
  await del(`/items/${row.id}`)
  ElMessage.success('删除成功')
  fetchList()
}

// 编辑
const editVisible = ref(false)
const editRef = ref<FormInstance>()
const editId = ref<number>(0)
const editForm = ref<ItemForm>({
  type: 'lost', title: '', description: '', location: '', lost_at: '', contact: '', images: []
})
const editRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }]
}

function openEdit(row: Item) {
  editId.value = row.id
  editForm.value = {
    type: row.type, title: row.title, description: row.description, location: row.location,
    lost_at: row.lost_at, contact: row.contact, images: [...row.images]
  }
  editVisible.value = true
}

async function submitEdit() {
  await editRef.value?.validate().catch(() => Promise.reject())
  await put(`/items/${editId.value}`, editForm.value)
  ElMessage.success('修改成功，已重新提交审核')
  editVisible.value = false
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="header-bar">
        <h3 style="margin: 0">我的发布</h3>
        <div class="filters">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="fetchList">
            <el-option label="待审核" value="pending" />
            <el-option label="已发布" value="approved" />
            <el-option label="已认领" value="claimed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
          <el-button type="primary" @click="router.push('/publish')">发布新信息</el-button>
        </div>
      </div>
    </template>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="标题" min-width="160">
        <template #default="{ row }">
          <el-link type="primary" @click="router.push(`/items/${row.id}`)">{{ row.title }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.type === 'lost' ? 'danger' : 'success'" size="small">
            {{ row.type === 'lost' ? '失物' : '拾物' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="地点" min-width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="itemStatusMap[row.status]?.type">{{ itemStatusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button v-if="!['claimed', 'closed'].includes(row.status)" link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager" v-if="total > 0">
      <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="query.page_size"
        :current-page="query.page" @current-change="(p: number) => { query.page = p; fetchList() }" />
    </div>
  </el-card>

  <el-dialog v-model="editVisible" title="编辑信息" width="560px">
    <el-form ref="editRef" :model="editForm" :rules="editRules" label-width="80px">
      <el-form-item label="类型">
        <el-radio-group v-model="editForm.type">
          <el-radio value="lost">失物</el-radio>
          <el-radio value="found">拾物</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="标题" prop="title"><el-input v-model="editForm.title" /></el-form-item>
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
</template>

<style scoped>
.header-bar { display: flex; justify-content: space-between; align-items: center; }
.filters { display: flex; gap: 12px; }
.pager { display: flex; justify-content: center; padding-top: 16px; }
</style>
