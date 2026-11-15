<script setup>
import { BarChart3, Bot, ChevronLeft, FileSearch, MessageCircleMore, Workflow } from 'lucide-vue-next'
defineProps({ project: Object, active: String })
defineEmits(['navigate'])
const tabs = [
  { id: 'workflow', label: '工作流', icon: Workflow },
  { id: 'review', label: '项目评审', icon: FileSearch },
  { id: 'analysis', label: '迭代分析', icon: BarChart3 },
  { id: 'coach', label: 'AI 答辩教练', icon: Bot },
  { id: 'assistant', label: 'AI 项目助手', icon: MessageCircleMore },
]
</script>
<template>
  <section class="project-context-bar"><button class="project-context-back" title="返回项目空间" @click="$emit('navigate', 'projects')"><ChevronLeft :size="17" /></button><div class="project-context-name"><small>当前项目</small><strong>{{ project?.name }}</strong></div><nav><button v-for="tab in tabs" :key="tab.id" :class="{ active: active === tab.id }" @click="$emit('navigate', tab.id)"><component :is="tab.icon" :size="15" />{{ tab.label }}</button></nav></section>
</template>
