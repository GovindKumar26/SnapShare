# SnapShare Backend - Render Deployment Guide

## 🚀 Quick Deployment to Render

### Prerequisites
- ✅ GitHub repository (https://github.com/GovindKumar26/SnapShare)
- ✅ Render account (sign up at https://render.com)
- ✅ MongoDB Atlas cluster running
- ✅ Cloudinary account configured

---

## Step 1: Sign Up / Log In to Render

1. Go to https://render.com
2. Click **"Get Started for Free"** or **"Sign In"**
3. Sign in with GitHub (recommended for easy repo access)
4. Authorize Render to access your GitHub repositories

---

## Step 2: Create New Web Service

1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Click **"Connect GitHub"** (if not already connected)
3. Find and select your repository: **"GovindKumar26/SnapShare"**
4. Click **"Connect"**

---

## Step 3: Configure Your Web Service

### Basic Settings:

| Field | Value |
|-------|-------|
| **Name** | `snapshare-api` (or your preferred name) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ **IMPORTANT** |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### Advanced Settings:

| Field | Value |
|-------|-------|
| **Auto-Deploy** | Yes (deploys on every push) |
| **Instance Type** | Free |

---

## Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**


```

⚠️ **Note:** Update `FRONTEND_URL` after deploying your frontend!

### Security Recommendation:
Consider changing `JWT_SECRET` to something more secure:
```
JWT_SECRET=your-super-secret-key-here-make-it-long-and-random-123456789
```

---

## Step 5: Deploy!

1. Click **"Create Web Service"** button at the bottom
2. Render will start building and deploying your app
3. Wait for the build to complete (2-5 minutes)

### What's Happening:
```
📦 Installing dependencies...
✅ Build successful
🚀 Starting server...
✅ Live!
```

---

## Step 6: Verify Deployment

### Your API URL:
```
https://snapshare-api.onrender.com
```
(Replace `snapshare-api` with your chosen name)

### Test Endpoints:

**1. Health Check:**
```bash
# Browser or curl
https://snapshare-api.onrender.com/
```
Should return: `"Hello world"`

**2. Test Register (Optional):**
```bash
curl -X POST https://snapshare-api.onrender.com/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","displayName":"Test User"}'
```

---

## Step 7: Update MongoDB Atlas IP Whitelist

⚠️ **IMPORTANT for Production:**

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. Either:
   - Add Render's IP ranges (check Render docs)
   - OR keep "Allow Access from Anywhere" (less secure but easier)

---

## Step 8: Update FRONTEND_URL

### After deploying your frontend:

1. Go to Render Dashboard
2. Click on your `snapshare-api` service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL` to your actual frontend URL:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Click **"Save Changes"**
6. Service will automatically redeploy

---

## 🔧 Troubleshooting

### Build Fails
- Check logs in Render dashboard
- Verify `Root Directory` is set to `backend`
- Check all environment variables are set

### Server Crashes on Start
- Click on service → **"Logs"** tab
- Look for error messages
- Common issues:
  - Missing environment variables
  - Wrong MongoDB URI
  - Port issues (Render assigns PORT automatically)

### Can't Connect to Database
- Verify MongoDB Atlas IP whitelist
- Check MONGO_URI format
- Test connection string locally first

### CORS Errors from Frontend
- Update `FRONTEND_URL` environment variable
- Make sure it matches your actual frontend URL
- Redeploy after changing

---

## 📊 Monitoring Your App

### Render Dashboard:
- **Logs**: View real-time application logs
- **Metrics**: CPU, Memory usage
- **Events**: Deployment history

### MongoDB Atlas:
- **Metrics**: Database performance
- **Real-time**: Active connections
- **Alerts**: Set up monitoring alerts

---

## 🔄 Continuous Deployment

With Auto-Deploy enabled:
1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Render automatically detects the push
4. Rebuilds and redeploys your app
5. Live in 2-3 minutes!

---

## 💰 Free Tier Limitations

Render Free Tier includes:
- ✅ 750 hours/month compute time
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ⚠️ Sleeps after 15 min of inactivity
- ⚠️ Cold start delay (10-30 seconds)

**Note:** First request after sleep will be slow. Consider:
- Upgrading to paid plan ($7/month) for always-on
- Using a ping service to keep it awake
- Accepting the cold start for hobby projects

---

## 🎉 Success Checklist

After deployment, verify:
- [ ] Service is "Live" in Render dashboard
- [ ] Can access `https://your-app.onrender.com/`
- [ ] Environment variables are all set
- [ ] MongoDB connection working (check logs)
- [ ] Can register a test user
- [ ] Can login with test user
- [ ] Test an API endpoint

---

## 📝 Your Deployed API

Once deployed, your API will be available at:
```
https://snapshare-api.onrender.com
```

### Example API Calls:
```javascript
// Register
POST https://snapshare-api.onrender.com/register

// Login
POST https://snapshare-api.onrender.com/login

// Get Posts
GET https://snapshare-api.onrender.com/api/posts

// Search Users
GET https://snapshare-api.onrender.com/api/users/search/users?search=john
```

---

## 🔗 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Test all endpoints
3. ✅ Deploy frontend (Vercel/Netlify)
4. ✅ Update FRONTEND_URL
5. ✅ Connect frontend to deployed API
6. ✅ Test complete application

---

## 📞 Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- MongoDB Atlas Support: https://www.mongodb.com/docs/atlas/

---

## 🎊 Congratulations!

Your SnapShare backend is now live and accessible from anywhere! 🚀
