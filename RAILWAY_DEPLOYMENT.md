# Railway Deployment Guide

## Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub account with your code repository
- Supabase project with database and authentication set up

## Deployment Steps

### 1. Connect Repository to Railway
1. Go to https://railway.app and log in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Select this repository (`kalai`)

### 2. Configure Environment Variables
In Railway project settings, add these environment variables:

**Required Variables:**
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
PORT=5000
FLASK_ENV=production
```

**How to get Supabase values:**
- `SUPABASE_URL`: Go to Supabase Dashboard > Settings > API > Project URL
- `SUPABASE_JWT_SECRET`: Go to Supabase Dashboard > Settings > API > JWT Secret

### 3. Deploy
- Railway will automatically detect the `Procfile` and `railway.json`
- The deployment will start automatically
- Check the logs for any deployment issues

### 4. Get Your Deployed URL
- Once deployed, Railway will provide a URL like: `https://your-app-name.up.railway.app`
- Test the deployment by visiting: `https://your-app-name.up.railway.app/health`

## For React Native Testing

### Update CORS Settings
The backend is already configured to accept requests from any origin (`'*'`) in production, which is perfect for React Native testing.

### Use the Railway URL in React Native
Replace any localhost URLs in your React Native app with your Railway URL:
```javascript
// Instead of: http://localhost:5000
// Use: https://your-app-name.up.railway.app
const API_BASE_URL = 'https://your-app-name.up.railway.app';
```

## Available Endpoints
- Health check: `GET /health`
- Rate limit info: `GET /rate-limit-info`
- Protected example: `GET /protected` (requires authentication)
- API documentation: `GET /swagger-ui`

## Troubleshooting

### Common Issues:
1. **Environment Variables**: Ensure all Supabase credentials are correctly set
2. **Port Issues**: Railway automatically handles port binding
3. **CORS Issues**: Already configured for React Native development
4. **Build Failures**: Check that all dependencies in requirements.txt are correct

### Viewing Logs:
- Go to Railway dashboard > Your project > Deployments tab
- Click on the latest deployment to view real-time logs

### Testing Authentication:
```bash
# Test health endpoint
curl https://your-app-name.up.railway.app/health

# Test with Supabase token
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
     https://your-app-name.up.railway.app/protected
```

## Development vs Production

### Local Development:
- Use `python backend/app.py` to run locally
- Backend runs on `http://localhost:5000`

### Railway Production:
- Automatically handles scaling and SSL
- Backend runs on `https://your-app-name.up.railway.app`
- Health checks ensure uptime 