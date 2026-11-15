<script setup>
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, Check, Clock3, Crown, Gauge, RefreshCw, ShieldCheck, Sparkles, Users } from 'lucide-vue-next'
import AppShell from './AppShell.vue'
import { api } from '../api'

const props = defineProps({ user: Object })
defineEmits(['navigate', 'logout'])
const membership = ref(null)
const loading = ref(false)
const message = ref('')
const plans = [
  { id: 'free', name: 'Free', price: '¥0', icon: Sparkles, note: '基础体验', limits: '5 / 15 / 100' },
  { id: 'pro', name: 'Pro', price: '¥39/月', icon: Crown, note: '高频个人创作', limits: '40 / 150 / 2,000' },
  { id: 'team', name: 'Team', price: '¥99/月', icon: Users, note: '团队与实验室', limits: '120 / 500 / 10,000' },
]
const planName = computed(() => plans.find((plan) => plan.id === membership.value?.plan)?.name || 'Free')
const formatDate = (value) => value ? new Date(value).toLocaleDateString('zh-CN') : '长期有效'
const usageRows = computed(() => membership.value ? [
  { key: 'fourHours', label: '最近 4 小时', icon: Clock3 },
  { key: 'day', label: '最近 24 小时', icon: Gauge },
  { key: 'total', label: '当前周期总用量', icon: CalendarDays },
] : [])
const percent = (key) => Math.min(100, Math.round(membership.value.usage.used[key] / membership.value.usage.limits[key] * 100))

async function loadMembership() { loading.value = true; try { membership.value = await api('/subscription') } finally { loading.value = false } }
async function changePlan(plan) {
  loading.value = true; message.value = ''
  try {
    const result = await api('/subscription', { method: 'POST', body: JSON.stringify({ plan: plan.id, billingCycle: 'monthly' }) })
    membership.value = { ...membership.value, ...result }
    message.value = `已切换为 ${plan.name} 套餐，用量周期已重新开始。`
  } finally { loading.value = false }
}
onMounted(loadMembership)
</script>

<template>
  <AppShell :user="user" active="pricing" title="会员中心" subtitle="查看订阅状态、用量与账户权限。" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <main class="membership-page">
      <div v-if="loading && !membership" class="membership-loading"><RefreshCw :size="22" />正在读取会员信息...</div>
      <template v-else-if="membership">
        <section class="member-identity">
          <div class="member-avatar">{{ props.user?.name?.slice(0, 1) }}</div>
          <div><p>ACCOUNT MEMBERSHIP</p><h2>{{ props.user?.name }}</h2><span>{{ props.user?.email }}</span></div>
          <div class="member-id"><small>用户 ID</small><code>{{ membership.user.id }}</code></div>
          <div class="member-plan"><Crown :size="18" /><span><small>当前会员</small><strong>{{ planName }}</strong></span></div>
          <div class="member-expiry"><small>会员到期时间</small><strong>{{ formatDate(membership.expiresAt) }}</strong></div>
        </section>

        <section class="usage-section">
          <div class="section-title"><div><p class="kicker">USAGE CONTROL</p><h2>用量与限制</h2></div><span>每次运行工作流或项目评审消耗 1 次</span></div>
          <div class="usage-grid"><article v-for="row in usageRows" :key="row.key" class="usage-card"><div class="usage-card-head"><span><component :is="row.icon" :size="18" /></span><div><small>{{ row.label }}</small><strong>{{ membership.usage.used[row.key] }} <i>/ {{ membership.usage.limits[row.key] }}</i></strong></div><b>{{ percent(row.key) }}%</b></div><div class="usage-progress"><i :style="{ width: `${percent(row.key)}%` }"></i></div><p>{{ membership.usage.limits[row.key] - membership.usage.used[row.key] }} 次可用</p></article></div>
          <div class="usage-note"><ShieldCheck :size="17" /><span>达到任一时间窗口上限后，系统会暂停新的 AI 评审与工作流运行，窗口重置或升级套餐后恢复。</span></div>
        </section>

        <section class="plan-section">
          <div class="section-title"><div><p class="kicker">PLAN MANAGEMENT</p><h2>调整会员类型</h2></div><span>4 小时 / 24 小时 / 周期总量</span></div>
          <p v-if="message" class="member-message"><Check :size="16" />{{ message }}</p>
          <div class="member-plan-grid"><article v-for="plan in plans" :key="plan.id" :class="{ active: membership.plan === plan.id }"><div class="plan-row"><span><component :is="plan.icon" :size="19" /></span><div><h3>{{ plan.name }}</h3><p>{{ plan.note }}</p></div><strong>{{ plan.price }}</strong></div><div class="plan-limit"><small>用量额度</small><b>{{ plan.limits }}</b></div><button class="button button-wide" :class="membership.plan === plan.id ? 'button-ghost' : 'button-primary'" :disabled="membership.plan === plan.id || loading" @click="changePlan(plan)">{{ membership.plan === plan.id ? '当前套餐' : `切换到 ${plan.name}` }}</button></article></div>
        </section>
      </template>
    </main>
  </AppShell>
</template>
