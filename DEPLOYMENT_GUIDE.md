# 🚀 Complete Deployment Guide for Wendeal Reports

This guide will help you deploy your React app to Vercel with a properly configured PostgreSQL database.

## 📋 Prerequisites

- Vercel account
- Git repository
- PostgreSQL database (we'll set up a free one)

## 🎯 Step 1: Database Setup (Choose One Option)

### Option A: Neon PostgreSQL (Recommended - Free)

1. **Go to [Neon](https://neon.tech)**
2. **Sign up** with your GitHub account
3. **Create a new project**:
   - Project name: `wendeal-reports`
   - Database name: `wendeal_reports`
   - Region: Choose closest to your users
4. **Copy connection string** from the dashboard
   - Format: `postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/wendeal_reports?sslmode=require`

### Option B: Vercel Postgres

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Navigate to your project**
3. **Go to Storage tab**
4. **Create PostgreSQL database**
5. **Copy connection strings**

## 🔧 Step 2: Configure Environment Variables in Vercel

1. **Go to your [Vercel project settings](https://vercel.com/wen-zhongs-projects/wendeal-reports/settings/environment-variables)**

2. **Add these environment variables**:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string | Production |
| `DIRECT_URL` | Same as DATABASE_URL | Production |
| `NODE_ENV` | `production` | Production |
| `NEXTAUTH_SECRET` | Generate random 32-char string | Production |
| `NEXTAUTH_URL` | `https://your-app-url.vercel.app` | Production |

### Generate NEXTAUTH_SECRET:
```bash
# Run this in your terminal to generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📝 Step 3: Update Local Environment Files

Update your `.env.production` file:

```env
# Production Environment Configuration
DATABASE_URL="your-actual-database-url-here"
DIRECT_URL="your-actual-database-url-here"
NODE_ENV="production"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app"
```

## 🗄️ Step 4: Deploy Database Schema

After configuring environment variables in Vercel:

```bash
# Option 1: Use Vercel CLI (recommended)
npx vercel env pull .env.production
npm run db:deploy

# Option 2: Manual deployment
# This will run as part of the Vercel build process
```

## 🚀 Step 5: Deploy to Vercel

```bash
# Deploy to production
npx vercel --prod

# Or push to main branch (if auto-deployment is enabled)
git add .
git commit -m "Configure production database"
git push origin main
```

## 🧪 Step 6: Verify Deployment

1. **Check health endpoint**: Visit `https://your-app-url.vercel.app/api/health`
2. **Expected response**:
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "statistics": {
      "users": 1,
      "reports": 0,
      "categories": 5
    }
  }
}
```

## 🔍 Step 7: Initialize Production Data

Your app should automatically create the necessary tables and initial data. You can verify this by:

1. **Checking the health endpoint** (as above)
2. **Uploading a test document** through the web interface
3. **Verifying data in your database console**

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: "Database connection failed"
**Solutions**:
1. Verify DATABASE_URL is correctly set in Vercel
2. Check that database is active (Neon databases sleep after inactivity)
3. Ensure connection string includes `?sslmode=require`

### Build Issues

**Problem**: Build fails during deployment
**Solutions**:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Ensure Prisma schema is compatible with PostgreSQL

### Upload Issues

**Problem**: File uploads return 500 errors
**Solutions**:
1. Check Vercel function logs for specific errors
2. Verify categories are properly initialized
3. Ensure file size limits are within Vercel's constraints

## 📊 Vercel Configuration

Your `vercel.json` should include:

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "SKIP_BUILD_STATIC_GENERATION": "true"
  }
}
```

## 🔄 Database Migrations

For future schema updates:

```bash
# 1. Update your Prisma schema
# 2. Generate migration
npx prisma migrate dev --name describe-your-changes

# 3. Deploy to production
git add .
git commit -m "Add database migration"
git push origin main
```

## 📚 Useful Commands

```bash
# Test local database connection
node test-db-connection.js

# Reset production database (⚠️ DESTRUCTIVE)
npx prisma db push --force-reset

# View production database
npx prisma studio --browser none

# Check deployment status
npx vercel ls
```

## 🔗 Important Links

- **Neon Console**: https://console.neon.tech
- **Vercel Dashboard**: https://vercel.com/wen-zhongs-projects/wendeal-reports
- **App URL**: https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app
- **Health Check**: https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app/api/health

## ✅ Success Checklist

- [ ] Database created and connection string copied
- [ ] Environment variables configured in Vercel
- [ ] App deployed successfully
- [ ] Health check returns "healthy" status
- [ ] Test file upload works
- [ ] Categories display correctly
- [ ] Data persists between sessions

## 🆘 Need Help?

If you encounter issues:

1. **Check Vercel function logs** in the dashboard
2. **Test database connection** using the health endpoint
3. **Verify environment variables** are correctly set
4. **Check the browser console** for client-side errors

---

🎉 **Congratulations!** Your app should now be fully deployed and functional.
