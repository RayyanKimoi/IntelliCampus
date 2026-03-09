# Supabase Storage Setup Guide

This guide walks through setting up the required Supabase Storage buckets for the IntelliCampus assignment lifecycle.

---

## Required Buckets

### 1. **`guidelines`** Bucket
- **Purpose**: Store teacher assignment documents (PDFs, DOCX, PPT)
- **Used by**: Teacher assignment creation flow
- **File size limit**: 10MB
- **Access**: Public
- **API endpoint**: `/api/upload`

### 2. **`submissions`** Bucket
- **Purpose**: Store student submission files
- **Used by**: Student assignment submissions
- **File size limit**: 50MB
- **Access**: Public
- **API endpoint**: `/api/student/upload`

---

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Navigate to Storage**
   - Go to your Supabase project dashboard: https://supabase.com/dashboard
   - Select your project: `kzjjyrqicmhyohgmsxhg`
   - Click on **Storage** in the left sidebar

2. **Create `guidelines` Bucket**
   - Click **"New bucket"**
   - Bucket name: `guidelines`
   - Toggle **"Public bucket"** to ON
   - File size limit: `10485760` (10MB in bytes)
   - Allowed MIME types (optional): 
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     application/vnd.ms-powerpoint
     application/vnd.openxmlformats-officedocument.presentationml.presentation
     ```
   - Click **"Create bucket"**

3. **Create `submissions` Bucket**
   - Click **"New bucket"**
   - Bucket name: `submissions`
   - Toggle **"Public bucket"** to ON
   - File size limit: `52428800` (50MB in bytes)
   - Leave MIME types blank (allow all file types)
   - Click **"Create bucket"**

4. **Verify Buckets**
   - You should see both `guidelines` and `submissions` in the storage list
   - Both should have "Public" badge

---

### Option 2: Using SQL Editor

If you prefer programmatic setup:

1. **Navigate to SQL Editor**
   - Go to **SQL Editor** in Supabase dashboard
   - Click **"New query"**

2. **Run This SQL**

```sql
-- Create guidelines bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guidelines',
  'guidelines',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
);

-- Create submissions bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'submissions',
  'submissions',
  true,
  52428800
);
```

3. **Verify Creation**
   - Go to **Storage** → You should see both buckets

---

### Option 3: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kzjjyrqicmhyohgmsxhg

# Create migration file
supabase migration new create_storage_buckets

# Add SQL to the migration file:
# supabase/migrations/<timestamp>_create_storage_buckets.sql
```

Then add the SQL from Option 2 to the migration file and run:

```bash
supabase db push
```

---

## RLS Policies (Optional but Recommended)

For production, you may want to add Row Level Security policies:

### `guidelines` Bucket Policies

```sql
-- Allow teachers to upload
CREATE POLICY "Teachers can upload guidelines"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'guidelines' AND
  auth.jwt() ->> 'role' = 'TEACHER'
);

-- Allow teachers to delete their own files
CREATE POLICY "Teachers can delete own guidelines"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'guidelines' AND
  auth.jwt() ->> 'role' = 'TEACHER'
);

-- Allow everyone to read
CREATE POLICY "Anyone can read guidelines"
ON storage.objects FOR SELECT
USING (bucket_id = 'guidelines');
```

### `submissions` Bucket Policies

```sql
-- Allow students to upload
CREATE POLICY "Students can upload submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'submissions' AND
  auth.jwt() ->> 'role' = 'STUDENT' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow students to view their own submissions
CREATE POLICY "Students can view own submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow teachers to view all submissions
CREATE POLICY "Teachers can view all submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submissions' AND
  auth.jwt() ->> 'role' = 'TEACHER'
);
```

**Note**: Since we're using `SUPABASE_SERVICE_ROLE_KEY` in the backend API, these RLS policies are bypassed. They're useful if you switch to client-side uploads in the future.

---

## Testing the Setup

### Test Upload Endpoint

```bash
# Test teacher upload (guidelines)
curl -X POST http://localhost:3002/api/upload \
  -H "Authorization: Bearer YOUR_TEACHER_JWT" \
  -F "file=@test-document.pdf"

# Test student upload (submissions)
curl -X POST http://localhost:3002/api/student/upload \
  -H "Authorization: Bearer YOUR_STUDENT_JWT" \
  -F "file=@test-submission.pdf"
```

### Verify in Supabase Dashboard

1. Go to **Storage** → **guidelines**
2. You should see uploaded files with public URLs
3. Click on a file → Copy URL → Open in browser to verify access

---

## Troubleshooting

### Error: "Bucket not found"
- ✅ Verify bucket exists: Go to Storage → check for `guidelines` and `submissions`
- ✅ Check bucket name spelling in API code

### Error: "File too large"
- ✅ Check file size limits:
  - `guidelines`: 10MB max
  - `submissions`: 50MB max
- ✅ Adjust limits in Supabase dashboard if needed

### Error: "Invalid MIME type"
- ✅ Only `guidelines` bucket has MIME type restrictions
- ✅ Allowed types: PDF, DOCX, PPTX
- ✅ Remove MIME type restrictions from bucket settings if needed

### Error: "403 Forbidden"
- ✅ Verify buckets are public: Toggle "Public bucket" to ON
- ✅ Check `SUPABASE_SERVICE_ROLE_KEY` in `.env` is correct
- ✅ Ensure API is using `supabaseAdmin` client (not anonymous client)

---

## Environment Variables Checklist

Before testing, ensure your `.env` has:

```env
NEXT_PUBLIC_SUPABASE_URL="https://kzjjyrqicmhyohgmsxhg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."  # Required for uploads
```

---

## File Upload Flow

### Teacher Flow (Guidelines)
1. Teacher creates assignment in Assessment Studio
2. Teacher uploads PDF/DOCX/PPT document
3. Frontend calls `/api/upload` with FormData
4. Backend validates file (size, type)
5. Backend uploads to Supabase Storage `guidelines` bucket
6. Returns public URL
7. URL saved in `Assignment.assignmentDocumentUrl`
8. Students can download from "Instructions" tab

### Student Flow (Submissions)
1. Student opens assignment workspace
2. Student uploads files in "Files" tab
3. Frontend calls `/api/student/upload` with FormData
4. Backend validates file (50MB max)
5. Backend uploads to Supabase Storage `submissions` bucket
6. Returns public URL
7. URL saved in `StudentAttempt.submissionFileUrl` or `answers.files[]`
8. Teachers can download when grading

---

## Production Deployment

When deploying to Vercel:

1. ✅ Add environment variables to Vercel project settings
2. ✅ Ensure Supabase buckets are created in production project
3. ✅ Test file uploads from production URL
4. ✅ Monitor Supabase Storage usage in dashboard
5. ✅ Set up storage cleanup policies if needed (auto-delete old files)

---

## Storage Cleanup (Optional)

If you want to auto-delete old files:

```sql
-- Delete submissions older than 90 days
DELETE FROM storage.objects
WHERE bucket_id = 'submissions'
  AND created_at < NOW() - INTERVAL '90 days';

-- Delete guidelines not linked to any assignment
DELETE FROM storage.objects
WHERE bucket_id = 'guidelines'
  AND name NOT IN (
    SELECT REPLACE(assignment_document_url, 'https://kzjjyrqicmhyohgmsxhg.supabase.co/storage/v1/object/public/guidelines/', '')
    FROM "Assignment"
    WHERE assignment_document_url IS NOT NULL
  );
```

Add this as a Supabase Edge Function or cron job.

---

## Summary

✅ Create two public buckets: `guidelines` (10MB) and `submissions` (50MB)  
✅ Use Supabase Dashboard for quickest setup  
✅ Test uploads with curl or browser  
✅ Monitor storage usage in production  
✅ Optional: Add RLS policies for fine-grained access control  

**Next Step**: Test the full assignment creation → file upload → student download flow!
