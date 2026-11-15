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
    const user = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), createdAt: new Date().toISOString() }
    data.users.push(user)
    return user
  })
  if (!result) return res.status(409).json({ message: '该邮箱已经注册。' })
  res.status(201).json({ token: signToken(result), user: { id: result.id, name: result.name, email: result.email } })
})

app.post('/api/auth/login', async (req, res) => {
  const data = await readStore()
  const user = data.users.find((item) => item.email === req.body.email?.trim().toLowerCase())
  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: '邮箱或密码不正确。' })
  res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email } })
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

app.listen(port, () => console.log(`ProjectLens API running at http://localhost:${port}`))
