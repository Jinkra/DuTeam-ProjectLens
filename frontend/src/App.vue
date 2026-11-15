<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
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
const requestedPage = window.location.hash.replace(/^#/, '')
const publicPages = ['portal', 'pricing']
const page = ref(requestedAdmin ? 'admin' : requestedPage === 'pricing' ? 'pricing' : token.value && requestedPage ? requestedPage : 'portal')
const authOpen = ref(false)
const authMode = ref('login')
const postAuthPage = ref('tools')

function openAuth(mode = 'login') { authMode.value = mode; postAuthPage.value = page.value === 'pricing' ? 'pricing' : 'tools'; authOpen.value = true }
function authenticated(data) {
  token.value = data.token; user.value = data.user
  localStorage.setItem('projectlens_token', data.token)
  localStorage.setItem('projectlens_user', JSON.stringify(data.user))
  authOpen.value = false; page.value = requestedAdmin && data.user.role === 'admin' ? 'admin' : postAuthPage.value
}
function navigate(target) {
  if (!token.value && !['portal', 'pricing', 'admin'].includes(target)) return openAuth('login')
  page.value = target
  history.replaceState({}, '', target === 'admin' ? '/admin' : target === 'portal' ? '/' : `/#${target}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function logout() {
  const stayOnMembership = page.value === 'pricing'
  localStorage.removeItem('projectlens_token'); localStorage.removeItem('projectlens_user')
  token.value = null; user.value = null; page.value = stayOnMembership ? 'pricing' : 'portal'
  history.replaceState({}, '', stayOnMembership ? '/#pricing' : '/')
}
function syncSession() {
  const storedToken = localStorage.getItem('projectlens_token')
  const storedUser = JSON.parse(localStorage.getItem('projectlens_user') || 'null')
  token.value = storedToken
  user.value = storedToken ? storedUser : null
  if (!storedToken && !publicPages.includes(page.value) && page.value !== 'admin') navigate('portal')
}
function syncVisibleSession() { if (document.visibilityState === 'visible') syncSession() }
onMounted(() => {
  if (!token.value && !requestedAdmin && page.value !== 'pricing') page.value = 'portal'
  window.addEventListener('storage', syncSession)
  window.addEventListener('pageshow', syncSession)
  document.addEventListener('visibilitychange', syncVisibleSession)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', syncSession)
  window.removeEventListener('pageshow', syncSession)
  document.removeEventListener('visibilitychange', syncVisibleSession)
})
</script>

<template>
  <Transition name="page-transition" mode="out-in">
    <div :key="page" class="app-page">
      <PortalPage v-if="page === 'portal'" :user="user" @auth="openAuth" @navigate="navigate" />
      <ToolHub v-else-if="page === 'tools'" :user="user" @navigate="navigate" @logout="logout" />
      <WorkflowStudio v-else-if="page === 'workflow'" :user="user" @navigate="navigate" @logout="logout" />
      <ReviewTool v-else-if="page === 'review'" :user="user" @navigate="navigate" @logout="logout" />
      <SubscriptionPage v-else-if="page === 'pricing'" :user="user" @navigate="navigate" @logout="logout" @auth="openAuth" />
      <AdminPage v-else-if="page === 'admin'" :user="user" @navigate="navigate" @logout="logout" @authenticated="authenticated" />
    </div>
  </Transition>
  <AuthModal v-if="authOpen" :initial-mode="authMode" @close="authOpen = false" @authenticated="authenticated" />
</template>
