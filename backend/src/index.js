import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import crypto from 'node:crypto'
import { requireAuth, signToken } from './auth.js'
import { createReview } from './review.js'
import { readStore, updateStore } from './store.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const configuredOrigins = (process.env.WEB_ORIGINS || process.env.WEB_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const isLocalOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
const defaultAdmin = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  email: process.env.ADMIN_EMAIL || 'admin@projectlens.local',
}
// Rolling-window limits are enforced server-side for every AI operation.
const planLimits = {
  free: { fourHours: 5, day: 15, total: 100 },
  pro: { fourHours: 40, day: 150, total: 2000 },
  team: { fourHours: 120, day: 500, total: 10000 },
}

function publicUser(user) {
  return { id: user.id, name: user.name, username: user.username || null, email: user.email, role: user.role || (adminEmails.includes(user.email) ? 'admin' : 'user') }
}

async function ensureDefaultAdmin() {
  await updateStore(async (data) => {
    const existing = data.users.find((user) => user.username === defaultAdmin.username || user.email === defaultAdmin.email)
    if (existing) {
      existing.username = defaultAdmin.username
      existing.role = 'admin'
      existing.status = 'active'
      return
    }
    const createdAt = new Date().toISOString()
    data.users.push({ id: crypto.randomUUID(), username: defaultAdmin.username, name: '系统管理员', email: defaultAdmin.email, passwordHash: await bcrypt.hash(defaultAdmin.password, 10), role: 'admin', status: 'active', plan: 'free', billingCycle: 'monthly', usagePeriodStartedAt: createdAt, usageEvents: [], createdAt })
  })
}

function usageSnapshot(user, now = Date.now()) {
  const plan = user.plan || 'free'
  const limits = planLimits[plan] || planLimits.free
  const events = (user.usageEvents || []).map((value) => new Date(value).getTime()).filter(Number.isFinite)
  const periodStart = new Date(user.usagePeriodStartedAt || user.subscriptionUpdatedAt || user.createdAt || 0).getTime()
  const used = {
    fourHours: events.filter((time) => time >= now - 4 * 60 * 60 * 1000).length,
    day: events.filter((time) => time >= now - 24 * 60 * 60 * 1000).length,
    total: events.filter((time) => time >= periodStart).length,
  }
  return { used, limits, periodStartedAt: new Date(periodStart || now).toISOString() }
}

async function consumeUsage(userId, requestedUnits = 1) {
  const units = Math.max(1, Math.min(5, Math.round(Number(requestedUnits) || 1)))
  return updateStore((data) => {
    const user = data.users.find((item) => item.id === userId)
    if (!user || user.status === 'suspended') return { error: user ? '账号已被暂停。' : '没有找到该用户。', status: user ? 403 : 404 }
    const usage = usageSnapshot(user)
    const exceeded = Object.keys(usage.used).find((key) => usage.used[key] + units > usage.limits[key])
    if (exceeded) return { error: `当前 ${user.plan || 'free'} 套餐用量已达上限，请升级套餐或等待窗口重置。`, status: 429, usage }
    const timestamp = new Date().toISOString()
    user.usageEvents = [...(user.usageEvents || []), ...Array.from({ length: units }, () => timestamp)]
    return { units, usage: usageSnapshot(user) }
  })
}

async function requireAdmin(req, res, next) {
  const data = await readStore()
  const user = data.users.find((item) => item.id === req.user.sub)
  if (!user || (user.role !== 'admin' && !adminEmails.includes(user.email))) return res.status(403).json({ message: '需要管理员权限。' })
  req.admin = user
  next()
}

app.use(cors({
  origin(origin, callback) {
    const allowed = !origin
      || configuredOrigins.includes(origin)
      || (process.env.NODE_ENV !== 'production' && isLocalOrigin(origin))
    callback(allowed ? null : new Error(`CORS blocked origin: ${origin}`), allowed)
  },
}))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(process.env.AI_API_KEY) }))

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) return res.status(400).json({ message: '请填写姓名、邮箱，并使用至少 6 位密码。' })
  const normalizedEmail = email.trim().toLowerCase()
  const result = await updateStore(async (data) => {
    if (data.users.some((user) => user.email === normalizedEmail)) return null
    const createdAt = new Date().toISOString()
    const user = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role: adminEmails.includes(normalizedEmail) ? 'admin' : 'user', status: 'active', plan: 'free', billingCycle: 'monthly', usagePeriodStartedAt: createdAt, usageEvents: [], createdAt }
    data.users.push(user)
    return user
  })
  if (!result) return res.status(409).json({ message: '该邮箱已经注册。' })
  res.status(201).json({ token: signToken(result), user: publicUser(result) })
})

app.get('/api/subscription', requireAuth, async (req, res) => {
  const data = await readStore()
  const user = data.users.find((item) => item.id === req.user.sub)
  if (!user) return res.status(404).json({ message: '没有找到该用户。' })
  res.json({ user: publicUser(user), plan: user.plan || 'free', billingCycle: user.billingCycle || 'monthly', expiresAt: user.subscriptionExpiresAt || null, usage: usageSnapshot(user) })
})

app.post('/api/subscription', requireAuth, async (req, res) => {
  const plans = ['free', 'pro', 'team']
  const billingCycles = ['monthly', 'yearly']
  if (!plans.includes(req.body.plan) || !billingCycles.includes(req.body.billingCycle)) return res.status(400).json({ message: '套餐参数无效。' })
  const subscription = await updateStore((data) => {
    const user = data.users.find((item) => item.id === req.user.sub)
    if (!user) return null
    user.plan = req.body.plan
    user.billingCycle = req.body.billingCycle
    const now = new Date()
    user.subscriptionUpdatedAt = now.toISOString()
    user.usagePeriodStartedAt = now.toISOString()
    user.usageEvents = []
    user.subscriptionExpiresAt = user.plan === 'free' ? null : new Date(now.getTime() + (user.billingCycle === 'yearly' ? 365 : 30) * 86400000).toISOString()
    return { plan: user.plan, billingCycle: user.billingCycle, expiresAt: user.subscriptionExpiresAt, usage: usageSnapshot(user) }
  })
  if (!subscription) return res.status(404).json({ message: '没有找到该用户。' })
  res.json(subscription)
})

app.post('/api/auth/login', async (req, res) => {
  const data = await readStore()
  const identifier = req.body.email?.trim().toLowerCase()
  const user = data.users.find((item) => item.email === identifier || item.username?.toLowerCase() === identifier)
  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: '邮箱或密码不正确。' })
  if (user.status === 'suspended') return res.status(403).json({ message: '该账号已被暂停，请联系管理员。' })
  res.json({ token: signToken(user), user: publicUser(user) })
})

app.post('/api/usage/consume', requireAuth, async (req, res) => {
  const result = await consumeUsage(req.user.sub, req.body.units)
  if (result.error) return res.status(result.status).json({ message: result.error, usage: result.usage })
  res.json(result)
})

app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
  const data = await readStore()
  const users = data.users.map((user) => ({ ...publicUser(user), status: user.status || 'active', plan: user.plan || 'free', billingCycle: user.billingCycle || 'monthly', expiresAt: user.subscriptionExpiresAt || null, usage: usageSnapshot(user), createdAt: user.createdAt }))
  res.json({
    stats: { users: users.length, paid: users.filter((user) => user.plan !== 'free').length, suspended: users.filter((user) => user.status === 'suspended').length, projects: data.projects.length },
    users,
  })
})

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const allowedPlans = ['free', 'pro', 'team']
  const allowedCycles = ['monthly', 'yearly']
  const updated = await updateStore((data) => {
    const user = data.users.find((item) => item.id === req.params.id)
    if (!user) return null
    if (typeof req.body.name === 'string' && req.body.name.trim()) user.name = req.body.name.trim()
    if (['active', 'suspended'].includes(req.body.status)) user.status = req.body.status
    if (['user', 'admin'].includes(req.body.role)) user.role = req.body.role
    if (allowedPlans.includes(req.body.plan)) user.plan = req.body.plan
    if (allowedCycles.includes(req.body.billingCycle)) user.billingCycle = req.body.billingCycle
    if (req.body.resetUsage) { user.usageEvents = []; user.usagePeriodStartedAt = new Date().toISOString() }
    if (req.body.plan || req.body.billingCycle) {
      const now = new Date()
      user.subscriptionUpdatedAt = now.toISOString()
      user.subscriptionExpiresAt = user.plan === 'free' ? null : new Date(now.getTime() + (user.billingCycle === 'yearly' ? 365 : 30) * 86400000).toISOString()
    }
    return { ...publicUser(user), status: user.status || 'active', plan: user.plan || 'free', billingCycle: user.billingCycle || 'monthly', expiresAt: user.subscriptionExpiresAt || null, usage: usageSnapshot(user), createdAt: user.createdAt }
  })
  if (!updated) return res.status(404).json({ message: '没有找到该用户。' })
  res.json(updated)
})

app.get('/api/projects', requireAuth, async (req, res) => {
  const data = await readStore()
  res.json(data.projects.filter((project) => project.userId === req.user.sub).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
})

app.post('/api/projects', requireAuth, async (req, res) => {
  const { name, category, description, material } = req.body
  if (!name?.trim() || !description?.trim()) return res.status(400).json({ message: '项目名称和简介不能为空。' })
  const project = await updateStore((data) => {
    const item = { id: crypto.randomUUID(), userId: req.user.sub, name: name.trim(), category: category || 'AI Web 应用', description: description.trim(), material: material?.trim() || '', review: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    data.projects.push(item)
    return item
  })
  res.status(201).json(project)
})

app.post('/api/projects/:id/review', requireAuth, async (req, res) => {
  const data = await readStore()
  const project = data.projects.find((item) => item.id === req.params.id && item.userId === req.user.sub)
  if (!project) return res.status(404).json({ message: '没有找到该项目。' })
  const consumed = await consumeUsage(req.user.sub)
  if (consumed.error) return res.status(consumed.status).json({ message: consumed.error, usage: consumed.usage })
  const review = await createReview(project)
  const updated = await updateStore((store) => {
    const target = store.projects.find((item) => item.id === project.id)
    target.review = { ...review, createdAt: new Date().toISOString() }
    target.updatedAt = new Date().toISOString()
    return target
  })
  res.json(updated)
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: '服务暂时不可用，请稍后重试。' })
})

await ensureDefaultAdmin()
app.listen(port, () => console.log(`ProjectLens API running at http://localhost:${port}`))
