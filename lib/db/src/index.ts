import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

// Allow test environment to set DATABASE_URL via test setup
// In production/development, DATABASE_URL must be set at module load time
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// In test mode, if DATABASE_URL is not set, use a placeholder
// Tests that require a database should set DATABASE_URL before running
const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/test';
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from './schema';
export * from './repositories';
export * from './domain';
export * from './repositories/engagementRepository';
