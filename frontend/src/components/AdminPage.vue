<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Activity, ArrowLeft, Crown, KeyRound, LayoutDashboard, LockKeyhole, LogOut, RefreshCw, Save, Search, ShieldCheck, Trash2, UserRoundCheck, Users, X } from 'lucide-vue-next'
import SiteFooter from './SiteFooter.vue'
import { api } from '../api'

const props = defineProps({ user: Object })
const emit = defineEmits(['navigate', 'logout', 'authenticated'])
const overview = ref(null)
const query = ref('')
const error = ref('')
const saving = ref('')
const pendingChanges = ref({})
const saveMessage = ref('')
const username = ref('admin')
const password = ref('')
const loggingIn = ref(false)
const localAdmin = ref(null)
const passwordUser = ref(null)
const newPassword = ref('')
const confirmPassword = ref('')
const admin = computed(() => props.user?.role === 'admin' ? props.user : localAdmin.value)
const filteredUsers = computed(() => (overview.value?.users || []).filter((user) => `${user.name}${user.email}${user.id}`.toLowerCase().includes(query.value.toLowerCase())))
const dateText = (value) => value ? new Date(value).toLocaleDateString('zh-CN') : '长期有效'

async function load() {
  if (!admin.value) return
  error.value = ''
  try { overview.value = await api('/admin/overview') } catch (e) { error.value = e.message }
}
async function loginAdmin() {
  loggingIn.value = true; error.value = ''
  try {
    const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: username.value, password: password.value }) })
    if (result.user.role !== 'admin') throw new Error('该账号没有管理后台权限。')
    localAdmin.value = result.user
    emit('authenticated', result)
    await load()
  } catch (e) { error.value = e.message } finally { loggingIn.value = false }
}
async function updateUser(user, changes) {
  saving.value = user.id
  error.value = ''
  try { const updated = await api(`/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(changes) }); overview.value.users = overview.value.users.map((item) => item.id === user.id ? updated : item) } catch (e) { error.value = e.message } finally { saving.value = '' }
}
function openPasswordDialog(user) {
  passwordUser.value = user
  newPassword.value = ''
  confirmPassword.value = ''
  error.value = ''
}
function closePasswordDialog() { passwordUser.value = null }
async function changePassword() {
  if (newPassword.value.length < 6) return (error.value = '新密码不能少于6位。')
  if (newPassword.value !== confirmPassword.value) return (error.value = '两次输入的密码不一致。')
  await updateUser(passwordUser.value, { password: newPassword.value })
  if (!error.value) { saveMessage.value = `已修改${passwordUser.value.name}的密码。`; closePasswordDialog() }
}
async function deleteUser(user) {
  if (user.id === admin.value.id) return (error.value = '不能删除当前登录的管理员账号。')
  if (!window.confirm(`确定删除用户“${user.name}”吗？该用户的项目数据也会一并删除，此操作不可撤销。`)) return
  saving.value = user.id; error.value = ''; saveMessage.value = ''
  try {
    await api(`/admin/users/${user.id}`, { method: 'DELETE' })
    delete pendingChanges.value[user.id]
    await load()
    saveMessage.value = `已删除用户${user.name}。`
  } catch (e) { error.value = e.message } finally { saving.value = '' }
}
function stageUser(user, changes) {
  overview.value.users = overview.value.users.map((item) => item.id === user.id ? { ...item, ...changes } : item)
  pendingChanges.value = { ...pendingChanges.value, [user.id]: { ...(pendingChanges.value[user.id] || {}), ...changes } }
  saveMessage.value = ''
}
async function saveChanges() {
  const entries = Object.entries(pendingChanges.value)
  if (!entries.length) return
  saving.value = 'all'; error.value = ''; saveMessage.value = ''
  try {
    for (const [id, changes] of entries) {
      const updated = await api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(changes) })
      overview.value.users = overview.value.users.map((item) => item.id === id ? updated : item)
    }
    pendingChanges.value = {}
    saveMessage.value = `已保存${entries.length}位用户的更改。`
  } catch (e) { error.value = e.message } finally { saving.value = '' }
}
function leaveAdmin() { localAdmin.value = null; emit('logout') }
watch(admin, load)
onMounted(load)
</script>

<template>
  <div v-if="!admin" class="admin-login-page"><button class="admin-home-button" @click="$emit('navigate', 'portal')"><ArrowLeft :size="16" />返回首页</button><section class="admin-login-panel"><div class="admin-login-brand"><span><img src="/brand/brand-mark.png" alt="" /></span><div><strong>ProjectLens Admin</strong><small>管理后台</small></div></div><span class="admin-login-icon"><LockKeyhole :size="24" /></span><p class="kicker">ADMIN ACCESS</p><h1>管理员登录</h1><p>管理用户、会员订阅、账户状态与平台用量。</p><form @submit.prevent="loginAdmin"><label>管理员用户名<input v-model="username" autocomplete="username" placeholder="admin" /></label><label>密码<input v-model="password" type="password" autocomplete="current-password" placeholder="请输入管理员密码" /></label><p v-if="error" class="error-message">{{ error }}</p><button class="button button-primary button-wide" :disabled="loggingIn">{{ loggingIn ? '正在登录...' : '进入管理后台' }}</button></form></section><SiteFooter /></div>

  <div v-else class="admin-shell"><aside class="admin-sidebar"><div class="admin-brand"><span><img src="/brand/brand-mark.png" alt="" /></span><div><strong>ProjectLens</strong><small>ADMIN CONSOLE</small></div></div><nav><button class="active"><LayoutDashboard :size="18" />控制台总览</button><button @click="$emit('navigate', 'portal')"><ArrowLeft :size="18" />返回网站首页</button></nav><div class="admin-profile"><ShieldCheck :size="27" /><div><strong>{{ admin.name }}</strong><small>{{ admin.username || admin.email }}</small></div><button title="退出后台" @click="leaveAdmin"><LogOut :size="16" /></button></div></aside><section class="admin-main"><header class="admin-header"><div><p>DuTeam / ProjectLens</p><h1>管理后台</h1></div><div class="admin-header-actions"><span v-if="saveMessage">{{ saveMessage }}</span><button class="button button-primary" :disabled="!Object.keys(pendingChanges).length || saving === 'all'" @click="saveChanges"><Save :size="16" />{{ saving === 'all' ? '保存中...' : `保存更改${Object.keys(pendingChanges).length ? ` (${Object.keys(pendingChanges).length})` : ''}` }}</button><button class="button button-ghost" @click="$emit('navigate', 'portal')"><ArrowLeft :size="16" />返回首页</button></div></header><main class="admin-page"><p v-if="error" class="error-banner">{{ error }}</p><template v-if="overview"><section class="admin-stats"><article><span><Users :size="20" /></span><div><small>注册用户</small><strong>{{ overview.stats.users }}</strong></div></article><article><span><Crown :size="20" /></span><div><small>付费会员</small><strong>{{ overview.stats.paid }}</strong></div></article><article><span><Activity :size="20" /></span><div><small>评审项目</small><strong>{{ overview.stats.projects }}</strong></div></article><article><span><ShieldCheck :size="20" /></span><div><small>暂停账号</small><strong>{{ overview.stats.suspended }}</strong></div></article></section><section class="admin-users"><div class="admin-table-head"><div><h2>用户与订阅</h2></div><label><Search :size="16" /><input v-model="query" placeholder="搜索姓名、邮箱或ID" /></label><button class="icon-button" title="刷新" @click="load"><RefreshCw :size="17" /></button></div><div class="admin-table"><div class="admin-row admin-row-header"><span>用户</span><span>会员</span><span>到期时间</span><span>周期用量</span><span>角色</span><span>状态</span><span>操作</span></div><div v-for="item in filteredUsers" :key="item.id" class="admin-row" :class="{ pending: pendingChanges[item.id] }"><span class="admin-person"><i>{{ item.name.slice(0, 1) }}</i><b>{{ item.name }}<small>{{ item.email }}</small></b></span><span><select :value="item.plan" @change="stageUser(item, { plan: $event.target.value })"><option value="free">Free</option><option value="pro">Pro</option><option value="team">Team</option></select></span><span>{{ dateText(item.expiresAt) }}</span><span><b>{{ item.usage.used.total }}</b> / {{ item.usage.limits.total }}</span><span><select :value="item.role" @change="stageUser(item, { role: $event.target.value })"><option value="user">用户</option><option value="admin">管理员</option></select></span><span><select :value="item.status" @change="stageUser(item, { status: $event.target.value })"><option value="active">正常</option><option value="suspended">暂停</option></select></span><span class="admin-row-actions"><button class="admin-action-button" title="修改密码" :disabled="saving === item.id" @click="openPasswordDialog(item)"><KeyRound :size="15" /></button><button class="admin-action-button" title="重置用量" :disabled="saving === item.id" @click="updateUser(item, { resetUsage: true })"><UserRoundCheck :size="15" /></button><button class="admin-action-button danger" title="删除用户" :disabled="saving === item.id || item.id === admin.id" @click="deleteUser(item)"><Trash2 :size="15" /></button></span></div></div></section></template></main><SiteFooter /></section></div>

  <div v-if="passwordUser" class="admin-dialog-backdrop" @click.self="closePasswordDialog"><form class="admin-password-dialog" @submit.prevent="changePassword"><button type="button" class="icon-button dialog-close" title="关闭" @click="closePasswordDialog"><X :size="17" /></button><span class="admin-dialog-icon"><KeyRound :size="20" /></span><h2>修改用户密码</h2><p>为{{ passwordUser.name }}设置新的登录密码。</p><label>新密码<input v-model="newPassword" type="password" autocomplete="new-password" placeholder="至少6位" /></label><label>确认新密码<input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入新密码" /></label><div class="admin-dialog-actions"><button type="button" class="button button-ghost" @click="closePasswordDialog">取消</button><button class="button button-primary" :disabled="saving === passwordUser.id">{{ saving === passwordUser.id ? '保存中...' : '确认修改' }}</button></div></form></div>
</template>
