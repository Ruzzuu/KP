# Migration Script for MongoDB
# Run this after deployment to migrate data from db.json to MongoDB

$baseUrl = "https://kp-mocha.vercel.app"

Write-Host "Checking database status..." -ForegroundColor Cyan
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/admin/db-status" -Method GET
    Write-Host "Database Status:" -ForegroundColor Green
    $statusResponse | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "Failed to check status: $_" -ForegroundColor Red
}

Write-Host "Starting migration..." -ForegroundColor Cyan
try {
    $migrateResponse = Invoke-RestMethod -Uri "$baseUrl/api/admin/migrate" -Method POST -ContentType "application/json"
    Write-Host "Migration completed!" -ForegroundColor Green
    $migrateResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Migration failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Checking database status after migration..." -ForegroundColor Cyan
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/admin/db-status" -Method GET
    Write-Host "Final Database Status:" -ForegroundColor Green
    $statusResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Failed to check final status: $_" -ForegroundColor Red
}
