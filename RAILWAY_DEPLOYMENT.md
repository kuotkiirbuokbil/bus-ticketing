# 🚂 Railway Deployment Guide

This guide will help you deploy the Bus Ticketing USSD System to Railway.

## 🚀 Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy)

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push this code to GitHub
3. **Railway CLI** (optional): `npm install -g @railway/cli`

## 🔧 Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: Bus Ticketing USSD System"

# Push to GitHub
git remote add origin https://github.com/yourusername/bus-ticketing.git
git push -u origin main
```

### 2. Deploy on Railway

#### Option A: Web Interface
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the Node.js app

#### Option B: Railway CLI
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables

In your Railway project dashboard, go to **Variables** and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `${{PORT}}` | Railway's dynamic port (auto-set) |
| `HOST` | `0.0.0.0` | Bind to all interfaces |
| `DATABASE_PATH` | `/tmp/bus_ticketing.db` | Writable database path |

### 4. Troubleshooting Issues

#### Build Issues:
1. **Nixpacks Issues**: The project now uses Railway's auto-detection instead of custom Nixpacks configuration
2. **Docker Alternative**: A `Dockerfile` is provided as backup deployment method
3. **Build Script**: The build script is simplified to avoid failures

#### Database Issues:
1. **SQLITE_CANTOPEN Error**: Make sure `DATABASE_PATH` is set to `/tmp/bus_ticketing.db`
2. **Permission Issues**: The `/tmp` directory is writable in Railway containers
3. **Database Path**: The app automatically uses `/tmp` in production mode

### 5. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Railway will provide SSL certificate automatically

## 🔍 Monitoring & Logs

### View Logs
```bash
# Using Railway CLI
railway logs

# Or in the web dashboard
# Go to your project → Deployments → View logs
```

### Health Checks
Railway automatically monitors:
- **Health Check URL**: `https://your-app.railway.app/ok`
- **Database Check**: `https://your-app.railway.app/db-ping`

## 🧪 Testing Your Deployment

### Test USSD Endpoints
```bash
# Test customer interface
curl -X POST https://your-app.railway.app/ussd \
  -d "sessionId=test&serviceCode=*123#&phoneNumber=1234567890&text="

# Test operator interface
curl -X POST https://your-app.railway.app/ussd-ops \
  -d "sessionId=op&text=1234"
```

### Test Health Endpoints
```bash
# Basic health check
curl https://your-app.railway.app/ok

# Database connectivity
curl https://your-app.railway.app/db-ping
```

## 🔧 Production Configuration

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=${{PORT}}
HOST=0.0.0.0
DATABASE_PATH=/tmp/bus_ticketing.db
```

### Security Considerations
- ✅ Rate limiting enabled
- ✅ XSS protection active
- ✅ Helmet security headers
- ✅ Input sanitization
- ✅ SQLite database (no external dependencies)

## 📊 Scaling

Railway automatically handles:
- **Auto-scaling** based on traffic
- **Zero-downtime deployments**
- **Automatic SSL certificates**
- **Global CDN**

## 🚨 Troubleshooting

### Common Issues

1. **App won't start**
   - Check logs: `railway logs`
   - Verify environment variables
   - Ensure `PORT` is set to `${{PORT}}`

2. **Database issues**
   - Check `DATABASE_PATH` is writable
   - Verify SQLite permissions

3. **USSD not responding**
   - Test health endpoints first
   - Check rate limiting settings
   - Verify request format

### Getting Help
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Project Issues: Create an issue in this repository

## 🎯 Post-Deployment

After successful deployment:

1. **Test all USSD flows**
2. **Configure your USSD provider** (Africa's Talking, etc.)
3. **Set up monitoring alerts**
4. **Configure custom domain** (optional)
5. **Set up database backups** (if needed)

## 📱 USSD Provider Integration

To connect with USSD providers like Africa's Talking:

1. **Get your USSD URL**: `https://your-app.railway.app/ussd`
2. **Configure webhook** in your USSD provider dashboard
3. **Test with real USSD codes**

### Africa's Talking Configuration
- **USSD URL**: `https://your-app.railway.app/ussd`
- **Method**: POST
- **Content-Type**: application/x-www-form-urlencoded

---

🎉 **Your Bus Ticketing System is now live on Railway!**
