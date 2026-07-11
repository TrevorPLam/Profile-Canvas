import { beforeAll } from 'vitest';

// Set test environment before any tests run
beforeAll(() => {
  // Set NODE_ENV to test to allow lib/db to skip DATABASE_URL validation
  process.env.NODE_ENV = 'test';

  // Use TEST_DATABASE_URL if available, otherwise fall back to DATABASE_URL
  // If neither is set, tests that require a database should skip
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
  // If DATABASE_URL is not set, integration tests will skip (handled in individual test files)
});
