/** TypeScript interfaces for Account API request/response payloads — no classes, no logic. */

/** Request body for POST /Account/v1/GenerateToken */
export interface GenerateTokenPayload {
  userName: string;
  password: string;
}

/** Response shape for POST /Account/v1/GenerateToken */
export interface TokenResponse {
  token: string;
  expires: string;
  status: string;
  result: string;
}

/** Response shape for GET /Account/v1/User/{userId} */
export interface UserResponse {
  userId: string;
  username: string;
  books: Array<{ isbn: string }>;
}
