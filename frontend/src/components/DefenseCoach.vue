<script setup>
import { computed, ref } from 'vue'
import { Bot, CheckCircle2, ChevronRight, FolderPlus, MessageSquareText, Play, RotateCcw, Send } from 'lucide-vue-next'
import AppShell from './AppShell.vue'
import { loadAccountProjects } from '../projectStorage'

const props = defineProps({ user: Object, embedded: Boolean })
defineEmits(['navigate', 'logout'])
const projects = loadAccountProjects('review', props.user)
const selectedProject = ref(projects[0]?.id || '')
const trainingMode = ref('综合答辩 · 3 题')
const started = ref(false)
const current = ref(0)
const answer = ref('')
const feedback = ref('')
const questions = [
  { type: '技术追问', text: '你们的评审结果如何保证有证据支撑，而不是模型主观生成？', hint: '建议说明知识库检索、证据引用和评分规则之间的关系。' },
  { type: '产品价值', text: '与直接使用通用大模型相比，ProjectLens 的不可替代性是什么？', hint: '从结构化工作流、竞赛标准和持续迭代三个角度回答。' },
  { type: '风险质询', text: '如果模型给出错误评分，系统如何发现并纠正？', hint: '说明人工复核、局部重评、日志与规则校验机制。' },
]
const question = computed(() => questions[current.value])
function submitAnswer() {
  if (!answer.value.trim()) return
  feedback.value = answer.value.length > 80 ? '回答结构完整，已覆盖机制与结果。建议再补充一个量化案例，让可信度更强。' : '核心观点已经出现，但论据偏少。建议补充具体流程、数据或实际案例。'
}
function nextQuestion() {
  if (current.value < questions.length - 1) current.value += 1
  else current.value = 0
  answer.value = ''; feedback.value = ''
}
function restart() { started.value = false; current.value = 0; answer.value = ''; feedback.value = '' }
</script>

<template>
  <component :is="embedded ? 'div' : AppShell" v-bind="embedded ? {} : { user, active: 'coach', title: 'AI 答辩教练', subtitle: '模拟评委追问，训练清晰、可信、有证据的答辩表达。' }" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <main class="coach-page">
      <section class="tool-steps"><span class="active"><b>1</b>选择项目与模式</span><i></i><span :class="{ active: started }"><b>2</b>回答模拟问题</span><i></i><span :class="{ active: feedback }"><b>3</b>查看教练反馈</span></section>
      <section v-if="!projects.length" class="tool-empty"><FolderPlus :size="30" /><h2>先创建一个评审项目</h2><p>答辩问题会根据项目材料和评审结果生成。</p><button class="button button-primary" @click="$emit('navigate', 'review-projects')">前往项目评审</button></section>
      <section v-else-if="!started" class="coach-start"><div class="coach-intro"><span><Bot :size="28" /></span><p class="kicker">DEFENSE SIMULATION</p><h2>用三道追问完成一次模拟答辩</h2><p>选择项目和训练方向后，教练会逐题提问。你提交回答后会立即获得表达结构、证据充分度和改进建议。</p><div class="coach-flow-preview"><span><b>01</b>评委提问</span><ChevronRight :size="15" /><span><b>02</b>输入回答</span><ChevronRight :size="15" /><span><b>03</b>获得反馈</span></div></div><div class="coach-setup"><div class="setup-heading"><small>开始前设置</small><strong>本次训练约 5 分钟</strong></div><label>选择项目<select v-model="selectedProject"><option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option></select></label><label>训练模式<select v-model="trainingMode"><option>综合答辩 · 3 题</option><option>技术深挖 · 3 题</option><option>商业价值 · 3 题</option></select></label><div class="coach-notes"><MessageSquareText :size="18" /><p><strong>回答建议</strong>先给结论，再说明机制，最后用数据或案例证明。</p></div><button class="button button-primary button-wide" :disabled="!selectedProject" @click="started = true"><Play :size="16" />开始 {{ trainingMode }}</button></div></section>
      <section v-else class="coach-session"><header><div><p class="kicker">QUESTION {{ current + 1 }} / {{ questions.length }}</p><h2>{{ question.type }}</h2></div><button class="button button-ghost" @click="restart"><RotateCcw :size="15" />重新开始</button></header><div class="coach-progress"><i :style="{ width: `${((current + 1) / questions.length) * 100}%` }"></i></div><article class="coach-question"><span><Bot :size="22" /></span><div><small>模拟评委</small><h3>{{ question.text }}</h3></div></article><label class="coach-answer">你的回答<textarea v-model="answer" rows="7" placeholder="输入你的答辩回答，建议包含结论、依据和案例。"></textarea><small>{{ answer.length }} 字</small></label><div class="coach-actions"><button class="button button-primary" :disabled="!answer.trim()" @click="submitAnswer"><Send :size="15" />提交回答</button></div><article v-if="feedback" class="coach-feedback"><CheckCircle2 :size="20" /><div><strong>教练反馈</strong><p>{{ feedback }}</p><small>答题提示：{{ question.hint }}</small></div><button class="button button-ghost" @click="nextQuestion">下一题<ChevronRight :size="15" /></button></article></section>
    </main>
  </component>
</template>
