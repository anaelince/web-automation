import { test as base, expect } from '@playwright/test';

/**
 * Shared fixture layer — site-agnostic only.
 *
 * This file holds fixtures that every site can use (none yet). Site-specific
 * fixtures live in `src/fixtures/sites/{site}/{site}.fixtures.ts`, which extend
 * this `test`. Spec files import `test` and `expect` from their site's fixture
 * file (`@fixtures/sites/{site}/{site}.fixtures`), never from here directly.
 */

// Add cross-site fixtures here (e.g. a shared logger or env-aware helpers).
type SharedFixtures = {};

export const test = base.extend<SharedFixtures>({});

export { expect };
