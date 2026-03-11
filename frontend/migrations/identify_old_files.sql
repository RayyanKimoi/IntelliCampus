-- Update all local file URLs to indicate they need re-upload
-- This will help identify which files need to be migrated

-- Show count of files using old local storage
SELECT COUNT(*) as old_files_count 
FROM "ChapterContent" 
WHERE "fileUrl" LIKE '/uploads/%';

-- Optional: Update old files to add a note in description
UPDATE "ChapterContent"
SET "description" = CASE 
  WHEN "description" IS NULL OR "description" = '' 
  THEN '⚠️ File needs re-upload to new storage'
  ELSE "description" || ' ⚠️ File needs re-upload'
END
WHERE "fileUrl" LIKE '/uploads/%'
  AND "fileUrl" NOT LIKE '%supabase.co%';

-- Show all affected files
SELECT 
  "id",
  "title",
  "fileUrl",
  "description",
  "createdAt"
FROM "ChapterContent"
WHERE "fileUrl" LIKE '/uploads/%'
ORDER BY "createdAt" DESC;
