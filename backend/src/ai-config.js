import { readStore, updateStore } from './store.js'

export const providerDefinitions = {
  deepseek: { label: 'DeepSeek Auto', defaultBaseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  chatgpt: { label: 'ChatGPT Auto', defaultBaseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  qwen: { label: 'Qwen Auto', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-max' },
}

function normalizeProvider(id, value = {}) {
  const definition = providerDefinitions[id]
  const provider = {
    id,
    label: definition.label,
    baseUrl: String(value.baseUrl || definition.defaultBaseUrl).replace(/\/$/, ''),
    apiKey: String(value.apiKey || ''),
    model: String(value.model || definition.defaultModel),
    enabled: value.enabled !== false,
  }
  provider.configured = Boolean(provider.enabled && provider.apiKey && provider.baseUrl && provider.model)
  return provider
}

export function publicProvider(provider) {
  return {
    id: provider.id,
    label: provider.label,
    baseUrl: provider.baseUrl,
    model: provider.model,
    enabled: provider.enabled,
    configured: provider.configured,
    keyPreview: provider.apiKey ? `${provider.apiKey.slice(0, 3)}••••${provider.apiKey.slice(-4)}` : '',
  }
}

export async function getAiProviders() {
  const data = await readStore()
  return Object.keys(providerDefinitions).map((id) => normalizeProvider(id, data.aiProviders?.[id]))
}

export async function getAiProvider(id = 'deepseek') {
  const providers = await getAiProviders()
  return providers.find((provider) => provider.id === id) || providers[0]
}

export async function saveAiProvider(id, changes) {
  if (!providerDefinitions[id]) return null
  return updateStore((data) => {
    data.aiProviders = data.aiProviders || {}
    const current = normalizeProvider(id, data.aiProviders[id])
    data.aiProviders[id] = {
      baseUrl: String(changes.baseUrl || current.baseUrl).trim().replace(/\/$/, ''),
      apiKey: changes.apiKey === undefined || changes.apiKey === '' ? current.apiKey : String(changes.apiKey).trim(),
      model: String(changes.model || current.model).trim(),
      enabled: changes.enabled !== false,
    }
    return normalizeProvider(id, data.aiProviders[id])
  })
}

async function providerFetch(provider, path, options = {}) {
  if (!provider.apiKey) throw new Error('请先配置API密钥。')
  const response = await fetch(`${provider.baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}`, ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || data.message || `模型服务返回${response.status}`)
  return data
}

export async function fetchProviderModels(provider) {
  const data = await providerFetch(provider, '/models')
  return (data.data || []).map((item) => item.id).filter(Boolean).sort()
}

export async function testProvider(provider) {
  const data = await providerFetch(provider, '/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ model: provider.model, max_tokens: 8, temperature: 0, messages: [{ role: 'user', content: '回复OK' }] }),
  })
  return data.choices?.[0]?.message?.content || '连接成功'
}
