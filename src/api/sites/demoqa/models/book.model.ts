/** TypeScript interfaces for BookStore request/response payloads — no classes, no logic. */

export interface Book {
  isbn: string;
  title: string;
  subTitle: string;
  author: string;
  publish_date: string;
  publisher: string;
  pages: number;
  description: string;
  website: string;
}

/** Response shape for GET /BookStore/v1/Books */
export interface BooksResponse {
  books: Book[];
}

/** Request body for POST /BookStore/v1/Books (add books to user collection) */
export interface AddBooksPayload {
  userId: string;
  collectionOfIsbns: { isbn: string }[];
}

/** Request body for DELETE /BookStore/v1/Book (remove a specific book) */
export interface DeleteBookPayload {
  isbn: string;
  userId: string;
}
