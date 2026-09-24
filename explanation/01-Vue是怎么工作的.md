# 01 · Vue 是怎么工作的（写给只会 HTML/CSS/JS 的你）

> 这个项目里你看到的 `.vue` 文件可能会觉得陌生，其实它就是你已经会的 HTML/CSS/JS 的另一种组织方式。看完这篇你就明白了。

---

## 1. 原生 JS 的痛点：手动操作 DOM

假设你要做一个"点按钮改标题"，用你已经会的原生 JS 是这样写的：

```html
<h1 id="title">你好</h1>
<button onclick="change()">点我</button>

<script>
  function change() {
    // 关键动作：手动找到 DOM 元素 → 手动修改它
    document.getElementById('title').innerText = '世界'
  }
</script>
```

**问题在哪？** 如果这个标题显示在页面的 10 个地方（导航栏、正文、弹窗……），你就得手动改 10 处 DOM。页面一复杂，"数据"和"页面"就会越来越不同步，代码变成一团乱麻。

## 2. Vue 的核心思想：改数据，页面自动变

Vue 把方向反过来：你**只管修改数据**，页面上显示什么由数据"自动"决定。

```html

<h1>{{ title }}</h1>

<button @click="title = '世界'">点我</button>
```

```js
import { ref } from 'vue'
const title = ref('你好') // ref 把普通变量变成"响应式变量"
```

当你执行 `title.value = '世界'` 时，**Vue 会自动把所有用到 title 的地方全部更新**，你一行操作 DOM 的代码都不用写。这就是"响应式"，是 Vue 最重要的一个概念。

> **一句话总结 Vue**：数据是"剧本"，页面是"演出"。你改剧本，演出自动跟着变。

## 3. ref 和 reactive：让变量拥有"魔力"

普通变量改了，页面是**不会**刷新的。必须包一层：

```js
import { ref, reactive } from 'vue'

const count = ref(0)          // 包单个值：数字、字符串、布尔
count.value = 5               // ⚠️ 在 JS 里读写要加 .value

const form = reactive({       // 包对象：直接改属性，不用 .value
  title: '',
  password: ''
})
form.title = '黑色钱包'        // ✅ 直接改

count.value++                 // 改完的瞬间，页面上所有显示 count 的地方自动更新
```

**为什么在 JS 里要 `.value`，模板里又不用？** 这是 Vue 的约定：模板里它自动帮你处理了。记住这个规则就行。

## 4. .vue 文件：一个组件 = HTML + JS + CSS 打包在一起

项目里的每个 `.vue` 文件就是一个"积木块"（组件），最多三块内容：

```vue
<script setup lang="ts">
// ① JS 逻辑：定义数据、函数（setup 表示这里的变量模板里直接能用）
import { ref } from 'vue'
const title = ref('你好')
</script>

<template>
  
  <h1>{{ title }}</h1>
</template>

<style scoped>
/* ③ CSS：scoped 表示这些样式只管这个组件自己，不会污染别的页面 */
h1 { color: red; }
</style>
```

对比原生开发：以前 HTML 归 .html、JS 归 .js、CSS 归 .css，一个功能散在三个文件里；Vue 把**同一个功能的三部分放在一起**，一个文件就是一个完整的功能块。

## 5. 最常用的几个"指令"（Vue 版 HTML 增强）

模板里的 HTML 大部分和原生一样，多了这些 `v-` 开头的写法：

| 写法                  | 作用               | 类比原生 JS                               |
| ------------------- | ---------------- | ------------------------------------- |
| `{{ 变量 }}`          | 把数据显示在页面         | `innerText = x`                       |
| `v-if="条件"`         | 条件满足才渲染这个元素      | `if (...) element.style.display = ''` |
| `v-else`            | 配合 v-if，否则显示     | `else`                                |
| `v-for="x in list"` | 循环生成元素           | `list.map(...)` / 拼字符串循环              |
| `v-model="x"`       | 表单双向绑定           | `input.value = x` + `onchange` 改 x    |
| `@click="fn"`       | 点击事件             | `addEventListener('click', fn)`       |
| `:src="url"`        | 冒号 = 属性值是 JS 表达式 | `element.src = url`                   |

重点解释两个：

**v-model（双向绑定）**——这是表单开发的神器：

```html
<input v-model="username" />

```

**v-for（列表渲染）**——原生你可能这样拼列表：

```js
// 原生：拼接 HTML 字符串再塞进去（累，且要处理转义、事件绑定）
let html = ''
for (const item of list) html += `<div>${item.title}</div>`
container.innerHTML = html
```

```html

<div v-for="item in list" :key="item.id">{{ item.title }}</div>
```

## 6. 组件之间怎么"传话"

- **父传子**：父组件用属性传，子组件用 `defineProps` 接（本项目的列表卡片就是这么传的）。
- **跨层级共享**（比如"登录状态"全站都要用）：用 **Pinia 全局仓库**（见 `stores/auth.ts`）。把登录状态存一处，谁都可以读写，改了所有页面自动更新。

## 7. 路由：页面切换不再"整页跳转"

传统网站每个页面是一个独立 HTML 文件，点链接就整页刷新。这个项目是**单页应用（SPA）**：

- 整个网站其实只有一张 `index.html`；
- 地址变化（`/login` → `/`）时，**vue-router** 负责把对应的页面组件"换"进 `<router-view />` 坑位里显示；
- 页面不整体刷新，所以切换很快。

对应配置都在 `router/index.ts`，里面还有一个"守卫"（beforeEach），在跳转前检查"你登录了吗 / 是不是管理员"，没权限就拦截。

## 8. 发请求：和后端说话

页面数据不是凭空来的，是前端用 HTTP 请求从后端"拿"的（和表单提交一个道理，只是用 JS 发）：

```js
// 项目里封装在 src/api/index.ts，用起来就一行：
const data = await get('/items', { page: 1 })  // 拿列表
await post('/items', { title: '钱包' })         // 提交数据
```

`await` 是等待异步操作完成的语法（替代以前的回调函数 / .then）。所有请求的公共逻辑（自动带登录令牌、统一报错弹窗）写在了"拦截器"里，见 `api/index.ts` 的注释。

## 9. 这个项目一个页面的标准套路

看懂 `HomeView.vue`，就看懂了本项目所有页面：

```
1. 定义响应式数据（list、query、loading）
2. onMounted(() => fetchList())     页面打开 → 自动发请求
3. fetchList() 里：发请求 → 把结果存进 list.value
4. 模板里 v-for 渲染 list
5. 用户点筛选/翻页 → 修改 query → 再调 fetchList
```

**"改数据 → 发请求 → 存回来 → 页面自动变"，所有页面都是这个循环。**

## 10. TypeScript 是什么

就是"带类型标注的 JS"。你在文件里看到的 `ref<Item | null>(null)`、`function f(x: number)` 这些冒号后面的东西，是在告诉编辑器"这个变量应该是什么类型"。它不改变运行逻辑，作用是**拼错字段名、传错参数时直接画红线**，把 bug 拦在运行之前。看不懂类型标注时，把它当空气不影响理解逻辑；但自己写的时候加上，能省很多调试时间。

---

➡️ 下一篇：[02-项目结构与每个文件的作用](./02-项目结构与每个文件的作用.md)
