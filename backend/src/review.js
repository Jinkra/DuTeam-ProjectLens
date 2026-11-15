const dimensions = [
  ['aiDepth', 'AI技术深度', 35],
  ['innovation', '创新性', 25],
  ['engineering', '前端工程质量', 10],
  ['practicality', '实用性', 10],
  ['experience', '用户体验', 10],
  ['value', '社会价值与商业潜力', 10],
]

function fallbackReview(project) {
  const text = `${project.name} ${project.description} ${project.material}`.toLowerCase()
  const has = (...words) => words.some((word) => text.includes(word.toLowerCase()))
  const score = {
    aiDepth: 58 + (has('rag', '检索') ? 10 : 0) + (has('agent', '智能体') ? 9 : 0) + (has('多模态', '图像') ? 5 : 0),
    innovation: 68 + (has('证据', '可解释') ? 8 : 0),
    engineering: 74 + (has('typescript', '组件', 'vue') ? 7 : 0),
    practicality: 72 + (has('真实', '大学生', '竞赛') ? 8 : 0),
    experience: 70 + (has('流式', '响应式', '可视化') ? 7 : 0),
    value: 67 + (has('教育', '公平', '高校') ? 8 : 0),
  }
  Object.keys(score).forEach((key) => { score[key] = Math.min(score[key], 92) })
  const total = Math.round(dimensions.reduce((sum, [key, , weight]) => sum + score[key] * weight, 0) / 100)

  return {
    mode: 'fallback',
    total,
    summary: '项目场景清晰，已经形成完整的评审闭环。当前最需要补强的是检索证据的可验证性，以及Agent工具调用过程的可视化。',
    dimensions: dimensions.map(([key, label, weight]) => ({ key, label, weight, score: score[key] })),
    findings: [
      { level: 'high', title: 'RAG证据链尚需量化验证', evidence: '材料提到了知识检索，但没有说明切分策略、召回指标和引用纠错机制。', action: '准备固定测试集，对比无RAG与启用RAG后的答案准确率和引用命中率。' },
      { level: 'medium', title: 'Agent决策过程可以更透明', evidence: '当前流程描述包含多个步骤，但用户难以确认每一步调用了什么工具。', action: '在评审页展示规划、检索、评分、核验四阶段及其输入输出摘要。' },
      { level: 'medium', title: '创新点需要形成可对比表述', evidence: '项目价值明确，但尚未与通用聊天助手或普通评分表工具形成直接对照。', action: '增加竞品对比：证据引用、局部重评、改进前后验证三个差异点。' },
    ],
    evidence: [
      { dimension: '实用性', quote: project.description || '面向大学生竞赛与课程项目提供智能评审。', source: '项目简介' },
      { dimension: 'AI技术深度', quote: project.material.slice(0, 110) || '尚未提供详细材料。', source: '项目材料' },
    ],
    nextSteps: ['补充一组真实项目材料作为基准案例', '展示Agent工具调用时间线', '加入评分前后对比和局部重评'],
  }
}

async function aiReview(project, provider) {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: '你是高校AI Web竞赛评审专家。仅输出JSON，字段必须为total, summary, dimensions, findings, evidence, nextSteps。dimensions包含key,label,weight,score；findings包含level,title,evidence,action。所有判断必须引用材料，不得编造。' },
        { role: 'user', content: JSON.stringify({ rubric: dimensions, project }) },
      ],
    }),
  })
  if (!response.ok) throw new Error(`AI API request failed: ${response.status}`)
  const data = await response.json()
  return { ...JSON.parse(data.choices[0].message.content), mode: 'ai' }
}

export async function createReview(project, provider) {
  if (!provider?.configured) return fallbackReview(project)
  return aiReview(project, provider)
}
