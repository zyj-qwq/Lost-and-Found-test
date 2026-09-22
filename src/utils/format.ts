export function formatTime(value?: string): string {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const itemStatusMap: Record<string, { label: string; type: 'warning' | 'success' | 'info' | 'danger' }> = {
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已发布', type: 'success' },
  claimed: { label: '已认领', type: 'info' },
  closed: { label: '已关闭', type: 'danger' }
}

export const claimStatusMap: Record<string, { label: string; type: 'warning' | 'success' | 'danger' }> = {
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' }
}

export const roleMap: Record<string, string> = {
  user: '普通用户',
  item_admin: '失物招领管理员',
  system_admin: '系统管理员'
}
