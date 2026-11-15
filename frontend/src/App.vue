<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PortalPage from './components/PortalPage.vue'
import AuthModal from './components/AuthModal.vue'
import ToolHub from './components/ToolHub.vue'
import WorkflowStudio from './components/WorkflowStudio.vue'
import ReviewTool from './components/ReviewTool.vue'
import SubscriptionPage from './components/SubscriptionPage.vue'
import AdminPage from './components/AdminPage.vue'
import ProjectLibrary from './components/ProjectLibrary.vue'
import AppShell from './components/AppShell.vue'
import IterationAnalysis from './components/IterationAnalysis.vue'
import DefenseCoach from './components/DefenseCoach.vue'
import WorkspaceProjects from './components/WorkspaceProjects.vue'
import { getActiveWorkspace, loadAccountProjects } from './projectStorage'

const token = ref(localStorage.getItem('projectlens_token'))
const user = ref(JSON.parse(localStorage.getItem('projectlens_user') || 'null'))
const requestedAdmin = window.location.pathname === '/admin'
const requestedPage = window.location.hash.replace(/^#/, '')
const publicPages = ['portal', 'pricing']
const page = ref(requestedAdmin ? 'admin' : requestedPage === 'pricing' ? 'pricing' : token.value && requestedPage ? requestedPage : 'portal')
const authOpen = ref(false)
const authMode = ref('login')
const postAuthPage = ref('tools')
const requestedProjectTool = ref(null)
const consolePages = new Set(['tools', 'projects', 'workflow-projects', 'review-projects', 'workflow', 'review', 'analysis', 'coach'])
const activeProject = ref(user.value ? getActiveWorkspace(user.value) : null)
const isConsolePage = computed(() => consolePages.has(page.value))
const consoleMeta = computed(() => ({
  tools: { active: 'tools', title: '工具中心', subtitle: '选择一个工具，开始处理你的项目。' },
  projects: { active: 'projects', title: '项目空间', subtitle: '一个项目，一套完整的竞赛改进工作区。' },
  'workflow-projects': { active: 'workflow-projects', title: '工作流项目', subtitle: '管理自动化工作流并继续编排。' },
  'review-projects': { active: 'review-projects', title: '评审项目', subtitle: '管理参赛项目并继续评审。' },
  workflow: { active: 'workflow', title: '工作流工作台', subtitle: '竞赛项目自动评审与流程编排', full: true },
  review: { active: 'review', title: '项目智能评审', subtitle: '基于证据的六维项目分析与改进建议。' },
  analysis: { active: 'analysis', title: '迭代效果分析', subtitle: '对比评审版本，确认每次改进带来的真实变化。' },
  coach: { active: 'coach', title: 'AI 答辩教练', subtitle: '模拟评委追问，训练清晰、可信、有证据的答辩表达。' },
}[page.value]))

function openAuth(mode = 'login') { authMode.value = mode; postAuthPage.value = page.value === 'pricing' ? 'pricing' : 'tools'; authOpen.value = true }
function authenticated(data) {
  token.value = data.token; user.value = data.user
  localStorage.setItem('projectlens_token', data.token)
  localStorage.setItem('projectlens_user', JSON.stringify(data.user))
  activeProject.value = getActiveWorkspace(data.user)
  authOpen.value = false; page.value = requestedAdmin && data.user.role === 'admin' ? 'admin' : postAuthPage.value
}
function navigate(target) {
  const selectProject = typeof target === 'object' && target.selectProject
  target = typeof target === 'object' ? target.page : target
  if (!token.value && !['portal', 'pricing', 'admin'].includes(target)) return openAuth('login')
  if (['workflow-projects', 'review-projects'].includes(target)) target = 'projects'
  if (selectProject && ['workflow', 'review', 'analysis', 'coach'].includes(target)) {
    requestedProjectTool.value = target
    if (!loadAccountProjects('workspace', user.value).length) window.alert('请先创建项目，再使用该项目工具。')
    target = 'projects'
  } else if (['workflow', 'review', 'analysis', 'coach'].includes(target) && !activeProject.value) {
    requestedProjectTool.value = target
    window.alert('请先创建项目，再使用该项目工具。')
    target = 'projects'
  } else if (target === 'projects') requestedProjectTool.value = null
  page.value = target
  history.replaceState({}, '', target === 'admin' ? '/admin' : target === 'portal' ? '/' : `/#${target}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function logout() {
  const stayOnMembership = page.value === 'pricing'
  localStorage.removeItem('projectlens_token'); localStorage.removeItem('projectlens_user')
  token.value = null; user.value = null; activeProject.value = null; page.value = stayOnMembership ? 'pricing' : 'portal'
  history.replaceState({}, '', stayOnMembership ? '/#pricing' : '/')
}
function syncSession() {
  const storedToken = localStorage.getItem('projectlens_token')
  const storedUser = JSON.parse(localStorage.getItem('projectlens_user') || 'null')
  token.value = storedToken
  user.value = storedToken ? storedUser : null
  activeProject.value = storedToken ? getActiveWorkspace(storedUser) : null
  if (!storedToken && !publicPages.includes(page.value) && page.value !== 'admin') navigate('portal')
}
function syncVisibleSession() { if (document.visibilityState === 'visible') syncSession() }
function syncActiveProject(event) { activeProject.value = event?.detail || (user.value ? getActiveWorkspace(user.value) : null) }
onMounted(() => {
  if (!token.value && !requestedAdmin && page.value !== 'pricing') page.value = 'portal'
  window.addEventListener('storage', syncSession)
  window.addEventListener('pageshow', syncSession)
  document.addEventListener('visibilitychange', syncVisibleSession)
  window.addEventListener('projectlens:active-project-changed', syncActiveProject)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', syncSession)
  window.removeEventListener('pageshow', syncSession)
  document.removeEventListener('visibilitychange', syncVisibleSession)
  window.removeEventListener('projectlens:active-project-changed', syncActiveProject)
})
</script>

<template>
  <Transition name="page-transition" mode="out-in">
    <div :key="isConsolePage ? 'console' : page" class="app-page">
      <PortalPage v-if="page === 'portal'" :user="user" @auth="openAuth" @navigate="navigate" />
      <AppShell v-else-if="isConsolePage" :user="user" v-bind="consoleMeta" @navigate="navigate" @logout="logout">
        <Transition name="console-content" mode="out-in">
          <div :key="page" class="console-content-page">
            <ToolHub v-if="page === 'tools'" embedded :user="user" @navigate="navigate" @logout="logout" />
            <WorkspaceProjects v-else-if="page === 'projects'" :user="user" :requested-tool="requestedProjectTool" @navigate="navigate" />
            <ProjectLibrary v-else-if="page === 'workflow-projects'" embedded :user="user" kind="workflow" @navigate="navigate" @logout="logout" />
            <ProjectLibrary v-else-if="page === 'review-projects'" embedded :user="user" kind="review" @navigate="navigate" @logout="logout" />
            <WorkflowStudio v-else-if="page === 'workflow'" embedded :user="user" :project="activeProject" @navigate="navigate" @logout="logout" />
            <ReviewTool v-else-if="page === 'review'" embedded :user="user" :project="activeProject" @navigate="navigate" @logout="logout" />
            <IterationAnalysis v-else-if="page === 'analysis'" embedded :user="user" :project="activeProject" @navigate="navigate" @logout="logout" />
            <DefenseCoach v-else-if="page === 'coach'" embedded :user="user" :project="activeProject" @navigate="navigate" @logout="logout" />
          </div>
        </Transition>
      </AppShell>
      <SubscriptionPage v-else-if="page === 'pricing'" :user="user" @navigate="navigate" @logout="logout" @auth="openAuth" />
      <AdminPage v-else-if="page === 'admin'" :user="user" @navigate="navigate" @logout="logout" @authenticated="authenticated" />
    </div>
  </Transition>
  <AuthModal v-if="authOpen" :initial-mode="authMode" @close="authOpen = false" @authenticated="authenticated" />
</template>
