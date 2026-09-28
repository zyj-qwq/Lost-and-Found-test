<!-- ============================================================
PublishView.vue —— 发布失物/拾物信息
============================================================
本页能学到：
  1. 一个完整的"表单提交"流程：校验 → 发请求 → 提示 → 跳转。
  2. 文件上传（el-upload）的原理：选文件 → 前端先检查格式大小 →
     上传到后端 → 后端返回图片网址 → 把网址存进表单。

【本次改版说明】
  原来是一张卡片里塞一个窄表单，右边一大片空白。
  现在改成"左侧表单 + 右侧实时预览"的两栏：
    右栏会随你填的内容实时变化（用 computed 算出来），
    让你在点提交前就能看到"这条信息发出去长什么样"。
  另外把"失物/拾物"的选择从按钮组改成两张大卡片，
  更好点，也更直观。
============================================================ -->

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadProps, FormInstance, FormRules } from 'element-plus'
import { Plus, Location, Clock, Phone, Document, Picture, Warning } from '@element-plus/icons-vue'
import { post } from '@/api'
import type { ItemType } from '@/types'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const submitting = ref(false) // 防止连点提交按钮

// 表单数据。'as ItemType' 是 TS 写法：告诉编译器这个字符串按 ItemType 类型对待
const form = reactive({
  type: 'lost' as ItemType,  // 默认"失物"
  title: '',
  description: '',
  location: '',
  lost_at: '',               // 可不填，提交时默认当前时间
  contact: auth.user?.contact || '',  // 自动填入注册时保存的联系方式，可手动改
  images: [] as string[]     // 存上传成功后拿到的图片"网址"，不是图片本身！
})

// 必填项校验规则
const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }]
}

// 类型选择的"配置"：把图标、文案、颜色都写在一起，方便循环渲染
const typeCards = [
  {
    value: 'lost' as ItemType,
    title: '我丢了东西',
    sub: '发布失物信息，让捡到的人联系你',
    theme: 'lost'
  },
  {
    value: 'found' as ItemType,
    title: '我捡到东西',
    sub: '发布拾物信息，帮失主找到它',
    theme: 'found'
  }
]

// 右栏预览用：把表单内容换算成"卡片上会显示什么"
// computed 会在 form 任何字段变化时自动重算
const preview = computed(() => ({
  title: form.title || '（还没填标题）',
  location: form.location || '未填写地点',
  description: form.description || '还没有填写描述，补充一些物品特征会更容易被找到。',
  contact: form.contact || '未填写',
  cover: form.images[0] || '',
  imageCount: form.images.length,
  typeLabel: form.type === 'lost' ? '失物' : '拾物'
}))

// 上传请求头：上传接口需要登录，所以要手动带上 token
// （el-upload 是自己发请求的，不走我们封装的 axios，所以要单独加）
const uploadHeaders = { Authorization: `Bearer ${auth.token}` }

// 上传"之前"的检查：格式不对或超过 5MB 就拒绝（return false 取消上传）
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    ElMessage.error('只允许 jpg/png/webp 图片')
    return false
  }
  // 文件大小的单位是字节：5MB = 5 * 1024 * 1024 字节
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('单张图片最大 5MB')
    return false
  }
  return true // 检查通过，继续上传
}

// 上传"成功后"：后端返回 { code:0, data:{ url } }，把网址记进表单
const handleSuccess: UploadProps['onSuccess'] = (response) => {
  if (response.code === 0) {
    form.images.push(response.data.url) // 关键一步：表单里只存网址
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

// 删除已上传的图片：把网址从表单数组里移除（filter 生成不含该网址的新数组）
const handleRemove: UploadProps['onRemove'] = (file) => {
  const url = (file.response as any)?.data?.url
  if (url) form.images = form.images.filter((u) => u !== url)
}

// 提交发布
async function submit() {
  await formRef.value?.validate().catch(() => Promise.reject()) // 校验不通过就中断
  submitting.value = true
  try {
    // lost_at 没填就默认当前时间；...form 是把表单展开合并
    await post('/items', { ...form, lost_at: form.lost_at || new Date().toISOString() })
    ElMessage.success('发布成功，等待管理员审核通过后将公开展示')
    router.push('/my/items') // 跳到"我的发布"查看
  } finally {
    submitting.value = false
  }
}

// 重置表单
function reset() {
  formRef.value?.resetFields()
  form.title = ''
  form.description = ''
  form.location = ''
  form.lost_at = ''
  form.contact = ''
  form.images = []
  form.type = 'lost'
}
</script>

<template>
  <div class="publish pf-rise">
    <!-- 页头 -->
    <header class="page-head">
      <div>
        <h1 class="pf-page-title">发布失物 / 拾物信息</h1>
        <p class="head-sub">填写得越详细，被认出来的概率越高。提交后会由管理员审核，通过后公开展示。</p>
      </div>
    </header>

    <div class="publish-grid">
      <!-- ============ 左栏：表单 ============ -->
      <div class="form-panel">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">

          <!-- 选择类型：两张大卡片 -->
          <el-form-item label="信息类型" class="type-item">
            <div class="type-cards">
              <button
                v-for="t in typeCards"
                :key="t.value"
                type="button"
                class="type-card"
                :class="[`theme-${t.theme}`, { on: form.type === t.value }]"
                @click="form.type = t.value"
              >
                <span class="tc-check">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8.5 L6.5 11.5 L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <b>{{ t.title }}</b>
                <i>{{ t.sub }}</i>
              </button>
            </div>
          </el-form-item>

          <!-- show-word-limit：显示"3/50"字数统计 -->
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" maxlength="50" show-word-limit :prefix-icon="Document" placeholder="如：黑色钱包 / 一把钥匙" />
          </el-form-item>

          <el-form-item label="详细描述" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="4"
              placeholder="物品特征、颜色、内容物等（注意不要泄露敏感信息）" />
          </el-form-item>

          <div class="two-col">
            <el-form-item label="地点" prop="location">
              <el-input v-model="form.location" :prefix-icon="Location" placeholder="如：图书馆三楼" />
            </el-form-item>
            <el-form-item label="发生时间">
              <el-date-picker v-model="form.lost_at" type="datetime" placeholder="可不填，默认现在"
                style="width: 100%" :prefix-icon="Clock" />
            </el-form-item>
          </div>

          <el-form-item label="联系方式" prop="contact">
            <el-input v-model="form.contact" :prefix-icon="Phone" placeholder="手机号 / 微信 / QQ" />
          </el-form-item>

          <!-- 文件上传组件：
               action=上传到哪个接口；name=后端收文件的字段名；
               list-type=picture-card 显示成"照片墙"；
               :limit=6 最多 6 张 -->
          <el-form-item label="图片（选填，最多 6 张）">
            <el-upload action="/api/v1/upload" :headers="uploadHeaders" name="file" list-type="picture-card"
              :before-upload="beforeUpload" :on-success="handleSuccess" :on-remove="handleRemove"
              accept=".jpg,.jpeg,.png,.webp" multiple :limit="6" class="uploader">
              <!-- 这里是"上传按钮"格子里的内容 -->
              <el-icon class="upload-plus"><Plus /></el-icon>
              <!-- #tip：上传区域下方的灰色提示文字 -->
              <template #tip>
                <div class="upload-tip">
                  <el-icon><Picture /></el-icon>
                  支持 jpg / png / webp，单张不超过 5MB
                </div>
              </template>
            </el-upload>
          </el-form-item>

          <!-- 提交按钮区 -->
          <div class="form-actions">
            <el-button type="primary" size="large" :loading="submitting" @click="submit">
              提交发布
            </el-button>
            <el-button size="large" @click="reset">清空重填</el-button>
          </div>
        </el-form>
      </div>

      <!-- ============ 右栏：实时预览 ============ -->
      <aside class="preview-panel">
        <div class="preview-head">
          <span>实时预览</span>
          <em>别人看到的样子</em>
        </div>

        <!-- 预览卡片：样式和首页的信息卡一致，所见即所得 -->
        <article class="preview-card">
          <div class="pv-media">
            <img v-if="preview.cover" :src="preview.cover" alt="" />
            <div v-else class="pv-placeholder">
              <svg viewBox="0 0 64 64" fill="none">
                <rect x="10" y="14" width="44" height="36" rx="6" stroke="currentColor" stroke-width="3" />
                <circle cx="24" cy="27" r="4" fill="currentColor" />
                <path d="M12 44 L25 32 L34 40 L43 31 L52 40 L52 44 Z" fill="currentColor" fill-opacity="0.55" />
              </svg>
              <span>图片会显示在这里</span>
            </div>
            <span class="pv-pill" :class="form.type === 'lost' ? 'is-lost' : 'is-found'">
              {{ preview.typeLabel }}
            </span>
            <!-- 多图时在右上角标出数量 -->
            <span v-if="preview.imageCount > 1" class="pv-count">共 {{ preview.imageCount }} 张</span>
          </div>

          <div class="pv-body">
            <h4 :class="{ muted: !form.title }">{{ preview.title }}</h4>

            <div class="pv-row">
              <el-icon><Location /></el-icon><span>{{ preview.location }}</span>
            </div>
            <div class="pv-row">
              <el-icon><Phone /></el-icon><span>{{ preview.contact }}</span>
            </div>

            <p class="pv-desc" :class="{ muted: !form.description }">{{ preview.description }}</p>

            <div class="pv-foot">
              <span class="pv-tag">待审核</span>
              <span class="pv-user">{{ auth.user?.username }}</span>
            </div>
          </div>
        </article>

        <!-- 温馨提醒 -->
        <div class="preview-note">
          <el-icon class="note-icon"><Warning /></el-icon>
          <div>
            <b>发布前请确认</b>
            <p>为避免冒领，建议描述中保留一两个"只有失主才知道"的细节，不要把全部特征都公开写出来。</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.publish {
  max-width: 1060px;
  margin: 0 auto;
}

/* ---------------- 页头 ---------------- */
.page-head {
  margin-bottom: 20px;
}
.head-sub {
  margin: 8px 0 0;
  font-size: 13.5px;
  color: var(--text-3);
  line-height: 1.7;
}

/* ---------------- 两栏布局 ---------------- */
.publish-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 22px;
  align-items: start;
}

/* ---------------- 左：表单 ---------------- */
.form-panel {
  background: #fff;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 26px 28px 28px;
}

/* el-form-item 的 label 加粗一点，看起来更清楚 */
.form-panel :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-2);
  font-size: 13.5px;
  padding-bottom: 4px;
}

/* ---------------- 类型选择卡片 ---------------- */
.type-item :deep(.el-form-item__content) {
  display: block;
}
.type-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}
.type-card {
  position: relative;
  text-align: left;
  padding: 16px 16px 15px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border-base);
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.22s var(--ease-out);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.type-card:hover {
  border-color: var(--brand-300);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
.type-card b {
  font-size: 14.5px;
  color: var(--text-1);
  font-weight: 600;
}
.type-card i {
  font-style: normal;
  font-size: 12px;
  color: var(--text-4);
  line-height: 1.6;
}
/* 右上角的勾：默认透明，选中后显现 */
.tc-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid var(--border-base);
  color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s var(--ease-out);
}
.tc-check svg {
  width: 13px;
  height: 13px;
}

/* 选中状态：失物=红，拾物=绿，跟首页角标颜色对应 */
.type-card.on {
  border-color: var(--brand-500);
  background: var(--brand-50);
  box-shadow: 0 4px 14px rgba(43, 127, 228, 0.14);
}
.type-card.on .tc-check {
  background: var(--brand-500);
  border-color: var(--brand-500);
  color: #fff;
}
.type-card.on.theme-lost {
  border-color: var(--rose-500);
  background: rgba(240, 74, 94, 0.055);
  box-shadow: 0 4px 14px rgba(240, 74, 94, 0.14);
}
.type-card.on.theme-lost .tc-check {
  background: var(--rose-500);
  border-color: var(--rose-500);
}
.type-card.on.theme-found {
  border-color: var(--mint-500);
  background: rgba(18, 184, 134, 0.055);
  box-shadow: 0 4px 14px rgba(18, 184, 134, 0.14);
}
.type-card.on.theme-found .tc-check {
  background: var(--mint-500);
  border-color: var(--mint-500);
}

/* 地点 + 时间并排 */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.two-col :deep(.el-form-item) {
  margin-bottom: 18px;
}

/* 上传区 */
.uploader :deep(.el-upload--picture-card),
.uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  border-radius: var(--radius-md);
}
.upload-plus {
  font-size: 26px;
  color: var(--text-4);
}
.upload-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--text-4);
  margin-top: 8px;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 22px;
  margin-top: 6px;
  border-top: 1px solid var(--border-base);
}
.form-actions :deep(.el-button--primary) {
  min-width: 150px;
  height: 44px;
  font-size: 15px;
}
.form-actions :deep(.el-button) {
  height: 44px;
}

/* ---------------- 右：预览 ---------------- */
.preview-panel {
  position: sticky;
  top: 86px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.preview-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-left: 2px;
}
.preview-head span {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-1);
}
.preview-head em {
  font-style: normal;
  font-size: 12px;
  color: var(--text-4);
}

.preview-card {
  background: #fff;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.pv-media {
  position: relative;
  height: 168px;
  background: var(--grad-soft);
}
.pv-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pv-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #b9c6dd;
  font-size: 12.5px;
}
.pv-placeholder svg {
  width: 48px;
  height: 48px;
}
.pv-pill {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: var(--radius-full);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}
.pv-pill.is-lost {
  background: rgba(240, 74, 94, 0.92);
}
.pv-pill.is-found {
  background: rgba(18, 184, 134, 0.92);
}
.pv-count {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11.5px;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  backdrop-filter: blur(4px);
}

.pv-body {
  padding: 14px 15px 15px;
}
.pv-body h4 {
  margin: 0 0 10px;
  font-size: 15.5px;
  font-weight: 600;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pv-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-3);
  margin-bottom: 6px;
}
.pv-row .el-icon {
  color: var(--text-4);
}
.pv-desc {
  margin: 10px 0 12px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--text-3);
  /* 预览里最多显示 2 行，超出打省略号 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
/* .muted 表示"这里还是占位提示文字"，用更浅的灰色 */
.muted {
  color: var(--text-4) !important;
  font-style: italic;
}
.pv-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 11px;
  border-top: 1px solid var(--border-base);
}
.pv-tag {
  font-size: 11.5px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: rgba(245, 165, 36, 0.14);
  color: #b7791f;
  font-weight: 500;
}
.pv-user {
  font-size: 12px;
  color: var(--text-4);
}

/* 提醒条 */
.preview-note {
  display: flex;
  gap: 10px;
  padding: 14px 15px;
  border-radius: var(--radius-md);
  background: rgba(245, 165, 36, 0.08);
  border: 1px solid rgba(245, 165, 36, 0.22);
}
.note-icon {
  color: var(--amber-500);
  font-size: 17px;
  flex-shrink: 0;
  margin-top: 1px;
}
.preview-note b {
  font-size: 13px;
  color: #8a5a10;
  display: block;
  margin-bottom: 4px;
}
.preview-note p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: #9a6a1c;
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 940px) {
  /* 窄屏：预览栏挪到下方，不再吸顶 */
  .publish-grid {
    grid-template-columns: 1fr;
  }
  .preview-panel {
    position: static;
  }
}
@media (max-width: 560px) {
  .form-panel {
    padding: 20px 18px 22px;
  }
  /* 手机上类型卡片和"地点/时间"都改单列 */
  .type-cards,
  .two-col {
    grid-template-columns: 1fr;
  }
  .form-actions {
    flex-direction: column;
  }
  .form-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
