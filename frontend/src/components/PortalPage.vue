<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, BarChart3, Blocks, Bot, Check, ChevronRight, CirclePlay, Crown, Database, FileOutput, FileSearch, FileText, FolderKanban, Gauge, GraduationCap, MessageCircleMore, MessageSquareText, Mic2, Settings, Sparkles, Trophy, Upload, UserRoundCheck, Users, Workflow } from 'lucide-vue-next'
import SiteFooter from './SiteFooter.vue'

defineProps({ user: Object })
defineEmits(['auth', 'navigate'])

const showcaseIndex = ref(0)
let showcaseTimer = null

function stopShowcase() {
  if (showcaseTimer) window.clearInterval(showcaseTimer)
  showcaseTimer = null
}
function startShowcase() {
  stopShowcase()
  showcaseTimer = window.setInterval(() => { showcaseIndex.value = (showcaseIndex.value + 1) % 4 }, 3000)
}
function selectShowcase(index) {
  showcaseIndex.value = index
  startShowcase()
}

onMounted(startShowcase)
onBeforeUnmount(stopShowcase)

const tools = [
  { id: 'workflow', icon: Workflow, tone: 'blue', title: '节点式工作流', text: '拖拽材料、知识库、模型、评审与报告节点，连接成可运行的自动化流程。', meta: '可视化编排 · 单节点测试 · 操作撤回' },
  { id: 'review', icon: FileSearch, tone: 'green', title: '项目智能评审', text: '依据项目材料生成六维评分、证据引用、风险定位与可执行改进建议。', meta: 'AI竞赛六维评分 · 证据链' },
  { id: 'analysis', icon: BarChart3, tone: 'orange', title: '迭代效果分析', text: '对比不同评审版本，量化分数变化、问题关闭率和每轮改进成果。', meta: '版本对比 · 趋势洞察' },
  { id: 'coach', icon: Bot, tone: 'violet', title: 'AI答辩教练', text: '模拟评委连续追问，并从表达结构、证据充分度和可信度给出反馈。', meta: '模拟答辩 · 即时反馈' },
]

const capabilities = [
  { icon: FileOutput, title: '评审报告导出', text: '生成带品牌抬头、评分图表、证据链和改进任务的PDF报告。' },
  { icon: Sparkles, title: '多模型接入', text: '支持国内外多个模型，并可为不同节点配置模型、推理等级和用量倍率。' },
  { icon: Gauge, title: '会员与用量控制', text: '按4小时、24小时和总用量统计，不同会员等级使用独立限额。' },
  { icon: Users, title: '独立管理后台', text: '统一管理用户、会员订阅、到期时间、用量与系统运营数据。' },
]

const featureGuide = [
  { id: 'workflow', icon: Workflow, title: '节点式Agent工作台', purpose: '把原本分散的读取材料、调用模型、执行评审和导出报告组合成一条自动运行的流程。', input: '上传项目材料，选择模型与推理等级，连接需要执行的节点。', output: '一套可以保存、复用和继续调整的项目工作流，以及完整评审报告。' },
  { id: 'review', icon: FileSearch, title: '项目智能评审', purpose: '解决“项目哪里做得好、哪里缺少证据、下一步先改什么”三个核心问题。', input: '项目简介，以及DOCX、Excel、Markdown或TXT材料正文。', output: '六维评分、材料原文证据、风险问题和按优先级排列的改进动作。' },
  { id: 'analysis', icon: BarChart3, title: '迭代效果分析', purpose: '避免每次修改后只能凭感觉判断效果，用历史版本验证改进是否真正有效。', input: '同一项目不同时间生成的评审版本和问题处理结果。', output: '评分变化、已改善与待解决问题，以及下一轮应重点推进的方向。' },
  { id: 'coach', icon: Bot, title: 'AI答辩教练', purpose: '提前暴露答辩中可能被追问的技术、产品和可信度问题，并训练回答方式。', input: '当前项目资料、评审报告，以及你针对模拟问题输入的真实回答。', output: '表达结构、证据充分度和可信度分析，附改进建议与下一轮追问。' },
  { id: 'assistant', icon: MessageCircleMore, title: 'Duts项目AI助手', purpose: '减少重复描述项目背景，让每一次问答都能建立在当前项目资料和已有分析上。', input: '项目简介、上传材料、工作流配置和最近一次评审结果。', output: '能够引用项目事实、延续上下文并协助决策的项目专属AI对话。' },
]

const scenarios = [
  { icon: Trophy, title: '大学生竞赛团队', text: '在提交作品前检查材料完整度、技术深度和创新表达，并生成答辩准备依据。', points: ['赛前项目体检', '改进任务排序', '模拟评委追问'] },
  { icon: GraduationCap, title: '课程与毕业项目', text: '将阶段材料和每轮修改持续沉淀，形成可回顾、可比较的项目成长记录。', points: ['阶段成果评审', '版本变化追踪', '课程汇报准备'] },
  { icon: UserRoundCheck, title: '教师与项目指导', text: '快速了解学生项目现状和材料缺口，把指导时间集中在高影响问题上。', points: ['统一评审维度', '证据化反馈', '团队进度复盘'] },
]

const comparisonRows = [
  { label: '项目上下文', traditional: '材料分散在文档和聊天记录中', general: '每次对话都要重新描述背景', projectLens: '所有工具共享同一个项目上下文' },
  { label: '评审依据', traditional: '依赖个人经验，标准容易变化', general: '能给建议，但依据通常不可追溯', projectLens: '结合评分维度并引用材料原文证据' },
  { label: '改进跟踪', traditional: '手动记录，难以比较前后变化', general: '对话结束后缺少版本沉淀', projectLens: '保存历次评审并分析版本变化' },
  { label: '自动化流程', traditional: '多个步骤分别操作、重复整理', general: '以单次问答为主，流程不可复用', projectLens: '通过节点工作台编排并自动保存' },
  { label: '答辩准备', traditional: '团队内部模拟，反馈维度有限', general: '通用追问，与项目材料联系较弱', projectLens: '基于项目资料分析回答并继续追问' },
  { label: '成果输出', traditional: '自行整理文档和图表', general: '通常只得到一段文本回答', projectLens: '生成评分图表、证据链和PDF报告' },
]
</script>

<template>
  <div class="portal portal-v2">
    <header class="portal-nav shell-width"><button class="portal-logo" @click="$emit('navigate', 'portal')"><span><img src="/brand/brand-mark.png" alt="" /></span><strong>ProjectLens</strong><small>by DuTeam</small></button><nav><a href="#product">产品能力</a><a href="#workspace-flow">使用流程</a><button @click="$emit('navigate', 'pricing')">会员中心</button></nav><div class="portal-actions"><button class="button button-ghost admin-entry" title="进入管理后台" @click="$emit('navigate', 'admin')"><Settings :size="15" />管理后台</button><template v-if="!user"><button class="button button-ghost" @click="$emit('auth', 'login')">登录</button><button class="button button-primary" @click="$emit('auth', 'register')">免费注册<ArrowRight :size="15" /></button></template><button v-else class="button button-primary" @click="$emit('navigate', 'projects')">进入项目空间<ArrowRight :size="15" /></button></div></header>

    <main>
      <section class="portal-hero portal-hero-v2 shell-width">
        <div class="hero-copy"><div class="announcement"><span>2026</span>项目空间、四类AI工具与项目助手已上线<ChevronRight :size="14" /></div><h1>为一个项目，<br>建立专属的<br><em>AI工作流</em></h1><p>DuTeam ProjectLens面向大学生竞赛与课程项目。先创建项目，再在同一空间内编排工作流、完成智能评审、追踪改进效果并与Duts项目助手持续协作。</p><div class="hero-actions"><button class="button button-primary button-large" @click="user ? $emit('navigate', 'projects') : $emit('auth', 'register')"><FolderKanban :size="17" />{{ user ? '打开项目空间' : '免费创建项目' }}</button><button class="button button-ghost button-large" @click="user ? $emit('navigate', { page: 'assistant', selectProject: true }) : $emit('auth', 'login')"><CirclePlay :size="17" />体验Duts项目助手</button></div><div class="hero-proof"><span><Check :size="14" />项目数据按账号隔离</span><span><Check :size="14" />支持国内外多个模型</span><span><Check :size="14" />可导出PDF评审报告</span></div></div>

        <div class="hero-showcase" aria-label="ProjectLens产品功能预览" @mouseenter="stopShowcase" @mouseleave="startShowcase">
          <div class="showcase-slide" :class="{ active: showcaseIndex === 0 }" aria-label="项目空间预览"><div class="workspace-preview"><div class="workspace-preview-bar"><div><span><img src="/brand/brand-mark.png" alt="" /></span><div><small>当前项目</small><strong>DuTeam ProjectLens</strong></div></div><em>进行中</em></div><div class="workspace-preview-body"><aside><i></i><i></i><i></i><i></i></aside><div class="workspace-preview-main"><div class="workspace-preview-head"><div><small>PROJECT WORKSPACE</small><h2>项目改进工作区</h2></div><span>自动保存</span></div><div class="workspace-preview-tools"><article class="active"><span><Workflow :size="17" /></span><div><strong>节点式工作流</strong><small>5个节点 · 运行成功</small></div><Check :size="15" /></article><article><span><Blocks :size="17" /></span><div><strong>项目智能评审</strong><small>综合评分82 · 3项建议</small></div><ChevronRight :size="15" /></article><article><span><BarChart3 :size="17" /></span><div><strong>迭代效果分析</strong><small>当前版本较基准 +14分</small></div><ChevronRight :size="15" /></article><article><span><Bot :size="17" /></span><div><strong>AI答辩教练</strong><small>综合答辩 · 3题</small></div><ChevronRight :size="15" /></article><article class="assistant-preview-entry"><span><MessageCircleMore :size="17" /></span><div><strong>Duts项目助手</strong><small>项目知识库已同步 · 可连续对话</small></div><ChevronRight :size="15" /></article></div><div class="workspace-preview-foot"><span><FileOutput :size="15" />评审报告已就绪</span><span><Gauge :size="15" />本次用量3x</span></div></div></div></div></div>

          <div class="showcase-slide" :class="{ active: showcaseIndex === 1 }" aria-label="节点式工作台预览"><div class="product-preview workflow-showcase"><header><div><span><Workflow :size="17" /></span><div><small>WORKFLOW STUDIO</small><strong>节点式Agent工作台</strong></div></div><em><i></i>运行中</em></header><div class="workflow-demo-body"><aside><button><Upload :size="15" /><span>文件输入</span></button><button><Database :size="15" /><span>知识库</span></button><button><Bot :size="15" /><span>AI Agent</span></button><button><FileOutput :size="15" /><span>报告输出</span></button></aside><div class="workflow-demo-canvas"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path id="showcase-flow-a" d="M28 48 C32 48 32 20 36 20" /><path id="showcase-flow-b" d="M28 48 C32 48 32 80 36 80" /><path id="showcase-flow-c" d="M60 20 C66 20 66 48 72 48" /><path id="showcase-flow-d" d="M60 80 C66 80 66 48 72 48" /><circle r=".8"><animateMotion dur="2.4s" repeatCount="indefinite"><mpath href="#showcase-flow-a" /></animateMotion></circle><circle r=".8"><animateMotion begin=".7s" dur="2.4s" repeatCount="indefinite"><mpath href="#showcase-flow-b" /></animateMotion></circle><circle r=".8"><animateMotion begin="1.3s" dur="2.4s" repeatCount="indefinite"><mpath href="#showcase-flow-c" /></animateMotion></circle></svg><article class="demo-node input"><span><Upload :size="15" /></span><small>INPUT</small><strong>读取项目材料</strong><em>6个文件</em></article><article class="demo-node parser"><span><FileSearch :size="15" /></span><small>PARSER</small><strong>材料结构化</strong><em>提取目标与证据</em></article><article class="demo-node knowledge"><span><Database :size="15" /></span><small>KNOWLEDGE</small><strong>检索评分标准</strong><em>已命中12条</em></article><article class="demo-node agent"><span><Bot :size="15" /></span><small>AGENT</small><strong>AI评审</strong><em>正在核验证据</em></article></div></div><footer><span>4个节点运行正常</span><b>保存工作流</b></footer></div></div>

          <div class="showcase-slide" :class="{ active: showcaseIndex === 2 }" aria-label="AI模拟答辩预览"><div class="product-preview coach-showcase"><header><div><span><Mic2 :size="17" /></span><div><small>AI DEFENSE COACH</small><strong>AI模拟答辩 · 第2题</strong></div></div><em>综合答辩</em></header><div class="coach-demo-body"><div class="coach-demo-progress"><i></i><span>2 / 5</span></div><div class="demo-message ai"><span><Bot :size="15" /></span><div><small>AI评委</small><p>你们如何保证评审结论有充分的项目证据支撑？</p></div></div><div class="demo-message user"><div><small>我的回答</small><p>系统会定位原始材料片段，并将每项评分与规则、证据和改进建议关联。</p></div><span>DU</span></div><div class="coach-demo-thinking"><MessageSquareText :size="14" /><span>正在分析回答</span><i></i><i></i><i></i></div><div class="coach-demo-scores"><div><span>证据充分度</span><strong>86</strong><i><b style="width:86%"></b></i></div><div><span>表达结构</span><strong>82</strong><i><b style="width:82%"></b></i></div></div></div><footer><span><Check :size="13" />回答已记录</span><b>继续追问</b></footer></div></div>

          <div class="showcase-slide" :class="{ active: showcaseIndex === 3 }" aria-label="Duts项目助手预览"><div class="product-preview assistant-showcase"><header><div><span><MessageCircleMore :size="17" /></span><div><small>PROJECT COMPANION</small><strong>Duts项目助手</strong></div></div><em><i></i>知识库已同步</em></header><div class="assistant-demo-body"><aside><div class="assistant-demo-avatar"><span><Bot :size="28" /></span><i></i><b><Sparkles :size="11" /></b></div><strong>Duts</strong><small>项目专属助手</small><div><span><FileText :size="13" />项目简介</span><span><Workflow :size="13" />5个工作流节点</span><span><Database :size="13" />6个材料索引</span></div></aside><main><div class="assistant-demo-message user">这个项目目前最需要改进什么？</div><div class="assistant-demo-thought"><Sparkles :size="13" /><span>正在检索项目资料</span><i></i><i></i><i></i></div><div class="assistant-demo-message lens"><span><Bot :size="14" /></span><p>建议优先补齐量化验证、评分证据映射和真实团队使用数据。</p></div><div class="assistant-demo-citations"><span><FileText :size="12" />项目简介</span><span><FileText :size="12" />评审流程配置</span></div></main></div><footer><span><Check :size="13" />回答基于当前项目</span><b>继续对话 · 1x用量</b></footer></div></div>

          <div class="showcase-dots" role="tablist" aria-label="切换产品预览"><button v-for="index in 4" :key="index" :class="{ active: showcaseIndex === index - 1 }" :aria-label="`查看第${index}个产品预览`" @click="selectShowcase(index - 1)"></button></div>
        </div>
      </section>

      <section id="product" class="tool-section product-system shell-width"><div class="section-heading"><div><p class="kicker">PROJECT TOOLCHAIN</p><h2>围绕一个项目，完成四类关键工作</h2></div><p>用AI推进项目构建，所有工具共享项目上下文；Duts项目AI助手可随时基于项目资料继续对话。</p></div><div class="portal-tool-grid portal-tool-grid-v2"><button v-for="(tool, index) in tools" :key="tool.id" class="portal-tool-card" @click="user ? $emit('navigate', { page: tool.id, selectProject: true }) : $emit('auth', 'login')"><span class="tool-icon" :class="`tool-${tool.tone}`"><component :is="tool.icon" :size="22" /></span><span class="tool-card-index">0{{ index + 1 }}</span><h3>{{ tool.title }}</h3><p>{{ tool.text }}</p><div><small>{{ tool.meta }}</small><ArrowRight :size="17" /></div></button></div></section>

      <section class="feature-guide-section"><div class="shell-width"><div class="section-heading feature-guide-heading"><div><p class="kicker">WHAT EACH TOOL DELIVERS</p><h2>五项能力，分别解决什么问题</h2></div><p>每项能力都有明确的输入和结果，并且共享同一个项目空间，不需要在不同工具之间重复整理背景资料。</p></div><div class="feature-guide-table"><header><span>功能</span><span>解决的问题</span><span>你需要提供</span><span>最终得到</span></header><article v-for="item in featureGuide" :key="item.id"><span class="feature-guide-name"><i><component :is="item.icon" :size="20" /></i><strong>{{ item.title }}</strong></span><p>{{ item.purpose }}</p><div><b>输入</b><span>{{ item.input }}</span></div><div><b>产出</b><span>{{ item.output }}</span></div></article></div></div></section>

      <section id="workspace-flow" class="workspace-flow"><div class="shell-width workspace-flow-inner"><div class="workspace-flow-copy"><p class="kicker">ONE PROJECT, ONE CONTEXT</p><h2>从创建项目开始，结果持续沉淀。</h2><p>项目不是一次性表单，而是工作流、评审结果、版本变化和答辩训练的共同载体。每次操作都回到同一个项目空间。</p><button class="button button-primary" @click="user ? $emit('navigate', 'projects') : $emit('auth', 'register')">进入项目空间<ArrowRight :size="16" /></button></div><ol class="workspace-flow-steps"><li><b>01</b><div><strong>创建项目</strong><p>录入项目方向、简介与基础材料。</p></div></li><li><b>02</b><div><strong>选择工具</strong><p>进入工作流、评审、迭代分析或答辩教练。</p></div></li><li><b>03</b><div><strong>运行与改进</strong><p>查看证据、评分和建议，持续更新项目。</p></div></li><li><b>04</b><div><strong>沉淀成果</strong><p>导出评审报告，为答辩和复盘提供依据。</p></div></li></ol></div></section>

      <section class="operations-section shell-width"><div class="section-heading"><div><p class="kicker">PRODUCT OPERATIONS</p><h2>从使用到运营，产品能力完整闭环</h2></div><p>前台负责项目工具与会员体验，后台负责用户、订阅和用量管理，敏感模型配置通过环境变量保留在服务端。</p></div><div class="capability-grid"><article v-for="item in capabilities" :key="item.title"><span><component :is="item.icon" :size="20" /></span><div><h3>{{ item.title }}</h3><p>{{ item.text }}</p></div></article></div></section>

      <section class="portal-scenarios"><div class="shell-width"><div class="section-heading"><div><p class="kicker">WHO IT HELPS</p><h2>从参赛准备到项目指导，都能直接使用</h2></div><p>ProjectLens适合需要持续整理材料、验证项目质量并准备展示表达的学生团队和指导教师。</p></div><div class="scenario-grid"><article v-for="scenario in scenarios" :key="scenario.title"><span><component :is="scenario.icon" :size="22" /></span><h3>{{ scenario.title }}</h3><p>{{ scenario.text }}</p><ul><li v-for="point in scenario.points" :key="point"><Check :size="14" />{{ point }}</li></ul></article></div></div></section>

      <section class="portal-comparison shell-width"><div class="section-heading"><div><p class="kicker">WHY PROJECTLENS</p><h2>不只是多一个AI对话框</h2></div><p>ProjectLens把通用模型能力放进项目工作流中，让分析有材料依据、改进有版本记录、最终结果可以沉淀和复用。</p></div><div class="comparison-table"><header><span>对比维度</span><span>传统项目评审</span><span>通用AI平台</span><span>DuTeam ProjectLens</span></header><div v-for="row in comparisonRows" :key="row.label"><strong>{{ row.label }}</strong><p>{{ row.traditional }}</p><p>{{ row.general }}</p><p><Check :size="15" />{{ row.projectLens }}</p></div></div></section>

      <section class="portal-cta shell-width"><div><span><Crown :size="20" /></span><div><small>MEMBERSHIP & USAGE</small><h2>根据团队使用强度选择会员方案</h2><p>会员中心可公开查看，购买操作需要登录；当前付款功能暂未开放。</p></div></div><button class="button button-light" @click="$emit('navigate', 'pricing')">查看会员方案<ArrowRight :size="16" /></button></section>
    </main>
    <SiteFooter show-disclaimer />
  </div>
</template>
