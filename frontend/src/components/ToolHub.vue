<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, BarChart3, BookOpenCheck, Bot, Clock3, FileSearch, GitBranch, Plus, Workflow } from 'lucide-vue-next'
import AppShell from './AppShell.vue'
import { loadAccountProjects } from '../projectStorage'
const props = defineProps({ user: Object, embedded: Boolean }); defineEmits(['navigate', 'logout'])
const tools = [
  { id: 'review-projects', icon: FileSearch, class: 'tool-blue', name: '项目智能评审', text: '按竞赛标准分析项目材料，输出证据化评分与改进任务。', status: '可用', action: '查看项目' },
  { id: 'workflow-projects', icon: Workflow, class: 'tool-violet', name: 'Agent 工作流', text: '连接输入、模型、知识库和输出节点，编排自动化流程。', status: '新功能', action: '查看项目' },
  { id: 'analysis', icon: BarChart3, class: 'tool-orange', name: '迭代效果分析', text: '对比多次评审结果，追踪评分变化和问题关闭进度。', status: '可用', action: '开始分析' },
  { id: 'coach', icon: Bot, class: 'tool-green', name: 'AI 答辩教练', text: '根据项目材料生成答辩问题，模拟评委追问并给出反馈。', status: '可用', action: '开始训练' },
]
const projectGroups = ref({ workflow: [], review: [] })
const recentProjects = computed(() => [
  ...projectGroups.value.workflow.map((project) => ({ ...project, kind: 'workflow', type: '工作流' })),
  ...projectGroups.value.review.map((project) => ({ ...project, kind: 'review', type: '项目评审' })),
].sort((a, b) => new Date(b.lastOpenedAt || b.updatedAt) - new Date(a.lastOpenedAt || a.updatedAt)).slice(0, 5))
function refreshProjects() {
  projectGroups.value = {
    workflow: loadAccountProjects('workflow', props.user),
    review: loadAccountProjects('review', props.user),
  }
}
onMounted(() => { refreshProjects(); window.addEventListener('projectlens:projects-changed', refreshProjects) })
onBeforeUnmount(() => window.removeEventListener('projectlens:projects-changed', refreshProjects))
</script>
<template>
  <component :is="embedded ? 'div' : AppShell" v-bind="embedded ? {} : { user, active: 'tools', title: '工具中心', subtitle: '选择一个工具，开始处理你的项目。' }" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <div class="hub-content"><section class="hub-welcome"><div><p class="kicker">GOOD AFTERNOON</p><h2>{{ user?.name }}，今天想推进什么？</h2><p>从一次项目评审开始，或把重复步骤编排成自动化工作流。</p></div><button class="button button-primary" @click="$emit('navigate', 'workflow-projects')"><Plus :size="16" />工作流项目</button></section>
      <section><div class="content-title"><div><h2>AI 工具</h2><p>围绕项目评审、改进和展示的专业能力。</p></div><span>4 个工具</span></div><div class="hub-tool-grid"><button v-for="tool in tools" :key="tool.id" class="hub-tool-card" :disabled="tool.disabled" @click="!tool.disabled && $emit('navigate', tool.id)"><span class="tool-icon" :class="tool.class"><component :is="tool.icon" :size="23" /></span><div class="tool-card-head"><h3>{{ tool.name }}</h3><small>{{ tool.status }}</small></div><p>{{ tool.text }}</p><div class="tool-card-action">{{ tool.action }}<ArrowRight :size="16" /></div></button></div></section>
      <section class="recent-section"><div class="content-title"><div><h2>最近使用</h2><p>快速回到上次的工作进度。</p></div></div><div class="recent-table"><div class="recent-row header"><span>名称</span><span>类型</span><span>更新时间</span><span>状态</span><span></span></div><div v-for="project in recentProjects" :key="`${project.kind}-${project.id}`" class="recent-row"><span><i><GitBranch v-if="project.kind === 'workflow'" :size="16" /><BookOpenCheck v-else :size="16" /></i><b>{{ project.name }}</b></span><span>{{ project.type }}</span><span><Clock3 :size="14" />{{ new Date(project.lastOpenedAt || project.updatedAt).toLocaleDateString('zh-CN') }}</span><span><em :class="project.status === '已完成' ? 'success-dot' : 'draft-dot'"></em>{{ project.status }}</span><button @click="$emit('navigate', `${project.kind}-projects`)"><ArrowRight :size="16" /></button></div><div v-if="!recentProjects.length" class="recent-empty">暂无项目，创建后会显示在这里。</div></div></section>
    </div>
  </component>
</template>
