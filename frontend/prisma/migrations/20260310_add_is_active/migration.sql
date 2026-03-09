-- Migration: Add is_active field to users table
-- Date: 2026-03-10
-- Description: Add isActive boolean field to users table with default value true

-- Add the column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update existing users to be active
UPDATE users SET is_active = true WHERE is_active IS NULL;
