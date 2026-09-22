<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { get, post, put, del } from '@/api'
import { useAuthStore } from '@/stores/auth'
import type { Item, ItemForm } from '@/types'
import { formatTime, itemStatusMap } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const item = ref<Item | null>(null)
const loading = ref(false)

const isOwner = computed(() => item.value && auth.user && item.value.user?.id === auth.user.uid)

async function fetchItem() {
  loading.value = true
  try {
    item.value = await get<Item>(`/items/${route.params.id}`)
  } finally {
    loading.value = false
  }
}

// ---- 认领申请 ----
const claimVisible = ref(false)
const claimForm = ref({ proof: '', contact: '' })
const claimSubmitting = ref(false)

function openClaim() {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  claimForm.value = { proof: '', contact: auth.user?.username ? '' : '' }
  claimVisible.value = true
}

async function submitClaim() {
  if (!claimForm.value.proof.trim() || !claimForm.value.contact.trim()) {
    ElMessage.warning('请填写认领证明和联系方式')
    return
  }
  claimSubmitting.value = true
  try {
    await post(`/items/${item.value!.id}/claims`, claimForm.value)
    ElMessage.success('认领申请已提交，请等待管理员审核')
    claimVisible.value = false
  } finally {
    claimSubmitting.value = false
  }
}

// ---- 编辑 ----
const editVisible = ref(false)
const editRef = ref<FormInstance>()
const editForm = ref<ItemForm>({
  type: 'lost', title: '', description: '', location: '', lost_at: '', contact: '', images: []
})
const editRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }]
}

function openEdit() {
  if (!item.value) return
  editForm.value = {
    type: item.value.type,
    title: item.value.title,
    description: item.value.description,
    location: item.value.location,
    lost_at: item.value.lost_at,
    contact: item.value.contact,
    images: [...item.value.images]
  }
  editVisible.value = true
}

async function submitEdit() {
  await editRef.value?.validate().catch(() => Promise.reject())
  await put(`/items/${item.value!.id}`, editForm.value)
  ElMessage.success('修改成功，已重新提交审核')
  editVisible.value = false
  fetchItem()
}

async function handleDelete() {
  await ElMessageBox.confirm('确定删除这条信息吗？删除后不可恢复。', '警告', { type: 'warning' })
  await del(`/items/${item.value!.id}`)
  ElMessage.success('删除成功')
  router.push('/')
}

onMounted(fetchItem)
</script>

<template>
  <div v-loading="loading" class="detail">
    <el-page-header content="信息详情" class="page-header" @back="router.back()" />
    <el-card v-if="item" shadow="never">
      <div class="detail-header">
        <div>
          <el-tag :type="item.type === 'lost' ? 'danger' : 'success'" effect="dark" size="large">
            {{ item.type === 'lost' ? '失物' : '拾物' }}
          </el-tag>
          <span class="title">{{ item.title }}</span>
        </div>
        <el-tag :type="itemStatusMap[item.status]?.type">{{ itemStatusMap[item.status]?.label }}</el-tag>
      </div>

      <el-descriptions :column="2" border class="desc">
        <el-descriptions-item label="地点">{{ item.location }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatTime(item.lost_at) }}</el-descriptions-item>
        <el-descriptions-item label="发布人">{{ item.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="联系方式">{{ item.contact }}</el-descriptions-item>
        <el-descriptions-item label="发布时间" :span="2">{{ formatTime(item.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ item.description }}</el-descriptions-item>
        <el-descriptions-item v-if="item.remark" label="审核备注" :span="2">{{ item.remark }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="item.images && item.images.length" class="images">
        <el-image v-for="(img, i) in item.images" :key="i" :src="img" :preview-src-list="item.images"
          :initial-index="i" fit="cover" class="image" preview-teleported />
      </div>

      <div class="actions">
        <el-button v-if="item.status === 'approved' && !isOwner" type="primary" @click="openClaim">
          这是我的，申请认领
        </el-button>
        <el-alert v-else-if="item.status === 'pending'" type="info" :closable="false"
          title="该信息正在等待管理员审核，审核通过后可申请认领" />
        <el-alert v-else-if="item.status === 'claimed'" type="success" :closable="false" title="该物品已完成认领" />
        <template v-if="isOwner">
          <el-button v-if="!['claimed', 'closed'].includes(item.status)" @click="openEdit">编辑</el-button>
          <el-button type="danger" plain @click="handleDelete">删除</el-button>
        </template>
      </div>
    </el-card>

    <!-- 认领申请对话框 -->
    <el-dialog v-model="claimVisible" title="提交认领申请" width="480px">
      <el-form label-width="80px">
        <el-form-item label="认领证明" required>
          <el-input v-model="claimForm.proof" type="textarea" :rows="4"
            placeholder="请描述物品特征以证明归属，如：钱包内有我的学生卡，学号是 xxx" />
        </el-form-item>
        <el-form-item label="联系方式" required>
          <el-input v-model="claimForm.contact" placeholder="手机号 / 微信等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="claimVisible = false">取消</el-button>
        <el-button type="primary" :loading="claimSubmitting" @click="submitClaim">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editVisible" title="编辑信息" width="560px">
      <el-form ref="editRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="editForm.type">
            <el-radio value="lost">失物</el-radio>
            <el-radio value="found">拾物</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="editForm.location" />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker v-model="editForm.lost_at" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="editForm.contact" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detail { max-width: 860px; margin: 0 auto; }
.page-header { margin-bottom: 16px; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.title { font-size: 22px; font-weight: 700; margin-left: 12px; }
.desc { margin-bottom: 16px; }
.images { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.image { width: 160px; height: 120px; border-radius: 6px; }
.actions { display: flex; gap: 12px; align-items: center; }
</style>
