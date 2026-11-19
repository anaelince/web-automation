/** URL constants for the Account API — no HTTP logic, no imports from client/. */
export const AccountEndpoints = {
  generateToken: '/Account/v1/GenerateToken',
  /** POST create a new user (no auth). */
  users: '/Account/v1/User',
  /** GET user info (including their book collection) or DELETE the user. Requires auth. */
  user: (userId: string) => `/Account/v1/User/${userId}`,
} as const;
