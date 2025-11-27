# Hosting Guide

Complete overview of the production hosting setup for Camping Gear Tracker.

## 🌐 Production Architecture

### Hosting Stack (100% FREE)

| Component | Platform | Purpose | Free Tier Limits |
|-----------|----------|---------|------------------|
| **Backend API** | Railway.app | Node.js/Express server | $5 trial credit |
| **Database** | Neon.tech | Serverless PostgreSQL | 0.5 GB storage |
| **Image Storage** | Cloudinary | Cloud image hosting | 25 GB storage, 25 GB bandwidth/month |
| **Mobile App** | Expo/EAS | Android APK builds | Unlimited builds |

### Production URLs
- **API Endpoint:** `https://camping-gear-tracker-production.up.railway.app`
- **Health Check:** `https://camping-gear-tracker-production.up.railway.app/health`
- **Database:** Neon serverless PostgreSQL (private connection)
- **Images:** Cloudinary CDN (public URLs)

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP (Android)                  │
│              Built with Expo, hosted on device           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS API Calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND API (Railway.app)                   │
│   https://camping-gear-tracker-production.up.railway.app│
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Express    │  │  Auth/JWT    │  │  Image API   │ │
│  │   Routes     │  │  Middleware  │  │  Controller  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└──────────┬────────────────────────────────┬────────────┘
           │                                │
           │ SQL Queries                    │ Image Upload
           ▼                                ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  DATABASE (Neon.tech)    │    │  IMAGES (Cloudinary)     │
│  Serverless PostgreSQL   │    │  Cloud Image Storage     │
│                          │    │                          │
│  Tables:                 │    │  Folder: camping-gear/   │
│  - items                 │    │  - Optimized images      │
│  - item_images           │    │  - CDN delivery          │
│  - categories            │    │  - Auto transformations  │
│  - users                 │    │                          │
│  - item_categories       │    │                          │
└──────────────────────────┘    └──────────────────────────┘
```

---

## 🔧 Component Details

### 1. Railway.app (Backend API)

**Why Railway?**
- ✅ Easy GitHub integration
- ✅ Automatic deployments on push
- ✅ Simple environment variable management
- ✅ Built-in monitoring and logs
- ✅ Free trial credits

**Configuration:**
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Port:** 3000

**Deployment Process:**
1. Push code to GitHub
2. Railway detects changes
3. Builds from `/backend` directory
4. Deploys automatically
5. Health check at `/health`

### 2. Neon.tech (Database)

**Why Neon?**
- ✅ Serverless PostgreSQL (no cold starts)
- ✅ 0.5 GB free storage (better than Railway)
- ✅ Automatic backups
- ✅ Branching support
- ✅ Fast connection pooling

**Database Schema:**
- `items` - Core item information
- `item_images` - Image metadata (URLs to Cloudinary)
- `categories` - Item categories
- `users` - User accounts
- `item_categories` - Many-to-many junction table

**Connection:**
- Railway connects via `DATABASE_URL` environment variable
- Uses connection pooling for performance
- SSL enabled for security

### 3. Cloudinary (Image Storage)

**Why Cloudinary?**
- ✅ 25 GB free storage
- ✅ 25 GB free bandwidth/month
- ✅ Automatic image optimization
- ✅ CDN delivery worldwide
- ✅ On-the-fly transformations
- ✅ No ephemeral filesystem issues

**Image Processing:**
1. User uploads image from mobile app
2. Backend receives image buffer
3. Sharp resizes to 1200x1200 (max)
4. Uploads to Cloudinary folder: `camping-gear/`
5. Cloudinary returns secure URL
6. URL saved to Neon database
7. Mobile app loads from Cloudinary CDN

**Benefits:**
- Images persist across deployments
- Automatic optimization (WebP, compression)
- Fast loading via CDN
- No server storage needed

### 4. Expo/EAS (Mobile App)

**Why Expo?**
- ✅ Free APK builds
- ✅ Professional build infrastructure
- ✅ Easy OTA updates
- ✅ No local Android Studio needed

**Build Process:**
1. Run `eas build --platform android`
2. Code uploaded to Expo servers
3. Built in cloud (10-20 minutes)
4. Download APK link provided
5. Install on Android devices

---

## 🔐 Environment Variables

### Required on Railway

```bash
# Database
DATABASE_URL=<neon_connection_string>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>

# Authentication
SUPER_ADMIN_PIN=<4_digit_pin>
JWT_SECRET=<random_32_char_string>
JWT_EXPIRES_IN=365d

# Server
NODE_ENV=production
PORT=3000
```

**Security Notes:**
- Never commit `.env` file to GitHub
- Use strong JWT_SECRET (32+ characters)
- Change SUPER_ADMIN_PIN from default
- Rotate secrets periodically

---

## 📈 Monitoring & Maintenance

### Health Checks
```bash
# Check API status
curl https://camping-gear-tracker-production.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-27T...",
  "message": "Hot reload is working!"
}
```

### Logs
- **Railway:** View logs in Railway dashboard
- **Database:** Neon provides query logs
- **Images:** Cloudinary usage dashboard

### Backups
- **Database:** Neon automatic backups (point-in-time recovery)
- **Images:** Cloudinary stores originals
- **Code:** GitHub repository

---

## 💰 Cost Analysis

### Current Usage (FREE)

| Service | Free Tier | Current Usage | Cost |
|---------|-----------|---------------|------|
| Railway | $5 trial credit | Backend API | $0 |
| Neon | 0.5 GB storage | ~50 MB | $0 |
| Cloudinary | 25 GB storage | ~2 GB | $0 |
| Expo | Unlimited | APK builds | $0 |
| **Total** | - | - | **$0/month** |

### Scaling Considerations

**When to upgrade:**
- Railway: After trial credits expire (~$5/month)
- Neon: If database exceeds 0.5 GB (~$19/month)
- Cloudinary: If storage exceeds 25 GB (~$99/month)

**Alternatives for scaling:**
- Railway → Render.com (free tier)
- Neon → Supabase (free tier)
- Cloudinary → AWS S3 (pay-as-you-go)

---

## 🚀 Deployment Workflow

### Automatic Deployment

```bash
# 1. Make changes locally
git add .
git commit -m "Your changes"

# 2. Push to GitHub
git push origin main

# 3. Railway auto-deploys
# - Detects push
# - Builds backend
# - Deploys to production
# - ~2-3 minutes total
```

### Manual Deployment

```bash
# Trigger manual deploy in Railway dashboard
# Settings → Deployments → Deploy Now
```

### Rollback

```bash
# In Railway dashboard:
# Deployments → Select previous deployment → Redeploy
```

---

## 🔍 Troubleshooting

### API Not Responding
1. Check Railway logs
2. Verify environment variables
3. Check Neon database connection
4. Test health endpoint

### Images Not Loading
1. Verify Cloudinary credentials
2. Check image URLs in database
3. Test Cloudinary dashboard
4. Check network connectivity

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check Neon dashboard for status
3. Test connection from Railway logs
4. Verify SSL settings

---

## 📚 Related Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Detailed deployment steps
- [Project Summary](PROJECT_SUMMARY.md) - Overall project overview
- [Mobile App Guide](MOBILE_APP_GUIDE.md) - Mobile app development
- [Auth System Guide](AUTH_SYSTEM_GUIDE.md) - Authentication setup

---

## 🎯 Best Practices

1. **Always test locally** before pushing to production
2. **Use environment variables** for all secrets
3. **Monitor Railway logs** for errors
4. **Keep dependencies updated** regularly
5. **Backup database** before major changes
6. **Test mobile app** after each deployment
7. **Document changes** in commit messages

---

## 📞 Support

For issues or questions:
1. Check Railway logs
2. Review Neon database status
3. Verify Cloudinary usage
4. Check GitHub issues
5. Review documentation

---

**Last Updated:** November 27, 2025
