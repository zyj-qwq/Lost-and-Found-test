// 与后端 API.md 对应的类型定义
export type ItemType = 'lost' | 'found'
export type ItemStatus = 'pending' | 'approved' | 'claimed' | 'closed'
export type ClaimStatus = 'pending' | 'approved' | 'rejected'
export type Role = 'user' | 'item_admin' | 'system_admin'
export type UserStatus = 'active' | 'disabled'

export interface UserBrief {
  id: number
  username: string
}

export interface UserInfo {
  uid: number
  username: string
  role: Role
  status?: UserStatus
  created_at?: string
}

export interface LoginResult {
  token: string
  user: {
    username: string
    uid: number
    role: Role
  }
}

export interface Item {
  id: number
  type: ItemType
  title: string
  description: string
  location: string
  lost_at: string
  contact: string
  images: string[]
  status: ItemStatus
  uid?: number
  user?: UserBrief
  remark?: string
  created_at: string
  updated_at?: string
}

export interface ItemQuery {
  page?: number
  page_size?: number
  type?: ItemType | ''
  keyword?: string
  location?: string
  status?: ItemStatus | ''
  sort?: string
}

export interface Claim {
  id: number
  item_id: number
  uid: number
  username: string
  proof: string
  contact: string
  status: ClaimStatus
  remark: string
  created_at: string
  item?: Item | null
}

export interface Announcement {
  id: number
  title: string
  content: string
  published: boolean
  created_at: string
  updated_at?: string
}

export interface Statistics {
  total_items: number
  pending_items: number
  claimed_items: number
  total_users: number
  total_claims: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  page_size: number
}

export interface ItemForm {
  type: ItemType
  title: string
  description: string
  location: string
  lost_at: string
  contact: string
  images: string[]
}
