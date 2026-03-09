# Troubleshooting Guide - API Call Stack Errors

## Issue Summary

You're experiencing console errors from `apiClient.ts` that show empty error objects `{}`. These errors occur when making API calls to:
- `/api/teacher/curriculum/courses`
- `/api/student/accessibility`
- Teacher dashboard endpoints

## Root Cause

The errors are likely caused by one or more of these issues:

1. **Prisma Client Not Generated**: The Prisma client may not be synced with your schema
2. **Database Connection Issues**: The DATABASE_URL might not be connecting properly
3. **Missing Database Records**: Required tables or data don't exist

## Fix Steps

### Step 1: Regenerate Prisma Client

```bash
cd frontend
pnpm prisma generate
```

This ensures your Prisma client matches your schema.

### Step 2: Check Database Connection

Run this command to test your database connection:

```bash
cd frontend
pnpm prisma db push
```

If you see errors about missing tables, you need to run migrations.

### Step 3: Run Database Migrations

```bash
cd frontend
pnpm prisma migrate dev
```

This creates all required tables in your database.

### Step 4: Verify API Routes Work

**Option 1: Use the Test Page**

Open in your browser: `http://localhost:3003/test-uploads.html`

Click the API test buttons to verify endpoints work.

**Option 2: Use curl**

```bash
# Test teacher courses endpoint
curl -X GET "http://localhost:3003/api/teacher/curriculum/courses" \
  -H "Authorization: Bearer dev-token-mock-authentication"

# Test accessibility endpoint
curl -X GET "http://localhost:3003/api/student/accessibility" \
  -H "Authorization: Bearer dev-token-mock-authentication"

# Test quizzes endpoint
curl -X GET "http://localhost:3003/api/student/quizzes" \
  -H "Authorization: Bearer dev-token-mock-authentication"
```

### Step 5: Verify Supabase Storage Buckets

Run the verification script:

```bash
cd frontend
node verify-buckets.mjs
```

If buckets are missing, create them in Supabase Dashboard or run SQL:

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES 
  ('guidelines', 'guidelines', true, 10485760),
  ('submissions', 'submissions', true, 52428800);
```

## What Was Fixed

### 1. Improved Error Logging

**File: `src/services/apiClient.ts`**

Changed the error logging to show detailed information:

```typescript
// Before (showed empty object)
console.error('[API] Request failed:', {
  status: response.status,
  url: response.url,
  error: data?.error,
  data
});

// After (shows full details)
const errorDetails = {
  status: response.status,
  statusText: response.statusText,
  url: response.url,
  endpoint: endpoint,
  method: options.method || 'GET',
  errorMessage: data?.error || data?.message,
  responseData: data
};

console.error('[API] Request failed:', JSON.stringify(errorDetails, null, 2));
```

Now you'll see the actual error messages instead of `{}`.

### 2. Created Test Utilities

**Files Created:**
- `frontend/public/test-uploads.html` - Interactive test page for all endpoints
- `frontend/verify-buckets.mjs` - Script to verify Supabase Storage setup

## Common Error Messages & Solutions

### Error: "PrismaClientInitializationError"

```bash
cd frontend
pnpm prisma generate
pnpm prisma db push
```

### Error: "Table 'TeacherCourseAssignment' does not exist"

```bash
cd frontend
pnpm prisma migrate dev --name init
```

### Error: "Bucket not found"

Create buckets in Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/kzjjyrqicmhyohgmsxhg/storage
2. Click "New bucket"
3. Create `guidelines` (10MB, Public)
4. Create `submissions` (50MB, Public)

### Error: "Authentication required"

The dev token should work automatically. If not, check that:
- `isDevelopment = true` in `apiClient.ts` (line 18)
- Dev server is running
- Browser isn't blocking localStorage

### Error: "File size exceeds limit"

- Teacher uploads: 10MB max
- Student uploads: 50MB max

Check your file size and compress if needed.

## Verification Checklist

✅ **Database**
- [ ] Prisma client generated (`pnpm prisma generate`)
- [ ] Migrations applied (`pnpm prisma migrate dev`)
- [ ] Can connect to database (check DATABASE_URL in .env)

✅ **Supabase Storage**
- [ ] `guidelines` bucket exists and is public
- [ ] `submissions` bucket exists and is public
- [ ] SUPABASE_SERVICE_ROLE_KEY in .env is correct

✅ **API Endpoints**
- [ ] `/api/upload` works (test with test-uploads.html)
- [ ] `/api/student/upload` works
- [ ] `/api/compiler` works (test with code editor)
- [ ] `/api/student/quizzes` works

✅ **Dev Server**
- [ ] Running on port 3003 (or 3000/3002)
- [ ] No compilation errors in terminal
- [ ] .env file loaded correctly

## Testing File Uploads

### Quick Test (Browser)

1. Open: `http://localhost:3003/test-uploads.html`
2. Click "Upload as Teacher" with a PDF file
3. Check if you see success message with Supabase URL
4. Verify file appears in Supabase Dashboard → Storage → guidelines

### Full Integration Test

1. **Login as Teacher**
   - Go to: `http://localhost:3003/teacher/authentication/signin`
   - Use dev credentials (or create account)

2. **Create Assignment**
   - Navigate to Assessment Studio
   - Click "Create Assignment"
   - Fill form and upload a PDF
   - Click "Create Assignment"

3. **Verify in Database**
   - Check Supabase Dashboard → Table Editor → Assignment
   - Look for `assignmentDocumentUrl` field with Supabase URL

4. **Login as Student**
   - Go to: `http://localhost:3003/student/authentication/signin`
   - Use student account enrolled in the course

5. **View Assignment**
   - Navigate to Assignments
   - Open the assignment
   - Click "Instructions" tab
   - You should see "Download Guidelines" button

## Getting More Help

If errors persist:

1. **Check browser console**: Press F12 → Console tab
2. **Check terminal output**: Look for Prisma/Next.js errors
3. **Check Supabase logs**: Dashboard → Logs → Edge Logs
4. **Run verification script**: `node verify-buckets.mjs`

Share the full error output (not just `{}`) for better diagnosis.

## Related Documentation

- [ASSIGNMENT_LIFECYCLE_COMPLETE.md](../ASSIGNMENT_LIFECYCLE_COMPLETE.md) - Implementation summary
- [SUPABASE_STORAGE_SETUP.md](../SUPABASE_STORAGE_SETUP.md) - Storage setup guide
- [TESTING_GUIDE.md](../TESTING_GUIDE.md) - Comprehensive testing procedures
