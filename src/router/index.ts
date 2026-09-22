import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { title: '登录 / 注册' } },
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '首页' } },
    { path: '/items/:id', name: 'item-detail', component: () => import('@/views/ItemDetailView.vue'), meta: { title: '信息详情' } },
    { path: '/publish', name: 'publish', component: () => import('@/views/PublishView.vue'), meta: { title: '发布信息', requiresAuth: true } },
    { path: '/my/items', name: 'my-items', component: () => import('@/views/MyItemsView.vue'), meta: { title: '我的发布', requiresAuth: true } },
    { path: '/my/claims', name: 'my-claims', component: () => import('@/views/MyClaimsView.vue'), meta: { title: '我的申请', requiresAuth: true } },
    { path: '/announcements', name: 'announcements', component: () => import('@/views/AnnouncementsView.vue'), meta: { title: '公告' } },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { title: '数据统计' } },
        { path: 'items', name: 'admin-items', component: () => import('@/views/admin/ItemReview.vue'), meta: { title: '信息审核' } },
        { path: 'claims', name: 'admin-claims', component: () => import('@/views/admin/ClaimReview.vue'), meta: { title: '认领审核' } },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UserManage.vue'), meta: { title: '用户管理', requiresSystemAdmin: true } },
        { path: 'announcements', name: 'admin-announcements', component: () => import('@/views/admin/AnnouncementManage.vue'), meta: { title: '公告管理', requiresSystemAdmin: true } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (to.meta.requiresAuth && !token) {
    ElMessage.warning('请先登录')
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin) {
    const role = user?.role
    if (role !== 'item_admin' && role !== 'system_admin') {
      ElMessage.error('没有权限访问管理后台')
      return { name: 'home' }
    }
  }
  if (to.meta.requiresSystemAdmin && user?.role !== 'system_admin') {
    ElMessage.error('该页面需要系统管理员权限')
    return { name: 'admin-dashboard' }
  }
  document.title = `${to.meta.title || '校园失物招领平台'} - 校园失物招领平台`
  return true
})

export default router
