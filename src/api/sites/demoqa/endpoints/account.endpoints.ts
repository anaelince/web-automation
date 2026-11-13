/** URL constants for the Account API — no HTTP logic, no imports from client/. */
export const AccountEndpoints = {
  generateToken: '/Account/v1/GenerateToken',
  /** GET user info (including their book collection). Requires auth. */
  user: (userId: string) => `/Account/v1/User/${userId}`,
} as const;
