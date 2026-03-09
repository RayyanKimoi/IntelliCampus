# IntelliCampus Assignment Lifecycle - Testing Guide

This guide provides step-by-step testing procedures for all new features.

---

## Pre-Testing Checklist

Before starting tests, ensure:

- ✅ Supabase Storage buckets created: `guidelines` and `submissions`
- ✅ Environment variables set in `.env`:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RAPIDAPI_KEY`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Frontend dev server running: `cd frontend && pnpm dev`
- ✅ Browser console open for debugging

---

## Test 1: Teacher Assignment Creation with File Upload

### Steps:
1. **Login as Teacher**
   - Navigate to: `http://localhost:3002/teacher/authentication/signin`
   - Use a teacher account

2. **Navigate to Assessment Studio**
   - Click "Assessment Studio" in sidebar
   - Click "Create Assignment"

3. **Fill Assignment Form**
   - **Title**: "Java OOP Assignment"
   - **Course**: Select any course you teach
   - **Chapter**: Select a chapter
   - **Due Date**: Set to 7 days from now
   - **Max Score**: 100
   - **Instructions**: "Complete the inheritance exercise"

4. **Upload Guidelines Document**
   - Click "Upload Document" button
   - Select a PDF file (< 10MB)
   - **Expected**: Progress indicator shows
   - **Expected**: File name appears after upload

5. **Configure Submission Types**
   - Enable "Code Submission"
   - Enable "Text Submission"

6. **Set Grading Rubric**
   - Add criteria: "Code Quality" (40 points)
   - Add criteria: "Documentation" (30 points)
   - Add criteria: "Functionality" (30 points)
   - **Expected**: Total shows 100 points

7. **Publish Assignment**
   - Click "Create Assignment"
   - **Expected**: Success message
   - **Expected**: Redirect to assignments list

### Verification:
- ✅ Open Supabase Dashboard → Storage → `guidelines`
- ✅ Verify file uploaded with path: `[random-name].[extension]`
- ✅ Copy URL and paste in browser → file should download
- ✅ Check database: `Assignment.assignmentDocumentUrl` should equal Supabase URL

### Expected Console Output:
```
[Assessment Studio] Uploading file: test.pdf
[Upload API] File uploaded successfully: https://kzjjyrqicmhyohgmsxhg.supabase.co/storage/v1/object/public/guidelines/...
```

---

## Test 2: Student Assignment Discovery

### Steps:
1. **Login as Student**
   - Navigate to: `http://localhost:3002/student/authentication/signin`
   - Use a student account enrolled in the course

2. **Navigate to Assignments**
   - Click "Assignments" in sidebar
   - **Expected**: See "Java OOP Assignment" in list

3. **Check Assignment Card**
   - **Expected**: Shows due date
   - **Expected**: Shows course name
   - **Expected**: Shows "Not Started" status badge
   - **Expected**: Shows max score (100 points)

4. **Filter by Course** (if implemented)
   - Select course from dropdown
   - **Expected**: Only assignments from that course appear

### Verification:
- ✅ Assignment appears in student's list
- ✅ Only shows published assignments
- ✅ Only shows assignments for enrolled courses
- ✅ Assignments from other courses don't appear

### Expected API Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Java OOP Assignment",
      "courseId": "...",
      "isPublished": true,
      "status": "pending"
    }
  ]
}
```

---

## Test 3: Student Assignment Workspace (IDE Mode)

### Steps:
1. **Open Assignment Workspace**
   - Click on "Java OOP Assignment"
   - **Expected**: Redirect to workspace page

2. **Test Instructions Tab**
   - Should be active by default
   - **Expected**: See assignment instructions
   - **Expected**: See "View/Download Guidelines" button (if document uploaded)
   - Click download button
   - **Expected**: PDF opens/downloads successfully

3. **Test Code Editor Tab**
   - Click "Code" tab
   - **Expected**: Monaco Editor loads with syntax highlighting
   - Select language: "Java"
   - Write sample code:
     ```java
     public class HelloWorld {
       public static void main(String[] args) {
         System.out.println("Hello, World!");
       }
     }
     ```

4. **Test Compiler Integration**
   - Click "Run & Check" button
   - **Expected**: Loading indicator appears
   - **Expected**: After 2-5 seconds, output appears
   - **Expected Output**: `Hello, World!`

5. **Test Different Languages**
   - **Python Test**:
     ```python
     print("Hello from Python")
     ```
     Expected: `Hello from Python`
   
   - **C++ Test**:
     ```cpp
     #include <iostream>
     using namespace std;
     int main() {
       cout << "Hello from C++" << endl;
       return 0;
     }
     ```
     Expected: `Hello from C++`

6. **Test Lab Report Tab**
   - Click "Lab Report (Docs)" tab
   - **Expected**: Rich text editor loads
   - Write in "Theory" section
   - Write in "Algorithm" section
   - **Expected**: Auto-save trigger after 30 seconds

7. **Test Files Tab**
   - Click "Files" tab
   - Click "Upload File" button
   - Select a file (< 50MB)
   - **Expected**: File uploads to Supabase
   - **Expected**: File appears in list with download button

### Verification:
- ✅ All 4 tabs (Instructions, Code, Lab Report, Files) functional
- ✅ Code execution returns correct output
- ✅ File uploads save to `submissions` bucket
- ✅ Auto-save updates `StudentAttempt.answers` JSON

### Expected Console Output:
```
[Workspace] Running code...
[Compiler API] Submitting to Judge0...
[Compiler API] Polling for result (attempt 1/10)...
[Compiler API] Execution completed: status = Accepted
[Workspace] Output: Hello, World!
```

---

## Test 4: Compiler Error Handling

### Steps:
1. **Test Compilation Error**
   - Write invalid code:
     ```java
     public class Test {
       // missing closing brace
     ```
   - Click "Run & Check"
   - **Expected**: Error message in console panel
   - **Expected**: `stderr` or `compile_output` shows compiler error

2. **Test Runtime Error**
   - Write code with runtime error:
     ```java
     public class Test {
       public static void main(String[] args) {
         int x = 10 / 0; // Division by zero
       }
     }
     ```
   - Click "Run & Check"
   - **Expected**: Runtime exception in output

3. **Test Timeout (if configured)**
   - Write infinite loop:
     ```java
     public class Test {
       public static void main(String[] args) {
         while(true) { }
       }
     }
     ```
   - Click "Run & Check"
   - **Expected**: Time Limit Exceeded error after ~5 seconds

### Verification:
- ✅ Compilation errors shown clearly
- ✅ Runtime errors displayed with stack trace
- ✅ Timeout protection prevents hanging

---

## Test 5: Quiz Visibility

### Steps:
1. **Create Quiz as Teacher**
   - Go to Assessment Studio → Create Assignment
   - Set **Type**: "Quiz" (instead of "Assignment")
   - Add questions in quiz builder
   - Publish quiz

2. **View Quiz as Student**
   - Login as student enrolled in course
   - Navigate to "Quizzes" page
   - **Expected**: Quiz appears in list

3. **Test Subject Filter**
   - Navigate to Subject page
   - Click "Quizzes" tab
   - **Expected**: Only quizzes for that subject appear

4. **Test Enrollment Filter**
   - Login as student NOT enrolled in course
   - Navigate to "Quizzes"
   - **Expected**: Quiz does NOT appear

### Verification:
- ✅ Quizzes visible to enrolled students only
- ✅ Uses Supabase admin client (bypasses RLS)
- ✅ Filter by `is_published = true`
- ✅ Show attempt history if previously attempted

### Expected API Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Java Basics Quiz",
      "type": "quiz",
      "isPublished": true,
      "attempts": [],
      "status": "pending"
    }
  ]
}
```

---

## Test 6: Error Boundary

### Steps:
1. **Test Hydration Error Suppression**
   - Open any page in dev mode
   - Look for "1 Issue" badge in bottom-right
   - **Expected**: No badge appears
   - **Expected**: Console may show hydration warning but app doesn't crash

2. **Test Real Error Handling** (if needed)
   - Manually throw error in component:
     ```tsx
     throw new Error("Test error");
     ```
   - **Expected**: Error boundary catches it
   - **Expected**: Shows friendly error message
   - **Expected**: "Reload Page" button appears
   - Click reload button
   - **Expected**: Page reloads successfully

### Verification:
- ✅ Hydration errors suppressed (no crash)
- ✅ Real errors show error UI
- ✅ Console logs errors in development mode
- ✅ Production mode shows minimal error details

---

## Test 7: File Upload Validation

### Teacher Upload Tests:
1. **Test Size Limit**
   - Try uploading 15MB file
   - **Expected**: Error: "File size exceeds 10MB limit"

2. **Test File Type**
   - Try uploading .txt file
   - **Expected**: Error: "File type not allowed"

3. **Test Valid File**
   - Upload PDF (< 10MB)
   - **Expected**: Success, file appears in Supabase

### Student Upload Tests:
1. **Test Size Limit**
   - Try uploading 60MB file
   - **Expected**: Error: "File size exceeds 50MB limit"

2. **Test Valid File**
   - Upload any file (< 50MB)
   - **Expected**: Success, file appears in Supabase `submissions` bucket

### Verification:
- ✅ Size limits enforced (10MB teacher, 50MB student)
- ✅ MIME type restrictions work for teacher uploads
- ✅ Student uploads accept all file types

---

## Test 8: End-to-End Flow

Complete lifecycle test:

### Phase 1: Teacher Creates Assignment
1. Login as teacher
2. Create assignment with guidelines PDF
3. Set rubric and submission types
4. Publish assignment

### Phase 2: Student Completes Assignment
1. Login as enrolled student
2. See assignment in list
3. Open workspace
4. Download guidelines
5. Write code in editor
6. Run code and verify output
7. Write lab report
8. Upload supporting files
9. Submit assignment

### Phase 3: Teacher Grades
1. Login as teacher
2. View submissions
3. See student's code, report, and files
4. Grade using rubric
5. Provide feedback

### Verification:
- ✅ Full flow works without errors
- ✅ All data persists correctly
- ✅ Files accessible from both teacher and student views
- ✅ Notifications trigger appropriately

---

## Debugging Tips

### Check Environment Variables
```bash
# In frontend directory
node -e "console.log(process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')"
node -e "console.log(process.env.RAPIDAPI_KEY ? 'Set' : 'Missing')"
```

### Check Supabase Connection
```bash
# Test Supabase ping
curl https://kzjjyrqicmhyohgmsxhg.supabase.co/rest/v1/
```

### Check Judge0 API
```bash
# Test RapidAPI
curl -X GET "https://judge0-ce.p.rapidapi.com/about" \
  -H "X-RapidAPI-Key: YOUR_KEY"
```

### Monitor API Calls
- Open browser DevTools → Network tab
- Filter by "Fetch/XHR"
- Check response status and body
- Look for 401 (auth), 403 (forbidden), 500 (server error)

### Check Supabase Storage
- Dashboard → Storage → Buckets
- Click bucket → Browse files
- Verify uploaded files appear
- Test download by clicking file

---

## Common Issues & Solutions

### Issue: "Bucket not found"
**Solution**: Create buckets in Supabase Dashboard (see `SUPABASE_STORAGE_SETUP.md`)

### Issue: Compiler timeout
**Solution**: Check RAPIDAPI_KEY is valid and has quota remaining

### Issue: Quiz not visible
**Solution**: Ensure quiz is published (`is_published = true`) and student is enrolled

### Issue: Hydration warning
**Solution**: ErrorBoundary suppresses this, but check for SSR/client mismatches

### Issue: File upload fails
**Solution**: 
- Check file size limits
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check bucket exists and is public

---

## Performance Benchmarks

Expected response times:

- **File Upload**: 1-3 seconds (depends on file size)
- **Code Compilation**: 2-5 seconds (Java), 1-3 seconds (Python/C++)
- **Quiz Fetch**: < 500ms
- **Assignment List**: < 300ms
- **Workspace Load**: < 1 second

If slower, check:
- Network latency (RapidAPI/Supabase)
- Database query optimization
- File size (larger = slower)

---

## Success Criteria

All tests should pass with:
- ✅ No console errors (except suppressed hydration warnings)
- ✅ No 500 errors in API calls
- ✅ Files appear in Supabase Storage
- ✅ Compiler returns correct output
- ✅ Data persists after page reload
- ✅ Authorization works correctly (students can't access teacher endpoints)

---

## Next Steps After Testing

1. ✅ Fix any bugs discovered during testing
2. ✅ Deploy to staging environment
3. ✅ Test with real users (small group)
4. ✅ Monitor error logs and performance
5. ✅ Deploy to production
6. ✅ Set up monitoring/alerts for file upload failures

---

**Ready to test!** Start with Test 1 and work through sequentially. Report any issues with console logs and network tab screenshots.
