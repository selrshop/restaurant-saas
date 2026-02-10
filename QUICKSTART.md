# 🚀 Quick Start - Deploy to Netlify in 5 Minutes

## Step 1: Upload to GitHub

```bash
git init
git add .
git commit -m "Fixed all ESLint errors - Ready for Netlify"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Connect to Netlify

1. Go to [netlify.com](https://www.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Netlify will auto-detect settings from `netlify.toml` ✅

## Step 3: Set Environment Variable

In Netlify dashboard:
- Go to: **Site settings** → **Environment variables**
- Add: `REACT_APP_BACKEND_URL` = `https://your-backend.onrender.com`

## Step 4: Deploy!

Click **"Deploy site"** and wait 2-5 minutes.

## ✅ Done!

Your site is live! 🎉

---

## What We Fixed

All 10 files with `useEffect` dependency warnings:
- ✅ `AuthContext.js`
- ✅ `CartContext.js`
- ✅ `RestaurantDashboard.js`
- ✅ `RestaurantStorefrontPage.js`
- ✅ `SuperAdminDashboard.js`
- ✅ `HomePage.js`
- ✅ `MenuPage.js`
- ✅ `OrdersPage.js`
- ✅ `MarketplacePage.js`
- ✅ `OrderSuccessPage.js`

All functions are now properly memoized with `useCallback` and included in dependency arrays.

---

## Alternative: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set REACT_APP_BACKEND_URL https://your-backend.onrender.com
netlify deploy --prod
```

---

For detailed instructions, see `DEPLOYMENT.md`
