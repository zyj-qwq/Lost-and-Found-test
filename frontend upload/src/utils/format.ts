// ============================================================
// utils/format.ts —— 小工具函数（格式化时间、状态文案映射）
// ============================================================
// 有些代码好几个页面都要用（比如"把时间格式化成 2026-09-23 19:00"），
// 如果每个页面复制一份，改的时候容易漏。所以统一放在 utils 里，
// 谁需要谁 import。
// ============================================================

/**
 * 把 ISO 时间字符串格式化成"2026-09-23 19:00"这种好读的格式
 * 后端返回的时间是 "2026-09-23T11:00:00.000Z" 这样的国际标准格式，
 * 直接显示很难看，所以转一下。
 * @param value 时间字符串；传空返回 '-'（数据还没有时间时显示占位符）
 */
export function formatTime(value?: string): string {
  if (!value) return '-'
  const d = new Date(value) // JS 内置：把字符串解析成日期对象
  if (isNaN(d.getTime())) return value // 解析失败（不是合法时间）就原样返回
  // padStart(2, '0')：补零，比如 9 号显示成 "09"
  const pad = (n: number) => String(n).padStart(2, '0')
  // `${...}` 是模板字符串：把变量拼进字符串
  // 注意月份要 +1：JS 里月份从 0 开始数（0=1月），是个著名的坑
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 状态码 → 中文文案 的映射表。
 * 后端存的是英文状态码（pending/approved...），界面上要显示中文。
 * type 对应 Element Plus 标签的颜色：warning=橙, success=绿, info=灰, danger=红
 * Record<string, T> 是 TS 写法：表示"一个 key 是字符串、value 是 T 的对象"
 */
export const itemStatusMap: Record<string, { label: string; type: 'warning' | 'success' | 'info' | 'danger' }> = {
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已发布', type: 'success' },
  claimed: { label: '已认领', type: 'info' },
  closed: { label: '已关闭', type: 'danger' }
}

// 认领申请的状态映射
export const claimStatusMap: Record<string, { label: string; type: 'warning' | 'success' | 'danger' }> = {
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' }
}

// 角色码 → 中文名映射
export const roleMap: Record<string, string> = {
  user: '普通用户',
  item_admin: '失物招领管理员',
  system_admin: '系统管理员'
}
