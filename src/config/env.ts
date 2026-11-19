import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Environment selection (spec-data-standard M3 · E1)
//
//   TEST_ENV=<name>  →  loads .env.<name> from the project root
//   TEST_ENV unset   →  "local": loads .env.local, or .env when .env.local does not exist
//
// Every .env.* file is git-ignored; .env.example documents all variables.
// ---------------------------------------------------------------------------
const TEST_ENV = process.env.TEST_ENV ?? 'local';
const ROOT = path.resolve(__dirname, '../..');

const candidates =
  TEST_ENV === 'local' ? [`.env.${TEST_ENV}`, '.env'] : [`.env.${TEST_ENV}`];
const envFile = candidates.map((file) => path.join(ROOT, file)).find((file) => fs.existsSync(file));

if (!envFile) {
  throw new Error(
    `[env:${TEST_ENV}] No environment file found. Expected ${candidates.join(' or ')} ` +
      `in the project root. Copy .env.example and fill in the values.`,
  );
}

dotenv.config({ path: envFile, quiet: true });

// ---------------------------------------------------------------------------
// Fail-fast validation (spec-data-standard M3 · E2)
// ---------------------------------------------------------------------------
const REQUIRED_VARS = ['BASE_URL'] as const;

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `[env:${TEST_ENV}] Missing required variable(s) ${missing.map((k) => `"${k}"`).join(', ')} ` +
      `in ${path.basename(envFile)}.`,
  );
}

function readUrl(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value || !/^https?:\/\/\S+$/.test(value)) {
    throw new Error(`[env:${TEST_ENV}] ${key} must be an http(s) URL — got "${value ?? ''}".`);
  }
  return value;
}

const baseUrl = readUrl('BASE_URL');

// Per-site base URLs. BASE_URL is the primary site (demoqa); the other sites default to
// their public URLs and can be overridden per environment.
const siteUrls = {
  demoqa: baseUrl,
  saucedemo: readUrl('SAUCEDEMO_BASE_URL', 'https://www.saucedemo.com'),
  automationexercise: readUrl('AUTOMATIONEXERCISE_BASE_URL', 'https://automationexercise.com'),
} as const;

// ---------------------------------------------------------------------------
// Exported config — import this everywhere instead of reading process.env directly
// ---------------------------------------------------------------------------
export const ENV = {
  /** Active environment name (TEST_ENV), e.g. local · qa · staging */
  name: TEST_ENV,

  /** Base URL of the primary application under test (demoqa) — Playwright's default baseURL */
  baseUrl,

  /** Base URL per site — each site fixture file overrides Playwright's baseURL with its own */
  siteUrls,

  /**
   * Static test user credentials (optional). Only flows that log in with a seeded user
   * need them; self-provisioned identities (workerUser) do not.
   */
  testUser: {
    name: process.env.TEST_USER_NAME ?? '',
    password: process.env.TEST_USER_PASSWORD ?? '',
  },

  /**
   * SauceDemo login user. Defaults to SauceDemo's public demo account (published on its
   * login page); override per environment if needed. Kept apart from testUser (demoqa).
   */
  sauceDemoUser: {
    name: process.env.SAUCEDEMO_USER_NAME || 'standard_user',
    password: process.env.SAUCEDEMO_USER_PASSWORD || 'secret_sauce',
  },

  /** Prefix of every generated test record, so leftovers can be detected and swept. */
  testDataPrefix: process.env.TEST_DATA_PREFIX ?? 'qa_',

  /** Bulk cleanup of data not owned by the test is allowed only where this is true. */
  allowDestructiveCleanup: process.env.ALLOW_DESTRUCTIVE_CLEANUP === 'true',
} as const;
