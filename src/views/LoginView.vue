<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { post } from '@/api'
import type { UserInfo } from '@/types'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const activeTab = ref<'login' | 'register'>('login')

const loginForm = reactive({ uid: '', password: '' })
const loginRef = ref<FormInstance>()
const loginRules: FormRules = {
  uid: [{ required: true, message: '请输入 uid', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const regForm = reactive({ username: '', password: '', confirm: '' })
const regRef = ref<FormInstance>()
const regRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5A-Za-z0-9]{3,10}$/, message: '3-10 位中文、字母或数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 位', trigger: 'blur' }
  ],
  confirm: [
    {
      validator: (_rule, value: string, callback) => {
        if (value !== regForm.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

const loading = ref(false)
const registeredUid = ref<number | null>(null)

async function handleLogin() {
  await loginRef.value?.validate().catch(() => Promise.reject())
  loading.value = true
  try {
    await auth.login(Number(loginForm.uid), loginForm.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  await regRef.value?.validate().catch(() => Promise.reject())
  loading.value = true
  try {
    const data = await post<UserInfo>('/auth/register', { username: regForm.username, password: regForm.password })
    registeredUid.value = data.uid
    ElMessage.success(`注册成功，你的 uid 是 ${data.uid}，请牢记`)
    activeTab.value = 'login'
    loginForm.uid = String(data.uid)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <div class="card-title">
          <h2>欢迎使用校园失物招领平台</h2>
          <p>丢失物品不求人，拾金不昧好帮手</p>
        </div>
      </template>
      <el-alert v-if="registeredUid" type="success" :closable="false" show-icon class="uid-tip"
        :title="`注册成功！你的 uid 是 ${registeredUid}，请用 uid + 密码登录`" />
      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="登录" name="login">
          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" label-width="0" size="large">
            <el-form-item prop="uid">
              <el-input v-model="loginForm.uid" placeholder="uid（注册成功后分配）" clearable />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="密码" show-password
                @keyup.enter="handleLogin" />
            </el-form-item>
            <el-button type="primary" class="submit" :loading="loading" @click="handleLogin">登 录</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form ref="regRef" :model="regForm" :rules="regRules" label-width="0" size="large">
            <el-form-item prop="username">
              <el-input v-model="regForm.username" placeholder="用户名（3-10 位中文/字母/数字）" clearable />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="regForm.password" type="password" placeholder="密码（6-20 位）" show-password />
            </el-form-item>
            <el-form-item prop="confirm">
              <el-input v-model="regForm.confirm" type="password" placeholder="确认密码" show-password
                @keyup.enter="handleRegister" />
            </el-form-item>
            <el-button type="primary" class="submit" :loading="loading" @click="handleRegister">注 册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.login-page { display: flex; justify-content: center; padding: 60px 0; }
.login-card { width: 420px; }
.card-title h2 { margin: 0; font-size: 20px; }
.card-title p { margin: 6px 0 0; color: #909399; font-size: 13px; }
.submit { width: 100%; margin-top: 4px; }
.uid-tip { margin-bottom: 12px; }
</style>
