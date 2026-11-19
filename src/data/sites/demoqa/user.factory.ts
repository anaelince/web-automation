/**
 * Factory for demoqa Book Store test identities (spec-data-standard R2, R3).
 *
 * Every generated user is unique across workers and runs, and carries the test-data
 * prefix so leftovers can be detected and swept.
 */

import { ENV } from '@config/env';

export interface BookStoreTestUser {
  username: string;
  password: string;
}

const randomSuffix = (length: number): string =>
  Math.random().toString(36).slice(2, 2 + length).padEnd(length, '0');

/** Unique suffix: parallel index + timestamp + random part (Date.now() alone is not unique). */
export const uniqueSuffix = (parallelIndex: number): string =>
  `${parallelIndex}_${Date.now()}_${randomSuffix(5)}`;

/**
 * Builds a demoqa user. The password always satisfies the demoqa policy:
 * at least 8 characters with upper case, lower case, a digit and a special character.
 */
export function buildBookStoreUser(parallelIndex: number): BookStoreTestUser {
  return {
    username: `${ENV.testDataPrefix}${uniqueSuffix(parallelIndex)}`,
    password: `Qa1!${randomSuffix(8)}Z`,
  };
}
