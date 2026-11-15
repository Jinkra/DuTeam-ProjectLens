<script setup>
import { computed, ref } from 'vue'
import { ArrowUpRight, BarChart3, CheckCircle2, GitCompareArrows, TrendingUp } from 'lucide-vue-next'
import AppShell from './AppShell.vue'
import { loadAccountProjects } from '../projectStorage'

const props = defineProps({ user: Object, embedded: Boolean })
defineEmits(['navigate', 'logout'])
const projects = loadAccountProjects('review', props.user)
const selectedProject = ref(projects[0]?.id || '')
const baseline = ref('v1.0 初次评审')
const target = ref('v1.3 当前版本')
const dimensions = [
  { name: '创新性', before: 68, after: 82 }, { name: '技术实现', before: 72, after: 86 },
  { name: '完整度', before: 61, after: 84 }, { name: '用户价值', before: 75, after: 88 },
  { name: '工程质量', before: 66, after: 80 }, { name: '展示表达', before: 70, after: 85 },
]
const averageBefore = computed(() => Math.round(dimensions.reduce((sum, item) => sum + item.before, 0) / dimensions.length))
const averageAfter = computed(() => Math.round(dimensions.reduce((sum, item) => sum + item.after, 0) / dimensions.length))
</script>

<template>
  <component :is="embedded ? 'div' : AppShell" v-bind="embedded ? {} : { user, active: 'analysis', title: '迭代效果分析', subtitle: '对比评审版本，确认每次改进带来的真实变化。' }" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <main class="analysis-page">
      <section class="analysis-controls"><div><p class="kicker">VERSION COMPARISON</p><h2>迭代效果分析</h2><p>选择项目和评审版本，查看六维评分变化与问题关闭情况。</p></div><div class="analysis-selectors"><label>项目<select v-model="selectedProject"><option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option></select></label><label>基准版本<select v-model="baseline"><option>v1.0 初次评审</option><option>v1.1 结构优化</option></select></label><GitCompareArrows :size="18" /><label>对比版本<select v-model="target"><option>v1.3 当前版本</option><option>v1.2 功能完善</option></select></label></div></section>
      <section class="analysis-summary"><article><span><BarChart3 :size="20" /></span><div><small>综合评分</small><strong>{{ averageAfter }}</strong><em>较基准 +{{ averageAfter - averageBefore }}</em></div></article><article><span><TrendingUp :size="20" /></span><div><small>提升维度</small><strong>6 / 6</strong><em>全部维度正向提升</em></div></article><article><span><CheckCircle2 :size="20" /></span><div><small>问题关闭</small><strong>8 / 11</strong><em>完成率 73%</em></div></article></section>
      <section class="analysis-grid"><article class="dimension-panel"><div class="panel-title"><div><h3>六维评分变化</h3><p>{{ baseline }} 对比 {{ target }}</p></div><span>+{{ averageAfter - averageBefore }} 分</span></div><div class="dimension-list"><div v-for="item in dimensions" :key="item.name" class="dimension-row"><strong>{{ item.name }}</strong><div class="dimension-track"><i :style="{ width: `${item.before}%` }"></i><b :style="{ width: `${item.after}%` }"></b></div><small>{{ item.before }} → <em>{{ item.after }}</em></small></div></div></article><article class="improvement-panel"><div class="panel-title"><div><h3>本轮关键进展</h3><p>根据两次评审结果自动归纳。</p></div></div><ul><li><CheckCircle2 :size="17" /><div><strong>补齐核心工作流闭环</strong><p>从材料输入、智能评审到 PDF 报告导出已形成完整路径。</p></div></li><li><CheckCircle2 :size="17" /><div><strong>增强项目证据表达</strong><p>评分项已关联材料来源，评审结论的可解释性明显提升。</p></div></li><li><ArrowUpRight :size="17" /><div><strong>下一步：增加真实用户验证</strong><p>建议补充 3–5 组实际项目测试数据与使用反馈。</p></div></li></ul></article></section>
    </main>
  </component>
</template>
