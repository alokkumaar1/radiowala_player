import { NextResponse } from 'next/server'

const ADMIN_USERNAME = '9006808449'
const ADMIN_PASSWORD = '@Alok9006808449'

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const username = typeof payload?.username === 'string' ? payload.username : ''
  const password = typeof payload?.password === 'string' ? payload.password : ''

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect username or password.' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('radio-wala-admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return response
}
