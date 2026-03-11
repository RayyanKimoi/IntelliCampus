# Performance & PDF Fix - Complete Guide

## Issues Fixed

### 1. ✅ Slow My Courses Page Loading
**Problem**: The page was waiting for all mastery data to load before showing courses, causing long load times.

**Solution**: 
- Made mastery fetching **non-blocking** with 3-second timeout
- Courses now display immediately while mastery loads in background
- Failed mastery requests no longer block the UI (shows 0% mastery as fallback)
- Added error handling to prevent page crashes

### 2. ✅ PDF 404 Errors  
**Problem**: Files were being saved to local `/public/uploads/` directory, which:
- Doesn't work in production (Vercel/cloud deployments)
- Files are ephemeral and get deleted
- Local paths don't persist across deployments

**Solution**:
- Switched to **Supabase Storage** for persistent file hosting
- Files now upload to `course-materials` bucket with proper URLs
- Public URLs work in both development and production
- Added proper error handling for upload failures

### 3. ✅ Backend Performance
- Added try-catch error handling to mastery service
- Prevents database errors from blocking entire API

---

## Setup Steps (Required)

### Step 1: Create Supabase Storage Buckets

Run the bucket setup script:

\`\`\`powershell
cd frontend
node scripts/setup-supabase-buckets.mjs
\`\`\`

This will create three buckets:
- **course-materials** (public) - For PDFs and learning materials
- **assignments** (private) - For student submissions  
- **profile-pictures** (public) - For user avatars

### Step 2: Migrate Existing Files (Optional)

If you have existing files in `/public/uploads/`, migrate them:

\`\`\`powershell
node scripts/migrate-files-to-supabase.mjs
\`\`\`

This script:
- Uploads all files from `public/uploads/` to Supabase
- Updates database records with new Supabase URLs
- Shows progress and summary

### Step 3: Apply Database Performance Index

Run this SQL in your Supabase SQL Editor:

\`\`\`sql
-- Open: frontend/migrations/add_mastery_indexes.sql
-- Copy and run in Supabase Dashboard > SQL Editor
\`\`\`

Or use the file directly:

\`\`\`powershell
# View the SQL file
Get-Content frontend/migrations/add_mastery_indexes.sql
\`\`\`

### Step 4: Configure Supabase Storage Policies

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** > **Policies**
4. Add these policies:

**For course-materials bucket:**
\`\`\`sql
-- Allow authenticated users to upload
CREATE POLICY "Teachers can upload course materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-materials');

-- Allow everyone to read (public bucket)
CREATE POLICY "Anyone can view course materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-materials');
\`\`\`

**For assignments bucket:**
\`\`\`sql
-- Students can upload their submissions
CREATE POLICY "Students can upload assignments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can only read their own files
CREATE POLICY "Users can read own assignments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);
\`\`\`

---

## Verification

### Test 1: Check Page Load Speed

1. Clear browser cache (Ctrl+Shift+Del)
2. Navigate to `/student/courses`
3. Page should load **immediately** with courses visible
4. Mastery percentages will populate within 1-3 seconds

### Test 2: Upload and View PDFs

1. As a teacher, go to **Curriculum** section
2. Select a course and chapter
3. Upload a PDF file
4. Click on the uploaded PDF - should open in new tab without 404

### Test 3: Check Supabase Storage

1. Go to Supabase Dashboard > Storage
2. Open `course-materials` bucket
3. You should see your uploaded files organized by institution

---

## Environment Variables Check

Verify your `.env` file has:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL="https://kzjjyrqicmhyohgmsxhg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI..."  # ✅ Added/verified
\`\`\`

---

## Changes Made to Code

### Files Modified:

1. **frontend/src/app/student/courses/page.tsx**
   - Non-blocking mastery fetch with 3s timeout
   - Courses display immediately
   - Graceful fallback on errors

2. **frontend/src/app/api/upload/file/route.ts**
   - Changed from local filesystem to Supabase Storage
   - Proper error messages for upload failures
   - Organized file paths by institution

3. **frontend/src/lib/supabase-storage.ts**
   - Better error messages showing which env vars are missing
   - More descriptive error handling

4. **frontend/.env**
   - Confirmed SUPABASE_SERVICE_ROLE_KEY is present

5. **backend/src/services/mastery.service.ts**
   - Added try-catch to prevent DB errors from breaking API
   - Returns empty array on failure

### Files Created:

1. **frontend/scripts/setup-supabase-buckets.mjs**
   - Automated bucket creation script
   
2. **frontend/scripts/migrate-files-to-supabase.mjs**
   - Migrates existing local files to Supabase
   
3. **frontend/migrations/add_mastery_indexes.sql**
   - Database performance indexes

---

## Production Deployment Notes

When deploying to Vercel/production:

1. Add all environment variables to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRITICAL**

2. Buckets and policies must be configured in Supabase before first upload

3. All file uploads will automatically go to Supabase Storage

---

## Troubleshooting

### Issue: "Supabase Admin client not initialized"
**Fix**: Check that `SUPABASE_SERVICE_ROLE_KEY` is in your `.env` file and restart dev server

### Issue: "Bucket does not exist"
**Fix**: Run `node scripts/setup-supabase-buckets.mjs`

### Issue: Still seeing 404 on old PDF links
**Fix**: Run the migration script to update old URLs in database

### Issue: Page still slow
**Fix**: 
1. Apply the mastery performance indexes
2. Clear browser cache
3. Check Network tab in DevTools for slow requests

---

## Summary

✅ **My Courses page now loads instantly** (mastery fetches in background)  
✅ **PDFs work in production** (using Supabase Storage)  
✅ **No layout changes** - everything looks the same  
✅ **Better error handling** - no more crashes on slow connections  
✅ **Production-ready** - works on Vercel and other cloud platforms

Run the setup scripts above to complete the configuration!
