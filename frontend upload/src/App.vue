<!-- ============================================================
App.vue —— 根组件（整个页面的"外壳"）
============================================================
一个 .vue 文件就是一个"组件"，里面最多有三块：
  <script>  写 JS 逻辑（数据、函数）
  <template> 写 HTML 结构（比原生 HTML 多了一些 v- 开头的指令）
  <style>   写 CSS（scoped 表示这些样式只作用于本组件，不会污染别的页面）

它是所有页面的公共外壳：顶部导航栏 + 中间内容区 + 底部版权。
中间的 <router-view /> 是个"坑位"——访问什么网址，就显示哪个页面组件。

【本次改版说明】
  为了整个站点好看，这里用了这些手法（都是纯 CSS，不难）：
   1. 用 linear-gradient 做渐变（Logo 图标底、页脚的深色背景）
   2. 用 position: sticky 让导航栏滚动时吸在顶部
   3. 用 backdrop-filter 做"毛玻璃"半透明效果
   4. 用 border-radius 把方角变圆角，视觉上更柔和
   5. 悬停时用 transform / box-shadow 做轻微浮动，增加"可点击"的暗示
============================================================ -->

<script setup lang="ts">
// "script setup" 是 Vue 3 的简写语法：
// 在这里定义的变量和函数，模板(template)里可以直接用，不用 return 出去。

// onMounted：组件"挂载完成"后执行的钩子（类似原生 JS 的 DOMContentLoaded）
import { onMounted, computed } from 'vue'
// useRoute：获取"当前网址信息"（比如当前路径 route.path）
// useRouter：拿到"路由器"，用它做页面跳转（router.push('/xxx') 相当于改网址）
import { useRoute, useRouter } from 'vue-router'
// ElMessageBox：Element Plus 的弹窗组件（确认框），用 JS 调用而不是写在模板里
import { ElMessageBox } from 'element-plus'
// Element Plus 自带的图标组件（导入后模板里才能用 <Search /> 这些标签）
import { Bell, Plus, Setting, User, List, Tickets, SwitchButton, House } from '@element-plus/icons-vue'
// 导入登录状态 store（全项目共享的"登录信息"，见 stores/auth.ts）
import { useAuthStore } from '@/stores/auth'

// 拿到三个"工具"：登录状态、当前路由、路由器
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// 启动时用后端校验一次 token，防止本地残留的无效 token 导致"假登录"
// （比如后端重装过数据库，旧 token 就失效了，这时要立刻踢回登录页）
onMounted(() => auth.init())

// 计算属性：用户名首字，用作头像里的文字（比如"张三" → "张"）
// computed 的好处是 auth.user 变化时会自动重算，不用手动更新
const avatarText = computed(() => auth.user?.username?.charAt(0)?.toUpperCase() || 'U')
// 角色中文名，显示在头像旁边
const roleText = computed(() => {
  const map: Record<string, string> = { user: '普通用户', item_admin: '招领管理员', system_admin: '系统管理员' }
  return map[auth.role] || '用户'
})

// 判断当前菜单项是否应该高亮：
// 首页要精确匹配 '/'，其他页面用 startsWith（这样 /items/3 也能高亮"首页"之外的正确项）
function isActive(path: string) {
  if (path === '/') return route.path === '/'
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

// 退出登录：弹确认框 → 调 store 的 logout 清空状态 → 跳到登录页
async function handleLogout() {
  // await 等待用户点"确定"；如果点取消，confirm 会抛异常，后面的代码不执行
  // try/catch：用户点"取消"时 ElMessageBox 会 reject，捕获掉避免控制台报错
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '再想想'
    })
  } catch {
    return // 点了取消，什么都不做
  }
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <!-- ============ 顶部导航栏 ============ -->
    <header class="header">
      <div class="header-inner">
        <!-- Logo 区：点击回到首页。图标用渐变底 + 内嵌 SVG 放大镜 -->
        <div class="logo" @click="router.push('/')">
          <span class="logo-mark">
            <!-- 直接内嵌 SVG 的好处：能跟着 CSS 变色，也不用额外发请求 -->
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="13.5" r="7" stroke="#fff" stroke-width="2.6" />
              <line x1="19" y1="18.5" x2="24" y2="23.5" stroke="#fff" stroke-width="3" stroke-linecap="round" />
              <path d="M24 7 L25 9.5 L27.5 10 L25 11 L24 13.5 L23 11 L20.5 10 L23 9.5 Z" fill="#fff" fill-opacity="0.95" />
            </svg>
          </span>
          <span class="logo-text">
            <b>校园失物招领</b>
            <i>Lost &amp; Found</i>
          </span>
        </div>

        <!-- 导航菜单：用自定义的 <a> 而不是 el-menu，
             因为 el-menu 的默认样式比较"厚重"，自定义更好控制视觉 -->
        <nav class="nav">
          <a class="nav-item" :class="{ active: isActive('/') }" @click="router.push('/')">
            <el-icon><House /></el-icon><span>首页</span>
          </a>
          <!-- v-if：条件渲染。auth.isLoggedIn 为 true 时这个菜单才显示（未登录时隐藏） -->
          <a v-if="auth.isLoggedIn" class="nav-item" :class="{ active: isActive('/publish') }" @click="router.push('/publish')">
            <el-icon><Plus /></el-icon><span>发布</span>
          </a>
          <a v-if="auth.isLoggedIn" class="nav-item" :class="{ active: isActive('/my/items') }" @click="router.push('/my/items')">
            <el-icon><List /></el-icon><span>我的发布</span>
          </a>
          <a v-if="auth.isLoggedIn" class="nav-item" :class="{ active: isActive('/my/claims') }" @click="router.push('/my/claims')">
            <el-icon><Tickets /></el-icon><span>我的申请</span>
          </a>
          <a class="nav-item" :class="{ active: isActive('/announcements') }" @click="router.push('/announcements')">
            <el-icon><Bell /></el-icon><span>公告</span>
          </a>
          <!-- 只有管理员（item_admin 或 system_admin）才显示"管理后台"入口 -->
          <a v-if="auth.isAdmin" class="nav-item" :class="{ active: isActive('/admin') }" @click="router.push('/admin')">
            <el-icon><Setting /></el-icon><span>管理后台</span>
          </a>
        </nav>

        <!-- 右侧用户区：已登录显示头像下拉菜单，未登录显示"登录/注册"按钮 -->
        <div class="user-area">
          <!-- template 上挂 v-if：一段区域整体条件渲染，不多渲染真实标签 -->
          <template v-if="auth.isLoggedIn && auth.user">
            <!-- el-dropdown：鼠标悬停展开的下拉菜单 -->
            <el-dropdown trigger="click">
              <div class="user-chip">
                <!-- 头像：用 CSS 渐变做底，里面放用户名首字（不用去找头像图片） -->
                <span class="avatar">{{ avatarText }}</span>
                <span class="user-meta">
                  <b>{{ auth.user.username }}</b>
                  <i>{{ roleText }} · UID {{ auth.user.uid }}</i>
                </span>
              </div>
              <!-- #dropdown 是 v-slot:dropdown 的缩写：往下拉菜单"插槽"里放内容 -->
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="List" @click="router.push('/my/items')">我的发布</el-dropdown-item>
                  <el-dropdown-item :icon="Tickets" @click="router.push('/my/claims')">我的申请</el-dropdown-item>
                  <el-dropdown-item v-if="auth.isAdmin" :icon="Setting" @click="router.push('/admin')">管理后台</el-dropdown-item>
                  <!-- divided：在这一项上方加一条分隔线 -->
                  <el-dropdown-item :icon="SwitchButton" divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <!-- v-else：紧跟在 v-if 后面，表示"否则显示这个" -->
            <el-button round @click="router.push('/login')">登录</el-button>
            <el-button type="primary" round @click="router.push('/login')">
              <el-icon style="margin-right: 4px"><User /></el-icon>注册 / 登录
            </el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- ============ 中间内容区 ============ -->
    <!-- <router-view v-slot> 可以拿到当前匹配的组件，从而给它加"切换动画" -->
    <main class="main">
      <router-view v-slot="{ Component }">
        <!-- transition：网址变化时，旧页面淡出、新页面淡入上浮（动画定义在 global.css） -->
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- ============ 页脚 ============ -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="logo-mark small">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="13.5" r="7" stroke="#fff" stroke-width="2.6" />
              <line x1="19" y1="18.5" x2="24" y2="23.5" stroke="#fff" stroke-width="3" stroke-linecap="round" />
            </svg>
          </span>
          <div>
            <b>校园失物招领平台</b>
            <p>让每一件失物都能回家</p>
          </div>
        </div>
        <div class="footer-links">
          <a @click="router.push('/')">首页</a>
          <a @click="router.push('/announcements')">平台公告</a>
          <a @click="router.push('/publish')">发布信息</a>
        </div>
        <div class="footer-tech">
          <span>Vue 3</span><span>TypeScript</span><span>Element Plus</span><span>Node.js</span>
        </div>
      </div>
      <div class="footer-copy">© 2026 校园失物招领平台 · 课程设计作品</div>
    </footer>
  </div>
</template>

<!-- scoped：给样式"加作用域"，这里的 .header 只影响本组件的元素 -->
<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* 页面底色加两团很淡的光晕，避免大片纯色显得单调 */
  background:
    radial-gradient(900px 400px at 12% -80px, rgba(43, 127, 228, 0.07), transparent 70%),
    radial-gradient(700px 360px at 92% 40px, rgba(124, 92, 255, 0.06), transparent 70%),
    var(--bg-page);
}

/* ---------------- 顶部导航 ---------------- */
.header {
  position: sticky; /* 滚动时吸在顶部 */
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.86); /* 半透明白 */
  backdrop-filter: saturate(180%) blur(14px); /* 毛玻璃：模糊背后的内容 */
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid rgba(230, 234, 242, 0.9);
}
.header-inner {
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
  height: 66px;
  padding: 0 20px;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.logo:hover {
  opacity: 0.82;
}
.logo-mark {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-brand);
  flex-shrink: 0;
}
.logo-mark svg {
  width: 24px;
  height: 24px;
}
.logo-mark.small {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  box-shadow: none;
}
.logo-mark.small svg {
  width: 20px;
  height: 20px;
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.logo-text b {
  font-size: 16px;
  color: var(--text-1);
  font-weight: 700;
  letter-spacing: -0.2px;
}
.logo-text i {
  font-style: normal;
  font-size: 10.5px;
  color: var(--text-4);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

/* 导航项 */
.nav {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto; /* 小屏幕上横向滚动而不是换行 */
  scrollbar-width: none;
}
.nav::-webkit-scrollbar {
  display: none;
}
.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 13px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s var(--ease-out);
}
.nav-item:hover {
  color: var(--brand-500);
  background: var(--brand-50);
}
/* .active 是"当前页"高亮，蓝色字 + 淡蓝底 */
.nav-item.active {
  color: var(--brand-600);
  background: var(--brand-50);
  font-weight: 600;
}

/* 右侧用户区 */
.user-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 5px 12px 5px 5px;
  border-radius: var(--radius-full);
  cursor: pointer;
  outline: none;
  transition: background 0.2s;
}
.user-chip:hover {
  background: var(--brand-50);
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--grad-brand);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.user-meta b {
  font-size: 13.5px;
  color: var(--text-1);
  font-weight: 600;
}
.user-meta i {
  font-style: normal;
  font-size: 11px;
  color: var(--text-4);
}

/* ---------------- 内容区 ---------------- */
.main {
  flex: 1;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 26px 20px 40px;
  box-sizing: border-box;
}

/* ---------------- 页脚 ---------------- */
.footer {
  background: linear-gradient(180deg, #1b2435 0%, #141b28 100%);
  color: rgba(255, 255, 255, 0.62);
  margin-top: auto;
  padding: 34px 20px 20px;
}
.footer-inner {
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 28px;
  flex-wrap: wrap;
}
.footer-brand {
  display: flex;
  gap: 12px;
  align-items: center;
}
.footer-brand b {
  color: #fff;
  font-size: 15px;
  display: block;
}
.footer-brand p {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.45);
}
.footer-links {
  display: flex;
  gap: 22px;
}
.footer-links a {
  color: rgba(255, 255, 255, 0.62);
  font-size: 13.5px;
  cursor: pointer;
  transition: color 0.2s;
}
.footer-links a:hover {
  color: #fff;
}
.footer-tech {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.footer-tech span {
  font-size: 11.5px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.72);
}
.footer-copy {
  max-width: 1180px;
  margin: 22px auto 0;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.38);
  text-align: center;
}

/* ---------------- 小屏适配 ---------------- */
@media (max-width: 860px) {
  .header-inner {
    height: auto;
    padding: 10px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }
  /* 小屏隐藏英文副标题和用户文字，只留头像，节省空间 */
  .logo-text i,
  .user-meta {
    display: none;
  }
  .nav {
    order: 3;
    flex-basis: 100%;
    padding-bottom: 4px;
  }
  .main {
    padding: 16px 14px 28px;
  }
}
</style>
