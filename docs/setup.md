# Setup and Deployment Guide

This document provides step-by-step instructions for completing the remaining manual setup tasks after the automated codebase fixes.

## Prerequisites

- Node.js 22+ and pnpm installed
- PostgreSQL database (for production)
- Docker (for containerized deployment)
- Expo development environment (for mobile app)

## Database Setup

### 1. Configure Environment Variables

The `.env` file has been created with placeholder values. Update it with your actual configuration:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/corkboard

# Session & Authentication
SESSION_SECRET=<generate with: openssl rand -base64 32>
JWT_SECRET=<generate with: openssl rand -base64 32>

# AWS S3 Configuration (for media storage)
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### 2. Generate Database Migrations

Once the database is available, generate migration files:

```bash
pnpm --filter @workspace/db run generate
```

This will create SQL migration files in `lib/db/drizzle/`.

### 3. Apply Migrations

For development, you can push schema changes directly:

```bash
pnpm --filter @workspace/db run push
```

For production, use the migration workflow:

```bash
pnpm --filter @workspace/db run migrate
```

## API Client Generation

### Orval Codegen Issue

The Orval codegen tool is currently experiencing issues resolving the OpenAPI spec file. The configuration has been updated to use the correct format, but the tool may need additional troubleshooting.

**Current Status:**
- Configuration file: `lib/api-spec/orval.config.ts` (CommonJS format)
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Output directories: `lib/api-client-react/src/generated` and `lib/api-zod/src/generated`

**To generate API types when the issue is resolved:**

```bash
pnpm --filter @workspace/api-spec run codegen
```

After successful generation, uncomment the exports in:
- `lib/api-client-react/src/index.ts`
- `lib/api-zod/src/index.ts`

## Mobile App Development Build

### Cookie Management Setup

The mobile app has been configured to use `expo-cookies` for proper cookie handling. This requires a development build (not Expo Go).

### 1. Install Dependencies

Dependencies have been added to `artifacts/mobile/package.json`:
- `expo-cookies` (~1.0.6)

### 2. Create Development Build

For iOS:
```bash
cd artifacts/mobile
npx expo run:ios
```

For Android:
```bash
cd artifacts/mobile
npx expo run:android
```

### 3. Initialize Cookies (Optional)

The `expo-cookies` plugin is configured in `app.json`. For additional cookie management, you can initialize it in your app entry point:

```typescript
import * as Cookies from 'expo-cookies';

// Set default cookie behavior
Cookies.setDefaultCookiePolicy({
  domain: '.yourdomain.com',
  secure: true,
  sameSite: 'strict',
});
```

### 4. Test Authentication

With the development build running, test the authentication flow to ensure cookies are properly set and maintained across requests.

## Deployment Configuration

### GitHub Actions Deployment

The deployment workflow (`.github/workflows/deploy-api.yml`) has been configured with multiple deployment options. Choose one and uncomment the relevant section:

#### Option 1: Docker Compose (Simple)

Uncomment and configure:
```yaml
- name: Deploy to production
  run: |
    docker-compose -f docker-compose.prod.yml up -d
```

Create `docker-compose.prod.yml` with your production configuration.

#### Option 2: Kubernetes

Uncomment and configure:
```yaml
- name: Deploy to production
  run: |
    kubectl set image deployment/api-server api-server=${{ secrets.DOCKER_REGISTRY }}/${{ secrets.DOCKER_IMAGE_NAME }}:${{ github.sha }}
    kubectl rollout status deployment/api-server
```

Required secrets:
- `DOCKER_REGISTRY`
- `DOCKER_IMAGE_NAME`

#### Option 3: AWS ECS

Uncomment and configure:
```yaml
- name: Deploy to production
  run: |
    aws ecs update-service --cluster corkboard --service api-server --force-new-deployment
```

#### Option 4: PaaS (Railway, Render, etc.)

Configure the platform's CLI or webhook integration in the deployment step.

### Required GitHub Secrets

For any deployment option, configure these secrets in your GitHub repository:

- `DOCKER_REGISTRY` - Your Docker registry (e.g., docker.io, ghcr.io)
- `DOCKER_IMAGE_NAME` - Your image name (e.g., username/corkboard-api)
- `DOCKER_USERNAME` - Docker registry username
- `DOCKER_PASSWORD` - Docker registry password/token
- `PROD_DATABASE_URL` - Production database connection string
- `PROD_SESSION_SECRET` - Production session secret
- `PROD_JWT_SECRET` - Production JWT secret
- `PROD_AWS_S3_BUCKET` - Production S3 bucket name
- `PROD_AWS_REGION` - AWS region
- `PROD_AWS_ACCESS_KEY_ID` - AWS access key
- `PROD_AWS_SECRET_ACCESS_KEY` - AWS secret key

## Type Checking

Run type checking to verify all changes:

```bash
pnpm run typecheck
```

**Note:** The mobile app has pre-existing type errors related to Expo Router path types. These are not related to the recent changes and should be addressed separately.

## Testing

Run tests for individual packages:

```bash
# Database tests
pnpm --filter @workspace/db run test

# API spec tests
pnpm --filter @workspace/api-spec run test

# Scripts tests
pnpm --filter @workspace/scripts run test
```

## Troubleshooting

### Database Migration Issues

If `drizzle-kit generate` fails with memory issues:
- Close other applications to free up memory
- Try generating migrations in smaller batches by temporarily commenting out some schema files

### Orval Codegen Issues

If Orval continues to fail:
1. Verify the OpenAPI spec is valid: https://editor.swagger.io/
2. Try running Orval with verbose output: `orval --config ./orval.config.ts --verbose`
3. Consider using an alternative tool like OpenAPI Generator

### Mobile App Cookie Issues

If cookies don't persist:
- Ensure you're using a development build, not Expo Go
- Verify the `expo-cookies` plugin is in `app.json`
- Check that the backend is setting cookies with the correct flags (HttpOnly, Secure, SameSite)

## Next Steps

1. Set up your PostgreSQL database
2. Update `.env` with real values
3. Generate and apply database migrations
4. Resolve Orval codegen issue and generate API types
5. Create a mobile development build for testing
6. Choose and configure a deployment option
7. Set up GitHub secrets for deployment
8. Test the full authentication flow with the development build
