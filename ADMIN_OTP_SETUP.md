# 🔐 Admin OTP Authentication System - Setup Guide

## ✅ Implementation Complete

A complete admin authentication system with OTP verification has been successfully implemented in the IntelliCampus project.

---

## 📋 What Was Created

### 1. **Database Schema** ✅
- Added `AdminOTP` model to `prisma/schema.prisma`
- Fields: email, otpHash, expiresAt, used, attempts
- Indexed for performance

### 2. **Backend Services** ✅
- `src/lib/email.ts` - Email service using Resend (with dev fallback)
- `src/services/admin-otp.service.ts` - Complete OTP management
  - Generate & send OTP
  - Verify OTP with rate limiting
  - Automatic expiry handling

### 3. **API Routes** ✅
- `/api/admin/login` - Verify credentials + send OTP
- `/api/admin/verify-otp` - Verify OTP + issue JWT token

### 4. **Frontend** ✅
- `/login-admin` page - Beautiful 2-step authentication UI
  - Step 1: Email + Password
  - Step 2: 6-digit OTP input
  - Auto-focus, paste support, loading states

### 5. **Configuration** ✅
- Environment variables added to `.env`
- `src/lib/env.ts` updated
- Resend package installed

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd frontend
pnpm install
```

The `resend` package has already been added to package.json.

### Step 2: Run Database Migration

**Option A: Using Prisma CLI (Recommended)**
```bash
cd frontend
pnpm prisma migrate dev --name add_admin_otp
```

**Option B: Manual SQL Execution**
If you prefer to run the SQL directly in your Supabase dashboard:

```sql
-- Copy and run the content from: admin_otp_migration.sql
CREATE TABLE "admin_otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_otp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_otp_email_idx" ON "admin_otp"("email");
CREATE INDEX "admin_otp_expires_at_idx" ON "admin_otp"("expires_at");
```

### Step 3: Ensure Admin User Exists

Make sure you have an admin user in the database with:
- **Email**: `divyajeetsahu24@gmail.com`
- **Role**: `admin`

**SQL to create admin user (if not exists):**
```sql
-- Check if admin user exists
SELECT * FROM users WHERE email = 'divyajeetsahu24@gmail.com';

-- If not, create one (you'll need an institution ID)
INSERT INTO users (id, name, email, password_hash, role, institution_id)
VALUES (
  gen_random_uuid()::text,
  'Admin User',
  'divyajeetsahu24@gmail.com',
  '$2a$12$your-hashed-password-here', -- Hash the password "123456890" using bcrypt
  'admin',
  'your-institution-id'
);
```

**To generate the password hash:**
```bash
# Using Node.js
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('123456890', 12).then(console.log)"
```

### Step 4: Configure Email Service

**For Development (No Resend needed):**
- OTPs will be logged to console
- Check terminal output for OTP codes

**For Production (Resend):**
1. Sign up at https://resend.com (Free tier: 100 emails/day)
2. Get your API key
3. Add to `.env`:
```env
RESEND_API_KEY=re_your_actual_key_here
```

4. **Important**: Update the "from" email in `src/lib/email.ts`:
```typescript
from: 'IntelliCampus <noreply@yourdomain.com>', // Change this
```

### Step 5: Verify Installation

```bash
# Generate Prisma client
pnpm prisma generate

# Start development server
pnpm dev
```

Visit: http://localhost:3000/login-admin

---

## 🎯 How to Use

### Admin Login Flow

1. **Navigate to Admin Login**
   ```
   http://localhost:3000/login-admin
   ```

2. **Step 1: Enter Credentials**
   - Email: `divyajeetsahu24@gmail.com`
   - Password: `123456890`
   - Click "Continue"

3. **Step 2: Check Email for OTP**
   - In **development**: Check your terminal/console
   - In **production**: Check your email inbox
   - OTP is valid for 5 minutes
   - Maximum 5 attempts

4. **Step 3: Enter OTP**
   - Type or paste the 6-digit code
   - Click "Verify & Login"

5. **Success!**
   - JWT token stored in localStorage
   - Redirected to `/admin/dashboard`

---

## 🔒 Security Features

✅ **Password Verification**: Credentials checked before OTP is sent  
✅ **OTP Hashing**: OTPs stored as bcrypt hashes, never plaintext  
✅ **Expiry**: OTPs expire after 5 minutes  
✅ **Single Use**: Each OTP can only be used once  
✅ **Rate Limiting**: Maximum 5 verification attempts  
✅ **Auto-Invalidation**: Old OTPs invalidated when new ones are generated  
✅ **Database Storage**: No in-memory storage - works in serverless  

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── admin/
│   │   │       ├── login/route.ts         # Verify credentials + send OTP
│   │   │       └── verify-otp/route.ts    # Verify OTP + issue JWT
│   │   └── login-admin/
│   │       └── page.tsx                   # Admin login UI
│   ├── lib/
│   │   ├── email.ts                       # Email service (Resend)
│   │   └── env.ts                         # Environment config (updated)
│   └── services/
│       └── admin-otp.service.ts           # OTP business logic
├── prisma/
│   └── schema.prisma                      # Database schema (updated)
└── .env                                   # Environment variables (updated)
```

---

## 🧪 Testing

### Test in Development Mode

1. **Start the server:**
   ```bash
   pnpm dev
   ```

2. **Login attempt:**
   - Go to http://localhost:3000/login-admin
   - Enter: `divyajeetsahu24@gmail.com` / `123456890`

3. **Check terminal for OTP:**
   ```
   ============================================================
   📧 ADMIN OTP EMAIL (Development Mode)
   ============================================================
   To: divyajeetsahu24@gmail.com
   OTP Code: 123456
   Expires: 5 minutes
   ============================================================
   ```

4. **Enter OTP and verify**

### Test OTP Features

**Test Expiry:**
- Wait 5 minutes after receiving OTP
- Try to verify - should fail with "OTP has expired"

**Test Rate Limiting:**
- Enter wrong OTP 5 times
- Should fail with "Maximum verification attempts exceeded"

**Test Single Use:**
- Use same OTP twice
- Second attempt should fail with "No valid OTP found"

**Test Resend:**
- Click "Resend OTP" button
- Old OTP should be invalidated
- New OTP should work

---

## 🐛 Troubleshooting

### Issue: "Admin account not found"
**Solution:** Ensure admin user exists in database with correct email and role='admin'

### Issue: "Can't reach database server"
**Solution:** Check your DATABASE_URL and DIRECT_URL in .env

### Issue: OTP not received (production)
**Solution:** 
- Verify RESEND_API_KEY is set
- Check email spam folder
- Verify "from" email is from verified domain in Resend

### Issue: "Invalid OTP code"
**Solution:**
- Ensure you're entering the latest OTP
- Check OTP hasn't expired (5 minutes)
- Check you haven't exceeded 5 attempts

### Issue: Database migration fails
**Solution:** Run the SQL manually in Supabase dashboard (see Step 2, Option B)

---

## 📊 API Endpoints

### POST `/api/admin/login`

**Request:**
```json
{
  "email": "divyajeetsahu24@gmail.com",
  "password": "123456890"
}
```

**Response (Success):**
```json
{
  "success": true,
  "requiresOTP": true,
  "message": "OTP has been sent to your email",
  "email": "divyajeetsahu24@gmail.com"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid admin credentials"
}
```

---

### POST `/api/admin/verify-otp`

**Request:**
```json
{
  "email": "divyajeetsahu24@gmail.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Admin User",
      "email": "divyajeetsahu24@gmail.com",
      "role": "admin",
      "institutionId": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid OTP code. 4 attempt(s) remaining."
}
```

---

## 🔄 Maintenance

### Cleanup Expired OTPs

To prevent database bloat, run periodic cleanup:

```typescript
import { adminOTPService } from '@/services/admin-otp.service';

// Run via cron job or scheduled task
await adminOTPService.cleanupExpiredOTPs();
```

**Vercel Cron Job (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/admin/cleanup-otp",
    "schedule": "0 */6 * * *"
  }]
}
```

---

## ✨ Features

- ✅ Separate admin login (doesn't affect user login)
- ✅ 2-factor authentication via email OTP
- ✅ Beautiful, responsive UI matching existing design
- ✅ Auto-focus and paste support for OTP
- ✅ Real-time validation and error handling
- ✅ Loading states and success messages
- ✅ Resend OTP functionality
- ✅ Back navigation between steps
- ✅ Console logging for development
- ✅ Production-ready email integration
- ✅ Serverless-compatible (database storage)
- ✅ Full TypeScript support

---

## 🎉 Done!

Your admin authentication system with OTP verification is now ready to use!

**Quick Test:**
```bash
pnpm dev
# Visit: http://localhost:3000/login-admin
# Login: divyajeetsahu24@gmail.com / 123456890
# Check console for OTP
```

For questions or issues, refer to the troubleshooting section above.
