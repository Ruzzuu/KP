# 🚀 QUICK DEPLOYMENT GUIDE - VERCEL

## ⚡ LANGKAH CEPAT DEPLOY

### 1️⃣ PERSIAPAN (5 menit)

```bash
# 1. Pastikan semua sudah di-commit
git status

# 2. Commit jika ada perubahan
git add .
git commit -m "Ready for Vercel deployment"

# 3. Push ke GitHub
git push origin main
```

### 2️⃣ DEPLOY KE VERCEL (10 menit)

**A. Import Project:**
1. Buka https://vercel.com dan login
2. Click **"Add New"** → **"Project"**
3. Pilih repository **ikenorfaize/KP**
4. Click **"Import"**

**B. Configure Build:**
- Framework Preset: **Vite** (auto-detected) ✅
- Root Directory: `./` (default) ✅
- Build Command: `vite build` (auto-detected) ✅
- Output Directory: `dist` (auto-detected) ✅
- Install Command: `npm install` (auto-detected) ✅

**C. Add Environment Variables:**

Click **"Environment Variables"** dan tambahkan:

```bash
# WAJIB untuk Frontend
VITE_API_BASE_URL=https://YOUR-PROJECT.vercel.app/api
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_ADMIN_EMAIL=admin@pergunu.com

# WAJIB untuk Backend
NODE_ENV=production
ALLOWED_ORIGINS=https://YOUR-PROJECT.vercel.app
FRONTEND_URL=https://YOUR-PROJECT.vercel.app
```

**D. Deploy:**
- Click **"Deploy"**
- Tunggu build selesai (~2-3 menit)
- Copy URL deployment Anda

### 3️⃣ POST-DEPLOYMENT (5 menit)

**A. Update Environment Variables dengan URL sebenarnya:**
1. Go to **Settings** → **Environment Variables**
2. Edit variables berikut dengan URL Vercel Anda:
   - `VITE_API_BASE_URL` → `https://your-actual-url.vercel.app/api`
   - `ALLOWED_ORIGINS` → `https://your-actual-url.vercel.app`
   - `FRONTEND_URL` → `https://your-actual-url.vercel.app`
3. Save changes

**B. Redeploy:**
1. Go to **Deployments** tab
2. Click menu (3 dots) di deployment terakhir
3. Click **"Redeploy"**

### 4️⃣ TESTING (10 menit)

Buka website Anda dan test:
- ✅ Halaman utama loading
- ✅ Login admin (email: admin@pergunu.com, password: admin123)
- ✅ CRUD berita (Create, Read, Update, Delete)
- ✅ Pendaftaran beasiswa
- ✅ Check console browser (F12) untuk errors

---

## 🔧 TROUBLESHOOTING CEPAT

### ❌ Build Failed
```bash
# Test build di local dulu
npm install
npm run build

# Fix errors yang muncul
# Lalu commit & push lagi
```

### ❌ API Not Working (404)
**Penyebab:** Environment variables belum di-set

**Solusi:**
1. Check di Vercel Dashboard → Settings → Environment Variables
2. Pastikan semua variables ada
3. Redeploy

### ❌ CORS Error
**Penyebab:** ALLOWED_ORIGINS tidak match dengan URL Vercel

**Solusi:**
1. Update `ALLOWED_ORIGINS` di environment variables
2. Format: `https://your-project.vercel.app` (tanpa trailing slash)
3. Redeploy

### ❌ 404 on Page Refresh
**Penyebab:** SPA routing belum configured

**Solusi:** Sudah di-handle di `vercel.json` ✅

---

## 📱 CUSTOM DOMAIN (Opsional)

Jika ingin pakai domain sendiri (e.g., pergunu.com):

1. Go to **Settings** → **Domains**
2. Add your domain
3. Update DNS records sesuai instruksi Vercel
4. Update environment variables dengan domain baru
5. Redeploy

---

## ⚠️ CATATAN PENTING

### Database & Uploads
- ⚠️ **db.json akan reset setiap deploy** (data hilang!)
- ⚠️ **uploads/ folder tidak persisten** (files hilang!)

**Solusi untuk Production:**
- Migrate ke database cloud (MongoDB Atlas, Vercel Postgres)
- Gunakan cloud storage (Cloudinary, Vercel Blob)

### EmailJS Keys
- ✅ Public key bisa terexpose di client (ini normal untuk EmailJS)
- ✅ Gunakan EmailJS rate limiting di dashboard
- ✅ Set allowed origins di EmailJS dashboard

---

## 📊 MONITORING

**Vercel Dashboard:**
- **Analytics:** Monitor traffic & performance
- **Logs:** Check function logs untuk debugging
- **Speed Insights:** Monitor page load times

---

## 🎯 CHECKLIST FINAL

Sebelum deploy, pastikan:
- ✅ `.env` sudah di `.gitignore`
- ✅ Tidak ada hardcoded secrets di kode
- ✅ `vercel.json` sudah correct
- ✅ Build berhasil di local (`npm run build`)
- ✅ All commits pushed ke GitHub

Setelah deploy:
- ✅ Environment variables sudah di-set
- ✅ URL sudah diupdate di variables
- ✅ Testing semua fitur berhasil
- ✅ Tidak ada errors di console

---

## 📞 SUPPORT

**Issues?**
- Check [Vercel Documentation](https://vercel.com/docs)
- Check `VERCEL-DEPLOYMENT-CHECKLIST.md` untuk detail lengkap
- Review Vercel Function Logs di dashboard

**Ready to deploy!** 🚀
