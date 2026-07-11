# Corkboard Completion TODO

A specification-driven, domain-oriented completion plan for the Corkboard social application. This document follows SDD (Specification-Driven Development), DDD (Domain-Driven Design), TDD (Test-Driven Development), BDD (Behavior-Driven Development), and the deep-modules philosophy from _A Philosophy of Software Design_.

## Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[b]` Blocked
- `[s]` Skipped / deferred

### Labels

- `[AGENT]`: Safe for an automated coding assistant to implement.
- `[HUMAN]`: Requires product, design, or operational human decision-making.
- `[AGENT/HUMAN]`: Agent can draft, human must review or approve.

## Domains

- `TOOL`: Tooling, testing, repository management
- `USR`: User identity
- `AUTH`: Authentication and authorization
- `PRF`: Profile customization
- `PST`: Posts and content
- `MDA`: Media upload and storage
- `CMT`: Comments
- `ENG`: Engagement (likes, reposts, saves)
- `SOC`: Social graph (friends, follows, requests)
- `FED`: Feed and discovery
- `NTF`: Notifications and real-time updates
- `MOB`: Mobile application integration
- `DOC`: Documentation
- `DEP`: Deployment and operations
- `MSG`: Direct messaging and group chats
- `STO`: Stories and ephemeral content
- `SAF`: Trust, safety, and moderation
- `LIV`: Live streaming
- `AUD`: Audience lists and privacy controls
- `COL`: Collaboration (remix, duet, collab)
- `MUS`: Music integration
- `LOC`: Location-based features
- `GAM`: Gamification and interactive features
- `MON`: Creator monetization
- `MYSP`: MySpace-specific features (profile song, top friends, quizzes, bulletins)
- `PRIV`: Privacy and account settings
- `ACC`: Accessibility and theming
- `ADM`: Admin and moderation dashboard
- `WEB`: Web companion and PWA
- `COM`: Communities and groups
- `EVT`: Events and calendars
- `AUR`: Live audio rooms / voice chat
- `VCL`: Video calls and conferencing
- `ARF`: AR filters and effects

---

## [b] TOOL-003: Fix orval codegen path resolution issue

- **Status:** Blocked
- **Priority:** High
- **Domain:** TOOL
- **Behavior:** Given a developer runs the codegen command, when orval processes the OpenAPI spec, then it successfully resolves the input path and generates types without errors.
- **Related Files:** `lib/api-spec/orval.config.ts`, `lib/api-spec/package.json`
- **Definition of Done:** Orval codegen successfully resolves './openapi.yaml' and generates api-zod and api-client-react without path resolution errors.
- **Out of Scope:** Upgrading to a different codegen tool.
- **Rules to Follow:** Fix the path resolution without changing the overall codegen architecture.
- **Advanced Coding Pattern:** Deep module: codegen configuration hides path resolution complexity.
- **Anti-Patterns:** Hardcoding absolute paths; bypassing orval entirely.
- **Imports/Exports:** Export fixed `orval.config.ts`.
- **Depends On:** None
- **Blocks:** API spec changes that require codegen validation

### Subtasks

- [ ] **TOOL-003.1 [AGENT]**: Investigate orval path resolution issue.
  - File: `lib/api-spec/orval.config.ts`
  - Action: Debug why './openapi.yaml' fails to resolve and fix the path configuration.
  - Validation: `pnpm --filter @workspace/api-spec run codegen` executes without path errors.

- [ ] **TOOL-003.2 [AGENT]**: Add TypeScript config for api-spec package.
  - File: `lib/api-spec/tsconfig.json` (new)
  - Action: Ensure TypeScript configuration supports orval's path resolution.
  - Validation: `pnpm --filter @workspace/api-spec run typecheck` passes.

### Notes
- **Blocked Issue:** Orval v8.20.0 fails to resolve './openapi.yaml' on Windows with error "Failed to resolve input: Please provide a valid string value or pass a loader to process the input"
- Attempted fixes: relative paths, absolute paths, path normalization, js-yaml loader, TypeScript config adjustments
- The file exists at the expected location but orval cannot resolve it
- May require orval version upgrade, Windows-specific configuration, or alternative approach

---

## [h] DEP-002: Configure production secrets and domains

- **Status:** Human Action Required
- **Priority:** High
- **Domain:** DEP
- **Behavior:** Given the deployment workflows are set up, when the human configures secrets, then the production deployment succeeds with health checks passing.
- **Related Files:** GitHub repository settings, production environment
- **Definition of Done:** All required secrets (DATABASE_URL, SESSION_SECRET, AWS credentials, API_URL) are configured in GitHub Actions; production deployment succeeds.
- **Out of Scope:** Multi-region deployment.
- **Rules to Follow:** Never commit secrets to the repository; use GitHub Actions secrets.
- **Advanced Coding Pattern:** Deep module: deployment configuration hides secret management.
- **Anti-Patterns:** Committing secrets to the repo.
- **Imports/Exports:** None (configuration only).
- **Depends On:** DEP-001
- **Blocks:** Production deployment

### Subtasks

- [ ] **DEP-002.1 [HUMAN]**: Configure production secrets in GitHub Actions.
  - Action: Add PROD_DATABASE_URL, PROD_SESSION_SECRET, PROD_JWT_SECRET, PROD_AWS_S3_BUCKET, PROD_AWS_REGION, PROD_AWS_ACCESS_KEY_ID, PROD_AWS_SECRET_ACCESS_KEY, PROD_API_URL to GitHub repository secrets.
  - Validation: Production deployment workflow runs successfully with health check passing.
  - **Implementation Notes:**
    - Navigate to GitHub repository Settings → Secrets and variables → Actions → New repository secret
    - Generate secrets using: `openssl rand -base64 32` for SESSION_SECRET and JWT_SECRET
    - Use IAM roles instead of access keys for AWS when possible (security best practice)
    - Set up environment protection rules requiring approval for production deployments
    - Never commit secrets to the repository
    - Rotate secrets regularly (quarterly)

- [ ] **DEP-002.2 [HUMAN]**: Configure production domain.
  - Action: Set up production domain and configure DNS.
  - Validation: Production API is accessible via configured domain.
  - **Implementation Notes:**
    - Purchase domain from registrar (e.g., Namecheap, GoDaddy, Cloudflare Registrar)
    - Configure DNS records:
      - A record for API domain (api.yourdomain.com) → load balancer IP: TTL 300s
      - CNAME for mobile domain (mobile.yourdomain.com) → hosting provider: TTL 3600s
      - CAA record to restrict certificate authorities: `letsencrypt.org` for free certs
      - TXT records for SPF/DKIM/DMARC if using email
    - Set up SSL/TLS certificates (Let's Encrypt recommended for free automated certs)
    - Configure HSTS header with `max-age=63072000; includeSubDomains; preload`
    - Use ALIAS/ANAME record for apex domain (never CNAME at apex)
    - Enable DNSSEC if supported by registrar
    - Document DNS configuration in infrastructure as code (Terraform/Cloudflare API)

---

## [x] DOC-001: Review pending API specification contracts

- **Status:** Complete
- **Priority:** Medium
- **Domain:** DOC
- **Behavior:** Given the OpenAPI specification has drafted contracts for live streaming, collaboration, music, location, and gamification, when a human reviews them, then each contract is approved or revised with documented decisions.
- **Related Files:** `lib/api-spec/openapi.yaml`
- **Definition of Done:** All five pending API contracts are reviewed and approved; any required spec revisions are implemented; review decisions are documented.
- **Out of Scope:** Implementing the reviewed APIs (already complete for these features); choosing payment/streaming providers beyond contract semantics.
- **Rules to Follow:** Review each contract for consistency with existing endpoints, clarity of schemas, and feasibility of downstream implementation.
- **Advanced Coding Pattern:** SDD: consolidated review ensures the specification remains coherent across feature domains.
- **Anti-Patterns:** Approving contracts without reading them; leaving review decisions undocumented.
- **Imports/Exports:** None (review only).
- **Depends On:** None
- **Blocks:** LIV-003, MUS-003, future spec refinements

### Subtasks

- [x] **DOC-001.1 [HUMAN]**: Review live streaming contract.
  - Action: Confirm streaming protocol, gift types, and replay semantics in `lib/api-spec/openapi.yaml`.
  - Validation: Document approval or required changes for LIV-001.

- [x] **DOC-001.2 [HUMAN]**: Review collaboration contract.
  - Action: Confirm remix/duet semantics and collab approval flow.
  - Validation: Document approval or required changes for COL-001.

- [x] **DOC-001.3 [HUMAN]**: Review music integration contract.
  - Action: Confirm music service choice and preview URL semantics.
  - Validation: Document approval or required changes for MUS-001.

- [x] **DOC-001.4 [HUMAN]**: Review location features contract.
  - Action: Confirm privacy controls and map semantics.
  - Validation: Document approval or required changes for LOC-001.

- [x] **DOC-001.5 [HUMAN]**: Review gamification contract.
  - Action: Confirm poll/quiz structure and badge criteria.
  - Validation: Document approval or required changes for GAM-001.

### Notes

- Consolidated from LIV-001.2, COL-001.2, MUS-001.2, LOC-001.2, and GAM-001.2 to create a single review work item.
- **Review Findings (July 11, 2026):**
  - **Live Streaming Contract:** ✅ Approved. RTMP protocol is standard for streaming. Gift schema with monetary value conversion is sound. Replay semantics with enableRecording flag are clear. Chat pagination is consistent with other endpoints.
  - **Collaboration Contract:** ✅ Approved. Approval flow (pending → accepted/rejected/cancelled) is clear. Both authors credited on final post is appropriate. Consistent with existing friend request patterns.
  - **Music Integration Contract:** ✅ Approved. Search and share semantics are clear. External service integration pattern is sound. Preview URL exclusion due to licensing is appropriate. Rate limiting (429 response) is handled correctly. Note: MUS-003 requires actual Spotify/Apple Music API integration.
  - **Location Features Contract:** ✅ Approved. Privacy controls (audience lists, 24-hour expiration, excluded friends) are comprehensive. Map semantics are clear. Consistent with existing audience list patterns.
  - **Gamification Contract:** ✅ Approved. Polls (voting, expiration, anonymous/visible options), quizzes (questions, validation, aggregation), streaks (activity recording, grace periods), and badges (criteria, awarding) are all well-designed and consistent with existing patterns.

---

## [ ] TOOL-009: Run pending Drizzle migrations

- **Status:** Not Started
- **Priority:** High
- **Domain:** TOOL
- **Behavior:** Given schema changes exist in `lib/db`, when migrations are generated and applied, then the database schema matches the code.
- **Related Files:** `lib/db/drizzle`, `lib/db/drizzle.config.ts`, `lib/db/src/schema/*.ts`
- **Definition of Done:** All pending migrations are generated and applied; `drizzle-kit` commands execute successfully in the workspace.
- **Out of Scope:** Changing existing schema definitions.
- **Rules to Follow:** Use `pnpm exec drizzle-kit`; validate migrations against a test database before applying to production.
- **Advanced Coding Pattern:** Deep module: migration tooling hides schema evolution complexity.
- **Anti-Patterns:** Applying untested migrations to production; skipping migrations.
- **Imports/Exports:** None (tooling only).
- **Depends On:** None
- **Blocks:** Production deployment, database-dependent integration tests

### Subtasks

- [ ] **TOOL-009.1 [AGENT]**: Investigate drizzle-kit availability issue.
  - Files: `package.json`, `pnpm-workspace.yaml`, `lib/db/package.json`
  - Action: Ensure `drizzle-kit` is installed and resolvable in the workspace.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit --version` succeeds.

- [ ] **TOOL-009.2 [AGENT]**: Generate pending migrations.
  - File: `lib/db/drizzle/`
  - Action: Run `drizzle-kit generate` for each pending schema change from completed tasks.
  - Validation: Migration files are created for `liveStreams`, `audienceLists`, `posts` (collab), `profiles` (music), `locations`, `polls`, `streaks`, and `badges`.

- [ ] **TOOL-009.3 [AGENT]**: Apply migrations to the test database.
  - File: `lib/db/`
  - Action: Run `drizzle-kit migrate` against the test database.
  - Validation: Test database schema matches code; `pnpm --filter @workspace/db test` passes.

### Notes

- **Implementation Notes:** Created because LIV-002, AUD-002, COL-002, MUS-002, LOC-002, and GAM-002 all noted that database migrations were not run due to missing `drizzle-kit` command availability.

---

## [ ] TOOL-010: Fix lib/db profiles.test.ts failures

- **Status:** Not Started
- **Priority:** High
- **Domain:** TOOL
- **Behavior:** Given the test suite runs, when `profiles.test.ts` executes, then all tests pass.
- **Related Files:** `lib/db/src/repositories/profiles.test.ts`, `lib/db/src/schema/profiles.ts`
- **Definition of Done:** `profiles.test.ts` passes; no regressions in other `lib/db` tests.
- **Out of Scope:** Refactoring the profile repository public API.
- **Rules to Follow:** Fix the root cause, not symptoms; add regression tests if needed.
- **Advanced Coding Pattern:** Deep module: reliable tests build confidence in the data layer.
- **Anti-Patterns:** Skipping or weakening failing tests; masking failures with broad mocks.
- **Imports/Exports:** Fix types and imports in affected test files.
- **Depends On:** None
- **Blocks:** Reliable CI, database-dependent test suites

### Subtasks

- [ ] **TOOL-010.1 [AGENT]**: Investigate `profiles.test.ts` failures.
  - File: `lib/db/src/repositories/profiles.test.ts`
  - Action: Run the tests, identify failing assertions, and determine the root cause.
  - Validation: `pnpm --filter @workspace/db test -- profiles.test.ts` shows specific, understood failure reasons.

- [ ] **TOOL-010.2 [AGENT]**: Fix failing tests.
  - Files: `lib/db/src/repositories/profiles.test.ts`, `lib/db/src/schema/profiles.ts` if needed
  - Action: Fix schema, repository logic, or test assertions.
  - Validation: `pnpm --filter @workspace/db test -- profiles.test.ts` passes.

### Notes

- **Implementation Notes:** Created because TOOL-008, LOC-002, and GAM-002 repeatedly noted pre-existing failures in `lib/db/profiles.test.ts` as "unrelated to this task" and left them unfixed.

---

## [ ] TOOL-011: Audit and backfill missing prerequisite tasks in TODO.md

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** TOOL
- **Behavior:** Given `TODO.md` references task IDs that do not exist, when the audit completes, then each dependency is either documented or removed.
- **Related Files:** `TODO.md`
- **Definition of Done:** All `Depends On` and `Blocks` references in `TODO.md` resolve to documented tasks, or are justified as completed/removed.
- **Out of Scope:** Re-prioritizing existing tasks.
- **Rules to Follow:** Do not create placeholder tasks for already-completed work unless traceability requires it.
- **Advanced Coding Pattern:** Deep module: clear planning documentation reduces ambiguity.
- **Anti-Patterns:** Adding tasks for work already done; leaving dangling references.
- **Imports/Exports:** None (documentation only).
- **Depends On:** None
- **Blocks:** Accurate dependency tracking

### Subtasks

- [ ] **TOOL-011.1 [AGENT]**: Identify all dangling task references.
  - File: `TODO.md`
  - Action: Scan all `Depends On` and `Blocks` fields for task IDs not defined in `TODO.md`.
  - Validation: Produce a list of missing IDs (e.g., `AUTH-003`, `PST-003`, `PRF-002`, `AUD-001`, `SOC-003`, `SAF-002`, `USR-002`, `MON-001`, `MOB-*`, `USR-001`, `AUTH-001`, `DEP-001`, `CMT-002`, `FED-002`).

- [ ] **TOOL-011.2 [AGENT/HUMAN]**: Decide the fate of each missing task.
  - File: `TODO.md`
  - Action: For each missing ID, determine whether it is complete, deferred, or should be created.
  - Validation: Documented decision for every missing ID.

- [ ] **TOOL-011.3 [AGENT]**: Create missing prerequisite tasks or resolve references.
  - File: `TODO.md`
  - Action: Add task entries for missing prerequisites that are not complete, or remove references for completed/removed ones.
  - Validation: No dangling task IDs remain in `Depends On` or `Blocks` fields.

### Notes

- **Implementation Notes:** Created because multiple completed feature tasks note that dependencies such as `AUTH-003`, `PST-003`, `AUD-001`, and `MON-001` are "not present in TODO.md."

---

## [ ] LIV-003: Integrate live stream gifts with monetization

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** LIV
- **Behavior:** Given a viewer sends a gift during a live stream, when the gift is processed, then the creator's balance is updated transactionally.
- **Related Files:** `artifacts/api-server/src/services/liveService.ts`, `artifacts/api-server/src/routes/live.ts`, `lib/api-spec/openapi.yaml`
- **Definition of Done:** Gift processing uses `MonetizationService` instead of a stub; transactions are recorded; tests pass.
- **Out of Scope:** Full payout processing; tax handling.
- **Rules to Follow:** Gifts are transactional; validate gift type and amount; update creator balance.
- **Advanced Coding Pattern:** Deep module: gift processing delegates to `MonetizationService`.
- **Anti-Patterns:** Hardcoding gift values; not validating the creator/host.
- **Imports/Exports:** Import `MonetizationService`; update `liveService` gift method.
- **Depends On:** MON-002
- **Blocks:** Production live streaming

### Subtasks

- [ ] **LIV-003.1 [AGENT/HUMAN]**: Align gift schema with monetization.
  - File: `lib/api-spec/openapi.yaml`
  - Action: Ensure the live-stream gift schema matches the monetization gift schema.
  - Validation: Manual review of `lib/api-spec/openapi.yaml`; codegen validation after TOOL-003 is fixed.

- [ ] **LIV-003.2 [AGENT]**: Replace gift stub with `MonetizationService`.
  - File: `artifacts/api-server/src/services/liveService.ts`
  - Action: Call `MonetizationService` to record the gift and update the creator balance.
  - Validation: `pnpm --filter @workspace/api-server test -- liveService` passes.

- [ ] **LIV-003.3 [AGENT]**: Add gift integration tests.
  - File: `artifacts/api-server/src/services/liveService.test.ts` (new)
  - Action: Test gift sending, balance updates, and error cases.
  - Validation: Tests pass.

### Notes

- **Implementation Notes:** Created because LIV-002 noted that "gift processing is stubbed for future MON implementation."

---

## [ ] MUS-003: Integrate production music provider API

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MUS
- **Behavior:** Given a user searches for music, when the request is made, then results are fetched from a real provider (Spotify/Apple Music) and cached.
- **Related Files:** `artifacts/api-server/src/services/musicService.ts`, `lib/api-spec/openapi.yaml`, `.env.example`
- **Definition of Done:** Real provider API integration; rate limiting; caching; secrets configured; tests pass.
- **Out of Scope:** Full audio streaming; music licensing negotiation.
- **Rules to Follow:** Store only track IDs and metadata; respect provider terms and rate limits; use environment variables for API keys.
- **Advanced Coding Pattern:** Deep module: provider adapter pattern hides external API differences.
- **Anti-Patterns:** Hardcoding API keys; storing audio files; ignoring rate limits.
- **Imports/Exports:** Import provider SDK; export `MusicService`.
- **Depends On:** None
- **Blocks:** MYSP-001 production readiness

### Subtasks

- [ ] **MUS-003.1 [AGENT/HUMAN]**: Select music provider and obtain credentials.
  - Files: `.env.example`, `docs/`
  - Action: Choose Spotify/Apple Music; document API key setup.
  - Validation: Credentials available in the dev/staging environment.

- [ ] **MUS-003.2 [AGENT]**: Implement provider API client.
  - File: `artifacts/api-server/src/services/musicService.ts`
  - Action: Replace mock data with real provider calls; add adapter for Spotify/Apple Music/ISRC lookup.
  - Validation: `pnpm --filter @workspace/api-server test -- musicService` passes.

- [ ] **MUS-003.3 [AGENT]**: Verify caching and rate limiting.
  - File: `artifacts/api-server/src/services/musicService.ts`
  - Action: Ensure cache behavior and rate-limit handling remain correct against the real provider contract.
  - Validation: Existing caching and rate-limit tests pass.

### Notes

- **Implementation Notes:** Created because MUS-002 noted that the "Music service is currently a stub with mock data - requires actual Spotify/Apple Music API integration for production use."

---

## [ ] MON-001: Design creator monetization contract (API spec)

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MON
- **Behavior:** Given a client application, when it reads the OpenAPI spec, then it can discover endpoints for tips, subscriptions, gifts, and creator analytics.
- **Related Files:** `lib/api-spec/openapi.yaml`
- **Definition of Done:** Spec defines `POST /tips`, `POST /subscriptions`, `GET /subscriptions/tiers`, `POST /gifts`, `GET /creator/analytics`; monetization schemas include amounts, tiers, and revenue breakdown.
- **Out of Scope:** Payout processing; tax handling.
- **Rules to Follow:** Use Stripe or similar for payments; subscriptions are recurring; tips are one-time; gifts have virtual-to-real conversion rates.
- **Advanced Coding Pattern:** SDD: monetization contract drives both API and mobile creator dashboard.
- **Anti-Patterns:** Handling payments directly; not validating subscription tiers.
- **Imports/Exports:** Export updated `openapi.yaml`.
- **Depends On:** USR-001, AUTH-001
- **Blocks:** MON-002

### Subtasks

- [ ] **MON-001.1 [AGENT/HUMAN]**: Draft monetization endpoints in OpenAPI.
  - File: `lib/api-spec/openapi.yaml`
  - Action: Add tip, subscription, gift, and analytics paths and schemas.
  - Validation: `pnpm --filter @workspace/api-spec run codegen`.

- [ ] **MON-001.2 [HUMAN]**: Review monetization contract.
  - Action: Confirm payment processor choice and revenue split.
  - Validation: Manual review of `lib/api-spec/openapi.yaml`.

---

## [ ] MON-002: Implement creator monetization API

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MON
- **Behavior:** Given an authenticated user, when they tip a creator, then the payment is processed and the creator's balance increases; when they subscribe, then recurring payments are set up; when they send a gift, then virtual currency is converted.
- **Related Files:** `artifacts/api-server/src/routes/monetization.ts` (new), `artifacts/api-server/src/services/monetizationService.ts` (new), `lib/db/src/schema/subscriptions.ts` (new), `lib/db/src/schema/tips.ts` (new), `lib/db/src/schema/gifts.ts` (new)
- **Definition of Done:** Subscriptions, tips, and gifts tables; Stripe integration; API for all monetization actions; creator analytics; tests pass.
- **Out of Scope:** Payout processing; tax handling.
- **Rules to Follow:** Use Stripe for payments; store only transaction IDs, not card details; track revenue per creator.
- **Advanced Coding Pattern:** Deep module: `MonetizationService` hides Stripe integration and revenue calculation.
- **Anti-Patterns:** Storing card details; not validating payment success.
- **Imports/Exports:** Import Stripe SDK, `lib/db`, `requireAuth`; export `monetizationRouter`, `MonetizationService`.
- **Depends On:** MON-001, AUTH-003
- **Blocks:** None

### Subtasks

- [ ] **MON-002.1 [AGENT]**: Define monetization tables.
  - Files: `lib/db/src/schema/subscriptions.ts` (new), `lib/db/src/schema/tips.ts` (new), `lib/db/src/schema/gifts.ts` (new)
  - Action: Create tables for subscriptions, tips, and gifts.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_monetization`.

- [ ] **MON-002.2 [AGENT]**: Implement `MonetizationService`.
  - File: `artifacts/api-server/src/services/monetizationService.ts` (new)
  - Action: Integrate with Stripe; implement tip, subscription, gift, and analytics methods.
  - Validation: `pnpm --filter @workspace/api-server test -- monetizationService`.

- [ ] **MON-002.3 [AGENT]**: Implement monetization routes.
  - File: `artifacts/api-server/src/routes/monetization.ts` (new)
  - Action: Wire monetization endpoints with `requireAuth`.
  - Validation: `pnpm --filter @workspace/api-server test -- monetization.routes`.

---

## [ ] MYSP-001: Implement auto-play profile song

- **Status:** Not Started
- **Priority:** High
- **Domain:** MYSP
- **Behavior:** Given a user visits a profile, when the profile has a song set, then the song preview plays automatically (with a mute toggle); when the user mutes, then the preference is remembered.
- **Related Files:** `artifacts/mobile/components/ProfileMusicPlayer.tsx` (new), `artifacts/mobile/app/edit-profile.tsx`, `artifacts/mobile/context/SettingsContext.tsx` (new)
- **Definition of Done:** Profile music player component with play/pause/mute; integration with MUS-002; per-profile song setting; mute preference persisted; mobile tests pass.
- **Out of Scope:** Full music playback; playlist support.
- **Rules to Follow:** Auto-play should respect OS autoplay policies; provide clear mute button; do not auto-play on cellular data by default.
- **Advanced Coding Pattern:** Deep module: `ProfileMusicPlayer` hides audio player state and preference persistence.
- **Anti-Patterns:** Auto-playing without user consent; not respecting mute preference.
- **Imports/Exports:** Import `expo-av`, `useSocialData`; export `ProfileMusicPlayer`.
- **Depends On:** MOB-003
- **Blocks:** None

### Subtasks

- [ ] **MYSP-001.1 [AGENT]**: Create `ProfileMusicPlayer` component.
  - File: `artifacts/mobile/components/ProfileMusicPlayer.tsx` (new)
  - Action: Implement audio player with play/pause/mute controls.
  - Validation: `pnpm --filter @workspace/mobile test -- ProfileMusicPlayer`.

- [ ] **MYSP-001.2 [AGENT]**: Add song picker to edit profile.
  - File: `artifacts/mobile/app/edit-profile.tsx`
  - Action: Add music search and selection UI.
  - Validation: Manual test of profile song selection.

- [ ] **MYSP-001.3 [AGENT]**: Integrate player into profile header.
  - File: `artifacts/mobile/components/ProfileHeader.tsx`
  - Action: Add `ProfileMusicPlayer` to profile view.
  - Validation: Manual test of auto-play on profile visit.

---

## [ ] MYSP-002: Enhance Top Friends with ranking and history

- **Status:** Not Started
- **Priority:** High
- **Domain:** MYSP
- **Behavior:** Given a user edits their Top Friends, when they reorder friends, then the new order is persisted and visible to all profile visitors; when a friend is removed, then a history log is kept.
- **Related Files:** `lib/db/src/schema/topFriends.ts` (new), `artifacts/api-server/src/services/topFriendsService.ts` (new), `artifacts/mobile/components/TopFriendsGrid.tsx`, `artifacts/mobile/app/edit-profile.tsx`
- **Definition of Done:** Top friends table with order and history; API for CRUD; mobile UI for reordering; history view; tests pass.
- **Out of Scope:** Top Friends beyond 8 (configurable limit).
- **Rules to Follow:** Top Friends is limited to 8 (or configurable); order is 1-indexed; history shows additions/removals with timestamps.
- **Advanced Coding Pattern:** Deep module: `TopFriendsService` hides ordering logic and history tracking.
- **Anti-Patterns:** Allowing unlimited Top Friends; not tracking history.
- **Imports/Exports:** Import `lib/db`, `requireAuth`; export `topFriendsRouter`, `TopFriendsService`.
- **Depends On:** SOC-003, AUTH-003
- **Blocks:** None

### Subtasks

- [ ] **MYSP-002.1 [AGENT]**: Define top friends table with history.
  - File: `lib/db/src/schema/topFriends.ts` (new)
  - Action: Create columns: `userId`, `friendId`, `order`, `addedAt`, `removedAt` (nullable).
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_top_friends_history`.

- [ ] **MYSP-002.2 [AGENT]**: Implement `TopFriendsService`.
  - File: `artifacts/api-server/src/services/topFriendsService.ts` (new)
  - Action: Implement CRUD with ordering and history tracking.
  - Validation: `pnpm --filter @workspace/api-server test -- topFriendsService`.

- [ ] **MYSP-002.3 [AGENT]**: Implement top friends API routes.
  - File: `artifacts/api-server/src/routes/topFriends.ts` (new)
  - Action: Wire top friends endpoints with `requireAuth`.
  - Validation: `pnpm --filter @workspace/api-server test -- topFriends.routes`.

- [ ] **MYSP-002.4 [AGENT]**: Enhance mobile Top Friends UI with reordering.
  - Files: `artifacts/mobile/components/TopFriendsGrid.tsx`, `artifacts/mobile/app/edit-profile.tsx`
  - Action: Add drag-and-drop reordering and history view.
  - Validation: Manual test of reordering and history.

---

## [ ] MYSP-003: Enhance mood/status line with rich display

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MYSP
- **Behavior:** Given a user sets their mood, when visitors view the profile, then the mood icon and label are displayed prominently; when the user sets "now playing," then the song is shown with a rich card.
- **Related Files:** `artifacts/mobile/components/MoodBadge.tsx`, `artifacts/mobile/app/edit-profile.tsx`, `lib/db/src/schema/profiles.ts`
- **Definition of Done:** Enhanced mood component with icon picker; now playing integration with MUS-002; visibility controls; mobile tests pass.
- **Out of Scope:** Custom mood icons beyond preset list.
- **Rules to Follow:** Mood is optional; now playing links to music service; visibility follows module settings.
- **Advanced Coding Pattern:** Deep module: `MoodBadge` hides icon rendering and music card integration.
- **Anti-Patterns:** Hardcoding mood icons; not linking now playing to music service.
- **Imports/Exports:** Import `useSocialData`, music SDK; export `MoodBadge`.
- **Depends On:** MOB-003
- **Blocks:** None

### Subtasks

- [ ] **MYSP-003.1 [AGENT]**: Enhance `MoodBadge` component.
  - File: `artifacts/mobile/components/MoodBadge.tsx`
  - Action: Add icon picker and now playing rich card.
  - Validation: `pnpm --filter @workspace/mobile test -- MoodBadge`.

- [ ] **MYSP-003.2 [AGENT]**: Add mood picker to edit profile.
  - File: `artifacts/mobile/app/edit-profile.tsx`
  - Action: Add mood selection UI with icon grid.
  - Validation: Manual test of mood selection.

---

## [ ] MYSP-004: Implement profile themes and custom CSS

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MYSP
- **Behavior:** Given a user wants to customize their profile, when they select a theme or paste custom CSS, then the profile rendering applies the styles with a preview.
- **Related Files:** `artifacts/mobile/lib/theme.ts`, `artifacts/mobile/app/edit-profile.tsx`, `artifacts/mobile/components/ThemePreview.tsx` (new)
- **Definition of Done:** Theme marketplace with presets; custom CSS editor; preview mode; CSS sanitization; mobile tests pass.
- **Out of Scope:** User-generated theme sharing.
- **Rules to Follow:** Sanitize custom CSS to prevent XSS; limit CSS to profile-scoped selectors; provide theme presets for non-technical users.
- **Advanced Coding Pattern:** Deep module: `ThemeManager` hides CSS sanitization and theme application.
- **Anti-Patterns:** Allowing arbitrary CSS without sanitization; not providing presets.
- **Imports/Exports:** Import CSS sanitizer library; export `ThemeManager`, `ThemePreview`.
- **Depends On:** MOB-003
- **Blocks:** None

### Subtasks

- [ ] **MYSP-004.1 [AGENT]**: Create theme marketplace presets.
  - File: `artifacts/mobile/lib/theme.ts`
  - Action: Add theme presets with CSS and metadata.
  - Validation: Manual test of theme selection.

- [ ] **MYSP-004.2 [AGENT]**: Implement custom CSS editor.
  - File: `artifacts/mobile/components/CSSEditor.tsx` (new)
  - Action: Add code editor with syntax highlighting and validation.
  - Validation: `pnpm --filter @workspace/mobile test -- CSSEditor`.

- [ ] **MYSP-004.3 [AGENT]**: Add theme preview to edit profile.
  - File: `artifacts/mobile/app/edit-profile.tsx`
  - Action: Integrate theme selection and custom CSS with preview.
  - Validation: Manual test of theme preview.

---

## [ ] MYSP-005: Implement bulletins and blog posts

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MYSP
- **Behavior:** Given a user writes a bulletin, when they publish it, then it appears on their profile and can be shared with friends; when friends comment, then comments are threaded.
- **Related Files:** `artifacts/api-server/src/routes/bulletins.ts` (new), `artifacts/api-server/src/services/bulletinService.ts` (new), `lib/db/src/schema/bulletins.ts` (new), `artifacts/mobile/app/bulletin/` (new)
- **Definition of Done:** Bulletins table with rich text; API for CRUD; mobile bulletin list and detail views; comment threading; tests pass.
- **Out of Scope:** Bulletin categories; bulletin search.
- **Rules to Follow:** Bulletins are long-form posts on profile; visibility follows module settings; comments reuse CMT-002.
- **Advanced Coding Pattern:** Deep module: `BulletinService` hides rich text parsing and visibility filtering.
- **Anti-Patterns:** Treating bulletins as regular posts; not respecting module visibility.
- **Imports/Exports:** Import `lib/db`, `requireAuth`; export `bulletinRouter`, `BulletinService`.
- **Depends On:** CMT-002, AUTH-003, PRF-002
- **Blocks:** None

### Subtasks

- [ ] **MYSP-005.1 [AGENT]**: Define bulletins table.
  - File: `lib/db/src/schema/bulletins.ts` (new)
  - Action: Create columns: `id`, `authorId`, `title`, `content` (rich text), `visibility`, `createdAt`, `updatedAt`.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_bulletins`.

- [ ] **MYSP-005.2 [AGENT]**: Implement `BulletinService`.
  - File: `artifacts/api-server/src/services/bulletinService.ts` (new)
  - Action: Implement bulletin CRUD with visibility filtering.
  - Validation: `pnpm --filter @workspace/api-server test -- bulletinService`.

- [ ] **MYSP-005.3 [AGENT]**: Implement bulletin API routes.
  - File: `artifacts/api-server/src/routes/bulletins.ts` (new)
  - Action: Wire bulletin endpoints with `requireAuth`.
  - Validation: `pnpm --filter @workspace/api-server test -- bulletin.routes`.

- [ ] **MYSP-005.4 [AGENT]**: Implement mobile bulletin screens.
  - Files: `artifacts/mobile/app/bulletin/index.tsx` (new), `artifacts/mobile/app/bulletin/[id].tsx` (new)
  - Action: Create bulletin list and detail views with comments.
  - Validation: Manual test of bulletin creation and viewing.

---

## [ ] MYSP-006: Implement quizzes and surveys

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MYSP
- **Behavior:** Given a user creates a quiz, when they publish it, then friends can take it and results are displayed on the profile; when a user shares a survey, then answers are aggregated.
- **Related Files:** `artifacts/api-server/src/routes/quizzes.ts` (new), `artifacts/api-server/src/services/quizService.ts` (new), `lib/db/src/schema/quizzes.ts` (new), `artifacts/mobile/components/QuizCard.tsx` (new)
- **Definition of Done:** Quizzes table with questions and answers; API for create and take; mobile quiz UI; result aggregation; tests pass.
- **Out of Scope:** Quiz templates; quiz sharing beyond profile.
- **Rules to Follow:** Quizzes are attached to profile; results are aggregated and displayed; answers are anonymous unless specified.
- **Advanced Coding Pattern:** Deep module: `QuizService` hides answer validation and result calculation.
- **Anti-Patterns:** Storing PII in quiz answers; not validating question types.
- **Imports/Exports:** Import `lib/db`, `requireAuth`; export `quizRouter`, `QuizService`.
- **Depends On:** AUTH-003, PRF-002
- **Blocks:** None

### Subtasks

- [ ] **MYSP-006.1 [AGENT]**: Define quizzes table.
  - File: `lib/db/src/schema/quizzes.ts` (new)
  - Action: Create columns: `id`, `authorId`, `title`, `questions` (jsonb), `results` (jsonb), `createdAt`.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_quizzes`.

- [ ] **MYSP-006.2 [AGENT]**: Implement `QuizService`.
  - File: `artifacts/api-server/src/services/quizService.ts` (new)
  - Action: Implement quiz creation, taking, and result aggregation.
  - Validation: `pnpm --filter @workspace/api-server test -- quizService`.

- [ ] **MYSP-006.3 [AGENT]**: Implement quiz API routes.
  - File: `artifacts/api-server/src/routes/quizzes.ts` (new)
  - Action: Wire quiz endpoints with `requireAuth`.
  - Validation: `pnpm --filter @workspace/api-server test -- quiz.routes`.

- [ ] **MYSP-006.4 [AGENT]**: Implement mobile quiz UI.
  - Files: `artifacts/mobile/components/QuizCard.tsx` (new), `artifacts/mobile/app/quiz/[id].tsx` (new)
  - Action: Create quiz taking and result views.
  - Validation: Manual test of quiz creation and taking.

---

## [ ] MYSP-007: Implement "Who I'd like to meet" and interests

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MYSP
- **Behavior:** Given a user edits their profile, when they fill in "Who I'd like to meet" and interests fields, then these are displayed on the profile with rich formatting.
- **Related Files:** `lib/db/src/schema/profiles.ts`, `artifacts/mobile/components/ProfileAboutCard.tsx` (new), `artifacts/mobile/app/edit-profile.tsx`
- **Definition of Done:** Profile schema extended with interests fields; mobile UI for editing and displaying; rich text support; tests pass.
- **Out of Scope:** Interest matching/suggestions.
- **Rules to Follow:** Fields are optional; display follows module visibility; support links and hashtags.
- **Advanced Coding Pattern:** Deep module: `ProfileAboutCard` hides rich text rendering and field grouping.
- **Anti-Patterns:** Hardcoding field labels; not supporting rich text.
- **Imports/Exports:** Import `useSocialData`; export `ProfileAboutCard`.
- **Depends On:** PRF-002, MOB-003
- **Blocks:** None

### Subtasks

- [ ] **MYSP-007.1 [AGENT]**: Extend profiles table with interests fields.
  - File: `lib/db/src/schema/profiles.ts`
  - Action: Add `whoIdLikeToMeet`, `interests`, `heroes`, `books`, `music` columns.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_interests`.

- [ ] **MYSP-007.2 [AGENT]**: Implement `ProfileAboutCard` component.
  - File: `artifacts/mobile/components/ProfileAboutCard.tsx` (new)
  - Action: Create component to display interests with rich formatting.
  - Validation: `pnpm --filter @workspace/mobile test -- ProfileAboutCard`.

- [ ] **MYSP-007.3 [AGENT]**: Add interests editor to edit profile.
  - File: `artifacts/mobile/app/edit-profile.tsx`
  - Action: Add form fields for interests with rich text input.
  - Validation: Manual test of interests editing.

---

## [ ] MYSP-008: Implement friend categorization

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MYSP
- **Behavior:** Given a user categorizes their friends, when they assign labels (e.g., Family, Classmates), then they can filter their friends list and show profile modules to specific categories.
- **Related Files:** `lib/db/src/schema/friendCategories.ts` (new), `artifacts/api-server/src/services/friendCategoryService.ts` (new), `artifacts/mobile/app/edit-profile.tsx`, `artifacts/mobile/app/friends-list.tsx`
- **Definition of Done:** Friend categories table; API for CRUD; mobile UI for assigning categories; category filtering in friends list; module visibility by category; tests pass.
- **Out of Scope:** Category suggestions; category analytics.
- **Rules to Follow:** Categories are per-user; a friend can be in multiple categories; module visibility can be set per category.
- **Advanced Coding Pattern:** Deep module: `FriendCategoryService` hides category assignment and visibility filtering.
- **Anti-Patterns:** Making categories global; not allowing multiple categories per friend.
- **Imports/Exports:** Import `lib/db`, `requireAuth`; export `friendCategoryRouter`, `FriendCategoryService`.
- **Depends On:** SOC-003, AUTH-003, PRF-002
- **Blocks:** None

### Subtasks

- [ ] **MYSP-008.1 [AGENT]**: Define friend categories table.
  - File: `lib/db/src/schema/friendCategories.ts` (new)
  - Action: Create columns: `userId`, `friendId`, `categoryLabel`, `createdAt`.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_friend_categories`.

- [ ] **MYSP-008.2 [AGENT]**: Implement `FriendCategoryService`.
  - File: `artifacts/api-server/src/services/friendCategoryService.ts` (new)
  - Action: Implement category CRUD and filtering.
  - Validation: `pnpm --filter @workspace/api-server test -- friendCategoryService`.

- [ ] **MYSP-008.3 [AGENT]**: Implement friend category API routes.
  - File: `artifacts/api-server/src/routes/friendCategories.ts` (new)
  - Action: Wire category endpoints with `requireAuth`.
  - Validation: `pnpm --filter @workspace/api-server test -- friendCategory.routes`.

- [ ] **MYSP-008.4 [AGENT]**: Add category UI to mobile.
  - Files: `artifacts/mobile/app/edit-profile.tsx`, `artifacts/mobile/app/friends-list.tsx`
  - Action: Add category assignment and filtering UI.
  - Validation: Manual test of category assignment and filtering.

---

## [ ] PRIV-001: Implement block, mute, and restrict

- **Status:** Not Started
- **Priority:** High
- **Domain:** PRIV
- **Behavior:** Given an authenticated user, when they block another user, then all interactions are prevented and content is hidden; when they mute, then content is hidden but interactions remain; when they restrict, then comments are limited.
- **Related Files:** `artifacts/mobile/app/settings.tsx` (new), `artifacts/mobile/components/BlockSheet.tsx` (new)
- **Definition of Done:** Mobile settings screen with block/mute/restrict options; integration with SAF-002 API; confirmation dialogs; tests pass.
- **Out of Scope:** Restrict modes beyond comments.
- **Rules to Follow:** Block requires confirmation; mute is silent; restrict limits comment visibility.
- **Advanced Coding Pattern:** Deep module: `BlockSheet` hides API calls and confirmation logic.
- **Anti-Patterns:** Not confirming block action; not persisting mute preference.
- **Imports/Exports:** Import `api-client-react`, `useSocialData`; export `BlockSheet`.
- **Depends On:** SAF-002, MOB-002
- **Blocks:** None

### Subtasks

- [ ] **PRIV-001.1 [AGENT]**: Create settings screen.
  - File: `artifacts/mobile/app/settings.tsx` (new)
  - Action: Create settings screen with account and privacy sections.
  - Validation: `pnpm --filter @workspace/mobile test -- settings`.

- [ ] **PRIV-001.2 [AGENT]**: Create block/mute/restrict sheet.
  - File: `artifacts/mobile/components/BlockSheet.tsx` (new)
  - Action: Create bottom sheet with block, mute, and restrict options.
  - Validation: `pnpm --filter @workspace/mobile test -- BlockSheet`.

- [ ] **PRIV-001.3 [AGENT]**: Integrate safety API into mobile.
  - Files: `artifacts/mobile/app/settings.tsx`, `artifacts/mobile/components/BlockSheet.tsx`
  - Action: Wire SAF-002 API calls.
  - Validation: Manual test of block/mute/restrict actions.

---

## [ ] PRIV-002: Implement content warnings and age gating

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** PRIV
- **Behavior:** Given a user creates sensitive content, when they add a content warning, then viewers must dismiss the warning before viewing; given a user is under 18, when they encounter age-gated content, then it is hidden.
- **Related Files:** `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/contentWarningService.ts` (new), `artifacts/mobile/components/ContentWarning.tsx` (new)
- **Definition of Done:** Posts table extended with content warning and age gate flags; API for setting warnings; mobile warning overlay; age verification; tests pass.
- **Out of Scope:** Automated content classification.
- **Rules to Follow:** Content warnings are set by creators; age gating is based on birthdate; warnings can be dismissed per session.
- **Advanced Coding Pattern:** Deep module: `ContentWarning` hides warning logic and age verification.
- **Anti-Patterns:** Not respecting dismissed warnings; not enforcing age gates.
- **Imports/Exports:** Import `api-client-react`, `useSocialData`; export `ContentWarning`.
- **Depends On:** PST-003, AUTH-003
- **Blocks:** None

### Subtasks

- [ ] **PRIV-002.1 [AGENT]**: Extend posts table with content warning fields.
  - File: `lib/db/src/schema/posts.ts`
  - Action: Add `contentWarning`, `isAgeGated` columns.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_content_warnings`.

- [ ] **PRIV-002.2 [AGENT]**: Implement `ContentWarningService`.
  - File: `artifacts/api-server/src/services/contentWarningService.ts` (new)
  - Action: Implement content warning validation and age gate checks.
  - Validation: `pnpm --filter @workspace/api-server test -- contentWarningService`.

- [ ] **PRIV-002.3 [AGENT]**: Create content warning overlay component.
  - File: `artifacts/mobile/components/ContentWarning.tsx` (new)
  - Action: Create overlay with dismiss button and age verification.
  - Validation: `pnpm --filter @workspace/mobile test -- ContentWarning`.

---

## [ ] PRIV-003: Implement privacy and account settings

- **Status:** Not Started
- **Priority:** High
- **Domain:** PRIV
- **Behavior:** Given a user accesses settings, when they change privacy preferences, then these are persisted; when they request account deletion, then data is queued for deletion.
- **Related Files:** `artifacts/mobile/app/settings.tsx`, `artifacts/api-server/src/routes/account.ts` (new), `lib/db/src/schema/users.ts`
- **Definition of Done:** Settings screen with privacy toggles; API for account deletion; data export; deactivate account; tests pass.
- **Out of Scope:** Immediate data deletion (use async deletion).
- **Rules to Follow:** Account deletion requires confirmation; data export is a ZIP file; deactivation is reversible.
- **Advanced Coding Pattern:** Deep module: `SettingsService` hides deletion queue and export generation.
- **Anti-Patterns:** Deleting data immediately without confirmation; not offering data export.
- **Imports/Exports:** Import `api-client-react`, `useSocialData`; export `SettingsService`.
- **Depends On:** AUTH-003, USR-002
- **Blocks:** None

### Subtasks

- [ ] **PRIV-003.1 [AGENT]**: Extend users table with account status.
  - File: `lib/db/src/schema/users.ts`
  - Action: Add `accountStatus`, `deletionRequestedAt` columns.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_account_status`.

- [ ] **PRIV-003.2 [AGENT]**: Implement account API routes.
  - File: `artifacts/api-server/src/routes/account.ts` (new)
  - Action: Wire account deletion, data export, and deactivate endpoints.
  - Validation: `pnpm --filter @workspace/api-server test -- account.routes`.

- [ ] **PRIV-003.3 [AGENT]**: Add privacy settings to mobile.
  - File: `artifacts/mobile/app/settings.tsx`
  - Action: Add privacy toggles and account actions.
  - Validation: Manual test of settings changes.

---

## [ ] ACC-001: Implement accessibility and theming

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** ACC
- **Behavior:** Given a user enables accessibility features, when they navigate the app, then text is scaled, colors have high contrast, and screen readers work correctly.
- **Related Files:** `artifacts/mobile/lib/theme.ts`, `artifacts/mobile/app/settings.tsx`
- **Definition of Done:** Dark mode support; high contrast theme; font scaling; screen reader labels; color contrast compliance; tests pass.
- **Out of Scope:** Voice control; Braille support.
- **Rules to Follow:** Support system font scaling; provide alt text for images; use semantic colors; test with screen reader.
- **Advanced Coding Pattern:** Deep module: `ThemeManager` hides theme switching and accessibility logic.
- **Anti-Patterns:** Hardcoding font sizes; not providing alt text.
- **Imports/Exports:** Import `react-native-accessibility`, `useColorScheme`; export `ThemeManager`.
- **Depends On:** MOB-003
- **Blocks:** None

### Subtasks

- [ ] **ACC-001.1 [AGENT]**: Add dark mode and high contrast themes.
  - File: `artifacts/mobile/lib/theme.ts`
  - Action: Add dark mode and high contrast color palettes.
  - Validation: Manual test of theme switching.

- [ ] **ACC-001.2 [AGENT]**: Add font scaling support.
  - File: `artifacts/mobile/lib/theme.ts`
  - Action: Use `PixelRatio` and `AccessibilityInfo` for font scaling.
  - Validation: Manual test of font scaling.

- [ ] **ACC-001.3 [AGENT]**: Add screen reader labels.
  - Files: `artifacts/mobile/components/*.tsx`
  - Action: Add `accessibilityLabel` and `accessibilityHint` to interactive elements.
  - Validation: Manual test with screen reader.

---

## [ ] ADM-001: Implement admin and moderation dashboard

- **Status:** Not Started
- **Priority:** Low
- **Domain:** ADM
- **Behavior:** Given an admin user logs in, when they access the dashboard, then they can review reports, suspend users, and view analytics.
- **Related Files:** `artifacts/admin/` (new), `artifacts/api-server/src/routes/admin.ts` (new), `artifacts/api-server/src/services/adminService.ts` (new)
- **Definition of Done:** Admin dashboard UI; API for report review and user suspension; analytics views; role-based access; tests pass.
- **Out of Scope:** Automated moderation; bulk actions.
- **Rules to Follow:** Admin actions are logged; suspensions require reason; analytics are aggregated.
- **Advanced Coding Pattern:** Deep module: `AdminService` hides permission checks and audit logging.
- **Anti-Patterns:** Allowing non-admins to access dashboard; not logging admin actions.
- **Imports/Exports:** Import `lib/db`, `requireAuth`; export `adminRouter`, `AdminService`.
- **Depends On:** SAF-002, AUTH-003
- **Blocks:** None

### Subtasks

- [ ] **ADM-001.1 [AGENT]**: Define admin roles table.
  - File: `lib/db/src/schema/adminRoles.ts` (new)
  - Action: Create columns: `userId`, `role`, `grantedAt`, `grantedBy`.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_admin_roles`.

- [ ] **ADM-001.2 [AGENT]**: Implement `AdminService`.
  - File: `artifacts/api-server/src/services/adminService.ts` (new)
  - Action: Implement report review, user suspension, and analytics methods.
  - Validation: `pnpm --filter @workspace/api-server test -- adminService`.

- [ ] **ADM-001.3 [AGENT]**: Implement admin API routes.
  - File: `artifacts/api-server/src/routes/admin.ts` (new)
  - Action: Wire admin endpoints with role-based middleware.
  - Validation: `pnpm --filter @workspace/api-server test -- admin.routes`.

- [ ] **ADM-001.4 [AGENT]**: Create admin dashboard UI.
  - Files: `artifacts/admin/src/` (new)
  - Action: Create web-based admin dashboard with report review and analytics.
  - Validation: Manual test of admin actions.

---

## [ ] WEB-001: Implement web companion and PWA

- **Status:** Not Started
- **Priority:** Low
- **Domain:** WEB
- **Behavior:** Given a user visits the web app, when they navigate to a profile or feed, then they can view content without the mobile app; when they install the PWA, then it works offline.
- **Related Files:** `artifacts/web/` (new), `artifacts/web/src/` (new)
- **Definition of Done:** Web app with profile and feed views; PWA manifest; service worker for offline; responsive design; tests pass.
- **Out of Scope:** Full feature parity with mobile; web post creation.
- **Rules to Follow:** Web app is read-only initially; PWA supports offline viewing of cached content; use Next.js or similar.
- **Advanced Coding Pattern:** Deep module: `WebApp` hides PWA configuration and service worker logic.
- **Anti-Patterns:** Not making it responsive; not supporting PWA installation.
- **Imports/Exports:** Export web app artifacts.
- **Depends On:** FED-002, PRF-002
- **Blocks:** None

### Subtasks

- [ ] **WEB-001.1 [AGENT]**: Set up web app framework.
  - File: `artifacts/web/package.json` (new)
  - Action: Initialize Next.js or similar framework.
  - Validation: `pnpm --filter @workspace/web run dev` starts the server.

- [ ] **WEB-001.2 [AGENT]**: Implement profile and feed views.
  - Files: `artifacts/web/src/app/profile/[handle]/page.tsx` (new), `artifacts/web/src/app/feed/page.tsx` (new)
  - Action: Create web views for profiles and feed using API client.
  - Validation: Manual test of profile and feed viewing.

- [ ] **WEB-001.3 [AGENT]**: Add PWA manifest and service worker.
  - Files: `artifacts/web/public/manifest.json` (new), `artifacts/web/src/sw.ts` (new)
  - Action: Configure PWA manifest and service worker for offline support.
  - Validation: Manual test of PWA installation and offline viewing.

---

## [ ] FED-003: Add user-controlled feed preferences

- **Status:** Not Started
- **Priority:** High
- **Domain:** FED
- **Behavior:** Given an authenticated user, when they choose a feed mode or tune topic preferences, then the feed is rebuilt according to those preferences and persisted.
- **Related Files:** `artifacts/api-server/src/services/feedService.ts`, `artifacts/api-server/src/routes/feed.ts`, `lib/db/src/schema/profiles.ts`, `artifacts/mobile/hooks/useFeed.ts`, `artifacts/mobile/app/(tabs)/index.tsx`
- **Definition of Done:** Feed supports modes `chronological`, `algorithmic`, `friendsOnly`, and `topicFocused`; topic weights are persisted on the profile; mobile feed has a mode/topic selector; tests pass.
- **Out of Scope:** Full ML recommendation engine; feed preference UI theming.
- **Rules to Follow:** Preferences are user-owned and exportable with the profile; default mode is chronological to align with research on user fatigue.
- **Advanced Coding Pattern:** Deep module: `FeedService` hides ranking strategy selection behind a single `getFeed(input)` interface.
- **Anti-Patterns:** Hard-coding algorithm weights without user control; mixing preference persistence with engagement logic.
- **Imports/Exports:** Export `FeedPreferenceService` and feed-mode enums from `feedService.ts`; update `ProfileUpdateRequest` schema.
- **Depends On:** FED-002, PRF-002
- **Blocks:** FED-004

### Initial File Analysis and Research

- [ ] **FED-003.R [AGENT]**: Analyze current feed ranking and profile schema.
  - Files: `artifacts/api-server/src/services/feedService.ts`, `lib/db/src/schema/profiles.ts`
  - Action: Confirm feed is chronological, document where to inject ranking strategies, and verify profile JSONB module settings can hold feed preferences.
  - Validation: Written summary of current ranking logic and proposed preference schema.

### Subtasks

- [ ] **FED-003.1 [AGENT]**: Add feed preference columns to profiles.
  - File: `lib/db/src/schema/profiles.ts`
  - Action: Add `feedMode` and `feedTopicWeights` columns or extend module settings; generate migration.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_feed_preferences` succeeds.

- [ ] **FED-003.2 [AGENT]**: Implement feed ranking strategies.
  - File: `artifacts/api-server/src/services/feedService.ts`
  - Action: Add strategy functions for `chronological`, `algorithmic`, `friendsOnly`, `topicFocused`; route selects strategy from user preference.
  - Validation: `pnpm --filter @workspace/api-server test -- feedService` passes.

- [ ] **FED-003.3 [AGENT]**: Expose preference endpoints.
  - File: `artifacts/api-server/src/routes/feed.ts`
  - Action: Add `GET /feed/preferences` and `PATCH /feed/preferences`.
  - Validation: `pnpm --filter @workspace/api-server test -- feed.routes` passes.

- [ ] **FED-003.4 [AGENT]**: Add feed mode selector to mobile.
  - Files: `artifacts/mobile/hooks/useFeed.ts`, `artifacts/mobile/app/(tabs)/index.tsx`
  - Action: Add UI for mode selection and topic sliders; persist via preference endpoints.
  - Validation: `pnpm --filter @workspace/mobile test -- useFeed` passes.

---

## [ ] FED-004: Add "Why am I seeing this?" transparency

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** FED
- **Behavior:** Given a user views a recommended post, when they open the explanation menu, then they see a human-readable reason for the recommendation.
- **Related Files:** `artifacts/api-server/src/services/feedService.ts`, `artifacts/api-server/src/routes/feed.ts`, `artifacts/mobile/components/PostCard.tsx`
- **Definition of Done:** Each feed post includes a `recommendationReason` field; mobile shows an explanation affordance; tests pass.
- **Out of Scope:** Full algorithm explainability dashboard; legal compliance copy.
- **Rules to Follow:** Reasons are short and non-technical; do not leak private signals about other users.
- **Advanced Coding Pattern:** Deep module: ranking strategy returns opaque reason tokens that the presentation layer maps to copy.
- **Anti-Patterns:** Exposing raw recommendation scores or other users' behavior.
- **Imports/Exports:** Export `RecommendationReason` type from `feedService.ts`.
- **Depends On:** FED-003
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **FED-004.R [AGENT]**: Survey how ranking reasons can be captured.
  - File: `artifacts/api-server/src/services/feedService.ts`
  - Action: Identify ranking signals already available (friendship, topic, engagement, recency) and design reason tokens.
  - Validation: Documented list of reason tokens and mapping rules.

### Subtasks

- [ ] **FED-004.1 [AGENT]**: Generate recommendation reasons in feed service.
  - File: `artifacts/api-server/src/services/feedService.ts`
  - Action: Augment `FeedPost` with `recommendationReason`; set reason based on ranking strategy.
  - Validation: `pnpm --filter @workspace/api-server test -- feedService` passes.

- [ ] **FED-004.2 [AGENT]**: Add explanation affordance in mobile post card.
  - File: `artifacts/mobile/components/PostCard.tsx`
  - Action: Add an info icon/menu that displays the reason string.
  - Validation: `pnpm --filter @workspace/mobile test -- PostCard` passes.

---

## [ ] FED-005: Add chronological feed guarantee

- **Status:** Not Started
- **Priority:** High
- **Domain:** FED
- **Behavior:** Given a user selects the chronological feed mode, when they view the feed, then posts are strictly ordered by creation time with no algorithmic reordering.
- **Related Files:** `artifacts/api-server/src/services/feedService.ts`, `artifacts/api-server/src/routes/feed.ts`
- **Definition of Done:** `chronological` mode returns friend/self posts ordered by `createdAt` descending; covered by tests.
- **Out of Scope:** Changing default feed behavior unless user opts in.
- **Rules to Follow:** Chronological mode must ignore engagement scores; blocked/muted users still filtered.
- **Advanced Coding Pattern:** Strategy pattern: chronological ranking is a pure function of `createdAt`.
- **Anti-Patterns:** Applying hidden boosting in chronological mode.
- **Imports/Exports:** Export `chronologicalFeed` strategy from `feedService.ts`.
- **Depends On:** FED-003
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **FED-005.R [AGENT]**: Verify current feed ordering.
  - File: `artifacts/api-server/src/services/feedService.ts`
  - Action: Confirm `getFeed` sorts by `createdAt` and document any ranking leakage.
  - Validation: Test output shows strict chronological ordering today.

### Subtasks

- [ ] **FED-005.1 [AGENT]**: Extract chronological strategy.
  - File: `artifacts/api-server/src/services/feedService.ts`
  - Action: Refactor into a dedicated strategy and add tests proving no hidden ranking.
  - Validation: `pnpm --filter @workspace/api-server test -- feedService` passes.

---

## [ ] FED-006: Add unified search

- **Status:** Not Started
- **Priority:** High
- **Domain:** FED
- **Behavior:** Given a user enters a query, when search executes, then results include matching users, posts, topics, and hashtags ranked by relevance.
- **Related Files:** `artifacts/api-server/src/services/feedService.ts`, `artifacts/api-server/src/routes/discover.ts`, `lib/db/src/schema/posts.ts`, `lib/db/src/schema/profiles.ts`, `artifacts/mobile/app/(tabs)/discover.tsx`
- **Definition of Done:** `GET /search` returns typed results by category; discover screen has a search tab; tests pass.
- **Out of Scope:** Full-text search engine migration; federated search.
- **Rules to Follow:** Search respects block/mute filters; public-only posts are searchable unless author is friend.
- **Advanced Coding Pattern:** Deep module: `SearchService` hides category-specific SQL and ranking.
- **Anti-Patterns:** Returning blocked users in results; leaking private content.
- **Imports/Exports:** Export `SearchService` and `SearchResponse` types.
- **Depends On:** FED-002, SOC-003
- **Blocks:** FED-007, PST-007

### Initial File Analysis and Research

- [ ] **FED-006.R [AGENT]**: Audit current discover search.
  - Files: `artifacts/api-server/src/services/feedService.ts`, `artifacts/api-server/src/routes/discover.ts`
  - Action: Document existing search capabilities and gaps for users/hashtags.
  - Validation: Written findings with SQL examples.

### Subtasks

- [ ] **FED-006.1 [AGENT]**: Add search endpoint and service.
  - Files: `artifacts/api-server/src/services/searchService.ts` (new), `artifacts/api-server/src/routes/search.ts` (new)
  - Action: Implement search across users, posts, topics; rank results.
  - Validation: `pnpm --filter @workspace/api-server test -- searchService` passes.

- [ ] **FED-006.2 [AGENT]**: Add mobile search UI.
  - Files: `artifacts/mobile/app/(tabs)/discover.tsx` or `artifacts/mobile/app/search.tsx` (new)
  - Action: Add query input and category-filtered results.
  - Validation: Manual test of user and post search.

---

## [ ] FED-007: Add trending topics and hashtags

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** FED
- **Behavior:** Given posts contain topics and hashtags, when trending is computed, then a ranked list of trending topics is returned with usage counts.
- **Related Files:** `artifacts/api-server/src/services/feedService.ts`, `artifacts/api-server/src/routes/discover.ts`, `lib/db/src/schema/posts.ts`
- **Definition of Done:** `GET /discover/trending-topics` returns topics ranked by recent usage; mobile discover screen shows trending chips.
- **Out of Scope:** Trending personalized to each user; paid promotion of trends.
- **Rules to Follow:** Trends are computed from public posts only; exclude spam/botted topics via rate limits.
- **Advanced Coding Pattern:** Deep module: `TrendingService` hides aggregation window and scoring.
- **Anti-Patterns:** Computing trends over all-time data; not filtering deleted posts.
- **Imports/Exports:** Export `TrendingService` and topic ranking types.
- **Depends On:** FED-006, PST-007
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **FED-007.R [AGENT]**: Inspect topic storage and trending logic.
  - Files: `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/feedService.ts`
  - Action: Document how topics are stored and whether trending can be aggregated from existing columns.
  - Validation: Proposed aggregation query and time window.

### Subtasks

- [ ] **FED-007.1 [AGENT]**: Implement trending topics service.
  - File: `artifacts/api-server/src/services/trendingService.ts` (new)
  - Action: Aggregate topic/hashtag usage over a rolling window; return ranked list.
  - Validation: `pnpm --filter @workspace/api-server test -- trendingService` passes.

- [ ] **FED-007.2 [AGENT]**: Add trending topics route and mobile UI.
  - Files: `artifacts/api-server/src/routes/discover.ts`, `artifacts/mobile/app/(tabs)/discover.tsx`
  - Action: Wire endpoint and display trending chips.
  - Validation: Manual test of trending topics view.

---

## [ ] MON-003: Add creator analytics

- **Status:** Not Started
- **Priority:** High
- **Domain:** MON
- **Behavior:** Given a creator views their analytics, when the dashboard loads, then they see metrics for posts, engagement, audience, and earnings.
- **Related Files:** `artifacts/api-server/src/services/analyticsService.ts` (new), `artifacts/api-server/src/routes/analytics.ts` (new), `lib/db/src/schema/engagement.ts`, `artifacts/mobile/app/(tabs)/profile.tsx`
- **Definition of Done:** `GET /creator/analytics` returns views, likes, saves, reposts, follower growth, top posts, revenue; mobile has an analytics section; tests pass.
- **Out of Scope:** Real-time analytics streaming; third-party analytics integrations.
- **Rules to Follow:** Analytics respect privacy (no individual viewer identities); aggregate only.
- **Advanced Coding Pattern:** Deep module: `AnalyticsService` encapsulates SQL aggregations and time windows.
- **Anti-Patterns:** Exposing who viewed what; computing analytics on every request without caching.
- **Imports/Exports:** Export `AnalyticsService`, `CreatorAnalyticsResponse`.
- **Depends On:** MON-002, ENG-002, PST-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MON-003.R [AGENT]**: Survey data available for analytics.
  - Files: `lib/db/src/schema/engagement.ts`, `lib/db/src/schema/posts.ts`, `lib/db/src/schema/friendships.ts`
  - Action: Document which metrics can be computed today and which require new counters.
  - Validation: Analytics metric inventory document.

### Subtasks

- [ ] **MON-003.1 [AGENT]**: Create analytics tables and service.
  - Files: `lib/db/src/schema/analytics.ts` (new), `artifacts/api-server/src/services/analyticsService.ts` (new)
  - Action: Add aggregated metrics tables or computed views; implement analytics queries.
  - Validation: `pnpm --filter @workspace/api-server test -- analyticsService` passes.

- [ ] **MON-003.2 [AGENT]**: Add analytics API routes.
  - File: `artifacts/api-server/src/routes/analytics.ts` (new)
  - Action: Wire `GET /creator/analytics` and `/creator/analytics/posts` with `requireAuth`.
  - Validation: `pnpm --filter @workspace/api-server test -- analytics.routes` passes.

- [ ] **MON-003.3 [AGENT]**: Add creator analytics UI.
  - Files: `artifacts/mobile/app/(tabs)/profile.tsx`, `artifacts/mobile/components/CreatorAnalytics.tsx` (new)
  - Action: Add analytics tab/section with charts and summary cards.
  - Validation: Manual test of analytics display.

---

## [ ] MON-004: Add content scheduling and drafts

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MON
- **Behavior:** Given a user creates a post, when they save it as a draft or schedule it, then it is persisted and published at the appropriate time or kept private until published.
- **Related Files:** `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/postService.ts`, `artifacts/api-server/src/routes/posts.ts`, `artifacts/mobile/app/compose.tsx`
- **Definition of Done:** Drafts table or status on posts; scheduled posts publish via background job; mobile compose supports save/schedule; tests pass.
- **Out of Scope:** Recurring scheduled posts; cross-platform scheduling.
- **Rules to Follow:** Drafts are private to author; scheduled posts are visible only after publish time.
- **Advanced Coding Pattern:** Deep module: `PostSchedulingService` hides cron logic and publish state machine.
- **Anti-Patterns:** Treating scheduled posts as published in feeds; missing publish job failure handling.
- **Imports/Exports:** Export `SchedulingService`; update post schemas with `status` enum.
- **Depends On:** PST-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MON-004.R [AGENT]**: Inspect post lifecycle and job infrastructure.
  - Files: `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/jobs/cleanupStories.ts`
  - Action: Confirm how background jobs are run and whether posts need a `status` column.
  - Validation: Proposed post status enum and job design.

### Subtasks

- [ ] **MON-004.1 [AGENT]**: Add post status and scheduledAt columns.
  - File: `lib/db/src/schema/posts.ts`
  - Action: Add `status` (`draft`, `scheduled`, `published`, `archived`) and `scheduledAt`; generate migration.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_post_status` succeeds.

- [ ] **MON-004.2 [AGENT]**: Implement scheduling service and publish job.
  - Files: `artifacts/api-server/src/services/schedulingService.ts` (new), `artifacts/api-server/src/jobs/publishScheduledPosts.ts` (new)
  - Action: Publish scheduled posts when due; list drafts and scheduled posts.
  - Validation: `pnpm --filter @workspace/api-server test -- schedulingService` passes.

- [ ] **MON-004.3 [AGENT]**: Update post routes and mobile compose.
  - Files: `artifacts/api-server/src/routes/posts.ts`, `artifacts/mobile/app/compose.tsx`
  - Action: Add draft/schedule endpoints and UI affordances.
  - Validation: `pnpm --filter @workspace/api-server test -- posts.routes` passes.

---

## [ ] MON-005: Add pinned posts and profile highlights

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MON
- **Behavior:** Given a user pins a post to their profile, when visitors view the profile, then pinned posts appear first in a dedicated highlights section.
- **Related Files:** `lib/db/src/schema/profiles.ts`, `artifacts/api-server/src/services/profileService.ts`, `artifacts/mobile/components/ProfileHeader.tsx`
- **Definition of Done:** Profile supports a pinned post ID list; API to pin/unpin; mobile profile shows highlights; tests pass.
- **Out of Scope:** Story highlights; paid profile promotion.
- **Rules to Follow:** Maximum pin limit enforced server-side; only author can pin.
- **Advanced Coding Pattern:** Deep module: `ProfileService` validates pin limits and ordering.
- **Anti-Patterns:** Allowing unlimited pins; exposing pin data to non-visible posts.
- **Imports/Exports:** Update `ProfileUpdateRequest` schema; export pin helpers.
- **Depends On:** PRF-002, PST-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MON-005.R [AGENT]**: Verify profile and post visibility integration.
  - Files: `lib/db/src/schema/profiles.ts`, `artifacts/api-server/src/services/profileService.ts`
  - Action: Determine where pinned post IDs should live and how they interact with module visibility.
  - Validation: Proposed schema change and visibility rules.

### Subtasks

- [ ] **MON-005.1 [AGENT]**: Add pinned post support to profiles.
  - File: `lib/db/src/schema/profiles.ts`
  - Action: Add `pinnedPostIds` JSONB array; generate migration.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_pinned_posts` succeeds.

- [ ] **MON-005.2 [AGENT]**: Implement pin/unpin service and routes.
  - Files: `artifacts/api-server/src/services/profileService.ts`, `artifacts/api-server/src/routes/profiles.ts`
  - Action: Add `POST /profiles/me/pinned-posts` and removal endpoint with limit validation.
  - Validation: `pnpm --filter @workspace/api-server test -- profileService` passes.

- [ ] **MON-005.3 [AGENT]**: Display pinned highlights on mobile profile.
  - Files: `artifacts/mobile/components/ProfileHeader.tsx`, `artifacts/mobile/app/(tabs)/profile.tsx`
  - Action: Render pinned posts at top of profile posts list.
  - Validation: Manual test of pin/unpin flow.

---

## [ ] MON-006: Add live shopping and product tagging

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MON
- **Behavior:** Given a creator tags a product in a post or live stream, when viewers see the tag, then they can view product details and initiate purchase through an affiliate link.
- **Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/liveService.ts`, `lib/db/src/schema/posts.ts`
- **Definition of Done:** Product tags schema; API to add/remove tags; mobile product card; tests pass.
- **Out of Scope:** Checkout processing; inventory management.
- **Rules to Follow:** Product data stored as tags with external URLs; disclose affiliate relationships.
- **Advanced Coding Pattern:** Deep module: `ProductTagService` isolates tagging logic from posts and streams.
- **Anti-Patterns:** Storing full product catalog; hard-coding affiliate networks.
- **Imports/Exports:** Export `ProductTagService` and tag types.
- **Depends On:** MON-002, LIV-003
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MON-006.R [AGENT/HUMAN]**: Define product tag contract.
  - Files: `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/liveService.ts`
  - Action: Decide whether product tags live on posts, streams, or a separate table; document schema.
  - Validation: Approved product tag schema design.

### Subtasks

- [ ] **MON-006.1 [AGENT]**: Add product tags schema.
  - File: `lib/db/src/schema/productTags.ts` (new)
  - Action: Create columns for target type, target ID, product name, URL, metadata.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_product_tags` succeeds.

- [ ] **MON-006.2 [AGENT]**: Implement product tag service and routes.
  - Files: `artifacts/api-server/src/services/productTagService.ts` (new), `artifacts/api-server/src/routes/productTags.ts` (new)
  - Action: CRUD for product tags; authorization by content owner.
  - Validation: `pnpm --filter @workspace/api-server test -- productTagService` passes.

- [ ] **MON-006.3 [AGENT]**: Add product tag UI.
  - Files: `artifacts/mobile/components/ProductTagCard.tsx` (new), `artifacts/mobile/app/compose-media.tsx`
  - Action: Render product tags and open external URL.
  - Validation: Manual test of product tag creation and display.

---

## [ ] MON-007: Add tipping on posts and live streams

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MON
- **Behavior:** Given a viewer appreciates a post or live stream, when they send a tip, then the creator's balance increases and a notification is sent.
- **Related Files:** `artifacts/api-server/src/services/monetizationService.ts` (after MON-002), `artifacts/api-server/src/routes/posts.ts`, `artifacts/api-server/src/routes/live.ts`
- **Definition of Done:** `POST /posts/{postId}/tip` and `POST /live/{streamId}/tip` endpoints; balance update; mobile tip sheet; tests pass.
- **Out of Scope:** Refund flow; tax handling.
- **Rules to Follow:** Tips are non-refundable; use `MonetizationService` for balance tracking.
- **Advanced Coding Pattern:** Deep module: tip endpoints delegate to `MonetizationService`.
- **Anti-Patterns:** Hard-coding tip amounts; bypassing monetization ledger.
- **Imports/Exports:** Import `MonetizationService`; export tip route handlers.
- **Depends On:** MON-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MON-007.R [AGENT]**: Review monetization API design.
  - File: `lib/api-spec/openapi.yaml` (after MON-001)
  - Action: Confirm tip schema exists and align post/live tip payloads.
  - Validation: Documented tip payload design.

### Subtasks

- [ ] **MON-007.1 [AGENT]**: Add post tip endpoint.
  - File: `artifacts/api-server/src/routes/posts.ts`
  - Action: Implement `POST /posts/{postId}/tip` using `MonetizationService`.
  - Validation: `pnpm --filter @workspace/api-server test -- posts.routes` passes.

- [ ] **MON-007.2 [AGENT]**: Add live stream tip endpoint.
  - File: `artifacts/api-server/src/routes/live.ts`
  - Action: Implement `POST /live/{streamId}/tip` using `MonetizationService`.
  - Validation: `pnpm --filter @workspace/api-server test -- live.routes` passes.

- [ ] **MON-007.3 [AGENT]**: Add mobile tip sheet.
  - File: `artifacts/mobile/components/TipSheet.tsx` (new)
  - Action: Bottom sheet with preset amounts and confirmation.
  - Validation: Manual test of tipping flow.

---

## [ ] USR-003: Add account verification

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** USR
- **Behavior:** Given a user meets verification criteria, when an admin approves their request, then a verified badge is displayed on their profile.
- **Related Files:** `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/profileService.ts`, `artifacts/api-server/src/routes/profiles.ts`, `artifacts/mobile/components/ProfileHeader.tsx`
- **Definition of Done:** Verification request table; admin approval flow; verified badge on profile; tests pass.
- **Out of Scope:** Identity document upload; government ID verification; paid verification badges.
- **Rules to Follow:** Criteria are transparent; approval is human-reviewed; badge is non-transferable.
- **Advanced Coding Pattern:** Deep module: `VerificationService` hides approval state machine.
- **Anti-Patterns:** Auto-approving based on follower count; selling verification.
- **Imports/Exports:** Export `VerificationService`, `VerificationStatus`.
- **Depends On:** USR-001, ADM-001
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **USR-003.R [AGENT/HUMAN]**: Define verification criteria and badge design.
  - Files: `lib/db/src/schema/users.ts`, `docs/architecture.md`
  - Action: Choose criteria (e.g., email + notable identity or admin invitation); document badge UI placement.
  - Validation: Approved verification policy document.

### Subtasks

- [ ] **USR-003.1 [AGENT]**: Add verification table and user column.
  - Files: `lib/db/src/schema/verificationRequests.ts` (new), `lib/db/src/schema/users.ts`
  - Action: Create verification request table; add `verifiedAt` to users; generate migration.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_verification` succeeds.

- [ ] **USR-003.2 [AGENT]**: Implement verification service and routes.
  - Files: `artifacts/api-server/src/services/verificationService.ts` (new), `artifacts/api-server/src/routes/verification.ts` (new)
  - Action: Request, review, approve, revoke endpoints; admin-only actions.
  - Validation: `pnpm --filter @workspace/api-server test -- verificationService` passes.

- [ ] **USR-003.3 [AGENT]**: Show verified badge in mobile.
  - File: `artifacts/mobile/components/ProfileHeader.tsx`
  - Action: Render badge next to name when `verifiedAt` is present.
  - Validation: `pnpm --filter @workspace/mobile test -- ProfileHeader` passes.

---

## [ ] USR-004: Add AI-generated content labeling

- **Status:** Not Started
- **Priority:** High
- **Domain:** USR
- **Behavior:** Given a post or message is created with AI assistance, when it is published, then it carries a visible label disclosing AI generation.
- **Related Files:** `lib/db/src/schema/posts.ts`, `lib/db/src/schema/messages.ts`, `artifacts/api-server/src/services/postService.ts`, `artifacts/mobile/components/PostCard.tsx`
- **Definition of Done:** `isAiGenerated` flag on posts/messages; composer toggle; visible label; tests pass.
- **Out of Scope:** Automated AI detection; content moderation for unlabeled AI.
- **Rules to Follow:** Label is set by creator at compose time; default to false; label text is concise.
- **Advanced Coding Pattern:** Deep module: label rendering is centralized in `PostCard` and message bubbles.
- **Anti-Patterns:** Hiding AI labels behind menus; auto-flagging without creator consent.
- **Imports/Exports:** Update `PostCreateRequest` schema; export `AiLabel` component.
- **Depends On:** PST-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **USR-004.R [AGENT]**: Survey content schemas for AI flag placement.
  - Files: `lib/db/src/schema/posts.ts`, `lib/db/src/schema/messages.ts`
  - Action: Confirm whether a new column or JSONB extension is appropriate.
  - Validation: Proposed schema diff.

### Subtasks

- [ ] **USR-004.1 [AGENT]**: Add AI flag to posts and messages.
  - Files: `lib/db/src/schema/posts.ts`, `lib/db/src/schema/messages.ts`
  - Action: Add `isAiGenerated` boolean; generate migration.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_ai_generated_flag` succeeds.

- [ ] **USR-004.2 [AGENT]**: Add composer toggle and labels.
  - Files: `artifacts/mobile/app/compose.tsx`, `artifacts/mobile/components/PostCard.tsx`
  - Action: Add toggle and render label.
  - Validation: `pnpm --filter @workspace/mobile test -- compose` passes.

---

## [ ] PRIV-004: Add screen time and wellbeing tools

- **Status:** Not Started
- **Priority:** High
- **Domain:** PRIV
- **Behavior:** Given a user enables wellbeing settings, when they exceed limits, then they receive a reminder and can pause the app.
- **Related Files:** `lib/db/src/schema/users.ts`, `artifacts/api-server/src/routes/account.ts` (new), `artifacts/mobile/app/settings.tsx`
- **Definition of Done:** `wellbeingSettings` JSONB on users; daily time limit and break reminders; settings UI; tests pass.
- **Out of Scope:** Full parental controls; content time quotas.
- **Rules to Follow:** Reminders are gentle, not blocking by default; user can opt into hard breaks.
- **Advanced Coding Pattern:** Deep module: `WellbeingService` stores settings; UI enforces local timers without server round-trips.
- **Anti-Patterns:** Forcing hard limits without user consent; storing detailed session logs.
- **Imports/Exports:** Export `WellbeingSettings` type and validation schema.
- **Depends On:** PRIV-003
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **PRIV-004.R [AGENT]**: Review user settings storage options.
  - File: `lib/db/src/schema/users.ts`
  - Action: Decide whether wellbeing settings live on users table or separate settings table.
  - Validation: Proposed settings schema.

### Subtasks

- [ ] **PRIV-004.1 [AGENT]**: Add wellbeing settings schema and API.
  - Files: `lib/db/src/schema/users.ts`, `artifacts/api-server/src/routes/account.ts`
  - Action: Add settings columns/endpoints; generate migration.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_wellbeing_settings` succeeds.

- [ ] **PRIV-004.2 [AGENT]**: Add wellbeing UI and local timers.
  - Files: `artifacts/mobile/app/settings.tsx`, `artifacts/mobile/context/WellbeingContext.tsx` (new)
  - Action: Add limit inputs and break reminder overlays.
  - Validation: Manual test of timer and reminder flow.

---

## [ ] PRIV-005: Add close friends / exclusive sharing

- **Status:** Not Started
- **Priority:** High
- **Domain:** PRIV
- **Behavior:** Given a user adds friends to a Close Friends list, when they share a story or post, then they can restrict visibility to only that list.
- **Related Files:** `lib/db/src/schema/audienceLists.ts`, `artifacts/api-server/src/services/audienceService.ts`, `artifacts/api-server/src/routes/audience.ts`, `artifacts/mobile/components/StoryComposer.tsx` (new)
- **Definition of Done:** Reserved `closeFriends` audience list type; composer supports Close Friends; visibility enforced server-side; tests pass.
- **Out of Scope:** Auto-suggesting close friends based on engagement.
- **Rules to Follow:** Close Friends lists are private; members are not notified when added/removed unless opted in.
- **Advanced Coding Pattern:** Deep module: `AudienceService` treats close friends as a first-class audience list.
- **Anti-Patterns:** Exposing list membership to non-owners; ignoring audience filters in feed.
- **Imports/Exports:** Update audience enums; export `CloseFriendsManager`.
- **Depends On:** AUD-001, SOC-003
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **PRIV-005.R [AGENT]**: Inspect audience list implementation.
  - Files: `lib/db/src/schema/audienceLists.ts`, `artifacts/api-server/src/services/audienceService.ts`
  - Action: Verify audience lists can represent close friends and are enforced in feed/stories.
  - Validation: Documented gap list and integration points.

### Subtasks

- [ ] **PRIV-005.1 [AGENT]**: Reserve close friends audience type.
  - Files: `lib/db/src/schema/audienceLists.ts`, `artifacts/api-server/src/services/audienceService.ts`
  - Action: Add `closeFriends` special list handling; ensure list cannot be deleted accidentally.
  - Validation: `pnpm --filter @workspace/api-server test -- audienceService` passes.

- [ ] **PRIV-005.2 [AGENT]**: Add close friends composer UI.
  - Files: `artifacts/mobile/app/friends-list.tsx`, `artifacts/mobile/components/StoryComposer.tsx`
  - Action: Add management UI and composer toggle.
  - Validation: Manual test of close friends story sharing.

---

## [ ] PRIV-006: Add content collections / saved bookmarks

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** PRIV
- **Behavior:** Given a user saves a post, when they organize saves into collections, then collections are persisted and browsable.
- **Related Files:** `lib/db/src/schema/engagement.ts`, `artifacts/api-server/src/services/engagementService.ts`, `artifacts/mobile/app/(tabs)/profile.tsx`
- **Definition of Done:** Collections table; CRUD API; mobile collection list and add-to-collection UI; tests pass.
- **Out of Scope:** Public collections; collaborative collections.
- **Rules to Follow:** Collections are private to owner; saved posts remain tied to original visibility.
- **Advanced Coding Pattern:** Deep module: `CollectionService` hides save-to-collection mapping.
- **Anti-Patterns:** Duplicating post content into collections; ignoring deleted posts.
- **Imports/Exports:** Export `CollectionService` and collection schemas.
- **Depends On:** ENG-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **PRIV-006.R [AGENT]**: Verify save engagement schema.
  - Files: `lib/db/src/schema/engagement.ts`, `artifacts/api-server/src/services/engagementService.ts`
  - Action: Confirm saves are stored separately and can be grouped.
  - Validation: Proposed collections schema.

### Subtasks

- [ ] **PRIV-006.1 [AGENT]**: Add collections schema and service.
  - Files: `lib/db/src/schema/collections.ts` (new), `artifacts/api-server/src/services/collectionService.ts` (new)
  - Action: Create tables and CRUD logic.
  - Validation: `pnpm --filter @workspace/api-server test -- collectionService` passes.

- [ ] **PRIV-006.2 [AGENT]**: Add collections routes and mobile UI.
  - Files: `artifacts/api-server/src/routes/engagement.ts` (or new), `artifacts/mobile/app/(tabs)/profile.tsx`
  - Action: Wire endpoints and add saved/collections tab.
  - Validation: Manual test of save-to-collection flow.

---

## [ ] PRIV-007: Add notification preferences

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** PRIV
- **Behavior:** Given a user opens notification settings, when they toggle event types, then only selected notifications are delivered.
- **Related Files:** `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/notificationService.ts`, `artifacts/mobile/app/notifications.tsx`, `artifacts/mobile/app/settings.tsx`
- **Definition of Done:** Per-event-type preferences stored; notification service filters before creating/delivering; mobile settings UI; tests pass.
- **Out of Scope:** Third-party notification channel management (email/SMS specifics).
- **Rules to Follow:** Preferences apply to push, in-app, and email uniformly unless explicitly split.
- **Advanced Coding Pattern:** Deep module: `NotificationService` checks preferences before emitting notifications.
- **Anti-Patterns:** Sending notifications after user disabled the category; requiring server restart to apply changes.
- **Imports/Exports:** Export `NotificationPreferences` schema from user/profile package.
- **Depends On:** NTF-001, PRIV-003
- **Blocks:** NTF-003, NTF-004

### Initial File Analysis and Research

- [ ] **PRIV-007.R [AGENT]**: Audit notification types and delivery path.
  - File: `artifacts/api-server/src/services/notificationService.ts`
  - Action: List all notification event types and where they are emitted.
  - Validation: Notification event inventory.

### Subtasks

- [ ] **PRIV-007.1 [AGENT]**: Add notification preferences to users.
  - File: `lib/db/src/schema/users.ts`
  - Action: Add `notificationPreferences` JSONB; generate migration.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_notification_preferences` succeeds.

- [ ] **PRIV-007.2 [AGENT]**: Filter notifications by preference.
  - File: `artifacts/api-server/src/services/notificationService.ts`
  - Action: Skip creation/delivery when category is disabled.
  - Validation: `pnpm --filter @workspace/api-server test -- notificationService` passes.

- [ ] **PRIV-007.3 [AGENT]**: Add notification settings UI.
  - Files: `artifacts/mobile/app/settings.tsx`, `artifacts/mobile/app/notifications.tsx`
  - Action: Add toggles per notification category.
  - Validation: Manual test of disabling a category.

---

## [ ] SAF-003: Add restrict mode

- **Status:** Not Started
- **Priority:** High
- **Domain:** SAF
- **Behavior:** Given a user restricts another user, when the restricted user comments, then their comments are only visible to themselves and the profile owner.
- **Related Files:** `lib/db/src/schema/profiles.ts`, `artifacts/api-server/src/services/safetyService.ts`, `artifacts/api-server/src/routes/safety.ts`, `artifacts/mobile/components/BlockSheet.tsx`
- **Definition of Done:** Restrict table or status; comment visibility filter; mobile restrict action; tests pass.
- **Out of Scope:** Restrict mode beyond comments.
- **Rules to Follow:** Restrict is silent; restricted user is not notified.
- **Advanced Coding Pattern:** Deep module: `SafetyService` adds `isRestricted` checks to content visibility queries.
- **Anti-Patterns:** Allowing restricted users to see they are restricted via UI hints.
- **Imports/Exports:** Export `restrictUser`, `unrestrictUser`, `isRestricted` methods.
- **Depends On:** SAF-002, PRIV-001
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **SAF-003.R [AGENT]**: Review block/mute implementation for extension.
  - Files: `lib/db/src/schema/blocks.ts`, `lib/db/src/schema/mutes.ts`, `artifacts/api-server/src/services/safetyService.ts`
  - Action: Determine whether restrict uses a new table or extends mutes with a mode.
  - Validation: Proposed restrict data model.

### Subtasks

- [ ] **SAF-003.1 [AGENT]**: Add restrict schema.
  - File: `lib/db/src/schema/restricts.ts` (new)
  - Action: Create restrict relationship table; generate migration.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_restricts` succeeds.

- [ ] **SAF-003.2 [AGENT]**: Implement restrict service and routes.
  - Files: `artifacts/api-server/src/services/safetyService.ts`, `artifacts/api-server/src/routes/safety.ts`
  - Action: Add restrict CRUD and apply to comment visibility.
  - Validation: `pnpm --filter @workspace/api-server test -- safetyService` passes.

- [ ] **SAF-003.3 [AGENT]**: Add restrict action to mobile.
  - File: `artifacts/mobile/components/BlockSheet.tsx`
  - Action: Add restrict option alongside block/mute.
  - Validation: Manual test of restrict/unrestrict.

---

## [ ] MSG-003: Add voice notes to messages

- **Status:** Not Started
- **Priority:** High
- **Domain:** MSG
- **Behavior:** Given a user records a voice message, when it is sent, then recipients can play it back in the conversation.
- **Related Files:** `lib/db/src/schema/messages.ts`, `artifacts/api-server/src/services/messageService.ts`, `artifacts/mobile/components/MessageComposer.tsx` (new)
- **Definition of Done:** Audio message type fully supported end-to-end; recording UI; playback with progress; tests pass.
- **Out of Scope:** Voice-to-text transcription; voice messages in stories/posts.
- **Rules to Follow:** Audio is uploaded via existing media flow; schema already supports `audio` type.
- **Advanced Coding Pattern:** Deep module: `VoiceMessagePlayer` hides recording, upload, and playback state.
- **Anti-Patterns:** Storing raw audio in database; not handling playback interruptions.
- **Imports/Exports:** Export `VoiceMessagePlayer` component.
- **Depends On:** MSG-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MSG-003.R [AGENT]**: Verify audio support in messaging stack.
  - Files: `lib/db/src/schema/messages.ts`, `artifacts/api-server/src/services/messageService.ts`
  - Action: Confirm `audio` type is accepted end-to-end and identify missing UI.
  - Validation: Test sending an audio message via API.

### Subtasks

- [ ] **MSG-003.1 [AGENT]**: Add audio upload to message service.
  - File: `artifacts/api-server/src/services/messageService.ts`
  - Action: Accept `audio` messages, validate media URL, set duration metadata.
  - Validation: `pnpm --filter @workspace/api-server test -- messageService` passes.

- [ ] **MSG-003.2 [AGENT]**: Add voice note composer and player.
  - Files: `artifacts/mobile/components/MessageComposer.tsx` (new), `artifacts/mobile/components/VoiceMessagePlayer.tsx` (new)
  - Action: Add record button, waveform/progress display, and playback controls.
  - Validation: Manual test of send and playback.

---

## [ ] MSG-004: Add message replies and threading

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MSG
- **Behavior:** Given a user replies to a specific message, when the reply is sent, then it is linked to the original message and displayed inline.
- **Related Files:** `lib/db/src/schema/messages.ts`, `artifacts/api-server/src/services/messageService.ts`, `artifacts/api-server/src/routes/messages.ts`, `artifacts/mobile/components/MessageThread.tsx` (new)
- **Definition of Done:** `replyToMessageId` populated and rendered; reply affordance in UI; tests pass.
- **Out of Scope:** Full nested threading UI; forwarded message chains.
- **Rules to Follow:** Replies reference existing messages in the same conversation; deleted original messages show placeholder.
- **Advanced Coding Pattern:** Deep module: `MessageService` validates reply references and enforces conversation scope.
- **Anti-Patterns:** Allowing replies to messages in other conversations; losing reply context on deletion.
- **Imports/Exports:** Update message request schemas; export reply helpers.
- **Depends On:** MSG-002
- **Blocks:** MSG-005

### Initial File Analysis and Research

- [ ] **MSG-004.R [AGENT]**: Verify reply column migration.
  - File: `lib/db/src/schema/messages.ts`
  - Action: Confirm `replyToMessageId` is present and has self-reference.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate` shows existing migration state.

### Subtasks

- [ ] **MSG-004.1 [AGENT]**: Implement reply logic in message service.
  - File: `artifacts/api-server/src/services/messageService.ts`
  - Action: Validate and persist reply references.
  - Validation: `pnpm --filter @workspace/api-server test -- messageService` passes.

- [ ] **MSG-004.2 [AGENT]**: Render replies in mobile conversation UI.
  - Files: `artifacts/mobile/components/MessageThread.tsx`, conversation screen
  - Action: Show quoted message and reply indicator.
  - Validation: Manual test of reply flow.

---

## [ ] MSG-005: Add group conversations

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MSG
- **Behavior:** Given multiple participants, when a group conversation is created, then all members can send and receive messages.
- **Related Files:** `lib/db/src/schema/conversations.ts`, `artifacts/api-server/src/services/messageService.ts`, `artifacts/api-server/src/routes/messages.ts`, `artifacts/mobile/app/conversations/` (new)
- **Definition of Done:** Group creation API; member add/remove; group metadata (title, avatar); mobile group UI; tests pass.
- **Out of Scope:** Admin roles and permissions; group discovery.
- **Rules to Follow:** Only existing friends can be added unless setting allows all; group metadata editable by members.
- **Advanced Coding Pattern:** Deep module: `ConversationService` handles participant validation and group lifecycle.
- **Anti-Patterns:** Allowing non-friends to be added silently; not validating participant count.
- **Imports/Exports:** Export group management methods.
- **Depends On:** MSG-004
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MSG-005.R [AGENT]**: Verify conversation schema supports groups.
  - File: `lib/db/src/schema/conversations.ts`
  - Action: Confirm `participants` array and check for group title/avatar fields.
  - Validation: Proposed schema changes if missing.

### Subtasks

- [ ] **MSG-005.1 [AGENT]**: Add group metadata and member management.
  - Files: `lib/db/src/schema/conversations.ts`, `artifacts/api-server/src/services/messageService.ts`
  - Action: Add title/avatar fields; implement member add/remove.
  - Validation: `pnpm --filter @workspace/api-server test -- messageService` passes.

- [ ] **MSG-005.2 [AGENT]**: Add group conversation UI.
  - Files: `artifacts/mobile/app/conversations/new.tsx` (new), existing conversation screen
  - Action: Group creation flow and participant selection.
  - Validation: Manual test of group chat.

---

## [ ] PST-004: Add in-post polls

- **Status:** Not Started
- **Priority:** High
- **Domain:** PST
- **Behavior:** Given a user composes a post, when they add a poll, then viewers can vote and see aggregated results.
- **Related Files:** `lib/db/src/schema/polls.ts`, `artifacts/api-server/src/services/gamificationService.ts`, `artifacts/api-server/src/routes/gamification.ts`, `artifacts/mobile/app/compose.tsx`
- **Definition of Done:** Polls can be attached to posts at creation; voting endpoint; results rendered in `PostCard`; tests pass.
- **Out of Scope:** Advanced poll types (ranked choice, quizzes in posts).
- **Rules to Follow:** One vote per user; poll options are immutable after first vote; expiration optional.
- **Advanced Coding Pattern:** Deep module: `PollService` handles vote aggregation and expiration.
- **Anti-Patterns:** Allowing vote changes after seeing results; editing options after votes exist.
- **Imports/Exports:** Update `PostCreateRequest` schema; export `PollCard` component.
- **Depends On:** PST-002, GAM-001
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **PST-004.R [AGENT]**: Verify poll schema and existing gamification endpoints.
  - Files: `lib/db/src/schema/polls.ts`, `artifacts/api-server/src/services/gamificationService.ts`
  - Action: Confirm polls are stored separately and can be linked by `postId`.
  - Validation: Proposed post-poll integration design.

### Subtasks

- [ ] **PST-004.1 [AGENT]**: Link polls to post creation.
  - Files: `artifacts/api-server/src/services/postService.ts`, `artifacts/api-server/src/routes/posts.ts`
  - Action: Accept optional poll in create post request and create poll atomically.
  - Validation: `pnpm --filter @workspace/api-server test -- postService` passes.

- [ ] **PST-004.2 [AGENT]**: Render polls in mobile posts.
  - Files: `artifacts/mobile/components/PostCard.tsx`, `artifacts/mobile/components/PollCard.tsx` (new)
  - Action: Show poll options, vote button, and results after voting.
  - Validation: `pnpm --filter @workspace/mobile test -- PostCard` passes.

---

## [ ] PST-005: Add post edit history

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** PST
- **Behavior:** Given a user edits a post, when viewers inspect it, then they can see that the post was edited and view prior versions.
- **Related Files:** `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/postService.ts`, `artifacts/mobile/components/PostCard.tsx`
- **Definition of Done:** Edit history table; history endpoint; mobile edit indicator and history view; tests pass.
- **Out of Scope:** Restoring previous versions; diff highlighting.
- **Rules to Follow:** History is immutable; only author and admins can view.
- **Advanced Coding Pattern:** Deep module: `PostHistoryService` hides version persistence.
- **Anti-Patterns:** Overwriting original content without history; exposing history to non-authors.
- **Imports/Exports:** Export `PostHistoryService` and history types.
- **Depends On:** PST-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **PST-005.R [AGENT]**: Inspect post update behavior.
  - Files: `artifacts/api-server/src/services/postService.ts`, `lib/db/src/schema/posts.ts`
  - Action: Confirm `PATCH` updates in place and determine how to snapshot versions.
  - Validation: Proposed history table schema.

### Subtasks

- [ ] **PST-005.1 [AGENT]**: Add post history table and service.
  - Files: `lib/db/src/schema/postHistory.ts` (new), `artifacts/api-server/src/services/postService.ts`
  - Action: Snapshot content on each edit; store editor and timestamp.
  - Validation: `pnpm --filter @workspace/api-server test -- postService` passes.

- [ ] **PST-005.2 [AGENT]**: Add edit indicator and history UI.
  - File: `artifacts/mobile/components/PostCard.tsx`
  - Action: Show "Edited" label with tap to view history.
  - Validation: Manual test of edit history flow.

---

## [ ] PST-006: Add post archive

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** PST
- **Behavior:** Given a user archives a post, when visitors view the profile, then the archived post is hidden but the owner can still see it.
- **Related Files:** `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/postService.ts`, `artifacts/api-server/src/routes/posts.ts`, `artifacts/mobile/app/(tabs)/profile.tsx`
- **Definition of Done:** `archivedAt` column and archive action; archived posts filtered from public feeds/profile; owner archive tab; tests pass.
- **Out of Scope:** Auto-archiving by age; bulk archive tools.
- **Rules to Follow:** Archive is reversible; archived posts still count in analytics.
- **Advanced Coding Pattern:** Deep module: `PostService` applies archive filter consistently.
- **Anti-Patterns:** Deleting engagement when archiving; showing archived posts in search.
- **Imports/Exports:** Update post schemas; export archive helpers.
- **Depends On:** PST-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **PST-006.R [AGENT]**: Verify soft delete vs archive needs.
  - File: `lib/db/src/schema/posts.ts`
  - Action: Confirm `deletedAt` exists; decide if archive uses same column with status or separate `archivedAt`.
  - Validation: Proposed archive state design.

### Subtasks

- [ ] **PST-006.1 [AGENT]**: Add archive support to posts.
  - Files: `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/postService.ts`
  - Action: Add `archivedAt` and archive/unarchive endpoints.
  - Validation: `pnpm --filter @workspace/api-server test -- postService` passes.

- [ ] **PST-006.2 [AGENT]**: Add archive UI to mobile profile.
  - Files: `artifacts/mobile/app/(tabs)/profile.tsx`, `artifacts/mobile/components/PostCard.tsx`
  - Action: Add archive action and owner-only archive tab.
  - Validation: Manual test of archive/unarchive.

---

## [ ] PST-007: Add hashtags and mentions

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** PST
- **Behavior:** Given a post contains `@handle` or `#topic`, when rendered, then mentions link to profiles and hashtags link to search/trending.
- **Related Files:** `artifacts/mobile/components/PostCard.tsx`, `artifacts/mobile/app/post/[id].tsx`, `artifacts/api-server/src/services/feedService.ts`, `artifacts/mobile/lib/topics.ts`
- **Definition of Done:** Composer highlights and parses mentions/hashtags; rendered text is interactive; tests pass.
- **Out of Scope:** Mention notifications (covered by NTF); hashtag following.
- **Rules to Follow:** Mention parsing is case-insensitive for handles; hashtags map to existing topics.
- **Advanced Coding Pattern:** Deep module: `ContentParser` extracts entities without coupling to rendering.
- **Anti-Patterns:** Regex-only parsing without boundary checks; broken links for invalid handles.
- **Imports/Exports:** Export `ContentParser` and `RichText` component.
- **Depends On:** PST-002, FED-006
- **Blocks:** FED-007

### Initial File Analysis and Research

- [ ] **PST-007.R [AGENT]**: Inspect topic inference and post text handling.
  - Files: `artifacts/mobile/lib/topics.ts`, `artifacts/api-server/src/services/postService.ts`
  - Action: Determine how hashtags can integrate with topics and how mentions link to profiles.
  - Validation: Proposed entity parsing rules.

### Subtasks

- [ ] **PST-007.1 [AGENT]**: Parse and store mentions/hashtags.
  - Files: `artifacts/api-server/src/services/postService.ts`, `lib/db/src/schema/posts.ts` (optional columns)
  - Action: Extract entities on create/edit; store hashtags in topics array.
  - Validation: `pnpm --filter @workspace/api-server test -- postService` passes.

- [ ] **PST-007.2 [AGENT]**: Render interactive text in mobile.
  - Files: `artifacts/mobile/components/RichText.tsx` (new), `artifacts/mobile/components/PostCard.tsx`
  - Action: Link mentions to profiles and hashtags to discover search.
  - Validation: `pnpm --filter @workspace/mobile test -- PostCard` passes.

---

## [ ] AUTH-004: Add email verification workflow

- **Status:** Not Started
- **Priority:** High
- **Domain:** AUTH
- **Behavior:** Given a user registers, when they verify their email, then the `emailVerified` timestamp is set and verified-only features are unlocked.
- **Related Files:** `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/authService.ts`, `artifacts/api-server/src/routes/auth.ts`, `.env.example`
- **Definition of Done:** Verification token table; email sending endpoint; token verification route; mobile verification screen; tests pass.
- **Out of Scope:** Full email deliverability infrastructure; password reset via email.
- **Rules to Follow:** Tokens are single-use and expire; use environment variables for email provider credentials.
- **Advanced Coding Pattern:** Deep module: `EmailVerificationService` hides token generation and provider integration.
- **Anti-Patterns:** Storing plaintext tokens; allowing unlimited token resends without rate limit.
- **Imports/Exports:** Export `EmailVerificationService`; update auth routes.
- **Depends On:** AUTH-001
- **Blocks:** USR-003

### Initial File Analysis and Research

- [ ] **AUTH-004.R [AGENT]**: Verify email verification state.
  - Files: `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/authService.ts`
  - Action: Confirm `emailVerified` column is unused; document email provider options.
  - Validation: Proposed verification token schema and flow.

### Subtasks

- [ ] **AUTH-004.1 [AGENT]**: Add verification token schema and service.
  - Files: `lib/db/src/schema/verificationTokens.ts` (new), `artifacts/api-server/src/services/emailVerificationService.ts` (new)
  - Action: Generate tokens, send email via provider, verify tokens.
  - Validation: `pnpm --filter @workspace/api-server test -- emailVerificationService` passes.

- [ ] **AUTH-004.2 [AGENT]**: Add verification routes and mobile UI.
  - Files: `artifacts/api-server/src/routes/auth.ts`, `artifacts/mobile/app/verify-email.tsx` (new)
  - Action: Wire endpoints and add verification pending screen.
  - Validation: Manual test of email verification flow.

---

## [ ] AUTH-005: Add passkey / WebAuthn login

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** AUTH
- **Behavior:** Given a user registers a passkey, when they authenticate, then they can log in without a password using device biometrics.
- **Related Files:** `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/authService.ts`, `artifacts/api-server/src/routes/auth.ts`, `artifacts/mobile/app/login.tsx`
- **Definition of Done:** Passkey credential table; registration and authentication challenge endpoints; mobile passkey support via Expo; tests pass.
- **Out of Scope:** Removing password login entirely; cross-device passkey sync management.
- **Rules to Follow:** Store credential IDs and public keys only; never store private keys.
- **Advanced Coding Pattern:** Deep module: `PasskeyService` wraps WebAuthn challenge/response flow.
- **Anti-Patterns:** Storing private keys; not verifying challenge origin.
- **Imports/Exports:** Export `PasskeyService`; update auth routes.
- **Depends On:** AUTH-001
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **AUTH-005.R [AGENT]**: Evaluate WebAuthn support in Expo/React Native.
  - Files: `artifacts/mobile/package.json`, `artifacts/mobile/app/login.tsx`
  - Action: Identify passkey library and platform limitations.
  - Validation: Documented library choice and supported platforms.

### Subtasks

- [ ] **AUTH-005.1 [AGENT]**: Add passkey credential schema and backend service.
  - Files: `lib/db/src/schema/passkeyCredentials.ts` (new), `artifacts/api-server/src/services/passkeyService.ts` (new)
  - Action: Implement WebAuthn registration and authentication.
  - Validation: `pnpm --filter @workspace/api-server test -- passkeyService` passes.

- [ ] **AUTH-005.2 [AGENT]**: Add passkey routes and mobile UI.
  - Files: `artifacts/api-server/src/routes/auth.ts`, `artifacts/mobile/app/login.tsx`
  - Action: Add passkey registration/login buttons.
  - Validation: Manual test on a supported device/simulator.

---

## [ ] AUTH-006: Add OAuth / social login

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** AUTH
- **Behavior:** Given a user chooses to sign in with a social provider, when they complete the OAuth flow, then an account is created or linked and a session is established.
- **Related Files:** `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/authService.ts`, `artifacts/api-server/src/routes/auth.ts`, `artifacts/mobile/app/login.tsx`
- **Definition of Done:** OAuth provider config (Google/Apple); account linking; mobile OAuth button; tests pass.
- **Out of Scope:** Niche OAuth providers; business/enterprise SSO.
- **Rules to Follow:** Link OAuth to existing account by verified email; do not create duplicate accounts.
- **Advanced Coding Pattern:** Deep module: `OAuthService` normalizes provider-specific flows.
- **Anti-Patterns:** Trusting unverified email from OAuth; leaking provider tokens to client.
- **Imports/Exports:** Export `OAuthService`; update auth routes and `.env.example`.
- **Depends On:** AUTH-001
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **AUTH-006.R [AGENT/HUMAN]**: Choose OAuth providers and libraries.
  - Files: `artifacts/mobile/package.json`, `.env.example`
  - Action: Decide on Google/Apple; document client ID setup.
  - Validation: Approved provider list and environment variable plan.

### Subtasks

- [ ] **AUTH-006.1 [AGENT]**: Implement OAuth backend flow.
  - Files: `artifacts/api-server/src/services/oauthService.ts` (new), `artifacts/api-server/src/routes/auth.ts`
  - Action: Exchange codes, normalize profile info, link/create users.
  - Validation: `pnpm --filter @workspace/api-server test -- oauthService` passes.

- [ ] **AUTH-006.2 [AGENT]**: Add OAuth login to mobile.
  - Files: `artifacts/mobile/app/login.tsx`
  - Action: Add provider buttons and handle redirect.
  - Validation: Manual test of sign-in with Google/Apple.

---

## [ ] AUTH-007: Add two-factor authentication (2FA)

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** AUTH
- **Behavior:** Given a user enables 2FA, when they log in, then they must provide a time-based one-time password in addition to their password.
- **Related Files:** `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/authService.ts`, `artifacts/api-server/src/routes/auth.ts`, `artifacts/mobile/app/settings.tsx`
- **Definition of Done:** TOTP secret storage; QR code setup; verification on login; backup codes; mobile settings UI; tests pass.
- **Out of Scope:** SMS 2FA; hardware security keys beyond passkeys.
- **Rules to Follow:** Secrets are encrypted at rest; backup codes are hashed; 2FA cannot be bypassed.
- **Advanced Coding Pattern:** Deep module: `TwoFactorService` hides TOTP generation and verification.
- **Anti-Patterns:** Storing TOTP secrets plaintext; emailing backup codes.
- **Imports/Exports:** Export `TwoFactorService` and 2FA DTOs.
- **Depends On:** AUTH-001
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **AUTH-007.R [AGENT]**: Evaluate TOTP libraries for Node.js and Expo.
  - Files: `artifacts/api-server/package.json`, `artifacts/mobile/package.json`
  - Action: Choose `speakeasy` or similar backend library and a QR renderer.
  - Validation: Documented library choices.

### Subtasks

- [ ] **AUTH-007.1 [AGENT]**: Add 2FA backend service and routes.
  - Files: `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/twoFactorService.ts` (new)
  - Action: Generate/verify TOTP and backup codes; protect login flow.
  - Validation: `pnpm --filter @workspace/api-server test -- twoFactorService` passes.

- [ ] **AUTH-007.2 [AGENT]**: Add 2FA setup UI.
  - Files: `artifacts/mobile/app/settings.tsx`
  - Action: QR display, enrollment, and backup code view.
  - Validation: Manual test of 2FA enrollment and login.

---

## [ ] NTF-003: Add push notifications

- **Status:** Not Started
- **Priority:** High
- **Domain:** NTF
- **Behavior:** Given an event triggers a notification, when push is enabled, then the user receives a native push notification on their device.
- **Related Files:** `artifacts/api-server/src/services/notificationService.ts`, `artifacts/mobile/context/NotificationsContext.tsx`, `artifacts/api-server/src/websocket/` (if used)
- **Definition of Done:** Expo push token registration; push dispatch from backend; foreground/background handling; tests pass.
- **Out of Scope:** Rich media push; A/B notification copy testing.
- **Rules to Follow:** Respect notification preferences (PRIV-007); do not send push for muted categories.
- **Advanced Coding Pattern:** Deep module: `PushNotificationService` abstracts Expo/FCM/APNs providers.
- **Anti-Patterns:** Sending push without user consent; leaking sensitive content in push payloads.
- **Imports/Exports:** Export `PushNotificationService`; update `.env.example`.
- **Depends On:** PRIV-007
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **NTF-003.R [AGENT]**: Inspect current notification delivery.
  - Files: `artifacts/api-server/src/services/notificationService.ts`, `artifacts/mobile/context/NotificationsContext.tsx`
  - Action: Document whether only in-app notifications exist and where push should hook in.
  - Validation: Push notification integration plan.

### Subtasks

- [ ] **NTF-003.1 [AGENT]**: Add push token registration.
  - Files: `artifacts/api-server/src/services/notificationService.ts`, `artifacts/mobile/context/NotificationsContext.tsx`
  - Action: Store Expo push tokens per user/device.
  - Validation: `pnpm --filter @workspace/api-server test -- notificationService` passes.

- [ ] **NTF-003.2 [AGENT]**: Dispatch push notifications.
  - File: `artifacts/api-server/src/services/notificationService.ts`
  - Action: Send push via Expo SDK when notifications are created and enabled.
  - Validation: Manual test of receiving a push notification.

---

## [ ] NTF-004: Add email notifications

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** NTF
- **Behavior:** Given a user enables email notifications, when a qualifying event occurs, then an email is sent with a digest or alert.
- **Related Files:** `artifacts/api-server/src/services/notificationService.ts`, `lib/db/src/schema/users.ts`, `.env.example`
- **Definition of Done:** Email notification preferences; transactional email sending; digest logic; tests pass.
- **Out of Scope:** Marketing emails; full email deliverability service.
- **Rules to Follow:** Only send when explicitly enabled; respect frequency/digest settings.
- **Advanced Coding Pattern:** Deep module: `EmailNotificationService` queues and batches emails.
- **Anti-Patterns:** Sending email to unverified addresses; including full post content in plaintext.
- **Imports/Exports:** Export `EmailNotificationService`; update notification preferences schema.
- **Depends On:** PRIV-007, AUTH-004
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **NTF-004.R [AGENT]**: Audit notification events suitable for email.
  - File: `artifacts/api-server/src/services/notificationService.ts`
  - Action: Classify events as immediate or digest-worthy.
  - Validation: Email notification matrix document.

### Subtasks

- [ ] **NTF-004.1 [AGENT]**: Implement email notification service.
  - File: `artifacts/api-server/src/services/emailNotificationService.ts` (new)
  - Action: Queue emails, apply digest preferences, send via provider.
  - Validation: `pnpm --filter @workspace/api-server test -- emailNotificationService` passes.

- [ ] **NTF-004.2 [AGENT]**: Add email preference toggles.
  - Files: `artifacts/mobile/app/settings.tsx`
  - Action: Add email frequency and category toggles.
  - Validation: Manual test of digest preference change.

---

## [ ] MYSP-009: Add Memories / lookback feature

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MYSP
- **Behavior:** Given a user has posts from prior years, when a memory is triggered, then they see a "On This Day" recap and optionally reshare it.
- **Related Files:** `artifacts/api-server/src/services/postService.ts`, `artifacts/api-server/src/routes/posts.ts`, `artifacts/mobile/app/(tabs)/profile.tsx`
- **Definition of Done:** `GET /posts/memories` returns posts from same day in previous years; mobile memory card; tests pass.
- **Out of Scope:** Complex anniversary collages; automated highlight reels.
- **Rules to Follow:** Memories only include public or friend-visible posts authored by the user.
- **Advanced Coding Pattern:** Deep module: `MemoryService` computes lookback windows without exposing raw dates.
- **Anti-Patterns:** Showing deleted or archived posts in memories; surprising users with unwanted recaps.
- **Imports/Exports:** Export `MemoryService` and `MemoryResponse` types.
- **Depends On:** PST-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MYSP-009.R [AGENT]**: Inspect post date querying.
  - Files: `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/postService.ts`
  - Action: Confirm date extraction from timestamps and propose lookback query.
  - Validation: Proposed SQL/query for memories.

### Subtasks

- [ ] **MYSP-009.1 [AGENT]**: Implement memory service and route.
  - Files: `artifacts/api-server/src/services/memoryService.ts` (new), `artifacts/api-server/src/routes/posts.ts`
  - Action: Query posts from same month/day in previous years.
  - Validation: `pnpm --filter @workspace/api-server test -- memoryService` passes.

- [ ] **MYSP-009.2 [AGENT]**: Add mobile memory card.
  - Files: `artifacts/mobile/app/(tabs)/profile.tsx`, `artifacts/mobile/components/MemoryCard.tsx` (new)
  - Action: Display memories and allow resharing.
  - Validation: Manual test of memory display.

---

## [ ] MYSP-010: Add profile visitors log

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MYSP
- **Behavior:** Given a user enables visitor logging, when another user visits their profile, then the visit is recorded and shown to the owner according to privacy settings.
- **Related Files:** `lib/db/src/schema/profiles.ts`, `artifacts/api-server/src/services/profileService.ts`, `artifacts/mobile/components/ProfileHeader.tsx`
- **Definition of Done:** Visitor log table; opt-in setting; recent visitors list; tests pass.
- **Out of Scope:** Real-time visitor notifications; anonymous visitor counts.
- **Rules to Follow:** Visitors are only logged when both users have opted in; blocked users excluded.
- **Advanced Coding Pattern:** Deep module: `ProfileVisitService` handles logging and privacy checks.
- **Anti-Patterns:** Logging visits without consent; exposing visit timestamps publicly.
- **Imports/Exports:** Export `ProfileVisitService` and visitor types.
- **Depends On:** PRF-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **MYSP-010.R [AGENT/HUMAN]**: Define visitor log privacy rules.
  - Files: `docs/architecture.md`, `lib/db/src/schema/profiles.ts`
  - Action: Decide opt-in default, retention window, and visibility.
  - Validation: Approved visitor log policy.

### Subtasks

- [ ] **MYSP-010.1 [AGENT]**: Add visitor log schema and service.
  - Files: `lib/db/src/schema/profileVisits.ts` (new), `artifacts/api-server/src/services/profileService.ts`
  - Action: Log visits with privacy checks and retention.
  - Validation: `pnpm --filter @workspace/api-server test -- profileService` passes.

- [ ] **MYSP-010.2 [AGENT]**: Add visitor log UI and setting.
  - Files: `artifacts/mobile/app/(tabs)/profile.tsx`, `artifacts/mobile/app/edit-profile.tsx`
  - Action: Toggle and list recent visitors.
  - Validation: Manual test of visitor log flow.

---

## [ ] ADM-002: Add automated moderation / content queue

- **Status:** Not Started
- **Priority:** Low
- **Domain:** ADM
- **Behavior:** Given a user submits a report, when automated signals match patterns, then the content is queued for admin review with priority scoring.
- **Related Files:** `artifacts/api-server/src/services/safetyService.ts`, `lib/db/src/schema/reports.ts`, `artifacts/admin/` (new)
- **Definition of Done:** Report priority scoring; content queue API; admin dashboard review UI; tests pass.
- **Out of Scope:** Automated content removal without human review; legal takedown workflows.
- **Rules to Follow:** Human review remains required for action; audit log all admin decisions.
- **Advanced Coding Pattern:** Deep module: `ModerationQueueService` combines signals into a review score.
- **Anti-Patterns:** Auto-banning based solely on keyword matching; not logging decisions.
- **Imports/Exports:** Export `ModerationQueueService` and priority types.
- **Depends On:** SAF-002, ADM-001
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **ADM-002.R [AGENT]**: Inspect report schema and admin dashboard plan.
  - Files: `lib/db/src/schema/reports.ts`, `artifacts/api-server/src/services/safetyService.ts`
  - Action: Document report fields and design priority scoring.
  - Validation: Proposed moderation queue schema and scoring rules.

### Subtasks

- [ ] **ADM-002.1 [AGENT]**: Add moderation queue service.
  - File: `artifacts/api-server/src/services/moderationQueueService.ts` (new)
  - Action: Score reports; queue content; expose queue endpoints.
  - Validation: `pnpm --filter @workspace/api-server test -- moderationQueueService` passes.

- [ ] **ADM-002.2 [AGENT]**: Add admin review dashboard UI.
  - Files: `artifacts/admin/src/moderation.tsx` (new)
  - Action: List queued reports, approve/reject actions, audit log view.
  - Validation: Manual test of review workflow.

---

## [ ] WEB-002: Add web post creation

- **Status:** Not Started
- **Priority:** Low
- **Domain:** WEB
- **Behavior:** Given a user visits the web app, when they create a post, then it is published and visible in the feed.
- **Related Files:** `artifacts/web/src/app/feed/page.tsx` (new), `artifacts/web/src/app/compose/page.tsx` (new), `lib/api-spec/openapi.yaml`
- **Definition of Done:** Web compose page with text/media posts; authentication via API client; tests pass.
- **Out of Scope:** Full mobile feature parity; offline post creation.
- **Rules to Follow:** Reuse generated API client; session cookies handled automatically.
- **Advanced Coding Pattern:** Deep module: `WebComposer` component abstracts media upload and post submission.
- **Anti-Patterns:** Duplicating post validation logic; bypassing generated API client.
- **Imports/Exports:** Export `WebComposer` from web app.
- **Depends On:** WEB-001, PST-002
- **Blocks:** None

### Initial File Analysis and Research

- [ ] **WEB-002.R [AGENT]**: Verify web app framework and API client setup.
  - Files: `artifacts/web/` (after WEB-001), `lib/api-client-react/`
  - Action: Confirm generated client is usable in Next.js and auth cookies work cross-domain.
  - Validation: Proposed web compose page structure.

### Subtasks

- [ ] **WEB-002.1 [AGENT]**: Add web compose page.
  - Files: `artifacts/web/src/app/compose/page.tsx` (new), related components
  - Action: Implement text post creation with topic tagging.
  - Validation: Manual test of web post creation.

- [ ] **WEB-002.2 [AGENT]**: Add media upload to web composer.
  - Files: `artifacts/web/src/components/WebMediaUploader.tsx` (new)
  - Action: Upload media via `/media/upload` and attach to post.
  - Validation: Manual test of web media post.

---

## [ ] PST-008: Add in-app media editor

- **Status:** Not Started
- **Priority:** High
- **Domain:** PST
- **Behavior:** Given a user selects or records media for a post, when they use the editor, then they can trim, add captions, apply filters, select a thumbnail, and sync sound before uploading.
- **Related Files:** `artifacts/mobile/app/compose-media.tsx`, `artifacts/mobile/components/MediaEditor.tsx` (new), `artifacts/api-server/src/services/mediaService.ts`
- **Definition of Done:** Mobile media editor component with trim, captions, filters, thumbnail picker, and sound selection; edited output is uploaded via `/media/upload`; tests pass.
- **Out of Scope:** Full multi-track timeline; professional color grading.
- **Rules to Follow:** Editor is client-side for responsiveness; final upload uses existing media flow; preserve original quality.
- **Advanced Coding Pattern:** Deep module: `MediaEditor` hides trimming, filter application, and thumbnail extraction behind a simple `exportMedia()` interface.
- **Anti-Patterns:** Uploading raw unedited media silently; duplicating upload logic outside `mediaService`.
- **Imports/Exports:** Import `expo-av`, `expo-image-manipulator`; export `MediaEditor` component.
- **Depends On:** PST-002, MDA-001
- **Blocks:** None

### Subtasks

- [ ] **PST-008.1 [AGENT]**: Add video trimming and playback UI.
  - File: `artifacts/mobile/components/MediaEditor.tsx` (new)
  - Action: Implement trim start/end sliders with preview.
  - Validation: Manual test of trimming a video.

- [ ] **PST-008.2 [AGENT]**: Add caption, filter, and thumbnail tools.
  - File: `artifacts/mobile/components/MediaEditor.tsx`
  - Action: Add text overlay, preset filters, and thumbnail frame selector.
  - Validation: `pnpm --filter @workspace/mobile test -- MediaEditor` passes.

- [ ] **PST-008.3 [AGENT]**: Integrate editor into media compose flow.
  - File: `artifacts/mobile/app/compose-media.tsx`
  - Action: Open editor after media selection and upload edited result.
  - Validation: Manual test of full compose flow.

---

## [ ] FED-008: Add "Not Interested" and negative feedback

- **Status:** Not Started
- **Priority:** High
- **Domain:** FED
- **Behavior:** Given a user sees a post or reel, when they select "Not Interested," then similar content is suppressed and the signal is persisted for future ranking.
- **Related Files:** `artifacts/api-server/src/services/feedService.ts`, `artifacts/api-server/src/routes/feed.ts`, `lib/db/src/schema/profiles.ts`, `artifacts/mobile/components/PostCard.tsx`, `artifacts/mobile/components/ReelCard.tsx`
- **Definition of Done:** Users can mark posts/reels as "Not Interested"; topics/authors are down-weighted; preference is persisted; tests pass.
- **Out of Scope:** Full ML re-ranking; permanent blocking of topics.
- **Rules to Follow:** Negative feedback is user-owned and reversible; do not leak that another user was blocked.
- **Advanced Coding Pattern:** Deep module: `FeedPreferenceService` stores negative signals alongside positive ones and exposes a single `shouldSuppress(post, user)` check.
- **Anti-Patterns:** Ignoring the signal after one session; exposing suppression reasons publicly.
- **Imports/Exports:** Export `NegativeFeedbackService`; update feed preference schema.
- **Depends On:** FED-003
- **Blocks:** None

### Subtasks

- [ ] **FED-008.1 [AGENT]**: Add negative feedback schema and service.
  - Files: `lib/db/src/schema/profiles.ts`, `artifacts/api-server/src/services/feedService.ts`
  - Action: Store disliked topics, authors, and post IDs; apply suppression in ranking.
  - Validation: `pnpm --filter @workspace/api-server test -- feedService` passes.

- [ ] **FED-008.2 [AGENT]**: Add "Not Interested" affordance to mobile cards.
  - Files: `artifacts/mobile/components/PostCard.tsx`, `artifacts/mobile/components/ReelCard.tsx`
  - Action: Add overflow menu item and optimistic UI update.
  - Validation: Manual test of marking content as not interested.

---

## [ ] NTF-005: Implement real-time event transport

- **Status:** Not Started
- **Priority:** High
- **Domain:** NTF
- **Behavior:** Given the backend emits events, when a client connects, then notifications, messages, and live chat messages are delivered in real time.
- **Related Files:** `artifacts/api-server/src/websocket/`, `artifacts/api-server/src/services/notificationService.ts`, `artifacts/mobile/context/NotificationsContext.tsx`, `artifacts/mobile/context/MessagesContext.tsx` (new)
- **Definition of Done:** WebSocket or SSE transport implemented; authenticated connections; events for notifications, messages, and live chat; reconnection handling; tests pass.
- **Out of Scope:** Video/audio streaming transport; presence/typing indicators (separate task).
- **Rules to Follow:** Authenticate transport connection; do not broadcast sensitive content; respect notification preferences.
- **Advanced Coding Pattern:** Deep module: `RealtimeTransport` hides SSE/WebSocket choice, auth, and reconnection logic.
- **Anti-Patterns:** Broadcasting events to unauthenticated clients; leaking notification payloads.
- **Imports/Exports:** Export `RealtimeTransport`, `RealtimeProvider`; update `.env.example`.
- **Depends On:** MSG-002, NTF-001
- **Blocks:** MSG-005, LIV-004

### Subtasks

- [ ] **NTF-005.1 [AGENT]**: Choose transport and implement backend emitter.
  - File: `artifacts/api-server/src/websocket/transport.ts` (new)
  - Action: Implement SSE or WebSocket endpoint with auth and per-user channels.
  - Validation: `pnpm --filter @workspace/api-server test -- transport` passes.

- [ ] **NTF-005.2 [AGENT]**: Wire notification and message events.
  - Files: `artifacts/api-server/src/services/notificationService.ts`, `artifacts/api-server/src/services/messageService.ts`
  - Action: Emit events through transport when notifications/messages are created.
  - Validation: Manual test of real-time delivery.

- [ ] **NTF-005.3 [AGENT]**: Add mobile real-time provider.
  - Files: `artifacts/mobile/context/NotificationsContext.tsx`, `artifacts/mobile/context/MessagesContext.tsx` (new)
  - Action: Connect to transport and update local state on events.
  - Validation: Manual test of receiving a notification/message in real time.

---

## [ ] PRIV-008: Add data export and portability

- **Status:** Not Started
- **Priority:** High
- **Domain:** PRIV
- **Behavior:** Given a user requests their data, when export is complete, then they receive a structured archive containing posts, media, messages, friends, settings, and engagement history.
- **Related Files:** `artifacts/api-server/src/routes/account.ts` (new), `artifacts/api-server/src/services/exportService.ts` (new), `lib/db/src/schema/users.ts`
- **Definition of Done:** `/account/export` endpoint; async export job; ZIP with JSON/structured data; download link; tests pass.
- **Out of Scope:** Cross-platform federation; importing data from other networks.
- **Rules to Follow:** Export includes only data the user owns or has rights to; archive expires after a configurable window.
- **Advanced Coding Pattern:** Deep module: `DataExportService` orchestrates per-domain repositories into a single archive.
- **Anti-Patterns:** Blocking the request until export is complete; exposing other users' private data.
- **Imports/Exports:** Export `DataExportService`, `ExportRequest` schema.
- **Depends On:** PRIV-003
- **Blocks:** None

### Subtasks

- [ ] **PRIV-008.1 [AGENT]**: Define export schema and job.
  - File: `artifacts/api-server/src/services/exportService.ts` (new)
  - Action: Collect posts, comments, messages, friends, settings; generate ZIP.
  - Validation: `pnpm --filter @workspace/api-server test -- exportService` passes.

- [ ] **PRIV-008.2 [AGENT]**: Add export endpoint and mobile UI.
  - Files: `artifacts/api-server/src/routes/account.ts`, `artifacts/mobile/app/settings.tsx`
  - Action: Trigger export and notify user when ready.
  - Validation: Manual test of requesting and downloading export.

---

## [ ] STO-002: Add story highlights

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** STO
- **Behavior:** Given a user has expired stories, when they select stories to highlight, then those stories appear as pinned rings on their profile.
- **Related Files:** `lib/db/src/schema/stories.ts`, `artifacts/api-server/src/services/storyService.ts`, `artifacts/api-server/src/routes/stories.ts`, `artifacts/mobile/components/StoryHighlights.tsx` (new), `artifacts/mobile/app/(tabs)/profile.tsx`
- **Definition of Done:** Highlights table or `isHighlight` flag; CRUD API; mobile highlight grid on profile; tests pass.
- **Out of Scope:** Highlight covers beyond first frame; highlight categories.
- **Rules to Follow:** Only story author can create highlights; highlight preserves original audience visibility.
- **Advanced Coding Pattern:** Deep module: `HighlightService` extends story lifecycle with archival selection.
- **Anti-Patterns:** Letting non-owners create highlights; duplicating media files.
- **Imports/Exports:** Export `HighlightService`, `HighlightResponse` types.
- **Depends On:** STO-001
- **Blocks:** None

### Subtasks

- [ ] **STO-002.1 [AGENT]**: Add highlights schema and service.
  - Files: `lib/db/src/schema/stories.ts` (or new `lib/db/src/schema/highlights.ts`), `artifacts/api-server/src/services/storyService.ts`
  - Action: Store highlight metadata and linked story IDs.
  - Validation: `pnpm --filter @workspace/api-server test -- storyService` passes.

- [ ] **STO-002.2 [AGENT]**: Add highlights UI to profile.
  - Files: `artifacts/mobile/components/StoryHighlights.tsx` (new), `artifacts/mobile/app/(tabs)/profile.tsx`
  - Action: Render horizontal highlight rings; allow creation from expired stories.
  - Validation: Manual test of highlight creation and viewing.

---

## [ ] MSG-006: Add disappearing messages

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MSG
- **Behavior:** Given a user enables disappearing mode in a conversation, when messages are sent, then they are automatically deleted after a configurable time once viewed.
- **Related Files:** `lib/db/src/schema/messages.ts`, `lib/db/src/schema/conversations.ts`, `artifacts/api-server/src/services/messageService.ts`, `artifacts/api-server/src/jobs/cleanupExpiredMessages.ts` (new)
- **Definition of Done:** Disappearing TTL on messages/conversations; viewed-at tracking; cleanup job; mobile toggle; tests pass.
- **Out of Scope:** Screenshot detection; self-destructing media beyond text/image.
- **Rules to Follow:** Sender chooses TTL per message or per conversation; deletion is best-effort with audit logging.
- **Advanced Coding Pattern:** Deep module: `DisappearingMessageService` handles TTL, read receipts, and cleanup.
- **Anti-Patterns:** Deleting messages before they are viewed; not handling unviewed expired messages.
- **Imports/Exports:** Export `DisappearingMessageService`, TTL constants.
- **Depends On:** MSG-002
- **Blocks:** None

### Subtasks

- [ ] **MSG-006.1 [AGENT]**: Add disappearing message schema.
  - Files: `lib/db/src/schema/messages.ts`, `lib/db/src/schema/conversations.ts`
  - Action: Add `disappearingTtlSeconds`, `viewedAt`, and `expiresAt` columns.
  - Validation: `pnpm --filter @workspace/db exec drizzle-kit generate --name add_disappearing_messages` succeeds.

- [ ] **MSG-006.2 [AGENT]**: Implement cleanup job and mobile toggle.
  - Files: `artifacts/api-server/src/services/messageService.ts`, `artifacts/api-server/src/jobs/cleanupExpiredMessages.ts` (new), mobile conversation screen
  - Action: Delete expired messages; add per-conversation disappearing toggle.
  - Validation: `pnpm --filter @workspace/api-server test -- messageService` passes.

---

## [ ] SOC-004: Add people discovery and friend suggestions

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** SOC
- **Behavior:** Given a user opens the discovery screen, when suggestions load, then they see potential friends ranked by mutual connections, shared interests, and proximity if location sharing is enabled.
- **Related Files:** `artifacts/api-server/src/services/peopleDiscoveryService.ts`, `artifacts/api-server/src/services/friendshipService.ts`, `artifacts/mobile/app/(tabs)/discover.tsx`, `artifacts/mobile/hooks/usePeopleDiscovery.ts`
- **Definition of Done:** Suggestion endpoint; ranking by mutual friends and topics; respect block/mute/privacy; mobile UI; tests pass.
- **Out of Scope:** Phone/email contact import (separate task); paid promotion of accounts.
- **Rules to Follow:** Do not suggest blocked/muted users; do not leak private profile data.
- **Advanced Coding Pattern:** Deep module: `PeopleDiscoveryService` hides ranking signals behind a `getSuggestions(userId)` interface.
- **Anti-Patterns:** Suggesting strangers with no mutual signals; ignoring privacy settings.
- **Imports/Exports:** Export `PeopleDiscoveryService`, suggestion types.
- **Depends On:** SOC-003, SAF-002
- **Blocks:** None

### Subtasks

- [ ] **SOC-004.1 [AGENT]**: Implement suggestion ranking service.
  - File: `artifacts/api-server/src/services/peopleDiscoveryService.ts`
  - Action: Rank users by mutual friends, shared topics, and optional location; filter by safety/privacy.
  - Validation: `pnpm --filter @workspace/api-server test -- peopleDiscoveryService` passes.

- [ ] **SOC-004.2 [AGENT]**: Add suggestions UI to discover screen.
  - Files: `artifacts/mobile/app/(tabs)/discover.tsx`, `artifacts/mobile/hooks/usePeopleDiscovery.ts`
  - Action: Render suggestion cards with add-friend action.
  - Validation: Manual test of sending requests from suggestions.

---

## [ ] PST-009: Add long-form articles and author subscriptions

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** PST
- **Behavior:** Given a creator writes a long-form article, when published, then it appears as a rich post with a subscribe-to-author option and is surfaced in followers' feeds.
- **Related Files:** `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/postService.ts`, `artifacts/mobile/components/ArticleCard.tsx` (new), `artifacts/mobile/app/compose.tsx`
- **Definition of Done:** New `article` post kind; rich text content; subscribe CTA; article detail view; tests pass.
- **Out of Scope:** Newsletter email delivery; paywalled articles (handled by MON).
- **Rules to Follow:** Articles support markdown/rich text; render summary in feeds; respect audience settings.
- **Advanced Coding Pattern:** Deep module: `ArticleService` handles rich text validation, summary generation, and subscription gating.
- **Anti-Patterns:** Storing raw HTML without sanitization; treating articles identically to short posts in feeds.
- **Imports/Exports:** Export `ArticleCard`, `ArticleService`; update `PostCreateRequest` schema.
- **Depends On:** PST-002
- **Blocks:** None

### Subtasks

- [ ] **PST-009.1 [AGENT]**: Add article post kind and service.
  - Files: `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/postService.ts`
  - Action: Support `article` kind with title, rich content, and summary.
  - Validation: `pnpm --filter @workspace/api-server test -- postService` passes.

- [ ] **PST-009.2 [AGENT]**: Add article composer and reader UI.
  - Files: `artifacts/mobile/components/ArticleCard.tsx` (new), `artifacts/mobile/app/compose.tsx`
  - Action: Add article composer with rich text and article detail screen.
  - Validation: Manual test of publishing and viewing an article.

---

## [ ] PST-010: Add post translation

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** PST
- **Behavior:** Given a post is in a different language, when a user requests translation, then the text is translated inline and the result is cached.
- **Related Files:** `artifacts/api-server/src/services/postService.ts`, `artifacts/api-server/src/services/translationService.ts` (new), `artifacts/mobile/components/PostCard.tsx`, `lib/api-spec/openapi.yaml`
- **Definition of Done:** Translation endpoint using a provider or lightweight local model; per-user target language; mobile inline translation; tests pass.
- **Out of Scope:** Translating media/audio; automatic translation without user action.
- **Rules to Follow:** Detect source language; cache results; respect user target language preference.
- **Advanced Coding Pattern:** Deep module: `TranslationService` hides provider choice and caching.
- **Anti-Patterns:** Translating every post automatically; leaking content to unapproved translators.
- **Imports/Exports:** Export `TranslationService`; update `.env.example`.
- **Depends On:** PST-002, ACC-002
- **Blocks:** None

### Subtasks

- [ ] **PST-010.1 [AGENT]**: Implement translation service and endpoint.
  - Files: `artifacts/api-server/src/services/translationService.ts` (new), `artifacts/api-server/src/routes/posts.ts`
  - Action: Translate post text with caching.
  - Validation: `pnpm --filter @workspace/api-server test -- translationService` passes.

- [ ] **PST-010.2 [AGENT]**: Add translate affordance to mobile post cards.
  - File: `artifacts/mobile/components/PostCard.tsx`
  - Action: Show "Translate" link and inline translated text.
  - Validation: Manual test of translating a post.

---

## [ ] ACC-002: Add localization and internationalization

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** ACC
- **Behavior:** Given a user changes language, when they navigate the app, then all UI strings are rendered in the selected language.
- **Related Files:** `artifacts/mobile/lib/i18n.ts` (new), `artifacts/mobile/app/settings.tsx`, `artifacts/mobile/locales/` (new)
- **Definition of Done:** i18n framework integrated; English strings extracted; at least one additional language; language selector in settings; tests pass.
- **Out of Scope:** RTL layout overhaul in V1; machine-translated content.
- **Rules to Follow:** Use ICU message format; keep keys semantic; allow community contributions.
- **Advanced Coding Pattern:** Deep module: `I18nProvider` wraps `expo-localization` and translation catalogs.
- **Anti-Patterns:** Hardcoding strings after i18n is added; concatenating translated strings.
- **Imports/Exports:** Export `I18nProvider`, `t()` helper, locale types.
- **Depends On:** ACC-001
- **Blocks:** PST-010

### Subtasks

- [ ] **ACC-002.1 [AGENT]**: Set up i18n framework and English catalog.
  - Files: `artifacts/mobile/lib/i18n.ts` (new), `artifacts/mobile/locales/en.json` (new)
  - Action: Extract all UI strings into catalog; wire provider.
  - Validation: `pnpm --filter @workspace/mobile test -- i18n` passes.

- [ ] **ACC-002.2 [AGENT]**: Add language selector.
  - File: `artifacts/mobile/app/settings.tsx`
  - Action: Add language picker and persist preference.
  - Validation: Manual test of switching languages.

---

## [ ] MON-008: Add brand partnerships and paid partnership labels

- **Status:** Not Started
- **Priority:** Medium
- **Domain:** MON
- **Behavior:** Given a creator partners with a brand, when they publish a sponsored post, then a "Paid partnership" label is displayed and compliance metadata is stored.
- **Related Files:** `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/postService.ts`, `artifacts/api-server/src/services/partnershipService.ts` (new), `artifacts/mobile/components/PaidPartnershipLabel.tsx` (new), `artifacts/mobile/app/compose.tsx`
- **Definition of Done:** Partnership metadata on posts; paid partnership label in feed and detail; API for creators to mark partners; tests pass.
- **Out of Scope:** Brand marketplace matching; automated ad approval.
- **Rules to Follow:** Label is mandatory for paid content; metadata is visible to moderators and users.
- **Advanced Coding Pattern:** Deep module: `PartnershipService` handles partner validation and labeling.
- **Anti-Patterns:** Allowing undisclosed paid content; hardcoding brand names.
- **Imports/Exports:** Export `PartnershipService`, `PaidPartnershipLabel`.
- **Depends On:** PST-002
- **Blocks:** None

### Subtasks

- [ ] **MON-008.1 [AGENT]**: Add partnership metadata and service.
  - Files: `lib/db/src/schema/posts.ts`, `artifacts/api-server/src/services/partnershipService.ts` (new)
  - Action: Store partner brand and paid flag; validate partner relationships.
  - Validation: `pnpm --filter @workspace/api-server test -- partnershipService` passes.

- [ ] **MON-008.2 [AGENT]**: Add label to composer and post cards.
  - Files: `artifacts/mobile/components/PaidPartnershipLabel.tsx` (new), `artifacts/mobile/app/compose.tsx`, `artifacts/mobile/components/PostCard.tsx`
  - Action: Add partner selector in composer and render label in feeds.
  - Validation: Manual test of marking and viewing a paid partnership post.

---

## [ ] PRIV-009: Add supervised / family accounts

- **Status:** Not Started
- **Priority:** Low
- **Domain:** PRIV
- **Behavior:** Given a parent links a teen account, when safety settings are configured, then screen time, content sensitivity, and messaging limits are enforced for the supervised account.
- **Related Files:** `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/supervisionService.ts` (new), `artifacts/api-server/src/routes/account.ts`, `artifacts/mobile/app/settings.tsx`
- **Definition of Done:** Supervisor link table; configurable limits; enforcement in feed/messages/live; mobile supervisor dashboard; tests pass.
- **Out of Scope:** Government age verification; full parental remote monitoring.
- **Rules to Follow:** Both parent and teen must consent; limits are transparent to the teen; audit log changes.
- **Advanced Coding Pattern:** Deep module: `SupervisionService` encapsulates policy evaluation across content domains.
- **Anti-Patterns:** Covert monitoring; overriding privacy settings silently.
- **Imports/Exports:** Export `SupervisionService`, supervision policy types.
- **Depends On:** PRIV-004
- **Blocks:** None

### Subtasks

- [ ] **PRIV-009.1 [AGENT]**: Add supervision schema and policy engine.
  - Files: `lib/db/src/schema/users.ts`, `artifacts/api-server/src/services/supervisionService.ts` (new)
  - Action: Store supervisor link and policy rules; evaluate before serving content.
  - Validation: `pnpm --filter @workspace/api-server test -- supervisionService` passes.

- [ ] **PRIV-009.2 [AGENT]**: Add supervisor and teen settings UI.
  - File: `artifacts/mobile/app/settings.tsx`
  - Action: Add link-account flow, limit configuration, and status display.
  - Validation: Manual test of supervision setup.

---

## [ ] MDA-002: Add media transcoding and adaptive delivery

- **Status:** Not Started
- **Priority:** Low
- **Domain:** MDA
- **Behavior:** Given a video is uploaded, when processing completes, then multiple resolutions and HLS manifests are generated for adaptive playback.
- **Related Files:** `artifacts/api-server/src/services/mediaService.ts`, `artifacts/api-server/src/jobs/transcodeMedia.ts` (new), `lib/db/src/schema/media.ts` (new)
- **Definition of Done:** Background transcode job; multiple resolutions; thumbnail extraction; HLS manifest; playback uses adaptive URL; tests pass.
- **Out of Scope:** Live stream transcoding; DRM.
- **Rules to Follow:** Process asynchronously; store original; expose progress status.
- **Advanced Coding Pattern:** Deep module: `TranscodeService` hides encoder choice, queue, and manifest generation.
- **Anti-Patterns:** Synchronous transcoding on upload; losing original file.
- **Imports/Exports:** Export `TranscodeService`, media status types.
- **Depends On:** MDA-001
- **Blocks:** None

### Subtasks

- [ ] **MDA-002.1 [AGENT]**: Add media table and transcode job.
  - Files: `lib/db/src/schema/media.ts` (new), `artifacts/api-server/src/jobs/transcodeMedia.ts` (new)
  - Action: Track upload and transcode status; generate variants and HLS manifest.
  - Validation: `pnpm --filter @workspace/api-server test -- transcodeMedia` passes.

- [ ] **MDA-002.2 [AGENT]**: Use adaptive playback URLs in mobile.
  - Files: `artifacts/mobile/components/ReelCard.tsx`, `artifacts/mobile/components/PostCard.tsx`
  - Action: Prefer HLS manifest URL when available.
  - Validation: Manual test of adaptive playback.

---

## [ ] LIV-004: Add mobile live streaming composer and viewer

- **Status:** Not Started
- **Priority:** Low
- **Domain:** LIV
- **Behavior:** Given a user starts a live stream from mobile, when viewers join, then they see the stream and can chat and send gifts.
- **Related Files:** `artifacts/api-server/src/services/liveService.ts`, `artifacts/mobile/app/live/` (new), `artifacts/mobile/components/LiveChat.tsx` (new)
- **Definition of Done:** Mobile live composer (title/permissions/go live); viewer screen with chat; gift sending UI; tests pass.
- **Out of Scope:** In-app broadcaster SDK (can open RTMP via external encoder initially); monetization beyond gifts.
- **Rules to Follow:** Reuse existing live API endpoints and real-time transport; respect safety filters.
- **Advanced Coding Pattern:** Deep module: `LiveViewer` and `LiveComposer` hide stream playback and chat state.
- **Anti-Patterns:** Bypassing live service API; leaking stream keys in UI.
- **Imports/Exports:** Export `LiveComposer`, `LiveViewer`, `LiveChat`.
- **Depends On:** LIV-003, NTF-005
- **Blocks:** None

### Subtasks

- [ ] **LIV-004.1 [AGENT]**: Add live composer screen.
  - File: `artifacts/mobile/app/live/start.tsx` (new)
  - Action: Title input, audience selection, start stream via `/live`, display stream key/RTMP URL.
  - Validation: Manual test of starting a stream.

- [ ] **LIV-004.2 [AGENT]**: Add live viewer with chat and gifts.
  - Files: `artifacts/mobile/app/live/[streamId].tsx` (new), `artifacts/mobile/components/LiveChat.tsx` (new)
  - Action: Playback via HLS URL; chat using real-time transport; gift sheet.
  - Validation: Manual test of viewing and gifting.

---

## Research-driven feature additions (2026-07)

The following capabilities were identified through up-to-date consumer research and a complete audit of the repository. They are not yet represented in the task list above (or are only referenced as missing prerequisites). Expand each row into a full task entry when it is scheduled.

| Task ID | Capability | Priority | Domain | Depends On | Notes |
|---|---|---|---|---|---|
| STO-001 | Implement stories and ephemeral composer/viewer | High | STO | MDA-001, PST-002 | Prerequisite for STO-002; backend API exists, mobile UI is missing. |
| AUD-001 | Implement audience lists (close friends, custom) | High | AUD | PRIV-003, SOC-003 | Prerequisite for PRIV-005; backend `audience.ts` exists. |
| GAM-001 | Implement gamification engine (polls, quizzes, streaks, badges) | Medium | GAM | PST-002, AUTH-003 | Prerequisite for PST-004; backend `gamification.ts` exists. |
| MUS-002 | Add music search and attachment in composer | Medium | MUS | AUTH-003 | Prerequisite for MUS-003; `musicService` is a stub. |
| LOC-001 | Add location tagging and check-ins | Medium | LOC | PST-002 | Prerequisite for LOC-002; backend `location.ts` exists. |
| COL-001 | Add collaboration, remix, and duet workflows | Medium | COL | PST-002 | Prerequisite for COL-002; backend `collab.ts` exists. |
| FED-009 | Add custom feed lists and user-curated feeds | High | FED | FED-003 | Bluesky-like user-curated feeds. |
| FED-010 | Add topic following and interest lists | Medium | FED | FED-002, PST-002 | Follow topics/hashtags as first-class interests. |
| FED-011 | Add social graph discovery and mutual-friend feeds | Medium | FED | SOC-003 | Friend-of-friend and shared-interest discovery. |
| SAF-004 | Add community notes / crowdsourced context | Medium | SAF | PST-002, SAF-002 | Trust & safety / misinformation transparency. |
| SOC-005 | Add contact import and friend finder | Medium | SOC | SOC-003, PRIV-003 | Explicitly out-of-scope for SOC-004. |
| COM-001 | Add interest-based communities / groups | High | COM | SOC-003, PRIV-003 | Discord/Reddit-like community spaces. |
| COM-002 | Add community feeds and member posting | High | COM | COM-001, PST-002 | Posts scoped to a community. |
| COM-003 | Add community events and calendar | Medium | COM | COM-001, EVT-001 | Events inside communities. |
| EVT-001 | Add platform-wide events (create, discover, RSVP) | Medium | EVT | PRIV-003 | Event lifecycle, reminders, and discovery. |
| AUR-001 | Add live audio rooms / voice chat | Low | AUR | NTF-005, MSG-005 | Voice-first social rooms (like Twitter Spaces/Discord). |
| AUR-002 | Add audio room roles and moderation | Low | AUR | AUR-001 | Speaker, listener, co-host, requests. |
| VCL-001 | Add one-to-one and group video calls | Low | VCL | MSG-005, NTF-005 | Calls inside the messaging experience. |
| VCL-002 | Add call controls, screen sharing, and recording | Low | VCL | VCL-001 | Advanced video-call features. |
| ARF-001 | Add AR filters and effects for stories/posts | Low | ARF | STO-001, PST-002 | Face filters, visual effects, stickers. |
| ARF-002 | Add face tracking and sticker anchoring | Low | ARF | ARF-001 | Advanced AR experiences. |
| CMT-003 | Add threaded comments, likes, and @mentions | Medium | CMT | CMT-002, PST-002 | Rich comment features. |
| ENG-003 | Add emoji reactions and post view counts | Medium | ENG | ENG-002, PST-002 | Reactions beyond like; creator insight. |
| PRIV-010 | Add read receipt and activity status controls | Medium | PRIV | PRIV-003, MSG-002 | Privacy controls for presence. |
| PRIV-011 | Add screenshot detection and ephemeral privacy | Low | PRIV | PRIV-002, STO-001, MSG-006 | Screenshot alerts for stories and messages. |
| ACC-003 | Add alt-text, captions, and subtitle support | Medium | ACC | ACC-001, MDA-002 | Media accessibility. |
| ACC-004 | Add keyboard navigation and focus management | Medium | ACC | ACC-001 | Keyboard/focus accessibility. |

---

## Appendix: Dependency graph summary

Use this summary to find the critical path and unblockers. Each task above lists its own `Depends On` and `Blocks`; the sections below are a quick reference.

### Critical path to remaining backend features

1. TOOL-003 (fix orval codegen)
2. TOOL-009 (run pending Drizzle migrations)
3. TOOL-010 (fix lib/db profiles.test.ts failures)
4. TOOL-011 (audit and backfill missing prerequisite tasks)
5. DEP-002 (configure production secrets)
6. MON-001 -> MON-002 (monetization)
7. LIV-003 (live stream gift monetization)

### Critical path to remaining mobile features

1. MYSP-001 (profile song)
2. MYSP-002 (top friends history)
3. MYSP-003 (mood enhancement)
4. MYSP-004 (profile themes)
5. MYSP-005 (bulletins)
6. MYSP-006 (quizzes)
7. MYSP-007 (interests)
8. MYSP-008 (friend categories)
9. PRIV-001 (block/mute/restrict)
10. PRIV-002 (content warnings)
11. PRIV-003 (account settings)
12. ACC-001 (accessibility)

### New high-impact feature paths (from 2026 consumer research)

- Feed personalization and transparency: FED-003 -> FED-004 -> FED-005 -> FED-008
- Creator tools: MON-002 -> MON-003, MON-004, MON-005, MON-008
- Trust and safety: USR-004 (AI labeling), PRIV-004 (wellbeing), SAF-003 (restrict), PRIV-008 (data export)
- Notifications: PRIV-007 -> NTF-003, NTF-004, NTF-005 (real-time transport)
- Content enhancements: PST-004 (in-post polls), PST-007 (hashtags/mentions), PST-008 (media editor), PST-009 (articles), PST-010 (translation)
- Discovery and social growth: SOC-004 (people discovery)
- Localization: ACC-002 -> PST-010
- Authentication hardening: AUTH-004 -> USR-003, AUTH-005 -> AUTH-007

### Optional / deferred

- ADM-001 (admin dashboard) - low priority but high operational value.
- ADM-002 (automated moderation queue) - low priority; enable after admin dashboard.
- WEB-001 (web companion) - low priority but useful for non-mobile users.
- WEB-002 (web post creation) - low priority; depends on web companion.
- STO-002 (story highlights) - medium priority; depends on stories.
- MSG-006 (disappearing messages) - medium priority; privacy nicety.
- PRIV-009 (supervised accounts) - low priority; family safety / regulatory.
- MDA-002 (media transcoding) - low priority; performance optimization.
- LIV-004 (mobile live UI) - low priority; depends on NTF-005 and LIV-003.
- MON-006 (live shopping) - low priority; depends on monetization maturity.
- MYSP-009 (memories) - low priority; nostalgic feature.
- MYSP-010 (profile visitors) - low priority; privacy-sensitive.
