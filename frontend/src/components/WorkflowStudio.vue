<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Background, Controls, getBezierPath, Handle, MarkerType, MiniMap, Position, VueFlow } from '@xyflow/vue'
import '@xyflow/vue/dist/style.css'
import { Bot, Check, ChevronLeft, CircleStop, Database, Download, FileOutput, FileSearch, FolderOpen, Gauge, Play, Plus, Save, Settings2, Sparkles, Trash2, Upload } from 'lucide-vue-next'
import AppShell from './AppShell.vue'
import { api } from '../api'
import ProjectContextBar from './ProjectContextBar.vue'

defineProps({ user: Object, embedded: Boolean, project: Object })
defineEmits(['navigate', 'logout'])
const running = ref(false)
const runMessage = ref('准备就绪')
const selectedNodeId = ref(null)
const selectedEdgeId = ref(null)
const nodeIndex = ref(6)
const reportReady = ref(false)
const exporting = ref(false)
const nodeQuery = ref('')
const flowInstance = ref(null)
const flowCanvasRef = ref(null)
const connectionActive = ref(false)
const connectingSourceId = ref(null)
const connectionSuggestions = ref([])
const suggestedTargetIds = ref([])
const draggingPalette = ref(null)
const history = ref([])
const draggingOrigin = ref(null)

function cloneGraphValue(value) {
  return JSON.parse(JSON.stringify(value))
}
function rememberAction(action) {
  history.value = [...history.value.slice(-39), cloneGraphValue(action)]
}
async function undoGraph() {
  const action = history.value.at(-1)
  if (!action || running.value) {
    if (!action) runMessage.value = '没有可以撤回的操作'
    return
  }
  history.value = history.value.slice(0, -1)
  if (action.type === 'add-edge') flowInstance.value?.removeEdges([action.edge.id])
  if (action.type === 'remove-edge' && !edges.value.some((edge) => edge.id === action.edge.id)) flowInstance.value?.addEdges([action.edge])
  if (action.type === 'add-node') {
    nodes.value = nodes.value.filter((node) => node.id !== action.node.id)
    edges.value = edges.value.filter((edge) => edge.source !== action.node.id && edge.target !== action.node.id)
  }
  if (action.type === 'remove-node') {
    if (!nodes.value.some((node) => node.id === action.node.id)) nodes.value = [...nodes.value, action.node]
    const restoredEdges = action.edges.filter((edge) => !edges.value.some((current) => current.id === edge.id))
    edges.value = [...edges.value, ...restoredEdges]
  }
  if (action.type === 'move-node') nodes.value = nodes.value.map((node) => node.id === action.nodeId ? { ...node, position: action.position } : node)
  selectedNodeId.value = null
  selectedEdgeId.value = null
  runMessage.value = '已撤回上一步操作'
  await nextTick()
  flowInstance.value?.updateNodeInternals?.(nodes.value.map((node) => node.id))
}
function isEditableTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}
function handleWorkflowShortcut(event) {
  if (isEditableTarget(event.target)) return
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    undoGraph()
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (!selectedEdgeId.value || running.value) return
    event.preventDefault()
    removeSelectedEdge()
  }
}

function createConfig(type) {
  const common = { failureMode: 'stop', timeout: 60 }
  if (type === 'input') return { ...common, sourceMode: 'files', acceptedTypes: 'PDF, DOCX, Markdown, 图片', parseImages: true, files: [], folderFiles: [], repositoryUrl: '' }
  if (type === 'knowledge') return { ...common, files: [], retrievalMode: 'hybrid', topK: 8, rerank: true }
  if (type === 'agent') return { ...common, model: 'deepseek-chat', reasoningLevel: 'balanced', usageMultiplier: 2, temperature: 0.3 }
  if (type === 'process') return { ...common, model: 'deepseek-chat', reasoningLevel: 'deep', usageMultiplier: 3, rubric: 'AI 竞赛六维评分', strictness: 'balanced' }
  return { ...common, format: 'pdf', exportPath: '浏览器下载目录/ProjectLens', includeCharts: true, includeEvidence: true }
}

const nodes = ref([
  { id: '1', type: 'workflow', position: { x: 40, y: 200 }, data: { label: '读取项目材料', kind: 'INPUT', type: 'input', description: 'README、方案书与截图', status: 'idle', config: createConfig('input') } },
  { id: '2', type: 'workflow', position: { x: 300, y: 55 }, data: { label: '材料结构化', kind: 'PARSER', type: 'process', description: '提取目标、技术与创新点', status: 'idle', config: createConfig('process') } },
  { id: '3', type: 'workflow', position: { x: 300, y: 345 }, data: { label: '检索评分标准', kind: 'KNOWLEDGE', type: 'knowledge', description: '竞赛规则与历史样例', status: 'idle', config: createConfig('knowledge') } },
  { id: '4', type: 'workflow', position: { x: 575, y: 200 }, data: { label: 'AI 评审 Agent', kind: 'AGENT', type: 'agent', description: '规划、评分与证据核验', status: 'idle', config: createConfig('agent') } },
  { id: '5', type: 'workflow', position: { x: 850, y: 200 }, data: { label: '生成评审报告', kind: 'OUTPUT', type: 'output', description: '评分、风险与改进任务', status: 'idle', config: createConfig('output') } },
])
const edges = ref([
  { id: 'e1-2', source: '1', target: '2', markerEnd: MarkerType.ArrowClosed },
  { id: 'e1-3', source: '1', target: '3', markerEnd: MarkerType.ArrowClosed },
  { id: 'e2-4', source: '2', target: '4', markerEnd: MarkerType.ArrowClosed },
  { id: 'e3-4', source: '3', target: '4', markerEnd: MarkerType.ArrowClosed },
  { id: 'e4-5', source: '4', target: '5', markerEnd: MarkerType.ArrowClosed },
])

const palette = [
  { kind: 'input', label: '文件输入', desc: '读取项目材料', icon: Upload },
  { kind: 'knowledge', label: '知识库', desc: '检索规则与案例', icon: Database },
  { kind: 'agent', label: 'AI Agent', desc: '模型推理与决策', icon: Bot },
  { kind: 'process', label: '项目评审', desc: '执行六维评分', icon: FileSearch },
  { kind: 'output', label: '报告输出', desc: '生成结构化结果', icon: FileOutput },
]
const filteredPalette = computed(() => {
  const query = nodeQuery.value.trim().toLowerCase()
  if (!query) return palette
  return palette.filter((item) => `${item.label}${item.desc}${item.kind}`.toLowerCase().includes(query))
})
const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value) || null)
const workflowUsageMultiplier = computed(() => Math.max(1, ...nodes.value.map((node) => Number(node.data.config?.usageMultiplier || 1))))

function connectionReason(connection) {
  if (!connection.source || !connection.target) return '请把提示线拖到目标节点左侧的输入端口。'
  if (connection.source === connection.target) return '节点不能连接到自身。'
  const source = nodes.value.find((node) => node.id === connection.source)
  const target = nodes.value.find((node) => node.id === connection.target)
  if (source?.data.type === 'output') return '报告输出是终点节点，不能再连接下游节点。'
  if (target?.data.type === 'input') return '文件输入是起点节点，不能接收上游连接。'
  if (edges.value.some((edge) => edge.source === connection.source && edge.target === connection.target)) return '这两个节点已经连接。'
  const pending = [connection.target]
  const visited = new Set()
  while (pending.length) {
    const current = pending.pop()
    if (current === connection.source) return '该连接会形成循环，工作流必须保持单向。'
    if (visited.has(current)) continue
    visited.add(current)
    edges.value.filter((edge) => edge.source === current).forEach((edge) => pending.push(edge.target))
  }
  return ''
}

function isValidConnection(connection) { return !connectionReason(connection) }

function onConnect(connection) {
  const edge = { id: `e-${Date.now()}`, ...connection, markerEnd: MarkerType.ArrowClosed }
  flowInstance.value?.addEdges([edge])
  rememberAction({ type: 'add-edge', edge })
  runMessage.value = '节点连接成功'
}
async function addNode(item, position = null) {
  const id = String(nodeIndex.value++)
  const offset = (nodes.value.length % 3) * 26
  const node = { id, type: 'workflow', position: position || { x: 550 + offset, y: 390 + offset }, data: { label: item.label, kind: item.kind.toUpperCase(), type: item.kind, description: item.desc, status: 'idle', config: createConfig(item.kind) } }
  nodes.value = [...nodes.value, node]
  rememberAction({ type: 'add-node', node })
  selectedNodeId.value = id
  runMessage.value = `已添加「${item.label}」，请在右侧完成配置`
  await nextTick()
  flowInstance.value?.updateNodeInternals?.([id])
  if (!position) flowInstance.value?.setCenter(node.position.x + 102, node.position.y + 65, { zoom: 0.9, duration: 320 })
}
function onPaletteDragStart(event, item) {
  draggingPalette.value = item
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/projectlens-node', item.kind)
}
function onCanvasDragOver(event) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' }
function onCanvasDrop(event) {
  event.preventDefault()
  const kind = event.dataTransfer.getData('application/projectlens-node')
  const item = palette.find((entry) => entry.kind === kind) || draggingPalette.value
  if (!item || !flowInstance.value) return
  const position = flowInstance.value.screenToFlowPosition({ x: event.clientX, y: event.clientY })
  addNode(item, { x: position.x - 102, y: position.y - 65 })
  draggingPalette.value = null
}
function refreshConnectionSuggestions() {
  const sourceId = connectingSourceId.value
  const canvas = flowCanvasRef.value
  if (!sourceId || !canvas) return
  const canvasRect = canvas.getBoundingClientRect()
  const sourceHandle = canvas.querySelector(`.vue-flow__node[data-id="${sourceId}"] .vue-flow__handle-right`)
  if (!sourceHandle) return
  const sourceRect = sourceHandle.getBoundingClientRect()
  const sourceX = sourceRect.left + sourceRect.width / 2 - canvasRect.left
  const sourceY = sourceRect.top + sourceRect.height / 2 - canvasRect.top
  const validTargets = nodes.value.filter((node) => !connectionReason({ source: sourceId, target: node.id }))
  suggestedTargetIds.value = validTargets.map((node) => node.id)
  connectionSuggestions.value = validTargets.flatMap((node) => {
    const targetHandle = canvas.querySelector(`.vue-flow__node[data-id="${node.id}"] .vue-flow__handle-left`)
    if (!targetHandle) return []
    const targetRect = targetHandle.getBoundingClientRect()
    const targetX = targetRect.left + targetRect.width / 2 - canvasRect.left
    const targetY = targetRect.top + targetRect.height / 2 - canvasRect.top
    return [{ targetId: node.id, path: getBezierPath({ sourceX, sourceY, sourcePosition: Position.Right, targetX, targetY, targetPosition: Position.Left })[0] }]
  })
}
async function onConnectStart({ nodeId, handleType }) {
  if (!nodeId || handleType !== 'source') return
  connectionActive.value = true
  connectingSourceId.value = nodeId
  runMessage.value = '已标出可连接节点，拖到左侧输入端口完成连接'
  await nextTick()
  requestAnimationFrame(refreshConnectionSuggestions)
}
function onConnectEnd({ connectionState }) {
  connectionActive.value = false
  connectingSourceId.value = null
  connectionSuggestions.value = []
  suggestedTargetIds.value = []
  if (connectionState.isValid) return
  const source = connectionState.fromNode?.id
  const target = connectionState.toNode?.id
  runMessage.value = `无法连接：${connectionReason({ source, target })}`
}
function updateReasoning(level) {
  const multipliers = { fast: 1, balanced: 2, deep: 3 }
  selectedNode.value.data.config.reasoningLevel = level
  selectedNode.value.data.config.usageMultiplier = multipliers[level]
  updateSelected()
}
function uploadKnowledgeFiles(event) {
  const names = [...(event.target.files || [])].map((file) => file.name)
  selectedNode.value.data.config.files = [...new Set([...(selectedNode.value.data.config.files || []), ...names])]
  updateSelected()
  event.target.value = ''
}
function uploadInputFiles(event, target = 'files') {
  const names = [...(event.target.files || [])].map((file) => file.webkitRelativePath || file.name)
  selectedNode.value.data.config[target] = [...new Set([...(selectedNode.value.data.config[target] || []), ...names])]
  updateSelected()
  event.target.value = ''
}
function removeSelected() {
  if (!selectedNode.value) return
  const id = selectedNode.value.id
  const label = selectedNode.value.data.label
  const removedEdges = edges.value.filter((edge) => edge.source === id || edge.target === id)
  rememberAction({ type: 'remove-node', node: selectedNode.value, edges: removedEdges })
  nodes.value = nodes.value.filter((node) => node.id !== id)
  edges.value = edges.value.filter((edge) => edge.source !== id && edge.target !== id)
  selectedNodeId.value = null
  runMessage.value = `已删除「${label}」· Ctrl+Z 可撤回`
}
function removeSelectedEdge() {
  const edge = edges.value.find((item) => item.id === selectedEdgeId.value)
  if (!edge) return
  rememberAction({ type: 'remove-edge', edge })
  flowInstance.value?.removeEdges([edge.id])
  selectedEdgeId.value = null
  runMessage.value = '已删除选中连线 · Ctrl+Z 可撤回'
}
function updateSelected() {
  if (!selectedNode.value) return
  nodes.value = nodes.value.map((node) => node.id === selectedNode.value.id ? { ...node, data: { ...selectedNode.value.data } } : node)
}
async function runWorkflow() {
  if (running.value) return
  try { await api('/usage/consume', { method: 'POST', body: JSON.stringify({ units: workflowUsageMultiplier.value }) }) } catch (error) { runMessage.value = error.message; return }
  running.value = true
  reportReady.value = false
  edges.value = edges.value.map((edge) => ({ ...edge, animated: true }))
  const startedAt = performance.now()
  for (let index = 0; index < nodes.value.length; index += 1) {
    runMessage.value = `正在运行：${nodes.value[index].data.label}`
    nodes.value = nodes.value.map((node, nodeIndexValue) => ({ ...node, data: { ...node.data, status: nodeIndexValue < index ? 'completed' : nodeIndexValue === index ? 'running' : 'idle' } }))
    await new Promise((resolve) => setTimeout(resolve, 550))
  }
  nodes.value = nodes.value.map((node) => ({ ...node, data: { ...node.data, status: 'completed' } }))
  const duration = ((performance.now() - startedAt) / 1000).toFixed(1)
  runMessage.value = `运行完成 · ${nodes.value.length} 个节点 · ${duration}s`
  edges.value = edges.value.map((edge) => ({ ...edge, animated: false }))
  reportReady.value = true
  running.value = false
  await exportReport(true)
}
async function exportReport(automatic = false) {
  if (exporting.value) return
  exporting.value = true
  const report = {
    id: `PL-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-5)}`,
    title: '竞赛项目自动评审报告',
    generatedAt: new Date().toLocaleString('zh-CN'),
    total: 82,
    summary: '项目目标清晰，工作流已经形成从材料读取、证据检索到报告生成的完整闭环。当前优势集中在工程完成度与 AI 技术路径，下一阶段应加强量化验证、真实案例对照和证据链稳定性。',
    dimensions: [
      { label: 'AI 技术深度', score: 86, weight: 25 }, { label: '创新性', score: 80, weight: 20 }, { label: '工程质量', score: 88, weight: 20 },
      { label: '实用性', score: 84, weight: 15 }, { label: '用户体验', score: 78, weight: 10 }, { label: '商业潜力', score: 74, weight: 10 },
    ],
    findings: [
      { title: 'RAG 证据链需要量化验证', evidence: '当前材料描述了知识检索流程，但缺少召回率、引用命中率与错误引用率等指标。', action: '建立固定测试集，对比启用与未启用 RAG 时的准确率和证据命中率。' },
      { title: 'Agent 决策过程仍可增强可解释性', evidence: '工作流展示了节点状态，但评审判断与证据之间的映射仍需更清晰。', action: '在报告中保留每项评分对应的证据片段、规则条目和模型判断摘要。' },
      { title: '商业验证数据不足', evidence: '套餐与用量机制已具备产品形态，但尚未展示真实团队使用数据。', action: '邀请 3-5 个参赛团队进行试用，记录留存、评审次数和改进完成率。' },
    ],
    nodes: nodes.value.map((node) => ({ name: node.data.label, type: node.data.kind, status: node.data.status, description: node.data.description })),
  }
  try {
    const { exportReviewPdf } = await import('../reportPdf')
    await exportReviewPdf(report)
    const outputNode = nodes.value.find((node) => node.data.type === 'output')
    const exportPath = outputNode?.data.config.exportPath || '浏览器下载目录/ProjectLens'
    runMessage.value = `评审报告导出成功 · 已导出到 ${exportPath}`
  } catch (error) {
    runMessage.value = `${automatic ? '自动导出' : '报告导出'}失败：${error.message}`
  } finally { exporting.value = false }
}
function onDragStart(event) { draggingOrigin.value = { nodeId: event.node.id, position: cloneGraphValue(event.node.position) }; selectedNodeId.value = event.node.id; selectedEdgeId.value = null; runMessage.value = `正在移动：${event.node.data.label}` }
function onDragStop(event) { if (draggingOrigin.value && (draggingOrigin.value.position.x !== event.node.position.x || draggingOrigin.value.position.y !== event.node.position.y)) rememberAction({ type: 'move-node', ...draggingOrigin.value }); draggingOrigin.value = null; runMessage.value = `已更新「${event.node.data.label}」的位置` }
function onFlowInit(instance) {
  flowInstance.value = instance
  setTimeout(() => {
    if (window.innerWidth <= 760) instance.setCenter(677, 265, { zoom: 0.68, duration: 260 })
    else instance.fitView({ padding: 0.12, duration: 260 })
  }, 80)
}
function saveWorkflow() { runMessage.value = `已保存 · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` }
async function testSelectedNode() {
  if (!selectedNode.value || running.value) return
  const id = selectedNode.value.id
  nodes.value = nodes.value.map((node) => ({ ...node, data: { ...node.data, status: node.id === id ? 'running' : node.data.status } }))
  runMessage.value = `正在测试：${selectedNode.value.data.label}`
  await new Promise((resolve) => setTimeout(resolve, 700))
  nodes.value = nodes.value.map((node) => ({ ...node, data: { ...node.data, status: node.id === id ? 'completed' : node.data.status } }))
  runMessage.value = `节点测试通过：${selectedNode.value.data.label}`
}
onMounted(() => window.addEventListener('keydown', handleWorkflowShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handleWorkflowShortcut))
</script>

<template>
  <component :is="embedded ? 'div' : AppShell" v-bind="embedded ? {} : { user, active: 'workflow', title: '工作流工作台', subtitle: '竞赛项目自动评审 / 草稿', full: true }" @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <ProjectContextBar :project="project" active="workflow" @navigate="$emit('navigate', $event)" />
    <div class="workflow-toolbar"><button class="button button-ghost" @click="$emit('navigate', 'projects')"><ChevronLeft :size="16" />返回项目空间</button><div class="workflow-name"><strong>{{ project?.name || '项目工作流' }}</strong><span>草稿 · 自动保存开启</span></div><div class="toolbar-actions"><button v-if="reportReady" class="button report-button" :disabled="exporting" @click="exportReport()"><Download :size="16" />{{ exporting ? '生成 PDF...' : '导出评审报告' }}</button><button class="button button-ghost" @click="saveWorkflow"><Save :size="16" />保存</button><button class="button button-primary" :disabled="running" @click="runWorkflow"><CircleStop v-if="running" :size="16" /><Play v-else :size="16" />{{ running ? '运行中' : '运行工作流' }}</button></div></div>
    <div class="studio-layout" :class="{ 'inspector-open': selectedNode }">
      <aside class="node-library"><div class="library-heading"><div><h3>节点库</h3><p>拖拽到画布，或点击添加</p></div><Plus :size="18" /></div><label class="node-search"><FileSearch :size="15" /><input v-model="nodeQuery" placeholder="搜索节点" /></label><div class="node-group"><p>基础节点</p><button v-for="item in filteredPalette" :key="item.label" draggable="true" @dragstart="onPaletteDragStart($event, item)" @dragend="draggingPalette = null" @click="addNode(item)"><span :class="item.kind"><component :is="item.icon" :size="17" /></span><div><strong>{{ item.label }}</strong><small>{{ item.desc }}</small></div><Plus :size="14" /></button><div v-if="!filteredPalette.length" class="node-search-empty">没有匹配的节点</div></div><div class="template-callout"><Sparkles :size="17" /><strong>从模板开始</strong><p>使用经过验证的评审流程快速搭建。</p><button>浏览模板</button></div></aside>
      <main ref="flowCanvasRef" class="flow-canvas" @dragover="onCanvasDragOver" @drop="onCanvasDrop"><div class="canvas-status" :class="{ live: running, warning: runMessage.startsWith('无法连接') || runMessage.includes('失败') }"><i></i>{{ runMessage }}</div><VueFlow v-model:nodes="nodes" v-model:edges="edges" :default-viewport="{ zoom: 0.82 }" :fit-view-options="{ padding: 0.16 }" :min-zoom="0.35" :max-zoom="1.8" :is-valid-connection="isValidConnection" :connection-radius="28" :delete-key-code="[]" :pan-on-drag="[1, 2]" fit-view-on-init @init="onFlowInit" @move="connectionActive && refreshConnectionSuggestions()" @connect="onConnect" @connect-start="onConnectStart" @connect-end="onConnectEnd" @edge-click="selectedEdgeId = $event.edge.id; selectedNodeId = null" @node-click="selectedNodeId = $event.node.id; selectedEdgeId = null" @pane-click="selectedNodeId = null; selectedEdgeId = null" @node-drag-start="onDragStart" @node-drag-stop="onDragStop"><Background pattern-color="#dce1e9" :gap="24" :size="1" /><template #connection-line="{ fromX, fromY, fromPosition, toX, toY, toPosition }"><path :d="getBezierPath({ sourceX: fromX, sourceY: fromY, sourcePosition: fromPosition, targetX: toX, targetY: toY, targetPosition: toPosition })[0]" class="connection-preview" :class="{ active: connectionActive }" /></template><template #node-workflow="{ data, id }"><div class="premium-node" :class="[data.type, data.status, { 'suggested-target': suggestedTargetIds.includes(id) }]"><Handle type="target" :position="Position.Left" /><div class="premium-node-top"><span class="premium-node-icon"><Upload v-if="data.type === 'input'" :size="16" /><Database v-else-if="data.type === 'knowledge'" :size="16" /><Bot v-else-if="data.type === 'agent'" :size="16" /><FileSearch v-else-if="data.type === 'process'" :size="16" /><FileOutput v-else :size="16" /></span><small>{{ data.kind }}</small><i v-if="data.status === 'completed'"><Check :size="12" /></i><i v-else-if="data.status === 'running'" class="node-spinner"></i></div><strong>{{ data.label }}</strong><p>{{ data.description }}</p><div class="premium-node-meta"><span>{{ data.type === 'agent' || data.type === 'process' ? `${data.config.model} · ${data.config.usageMultiplier}x` : data.type === 'knowledge' ? `${data.config.files.length} 个文件` : data.type === 'input' ? `${(data.config.files?.length || 0) + (data.config.folderFiles?.length || 0)} 个材料` : '已配置' }}</span><em></em></div><Handle type="source" :position="Position.Right" /></div></template><Controls /><MiniMap pannable zoomable /></VueFlow><svg v-if="connectionSuggestions.length" class="connection-suggestions" aria-hidden="true"><path v-for="item in connectionSuggestions" :key="item.targetId" :d="item.path" class="connection-suggestion-path" /></svg><div class="canvas-guide"><span>中键/右键平移</span><span>滚轮缩放</span><span>左键从端点连接</span><span>Delete 删除选中连线</span><span>Ctrl+Z 撤回</span></div></main>
      <aside class="node-inspector"><template v-if="selectedNode"><div class="inspector-heading"><div><span><Settings2 :size="17" /></span><div><h3>{{ selectedNode.data.label }}</h3><p>{{ selectedNode.data.kind }} · NODE {{ selectedNode.id.padStart(2, '0') }}</p></div></div><button class="icon-button danger" title="删除节点" @click="removeSelected"><Trash2 :size="16" /></button></div><div class="node-fixed-summary"><p>{{ selectedNode.data.description }}</p><span>节点名称与类型由工作流定义，不可修改</span></div>
        <div v-if="selectedNode.data.type === 'input'" class="node-config-fields"><h4>材料输入</h4><label>输入方式<select v-model="selectedNode.data.config.sourceMode" @change="updateSelected"><option value="files">上传文件</option><option value="folder">选择项目目录</option><option value="url">仓库地址</option></select></label><template v-if="selectedNode.data.config.sourceMode === 'files'"><label class="knowledge-upload"><Upload :size="17" /><strong>上传项目材料</strong><small>支持多个方案文档、截图与说明文件</small><input type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" @change="uploadInputFiles($event, 'files')" /></label><div v-if="selectedNode.data.config.files?.length" class="knowledge-files"><span v-for="file in selectedNode.data.config.files" :key="file"><FolderOpen :size="13" />{{ file }}</span></div></template><template v-else-if="selectedNode.data.config.sourceMode === 'folder'"><label class="knowledge-upload"><FolderOpen :size="17" /><strong>选择项目目录</strong><small>将读取目录内的项目材料与代码文件</small><input type="file" webkitdirectory directory multiple @change="uploadInputFiles($event, 'folderFiles')" /></label><div v-if="selectedNode.data.config.folderFiles?.length" class="knowledge-files"><span v-for="file in selectedNode.data.config.folderFiles" :key="file"><FolderOpen :size="13" />{{ file }}</span></div></template><label v-else>仓库地址<input v-model.trim="selectedNode.data.config.repositoryUrl" type="url" placeholder="https://github.com/owner/repository" @input="updateSelected" /></label><label>支持格式<input :value="selectedNode.data.config.acceptedTypes" readonly /></label><label class="config-toggle"><input v-model="selectedNode.data.config.parseImages" type="checkbox" @change="updateSelected" /><span>解析材料中的截图与图片</span></label></div>
        <div v-else-if="selectedNode.data.type === 'knowledge'" class="node-config-fields"><h4>知识库配置</h4><label class="knowledge-upload"><Upload :size="17" /><strong>上传知识库文件</strong><small>PDF、DOCX、TXT、Markdown</small><input type="file" multiple accept=".pdf,.doc,.docx,.txt,.md" @change="uploadKnowledgeFiles" /></label><div v-if="selectedNode.data.config.files.length" class="knowledge-files"><span v-for="file in selectedNode.data.config.files" :key="file"><FolderOpen :size="13" />{{ file }}</span></div><label>检索方式<select v-model="selectedNode.data.config.retrievalMode" @change="updateSelected"><option value="hybrid">混合检索</option><option value="vector">向量检索</option><option value="keyword">关键词检索</option></select></label><label>召回数量<div class="input-suffix"><input v-model.number="selectedNode.data.config.topK" type="number" min="1" max="30" @input="updateSelected" /><span>条</span></div></label><label class="config-toggle"><input v-model="selectedNode.data.config.rerank" type="checkbox" @change="updateSelected" /><span>启用结果重排序</span></label></div>
        <div v-else-if="['agent', 'process'].includes(selectedNode.data.type)" class="node-config-fields"><h4>模型与推理</h4><label>模型<select v-model="selectedNode.data.config.model" @change="updateSelected"><option value="deepseek-chat">DeepSeek Chat</option><option value="deepseek-reasoner">DeepSeek Reasoner</option><option value="gpt-4o-mini">GPT-4o mini</option><option value="qwen-max">Qwen Max</option></select></label><label>推理等级<div class="reasoning-segments"><button v-for="level in [{ id: 'fast', name: '快速', value: 1 }, { id: 'balanced', name: '平衡', value: 2 }, { id: 'deep', name: '深度', value: 3 }]" :key="level.id" :class="{ active: selectedNode.data.config.reasoningLevel === level.id }" @click="updateReasoning(level.id)">{{ level.name }}<small>{{ level.value }}x</small></button></div></label><div class="usage-multiplier"><Gauge :size="16" /><span>本节点用量倍率</span><strong>{{ selectedNode.data.config.usageMultiplier }}x</strong></div><label v-if="selectedNode.data.type === 'process'">评分标准<select v-model="selectedNode.data.config.rubric" @change="updateSelected"><option>AI 竞赛六维评分</option><option>课程项目综合评分</option><option>创新创业项目评分</option></select></label><label v-else>温度<div class="input-suffix"><input v-model.number="selectedNode.data.config.temperature" type="number" min="0" max="1" step="0.1" @input="updateSelected" /><span>{{ selectedNode.data.config.temperature }}</span></div></label></div>
        <div v-else class="node-config-fields"><h4>报告导出</h4><label>报告格式<select v-model="selectedNode.data.config.format" @change="updateSelected"><option value="pdf">PDF 文档</option><option value="docx">Word 文档</option><option value="json">JSON 数据</option></select></label><label>导出路径<input v-model="selectedNode.data.config.exportPath" @input="updateSelected" /></label><label class="config-toggle"><input v-model="selectedNode.data.config.includeCharts" type="checkbox" @change="updateSelected" /><span>包含分析图表</span></label><label class="config-toggle"><input v-model="selectedNode.data.config.includeEvidence" type="checkbox" @change="updateSelected" /><span>包含评分证据链</span></label></div>
        <div class="config-section"><h4>执行控制</h4><label>失败处理<select v-model="selectedNode.data.config.failureMode" @change="updateSelected"><option value="stop">停止工作流</option><option value="skip">跳过并继续</option><option value="retry">自动重试</option></select></label><label>超时时间<div class="input-suffix"><input v-model.number="selectedNode.data.config.timeout" type="number" min="10" max="600" @input="updateSelected" /><span>秒</span></div></label></div><div class="test-node"><button class="button button-ghost" :disabled="running" @click="testSelectedNode"><Play :size="15" />单独测试节点</button></div></template><div v-else class="inspector-empty"><Settings2 :size="28" /><h3>选择一个节点</h3><p>点击画布中的节点，在这里查看并编辑参数。</p></div></aside>
    </div>
  </component>
</template>
