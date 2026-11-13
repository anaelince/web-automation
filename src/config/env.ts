import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ---------------------------------------------------------------------------
// Required variables — the suite will fail fast if any of these are missing
// ---------------------------------------------------------------------------
const REQUIRED_VARS = ['BASE_URL'] as const;

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: "${key}". ` +
        `Copy .env.example to .env and fill in the values.`
    );
  }
}

// ---------------------------------------------------------------------------
// Exported config — import this everywhere instead of reading process.env directly
// ---------------------------------------------------------------------------
export const ENV = {
  /** Base URL of the application under test */
  baseUrl: process.env.BASE_URL as string,

  /** Test user credentials (optional — only required for authenticated tests) */
  testUser: {
    name: process.env.TEST_USER_NAME ?? '',
    password: process.env.TEST_USER_PASSWORD ?? '',
    /** demoqa userId (UUID) — required for Book Store API teardown (DELETE /BookStore/v1/Books) */
    id: process.env.TEST_USER_ID ?? '',
  },
} as const;
