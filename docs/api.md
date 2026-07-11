# API Consumer Guide

This guide describes how to consume the Corkboard API for third-party applications or integrations.

## OpenAPI Specification

The complete API specification is available in `lib/api-spec/openapi.yaml`. This is the single source of truth for all API endpoints, request/response schemas, and authentication requirements.

### Viewing the Spec

You can view the OpenAPI specification directly:

```bash
# View the raw spec
cat lib/api-spec/openapi.yaml

# Or use an OpenAPI viewer (requires external tool)
# e.g., Swagger UI, Redoc, or Stoplight Studio
```

### Regenerating Client Code

The API specification is used to generate type-safe client code:

```bash
# Generate Zod schemas and React client
pnpm --filter @workspace/api-spec run codegen
```

This regenerates:

- `lib/api-zod/` - Zod validation schemas
- `lib/api-client-react/` - React API client

## Authentication

Corkboard uses HTTP-only cookies for session management. This approach provides better security than localStorage-based token storage.

### Session Flow

1. **Register** - POST `/auth/register` with email and password
   - Returns user profile and sets `session_id` cookie
   - Cookie attributes: HttpOnly, Secure, SameSite=Strict

2. **Login** - POST `/auth/login` with email and password
   - Returns user profile and sets `session_id` cookie
   - Cookie attributes: HttpOnly, Secure, SameSite=Strict

3. **Authenticated Requests** - Include session cookie automatically
   - Browser clients include cookies automatically
   - Non-browser clients must include `Cookie: session_id=<value>` header

4. **Logout** - POST `/auth/logout`
   - Clears session cookie (Max-Age=0)
   - Deletes session from server

5. **Refresh** - POST `/auth/refresh`
   - Extends session expiration
   - Returns current user profile

### Security Scheme

The OpenAPI spec defines the security scheme as:

```yaml
cookieAuth:
  type: apiKey
  in: cookie
  name: session_id
```

### Example Requests

#### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepassword"}' \
  -c cookies.txt
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepassword"}' \
  -c cookies.txt
```

#### Authenticated Request

```bash
curl -X GET http://localhost:3000/api/profiles/me \
  -b cookies.txt
```

#### Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

## API Endpoints

### Health

- `GET /healthz` - Health check endpoint (no authentication required)

### Authentication

- `POST /auth/register` - Register new user account
- `POST /auth/login` - Log in with email/password
- `POST /auth/logout` - Log out and clear session
- `GET /auth/me` - Get current authenticated user
- `POST /auth/refresh` - Refresh session expiration

### Profiles

- `GET /profiles/:handle` - Get public profile by handle (optional auth)
- `GET /profiles/me` - Get current user's full profile (requires auth)
- `PATCH /profiles/me` - Update current user's profile (requires auth)
- `GET /profiles/me/top-friends` - Get top friends list (requires auth)
- `PATCH /profiles/me/top-friends` - Update top friends list (requires auth)

### Posts

- `GET /posts` - List posts (feed)
- `POST /posts` - Create new post (requires auth)
- `GET /posts/:id` - Get post by ID
- `PATCH /posts/:id` - Update post (requires auth, owner only)
- `DELETE /posts/:id` - Delete post (requires auth, owner only)

### Media

- `POST /media/upload` - Upload media file (requires auth)
- `GET /media/:id` - Get media metadata

### Comments

- `GET /posts/:postId/comments` - Get comments for a post
- `POST /posts/:postId/comments` - Add comment to post (requires auth)
- `PATCH /comments/:id` - Update comment (requires auth, owner only)
- `DELETE /comments/:id` - Delete comment (requires auth, owner only)

### Engagement

- `POST /posts/:postId/like` - Like a post (requires auth)
- `DELETE /posts/:postId/like` - Unlike a post (requires auth)
- `POST /posts/:postId/save` - Save a post (requires auth)
- `DELETE /posts/:postId/save` - Unsave a post (requires auth)
- `POST /posts/:postId/repost` - Repost a post (requires auth)
- `DELETE /posts/:postId/repost` - Remove repost (requires auth)

### Friends

- `GET /friends/requests` - Get friend requests (requires auth)
- `POST /friends/requests/:userId` - Send friend request (requires auth)
- `POST /friends/requests/:userId/accept` - Accept friend request (requires auth)
- `POST /friends/requests/:userId/decline` - Decline friend request (requires auth)
- `DELETE /friends/:userId` - Remove friend (requires auth)
- `GET /friends` - Get user's friends list (requires auth)

### Feed

- `GET /feed` - Get personalized feed (requires auth)
- `GET /feed/trending` - Get trending posts

### Discover

- `GET /discover/posts` - Discover posts by topic
- `GET /discover/topics` - Get available topics
- `GET /discover/users` - Discover users

### Notifications

- `GET /notifications` - Get user notifications (requires auth)
- `POST /notifications/:id/read` - Mark notification as read (requires auth)
- `POST /notifications/read-all` - Mark all notifications as read (requires auth)

## Error Responses

All endpoints may return standard error responses:

### 400 Bad Request

Invalid request data or validation error.

```json
{
  "error": "Invalid request",
  "message": "Email is required"
}
```

### 401 Unauthorized

Authentication required or session invalid.

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired session"
}
```

### 409 Conflict

Resource already exists (e.g., email already registered).

```json
{
  "error": "Conflict",
  "message": "Email already registered"
}
```

### 404 Not Found

Resource not found.

```json
{
  "error": "Not found",
  "message": "Profile not found"
}
```

### 500 Internal Server Error

Server error (should be rare).

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

Rate limiting policies are not yet implemented but will be added in future iterations to prevent abuse.

## Pagination

List endpoints support pagination via query parameters:

- `limit` - Number of items per page (default: 20, max: 100)
- `offset` - Number of items to skip (default: 0)

Example:

```bash
GET /posts?limit=50&offset=100
```

## Profile Visibility

Profile modules have three visibility levels:

- `everyone` - Visible to all viewers
- `friends` - Visible only to friends
- `onlyMe` - Visible only to the profile owner

When fetching a profile, the API automatically filters modules based on the viewer's relationship to the profile owner.

## Using the Generated React Client

The generated React client provides type-safe API calls:

```typescript
import { useMutation, useQuery } from '@workspace/api-client-react';
import { register, login, getProfilesMe } from '@workspace/api-client-react';

// Register
const registerMutation = useMutation(register);
registerMutation.mutate({ email: 'user@example.com', password: 'password' });

// Login
const loginMutation = useMutation(login);
loginMutation.mutate({ email: 'user@example.com', password: 'password' });

// Get current profile
const { data: profile } = useQuery(getProfilesMe());
```

## Environment Variables

The API server requires the following environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `SESSION_SECRET` - Secret for session signing
- `JWT_SECRET` - Secret for JWT tokens (if used)
- `AWS_S3_BUCKET` - S3 bucket for media uploads
- `AWS_REGION` - AWS region for S3
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

## CORS

CORS configuration is not yet implemented but will be added to support browser-based API calls from different origins.

## WebSockets

Real-time features (notifications, live updates) will use WebSockets in future iterations. The WebSocket endpoint and protocol will be documented when implemented.

## Testing the API

You can test the API using:

1. **cURL** - Command-line HTTP client
2. **Postman** - GUI API testing tool
3. **Insomnia** - GUI API testing tool
4. **Generated React client** - Type-safe client library

See the example requests above for cURL usage.
