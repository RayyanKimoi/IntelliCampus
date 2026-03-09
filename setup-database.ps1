# IntelliCampus Database Setup Script
# Run this to create tables and seed demo data

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "IntelliCampus Database Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Change to frontend directory
Set-Location "C:\Users\chabi\Desktop\Jeet\Projects\IntelliCampus\frontend"

# Step 1: Run Prisma migrations
Write-Host "[1/3] Running Prisma migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Try running manually: cd frontend && npx prisma migrate deploy" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "[2/3] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prisma Client generated!" -ForegroundColor Green
Write-Host ""

# Step 3: Instructions for seeding
Write-Host "[3/3] Next: Seed demo data" -ForegroundColor Yellow
Write-Host ""
Write-Host "To add demo students and enrollments:" -ForegroundColor Cyan
Write-Host "1. Open Supabase SQL Editor" -ForegroundColor White
Write-Host "2. Run the SQL file: seed_students_and_enrollments.sql" -ForegroundColor White
Write-Host ""
Write-Host "OR run this command:" -ForegroundColor Cyan
Write-Host "  psql `$DIRECT_URL < ../seed_students_and_enrollments.sql" -ForegroundColor White
Write-Host ""

Write-Host "===================================" -ForegroundColor Green
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Seed demo data using the SQL file above" -ForegroundColor White
Write-Host "2. Start dev server: npm run dev" -ForegroundColor White
Write-Host "3. Login as teacher and check /teacher/results" -ForegroundColor White
