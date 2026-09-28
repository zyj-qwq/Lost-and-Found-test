<!-- ============================================================
AdminLayout.vue —— 管理后台的"外壳"（左侧菜单 + 右侧内容）
============================================================
这是"嵌套路由"的父组件：路由配置里 /admin 下有 children，
访问 /admin/items 时 → AdminLayout 整体显示，
其中 <router-view /> 这个坑位里显示 ItemReview 子页面。
（类比 App.vue，只不过是 admin 专属的外壳）

【本次改版说明】
  原来的左侧菜单只是一个朴素的 el-menu，还在标题里塞了 emoji。
  现在换成深色渐变侧栏 + 图标 + 文字的两行式菜单，
  并在顶部加了一个"管理后台"标识和当前管理员信息，
  让后台看起来和专业管理系统更像。
============================================================ -->

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { DataAnalysis, Document, Checked, User, Bell, Setting } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { roleMap } from '@/utils/format'

const route = useRoute() // 读当前路径，用来让左侧菜单正确高亮
const router = useRouter()
const auth = useAuthStore()

// 菜单配置：图标、文案、路径写在一起，模板循环渲染
const menus = [
  { path: '/admin', label: '数据统计', desc: '平台整体概览', icon: DataAnalysis },
  { path: '/admin/items', label: '信息审核', desc: '审核失物/拾物', icon: Document },
  { path: '/admin/claims', label: '认领审核', desc: '处理认领申请', icon: Checked },
  { path: '/admin/users', label: '用户管理', desc: '角色与状态', icon: User },
  { path: '/admin/announcements', label: '公告管理', desc: '发布平台公告', icon: Bell }
]

// 当前菜单是否高亮：/admin 要精确匹配，其他用前缀匹配
function isActive(path: string) {
  return path === '/admin' ? route.path === '/admin' : route.path.startsWith(path)
}

// 当前页面对应的标题（显示在右侧内容区顶部）
const pageTitle = computed(() => menus.find((m) => isActive(m.path))?.label || '管理后台')

// 管理员头像首字
const avatarText = computed(() => auth.user?.username?.charAt(0)?.toUpperCase() || 'A')
</script>

<template>
  <div class="admin pf-rise">
    <div class="admin-shell">
      <!-- ============ 左侧栏 ============ -->
      <aside class="sidebar">
        <div class="side-brand">
          <span class="side-logo">
            <el-icon><Setting /></el-icon>
          </span>
          <div>
            <b>管理后台</b>
            <i>Admin Console</i>
          </div>
        </div>

        <!-- 菜单：用自定义的按钮而不是 el-menu，方便做深色主题 -->
        <nav class="side-nav">
          <button
            v-for="m in menus"
            :key="m.path"
            class="side-item"
            :class="{ on: isActive(m.path) }"
            @click="router.push(m.path)"
          >
            <span class="si-icon"><el-icon><component :is="m.icon" /></el-icon></span>
            <span class="si-text">
              <b>{{ m.label }}</b>
              <i>{{ m.desc }}</i>
            </span>
          </button>
        </nav>

        <!-- 底部：当前登录的管理员 -->
        <div class="side-user">
          <span class="su-avatar">{{ avatarText }}</span>
          <div>
            <b>{{ auth.user?.username }}</b>
            <i>{{ roleMap[auth.role] || '管理员' }}</i>
          </div>
        </div>
      </aside>

      <!-- ============ 右侧内容区 ============ -->
      <main class="content">
        <!-- 内容区顶部：当前页面标题 -->
        <div class="content-head">
          <h2>{{ pageTitle }}</h2>
          <el-button link type="primary" @click="router.push('/')">返回前台 →</el-button>
        </div>

        <!-- 子页面（审核页/用户页……）渲染在这里 -->
        <div class="content-body">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 232px 1fr;
  background: #fff;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  min-height: 620px;
}

/* ---------------- 侧栏 ---------------- */
.sidebar {
  background: linear-gradient(180deg, #1e2a3d 0%, #16202f 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px 14px 16px;
}

.side-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 6px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 14px;
}
.side-logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(43, 127, 228, 0.4);
}
.side-brand b {
  display: block;
  font-size: 14.5px;
  font-weight: 700;
}
.side-brand i {
  font-style: normal;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.42);
  letter-spacing: 0.6px;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.side-item {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
}
.side-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}
/* 选中态：白色半透明底 + 左侧一条亮色指示条 */
.side-item.on {
  background: rgba(43, 127, 228, 0.22);
  color: #fff;
  position: relative;
}
.side-item.on::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 22px;
  border-radius: var(--radius-full);
  background: var(--brand-400);
}
.si-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  transition: background 0.2s;
}
.side-item.on .si-icon {
  background: rgba(255, 255, 255, 0.16);
}
.si-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.si-text b {
  font-size: 13.5px;
  font-weight: 600;
}
.si-text i {
  font-style: normal;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.4);
}

.side-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  margin-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.su-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.side-user b {
  display: block;
  font-size: 13px;
  font-weight: 600;
}
.side-user i {
  font-style: normal;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

/* ---------------- 右侧内容 ---------------- */
.content {
  padding: 22px 26px 26px;
  min-width: 0;
  background: var(--bg-page);
}
.content-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-base);
}
.content-head h2 {
  font-size: 19px;
  margin: 0;
  letter-spacing: -0.3px;
}

/* 内容区里的表格/卡片统一白底，和浅灰背景拉开层次 */
.content-body :deep(.el-table) {
  background: #fff;
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 860px) {
  /* 窄屏：侧栏变成顶部横向菜单 */
  .admin-shell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    padding: 14px 12px;
  }
  .side-brand {
    padding-bottom: 12px;
    margin-bottom: 10px;
  }
  .side-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 6px;
    padding-bottom: 4px;
  }
  .side-item {
    flex-direction: column;
    gap: 5px;
    padding: 9px 14px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  /* 横排时描述文字和指示条都去掉，只留图标+名字 */
  .si-text i,
  .side-item.on::before {
    display: none;
  }
  .side-user {
    display: none;
  }
  .content {
    padding: 16px 14px 20px;
  }
}
</style>
