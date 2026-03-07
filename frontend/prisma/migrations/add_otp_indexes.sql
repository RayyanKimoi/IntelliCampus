-- Migration: Add indexes to AdminOTP for performance
-- Run this after deploying the code changes

-- Add index on createdAt for rate limit queries
CREATE INDEX IF NOT EXISTS "AdminOTP_createdAt_idx" ON "admin_otp"("created_at");

-- Add compound index for efficient OTP lookup
CREATE INDEX IF NOT EXISTS "AdminOTP_email_used_expiresAt_idx" ON "admin_otp"("email", "used", "expires_at");
