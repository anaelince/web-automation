import { APIRequestContext } from '@playwright/test';

/**
 * Only HTTP entry point for the API layer.
 * All `request.*` calls are centralised here — no other file may call them directly (R1).
 */
export class ApiClient {
  private authToken?: string;

  constructor(private readonly request: APIRequestContext) {}

  /** Sets the Bearer token included in all subsequent requests. */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private buildHeaders(): Record<string, string> {
    if (this.authToken) {
      return { Authorization: `Bearer ${this.authToken}` };
    }
    return {};
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.request.get(url, { headers: this.buildHeaders() });
    return response.json() as Promise<T>;
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await this.request.post(url, {
      data,
      headers: this.buildHeaders(),
    });
    return response.json() as Promise<T>;
  }

  /**
   * @param options.data  - optional request body (demoqa DELETE /BookStore/v1/Book uses a body)
   * @param options.params - optional query string params (demoqa DELETE /BookStore/v1/Books uses ?UserId=)
   */
  async delete(
    url: string,
    options?: { data?: unknown; params?: Record<string, string> },
  ): Promise<void> {
    const response = await this.request.delete(url, {
      data: options?.data,
      params: options?.params,
      headers: this.buildHeaders(),
    });
    if (!response.ok()) {
      const body = await response.text().catch(() => '');
      throw new Error(`DELETE ${url} failed — status ${response.status()}: ${body}`);
    }
  }
}
