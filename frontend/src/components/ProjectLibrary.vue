<script setup>
import { computed, ref } from 'vue'
import { ArrowRight, Clock3, FileSearch, FolderOpen, GitBranch, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import AppShell from './AppShell.vue'

const props = defineProps({ user: Object, kind: { type: String, required: true } })
const emit = defineEmits(['navigate', 'logout'])
const isWorkflow = computed(() => props.kind === 'workflow')
const storageKey = computed(() => `projectlens_${props.kind}_projects`)
const pageTitle = computed(() => isWorkflow.value ? '工作流项目' : '评审项目')
const pageSubtitle = computed(() => isWorkflow.value ? '管理自动化工作流并继续编排。' : '管理参赛项目并继续评审。')
const editorPage = computed(() => props.kind)
const editing = ref(null)

function defaultProjects() {
  return isWorkflow.value
    ? [
        { id: 'wf-competition', name: '竞赛评审自动化', description: '材料读取、知识检索、AI 评审与报告输出', status: '草稿', updatedAt: '2026-11-15T09:30:00.000Z', lastOpenedAt: '2026-11-15T09:30:00.000Z' },
        { id: 'wf-rubric', name: '评分标准核验流程', description: '根据竞赛规则核验评分证据与缺失材料', status: '已完成', updatedAt: '2026-11-12T14:20:00.000Z', lastOpenedAt: '2026-11-12T14:20:00.000Z' },
        { id: 'wf-defense', name: '答辩材料预审', description: '提取答辩重点并生成风险检查清单', status: '草稿', updatedAt: '2026-11-08T10:10:00.000Z', lastOpenedAt: '2026-11-08T10:10:00.000Z' },
      ]
    : [
        { id: 'rv-projectlens', name: 'ProjectLens 项目评审', description: 'AI 项目评审与改进 Agent 六维综合评审', status: '已完成', updatedAt: '2026-11-15T09:45:00.000Z', lastOpenedAt: '2026-11-15T09:45:00.000Z' },
        { id: 'rv-course', name: '课程项目阶段评审', description: '课程设计完成度、工程质量与创新性评估', status: '进行中', updatedAt: '2026-11-13T16:30:00.000Z', lastOpenedAt: '2026-11-13T16:30:00.000Z' },
        { id: 'rv-innovation', name: '创新创业项目初评', description: '商业价值、可行性和展示材料完整度检查', status: '草稿', updatedAt: '2026-11-09T11:00:00.000Z', lastOpenedAt: '2026-11-09T11:00:00.000Z' },
      ]
}

function loadProjects() {
  try { return JSON.parse(localStorage.getItem(storageKey.value)) || defaultProjects() } catch { return defaultProjects() }
}
const projects = ref(loadProjects())
const recentProjects = computed(() => [...projects.value].sort((a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt)).slice(0, 3))

function persist() { localStorage.setItem(storageKey.value, JSON.stringify(projects.value)) }
function timeText(value) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  return `${days} 天前`
}
function openProject(project) {
  project.lastOpenedAt = new Date().toISOString()
  localStorage.setItem(`projectlens_active_${props.kind}_project`, project.id)
  persist()
  emit('navigate', editorPage.value)
}
function openEditor(project = null) {
  editing.value = project
    ? { ...project }
    : { id: `${props.kind}-${Date.now()}`, name: '', description: '', status: '草稿', updatedAt: new Date().toISOString(), lastOpenedAt: new Date().toISOString() }
}
function saveProject() {
  if (!editing.value?.name.trim()) return
  const item = { ...editing.value, name: editing.value.name.trim(), description: editing.value.description.trim(), updatedAt: new Date().toISOString() }
  const index = projects.value.findIndex((project) => project.id === item.id)
  projects.value = index >= 0 ? projects.value.map((project) => project.id === item.id ? item : project) : [item, ...projects.value]
  persist()
  editing.value = null
}
function removeProject(project) {
  if (!window.confirm(`确定删除「${project.name}」吗？此操作无法撤销。`)) return
  projects.value = projects.value.filter((item) => item.id !== project.id)
  persist()
}
</script>

<template>
  <AppShell :user="user" :active="`${kind}-projects`" :title="pageTitle" :subtitle="pageSubtitle" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <main class="project-library">
      <section class="project-library-head"><div><p class="kicker">PROJECT LIBRARY</p><h1>{{ pageTitle }}</h1><p>{{ pageSubtitle }}点击项目后进入{{ isWorkflow ? '节点工作台' : '评审页面' }}。</p></div><button class="button button-primary" @click="openEditor()"><Plus :size="16" />新建{{ isWorkflow ? '工作流' : '评审项目' }}</button></section>

      <section v-if="recentProjects.length" class="project-section"><div class="project-section-title"><div><h2>最近项目</h2><p>继续最近打开的项目。</p></div><span>{{ recentProjects.length }} 个</span></div><div class="recent-project-grid"><button v-for="project in recentProjects" :key="project.id" @click="openProject(project)"><span :class="isWorkflow ? 'workflow' : 'review'"><GitBranch v-if="isWorkflow" :size="19" /><FileSearch v-else :size="19" /></span><div><strong>{{ project.name }}</strong><small>{{ project.description }}</small></div><time><Clock3 :size="13" />{{ timeText(project.lastOpenedAt) }}</time><ArrowRight :size="17" /></button></div></section>

      <section class="project-section"><div class="project-section-title"><div><h2>所有项目</h2><p>管理项目信息、状态和访问入口。</p></div><span>{{ projects.length }} 个项目</span></div><div v-if="projects.length" class="project-table"><div class="project-table-row header"><span>项目</span><span>状态</span><span>更新时间</span><span>操作</span></div><div v-for="project in projects" :key="project.id" class="project-table-row"><button class="project-name" @click="openProject(project)"><i :class="isWorkflow ? 'workflow' : 'review'"><GitBranch v-if="isWorkflow" :size="17" /><FileSearch v-else :size="17" /></i><span><strong>{{ project.name }}</strong><small>{{ project.description }}</small></span></button><span><em class="project-status" :class="project.status">{{ project.status }}</em></span><span class="project-updated"><Clock3 :size="14" />{{ timeText(project.updatedAt) }}</span><span class="project-row-actions"><button title="编辑项目信息" @click="openEditor(project)"><Pencil :size="15" /></button><button class="danger" title="删除项目" @click="removeProject(project)"><Trash2 :size="15" /></button><button title="进入项目" @click="openProject(project)"><ArrowRight :size="16" /></button></span></div></div><div v-else class="project-empty"><FolderOpen :size="30" /><h3>还没有项目</h3><p>新建第一个项目后，它会显示在这里。</p><button class="button button-primary" @click="openEditor()"><Plus :size="16" />新建项目</button></div></section>
    </main>

    <div v-if="editing" class="project-modal-backdrop" @click.self="editing = null"><form class="project-modal" @submit.prevent="saveProject"><button type="button" class="icon-button project-modal-close" title="关闭" @click="editing = null"><X :size="17" /></button><p class="kicker">PROJECT DETAILS</p><h2>{{ projects.some((project) => project.id === editing.id) ? '修改项目信息' : '新建项目' }}</h2><label>项目名称<input v-model="editing.name" maxlength="50" autofocus placeholder="输入项目名称" /></label><label>项目描述<textarea v-model="editing.description" maxlength="160" rows="4" placeholder="简要说明项目目标和当前进度"></textarea></label><label>项目状态<select v-model="editing.status"><option>草稿</option><option>进行中</option><option>已完成</option></select></label><div class="project-modal-actions"><button type="button" class="button button-ghost" @click="editing = null">取消</button><button class="button button-primary" :disabled="!editing.name.trim()">保存项目</button></div></form></div>
  </AppShell>
</template>
