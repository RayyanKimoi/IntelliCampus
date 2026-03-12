import { NextRequest, NextResponse } from 'next/server'
import { adminOTPService } from '@/services/admin-otp.service'
import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
try {
const body = await req.json()


const email = body.email?.trim().toLowerCase()
const password = body.password?.trim()

if (!email || !password) {
  return NextResponse.json(
    { success: false, error: 'Missing credentials' },
    { status: 400 }
  )
}

// First, check if the email matches the env admin credentials
const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase()
const adminPassword = env.ADMIN_PASSWORD?.trim()

console.log('[Admin Login] Attempting login for:', email)

let isValidAdmin = false
let adminUser = null

// Check env credentials first for backward compatibility
if (email === adminEmail && password === adminPassword) {
  console.log('[Admin Login] Matched env admin credentials')
  isValidAdmin = true
  
  // Lookup the user in database
  try {
    adminUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        institutionId: true,
      },
    })
    
    if (adminUser && adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'User is not an admin' },
        { status: 403 }
      )
    }
  } catch (dbError) {
    console.warn('[Admin Login] Database lookup failed, proceeding with env credentials only')
  }
}

// If env check didn't match, try database admin users
if (!isValidAdmin) {
  try {
    const dbAdmin = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        institutionId: true,
        passwordHash: true,
      },
    })
    
    if (dbAdmin && dbAdmin.role === 'admin') {
      // Verify password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, dbAdmin.passwordHash)
      
      if (isPasswordValid) {
        console.log('[Admin Login] Matched database admin credentials')
        isValidAdmin = true
        adminUser = dbAdmin
      }
    }
  } catch (dbError) {
    console.error('[Admin Login] Database admin check failed:', dbError)
  }
}

if (!isValidAdmin) {
  return NextResponse.json(
    { success: false, error: 'Invalid admin credentials' },
    { status: 401 }
  )
}

// Generate and send OTP
const result = await adminOTPService.generateAndSendOTP(email)

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