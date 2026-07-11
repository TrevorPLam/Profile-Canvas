import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      // Library packages
      './lib/db/vitest.config.ts',
      './lib/api-spec/vitest.config.ts',
      './lib/api-zod/vitest.config.ts',
      './lib/api-client-react/vitest.config.ts',
      // Artifact packages
      './artifacts/api-server/vitest.config.ts',
      './artifacts/mobile/vitest.config.ts',
      // Scripts
      './scripts/vitest.config.ts',
    ],
  },
});
