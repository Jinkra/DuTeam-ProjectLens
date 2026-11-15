<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ArrowRight, Check, ChevronRight, FileText, Plus, ScanSearch, ShieldCheck, Sparkles, Upload, X } from 'lucide-vue-next'
import { api } from '../api'
import AppShell from './AppShell.vue'
import ProjectContextBar from './ProjectContextBar.vue'

const props = defineProps({ user: Object, embedded: Boolean, project: Object }); defineEmits(['navigate', 'logout'])
const projects = ref([]); const selected = ref(null); const showCreate = ref(false); const loading = ref(false); const error = ref('')
const form = reactive({ name: props.project?.name || 'ProjectLens', category: props.project?.category || 'AI教育与学习平台', description: props.project?.description || '面向大学生竞赛与课程项目的证据驱动型AI评审与改进Agent。', material: props.project?.description || '请在这里补充项目材料，或从工作流的材料输入节点上传文件。' })
const review = computed(() => selected.value?.review)
const scoreTone = (score) => score >= 80 ? 'great' : score >= 70 ? 'good' : 'warn'
async function loadProjects() {
  projects.value = await api('/projects')
  if (props.project) {
    selected.value = projects.value.find((item) => item.name === props.project.name)
    if (!selected.value) {
      selected.value = await api('/projects', { method: 'POST', body: JSON.stringify(form) })
      projects.value.unshift(selected.value)
    }
    return
  }
  if (!selected.value && projects.value.length) selected.value = projects.value[0]
  if (!projects.value.length) showCreate.value = true
}
async function createProject() { error.value = ''; loading.value = true; try { const project = await api('/projects', { method: 'POST', body: JSON.stringify(form) }); projects.value.unshift(project); selected.value = project; showCreate.value = false } catch (e) { error.value = e.message } finally { loading.value = false } }
async function runReview() { loading.value = true; error.value = ''; try { const project = await api(`/projects/${selected.value.id}/review`, { method: 'POST' }); selected.value = project; projects.value = projects.value.map((item) => item.id === project.id ? project : item) } catch (e) { error.value = e.message } finally { loading.value = false } }
function importText(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { form.material = String(reader.result || '') }; reader.readAsText(file) }
onMounted(() => loadProjects().catch((e) => { error.value = e.message }))
</script>

<template>
  <component :is="embedded ? 'div' : AppShell" class="project-tool-view" v-bind="embedded ? {} : { user, active: 'review', title: '项目智能评审', subtitle: '基于证据的六维项目分析与改进建议。' }" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <ProjectContextBar :project="project" active="review" @navigate="$emit('navigate', $event)" />
    <div class="review-layout" :class="{ 'workspace-review': project }">
      <aside class="project-rail"><div class="rail-heading"><div><h3>评审项目</h3><p>{{ projects.length }}个项目</p></div><button class="icon-button" title="新建项目" @click="showCreate = true"><Plus :size="17" /></button></div><button v-for="project in projects" :key="project.id" class="rail-project" :class="{ active: selected?.id === project.id }" @click="selected = project"><span>{{ project.name.slice(0, 1) }}</span><div><strong>{{ project.name }}</strong><small>{{ project.review ? `${project.review.total}分 · 已完成` : '等待评审' }}</small></div></button><button class="new-project-dashed" @click="showCreate = true"><Plus :size="16" />新建评审项目</button></aside>
      <main class="review-workspace"><template v-if="selected"><div class="review-heading"><div><p class="kicker">{{ selected.category }}</p><h2>{{ selected.name }}</h2><p>{{ selected.description }}</p></div><button class="button button-primary" :disabled="loading" @click="runReview"><Sparkles :size="17" />{{ loading ? 'Agent正在评审...' : review ? '重新评审' : '开始AI评审' }}</button></div><p v-if="error" class="error-banner">{{ error }}</p>
        <template v-if="review"><section class="review-overview"><article class="score-card"><div class="score-top"><div><span>综合评分</span><strong>{{ review.total }}</strong><small>/100</small></div><em>{{ review.mode === 'ai' ? 'AI智能评审' : '规则辅助评审' }}</em></div><p>{{ review.summary }}</p><div class="dimension-grid"><div v-for="item in review.dimensions" :key="item.key"><div><span>{{ item.label }} <small>{{ item.weight }}%</small></span><strong>{{ item.score }}</strong></div><div class="score-bar"><i :class="scoreTone(item.score)" :style="{ width: `${item.score}%` }"></i></div></div></div></article><article class="agent-trace"><div class="card-heading"><div><p class="kicker">AGENT TRACE</p><h3>评审执行路径</h3></div><ShieldCheck :size="22" /></div><ol><li><span><Check :size="13" /></span><div><strong>材料解析</strong><small>识别目标与技术关键词</small></div></li><li><span><Check :size="13" /></span><div><strong>证据检索</strong><small>定位评分原始依据</small></div></li><li><span><Check :size="13" /></span><div><strong>多维评分</strong><small>六项标准加权计算</small></div></li><li><span><Check :size="13" /></span><div><strong>风险核验</strong><small>检查材料缺口</small></div></li></ol></article></section>
          <section class="review-card"><div class="card-heading"><div><p class="kicker">PRIORITY FINDINGS</p><h3>优先改进项</h3></div><span>{{ review.findings.length }}项</span></div><div class="finding-list"><article v-for="(item, index) in review.findings" :key="item.title"><span class="finding-priority" :class="item.level">P{{ index + 1 }}</span><div><h4>{{ item.title }}</h4><p>{{ item.evidence }}</p><div><ChevronRight :size="15" />{{ item.action }}</div></div></article></div></section>
          <section class="review-card"><div class="card-heading"><div><p class="kicker">EVIDENCE CHAIN</p><h3>评分证据链</h3></div></div><div class="evidence-grid"><article v-for="item in review.evidence" :key="item.quote"><div><FileText :size="15" />{{ item.source }}</div><blockquote>“{{ item.quote }}”</blockquote><small>支撑维度：{{ item.dimension }}</small></article></div></section></template>
        <section v-else class="review-empty"><div><ScanSearch :size="32" /></div><h2>项目已就绪，等待首次评审</h2><p>AI Agent将读取材料、检索证据并生成六维评分与改进路线。</p><button class="button button-primary" @click="runReview"><Sparkles :size="17" />开始AI评审</button></section></template>
      </main>
    </div>
    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false"><form class="project-modal" @submit.prevent="createProject"><div class="modal-heading"><div><p class="kicker">NEW REVIEW</p><h2>创建评审项目</h2></div><button type="button" class="icon-button" @click="showCreate = false"><X :size="19" /></button></div><label>项目名称<input v-model="form.name" required /></label><label>项目方向<select v-model="form.category"><option>AI教育与学习平台</option><option>AI Agent智能助手</option><option>RAG知识问答系统</option><option>AI协同办公工具</option></select></label><label>项目简介<textarea v-model="form.description" rows="3" required></textarea></label><label>项目材料<textarea v-model="form.material" rows="7"></textarea></label><label class="file-import"><Upload :size="17" />导入TXT / Markdown<input type="file" accept=".txt,.md" @change="importText" /></label><p v-if="error" class="error-message">{{ error }}</p><div class="modal-actions"><button type="button" class="button button-ghost" @click="showCreate = false">取消</button><button class="button button-primary" :disabled="loading">创建项目<ArrowRight :size="16" /></button></div></form></div>
  </component>
</template>
