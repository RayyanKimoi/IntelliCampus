import { NextRequest, NextResponse } from 'next/server'
import { adminOTPService } from '@/services/admin-otp.service'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
try {
const body = await req.json()


const email = body.email?.trim().toLowerCase()
const password = body.password?.trim()

const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase()
const adminPassword = env.ADMIN_PASSWORD?.trim()

// Debug logs (remove later if you want)
console.log('================ ADMIN LOGIN DEBUG ================')
console.log('Received Email:', email)
console.log('Expected Email:', adminEmail)
console.log('Received Password:', password)
console.log('Expected Password:', adminPassword)
console.log('Email Match:', email === adminEmail)
console.log('Password Match:', password === adminPassword)
console.log('===================================================')

if (!email || !password) {
  return NextResponse.json(
    { success: false, error: 'Missing credentials' },
    { status: 400 }
  )
}

if (email !== adminEmail || password !== adminPassword) {
  return NextResponse.json(
    { success: false, error: 'Invalid admin credentials' },
    { status: 401 }
  )
}

// Generate OTP
const result = await adminOTPService.generateAndSendOTP(adminEmail)

if (!result.success) {
  return NextResponse.json(
    { success: false, error: 'Failed to send OTP' },
    { status: 500 }
  )
}

return NextResponse.json({
  success: true,
  requiresOTP: true,
  message: 'OTP sent to your email',
})


} catch (error) {
console.error('[ADMIN LOGIN ERROR]', error)


return NextResponse.json(
  { success: false, error: 'Server error' },
  { status: 500 }
)


}
}