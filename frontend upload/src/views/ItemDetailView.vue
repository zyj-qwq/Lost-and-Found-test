<!-- ============================================================
ItemDetailView.vue —— 信息详情页
============================================================
本页能学到：
  1. 动态路由参数：网址是 /items/123，组件里用 route.params.id 拿到 "123"。
  2. computed 计算属性：由现有数据"算出来"的值（判断"我是不是发布人"）。
  3. el-dialog 弹窗：用一个布尔值控制显示/隐藏（v-model）。

【本次改版说明】
  原来所有内容都堆在一条竖直的卡片里，又长又平。
  现在改成"左图右文"的两栏布局：
    左栏 = 大图 + 缩略图（可点切换）
    右栏 = 标题、状态、关键信息卡片、操作按钮
  并把"地点/时间/发布人/联系方式"做成 2×2 的小信息格，
  比 el-descriptions 的表格更像详情页该有的样子。
============================================================ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowLeft, Location, Clock, User, Phone, Edit, Delete, Check } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/api'
import { useAuthStore } from '@/stores/auth'
import type { Item, ItemForm } from '@/types'
import { formatTime, itemStatusMap } from '@/utils/format'

// route.params.id：网址 /items/3 里的那个 "3"
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// 当前展示的信息；ref(null) 是因为还没加载，用 | null 表示"可能是空"
const item = ref<Item | null>(null)
const loading = ref(false)

// 当前预览的是第几张图（点击缩略图会改这个值）
const activeImage = ref(0)

// computed 计算属性："我是不是这条信息的发布人？"
// 依赖的数据（item、auth.user）任何一方变化，它都会自动重算，
// 模板里的"编辑/删除按钮"就跟着自动显示/隐藏
const isOwner = computed(() => item.value && auth.user && item.value.user?.id === auth.user.uid)

// 该物品是否允许编辑（已认领/已关闭的不让改）
const canEdit = computed(() => item.value && !['claimed', 'closed'].includes(item.value.status))

// 从后端加载信息详情
async function fetchItem() {
  loading.value = true
  try {
    // 模板字符串拼网址：/items/3。后端返回完整信息对象
    item.value = await get<Item>(`/items/${route.params.id}`)
    activeImage.value = 0 // 每次加载都把预览重置到第一张
  } finally {
    loading.value = false
  }
}

// ================= 认领申请部分 =================

// claimVisible 控制弹窗显示/隐藏（v-model="claimVisible"）
const claimVisible = ref(false)
const claimForm = ref({ proof: '', contact: '' })
const claimSubmitting = ref(false) // 提交中，防止重复点击

// 点"申请认领"按钮：没登录先跳登录页；已登录就弹窗
function openClaim() {
  if (!auth.isLoggedIn) {
    // redirect 参数：登录成功后跳回这个详情页
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  claimForm.value = { proof: '', contact: '' } // 清空上次填写的内容
  claimVisible.value = true
}

// 弹窗里点"提交申请"
async function submitClaim() {
  // trim() 去掉首尾空格后再判断是否为空
  if (!claimForm.value.proof.trim() || !claimForm.value.contact.trim()) {
    ElMessage.warning('请填写认领证明和联系方式')
    return
  }
  claimSubmitting.value = true
  try {
    // POST /items/3/claims：向第 3 条信息提交认领申请
    // item.value! 里的 ! 是 TS 写法，意思是"我确定它不是 null"
    await post(`/items/${item.value!.id}/claims`, claimForm.value)
    ElMessage.success('认领申请已提交，请等待管理员审核')
    claimVisible.value = false
  } finally {
    claimSubmitting.value = false
  }
}

// ================= 编辑部分 =================

const editVisible = ref(false)
const editRef = ref<FormInstance>()
// 编辑表单的数据（点编辑时把现有内容填进来）
const editForm = ref<ItemForm>({
  type: 'lost', title: '', description: '', location: '', lost_at: '', contact: '', images: []
})
const editRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }]
}

// 打开编辑弹窗：把当前信息复制一份进表单（复制而不是直接引用，
// 这样用户点"取消"时不会把原数据也改掉）
function openEdit() {
  if (!item.value) return
  editForm.value = {
    type: item.value.type,
    title: item.value.title,
    description: item.value.description,
    location: item.value.location,
    lost_at: item.value.lost_at,
    contact: item.value.contact,
    images: [...item.value.images] // ...展开：复制出一个新数组
  }
  editVisible.value = true
}

// 保存修改
async function submitEdit() {
  await editRef.value?.validate().catch(() => Promise.reject()) // 先校验
  // PUT /items/3：更新第 3 条信息（后端会重新把它置为"待审核"）
  await put(`/items/${item.value!.id}`, editForm.value)
  ElMessage.success('修改成功，已重新提交审核')
  editVisible.value = false
  fetchItem() // 重新拉取最新数据刷新页面
}

// 删除信息（只有发布人能看到这个按钮）
async function handleDelete() {
  // 确认弹窗：用户点取消会抛异常，后面代码不执行——天然实现"取消就不删"
  await ElMessageBox.confirm('确定删除这条信息吗？删除后不可恢复。', '警告', { type: 'warning' })
  await del(`/items/${item.value!.id}`)
  ElMessage.success('删除成功')
  router.push('/') // 删除后回首页
}

// 页面挂载完成 → 立刻加载详情
onMounted(fetchItem)
</script>

<template>
  <div v-loading="loading" class="detail pf-rise">
    <!-- 返回栏：一句话面包屑 + 返回按钮 -->
    <div class="back-bar">
      <button class="back-btn" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>返回
      </button>
      <span class="crumb">
        首页 <i>/</i> {{ item?.type === 'lost' ? '失物' : '拾物' }}详情
      </span>
    </div>

    <!-- v-if="item"：数据加载好之前不渲染卡片（避免 item.xxx 报错） -->
    <div v-if="item" class="detail-grid">
      <!-- ============ 左栏：图片区 ============ -->
      <div class="gallery">
        <div class="gallery-main">
          <template v-if="item.images && item.images.length">
            <!-- 点击大图可以放大查看（preview-src-list 传全部图片，支持左右翻页） -->
            <el-image
              :src="item.images[activeImage]"
              :preview-src-list="item.images"
              :initial-index="activeImage"
              fit="cover"
              class="big-img"
              preview-teleported
            />
          </template>
          <!-- 没有图片时显示画出来的占位图（比一行灰字好看） -->
          <div v-else class="big-img placeholder">
            <svg viewBox="0 0 64 64" fill="none">
              <rect x="10" y="14" width="44" height="36" rx="6" stroke="currentColor" stroke-width="3" />
              <circle cx="24" cy="27" r="4" fill="currentColor" />
              <path d="M12 44 L25 32 L34 40 L43 31 L52 40 L52 44 Z" fill="currentColor" fill-opacity="0.55" />
            </svg>
            <span>该信息未上传图片</span>
          </div>

          <!-- 大图左上角的类型角标 -->
          <span class="type-pill" :class="item.type === 'lost' ? 'is-lost' : 'is-found'">
            {{ item.type === 'lost' ? '失物' : '拾物' }}
          </span>
        </div>

        <!-- 缩略图：有多张图时显示，点谁换谁 -->
        <div v-if="item.images && item.images.length > 1" class="thumbs">
          <button
            v-for="(img, i) in item.images"
            :key="i"
            class="thumb"
            :class="{ on: activeImage === i }"
            @click="activeImage = i"
          >
            <img :src="img" alt="" />
          </button>
        </div>
      </div>

      <!-- ============ 右栏：信息区 ============ -->
      <div class="info">
        <header class="info-head">
          <div class="title-row">
            <h1>{{ item.title }}</h1>
            <el-tag
              size="large"
              effect="light"
              round
              :type="itemStatusMap[item.status]?.type"
            >
              {{ itemStatusMap[item.status]?.label }}
            </el-tag>
          </div>
          <p class="pub-time">
            由 <b>{{ item.user?.username || '匿名用户' }}</b> 发布于 {{ formatTime(item.created_at) }}
          </p>
        </header>

        <!-- 关键信息：2×2 的格子，比表格更像"卡片" -->
        <div class="facts">
          <div class="fact">
            <span class="fact-icon loc"><el-icon><Location /></el-icon></span>
            <div>
              <label>地点</label>
              <b>{{ item.location || '未填写' }}</b>
            </div>
          </div>
          <div class="fact">
            <span class="fact-icon time"><el-icon><Clock /></el-icon></span>
            <div>
              <label>{{ item.type === 'lost' ? '丢失时间' : '拾获时间' }}</label>
              <b>{{ formatTime(item.lost_at) }}</b>
            </div>
          </div>
          <div class="fact">
            <span class="fact-icon user"><el-icon><User /></el-icon></span>
            <div>
              <label>发布人</label>
              <b>{{ item.user?.username || '匿名用户' }}</b>
            </div>
          </div>
          <div class="fact">
            <span class="fact-icon phone"><el-icon><Phone /></el-icon></span>
            <div>
              <label>联系方式</label>
              <!-- 联系方式可能是敏感信息，登录后才显示具体内容 -->
              <b>{{ auth.isLoggedIn ? item.contact : '登录后可见' }}</b>
            </div>
          </div>
        </div>

        <!-- 详细描述 -->
        <section class="block">
          <h3 class="block-title">详细描述</h3>
          <p class="desc-text">{{ item.description || '发布者未填写描述' }}</p>
        </section>

        <!-- 审核备注：只有被审核过且有备注时才出现 -->
        <el-alert
          v-if="item.remark"
          class="remark"
          type="warning"
          :closable="false"
          show-icon
          :title="`审核备注：${item.remark}`"
        />

        <!-- 操作区 -->
        <div class="actions">
          <!-- 情况1：已发布 + 不是发布人 → 显示"申请认领" -->
          <el-button
            v-if="item.status === 'approved' && !isOwner"
            type="primary"
            size="large"
            round
            class="main-action"
            @click="openClaim"
          >
            这是我的，申请认领
          </el-button>

          <!-- 情况2/3：待审核、已认领 → 显示提示条（v-else-if 链） -->
          <el-alert
            v-else-if="item.status === 'pending'"
            type="info"
            :closable="false"
            show-icon
            title="该信息正在等待管理员审核，审核通过后可申请认领"
          />
          <el-alert
            v-else-if="item.status === 'claimed'"
            type="success"
            :closable="false"
            show-icon
            title="该物品已完成认领，感谢你的热心"
          />

          <!-- 发布人专属：编辑（已认领/已关闭的不能改）和删除 -->
          <div v-if="isOwner" class="owner-actions">
            <el-button v-if="canEdit" :icon="Edit" round @click="openEdit">编辑</el-button>
            <el-button type="danger" plain :icon="Delete" round @click="handleDelete">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 认领申请弹窗 ============ -->
    <!-- el-dialog 的 v-model 是"true 显示 / false 隐藏" -->
    <el-dialog v-model="claimVisible" title="提交认领申请" width="520px" class="claim-dialog" append-to-body>
      <!-- 顶部说明：告诉用户"证明写得越具体越容易通过" -->
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="请尽量提供只有真正失主才知道的细节，管理员会据此审核"
        class="claim-hint"
      />
      <el-form label-position="top">
        <el-form-item label="认领证明" required>
          <el-input v-model="claimForm.proof" type="textarea" :rows="4"
            placeholder="请描述物品特征以证明归属，如：钱包内有我的学生卡，学号是 xxx" />
        </el-form-item>
        <el-form-item label="联系方式" required>
          <el-input v-model="claimForm.contact" placeholder="手机号 / 微信等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <!-- 弹窗底部按钮：点取消只是把 claimVisible 置 false（隐藏弹窗） -->
        <el-button @click="claimVisible = false">取消</el-button>
        <el-button type="primary" :loading="claimSubmitting" @click="submitClaim">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- ============ 编辑弹窗 ============ -->
    <el-dialog v-model="editVisible" title="编辑信息" width="580px" append-to-body>
      <el-form ref="editRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="editForm.type">
            <el-radio-button value="lost">失物</el-radio-button>
            <el-radio-button value="found">拾物</el-radio-button>
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
        <!-- 日期时间选择器，选完值自动存进 editForm.lost_at -->
        <el-form-item label="时间">
          <el-date-picker v-model="editForm.lost_at" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="editForm.contact" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :icon="Check" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detail {
  max-width: 1060px;
  margin: 0 auto;
}

/* ---------------- 返回栏 ---------------- */
.back-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--border-base);
  background: #fff;
  color: var(--text-2);
  font-family: inherit;
  font-size: 13.5px;
  padding: 7px 14px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
}
.back-btn:hover {
  color: var(--brand-600);
  border-color: var(--brand-200);
  background: var(--brand-50);
}
.crumb {
  font-size: 13px;
  color: var(--text-4);
}
.crumb i {
  font-style: normal;
  margin: 0 5px;
}

/* ---------------- 主布局：左图右文 ---------------- */
.detail-grid {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 24px;
  align-items: start;
}

/* ---------------- 左栏图片 ---------------- */
.gallery {
  position: sticky; /* 滚动时图片区吸住，方便对照右侧文字 */
  top: 86px;
}
.gallery-main {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--grad-soft);
  border: 1px solid var(--border-base);
  box-shadow: var(--shadow-sm);
  aspect-ratio: 4 / 3;
}
.big-img {
  width: 100%;
  height: 100%;
  display: block;
}
.big-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #b9c6dd;
  font-size: 13px;
}
.placeholder svg {
  width: 62px;
  height: 62px;
}

.type-pill {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 15px;
  border-radius: var(--radius-full);
  color: #fff;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}
.type-pill.is-lost {
  background: rgba(240, 74, 94, 0.94);
}
.type-pill.is-found {
  background: rgba(18, 184, 134, 0.94);
}

.thumbs {
  display: flex;
  gap: 9px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.thumb {
  width: 68px;
  height: 54px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  padding: 0;
  border: 2px solid transparent;
  background: var(--bg-soft);
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.thumb:hover {
  border-color: var(--brand-300);
}
/* 当前选中的缩略图：蓝色描边 + 微微上浮 */
.thumb.on {
  border-color: var(--brand-500);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* ---------------- 右栏信息 ---------------- */
.info {
  background: #fff;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 26px 28px 28px;
}

.info-head {
  margin-bottom: 20px;
}
.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
}
.title-row h1 {
  font-size: 23px;
  line-height: 1.4;
  margin: 0;
  letter-spacing: -0.3px;
}
.pub-time {
  margin: 0;
  font-size: 13px;
  color: var(--text-4);
}
.pub-time b {
  color: var(--text-2);
  font-weight: 600;
}

/* 关键信息 2×2 网格 */
.facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 22px;
}
.fact {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-soft);
  border: 1px solid transparent;
  transition: all 0.2s var(--ease-out);
  min-width: 0;
}
.fact:hover {
  background: #fff;
  border-color: var(--brand-200);
  box-shadow: var(--shadow-xs);
}
/* 小图标：不同信息用不同色调，便于快速区分 */
.fact-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}
.fact-icon.loc {
  background: rgba(43, 127, 228, 0.12);
  color: var(--brand-500);
}
.fact-icon.time {
  background: rgba(245, 165, 36, 0.14);
  color: var(--amber-500);
}
.fact-icon.user {
  background: rgba(124, 92, 255, 0.12);
  color: var(--accent-500);
}
.fact-icon.phone {
  background: rgba(18, 184, 134, 0.12);
  color: var(--mint-500);
}
.fact label {
  display: block;
  font-size: 11.5px;
  color: var(--text-4);
  margin-bottom: 2px;
}
.fact b {
  display: block;
  font-size: 13.5px;
  color: var(--text-1);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 描述块 */
.block {
  margin-bottom: 18px;
}
.block-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  margin: 0 0 10px;
  padding-left: 10px;
  border-left: 3px solid var(--brand-400);
  line-height: 1.2;
}
.desc-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.9;
  color: var(--text-2);
  white-space: pre-wrap; /* 保留用户输入里的换行 */
  background: var(--bg-soft);
  padding: 14px 16px;
  border-radius: var(--radius-md);
}

.remark {
  margin-bottom: 18px;
  border-radius: var(--radius-md);
}

/* 操作区 */
.actions {
  padding-top: 20px;
  border-top: 1px solid var(--border-base);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.main-action {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 600;
}
.actions :deep(.el-alert) {
  border-radius: var(--radius-md);
}
.owner-actions {
  display: flex;
  gap: 10px;
}

.claim-hint {
  margin-bottom: 16px;
  border-radius: var(--radius-md);
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 940px) {
  /* 窄屏改成上下堆叠，图片不再吸顶 */
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .gallery {
    position: static;
  }
  .gallery-main {
    aspect-ratio: 16 / 10;
  }
}
@media (max-width: 560px) {
  .info {
    padding: 20px 18px 22px;
  }
  .title-row {
    flex-direction: column;
    gap: 8px;
  }
  .title-row h1 {
    font-size: 20px;
  }
  /* 手机上关键信息改成一列，避免文字被压得太窄 */
  .facts {
    grid-template-columns: 1fr;
  }
}
</style>
