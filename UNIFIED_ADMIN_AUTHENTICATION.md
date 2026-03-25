# Unified Admin Authentication System

## Overview

The IntelliCampus admin authentication system has been **unified** to ensure both admin login routes provide **identical access and visibility** to administrative features and data.

## ✅ What Was Fixed

### Problem

Previously, there were two separate admin login flows:

1. **Default Login** (`/auth/login`):
   - Used database users with bcrypt password hashing
   - Created JWT with real user IDs and institutionIds from database

2. **Admin OTP Login** (`/login-admin`):
   - Used hardcoded environment variables
   - Created JWT with fake IDs (`userId: 'admin'`, `institutionId: 'admin'`)
   - Admin couldn't see data because hardcoded IDs didn't exist in database

### Solution

Both login flows now:
- ✅ Use **real database admin users**
- ✅ Create **identical JWT tokens** with real user IDs
- ✅ Provide **identical access** to admin features
- ✅ Use **role-based authorization** (`role = 'admin'`)
- ✅ Filter data by **real institutionId** from database

---

## 🔐 How It Works Now

### Both Login Routes

#### `/auth/login` (Default Login)
```
1. User enters email & password
2. System checks demo accounts first
3. If not demo, queries database for user
4. Verifies password with bcrypt
5. Creates JWT with real user data from database
6. Redirects based on role → /admin for admins
```

#### `/login-admin` (Admin OTP Login)
```
1. User enters email & password
2. System checks env variables (ADMIN_EMAIL, ADMIN_PASSWORD)
3. If matched OR database admin found with bcrypt check
4. Queries database for admin user data
5. Sends OTP to email
6. User enters OTP
7. Verifies OTP
8. Creates JWT with REAL user data from database
9. Redirects to /admin
```

### Key Changes Made

#### 1. `/api/admin/login` Route
**Before:**
```typescript
// Only checked env variables
if (email !== adminEmail || password !== adminPassword) {
  return error
}
```

**After:**
```typescript
// Checks env variables AND database admins
// 1. Check env credentials
// 2. Lookup user in database
// 3. Verify user.role === 'admin'
// 4. Also support database admins with bcrypt passwords
```

#### 2. `/api/admin/verify-otp` Route
**Before:**
```typescript
const token = signToken({
  userId: 'admin',  // ❌ Hardcoded fake ID
  email: env.ADMIN_EMAIL,
  role: UserRole.ADMIN,
  institutionId: 'admin',  // ❌ Hardcoded fake ID
});
```

**After:**
```typescript
// Lookup admin in database
const adminUser = await prisma.user.findUnique({
  where: { email: normalizedEmail }
});

const token = signToken({
  userId: adminUser.id,  // ✅ Real database ID
  email: adminUser.email,
  role: UserRole.ADMIN,
  institutionId: adminUser.institutionId,  // ✅ Real institution ID
});
```

---

## 🎯 Session Structure

Both login flows now produce identical session objects:

```typescript
{
  user: {
    id: string,              // Real database user ID
    name: string,            // User's name
    email: string,           // User's email
    role: "admin",           // User role from database
    institutionId: string    // Real institution ID
  },
  token: string              // JWT containing above data
}
```

---

## 🔒 Authorization Flow

### API Routes

All admin API routes use **role-based checks**:

```typescript
// In /api/admin/* routes
const user = getAuthUser(req);  // Extracts user from JWT
requireRole(user, [UserRole.ADMIN]);  // Verifies role === 'admin'

// Filter data by institutionId
const users = await prisma.user.findMany({
  where: { institutionId: user.institutionId }  // Uses real ID
});
```

### Frontend Guards

The `AppShell` component protects admin pages:

```typescript
// Checks if user is authenticated
if (!isAuthenticated) {
  router.push('/auth/login');
}

// Checks if user has correct role
if (user.role !== requiredRole) {
  router.push(`/${user.role}`);
}
```

---

## 📊 Database Schema

### User Model
```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          UserRole  // student | teacher | admin
  institutionId String
  // ... other fields
}

enum UserRole {
  student
  teacher
  admin
}
```

---

## 🚀 Setup Instructions

### 1. Verify Environment Variables

Check `frontend/.env`:
```env
ADMIN_EMAIL=divyajeetsahu24@gmail.com
ADMIN_PASSWORD=123456890
```

### 2. Create/Verify Admin User

Run the verification script:
```bash
cd frontend
npx tsx scripts/verify-admin.ts
```

If admin doesn't exist, create it:
```bash
cd frontend
npx tsx scripts/create-admin.ts
```

### 3. Test Both Login Routes

**Test 1: Default Login** → Visit `http://localhost:3000/auth/login`
- Email: `divyajeetsahu24@gmail.com`
- Password: `123456890`
- Should redirect to `/admin` dashboard

**Test 2: Admin OTP Login** → Visit `http://localhost:3000/login-admin`
- Email: `divyajeetsahu24@gmail.com`
- Password: `123456890`
- Enter OTP from email
- Should redirect to `/admin` dashboard

**Expected Result:** Both logins show identical admin dashboard with full data access.

---

## ✅ What Admins Can Access

Regardless of login route, admins have access to:

- ✅ **Admin Dashboard** → `/admin`
- ✅ **User Management** → `/admin/users`
- ✅ **AI Policy Control** → `/admin/ai-policy`
- ✅ **Knowledge Base** → `/admin/knowledge-base`
- ✅ **Assessment Governance** → `/admin/assessment-governance`
- ✅ **Institutional Analytics** → `/admin/analytics`
- ✅ **Integrity & Security** → `/admin/integrity`
- ✅ **Accessibility Oversight** → `/admin/accessibility`
- ✅ **Reports & Accreditation** → `/admin/reports`

All admin routes:
1. Check `user.role === 'admin'`
2. Filter data by `user.institutionId`
3. Return data for the admin's institution

---

## 🔍 Verification Checklist

Run this checklist to verify unified admin access:

### Login Tests

- [ ] Log in via `/auth/login` as admin
  - [ ] Redirects to `/admin`
  - [ ] Dashboard shows user count
  - [ ] Can access `/admin/users`
  - [ ] Can see users in the system

- [ ] Log in via `/login-admin` as admin
  - [ ] Receives OTP email
  - [ ] OTP verification succeeds
  - [ ] Redirects to `/admin`
  - [ ] Dashboard shows SAME user count
  - [ ] Can access `/admin/users`
  - [ ] Can see SAME users in the system

### API Tests

- [ ] `/api/admin/dashboard/stats` returns data
- [ ] `/api/admin/users` returns users
- [ ] `/api/admin/ai-policy` returns policy
- [ ] All admin endpoints work with both login methods

### Authorization Tests

- [ ] Student trying to access `/admin` gets redirected
- [ ] Teacher trying to access `/admin` gets redirected
- [ ] Only `role = 'admin'` users can access admin routes

---

## 🐛 Troubleshooting

### Admin can't see data after OTP login

**Check:**
1. Admin user exists in database: `npx tsx scripts/verify-admin.ts`
2. Admin has `role = 'admin'` in database
3. Admin has a valid `institutionId`
4. JWT token contains real user ID (check browser localStorage)

### "Invalid admin credentials" error

**Check:**
1. Environment variables match database:
   - `ADMIN_EMAIL` matches user email in database
   - `ADMIN_PASSWORD` matches (for env-based login)
2. Database admin password is hashed with bcrypt
3. Run `npx tsx scripts/create-admin.ts` to reset password

### Different data in each login

**This should NOT happen anymore!** If it does:
1. Check JWT tokens in localStorage (both should have same structure)
2. Verify both have real `institutionId` (not `'admin'`)
3. Check browser console for errors
4. Verify changes in `/api/admin/verify-otp/route.ts` applied correctly

---

## 📝 Important Notes

### ⚠️ Breaking Changes

This update changes the admin OTP login JWT structure. After deploying:

1. **Existing admin OTP sessions will be invalid**
   - Users need to log in again
   - Old tokens with `userId: 'admin'` won't work

2. **Admin must exist in database**
   - Run `create-admin.ts` script before deployment
   - Env-based login now requires database user

### 🔐 Security

- Both login methods are equally secure
- OTP login adds 2FA for sensitive admin access
- Passwords stored with bcrypt (12 rounds)
- JWT tokens expire after 7 days

### 🏢 Multi-Tenant Support

The system supports multiple institutions:
- Admins see data for their `institutionId`
- Each admin can only manage their institution's users
- System-wide admins can be created by setting appropriate `institutionId`

---

## 📁 Files Modified

1. `frontend/src/app/api/admin/login/route.ts` - Added database lookup
2. `frontend/src/app/api/admin/verify-otp/route.ts` - Use real user data
3. `frontend/scripts/create-admin.ts` - Use env variables
4. `frontend/scripts/verify-admin.ts` - New verification script

---

## 🎉 Result

✅ **Both admin login flows are now unified!**

Admins have:
- Identical access to all admin features
- Same dashboard and analytics
- Same user management capabilities
- Role-based authorization only
- No differentiation between login sources

---

## 📞 Support

If you encounter issues:
1. Run `npx tsx scripts/verify-admin.ts`
2. Check browser console for JWT token structure
3. Verify database has admin user with correct role
4. Check environment variables are set correctly
