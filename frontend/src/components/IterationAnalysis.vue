<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowUpRight, BarChart3, CheckCircle2, FolderPlus, GitCompareArrows, LoaderCircle, Play, TrendingUp } from 'lucide-vue-next'
import { api } from '../api'
import AppShell from './AppShell.vue'
import ProjectContextBar from './ProjectContextBar.vue'

const props = defineProps({ user: Object, embedded: Boolean, project: Object })
defineEmits(['navigate', 'logout'])
const versions = ref([]); const baseline = ref(''); const target = ref(''); const loadingVersions = ref(false); const versionError = ref('')
const analyzing = ref(false); const analysisReady = ref(false); const analysisProgress = ref(0); const analysisStage = ref('准备分析')
let analysisTimer
const baselineVersion = computed(() => versions.value.find((item) => item.id === baseline.value))
const targetVersion = computed(() => versions.value.find((item) => item.id === target.value))
const dimensions = computed(() => (targetVersion.value?.dimensions || []).map((item) => ({ name: item.label, before: baselineVersion.value?.dimensions?.find((entry) => entry.key === item.key)?.score || 0, after: item.score })))
const averageBefore = computed(() => baselineVersion.value?.total || 0)
const averageAfter = computed(() => targetVersion.value?.total || 0)
const improvedDimensions = computed(() => dimensions.value.filter((item) => item.after > item.before).length)
const issueDifference = computed(() => (baselineVersion.value?.findings?.length || 0) - (targetVersion.value?.findings?.length || 0))
const formatDate = (value) => value ? new Date(value).toLocaleDateString('zh-CN') : ''

async function loadVersions() {
  if (!props.project) return
  loadingVersions.value = true; versionError.value = ''
  try {
    const projects = await api('/projects')
    const current = projects.find((item) => item.id === props.project.id) || projects.find((item) => item.name === props.project.name)
    versions.value = current?.reviewVersions || (current?.review ? [current.review] : [])
    if (versions.value.length >= 2) { baseline.value = versions.value.at(-2).id; target.value = versions.value.at(-1).id }
  } catch (error) { versionError.value = error.message } finally { loadingVersions.value = false }
}
async function runAnalysis() {
  if (!props.project || !baseline.value || baseline.value === target.value) return
  analyzing.value = true; analysisReady.value = false
  const stages = [{ at: 8, text: '正在读取评审版本' }, { at: 28, text: '正在对齐六维指标' }, { at: 52, text: '正在计算评分差异' }, { at: 74, text: '正在核对问题变化' }, { at: 90, text: '正在归纳下一步建议' }]
  analysisProgress.value = 5; analysisStage.value = stages[0].text; clearInterval(analysisTimer)
  analysisTimer = setInterval(() => { if (analysisProgress.value >= 92) return; analysisProgress.value += analysisProgress.value < 60 ? 4 : 2; analysisStage.value = [...stages].reverse().find((stage) => analysisProgress.value >= stage.at)?.text || stages[0].text }, 150)
  await new Promise((resolve) => setTimeout(resolve, 4200)); clearInterval(analysisTimer); analysisProgress.value = 100; analysisStage.value = '迭代分析完成'
  await new Promise((resolve) => setTimeout(resolve, 350)); analysisReady.value = true; analyzing.value = false
}
onMounted(loadVersions)
onBeforeUnmount(() => clearInterval(analysisTimer))
</script>

<template>
  <component :is="embedded ? 'div' : AppShell" class="project-tool-view" v-bind="embedded ? {} : { user, active: 'analysis', title: '迭代效果分析', subtitle: '对比评审版本，确认每次改进带来的真实变化。' }" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <ProjectContextBar :project="project" active="analysis" @navigate="$emit('navigate', $event)" />
    <main class="analysis-page">
      <section class="tool-steps"><span class="active"><b>1</b>当前项目</span><i></i><span class="active"><b>2</b>选择对比版本</span><i></i><span :class="{ active: analysisReady }"><b>3</b>查看分析结果</span></section>
      <section v-if="!project" class="tool-empty"><FolderPlus :size="30" /><h2>先创建一个项目</h2><p>创建后即可在项目内进行迭代分析。</p><button class="button button-primary" @click="$emit('navigate', 'projects')">前往项目空间</button></section>
      <section v-else-if="loadingVersions" class="analysis-placeholder"><LoaderCircle class="spin" :size="28" /><h3>正在读取评审版本</h3></section>
      <section v-else-if="versionError" class="analysis-placeholder"><GitCompareArrows :size="28" /><h3>评审版本读取失败</h3><p>{{ versionError }}</p><button class="button button-primary" @click="loadVersions">重新加载</button></section>
      <section v-else-if="versions.length < 2" class="analysis-placeholder iteration-guide"><GitCompareArrows :size="28" /><h3>{{ versions.length ? `当前只有${versions[0].label || 'v1.0'}` : '尚未生成评审版本' }}</h3><p>{{ versions.length ? '修改项目材料或完善方案后，再进行一次项目评审，系统会自动生成下一代版本供你对比。' : '先完成首次项目评审生成v1.0，再次评审后即可进行迭代对比。' }}</p><button class="button button-primary" @click="$emit('navigate', 'review')">{{ versions.length ? '生成下一评审版本' : '前往项目评审' }}<ArrowUpRight :size="16" /></button></section>
      <template v-else>
        <section class="analysis-controls"><div><h2>{{ project.name }} · 版本对比</h2><p>每次完成项目评审都会自动新增一代，可对比评分、问题和下一步建议。</p></div><div class="analysis-selectors"><label>基准版本<select v-model="baseline" @change="analysisReady = false"><option v-for="version in versions" :key="version.id" :value="version.id">{{ version.label }} · {{ formatDate(version.createdAt) }}</option></select></label><GitCompareArrows :size="18" /><label>对比版本<select v-model="target" @change="analysisReady = false"><option v-for="version in versions" :key="version.id" :value="version.id">{{ version.label }} · {{ formatDate(version.createdAt) }}</option></select></label><button class="button button-primary analysis-run" :disabled="analyzing || baseline === target" @click="runAnalysis"><LoaderCircle v-if="analyzing" class="spin" :size="16" /><Play v-else :size="16" />{{ analyzing ? '正在分析...' : '生成对比分析' }}</button></div></section>
        <section v-if="analyzing" class="analysis-progress iteration-progress"><div class="analysis-progress-head"><span><LoaderCircle class="spin" :size="17" /></span><div><strong>{{ analysisStage }}</strong><small>{{ baselineVersion?.label }}与{{ targetVersion?.label }}正在进行结构化对比</small></div><b>{{ analysisProgress }}%</b></div><div class="analysis-progress-track"><i :style="{ width: `${analysisProgress}%` }"></i></div><div class="analysis-progress-stages"><span :class="{ active: analysisProgress >= 8 }">读取版本</span><span :class="{ active: analysisProgress >= 28 }">指标对齐</span><span :class="{ active: analysisProgress >= 52 }">差异计算</span><span :class="{ active: analysisProgress >= 74 }">问题核对</span><span :class="{ active: analysisProgress >= 90 }">建议归纳</span></div></section>
        <section v-else-if="!analysisReady" class="analysis-placeholder"><GitCompareArrows :size="28" /><h3>选择两代评审版本</h3><p>建议将上一代作为基准、最新一代作为对比，查看本轮改进是否有效。</p></section>
        <template v-else>
          <section class="analysis-summary"><article><span><BarChart3 :size="20" /></span><div><small>综合评分</small><strong>{{ averageAfter }}</strong><em>较基准{{ averageAfter - averageBefore >= 0 ? '+' : '' }}{{ averageAfter - averageBefore }}</em></div></article><article><span><TrendingUp :size="20" /></span><div><small>提升维度</small><strong>{{ improvedDimensions }} / {{ dimensions.length }}</strong><em>{{ improvedDimensions ? `${improvedDimensions}个维度实现提升` : '本轮暂无评分提升' }}</em></div></article><article><span><CheckCircle2 :size="20" /></span><div><small>问题变化</small><strong>{{ targetVersion?.findings?.length || 0 }}项</strong><em>{{ issueDifference > 0 ? `较基准减少${issueDifference}项` : issueDifference < 0 ? `较基准新增${Math.abs(issueDifference)}项` : '与基准数量一致' }}</em></div></article></section>
          <section class="analysis-grid"><article class="dimension-panel"><div class="panel-title"><div><h3>六维评分变化</h3><p>{{ baselineVersion?.label }}对比{{ targetVersion?.label }}</p></div><span>{{ averageAfter - averageBefore >= 0 ? '+' : '' }}{{ averageAfter - averageBefore }}分</span></div><div class="dimension-list"><div v-for="item in dimensions" :key="item.name" class="dimension-row"><strong>{{ item.name }}</strong><div class="dimension-track"><i :style="{ width: `${item.before}%` }"></i><b :style="{ width: `${item.after}%` }"></b></div><small>{{ item.before }} → <em>{{ item.after }}</em></small></div></div></article><article class="improvement-panel"><div class="panel-title"><div><h3>本轮评审结论</h3><p>来自{{ targetVersion?.label }}的真实评审结果。</p></div></div><ul><li v-for="item in targetVersion?.findings || []" :key="item.title"><CheckCircle2 :size="17" /><div><strong>{{ item.title }}</strong><p>{{ item.action || item.evidence }}</p></div></li><li v-if="!(targetVersion?.findings?.length)"><ArrowUpRight :size="17" /><div><strong>继续补充项目证据</strong><p>{{ targetVersion?.summary || '当前版本暂无待改进项。' }}</p></div></li></ul></article></section>
        </template>
      </template>
    </main>
  </component>
</template>
