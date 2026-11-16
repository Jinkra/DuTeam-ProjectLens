<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, Clock3, FolderKanban, MessageCircleMore, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { api } from '../api'
import { loadAccountProjects, refreshWorkspaceProjects, saveAccountProjects, setActiveWorkspace } from '../projectStorage'
const props = defineProps({ user: Object, requestedTool: String })
const emit = defineEmits(['navigate'])
const projects = ref(loadAccountProjects('workspace', props.user))
const editing = ref(null)
const saving = ref(false)
const recentProjects = computed(() => [...projects.value].sort((a, b) => new Date(b.lastOpenedAt || b.updatedAt) - new Date(a.lastOpenedAt || a.updatedAt)))
function persist() { saveAccountProjects('workspace', props.user, projects.value) }
const toolNames = { workflow: '工作流', review: '项目评审', analysis: '迭代分析', coach: 'AI答辩教练', assistant: 'Duts项目助手' }
async function openProject(project) {
  try {
    const updated = await api(`/projects/${project.id}`, { method: 'PUT', body: JSON.stringify({ lastOpenedAt: new Date().toISOString() }) })
    projects.value = projects.value.map((item) => item.id === updated.id ? updated : item)
    setActiveWorkspace(props.user, updated); persist(); emit('navigate', props.requestedTool || 'workflow')
  } catch (error) { window.alert(`打开项目失败：${error.message}`) }
}
function openEditor(project = null) { editing.value = project ? { ...project } : { id: `project-${Date.now()}`, name: '', description: '', category: 'AI Agent智能助手', status: '草稿' } }
async function saveProject() {
  if (!editing.value?.name.trim() || saving.value) return
  saving.value = true
  try {
    const exists = projects.value.some((project) => project.id === editing.value.id)
    const saved = await api(exists ? `/projects/${editing.value.id}` : '/projects', { method: exists ? 'PUT' : 'POST', body: JSON.stringify({ name: editing.value.name, description: editing.value.description || '暂无项目简介', category: editing.value.category, status: editing.value.status }) })
    projects.value = exists ? projects.value.map((project) => project.id === saved.id ? saved : project) : [saved, ...projects.value]
    persist(); editing.value = null
  } catch (error) { window.alert(`保存项目失败：${error.message}`) } finally { saving.value = false }
}
async function removeProject(project) {
  if (!window.confirm(`确定删除「${project.name}」吗？`)) return
  try { await api(`/projects/${project.id}`, { method: 'DELETE' }); projects.value = projects.value.filter((item) => item.id !== project.id); persist() } catch (error) { window.alert(`删除项目失败：${error.message}`) }
}
function timeText(value) { if (!value) return '刚刚'; const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000); return days <= 0 ? '今天' : days === 1 ? '昨天' : `${days}天前` }
onMounted(async () => { try { projects.value = await refreshWorkspaceProjects(props.user) } catch (error) { window.alert(`项目加载失败：${error.message}`) } })
</script>
<template>
  <main class="workspace-projects"><section class="workspace-projects-head"><div><p class="kicker">PROJECT WORKSPACE</p><h1>{{ requestedTool ? `选择项目并进入${toolNames[requestedTool]}` : '项目空间' }}</h1><p>{{ requestedTool ? `选择一个已有项目，系统会自动载入项目上下文并打开${toolNames[requestedTool]}。` : '先创建项目，再在同一个项目里完成工作流、评审、迭代分析和答辩训练。' }}</p></div><div class="workspace-project-actions"><button class="button button-ghost" @click="$emit('navigate', { page: 'assistant', selectProject: true })"><MessageCircleMore :size="16" />Duts项目助手</button><button class="button button-primary" @click="openEditor()"><Plus :size="16" />创建项目</button></div></section><div v-if="requestedTool && recentProjects.length" class="project-select-notice">当前操作：选择项目后进入 <strong>{{ toolNames[requestedTool] }}</strong></div><section v-if="recentProjects.length" class="workspace-project-grid"><article v-for="project in recentProjects" :key="project.id"><button class="workspace-project-main" @click="openProject(project)"><span><FolderKanban :size="21" /></span><div><small>{{ project.category }}</small><h2>{{ project.name }}</h2><p>{{ project.description }}</p></div><ArrowRight :size="18" /></button><footer><em :class="project.status">{{ project.status }}</em><time><Clock3 :size="13" />{{ timeText(project.lastOpenedAt || project.updatedAt) }}</time><div><button title="编辑项目" @click="openEditor(project)"><Pencil :size="14" /></button><button title="删除项目" @click="removeProject(project)"><Trash2 :size="14" /></button></div></footer></article></section><section v-else class="tool-empty"><FolderKanban :size="30" /><h2>请先创建项目</h2><p>创建项目后即可使用{{ requestedTool ? toolNames[requestedTool] : '全部项目工具' }}，项目信息只需填写一次。</p><button class="button button-primary" @click="openEditor()"><Plus :size="16" />创建项目</button></section></main>
  <div v-if="editing" class="project-modal-backdrop" @click.self="editing = null"><form class="project-modal" @submit.prevent="saveProject"><button type="button" class="icon-button project-modal-close" title="关闭" @click="editing = null"><X :size="17" /></button><p class="kicker">PROJECT DETAILS</p><h2>{{ projects.some((project) => project.id === editing.id) ? '修改项目信息' : '创建项目' }}</h2><label>项目名称<input v-model="editing.name" required maxlength="50" placeholder="例如：AI竞赛评审助手" /></label><label>项目方向<select v-model="editing.category"><option>AI Agent智能助手</option><option>AI教育与学习平台</option><option>RAG知识问答系统</option><option>AI协同办公工具</option></select></label><label>项目简介<textarea v-model="editing.description" rows="4" maxlength="200" placeholder="说明项目解决的问题和主要能力"></textarea></label><label>项目状态<select v-model="editing.status"><option>草稿</option><option>进行中</option><option>已完成</option></select></label><div class="project-modal-actions"><button type="button" class="button button-ghost" @click="editing = null">取消</button><button class="button button-primary" :disabled="saving">{{ saving ? '保存中...' : '保存项目' }}</button></div></form></div>
</template>
