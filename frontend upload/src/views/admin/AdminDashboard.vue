<!-- ============================================================
AdminDashboard.vue —— 管理后台首页（数据统计卡片）
============================================================
本页能学到：v-for 渲染"卡片数组"，一个数组配置就生成 5 张统计卡。

【本次改版说明】
  原来的统计卡是"一个大数字 + 一行灰字"，五张长得一模一样。
  现在每张卡配了图标、独立配色和一条装饰性进度条，
  并且用 CSS 变量把"色调"抽出来，卡片样式复用同一套结构。
============================================================ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/api'
import type { Statistics } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { Files, Clock, CircleCheck, User, Tickets } from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()
const stats = ref<Statistics | null>(null)
const loading = ref(true)

// onMounted 里可以直接写 async 匿名函数
onMounted(async () => {
  try {
    stats.value = await get<Statistics>('/admin/statistics')
  } finally {
    loading.value = false
  }
})

// 卡片的"配置数组"：要显示哪些指标、叫什么名字、什么颜色、点进去看什么。
// 模板里 v-for 循环它，就自动生成对应卡片——以后要加指标只需在这里加一行
const cards = [
  { key: 'total_items', label: '信息总数', desc: '平台累计发布', tone: 'blue', icon: Files, to: '/admin/items' },
  { key: 'pending_items', label: '待审核信息', desc: '需要尽快处理', tone: 'amber', icon: Clock, to: '/admin/items' },
  { key: 'claimed_items', label: '已认领物品', desc: '成功物归原主', tone: 'green', icon: CircleCheck, to: '/admin/items' },
  { key: 'total_users', label: '注册用户', desc: '含全部角色', tone: 'purple', icon: User, to: '/admin/users' },
  { key: 'total_claims', label: '认领申请数', desc: '累计收到申请', tone: 'rose', icon: Tickets, to: '/admin/claims' }
]

// 取某个指标的数值（c.key 是 'total_items' 这样的字符串，用它当钥匙去 stats 里取值）
function valueOf(c: (typeof cards)[number]) {
  return stats.value ? stats.value[c.key as keyof Statistics] : 0
}

// 所有卡片共用的"最大值"，用来算进度条宽度（让进度条之间可以横向比较）
const maxValue = computed(() => {
  if (!stats.value) return 1
  return Math.max(1, ...cards.map((c) => Number(valueOf(c)) || 0))
})

// 进度条宽度（百分比，最小 6% 以免看不见）
function barWidth(c: (typeof cards)[number]) {
  const pct = (Number(valueOf(c)) / maxValue.value) * 100
  return `${Math.max(6, pct)}%`
}
</script>

<template>
  <div v-loading="loading" class="dash">
    <!-- 欢迎条：把管理员身份摆出来 -->
    <div class="welcome">
      <div class="wc-left">
        <h3>你好，{{ auth.user?.username }} 👋</h3>
        <p>
          你是
          <b>{{ auth.role === 'system_admin' ? '系统管理员' : '失物招领管理员' }}</b>
          ，
          <template v-if="stats?.pending_items">当前有 <b>{{ stats.pending_items }}</b> 条信息等待审核。</template>
          <template v-else>目前没有待处理的信息，辛苦了。</template>
        </p>
      </div>
      <el-button v-if="stats?.pending_items" type="primary" round @click="router.push('/admin/items')">
        去审核
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="14" v-if="stats" class="stat-row">
      <el-col v-for="c in cards" :key="c.key" :xs="24" :sm="12" :md="8" :lg="8">
        <!-- 点卡片跳到对应管理页，所以做成可点击的 -->
        <div class="stat-card" :class="`tone-${c.tone}`" @click="router.push(c.to)">
          <div class="sc-top">
            <span class="sc-icon"><el-icon><component :is="c.icon" /></el-icon></span>
            <span class="sc-label">{{ c.label }}</span>
          </div>
          <div class="sc-value">{{ valueOf(c) }}</div>
          <div class="sc-bar"><i :style="{ width: barWidth(c) }"></i></div>
          <div class="sc-desc">{{ c.desc }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <div class="quick">
      <h4 class="quick-title">快捷入口</h4>
      <div class="quick-grid">
        <button class="quick-item" @click="router.push('/admin/items')">
          <el-icon><Files /></el-icon><span>信息审核</span>
        </button>
        <button class="quick-item" @click="router.push('/admin/claims')">
          <el-icon><Tickets /></el-icon><span>认领审核</span>
        </button>
        <button class="quick-item" @click="router.push('/admin/users')">
          <el-icon><User /></el-icon><span>用户管理</span>
        </button>
        <button class="quick-item" @click="router.push('/admin/announcements')">
          <el-icon><CircleCheck /></el-icon><span>公告管理</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---------------- 欢迎条 ---------------- */
.welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  background: var(--grad-soft);
  border: 1px solid var(--border-base);
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.wc-left h3 {
  margin: 0 0 4px;
  font-size: 16px;
}
.wc-left p {
  margin: 0;
  font-size: 13px;
  color: var(--text-3);
  line-height: 1.6;
}
.wc-left b {
  color: var(--brand-600);
}

/* ---------------- 统计卡片 ---------------- */
.stat-row {
  margin-bottom: 6px;
}
.stat-card {
  position: relative;
  background: #fff;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  padding: 16px 18px 15px;
  margin-bottom: 14px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
  /* 每种色调只改三个变量，卡片样式复用同一套 */
  --tone: var(--brand-500);
  --tone-soft: rgba(43, 127, 228, 0.12);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
/* 左上角一小块色晕，让每张卡有辨识度 */
.stat-card::after {
  content: '';
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  top: -58px;
  right: -40px;
  background: var(--tone);
  opacity: 0.07;
}

.tone-blue {
  --tone: #2b7fe4;
  --tone-soft: rgba(43, 127, 228, 0.12);
}
.tone-amber {
  --tone: #f5a524;
  --tone-soft: rgba(245, 165, 36, 0.14);
}
.tone-green {
  --tone: #12b886;
  --tone-soft: rgba(18, 184, 134, 0.12);
}
.tone-purple {
  --tone: #7c5cff;
  --tone-soft: rgba(124, 92, 255, 0.12);
}
.tone-rose {
  --tone: #f04a5e;
  --tone-soft: rgba(240, 74, 94, 0.12);
}

.sc-top {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
}
.sc-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--tone-soft);
  color: var(--tone);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}
.sc-label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-2);
}

.sc-value {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--tone);
  letter-spacing: -0.8px;
  margin-bottom: 10px;
}

/* 装饰性进度条：用同一个最大值做分母，卡片之间可以横向比较 */
.sc-bar {
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--bg-soft);
  overflow: hidden;
  margin-bottom: 9px;
}
.sc-bar i {
  display: block;
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--tone);
  transition: width 0.6s var(--ease-out);
}

.sc-desc {
  font-size: 11.5px;
  color: var(--text-4);
}

/* ---------------- 快捷入口 ---------------- */
.quick {
  margin-top: 12px;
}
.quick-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 3px solid var(--brand-400);
  line-height: 1.2;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-base);
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.22s var(--ease-out);
}
.quick-item .el-icon {
  font-size: 21px;
  color: var(--brand-500);
}
.quick-item:hover {
  transform: translateY(-3px);
  border-color: var(--brand-200);
  box-shadow: var(--shadow-sm);
  color: var(--brand-600);
}

@media (max-width: 700px) {
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
