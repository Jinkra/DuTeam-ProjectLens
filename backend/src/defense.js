export async function analyzeDefenseAnswer({ project, question, answer, provider }) {
  if (!provider?.configured) throw new Error('当前模型尚未配置，无法执行AI答辩分析。')
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是高校AI竞赛答辩教练。请结合项目上下文、评委问题和学生本次回答进行真实分析，不得返回固定话术，不得假设项目拥有材料中没有的能力。仅输出JSON：summary为总体评价；structure、evidence、credibility为0到100整数；strengths和suggestions为字符串数组；followUp为一条针对本次回答的追问。建议必须具体、可执行，并点明应补充的数据、材料或表达结构。',
        },
        { role: 'user', content: JSON.stringify({ project, question, answer }) },
      ],
    }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error?.message || data.message || `模型服务返回${response.status}`)
  }
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('模型没有返回答辩分析。')
  const result = JSON.parse(content)
  if (!result.summary || !Array.isArray(result.suggestions)) throw new Error('模型返回的答辩分析结构不完整。')
  return { ...result, mode: 'ai' }
}
