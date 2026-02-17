# 🚀 Netlify Deployment Guide

## Quick Start

Your Orchestrator AI is ready to deploy! Follow these steps:

### 1. Push to GitHub

```bash
cd /home/saurabh/Downloads/orchestrator-ai

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Migrate to OpenAI and configure for Netlify"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/orchestrator-ai.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy on Netlify

1. Go to **[Netlify](https://app.netlify.com/)**
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and select your `orchestrator-ai` repository
4. Netlify will auto-detect the `netlify.toml` configuration ✅
5. Click **"Deploy site"**

### 3. Configure Environment Variable

After deployment:
1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add:
   - **Key:** `VITE_OPENAI_API_KEY`
   - **Value:** `<your-openai-api-key-here>`
4. Click **"Save"**
5. **Trigger a redeploy** (Deploys → Trigger deploy → Deploy site)

### 4. Done! 🎉

Your app will be live at: `https://your-site-name.netlify.app`

---

## What's Configured

✅ Build command: `npm run build`  
✅ Publish directory: `dist`  
✅ Node version: 20  
✅ SPA redirects: All routes → `index.html`  
✅ OpenAI GPT-4o integration  

---

## Security Note

⚠️ **Important:** This is a client-side app, so the OpenAI API key is visible in the browser. For production:
- Consider adding a backend API to protect the key
- Or use Netlify Functions to proxy OpenAI calls

---

## Need Help?

Check the [walkthrough.md](file:///home/saurabh/.gemini/antigravity/brain/a04f7fdf-f0f9-4d40-ae6a-1e0444231585/walkthrough.md) for detailed testing results and screenshots.
