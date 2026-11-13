import { ENV } from '@config/env';

export const users = {
  /** Primary test user — credentials sourced from environment variables */
  appUser: {
    username: ENV.testUser.name,
    password: ENV.testUser.password,
  },

  /** Site-specific accounts for negative / edge-case tests */
  lockedOutUser: {
    username: 'locked_out_user',
    password: 'secret_sauce',
  },
  problemUser: {
    username: 'problem_user',
    password: 'secret_sauce',
  },
  invalidUser: {
    username: 'invalid_user',
    password: 'wrong_password',
  },
} as const;
