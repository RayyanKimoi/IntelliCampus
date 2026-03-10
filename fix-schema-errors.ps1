# Fix Database Schema Errors
# Run this script after stopping all dev servers

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Database Schema Fix Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check for running Node processes
Write-Host "Checking for running Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object { $_.ProcessName -like '*node*' } | Select-Object ProcessName, Id

if ($nodeProcesses.Count -gt 0) {
    Write-Host ""
    Write-Host "WARNING: Found running Node.js processes:" -ForegroundColor Red
    $nodeProcesses | Format-Table
    Write-Host ""
    Write-Host "Please close all terminal windows running 'pnpm dev' or similar commands." -ForegroundColor Red
    Write-Host "Then run this script again." -ForegroundColor Red
    Write-Host ""
    
    $response = Read-Host "Do you want to kill all Node.js processes now? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "Node.js processes stopped." -ForegroundColor Green
    } else {
        Write-Host "Script aborted. Please stop Node.js processes manually and run again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "No blocking processes found. Proceeding with fix..." -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
Set-Location -Path "F:\IntelliCampus-main\IntelliCampus\frontend"

# Regenerate Prisma Client
Write-Host "Step 1: Regenerating Prisma Client..." -ForegroundColor Cyan
try {
    pnpm prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Prisma Client regenerated successfully" -ForegroundColor Green
    } else {
        throw "Prisma generate failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "✗ Failed to regenerate Prisma Client" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure all terminals are closed" -ForegroundColor Yellow
    Write-Host "2. Restart your terminal as Administrator" -ForegroundColor Yellow
    Write-Host "3. Try running: pnpm prisma generate" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✓ Fix Applied Successfully!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now restart your development server with:" -ForegroundColor Cyan
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "The following errors should now be resolved:" -ForegroundColor Green
Write-Host "  ✓ 404 on /api/teacher/curriculum/chapters" -ForegroundColor Gray
Write-Host "  ✓ Prisma schema inconsistency errors" -ForegroundColor Gray
Write-Host "  ✓ Teacher dashboard loading errors" -ForegroundColor Gray
Write-Host "  ✓ Assessment studio loading errors" -ForegroundColor Gray
Write-Host ""
