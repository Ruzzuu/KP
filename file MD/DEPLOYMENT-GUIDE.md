# 🚀 Deployment Guide - KP Project

## Quick Deployment Commands

### Option 1: Smart Deployment Script (Recommended)
```powershell
# Deploy everything in one command
.\deploy.ps1
```

This script will automatically:
- ✅ Check for uncommitted changes
- ✅ Push to **both** Git remotes (origin + ruzzuu)
- ✅ Deploy to Vercel with force flag
- ✅ Verify deployment (API + MongoDB)

---

### Option 2: Manual Deployment Steps

#### Step 1: Commit Changes
```powershell
git add .
git commit -m "Your commit message"
```

#### Step 2: Push to Both Remotes
```powershell
# Push to origin (ikenorfaize/KP)
git push origin main

# Push to ruzzuu (Ruzzuu/KP) - IMPORTANT!
git push ruzzuu main
```

#### Step 3: Deploy to Vercel
```powershell
# Force deploy to production
vercel --prod --force --yes
```

#### Step 4: Verify Deployment
```powershell
# Check API health
Invoke-RestMethod https://kp-mocha.vercel.app/api/health

# Check MongoDB status
Invoke-RestMethod https://kp-mocha.vercel.app/api/admin/db-status
```

---

## Important Notes

### ⚠️ Two Git Remotes Configuration

Your project has **TWO** Git repositories:

1. **origin**: `https://github.com/ikenorfaize/KP.git`
2. **ruzzuu**: `https://github.com/Ruzzuu/KP.git`

**ALWAYS push to BOTH remotes** to keep them in sync!

### Check Remote Status
```powershell
# View all remotes
git remote -v

# Check if ruzzuu is behind
git fetch ruzzuu
git log ruzzuu/main..main --oneline
```

If you see commits listed, ruzzuu is behind and needs updating:
```powershell
git push ruzzuu main --force
```

---

## Vercel CLI Commands

### Login to Vercel
```powershell
vercel login
```

### Check Current User
```powershell
vercel whoami
```

### List Projects
```powershell
vercel project ls
```

### Deploy to Production
```powershell
# Standard deploy
vercel --prod

# Force deploy (recommended for bug fixes)
vercel --prod --force --yes
```

### View Deployment Logs
```powershell
vercel logs https://kp-mocha.vercel.app
```

---

## MongoDB Atlas

**MongoDB does NOT need deployment** - it's already running 24/7 in the cloud.

### Connection Info
- **Cluster**: cluster01.7tyzyh4.mongodb.net
- **Database**: pergunu_db
- **Connection**: Configured via MONGODB_URI in Vercel environment variables

### Check MongoDB Status
```powershell
Invoke-RestMethod https://kp-mocha.vercel.app/api/admin/db-status | ConvertTo-Json
```

Expected output:
```json
{
  "useMongoDB": true,
  "isConnected": true,
  "collections": {
    "users": 6,
    "news": 8,
    "beasiswa": 6,
    "applications": 8
  }
}
```

---

## Troubleshooting

### Issue: Vercel deployment is behind GitHub

**Cause**: Pushed to `origin` but not to `ruzzuu`, and Vercel might be connected to ruzzuu.

**Solution**:
```powershell
# Push to ruzzuu
git push ruzzuu main

# Force redeploy
vercel --prod --force --yes
```

### Issue: Changes not appearing after deployment

**Solutions**:
1. Force deploy: `vercel --prod --force --yes`
2. Clear browser cache (Ctrl+Shift+R)
3. Wait 30-60 seconds for propagation
4. Check deployment logs: `vercel logs https://kp-mocha.vercel.app`

### Issue: MongoDB not connecting

**Check**:
```powershell
# Verify MONGODB_URI is set in Vercel
vercel env ls
```

If missing, add it:
```powershell
vercel env add MONGODB_URI
# Paste: mongodb+srv://fairuzo1dyck_db_user:8jRYtyQs0Ektu5N8@cluster01.7tyzyh4.mongodb.net/pergunu_db?retryWrites=true&w=majority
```

Then redeploy:
```powershell
vercel --prod --force --yes
```

---

## Deployment Checklist

Before deploying:
- [ ] All changes committed (`git status` shows clean)
- [ ] Pushed to **origin** remote
- [ ] Pushed to **ruzzuu** remote
- [ ] Logged into Vercel CLI (`vercel whoami`)
- [ ] Deployed with force flag
- [ ] Verified API health
- [ ] Verified MongoDB connection
- [ ] Tested functionality on production URL

---

## Production URLs

- **Main**: https://kp-mocha.vercel.app
- **Admin**: https://kp-mocha.vercel.app/admin
- **API**: https://kp-mocha.vercel.app/api/*

---

## Quick Reference

```powershell
# Full deployment (recommended)
.\deploy.ps1

# Quick check
git status
git remote -v
vercel whoami

# Quick deploy
git add .
git commit -m "feat: your changes"
git push origin main
git push ruzzuu main
vercel --prod --force --yes

# Quick verify
Invoke-RestMethod https://kp-mocha.vercel.app/api/health
Invoke-RestMethod https://kp-mocha.vercel.app/api/admin/db-status
```

---

**Remember**: Always push to BOTH remotes (origin + ruzzuu) to avoid sync issues! 🔄
