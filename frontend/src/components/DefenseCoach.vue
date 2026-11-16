<script setup>
import { computed, ref } from 'vue'
import { Bot, CheckCircle2, ChevronRight, FolderPlus, LoaderCircle, MessageSquareText, Play, RotateCcw, Send } from 'lucide-vue-next'
import { api } from '../api'
import AppShell from './AppShell.vue'
import ProjectContextBar from './ProjectContextBar.vue'

const props = defineProps({ user: Object, embedded: Boolean, project: Object })
defineEmits(['navigate', 'logout'])
const trainingMode = ref('综合答辩 · 3题')
const started = ref(false)
const current = ref(0)
const answer = ref('')
const feedback = ref(null)
const analyzing = ref(false)
const error = ref('')
const questions = [
  { type: '技术追问', text: '你们的评审结果如何保证有证据支撑，而不是模型主观生成？', hint: '建议说明知识库检索、证据引用和评分规则之间的关系。' },
  { type: '产品价值', text: '与直接使用通用大模型相比，ProjectLens的不可替代性是什么？', hint: '从结构化工作流、竞赛标准和持续迭代三个角度回答。' },
  { type: '风险质询', text: '如果模型给出错误评分，系统如何发现并纠正？', hint: '说明人工复核、局部重评、日志与规则校验机制。' },
]
const question = computed(() => questions[current.value])
function workflowReport() {
  try {
    const key = `projectlens_${props.user?.id || props.user?.email || 'anonymous'}_${props.project?.id || 'default'}_workflow`
    return JSON.parse(localStorage.getItem(key) || 'null')?.latestReport || null
  } catch { return null }
}
async function submitAnswer() {
  if (!answer.value.trim()) return
  analyzing.value = true; error.value = ''; feedback.value = null
  try {
    feedback.value = await api(`/projects/${props.project.id}/defense/analyze`, {
      method: 'POST',
      body: JSON.stringify({ question: question.value.text, answer: answer.value, providerId: 'deepseek', workflowReport: workflowReport() }),
    })
  } catch (e) { error.value = e.message } finally { analyzing.value = false }
}
function nextQuestion() {
  if (current.value < questions.length - 1) current.value += 1
  else current.value = 0
  answer.value = ''; feedback.value = null; error.value = ''
}
function restart() { started.value = false; current.value = 0; answer.value = ''; feedback.value = null; error.value = '' }
</script>

<template>
  <component :is="embedded ? 'div' : AppShell" class="project-tool-view" v-bind="embedded ? {} : { user, active: 'coach', title: 'AI答辩教练', subtitle: '模拟评委追问，训练清晰、可信、有证据的答辩表达。' }" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <ProjectContextBar :project="project" active="coach" @navigate="$emit('navigate', $event)" />
    <main class="coach-page">
      <section class="tool-steps"><span class="active"><b>1</b>选择项目与模式</span><i></i><span :class="{ active: started }"><b>2</b>回答模拟问题</span><i></i><span :class="{ active: feedback }"><b>3</b>查看教练反馈</span></section>
      <section v-if="!project" class="tool-empty"><FolderPlus :size="30" /><h2>先创建一个项目</h2><p>创建后即可在项目内进行答辩训练。</p><button class="button button-primary" @click="$emit('navigate', 'projects')">前往项目空间</button></section>
      <section v-else-if="!started" class="coach-start"><div class="coach-intro"><span><Bot :size="28" /></span><p class="kicker">DEFENSE SIMULATION</p><h2>为「{{ project.name }}」进行模拟答辩</h2><p>选择训练方向后，教练会逐题提问。你提交回答后会立即获得表达结构、证据充分度和改进建议。</p><div class="coach-flow-preview"><span><b>01</b>评委提问</span><ChevronRight :size="15" /><span><b>02</b>输入回答</span><ChevronRight :size="15" /><span><b>03</b>获得反馈</span></div></div><div class="coach-setup"><div class="setup-heading"><small>当前项目：{{ project.name }}</small><strong>本次训练约5分钟</strong></div><label>训练模式<select v-model="trainingMode"><option>综合答辩 · 3题</option><option>技术深挖 · 3题</option><option>商业价值 · 3题</option></select></label><div class="coach-notes"><MessageSquareText :size="18" /><p><strong>回答建议</strong>先给结论，再说明机制，最后用数据或案例证明。</p></div><button class="button button-primary button-wide" @click="started = true"><Play :size="16" />开始{{ trainingMode }}</button></div></section>
      <section v-else class="coach-session"><header><div><p class="kicker">QUESTION {{ current + 1 }} / {{ questions.length }}</p><h2>{{ question.type }}</h2></div><button class="button button-ghost" @click="restart"><RotateCcw :size="15" />重新开始</button></header><div class="coach-progress"><i :style="{ width: `${((current + 1) / questions.length) * 100}%` }"></i></div><article class="coach-question"><span><Bot :size="22" /></span><div><small>模拟评委</small><h3>{{ question.text }}</h3></div></article><label class="coach-answer">你的回答<textarea v-model="answer" rows="7" placeholder="输入你的答辩回答，建议包含结论、依据和案例。"></textarea><small>{{ answer.length }}字</small></label><div class="coach-actions"><button class="button button-primary" :disabled="!answer.trim() || analyzing" @click="submitAnswer"><LoaderCircle v-if="analyzing" class="spin" :size="15" /><Send v-else :size="15" />{{ analyzing ? 'AI正在分析...' : '提交回答' }}</button></div><p v-if="error" class="error-banner">{{ error }}</p><article v-if="feedback" class="coach-feedback"><CheckCircle2 :size="20" /><div><strong>AI教练分析</strong><p>{{ feedback.summary }}</p><div class="coach-feedback-scores"><span>表达结构<b>{{ feedback.structure ?? '-' }}</b></span><span>证据充分度<b>{{ feedback.evidence ?? '-' }}</b></span><span>可信度<b>{{ feedback.credibility ?? '-' }}</b></span></div><ul><li v-for="item in feedback.suggestions" :key="item">{{ item }}</li></ul><small v-if="feedback.followUp">追问：{{ feedback.followUp }}</small></div><button class="button button-ghost" @click="nextQuestion">下一题<ChevronRight :size="15" /></button></article></section>
    </main>
  </component>
</template>
