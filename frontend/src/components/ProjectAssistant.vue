<script setup>
import { computed, nextTick, ref } from 'vue'
import { ArrowUp, BookOpen, Bot, Check, ChevronDown, FileText, Lightbulb, MessageSquareText, Paperclip, RotateCcw, Sparkles } from 'lucide-vue-next'
import { api } from '../api'
import ProjectContextBar from './ProjectContextBar.vue'

const props = defineProps({ user: Object, project: Object })
defineEmits(['navigate'])

const chatKey = computed(() => `projectlens_${props.user?.id || props.user?.email || 'anonymous'}_${props.project?.id || 'default'}_assistant_chat`)
const initialMessage = { id: 'welcome', role: 'assistant', content: `我是 Duts 项目助手。我已经连接「${props.project?.name || '当前项目'}」，可以基于项目简介、材料索引和工作流配置协助分析、改进与准备答辩。`, citations: [] }
const messages = ref(loadMessages())
const input = ref('')
const sending = ref(false)
const thinkingOpen = ref(true)
const chatBody = ref(null)
const error = ref('')

const quickPrompts = [
  { icon: Lightbulb, text: '这个项目目前最需要改进的三点是什么？' },
  { icon: BookOpen, text: '根据项目资料整理一份核心亮点。' },
  { icon: MessageSquareText, text: '模拟评委追问，并帮我组织回答。' },
]
const projectContext = computed(() => {
  try {
    const raw = localStorage.getItem(`projectlens_${props.user?.id || props.user?.email || 'anonymous'}_${props.project?.id || 'default'}_workflow`)
    const workflow = raw ? JSON.parse(raw) : null
    const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : []
    const materials = nodes.flatMap((node) => [...(node.data?.config?.files || []), ...(node.data?.config?.folderFiles || [])])
    return {
      materials: [...new Set(materials)],
      workflowNodes: nodes.map((node) => `${node.data?.label || node.id}：${node.data?.description || ''}`),
    }
  } catch { return { materials: [], workflowNodes: [] } }
})
const contextCount = computed(() => 1 + projectContext.value.materials.length + projectContext.value.workflowNodes.length)

function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(chatKey.value) || '[]')
    return Array.isArray(saved) && saved.length ? saved : [initialMessage]
  } catch { return [initialMessage] }
}
function persist() { localStorage.setItem(chatKey.value, JSON.stringify(messages.value.slice(-40))) }
async function scrollToBottom() { await nextTick(); chatBody.value?.scrollTo({ top: chatBody.value.scrollHeight, behavior: 'smooth' }) }
async function sendMessage(text = input.value) {
  const question = text.trim()
  if (!question || sending.value) return
  error.value = ''
  messages.value.push({ id: `user-${Date.now()}`, role: 'user', content: question })
  input.value = ''
  persist(); scrollToBottom()
  sending.value = true
  thinkingOpen.value = true
  try {
    const response = await api('/assistant/chat', { method: 'POST', body: JSON.stringify({
      project: props.project,
      question,
      messages: messages.value.slice(0, -1),
      context: projectContext.value,
    }) })
    messages.value.push({ id: `assistant-${Date.now()}`, role: 'assistant', content: response.content, citations: response.citations || [] })
    persist()
  } catch (requestError) { error.value = requestError.message } finally { sending.value = false; thinkingOpen.value = false; scrollToBottom() }
}
function resetChat() {
  if (!window.confirm('确定清空当前项目的对话记录吗？')) return
  messages.value = [initialMessage]
  persist()
}
</script>

<template>
  <div class="project-assistant-page">
    <ProjectContextBar :project="project" active="assistant" @navigate="$emit('navigate', $event)" />
    <div class="assistant-workspace">
      <aside class="assistant-context-panel">
        <div class="assistant-persona">
          <div class="assistant-avatar" aria-label="ProjectLens AI 助手形象"><span class="avatar-lens"><Bot :size="34" /></span><i></i><b><Sparkles :size="13" /></b></div>
          <div><p class="kicker">PROJECT COMPANION</p><h2>Duts 项目助手</h2><span><i></i>已连接当前项目</span></div>
        </div>
        <section class="assistant-project-card"><small>当前知识库</small><strong>{{ project?.name }}</strong><p>{{ project?.description }}</p><div><span>{{ project?.category }}</span><em>{{ contextCount }} 项上下文</em></div></section>
        <section class="context-sources"><header><div><h3>已读取内容</h3><p>对话会自动参考这些信息</p></div><Check :size="16" /></header><ul><li><span><FileText :size="15" /></span><div><strong>项目简介</strong><small>名称、方向、状态和描述</small></div></li><li><span><Paperclip :size="15" /></span><div><strong>项目材料</strong><small>{{ projectContext.materials.length ? `${projectContext.materials.length} 个文件索引` : '暂未上传材料' }}</small></div></li><li><span><Sparkles :size="15" /></span><div><strong>工作流配置</strong><small>{{ projectContext.workflowNodes.length ? `${projectContext.workflowNodes.length} 个节点` : '使用默认项目上下文' }}</small></div></li></ul></section>
        <button class="assistant-reset" @click="resetChat"><RotateCcw :size="15" />清空本项目对话</button>
      </aside>

      <main class="assistant-chat-panel">
        <header class="assistant-chat-head"><div><h1>和 Duts 讨论项目</h1><p>回答只围绕当前项目上下文，并标注使用的资料。</p></div><span><i></i>上下文已同步</span></header>
        <div ref="chatBody" class="assistant-chat-body">
          <div v-if="messages.length === 1" class="assistant-starter"><span><Sparkles :size="18" /></span><h2>从项目本身开始提问</h2><p>我会结合「{{ project?.name }}」的资料回答，而不是给出泛泛建议。</p><div><button v-for="prompt in quickPrompts" :key="prompt.text" @click="sendMessage(prompt.text)"><component :is="prompt.icon" :size="16" /><span>{{ prompt.text }}</span></button></div></div>
          <article v-for="message in messages" :key="message.id" class="assistant-message" :class="message.role"><div v-if="message.role === 'assistant'" class="message-avatar"><Bot :size="17" /></div><div class="message-content"><small>{{ message.role === 'assistant' ? 'Duts 项目助手' : user?.name }}</small><p>{{ message.content }}</p><div v-if="message.citations?.length" class="message-citations"><span v-for="citation in message.citations" :key="`${citation.label}-${citation.detail}`"><FileText :size="12" /><b>{{ citation.label }}</b>{{ citation.detail }}</span></div></div></article>
          <div v-if="sending" class="assistant-thinking"><button @click="thinkingOpen = !thinkingOpen"><Sparkles :size="15" /><span>正在分析项目上下文</span><i></i><i></i><i></i><ChevronDown :size="14" :class="{ open: thinkingOpen }" /></button><div v-if="thinkingOpen"><span><Check :size="12" />读取项目概况</span><span><Check :size="12" />检索材料与工作流</span><span><i></i>组织针对性回答</span></div></div>
          <p v-if="error" class="assistant-error">{{ error }}</p>
        </div>
        <footer class="assistant-composer"><div class="assistant-input-wrap"><textarea v-model="input" rows="1" maxlength="2000" placeholder="询问项目方案、技术路径、评审改进或答辩准备..." @keydown.enter.exact.prevent="sendMessage()"></textarea><button :disabled="!input.trim() || sending" title="发送" @click="sendMessage()"><ArrowUp :size="18" /></button></div><div><span>Enter 发送 · 每次对话计入 1x 会员用量</span><span>当前项目：{{ project?.name }}</span></div></footer>
      </main>
    </div>
  </div>
</template>
