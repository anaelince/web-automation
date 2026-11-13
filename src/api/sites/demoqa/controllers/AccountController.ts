import { ApiClient } from '@api/sites/demoqa/client/ApiClient';
import { AccountEndpoints } from '@api/sites/demoqa/endpoints/account.endpoints';
import { GenerateTokenPayload, TokenResponse, UserResponse } from '@api/sites/demoqa/models/account.model';

export class AccountController {
  constructor(private readonly client: ApiClient) {}

  /**
   * Exchanges username/password for a Bearer token.
   * Returns the token string ready to pass to `ApiClient.setAuthToken()`.
   */
  async generateToken(userName: string, password: string): Promise<string> {
    const payload: GenerateTokenPayload = { userName, password };
    const response = await this.client.post<TokenResponse>(
      AccountEndpoints.generateToken,
      payload,
    );
    return response.token;
  }

  /**
   * Returns the books currently in the user's collection.
   * Uses GET /Account/v1/User/{userId} — requires auth.
   */
  async getUserBooks(userId: string): Promise<Array<{ isbn: string }>> {
    const user = await this.client.get<UserResponse>(AccountEndpoints.user(userId));
    return user.books;
  }
}
