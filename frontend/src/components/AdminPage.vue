<script setup>
import { computed, onMounted, ref } from 'vue'
import { Activity, Crown, RefreshCw, Search, ShieldCheck, UserRoundCheck, Users } from 'lucide-vue-next'
import AppShell from './AppShell.vue'
import { api } from '../api'

defineProps({ user: Object })
defineEmits(['navigate', 'logout'])
const overview = ref(null)
const query = ref('')
const error = ref('')
const saving = ref('')
const filteredUsers = computed(() => (overview.value?.users || []).filter((user) => `${user.name}${user.email}${user.id}`.toLowerCase().includes(query.value.toLowerCase())))
const dateText = (value) => value ? new Date(value).toLocaleDateString('zh-CN') : '长期有效'
async function load() { error.value = ''; try { overview.value = await api('/admin/overview') } catch (e) { error.value = e.message } }
async function updateUser(user, changes) {
  saving.value = user.id
  try {
    const updated = await api(`/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(changes) })
    overview.value.users = overview.value.users.map((item) => item.id === user.id ? updated : item)
  } catch (e) { error.value = e.message } finally { saving.value = '' }
}
onMounted(load)
</script>

<template>
  <AppShell :user="user" active="admin" title="管理后台" subtitle="用户、订阅与平台用量管理。" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <main class="admin-page">
      <p v-if="error" class="error-banner">{{ error }}</p>
      <template v-if="overview">
        <section class="admin-stats"><article><span><Users :size="20" /></span><div><small>注册用户</small><strong>{{ overview.stats.users }}</strong></div></article><article><span><Crown :size="20" /></span><div><small>付费会员</small><strong>{{ overview.stats.paid }}</strong></div></article><article><span><Activity :size="20" /></span><div><small>评审项目</small><strong>{{ overview.stats.projects }}</strong></div></article><article><span><ShieldCheck :size="20" /></span><div><small>暂停账号</small><strong>{{ overview.stats.suspended }}</strong></div></article></section>
        <section class="admin-users"><div class="admin-table-head"><div><p class="kicker">USER OPERATIONS</p><h2>用户与订阅</h2></div><label><Search :size="16" /><input v-model="query" placeholder="搜索姓名、邮箱或 ID" /></label><button class="icon-button" title="刷新" @click="load"><RefreshCw :size="17" /></button></div>
          <div class="admin-table"><div class="admin-row admin-row-header"><span>用户</span><span>会员</span><span>到期时间</span><span>周期用量</span><span>角色</span><span>状态</span><span>操作</span></div><div v-for="item in filteredUsers" :key="item.id" class="admin-row"><span class="admin-person"><i>{{ item.name.slice(0, 1) }}</i><b>{{ item.name }}<small>{{ item.email }}</small></b></span><span><select :value="item.plan" @change="updateUser(item, { plan: $event.target.value })"><option value="free">Free</option><option value="pro">Pro</option><option value="team">Team</option></select></span><span>{{ dateText(item.expiresAt) }}</span><span><b>{{ item.usage.used.total }}</b> / {{ item.usage.limits.total }}</span><span><select :value="item.role" @change="updateUser(item, { role: $event.target.value })"><option value="user">用户</option><option value="admin">管理员</option></select></span><span><select :value="item.status" @change="updateUser(item, { status: $event.target.value })"><option value="active">正常</option><option value="suspended">暂停</option></select></span><span><button class="admin-reset" :disabled="saving === item.id" @click="updateUser(item, { resetUsage: true })"><UserRoundCheck :size="15" />重置用量</button></span></div></div>
        </section>
      </template>
    </main>
  </AppShell>
</template>
