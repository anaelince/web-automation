import { ENV } from '@config/env';

export const users = {
  /** Primary test user — SAUCEDEMO_USER_NAME / SAUCEDEMO_USER_PASSWORD (default: standard_user) */
  appUser: {
    username: ENV.sauceDemoUser.name,
    password: ENV.sauceDemoUser.password,
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
