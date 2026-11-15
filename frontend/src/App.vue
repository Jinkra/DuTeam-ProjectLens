<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ArrowRight, Check, ChevronRight, CircleUserRound, FileText, FolderKanban, LogOut, Plus, ScanSearch, ShieldCheck, Sparkles, Target, Upload, X } from 'lucide-vue-next'
import { api } from './api'

const token = ref(localStorage.getItem('projectlens_token'))
const user = ref(JSON.parse(localStorage.getItem('projectlens_user') || 'null'))
const authMode = ref('login')
const auth = reactive({ name: '', email: '', password: '' })
const projects = ref([])
const selected = ref(null)
const showCreate = ref(false)
const loading = ref(false)
const error = ref('')
const form = reactive({ name: 'ProjectLens', category: 'AI 教育与学习平台', description: '面向大学生竞赛与课程项目的证据驱动型 AI 评审与改进 Agent。', material: '项目采用 Vue + Node.js 构建，通过 Agent 工作流分析项目材料，使用 RAG 检索证据并按竞赛评分标准生成可解释评分、问题诊断与改进路线。系统支持多模态材料分析、工具调用过程展示、局部重评和改进前后对比。' })

const review = computed(() => selected.value?.review)
const scoreTone = (score) => score >= 80 ? 'great' : score >= 70 ? 'good' : 'warn'

async function submitAuth() {
  error.value = ''; loading.value = true
  try {
    const path = authMode.value === 'login' ? '/auth/login' : '/auth/register'
    const data = await api(path, { method: 'POST', body: JSON.stringify(auth) })
    token.value = data.token; user.value = data.user
    localStorage.setItem('projectlens_token', data.token)
    localStorage.setItem('projectlens_user', JSON.stringify(data.user))
    await loadProjects()
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

async function loadProjects() {
  projects.value = await api('/projects')
  if (!selected.value && projects.value.length) selected.value = projects.value[0]
  if (!projects.value.length) showCreate.value = true
}

async function createProject() {
  error.value = ''; loading.value = true
  try {
    const project = await api('/projects', { method: 'POST', body: JSON.stringify(form) })
    projects.value.unshift(project); selected.value = project; showCreate.value = false
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

async function runReview() {
  loading.value = true; error.value = ''
  try {
    const project = await api(`/projects/${selected.value.id}/review`, { method: 'POST' })
    selected.value = project
    projects.value = projects.value.map((item) => item.id === project.id ? project : item)
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

function importText(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.material = String(reader.result || '') }
  reader.readAsText(file)
}

function logout() {
  localStorage.removeItem('projectlens_token'); localStorage.removeItem('projectlens_user')
  token.value = null; user.value = null; projects.value = []; selected.value = null
}

onMounted(() => { if (token.value) loadProjects().catch(logout) })
</script>

<template>
  <main v-if="!token" class="auth-shell">
    <section class="auth-story">
      <div class="brand-mark"><ScanSearch :size="22" /> <span>DuTeam / ProjectLens</span></div>
      <div class="story-copy">
        <p class="eyebrow">Evidence-driven review agent</p>
        <h1>让评审意见<br><span>有据可循。</span></h1>
        <p>从项目材料中检索证据，按竞赛标准完成评审，再把每一分转化为可执行的改进任务。</p>
      </div>
      <div class="trace-preview">
        <div><Check :size="14" /> 读取项目材料</div><div><Check :size="14" /> 建立证据索引</div><div class="active"><Sparkles :size="14" /> 生成评审结论</div>
      </div>
    </section>
    <section class="auth-panel">
      <form class="auth-form" @submit.prevent="submitAuth">
        <div><p class="eyebrow">{{ authMode === 'login' ? 'Welcome back' : 'Create workspace' }}</p><h2>{{ authMode === 'login' ? '登录评审工作台' : '创建你的工作台' }}</h2></div>
        <label v-if="authMode === 'register'">姓名<input v-model="auth.name" required placeholder="你的姓名" /></label>
        <label>邮箱<input v-model="auth.email" type="email" required placeholder="name@example.com" /></label>
        <label>密码<input v-model="auth.password" type="password" required minlength="6" placeholder="至少 6 位" /></label>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="primary wide" :disabled="loading">{{ loading ? '处理中...' : authMode === 'login' ? '登录' : '创建账号' }} <ArrowRight :size="17" /></button>
        <button type="button" class="text-button" @click="authMode = authMode === 'login' ? 'register' : 'login'; error = ''">{{ authMode === 'login' ? '没有账号？创建一个' : '已有账号？返回登录' }}</button>
      </form>
    </section>
  </main>

  <main v-else class="app-shell">
    <aside class="sidebar">
      <div class="brand-mark"><ScanSearch :size="21" /><span>ProjectLens</span></div>
      <nav><button class="nav-item active"><FolderKanban :size="18" />项目评审</button><button class="nav-item"><Target :size="18" />评分标准</button></nav>
      <div class="side-section"><div class="side-label"><span>最近项目</span><button title="创建项目" @click="showCreate = true"><Plus :size="16" /></button></div><button v-for="project in projects" :key="project.id" class="project-link" :class="{ active: selected?.id === project.id }" @click="selected = project"><span>{{ project.name.slice(0, 1) }}</span><div><strong>{{ project.name }}</strong><small>{{ project.review ? `${project.review.total} 分` : '待评审' }}</small></div></button></div>
      <div class="user-card"><CircleUserRound :size="30" /><div><strong>{{ user.name }}</strong><small>{{ user.email }}</small></div><button title="退出登录" @click="logout"><LogOut :size="16" /></button></div>
    </aside>

    <section class="workspace">
      <header class="topbar"><div><span class="status-dot"></span>AI 评审服务已就绪</div><button class="secondary" @click="showCreate = true"><Plus :size="16" />新建项目</button></header>

      <div v-if="selected" class="content">
        <div class="project-heading"><div><p class="eyebrow">{{ selected.category }}</p><h1>{{ selected.name }}</h1><p>{{ selected.description }}</p></div><button class="primary" :disabled="loading" @click="runReview"><Sparkles :size="17" />{{ loading ? 'Agent 正在评审...' : review ? '重新评审' : '开始 AI 评审' }}</button></div>
        <p v-if="error" class="error banner">{{ error }}</p>

        <template v-if="review">
          <section class="review-grid">
            <article class="score-panel">
              <div class="panel-title"><div><span>综合评分</span><strong>{{ review.total }}</strong><small>/ 100</small></div><span class="mode-badge">{{ review.mode === 'ai' ? '真实 AI' : review.mode === 'fallback' ? '降级模式' : '演示模式' }}</span></div>
              <p>{{ review.summary }}</p>
              <div class="dimension-list"><div v-for="item in review.dimensions" :key="item.key"><div><span>{{ item.label }} <small>{{ item.weight }}%</small></span><strong>{{ item.score }}</strong></div><div class="bar"><i :class="scoreTone(item.score)" :style="{ width: `${item.score}%` }"></i></div></div></div>
            </article>
            <article class="trace-panel">
              <div class="section-title"><div><p class="eyebrow">Agent trace</p><h2>本次评审路径</h2></div><ShieldCheck :size="22" /></div>
              <ol class="trace"><li class="done"><span><Check :size="14" /></span><div><strong>材料解析</strong><small>识别项目目标与技术关键词</small></div></li><li class="done"><span><Check :size="14" /></span><div><strong>证据检索</strong><small>定位评分结论的原始依据</small></div></li><li class="done"><span><Check :size="14" /></span><div><strong>多维评分</strong><small>按六项竞赛标准加权计算</small></div></li><li class="done"><span><Check :size="14" /></span><div><strong>风险核验</strong><small>检查材料缺口与不可证实结论</small></div></li></ol>
            </article>
          </section>
          <section class="findings-section"><div class="section-title"><div><p class="eyebrow">Priority findings</p><h2>优先改进项</h2></div><span>{{ review.findings.length }} 项</span></div><div class="finding-list"><article v-for="(item, index) in review.findings" :key="item.title" class="finding"><span class="priority" :class="item.level">P{{ index + 1 }}</span><div><h3>{{ item.title }}</h3><p>{{ item.evidence }}</p><div class="action"><ChevronRight :size="15" /><span>{{ item.action }}</span></div></div></article></div></section>
          <section class="evidence-section"><div class="section-title"><div><p class="eyebrow">Evidence chain</p><h2>评分证据链</h2></div></div><div class="evidence-grid"><article v-for="item in review.evidence" :key="item.quote"><div><FileText :size="16" /><span>{{ item.source }}</span></div><blockquote>“{{ item.quote }}”</blockquote><small>支撑维度：{{ item.dimension }}</small></article></div></section>
        </template>
        <section v-else class="empty-review"><div class="scan-ring"><ScanSearch :size="34" /></div><h2>项目已就绪，等待首次评审</h2><p>Agent 将读取材料、检索证据并生成六维评分与改进路线。</p><button class="primary" @click="runReview"><Sparkles :size="17" />开始 AI 评审</button></section>
      </div>
    </section>

    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <form class="modal" @submit.prevent="createProject"><div class="modal-head"><div><p class="eyebrow">New review</p><h2>创建评审项目</h2></div><button type="button" title="关闭" @click="showCreate = false"><X :size="20" /></button></div><label>项目名称<input v-model="form.name" required /></label><label>项目方向<select v-model="form.category"><option>AI 教育与学习平台</option><option>AI Agent 智能助手</option><option>RAG 知识问答系统</option><option>AI 协同办公工具</option><option>AI 数据分析与可视化</option></select></label><label>项目简介<textarea v-model="form.description" required rows="3"></textarea></label><label>项目材料 <span>支持粘贴 README、方案书或需求说明</span><textarea v-model="form.material" rows="7"></textarea></label><label class="upload"><Upload :size="17" /><span>导入 TXT / Markdown 文件</span><input type="file" accept=".txt,.md,text/plain,text/markdown" @change="importText" /></label><p v-if="error" class="error">{{ error }}</p><div class="modal-actions"><button type="button" class="secondary" @click="showCreate = false">取消</button><button class="primary" :disabled="loading">{{ loading ? '创建中...' : '创建项目' }}<ArrowRight :size="16" /></button></div></form>
    </div>
  </main>
</template>
