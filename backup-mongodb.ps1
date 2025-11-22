#!/usr/bin/env pwsh
# MongoDB to JSON Backup Script
# This script backs up current MongoDB data to api/db.json

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MONGODB → JSON BACKUP TOOL                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$API_BASE = "https://kp-mocha.vercel.app/api"
$DB_FILE = "api/db.json"

try {
    Write-Host "📥 Fetching data from MongoDB..." -ForegroundColor Yellow
    
    # Fetch all collections
    $users = Invoke-RestMethod -Uri "$API_BASE/users" -Method GET
    $news = Invoke-RestMethod -Uri "$API_BASE/news" -Method GET
    $applications = Invoke-RestMethod -Uri "$API_BASE/applications" -Method GET
    $beasiswa = Invoke-RestMethod -Uri "$API_BASE/beasiswa" -Method GET
    $beasiswaApps = Invoke-RestMethod -Uri "$API_BASE/beasiswa-applications" -Method GET
    
    Write-Host "✓ Users: $($users.Count)" -ForegroundColor Green
    Write-Host "✓ News: $($news.Count)" -ForegroundColor Green
    Write-Host "✓ Applications: $($applications.Count)" -ForegroundColor Green
    Write-Host "✓ Beasiswa: $($beasiswa.Count)" -ForegroundColor Green
    Write-Host "✓ Beasiswa Applications: $($beasiswaApps.Count)" -ForegroundColor Green
    
    # Create backup object
    $backup = @{
        users = $users
        news = $news
        applications = $applications
        beasiswa = $beasiswa
        beasiswa_applications = $beasiswaApps
        sessions = @()  # Sessions are temporary, don't backup
        _backup_info = @{
            timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            source = "MongoDB Atlas"
            note = "Auto-generated backup from production database"
        }
    }
    
    # Write to file
    Write-Host "`n💾 Writing backup to $DB_FILE..." -ForegroundColor Yellow
    $json = $backup | ConvertTo-Json -Depth 10
    $json | Out-File -FilePath $DB_FILE -Encoding UTF8
    
    Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host "`n📊 Backup Summary:" -ForegroundColor Yellow
    Write-Host "  File: $DB_FILE" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round((Get-Item $DB_FILE).Length / 1KB, 2)) KB" -ForegroundColor Cyan
    Write-Host "  Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
    
    Write-Host "`n⚠️  IMPORTANT:" -ForegroundColor Yellow
    Write-Host "  Remember to commit and push this file!" -ForegroundColor White
    Write-Host "  Run: git add api/db.json && git commit -m 'chore: Update db.json backup from MongoDB'`n" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Backup failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
