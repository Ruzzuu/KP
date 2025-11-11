# 🔗 CARA MENGAMBIL & UPDATE URL VERCEL

## 📍 DIMANA MENGAMBIL URL VERCEL?

### Setelah Deploy Berhasil:

1. **Di Vercel Dashboard:**
   - Setelah deployment selesai, Anda akan melihat halaman sukses
   - URL ada di bagian atas dengan format: `https://nama-project.vercel.app`
   - **COPY URL INI!**

2. **Atau di Deployments Tab:**
   - Buka project Anda di Vercel
   - Go to **Deployments** tab
   - Klik deployment yang sudah sukses
   - URL ada di bagian atas

3. **Format URL:**
   ```
   https://kp-ikenorfaize.vercel.app
   atau
   https://kp-git-main-ikenorfaize.vercel.app
   ```

---

## ⚙️ DIMANA UPDATE URL DI VERCEL?

### TIDAK PERLU update di `api/index.js` secara manual!

**Yang perlu Anda lakukan:**

### 1. Update Environment Variables di Vercel Dashboard

**Steps:**
1. Buka Vercel Dashboard → Pilih project Anda
2. Go to **Settings** → **Environment Variables**
3. Update/Tambahkan variables berikut:

```bash
# COPY URL VERCEL ANDA, lalu paste di sini:
# Misal URL Anda: https://kp-ikenorfaize.vercel.app

# Update variable ini:
VITE_API_BASE_URL=https://kp-ikenorfaize.vercel.app/api

ALLOWED_ORIGINS=https://kp-ikenorfaize.vercel.app

FRONTEND_URL=https://kp-ikenorfaize.vercel.app
```

**PENTING:** 
- Ganti `kp-ikenorfaize.vercel.app` dengan URL Vercel Anda yang SEBENARNYA
- Jangan ada trailing slash `/` di akhir (kecuali VITE_API_BASE_URL yang ada /api)

4. **Set untuk semua environment:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. **Save** semua changes

---

### 2. Redeploy Project

**Setelah update environment variables:**

1. Go to **Deployments** tab
2. Klik menu **⋮** (3 dots) di deployment terakhir
3. Klik **"Redeploy"**
4. Tunggu ~2-3 menit

---

## 🔧 KENAPA TIDAK PERLU EDIT api/index.js?

File `api/index.js` sudah menggunakan **environment variables**:

```javascript
// Baris 46 - CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

// Baris 63 - Frontend URL
process.env.FRONTEND_URL
```

Jadi API akan **otomatis** mengambil URL dari environment variables yang Anda set di Vercel Dashboard!

**TIDAK PERLU edit kode sama sekali!** ✅

---

## 📋 CHECKLIST UPDATE URL

- [ ] Deploy berhasil di Vercel
- [ ] Copy URL Vercel (contoh: https://kp-ikenorfaize.vercel.app)
- [ ] Buka Settings → Environment Variables di Vercel
- [ ] Update `VITE_API_BASE_URL` dengan URL/api
- [ ] Update `ALLOWED_ORIGINS` dengan URL
- [ ] Update `FRONTEND_URL` dengan URL
- [ ] Save semua changes
- [ ] Redeploy dari Deployments tab
- [ ] Tunggu deploy selesai
- [ ] Test website Anda!

---

## 🎯 CONTOH LENGKAP

Misal URL Vercel Anda adalah: `https://kp-ikenorfaize.vercel.app`

**Set di Vercel Environment Variables:**

```bash
VITE_API_BASE_URL=https://kp-ikenorfaize.vercel.app/api
ALLOWED_ORIGINS=https://kp-ikenorfaize.vercel.app
FRONTEND_URL=https://kp-ikenorfaize.vercel.app
NODE_ENV=production

# EmailJS (ganti dengan credentials Anda)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_ADMIN_EMAIL=admin@pergunu.com
```

---

## 🚨 TROUBLESHOOTING

### Error: "functions property cannot be used with builds"
**Solusi:**
1. Pastikan file `vercel.json` TIDAK ada property `builds`
2. Delete deployment lama di Vercel
3. Deploy ulang dari GitHub (push commit baru)

**Atau:**
1. Di Vercel Dashboard → Settings
2. Scroll ke bawah → **Delete Project**
3. Import ulang dari GitHub

### CORS Error setelah deploy
**Solusi:**
- Pastikan `ALLOWED_ORIGINS` sudah di-set dengan URL Vercel yang benar
- Redeploy setelah update environment variables

### API Not Found (404)
**Solusi:**
- Pastikan `VITE_API_BASE_URL` ada `/api` di akhir
- Format: `https://your-url.vercel.app/api`

---

## ✅ SUMMARY

**YANG PERLU ANDA LAKUKAN:**
1. ✅ Deploy project di Vercel
2. ✅ Copy URL dari Vercel Dashboard
3. ✅ Update 3 environment variables di Vercel Settings
4. ✅ Redeploy
5. ✅ Done! Tidak perlu edit kode!

**JANGAN:**
- ❌ Edit `api/index.js` secara manual
- ❌ Hardcode URL di kode
- ❌ Commit environment variables ke Git

**URL akan otomatis terupdate dari environment variables!** 🎉
