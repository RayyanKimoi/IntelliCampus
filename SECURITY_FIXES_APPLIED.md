# Security Fixes Applied to Admin OTP System

## Overview
Comprehensive security audit conducted and critical vulnerabilities fixed.

---

## Critical Issues Fixed

### 1. **RACE CONDITION: OTP Generation** ✅ FIXED
**Problem:** Multiple concurrent requests could create multiple valid OTPs
- Old code used separate `updateMany` then `create` operations
- Between these operations, another request could pass validation

**Fix Applied:**
```typescript
// Wrapped in Prisma transaction for atomicity
await prisma.$transaction(async (tx) => {
  await tx.adminOTP.updateMany({ /* invalidate old */ });
  await tx.adminOTP.create({ /* create new */ });
});
```
- All operations now atomic
- No race condition window
- Location: `frontend/src/services/admin-otp.service.ts` lines 48-68

---

### 2. **RACE CONDITION: OTP Verification** ✅ FIXED
**Problem:** Same OTP could be verified multiple times (OTP reuse vulnerability)
- Old code: Read OTP → Check validity → Update as used
- Multiple requests could all read before any updates

**Fix Applied:**
```typescript
// Use atomic updateMany with WHERE condition
const markUsedResult = await prisma.adminOTP.updateMany({
  where: {
    id: otpRecord.id,
    used: false, // Only update if still unused
  },
  data: { used: true },
});

// Check if update succeeded
if (markUsedResult.count === 0) {
  // Another request already used this OTP
  return { success: false, message: 'OTP already used' };
}
```
- Only one request can mark OTP as used
- Race condition detection built-in
- Location: `frontend/src/services/admin-otp.service.ts` lines 139-157

---

### 3. **RACE CONDITION: Attempt Counter** ✅ FIXED
**Problem:** Read-then-write pattern allowed bypassing 5-attempt limit
```typescript
// OLD (vulnerable)
attempts: otpRecord.attempts + 1
```

**Fix Applied:**
```typescript
// NEW (atomic)
data: {
  attempts: { increment: 1 }
}

// Plus check if update succeeded
const updateResult = await prisma.adminOTP.updateMany({
  where: { 
    id: otpRecord.id,
    used: false, // Only update if still valid
  },
  data: { attempts: { increment: 1 } },
});
```
- Uses Prisma's atomic increment
- Prevents concurrent increments from being lost
- Location: `frontend/src/services/admin-otp.service.ts` lines 115-131

---

### 4. **SERVERLESS TIMEOUT RISK** ✅ FIXED
**Problem:** Email sending blocked the response, risking timeout
```typescript
// OLD (blocking)
await sendAdminOTP(email, otpCode);
```

**Fix Applied:**
```typescript
// NEW (non-blocking)
sendAdminOTP(email, otpCode).catch((error) => {
  logger.error('Failed to send email:', error.message);
});
```
- Email sent asynchronously (fire-and-forget)
- Response returned immediately after OTP stored in database
- Email failures logged but don't break the flow
- Location: `frontend/src/services/admin-otp.service.ts` lines 70-74

---

### 5. **OTP GENERATION SPAM** ✅ FIXED
**Problem:** No rate limiting on OTP generation - could be used for email spam

**Fix Applied:**
- 60-second cooldown between OTP requests per email
- Checks for recent OTP before generating new one
```typescript
const recentOTP = await prisma.adminOTP.findFirst({
  where: {
    email: normalizedEmail,
    createdAt: { gte: new Date(Date.now() - 60000) }
  }
});
```
- Returns remaining seconds if too soon
- Location: `frontend/src/services/admin-otp.service.ts` lines 22-39

---

### 6. **MISSING RATE LIMITING: Login Endpoint** ✅ FIXED
**Problem:** No protection against brute force attacks on credentials

**Fix Applied:**
- IP-based rate limiting: 5 failed attempts → 15-minute lockout
- Tracks failed login attempts per IP address
```typescript
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
```
- Returns 429 status with remaining time
- Auto-cleanup of old entries
- Location: `frontend/src/app/api/admin/login/route.ts` lines 11-13, 29-46

---

### 7. **MISSING RATE LIMITING: OTP Verification** ✅ FIXED
**Problem:** Could brute force OTPs by trying all 1,000,000 combinations

**Fix Applied:**
- IP-based rate limiting: 10 failed verifications → 10-minute lockout
- Independent from per-OTP 5-attempt limit (defense in depth)
```typescript
const verificationAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_VERIFICATION_ATTEMPTS_PER_IP = 10;
const VERIFICATION_LOCKOUT_MS = 10 * 60 * 1000;
```
- Location: `frontend/src/app/api/admin/verify-otp/route.ts` lines 11-13, 29-46

---

### 8. **HARDCODED CREDENTIALS** ✅ FIXED
**Problem:** Admin credentials hardcoded in source code
```typescript
// OLD (insecure)
const ADMIN_EMAIL = 'divyajeetsahu24@gmail.com';
const ADMIN_PASSWORD = '123456890'; // Plain text!
```

**Fix Applied:**
- Now uses database credentials with bcrypt hashing
```typescript
const adminUser = await prisma.user.findUnique({
  where: { email: normalizedEmail },
  select: { passwordHash: true, /* ... */ }
});

const isValidPassword = await bcrypt.compare(password, adminUser.passwordHash);
```
- Passwords stored hashed in database
- No credentials in source code
- Location: `frontend/src/app/api/admin/login/route.ts` lines 66-77

---

### 9. **PERFORMANCE: Missing Database Indexes** ✅ FIXED
**Problem:** Queries on `createdAt` without index could be slow

**Fix Applied:**
```prisma
model AdminOTP {
  // ... fields ...
  
  @@index([email])
  @@index([expiresAt])
  @@index([createdAt])              // NEW
  @@index([email, used, expiresAt]) // NEW (compound)
}
```
- Added index on `createdAt` for rate limit queries
- Added compound index for OTP lookup queries
- Location: `frontend/prisma/schema.prisma` lines 640-643

---

### 10. **TIMING ATTACK VULNERABILITY** ✅ FIXED
**Problem:** Different error messages could leak if email exists

**Fix Applied:**
```typescript
// Use same error message for all credential failures
if (!adminUser || adminUser.role !== 'admin') {
  return { error: 'Invalid admin credentials' }; // Generic
}

if (!isValidPassword) {
  return { error: 'Invalid admin credentials' }; // Same message
}
```
- All authentication failures return same message
- Prevents email enumeration
- Location: `frontend/src/app/api/admin/login/route.ts` lines 78-95

---

## Security Layers Summary

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| **Database** | Race condition prevention | Atomic operations with updateMany + WHERE |
| **Transaction** | OTP generation atomicity | Prisma $transaction wrapper |
| **Rate Limiting** | Login brute force | 5 attempts/15min per IP |
| **Rate Limiting** | OTP brute force | 10 attempts/10min per IP |
| **Rate Limiting** | OTP spam | 1 OTP per 60 seconds per email |
| **Hashing** | Password security | bcrypt with 10 rounds |
| **Hashing** | OTP security | bcrypt with 10 rounds |
| **Expiry** | Time-based invalidation | 5-minute OTP expiration |
| **Single-use** | Reuse prevention | Atomic used flag with race detection |
| **Attempt limit** | OTP guessing | 5 attempts per OTP |
| **Async email** | Serverless timeout | Fire-and-forget email sending |
| **Indexes** | Query performance | Compound indexes on hot paths |

---

## Testing Recommendations

### 1. Race Condition Testing
```bash
# Test concurrent OTP generation
ab -n 100 -c 10 -T 'application/json' \
  -p login.json \
  https://your-domain/api/admin/login

# Test concurrent OTP verification
ab -n 50 -c 10 -T 'application/json' \
  -p verify.json \
  https://your-domain/api/admin/verify-otp
```

### 2. Rate Limiting Testing
```bash
# Test login rate limit (should block after 5 failures)
for i in {1..10}; do
  curl -X POST https://your-domain/api/admin/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@test.com","password":"wrong"}'
  sleep 1
done
```

### 3. Security Testing
- [ ] Verify OTP cannot be reused
- [ ] Verify expired OTPs are rejected
- [ ] Verify rate limits activate
- [ ] Verify concurrent requests don't create multiple valid OTPs
- [ ] Verify attempt counter works correctly under load
- [ ] Verify email doesn't block the response
- [ ] Test with cold starts (serverless simulation)

---

## Migration Required

⚠️ **ACTION NEEDED:** Database schema changed, migration required:

```bash
cd frontend
pnpm prisma migrate dev --name add_otp_indexes
```

Or apply manually:
```sql
-- Add missing indexes
CREATE INDEX "AdminOTP_createdAt_idx" ON "admin_otp"("created_at");
CREATE INDEX "AdminOTP_email_used_expiresAt_idx" ON "admin_otp"("email", "used", "expires_at");
```

---

## Monitoring Recommendations

Add to your monitoring/logging:

1. **OTP Generation Rate**
   - Alert if >100/hour for single email
   - Could indicate abuse

2. **Failed Login Attempts**
   - Alert if multiple IPs hit rate limit
   - Could indicate distributed attack

3. **OTP Verification Failures**
   - Track per-OTP attempt exhaustion
   - High rate indicates brute force

4. **Race Condition Detections**
   - Log `updateResult.count === 0` occurrences
   - Should be rare; spike indicates issue

5. **Email Send Failures**
   - Monitor async email errors
   - Critical for user experience

---

## Environment Variables Required

Ensure these are set:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

---

## Files Modified

1. ✅ `frontend/prisma/schema.prisma` - Added indexes
2. ✅ `frontend/src/services/admin-otp.service.ts` - Fixed all race conditions
3. ✅ `frontend/src/app/api/admin/login/route.ts` - Added rate limiting, fixed credentials
4. ✅ `frontend/src/app/api/admin/verify-otp/route.ts` - Added rate limiting

---

## Production Checklist

Before deploying:

- [ ] Run `pnpm prisma migrate deploy` in production
- [ ] Verify `RESEND_API_KEY` is set
- [ ] Verify admin user exists with hashed password
- [ ] Test OTP flow end-to-end
- [ ] Verify rate limits work
- [ ] Set up monitoring/alerts
- [ ] Review logs for any errors
- [ ] Test with load testing tools
- [ ] Verify serverless cold starts work

---

## Additional Security Recommendations

### Future Enhancements:
1. **CAPTCHA Integration**
   - Add after 3 failed login attempts
   - Prevents automated attacks

2. **2FA Backup Codes**
   - Generate recovery codes
   - In case email is inaccessible

3. **IP Geolocation**
   - Detect suspicious login locations
   - Alert on unusual countries

4. **Session Management**
   - Track active admin sessions
   - Allow remote logout

5. **Audit Logging**
   - Log all admin login attempts
   - Store IP, user agent, timestamp
   - Compliance requirement

6. **Email Verification**
   - Verify email ownership on creation
   - Prevent typosquatting

---

## Support

For issues or questions:
- Check logs in Vercel dashboard
- Review Prisma query logs
- Test locally with `npm run dev`
- Contact: divyajeetsahu24@gmail.com

---

**Generated:** 2024
**Last Updated:** After security audit and fixes
**Status:** ✅ Production Ready (after migration)
