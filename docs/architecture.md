# Architecture Overview

Corkboard follows a specification-driven, domain-oriented architecture using Domain-Driven Design (DDD), Test-Driven Development (TDD), Behavior-Driven Development (BDD), and deep-module principles.

## Domain Boundaries

The application is organized into bounded contexts, each with its own domain logic and data model:

### User Identity (USR)

- **Purpose:** Manage user accounts and public profiles
- **Key Entities:** User (auth credentials), Profile (public display)
- **Separation:** Authentication concerns (passwords, email) are separated from public display (handle, bio, customization)
- **Files:** `lib/db/src/schema/users.ts`, `lib/db/src/schema/profiles.ts`, `lib/db/src/repositories/profileRepository.ts`

### Authentication (AUTH)

- **Purpose:** Handle user sessions and authorization
- **Key Entities:** Session, password hashing
- **Strategy:** HTTP-only cookies for session tokens, server-side session storage
- **Files:** `artifacts/api-server/src/services/authService.ts`, `artifacts/api-server/src/middlewares/auth.ts`

### Profile Customization (PRF)

- **Purpose:** Enable MySpace-style profile customization
- **Key Entities:** Profile modules, visibility settings, top friends
- **Features:** Reorderable profile sections, visibility controls (everyone/friends/only me), wallpaper, accent colors, mood labels
- **Files:** `artifacts/api-server/src/services/profileService.ts`, `artifacts/api-server/src/routes/profiles.ts`

### Posts and Content (PST)

- **Purpose:** Manage user-generated content
- **Key Entities:** Post, repost, topics
- **Features:** Text posts, video/reel content, topic tagging
- **Status:** API spec defined, implementation pending

### Media Upload and Storage (MDA)

- **Purpose:** Handle media file uploads
- **Key Entities:** Media record, S3 storage
- **Features:** Avatar images, post media
- **Status:** API spec defined, implementation pending

### Comments (CMT)

- **Purpose:** Enable post discussions
- **Key Entities:** Comment, comment thread
- **Status:** API spec defined, implementation pending

### Engagement (ENG)

- **Purpose:** Track user interactions
- **Key Entities:** Like, save, repost
- **Status:** API spec defined, implementation pending

### Social Graph (SOC)

- **Purpose:** Manage relationships between users
- **Key Entities:** Friend request, friendship, top friends
- **Status:** API spec defined, implementation pending

### Feed and Discovery (FED)

- **Purpose:** Content distribution and exploration
- **Key Entities:** Feed post, trending content, topic discovery
- **Status:** API spec defined, implementation pending

### Notifications (NTF)

- **Purpose:** Alert users to relevant events
- **Key Entities:** Notification, notification preferences
- **Status:** API spec defined, implementation pending

## Data Flow

### Request Flow (API Server)

1. **Request Reception** - Express server receives HTTP request
2. **Authentication** - `requireAuth` or `optionalAuth` middleware validates session cookie
3. **Route Handler** - Route handler calls service layer
4. **Service Layer** - Business logic, validation, domain operations
5. **Repository Layer** - Database operations via Drizzle ORM
6. **Response** - Service returns domain type, route handler transforms to API response

### Mobile App Flow

1. **User Action** - User interacts with UI screen
2. **Context/Hook** - Screen uses React hooks or context to manage state
3. **API Client** - Generated React client calls API endpoints
4. **Session Management** - HTTP-only cookies handled automatically
5. **State Update** - Response updates local state or AsyncStorage
6. **UI Re-render** - React re-renders with new data

## Backend Layers

### API Server (`artifacts/api-server`)

**Routes Layer** (`src/routes/`)

- HTTP endpoint definitions
- Request/response transformation
- Middleware application
- Input validation using generated Zod schemas

**Services Layer** (`src/services/`)

- Business logic and domain operations
- Coordination between repositories
- Domain validation
- Deep modules with simple interfaces

**Middlewares** (`src/middlewares/`)

- Authentication and authorization
- Error handling
- Request logging

**App Configuration** (`src/app.ts`)

- Express app setup
- Route mounting
- Global middleware configuration

### Database Layer (`lib/db`)

**Schema** (`src/schema/`)

- Drizzle ORM table definitions
- Zod validation schemas
- Database constraints and relationships

**Repositories** (`src/repositories/`)

- Data access layer
- SQL queries encapsulated
- Domain type transformation
- Transaction management

**Domain** (`src/domain/`)

- Pure domain logic
- Business rules without database dependencies
- Testable in isolation

### API Specification (`lib/api-spec`)

**OpenAPI Spec** (`openapi.yaml`)

- Single source of truth for API contract
- BDD-style descriptions for all endpoints
- Schema definitions for requests/responses

**Code Generation** (`orval.config.ts`)

- Generates Zod schemas (`lib/api-zod`)
- Generates React client (`lib/api-client-react`)
- Ensures type safety across frontend/backend

## Mobile Application (`artifacts/mobile`)

**Screens** (`app/`)

- expo-router file-based routing
- Tab navigation: Feed, Reels, Discover, Profile
- Modal screens: Compose, Edit Profile, Friends List
- Detail screens: Post, Profile

**Context** (`context/`)

- `SocialDataContext` - single source of truth for social data
- AsyncStorage persistence
- Mock data seeding

**Libraries** (`lib/`)

- `types.ts` - TypeScript domain types
- `theme.ts` - styling system (wallpapers, accents, moods)
- `modules.ts` - profile module visibility logic
- `mockData.ts` - seed data for development

## Deep Module Pattern

Corkboard follows the deep module philosophy from _A Philosophy of Software Design_:

- **Simple Interfaces:** Each module exposes a minimal, well-defined interface
- **Hidden Complexity:** Implementation details (SQL, JSONB parsing, session storage) are hidden
- **Cohesion:** Related functionality is grouped together
- **Examples:**
  - `ProfileRepository` hides Drizzle internals and JSONB parsing
  - `AuthService` hides password hashing and session storage
  - `ProfileService` hides visibility filtering and relationship checks

## Technology Stack

### Backend

- **Runtime:** Node.js 24
- **Framework:** Express
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Authentication:** Argon2id password hashing, HTTP-only cookies
- **Validation:** Zod (generated from OpenAPI)

### Frontend

- **Framework:** Expo (React Native)
- **Navigation:** expo-router
- **State:** React Context, AsyncStorage
- **Styling:** React Native styling, expo-linear-gradient
- **Fonts:** @expo-google-fonts/inter

### Development

- **Package Manager:** pnpm workspaces
- **Language:** TypeScript 5.9
- **Testing:** Vitest
- **Code Quality:** ESLint, Prettier
- **API Spec:** OpenAPI 3.1.0
- **Code Generation:** Orval

## Development Principles

### Specification-Driven Development (SDD)

- OpenAPI spec is the single source of truth for API
- All implementation driven from spec
- Code generation ensures consistency

### Domain-Driven Design (DDD)

- Bounded contexts for each domain
- Ubiquitous language across codebase
- Domain types separate from persistence

### Test-Driven Development (TDD)

- Unit tests for domain logic
- Integration tests for API endpoints
- Tests written before or alongside implementation

### Behavior-Driven Development (BDD)

- OpenAPI descriptions use given-when-then format
- Focus on user behavior and outcomes
- Clear acceptance criteria

## Security Considerations

- **Passwords:** Hashed with Argon2id (OWASP 2024 recommendations)
- **Sessions:** HTTP-only, Secure, SameSite=Strict cookies
- **SQL Injection:** Prevented by parameterized queries (Drizzle ORM)
- **XSS:** Input validation via Zod schemas
- **CSRF:** Protected by SameSite cookie attribute
- **Account Enumeration:** Generic error messages for auth failures
