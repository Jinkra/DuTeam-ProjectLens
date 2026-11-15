<script setup>
import { Blocks, ChevronDown, CircleUserRound, Crown, Home, LayoutGrid, LogOut, Workflow } from 'lucide-vue-next'
import SiteFooter from './SiteFooter.vue'
defineProps({ user: Object, active: String, title: String, subtitle: String, full: Boolean })
defineEmits(['navigate', 'logout'])
</script>
<template>
  <div class="console-shell" :class="{ 'console-full': full }">
    <aside class="console-sidebar">
      <button class="console-logo" @click="$emit('navigate', 'tools')"><span><img src="/brand/brand-mark.png" alt="" /></span><strong>ProjectLens</strong></button>
      <nav><p>工作空间</p><button :class="{ active: active === 'tools' }" @click="$emit('navigate', 'tools')"><LayoutGrid :size="18" />工具中心</button><button :class="{ active: active === 'workflow' }" @click="$emit('navigate', 'workflow')"><Workflow :size="18" />工作流</button><button :class="{ active: active === 'review' }" @click="$emit('navigate', 'review')"><Blocks :size="18" />项目评审</button><button :class="{ active: active === 'pricing' }" @click="$emit('navigate', 'pricing')"><Crown :size="18" />会员中心</button></nav>
      <div class="console-home-action"><button @click="$emit('navigate', 'portal')"><Home :size="18" />返回首页</button></div>
      <div class="console-user"><CircleUserRound :size="30" /><div><strong>{{ user?.name }}</strong><small>个人工作空间</small></div><button title="退出登录" @click="$emit('logout')"><LogOut :size="16" /></button></div>
    </aside>
    <section class="console-main"><header class="console-header"><div><h1>{{ title }}</h1><p>{{ subtitle }}</p></div><div class="workspace-switch"><span>DuTeam Workspace</span><ChevronDown :size="14" /></div></header><slot /><SiteFooter /></section>
  </div>
</template>
