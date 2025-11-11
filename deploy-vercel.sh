#!/bin/bash
# ============================================
# 🚀 VERCEL DEPLOYMENT SCRIPT
# ============================================
# Script untuk membantu deployment ke Vercel
# Gunakan script ini untuk memastikan semua ready sebelum deploy

echo "============================================"
echo "🚀 VERCEL DEPLOYMENT PREPARATION"
echo "============================================"
echo ""

# Check if git is clean
echo "📋 Checking git status..."
if [[ -n $(git status -s) ]]; then
    echo "⚠️  WARNING: You have uncommitted changes!"
    echo "   Please commit or stash your changes before deployment."
    git status -s
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Git status clean"
fi
echo ""

# Check if .env exists
echo "🔒 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "⚠️  Make sure all environment variables are set in Vercel Dashboard!"
else
    echo "⚠️  .env file not found (this is OK for Vercel deployment)"
    echo "   Variables will be set in Vercel Dashboard"
fi
echo ""

# Run build test
echo "🏗️  Testing build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please fix errors before deployment."
    exit 1
fi
echo ""

# Clean dist folder
echo "🧹 Cleaning build artifacts..."
rm -rf dist
echo "✅ Build artifacts cleaned"
echo ""

# Show deployment checklist
echo "============================================"
echo "📝 DEPLOYMENT CHECKLIST"
echo "============================================"
echo ""
echo "Before deploying to Vercel, make sure you have:"
echo ""
echo "✅ 1. Committed all changes to Git"
echo "✅ 2. Pushed to GitHub repository"
echo "✅ 3. Set environment variables in Vercel Dashboard"
echo "       - VITE_API_BASE_URL"
echo "       - VITE_EMAILJS_SERVICE_ID"
echo "       - VITE_EMAILJS_TEMPLATE_ID"
echo "       - VITE_EMAILJS_PUBLIC_KEY"
echo "       - VITE_ADMIN_EMAIL"
echo "       - NODE_ENV=production"
echo "       - ALLOWED_ORIGINS"
echo "       - FRONTEND_URL"
echo "✅ 4. Reviewed vercel.json configuration"
echo "✅ 5. Updated CORS in api/index.js after first deploy"
echo ""
echo "============================================"
echo "🎯 NEXT STEPS"
echo "============================================"
echo ""
echo "1. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Vercel deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy on Vercel:"
echo "   - Visit https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Configure build settings (auto-detected for Vite)"
echo "   - Set environment variables"
echo "   - Deploy!"
echo ""
echo "3. After deployment:"
echo "   - Copy your Vercel URL"
echo "   - Update CORS in api/index.js"
echo "   - Update environment variables with correct URL"
echo "   - Redeploy if needed"
echo ""
echo "============================================"
echo "✅ Ready to deploy!"
echo "============================================"
