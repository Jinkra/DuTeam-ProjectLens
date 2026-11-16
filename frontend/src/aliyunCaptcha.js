const CAPTCHA_SCRIPT_URL = 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js'
const CAPTCHA_SCENE_ID = 'incjhglo'
const CAPTCHA_IDENTITY = 'esa-kcmma1w2i9'
const CAPTCHA_HOST = 'dtpl.slatt.cn'

let captchaInstance = null
let initialization = null
let pendingVerification = null

function requiresCaptcha() {
  return window.location.hostname === CAPTCHA_HOST
}

function loadCaptchaScript() {
  if (window.initAliyunCaptcha) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CAPTCHA_SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', () => reject(new Error('安全验证组件加载失败，请刷新页面后重试。')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = CAPTCHA_SCRIPT_URL
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('安全验证组件加载失败，请检查网络后重试。'))
    document.head.appendChild(script)
  })
}

export function initializeAliyunCaptcha() {
  if (!requiresCaptcha()) return Promise.resolve(null)
  if (captchaInstance) return Promise.resolve(captchaInstance)
  if (initialization) return initialization

  window.AliyunCaptchaConfig = { region: 'cn', prefix: CAPTCHA_IDENTITY }
  initialization = loadCaptchaScript().then(() => new Promise((resolve, reject) => {
    window.initAliyunCaptcha({
      SceneId: CAPTCHA_SCENE_ID,
      mode: 'popup',
      element: '#aliyun-captcha-element',
      button: '#aliyun-captcha-trigger',
      language: 'cn',
      timeout: 5000,
      slideStyle: { width: 360, height: 40 },
      success(captchaVerifyParam) {
        if (!pendingVerification) return
        pendingVerification.resolve(captchaVerifyParam)
        pendingVerification = null
      },
      fail(result) {
        console.warn('阿里云AI验证码未通过', result)
      },
      getInstance(instance) {
        captchaInstance = instance
        resolve(instance)
      },
      onClose() {
        if (!pendingVerification) return
        pendingVerification.reject(new Error('安全验证已取消。'))
        pendingVerification = null
      },
      onError(errorInfo) {
        console.error('阿里云AI验证码初始化失败', errorInfo)
        reject(new Error('安全验证暂时不可用，请稍后重试。'))
      },
      server: ['captcha-esa-open.aliyuncs.com', 'captcha-esa-open-b.aliyuncs.com'],
    })
  })).catch((error) => {
    initialization = null
    throw error
  })

  return initialization
}

export async function verifyWithAliyunCaptcha() {
  if (!requiresCaptcha()) return null
  await initializeAliyunCaptcha()
  if (pendingVerification) throw new Error('安全验证正在进行，请完成后再试。')

  return new Promise((resolve, reject) => {
    pendingVerification = { resolve, reject }
    const trigger = document.querySelector('#aliyun-captcha-trigger')
    if (!trigger) {
      pendingVerification = null
      reject(new Error('安全验证组件尚未准备完成，请刷新页面后重试。'))
      return
    }
    trigger.click()
  })
}

export function captchaRequestHeaders(captchaVerifyParam) {
  return captchaVerifyParam ? { 'captcha-verify-param': captchaVerifyParam } : {}
}

export function refreshAliyunCaptcha() {
  captchaInstance?.refresh?.()
}
