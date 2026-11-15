<script setup>
import { reactive, ref, watch } from 'vue'
import { ArrowRight, X } from 'lucide-vue-next'
import { api } from '../api'
const props = defineProps({ initialMode: { type: String, default: 'login' } })
const emit = defineEmits(['close', 'authenticated'])
const mode = ref(props.initialMode)
const form = reactive({ name: '', email: '', password: '' })
const loading = ref(false); const error = ref('')
watch(() => props.initialMode, (value) => { mode.value = value })
async function submit() {
  loading.value = true; error.value = ''
  try {
    const data = await api(mode.value === 'login' ? '/auth/login' : '/auth/register', { method: 'POST', body: JSON.stringify(form) })
    emit('authenticated', data)
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
</script>
<template>
  <div class="modal-backdrop auth-backdrop" @click.self="$emit('close')">
    <form class="auth-dialog" @submit.prevent="submit">
      <button type="button" class="icon-button close-button" title="关闭" @click="$emit('close')"><X :size="20" /></button>
      <div class="auth-brand"><span><img src="/brand/brand-mark.png" alt="" /></span>ProjectLens</div>
      <div class="auth-heading"><p class="kicker">{{ mode === 'login' ? 'Welcome back' : 'Create your workspace' }}</p><h2>{{ mode === 'login' ? '登录到工作空间' : '开始构建你的 AI 工作流' }}</h2><p>{{ mode === 'login' ? '继续管理项目评审与自动化流程。' : '免费创建账号，无需绑定支付方式。' }}</p></div>
      <label v-if="mode === 'register'">姓名<input v-model="form.name" required placeholder="你的姓名" /></label>
      <label>邮箱<input v-model="form.email" type="email" required placeholder="name@example.com" /></label>
      <label>密码<input v-model="form.password" type="password" required minlength="6" placeholder="至少 6 位" /></label>
      <p v-if="error" class="error-message">{{ error }}</p>
      <button class="button button-dark button-wide" :disabled="loading">{{ loading ? '处理中...' : mode === 'login' ? '登录' : '免费注册' }}<ArrowRight :size="17" /></button>
      <button type="button" class="switch-auth" @click="mode = mode === 'login' ? 'register' : 'login'; error = ''">{{ mode === 'login' ? '还没有账号？免费注册' : '已有账号？直接登录' }}</button>
    </form>
  </div>
</template>
