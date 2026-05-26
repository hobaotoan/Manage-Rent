export async function POST() {
  const res = Response.json({ success: true })
  res.headers.set('Set-Cookie', 'auth_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/')
  return res
}
