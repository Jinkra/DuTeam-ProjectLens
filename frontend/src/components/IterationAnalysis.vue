<script setup>
import { computed, ref } from 'vue'
import { ArrowUpRight, BarChart3, CheckCircle2, FolderPlus, GitCompareArrows, LoaderCircle, Play, TrendingUp } from 'lucide-vue-next'
import AppShell from './AppShell.vue'
import ProjectContextBar from './ProjectContextBar.vue'

const props = defineProps({ user: Object, embedded: Boolean, project: Object })
defineEmits(['navigate', 'logout'])
const baseline = ref('v1.0 初次评审')
const target = ref('v1.3 当前版本')
const analyzing = ref(false)
const analysisReady = ref(false)
const dimensions = [
  { name: '创新性', before: 68, after: 82 }, { name: '技术实现', before: 72, after: 86 },
  { name: '完整度', before: 61, after: 84 }, { name: '用户价值', before: 75, after: 88 },
  { name: '工程质量', before: 66, after: 80 }, { name: '展示表达', before: 70, after: 85 },
]
const averageBefore = computed(() => Math.round(dimensions.reduce((sum, item) => sum + item.before, 0) / dimensions.length))
const averageAfter = computed(() => Math.round(dimensions.reduce((sum, item) => sum + item.after, 0) / dimensions.length))
async function runAnalysis() {
  if (!props.project || baseline.value === target.value) return
  analyzing.value = true
  await new Promise((resolve) => setTimeout(resolve, 650))
  analysisReady.value = true
  analyzing.value = false
}
</script>

<template>
  <component :is="embedded ? 'div' : AppShell" v-bind="embedded ? {} : { user, active: 'analysis', title: '迭代效果分析', subtitle: '对比评审版本，确认每次改进带来的真实变化。' }" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <ProjectContextBar :project="project" active="analysis" @navigate="$emit('navigate', $event)" />
    <main class="analysis-page">
      <section class="tool-steps"><span class="active"><b>1</b>当前项目</span><i></i><span class="active"><b>2</b>选择对比版本</span><i></i><span :class="{ active: analysisReady }"><b>3</b>查看分析结果</span></section>
      <section v-if="!project" class="tool-empty"><FolderPlus :size="30" /><h2>先创建一个项目</h2><p>创建后即可在项目内进行迭代分析。</p><button class="button button-primary" @click="$emit('navigate', 'projects')">前往项目空间</button></section>
      <template v-else><section class="analysis-controls"><div><p class="kicker">VERSION COMPARISON</p><h2>{{ project.name }} · 版本对比</h2><p>系统会汇总评分变化、已关闭问题和下一步建议。</p></div><div class="analysis-selectors"><label>基准版本<select v-model="baseline" @change="analysisReady = false"><option>v1.0 初次评审</option><option>v1.1 结构优化</option></select></label><GitCompareArrows :size="18" /><label>对比版本<select v-model="target" @change="analysisReady = false"><option>v1.3 当前版本</option><option>v1.2 功能完善</option></select></label><button class="button button-primary analysis-run" :disabled="analyzing || baseline === target" @click="runAnalysis"><LoaderCircle v-if="analyzing" class="spin" :size="16" /><Play v-else :size="16" />{{ analyzing ? '正在分析...' : '生成对比分析' }}</button></div></section>
      <section v-if="!analysisReady" class="analysis-placeholder"><GitCompareArrows :size="28" /><h3>配置完成后开始分析</h3><p>选择两个不同评审版本，点击“生成对比分析”即可查看变化。</p></section>
      <template v-else><section class="analysis-summary"><article><span><BarChart3 :size="20" /></span><div><small>综合评分</small><strong>{{ averageAfter }}</strong><em>较基准 +{{ averageAfter - averageBefore }}</em></div></article><article><span><TrendingUp :size="20" /></span><div><small>提升维度</small><strong>6 / 6</strong><em>全部维度正向提升</em></div></article><article><span><CheckCircle2 :size="20" /></span><div><small>问题关闭</small><strong>8 / 11</strong><em>完成率 73%</em></div></article></section>
      <section class="analysis-grid"><article class="dimension-panel"><div class="panel-title"><div><h3>六维评分变化</h3><p>{{ baseline }} 对比 {{ target }}</p></div><span>+{{ averageAfter - averageBefore }} 分</span></div><div class="dimension-list"><div v-for="item in dimensions" :key="item.name" class="dimension-row"><strong>{{ item.name }}</strong><div class="dimension-track"><i :style="{ width: `${item.before}%` }"></i><b :style="{ width: `${item.after}%` }"></b></div><small>{{ item.before }} → <em>{{ item.after }}</em></small></div></div></article><article class="improvement-panel"><div class="panel-title"><div><h3>本轮关键进展</h3><p>根据两次评审结果自动归纳。</p></div></div><ul><li><CheckCircle2 :size="17" /><div><strong>补齐核心工作流闭环</strong><p>从材料输入、智能评审到 PDF 报告导出已形成完整路径。</p></div></li><li><CheckCircle2 :size="17" /><div><strong>增强项目证据表达</strong><p>评分项已关联材料来源，评审结论的可解释性明显提升。</p></div></li><li><ArrowUpRight :size="17" /><div><strong>下一步：增加真实用户验证</strong><p>建议补充 3–5 组实际项目测试数据与使用反馈。</p></div></li></ul></article></section></template></template>
    </main>
  </component>
</template>
