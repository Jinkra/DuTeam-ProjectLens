<script setup>
import { computed, ref } from 'vue'
import { Background, Controls, MarkerType, MiniMap, VueFlow } from '@xyflow/vue'
import '@xyflow/vue/dist/style.css'
import { BookOpenCheck, Bot, Check, ChevronLeft, CircleStop, Database, FileOutput, FileSearch, Play, Plus, Save, Settings2, Sparkles, Trash2, Upload } from 'lucide-vue-next'
import AppShell from './AppShell.vue'

defineProps({ user: Object })
defineEmits(['navigate', 'logout'])
const running = ref(false)
const runMessage = ref('准备就绪')
const selectedNode = ref(null)
const nodeIndex = ref(6)

const nodes = ref([
  { id: '1', position: { x: 80, y: 190 }, data: { label: '读取项目材料', kind: '输入', description: 'README、方案书与截图' }, class: 'flow-node input' },
  { id: '2', position: { x: 350, y: 90 }, data: { label: '材料结构化', kind: '处理', description: '提取目标、技术与创新点' }, class: 'flow-node process' },
  { id: '3', position: { x: 350, y: 290 }, data: { label: '检索评分标准', kind: '知识库', description: '竞赛规则与历史样例' }, class: 'flow-node knowledge' },
  { id: '4', position: { x: 650, y: 190 }, data: { label: 'AI 评审 Agent', kind: '智能体', description: '规划、评分与证据核验' }, class: 'flow-node agent' },
  { id: '5', position: { x: 950, y: 190 }, data: { label: '生成评审报告', kind: '输出', description: '评分、风险与改进任务' }, class: 'flow-node output' },
])
const edges = ref([
  { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: MarkerType.ArrowClosed },
  { id: 'e1-3', source: '1', target: '3', animated: true, markerEnd: MarkerType.ArrowClosed },
  { id: 'e2-4', source: '2', target: '4', animated: true, markerEnd: MarkerType.ArrowClosed },
  { id: 'e3-4', source: '3', target: '4', animated: true, markerEnd: MarkerType.ArrowClosed },
  { id: 'e4-5', source: '4', target: '5', animated: true, markerEnd: MarkerType.ArrowClosed },
])

const palette = [
  { kind: 'input', label: '文件输入', desc: '读取项目材料', icon: Upload },
  { kind: 'knowledge', label: '知识库', desc: '检索规则与案例', icon: Database },
  { kind: 'agent', label: 'AI Agent', desc: '模型推理与决策', icon: Bot },
  { kind: 'process', label: '项目评审', desc: '执行六维评分', icon: FileSearch },
  { kind: 'output', label: '报告输出', desc: '生成结构化结果', icon: FileOutput },
]
const selectedData = computed(() => selectedNode.value?.data)

function onConnect(connection) {
  edges.value.push({ id: `e-${Date.now()}`, ...connection, animated: true, markerEnd: MarkerType.ArrowClosed })
}
function addNode(item) {
  const id = String(nodeIndex.value++)
  const offset = nodes.value.length * 24
  const node = { id, position: { x: 460 + offset, y: 380 + offset / 2 }, data: { label: item.label, kind: item.desc, description: '点击右侧面板配置此节点' }, class: `flow-node ${item.kind}` }
  nodes.value.push(node); selectedNode.value = node
}
function removeSelected() {
  if (!selectedNode.value) return
  const id = selectedNode.value.id
  nodes.value = nodes.value.filter((node) => node.id !== id)
  edges.value = edges.value.filter((edge) => edge.source !== id && edge.target !== id)
  selectedNode.value = null
}
function updateSelected() {
  if (!selectedNode.value) return
  nodes.value = nodes.value.map((node) => node.id === selectedNode.value.id ? { ...node, data: { ...selectedNode.value.data } } : node)
}
async function runWorkflow() {
  if (running.value) return
  running.value = true
  for (let index = 0; index < nodes.value.length; index += 1) {
    runMessage.value = `正在运行：${nodes.value[index].data.label}`
    nodes.value = nodes.value.map((node, nodeIndexValue) => ({ ...node, class: `${node.class.replace(/\s+(running|completed)/g, '')}${nodeIndexValue < index ? ' completed' : nodeIndexValue === index ? ' running' : ''}` }))
    await new Promise((resolve) => setTimeout(resolve, 550))
  }
  nodes.value = nodes.value.map((node) => ({ ...node, class: `${node.class.replace(/\s+(running|completed)/g, '')} completed` }))
  runMessage.value = `运行完成 · ${nodes.value.length} 个节点 · 2.8s`
  running.value = false
}
</script>

<template>
  <AppShell :user="user" active="workflow" title="工作流工作台" subtitle="竞赛项目自动评审 / 草稿" full @navigate="$emit('navigate', $event)" @logout="$emit('logout')">
    <div class="workflow-toolbar"><button class="button button-ghost" @click="$emit('navigate', 'tools')"><ChevronLeft :size="16" />返回工具中心</button><div class="workflow-name"><strong>竞赛项目自动评审</strong><span>已自动保存</span></div><div class="toolbar-actions"><button class="button button-ghost"><Save :size="16" />保存</button><button class="button button-primary" :disabled="running" @click="runWorkflow"><CircleStop v-if="running" :size="16" /><Play v-else :size="16" />{{ running ? '运行中' : '运行工作流' }}</button></div></div>
    <div class="studio-layout">
      <aside class="node-library"><div class="library-heading"><div><h3>节点库</h3><p>点击添加到画布</p></div><Plus :size="18" /></div><label class="node-search"><FileSearch :size="15" /><input placeholder="搜索节点" /></label><div class="node-group"><p>基础节点</p><button v-for="item in palette" :key="item.label" @click="addNode(item)"><span :class="item.kind"><component :is="item.icon" :size="17" /></span><div><strong>{{ item.label }}</strong><small>{{ item.desc }}</small></div><Plus :size="14" /></button></div><div class="template-callout"><Sparkles :size="17" /><strong>从模板开始</strong><p>使用经过验证的评审流程快速搭建。</p><button>浏览模板</button></div></aside>
      <main class="flow-canvas"><div class="canvas-status" :class="{ live: running }"><i></i>{{ runMessage }}</div><VueFlow v-model:nodes="nodes" v-model:edges="edges" :default-viewport="{ zoom: 0.85 }" :min-zoom="0.35" :max-zoom="1.8" fit-view-on-init @connect="onConnect" @node-click="selectedNode = $event.node" @pane-click="selectedNode = null"><Background pattern-color="#d6dae3" :gap="22" :size="1" /><Controls /><MiniMap pannable zoomable /></VueFlow></main>
      <aside class="node-inspector"><template v-if="selectedNode"><div class="inspector-heading"><div><span><Settings2 :size="17" /></span><div><h3>节点设置</h3><p>{{ selectedNode.id }}</p></div></div><button class="icon-button danger" title="删除节点" @click="removeSelected"><Trash2 :size="16" /></button></div><label>节点名称<input v-model="selectedNode.data.label" @input="updateSelected" /></label><label>节点类型<input v-model="selectedNode.data.kind" @input="updateSelected" /></label><label>功能说明<textarea v-model="selectedNode.data.description" rows="4" @input="updateSelected"></textarea></label><div class="config-section"><h4>执行设置</h4><label>失败处理<select><option>停止工作流</option><option>跳过并继续</option><option>自动重试</option></select></label><label>超时时间<div class="input-suffix"><input value="60" /><span>秒</span></div></label></div><div class="test-node"><button class="button button-ghost"><Play :size="15" />单独测试节点</button></div></template><div v-else class="inspector-empty"><Settings2 :size="28" /><h3>选择一个节点</h3><p>点击画布中的节点，在这里查看并编辑参数。</p></div></aside>
    </div>
  </AppShell>
</template>
