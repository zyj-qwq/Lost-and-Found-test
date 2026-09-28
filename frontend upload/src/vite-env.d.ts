/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 让 TypeScript 认识 .svg 文件：
// 用 import heroImg from '@/assets/hero-illustration.svg' 引入时，
// Vite 会把它转换成一个"图片网址字符串"，所以要声明它的类型是 string
declare module '*.svg' {
  const src: string
  export default src
}
