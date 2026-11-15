function fallbackAnswer(project, question, context) {
  const name = project?.name || '当前项目'
  const materials = context?.materials?.length ? `我已读取到${context.materials.length}项材料索引：${context.materials.slice(0, 4).join('、')}。` : '当前项目还没有可引用的材料文件，回答主要依据项目简介。'
  const report = context?.workflowReport
  const reportSummary = report ? `最近一次工作流分析报告综合评分为${report.total}分，结论为：${report.summary}` : ''
  const focus = (question.includes('报告') || question.includes('评分')) && report
    ? `${reportSummary}。主要改进项包括：${(report.findings || []).slice(0, 3).map((item) => `${item.title}（${item.action}）`).join('；') || '暂无明确改进项'}。`
    : question.includes('答辩')
    ? '建议先用“问题背景、核心方案、量化证据、风险与下一步”五段结构组织回答，并为每个结论准备一条项目材料依据。'
    : question.includes('改进') || question.includes('优化')
      ? '建议优先补齐可验证指标、真实使用案例和结论到证据的映射，再处理展示层面的优化。'
      : `结合项目方向“${project?.category || 'AI项目'}”，建议先明确目标用户、核心任务和可量化的成功标准，再判断当前功能是否真正支撑项目目标。`
  return {
    content: `关于「${name}」：${materials}${focus}`,
    citations: [
      { label: '项目简介', detail: project?.description || '暂无项目简介' },
      ...(report ? [{ label: '工作流分析报告', detail: `${report.title || '评审报告'} · ${report.total}分` }] : []),
      ...(context?.materials || []).slice(0, 2).map((item) => ({ label: '项目材料', detail: item })),
    ],
    mode: 'fallback',
  }
}

export async function chatWithProject({ project, question, messages = [], context = {}, preferences = {} }) {
  if (!process.env.AI_API_KEY) return fallbackAnswer(project, question, context)
  const history = messages.slice(-8).map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: String(item.content || '').slice(0, 3000) }))
  const projectContext = JSON.stringify({
    name: project?.name,
    category: project?.category,
    description: project?.description,
    status: project?.status,
    materials: (context.materials || []).slice(0, 30),
    workflowNodes: (context.workflowNodes || []).slice(0, 20),
    workflowReport: context.workflowReport ? {
      title: context.workflowReport.title,
      generatedAt: context.workflowReport.generatedAt,
      analysisMode: context.workflowReport.analysisMode,
      total: context.workflowReport.total,
      summary: context.workflowReport.summary,
      dimensions: (context.workflowReport.dimensions || []).slice(0, 10),
      findings: (context.workflowReport.findings || []).slice(0, 10),
    } : null,
  }, null, 2)
  const response = await fetch(`${process.env.AI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: 0.35,
      messages: [
        { role: 'system', content: `你是DuTeam ProjectLens的Duts项目助手。只围绕给定项目上下文回答，明确区分已知事实与建议。回答使用简洁中文，优先给出可执行步骤；引用资料时写出资料名称。当前对话模式：${preferences.mode || '项目问答'}；推理等级：${preferences.effort || '标准推理'}。项目上下文：\n${projectContext}` },
        ...history,
        { role: 'user', content: question },
      ],
    }),
  })
  if (!response.ok) throw new Error(`模型服务返回${response.status}`)
  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || '没有获得有效回答，请换一种方式提问。',
    citations: [
      { label: '项目简介', detail: project?.description || '暂无项目简介' },
      ...(context.workflowReport ? [{ label: '工作流分析报告', detail: `${context.workflowReport.title || '评审报告'} · ${context.workflowReport.total}分` }] : []),
      ...(context.materials || []).slice(0, 3).map((item) => ({ label: '项目材料', detail: item })),
    ],
    mode: 'ai',
  }
}
