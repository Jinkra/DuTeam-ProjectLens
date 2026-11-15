const projectDefaults = {
  workspace: [
    { id: 'projectlens-demo', name: 'DuTeam ProjectLens', description: '面向大学生竞赛与课程项目的 AI 项目评审与改进 Agent', category: 'AI Agent 智能助手', status: '进行中', updatedAt: '2026-11-15T09:45:00.000Z', lastOpenedAt: '2026-11-15T09:45:00.000Z' },
  ],
  workflow: [
    { id: 'wf-competition', name: '竞赛评审自动化', description: '材料读取、知识检索、AI 评审与报告输出', status: '草稿', updatedAt: '2026-11-15T09:30:00.000Z', lastOpenedAt: '2026-11-15T09:30:00.000Z' },
    { id: 'wf-rubric', name: '评分标准核验流程', description: '根据竞赛规则核验评分证据与缺失材料', status: '已完成', updatedAt: '2026-11-12T14:20:00.000Z', lastOpenedAt: '2026-11-12T14:20:00.000Z' },
    { id: 'wf-defense', name: '答辩材料预审', description: '提取答辩重点并生成风险检查清单', status: '草稿', updatedAt: '2026-11-08T10:10:00.000Z', lastOpenedAt: '2026-11-08T10:10:00.000Z' },
  ],
  review: [
    { id: 'rv-projectlens', name: 'ProjectLens 项目评审', description: 'AI 项目评审与改进 Agent 六维综合评审', status: '已完成', updatedAt: '2026-11-15T09:45:00.000Z', lastOpenedAt: '2026-11-15T09:45:00.000Z' },
    { id: 'rv-course', name: '课程项目阶段评审', description: '课程设计完成度、工程质量与创新性评估', status: '进行中', updatedAt: '2026-11-13T16:30:00.000Z', lastOpenedAt: '2026-11-13T16:30:00.000Z' },
    { id: 'rv-innovation', name: '创新创业项目初评', description: '商业价值、可行性和展示材料完整度检查', status: '草稿', updatedAt: '2026-11-09T11:00:00.000Z', lastOpenedAt: '2026-11-09T11:00:00.000Z' },
  ],
}

function accountId(user) {
  return user?.id || user?.email || 'anonymous'
}

export function projectStorageKey(kind, user) {
  return `projectlens_${accountId(user)}_${kind}_projects`
}

export function activeProjectKey(kind, user) {
  return `projectlens_${accountId(user)}_active_${kind}_project`
}

export function loadAccountProjects(kind, user) {
  const key = projectStorageKey(kind, user)
  const saved = localStorage.getItem(key)
  if (saved !== null) {
    try { return JSON.parse(saved) } catch { return [] }
  }

  const legacyKey = `projectlens_${kind}_projects`
  const migrationOwnerKey = 'projectlens_legacy_projects_owner'
  const migrationOwner = localStorage.getItem(migrationOwnerKey)
  if (!migrationOwner || migrationOwner === accountId(user)) {
    const legacy = localStorage.getItem(legacyKey)
    if (legacy !== null) {
      try {
        const projects = JSON.parse(legacy)
        localStorage.setItem(key, JSON.stringify(projects))
        localStorage.setItem(migrationOwnerKey, accountId(user))
        return projects
      } catch { /* Fall through to account defaults. */ }
    }
  }

  const projects = projectDefaults[kind].map((project) => ({ ...project }))
  localStorage.setItem(key, JSON.stringify(projects))
  return projects
}

export function saveAccountProjects(kind, user, projects) {
  localStorage.setItem(projectStorageKey(kind, user), JSON.stringify(projects))
  window.dispatchEvent(new CustomEvent('projectlens:projects-changed', { detail: { kind, userId: accountId(user) } }))
}

export function getActiveWorkspace(user) {
  const projects = loadAccountProjects('workspace', user)
  const activeId = localStorage.getItem(activeProjectKey('workspace', user))
  return projects.find((project) => project.id === activeId) || null
}

export function setActiveWorkspace(user, project) {
  localStorage.setItem(activeProjectKey('workspace', user), project.id)
  window.dispatchEvent(new CustomEvent('projectlens:active-project-changed', { detail: project }))
}
