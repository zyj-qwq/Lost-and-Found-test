// ============================================================
// router/index.ts —— 路由配置："网址 → 页面"的对应表
// ============================================================
// 传统多页网站：每点一个链接，浏览器向服务器要一个新 HTML 页面。
// 这个项目是"单页应用(SPA)"：整个网站其实只有一张 index.html，
// 切换页面时只是换了网址、换了显示的组件，不需要重新加载整站。
// "路由"就是负责这件事的模块：监听网址变化 → 显示对应的页面组件。
// ============================================================

import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = createRouter({
  // createWebHistory：网址不带 # 号（如 /items/1），看起来更干净
  history: createWebHistory(),
  // 路由表：每个对象就是一条"网址 → 组件"的规则
  routes: [
    // component: () => import(...) 是"懒加载"写法：
    // 只有用户真的访问到这个网址，浏览器才去下载对应页面的代码（首屏更快）
    // meta：自定义的附加信息，下面的全局守卫会读取它来判断权限
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { title: '登录 / 注册' } },
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '首页' } },
    // :id 是"动态参数"：/items/1、/items/2 都匹配这条规则，组件里用 route.params.id 取值
    { path: '/items/:id', name: 'item-detail', component: () => import('@/views/ItemDetailView.vue'), meta: { title: '信息详情' } },
    // requiresAuth: true 表示"必须登录才能看"，守卫里会检查
    { path: '/publish', name: 'publish', component: () => import('@/views/PublishView.vue'), meta: { title: '发布信息', requiresAuth: true } },
    { path: '/my/items', name: 'my-items', component: () => import('@/views/MyItemsView.vue'), meta: { title: '我的发布', requiresAuth: true } },
    { path: '/my/claims', name: 'my-claims', component: () => import('@/views/MyClaimsView.vue'), meta: { title: '我的申请', requiresAuth: true } },
    { path: '/announcements', name: 'announcements', component: () => import('@/views/AnnouncementsView.vue'), meta: { title: '公告' } },
    // 管理后台：父路由 AdminLayout 是外壳（侧边栏布局），
    // children 是它的子页面，显示在 AdminLayout 内部的 <router-view> 里
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: '数据统计' } }, // /admin 本身
        { path: 'items', name: 'admin-items', component: () => import('@/views/admin/ItemReview.vue'), meta: { title: '信息审核' } }, // /admin/items
        { path: 'claims', name: 'admin-claims', component: () => import('@/views/admin/ClaimReview.vue'), meta: { title: '认领审核' } },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UserManage.vue'), meta: { title: '用户管理', requiresSystemAdmin: true } },
        { path: 'announcements', name: 'admin-announcements', component: () => import('@/views/admin/AnnouncementManage.vue'), meta: { title: '公告管理', requiresSystemAdmin: true } }
      ]
    },
    // 兜底规则：任何没匹配到的网址（:pathMatch(.*)* 是正则通配）都重定向回首页
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// ---- 全局守卫：每次"跳转页面之前"都会执行这里的函数 ----
// 用途：没登录的人不能进需要登录的页面；非管理员不能进管理后台。
// 参数 to 是"要去的那个路由"，to.meta 能拿到上面定义的 meta 信息。
router.beforeEach((to) => {
  // 直接从 localStorage 读（不依赖 store，最保险）
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  // 规则1：页面要求登录，但没登录 → 弹提示，跳到登录页
  // query.redirect 记下"原本想去的页面"，登录成功后能跳回去
  if (to.meta.requiresAuth && !token) {
    ElMessage.warning('请先登录')
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // 规则2：管理后台只有两种管理员能进
  if (to.meta.requiresAdmin) {
    const role = user?.role
    if (role !== 'item_admin' && role !== 'system_admin') {
      ElMessage.error('没有权限访问管理后台')
      return { name: 'home' } // 返回一个地址 = 强制改道（相当于把人拦下来送去别处）
    }
  }
  // 规则3：用户管理、公告管理只有系统管理员能进
  if (to.meta.requiresSystemAdmin && user?.role !== 'system_admin') {
    ElMessage.error('该页面需要系统管理员权限')
    return { name: 'admin-dashboard' }
  }
  // 全部通过：顺便把浏览器标签页的标题改了
  document.title = `${to.meta.title || '校园失物招领平台'} - 校园失物招领平台`
  return true // 返回 true = 放行
})

export default router
