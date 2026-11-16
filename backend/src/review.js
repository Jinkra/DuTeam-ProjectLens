const dimensions = [
  ['aiDepth', 'AI技术深度', 35],
  ['innovation', '创新性', 25],
  ['engineering', '前端工程质量', 10],
  ['practicality', '实用性', 10],
  ['experience', '用户体验', 10],
  ['value', '社会价值与商业潜力', 10],
]

const MAX_MATERIAL_CHARACTERS = 42000
const MAX_FILE_CHARACTERS = 12000

function workspaceFiles(project) {
  const nodes = project?.workspaceState?.workflow?.nodes
  if (!Array.isArray(nodes)) return []
  return nodes.flatMap((node) => [
    ...(node?.data?.config?.files || []),
    ...(node?.data?.config?.folderFiles || []),
  ])
}

function prepareProject(project = {}) {
  const suppliedFiles = Array.isArray(project.materialFiles) ? project.materialFiles : []
  const files = [...suppliedFiles, ...workspaceFiles(project)]
  const seen = new Set()
  const materialParts = []
  let remaining = MAX_MATERIAL_CHARACTERS

  const primaryMaterial = String(project.material || '').trim()
  if (primaryMaterial) {
    const text = primaryMaterial.slice(0, Math.min(remaining, 18000))
    materialParts.push(text)
    remaining -= text.length
  }

  const materialFiles = []
  for (const file of files) {
    const name = String(file?.name || '未命名材料')
    if (seen.has(name)) continue
    seen.add(name)
    const content = String(file?.content || '').trim()
    materialFiles.push({ name, readable: Boolean(content || file?.readable) })
    if (!content || remaining <= 0) continue
    const text = content.slice(0, Math.min(remaining, MAX_FILE_CHARACTERS))
    materialParts.push(`【文件：${name}】\n${text}`)
    remaining -= text.length
  }

  return {
    name: String(project.name || '未命名项目').slice(0, 120),
    category: String(project.category || 'AI项目').slice(0, 120),
    description: String(project.description || '').slice(0, 4000),
    material: materialParts.join('\n\n'),
    materialFiles: materialFiles.slice(0, 30),
    unreadableFiles: (project.unreadableFiles || []).map(String).slice(0, 30),
  }
}

function extractJson(content) {
  const cleaned = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('模型没有返回可识别的JSON对象。')
  return JSON.parse(cleaned.slice(start, end + 1))
}

function validateReview(review) {
  if (!Number.isFinite(Number(review.total)) || !Array.isArray(review.dimensions) || !Array.isArray(review.findings) || !Array.isArray(review.evidence)) {
    throw new Error('模型返回的评审结构不完整。')
  }
  return { ...review, total: Number(review.total), mode: 'ai' }
}

async function requestReview(project, provider, retry = false) {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(80000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.1,
      max_tokens: retry ? 1800 : 1400,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `你是高校AI竞赛评审专家。必须完全依据项目材料评审，禁止固定模板和编造事实。只输出一个完整JSON对象，不得输出Markdown代码块或解释。字段为total,summary,dimensions,findings,evidence,nextSteps。dimensions必须包含六项且每项为key,label,weight,score；findings最多4项且包含level,title,evidence,action；evidence最多6项且包含dimension,quote,source；nextSteps最多5项。所有分数为0到100。${retry ? '上次输出不是合法JSON，本次必须缩短文字并确保所有引号、数组和大括号完整闭合。' : ''}` },
        { role: 'user', content: JSON.stringify({ rubric: dimensions, project: prepareProject(project) }) },
      ],
    }),
  })
  if (!response.ok) throw new Error(`AI API request failed: ${response.status}`)
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('模型没有返回评审内容。')
  if (data.choices?.[0]?.finish_reason === 'length') throw new Error('模型输出达到长度上限，JSON未完整生成。')
  return validateReview(extractJson(content))
}

async function aiReview(project, provider) {
  try {
    return await requestReview(project, provider)
  } catch (error) {
    if (!/JSON|结构|长度上限/.test(error.message)) throw error
    return requestReview(project, provider, true)
  }
}

export { extractJson, prepareProject, validateReview }

export async function createReview(project, provider) {
  if (!provider?.configured) throw new Error('当前模型尚未配置，无法执行AI评审。')
  try {
    return await aiReview(project, provider)
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new Error('模型响应超时，请稍后重试或切换响应更快的模型。')
    throw error
  }
}
