<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadProps } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { post } from '@/api'
import type { ItemType } from '@/types'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
  type: 'lost' as ItemType,
  title: '',
  description: '',
  location: '',
  lost_at: '',
  contact: '',
  images: [] as string[]
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }]
}

const uploadHeaders = { Authorization: `Bearer ${auth.token}` }

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    ElMessage.error('只允许 jpg/png/webp 图片')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('单张图片最大 5MB')
    return false
  }
  return true
}

const handleSuccess: UploadProps['onSuccess'] = (response) => {
  if (response.code === 0) {
    form.images.push(response.data.url)
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

const handleRemove: UploadProps['onRemove'] = (file) => {
  const url = (file.response as any)?.data?.url
  if (url) form.images = form.images.filter((u) => u !== url)
}

async function submit() {
  await formRef.value?.validate().catch(() => Promise.reject())
  submitting.value = true
  try {
    await post('/items', { ...form, lost_at: form.lost_at || new Date().toISOString() })
    ElMessage.success('发布成功，等待管理员审核通过后将公开展示')
    router.push('/my/items')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="publish">
    <el-card shadow="never">
      <template #header><h3 style="margin: 0">发布失物 / 拾物信息</h3></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 640px">
        <el-form-item label="信息类型">
          <el-radio-group v-model="form.type">
            <el-radio-button value="lost">我丢了东西（失物）</el-radio-button>
            <el-radio-button value="found">我捡到东西（拾物）</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="50" show-word-limit placeholder="如：黑色钱包" />
        </el-form-item>
        <el-form-item label="详细描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4"
            placeholder="物品特征、颜色、内容物等（注意不要泄露敏感信息）" />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="如：图书馆三楼" />
        </el-form-item>
        <el-form-item label="发生时间">
          <el-date-picker v-model="form.lost_at" type="datetime" placeholder="选择时间（可不填，默认现在）"
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="form.contact" placeholder="手机号 / 微信 / QQ" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload action="/api/v1/upload" :headers="uploadHeaders" name="file" list-type="picture-card"
            :before-upload="beforeUpload" :on-success="handleSuccess" :on-remove="handleRemove"
            accept=".jpg,.jpeg,.png,.webp" multiple :limit="6">
            <el-icon style="font-size: 24px; color: #8c939d">+</el-icon>
            <template #tip>
              <div class="el-upload__tip">最多 6 张，支持 jpg/png/webp，单张不超过 5MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="submit">提交发布</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.publish { max-width: 860px; margin: 0 auto; }
</style>
