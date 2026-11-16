const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4100/api'

export async function api(path, options = {}) {
  const token = localStorage.getItem('projectlens_token')
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || '请求失败')
  return data
}
