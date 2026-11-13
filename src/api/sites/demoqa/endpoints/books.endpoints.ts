/** URL constants for the BookStore API — no HTTP logic, no imports from client/. */
export const BooksEndpoints = {
  /** Collection endpoint — used for GET all books and POST add books. */
  books: '/BookStore/v1/Books',
  /** Single-book endpoint — used for DELETE a specific book (body carries isbn + userId). */
  book: '/BookStore/v1/Book',
} as const;
