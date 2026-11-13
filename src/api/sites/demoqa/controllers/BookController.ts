import { ApiClient } from '@api/sites/demoqa/client/ApiClient';
import { BooksEndpoints } from '@api/sites/demoqa/endpoints/books.endpoints';
import { Book, BooksResponse, AddBooksPayload, DeleteBookPayload } from '@api/sites/demoqa/models/book.model';

export class BookController {
  constructor(private readonly client: ApiClient) {}

  /** Returns the full public book catalog (no auth required). */
  async getAll(): Promise<Book[]> {
    const response = await this.client.get<BooksResponse>(BooksEndpoints.books);
    return response.books;
  }

  /** Adds one or more books to the user's collection (auth required). */
  async addBooks(payload: AddBooksPayload): Promise<void> {
    await this.client.post<unknown>(BooksEndpoints.books, payload);
  }

  /**
   * Removes a specific book from the user's collection (auth required).
   * demoqa DELETE /BookStore/v1/Book carries the isbn + userId in the request body.
   */
  async deleteBook(isbn: string, userId: string): Promise<void> {
    const payload: DeleteBookPayload = { isbn, userId };
    await this.client.delete(BooksEndpoints.book, { data: payload });
  }

  /**
   * Removes ALL books from the user's collection (auth required).
   * demoqa DELETE /BookStore/v1/Books?UserId=... takes the userId as a query param.
   */
  async deleteAllBooks(userId: string): Promise<void> {
    await this.client.delete(BooksEndpoints.books, { params: { UserId: userId } });
  }
}
