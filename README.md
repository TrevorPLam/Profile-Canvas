# Corkboard

A social media app combining modern features with MySpace-style customizable profiles. Users can share text posts, videos, and reels while customizing their profiles with wallpapers, accent colors, mood labels, "now playing" status, and reorderable profile sections.

## Architecture

This is a monorepo using pnpm workspaces with the following structure:

- **lib/** - Shared libraries and domain logic
  - `db/` - Database schema and repository layer (Drizzle ORM)
  - `api-spec/` - OpenAPI specification for the backend API
  - `api-zod/` - Generated Zod schemas from OpenAPI spec
  - `api-client-react/` - Generated React API client
- **artifacts/** - Applications and services
  - `mobile/` - React Native/Expo mobile app prototype
  - `api-server/` - Express backend API server
  - `mockup-sandbox/` - UI mockup sandbox
- **scripts/** - Build and utility scripts

For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md).

## Prerequisites

- **Node.js** 24 or later
- **pnpm** 9 or later ([install pnpm](https://pnpm.io/installation))
- **PostgreSQL** (for backend development, optional for mobile-only work)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Profile-Canvas
```

2. Install dependencies:

```bash
pnpm install
```

**Note:** This repository does not commit `node_modules`. Dependencies are installed via pnpm's content-addressable storage for efficiency.

## Development

### Mobile App (Expo)

Run the mobile development server:

```bash
pnpm --filter @workspace/mobile run dev
```

The mobile app currently uses local AsyncStorage for data persistence (no backend required for initial development).

### API Server

Run the backend API server:

```bash
pnpm --filter @workspace/api-server run dev
```

The API server requires environment variables (see `.env.example`).

## Validation & Testing

Run the full validation pipeline:

```bash
pnpm run validate
```

This runs type checking and tests across all packages.

Individual commands:

- **Type check:** `pnpm run typecheck`
- **Run tests:** `pnpm run test`
- **Lint:** `pnpm run lint`
- **Format check:** `pnpm run format:check`
- **Format code:** `pnpm run format`

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables are documented in `.env.example`. Do not commit `.env` files.

## Documentation

- [Architecture Overview](docs/architecture.md) - Domain boundaries, data flow, backend layers, and development principles
- [API Consumer Guide](docs/api.md) - OpenAPI spec, authentication, endpoints, and usage examples
- [Mobile Developer Guide](docs/mobile.md) - Screen map, state management, and mobile app patterns

## Project Status

This is an active development project following a specification-driven, domain-oriented approach. See `TODO.md` for the complete task breakdown and progress tracking.

## Technology Stack

- **Package Manager:** pnpm workspaces
- **Language:** TypeScript 5.9
- **Mobile:** Expo (React Native) + expo-router
- **Backend:** Express + Drizzle ORM
- **Database:** PostgreSQL
- **Testing:** Vitest
- **Code Quality:** ESLint, Prettier

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm run validate` to ensure quality
4. Commit with conventional commit messages
5. Open a pull request

## License

MIT
