#!/usr/bin/env pwsh
# KP Project - Smart Deployment Script
# This script ensures all Git remotes and Vercel are in sync

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        KP PROJECT - SMART DEPLOYMENT TOOL         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Function to check git status
function Check-GitStatus {
    Write-Host "🔍 Checking Git status..." -ForegroundColor Yellow
    $status = git status --porcelain
    if ($status) {
        Write-Host "⚠️  Uncommitted changes detected!" -ForegroundColor Red
        git status --short
        Write-Host "`n❌ Please commit your changes first!" -ForegroundColor Red
        Write-Host "   Run: git add . && git commit -m 'your message'`n" -ForegroundColor Yellow
        return $false
    }
    Write-Host "✓ Working tree clean" -ForegroundColor Green
    return $true
}

# Function to push to all remotes
function Push-AllRemotes {
    Write-Host "`n📤 Pushing to all Git remotes..." -ForegroundColor Yellow
    
    # Push to origin (ikenorfaize)
    Write-Host "  • Pushing to origin (ikenorfaize/KP)..." -ForegroundColor Cyan
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ origin synced" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Failed to push to origin" -ForegroundColor Red
        return $false
    }
    
    # Push to ruzzuu
    Write-Host "  • Pushing to ruzzuu (Ruzzuu/KP)..." -ForegroundColor Cyan
    git push ruzzuu main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ ruzzuu synced" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Failed to push to ruzzuu" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to deploy to Vercel
function Deploy-Vercel {
    Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Yellow
    
    # Check if logged in
    $whoami = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not logged in to Vercel!" -ForegroundColor Red
        Write-Host "   Run: vercel login`n" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "  Logged in as: $whoami" -ForegroundColor Cyan
    
    # Force deploy to production
    Write-Host "  Deploying to production..." -ForegroundColor Cyan
    vercel --prod --force --yes
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Vercel deployment successful!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ✗ Vercel deployment failed!" -ForegroundColor Red
        return $false
    }
}

# Function to verify deployment
function Verify-Deployment {
    Write-Host "`n🔍 Verifying deployment..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    try {
        # Check health
        $health = Invoke-RestMethod -Uri "https://kp-mocha.vercel.app/api/health" -ErrorAction Stop
        Write-Host "  ✓ API Server: $($health.status)" -ForegroundColor Green
        Write-Host "    Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Cyan
        
        # Check MongoDB
        $db = Invoke-RestMethod -Uri "https://kp-mocha.vercel.app/api/admin/db-status" -ErrorAction Stop
        Write-Host "  ✓ MongoDB: Connected ($($db.isConnected))" -ForegroundColor Green
        Write-Host "    Collections: users=$($db.collections.users), apps=$($db.collections.applications), news=$($db.collections.news)" -ForegroundColor Cyan
        
        return $true
    } catch {
        Write-Host "  ✗ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "Starting deployment process...`n" -ForegroundColor White

# Step 1: Check git status
if (-not (Check-GitStatus)) {
    exit 1
}

# Step 2: Push to all remotes
if (-not (Push-AllRemotes)) {
    Write-Host "`n❌ Deployment failed at Git push stage!`n" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy to Vercel
if (-not (Deploy-Vercel)) {
    Write-Host "`n❌ Deployment failed at Vercel stage!`n" -ForegroundColor Red
    exit 1
}

# Step 4: Verify deployment
if (-not (Verify-Deployment)) {
    Write-Host "`n⚠️  Deployment completed but verification failed!`n" -ForegroundColor Yellow
    exit 1
}

# Success!
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ✅ DEPLOYMENT SUCCESSFUL! ✅              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Yellow
Write-Host "  ✓ Git remotes synced (origin + ruzzuu)" -ForegroundColor Green
Write-Host "  ✓ Vercel deployed to production" -ForegroundColor Green
Write-Host "  ✓ API & MongoDB verified online" -ForegroundColor Green
Write-Host "`n🌐 Production URL: https://kp-mocha.vercel.app" -ForegroundColor Cyan
Write-Host "✨ Your website is live and running!`n" -ForegroundColor Green

exit 0
