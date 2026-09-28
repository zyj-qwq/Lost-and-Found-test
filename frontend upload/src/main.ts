// ============================================================
// main.ts —— 整个前端的"总入口"
// ============================================================
// 类比你熟悉的 HTML：<script src="xxx.js"> 是整个页面的入口。
// 在 Vue 项目里，main.ts 就是那个入口：它创建"应用"、
// 安装各种插件，最后把应用挂载到 index.html 的 <div id="app"> 上。
//
// TS 提示：.ts 是 TypeScript 文件，就是"带类型标注的 JavaScript"。
// 浏览器不认识 TS，Vite 会在开发时自动编译成 JS（你不用管）。
// ============================================================

// 1. 从 vue 包里导入"创建应用"的函数（ES6 的 import 语法，和原生 JS 模块一样）
import { createApp } from 'vue'

// 2. 导入 Pinia —— "全局状态管理库"，存放多个页面共享的数据（比如登录状态）
import { createPinia } from 'pinia'

// 3. 导入 Element Plus：一个现成的 UI 组件库，el-button、el-table 这些标签都来自它
//    （相当于别人写好的一大堆 CSS + JS 组件，直接拿来用）
import ElementPlus from 'element-plus'
// 4. Element Plus 的中文语言包（让分页按钮显示"上一页"而不是英文）
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 5. Element Plus 的样式文件（必须引入，否则组件没有样式）
import 'element-plus/dist/index.css'

// 5.1 我们自己写的全局样式（必须放在 element-plus 样式"之后"，
//     因为后引入的样式优先级更高，才盖得住组件库的默认外观）
import './styles/theme.css'  // 设计变量：颜色、圆角、阴影
import './styles/global.css' // 基础重置 + 通用类 + 组件微调

// 6. 导入根组件 App.vue（整个页面的"外壳"）
import App from './App.vue'
// 7. 导入路由配置（决定"网址 → 页面"的对应关系）
import router from './router'

// ---- 下面是真正的启动流程 ----

// 创建一个 Vue 应用实例，根组件是 App.vue
const app = createApp(App)

// 安装 Pinia 插件（之后任何组件里都能用 useAuthStore() 拿到登录状态）
app.use(createPinia())

// 安装路由插件（之后 <router-view> 和路由跳转才能工作）
app.use(router)

// 安装 Element Plus，并设置语言为简体中文
app.use(ElementPlus, { locale: zhCn })

// 把应用挂载到 index.html 里那个 <div id="app"></div> 上
// 从这一刻起，Vue 接管了这个 div 里面的所有内容
app.mount('#app')
