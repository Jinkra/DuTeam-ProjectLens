import { api } from './api'

function accountId(user) {
  return user?.id || user?.email || 'anonymous'
}

export function projectStorageKey(kind, user) {
  return `projectlens_${accountId(user)}_${kind}_projects`
}

export function activeProjectKey(kind, user) {
  return `projectlens_${accountId(user)}_active_${kind}_project`
}

function withoutRemovedDefaults(kind, projects) {
  return kind === 'workspace' ? projects.filter((project) => project.id !== 'projectlens-demo') : projects
}

export function loadAccountProjects(kind, user) {
  const key = projectStorageKey(kind, user)
  const saved = localStorage.getItem(key)
  if (saved !== null) {
    try {
      const projects = JSON.parse(saved)
      const cleaned = withoutRemovedDefaults(kind, projects)
      if (cleaned.length !== projects.length) localStorage.setItem(key, JSON.stringify(cleaned))
      return cleaned
    } catch { return [] }
  }

  const legacyKey = `projectlens_${kind}_projects`
  const migrationOwnerKey = 'projectlens_legacy_projects_owner'
  const migrationOwner = localStorage.getItem(migrationOwnerKey)
  if (!migrationOwner || migrationOwner === accountId(user)) {
    const legacy = localStorage.getItem(legacyKey)
    if (legacy !== null) {
      try {
        const projects = withoutRemovedDefaults(kind, JSON.parse(legacy))
        localStorage.setItem(key, JSON.stringify(projects))
        localStorage.setItem(migrationOwnerKey, accountId(user))
        return projects
      } catch { /* Ignore invalid legacy data. */ }
    }
  }

  localStorage.setItem(key, '[]')
  return []
}

export function saveAccountProjects(kind, user, projects) {
  localStorage.setItem(projectStorageKey(kind, user), JSON.stringify(projects))
  window.dispatchEvent(new CustomEvent('projectlens:projects-changed', { detail: { kind, userId: accountId(user) } }))
}

export async function refreshWorkspaceProjects(user) {
  const cached = loadAccountProjects('workspace', user)
  let projects = await api('/projects')
  const serverIds = new Set(projects.map((project) => project.id))
  const localOnlyProjects = cached.filter((project) => !serverIds.has(project.id))

  if (localOnlyProjects.length) {
    const migrated = []
    for (const project of localOnlyProjects) {
      const localWorkflow = localStorage.getItem(`projectlens_${accountId(user)}_${project.id}_workflow`)
      migrated.push(await api('/projects', {
        method: 'POST',
        body: JSON.stringify({ clientId: project.id, name: project.name, category: project.category, description: project.description || '暂无项目简介', status: project.status || '草稿', workspaceState: localWorkflow ? { workflow: JSON.parse(localWorkflow) } : {} }),
      }))
    }
    projects = [...migrated, ...projects]
  }

  saveAccountProjects('workspace', user, projects)
  return projects
}

export async function syncWorkflowState(user, projectId, workflow) {
  if (!projectId || projectId === 'default') return null
  return api(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ workspaceState: { workflow } }),
  })
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
