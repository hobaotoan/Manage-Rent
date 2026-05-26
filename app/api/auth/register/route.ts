import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username?.trim() || !password) {
    return Response.json({ error: 'Tên đăng nhập và mật khẩu không được để trống' }, { status: 400 })
  }
  if (username.trim().length < 3) {
    return Response.json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự' }, { status: 400 })
  }
  if (password.length < 6) {
    return Response.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username: username.trim() } })
  if (existing) {
    return Response.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username: username.trim(), password: hashed },
  })

  const token = await signToken({ userId: user.id, username: user.username })
  const cookieAttr = setAuthCookie(token)

  const res = Response.json({ username: user.username }, { status: 201 })
  res.headers.set(
    'Set-Cookie',
    `${cookieAttr.name}=${cookieAttr.value}; HttpOnly; SameSite=Lax; Max-Age=${cookieAttr.maxAge}; Path=/`
  )
  return res
}
