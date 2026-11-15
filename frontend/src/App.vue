<script setup>
import { onMounted, ref } from 'vue'
import PortalPage from './components/PortalPage.vue'
import AuthModal from './components/AuthModal.vue'
import ToolHub from './components/ToolHub.vue'
import WorkflowStudio from './components/WorkflowStudio.vue'
import ReviewTool from './components/ReviewTool.vue'
import SubscriptionPage from './components/SubscriptionPage.vue'
import AdminPage from './components/AdminPage.vue'

const token = ref(localStorage.getItem('projectlens_token'))
const user = ref(JSON.parse(localStorage.getItem('projectlens_user') || 'null'))
const requestedAdmin = window.location.pathname === '/admin'
const page = ref(requestedAdmin ? 'admin' : token.value ? 'tools' : 'portal')
const authOpen = ref(false)
const authMode = ref('login')
const postAuthPage = ref('tools')

function openAuth(mode = 'login') { authMode.value = mode; postAuthPage.value = ['pricing', 'admin'].includes(page.value) ? page.value : 'tools'; authOpen.value = true }
function authenticated(data) {
  token.value = data.token; user.value = data.user
  localStorage.setItem('projectlens_token', data.token)
  localStorage.setItem('projectlens_user', JSON.stringify(data.user))
  authOpen.value = false; page.value = postAuthPage.value
}
function navigate(target) {
  if (!token.value && target !== 'portal') return openAuth('login')
  if (target === 'admin' && user.value?.role !== 'admin') return
  page.value = target
  history.replaceState({}, '', target === 'admin' ? '/admin' : target === 'portal' ? '/' : `/#${target}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function logout() {
  localStorage.removeItem('projectlens_token'); localStorage.removeItem('projectlens_user')
  token.value = null; user.value = null; page.value = 'portal'
}
onMounted(() => { if (!token.value && !requestedAdmin) page.value = 'portal'; if (!token.value && requestedAdmin) openAuth('login') })
</script>

<template>
  <PortalPage v-if="page === 'portal'" :user="user" @auth="openAuth" @navigate="navigate" />
  <ToolHub v-else-if="page === 'tools'" :user="user" @navigate="navigate" @logout="logout" />
  <WorkflowStudio v-else-if="page === 'workflow'" :user="user" @navigate="navigate" @logout="logout" />
  <ReviewTool v-else-if="page === 'review'" :user="user" @navigate="navigate" @logout="logout" />
  <SubscriptionPage v-else-if="page === 'pricing'" :user="user" @navigate="navigate" @logout="logout" />
  <AdminPage v-else-if="page === 'admin'" :user="user" @navigate="navigate" @logout="logout" />
  <AuthModal v-if="authOpen" :initial-mode="authMode" @close="authOpen = false" @authenticated="authenticated" />
</template>
