<script setup>
import { ArrowRight, BarChart3, BookOpenCheck, Bot, Clock3, FileSearch, GitBranch, Plus, Workflow } from 'lucide-vue-next'
import AppShell from './AppShell.vue'
defineProps({ user: Object }); defineEmits(['navigate', 'logout'])
const tools = [
  { id: 'review-projects', icon: FileSearch, class: 'tool-blue', name: '项目智能评审', text: '按竞赛标准分析项目材料，输出证据化评分与改进任务。', status: '可用', action: '查看项目' },
  { id: 'workflow-projects', icon: Workflow, class: 'tool-violet', name: 'Agent 工作流', text: '连接输入、模型、知识库和输出节点，编排自动化流程。', status: '新功能', action: '查看项目' },
  { id: 'analysis', icon: BarChart3, class: 'tool-orange', name: '迭代效果分析', text: '对比多次评审结果，追踪评分变化和问题关闭进度。', status: '即将开放', action: '查看详情', disabled: true },
  { id: 'coach', icon: Bot, class: 'tool-green', name: '答辩教练', text: '根据项目材料生成答辩问题，模拟评委追问并给出反馈。', status: '即将开放', action: '查看详情', disabled: true },
]
</script>
<template>
  <AppShell :user="user" active="tools" title="工具中心" subtitle="选择一个工具，开始处理你的项目。" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <div class="hub-content"><section class="hub-welcome"><div><p class="kicker">GOOD AFTERNOON</p><h2>{{ user?.name }}，今天想推进什么？</h2><p>从一次项目评审开始，或把重复步骤编排成自动化工作流。</p></div><button class="button button-primary" @click="$emit('navigate', 'workflow-projects')"><Plus :size="16" />工作流项目</button></section>
      <section><div class="content-title"><div><h2>AI 工具</h2><p>围绕项目评审、改进和展示的专业能力。</p></div><span>4 个工具</span></div><div class="hub-tool-grid"><button v-for="tool in tools" :key="tool.id" class="hub-tool-card" :disabled="tool.disabled" @click="!tool.disabled && $emit('navigate', tool.id)"><span class="tool-icon" :class="tool.class"><component :is="tool.icon" :size="23" /></span><div class="tool-card-head"><h3>{{ tool.name }}</h3><small>{{ tool.status }}</small></div><p>{{ tool.text }}</p><div class="tool-card-action">{{ tool.action }}<ArrowRight :size="16" /></div></button></div></section>
      <section class="recent-section"><div class="content-title"><div><h2>最近使用</h2><p>快速回到上次的工作进度。</p></div></div><div class="recent-table"><div class="recent-row header"><span>名称</span><span>类型</span><span>更新时间</span><span>状态</span><span></span></div><div class="recent-row"><span><i><BookOpenCheck :size="16" /></i><b>ProjectLens 项目评审</b></span><span>项目评审</span><span><Clock3 :size="14" />刚刚</span><span><em class="success-dot"></em>已完成</span><button @click="$emit('navigate', 'review-projects')"><ArrowRight :size="16" /></button></div><div class="recent-row"><span><i><GitBranch :size="16" /></i><b>竞赛评审自动化</b></span><span>工作流</span><span><Clock3 :size="14" />今天</span><span><em class="draft-dot"></em>草稿</span><button @click="$emit('navigate', 'workflow-projects')"><ArrowRight :size="16" /></button></div></div></section>
    </div>
  </AppShell>
</template>
