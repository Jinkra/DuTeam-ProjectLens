const dimensions = [
  ['aiDepth', 'AI技术深度', 35],
  ['innovation', '创新性', 25],
  ['engineering', '前端工程质量', 10],
  ['practicality', '实用性', 10],
  ['experience', '用户体验', 10],
  ['value', '社会价值与商业潜力', 10],
]

async function aiReview(project, provider) {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: '你是高校AI竞赛评审专家。必须完全依据用户提供的项目简介和材料正文进行评审，评分、结论、证据、改进建议和下一步均由你本次分析生成，禁止套用固定模板或编造未出现的事实。所有总分和维度分均使用0到100分制。仅输出JSON，字段必须为total, summary, dimensions, findings, evidence, nextSteps。dimensions必须覆盖给定六个维度并包含key,label,weight,score；findings包含level,title,evidence,action；evidence包含dimension,quote,source，quote必须是材料中的原文短句。如果材料不足，须具体指出缺失内容及其对评分的影响。' },
        { role: 'user', content: JSON.stringify({ rubric: dimensions, project }) },
      ],
    }),
  })
  if (!response.ok) throw new Error(`AI API request failed: ${response.status}`)
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('模型没有返回评审内容。')
  const review = JSON.parse(content)
  if (!Number.isFinite(Number(review.total)) || !Array.isArray(review.dimensions) || !Array.isArray(review.findings) || !Array.isArray(review.evidence)) {
    throw new Error('模型返回的评审结构不完整。')
  }
  return { ...review, total: Number(review.total), mode: 'ai' }
}

export async function createReview(project, provider) {
  if (!provider?.configured) throw new Error('当前模型尚未配置，无法执行AI评审。')
  return aiReview(project, provider)
}
