<script setup>
import { computed } from 'vue'
import { Blocks, Bot, ChevronDown, CircleUserRound, Crown, FolderKanban, Home, LayoutGrid, LogOut, TrendingUp, Workflow } from 'lucide-vue-next'
import SiteFooter from './SiteFooter.vue'
const props = defineProps({ user: Object, active: String, title: String, subtitle: String, full: Boolean })
defineEmits(['navigate', 'logout'])
const navIndex = computed(() => props.active === 'tools' ? 0 : props.active === 'projects' ? 1 : props.active === 'pricing' ? 2 : ['workflow', 'workflow-projects'].includes(props.active) ? 3 : ['review', 'review-projects'].includes(props.active) ? 4 : props.active === 'analysis' ? 5 : 6)
const navOffset = computed(() => navIndex.value * 46 + (navIndex.value >= 3 ? 26 : 0))
const projectTool = computed(() => ['review', 'analysis', 'coach'].includes(props.active))
</script>
<template>
  <div class="console-shell" :class="{ 'console-full': full, 'console-project-tool': projectTool }">
    <aside class="console-sidebar">
      <button class="console-logo" @click="$emit('navigate', 'tools')"><span><img src="/brand/brand-mark.png" alt="" /></span><strong>ProjectLens</strong></button>
      <nav :style="{ '--nav-offset': `${navOffset}px` }"><i class="console-nav-slider"></i><p>主要功能</p><button :class="{ active: active === 'tools' }" @click="$emit('navigate', 'tools')"><LayoutGrid :size="18" />工具中心</button><button :class="{ active: active === 'projects' }" @click="$emit('navigate', 'projects')"><FolderKanban :size="18" />项目空间</button><button :class="{ active: active === 'pricing' }" @click="$emit('navigate', 'pricing')"><Crown :size="18" />会员中心</button><p class="console-nav-group">项目工具</p><button :class="{ active: ['workflow', 'workflow-projects'].includes(active) }" @click="$emit('navigate', { page: 'workflow', selectProject: true })"><Workflow :size="18" />工作流</button><button :class="{ active: ['review', 'review-projects'].includes(active) }" @click="$emit('navigate', { page: 'review', selectProject: true })"><Blocks :size="18" />项目评审</button><button :class="{ active: active === 'analysis' }" @click="$emit('navigate', { page: 'analysis', selectProject: true })"><TrendingUp :size="18" />迭代分析</button><button :class="{ active: active === 'coach' }" @click="$emit('navigate', { page: 'coach', selectProject: true })"><Bot :size="18" />AI 答辩教练</button></nav>
      <div class="console-home-action"><button @click="$emit('navigate', 'portal')"><Home :size="18" />返回首页</button></div>
      <div class="console-user"><CircleUserRound :size="30" /><div><strong>{{ user?.name }}</strong><small>个人工作空间</small></div><button title="退出登录" @click="$emit('logout')"><LogOut :size="16" /></button></div>
    </aside>
    <section class="console-main"><header class="console-header"><div><h1>{{ title }}</h1><p>{{ subtitle }}</p></div><div class="workspace-switch"><span>DuTeam Workspace</span><ChevronDown :size="14" /></div></header><slot /><SiteFooter /></section>
  </div>
</template>
