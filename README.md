[README.md](https://github.com/user-attachments/files/32755305/README.md)
<div align="center">

# 🔍 校园失物招领平台

**Lost and Found · 让每一件失物都能回家**

一个基于前后端分离架构的校园失物招领系统  
用户发布失物/拾物信息 · 管理员审核 · 线上申请认领

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs\&logoColor=white)

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript\&logoColor=white)

![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite\&logoColor=white)

![Element Plus](https://img.shields.io/badge/Element%20Plus-2.8-409eff?logo=element\&logoColor=white)

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs\&logoColor=white)

![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express\&logoColor=white)

![License](https://img.shields.io/badge/License-MIT-blue.svg)

</div>

---

## 📖 项目简介

在校园里，丢东西和捡东西每天都在发生，但信息散落在各种群聊和表白墙里，很难对接上。

本项目提供一个集中的失物招领平台：**丢东西的人发布失物信息，捡到东西的人发布拾物信息**，双方通过平台联系；为避免虚假信息和恶意认领，所有信息与认领申请都需要**管理员审核**后才生效。

### ✨ 功能亮点

| 模块           | 能力                                          |
| ------------ | ------------------------------------------- |
| 👤 **用户认证**  | 注册自动分配 uid、JWT 登录、密码 bcrypt 加密、token 失效自动登出 |
| 📋 **信息管理**  | 失物/拾物分类发布、多图上传、关键词搜索、地点筛选、分页浏览              |
| 🙋 **认领流程**  | 提交认领证明 → 管理员审核 → 通过后物品自动标记「已认领」             |
| 🛡️ **管理后台** | 信息审核、认领审核、数据统计看板、用户角色管理、公告管理                |
| 🎨 **视觉设计**  | 渐变 Hero 横幅、手写 SVG 插画、卡片悬停动效、响应式栅格、页面切换动画    |
| ⚙️ **工程化**   | TypeScript 全量类型、路由懒加载、权限路由守卫、统一 Axios 拦截器   |
| 📚 **完整文档**  | 4 篇中文文档：Vue 原理入门、项目结构、核心流程、常见问题             |

---

## 🎨 界面预览

前端围绕一套「设计变量」体系构建（`src/styles/theme.css`），所有颜色、圆角、阴影、动效曲线都集中管理，改一处即可全局换肤。

| 页面            | 设计要点                                       |
| ------------- | ------------------------------------------ |
| **首页**        | 渐变 Hero 横幅 + 实时统计数字 + 手绘寻物插画，筛选面板上浮压入横幅    |
| **登录 / 注册**   | 左右分栏：左侧品牌渐变面板（含卖点列表），右侧白色表单卡片              |
| **信息详情**      | 左图右文两栏，左侧 sticky 图片区 + 可切换缩略图，右侧 2×2 关键信息格 |
| **发布信息**      | 左表单 + 右侧**实时预览**，填什么就能看到发出去长什么样            |
| **我的发布 / 申请** | 顶部状态快捷筛选 chip，点一下即按状态过滤                    |
| **管理后台**      | 深色渐变侧边栏 + 图标菜单，数据看板卡片带装饰进度条                |

> 🖼️ **插画均为手写 SVG**（`src/assets/`）：体积极小、放大不糊、颜色与品牌色完全一致，且不依赖外网。

---

## 🏗️ 技术栈

<table>    
<tr>    
<th>层级</th><th>技术选型</th>    
</tr>    
<tr>    
<td><b>前端</b></td>    
<td>

- **Vue 3.5**（组合式 API + `<script setup>`）
- **TypeScript 5.6**（全量类型约束，`vue-tsc` 零错误）
- **Vue Router 4**（路由懒加载 + 权限守卫）
- **Pinia 2**（登录状态全局管理）
- **Element Plus 2.8**（UI 组件库）
- **Axios**（请求封装 + 拦截器）
- **Vite 5**（开发服务器 + 构建）

</td>    
</tr>    
<tr>    
<td><b>后端</b></td>    
<td>

- **Node.js 22** + **Express 4**
- **JSON Web Token**（登录鉴权）
- **bcryptjs**（密码哈希）
- **Multer**（图片上传）
- **CORS**（跨域支持）

</td>    
</tr>    
<tr>    
<td><b>数据层</b></td>    
<td>JSON 文件存储（\\\`backend/data/db.json\\\`）—— 零配置，打开文件即可查看全部数据</td>    
</tr>    
</table>

---

## 🚀 快速开始

### ⚡ 最省事：一键启动

**Windows 用户**：直接双击项目根目录的 **`启动.bat`**  
**Mac / Linux 用户**：终端里执行 `bash 启动.sh`

脚本会自动做完这些事：清掉占用的旧端口 → 启动后端(8080) → 启动前端(5173) → 自动打开浏览器。**弹出的两个命令行窗口不要关**，关了服务就停了；想停止服务就把两个窗口都关掉。

> 第一次使用需要先做下面的「安装依赖」，依赖装好后以后每次都只需双击。

### 环境要求

- **Node.js** ≥ 18（推荐 22）
- **npm** ≥ 9

### 1️⃣ 安装依赖

> ⚠️ 如果 npm 官方源访问缓慢，请务必加上镜像参数 `--registry=https://registry.npmmirror.com`

```bash
# 安装前端依赖
cd frontend
npm install --registry=https://registry.npmmirror.com

# 安装后端依赖
cd ../backend
npm install --registry=https://registry.npmmirror.com
```

### 2️⃣ 启动后端（端口 8080）

```bash
cd backend
node src/index.js
```

看到以下输出即为成功：

```
失物招领系统后端已启动: http://localhost:8080
内置系统管理员: uid=10000 密码=admin123
```

### 3️⃣ 启动前端（端口 5173）

**另开一个终端**：

```bash
cd frontend
npx vite
```

### 4️⃣ 打开浏览器

访问 👉 **<http://localhost:5173>**

> 💡 两个服务必须**同时**运行：后端（8080）提供数据接口，前端（5173）显示页面。  
> 只开一个的话，浏览器里要么打不开页面，要么页面能显示但列表是空的（因为拿不到数据）。

### 🔑 内置账号

| 角色    | 账号           | 密码         | 说明        |
| ----- | ------------ | ---------- | --------- |
| 系统管理员 | uid: `10000` | `admin123` | 可访问全部管理功能 |

> 普通用户请点击「注册」，系统会自动分配一个 uid（从 10001 开始），**请牢记该 uid，登录时使用 uid + 密码**。

---

## 📁 项目结构

```
Lost and Found/
├── 启动.bat                    ⚡ Windows 一键启动（双击即用）
├── 启动.sh                     ⚡ Mac / Linux 一键启动
│
├── backend/                    🔧 后端服务（Node.js + Express）
│   ├── src/
│   │   ├── index.js              服务器主文件：全部接口实现（含详细注释）
│   │   └── db.js                 JSON 文件数据库封装
│   ├── data/db.json              数据文件（删除后重启即可重置系统）
│   ├── uploads/                  用户上传的图片
│   └── package.json
│
├── frontend/                   🎨 前端主工程（Vue 3 + TypeScript）
│   ├── index.html                单页应用入口（含 favicon / SEO 元信息）
│   ├── vite.config.ts            构建配置（@ 别名 + /api 代理）
│   ├── tsconfig.json
│   ├── public/
│   │   └── logo.svg              浏览器标签页图标
│   └── src/
│       ├── main.ts               应用入口：装插件、挂载
│       ├── App.vue               根组件：导航栏 + router-view + 页脚
│       ├── api/index.ts          Axios 封装（自动带 token、统一错误处理）
│       ├── router/index.ts       路由表 + 权限守卫
│       ├── stores/auth.ts        登录状态仓库（Pinia）
│       ├── types/index.ts        TypeScript 类型定义
│       ├── utils/format.ts       时间格式化、状态文案映射
│       ├── styles/               🎨 设计系统
│       │   ├── theme.css           设计变量：配色 / 圆角 / 阴影 / 动效曲线
│       │   └── global.css          基础重置 + 通用工具类 + 组件库微调
│       ├── assets/               🖼️ 手写 SVG 插画
│       │   ├── hero-illustration.svg  首页横幅 & 登录页品牌图
│       │   └── empty-box.svg          空状态占位图
│       └── views/                页面组件
│           ├── LoginView.vue         登录 / 注册（左右分栏）
│           ├── HomeView.vue          首页：Hero + 列表 + 搜索 + 筛选
│           ├── ItemDetailView.vue    详情（左图右文）+ 认领申请
│           ├── PublishView.vue       发布信息 + 图片上传 + 实时预览
│           ├── MyItemsView.vue       我的发布（状态快捷筛选）
│           ├── MyClaimsView.vue      我的认领申请
│           ├── AnnouncementsView.vue 公告
│           └── admin/                管理后台（6 个页面）
│
├── frontend-min/               📦 前端精简版（仅源码，用于交付/备份）
├── frontend-simple/            🪶 极简版（单个 HTML 文件，CDN 引入 Vue）
│   └── index-simple.html         打开即用，无需构建
├── explanation/                📚 中文说明文档（推荐阅读）
│   ├── 01-Vue是怎么工作的.md
│   ├── 02-项目结构与每个文件的作用.md
│   ├── 03-核心流程图解.md
│   └── 04-常见问题FAQ.md
└── README.md                   📄 项目说明（本文件）
```

---

## 🔄 系统流程

### 信息生命周期

```
  用户发布           管理员审核          他人申请认领        管理员审核
 ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
 │ pending │ ───► │ approved │ ───► │ approved │ ───► │ claimed  │
 │ 待审核  │      │  已发布  │      │ 已有申请 │      │ 已认领   │
 └─────────┘      └──────────┘      └──────────┘      └──────────┘
      │                  │
      │ 管理员驳回        │ 管理员关闭
      ▼                  ▼
 ┌─────────────────────────────┐
 │          closed 已关闭        │
 └─────────────────────────────┘
```

### 一次请求的完整旅程

```
浏览器访问 / 首页
   │
   ▼
路由匹配 → HomeView.vue
   │
   ▼
onMounted → fetchList() → get('/items', params)
   │
   ▼
请求拦截器：自动从 localStorage 取 token 塞进请求头
   │
   ▼
Vite 代理：/api/* → http://localhost:8080（解决跨域）
   │
   ▼
后端路由匹配 → auth 中间件校验 token → requireRole 校验角色 → 业务处理
   │
   ▼
返回 { code: 0, msg: 'success', data: {...} }
   │
   ▼
响应拦截器：code=0 剥出 data；code=10002 清理登录状态并跳登录页
   │
   ▼
存入响应式变量 → 模板自动重新渲染 → 用户看到列表
```

---

## 👥 角色与权限

| 功能                 |  游客 | 普通用户 | 招领管理员 | 系统管理员 |
| ------------------ | :-: | :--: | :---: | :---: |
| 浏览信息 / 公告          |  ✅  |   ✅  |   ✅   |   ✅   |
| 注册 / 登录            |  ✅  |   ✅  |   ✅   |   ✅   |
| 发布 / 编辑 / 删除自己的信息  |  ❌  |   ✅  |   ✅   |   ✅   |
| 申请认领物品             |  ❌  |   ✅  |   ✅   |   ✅   |
| 查看「我的发布 / 我的申请」    |  ❌  |   ✅  |   ✅   |   ✅   |
| 信息审核 / 认领审核 / 数据统计 |  ❌  |   ❌  |   ✅   |   ✅   |
| 用户管理 / 公告管理        |  ❌  |   ❌  |   ❌   |   ✅   |

> **安全设计**：前端通过路由守卫和 `v-if` 控制入口，后端通过 `auth` + `requireRole` 中间件二次校验。前端防君子，后端防小人。

---

## 📡 接口概览

统一前缀 `/api/v1`，统一响应格式 `{ code, msg, data }`，需要登录的接口携带 `Authorization: Bearer <token>`。

<details>

<summary><b>点击展开全部接口</b></summary>

### 用户与认证

| 方法     | 路径               | 说明     | 权限 |
| ------ | ---------------- | ------ | -- |
| `POST` | `/auth/register` | 用户注册   | 公开 |
| `POST` | `/auth/login`    | 用户登录   | 公开 |
| `GET`  | `/auth/me`       | 获取当前用户 | 登录 |

### 失物与拾物信息

| 方法       | 路径           | 说明               | 权限 |
| -------- | ------------ | ---------------- | -- |
| `GET`    | `/items`     | 信息列表（支持搜索/筛选/分页） | 公开 |
| `GET`    | `/items/:id` | 信息详情             | 公开 |
| `POST`   | `/items`     | 发布信息             | 登录 |
| `PUT`    | `/items/:id` | 修改自己的信息          | 登录 |
| `DELETE` | `/items/:id` | 删除自己的信息          | 登录 |
| `GET`    | `/me/items`  | 我发布的信息           | 登录 |

### 图片上传

| 方法     | 路径        | 说明                      | 权限 |
| ------ | --------- | ----------------------- | -- |
| `POST` | `/upload` | 上传图片（jpg/png/webp，≤5MB） | 登录 |

### 认领申请

| 方法     | 路径                  | 说明      | 权限  |
| ------ | ------------------- | ------- | --- |
| `POST` | `/items/:id/claims` | 提交认领申请  | 登录  |
| `GET`  | `/me/claims`        | 我提交的申请  | 登录  |
| `GET`  | `/admin/claims`     | 待处理申请列表 | 管理员 |
| `PUT`  | `/admin/claims/:id` | 审核认领申请  | 管理员 |

### 管理功能

| 方法    | 路径                  | 说明        | 权限    |
| ----- | ------------------- | --------- | ----- |
| `GET` | `/admin/items`      | 信息审核列表    | 管理员   |
| `PUT` | `/admin/items/:id`  | 审核信息      | 管理员   |
| `GET` | `/admin/users`      | 用户列表      | 系统管理员 |
| `PUT` | `/admin/users/:id`  | 修改用户角色/状态 | 系统管理员 |
| `GET` | `/admin/statistics` | 统计数据      | 管理员   |

### 公告

| 方法       | 路径                         | 说明   | 权限    |
| -------- | -------------------------- | ---- | ----- |
| `GET`    | `/announcements`           | 公告列表 | 公开    |
| `POST`   | `/admin/announcements`     | 新建公告 | 系统管理员 |
| `PUT`    | `/admin/announcements/:id` | 修改公告 | 系统管理员 |
| `DELETE` | `/admin/announcements/:id` | 删除公告 | 系统管理员 |

</details>

<details>

<summary><b>错误码对照表</b></summary>

| 错误码     | 含义          |
| ------- | ----------- |
| `0`     | 成功          |
| `10001` | 参数错误        |
| `10002` | 未登录或令牌无效    |
| `10003` | 没有权限        |
| `10004` | 资源不存在       |
| `10005` | 资源状态不允许当前操作 |
| `10006` | 注册信息不符合规范   |
| `10007` | uid 或密码错误   |
| `10008` | 重复提交        |
| `20001` | 服务器内部错误     |

</details>

---

## 🛠️ 常用命令

```bash
# ---- 开发 ----
cd backend  && node src/index.js    # 启动后端（8080）
cd frontend && npx vite             # 启动前端（5173）

# ---- 构建与检查 ----
cd frontend
npx vue-tsc --noEmit                # TypeScript 类型检查
npx vite build                      # 打包到 dist/
npx vite preview                    # 预览打包结果

# ---- 环境维护 ----
# 重置全部数据（删库重启，会重建内置管理员）
rm backend/data/db.json && cd backend && node src/index.js
```


```

---

## ❓ 常见问题

<details>

<summary><b>页面空白 / 提示「网络错误」？</b></summary>

后端没有启动。先运行 `cd backend && node src/index.js`，并保持该终端窗口开启。

</details>

<details>

<summary><b>npm install 卡住不动？</b></summary>

国内网络访问 npm 官方源较慢，请使用镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

</details>

<details>

<summary><b>怎么把数据清空重新开始？</b></summary>

停掉后端 → 删除 `backend/data/db.json` → 重启后端。系统会自动重建数据库和内置管理员。

</details>

<details>

<summary><b>不想装 Node 环境，能用前端吗？</b></summary>

可以试试 `frontend-simple/index-simple.html` —— 这是用 CDN 引入 Vue 的单文件极简版，直接用浏览器打开即可（后端仍需运行在 8080）。

</details>

<details>

<summary><b>更多问题？</b></summary>

请阅读 [`explanation/04-常见问题FAQ.md`](./explanation/04-常见问题FAQ.md)。

</details>

---


## 🗺️ 后续可扩展方向

- [ ] 接入真实数据库（MySQL / PostgreSQL / MongoDB）替换 JSON 文件
- [ ] 站内消息通知：认领进度、审核结果实时提醒
- [ ] 图片压缩与 CDN 存储（对象存储）
- [ ] 信息自动过期归档
- [ ] 微信小程序端
- [ ] 单元测试与 CI 流水线

---

<div align="center">

**如果这个项目对你有帮助，欢迎点个 ⭐ Star**

Made with ❤️ for campus

</div>
