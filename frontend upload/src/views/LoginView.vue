<!-- ============================================================
LoginView.vue —— 登录 / 注册页
============================================================
本页能学到：
  1. ref 和 reactive 的区别：ref 包单个值（用 .value 读写），
     reactive 包一整个对象（直接改属性）。
  2. v-model：表单"双向绑定"——输入框改了，JS 变量跟着变；
     JS 变量改了，输入框也跟着变。不用手写 addEventListener。
  3. 表单校验规则（rules）的使用。

【本次改版说明】
  布局从"居中一张卡片"改成"左右分栏"：
    左边 = 深色渐变品牌面板（介绍 + 插画 + 卖点列表）
    右边 = 白色的表单卡片
  这种左右分栏是 SaaS 登录页最常见的做法，比单卡片显得更正式、
  也能顺手把"这是个什么产品"讲清楚。手机上左栏会自动隐藏。
============================================================ -->

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock, Key, UserFilled, Check, Phone } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { post } from '@/api'
import type { UserInfo } from '@/types'
import heroImg from '@/assets/hero-illustration.svg'

const router = useRouter() // 用来跳转页面
const route = useRoute()   // 用来读网址参数（登录后跳回"原本想去的页面"）
const auth = useAuthStore() // 全局登录状态仓库

// 当前选中的选项卡：'login' 或 'register'。el-tabs 的 v-model 绑定它
const activeTab = ref<'login' | 'register'>('login')

// ---- 登录表单 ----
// reactive 包对象：loginForm.uid、loginForm.password 直接改
const loginForm = reactive({ uid: '', password: '' })
// loginRef 用来拿到表单组件本身（之后调它的 validate 方法做校验）
// ref() 里没给初值，是"模板引用"：模板里 ref="loginRef" 的组件会赋给它
const loginRef = ref<FormInstance>()
// 校验规则：required=必填；trigger:'blur' 表示"光标离开输入框时"校验
const loginRules: FormRules = {
  uid: [{ required: true, message: '请输入 uid', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// ---- 注册表单 ----
const regForm = reactive({ username: '', contact: '', password: '', confirm: '' })
const regRef = ref<FormInstance>()
const regRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    // pattern：正则校验（和原生 JS 的正则一样），限 3-10 位中文/字母/数字
    { pattern: /^[\u4e00-\u9fa5A-Za-z0-9]{3,10}$/, message: '3-10 位中文、字母或数字', trigger: 'blur' }
  ],
  contact: [
    { required: true, message: '请输入联系方式', trigger: 'blur' },
    { max: 100, message: '联系方式不能超过 100 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 位', trigger: 'blur' }
  ],
  // confirm 没有现成规则，用自定义 validator 函数：两次密码必须一致
  confirm: [
    {
      validator: (_rule, value: string, callback) => {
        if (value !== regForm.password) callback(new Error('两次输入的密码不一致'))
        else callback() // callback() 不带参数 = 校验通过
      },
      trigger: 'blur'
    }
  ]
}

const loading = ref(false) // 是否正在请求中（true 时按钮转圈，防止重复点击）
const registeredUid = ref<number | null>(null) // 注册成功后记下分配的 uid

// 左栏的卖点列表（写在 script 里，模板 v-for 循环）
const highlights = [
  '发布失物 / 拾物信息，附图片更直观',
  '管理员人工审核，杜绝虚假信息',
  '在线提交认领申请，全程留痕可追溯',
  '认领通过后自动标记，避免重复认领'
]

// 点击"登录"按钮
async function handleLogin() {
  // 先校验表单，不通过就中断（catch 后 reject，后面的代码不再执行）
  await loginRef.value?.validate().catch(() => Promise.reject())
  loading.value = true
  try {
    // 调 store 的 login（内部会发请求、保存 token），Number() 把字符串转成数字
    await auth.login(Number(loginForm.uid), loginForm.password)
    ElMessage.success('登录成功，欢迎回来')
    // 登录后跳转：如果是因为"没登录被踢过来"的，就回到原来想去的页面；否则回首页
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } finally {
    // finally：无论成功失败都执行，保证按钮不再转圈
    loading.value = false
  }
}

// 点击"注册"按钮
async function handleRegister() {
  await regRef.value?.validate().catch(() => Promise.reject())
  loading.value = true
  try {
    // 发 POST 请求给后端 /auth/register，返回 { username, contact, uid, role }
    const data = await post<UserInfo>('/auth/register', {
      username: regForm.username,
      contact: regForm.contact,
      password: regForm.password
    })
    registeredUid.value = data.uid
    ElMessage.success(`注册成功，你的 uid 是 ${data.uid}`)
    activeTab.value = 'login'      // 自动切到登录选项卡
    loginForm.uid = String(data.uid) // 把 uid 填进登录框，方便用户
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page pf-rise">
    <div class="auth-shell">
      <!-- ============ 左栏：品牌介绍（纯展示） ============ -->
      <aside class="brand-side">
        <span class="brand-blob b1"></span>
        <span class="brand-blob b2"></span>

        <div class="brand-top">
          <span class="brand-logo">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="14" cy="13.5" r="7" stroke="#fff" stroke-width="2.6" />
              <line x1="19" y1="18.5" x2="24" y2="23.5" stroke="#fff" stroke-width="3" stroke-linecap="round" />
              <path d="M24 7 L25 9.5 L27.5 10 L25 11 L24 13.5 L23 11 L20.5 10 L23 9.5 Z" fill="#fff" />
            </svg>
          </span>
          <span class="brand-name">校园失物招领平台</span>
        </div>

        <div class="brand-mid">
          <h2>让每一件失物<br />都能回家</h2>
          <p>丢失物品不求人，拾金不昧好帮手。一个属于我们自己的校园互助平台。</p>

          <ul class="brand-list">
            <li v-for="h in highlights" :key="h">
              <el-icon><Check /></el-icon><span>{{ h }}</span>
            </li>
          </ul>
        </div>

        <!-- 底部插画（半透明做背景装饰） -->
        <img class="brand-art" :src="heroImg" alt="" />
      </aside>

      <!-- ============ 右栏：表单 ============ -->
      <section class="form-side">
        <header class="form-head">
          <h1>{{ activeTab === 'login' ? '欢迎回来' : '创建账号' }}</h1>
          <p>{{ activeTab === 'login' ? '请使用 uid 和密码登录' : '注册后系统会分配一个专属 uid' }}</p>
        </header>

        <!-- v-if="registeredUid"：注册成功后才显示这个绿色提示条 -->
        <el-alert v-if="registeredUid" type="success" :closable="false" show-icon class="uid-tip"
          :title="`注册成功！你的 uid 是 ${registeredUid}，请用 uid + 密码登录`" />

        <!-- 选项卡：v-model 双向绑定 activeTab，点哪个 tab 它就变成对应的名字 -->
        <el-tabs v-model="activeTab" stretch class="tabs">
          <el-tab-pane label="登录" name="login">
            <!-- el-form：:model 绑定数据对象，:rules 绑定校验规则 -->
            <el-form ref="loginRef" :model="loginForm" :rules="loginRules" label-width="0" size="large">
              <!-- prop="uid" 对应 loginRules.uid 这条规则；v-model 绑定输入框的值 -->
              <el-form-item prop="uid">
                <el-input v-model="loginForm.uid" placeholder="uid（注册成功后分配）" clearable :prefix-icon="User" />
              </el-form-item>
              <el-form-item prop="password">
                <!-- @keyup.enter：按下回车键时触发（.enter 是事件修饰符） -->
                <el-input v-model="loginForm.password" type="password" placeholder="密码" show-password
                  :prefix-icon="Lock" @keyup.enter="handleLogin" />
              </el-form-item>
              <!-- :loading="loading"：请求中按钮显示转圈并禁止点击 -->
              <el-button type="primary" class="submit" size="large" :loading="loading" @click="handleLogin">
                登 录
              </el-button>
            </el-form>

            <!-- 小提示：把内置管理员账号写出来，方便演示/评阅 -->
            <div class="helper-tip">
              <span>演示账号</span>
              <code>uid 10000 / admin123</code>
            </div>
          </el-tab-pane>

          <el-tab-pane label="注册" name="register">
            <el-form ref="regRef" :model="regForm" :rules="regRules" label-width="0" size="large">
              <el-form-item prop="username">
                <el-input v-model="regForm.username" placeholder="用户名（3-10 位中文/字母/数字）" clearable :prefix-icon="UserFilled" />
              </el-form-item>
              <el-form-item prop="contact">
                <el-input v-model="regForm.contact" placeholder="联系方式（手机 / 微信 / QQ）" clearable
                  :maxlength="100" :prefix-icon="Phone" />
              </el-form-item>
              <el-form-item prop="password">
                <el-input v-model="regForm.password" type="password" placeholder="密码（6-20 位）" show-password :prefix-icon="Lock" />
              </el-form-item>
              <el-form-item prop="confirm">
                <el-input v-model="regForm.confirm" type="password" placeholder="确认密码" show-password
                  :prefix-icon="Key" @keyup.enter="handleRegister" />
              </el-form-item>
              <el-button type="primary" class="submit" size="large" :loading="loading" @click="handleRegister">
                注 册
              </el-button>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: 10px 0 30px;
}

/* 外层容器：两栏并排，圆角大卡片 */
.auth-shell {
  width: 100%;
  max-width: 940px;
  min-height: 540px;
  display: grid;
  grid-template-columns: 1.05fr 1fr; /* 左栏略宽一点 */
  background: #fff;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(24, 39, 75, 0.14);
  border: 1px solid var(--border-base);
}

/* ---------------- 左栏：品牌面板 ---------------- */
.brand-side {
  position: relative;
  overflow: hidden;
  background: var(--grad-hero);
  color: #fff;
  padding: 34px 32px;
  display: flex;
  flex-direction: column;
}
/* 两个模糊光斑做背景层次 */
.brand-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(46px);
  pointer-events: none;
}
.brand-blob.b1 {
  width: 280px;
  height: 280px;
  top: -110px;
  right: -70px;
  background: rgba(255, 255, 255, 0.3);
}
.brand-blob.b2 {
  width: 240px;
  height: 240px;
  bottom: -100px;
  left: -50px;
  background: rgba(124, 92, 255, 0.55);
}

.brand-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-logo svg {
  width: 22px;
  height: 22px;
}
.brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.brand-mid {
  position: relative;
  z-index: 1;
  margin-top: 40px;
}
.brand-mid h2 {
  color: #fff;
  font-size: 27px;
  line-height: 1.42;
  margin: 0 0 12px;
  letter-spacing: -0.3px;
}
.brand-mid p {
  font-size: 13.5px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.82);
  margin: 0 0 22px;
  max-width: 300px;
}

.brand-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.brand-list li {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.92);
}
/* 每一项前面的勾选小圆点 */
.brand-list .el-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(125, 255, 207, 0.22);
  color: #7dffcf;
  font-size: 11px;
  flex-shrink: 0;
}

/* 底部插画：半透明，作为装饰压在角落 */
.brand-art {
  position: absolute;
  right: -60px;
  bottom: -50px;
  width: 280px;
  opacity: 0.16;
  pointer-events: none;
}

/* ---------------- 右栏：表单 ---------------- */
.form-side {
  padding: 44px 44px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.form-head h1 {
  font-size: 25px;
  margin: 0 0 6px;
  letter-spacing: -0.4px;
}
.form-head p {
  margin: 0 0 22px;
  font-size: 13.5px;
  color: var(--text-3);
}

.tabs :deep(.el-tabs__header) {
  margin-bottom: 22px;
}
.tabs :deep(.el-tabs__item) {
  font-size: 15px;
}

.submit {
  width: 100%;
  margin-top: 6px;
  height: 44px;
  font-size: 15px;
  letter-spacing: 4px;
}
.uid-tip {
  margin-bottom: 16px;
  border-radius: var(--radius-md);
}

/* 演示账号提示条：虚线框 + 等宽字体，和表单区分开 */
.helper-tip {
  margin-top: 18px;
  padding: 11px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-soft);
  border: 1px dashed var(--border-base);
  font-size: 12.5px;
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.helper-tip code {
  font-family: 'SFMono-Regular', Consolas, monospace;
  background: #fff;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  color: var(--brand-600);
  font-size: 12px;
  border: 1px solid var(--border-base);
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 820px) {
  /* 手机上隐藏品牌左栏，只留表单，并把它变成单列 */
  .auth-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .brand-side {
    display: none;
  }
  .form-side {
    padding: 32px 22px 26px;
  }
}
</style>
