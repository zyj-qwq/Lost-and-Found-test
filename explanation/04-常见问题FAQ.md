# 04 · 常见问题 FAQ

## 启动和运行

### Q1：怎么启动整个系统？
```bash
# 终端1：先启动后端
cd backend
node src/index.js          # 看到"后端已启动 http://localhost:8080"即成功

# 终端2：再启动前端
cd frontend
npx vite                   # 看到 Local: http://localhost:5173 即成功
```
然后浏览器打开 http://localhost:5173。**内置管理员：uid=10000，密码 admin123。**

### Q2：打开页面全是空白 / 请求报"网络错误"
后端没启动。按 Q1 先启动 `backend`，再刷新页面。后端启动时的黑窗口**不能关**。

### Q3：`npm install` 卡住不动 / 报超时
国内连不上 npm 官方源，必须用镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

### Q4：怎么把数据清空重来？
停掉后端 → 删除 `backend/data/db.json` → 重新启动后端。系统会自动重建一个只有管理员的新库（普通用户需重新注册）。

### Q5：为什么启动命令有时是 `npm run dev` 有时是 `npx vite`？
一样的。`npm run dev` 是执行 package.json 里 scripts.dev 定义的命令，内容就是 `vite`。`npx vite` 是直接调用。

---

## 前端疑问

### Q6：`ref` 的值什么时候要加 `.value`？
- **在 `<script>` 的 JS 代码里**：要加（`list.value = data.list`）
- **在 `<template>` 模板里**：不加（`v-for="item in list"`）
- **在 Pinia store 里返回后**：组件里通过 `auth.user` 用，不加
- 错了的话编辑器/类型检查会提醒你。

### Q7：`@click`、`:src`、`v-model` 分别是什么？
- `@click="fn"` = `v-on:click`，绑定点击事件（等价原生 addEventListener）
- `:src="url"` = `v-bind:src`，冒号表示"引号里是 JS 表达式"，不加冒号就是写死的字符串
- `v-model="x"`，表单双向绑定，输入框和变量同步变化

### Q8：`{{ }}` 和普通文字的区别？
双大括号里是 **JS 表达式**，Vue 会把它的值渲染出来，并且它依赖的数据变化时自动更新。如 `{{ item.title }}`、`{{ formatTime(item.created_at) }}`。

### Q9：为什么修改了代码页面会自动变？
Vite 的热更新（HMR）：保存文件的瞬间，Vite 只把改动的模块推给浏览器替换，不用手动刷新。

### Q10：`@/xxx` 里的 `@` 是什么？
路径别名，代表 `src/` 目录（配置在 vite.config.ts 和 tsconfig.json）。`import auth from '@/stores/auth'` 比相对路径 `../../stores/auth` 好写好读。

### Q11：页面刷新后还保持登录，为什么？
token 存在 localStorage（浏览器本地存储，关浏览器也不丢）。每次打开页面，Pinia store 初始化时会从 localStorage 读回来。点"退出登录"才会清掉。

### Q12：token 无效了为什么会被踢回登录页？
三道机制：① 接口返回 10002 时 axios 响应拦截器清理并跳转；② store 注册了清理回调同步清内存；③ App.vue 启动时调 `auth.init()` 主动校验一次本地 token。

---

## 后端疑问

### Q13：密码在数据库里是乱码？
那是 bcrypt 加密后的哈希，**故意的**。数据库泄露时别人也拿不到明文密码。登录时用 `bcrypt.compareSync(输入的密码, 哈希)` 对比，加密不可逆。

### Q14：中间件是什么？
请求到达最终处理函数**之前**先经过的函数。Express 的路由可以挂多个：
```js
app.get('/admin/users', auth, requireRole('system_admin'), handler)
//                     ↑门卫1：登录了吗   ↑门卫2：角色对吗        ↑真正干活的
```
每个门卫调用 `next()` 放行，或直接 `res.json(...)` 拦截。

### Q15：为什么接口都返回 `{ code, msg, data }` 而不直接返回数据？
统一格式（API.md 的约定），前端可以写一个拦截器统一处理：code=0 剥出 data，code≠0 统一弹错误提示。如果不约定格式，每个接口一个样，前端没法统一处理。

### Q16：为什么 db.json 这种"假数据库"敢用于项目？
课程项目数据量小，JSON 文件 + 内存数组完全够用，且零配置。真实的商用系统会换 MySQL/PostgreSQL（结构化数据）或 MongoDB（文档型），思想相同：**表结构设计、增删改查、表间关联**都一样，只是查询语言从 `filter/find` 换成 SQL。

### Q17：后端返回的错误码有哪些？
| code | 含义 | 前端怎么处理 |
|---|---|---|
| 0 | 成功 | 剥出 data 使用 |
| 10001 | 参数错误 | 弹红色提示 |
| 10002 | 未登录/token 无效 | 清登录状态 + 跳登录页 |
| 10003 | 没有权限 | 弹提示 |
| 10004 | 资源不存在 | 弹提示 |
| 10005 | 资源状态不允许操作 | 弹提示（如重复审核） |
| 10006 | 注册信息不合规 | 弹提示 |
| 10007 | uid 或密码错误 | 弹提示 |
| 10008 | 重复提交 | 弹提示 |
| 20001 | 服务器内部错误 | 弹提示 |

---

## Git 与提交作业

### Q18：怎么把项目提交到 Git 仓库（课程要求有提交记录）？
```bash
cd "Lost and Found"
git init
# 告诉 git 忽略不需要上传的东西
printf 'node_modules/\ndist/\nbackend/data/\nbackend/uploads/\n' > .gitignore
git add .
git commit -m "init: 校园失物招领系统"
# 之后每完成一个功能就 commit 一次，记录会很好看：
git commit -m "feat: 完成信息审核接口"
git commit -m "fix: 修复token失效后仍显示已登录的问题"
```

### Q19：部署上线（把网站给别人访问）大致思路？
1. 前端 `npx vite build` 生成 `dist/` 静态文件；
2. 后端把 8080 跑在一台服务器/云主机上；
3. 用 Nginx 之类把 dist 当静态站点，把 `/api` 反向代理到后端 8080；
4. 把 `index.js` 里写死的 `http://localhost:8080` 图片地址改成真实域名。

这部分是大作业的进阶项，做到"本地能跑通 + Git 记录规范"已经满足课程基本要求。

---

## 学习路线建议（针对你现在的水平）

1. **第一周**：只看 `HomeView.vue` + 本文档 01 篇。理解"数据 → 请求 → 渲染"循环，试着改改页面文字/颜色，看热更新效果。
2. **第二周**：看 `api/index.ts` 和 `stores/auth.ts`，理解请求旅程（02 篇那张流程图）。在浏览器 F12 的 Network 面板观察每个请求。
3. **第三周**：模仿写页面——比如给"我的发布"加一列"联系方式"，只需要在表格里加几行 `el-table-column`。
4. **任何时候卡住**：F12 → Console 看红色报错 → Network 看请求返回的 JSON 是什么 → 大部分问题就能自己定位。

> 调试心法：前端的问题，先看 Console 红字；"数据不对"的问题，去 Network 面板看后端到底返回了什么。这两个面板是前端开发 80% 的答案来源。
