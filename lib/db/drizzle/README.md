# Database Migrations

This directory contains Drizzle ORM migration files for the Corkboard database.

## Generating Migrations

To generate a new migration after schema changes:

```bash
pnpm --filter @workspace/db run generate
```

This will create a new SQL migration file in this directory based on the current schema.

## Applying Migrations

### Development (using push)

For development, you can push schema changes directly to the database:

```bash
pnpm --filter @workspace/db run push
```

### Production (using migrations)

For production, use the migration workflow:

```bash
pnpm --filter @workspace/db run migrate
```

## Environment Setup

Ensure `DATABASE_URL` is set in your environment before running migration commands:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/corkboard"
```

## Schema Files

The database schema is defined in `../src/schema/` and includes:

- `users.ts` - User accounts
- `profiles.ts` - User profiles with MySpace-style modules
- `sessions.ts` - User sessions for authentication
- `posts.ts` - Posts (text, video, reel)
- `comments.ts` - Post comments
- `engagement.ts` - Likes and saves
- `friendships.ts` - Friend requests and friendships
- `notifications.ts` - User notifications
- `conversations.ts` - Messaging conversations
- `messages.ts` - Conversation messages
- `stories.ts` - Ephemeral stories
- `reports.ts` - Content moderation reports
- `blocks.ts` - User blocks
- `mutes.ts` - User mutes
