<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, CalendarDays, Clock3, Crown, Gauge, RefreshCw, ShieldCheck, Sparkles } from 'lucide-vue-next'
import { api } from '../api'

const props = defineProps({ user: Object })
defineEmits(['navigate'])

const membership = ref(null)
const loading = ref(true)
const error = ref('')

const planDetails = {
  free: { name: 'Free', note: '适合轻量体验与课程项目', tone: 'free' },
  pro: { name: 'Pro', note: '适合高频参赛与个人创作', tone: 'pro' },
  team: { name: 'Team', note: '适合团队、实验室与课程班', tone: 'team' },
}
const currentPlan = computed(() => planDetails[membership.value?.plan] || planDetails.free)
const usageRows = computed(() => membership.value ? [
  { key: 'fourHours', label: '最近4小时', note: '短时高频调用窗口', icon: Clock3 },
  { key: 'day', label: '最近24小时', note: '每日滚动用量', icon: Gauge },
  { key: 'week', label: '最近7天', note: '每周滚动用量', icon: CalendarDays },
  { key: 'month', label: '最近30天', note: '每月滚动用量', icon: Sparkles },
] : [])

function percent(key) {
  const used = membership.value?.usage?.used?.[key] || 0
  const limit = membership.value?.usage?.limits?.[key] || 1
  return Math.min(100, Math.round(used / limit * 100))
}
function usedValue(key) { return membership.value?.usage?.used?.[key] || 0 }
function limitValue(key) { return membership.value?.usage?.limits?.[key] || 0 }
function remaining(key) {
  const used = membership.value?.usage?.used?.[key] || 0
  const limit = membership.value?.usage?.limits?.[key] || 0
  return Math.max(0, limit - used)
}
function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('zh-CN') : '长期有效'
}
async function loadMembership() {
  loading.value = true
  error.value = ''
  try { membership.value = await api('/subscription') }
  catch (requestError) { error.value = requestError.message }
  finally { loading.value = false }
}

onMounted(loadMembership)
</script>

<template>
  <main class="account-membership-page">
    <div v-if="loading" class="account-membership-loading"><RefreshCw class="spin" :size="20" />正在读取会员信息...</div>
    <p v-else-if="error" class="error-banner">{{ error }}</p>
    <template v-else-if="membership">
      <section class="account-membership-hero">
        <div class="account-member-avatar">{{ user?.name?.slice(0, 1) }}</div>
        <div class="account-member-copy"><span>当前账号</span><h1>{{ user?.name }}</h1><p>{{ user?.email }}</p></div>
        <div class="account-member-id"><span>用户ID</span><code>{{ membership.user.id }}</code></div>
        <div class="account-current-plan" :class="currentPlan.tone"><Crown :size="21" /><div><span>当前套餐</span><strong>{{ currentPlan.name }}</strong><small>{{ currentPlan.note }}</small></div></div>
      </section>

      <section class="account-membership-summary">
        <div><span>会员到期时间</span><strong>{{ formatDate(membership.expiresAt) }}</strong></div>
        <div><span>计费周期</span><strong>{{ membership.billingCycle === 'yearly' ? '按年订阅' : membership.plan === 'free' ? '免费方案' : '按月订阅' }}</strong></div>
        <div><span>推理用量倍率</span><strong>快速1x · 标准2x · 深度3x</strong></div>
        <button class="button button-primary" @click="$emit('navigate', 'pricing')">查看与升级套餐<ArrowRight :size="16" /></button>
      </section>

      <section class="account-usage-section">
        <div class="account-section-heading"><div><h2>用量概览</h2><p>所有AI评审、项目助手对话与工作流运行统一计入账户用量。</p></div><button class="icon-button" title="刷新用量" @click="loadMembership"><RefreshCw :size="16" /></button></div>
        <div class="account-usage-grid">
          <article v-for="row in usageRows" :key="row.key" class="account-usage-card">
            <header><span><component :is="row.icon" :size="18" /></span><div><strong>{{ row.label }}</strong><small>{{ row.note }}</small></div><b>{{ percent(row.key) }}%</b></header>
            <div class="account-usage-value"><strong>{{ usedValue(row.key) }}</strong><span>/{{ limitValue(row.key) }}</span></div>
            <div class="account-usage-track"><i :style="{ width: `${percent(row.key)}%` }"></i></div>
            <footer><span>剩余{{ remaining(row.key) }}次</span><em>{{ percent(row.key) >= 80 ? '接近上限' : '额度正常' }}</em></footer>
          </article>
        </div>
      </section>

      <section class="account-usage-note"><ShieldCheck :size="18" /><div><strong>用量按滚动窗口统计</strong><p>达到任一窗口上限后，新的AI任务会暂停；窗口释放或升级套餐后可继续使用。</p></div></section>
    </template>
  </main>
</template>
