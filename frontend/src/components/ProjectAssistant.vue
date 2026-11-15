<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { ArrowUp, Bot, Check, ChevronDown, FileText, Lightbulb, MessageSquareText, Paperclip, Plus, RotateCcw, Sparkles, Square, X } from 'lucide-vue-next'
import { api } from '../api'
import ProjectContextBar from './ProjectContextBar.vue'

const props = defineProps({ user: Object, project: Object })
defineEmits(['navigate'])

const chatKey = computed(() => `projectlens_${props.user?.id || props.user?.email || 'anonymous'}_${props.project?.id || 'default'}_assistant_chat`)
const initialMessage = { id: 'welcome', role: 'assistant', content: `我是Duts项目助手。我已经连接「${props.project?.name || '当前项目'}」，可以基于项目简介、材料索引和工作流配置协助分析、改进与准备答辩。`, citations: [] }
const messages = ref(loadMessages())
const input = ref('')
const sending = ref(false)
const thinkingOpen = ref(true)
const chatBody = ref(null)
const fileInput = ref(null)
const error = ref('')
const attachments = ref([])
const mode = ref('项目问答')
const effort = ref('标准推理')
const menu = ref('')
const elapsed = ref(0)
let requestController = null
let elapsedTimer = null

const quickPrompts = [
  { icon: Lightbulb, text: '找出当前项目最需要改进的三点' },
  { icon: FileText, text: '根据项目资料整理核心亮点' },
  { icon: MessageSquareText, text: '模拟评委追问并组织回答' },
]
const modes = ['项目问答', '材料分析', '答辩准备']
const efforts = [
  { name: '快速响应', multiplier: 1, description: '优先速度，适合简单问答' },
  { name: '标准推理', multiplier: 2, description: '平衡速度与分析深度' },
  { name: '深度分析', multiplier: 3, description: '完整核验材料与项目证据' },
]
const currentEffort = computed(() => efforts.find((item) => item.name === effort.value) || efforts[1])
const projectContext = computed(() => {
  try {
    const raw = localStorage.getItem(`projectlens_${props.user?.id || props.user?.email || 'anonymous'}_${props.project?.id || 'default'}_workflow`)
    const workflow = raw ? JSON.parse(raw) : null
    const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : []
    const materials = nodes.flatMap((node) => [...(node.data?.config?.files || []), ...(node.data?.config?.folderFiles || [])])
    return {
      materials: [...new Set([...materials, ...attachments.value])],
      workflowNodes: nodes.map((node) => `${node.data?.label || node.id}：${node.data?.description || ''}`),
    }
  } catch { return { materials: [...attachments.value], workflowNodes: [] } }
})
const contextCount = computed(() => 1 + projectContext.value.materials.length + projectContext.value.workflowNodes.length)
const thinkingSteps = computed(() => [
  '读取项目概况与当前问题',
  projectContext.value.materials.length ? `检索${projectContext.value.materials.length}项材料索引` : '检查项目材料索引',
  effort.value === '深度分析' ? '交叉核验工作流与评审证据' : '组织项目针对性回答',
])

function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(chatKey.value) || '[]')
    return Array.isArray(saved) && saved.length ? saved : [initialMessage]
  } catch { return [initialMessage] }
}
function persist() { localStorage.setItem(chatKey.value, JSON.stringify(messages.value.slice(-40))) }
async function scrollToBottom() { await nextTick(); chatBody.value?.scrollTo({ top: chatBody.value.scrollHeight, behavior: 'smooth' }) }
function startTimer() {
  elapsed.value = 0
  window.clearInterval(elapsedTimer)
  const startedAt = performance.now()
  elapsedTimer = window.setInterval(() => { elapsed.value = (performance.now() - startedAt) / 1000 }, 100)
}
function stopTimer() { window.clearInterval(elapsedTimer); elapsedTimer = null }
function formatElapsed(value) { return `${value.toFixed(1)}s` }
async function sendMessage(text = input.value) {
  const question = text.trim()
  if (!question || sending.value) return
  error.value = ''
  messages.value.push({ id: `user-${Date.now()}`, role: 'user', content: question, attachments: [...attachments.value] })
  input.value = ''
  attachments.value = []
  menu.value = ''
  persist(); scrollToBottom()
  sending.value = true
  thinkingOpen.value = true
  startTimer()
  requestController = new AbortController()
  try {
    const response = await api('/assistant/chat', { method: 'POST', signal: requestController.signal, body: JSON.stringify({ project: props.project, question, messages: messages.value.slice(0, -1), context: projectContext.value, preferences: { mode: mode.value, effort: effort.value } }) })
    messages.value.push({ id: `assistant-${Date.now()}`, role: 'assistant', content: response.content, citations: response.citations || [], elapsed: elapsed.value })
    persist()
  } catch (requestError) {
    if (requestError.name !== 'AbortError') error.value = requestError.message
  } finally {
    sending.value = false
    thinkingOpen.value = false
    requestController = null
    stopTimer()
    scrollToBottom()
  }
}
function stopResponse() { requestController?.abort() }
function handleFiles(event) {
  attachments.value = [...new Set([...attachments.value, ...[...event.target.files].map((file) => file.name)])].slice(0, 8)
  event.target.value = ''
  menu.value = ''
}
function resetChat() {
  if (!window.confirm('确定清空当前项目的对话记录吗？')) return
  messages.value = [initialMessage]
  persist()
}
onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="project-assistant-page">
    <ProjectContextBar :project="project" active="assistant" @navigate="$emit('navigate', $event)" />
    <div class="assistant-workspace">
      <aside class="assistant-context-panel">
        <div class="assistant-persona">
          <div class="assistant-avatar" aria-label="ProjectLensAI助手形象"><span class="avatar-lens"><Bot :size="34" /></span><i></i><b><Sparkles :size="13" /></b></div>
          <div><p class="kicker">PROJECT COMPANION</p><h2>Duts项目助手</h2><span><i></i>已连接当前项目</span></div>
        </div>
        <section class="assistant-project-card"><small>当前知识库</small><strong>{{ project?.name }}</strong><p>{{ project?.description }}</p><div><span>{{ project?.category }}</span><em>{{ contextCount }}项上下文</em></div></section>
        <section class="context-sources"><header><div><h3>已读取内容</h3><p>对话会自动参考这些信息</p></div><Check :size="16" /></header><ul><li><span><FileText :size="15" /></span><div><strong>项目简介</strong><small>名称、方向、状态和描述</small></div></li><li><span><Paperclip :size="15" /></span><div><strong>项目材料</strong><small>{{ projectContext.materials.length ? `${projectContext.materials.length}个文件索引` : '暂未上传材料' }}</small></div></li><li><span><Sparkles :size="15" /></span><div><strong>工作流配置</strong><small>{{ projectContext.workflowNodes.length ? `${projectContext.workflowNodes.length}个节点` : '使用默认项目上下文' }}</small></div></li></ul></section>
        <button class="assistant-reset" @click="resetChat"><RotateCcw :size="15" />清空本项目对话</button>
      </aside>

      <main class="assistant-chat-panel codex-chat-panel">
        <header class="assistant-chat-head"><div><h1>Duts项目助手</h1><p>{{ project?.name }}<span>·</span>项目上下文已同步</p></div><span><i></i>{{ mode }}</span></header>
        <div ref="chatBody" class="assistant-chat-body codex-chat-body">
          <div v-if="messages.length === 1" class="assistant-starter codex-starter"><span><Sparkles :size="19" /></span><h2>和项目一起开始</h2><p>Duts会读取「{{ project?.name }}」的项目资料、材料索引和工作流配置。</p><div><button v-for="prompt in quickPrompts" :key="prompt.text" @click="sendMessage(prompt.text)"><component :is="prompt.icon" :size="16" /><span>{{ prompt.text }}</span><ArrowUp :size="14" /></button></div></div>
          <article v-for="message in messages" :key="message.id" class="assistant-message codex-message" :class="message.role">
            <div v-if="message.role === 'assistant'" class="message-avatar"><Bot :size="17" /></div>
            <div class="message-content"><small>{{ message.role === 'assistant' ? 'Duts' : user?.name }}</small><div v-if="message.attachments?.length" class="message-attachments"><span v-for="file in message.attachments" :key="file"><FileText :size="12" />{{ file }}</span></div><p>{{ message.content }}</p><div v-if="message.citations?.length" class="message-citations"><span v-for="citation in message.citations" :key="`${citation.label}-${citation.detail}`"><FileText :size="12" /><b>{{ citation.label }}</b>{{ citation.detail }}</span></div><em v-if="message.role === 'assistant' && message.elapsed">思考了{{ formatElapsed(message.elapsed) }}</em></div>
          </article>
          <div v-if="sending" class="assistant-thinking codex-thinking"><button @click="thinkingOpen = !thinkingOpen"><Sparkles :size="15" /><span class="thinking-shimmer">正在分析项目</span><time>{{ formatElapsed(elapsed) }}</time><ChevronDown :size="14" :class="{ open: thinkingOpen }" /></button><div :class="{ open: thinkingOpen }"><span v-for="(step, index) in thinkingSteps" :key="step"><Check v-if="index < thinkingSteps.length - 1" :size="12" /><i v-else></i>{{ step }}</span></div></div>
          <p v-if="error" class="assistant-error">{{ error }}</p>
        </div>

        <footer class="assistant-composer codex-composer">
          <div v-if="menu" class="composer-menu">
            <template v-if="menu === 'add'"><button @click="fileInput?.click()"><Paperclip :size="16" /><span><strong>添加文件</strong><small>加入本次项目对话</small></span></button><button @click="menu = ''"><FileText :size="16" /><span><strong>项目知识库</strong><small>已自动连接{{ contextCount }}项上下文</small></span><Check :size="14" /></button></template>
            <template v-else-if="menu === 'mode'"><button v-for="item in modes" :key="item" @click="mode = item; menu = ''"><span><strong>{{ item }}</strong><small>{{ item === '项目问答' ? '围绕项目上下文回答' : item === '材料分析' ? '重点检索材料与证据' : '以评委视角准备表达' }}</small></span><Check v-if="mode === item" :size="14" /></button></template>
            <template v-else><button v-for="item in efforts" :key="item.name" @click="effort = item.name; menu = ''"><Sparkles :size="15" /><span><strong>{{ item.name }}<em>{{ item.multiplier }}x用量</em></strong><small>{{ item.description }}</small></span><Check v-if="effort === item.name" :size="14" /></button></template>
          </div>
          <div class="codex-input-shell" @click="menu = ''">
            <div v-if="attachments.length" class="composer-attachments"><span v-for="file in attachments" :key="file"><FileText :size="12" />{{ file }}<button title="移除附件" @click.stop="attachments = attachments.filter((item) => item !== file)"><X :size="11" /></button></span></div>
            <textarea v-model="input" rows="1" maxlength="2000" placeholder="询问项目方案、技术路径、评审改进或答辩准备" @keydown.enter.exact.prevent="sendMessage()"></textarea>
            <div class="composer-toolbar">
              <button class="composer-icon" title="添加文件和上下文" @click.stop="menu = menu === 'add' ? '' : 'add'"><Plus :size="17" /></button>
              <button class="composer-pick" @click.stop="menu = menu === 'mode' ? '' : 'mode'">{{ mode }}<ChevronDown :size="12" /></button>
              <button class="composer-pick" @click.stop="menu = menu === 'effort' ? '' : 'effort'"><Sparkles :size="13" />{{ effort }}<b>{{ currentEffort.multiplier }}x</b><ChevronDown :size="12" /></button>
              <span></span>
              <button v-if="sending" class="composer-send armed" title="停止生成" @click.stop="stopResponse"><Square :size="14" /></button>
              <button v-else class="composer-send" :class="{ armed: input.trim() }" :disabled="!input.trim()" title="发送" @click.stop="sendMessage()"><ArrowUp :size="17" /></button>
            </div>
          </div>
          <div class="composer-meta"><span>Enter发送</span><span>本次对话计入{{ currentEffort.multiplier }}x会员用量</span></div>
          <input ref="fileInput" hidden type="file" multiple @change="handleFiles" />
        </footer>
      </main>
    </div>
  </div>
</template>
