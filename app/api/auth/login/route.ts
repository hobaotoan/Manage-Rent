import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username?.trim() || !password) {
    return Response.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim() } })
  if (!user) {
    return Response.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return Response.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' }, { status: 401 })
  }

  const token = await signToken({ userId: user.id, username: user.username })
  const cookieAttr = setAuthCookie(token)

  const res = Response.json({ username: user.username })
  res.headers.set(
    'Set-Cookie',
    `${cookieAttr.name}=${cookieAttr.value}; HttpOnly; SameSite=Lax; Max-Age=${cookieAttr.maxAge}; Path=/`
  )
  return res
}
