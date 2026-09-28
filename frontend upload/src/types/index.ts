// ============================================================
// types/index.ts —— TypeScript 类型定义（纯"说明书"，不参与运行）
// ============================================================
// 你写的 JS 里，一个对象想加什么字段就加什么字段，拼错字段名不会报错，
// 要等运行时才发现 bug。TypeScript 的作用就是"提前帮你检查"：
//
//   interface 就是"数据长什么样"的说明书。比如定义了 UserInfo 必须有
//   uid 和 username，那当你写 user.uname（拼错）时，编辑器立刻画红线。
//
// 这些类型和后端 API.md 里的返回格式一一对应，前后端按同一份"合同"开发。
// type 和 interface 差不多；'a' | 'b' 表示"只能是这两个值之一"（联合类型）。
// ============================================================

// 物品类型：lost=失物（我丢了东西），found=拾物（我捡到东西）
export type ItemType = 'lost' | 'found'
// 信息状态：待审核 → 已发布 → 已认领 / 已关闭
export type ItemStatus = 'pending' | 'approved' | 'claimed' | 'closed'
// 认领申请状态：待审核 / 已通过 / 已驳回
export type ClaimStatus = 'pending' | 'approved' | 'rejected'
// 用户角色：普通用户 / 失物招领管理员 / 系统管理员
export type Role = 'user' | 'item_admin' | 'system_admin'
// 用户账号状态：正常 / 禁用
export type UserStatus = 'active' | 'disabled'

// 用户简要信息（信息列表里嵌在每条信息中的发布人）
export interface UserBrief {
  id: number
  username: string
}

// 用户完整信息（/auth/me、/auth/login 返回）
export interface UserInfo {
  uid: number            // 用户编号，注册时后端自动分配，登录用的就是它
  username: string       // 用户名
  contact: string        // 联系方式，注册时填写，发布信息时自动带出
  role: Role             // 角色
  status?: UserStatus    // 带问号 = 可选字段，可能没有
  created_at?: string    // 注册时间
}

// 登录接口的返回值
export interface LoginResult {
  token: string          // 登录令牌，之后每次请求都要带上
  user: UserInfo         // 复用完整的用户信息类型（含联系方式）
}

// 一条失物/拾物信息
export interface Item {
  id: number             // 信息编号
  type: ItemType         // 失物 or 拾物
  title: string          // 标题，如"黑色钱包"
  description: string    // 详细描述
  location: string       // 地点
  lost_at: string        // 丢失/拾获时间
  contact: string        // 联系方式
  images: string[]       // 图片地址数组（string[] = 字符串数组）
  status: ItemStatus     // 当前状态
  uid?: number           // 发布人的 uid
  user?: UserBrief       // 发布人简要信息
  remark?: string        // 管理员审核备注
  created_at: string     // 发布时间
  updated_at?: string    // 最后修改时间
}

// 查询信息列表时可以传的参数（全部可选，所以带 ?）
export interface ItemQuery {
  page?: number          // 第几页（从 1 开始）
  page_size?: number     // 每页几条
  type?: ItemType | ''   // 失物/拾物筛选；'' 表示全部
  keyword?: string       // 关键词，搜标题和描述
  location?: string      // 地点筛选
  status?: ItemStatus | ''
  sort?: string          // 排序方式，latest=最新优先
}

// 一条认领申请
export interface Claim {
  id: number             // 申请编号
  item_id: number        // 认领的是哪条信息
  uid: number            // 申请人 uid
  username: string       // 申请人用户名
  proof: string          // 认领证明（描述物品特征）
  contact: string        // 联系方式
  status: ClaimStatus    // 审核状态
  remark: string         // 管理员备注
  created_at: string     // 申请时间
  item?: Item | null     // 关联的信息（可能已被删除，所以是 null）
}

// 一条公告
export interface Announcement {
  id: number
  title: string
  content: string
  published: boolean     // true=已发布，false=草稿
  created_at: string
  updated_at?: string
}

// 统计数据（管理后台首页卡片）
export interface Statistics {
  total_items: number    // 信息总数
  pending_items: number  // 待审核数
  claimed_items: number  // 已认领数
  total_users: number    // 用户总数
  total_claims: number   // 认领申请总数
}

// 分页返回的统一格式。<T> 是泛型：PageResult<Item> 表示"列表里放的是 Item"
export interface PageResult<T> {
  list: T[]              // 当前页的数据
  total: number          // 总条数（用来算一共几页）
  page: number           // 当前页码
  page_size: number      // 每页条数
}

// 发布/编辑信息时表单的数据
export interface ItemForm {
  type: ItemType
  title: string
  description: string
  location: string
  lost_at: string
  contact: string
  images: string[]
}
