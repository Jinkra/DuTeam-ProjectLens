<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, CalendarDays, Check, Clock3, CreditCard, Crown, Gauge, LogIn, RefreshCw, ShieldCheck, Sparkles, Users, X } from 'lucide-vue-next'
import PixelCard from './PixelCard.vue'
import SiteFooter from './SiteFooter.vue'
import { api } from '../api'

const props = defineProps({ user: Object })
const emit = defineEmits(['navigate', 'logout', 'auth'])
const membership = ref(null)
const loading = ref(false)
const message = ref('')
const selectedPlan = ref(null)
const billing = ref('monthly')
const plans = [
  { id: 'free', name: 'Free', monthly: 0, yearly: 0, icon: Sparkles, note: '适合体验与轻量课程项目', limits: '5 / 15 / 100', colors: ['#dce9e8', '#b9d5d2', '#6fa9a4'], features: ['基础项目评审', '可视化工作流体验', 'PDF评审报告', '本地项目数据管理'] },
  { id: 'pro', name: 'Pro', monthly: 39, yearly: 29, icon: Crown, note: '适合高频参赛与个人创作', limits: '40 / 150 / 2,000', colors: ['#dfe4ff', '#b8c4ff', '#667be5'], featured: true, features: ['完整Agent工作流', '深度推理3x模式', '知识库与证据链', '高额度PDF报告导出'] },
  { id: 'team', name: 'Team', monthly: 99, yearly: 79, icon: Users, note: '适合团队、实验室与课程班', limits: '120 / 500 / 10,000', colors: ['#e6e0f5', '#cabde9', '#8875be'], features: ['团队共享工作空间', '成员与权限管理', '统一用量管理', '优先模型调用队列'] },
]
const planName = computed(() => plans.find((plan) => plan.id === membership.value?.plan)?.name || 'Free')
const formatDate = (value) => value ? new Date(value).toLocaleDateString('zh-CN') : '长期有效'
const usageRows = computed(() => membership.value ? [
  { key: 'fourHours', label: '最近4小时', icon: Clock3 },
  { key: 'day', label: '最近24小时', icon: Gauge },
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
const priceText = (plan) => plan[billing.value] === 0 ? '¥0' : `¥${plan[billing.value]}`
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
      <section class="membership-intro"><p class="kicker">MEMBERSHIP</p><h1>选择与你的项目节奏匹配的额度</h1><p>所有注册用户默认使用Free会员。套餐额度同时受4小时、24小时与当前周期三档限制。</p></section>
      <div v-if="loading && !membership" class="membership-loading"><RefreshCw :size="22" />正在读取会员信息...</div>
      <section v-else-if="membership" class="member-identity"><div class="member-avatar">{{ props.user?.name?.slice(0, 1) }}</div><div><p>ACCOUNT MEMBERSHIP</p><h2>{{ props.user?.name }}</h2><span>{{ props.user?.email }}</span></div><div class="member-id"><small>用户ID</small><code>{{ membership.user.id }}</code></div><div class="member-plan"><Crown :size="18" /><span><small>当前会员</small><strong>{{ planName }}</strong></span></div><div class="member-expiry"><small>会员到期时间</small><strong>{{ formatDate(membership.expiresAt) }}</strong></div></section>

      <section v-if="membership" class="usage-section"><div class="section-title"><div><p class="kicker">USAGE CONTROL</p><h2>我的用量</h2></div><span>项目助手：快速1x、标准2x、深度3x</span></div><div class="usage-grid"><article v-for="row in usageRows" :key="row.key" class="usage-card"><div class="usage-card-head"><span><component :is="row.icon" :size="18" /></span><div><small>{{ row.label }}</small><strong>{{ membership.usage.used[row.key] }}<i>/{{ membership.usage.limits[row.key] }}</i></strong></div><b>{{ percent(row.key) }}%</b></div><div class="usage-progress"><i :style="{ width: `${percent(row.key)}%` }"></i></div><p>{{ membership.usage.limits[row.key] - membership.usage.used[row.key] }}次可用</p></article></div><div class="usage-note"><ShieldCheck :size="17" /><span>达到任一时间窗口上限后，系统会暂停新的AI评审、项目助手对话与工作流运行。</span></div></section>

      <section class="plan-section"><div class="section-title plan-title-row"><div><p class="kicker">AVAILABLE PLANS</p><h2>会员套餐</h2></div><div class="light-billing-toggle"><button :class="{ active: billing === 'monthly' }" @click="billing = 'monthly'">月付</button><button :class="{ active: billing === 'yearly' }" @click="billing = 'yearly'">年付<span>省24%</span></button></div></div><p v-if="message" class="member-message"><Check :size="16" />{{ message }}</p><div class="member-plan-grid premium-plan-grid"><PixelCard v-for="(plan, index) in plans" :key="plan.id" :colors="plan.colors" :glow-color="plan.colors[2]" :intro-delay="index * 120" :class="{ active: membership?.plan === plan.id, featured: plan.featured }"><div class="commercial-plan-card"><span v-if="plan.featured" class="plan-recommended">最受欢迎</span><div class="commercial-plan-head"><span><component :is="plan.icon" :size="21" /></span><div><h3>{{ plan.name }}</h3><p>{{ plan.note }}</p></div></div><div class="commercial-price"><strong>{{ priceText(plan) }}</strong><span v-if="plan.monthly">/月</span></div><p class="billing-caption">{{ billing === 'yearly' && plan.yearly ? '按年订阅，价格已折算为每月' : plan.id === 'free' ? '永久免费使用' : '按月订阅，随时取消' }}</p><div class="plan-limit"><small>4h / 24h / 周期额度</small><b>{{ plan.limits }}</b></div><ul><li v-for="feature in plan.features" :key="feature"><Check :size="15" />{{ feature }}</li></ul><button class="button button-wide" :class="membership?.plan === plan.id ? 'button-ghost' : 'button-primary'" :disabled="membership?.plan === plan.id" @click.stop="choosePlan(plan)">{{ membership?.plan === plan.id ? '当前套餐' : user ? `选择${plan.name}` : '登录后购买' }}</button></div></PixelCard></div></section>
    </main>
    <SiteFooter />

    <div v-if="selectedPlan" class="modal-backdrop" @click.self="selectedPlan = null"><section class="payment-dialog"><button class="icon-button close-button" title="关闭" @click="selectedPlan = null"><X :size="17" /></button><span class="payment-icon"><CreditCard :size="24" /></span><p class="kicker">ORDER CONFIRMATION</p><h2>确认购买{{ selectedPlan.name }}</h2><div class="payment-summary"><span>套餐</span><strong>{{ selectedPlan.name }}</strong><span>计费周期</span><strong>{{ billing === 'yearly' ? '年付' : '月付' }}</strong><span>支付金额</span><strong>{{ priceText(selectedPlan) }}/月</strong></div><p>支付功能暂未开放，当前操作不会产生扣款。</p><button class="button button-primary button-wide" @click="confirmPayment">确认付款</button></section></div>
  </div>
</template>
