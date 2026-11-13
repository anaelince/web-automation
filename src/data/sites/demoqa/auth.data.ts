import { ENV } from '@config/env';

/** demoqa Book Store user credentials — sourced from environment variables. */
export const bookStoreUsers = {
  /** Primary test user — credentials loaded from .env (TEST_USER_NAME / TEST_USER_PASSWORD). */
  appUser: {
    username: ENV.testUser.name,
    password: ENV.testUser.password,
  },
} as const;
