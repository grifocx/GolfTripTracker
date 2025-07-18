# Deployment Guide

## Overview
This guide explains how to deploy the Golf Tournament Management System to production.

## Build Process

### Automatic Build (Recommended)
Use the provided build script:
```bash
./build-deploy.sh
```

### Manual Build
If you prefer to build manually:
```bash
# 1. Build frontend and backend
npm run build

# 2. Create server/public directory
mkdir -p server/public

# 3. Copy built frontend files
cp -r dist/public/* server/public/

# 4. Start production server
NODE_ENV=production node dist/index.js
```

## Production Server
The production server serves:
- Static frontend files from `server/public/`
- API endpoints at `/api/*`
- All other routes fall back to `index.html` for client-side routing

## Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Server port (defaults to 5000)

## Deployment Steps

### 1. Build the Application
```bash
./build-deploy.sh
```

### 2. Deploy to Production
The built files are ready for deployment when:
- `server/public/` contains the frontend assets
- `dist/index.js` contains the backend server
- Database is configured and accessible

### 3. Start Production Server
```bash
NODE_ENV=production node dist/index.js
```

## Verification
After deployment, verify:
1. Frontend loads at the root URL
2. API endpoints respond correctly
3. Database connection is working
4. Authentication functions properly

## Common Issues

### Frontend Not Loading
- Ensure `server/public/` directory exists and contains built files
- Check that `NODE_ENV=production` is set
- Verify the build process completed successfully

### API Errors
- Check database connection string
- Verify all required environment variables are set
- Check server logs for specific error messages

### Database Issues
- Ensure PostgreSQL is running and accessible
- Run `npm run db:push` to update schema if needed
- Check database credentials and connection string

## File Structure (Production)
```
server/public/          # Built frontend files
├── index.html         # Main HTML file
├── assets/           # CSS, JS, and other assets
dist/
├── index.js          # Built backend server
```

## Maintenance
- Run `./build-deploy.sh` after any code changes
- Monitor server logs for errors
- Regular database backups recommended
- Update dependencies periodically