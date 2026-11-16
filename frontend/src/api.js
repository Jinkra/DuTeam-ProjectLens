const baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4100/api' : '/api')

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
  if (!response.ok) {
    const captchaCode = response.headers.get('x-captcha-verify-code')
    const captchaMessages = {
      F001: '安全验证未通过，请重新验证。',
      F003: '安全验证参数无效，请刷新页面后重试。',
      F008: '安全验证已使用，请重新验证。',
      F010: '当前网络验证次数过多，请稍后重试。',
      F011: '当前设备验证次数过多，请稍后重试。',
      F014: '安全验证已失效，请重新验证。',
      F015: '安全验证未完成，请重试。',
      F018: '安全验证已使用，请重新验证。',
      F019: '安全验证已超时，请重新验证。',
      F020: '安全验证与当前请求不匹配，请重新验证。',
      F021: '安全验证场景不匹配，请联系管理员。',
      F022: '安全验证配置异常，请联系管理员。',
      F024: '当前操作环境未通过安全验证。',
    }
    const statusMessages = {
      524: '模型响应超时，请稍后重试或在管理后台切换响应更快的模型。',
      502: '模型服务暂时不可用，请稍后重试。',
      504: '模型服务响应超时，请稍后重试。',
    }
    throw new Error(captchaMessages[captchaCode] || data.message || statusMessages[response.status] || `请求失败（${response.status}）`)
  }
  return data
}
