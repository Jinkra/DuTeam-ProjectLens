<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, CalendarDays, Check, Clock3, CreditCard, Crown, Gauge, LogIn, RefreshCw, ShieldCheck, Sparkles, Users, X } from 'lucide-vue-next'
import SiteFooter from './SiteFooter.vue'
import { api } from '../api'

const props = defineProps({ user: Object })
const emit = defineEmits(['navigate', 'logout', 'auth'])
const membership = ref(null)
const loading = ref(false)
const message = ref('')
const selectedPlan = ref(null)
const plans = [
  { id: 'free', name: 'Free', price: '¥0', icon: Sparkles, note: '适合体验与轻量课程项目', limits: '5 / 15 / 100' },
  { id: 'pro', name: 'Pro', price: '¥39/月', icon: Crown, note: '适合高频参赛与个人创作', limits: '40 / 150 / 2,000' },
  { id: 'team', name: 'Team', price: '¥99/月', icon: Users, note: '适合团队、实验室与课程班', limits: '120 / 500 / 10,000' },
]
const planName = computed(() => plans.find((plan) => plan.id === membership.value?.plan)?.name || 'Free')
const formatDate = (value) => value ? new Date(value).toLocaleDateString('zh-CN') : '长期有效'
const usageRows = computed(() => membership.value ? [
  { key: 'fourHours', label: '最近 4 小时', icon: Clock3 },
  { key: 'day', label: '最近 24 小时', icon: Gauge },
  { key: 'total', label: '当前周期总用量', icon: CalendarDays },
] : [])
const percent = (key) => Math.min(100, Math.round(membership.value.usage.used[key] / membership.value.usage.limits[key] * 100))

async function loadMembership() {
  if (!props.user) { membership.value = null; return }
  loading.value = true
  try { membership.value = await api('/subscription') } finally { loading.value = false }
}
function choosePlan(plan) {
  message.value = ''
  if (!props.user) { emit('auth', 'login'); return }
  if (membership.value?.plan === plan.id) return
  selectedPlan.value = plan
}
function confirmPayment() {
  selectedPlan.value = null
  message.value = '会员支付功能暂未开放，当前不会产生任何扣款。'
}
watch(() => props.user, loadMembership)
onMounted(loadMembership)
</script>

<template>
  <div class="membership-shell">
    <header class="membership-nav shell-width">
      <button class="portal-logo" @click="$emit('navigate', 'portal')"><span><img src="/brand/brand-mark.png" alt="" /></span><strong>ProjectLens</strong><small>会员中心</small></button>
      <div class="membership-nav-actions"><button class="button button-ghost" @click="$emit('navigate', 'portal')"><ArrowLeft :size="16" />返回首页</button><template v-if="!user"><button class="button button-primary" @click="$emit('auth', 'login')"><LogIn :size="16" />登录后购买</button></template><template v-else><span>{{ user.name }} · {{ planName }}</span><button class="button button-ghost" @click="$emit('logout')">退出登录</button></template></div>
    </header>

    <main class="membership-page">
      <section class="membership-intro"><p class="kicker">MEMBERSHIP</p><h1>选择与你的项目节奏匹配的额度</h1><p>所有注册用户默认使用 Free 会员。套餐额度同时受 4 小时、24 小时与当前周期三档限制。</p></section>
      <div v-if="loading && !membership" class="membership-loading"><RefreshCw :size="22" />正在读取会员信息...</div>
      <section v-else-if="membership" class="member-identity"><div class="member-avatar">{{ props.user?.name?.slice(0, 1) }}</div><div><p>ACCOUNT MEMBERSHIP</p><h2>{{ props.user?.name }}</h2><span>{{ props.user?.email }}</span></div><div class="member-id"><small>用户 ID</small><code>{{ membership.user.id }}</code></div><div class="member-plan"><Crown :size="18" /><span><small>当前会员</small><strong>{{ planName }}</strong></span></div><div class="member-expiry"><small>会员到期时间</small><strong>{{ formatDate(membership.expiresAt) }}</strong></div></section>

      <section v-if="membership" class="usage-section"><div class="section-title"><div><p class="kicker">USAGE CONTROL</p><h2>我的用量</h2></div><span>工作流根据推理等级按倍率消耗额度</span></div><div class="usage-grid"><article v-for="row in usageRows" :key="row.key" class="usage-card"><div class="usage-card-head"><span><component :is="row.icon" :size="18" /></span><div><small>{{ row.label }}</small><strong>{{ membership.usage.used[row.key] }} <i>/ {{ membership.usage.limits[row.key] }}</i></strong></div><b>{{ percent(row.key) }}%</b></div><div class="usage-progress"><i :style="{ width: `${percent(row.key)}%` }"></i></div><p>{{ membership.usage.limits[row.key] - membership.usage.used[row.key] }} 次可用</p></article></div><div class="usage-note"><ShieldCheck :size="17" /><span>达到任一时间窗口上限后，系统会暂停新的 AI 评审与工作流运行。</span></div></section>

      <section class="plan-section"><div class="section-title"><div><p class="kicker">AVAILABLE PLANS</p><h2>会员套餐</h2></div><span>4 小时 / 24 小时 / 周期总量</span></div><p v-if="message" class="member-message"><Check :size="16" />{{ message }}</p><div class="member-plan-grid"><article v-for="plan in plans" :key="plan.id" :class="{ active: membership?.plan === plan.id }"><div class="plan-row"><span><component :is="plan.icon" :size="19" /></span><div><h3>{{ plan.name }}</h3><p>{{ plan.note }}</p></div><strong>{{ plan.price }}</strong></div><div class="plan-limit"><small>4h / 24h / 总用量</small><b>{{ plan.limits }}</b></div><button class="button button-wide" :class="membership?.plan === plan.id ? 'button-ghost' : 'button-primary'" :disabled="membership?.plan === plan.id" @click="choosePlan(plan)">{{ membership?.plan === plan.id ? '当前套餐' : user ? `购买 ${plan.name}` : '登录后购买' }}</button></article></div></section>
    </main>
    <SiteFooter />

    <div v-if="selectedPlan" class="modal-backdrop" @click.self="selectedPlan = null"><section class="payment-dialog"><button class="icon-button close-button" title="关闭" @click="selectedPlan = null"><X :size="17" /></button><span class="payment-icon"><CreditCard :size="24" /></span><p class="kicker">ORDER CONFIRMATION</p><h2>确认购买 {{ selectedPlan.name }}</h2><div class="payment-summary"><span>套餐</span><strong>{{ selectedPlan.name }}</strong><span>支付金额</span><strong>{{ selectedPlan.price }}</strong></div><p>确认后将进入支付流程。演示版本不会发起真实扣款。</p><button class="button button-primary button-wide" @click="confirmPayment">确认付款</button></section></div>
  </div>
</template>
