import jwt from 'jsonwebtoken'

const jwtSecret = () => process.env.JWT_SECRET || 'development-only-secret-change-me'

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, jwtSecret(), { expiresIn: '7d' })
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: '请先登录后继续。' })

  try {
    req.user = jwt.verify(token, jwtSecret())
    next()
  } catch {
    res.status(401).json({ message: '登录状态已失效，请重新登录。' })
  }
}
