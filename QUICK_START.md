# Quick Start Guide

## Environment Setup Summary

### Local Development
1. Copy environment file:
   ```bash
   cp env.example .env
   ```

2. Your `.env` should have:
   ```env
   NODE_ENV=local
   NEXT_PUBLIC_API_URL=http://localhost:3001
   FRONTEND_URL=http://localhost:3000
   ```

3. Run the application:
   ```bash
   npm run dev
   ```

### Production Deployment
1. Copy production environment file:
   ```bash
   cp env.prod.example .env
   ```

2. Your `.env` should have:
   ```env
   NODE_ENV=prod
   NEXT_PUBLIC_API_URL=https://ap-modbus.ducorr.com
   FRONTEND_URL=https://modbus.ducorr.com
   ```

3. Build and deploy:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

## Next Steps

1. **Push to GitHub:** Follow [GITHUB_SETUP.md](./GITHUB_SETUP.md)
2. **Deploy to VPS:** Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

## Environment Variables Reference

| Variable | Local | Production |
|----------|-------|------------|
| `NODE_ENV` | `local` | `prod` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | `https://ap-modbus.ducorr.com` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://modbus.ducorr.com` |
| `PORT` | `3001` | `3001` |

