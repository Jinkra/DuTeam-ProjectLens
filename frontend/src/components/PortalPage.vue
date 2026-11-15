<script setup>
import { ArrowRight, BarChart3, Blocks, Bot, Check, ChevronRight, CirclePlay, Crown, FileOutput, FileSearch, FolderKanban, Gauge, Settings, Sparkles, Users, Workflow } from 'lucide-vue-next'
import SiteFooter from './SiteFooter.vue'

defineProps({ user: Object })
defineEmits(['auth', 'navigate'])

const tools = [
  { id: 'workflow', icon: Workflow, tone: 'blue', title: '节点式工作流', text: '拖拽材料、知识库、模型、评审与报告节点，连接成可运行的自动化流程。', meta: '可视化编排 · 单节点测试 · 操作撤回' },
  { id: 'review', icon: FileSearch, tone: 'green', title: '项目智能评审', text: '依据项目材料生成六维评分、证据引用、风险定位与可执行改进建议。', meta: 'AI 竞赛六维评分 · 证据链' },
  { id: 'analysis', icon: BarChart3, tone: 'orange', title: '迭代效果分析', text: '对比不同评审版本，量化分数变化、问题关闭率和每轮改进成果。', meta: '版本对比 · 趋势洞察' },
  { id: 'coach', icon: Bot, tone: 'violet', title: 'AI 答辩教练', text: '模拟评委连续追问，并从表达结构、证据充分度和可信度给出反馈。', meta: '模拟答辩 · 即时反馈' },
]

const capabilities = [
  { icon: FileOutput, title: '评审报告导出', text: '生成带品牌抬头、评分图表、证据链和改进任务的 PDF 报告。' },
  { icon: Sparkles, title: '多模型接入', text: '支持国内外多个模型，并可为不同节点配置模型、推理等级和用量倍率。' },
  { icon: Gauge, title: '会员与用量控制', text: '按 4 小时、24 小时和总用量统计，不同会员等级使用独立限额。' },
  { icon: Users, title: '独立管理后台', text: '统一管理用户、会员订阅、到期时间、用量与系统运营数据。' },
]
</script>

<template>
  <div class="portal portal-v2">
    <header class="portal-nav shell-width"><button class="portal-logo" @click="$emit('navigate', 'portal')"><span><img src="/brand/brand-mark.png" alt="" /></span><strong>ProjectLens</strong><small>by DuTeam</small></button><nav><a href="#product">产品能力</a><a href="#workspace-flow">使用流程</a><button @click="$emit('navigate', 'pricing')">会员中心</button></nav><div class="portal-actions"><button class="button button-ghost admin-entry" title="进入管理后台" @click="$emit('navigate', 'admin')"><Settings :size="15" />管理后台</button><template v-if="!user"><button class="button button-ghost" @click="$emit('auth', 'login')">登录</button><button class="button button-primary" @click="$emit('auth', 'register')">免费注册<ArrowRight :size="15" /></button></template><button v-else class="button button-primary" @click="$emit('navigate', 'projects')">进入项目空间<ArrowRight :size="15" /></button></div></header>

    <main>
      <section class="portal-hero portal-hero-v2 shell-width">
        <div class="hero-copy"><div class="announcement"><span>2026</span>项目空间与四类 AI 工具已上线<ChevronRight :size="14" /></div><h1>一个项目，贯穿评审、<br><em>迭代与答辩。</em></h1><p>DuTeam ProjectLens 面向大学生竞赛与课程项目。先创建项目，再在同一空间内编排工作流、完成智能评审、追踪改进效果并训练答辩。</p><div class="hero-actions"><button class="button button-primary button-large" @click="user ? $emit('navigate', 'projects') : $emit('auth', 'register')"><FolderKanban :size="17" />{{ user ? '打开项目空间' : '免费创建项目' }}</button><button class="button button-ghost button-large" @click="user ? $emit('navigate', { page: 'review', selectProject: true }) : $emit('auth', 'login')"><CirclePlay :size="17" />体验项目评审</button></div><div class="hero-proof"><span><Check :size="14" />项目数据按账号隔离</span><span><Check :size="14" />支持国内外多个模型</span><span><Check :size="14" />可导出 PDF 评审报告</span></div></div>

        <div class="workspace-preview" aria-label="ProjectLens 项目空间预览"><div class="workspace-preview-bar"><div><span><img src="/brand/brand-mark.png" alt="" /></span><div><small>当前项目</small><strong>DuTeam ProjectLens</strong></div></div><em>进行中</em></div><div class="workspace-preview-body"><aside><i></i><i></i><i></i><i></i></aside><div class="workspace-preview-main"><div class="workspace-preview-head"><div><small>PROJECT WORKSPACE</small><h2>项目改进工作区</h2></div><span>自动保存</span></div><div class="workspace-preview-tools"><article class="active"><span><Workflow :size="17" /></span><div><strong>节点式工作流</strong><small>5 个节点 · 运行成功</small></div><Check :size="15" /></article><article><span><Blocks :size="17" /></span><div><strong>项目智能评审</strong><small>综合评分 82 · 3 项建议</small></div><ChevronRight :size="15" /></article><article><span><BarChart3 :size="17" /></span><div><strong>迭代效果分析</strong><small>当前版本较基准 +14 分</small></div><ChevronRight :size="15" /></article><article><span><Bot :size="17" /></span><div><strong>AI 答辩教练</strong><small>综合答辩 · 3 题</small></div><ChevronRight :size="15" /></article></div><div class="workspace-preview-foot"><span><FileOutput :size="15" />评审报告已就绪</span><span><Gauge :size="15" />本次用量 3x</span></div></div></div></div>
      </section>

      <section id="product" class="tool-section product-system shell-width"><div class="section-heading"><div><p class="kicker">PROJECT TOOLCHAIN</p><h2>围绕一个项目，完成四类关键工作</h2></div><p>每个工具共享当前项目上下文，无需重复填写项目名称、方向和材料，切换后即可继续工作。</p></div><div class="portal-tool-grid portal-tool-grid-v2"><button v-for="(tool, index) in tools" :key="tool.id" class="portal-tool-card" @click="user ? $emit('navigate', { page: tool.id, selectProject: true }) : $emit('auth', 'login')"><span class="tool-icon" :class="`tool-${tool.tone}`"><component :is="tool.icon" :size="22" /></span><span class="tool-card-index">0{{ index + 1 }}</span><h3>{{ tool.title }}</h3><p>{{ tool.text }}</p><div><small>{{ tool.meta }}</small><ArrowRight :size="17" /></div></button></div></section>

      <section id="workspace-flow" class="workspace-flow"><div class="shell-width workspace-flow-inner"><div class="workspace-flow-copy"><p class="kicker">ONE PROJECT, ONE CONTEXT</p><h2>从创建项目开始，结果持续沉淀。</h2><p>项目不是一次性表单，而是工作流、评审结果、版本变化和答辩训练的共同载体。每次操作都回到同一个项目空间。</p><button class="button button-primary" @click="user ? $emit('navigate', 'projects') : $emit('auth', 'register')">进入项目空间<ArrowRight :size="16" /></button></div><ol class="workspace-flow-steps"><li><b>01</b><div><strong>创建项目</strong><p>录入项目方向、简介与基础材料。</p></div></li><li><b>02</b><div><strong>选择工具</strong><p>进入工作流、评审、迭代分析或答辩教练。</p></div></li><li><b>03</b><div><strong>运行与改进</strong><p>查看证据、评分和建议，持续更新项目。</p></div></li><li><b>04</b><div><strong>沉淀成果</strong><p>导出评审报告，为答辩和复盘提供依据。</p></div></li></ol></div></section>

      <section class="operations-section shell-width"><div class="section-heading"><div><p class="kicker">PRODUCT OPERATIONS</p><h2>从使用到运营，第一版能力已经闭环</h2></div><p>前台负责项目工具与会员体验，后台负责用户、订阅和用量管理，敏感模型配置通过环境变量保留在服务端。</p></div><div class="capability-grid"><article v-for="item in capabilities" :key="item.title"><span><component :is="item.icon" :size="20" /></span><div><h3>{{ item.title }}</h3><p>{{ item.text }}</p></div></article></div></section>

      <section class="portal-cta shell-width"><div><span><Crown :size="20" /></span><div><small>MEMBERSHIP & USAGE</small><h2>根据团队使用强度选择会员方案</h2><p>会员中心可公开查看，购买操作需要登录；当前付款功能暂未开放。</p></div></div><button class="button button-light" @click="$emit('navigate', 'pricing')">查看会员方案<ArrowRight :size="16" /></button></section>
    </main>
    <SiteFooter />
  </div>
</template>
