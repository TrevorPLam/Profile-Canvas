# Deployment Runbook

This document provides comprehensive instructions for deploying the Corkboard application to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [API Server Deployment](#api-server-deployment)
- [Mobile Deployment](#mobile-deployment)
- [Database Migrations](#database-migrations)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to production, ensure you have:

- Access to the production hosting platform (Docker registry, cloud provider, etc.)
- Database credentials and connection string
- AWS S3 credentials for media storage
- Domain names configured for API server and mobile app
- SSL/TLS certificates configured
- CI/CD secrets configured in GitHub Actions

## Environment Variables

### Required Environment Variables

Copy `.env.example` to `.env.production` and configure the following:

#### Database Configuration

```bash
DATABASE_URL=postgresql://user:password@host:5432/corkboard
```

#### API Server Configuration

```bash
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

#### Session & Authentication

```bash
SESSION_SECRET=<generate with: openssl rand -base64 32>
JWT_SECRET=<generate with: openssl rand -base64 32>
```

#### AWS S3 Configuration

```bash
AWS_S3_BUCKET=your-production-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<use IAM roles in production>
AWS_SECRET_ACCESS_KEY=<use IAM roles in production>
```

#### Mobile App Configuration

```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

#### Server-Sent Events Configuration

```bash
SSE_HEARTBEAT_INTERVAL=30
SSE_MAX_CONNECTION_MINUTES=15
```

### GitHub Actions Secrets

Configure the following secrets in your GitHub repository settings:

#### API Server Deployment

- `DOCKER_REGISTRY`: Docker registry URL (e.g., docker.io, ghcr.io)
- `DOCKER_USERNAME`: Docker registry username
- `DOCKER_PASSWORD`: Docker registry password/token
- `DOCKER_IMAGE_NAME`: Image name (e.g., username/corkboard-api)

#### Mobile Deployment

- `MOBILE_DEPLOY_DOMAIN`: Domain for mobile app (e.g., mobile.yourdomain.com)
- `MOBILE_REPL_ID`: Replit ID (if using Replit for hosting)

## API Server Deployment

### Automated Deployment (CI/CD)

The API server is automatically deployed when pushing to the `main` branch if changes are detected in:

- `artifacts/api-server/**`
- `lib/db/**`
- `lib/api-zod/**`

The deployment workflow:

1. Runs typecheck, lint, and tests
2. Builds the API server with esbuild
3. Builds a Docker image using multi-stage build
4. Pushes the image to the configured Docker registry
5. Deploys to the production environment (platform-specific commands to be added)

### Manual Deployment

#### Using Docker

1. Build the Docker image:

```bash
docker build -f artifacts/api-server/Dockerfile -t corkboard-api:latest .
```

2. Run the container:

```bash
docker run -d \
  --name corkboard-api \
  -p 3000:3000 \
  --env-file .env.production \
  corkboard-api:latest
```

#### Direct Deployment

1. Install dependencies:

```bash
pnpm install --frozen-lockfile
```

2. Build the API server:

```bash
pnpm --filter @workspace/api-server run build
```

3. Set environment variables:

```bash
export $(cat .env.production | xargs)
```

4. Start the server:

```bash
cd artifacts/api-server
node --enable-source-maps ./dist/index.mjs
```

### Database Migrations

Before deploying the API server, run database migrations:

```bash
cd lib/db
pnpm exec drizzle-kit push
```

For production, consider using:

```bash
pnpm exec drizzle-kit generate
# Review the generated migration
pnpm exec drizzle-kit migrate
```

## Mobile Deployment

### Automated Deployment (CI/CD)

The mobile app is automatically deployed when pushing to the `main` branch if changes are detected in:

- `artifacts/mobile/**`
- `lib/api-client-react/**`

The deployment workflow:

1. Runs typecheck, lint, and tests
2. Builds the static Expo bundle using `scripts/build.js`
3. Deploys the `static-build/` directory to the configured hosting platform

### Manual Deployment

1. Set environment variables:

```bash
export REPLIT_INTERNAL_APP_DOMAIN=mobile.yourdomain.com
export REPLIT_DEV_DOMAIN=mobile.yourdomain.com
export EXPO_PUBLIC_DOMAIN=mobile.yourdomain.com
export EXPLIT_PUBLIC_REPL_ID=your-repl-id
export REPL_ID=your-repl-id
```

2. Build the static bundle:

```bash
cd artifacts/mobile
pnpm run build
```

3. Deploy the `static-build/` directory to your hosting platform:

```bash
# Example: AWS S3
aws s3 sync static-build/ s3://your-bucket/ --delete

# Example: Netlify
netlify deploy --prod --dir=artifacts/mobile/static-build

# Example: Firebase
firebase deploy --only hosting
```

## Rollback Procedures

### API Server Rollback

#### Docker Deployment

```bash
# Stop current container
docker stop corkboard-api
docker rm corkboard-api

# Pull previous image
docker pull your-registry/corkboard-api:previous-tag

# Run previous version
docker run -d \
  --name corkboard-api \
  -p 3000:3000 \
  --env-file .env.production \
  your-registry/corkboard-api:previous-tag
```

#### CI/CD Rollback

1. Revert the commit that caused the issue
2. Push the revert to `main`
3. The CI/CD pipeline will automatically deploy the previous version

### Mobile Rollback

#### Static Hosting Rollback

```bash
# Example: AWS S3
aws s3 sync s3://your-bucket-backup/ s3://your-bucket/ --delete

# Example: Netlify
netlify deploy --prod --dir=artifacts/mobile/static-build-backup

# Example: Firebase
firebase deploy --only hosting --force
```

#### CI/CD Rollback

1. Revert the commit that caused the issue
2. Push the revert to `main`
3. The CI/CD pipeline will automatically deploy the previous version

## Monitoring and Health Checks

### API Server Health Check

The API server includes a health check endpoint:

```bash
curl https://api.yourdomain.com/api/healthz
```

Expected response: `200 OK`

### Docker Health Check

The Docker container includes a built-in health check that runs every 30 seconds:

```bash
docker inspect --format='{{.State.Health.Status}}' corkboard-api
```

### Monitoring Recommendations

- Set up uptime monitoring for the API server health endpoint
- Monitor Docker container resource usage (CPU, memory, disk)
- Set up alerts for failed deployments
- Monitor database connection pool health
- Track error rates and response times

## Troubleshooting

### Common Issues

#### API Server Won't Start

1. Check environment variables are set correctly
2. Verify database connection string is valid
3. Check database is accessible and migrations are run
4. Review logs: `docker logs corkboard-api`

#### Mobile Build Fails

1. Verify environment variables for deployment domain are set
2. Check Metro bundler logs for errors
3. Ensure all dependencies are installed
4. Verify the build script has necessary permissions

#### Database Migration Fails

1. Verify `DATABASE_URL` is correct
2. Check database user has necessary permissions
3. Review the generated migration SQL
4. Consider running migrations manually to inspect errors

#### Deployment Fails in CI/CD

1. Check GitHub Actions logs for specific error
2. Verify all secrets are configured correctly
3. Ensure Docker registry credentials are valid
4. Check for network connectivity issues

### Getting Help

For issues not covered in this runbook:

1. Check the main README.md for project overview
2. Review architecture documentation in `docs/architecture.md`
3. Check API documentation in `docs/api.md`
4. Review mobile documentation in `docs/mobile.md`
5. Open an issue in the GitHub repository

## Security Considerations

- Never commit `.env.production` or any secrets to version control
- Use IAM roles instead of access keys when possible
- Rotate secrets regularly
- Enable SSL/TLS for all endpoints
- Keep dependencies updated with `pnpm update`
- Review security advisories for dependencies
- Use container scanning for Docker images
- Implement rate limiting on API endpoints
- Enable audit logging for production systems

## Performance Optimization

- Use CDN for static assets
- Enable gzip compression on the API server
- Configure database connection pooling
- Use Redis for session storage in production
- Enable HTTP/2 for better performance
- Optimize Docker image size with multi-stage builds
- Use caching for frequently accessed data
- Monitor and optimize database queries
