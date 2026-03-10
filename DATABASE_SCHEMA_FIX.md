# Database Schema Fix - March 10, 2026

## Issues Fixed

### 1. 404 Error on Chapter Creation
**Error:** `POST /api/teacher/curriculum/chapters` returned 404

**Root Cause:** The service was calling the wrong endpoint. The correct route requires a courseId parameter.

**Fix Applied:** Updated `chapterCurriculumService.ts` to call `/teacher/curriculum/courses/${courseId}/chapters`

### 2. Prisma Schema Inconsistency - submissionTypes Field
**Error:** `Inconsistent column data: List field did not return an Array from database`

**Root Cause:** 
- Database column: `submission_types JSONB`
- Prisma schema (old): `submissionTypes String[]`
- **Mismatch**: PostgreSQL `String[]` expects `TEXT[]`, but column was `JSONB`

**Fix Applied:** Changed Prisma schema from `String[]` to `Json?` to match the JSONB column type

### 3. Course.findMany() and Assignment.findMany() Errors
**Root Cause:** Same schema inconsistency as issue #2 affecting related queries

**Fix Applied:** Same schema update resolves all related errors

## Files Modified

1. **frontend/prisma/schema.prisma**
   - Changed `submissionTypes String[]` to `submissionTypes Json?`

2. **frontend/src/services/chapterCurriculumService.ts**
   - Fixed createChapter endpoint to use correct nested route

3. **frontend/prisma/migrations/20260310_fix_submission_types/migration.sql**
   - Documentation migration (no SQL changes needed as column is already correct)

## Steps to Apply (IMPORTANT - Do This Now)

### Step 1: Stop All Running Servers
Close any running Next.js dev servers or terminal processes

### Step 2: Regenerate Prisma Client
```powershell
cd frontend
pnpm prisma generate
```

### Step 3: Restart Development Server
```powershell
pnpm dev
```

## Verification

After restarting, the following should work without errors:

1. ✅ Creating chapters in curriculum management
2. ✅ Loading teacher dashboard
3. ✅ Loading assessment studio
4. ✅ Any queries involving assignments or courses

## Technical Details

### Why `Json?` Instead of `String[]`?

PostgreSQL has two ways to store arrays:
- **Native arrays**: `TEXT[]`, `VARCHAR[]` - used with Prisma's `String[]`
- **JSONB**: JSON format - used with Prisma's `Json` or `Json?`

The migration created `submission_types` as `JSONB`, so we must use `Json?` in Prisma schema.

### TypeScript Compatibility

The application code already handles `submissionTypes` correctly:
- Type assertions: `(assignment.submissionTypes as string[])`
- Parsing helpers: `parseSubmissionTypes()` function
- Safe array operations with null checks

No frontend code changes were needed.

## If Issues Persist

1. **Check Prisma client was regenerated:**
   ```powershell
   cd frontend
   Get-ChildItem node_modules\.prisma\client\index.d.ts | Select-Object LastWriteTime
   ```
   LastWriteTime should be recent (after running generate)

2. **Clear Prisma cache:**
   ```powershell
   cd frontend
   pnpm prisma generate --no-engine
   ```

3. **Verify database schema:**
   Connect to your database and run:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'assignments' 
   AND column_name = 'submission_types';
   ```
   Should show: `jsonb`

## Contact

If errors continue after following these steps, check:
- Prisma client version matches schema
- No other terminal processes holding file locks
- Database connection is working properly
